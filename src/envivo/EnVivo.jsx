// Lo que comparten todos los visitantes en tiempo real (Firebase Realtime Database):
// oyentes conectados, reacciones, chat, pedidos, muro de dedicatorias, favoritas y visitas.
// Se activa poniendo la configuración en public/contenido/envivo.json. Sin ella, la página
// funciona igual que antes y estas partes no aparecen.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { cargarJSON } from "../contenido";
import { useRadio } from "../radio/RadioContext";

const EnVivoContext = createContext({ disponible: false });
export const useEnVivo = () => useContext(EnVivoContext);

export const EMOJIS = { fuego: "🔥", corazon: "❤️", risa: "😂", manos: "🙌", calavera: "💀" };

// Semana del año (los pedidos se reinician cada semana): "2026-44"
export function semanaActual(fecha = new Date()) {
  const d = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
  const dia = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dia);
  const inicio = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const semana = Math.ceil(((d - inicio) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-${String(semana).padStart(2, "0")}`;
}

export function EnVivoProvider({ children }) {
  const { sintonizado, favoritos } = useRadio();
  const [api, setApi] = useState(null); // { db, uid, m } cuando ya conectó
  const [oyentes, setOyentes] = useState(null); // { conectados, escuchando }
  const [visitas, setVisitas] = useState(null);
  const [flotantes, setFlotantes] = useState([]); // reacciones que van subiendo por la pantalla
  const desfaseRef = useRef(0); // diferencia entre el reloj del servidor y el de este equipo

  // Conectar (solo si hay configuración). Firebase se descarga aparte, solo cuando hace falta.
  useEffect(() => {
    let vivo = true;
    cargarJSON("envivo.json")
      .then(async (cfg) => {
        if (!cfg?.activo || !cfg.firebase?.databaseURL) return;
        const [{ initializeApp }, { getAuth, signInAnonymously }, m] = await Promise.all([
          import("firebase/app"),
          import("firebase/auth"),
          import("firebase/database"),
        ]);
        const app = initializeApp(cfg.firebase);
        const auth = getAuth(app);
        const db = m.getDatabase(app);
        // Para probar en local con el emulador de Firebase: "emulador": true (solo en localhost)
        if (cfg.emulador && window.location.hostname === "localhost") {
          const { connectAuthEmulator } = await import("firebase/auth");
          connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
          m.connectDatabaseEmulator(db, "127.0.0.1", 9000);
        }
        const { user } = await signInAnonymously(auth);
        if (vivo) setApi({ db, uid: user.uid, m });
      })
      .catch((e) => console.warn("Funciones en vivo desactivadas:", e?.message || e));
    return () => {
      vivo = false;
    };
  }, []);

  // Presencia: cada visitante se anota en /oyentes y se borra solo al cerrar la página
  const sintonizadoRef = useRef(sintonizado);
  sintonizadoRef.current = sintonizado;
  useEffect(() => {
    if (!api) return;
    const { db, uid, m } = api;
    const yo = m.ref(db, `oyentes/${uid}`);
    const quitar = m.onValue(m.ref(db, ".info/connected"), (s) => {
      if (!s.val()) return;
      m.onDisconnect(yo)
        .remove()
        .then(() => m.set(yo, { sintonizado: sintonizadoRef.current, desde: m.serverTimestamp() }))
        .catch(() => {});
    });
    const quitarDesfase = m.onValue(m.ref(db, ".info/serverTimeOffset"), (s) => (desfaseRef.current = s.val() || 0));
    const quitarConteo = m.onValue(m.ref(db, "oyentes"), (s) => {
      const todos = Object.values(s.val() || {});
      setOyentes({ conectados: todos.length, escuchando: todos.filter((o) => o.sintonizado).length });
    });
    // Visitas: una por sesión del navegador
    let contar = false;
    try {
      contar = !sessionStorage.getItem("visita-contada");
      sessionStorage.setItem("visita-contada", "1");
    } catch {}
    if (contar) m.runTransaction(m.ref(db, "visitas/total"), (v) => (v || 0) + 1).catch(() => {});
    const quitarVisitas = m.onValue(m.ref(db, "visitas/total"), (s) => setVisitas(s.val()));
    return () => {
      quitar();
      quitarDesfase();
      quitarConteo();
      quitarVisitas();
      m.remove(yo).catch(() => {});
    };
  }, [api]);

  useEffect(() => {
    if (!api) return;
    const { db, uid, m } = api;
    m.update(m.ref(db, `oyentes/${uid}`), { sintonizado }).catch(() => {});
  }, [api, sintonizado]);

  // Reacciones de todos: cada una sube flotando unos segundos
  useEffect(() => {
    if (!api) return;
    const { db, m } = api;
    const r = m.ref(db, "reacciones");
    const ultima = new Map(); // la misma reacción llega dos veces (local y confirmada por el servidor)
    const mostrar = (s) => {
      const v = s.val();
      if (!v?.emoji || !EMOJIS[v.emoji]) return;
      const ahoraServidor = Date.now() + desfaseRef.current;
      if (ahoraServidor - v.t > 8000) return; // vieja: no se muestra
      if (Math.abs(v.t - (ultima.get(s.key) ?? -Infinity)) < 1000) return;
      ultima.set(s.key, v.t);
      const id = `${s.key}-${v.t}`;
      setFlotantes((f) => [...f.slice(-30), { id, emoji: EMOJIS[v.emoji], x: 10 + Math.random() * 80 }]);
      setTimeout(() => setFlotantes((f) => f.filter((x) => x.id !== id)), 3500);
    };
    const a = m.onChildAdded(r, mostrar);
    const b = m.onChildChanged(r, mostrar);
    return () => {
      a();
      b();
    };
  }, [api]);

  // Las favoritas de cada uno se suman al ranking de todos
  const favSincRef = useRef(new Set());
  useEffect(() => {
    if (!api) return;
    const { db, uid, m } = api;
    const antes = favSincRef.current;
    const ahora = new Set(favoritos);
    for (const id of ahora) if (!antes.has(id)) m.set(m.ref(db, `favoritas/${id}/${uid}`), true).catch(() => {});
    for (const id of antes) if (!ahora.has(id)) m.remove(m.ref(db, `favoritas/${id}/${uid}`)).catch(() => {});
    favSincRef.current = ahora;
  }, [api, favoritos]);

  // ---- Acciones ----
  // Escribe un mensaje junto con su "límite" (las reglas exigen esperar entre uno y otro)
  const publicar = useCallback(
    async (lista, datos) => {
      if (!api) throw new Error("sin conexión");
      const { db, uid, m } = api;
      const clave = m.push(m.ref(db, lista)).key;
      await m.update(m.ref(db), {
        [`${lista}/${clave}`]: { ...datos, uid, t: m.serverTimestamp() },
        [`limites/${lista}/${uid}`]: m.serverTimestamp(),
      });
    },
    [api]
  );

  const reaccionar = useCallback(
    (emoji) => {
      if (!api) return;
      const { db, uid, m } = api;
      m.set(m.ref(db, `reacciones/${uid}`), { emoji, t: m.serverTimestamp() }).catch(() => {});
    },
    [api]
  );

  const votar = useCallback(
    (cancionId, si) => {
      if (!api) return;
      const { db, uid, m } = api;
      const r = m.ref(db, `pedidos/${semanaActual()}/${cancionId}/${uid}`);
      (si ? m.set(r, true) : m.remove(r)).catch(() => {});
    },
    [api]
  );

  // Suscribirse a una ruta mientras el componente está en pantalla
  const escuchar = useCallback(
    (ruta, alCambiar, ultimos) => {
      if (!api) return () => {};
      const { db, m } = api;
      const base = m.ref(db, ruta);
      const q = ultimos ? m.query(base, m.orderByChild("t"), m.limitToLast(ultimos)) : base;
      return m.onValue(q, (s) => alCambiar(s.val()), () => alCambiar(null));
    },
    [api]
  );

  const valor = {
    disponible: Boolean(api),
    uid: api?.uid,
    oyentes,
    visitas,
    flotantes,
    reaccionar,
    votar,
    publicar,
    escuchar,
  };
  return <EnVivoContext.Provider value={valor}>{children}</EnVivoContext.Provider>;
}

// Lee una ruta en vivo. `ultimos`: solo los N más recientes (por su campo t).
export function useEnVivoLista(ruta, ultimos) {
  const { escuchar, disponible } = useEnVivo();
  const [datos, setDatos] = useState(null);
  useEffect(() => {
    if (!disponible || !ruta) return;
    return escuchar(ruta, setDatos, ultimos);
  }, [disponible, ruta, ultimos, escuchar]);
  return datos;
}
