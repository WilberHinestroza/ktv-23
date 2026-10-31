// Interferencia: defiende la antena de KeNnyga Radio disparando notas contra olas de ruido.
// Juego original en canvas. Teclado: ← → (o A D) para moverte, Espacio para disparar, P para pausar.
// En el celular: arrastra el dedo sobre el juego; dispara solo mientras tocas.
import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useRadio } from "../radio/RadioContext";
import { guardar, leer } from "../radio/oyente";

const W = 480;
const H = 640;
const COLORES = { estatica: "#00ffea", chispa: "#ff2d6f", bloque: "#ffd23f", mini: "#b36bff" };
const PUNTOS = { estatica: 10, chispa: 20, bloque: 30, mini: 15 };
const choca = (a, b) => Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h;
const azar = (a, b) => a + Math.random() * (b - a);

// ---------- Sonidos cortitos con Web Audio (sin archivos) ----------
function crearSonido() {
  let ctx = null;
  let activo = leer("naves-sonido", true);
  const tono = (frec, dur, tipo = "square", vol = 0.05, bajar = true) => {
    if (!activo) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = tipo;
      o.frequency.setValueAtTime(frec, ctx.currentTime);
      if (bajar) o.frequency.exponentialRampToValueAtTime(Math.max(40, frec / 4), ctx.currentTime + dur);
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + dur);
    } catch {}
  };
  return {
    disparo: () => tono(880, 0.06, "triangle", 0.02),
    explosion: () => tono(180, 0.25, "sawtooth", 0.05),
    golpe: () => tono(120, 0.5, "square", 0.08),
    mejora: () => tono(520, 0.25, "sine", 0.06, false),
    jefe: () => tono(60, 0.9, "sawtooth", 0.08),
    alternar() {
      activo = !activo;
      guardar("naves-sonido", activo);
      return activo;
    },
  };
}

// ---------- Estado inicial de una partida ----------
export function nuevaPartida() {
  return {
    t: 0,
    jugador: { x: W / 2, y: H - 46, w: 30, h: 30, escudo: false, triple: 0, invulnerable: 1.5 },
    balas: [],
    enemigos: [],
    balasEnemigas: [],
    mejoras: [],
    particulas: [],
    estrellas: Array.from({ length: 70 }, () => ({ x: azar(0, W), y: azar(0, H), v: azar(15, 70), r: azar(0.5, 1.6) })),
    formacion: { y: -220 },
    jefe: null,
    puntos: 0,
    vidas: 3,
    ola: 0,
    racha: 0,
    recarga: 0,
    proximaPicada: 2,
    proximoDisparo: 1.5,
    mensaje: null,
    fin: false,
  };
}

const mini = (x, y, baseX, baseY, fila, vx, vy) => ({
  tipo: "mini", fila, baseX, baseY, x, y, w: 16, h: 14, vida: 1, estado: "picada", tp: 0, vx, vy, golpe: 0, semilla: Math.random() * 100,
});

export function nuevaOla(g) {
  g.ola += 1;
  g.balasEnemigas = [];
  if (g.ola % 5 === 0) {
    const vida = 40 + g.ola * 6;
    g.jefe = { x: W / 2, y: -60, w: 170, h: 60, vida, max: vida, vx: 80 + g.ola * 4, recarga: 2, invocar: 4, golpe: 0 };
    g.mensaje = { texto: "⚠ RUIDO BLANCO ⚠", sub: `Ola ${g.ola}`, t: 2.5 };
    return;
  }
  const filas = Math.min(3 + Math.floor(g.ola / 2), 6);
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < 7; c++) {
      let tipo = "estatica";
      if (f === 0 && g.ola >= 3) tipo = "bloque";
      else if (f === filas - 1 || (f + c) % 4 === 0) tipo = "chispa";
      g.enemigos.push({
        tipo,
        fila: f,
        baseX: 70 + c * 57,
        baseY: 70 + f * 40,
        x: 0,
        y: 0,
        w: tipo === "bloque" ? 34 : 28,
        h: tipo === "bloque" ? 24 : 20,
        vida: tipo === "bloque" ? 3 : 1,
        estado: "formacion",
        golpe: 0,
        semilla: Math.random() * 100,
      });
    }
  }
  g.formacion.y = -220;
  g.mensaje = { texto: `OLA ${g.ola}`, sub: g.ola === 1 ? "Defiende la frecuencia" : "", t: 1.8 };
}

function explotar(g, x, y, color, n = 12) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = azar(40, 200);
    g.particulas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: azar(0.3, 0.8), color });
  }
}

function soltarMejora(g, x, y, prob) {
  if (Math.random() > prob) return;
  const r = Math.random();
  const tipo = r < 0.45 ? "triple" : r < 0.8 ? "escudo" : "vida";
  g.mejoras.push({ tipo, x, y, w: 22, h: 22 });
}

// ---------- Un paso de la simulación ----------
export function actualizar(g, dt, entrada, sonido, alVencerJefe) {
  g.t += dt;
  const j = g.jugador;
  const multiplicador = 1 + Math.min(4, Math.floor(g.racha / 10));

  for (const e of g.estrellas) {
    e.y += e.v * dt;
    if (e.y > H) {
      e.y = 0;
      e.x = azar(0, W);
    }
  }

  // Antena
  if (entrada.tocando && entrada.objetivoX != null) {
    const d = entrada.objetivoX - j.x;
    j.x += Math.sign(d) * Math.min(Math.abs(d), 420 * dt);
  } else j.x += ((entrada.der ? 1 : 0) - (entrada.izq ? 1 : 0)) * 280 * dt;
  j.x = Math.max(j.w / 2, Math.min(W - j.w / 2, j.x));
  j.invulnerable = Math.max(0, j.invulnerable - dt);
  j.triple = Math.max(0, j.triple - dt);

  g.recarga -= dt;
  if ((entrada.disparo || entrada.tocando) && g.recarga <= 0) {
    g.recarga = 0.27;
    for (const vx of j.triple > 0 ? [-90, 0, 90] : [0]) g.balas.push({ x: j.x, y: j.y - 18, vx, vy: -460, w: 8, h: 14 });
    sonido.disparo();
  }
  for (const b of g.balas) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  }

  // Formación de ruido: entra desde arriba, se mece y baja despacio
  const f = g.formacion;
  if (f.y < 0) f.y = Math.min(0, f.y + 160 * dt);
  else f.y += (5 + g.ola * 1.3) * dt;
  for (const e of g.enemigos) {
    e.golpe = Math.max(0, e.golpe - dt);
    const slotX = e.baseX + Math.sin(g.t * 0.9 + e.fila * 0.6) * 38;
    const slotY = e.baseY + f.y + Math.sin(g.t * 2 + e.semilla) * 3;
    if (e.estado === "formacion") {
      e.x = slotX;
      e.y = slotY;
    } else if (e.estado === "picada") {
      e.tp += dt;
      e.vx = Math.max(-170, Math.min(170, e.vx + Math.sign(j.x - e.x) * 160 * dt));
      e.x += (e.vx + Math.sin(e.tp * 6) * 90) * dt;
      e.y += e.vy * dt;
      if (e.y > H + 30) {
        e.y = -30;
        e.estado = "volviendo";
      }
    } else {
      e.x += (slotX - e.x) * Math.min(1, 3 * dt);
      e.y += (slotY - e.y) * Math.min(1, 3 * dt);
      if (Math.abs(slotX - e.x) + Math.abs(slotY - e.y) < 4) e.estado = "formacion";
    }
  }

  // Alguien se lanza en picada de vez en cuando
  g.proximaPicada -= dt;
  if (g.proximaPicada <= 0 && f.y >= 0) {
    g.proximaPicada = Math.max(0.9, 3.6 - g.ola * 0.22);
    const candidatos = g.enemigos.filter((e) => e.estado === "formacion" && e.tipo === "chispa");
    const e = candidatos[Math.floor(Math.random() * candidatos.length)];
    if (e) Object.assign(e, { estado: "picada", tp: 0, vx: 0, vy: 150 + g.ola * 12 });
  }

  // Zumbidos del ruido
  g.proximoDisparo -= dt;
  if (g.proximoDisparo <= 0 && g.enemigos.length && f.y >= 0) {
    g.proximoDisparo = Math.max(0.3, 1.8 - g.ola * 0.12);
    const e = g.enemigos[Math.floor(Math.random() * g.enemigos.length)];
    g.balasEnemigas.push({ x: e.x, y: e.y + 12, x0: e.x, vx: 0, vy: 200 + g.ola * 8, w: 6, h: 12, t: 0, zigzag: true });
  }

  // Jefe: Ruido Blanco
  const jefe = g.jefe;
  if (jefe) {
    jefe.golpe = Math.max(0, jefe.golpe - dt);
    if (jefe.y < 100) jefe.y += 60 * dt;
    else {
      jefe.x += jefe.vx * dt;
      if (jefe.x < jefe.w / 2 + 10 || jefe.x > W - jefe.w / 2 - 10) jefe.vx *= -1;
      jefe.recarga -= dt;
      if (jefe.recarga <= 0) {
        jefe.recarga = Math.max(0.8, 1.6 - g.ola * 0.04);
        for (let a = -2; a <= 2; a++) g.balasEnemigas.push({ x: jefe.x, y: jefe.y + 30, vx: a * 70, vy: 210, w: 8, h: 8, t: 0 });
      }
      jefe.invocar -= dt;
      if (jefe.invocar <= 0) {
        jefe.invocar = 4.5;
        for (const lado of [-1, 1])
          g.enemigos.push(mini(jefe.x + lado * 60, jefe.y, jefe.x + lado * 60, 160, 0, lado * 80, 170 + g.ola * 6));
      }
    }
  }

  for (const b of g.balasEnemigas) {
    b.t += dt;
    b.y += b.vy * dt;
    b.x = b.zigzag ? b.x0 + Math.sin(b.t * 12) * 5 : b.x + b.vx * dt;
  }
  g.balasEnemigas = g.balasEnemigas.filter((b) => b.y < H + 20 && b.x > -20 && b.x < W + 20);

  // Notas contra el ruido
  for (const b of g.balas) {
    for (const e of g.enemigos) {
      if (e.vida <= 0 || !choca(b, e)) continue;
      b.usada = true;
      e.vida -= 1;
      e.golpe = 0.1;
      if (e.vida <= 0) {
        g.racha += 1;
        g.puntos += PUNTOS[e.tipo] * (e.estado === "picada" ? 2 : 1) * multiplicador;
        explotar(g, e.x, e.y, COLORES[e.tipo]);
        sonido.explosion();
        soltarMejora(g, e.x, e.y, 0.07);
        if (e.tipo === "bloque")
          for (const lado of [-1, 1])
            g.enemigos.push(mini(e.x, e.y, e.baseX + lado * 14, e.baseY, e.fila, lado * 120, 160 + g.ola * 8));
      }
      break;
    }
    if (!b.usada && jefe && g.jefe && jefe.y >= 60 && choca(b, jefe)) {
      b.usada = true;
      jefe.vida -= 1;
      jefe.golpe = 0.08;
      g.puntos += 2;
      if (jefe.vida <= 0) {
        g.puntos += 100 * g.ola * multiplicador;
        g.racha += 5;
        for (let i = 0; i < 6; i++) explotar(g, jefe.x + azar(-70, 70), jefe.y + azar(-25, 25), i % 2 ? "#fff" : "#00ffea", 14);
        sonido.jefe();
        soltarMejora(g, jefe.x - 30, jefe.y, 1);
        soltarMejora(g, jefe.x + 30, jefe.y, 1);
        g.jefe = null;
        alVencerJefe();
      }
    }
    if (!b.usada && b.y < 0) {
      b.usada = true; // se fue sin pegarle a nada: se corta la racha
      g.racha = 0;
    }
  }
  g.balas = g.balas.filter((b) => !b.usada);
  g.enemigos = g.enemigos.filter((e) => e.vida > 0);

  // Mejoras
  for (const m of g.mejoras) m.y += 90 * dt;
  g.mejoras = g.mejoras.filter((m) => {
    if (choca(m, j)) {
      sonido.mejora();
      if (m.tipo === "triple") j.triple = 9;
      if (m.tipo === "escudo") j.escudo = true;
      if (m.tipo === "vida") g.vidas = Math.min(5, g.vidas + 1);
      g.mensaje = { texto: { triple: "♫ TRIPLE", escudo: "◈ ESCUDO", vida: "♥ +1 VIDA" }[m.tipo], t: 1, chico: true };
      return false;
    }
    return m.y < H + 20;
  });

  // ¿Le dieron a la antena?
  const herir = () => {
    if (j.invulnerable > 0) return;
    sonido.golpe();
    if (j.escudo) {
      j.escudo = false;
      j.invulnerable = 1;
      return;
    }
    g.vidas -= 1;
    g.racha = 0;
    j.invulnerable = 2;
    j.triple = 0;
    explotar(g, j.x, j.y, "#ffffff", 20);
    if (g.vidas <= 0) g.fin = "Te quedaste sin señal";
  };
  g.balasEnemigas = g.balasEnemigas.filter((b) => {
    if (!choca(b, j)) return true;
    herir();
    return false;
  });
  for (const e of g.enemigos) {
    if (choca(e, j)) {
      e.vida = 0;
      explotar(g, e.x, e.y, COLORES[e.tipo]);
      herir();
    }
    if (e.estado === "formacion" && e.y > j.y - 30) g.fin = "La interferencia llegó a la antena";
  }
  g.enemigos = g.enemigos.filter((e) => e.vida > 0);

  for (const p of g.particulas) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vida -= dt;
  }
  g.particulas = g.particulas.filter((p) => p.vida > 0);
  if (g.mensaje && (g.mensaje.t -= dt) <= 0) g.mensaje = null;

  if (!g.enemigos.length && !g.jefe && !g.fin) nuevaOla(g);
}

// ---------- Dibujo ----------
function dibujarRuido(ctx, e, t) {
  const color = e.golpe > 0 ? "#ffffff" : COLORES[e.tipo];
  const x = e.x - e.w / 2;
  const y = e.y - e.h / 2;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.25;
  ctx.fillRect(x - 3, y - 3, e.w + 6, e.h + 6);
  ctx.globalAlpha = 1;
  ctx.fillRect(x, y, e.w, e.h);
  // Píxeles de estática que titilan
  const paso = 4;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  for (let py = 0; py < e.h; py += paso) {
    for (let px = 0; px < e.w; px += paso) {
      const n = Math.sin((px + 3) * 12.9898 + (py + 7) * 78.233 + Math.floor(t * 12) + e.semilla) * 43758.5453;
      if (n - Math.floor(n) < 0.3) ctx.fillRect(x + px, y + py, paso, paso);
    }
  }
  // Línea de barrido, como una tele mal sintonizada
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillRect(x, y + ((t * 40 + e.semilla * 10) % e.h), e.w, 2);
  if (e.tipo === "bloque" && e.vida < 3) {
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 6, y);
    ctx.lineTo(x + e.w / 2, y + e.h / 2);
    ctx.lineTo(x + e.w - 8, y + e.h);
    ctx.stroke();
  }
}

function dibujarAntena(ctx, j, t) {
  if (j.invulnerable > 0 && Math.floor(t * 12) % 2) return;
  const { x, y } = j;
  ctx.save();
  ctx.shadowColor = "#00ffea";
  ctx.shadowBlur = 12;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2.5;
  ctx.beginPath(); // torre
  ctx.moveTo(x - 14, y + 15);
  ctx.lineTo(x, y - 12);
  ctx.lineTo(x + 14, y + 15);
  ctx.moveTo(x - 9, y + 5);
  ctx.lineTo(x + 9, y + 5);
  ctx.moveTo(x - 5, y - 3);
  ctx.lineTo(x + 5, y - 3);
  ctx.stroke();
  ctx.fillStyle = j.triple > 0 ? "#ffd23f" : "#ff2d3b"; // luz de la punta
  ctx.beginPath();
  ctx.arc(x, y - 14, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,255,234,0.7)"; // ondas
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y - 14, 8 + ((t * 20) % 10), Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.restore();
  if (j.escudo) {
    ctx.strokeStyle = `rgba(0,255,234,${0.5 + Math.sin(t * 6) * 0.25})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function texto(ctx, t, x, y, { tam = 14, color = "#fff", alin = "center", base = "middle", tech = true } = {}) {
  ctx.font = `bold ${tam}px ${tech ? "Orbitron, " : ""}system-ui`;
  ctx.fillStyle = color;
  ctx.textAlign = alin;
  ctx.textBaseline = base;
  ctx.fillText(t, x, y);
}

function dibujar(ctx, g, pausado) {
  ctx.fillStyle = "#06060c";
  ctx.fillRect(0, 0, W, H);
  for (const e of g.estrellas) {
    ctx.fillStyle = `rgba(255,255,255,${0.25 + e.r / 3})`;
    ctx.fillRect(e.x, e.y, e.r, e.r);
  }
  ctx.strokeStyle = "rgba(255,45,111,0.18)"; // la frecuencia al fondo
  ctx.beginPath();
  for (let x = 0; x <= W; x += 8) ctx.lineTo(x, H - 14 + Math.sin(x / 18 + g.t * 3) * 4);
  ctx.stroke();

  for (const m of g.mejoras) {
    const c = { triple: "#ffd23f", escudo: "#00ffea", vida: "#ff2d6f" }[m.tipo];
    texto(ctx, { triple: "♫", escudo: "◈", vida: "♥" }[m.tipo], m.x, m.y, { tam: 20, color: c, tech: false });
  }
  for (const e of g.enemigos) dibujarRuido(ctx, e, g.t);

  const jefe = g.jefe;
  if (jefe) {
    dibujarRuido(ctx, { ...jefe, tipo: "estatica", semilla: 3 }, g.t);
    texto(ctx, "RUIDO BLANCO", jefe.x, jefe.y, { tam: 13, color: jefe.golpe > 0 ? "#ff2d6f" : "#000" });
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(40, 46, W - 80, 6);
    ctx.fillStyle = "#ff2d6f";
    ctx.fillRect(40, 46, (W - 80) * Math.max(0, jefe.vida / jefe.max), 6);
  }

  ctx.fillStyle = "#ff2d6f";
  for (const b of g.balasEnemigas) ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
  const colorNota = g.jugador.triple > 0 ? "#ffd23f" : "#00ffea";
  for (const b of g.balas) texto(ctx, "♪", b.x, b.y, { tam: 18, color: colorNota, tech: false });

  dibujarAntena(ctx, g.jugador, g.t);

  for (const p of g.particulas) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.vida * 1.5));
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 3, 3);
  }
  ctx.globalAlpha = 1;

  // Marcador
  texto(ctx, String(g.puntos).padStart(6, "0"), 12, 14, { alin: "left", base: "top" });
  texto(ctx, `OLA ${g.ola}`, W / 2, 14, { base: "top", color: "rgba(255,255,255,0.6)" });
  texto(ctx, "♥".repeat(Math.max(0, g.vidas)), W - 12, 14, { alin: "right", base: "top", color: "#ff2d6f", tech: false });
  const mult = 1 + Math.min(4, Math.floor(g.racha / 10));
  if (mult > 1) texto(ctx, `x${mult}`, 12, 34, { alin: "left", base: "top", color: "#ffd23f" });

  if (g.mensaje) {
    ctx.globalAlpha = Math.min(1, g.mensaje.t * 2);
    texto(ctx, g.mensaje.texto, W / 2, H / 2 - 20, { tam: g.mensaje.chico ? 18 : 30 });
    if (g.mensaje.sub) texto(ctx, g.mensaje.sub, W / 2, H / 2 + 16, { tam: 14, color: "rgba(255,255,255,0.7)", tech: false });
    ctx.globalAlpha = 1;
  }
  if (pausado) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, W, H);
    texto(ctx, "PAUSA", W / 2, H / 2, { tam: 28 });
  }
}

// ---------- Componente ----------
export default function Interferencia() {
  const { desbloquear } = useRadio();
  const lienzo = useRef(null);
  const sonido = useRef(null);
  const [fase, setFase] = useState("inicio"); // inicio | jugando | fin
  const [resultado, setResultado] = useState(null);
  const [record, setRecord] = useState(() => leer("naves-record", { mejor: 0, ola: 0, partidas: 0 }));
  const [pausado, setPausado] = useState(false);
  const [conSonido, setConSonido] = useState(() => leer("naves-sonido", true));
  const pausadoRef = useRef(false);
  pausadoRef.current = pausado;
  const desbloquearRef = useRef(desbloquear);
  desbloquearRef.current = desbloquear;

  if (!sonido.current) sonido.current = crearSonido();

  useEffect(() => {
    if (fase !== "jugando") return;
    const canvas = lienzo.current;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const g = nuevaPartida();
    nuevaOla(g);
    const entrada = { izq: false, der: false, disparo: false, tocando: false, objetivoX: null };
    document.body.classList.add("jugando-naves"); // los atajos de la radio se apagan mientras juegas

    const teclas = (abajo) => (e) => {
      const k = e.key.toLowerCase();
      if (["arrowleft", "a"].includes(k)) entrada.izq = abajo;
      else if (["arrowright", "d"].includes(k)) entrada.der = abajo;
      else if ([" ", "arrowup", "w"].includes(k)) entrada.disparo = abajo;
      else if (k === "p" || k === "escape") {
        if (abajo) setPausado((p) => !p);
      } else return;
      e.preventDefault();
    };
    const bajar = teclas(true);
    const subir = teclas(false);
    const posicion = (e) => {
      const r = canvas.getBoundingClientRect();
      entrada.objetivoX = ((e.clientX - r.left) / r.width) * W;
    };
    const tocar = (e) => {
      entrada.tocando = true;
      posicion(e);
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {}
    };
    const soltar = () => {
      entrada.tocando = false;
    };
    const mover = (e) => entrada.tocando && posicion(e);
    const oculta = () => document.hidden && setPausado(true);

    window.addEventListener("keydown", bajar);
    window.addEventListener("keyup", subir);
    canvas.addEventListener("pointerdown", tocar);
    canvas.addEventListener("pointermove", mover);
    canvas.addEventListener("pointerup", soltar);
    canvas.addEventListener("pointercancel", soltar);
    document.addEventListener("visibilitychange", oculta);
    canvas.focus({ preventScroll: true });
    canvas.scrollIntoView({ block: "center", behavior: "smooth" });

    let anterior = performance.now();
    let id;
    const cuadro = (ahora) => {
      const dt = Math.min(0.05, (ahora - anterior) / 1000);
      anterior = ahora;
      if (!pausadoRef.current) actualizar(g, dt, entrada, sonido.current, () => desbloquearRef.current("senal-limpia"));
      dibujar(ctx, g, pausadoRef.current);
      if (g.fin) {
        const r = { puntos: g.puntos, ola: g.ola, motivo: g.fin };
        const antes = leer("naves-record", { mejor: 0, ola: 0, partidas: 0 });
        const nuevo = { mejor: Math.max(antes.mejor, r.puntos), ola: Math.max(antes.ola || 0, r.ola), partidas: antes.partidas + 1 };
        guardar("naves-record", nuevo);
        setRecord({ ...nuevo, nuevo: r.puntos > antes.mejor && r.puntos > 0 });
        setResultado(r);
        setFase("fin");
        return;
      }
      id = requestAnimationFrame(cuadro);
    };
    id = requestAnimationFrame(cuadro);

    return () => {
      cancelAnimationFrame(id);
      document.body.classList.remove("jugando-naves");
      window.removeEventListener("keydown", bajar);
      window.removeEventListener("keyup", subir);
      canvas.removeEventListener("pointerdown", tocar);
      canvas.removeEventListener("pointermove", mover);
      canvas.removeEventListener("pointerup", soltar);
      canvas.removeEventListener("pointercancel", soltar);
      document.removeEventListener("visibilitychange", oculta);
    };
  }, [fase]);

  const empezar = () => {
    setPausado(false);
    setResultado(null);
    setFase("jugando");
  };

  return (
    <section className="contenedor juego">
      {fase !== "jugando" && <h1 className="titulo-seccion">Interferencia</h1>}
      {fase === "jugando" ? (
        <div className="naves">
          <canvas ref={lienzo} className="naves-lienzo" tabIndex={0} aria-label="Juego Interferencia" />
          <div className="naves-controles">
            <button className="boton-compartir" onClick={() => setPausado((p) => !p)}>
              {pausado ? <Play size={16} /> : <Pause size={16} />}
              <span>{pausado ? "Seguir" : "Pausa"}</span>
            </button>
            <button className="boton-compartir" onClick={() => setConSonido(sonido.current.alternar())}>
              {conSonido ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span>Efectos</span>
            </button>
          </div>
          <p className="naves-ayuda">← → para moverte · Espacio para disparar · P pausa · En el celular, arrastra el dedo</p>
        </div>
      ) : (
        <div className="juego-caja">
          <div className="naves-portada" aria-hidden="true">
            <span className="naves-ruido" />
            <span className="naves-ruido chispa" />
            <span className="naves-ruido" />
            <strong>📡</strong>
          </div>
          {fase === "fin" && resultado ? (
            <>
              <p className="intro">
                <strong>{resultado.motivo}.</strong>
                <br />
                {resultado.puntos.toLocaleString("es")} puntos · llegaste a la ola {resultado.ola}
              </p>
              {record.nuevo && <p className="juego-record">🏆 ¡Nuevo récord!</p>}
            </>
          ) : (
            <p className="intro">
              Una ola de ruido quiere tumbar la señal de KeNnyga Radio. Defiende la antena disparando notas, esquiva los
              zumbidos y aguanta hasta el <strong>Ruido Blanco</strong>, que aparece cada 5 olas. Recoge ♫ (disparo
              triple), ◈ (escudo) y ♥ (vida). La radio sigue sonando mientras juegas.
            </p>
          )}
          {record.partidas > 0 && (
            <p className="juego-record">
              Tu récord: <strong>{record.mejor.toLocaleString("es")}</strong> puntos · ola máxima {record.ola} ·{" "}
              {record.partidas} partida{record.partidas === 1 ? "" : "s"}
            </p>
          )}
          <button className="boton-sintonizar" onClick={empezar}>
            {fase === "fin" ? "Otra vez" : "Jugar"}
          </button>
        </div>
      )}
    </section>
  );
}
