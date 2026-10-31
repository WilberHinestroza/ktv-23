import { Play, Square } from "lucide-react";
import { useRadio } from "../radio/RadioContext";
import { ruta } from "../contenido";
import { BotonFavorito } from "./Extras";
import { useAgenda } from "./PanelesRadio";

// Barra fija abajo que mantiene la radio a mano en las demás secciones.
export default function MiniRadio() {
  const { radio, enVivo, ahora, sintonizado, sintonizar, apagar, hablando, avisos, canciones } = useRadio();
  const agenda = useAgenda();
  if (!radio || !enVivo) return null;

  // La canción con aviso (🔔) que suena más pronto, si falta menos de una hora
  const pendiente = avisos
    .map((id) => ({ id, t: agenda.get(id) }))
    .filter((x) => x.t > ahora && x.t - ahora < 3600000)
    .sort((a, b) => a.t - b.t)[0];
  const faltan = pendiente && {
    titulo: canciones.find((c) => c.id === pendiente.id)?.titulo,
    min: Math.max(1, Math.round((pendiente.t - ahora) / 60000)),
  };

  const { cancion, inicioMs, finMs } = enVivo;
  const avance = Math.min(100, ((ahora - inicioMs) / (finMs - inicioMs)) * 100);

  return (
    <aside className="mini-radio" aria-label="Radio en vivo">
      <div className="mini-barra" style={{ width: `${avance}%` }} />
      <img className="mini-portada" src={ruta(cancion.portada || radio.portada)} alt="" />
      <a className="mini-info" href="#/radio">
        <span className="en-vivo-chip">EN VIVO</span>
        <strong>{cancion.oculta ? "▒▒▒▒▒" : cancion.titulo}</strong>
        <span className="mini-artista">
          {hablando
            ? `🎙 ${hablando.nombre || "Locutor"} te está hablando…`
            : faltan
            ? `🔔 ${faltan.titulo} en ${faltan.min} min`
            : cancion.artista}
        </span>
      </a>
      <BotonFavorito cancion={cancion} chico />
      <button
        className="boton-redondo"
        onClick={sintonizado ? apagar : sintonizar}
        aria-label={sintonizado ? "Apagar la radio" : "Sintonizar la radio"}
      >
        {sintonizado ? <Square size={18} /> : <Play size={18} />}
      </button>
    </aside>
  );
}
