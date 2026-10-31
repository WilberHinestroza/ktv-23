import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Heart, Keyboard, Mail, Moon, SlidersHorizontal, X } from "lucide-react";
import { useRadio } from "../radio/RadioContext";

// ---------- Visualizador: barras que bailan con la música ----------
// Lee el analizador de audio si existe; si no (iPhone, o antes de sintonizar), se mueve solo.
export function Visualizador() {
  const { sintonizado, obtenerAnalizador } = useRadio();
  const lienzoRef = useRef(null);

  useEffect(() => {
    const lienzo = lienzoRef.current;
    if (!lienzo) return;
    const ctx = lienzo.getContext("2d");
    let cuadro;
    let datos = null;
    const raiz = getComputedStyle(document.documentElement);
    const color1 = raiz.getPropertyValue("--acento-1").trim() || "#ff2d3b";
    const color2 = raiz.getPropertyValue("--acento-2").trim() || "#ff9a3b";

    const dibujar = (t) => {
      const ancho = (lienzo.width = lienzo.clientWidth * devicePixelRatio);
      const alto = (lienzo.height = lienzo.clientHeight * devicePixelRatio);
      ctx.clearRect(0, 0, ancho, alto);
      const analizador = sintonizado ? obtenerAnalizador() : null;
      const barras = 48;
      let valores;
      if (analizador) {
        if (!datos || datos.length !== analizador.frequencyBinCount) datos = new Uint8Array(analizador.frequencyBinCount);
        analizador.getByteFrequencyData(datos);
        valores = Array.from({ length: barras }, (_, i) => datos[Math.floor((i / barras) * datos.length * 0.75)] / 255);
      } else {
        // Ondas suaves de mentira: más vivas si suena, casi quietas si está apagada
        const fuerza = sintonizado ? 0.55 : 0.12;
        valores = Array.from(
          { length: barras },
          (_, i) => fuerza * (0.5 + 0.5 * Math.sin(t / 380 + i * 0.45) * Math.cos(t / 900 + i * 0.13))
        );
      }
      const graves = valores.slice(0, 6).reduce((a, b) => a + b, 0) / 6;
      document.querySelectorAll(".portada").forEach((p) => p.style.setProperty("--graves", graves.toFixed(3)));

      const hueco = ancho / barras;
      const degradado = ctx.createLinearGradient(0, alto, 0, 0);
      degradado.addColorStop(0, color1);
      degradado.addColorStop(1, color2);
      ctx.fillStyle = degradado;
      valores.forEach((v, i) => {
        const h = Math.max(2 * devicePixelRatio, v * alto);
        ctx.globalAlpha = 0.35 + v * 0.5;
        ctx.fillRect(i * hueco + hueco * 0.2, alto - h, hueco * 0.6, h);
      });
      cuadro = requestAnimationFrame(dibujar);
    };
    cuadro = requestAnimationFrame(dibujar);
    return () => cancelAnimationFrame(cuadro);
  }, [sintonizado, obtenerAnalizador]);

  return <canvas ref={lienzoRef} className="visualizador" aria-hidden="true" />;
}

// ---------- Botón de favorito y de "avísame" ----------
export function BotonFavorito({ cancion, chico }) {
  const { favoritos, alternarFavorito } = useRadio();
  if (!cancion || cancion.esLocutor || cancion.esIntro || cancion.oculta) return null;
  const activo = favoritos.includes(cancion.id);
  return (
    <button
      className={`boton-icono ${activo ? "activo-rojo" : ""} ${chico ? "chico" : ""}`}
      onClick={() => alternarFavorito(cancion.id)}
      aria-pressed={activo}
      title={activo ? "Quitar de favoritas" : "Guardar en favoritas"}
    >
      <Heart size={chico ? 15 : 18} fill={activo ? "currentColor" : "none"} />
      <span className="solo-lector">Favorita</span>
    </button>
  );
}

export function BotonAviso({ cancion }) {
  const { avisos, alternarAviso } = useRadio();
  const activo = avisos.includes(cancion.id);
  return (
    <button
      className={`boton-icono chico ${activo ? "activo-cian" : ""}`}
      onClick={() => alternarAviso(cancion.id)}
      aria-pressed={activo}
      title={activo ? "Ya no avisarme" : "Avísame cuando suene"}
    >
      <Bell size={15} fill={activo ? "currentColor" : "none"} />
      <span className="solo-lector">Avísame</span>
    </button>
  );
}

// ---------- Temporizador para dormir ----------
const OPCIONES_SUENO = [15, 30, 45, 60, 90];

export function Temporizador() {
  const { apagarEn, programarApagado, ahora, sintonizado } = useRadio();
  const [abierto, setAbierto] = useState(false);
  const restante = apagarEn ? Math.max(0, apagarEn - ahora) : 0;
  const etiqueta = apagarEn
    ? `${Math.floor(restante / 60000)}:${String(Math.floor((restante % 60000) / 1000)).padStart(2, "0")}`
    : "Dormir";

  return (
    <div className="temporizador">
      <button
        className={`boton-compartir ${apagarEn ? "activo-cian" : ""}`}
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        title="Apagar la radio sola"
      >
        <Moon size={16} />
        <span>{etiqueta}</span>
      </button>
      {abierto && (
        <div className="menu-flotante" role="menu">
          <p>Apagar la radio en…</p>
          {OPCIONES_SUENO.map((m) => (
            <button
              key={m}
              role="menuitem"
              disabled={!sintonizado}
              onClick={() => {
                programarApagado(m);
                setAbierto(false);
              }}
            >
              {m} min
            </button>
          ))}
          {apagarEn && (
            <button
              role="menuitem"
              onClick={() => {
                programarApagado(null);
                setAbierto(false);
              }}
            >
              Cancelar
            </button>
          )}
          {!sintonizado && <small>Primero sintoniza la radio.</small>}
        </div>
      )}
    </div>
  );
}

// ---------- Dedicatorias: un enlace con un mensaje para alguien ----------
// Todo va en el propio enlace (#/radio?para=…&de=…&msg=…), no se guarda en ningún servidor.
const LIMITE_MENSAJE = 160;

export function leerDedicatoria() {
  const [, consulta] = window.location.hash.split("?");
  if (!consulta) return null;
  const p = new URLSearchParams(consulta);
  const para = (p.get("para") || "").slice(0, 40).trim();
  const de = (p.get("de") || "").slice(0, 40).trim();
  const msg = (p.get("msg") || "").slice(0, LIMITE_MENSAJE).trim();
  return para || msg ? { para, de, msg } : null;
}

export function Dedicar({ cancion }) {
  const { radio, desbloquear } = useRadio();
  const [abierto, setAbierto] = useState(false);
  const [datos, setDatos] = useState({ para: "", de: "", msg: "" });
  const [copiado, setCopiado] = useState(false);

  const enlace = () => {
    const p = new URLSearchParams();
    if (datos.para.trim()) p.set("para", datos.para.trim());
    if (datos.de.trim()) p.set("de", datos.de.trim());
    if (datos.msg.trim()) p.set("msg", datos.msg.trim());
    return `${window.location.origin}${window.location.pathname}#/radio?${p.toString()}`;
  };
  const enviar = async (e) => {
    e.preventDefault();
    const url = enlace();
    const texto = `💌 ${datos.de.trim() || "Alguien"} te dedicó ${radio.nombre}`;
    desbloquear("cartero");
    if (navigator.share) {
      try {
        await navigator.share({ title: radio.nombre, text: texto, url });
        setAbierto(false);
        return;
      } catch {
        // canceló o no se pudo: queda copiar el enlace
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      window.prompt("Copia este enlace:", url);
    }
  };
  const campo = (k) => ({ value: datos[k], onChange: (e) => setDatos((d) => ({ ...d, [k]: e.target.value })) });

  return (
    <>
      <button className="boton-compartir" onClick={() => setAbierto(true)} title="Dedicar la radio a alguien">
        <Mail size={16} />
        <span>Dedicar</span>
      </button>
      {abierto && (
        <div className="modal" onClick={() => setAbierto(false)}>
          <form className="modal-caja dedicatoria-caja" onClick={(e) => e.stopPropagation()} onSubmit={enviar}>
            <h3>💌 Dedicar la radio</h3>
            <p>
              Crea un enlace con tu mensaje. Quien lo abra lo verá al entrar y escuchará lo que esté sonando
              {cancion && !cancion.esLocutor ? ` (ahora: ${cancion.titulo})` : ""}.
            </p>
            <input placeholder="Para (nombre)" maxLength={40} required {...campo("para")} />
            <input placeholder="De (tu nombre, opcional)" maxLength={40} {...campo("de")} />
            <textarea placeholder="Tu mensaje" maxLength={LIMITE_MENSAJE} rows={3} {...campo("msg")} />
            <small className="contador">
              {datos.msg.length}/{LIMITE_MENSAJE}
            </small>
            <div className="modal-botones">
              <button type="submit">{copiado ? "¡Enlace copiado!" : "Crear enlace"}</button>
              <button type="button" onClick={() => setAbierto(false)}>
                Cerrar
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export function DedicatoriaRecibida() {
  const { radio, sintonizar, sintonizado } = useRadio();
  const [dedicatoria, setDedicatoria] = useState(leerDedicatoria);
  useEffect(() => {
    const alCambiar = () => setDedicatoria(leerDedicatoria());
    window.addEventListener("hashchange", alCambiar);
    return () => window.removeEventListener("hashchange", alCambiar);
  }, []);
  if (!dedicatoria || !radio) return null;

  const cerrar = () => {
    setDedicatoria(null);
    window.history.replaceState(null, "", "#/radio"); // que no vuelva a salir al recargar
  };
  return (
    <div className="modal" onClick={cerrar}>
      <div className="modal-caja dedicatoria-recibida" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="sobre" aria-hidden="true">
          💌
        </div>
        <h3>{dedicatoria.para ? `Para ${dedicatoria.para}` : "Una dedicatoria"}</h3>
        {dedicatoria.msg && <blockquote>“{dedicatoria.msg}”</blockquote>}
        <p>
          {dedicatoria.de ? `${dedicatoria.de} te dedica` : "Te dedicaron"} {radio.nombre}. Lo que suena ahora es para ti.
        </p>
        <div className="modal-botones">
          <button
            onClick={() => {
              if (!sintonizado) sintonizar();
              cerrar();
            }}
          >
            ▶ Escuchar
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Avisos en pantalla (logros, recordatorios…) ----------
export function Notificacion() {
  const { notificacion, cerrarNotificacion, sintonizar } = useRadio();
  if (!notificacion) return null;
  return (
    <div className="notificacion" role="status" key={notificacion.id}>
      <span className="notificacion-icono">{notificacion.icono}</span>
      <span>{notificacion.texto}</span>
      {notificacion.accion === "sintonizar" && (
        <button
          onClick={() => {
            sintonizar();
            cerrarNotificacion();
          }}
        >
          Escuchar
        </button>
      )}
      <button className="cerrar" onClick={cerrarNotificacion} aria-label="Cerrar">
        <X size={14} />
      </button>
    </div>
  );
}

// ---------- Atajos de teclado y el código secreto ----------
const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
const ATAJOS = [
  ["Espacio", "Sintonizar / apagar"],
  ["M", "Silenciar"],
  ["↑ ↓", "Subir / bajar volumen"],
  ["F", "Guardar la canción en favoritas"],
  ["?", "Ver esta ayuda"],
];

export function Atajos() {
  const r = useRadio();
  const rRef = useRef(r);
  rRef.current = r;
  const [ayuda, setAyuda] = useState(false);
  const antesDeSilenciar = useRef(0.8);

  useEffect(() => {
    let secuencia = [];
    const alTeclear = (e) => {
      const destino = e.target;
      if (destino.closest?.("input, textarea, select, [contenteditable]") || e.ctrlKey || e.metaKey || e.altKey) return;
      const { sintonizado, sintonizar, apagar, volumen, setVolumen, enVivo, alternarFavorito, desbloquear } = rRef.current;

      secuencia = [...secuencia, e.key.length === 1 ? e.key.toLowerCase() : e.key].slice(-KONAMI.length);
      if (secuencia.join() === KONAMI.join()) {
        secuencia = [];
        document.body.classList.add("modo-interferencia");
        setTimeout(() => document.body.classList.remove("modo-interferencia"), 9000);
        desbloquear("konami");
        return;
      }

      const enBoton = destino.closest?.("button, a");
      if ((e.key === " " || e.key === "k") && !enBoton) {
        e.preventDefault();
        sintonizado ? apagar() : sintonizar();
      } else if (e.key === "m") {
        if (volumen > 0) {
          antesDeSilenciar.current = volumen;
          setVolumen(0);
        } else setVolumen(antesDeSilenciar.current || 0.8);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setVolumen(Math.min(1, Math.round((volumen + 0.05) * 100) / 100));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setVolumen(Math.max(0, Math.round((volumen - 0.05) * 100) / 100));
      } else if (e.key === "f" && enVivo) {
        const c = enVivo.cancion;
        if (!c.esLocutor && !c.esIntro && !c.oculta) alternarFavorito(c.id);
      } else if (e.key === "?") {
        setAyuda((a) => !a);
      } else if (e.key === "Escape") {
        setAyuda(false);
      }
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, []);

  if (!ayuda) return null;
  return (
    <div className="modal" onClick={() => setAyuda(false)}>
      <div className="modal-caja" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3>
          <Keyboard /> Atajos de teclado
        </h3>
        <dl className="lista-atajos">
          {ATAJOS.map(([tecla, texto]) => (
            <div key={tecla}>
              <dt>
                <kbd>{tecla}</kbd>
              </dt>
              <dd>{texto}</dd>
            </div>
          ))}
        </dl>
        <p>Y hay un código secreto de los videojuegos de antes…</p>
        <div className="modal-botones">
          <button onClick={() => setAyuda(false)}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Ambiente según la hora de quien visita ----------
export function momentoDelDia(fecha = new Date()) {
  const h = fecha.getHours();
  return h < 6 ? "madrugada" : h < 12 ? "manana" : h < 19 ? "tarde" : "noche";
}

export function Ambiente() {
  useEffect(() => {
    const poner = () => (document.documentElement.dataset.momento = momentoDelDia());
    poner();
    const id = setInterval(poner, 60000);
    return () => clearInterval(id);
  }, []);
  return null;
}

// ---------- Ajustes de sonido: ecualizador y modo sin locutor ----------
const BANDAS = [
  ["graves", "Graves"],
  ["medios", "Medios"],
  ["agudos", "Agudos"],
];
const PRESETS = {
  Normal: { graves: 0, medios: 0, agudos: 0 },
  "Más bajo": { graves: 7, medios: 0, agudos: 1 },
  Voces: { graves: -2, medios: 4, agudos: 2 },
  Noche: { graves: 3, medios: -1, agudos: -4 },
};

export function Ajustes() {
  const { ecualizador, setEcualizador, ecualizadorDisponible, sinLocutor, setSinLocutor } = useRadio();
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button className="boton-compartir" onClick={() => setAbierto(true)} title="Ecualizador y más">
        <SlidersHorizontal size={16} />
        <span>Sonido</span>
      </button>
      {abierto && (
        <div className="modal" onClick={() => setAbierto(false)}>
          <div className="modal-caja ajustes" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h3>
              <SlidersHorizontal /> Sonido
            </h3>
            {ecualizadorDisponible ? (
              <>
                <div className="presets">
                  {Object.entries(PRESETS).map(([nombre, v]) => (
                    <button
                      key={nombre}
                      className={BANDAS.every(([b]) => ecualizador[b] === v[b]) ? "chip activo" : "chip"}
                      onClick={() => BANDAS.forEach(([b]) => setEcualizador(b, v[b]))}
                    >
                      {nombre}
                    </button>
                  ))}
                </div>
                <div className="bandas">
                  {BANDAS.map(([banda, texto]) => (
                    <label key={banda}>
                      <span>{texto}</span>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="1"
                        value={ecualizador[banda]}
                        style={{ "--lleno": `${((ecualizador[banda] + 12) / 24) * 100}%` }}
                        onChange={(e) => setEcualizador(banda, Number(e.target.value))}
                      />
                      <small>
                        {ecualizador[banda] > 0 ? "+" : ""}
                        {ecualizador[banda]} dB
                      </small>
                    </label>
                  ))}
                </div>
                <p>El ecualizador se aplica cuando sintonizas.</p>
              </>
            ) : (
              <p>El ecualizador no está disponible en iPhone/iPad.</p>
            )}
            <label className="interruptor">
              <input type="checkbox" checked={sinLocutor} onChange={(e) => setSinLocutor(e.target.checked)} />
              <span>Solo música (sin locutor)</span>
            </label>
            <p>Silencia las cuñas, presentaciones y saludos. La música sigue sincronizada con todos.</p>
            <div className="modal-botones">
              <button onClick={() => setAbierto(false)}>Listo</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ---------- Sorpresas por fecha ----------
// Cambian los colores y caen cositas por la pantalla. Para probar: ?temporada=navidad en la dirección.
const TEMPORADAS = {
  halloween: { emojis: ["🎃", "👻", "🦇", "🕸️"], texto: "Feliz Halloween desde KeNnyga Radio 🎃" },
  navidad: { emojis: ["❄️", "🎄", "✨", "🎁"], texto: "Feliz Navidad desde KeNnyga Radio 🎄" },
  "ano-nuevo": { emojis: ["🎆", "🥂", "✨", "🎉"], texto: "¡Feliz año nuevo! 🎆" },
  amor: { emojis: ["💜", "💌", "🌹", "✨"], texto: "Feliz día del amor y la amistad 💜" },
};

export function temporadaDe(fecha = new Date()) {
  const forzada = new URLSearchParams(window.location.search).get("temporada");
  if (forzada && TEMPORADAS[forzada]) return forzada;
  const m = fecha.getMonth() + 1;
  const d = fecha.getDate();
  if ((m === 10 && d >= 25) || (m === 11 && d <= 2)) return "halloween";
  if (m === 12 && d >= 15 && d <= 30) return "navidad";
  if ((m === 12 && d === 31) || (m === 1 && d <= 2)) return "ano-nuevo";
  if (m === 9 && d >= 14 && d <= 21) return "amor"; // amor y amistad en Colombia (septiembre)
  return null;
}

export function Temporada() {
  const { sintonizado, desbloquear, notificar } = useRadio();
  const [temporada] = useState(temporadaDe);
  useEffect(() => {
    if (!temporada) return;
    document.documentElement.dataset.temporada = temporada;
    let yaVisto = true;
    try {
      yaVisto = sessionStorage.getItem("temporada-vista");
      sessionStorage.setItem("temporada-vista", "1");
    } catch {}
    if (!yaVisto) {
      setTimeout(() => notificar({ icono: TEMPORADAS[temporada].emojis[0], texto: TEMPORADAS[temporada].texto }), 1500);
    }
    return () => delete document.documentElement.dataset.temporada;
  }, [temporada, notificar]);
  useEffect(() => {
    if (temporada && sintonizado) desbloquear("temporada");
  }, [temporada, sintonizado, desbloquear]);

  const piezas = useMemo(
    () =>
      temporada
        ? Array.from({ length: 14 }, (_, i) => ({
            emoji: TEMPORADAS[temporada].emojis[i % TEMPORADAS[temporada].emojis.length],
            izquierda: Math.random() * 100,
            demora: Math.random() * 18,
            duracion: 14 + Math.random() * 12,
            tamano: 14 + Math.random() * 16,
          }))
        : [],
    [temporada]
  );
  if (!temporada) return null;
  return (
    <div className="temporada-capa" aria-hidden="true">
      {piezas.map((p, i) => (
        <span
          key={i}
          style={{
            left: `${p.izquierda}%`,
            animationDelay: `-${p.demora}s`,
            animationDuration: `${p.duracion}s`,
            fontSize: `${p.tamano}px`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
