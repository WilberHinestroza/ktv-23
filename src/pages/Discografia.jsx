import { useState } from "react";
import { AudioLines, ExternalLink, Radio } from "lucide-react";
import { useRadio } from "../radio/RadioContext";
import { ruta } from "../contenido";
import { Galeria, LineaDeTiempo, Numeros, ProximoLanzamiento } from "../components/VistasMusica";

const VISTAS = [
  ["discos", "Discos"],
  ["linea", "Línea de tiempo"],
  ["galeria", "Galería"],
  ["numeros", "Números"],
];

const formatoTiempo = (seg) =>
  seg > 0 ? `${Math.floor(seg / 60)}:${String(Math.floor(seg % 60)).padStart(2, "0")}` : "";

const formatoFecha = (album) => {
  if (album.fecha) {
    return new Date(`${album.fecha}T12:00:00`).toLocaleDateString("es", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  return album.anio ? String(album.anio) : "Inédito";
};

function Enlaces({ album }) {
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

// Toda la discografía de radio.json: lo que suena en la radio y lo que aún no tiene audio.
export default function Discografia({ seccion }) {
  const { radio, enVivo, sintonizado } = useRadio();
  const [filtro, setFiltro] = useState("todo");
  const [vista, setVista] = useState("discos");
  if (!radio) return <div className="cargando">Cargando…</div>;

  const albumes = radio.albumes || [];
  const todas = radio.canciones;
  const sonandoId = enVivo?.cancion.id;
  const temasDe = (a) => todas.filter((c) => c.album === a.id);
  const conAudio = (a) => temasDe(a).some((c) => c.duracion > 0);

  const visibles = albumes.filter((a) => filtro === "todo" || conAudio(a));
  const largos = visibles.filter((a) => a.tipo !== "Sencillo");
  const sencillos = visibles.filter((a) => a.tipo === "Sencillo");
  const sueltas = todas.filter((c) => !albumes.some((a) => a.id === c.album));

  return (
    <section className="contenedor">
      <h1 className="titulo-seccion">{seccion.titulo}</h1>
      <p className="intro">
        {albumes.length} lanzamientos y {todas.length} canciones. Lo que tiene audio también suena en {radio.nombre}.
      </p>
      <ProximoLanzamiento datos={radio.proximoLanzamiento} />
      <div className="pestanas vistas-musica" role="tablist">
        {VISTAS.map(([id, texto]) => (
          <button
            key={id}
            role="tab"
            aria-selected={vista === id}
            className={vista === id ? "activo" : ""}
            onClick={() => setVista(id)}
          >
            {texto}
          </button>
        ))}
      </div>
      {vista === "linea" && <LineaDeTiempo albumes={albumes} canciones={todas} />}
      {vista === "galeria" && <Galeria albumes={albumes} />}
      {vista === "numeros" && <Numeros albumes={albumes} canciones={todas} />}
      {vista === "discos" && (
        <>
          <div className="filtros" role="group" aria-label="Filtrar discografía">
            <button className={filtro === "todo" ? "chip activo" : "chip"} onClick={() => setFiltro("todo")}>
              Todo
            </button>
            <button className={filtro === "radio" ? "chip activo" : "chip"} onClick={() => setFiltro("radio")}>
              <Radio size={13} /> Suena en la radio
            </button>
          </div>

          {largos.length > 0 && <h2 className="subtitulo-seccion">Álbumes y EPs</h2>}
          <div className="discos">
            {largos.map((album) => {
              const temas = temasDe(album);
              const total = temas.reduce((t, c) => t + (c.duracion || 0), 0);
              const suenaAqui = temas.some((c) => c.id === sonandoId);
              return (
                <article key={album.id} className={`disco ${suenaAqui ? "sonando" : ""}`}>
                  <div className="disco-portada">
                    <img src={ruta(album.portada || radio.portada)} alt={`Portada de ${album.titulo}`} loading="lazy" />
                  </div>
                  <div className="disco-info">
                    <span className="disco-tipo">{album.tipo}</span>
                    <h3>
                      <a href={`#/album/${album.id}`}>{album.titulo}</a>
                    </h3>
                    <p className="disco-meta">
                      {[
                        album.artista,
                        formatoFecha(album),
                        album.genero,
                        `${temas.length} temas`,
                        total ? `${Math.round(total / 60)} min` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {album.descripcion && <p className="disco-desc">{album.descripcion}</p>}
                    <ol className={`temas ${temas.length < 6 ? "una-columna" : ""}`}>
                      {temas.map((c, i) => (
                        <li key={c.id} className={c.id === sonandoId ? "activo" : c.duracion > 0 ? "" : "pendiente"}>
                          <span className="tema-n">
                            {c.id === sonandoId ? (
                              <AudioLines size={14} className={sintonizado ? "pulso" : ""} />
                            ) : (
                              i + 1
                            )}
                          </span>
                          <a className="tema-titulo" href={`#/cancion/${c.id}`}>
                            {c.titulo}
                            {c.artista !== album.artista && <small> — {c.artista}</small>}
                          </a>
                          <span className="tema-dur">{formatoTiempo(c.duracion)}</span>
                        </li>
                      ))}
                    </ol>
                    <div className="disco-acciones">
                      {suenaAqui && (
                        <a className="disco-envivo" href="#/radio">
                          Sonando ahora en la radio →
                        </a>
                      )}
                      {!conAudio(album) && <span className="disco-nota">Pronto en la radio</span>}
                      <Enlaces album={album} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {sencillos.length > 0 && <h2 className="subtitulo-seccion">Sencillos</h2>}
          <div className="sencillos">
            {sencillos.map((album) => {
              const tema = temasDe(album)[0];
              const suena = tema && tema.id === sonandoId;
              return (
                <article key={album.id} className={`sencillo ${suena ? "sonando" : ""}`}>
                  <div className="disco-portada">
                    <img src={ruta(album.portada || radio.portada)} alt={`Portada de ${album.titulo}`} loading="lazy" />
                    {suena && (
                      <span className="sencillo-envivo">
                        <AudioLines size={14} className={sintonizado ? "pulso" : ""} /> AL AIRE
                      </span>
                    )}
                  </div>
                  <h3>{tema ? <a href={`#/cancion/${tema.id}`}>{tema.titulo}</a> : album.titulo}</h3>
                  <p className="disco-meta">
                    {formatoFecha(album)}
                    {tema?.duracion > 0 ? ` · ${formatoTiempo(tema.duracion)}` : ""}
                    {album.genero ? ` · ${album.genero}` : ""}
                  </p>
                  <div className="disco-acciones">
                    <Enlaces album={album} />
                  </div>
                </article>
              );
            })}
          </div>

          {sueltas.length > 0 && filtro === "todo" && (
            <>
              <h2 className="subtitulo-seccion">Otras canciones</h2>
              <ol className="temas una-columna">
                {sueltas.map((c, i) => (
                  <li key={c.id} className={c.id === sonandoId ? "activo" : ""}>
                    <span className="tema-n">{i + 1}</span>
                    <span className="tema-titulo">{c.titulo}</span>
                    <span className="tema-dur">{formatoTiempo(c.duracion)}</span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </>
      )}
    </section>
  );
}
