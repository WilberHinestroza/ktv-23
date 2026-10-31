import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { crearProgramacion } from "./programacion";
import { cargarJSON, ruta } from "../contenido";
import { guardar, leer, LOGROS } from "./oyente";

const RadioContext = createContext(null);
export const useRadio = () => useContext(RadioContext);

const DESFASE_MAX = 2.5; // segundos de diferencia tolerados antes de corregir
const FUNDIDO_SUENO = 30000; // el temporizador baja el volumen poco a poco los últimos 30 s

// En iPhone/iPad el analizador de audio corta el sonido con la pantalla bloqueada: ahí no se usa
const esIOS = () =>
  /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

function leerVolumen() {
  try {
    const v = parseFloat(localStorage.getItem("radio-volumen"));
    return Number.isFinite(v) ? v : 0.8;
  } catch {
    return 0.8;
  }
}

export function RadioProvider({ children }) {
  const [radio, setRadio] = useState(null);
  const [error, setError] = useState(null);
  const [ahora, setAhora] = useState(Date.now());
  const [sintonizado, setSintonizado] = useState(false);
  const [estado, setEstado] = useState("apagado"); // apagado | cargando | sonando | sin-senal
  const [volumen, setVolumenState] = useState(leerVolumen);

  const audioRef = useRef(null);
  const progRef = useRef(null);
  const actualRef = useRef(null); // id de la canción cargada en el <audio>
  const sintonizadoRef = useRef(false);
  const esperaRef = useRef(null);
  const radioRef = useRef(null);
  const vozRef = useRef(null); // canal del locutor personal (solo lo oye este visitante)
  const volumenRef = useRef(leerVolumen());
  const saludadoRef = useRef(false);
  const [hablando, setHablando] = useState(null); // { texto, nombre } de lo que está diciendo el locutor
  const [versionNueva, setVersionNueva] = useState(false);
  const datosRef = useRef(null); // radio.json cargado, para saber si cambió
  const sincronizarRef = useRef(null);

  // Lo personal de cada oyente (solo en su navegador)
  const [favoritos, setFavoritos] = useState(() => leer("radio-favoritos", []));
  const [avisos, setAvisos] = useState(() => leer("radio-avisos", []));
  const [logros, setLogros] = useState(() => leer("radio-logros", {}));
  const escuchaRef = useRef(leer("radio-escucha", { segundos: 0, canciones: [] }));
  const [escucha, setEscucha] = useState(escuchaRef.current);
  const [notificacion, setNotificacion] = useState(null); // { icono, texto, accion? }
  const [apagarEn, setApagarEn] = useState(null); // temporizador para dormir (ms)
  const analizadorRef = useRef(null);
  const estadoRef = useRef("apagado");
  estadoRef.current = estado;

  // Volumen de la música. Con el analizador del visualizador conectado, Chrome ignora
  // audio.volume, así que el volumen pasa por un nodo de ganancia.
  const gananciaRef = useRef(null);
  const filtrosRef = useRef(null); // ecualizador: { graves, medios, agudos }
  const [ecualizador, setEcualizadorState] = useState(() => leer("radio-ecualizador", { graves: 0, medios: 0, agudos: 0 }));
  const ecualizadorRef = useRef(ecualizador);
  const [sinLocutor, setSinLocutorState] = useState(() => leer("radio-sin-locutor", false));
  const sinLocutorRef = useRef(sinLocutor);
  const volumenMusica = useCallback((v) => {
    if (gananciaRef.current) gananciaRef.current.gain.value = v;
    else if (audioRef.current) audioRef.current.volume = v;
  }, []);

  // Cargar la programación
  useEffect(() => {
    cargarJSON("radio.json")
      .then((datos) => {
        progRef.current = crearProgramacion(datos);
        radioRef.current = datos;
        datosRef.current = JSON.stringify(datos);
        setRadio(datos);
      })
      .catch((e) => setError(e.message));
  }, []);

  // Si se publica una versión nueva, todos deben pasarse a ella o dejarían de oír lo mismo:
  // los datos nuevos se cargan solos; si cambió el código, se avisa para recargar.
  useEffect(() => {
    const scriptActual = document.querySelector('script[src*="/static/js/main."]')?.getAttribute("src");
    const revisar = async () => {
      try {
        const datos = await cargarJSON("radio.json");
        const texto = JSON.stringify(datos);
        if (datosRef.current && texto !== datosRef.current) {
          progRef.current = crearProgramacion(datos);
          radioRef.current = datos;
          datosRef.current = texto;
          setRadio(datos);
          sincronizarRef.current?.();
        }
        if (scriptActual) {
          const r = await fetch(`${process.env.PUBLIC_URL}/asset-manifest.json`, { cache: "no-store" });
          const main = r.ok ? (await r.json()).files?.["main.js"] : null;
          if (main && main !== scriptActual) setVersionNueva(true);
        }
      } catch {
        // sin conexión: se intenta en la próxima revisión
      }
    };
    const id = setInterval(revisar, 3 * 60000);
    const alVolver = () => document.visibilityState === "visible" && revisar();
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, []);

  // El reloj de la radio: actualiza la pantalla aunque nadie esté escuchando
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  // Pone el <audio> en la canción y el segundo que tocan ahora mismo.
  const sincronizar = useCallback(() => {
    const audio = audioRef.current;
    const prog = progRef.current;
    if (!audio || !prog || !sintonizadoRef.current) return;

    const { cancion, inicioMs, finMs } = prog.enVivo();
    const esperado = () => (Date.now() - inicioMs) / 1000;

    if (actualRef.current !== cancion.id) {
      actualRef.current = cancion.id;
      setEstado("cargando");
      audio.src = ruta(cancion.archivo);
      audio.addEventListener(
        "loadedmetadata",
        () => {
          if (actualRef.current !== cancion.id) return; // ya cambió de canción
          audio.currentTime = Math.min(esperado(), audio.duration || Infinity);
        },
        { once: true }
      );
    } else if (audio.ended) {
      // El archivo terminó un poco antes de lo programado: esperar a la siguiente
      clearTimeout(esperaRef.current);
      esperaRef.current = setTimeout(sincronizar, Math.max(0, finMs - Date.now()) + 50);
      return;
    } else if (Math.abs(audio.currentTime - esperado()) > DESFASE_MAX) {
      audio.currentTime = esperado();
    }

    if (audio.paused) {
      audio.play().catch((e) => {
        // El navegador puede bloquear el sonido hasta que el usuario toque algo
        if (e.name === "NotAllowedError") {
          sintonizadoRef.current = false;
          setSintonizado(false);
          setEstado("apagado");
        }
      });
    }
  }, []); // sincronizar se referencia a sí misma vía setTimeout; es estable
  sincronizarRef.current = sincronizar;

  // Crear el elemento de audio una sola vez
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audio.volume = leerVolumen();
    audioRef.current = audio;

    const alSonar = () => setEstado("sonando");
    const alEsperar = () => setEstado("cargando");
    const alTerminar = () => sincronizar();
    const alFallar = () => {
      if (!sintonizadoRef.current) return;
      setEstado("sin-senal"); // la revisión periódica lo vuelve a intentar con la siguiente
    };

    audio.addEventListener("playing", alSonar);
    audio.addEventListener("waiting", alEsperar);
    audio.addEventListener("ended", alTerminar);
    audio.addEventListener("error", alFallar);

    const voz = new Audio();
    vozRef.current = voz;
    const alCallar = () => {
      volumenMusica(volumenRef.current); // la música vuelve a su volumen
      setHablando(null);
    };
    voz.addEventListener("ended", alCallar);
    voz.addEventListener("error", alCallar);

    return () => {
      audio.pause();
      voz.pause();
      voz.removeEventListener("ended", alCallar);
      voz.removeEventListener("error", alCallar);
      audio.removeEventListener("playing", alSonar);
      audio.removeEventListener("waiting", alEsperar);
      audio.removeEventListener("ended", alTerminar);
      audio.removeEventListener("error", alFallar);
    };
  }, [sincronizar, volumenMusica]);

  // Revisión periódica: corrige desfases (pestaña en segundo plano, red lenta, etc.)
  useEffect(() => {
    if (!sintonizado) return;
    const id = setInterval(sincronizar, 4000);
    return () => clearInterval(id);
  }, [sintonizado, sincronizar]);

  // El locutor le habla a este visitante: baja la música mientras suena el clip.
  const hablar = useCallback((clips) => {
    const loc = radioRef.current?.locutor;
    const voz = vozRef.current;
    const audio = audioRef.current;
    const hoy = new Date().getDay(); // algunos clips solo suenan ciertos días (0 = domingo)
    const disponibles = (clips || []).filter((c) => c.duracion > 0 && (!c.dias || c.dias.includes(hoy)));
    if (!loc?.activo || sinLocutorRef.current || !voz || !audio || !disponibles.length || !voz.paused) return;
    // No hablar encima de una cuña o presentación que ya está sonando para todos
    if (progRef.current?.enVivo().cancion.esLocutor) return;
    const clip = disponibles[Math.floor(Math.random() * disponibles.length)];
    volumenMusica(volumenRef.current * (loc.musicaAlHablar ?? 0.25));
    voz.volume = volumenRef.current;
    voz.src = ruta(clip.archivo);
    setHablando({ texto: clip.texto || "…", nombre: clip.locutor || loc.nombre });
    voz.play().catch(() => {
      volumenMusica(volumenRef.current);
      setHablando(null);
    });
  }, [volumenMusica]);

  // Saludo según la hora de quien escucha, o "bienvenido de vuelta" si ya vino antes.
  const saludar = useCallback(() => {
    const saludos = radioRef.current?.locutor?.saludos;
    if (!saludos || saludadoRef.current) return;
    saludadoRef.current = true;
    let visitas = 0;
    try {
      visitas = parseInt(localStorage.getItem("radio-visitas") || "0", 10) || 0;
      localStorage.setItem("radio-visitas", String(visitas + 1));
    } catch {}
    const hora = new Date().getHours();
    const momento = hora < 6 ? "madrugada" : hora < 12 ? "manana" : hora < 19 ? "tarde" : "noche";
    const usarRegreso = visitas > 0 && saludos.regreso?.length && Math.random() < 0.7;
    hablar(usarRegreso ? saludos.regreso : saludos[momento]);
  }, [hablar]);

  // Compañía: cada cierto tiempo el locutor le dice algo a quien sigue escuchando.
  useEffect(() => {
    const compania = radio?.locutor?.compania;
    if (!sintonizado || !radio?.locutor?.activo || !compania?.archivos?.length) return;
    const id = setInterval(() => hablar(compania.archivos), (compania.cadaMinutos || 20) * 60000);
    return () => clearInterval(id);
  }, [sintonizado, radio, hablar]);

  // Hora exacta: al empezar cada hora (la de quien escucha), el locutor la dice.
  const horaDichaRef = useRef(null);
  useEffect(() => {
    const horas = radio?.locutor?.horas;
    if (!sintonizado || !horas?.length) return;
    const id = setInterval(() => {
      const d = new Date();
      if (d.getMinutes() !== 0 || horaDichaRef.current === d.getHours()) return;
      horaDichaRef.current = d.getHours();
      hablar([horas[d.getHours()]].filter(Boolean));
    }, 15000);
    return () => clearInterval(id);
  }, [sintonizado, radio, hablar]);

  // El visualizador lee la música con un analizador. Se crea dentro del clic de sintonizar
  // porque el navegador solo deja arrancar el audio con un gesto de quien escucha.
  const prepararAnalizador = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || esIOS()) return;
    try {
      if (!analizadorRef.current) {
        const Contexto = window.AudioContext || window.webkitAudioContext;
        if (!Contexto) return;
        const ctx = new Contexto();
        const fuente = ctx.createMediaElementSource(audio);
        const analizador = ctx.createAnalyser();
        analizador.fftSize = 256;
        analizador.smoothingTimeConstant = 0.8;
        const ganancia = ctx.createGain();
        ganancia.gain.value = audio.volume;
        audio.volume = 1;
        // Ecualizador de 3 bandas antes del analizador
        const filtro = (tipo, frecuencia) => {
          const f = ctx.createBiquadFilter();
          f.type = tipo;
          f.frequency.value = frecuencia;
          return f;
        };
        const filtros = { graves: filtro("lowshelf", 150), medios: filtro("peaking", 1200), agudos: filtro("highshelf", 6000) };
        filtros.medios.Q.value = 0.8;
        for (const [banda, f] of Object.entries(filtros)) f.gain.value = ecualizadorRef.current[banda] || 0;
        filtrosRef.current = filtros;
        fuente.connect(filtros.graves);
        filtros.graves.connect(filtros.medios);
        filtros.medios.connect(filtros.agudos);
        filtros.agudos.connect(analizador);
        analizador.connect(ganancia);
        ganancia.connect(ctx.destination);
        gananciaRef.current = ganancia;
        analizadorRef.current = analizador;
      }
      if (analizadorRef.current.context.state === "suspended") analizadorRef.current.context.resume();
    } catch {
      // sin analizador: el visualizador se mueve solo
    }
  }, []);

  const sintonizar = useCallback(() => {
    sintonizadoRef.current = true;
    setSintonizado(true);
    prepararAnalizador();
    sincronizar();
    saludar(); // dentro del mismo clic, para que el navegador deje sonar la voz
  }, [sincronizar, saludar, prepararAnalizador]);

  const apagar = useCallback(() => {
    sintonizadoRef.current = false;
    setSintonizado(false);
    setEstado("apagado");
    setApagarEn(null);
    audioRef.current?.pause();
    volumenMusica(volumenRef.current);
    if (vozRef.current && !vozRef.current.paused) {
      vozRef.current.pause();
      volumenMusica(volumenRef.current);
      setHablando(null);
    }
  }, [volumenMusica]);

  const setVolumen = useCallback((v) => {
    setVolumenState(v);
    volumenRef.current = v;
    const voz = vozRef.current;
    const hablandoAhora = voz && !voz.paused;
    if (voz) voz.volume = v;
    if (audioRef.current) {
      volumenMusica(hablandoAhora ? v * (radioRef.current?.locutor?.musicaAlHablar ?? 0.25) : v);
    }
    try {
      localStorage.setItem("radio-volumen", String(v));
    } catch {}
  }, [volumenMusica]);

  // ---- Lo personal: avisos en pantalla, logros, favoritos, recordatorios, temporizador ----

  const notificar = useCallback((n) => setNotificacion({ ...n, id: Date.now() }), []);
  useEffect(() => {
    if (!notificacion) return;
    const id = setTimeout(() => setNotificacion(null), notificacion.accion ? 12000 : 6000);
    return () => clearTimeout(id);
  }, [notificacion]);

  const logrosRef = useRef(logros);
  const desbloquear = useCallback(
    (id) => {
      if (logrosRef.current[id]) return;
      const logro = LOGROS.find((l) => l.id === id);
      if (!logro) return;
      logrosRef.current = { ...logrosRef.current, [id]: Date.now() };
      guardar("radio-logros", logrosRef.current);
      setLogros(logrosRef.current);
      notificar({ icono: logro.icono, texto: `Logro desbloqueado: ${logro.titulo}` });
    },
    [notificar]
  );

  const favoritosRef = useRef(favoritos);
  const alternarFavorito = useCallback(
    (id) => {
      const lista = favoritosRef.current;
      const nueva = lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id];
      favoritosRef.current = nueva;
      guardar("radio-favoritos", nueva);
      setFavoritos(nueva);
      if (nueva.length >= 5) desbloquear("fan");
    },
    [desbloquear]
  );

  const avisosRef = useRef(avisos);
  const cambiarAvisos = useCallback((nueva) => {
    avisosRef.current = nueva;
    guardar("radio-avisos", nueva);
    setAvisos(nueva);
  }, []);
  const alternarAviso = useCallback(
    (id) => {
      // Pedir permiso para avisar con la pestaña en segundo plano (si lo niega, igual avisa en la página)
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
      const lista = avisosRef.current;
      cambiarAvisos(lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]);
    },
    [cambiarAvisos]
  );

  const programarApagado = useCallback(
    (minutos) => {
      if (!minutos) {
        setApagarEn(null);
        volumenMusica(volumenRef.current);
        return;
      }
      setApagarEn(Date.now() + minutos * 60000);
      desbloquear("dormilon");
    },
    [desbloquear, volumenMusica]
  );

  const setEcualizador = useCallback((banda, db) => {
    const nuevo = { ...ecualizadorRef.current, [banda]: db };
    ecualizadorRef.current = nuevo;
    guardar("radio-ecualizador", nuevo);
    setEcualizadorState(nuevo);
    const f = filtrosRef.current?.[banda];
    if (f) f.gain.setTargetAtTime(db, f.context.currentTime, 0.05);
  }, []);

  const setSinLocutor = useCallback(
    (valor) => {
      sinLocutorRef.current = valor;
      guardar("radio-sin-locutor", valor);
      setSinLocutorState(valor);
      if (valor && vozRef.current && !vozRef.current.paused) {
        vozRef.current.pause();
        setHablando(null);
        volumenMusica(volumenRef.current);
      }
    },
    [volumenMusica]
  );

  // Cada medio segundo: tiempo escuchado y temporizador para dormir
  const ultimoGuardadoRef = useRef(0);
  const calladoRef = useRef(false);
  useEffect(() => {
    if (apagarEn) {
      const restante = apagarEn - ahora;
      const audio = audioRef.current;
      if (restante <= 0) {
        apagar();
        notificar({ icono: "🌙", texto: "Buenas noches. La radio se apagó con el temporizador." });
      } else if (restante < FUNDIDO_SUENO && audio && vozRef.current?.paused) {
        volumenMusica(volumenRef.current * (restante / FUNDIDO_SUENO));
      }
    }
    // Modo sin locutor: las cuñas y presentaciones (que suenan para todos) se silencian aquí
    const actual = progRef.current?.enVivo(ahora)?.cancion;
    const callar = sinLocutorRef.current && actual?.esLocutor;
    if (callar) {
      calladoRef.current = true;
      volumenMusica(0);
    } else if (!callar && calladoRef.current) {
      calladoRef.current = false;
      volumenMusica(volumenRef.current);
    }
    if (estadoRef.current !== "sonando") return;
    const e = escuchaRef.current;
    e.segundos += 0.5;
    if (ahora - ultimoGuardadoRef.current > 10000) {
      ultimoGuardadoRef.current = ahora;
      guardar("radio-escucha", e);
      setEscucha({ ...e });
      if (e.segundos >= 1800) desbloquear("media-hora");
      if (e.segundos >= 3600) desbloquear("hora");
      if (e.segundos >= 36000) desbloquear("diez-horas");
      const hora = new Date(ahora).getHours();
      if (hora < 5) desbloquear("buho");
      else if (hora < 8) desbloquear("madrugador");
    }
  }, [ahora]); // eslint-disable-line react-hooks/exhaustive-deps

  const prog = progRef.current;
  const enVivo = prog ? prog.enVivo(ahora) : null;
  const enVivoId = enVivo?.cancion.id;

  // Cuando empieza una canción: contarla como oída y avisar si alguien pidió que le avisaran
  useEffect(() => {
    if (!enVivo) return;
    const { cancion } = enVivo;
    if (sintonizado) {
      desbloquear("primera");
      if (cancion.oculta) desbloquear("senal");
      if (!cancion.esLocutor && !cancion.esIntro && !cancion.oculta) {
        const e = escuchaRef.current;
        if (!e.canciones.includes(cancion.id)) {
          e.canciones = [...e.canciones, cancion.id];
          guardar("radio-escucha", e);
          setEscucha({ ...e });
          if (e.canciones.length >= 25) desbloquear("coleccionista");
          if (e.canciones.length >= 75) desbloquear("enciclopedia");
        }
      }
    }
    if (avisosRef.current.includes(cancion.id)) {
      cambiarAvisos(avisosRef.current.filter((x) => x !== cancion.id));
      notificar({ icono: "🔔", texto: `¡Está sonando ${cancion.titulo}!`, accion: sintonizado ? null : "sintonizar" });
      if (document.visibilityState !== "visible" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(`Sonando ahora: ${cancion.titulo}`, { body: radioRef.current?.nombre, icon: ruta(cancion.portada) });
        } catch {
          // algunos celulares solo permiten notificaciones desde un service worker
        }
      }
    }
  }, [enVivoId, sintonizado]); // eslint-disable-line react-hooks/exhaustive-deps

  // La pestaña muestra lo que suena mientras escuchas
  useEffect(() => {
    if (!radio) return;
    document.title = sintonizado && enVivo ? `▶ ${enVivo.cancion.titulo} · ${radio.nombre}` : radio.nombre;
  }, [sintonizado, enVivo?.cancion.id, radio]); // eslint-disable-line react-hooks/exhaustive-deps

  // Controles del sistema (pantalla de bloqueo, audífonos)
  useEffect(() => {
    if (!("mediaSession" in navigator) || !enVivo) return;
    const { cancion } = enVivo;
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: cancion.titulo,
      artist: cancion.artista,
      album: radio?.nombre,
      artwork: [{ src: ruta(cancion.portada || radio?.portada), sizes: "512x512" }],
    });
    navigator.mediaSession.setActionHandler("play", sintonizar);
    navigator.mediaSession.setActionHandler("pause", apagar);
    navigator.mediaSession.setActionHandler("stop", apagar);
  }, [enVivo?.cancion.id, radio, sintonizar, apagar]); // eslint-disable-line react-hooks/exhaustive-deps

  const valor = {
    radio,
    error,
    ahora,
    enVivo,
    proximas: (cantidad) => (prog ? prog.proximas(ahora, cantidad) : []),
    duracionCiclo: prog ? prog.duracionCiclo : 0,
    parrilla: (cantidad) => (prog ? prog.parrilla(ahora, cantidad) : []),
    canciones: prog ? prog.canciones : [],
    sintonizado,
    estado,
    sintonizar,
    apagar,
    volumen,
    setVolumen,
    hablando,
    versionNueva,
    anteriores: (cantidad) => (prog ? prog.anteriores(ahora, cantidad) : []),
    agenda: (dias) => (prog ? prog.agenda(ahora, dias) : new Map()),
    obtenerAnalizador: () => analizadorRef.current,
    favoritos,
    alternarFavorito,
    avisos,
    alternarAviso,
    logros,
    desbloquear,
    escucha,
    notificacion,
    notificar,
    cerrarNotificacion: () => setNotificacion(null),
    apagarEn,
    programarApagado,
    ecualizador,
    setEcualizador,
    ecualizadorDisponible: !esIOS(),
    sinLocutor,
    setSinLocutor,
  };

  return <RadioContext.Provider value={valor}>{children}</RadioContext.Provider>;
}
