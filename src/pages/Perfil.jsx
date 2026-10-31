import { ExternalLink } from "lucide-react";
import { ruta, useContenido } from "../contenido";

export default function Perfil({ seccion }) {
  const { datos, error } = useContenido(seccion.archivo);

  if (error) return <p className="aviso">{error}</p>;
  if (!datos) return <div className="cargando">Cargando…</div>;

  return (
    <section className="contenedor perfil">
      {datos.foto && <img className="perfil-foto" src={ruta(datos.foto)} alt={datos.nombre} />}
      <div>
        <h1 className="titulo-seccion">{datos.nombre}</h1>
        {datos.alias && <p className="perfil-alias">aka {datos.alias}</p>}
        {(datos.bio || []).map((p, i) => (
          <p key={i} className="intro">
            {p}
          </p>
        ))}
        {datos.habilidades?.length > 0 && (
          <ul className="etiquetas grandes">
            {datos.habilidades.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        )}
        <div className="tarjeta-enlaces">
          {(datos.enlaces || []).map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer">
              {l.texto} <ExternalLink size={14} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
