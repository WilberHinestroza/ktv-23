import { useEffect, useState } from "react";
import { RadioProvider } from "./radio/RadioContext";
import { useContenido } from "./contenido";
import MiniRadio from "./components/MiniRadio";
import RadioPagina from "./pages/RadioPagina";
import Tarjetas from "./pages/Tarjetas";
import Perfil from "./pages/Perfil";
import Discografia from "./pages/Discografia";
import { Ambiente, Atajos, DedicatoriaRecibida, Notificacion } from "./components/Extras";

// Tipos de sección que se pueden usar en public/contenido/sitio.json
const PAGINAS = {
  radio: RadioPagina,
  discografia: Discografia,
  tarjetas: Tarjetas,
  perfil: Perfil,
};

function useHash() {
  // "#/radio?para=…" → "radio" (lo que va después de ? son datos, como una dedicatoria)
  const leer = () => window.location.hash.replace(/^#\/?/, "").split("?")[0];
  const [hash, setHash] = useState(leer);
  useEffect(() => {
    const alCambiar = () => {
      setHash(leer());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", alCambiar);
    return () => window.removeEventListener("hashchange", alCambiar);
  }, []);
  return hash;
}

export default function App() {
  const { datos: sitio, error } = useContenido("sitio.json");
  const hash = useHash();

  if (error) return <p className="aviso">{error}</p>;
  if (!sitio) return <div className="cargando">Sintonizando…</div>;

  const seccion = sitio.secciones.find((s) => s.id === hash) || sitio.secciones[0];
  const Pagina = PAGINAS[seccion.tipo];

  return (
    <RadioProvider>
      <header className="encabezado">
        <a className="logo" href="#/">
          <span className="logo-punto" aria-hidden="true" />
          {sitio.nombre}
        </a>
        <nav className="menu">
          {sitio.secciones.map((s) => (
            <a
              key={s.id}
              href={`#/${s.id}`}
              className={s.id === seccion.id ? "activo" : ""}
              aria-current={s.id === seccion.id ? "page" : undefined}
            >
              {s.titulo}
            </a>
          ))}
        </nav>
      </header>

      <main className={`pagina pagina-${seccion.tipo}`}>
        {Pagina ? (
          <Pagina seccion={seccion} sitio={sitio} />
        ) : (
          <p className="aviso">Tipo de sección desconocido: "{seccion.tipo}"</p>
        )}
      </main>

      {seccion.tipo !== "radio" && <MiniRadio />}
      <Notificacion />
      <DedicatoriaRecibida />
      <Atajos />
      <Ambiente />
    </RadioProvider>
  );
}
