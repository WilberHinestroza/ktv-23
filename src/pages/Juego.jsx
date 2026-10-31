import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Gamepad2, RotateCcw, Share2, Volume2, X } from "lucide-react";
import { useRadio } from "../radio/RadioContext";
import { ruta } from "../contenido";
import { guardar, leer } from "../radio/oyente";

const RONDAS = 10;
const SEGUNDOS = 6;

const barajar = (lista) => {
  const c = [...lista];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
};

// Adivina la canción: suena un pedazo y eliges el título entre 4.
export default function Juego({ seccion }) {
  const { canciones, sintonizado, apagar, notificar, desbloquear } = useRadio();
  const [fase, setFase] = useState("inicio"); // inicio | jugando | fin
  const [rondas, setRondas] = useState([]);
  const [i, setI] = useState(0);
  const [elegida, setElegida] = useState(null);
  const [puntos, setPuntos] = useState(0);
  const [racha, setRacha] = useState(0);
  const [record, setRecord] = useState(() => leer("juego-record", { mejor: 0, partidas: 0 }));
  const [sonando, setSonando] = useState(false);
  const audioRef = useRef(null);
  const corteRef = useRef(null);

  const jugables = useMemo(
    () =>
      canciones.filter(
        (c) => c.duracion > 40 && !c.esLocutor && !c.esIntro && !/\b(intro|outro|skit|interludio)\b/i.test(c.titulo)
      ),
    [canciones]
  );

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    return () => {
      audio.pause();
      clearTimeout(corteRef.current);
    };
  }, []);

  const tocar = (cancion, inicio) => {
    const audio = audioRef.current;
    clearTimeout(corteRef.current);
    audio.src = ruta(cancion.archivo);
    audio.currentTime = inicio;
    audio.volume = 0.9;
    audio
      .play()
      .then(() => {
        setSonando(true);
        corteRef.current = setTimeout(() => {
          audio.pause();
          setSonando(false);
        }, SEGUNDOS * 1000);
      })
      .catch(() => setSonando(false));
  };

  // 3 opciones falsas con títulos claramente distintos ("24-7" y "24/7" no pueden salir juntas)
  const base = (t) => t.replace(/\(.*?\)/g, "").replace(/[^a-z0-9ñ]/gi, "").toLowerCase();
  const distractores = (c) => {
    const vistos = new Set([base(c.titulo)]);
    const salida = [];
    for (const o of barajar(jugables)) {
      const b = base(o.titulo);
      if (vistos.has(b)) continue;
      vistos.add(b);
      salida.push(o);
      if (salida.length === 3) break;
    }
    return salida;
  };

  const empezar = () => {
    if (sintonizado) {
      apagar();
      notificar({ icono: "🎮", texto: "Pausé la radio mientras juegas." });
    }
    const elegidas = barajar(jugables).slice(0, RONDAS);
    const nuevas = elegidas.map((c) => ({
      cancion: c,
      inicio: c.duracion * (0.25 + Math.random() * 0.4),
      opciones: barajar([c, ...distractores(c)]),
    }));
    setRondas(nuevas);
    setI(0);
    setPuntos(0);
    setRacha(0);
    setElegida(null);
    setFase("jugando");
    tocar(nuevas[0].cancion, nuevas[0].inicio); // dentro del clic, para que el navegador deje sonar
  };

  const responder = (opcion) => {
    if (elegida) return;
    setElegida(opcion);
    if (opcion.id === rondas[i].cancion.id) {
      setPuntos((p) => p + 1);
      setRacha((r) => r + 1);
    } else setRacha(0);
  };

  const siguiente = () => {
    if (i + 1 >= rondas.length) {
      audioRef.current.pause();
      setSonando(false);
      const nuevo = { mejor: Math.max(record.mejor, puntos), partidas: record.partidas + 1 };
      setRecord(nuevo);
      guardar("juego-record", nuevo);
      if (puntos >= 8) desbloquear("oido");
      if (puntos === RONDAS) desbloquear("perfecto");
      setFase("fin");
      return;
    }
    setI(i + 1);
    setElegida(null);
    tocar(rondas[i + 1].cancion, rondas[i + 1].inicio);
  };

  const compartir = async () => {
    const texto = `Saqué ${puntos}/${RONDAS} en "Adivina la canción" de KeNnyga Radio 🎧`;
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ text: texto, url });
      else {
        await navigator.clipboard.writeText(`${texto} ${url}`);
        notificar({ icono: "📋", texto: "Resultado copiado" });
      }
    } catch {}
  };

  if (!jugables.length) return <div className="cargando">Cargando canciones…</div>;
  const ronda = rondas[i];

  return (
    <section className="contenedor juego">
      <h1 className="titulo-seccion">Adivina la canción</h1>

      {fase === "inicio" && (
        <div className="juego-caja">
          <Gamepad2 size={48} className="juego-icono" />
          <p className="intro">
            Suenan {SEGUNDOS} segundos de una canción de Wildberry y eliges cuál es. {RONDAS} rondas. ¿Cuánto te sabes
            el catálogo?
          </p>
          {record.partidas > 0 && (
            <p className="juego-record">
              Tu récord: <strong>{record.mejor}/{RONDAS}</strong> · {record.partidas} partida
              {record.partidas === 1 ? "" : "s"}
            </p>
          )}
          <button className="boton-sintonizar" onClick={empezar}>
            Jugar
          </button>
        </div>
      )}

      {fase === "jugando" && ronda && (
        <div className="juego-caja">
          <div className="juego-marcador">
            <span>
              Ronda {i + 1}/{RONDAS}
            </span>
            <span>
              {puntos} punto{puntos === 1 ? "" : "s"}
              {racha >= 3 ? ` · 🔥 racha de ${racha}` : ""}
            </span>
          </div>
          <div className="juego-disco">
            {elegida ? (
              <img src={ruta(ronda.cancion.portada)} alt="" />
            ) : (
              <div className={`juego-onda ${sonando ? "sonando" : ""}`} aria-hidden="true">
                {Array.from({ length: 12 }, (_, k) => (
                  <span key={k} style={{ animationDelay: `${k * 0.08}s` }} />
                ))}
              </div>
            )}
          </div>
          <button className="boton-compartir" onClick={() => tocar(ronda.cancion, ronda.inicio)}>
            <Volume2 size={16} /> <span>{sonando ? "Sonando…" : "Escuchar otra vez"}</span>
          </button>
          <div className="juego-opciones">
            {ronda.opciones.map((o) => {
              const correcta = o.id === ronda.cancion.id;
              const clase = elegida ? (correcta ? "correcta" : o.id === elegida.id ? "incorrecta" : "") : "";
              return (
                <button key={o.id} className={`juego-opcion ${clase}`} onClick={() => responder(o)} disabled={Boolean(elegida)}>
                  {elegida && correcta && <Check size={16} />}
                  {elegida && !correcta && o.id === elegida.id && <X size={16} />}
                  {o.titulo}
                </button>
              );
            })}
          </div>
          {elegida && (
            <div className="juego-resultado">
              <p>
                {elegida.id === ronda.cancion.id ? "¡Correcto!" : "Era"}{" "}
                <a href={`#/cancion/${ronda.cancion.id}`}>{ronda.cancion.titulo}</a>
                {ronda.cancion.albumInfo && ronda.cancion.albumInfo.tipo !== "Sencillo" ? ` · ${ronda.cancion.albumInfo.titulo}` : ""}
              </p>
              <button className="boton-sintonizar" onClick={siguiente}>
                {i + 1 >= RONDAS ? "Ver resultado" : "Siguiente"}
              </button>
            </div>
          )}
        </div>
      )}

      {fase === "fin" && (
        <div className="juego-caja">
          <p className="juego-final">
            {puntos}/{RONDAS}
          </p>
          <p className="intro">
            {puntos === RONDAS
              ? "Perfecto. Te sabes el catálogo de memoria."
              : puntos >= 8
              ? "Oído de oro. Eres de la casa."
              : puntos >= 5
              ? "Nada mal. Sintoniza más la radio y vuelve."
              : "Te falta radio. ¡A escuchar!"}
          </p>
          <p className="juego-record">Récord: {record.mejor}/{RONDAS}</p>
          <div className="controles-extra">
            <button className="boton-sintonizar" onClick={empezar}>
              <RotateCcw size={18} /> Otra vez
            </button>
            <button className="boton-compartir" onClick={compartir}>
              <Share2 size={16} /> <span>Compartir</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
