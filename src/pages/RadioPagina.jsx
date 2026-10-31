import { useEffect, useMemo, useRef, useState } from "react";
import { AudioLines, Files, Mic, Play, Radio, Square, Volume2, VolumeX } from "lucide-react";
import { useRadio } from "../radio/RadioContext";
import { ruta } from "../contenido";

const formatoTiempo = (seg) => {
  if (!Number.isFinite(seg) || seg < 0) return "0:00";
  return `${Math.floor(seg / 60)}:${String(Math.floor(seg % 60)).padStart(2, "0")}`;
};
const formatoHora = (ms) =>
  new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const TEXTO_ESTADO = {
  apagado: "Toca para escuchar lo que está sonando ahora",
  cargando: "Conectando con la señal…",
  sonando: "Escuchando en vivo",
  "sin-senal": "Señal perdida… volviendo con la siguiente",
};

export default function RadioPagina() {
  const r = useRadio();
  const { radio, enVivo, ahora, sintonizado, estado, sintonizar, apagar, volumen, setVolumen } = r;

  if (r.error) return <p className="aviso">{r.error}</p>;
  if (!radio || !enVivo) return <div className="cargando">Sintonizando…</div>;

  const { cancion, inicioMs, finMs, programa } = enVivo;
  const transcurrido = (ahora - inicioMs) / 1000;
  const total = (finMs - inicioMs) / 1000;
  const portada = ruta(cancion.portada || radio.portada);
  const album = cancion.albumInfo;

  return (
    <div className="radio">
      <section className={`reproductor ${cancion.oculta ? "interferencia" : ""}`}>
        <div className="reproductor-top">
          <a className="boton-neon rojo" href={radio.enVivoUrl} target="_blank" rel="noopener noreferrer">
            <Radio size={16} className="pulso" /> EN VIVO
          </a>
          <Archivos datos={radio.archivos} />
        </div>

        <p className="programa-actual">
          <span className="en-vivo-chip">AL AIRE</span> {programa.titulo}
        </p>

        <Portada src={portada} videoGlitch={radio.videoGlitch} titulo={cancion.titulo} />

        <h1 className="cancion-titulo">{cancion.titulo}</h1>
        <p className="cancion-artista">
          {cancion.artista}
          {album && !cancion.esIntro && (
            <>
              {" · "}
              <a href="#/musica" className="enlace-album">
                {album.titulo}
              </a>
              {album.fecha || album.anio ? ` (${(album.fecha || String(album.anio)).slice(0, 4)})` : ""}
            </>
          )}
        </p>
        {cancion.genero && <span className="chip-genero">{cancion.genero}</span>}

        <div
          className="progreso"
          role="progressbar"
          aria-label="Avance de la canción"
          aria-valuemin={0}
          aria-valuemax={Math.round(total)}
          aria-valuenow={Math.round(transcurrido)}
        >
          <div className="progreso-relleno" style={{ width: `${Math.min(100, (transcurrido / total) * 100)}%` }} />
        </div>
        <div className="tiempos">
          <span>{formatoTiempo(transcurrido)}</span>
          <span>{formatoTiempo(total)}</span>
        </div>

        <div className="controles">
          <button
            className={`boton-sintonizar ${sintonizado ? "encendido" : ""}`}
            onClick={sintonizado ? apagar : sintonizar}
          >
            {sintonizado ? <Square size={20} /> : <Play size={20} />}
            {sintonizado ? "Apagar" : "Sintonizar"}
          </button>
          <label className="volumen">
            {volumen === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            <span className="solo-lector">Volumen</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volumen}
              onChange={(e) => setVolumen(parseFloat(e.target.value))}
            />
          </label>
        </div>
        <p className={`estado estado-${estado}`} aria-live="polite">
          {TEXTO_ESTADO[estado]}
        </p>
        {r.hablando && (
          <p className="locutor-hablando" aria-live="polite">
            <Mic size={16} className="pulso" />
            <span>
              <strong>{radio.locutor?.nombre || radio.nombre}:</strong> “{r.hablando}”
            </span>
          </p>
        )}

        <Ticker radio={radio} />
      </section>

      <Programacion />
      <BotonEscondido imagenes={radio.imagenesOcultas} />
    </div>
  );
}

function Programacion() {
  const { radio, proximas, parrilla, sintonizado } = useRadio();
  const [vista, setVista] = useState("canciones");

  return (
    <aside className="programacion">
      <h2>Programación</h2>
      <p className="programacion-sub">{radio.nombre} · en tu hora local</p>
      <div className="pestanas" role="tablist">
        <button
          role="tab"
          aria-selected={vista === "canciones"}
          className={vista === "canciones" ? "activo" : ""}
          onClick={() => setVista("canciones")}
        >
          Siguientes
        </button>
        <button
          role="tab"
          aria-selected={vista === "parrilla"}
          className={vista === "parrilla" ? "activo" : ""}
          onClick={() => setVista("parrilla")}
        >
          Programas
        </button>
      </div>

      {vista === "canciones" ? (
        <ol>
          {proximas(12).map(({ cancion, inicioMs, programa }, i, lista) => (
            <li
              key={`${cancion.id}-${inicioMs}`}
              className={[i === 0 && "ahora", cancion.esLocutor && "es-locutor"].filter(Boolean).join(" ")}
            >
              {i > 0 && programa !== lista[i - 1].programa && (
                <span className="separador-programa">▸ {programa.titulo}</span>
              )}
              <span className="hora">{i === 0 ? "AHORA" : formatoHora(inicioMs)}</span>
              {cancion.esLocutor ? (
                <span className="prog-portada prog-mic" aria-hidden="true">
                  <Mic size={16} />
                </span>
              ) : (
                <img className="prog-portada" src={ruta(cancion.portada)} alt="" loading="lazy" />
              )}
              <span className="prog-meta">
                <strong>{cancion.oculta && i > 0 ? "▒▒▒▒▒▒" : cancion.titulo}</strong>
                <small>{cancion.oculta && i > 0 ? "???" : cancion.artista}</small>
              </span>
              {i === 0 && sintonizado && <AudioLines size={16} className="pulso" />}
            </li>
          ))}
        </ol>
      ) : (
        <ol className="parrilla">
          {parrilla(8).map(({ programa, inicioMs, finMs }, i) => (
            <li key={`${programa.id}-${inicioMs}`} className={i === 0 ? "ahora" : ""}>
              <span className="hora">
                {formatoHora(inicioMs)}
                <br />
                {formatoHora(finMs)}
              </span>
              <span className="prog-meta">
                <strong>{programa.titulo}</strong>
                {programa.descripcion && <small>{programa.descripcion}</small>}
              </span>
              {i === 0 && <span className="en-vivo-chip">AHORA</span>}
            </li>
          ))}
        </ol>
      )}
      <p className="programacion-nota">Todos escuchan lo mismo al mismo tiempo.</p>
    </aside>
  );
}

// Portada con glitch al mover el mouse y, de vez en cuando, un video perturbador.
function Portada({ src, videoGlitch, titulo }) {
  const [desfase, setDesfase] = useState(0);
  const [video, setVideo] = useState(false);
  const timeout = useRef(null);

  useEffect(() => {
    if (!videoGlitch) return;
    const id = setInterval(() => {
      if (Math.random() < 0.1) {
        setVideo(true);
        setTimeout(() => setVideo(false), 1000 + Math.random() * 1000);
      }
    }, 60000);
    return () => clearInterval(id);
  }, [videoGlitch]);

  const alMover = () => {
    clearTimeout(timeout.current);
    setDesfase(Math.random() * 6 - 3);
    timeout.current = setTimeout(() => setDesfase(0), 1000);
  };

  return (
    <div className="portada" onMouseMove={alMover} style={{ transform: `translateX(${desfase}px)` }}>
      {video ? (
        <video src={ruta(videoGlitch)} autoPlay loop muted playsInline disablePictureInPicture />
      ) : (
        <img src={src} alt={titulo} />
      )}
      <div className="scanlines" aria-hidden="true" />
    </div>
  );
}

function Ticker({ radio }) {
  const [items, setItems] = useState(radio.ticker || []);

  useEffect(() => {
    const id = setInterval(() => {
      let lista = [...(radio.ticker || [])];
      const raros = radio.mensajesRaros || [];
      if (raros.length && Math.random() < 0.3) {
        lista.push({ texto: raros[Math.floor(Math.random() * raros.length)] });
      }
      setItems(lista.sort(() => Math.random() - 0.5));
    }, 10000);
    return () => clearInterval(id);
  }, [radio]);

  return (
    <div className="ticker" aria-label="Noticias del canal">
      <div className="ticker-texto">
        {radio.nombre}
        {items.map((it, i) => (
          <span key={i}>
            {" · "}
            {it.url ? (
              <a href={it.url} target="_blank" rel="noopener noreferrer">
                {it.texto}
              </a>
            ) : (
              it.texto
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

function Archivos({ datos }) {
  const [paso, setPaso] = useState(null); // null | "clave" | "abierto"
  const [clave, setClave] = useState("");
  const [error, setError] = useState(false);
  if (!datos) return null;

  const cerrar = () => {
    setPaso(null);
    setClave("");
    setError(false);
  };
  const entrar = (e) => {
    e.preventDefault();
    if (clave === datos.clave) {
      setPaso("abierto");
      setClave("");
    } else {
      setError(true);
    }
  };

  return (
    <>
      <button className="boton-neon cian" onClick={() => setPaso("clave")}>
        <Files size={16} className="pulso" /> Archivos
      </button>
      {paso && (
        <div className="modal" onClick={cerrar}>
          <div className="modal-caja" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            {paso === "clave" ? (
              <form onSubmit={entrar}>
                <h3>Archivos del Canal</h3>
                <p>Ingrese el código de acceso:</p>
                <input
                  type="password"
                  autoFocus
                  value={clave}
                  onChange={(e) => {
                    setClave(e.target.value);
                    setError(false);
                  }}
                  placeholder="••••••••••••"
                />
                {error && <p className="modal-error">Contraseña incorrecta. Te estamos observando.</p>}
                <div className="modal-botones">
                  <button type="submit">Entrar</button>
                  <button type="button" onClick={cerrar}>
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h3>
                  <Files /> Archivos del Canal
                </h3>
                <p>{datos.descripcion}</p>
                <ul className="lista-archivos">
                  {datos.items.map((it) => (
                    <li key={it.url}>
                      <a href={it.url} target="_blank" rel="noopener noreferrer">
                        {it.texto}
                      </a>
                    </li>
                  ))}
                </ul>
                <div className="modal-botones">
                  <button onClick={cerrar}>Cerrar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Zona invisible que se mueve por la pantalla; si alguien la encuentra, ve una imagen.
function BotonEscondido({ imagenes }) {
  const [pos, setPos] = useState({ top: 50, left: 50 });
  const [imagen, setImagen] = useState(null);
  const lista = useMemo(() => imagenes || [], [imagenes]);

  useEffect(() => {
    const id = setInterval(() => setPos({ top: Math.random() * 80 + 10, left: Math.random() * 80 + 10 }), 2000);
    return () => clearInterval(id);
  }, []);

  if (!lista.length) return null;
  return (
    <>
      <button
        className="boton-escondido"
        style={{ top: `${pos.top}%`, left: `${pos.left}%` }}
        onClick={() => setImagen(lista[Math.floor(Math.random() * lista.length)])}
        tabIndex={-1}
        aria-hidden="true"
      />
      {imagen && (
        <div className="modal" onClick={() => setImagen(null)}>
          <img className="imagen-oculta" src={ruta(imagen)} alt="" />
        </div>
      )}
    </>
  );
}
