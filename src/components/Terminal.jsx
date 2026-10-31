import { useEffect, useRef, useState } from "react";
import { cargarJSON } from "../contenido";
import { useRadio } from "../radio/RadioContext";

// Una consola de mentira en "Sobre mí": escribe "help" para ver los comandos.
const COMANDOS = ["help", "whoami", "bio", "skills", "proyectos", "musica", "ahora", "radio", "apagar", "links", "fecha", "echo", "clear", "hack", "sudo", "exit"];

export default function Terminal({ perfil }) {
  const r = useRadio();
  const [lineas, setLineas] = useState([
    { t: "sistema", texto: `KeNnyga OS v23.0 — escribe "help" para ver los comandos.` },
  ]);
  const [entrada, setEntrada] = useState("");
  const [historial, setHistorial] = useState([]);
  const [pos, setPos] = useState(-1);
  const finRef = useRef(null);
  const cajaRef = useRef(null);

  useEffect(() => {
    if (cajaRef.current) cajaRef.current.scrollTop = cajaRef.current.scrollHeight;
  }, [lineas]);

  const escribir = (...textos) => setLineas((l) => [...l, ...textos.map((texto) => (typeof texto === "string" ? { texto } : texto))]);

  const ejecutar = async (cmd) => {
    const [nombre, ...args] = cmd.trim().split(/\s+/);
    escribir({ t: "cmd", texto: cmd });
    switch ((nombre || "").toLowerCase()) {
      case "":
        return;
      case "help":
        return escribir(
          "whoami     quién soy",
          "bio        mi historia",
          "skills     lo que sé hacer",
          "proyectos  lo que he construido",
          "musica     la discografía",
          "ahora      qué suena en la radio",
          "radio      sintonizar la radio · apagar: apagarla",
          "links      dónde encontrarme",
          "fecha · echo · clear · hack · …"
        );
      case "whoami":
        return escribir(`${perfil.nombre}${perfil.alias ? ` (aka ${perfil.alias})` : ""}`);
      case "bio":
        return escribir(...(perfil.bio || []));
      case "skills":
        return escribir((perfil.habilidades || []).map((h) => `[${h}]`).join(" "));
      case "proyectos": {
        try {
          const p = await cargarJSON("proyectos.json");
          return escribir(...p.items.map((i) => `• ${i.titulo} — ${(i.etiquetas || []).join(", ")}`), { t: "enlace", texto: "→ ver todos", href: "#/proyectos" });
        } catch {
          return escribir({ t: "error", texto: "No pude leer los proyectos." });
        }
      }
      case "musica":
      case "música":
        return escribir(
          `${r.radio?.albumes?.length || 0} lanzamientos · ${r.radio?.canciones?.length || 0} canciones`,
          { t: "enlace", texto: "→ abrir Música", href: "#/musica" }
        );
      case "ahora": {
        const c = r.enVivo?.cancion;
        return escribir(c ? `♪ ${c.titulo} — ${c.artista} (${r.enVivo.programa.titulo})` : "La señal todavía no carga.");
      }
      case "radio":
      case "sintonizar":
        r.sintonizar();
        return escribir("📻 Sintonizando KeNnyga Radio 112.3 FM…");
      case "apagar":
        r.apagar();
        return escribir("Radio apagada.");
      case "links":
        return escribir(...(perfil.enlaces || []).map((l) => ({ t: "enlace", texto: `${l.texto}: ${l.url}`, href: l.url })));
      case "fecha":
        return escribir(new Date().toLocaleString("es"));
      case "echo":
        return escribir(args.join(" "));
      case "clear":
        return setLineas([]);
      case "sudo":
        return escribir({ t: "error", texto: "Permiso denegado. Este incidente será reportado a Raúl y Sabina." });
      case "exit":
        return escribir("No hay salida. Solo radio. 📻");
      case "hack": {
        const pasos = ["Conectando con la antena 112.3…", "Saltando el firewall de KeNnyga…", "Descifrando Archivos del Canal…", "Acceso… DENEGADO. Prueba ↑↑↓↓←→←→BA"];
        pasos.forEach((p, i) => setTimeout(() => escribir({ t: i === pasos.length - 1 ? "error" : "sistema", texto: p }), 500 * (i + 1)));
        return;
      }
      default:
        return escribir({ t: "error", texto: `${nombre}: comando no encontrado. Escribe "help".` });
    }
  };

  const alTeclear = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const cmd = entrada;
      if (cmd.trim()) setHistorial((h) => [cmd, ...h].slice(0, 30));
      setEntrada("");
      setPos(-1);
      ejecutar(cmd);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const n = Math.min(pos + 1, historial.length - 1);
      if (n >= 0) {
        setPos(n);
        setEntrada(historial[n]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const n = pos - 1;
      setPos(Math.max(-1, n));
      setEntrada(n >= 0 ? historial[n] : "");
    } else if (e.key === "Tab") {
      e.preventDefault();
      const opciones = COMANDOS.filter((c) => c.startsWith(entrada.toLowerCase()));
      if (opciones.length === 1) setEntrada(opciones[0]);
      else if (opciones.length > 1) escribir({ t: "sistema", texto: opciones.join("  ") });
    }
  };

  return (
    <div className="terminal" onClick={() => finRef.current?.focus()}>
      <div className="terminal-barra" aria-hidden="true">
        <span />
        <span />
        <span />
        <small>wildberry@kennyga: ~</small>
      </div>
      <div className="terminal-cuerpo" ref={cajaRef} aria-live="polite">
        {lineas.map((l, i) =>
          l.t === "cmd" ? (
            <p key={i}>
              <span className="terminal-prompt">$</span> {l.texto}
            </p>
          ) : l.t === "enlace" ? (
            <p key={i}>
              <a href={l.href} target={l.href.startsWith("#") ? undefined : "_blank"} rel="noopener noreferrer">
                {l.texto}
              </a>
            </p>
          ) : (
            <p key={i} className={l.t ? `terminal-${l.t}` : ""}>
              {l.texto}
            </p>
          )
        )}
        <label className="terminal-linea">
          <span className="terminal-prompt">$</span>
          <span className="solo-lector">Comando</span>
          <input
            ref={finRef}
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            onKeyDown={alTeclear}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
          />
        </label>
      </div>
    </div>
  );
}
