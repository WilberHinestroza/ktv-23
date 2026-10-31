// Calcula la duración de cada canción de public/contenido/radio.json y la guarda en el mismo archivo.
// Se ejecuta solo antes de cada build (npm run build / npm run deploy).
// Uso manual: npm run duraciones
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, basename, join } from "node:path";
import { parseFile } from "music-metadata";

const PUBLIC = "public";
const RADIO = join(PUBLIC, "contenido", "radio.json");

// Windows no distingue mayúsculas, pero GitHub Pages sí: comprobamos el nombre exacto.
function existeExacto(archivo) {
  const ruta = join(PUBLIC, archivo);
  const carpeta = dirname(ruta);
  return existsSync(carpeta) && readdirSync(carpeta).includes(basename(ruta));
}

const radio = JSON.parse(readFileSync(RADIO, "utf8"));
const intros = (radio.programas || [])
  .filter((p) => p.intro?.archivo)
  .map((p) => Object.assign(p.intro, { titulo: p.intro.titulo || `Intro de ${p.titulo}` }));
const loc = radio.locutor || {};
const clipsLocutor = [
  ...Object.values(loc.saludos || {}).flat(),
  ...(loc.compania?.archivos || []),
  ...(loc.cunas?.archivos || []),
  ...radio.canciones.flatMap((c) => c.presentaciones || (c.presentacion ? [c.presentacion] : [])),
];
const lista = [...radio.canciones, ...(radio.ocultas || []), ...intros, ...clipsLocutor];
let cambios = 0;
let problemas = 0;

let pendientes = 0;
for (const c of lista) {
  let duracion = null;
  if (!c.archivo) {
    pendientes++; // canción sin audio todavía: sale en la discografía, no suena en la radio
  } else if (!existeExacto(c.archivo)) {
    problemas++;
    console.warn(`⚠  No existe (revisa mayúsculas): public/${c.archivo}  → "${c.titulo || c.archivo}" se saltará`);
  } else {
    const meta = await parseFile(join(PUBLIC, c.archivo), { duration: true });
    duracion = Math.round((meta.format.duration || 0) * 1000) / 1000 || null;
  }
  if (c.duracion !== duracion) {
    c.duracion = duracion;
    cambios++;
  }
}

// Revisar que lo que se menciona exista (errores comunes al editar a mano)
const avisar = (msg) => {
  problemas++;
  console.warn(`⚠  ${msg}`);
};
const idsAlbum = new Set((radio.albumes || []).map((a) => a.id));
const idsCancion = new Set(radio.canciones.map((c) => c.id));
const generos = new Set([
  ...(radio.albumes || []).map((a) => a.genero),
  ...radio.canciones.map((c) => c.genero),
].filter(Boolean));
const vistos = new Set();
for (const c of [...radio.canciones, ...(radio.ocultas || [])]) {
  if (vistos.has(c.id)) avisar(`El id ${c.id} está repetido ("${c.titulo}")`);
  vistos.add(c.id);
  if (c.album && !idsAlbum.has(c.album)) avisar(`"${c.titulo}" usa el álbum "${c.album}", que no existe en "albumes"`);
}
if (pendientes) console.log(`ℹ  ${pendientes} canción(es) sin audio todavía (no suenan en la radio)`);
for (const a of radio.albumes || []) {
  if (a.portada && !/^https?:/.test(a.portada) && !existeExacto(a.portada)) avisar(`No existe la portada del álbum "${a.titulo}": public/${a.portada}`);
}
const hora = /^([01]\d|2[0-3]):[0-5]\d$/;
for (const p of radio.programas || []) {
  if (!hora.test(p.desde) || !hora.test(p.hasta)) avisar(`Programa "${p.titulo}": usa horas como "06:00" en desde/hasta`);
  for (const a of p.albumes || []) if (!idsAlbum.has(a)) avisar(`Programa "${p.titulo}": el álbum "${a}" no existe`);
  for (const g of p.generos || []) if (!generos.has(g)) avisar(`Programa "${p.titulo}": ninguna canción tiene el género "${g}"`);
  for (const id of p.canciones || []) if (!idsCancion.has(id)) avisar(`Programa "${p.titulo}": la canción ${id} no existe`);
}

if (cambios) {
  writeFileSync(RADIO, JSON.stringify(radio, null, 2) + "\n");
  console.log(`✔ radio.json actualizado (${cambios} duraciones cambiaron)`);
} else {
  console.log("✔ Duraciones al día");
}
if (problemas) console.warn(`⚠  ${problemas} problema(s) en radio.json`);
