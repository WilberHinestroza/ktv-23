import { Play, Square } from "lucide-react";
import { useRadio } from "../radio/RadioContext";
import { ruta } from "../contenido";

// Barra fija abajo que mantiene la radio a mano en las demás secciones.
export default function MiniRadio() {
  const { radio, enVivo, ahora, sintonizado, sintonizar, apagar, hablando } = useRadio();
  if (!radio || !enVivo) return null;

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
          {hablando ? `🎙 ${radio.locutor?.nombre || "Locutor"} te está hablando…` : cancion.artista}
        </span>
      </a>
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
