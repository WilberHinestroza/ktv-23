// Locutor: arma los textos desde scripts/locutor-plantillas.json y genera los audios.
//
//   npm run locutor               → actualiza radio.json y LOCUTOR-GUION.md con los textos
//   npm run locutor -- --voz      → además crea con tu voz clonada los audios que falten
//   npm run locutor -- --limpiar  → borra audios de public/locutor/ que ya no se usan
//   npm run locutor -- --demo     → crea los que falten con la voz de Windows (para probar)
//
// Cada audio se llama según su texto: si cambias una frase, solo se regenera esa.
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, readdirSync } from "node:fs";
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

  const clip = (grupo, entrada) => {
    const { texto, dias } = typeof entrada === "string" ? { texto: entrada } : entrada;
    const dicho = paraDecir(texto, pronunciar);
    const archivo = `locutor/${grupo}-${hash(dicho)}.mp3`;
    const c = { archivo, texto };
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

  radio.locutor = {
    activo: viejo.activo ?? true,
    nombre: viejo.nombre || "Wildberry",
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
  };
  writeFileSync(RADIO, JSON.stringify(radio, null, 2) + "\n");
}

// ---- Lista de todos los clips ----
const loc = radio.locutor || {};
const grupos = [
  ...Object.entries(loc.saludos || {}).map(([momento, clips]) => [`Saludo · ${momento}`, clips]),
  [`Compañía (cada ${loc.compania?.cadaMinutos || 20} min)`, loc.compania?.archivos || []],
  [`Cuñas (cada ${loc.cunas?.cadaCanciones || 4} canciones)`, loc.cunas?.archivos || []],
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

// ---- Audios de prueba (voz de Windows) ----
if (args.includes("--demo")) {
  if (process.platform !== "win32") {
    console.log("Los audios de prueba solo se pueden generar en Windows.");
    process.exit(0);
  }
  let creados = 0;
  for (const c of faltan()) {
    const destino = join("public", c.archivo);
    mkdirSync(dirname(destino), { recursive: true });
    const wav = join(tmpdir(), `locutor-${Date.now()}.wav`);
    const ps =
      "Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer;" +
      " $v = $s.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -like 'es*' } | Select-Object -First 1;" +
      " if ($v) { $s.SelectVoice($v.VoiceInfo.Name) }; $s.SetOutputToWaveFile($env:LOC_WAV); $s.Speak($env:LOC_TEXTO); $s.Dispose()";
    execFileSync("powershell.exe", ["-NoProfile", "-Command", ps], {
      env: { ...process.env, LOC_WAV: wav, LOC_TEXTO: c.dicho || c.texto },
    });
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", wav, "-codec:a", "libmp3lame", "-b:a", "128k", "-ar", "44100", destino]);
    unlinkSync(wav);
    creados++;
  }
  console.log(`✔ ${creados} audio(s) de prueba creados con la voz de Windows`);
}

if (args.includes("--voz") || args.includes("--demo")) {
  console.log("… actualizando duraciones");
  spawnSync(process.execPath, ["scripts/duraciones.mjs"], { stdio: "inherit" });
}
