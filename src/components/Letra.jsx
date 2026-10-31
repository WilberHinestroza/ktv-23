import { useEffect, useRef, useState } from "react";
import { ruta } from "../contenido";

// Letras de canciones. En radio.json, una canción puede tener "letra": "letras/archivo.lrc".
// Formato .lrc: cada línea empieza con su tiempo, ej. "[00:12.50] Primera línea".
// Un .txt sin tiempos también sirve: se muestra completo, sin seguir la canción.
const cache = new Map();

export function parsearLetra(texto) {
  const lineas = [];
  for (const cruda of texto.split(/\r?\n/)) {
    const tiempos = [...cruda.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)];
    const frase = cruda.replace(/\[[^\]]*\]/g, "").trim();
    if (!tiempos.length) {
      if (frase && !/^\[\w+:/.test(cruda)) lineas.push({ t: null, frase });
      continue;
    }
    for (const [, m, s] of tiempos) lineas.push({ t: Number(m) * 60 + Number(s), frase });
  }
  const sincronizada = lineas.some((l) => l.t !== null);
  if (sincronizada) lineas.sort((a, b) => (a.t ?? 0) - (b.t ?? 0));
  return { lineas: lineas.filter((l) => !sincronizada || l.t !== null), sincronizada };
}

export function useLetra(archivo) {
  const [letra, setLetra] = useState(() => (archivo ? cache.get(archivo) || null : null));
  useEffect(() => {
    if (!archivo) return setLetra(null);
    if (cache.has(archivo)) return setLetra(cache.get(archivo));
    let vivo = true;
    fetch(ruta(archivo))
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((t) => {
        const l = parsearLetra(t);
        cache.set(archivo, l);
        if (vivo) setLetra(l);
      })
      .catch(() => vivo && setLetra(null));
    return () => {
      vivo = false;
    };
  }, [archivo]);
  return letra;
}

// `segundo`: por dónde va la canción. Sin él, muestra la letra completa.
export default function Letra({ archivo, segundo, compacta }) {
  const letra = useLetra(archivo);
  const activaRef = useRef(null);
  let actual = -1;
  if (letra?.sincronizada && segundo != null) {
    letra.lineas.forEach((l, i) => {
      if (l.t <= segundo) actual = i;
    });
  }
  useEffect(() => {
    activaRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [actual]);

  if (!letra?.lineas.length) return null;
  if (compacta) {
    if (!letra.sincronizada || segundo == null) return null;
    // Solo la línea actual y la siguiente (debajo del reproductor)
    const ahora = letra.lineas[actual]?.frase || "♪";
    const sigue = letra.lineas[actual + 1]?.frase || "";
    return (
      <div className="letra-compacta" aria-live="polite">
        <p className="letra-actual">{ahora}</p>
        {sigue && <p className="letra-siguiente">{sigue}</p>}
      </div>
    );
  }
  return (
    <div className={`letra ${letra.sincronizada && segundo != null ? "sincronizada" : ""}`}>
      {letra.lineas.map((l, i) => (
        <p key={i} ref={i === actual ? activaRef : null} className={i === actual ? "activa" : i < actual ? "pasada" : ""}>
          {l.frase || "♪"}
        </p>
      ))}
    </div>
  );
}
