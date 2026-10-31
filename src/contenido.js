import { useEffect, useState } from "react";

// Convierte una ruta de /public (ej. "cover/x.webp") en una URL que funciona en GitHub Pages.
// Las URLs completas (https://...) se dejan igual.
export function ruta(archivo) {
  if (!archivo) return "";
  if (/^https?:\/\//.test(archivo)) return archivo;
  return `${process.env.PUBLIC_URL}/${archivo.split("/").map(encodeURIComponent).join("/")}`;
}

// Lee un archivo de public/contenido/. "no-cache" para que los cambios se vean al publicar.
export async function cargarJSON(nombre) {
  const r = await fetch(`${process.env.PUBLIC_URL}/contenido/${nombre}`, { cache: "no-cache" });
  if (!r.ok) throw new Error(`No se pudo cargar contenido/${nombre} (${r.status})`);
  return r.json();
}

export function useContenido(nombre) {
  const [estado, setEstado] = useState({ datos: null, error: null });
  useEffect(() => {
    if (!nombre) return;
    let vivo = true;
    setEstado({ datos: null, error: null });
    cargarJSON(nombre)
      .then((datos) => vivo && setEstado({ datos, error: null }))
      .catch((e) => vivo && setEstado({ datos: null, error: e.message }));
    return () => {
      vivo = false;
    };
  }, [nombre]);
  return estado;
}
