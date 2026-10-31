import { useMemo, useState } from "react";
import { Mic, Search } from "lucide-react";
import { useRadio } from "../radio/RadioContext";
import { ruta } from "../contenido";
import { LOGROS } from "../radio/oyente";
import { BotonAviso, BotonFavorito } from "./Extras";

const formatoHora = (ms) => new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const DIA = 86400000;

// "hoy 3:42 p. m.", "mañana 1:10 a. m.", "jueves 8:00 p. m."
export function cuando(ms, ahora) {
  if (ms <= ahora) return "Sonando ahora";
  const inicioHoy = new Date(ahora).setHours(0, 0, 0, 0);
  const dias = Math.floor((ms - inicioHoy) / DIA);
  const hora = formatoHora(ms);
  if (dias === 0) return `Hoy ${hora}`;
  if (dias === 1) return `Mañana ${hora}`;
  const dia = new Date(ms).toLocaleDateString("es", { weekday: "long" });
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${hora}`;
}

const normalizar = (t) =>
  String(t)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

// La agenda (próxima vez que suena cada canción) se recalcula una vez por minuto
function useAgenda() {
  const { agenda, ahora, radio } = useRadio();
  const minuto = Math.floor(ahora / 60000);
  return useMemo(() => agenda(8), [minuto, radio]); // eslint-disable-line react-hooks/exhaustive-deps
}

function Fila({ cancion, detalle, acciones }) {
  return (
    <li>
      {cancion.esLocutor ? (
        <span className="prog-portada prog-mic" aria-hidden="true">
          <Mic size={16} />
        </span>
      ) : (
        <img className="prog-portada" src={ruta(cancion.portada)} alt="" loading="lazy" />
      )}
      <span className="prog-meta">
        <strong>{cancion.titulo}</strong>
        <small>{detalle}</small>
      </span>
      {acciones}
    </li>
  );
}

// ---------- Lo que ya sonó ----------
export function YaSono() {
  const { anteriores } = useRadio();
  const lista = anteriores(15).filter((x) => !x.cancion.esLocutor || x.cancion.esIntro);
  return (
    <ol>
      {lista.map(({ cancion, inicioMs }) => (
        <Fila
          key={`${cancion.id}-${inicioMs}`}
          cancion={cancion.oculta ? { ...cancion, titulo: "▒▒▒▒▒▒" } : cancion}
          detalle={`${formatoHora(inicioMs)} · ${cancion.oculta ? "???" : cancion.artista}`}
          acciones={!cancion.oculta && <BotonFavorito cancion={cancion} chico />}
        />
      ))}
    </ol>
  );
}

// ---------- ¿Cuándo suena? ----------
export function CuandoSuena() {
  const { canciones, ahora } = useRadio();
  const agenda = useAgenda();
  const [texto, setTexto] = useState("");
  const [tema, setTema] = useState(null);

  const temas = useMemo(() => [...new Set(canciones.flatMap((c) => c.temas || []))].sort(), [canciones]);
  const q = normalizar(texto.trim());
  const resultados = canciones
    .filter((c) => (!q || normalizar(c.titulo).includes(q)) && (!tema || (c.temas || []).includes(tema)))
    .map((c) => ({ c, t: agenda.get(c.id) ?? Infinity }))
    .sort((a, b) => a.t - b.t)
    .slice(0, q || tema ? 60 : 20);

  return (
    <div className="cuando-suena">
      <label className="buscador">
        <Search size={15} />
        <span className="solo-lector">Buscar canción</span>
        <input
          type="search"
          placeholder="Busca una canción…"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
      </label>
      <div className="chips-temas">
        {temas.map((t) => (
          <button key={t} className={`chip ${tema === t ? "activo" : ""}`} onClick={() => setTema(tema === t ? null : t)}>
            {t}
          </button>
        ))}
      </div>
      {!q && !tema && <p className="programacion-sub">Lo que viene pronto. Toca 🔔 y te aviso cuando suene.</p>}
      <ol>
        {resultados.map(({ c, t }) => (
          <Fila
            key={c.id}
            cancion={c}
            detalle={Number.isFinite(t) ? cuando(t, ahora) : "No suena esta semana"}
            acciones={
              <>
                <BotonFavorito cancion={c} chico />
                {Number.isFinite(t) && t > ahora && <BotonAviso cancion={c} />}
              </>
            }
          />
        ))}
        {!resultados.length && <li className="vacio">No encontré esa canción.</li>}
      </ol>
    </div>
  );
}

// ---------- Mi radio: favoritas, estadísticas y logros ----------
const formatoDuracion = (seg) => {
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  return h ? `${h} h ${m} min` : `${m} min`;
};

export function MiRadio() {
  const { canciones, favoritos, logros, escucha, ahora } = useRadio();
  const agenda = useAgenda();
  const favs = favoritos
    .map((id) => canciones.find((c) => c.id === id))
    .filter(Boolean)
    .map((c) => ({ c, t: agenda.get(c.id) ?? Infinity }))
    .sort((a, b) => a.t - b.t);
  const desbloqueados = LOGROS.filter((l) => logros[l.id]).length;

  return (
    <div className="mi-radio">
      <div className="estadisticas">
        <div>
          <strong>{formatoDuracion(escucha.segundos)}</strong>
          <small>escuchando</small>
        </div>
        <div>
          <strong>
            {escucha.canciones.length}/{canciones.length}
          </strong>
          <small>canciones oídas</small>
        </div>
        <div>
          <strong>
            {desbloqueados}/{LOGROS.length}
          </strong>
          <small>logros</small>
        </div>
      </div>

      <h3 className="mini-titulo">❤ Tus favoritas</h3>
      {favs.length ? (
        <ol>
          {favs.map(({ c, t }) => (
            <Fila
              key={c.id}
              cancion={c}
              detalle={Number.isFinite(t) ? cuando(t, ahora) : "No suena esta semana"}
              acciones={
                <>
                  <BotonFavorito cancion={c} chico />
                  {Number.isFinite(t) && t > ahora && <BotonAviso cancion={c} />}
                </>
              }
            />
          ))}
        </ol>
      ) : (
        <p className="programacion-sub">Toca el corazón en cualquier canción para guardarla aquí y ver cuándo vuelve a sonar.</p>
      )}

      <h3 className="mini-titulo">🏆 Logros</h3>
      <ul className="logros">
        {LOGROS.map((l) => {
          const ok = Boolean(logros[l.id]);
          const secreto = !ok && (l.id === "konami" || l.id === "senal" || l.id === "detective");
          return (
            <li key={l.id} className={ok ? "ok" : ""} title={secreto ? "Secreto" : l.texto}>
              <span className="logro-icono">{ok ? l.icono : secreto ? "❔" : "🔒"}</span>
              <span>
                <strong>{secreto ? "???" : l.titulo}</strong>
                <small>{secreto ? "Logro secreto" : l.texto}</small>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="programacion-nota">Esto se guarda solo en este navegador.</p>
    </div>
  );
}
