// Partes de la página que se ven solo cuando las funciones en vivo están activas (ver EnVivo.jsx).
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Send, ThumbsUp, Users } from "lucide-react";
import { useRadio } from "../radio/RadioContext";
import { ruta } from "../contenido";
import { EMOJIS, semanaActual, useEnVivo, useEnVivoLista } from "./EnVivo";

const normalizar = (t) =>
  String(t)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const leerLocal = (clave) => {
  try {
    return localStorage.getItem(clave) || "";
  } catch {
    return "";
  }
};
const guardarLocal = (clave, valor) => {
  try {
    localStorage.setItem(clave, valor);
  } catch {}
};

// Lista de Firebase { clave: {…, t} } → arreglo ordenado del más viejo al más nuevo
const comoLista = (obj) =>
  Object.entries(obj || {})
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => (a.t || 0) - (b.t || 0));

const haceCuanto = (t) => {
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "ahora";
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  return new Date(t).toLocaleDateString("es", { day: "numeric", month: "short" });
};

const errorAmable = (e) =>
  /PERMISSION_DENIED/i.test(String(e?.message || e))
    ? "Espera un momento antes de enviar otro."
    : "No se pudo enviar. Revisa tu conexión.";

// ---------- "👥 12 escuchando" ----------
export function ContadorOyentes() {
  const { disponible, oyentes } = useEnVivo();
  if (!disponible || !oyentes) return null;
  const n = Math.max(1, oyentes.escuchando);
  return (
    <span className="contador-oyentes" title={`${oyentes.conectados} en la página`}>
      <Users size={14} /> {n} escuchando
    </span>
  );
}

// ---------- Reacciones que todos ven flotar sobre el reproductor ----------
export function Reacciones() {
  const { disponible, reaccionar, flotantes } = useEnVivo();
  const [espera, setEspera] = useState(false);
  if (!disponible) return null;
  const enviar = (clave) => {
    if (espera) return;
    reaccionar(clave);
    setEspera(true);
    setTimeout(() => setEspera(false), 1300); // las reglas piden 1,2 s entre reacciones
  };
  return (
    <>
      <div className="reacciones" aria-label="Reaccionar">
        {Object.entries(EMOJIS).map(([clave, emoji]) => (
          <button key={clave} onClick={() => enviar(clave)} disabled={espera} title={`Reaccionar ${emoji}`}>
            {emoji}
          </button>
        ))}
      </div>
      <div className="flotantes" aria-hidden="true">
        {flotantes.map((f) => (
          <span key={f.id} style={{ left: `${f.x}%` }}>
            {f.emoji}
          </span>
        ))}
      </div>
    </>
  );
}

// ---------- Pestaña "Comunidad": chat, pedidos y muro ----------
export function Comunidad() {
  const { disponible } = useEnVivo();
  const [vista, setVista] = useState("chat");
  if (!disponible) return null;
  return (
    <div className="comunidad">
      <div className="chips-temas">
        {[
          ["chat", "💬 Chat"],
          ["pedidos", "🙋 Pedidos"],
          ["muro", "💌 Muro"],
        ].map(([id, texto]) => (
          <button key={id} className={`chip ${vista === id ? "activo" : ""}`} onClick={() => setVista(id)}>
            {texto}
          </button>
        ))}
      </div>
      {vista === "chat" && <Chat />}
      {vista === "pedidos" && <Pedidos />}
      {vista === "muro" && <Muro />}
    </div>
  );
}

function Chat() {
  const { publicar, uid } = useEnVivo();
  const datos = useEnVivoLista("chat", 50);
  const mensajes = useMemo(() => comoLista(datos), [datos]);
  const [nombre, setNombre] = useState(() => leerLocal("chat-nombre"));
  const [texto, setTexto] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const caja = useRef(null);

  useEffect(() => {
    const el = caja.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [mensajes.length]);

  const enviar = async (e) => {
    e.preventDefault();
    const n = nombre.trim().slice(0, 24);
    const t = texto.trim().slice(0, 200);
    if (!n || !t) return;
    setEnviando(true);
    setError("");
    try {
      await publicar("chat", { nombre: n, texto: t });
      guardarLocal("chat-nombre", n);
      setTexto("");
    } catch (err) {
      setError(errorAmable(err));
    }
    setEnviando(false);
  };

  return (
    <div className="chat">
      <ol className="chat-mensajes" ref={caja}>
        {mensajes.map((m) => (
          <li key={m.id} className={m.uid === uid ? "mio" : ""}>
            <strong>{m.nombre}</strong> <small>{haceCuanto(m.t)}</small>
            <p>{m.texto}</p>
          </li>
        ))}
        {datos !== null && !mensajes.length && <li className="vacio">Nadie ha escrito todavía. ¡Saluda!</li>}
      </ol>
      <form className="chat-form" onSubmit={enviar}>
        {!leerLocal("chat-nombre") && (
          <input placeholder="Tu nombre" maxLength={24} value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        )}
        <div className="chat-fila">
          <input
            placeholder={nombre ? `Escribe, ${nombre}…` : "Escribe algo…"}
            maxLength={200}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            required
          />
          <button type="submit" disabled={enviando} title="Enviar">
            <Send size={16} />
          </button>
        </div>
        {error && <small className="modal-error">{error}</small>}
      </form>
    </div>
  );
}

function Pedidos() {
  const { canciones } = useRadio();
  const { votar, uid } = useEnVivo();
  const datos = useEnVivoLista(`pedidos/${semanaActual()}`);
  const [texto, setTexto] = useState("");

  const votos = useMemo(() => {
    const m = new Map();
    for (const [id, quienes] of Object.entries(datos || {})) m.set(String(id), Object.keys(quienes || {}));
    return m;
  }, [datos]);
  const porId = useMemo(() => new Map(canciones.map((c) => [String(c.id), c])), [canciones]);
  const top = [...votos.entries()]
    .filter(([id, q]) => q.length && porId.has(id))
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10);
  const q = normalizar(texto.trim());
  const buscados = q ? canciones.filter((c) => normalizar(c.titulo).includes(q)).slice(0, 8) : [];

  const fila = (c, n) => {
    const yaVote = (votos.get(String(c.id)) || []).includes(uid);
    return (
      <li key={c.id}>
        <img className="prog-portada" src={ruta(c.portada)} alt="" loading="lazy" />
        <span className="prog-meta">
          <a className="enlace-cancion" href={`#/cancion/${c.id}`}>
            <strong>{c.titulo}</strong>
          </a>
          <small>{n ? `${n} ${n === 1 ? "voto" : "votos"}` : c.artista}</small>
        </span>
        <button
          className={`boton-icono ${yaVote ? "activo" : ""}`}
          onClick={() => votar(c.id, !yaVote)}
          title={yaVote ? "Quitar mi voto" : "Pedir esta canción"}
          aria-pressed={yaVote}
        >
          <ThumbsUp size={16} />
        </button>
      </li>
    );
  };

  return (
    <div className="pedidos">
      <p className="programacion-sub">Los más pedidos de esta semana. Cada lunes empieza de cero.</p>
      <ol>
        {top.map(([id, quienes]) => (
          fila(porId.get(id), quienes.length)
        ))}
        {datos !== null && !top.length && <li className="vacio">Aún no hay pedidos esta semana. ¡Sé el primero!</li>}
      </ol>
      <label className="buscador">
        <Search size={15} />
        <span className="solo-lector">Buscar canción para pedir</span>
        <input type="search" placeholder="Pide una canción…" value={texto} onChange={(e) => setTexto(e.target.value)} />
      </label>
      {q && (
        <ol>
          {buscados.map((c) => (
            fila(c, (votos.get(String(c.id)) || []).length)
          ))}
          {!buscados.length && <li className="vacio">No encontré esa canción.</li>}
        </ol>
      )}
    </div>
  );
}

function Muro() {
  const datos = useEnVivoLista("muro", 30);
  const lista = useMemo(() => comoLista(datos).reverse(), [datos]);
  return (
    <div className="muro">
      <p className="programacion-sub">Dedicatorias públicas. Crea la tuya con el botón "Dedicar".</p>
      <ol>
        {lista.map((d) => (
          <li key={d.id} className="muro-carta">
            <span className="muro-para">
              💌 Para <strong>{d.para}</strong>
              {d.de ? ` · de ${d.de}` : ""}
            </span>
            {d.msg && <p>{d.msg}</p>}
            <small>
              {d.cancion ? `🎵 ${d.cancion} · ` : ""}
              {haceCuanto(d.t)}
            </small>
          </li>
        ))}
        {datos !== null && !lista.length && <li className="vacio">El muro está vacío. ¡Dedica la primera!</li>}
      </ol>
    </div>
  );
}

// ---------- Ranking: las favoritas de la gente (en Música → Números) ----------
export function FavoritasDeLaGente({ canciones }) {
  const { disponible } = useEnVivo();
  const datos = useEnVivoLista(disponible ? "favoritas" : null);
  if (!disponible) return null;
  const porId = new Map(canciones.map((c) => [String(c.id), c]));
  const top = Object.entries(datos || {})
    .map(([id, quienes]) => [porId.get(String(id)), Object.keys(quienes || {}).length])
    .filter(([c, n]) => c && n)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const max = top[0]?.[1] || 1;
  return (
    <section>
      <h3 className="mini-titulo">❤ Las favoritas de la gente</h3>
      {top.length ? (
        <ul className="barras">
          {top.map(([c, n]) => (
            <li key={c.id}>
              <a className="barra-etiqueta" href={`#/cancion/${c.id}`}>
                {c.titulo}
              </a>
              <span className="barra-pista">
                <span className="barra-relleno" style={{ width: `${(n / max) * 100}%` }} />
              </span>
              <span className="barra-valor">{n}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="programacion-sub">Todavía nadie ha guardado favoritas. Toca ❤ en una canción.</p>
      )}
    </section>
  );
}

// ---------- Formulario de contacto (en Sobre mí). Solo el dueño lo lee, en la consola de Firebase ----------
export function Contacto() {
  const { disponible, publicar } = useEnVivo();
  const [datos, setDatos] = useState({ nombre: "", contacto: "", texto: "" });
  const [estado, setEstado] = useState(null); // null | "enviando" | "listo" | texto de error
  if (!disponible) return null;
  const campo = (k) => ({ value: datos[k], onChange: (e) => setDatos((d) => ({ ...d, [k]: e.target.value })) });
  const enviar = async (e) => {
    e.preventDefault();
    setEstado("enviando");
    try {
      await publicar("mensajes", {
        nombre: datos.nombre.trim().slice(0, 60),
        contacto: datos.contacto.trim().slice(0, 100),
        texto: datos.texto.trim().slice(0, 1000),
      });
      setDatos({ nombre: "", contacto: "", texto: "" });
      setEstado("listo");
    } catch (err) {
      setEstado(/PERMISSION_DENIED/i.test(String(err?.message)) ? "Ya enviaste un mensaje hace poco. Espera unos minutos." : errorAmable(err));
    }
  };
  return (
    <section className="contacto">
      <h2>Escríbeme</h2>
      {estado === "listo" ? (
        <p className="contacto-listo">¡Gracias! Tu mensaje me llegó. 🙌</p>
      ) : (
        <form onSubmit={enviar}>
          <input placeholder="Tu nombre" maxLength={60} required {...campo("nombre")} />
          <input placeholder="Cómo te respondo (correo, Instagram… opcional)" maxLength={100} {...campo("contacto")} />
          <textarea placeholder="Tu mensaje" maxLength={1000} rows={4} required {...campo("texto")} />
          <div className="modal-botones">
            <button type="submit" disabled={estado === "enviando"}>
              {estado === "enviando" ? "Enviando…" : "Enviar"}
            </button>
          </div>
          {estado && estado !== "enviando" && <small className="modal-error">{estado}</small>}
        </form>
      )}
    </section>
  );
}

// ---------- Contador de visitas ----------
export function Visitas() {
  const { disponible, visitas } = useEnVivo();
  if (!disponible || !visitas) return null;
  return <span className="visitas"> · {visitas.toLocaleString("es")} {visitas === 1 ? "visita" : "visitas"}</span>;
}
