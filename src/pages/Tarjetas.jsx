import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { ruta, useContenido } from "../contenido";

// Página de tarjetas genérica: sirve para proyectos, videos, publicaciones, etc.
export default function Tarjetas({ seccion }) {
  const { datos, error } = useContenido(seccion.archivo);
  const [filtro, setFiltro] = useState(null);

  if (error) return <p className="aviso">{error}</p>;
  if (!datos) return <div className="cargando">Cargando…</div>;

  const etiquetas = [...new Set(datos.items.flatMap((i) => i.etiquetas || []))];
  const items = filtro ? datos.items.filter((i) => (i.etiquetas || []).includes(filtro)) : datos.items;

  return (
    <section className="contenedor">
      <h1 className="titulo-seccion">{datos.titulo || seccion.titulo}</h1>
      {datos.intro && <p className="intro">{datos.intro}</p>}

      {etiquetas.length > 1 && (
        <div className="filtros" role="group" aria-label="Filtrar por etiqueta">
          <button className={!filtro ? "chip activo" : "chip"} onClick={() => setFiltro(null)}>
            Todos
          </button>
          {etiquetas.map((e) => (
            <button key={e} className={filtro === e ? "chip activo" : "chip"} onClick={() => setFiltro(e)}>
              {e}
            </button>
          ))}
        </div>
      )}

      <div className="rejilla">
        {items.map((item) => (
          <article key={item.titulo} className="tarjeta">
            {item.imagen && <img className="tarjeta-imagen" src={ruta(item.imagen)} alt="" loading="lazy" />}
            <div className="tarjeta-cuerpo">
              <h2>{item.titulo}</h2>
              {item.fecha && <time className="tarjeta-fecha">{item.fecha}</time>}
              <p>{item.descripcion}</p>
              {item.etiquetas?.length > 0 && (
                <ul className="etiquetas">
                  {item.etiquetas.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              )}
              {item.enlaces?.length > 0 && (
                <div className="tarjeta-enlaces">
                  {item.enlaces.map((l) => (
                    <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer">
                      {l.texto} <ExternalLink size={14} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
