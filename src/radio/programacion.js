// Motor de la radio: decide qué suena en cualquier instante usando solo el reloj.
// Todos los visitantes calculan lo mismo, así que escuchan la misma canción en el
// mismo segundo, sin necesidad de servidor.
//
// El día se divide en programas (bloques por hora, en la hora de la emisora).
// Cuando un programa termina, la canción que está sonando se deja terminar y el
// siguiente programa empieza justo después. Ese arrastre se reinicia cada lunes
// a las 00:00 para que el cálculo siempre sea corto.

const MIN = 60000;
const DIA = 24 * 60 * MIN;
const SEMANA = 7 * DIA;
const LUNES_0 = 4 * DIA; // 1970-01-05 fue lunes

// Número pseudoaleatorio en [0, 1) que siempre da el mismo resultado para los mismos datos.
function azar(a, b, c) {
  let h = 2166136261 ^ a;
  h = Math.imul(h ^ b, 16777619);
  h = Math.imul(h ^ c, 16777619);
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

function mezclar(lista, semilla) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar(semilla, i, 7) * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

const minutos = (hhmm) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + (m || 0);
};

function desfaseHorario(zona) {
  const m = /^([+-])(\d{2}):?(\d{2})$/.exec(zona || "-05:00");
  if (!m) return -5 * 60;
  return (m[1] === "-" ? -1 : 1) * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10));
}

export function crearProgramacion(radio) {
  const desfase = desfaseHorario(radio.zonaHoraria) * MIN; // hora local = UTC + desfase
  const albumes = new Map((radio.albumes || []).map((a) => [a.id, a]));

  // Completa cada canción con los datos de su álbum (portada, género…).
  const completar = (c) => {
    const album = albumes.get(c.album) || null;
    return {
      ...c,
      albumInfo: album,
      genero: c.genero || album?.genero || "",
      portada: c.portada || album?.portada || radio.portada,
    };
  };

  // Una canción sin duración (archivo faltante) se salta para no trabar la radio.
  const canciones = radio.canciones.filter((c) => c.duracion > 0).map(completar);
  const ocultas = radio.ocultasActivas
    ? (radio.ocultas || []).filter((o) => o.duracion > 0).map((o) => ({ ...completar(o), oculta: true }))
    : [];
  if (!canciones.length) throw new Error("La radio no tiene canciones con duración");

  // Locutor: clips sincronizados (iguales para todos)
  const loc = radio.locutor?.activo ? radio.locutor : null;
  const clipLocutor = (c, i, tipo) => ({
    ...c,
    id: `${tipo}-${i}`,
    titulo: c.titulo || radio.nombre,
    artista: `Locutor · ${c.locutor || loc.nombre || radio.nombre}`,
    portada: c.portada || radio.portada,
    esLocutor: true,
  });
  const cunas = loc ? (loc.cunas?.archivos || []).filter((c) => c.duracion > 0).map((c, i) => clipLocutor(c, i, "cuna")) : [];
  const cadaCanciones = Math.max(1, loc?.cunas?.cadaCanciones || 4);
  // Antes de una canción, a veces el locutor la presenta (igual para todos).
  const probPresentar = loc?.presentaciones?.probabilidad ?? 0.35;
  const presentacionDe = (c, semilla, vuelta) => {
    if (!loc) return null;
    const lista = (c.presentaciones || (c.presentacion ? [c.presentacion] : [])).filter((p) => p.duracion > 0);
    if (!lista.length || azar(semilla + vuelta, c.id, 4) >= probPresentar) return null;
    const i = Math.floor(azar(semilla + vuelta, c.id, 5) * lista.length);
    return clipLocutor({ ...lista[i], titulo: `Presentando: ${c.titulo}` }, `${c.id}-${i}`, "presenta");
  };

  function cancionesDe(p) {
    if (p.canciones?.length) {
      return p.canciones.map((id) => canciones.find((c) => c.id === id)).filter(Boolean);
    }
    return canciones.filter(
      (c) =>
        (!p.albumes?.length || p.albumes.includes(c.album)) &&
        (!p.generos?.length || p.generos.includes(c.genero)) &&
        (!p.temas?.length || (c.temas || []).some((t) => p.temas.includes(t)))
    );
  }

  function prepararPrograma(p) {
    const intro =
      p.intro?.archivo && p.intro.duracion > 0
        ? completar({
            id: `intro-${p.id}`,
            titulo: p.intro.titulo || p.titulo,
            artista: radio.nombre,
            archivo: p.intro.archivo,
            duracion: p.intro.duracion,
            portada: p.portada,
            esIntro: true,
          })
        : null;
    return { ...p, items: cancionesDe(p), intro, inicioMin: minutos(p.desde), finMin: minutos(p.hasta) };
  }

  const general = prepararPrograma({
    id: "general",
    titulo: "Programación general",
    orden: "lista",
    ...(radio.programaGeneral || {}),
    desde: "00:00",
    hasta: "00:00",
    albumes: null,
    generos: null,
    temas: null,
  });
  general.items = general.canciones?.length ? general.items : canciones;
  const programas = (radio.programas || []).map(prepararPrograma).filter((p) => p.items.length);

  // ---- Construcción de una semana (en hora local de la emisora) ----

  function bloquesNominales(inicioSemana) {
    const finSemana = inicioSemana + SEMANA;
    const apariciones = [];
    // d = -1 incluye el domingo anterior por si un programa cruza la medianoche
    for (let d = -1; d < 7; d++) {
      const dia = inicioSemana + d * DIA;
      const diaSemana = (d + 8) % 7; // 0 = domingo … 6 = sábado
      programas.forEach((p, orden) => {
        if (p.dias?.length && !p.dias.includes(diaSemana)) return;
        let inicio = dia + p.inicioMin * MIN;
        let fin = dia + p.finMin * MIN;
        if (p.finMin <= p.inicioMin) fin += DIA;
        inicio = Math.max(inicio, inicioSemana);
        fin = Math.min(fin, finSemana);
        if (fin > inicio) apariciones.push({ programa: p, inicio, fin, orden });
      });
    }
    apariciones.sort((a, b) => a.inicio - b.inicio || a.orden - b.orden);

    // Resolver choques (el que empezó primero gana) y rellenar huecos con la general
    const bloques = [];
    let t = inicioSemana;
    for (const a of apariciones) {
      if (a.fin <= t) continue;
      if (a.inicio > t) bloques.push({ programa: general, inicio: t, fin: a.inicio });
      bloques.push({ programa: a.programa, inicio: Math.max(a.inicio, t), fin: a.fin });
      t = a.fin;
    }
    if (t < finSemana) bloques.push({ programa: general, inicio: t, fin: finSemana });
    return bloques;
  }

  // Lista de canciones de un bloque desde `inicio`, hasta pasar `finNominal`.
  function llenarBloque(programa, inicio, finNominal, finDuro) {
    const semilla = Math.floor(inicio / MIN) | 0;
    const items = [];
    let t = inicio;
    const agregar = (cancion) => {
      const fin = Math.min(t + cancion.duracion * 1000, finDuro);
      items.push({ cancion, inicio: t, fin });
      t = fin;
    };
    if (programa.intro) agregar(programa.intro);
    let contador = 0;
    for (let vuelta = 0; t < finNominal; vuelta++) {
      const orden = programa.orden === "mezcla" ? mezclar(programa.items, semilla + vuelta) : programa.items;
      for (const c of orden) {
        if (t >= finNominal) break;
        // Cuña del locutor cada N canciones
        if (cunas.length && contador > 0 && contador % cadaCanciones === 0) {
          agregar(cunas[Math.floor(azar(semilla + vuelta, contador, 3) * cunas.length)]);
        }
        const presentacion = presentacionDe(c, semilla, vuelta);
        if (presentacion) agregar(presentacion);
        agregar(c);
        contador++;
        const candidatas = ocultas.filter((o) => (o.despuesDe || []).includes(c.id));
        if (candidatas.length && t < finNominal) {
          const elegida = candidatas[Math.floor(azar(semilla + vuelta, c.id, 1) * candidatas.length)];
          if (azar(semilla + vuelta, c.id, 2) < elegida.probabilidad) agregar(elegida);
        }
      }
    }
    return { items, fin: t };
  }

  const cacheSemanas = new Map();
  function semana(indice) {
    if (cacheSemanas.has(indice)) return cacheSemanas.get(indice);
    const inicioSemana = LUNES_0 + indice * SEMANA;
    const finSemana = inicioSemana + SEMANA;
    const bloques = [];
    let t = inicioSemana;
    for (const b of bloquesNominales(inicioSemana)) {
      // Si el programa anterior se alargó tanto que se comió este, se salta
      if (t >= b.fin) continue;
      const { items, fin } = llenarBloque(b.programa, t, b.fin, finSemana);
      bloques.push({ programa: b.programa, inicio: t, fin, finNominal: b.fin, items });
      t = fin;
    }
    if (cacheSemanas.size >= 3) cacheSemanas.delete(cacheSemanas.keys().next().value);
    cacheSemanas.set(indice, bloques);
    return bloques;
  }

  const buscar = (lista, t) => {
    let lo = 0;
    let hi = lista.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lista[mid].inicio <= t) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  };

  // Posición (semana, bloque, canción) para un instante UTC.
  function ubicar(ahoraMs) {
    const local = ahoraMs + desfase;
    const s = Math.floor((local - LUNES_0) / SEMANA);
    const bloques = semana(s);
    const b = buscar(bloques, local);
    const i = buscar(bloques[b].items, local);
    return { s, b, i };
  }

  const aUTC = (local) => local - desfase;

  // Lo que suena desde `ahoraMs`: el actual primero, luego los siguientes.
  function proximas(ahoraMs = Date.now(), cantidad = 8) {
    let { s, b, i } = ubicar(ahoraMs);
    const salida = [];
    while (salida.length < cantidad) {
      const bloques = semana(s);
      const bloque = bloques[b];
      const item = bloque.items[i];
      salida.push({
        cancion: item.cancion,
        inicioMs: aUTC(item.inicio),
        finMs: aUTC(item.fin),
        programa: bloque.programa,
      });
      i += 1;
      if (i >= bloque.items.length) {
        i = 0;
        b += 1;
        if (b >= bloques.length) {
          b = 0;
          s += 1;
        }
      }
    }
    return salida;
  }

  // Programas desde el actual, para la parrilla.
  function parrilla(ahoraMs = Date.now(), cantidad = 6) {
    let { s, b } = ubicar(ahoraMs);
    const salida = [];
    while (salida.length < cantidad) {
      const bloques = semana(s);
      const bloque = bloques[b];
      const anterior = salida[salida.length - 1];
      // Dos bloques seguidos de la general se muestran como uno
      if (anterior && anterior.programa === bloque.programa) anterior.finMs = aUTC(bloque.fin);
      else salida.push({ programa: bloque.programa, inicioMs: aUTC(bloque.inicio), finMs: aUTC(bloque.fin) });
      b += 1;
      if (b >= bloques.length) {
        b = 0;
        s += 1;
      }
    }
    return salida;
  }

  // Lo que ya sonó antes de `ahoraMs`, del más reciente al más viejo.
  function anteriores(ahoraMs = Date.now(), cantidad = 10) {
    let { s, b, i } = ubicar(ahoraMs);
    const salida = [];
    while (salida.length < cantidad) {
      i -= 1;
      if (i < 0) {
        b -= 1;
        if (b < 0) {
          s -= 1;
          b = semana(s).length - 1;
        }
        i = semana(s)[b].items.length - 1;
      }
      const bloque = semana(s)[b];
      const item = bloque.items[i];
      salida.push({ cancion: item.cancion, inicioMs: aUTC(item.inicio), finMs: aUTC(item.fin), programa: bloque.programa });
    }
    return salida;
  }

  // Próxima vez que suena cada canción en los siguientes `dias`: Map id → inicio (UTC).
  // Si está sonando ahora, cuenta su inicio actual.
  function agenda(desdeMs = Date.now(), dias = 8) {
    const limite = desdeMs + dias * DIA + desfase;
    let { s, b, i } = ubicar(desdeMs);
    const mapa = new Map();
    for (;;) {
      const bloques = semana(s);
      const bloque = bloques[b];
      const item = bloque.items[i];
      if (item.inicio > limite) break;
      const c = item.cancion;
      if (!c.esLocutor && !c.esIntro && !c.oculta && !mapa.has(c.id)) mapa.set(c.id, aUTC(item.inicio));
      i += 1;
      if (i >= bloque.items.length) {
        i = 0;
        b += 1;
        if (b >= bloques.length) {
          b = 0;
          s += 1;
        }
      }
    }
    return mapa;
  }

  return {
    canciones,
    albumes: radio.albumes || [],
    duracionCiclo: canciones.reduce((t, c) => t + c.duracion, 0),
    enVivo: (ahoraMs = Date.now()) => proximas(ahoraMs, 1)[0],
    proximas,
    anteriores,
    agenda,
    parrilla,
  };
}
