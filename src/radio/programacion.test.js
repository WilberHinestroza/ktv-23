// Pruebas del motor de la radio: npm test
import { crearProgramacion } from "./programacion";
import radio from "../../public/contenido/radio.json";

const HORA = 3600000;
const DIA = 24 * HORA;
// Un lunes cualquiera a las 15:00 en Colombia (UTC-5)
const LUNES = Date.UTC(2026, 10, 2, 20, 0, 0);

describe("programación de la radio", () => {
  test("dos visitantes calculan exactamente lo mismo", () => {
    const a = crearProgramacion(radio);
    const b = crearProgramacion(JSON.parse(JSON.stringify(radio)));
    for (let t = LUNES; t < LUNES + 3 * DIA; t += 37 * 60000) {
      const x = a.enVivo(t);
      const y = b.enVivo(t);
      expect(y.cancion.id).toBe(x.cancion.id);
      expect(y.inicioMs).toBe(x.inicioMs);
    }
  });

  test("lo que suena ahora contiene el instante pedido", () => {
    const p = crearProgramacion(radio);
    for (let t = LUNES; t < LUNES + 7 * DIA; t += 53 * 60000) {
      const { inicioMs, finMs } = p.enVivo(t);
      expect(inicioMs).toBeLessThanOrEqual(t);
      expect(finMs).toBeGreaterThan(t);
    }
  });

  test("las canciones van una detrás de otra, sin huecos ni encimas", () => {
    const p = crearProgramacion(radio);
    const lista = p.proximas(LUNES, 400);
    for (let i = 1; i < lista.length; i++) {
      expect(lista[i].inicioMs).toBe(lista[i - 1].finMs);
    }
  });

  test("también cruza el cambio de semana (domingo → lunes)", () => {
    const p = crearProgramacion(radio);
    const domingoNoche = LUNES + 6 * DIA + 8 * HORA; // domingo 23:00
    const lista = p.proximas(domingoNoche, 80);
    for (let i = 1; i < lista.length; i++) expect(lista[i].inicioMs).toBe(lista[i - 1].finMs);
  });

  test("'ya sonó' es lo mismo que venía antes", () => {
    const p = crearProgramacion(radio);
    const lista = p.proximas(LUNES - 2 * HORA, 40);
    const t = lista[30].inicioMs + 1000;
    const antes = p.anteriores(t, 10);
    expect(antes.map((x) => x.inicioMs)).toEqual(
      lista
        .slice(20, 30)
        .reverse()
        .map((x) => x.inicioMs)
    );
  });

  test("todas las canciones suenan al menos una vez en 8 días", () => {
    const p = crearProgramacion(radio);
    const agenda = p.agenda(LUNES, 8);
    const faltan = p.canciones.filter((c) => !agenda.has(c.id)).map((c) => c.titulo);
    expect(faltan).toEqual([]);
  });

  test("los programas por tema solo ponen canciones de su tema", () => {
    const p = crearProgramacion(radio);
    const lista = p.proximas(LUNES - 30 * HORA, 3000);
    for (const { cancion, programa } of lista) {
      if (!programa.temas?.length || cancion.esLocutor || cancion.esIntro || cancion.oculta) continue;
      expect((cancion.temas || []).some((t) => programa.temas.includes(t))).toBe(true);
    }
  });
});
