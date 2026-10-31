// Locutor: arma los textos desde scripts/locutor-plantillas.json y genera los audios.
//
//   npm run locutor               → actualiza radio.json y LOCUTOR-GUION.md con los textos
//   npm run locutor -- --voz      → además crea con tu voz clonada los audios que falten
//   npm run locutor -- --limpiar  → borra audios de public/locutor/ que ya no se usan
//   npm run locutor -- --ia       → crea los que falten con las voces de IA de Windows (Raúl y Sabina)
//
// Cada audio se llama según su texto: si cambias una frase, solo se regenera esa.
import { readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, unlinkSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";

const RADIO = "public/contenido/radio.json";
const PLANTILLAS = "scripts/locutor-plantillas.json";
const VOZ = resolve(process.env.LOCUTOR_VOZ || "../voz"); // carpeta con el entorno de Python y tu muestra
const radio = JSON.parse(readFileSync(RADIO, "utf8"));
const args = process.argv.slice(2);

// ---- Cómo se pronuncia ----
const UNIDADES = "cero uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciséis diecisiete dieciocho diecinueve veinte veintiuno veintidós veintitrés veinticuatro veinticinco veintiséis veintisiete veintiocho veintinueve".split(" ");
const DECENAS = { 3: "treinta", 4: "cuarenta", 5: "cincuenta", 6: "sesenta", 7: "setenta", 8: "ochenta", 9: "noventa" };
function menorDeCien(n) {
  if (n < 30) return UNIDADES[n];
  return DECENAS[Math.floor(n / 10)] + (n % 10 ? ` y ${UNIDADES[n % 10]}` : "");
}
function anioEnPalabras(n) {
  if (n >= 2000 && n < 2100) return "dos mil" + (n % 100 ? ` ${menorDeCien(n % 100)}` : "");
  return String(n);
}
function paraDecir(texto, pronunciar) {
  let t = texto;
  for (const clave of Object.keys(pronunciar).sort((a, b) => b.length - a.length)) {
    t = t.split(clave).join(pronunciar[clave]);
  }
  return t
    // Palabras en MAYÚSCULAS con vocales se leen como palabra (BANANERO → Bananero); siglas como CQNSD se deletrean
    .replace(/\b[A-ZÁÉÍÓÚÑ]{4,}\b/g, (w) => (/[AEIOUÁÉÍÓÚ]/.test(w) ? w[0] + w.slice(1).toLowerCase() : w))
    .replace(/\b(20\d\d)\b/g, (_, n) => anioEnPalabras(Number(n)))
    .replace(/\b(\d{1,2})\b/g, (_, n) => menorDeCien(Number(n)));
}

const hash = (s) => createHash("sha1").update(s).digest("hex").slice(0, 10);

// ---- Construir textos desde las plantillas ----
if (existsSync(PLANTILLAS)) {
  const pl = JSON.parse(readFileSync(PLANTILLAS, "utf8"));
  const pronunciar = pl.pronunciar || {};
  const viejo = radio.locutor || {};
  const duraciones = new Map();
  const recordar = (c) => c?.archivo && c.duracion && duraciones.set(c.archivo, c.duracion);
  Object.values(viejo.saludos || {}).flat().forEach(recordar);
  (viejo.compania?.archivos || []).forEach(recordar);
  (viejo.cunas?.archivos || []).forEach(recordar);
  radio.canciones.forEach((c) => (c.presentaciones || []).forEach(recordar));
  (radio.programas || []).forEach((p) => recordar(p.intro));
  (viejo.horas || []).forEach(recordar);

  // Varias voces: cada frase la dice una, elegida siempre igual según el texto
  const voces = pl.voces || {};
  const idsVoz = Object.keys(voces);
  const clip = (grupo, entrada) => {
    const { texto, dias, voz: vozPedida } = typeof entrada === "string" ? { texto: entrada } : entrada;
    const dicho = paraDecir(texto, pronunciar);
    const voz = voces[vozPedida] ? vozPedida : idsVoz[parseInt(hash(grupo + texto).slice(0, 8), 16) % idsVoz.length];
    const archivo = `locutor/${grupo}-${voz ? voz + "-" : ""}${hash(dicho)}.mp3`;
    const c = { archivo, texto };
    if (voz) Object.assign(c, { voz, locutor: voces[voz].nombre });
    if (dicho !== texto) c.dicho = dicho;
    if (dias?.length) c.dias = dias;
    c.duracion = duraciones.get(archivo) ?? null;
    return c;
  };

  const saludos = {};
  for (const [momento, lista] of Object.entries(pl.saludos || {})) {
    saludos[momento] = lista.map((e) => clip(`saludo-${momento}`, e));
  }

  // Presentaciones: algunas plantillas por canción, elegidas siempre igual para la misma canción
  const albumes = new Map((radio.albumes || []).map((a) => [a.id, a]));
  const TIPO = { "Álbum": "el álbum", EP: "el EP", Sencillo: "el sencillo" };
  const pres = pl.presentaciones || {};
  for (const c of radio.canciones) {
    delete c.presentacion;
    delete c.presentaciones;
    if (!c.archivo || !pres.plantillas?.length) continue;
    const a = albumes.get(c.album);
    const anio = (a?.fecha || (a?.anio ? String(a.anio) : "")).slice(0, 4);
    const valores = {
      titulo: c.titulo.replace(/\s*\([^)]*\)/g, ""), // sin "(feat. …)", "(Outro)", etc.
      album: a && a.tipo !== "Sencillo" ? a.titulo.replace(/\s+EP$/i, "") : "",
      tipo: a && a.tipo !== "Sencillo" ? TIPO[a.tipo] || "el álbum" : "",
      anio,
      artista: c.artista,
    };
    const usables = pres.plantillas.filter((p) =>
      [...p.matchAll(/\{(\w+)\}/g)].every(([, v]) => valores[v])
    );
    const orden = [...usables].sort((x, y) => hash(c.id + x).localeCompare(hash(c.id + y)));
    c.presentaciones = orden.slice(0, pres.porCancion || 2).map((p) => {
      const texto = p
        .replace(/\{(\w+)\}/g, (_, v) => valores[v])
        .replace(/\b([Dd])e el\b/g, "$1el")
        .replace(/([?!])\./g, "$1"); // "Será?." → "Será?"
      return clip(`presenta-${c.id}`, texto);
    });
    if (!c.presentaciones.length) delete c.presentaciones;
  }

  // Intro de cada programa: el locutor lo anuncia al empezar
  for (const p of radio.programas || []) {
    const entrada = pl.programas?.[p.id];
    if (entrada) p.intro = { ...clip(`programa-${p.id}`, entrada), titulo: p.titulo };
    else if (p.intro?.archivo?.startsWith("locutor/")) delete p.intro;
  }

  // Hora exacta: una frase por hora (0 a 23), dicha en la hora de quien escucha
  const plantillaHora = pl.horaExacta?.plantillas || [];
  const momentoDe = (h) => (h < 6 ? "de la madrugada" : h < 12 ? "de la mañana" : h < 19 ? "de la tarde" : "de la noche");
  const horas = plantillaHora.length
    ? Array.from({ length: 24 }, (_, h) => {
        const h12 = h % 12 || 12;
        const plantilla = plantillaHora[h % plantillaHora.length];
        const sonLas = h12 === 1 ? "Es la" : "Son las";
        const texto = plantilla
          .replace("{son las}", plantilla.startsWith("{son las}") ? sonLas : sonLas.toLowerCase())
          .replace("{hora}", h12 === 1 ? "una" : String(h12))
          .replace("{momento}", h === 0 ? "de la medianoche" : h === 12 ? "del mediodía" : momentoDe(h));
        return clip("hora", texto);
      })
    : [];

  radio.locutor = {
    activo: viejo.activo ?? true,
    nombre: idsVoz.length ? idsVoz.map((v) => voces[v].nombre).join(" y ") : viejo.nombre || "Wildberry",
    musicaAlHablar: viejo.musicaAlHablar ?? 0.25,
    saludos,
    compania: {
      cadaMinutos: viejo.compania?.cadaMinutos || 20,
      archivos: (pl.compania || []).map((e) => clip("compania", e)),
    },
    cunas: {
      cadaCanciones: pl.cunas?.cadaCanciones || viejo.cunas?.cadaCanciones || 4,
      archivos: (pl.cunas?.textos || []).map((e) => clip("cuna", e)),
    },
    presentaciones: { probabilidad: pres.probabilidad ?? 0.35 },
    horas,
  };
  writeFileSync(RADIO, JSON.stringify(radio, null, 2) + "\n");
}

// ---- Lista de todos los clips ----
const loc = radio.locutor || {};
const grupos = [
  ...Object.entries(loc.saludos || {}).map(([momento, clips]) => [`Saludo · ${momento}`, clips]),
  [`Compañía (cada ${loc.compania?.cadaMinutos || 20} min)`, loc.compania?.archivos || []],
  [`Cuñas (cada ${loc.cunas?.cadaCanciones || 4} canciones)`, loc.cunas?.archivos || []],
  ["Hora exacta (al empezar cada hora)", loc.horas || []],
  ["Intros de programas", (radio.programas || []).map((p) => p.intro).filter((i) => i?.archivo?.startsWith("locutor/"))],
  ["Presentaciones de canciones", radio.canciones.flatMap((c) => c.presentaciones || [])],
].filter(([, clips]) => clips.length);
const todos = grupos.flatMap(([, c]) => c);
const faltan = () => todos.filter((c) => !existsSync(join("public", c.archivo)));

// ---- Guion ----
const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
let md =
  "# Guion del locutor\n\nSe genera desde `scripts/locutor-plantillas.json`: edita los textos allá y corre `npm run locutor -- --voz`.\n";
for (const [titulo, clips] of grupos) {
  md += `\n## ${titulo}\n\n| Archivo | Texto | Estado |\n| --- | --- | --- |\n`;
  for (const c of clips) {
    const dias = c.dias ? ` _(${c.dias.map((d) => DIAS[d]).join(", ")})_` : "";
    md += `| \`${c.archivo}\` | ${c.texto}${dias} | ${existsSync(join("public", c.archivo)) ? "hay audio" : "falta"} |\n`;
  }
}
writeFileSync("LOCUTOR-GUION.md", md);
console.log(`✔ ${todos.length} textos del locutor (${faltan().length} sin audio). Guion en LOCUTOR-GUION.md`);

// ---- Borrar audios que ya no se usan ----
if (args.includes("--limpiar") && existsSync("public/locutor")) {
  const usados = new Set(todos.map((c) => c.archivo));
  let borrados = 0;
  for (const f of readdirSync("public/locutor")) {
    if (f.endsWith(".mp3") && !usados.has(`locutor/${f}`)) {
      unlinkSync(join("public/locutor", f));
      borrados++;
    }
  }
  console.log(`✔ ${borrados} audio(s) sin usar borrados`);
}

// ---- Tu voz clonada (Chatterbox en ../voz) ----
if (args.includes("--voz")) {
  const pendientes = faltan();
  const python = join(VOZ, ".venv", process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
  if (!pendientes.length) {
    console.log("✔ Todos los textos ya tienen audio");
  } else if (!existsSync(python)) {
    console.error(`✖ No encuentro el entorno de voz en ${VOZ}. Revisa el README (sección Locutor).`);
    process.exit(1);
  } else {
    const lista = join(tmpdir(), `locutor-pendientes-${Date.now()}.json`);
    const items = pendientes.map((c) => ({ texto: c.dicho || c.texto, destino: resolve("public", c.archivo) }));
    writeFileSync(lista, JSON.stringify(items));
    console.log(`… generando ${items.length} audio(s) con tu voz (en procesador puede tardar un rato)`);
    const r = spawnSync(python, [resolve("scripts/voz_chatterbox.py"), lista, "--muestra", join(VOZ, "muestras", "voz.wav")], {
      stdio: "inherit",
    });
    unlinkSync(lista);
    if (r.status !== 0) process.exit(r.status || 1);
  }
}

// ---- Voces de IA de Windows (Raúl, Sabina…) ----
const IA = args.includes("--ia") || args.includes("--demo");
if (IA) {
  if (process.platform !== "win32") {
    console.log("Las voces de Windows solo se pueden generar en Windows.");
    process.exit(0);
  }
  const voces = existsSync(PLANTILLAS) ? JSON.parse(readFileSync(PLANTILLAS, "utf8")).voces || {} : {};
  const xml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const tmp = mkdtempSync(join(tmpdir(), "locutor-"));
  const pendientes = faltan().map((c, i) => {
    const v = voces[c.voz] || Object.values(voces)[0] || { vozWindows: "Raul", velocidad: 1, tono: 0 };
    const ssml =
      `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='es-MX'>` +
      `<prosody rate='${v.velocidad ?? 1}'>${xml(c.dicho || c.texto)}</prosody></speak>`;
    return { c, v, voz: v.vozWindows, ssml, wav: join(tmp, `${i}.wav`) };
  });
  if (pendientes.length) {
    console.log(`… generando ${pendientes.length} audio(s) con las voces de Windows`);
    const lista = join(tmp, "lista.json");
    writeFileSync(lista, JSON.stringify(pendientes.map(({ voz, ssml, wav }) => ({ voz, ssml, wav }))));
    execFileSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", resolve("scripts/voz_windows.ps1"), lista], {
      stdio: "inherit",
    });
    for (const { c, v, wav } of pendientes) {
      const destino = join("public", c.archivo);
      mkdirSync(dirname(destino), { recursive: true });
      // Tono más grave sin cambiar la velocidad, cuerpo de radio y volumen parejo
      const filtro = [
        v.tono ? `rubberband=pitch=${(2 ** (v.tono / 12)).toFixed(4)}:pitchq=quality:transients=smooth` : null,
        "highpass=f=60,equalizer=f=140:t=q:w=1:g=3",
        "acompressor=threshold=-22dB:ratio=2:attack=10:release=150:makeup=1.5",
        "apad=pad_dur=0.25,loudnorm=I=-16:TP=-1.5",
      ].filter(Boolean).join(",");
      execFileSync("ffmpeg", ["-v", "error", "-y", "-i", wav, "-af", filtro, "-ar", "44100", "-codec:a", "libmp3lame", "-b:a", "128k", destino]);
    }
    console.log(`✔ ${pendientes.length} audio(s) creados`);
  } else {
    console.log("✔ Todos los textos ya tienen audio");
  }
  rmSync(tmp, { recursive: true, force: true });
}

if (args.includes("--voz") || IA) {
  console.log("… actualizando duraciones");
  spawnSync(process.execPath, ["scripts/duraciones.mjs"], { stdio: "inherit" });
}
