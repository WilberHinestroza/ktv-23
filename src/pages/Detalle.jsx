import { useState } from "react";
import { ArrowLeft, AudioLines, ExternalLink, Play, Share2 } from "lucide-react";
import { useRadio } from "../radio/RadioContext";
import { ruta } from "../contenido";
import { BotonAviso, BotonFavorito, Dedicar } from "../components/Extras";
import { cuando, useAgenda } from "../components/PanelesRadio";
import Letra from "../components/Letra";

const formatoTiempo = (seg) => (seg > 0 ? `${Math.floor(seg / 60)}:${String(Math.floor(seg % 60)).padStart(2, "0")}` : "");
const anioDe = (a) => (a?.fecha || (a?.anio ? String(a.anio) : "")).slice(0, 4);

function Enlaces({ album }) {
  if (!album) return null;
  return (
    <>
      {album.spotify && (
        <a className="boton-plataforma spotify" href={album.spotify} target="_blank" rel="noopener noreferrer">
          Spotify <ExternalLink size={13} />
        </a>
      )}
      {album.youtube && (
        <a className="boton-plataforma youtube" href={album.youtube} target="_blank" rel="noopener noreferrer">
          YouTube Music <ExternalLink size={13} />
        </a>
      )}
    </>
  );
}

function CompartirEnlace({ texto }) {
  const [copiado, setCopiado] = useState(false);
  const compartir = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: texto, url });
      } catch {}
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {}
  };
  return (
    <button className="boton-compartir" onClick={compartir}>
      <Share2 size={16} /> <span>{copiado ? "¡Enlace copiado!" : "Compartir"}</span>
    </button>
  );
}

// Estado en la radio: sonando ahora o la próxima hora al aire
function EnLaRadio({ cancion }) {
  const { enVivo, ahora, sintonizado, sintonizar } = useRadio();
  const agenda = useAgenda();
  if (!cancion.duracion) return <p className="detalle-estado">Todavía no suena en la radio.</p>;
  if (enVivo?.cancion.id === cancion.id) {
    return (
      <p className="detalle-estado sonando">
        <AudioLines size={16} className="pulso" /> Sonando ahora en la radio
        {!sintonizado && (
          <button className="boton-mini" onClick={sintonizar}>
            <Play size={14} /> Escuchar
          </button>
        )}
      </p>
    );
  }
  const t = agenda.get(cancion.id);
  return (
    <p className="detalle-estado">
      {t ? `Próxima vez en la radio: ${cuando(t, ahora)}` : "No suena esta semana."}
      {t && <BotonAviso cancion={cancion} />}
    </p>
  );
}

export function CancionPagina({ id }) {
  const { radio, canciones, enVivo, ahora } = useRadio();
  if (!radio) return <div className="cargando">Cargando…</div>;
  const cancion = canciones.find((c) => String(c.id) === id) || radio.canciones.find((c) => String(c.id) === id);
  if (!cancion) return <NoExiste />;
  const album = (radio.albumes || []).find((a) => a.id === cancion.album);
  const hermanas = radio.canciones.filter((c) => c.album === cancion.album && c.id !== cancion.id);
  const portada = ruta(cancion.portada || album?.portada || radio.portada);
  const sonando = enVivo?.cancion.id === cancion.id;
  const segundo = sonando ? (ahora - enVivo.inicioMs) / 1000 : null;

  return (
    <section className="contenedor detalle">
      <a className="volver" href="#/musica">
        <ArrowLeft size={16} /> Música
      </a>
      <div className="detalle-cabecera">
        <img className="detalle-portada" src={portada} alt={`Portada de ${cancion.titulo}`} />
        <div>
          <span className="disco-tipo">Canción</span>
          <h1 className="titulo-seccion">{cancion.titulo}</h1>
          <p className="disco-meta">
            {[
              cancion.artista,
              album && album.tipo !== "Sencillo" ? album.titulo : null,
              anioDe(album),
              cancion.genero || album?.genero,
              formatoTiempo(cancion.duracion),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {cancion.temas?.length > 0 && (
            <ul className="etiquetas">
              {cancion.temas.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
          <EnLaRadio cancion={cancion} />
          <div className="disco-acciones">
            <BotonFavorito cancion={cancion} />
            <Dedicar cancion={cancion} />
            <CompartirEnlace texto={cancion.titulo} />
            <Enlaces album={album} />
          </div>
        </div>
      </div>

      {cancion.historia && (
        <>
          <h2 className="subtitulo-seccion">Detrás de la canción</h2>
          <p className="intro">{cancion.historia}</p>
        </>
      )}
      {cancion.letra && (
        <>
          <h2 className="subtitulo-seccion">Letra</h2>
          <Letra archivo={cancion.letra} segundo={segundo} />
        </>
      )}

      {hermanas.length > 0 && album && (
        <>
          <h2 className="subtitulo-seccion">
            Más de <a href={`#/album/${album.id}`}>{album.titulo}</a>
          </h2>
          <ListaCanciones lista={hermanas} />
        </>
      )}
    </section>
  );
}

function ListaCanciones({ lista, numerada }) {
  const { enVivo, ahora } = useRadio();
  const agenda = useAgenda();
  return (
    <ol className="temas una-columna lista-detalle">
      {lista.map((c, i) => {
        const t = agenda.get(c.id);
        const sonando = enVivo?.cancion.id === c.id;
        return (
          <li key={c.id} className={sonando ? "activo" : c.duracion > 0 ? "" : "pendiente"}>
            <span className="tema-n">{sonando ? <AudioLines size={14} /> : numerada ? i + 1 : "♪"}</span>
            <a className="tema-titulo" href={`#/cancion/${c.id}`}>
              {c.titulo}
            </a>
            <small className="tema-cuando">{sonando ? "Al aire" : t ? cuando(t, ahora) : ""}</small>
            <BotonFavorito cancion={c} chico />
            <span className="tema-dur">{formatoTiempo(c.duracion)}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function AlbumPagina({ id }) {
  const { radio } = useRadio();
  if (!radio) return <div className="cargando">Cargando…</div>;
  const album = (radio.albumes || []).find((a) => a.id === id);
  if (!album) return <NoExiste />;
  const temas = radio.canciones.filter((c) => c.album === album.id);
  const total = temas.reduce((t, c) => t + (c.duracion || 0), 0);

  return (
    <section className="contenedor detalle">
      <a className="volver" href="#/musica">
        <ArrowLeft size={16} /> Música
      </a>
      <div className="detalle-cabecera">
        <img className="detalle-portada" src={ruta(album.portada || radio.portada)} alt={`Portada de ${album.titulo}`} />
        <div>
          <span className="disco-tipo">{album.tipo}</span>
          <h1 className="titulo-seccion">{album.titulo}</h1>
          <p className="disco-meta">
            {[album.artista, anioDe(album) || "Inédito", album.genero, `${temas.length} temas`, total ? `${Math.round(total / 60)} min` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {album.descripcion && <p className="intro">{album.descripcion}</p>}
          <div className="disco-acciones">
            <CompartirEnlace texto={album.titulo} />
            <Enlaces album={album} />
          </div>
        </div>
      </div>
      <h2 className="subtitulo-seccion">Canciones</h2>
      <ListaCanciones lista={temas} numerada />
    </section>
  );
}

function NoExiste() {
  return (
    <section className="contenedor">
      <h1 className="titulo-seccion">Señal perdida</h1>
      <p className="intro">Esa canción o álbum no existe (o todavía no ha salido).</p>
      <a className="volver" href="#/musica">
        <ArrowLeft size={16} /> Volver a Música
      </a>
    </section>
  );
}
