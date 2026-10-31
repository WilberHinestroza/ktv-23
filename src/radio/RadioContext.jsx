import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { crearProgramacion } from "./programacion";
import { cargarJSON, ruta } from "../contenido";

const RadioContext = createContext(null);
export const useRadio = () => useContext(RadioContext);

const DESFASE_MAX = 2.5; // segundos de diferencia tolerados antes de corregir

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
      audio.volume = volumenRef.current; // la música vuelve a su volumen
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
  }, [sincronizar]);

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
    if (!loc?.activo || !voz || !audio || !disponibles.length || !voz.paused) return;
    // No hablar encima de una cuña o presentación que ya está sonando para todos
    if (progRef.current?.enVivo().cancion.esLocutor) return;
    const clip = disponibles[Math.floor(Math.random() * disponibles.length)];
    audio.volume = volumenRef.current * (loc.musicaAlHablar ?? 0.25);
    voz.volume = volumenRef.current;
    voz.src = ruta(clip.archivo);
    setHablando({ texto: clip.texto || "…", nombre: clip.locutor || loc.nombre });
    voz.play().catch(() => {
      audio.volume = volumenRef.current;
      setHablando(null);
    });
  }, []);

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

  const sintonizar = useCallback(() => {
    sintonizadoRef.current = true;
    setSintonizado(true);
    sincronizar();
    saludar(); // dentro del mismo clic, para que el navegador deje sonar la voz
  }, [sincronizar, saludar]);

  const apagar = useCallback(() => {
    sintonizadoRef.current = false;
    setSintonizado(false);
    setEstado("apagado");
    audioRef.current?.pause();
    if (vozRef.current && !vozRef.current.paused) {
      vozRef.current.pause();
      if (audioRef.current) audioRef.current.volume = volumenRef.current;
      setHablando(null);
    }
  }, []);

  const setVolumen = useCallback((v) => {
    setVolumenState(v);
    volumenRef.current = v;
    const voz = vozRef.current;
    const hablandoAhora = voz && !voz.paused;
    if (voz) voz.volume = v;
    if (audioRef.current) {
      audioRef.current.volume = hablandoAhora ? v * (radioRef.current?.locutor?.musicaAlHablar ?? 0.25) : v;
    }
    try {
      localStorage.setItem("radio-volumen", String(v));
    } catch {}
  }, []);

  const prog = progRef.current;
  const enVivo = prog ? prog.enVivo(ahora) : null;

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
  };

  return <RadioContext.Provider value={valor}>{children}</RadioContext.Provider>;
}
