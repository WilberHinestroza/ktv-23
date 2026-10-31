import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { ruta } from "../contenido";
import { FavoritasDeLaGente } from "../envivo/Comunidad";

const anioDe = (a) => (a.fecha || (a.anio ? String(a.anio) : "")).slice(0, 4);
const fechaOrden = (a) => a.fecha || (a.anio ? `${a.anio}-06-30` : "9999");

// ---------- Línea de tiempo: los lanzamientos por año ----------
export function LineaDeTiempo({ albumes, canciones }) {
  const ordenados = [...albumes].sort((a, b) => fechaOrden(b).localeCompare(fechaOrden(a)));
  const porAnio = new Map();
  for (const a of ordenados) {
    const anio = anioDe(a) || "Próximamente";
    if (!porAnio.has(anio)) porAnio.set(anio, []);
    porAnio.get(anio).push(a);
  }
  return (
    <ol className="linea-tiempo">
      {[...porAnio].map(([anio, lista]) => (
        <li key={anio}>
          <span className="linea-anio">{anio}</span>
          <div className="linea-items">
            {lista.map((a) => {
              const n = canciones.filter((c) => c.album === a.id).length;
              return (
                <a key={a.id} className="linea-item" href={`#/album/${a.id}`}>
                  <img src={ruta(a.portada)} alt="" loading="lazy" />
                  <span>
                    <strong>{a.titulo}</strong>
                    <small>
                      {a.tipo} · {n} tema{n === 1 ? "" : "s"}
                      {a.fecha ? ` · ${new Date(`${a.fecha}T12:00:00`).toLocaleDateString("es", { day: "numeric", month: "short" })}` : ""}
                    </small>
                  </span>
                </a>
              );
            })}
          </div>
        </li>
      ))}
    </ol>
  );
}

// ---------- Galería de portadas ----------
export function Galeria({ albumes }) {
  const [abierta, setAbierta] = useState(null);
  const ordenados = [...albumes].sort((a, b) => fechaOrden(b).localeCompare(fechaOrden(a)));
  return (
    <>
      <div className="galeria">
        {ordenados.map((a) => (
          <button key={a.id} className="galeria-item" onClick={() => setAbierta(a)} title={a.titulo}>
            <img src={ruta(a.portada)} alt={`Portada de ${a.titulo}`} loading="lazy" />
            <span>{a.titulo}</span>
          </button>
        ))}
      </div>
      {abierta && (
        <div className="modal" onClick={() => setAbierta(null)}>
          <figure className="galeria-grande" onClick={(e) => e.stopPropagation()}>
            <img src={ruta(abierta.portada)} alt={`Portada de ${abierta.titulo}`} />
            <figcaption>
              <strong>{abierta.titulo}</strong> · {abierta.tipo} {anioDe(abierta)}{" "}
              <a href={`#/album/${abierta.id}`}>Ver canciones →</a>
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}

// ---------- Los números de la discografía ----------
// Saca colaboradores de títulos como "Canción (feat. A & B)"
export function colaboradoresDe(canciones) {
  const cuenta = new Map();
  for (const c of canciones) {
    const m = /\((?:feat\.?|ft\.?)\s+([^)]+)\)/i.exec(c.titulo);
    if (!m) continue;
    for (const nombre of m[1].split(/\s*(?:&|,|\by\b|\bx\b)\s*/i)) {
      const limpio = nombre.trim();
      if (!limpio) continue;
      const clave = limpio.toLowerCase();
      const previo = cuenta.get(clave);
      cuenta.set(clave, { nombre: previo?.nombre || limpio, n: (previo?.n || 0) + 1 });
    }
  }
  return [...cuenta.values()].sort((a, b) => b.n - a.n);
}

function Barras({ datos }) {
  const max = Math.max(1, ...datos.map(([, v]) => v));
  return (
    <ul className="barras">
      {datos.map(([etiqueta, valor]) => (
        <li key={etiqueta}>
          <span className="barra-etiqueta">{etiqueta}</span>
          <span className="barra-pista">
            <span className="barra-relleno" style={{ width: `${(valor / max) * 100}%` }} />
          </span>
          <span className="barra-valor">{valor}</span>
        </li>
      ))}
    </ul>
  );
}

export function Numeros({ albumes, canciones }) {
  const conAudio = canciones.filter((c) => c.duracion > 0);
  const minutos = Math.round(conAudio.reduce((t, c) => t + c.duracion, 0) / 60);
  const porTipo = ["Álbum", "EP", "Sencillo"].map((t) => [t, albumes.filter((a) => a.tipo === t).length]);
  const anioCancion = (c) => anioDe(albumes.find((a) => a.id === c.album) || {}) || "Sin fecha";
  const anios = [...new Set(canciones.map(anioCancion))].sort();
  const porAnio = anios.map((a) => [a, canciones.filter((c) => anioCancion(c) === a).length]);
  const temas = [...new Set(canciones.flatMap((c) => c.temas || []))];
  const porTema = temas.map((t) => [t, canciones.filter((c) => (c.temas || []).includes(t)).length]).sort((a, b) => b[1] - a[1]);
  const colaboradores = colaboradoresDe(canciones);
  const largas = [...conAudio].sort((a, b) => b.duracion - a.duracion);
  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

  return (
    <div className="numeros">
      <div className="estadisticas grandes">
        <div>
          <strong>{albumes.length}</strong>
          <small>lanzamientos</small>
        </div>
        <div>
          <strong>{canciones.length}</strong>
          <small>canciones</small>
        </div>
        <div>
          <strong>{Math.floor(minutos / 60)} h {minutos % 60} min</strong>
          <small>de música en la radio</small>
        </div>
        <div>
          <strong>{colaboradores.length}</strong>
          <small>colaboradores</small>
        </div>
      </div>
      <div className="numeros-rejilla">
        <section>
          <h3 className="mini-titulo">Lanzamientos por tipo</h3>
          <Barras datos={porTipo} />
        </section>
        <section>
          <h3 className="mini-titulo">Canciones por año</h3>
          <Barras datos={porAnio} />
        </section>
        <section>
          <h3 className="mini-titulo">¿De qué hablan?</h3>
          <Barras datos={porTema} />
        </section>
        <section>
          <h3 className="mini-titulo">Colaboraciones</h3>
          <Barras datos={colaboradores.slice(0, 8).map((c) => [c.nombre, c.n])} />
        </section>
        <FavoritasDeLaGente canciones={canciones} />
        <section>
          <h3 className="mini-titulo">Récords</h3>
          <ul className="records">
            {largas[0] && (
              <li>
                La más larga: <a href={`#/cancion/${largas[0].id}`}>{largas[0].titulo}</a> ({mmss(largas[0].duracion)})
              </li>
            )}
            {largas[largas.length - 1] && (
              <li>
                La más corta: <a href={`#/cancion/${largas[largas.length - 1].id}`}>{largas[largas.length - 1].titulo}</a> ({mmss(largas[largas.length - 1].duracion)})
              </li>
            )}
            <li>Promedio por canción: {mmss(conAudio.reduce((t, c) => t + c.duracion, 0) / Math.max(1, conAudio.length))}</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

// ---------- Cuenta regresiva al próximo lanzamiento ----------
// En radio.json: "proximoLanzamiento": { "titulo": "…", "fecha": "2026-12-01T00:00:00-05:00", "portada": "…", "enlace": "…" }
export function ProximoLanzamiento({ datos }) {
  const [ahora, setAhora] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const fecha = datos?.fecha ? new Date(datos.fecha).getTime() : NaN;
  if (!datos?.titulo || !Number.isFinite(fecha) || fecha < ahora - 86400000) return null;
  const falta = Math.max(0, fecha - ahora);
  const partes = [
    [Math.floor(falta / 86400000), "días"],
    [Math.floor((falta / 3600000) % 24), "horas"],
    [Math.floor((falta / 60000) % 60), "min"],
    [Math.floor((falta / 1000) % 60), "seg"],
  ];
  return (
    <section className="proximo-lanzamiento">
      {datos.portada && <img src={ruta(datos.portada)} alt="" />}
      <div>
        <span className="disco-tipo">{falta ? "Próximo lanzamiento" : "¡Ya salió!"}</span>
        <h2>{datos.titulo}</h2>
        {falta > 0 && (
          <div className="cuenta">
            {partes.map(([n, t]) => (
              <span key={t}>
                <strong>{String(n).padStart(2, "0")}</strong>
                <small>{t}</small>
              </span>
            ))}
          </div>
        )}
        {datos.enlace && (
          <a className="boton-plataforma spotify" href={datos.enlace} target="_blank" rel="noopener noreferrer">
            {falta ? "Pre-guardar" : "Escuchar"} <ExternalLink size={13} />
          </a>
        )}
      </div>
    </section>
  );
}
