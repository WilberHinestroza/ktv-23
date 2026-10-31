import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Mic, Minimize2, Play, Square } from "lucide-react";
import { useRadio } from "../radio/RadioContext";
import { ruta } from "../contenido";
import { Visualizador } from "./Extras";
import Letra from "./Letra";

// Pantalla completa para dejar la radio puesta (en la tele, el PC o el carro):
// portada gigante, reloj, letra y botones grandes.
export default function ModoTV({ cerrar }) {
  const { radio, enVivo, ahora, sintonizado, sintonizar, apagar, hablando } = useRadio();
  const [, setTick] = useState(0);

  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    const alSalir = () => !document.fullscreenElement && cerrar();
    const alTeclear = (e) => e.key === "Escape" && cerrar();
    document.addEventListener("fullscreenchange", alSalir);
    window.addEventListener("keydown", alTeclear);
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      document.removeEventListener("fullscreenchange", alSalir);
      window.removeEventListener("keydown", alTeclear);
      clearInterval(id);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, [cerrar]);

  if (!radio || !enVivo) return null;
  const { cancion, inicioMs, finMs, programa } = enVivo;
  const avance = Math.min(100, ((ahora - inicioMs) / (finMs - inicioMs)) * 100);
  const portada = ruta(cancion.portada || radio.portada);
  const reloj = new Date(ahora).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Va directo al <body> para tapar todo (si no, queda atrapado dentro del reproductor)
  return createPortal(
    <div className="modo-tv" role="dialog" aria-modal="true" aria-label="Modo TV">
      <div className="tv-fondo" style={{ backgroundImage: `url("${portada}")` }} aria-hidden="true" />
      <Visualizador />
      <header className="tv-arriba">
        <span className="en-vivo-chip">● EN VIVO · {programa.titulo}</span>
        <span className="tv-reloj">{reloj}</span>
        <button className="boton-icono" onClick={cerrar} aria-label="Salir del modo TV" title="Salir (Esc)">
          <Minimize2 size={18} />
        </button>
      </header>
      <div className="tv-centro">
        <div className="portada tv-portada">
          <img src={portada} alt={cancion.titulo} />
        </div>
        <div className="tv-info">
          <h1>{cancion.oculta ? "▒▒▒▒▒▒" : cancion.titulo}</h1>
          <p>{cancion.oculta ? "???" : cancion.artista}</p>
          {cancion.letra && <Letra archivo={cancion.letra} segundo={(ahora - inicioMs) / 1000} compacta />}
          {hablando && (
            <p className="tv-locutor">
              <Mic size={18} /> {hablando.nombre}: “{hablando.texto}”
            </p>
          )}
          <div className="progreso tv-progreso">
            <div className="progreso-relleno" style={{ width: `${avance}%` }} />
          </div>
          <button className={`boton-sintonizar tv-boton ${sintonizado ? "encendido" : ""}`} onClick={sintonizado ? apagar : sintonizar}>
            {sintonizado ? <Square size={28} /> : <Play size={28} />}
            {sintonizado ? "Apagar" : "Sintonizar"}
          </button>
        </div>
      </div>
      <footer className="tv-abajo">{radio.nombre}</footer>
    </div>,
    document.body
  );
}
