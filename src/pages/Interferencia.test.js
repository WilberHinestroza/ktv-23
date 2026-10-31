import { actualizar, nuevaOla, nuevaPartida } from "./Interferencia";

const silencio = { disparo() {}, explosion() {}, golpe() {}, mejora() {}, jefe() {} };

// Un "bot" sencillo: dispara siempre y se pone debajo del enemigo más bajo.
function jugar(segundos, conBot = true) {
  const g = nuevaPartida();
  nuevaOla(g);
  const entrada = { izq: false, der: false, disparo: conBot, tocando: false, objetivoX: null };
  let maxOla = 1;
  for (let t = 0; t < segundos && !g.fin; t += 1 / 60) {
    if (conBot) {
      const blanco = g.jefe || [...g.enemigos].sort((a, b) => b.y - a.y)[0];
      entrada.izq = blanco ? blanco.x < g.jugador.x - 6 : false;
      entrada.der = blanco ? blanco.x > g.jugador.x + 6 : false;
    }
    actualizar(g, 1 / 60, entrada, silencio, () => {});
    maxOla = Math.max(maxOla, g.ola);
  }
  return { g, maxOla };
}

test("sin jugar, la interferencia termina la partida", () => {
  const { g } = jugar(600, false);
  expect(g.fin).toBeTruthy();
  expect(g.puntos).toBe(0);
});

test("jugando se suman puntos y se pasa de ola", () => {
  const { g, maxOla } = jugar(600);
  expect(g.puntos).toBeGreaterThan(0);
  expect(maxOla).toBeGreaterThanOrEqual(2);
  expect(Number.isFinite(g.puntos)).toBe(true);
});

test("la ola 5 trae al Ruido Blanco y se le puede ganar", () => {
  const g = nuevaPartida();
  g.ola = 4;
  nuevaOla(g);
  expect(g.jefe).toBeTruthy();
  expect(g.enemigos.length).toBe(0);
  let vencido = false;
  const alVencer = () => (vencido = true);
  g.vidas = 99;
  const entrada = { izq: false, der: false, disparo: true, tocando: false, objetivoX: null };
  for (let t = 0; t < 120 && !vencido; t += 1 / 60) {
    if (g.jefe) {
      entrada.izq = g.jefe.x < g.jugador.x - 6;
      entrada.der = g.jefe.x > g.jugador.x + 6;
    }
    actualizar(g, 1 / 60, entrada, silencio, alVencer);
  }
  expect(vencido).toBe(true);
  expect(g.mejoras.length).toBeGreaterThan(0); // el jefe suelta mejoras
});
