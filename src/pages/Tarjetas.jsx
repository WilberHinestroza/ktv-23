import { useEffect, useState } from "react";
import { ExternalLink, GitFork, Star } from "lucide-react";
import { ruta, useContenido } from "../contenido";

// Repos públicos de GitHub (se guardan en la sesión para no pedirlos cada vez: GitHub limita a 60 por hora)
function useRepos(usuario) {
  const [repos, setRepos] = useState(null);
  useEffect(() => {
    if (!usuario) return;
    const clave = `repos-${usuario}`;
    try {
      const guardado = JSON.parse(sessionStorage.getItem(clave));
      if (guardado) return setRepos(guardado);
    } catch {}
    let vivo = true;
    fetch(`https://api.github.com/users/${encodeURIComponent(usuario)}/repos?sort=updated&per_page=100`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((lista) => {
        const limpios = lista
          .filter((x) => !x.fork && !x.archived)
          .map(({ name, description, html_url, homepage, language, stargazers_count, forks_count, pushed_at }) => ({
            name,
            description,
            html_url,
            homepage,
            language,
            stargazers_count,
            forks_count,
            pushed_at,
          }));
        try {
          sessionStorage.setItem(clave, JSON.stringify(limpios));
        } catch {}
        if (vivo) setRepos(limpios);
      })
      .catch(() => vivo && setRepos([]));
    return () => {
      vivo = false;
    };
  }, [usuario]);
  return repos;
}

function MasEnGitHub({ usuario, items }) {
  const repos = useRepos(usuario);
  if (!usuario) return null;
  const yaListados = new Set(
    items.flatMap((i) => (i.enlaces || []).map((l) => l.url.toLowerCase().replace(/\/$/, "")))
  );
  const otros = (repos || []).filter((r) => !yaListados.has(r.html_url.toLowerCase()));
  if (repos && !otros.length) return null;
  return (
    <>
      <h2 className="subtitulo-seccion">Más en GitHub</h2>
      {!repos ? (
        <p className="intro">Cargando repositorios…</p>
      ) : (
        <div className="rejilla repos">
          {otros.map((r) => (
            <article key={r.name} className="tarjeta repo">
              <div className="tarjeta-cuerpo">
                <h2>{r.name}</h2>
                <p>{r.description || "Sin descripción."}</p>
                <p className="repo-meta">
                  {r.language && <span className="repo-lenguaje">{r.language}</span>}
                  {r.stargazers_count > 0 && (
                    <span>
                      <Star size={13} /> {r.stargazers_count}
                    </span>
                  )}
                  {r.forks_count > 0 && (
                    <span>
                      <GitFork size={13} /> {r.forks_count}
                    </span>
                  )}
                  <span>Actualizado {new Date(r.pushed_at).toLocaleDateString("es", { month: "short", year: "numeric" })}</span>
                </p>
                <div className="tarjeta-enlaces">
                  <a href={r.html_url} target="_blank" rel="noopener noreferrer">
                    Código <ExternalLink size={14} />
                  </a>
                  {r.homepage && (
                    <a href={r.homepage} target="_blank" rel="noopener noreferrer">
                      Demo <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

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
      <MasEnGitHub usuario={datos.github} items={datos.items} />
    </section>
  );
}
