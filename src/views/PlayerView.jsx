import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import SongController from "../controllers/SongController";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  Radio,
  Files,
  AudioLines,
  Play,
  Pause,
  SkipForward,
  SkipBack,
} from "lucide-react";
import { motion } from "framer-motion";
import "./PlayerView.css";

export default function PlayerView() {
  const PUBLIC = process.env.PUBLIC_URL;
  const ARCHIVE_PASSWORD = process.env.REACT_APP_ARCHIVE_PASSWORD || "conectateKTV23";
  const [songs, setSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [useVideo, setUseVideo] = useState(false);
  const [showScaryVideo, setShowScaryVideo] = useState(false);
  const [hiddenSongs, setHiddenSongs] = useState([]);
  const [hiddenNow, setHiddenNow] = useState(null);
  const [lastWasHidden, setLastWasHidden] = useState(false);
  const [coverGlitchOffset, setCoverGlitchOffset] = useState(0);
  const glitchTimeout = useRef(null);

  const [open, setOpen] = useState(false);

  const audioRef = useRef(null);
  const hiddenAudioRef = useRef(null); // 🔹 referencia al audio oculto
  const isPlayingRef = useRef(isPlaying);

  const [showArchivePrompt, setShowArchivePrompt] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [accessGranted, setAccessGranted] = useState(false);

  const handleArchiveAccess = () => {
    if (accessCode === ARCHIVE_PASSWORD) {
      setAccessGranted(true);
      setShowArchivePrompt(false);
      setAccessCode(""); // limpiar input
    } else {
      alert("Contraseña incorrecta, te estamos observando");
    }
  };

  const normalLinks = useMemo(
    () => [
      { text: "Mensajes del Director", url: "https://youtu.be/gf_zn_39nfQ" },
      { text: "Transmisión perdida #1", url: "https://youtu.be/ryq0dus6IkU" },
      { text: "Grabación inédita", url: "https://youtu.be/1IefJeGjRNk" },
    ],
    []
  );

  const weirdMessages = useMemo(
    () => [
      //estas seguro que estas bien?
      { text: "EEUS SGEB TUEI ARSE SOTN SQA?", url: "https://youtu.be/xyz123" }, 
      //Bienaventurados los que no cambian el canal, porque de ellos será la transmisión eterna 
      { text: "BSAAS OILNS NEOP EE N SLOR T AQCR A E VUAR LR EE MU A NNNB E T A TOID RX UCAE AX RANE NX AME L SX DBLL M XOIC OIX", url: null }, 
      // hijo mio, vuelve a mi y obedeceme
      { text: "SIRQ NRO, EFVOV Z NR B OYVEVXVNV", url: null }, 
    ],
    []
  );

  const [tickerItems, setTickerItems] = useState(normalLinks);

  useEffect(() => {
    const interval = setInterval(() => {
      let items = [...normalLinks];

      if (Math.random() < 0.3) {
        const randomWeird =
          weirdMessages[Math.floor(Math.random() * weirdMessages.length)];
        items.push(randomWeird); // ya trae text y url
      }

      items = items.sort(() => Math.random() - 0.5);

      setTickerItems(items);
    }, 10000);

    return () => clearInterval(interval);
  }, [normalLinks, weirdMessages]);

  /** 🔹 Función para parar oculto si existe */
  const stopHiddenAudio = useCallback(() => {
    if (hiddenAudioRef.current) {
      hiddenAudioRef.current.pause();
      hiddenAudioRef.current = null;
      setHiddenNow(null); // 👈 también limpiamos la UI
    }
  }, []);

  /** 🔹 Siguiente canción */
  const nextSong = useCallback(() => {
    stopHiddenAudio();

    const currentSong = songs[currentIndex];

    if (lastWasHidden) {
      setLastWasHidden(false);
      setCurrentIndex((prev) => (prev + 1) % songs.length); // 👈 AVANZAR NORMAL
      return;
    }

    const posiblesOcultos = hiddenSongs.flatMap((h) => {
      if (h.afterId === currentSong.id) {
        // Caso normal → más peso (ej: 3 veces)
        return [h, h];
      }
      if (h.afterId === 20 && currentSong.id >= 2 && currentSong.id <= 5)
        return [h];
      if (h.afterId === 30 && currentSong.id >= 1 && currentSong.id <= 17)
        return [h];
      return [];
    });

    if (posiblesOcultos.length > 0) {
      let elegido;

      if (posiblesOcultos.length === 2) {
        const minutos = new Date().getMinutes();
        elegido = minutos % 2 === 0 ? posiblesOcultos[0] : posiblesOcultos[1];
      } else {
        elegido =
          posiblesOcultos[Math.floor(Math.random() * posiblesOcultos.length)];
      }

      if (Math.random() < elegido.chance) {
        if (audioRef.current) audioRef.current.pause();

        setHiddenNow(elegido.song);
        const audio = new Audio(elegido.song.src);
        hiddenAudioRef.current = audio;

        audio.play();
        audio.onended = () => {
          hiddenAudioRef.current = null;
          setHiddenNow(null);
          setLastWasHidden(true);
          setCurrentIndex((prev) => (prev + 1) % songs.length);
        };
        return;
      }
    }

    // Si no hubo oculto, avanzamos igual
    setCurrentIndex((prev) => (prev + 1) % songs.length);
  }, [songs, hiddenSongs, currentIndex, stopHiddenAudio, lastWasHidden]);

  /** 🔹 Canción anterior */
  const prevSong = useCallback(() => {
    stopHiddenAudio();

    const currentSong = songs[currentIndex];

    if (lastWasHidden) {
      setLastWasHidden(false);
      setCurrentIndex((prev) => (prev - 1 + songs.length) % songs.length); // 👈 RETROCEDER NORMAL
      return;
    }

    const posiblesOcultos = hiddenSongs.flatMap((h) => {
      if (h.afterId === currentSong.id) {
        // Caso normal → más peso (ej: 3 veces)
        return [h, h];
      }
      if (h.afterId === 20 && currentSong.id >= 2 && currentSong.id <= 17)
        return [h];
      if (h.afterId === 30 && currentSong.id >= 1 && currentSong.id <= 17)
        return [h];
      return [];
    });

    if (posiblesOcultos.length > 0) {
      let elegido;

      if (posiblesOcultos.length === 2) {
        const minutos = new Date().getMinutes();
        elegido = minutos % 2 === 0 ? posiblesOcultos[0] : posiblesOcultos[1];
      } else {
        elegido =
          posiblesOcultos[Math.floor(Math.random() * posiblesOcultos.length)];
      }

      if (Math.random() < elegido.chance) {
        if (audioRef.current) audioRef.current.pause();

        setHiddenNow(elegido.song);
        const audio = new Audio(elegido.song.src);
        hiddenAudioRef.current = audio;

        audio.play();
        audio.onended = () => {
          hiddenAudioRef.current = null;
          setHiddenNow(null);
          setLastWasHidden(true);
          setCurrentIndex((prev) => (prev - 1 + songs.length) % songs.length);
        };
        return;
      }
    }

    // 👇 si no hubo oculto, retrocedemos igual
    setCurrentIndex((prev) => (prev - 1 + songs.length) % songs.length);
  }, [songs, hiddenSongs, currentIndex, stopHiddenAudio, lastWasHidden]);

  /** 🔹 Cargar canciones al inicio */
  useEffect(() => {
    const { visibles, ocultas } = SongController.getSongs();
    setSongs(visibles);
    setHiddenSongs(ocultas);
  }, []);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || songs.length === 0) return;

    audio.src = songs[currentIndex].src;
    setUseVideo(Math.random() < 0.15);
    audio.load();

    if (isPlayingRef.current) {
      audio.play().catch(() => setIsPlaying(false));
    }
  }, [currentIndex, songs]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || songs.length === 0) return;

    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => nextSong();

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentIndex, songs, nextSong]);

  /** 🔹 Video scary aleatorio */
  useEffect(() => {
    if (useVideo) return;
    const interval = setInterval(() => {
      if (Math.random() < 0.1) {
        setShowScaryVideo(true);
        const duration = Math.random() * 1000 + 1000;
        setTimeout(() => setShowScaryVideo(false), duration);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [useVideo]);

  /** 🔹 Controles de reproducción */
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      stopHiddenAudio();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

  const handleProgressChange = (e) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  /** 🔹 Glitch efecto */
  const handleMouseMove = () => {
    if (glitchTimeout.current) clearTimeout(glitchTimeout.current);
    glitchTimeout.current = setTimeout(() => setCoverGlitchOffset(0), 1000);
    setCoverGlitchOffset(Math.random() * 6 - 3);
  };

  const hiddenImages = [
    `${PUBLIC}/cover/ktv23-cover.webp`,
    `${PUBLIC}/cover/ED.png`,
    `${PUBLIC}/cover/ktv23-cover.webp`,
    `${PUBLIC}/cover/ED.png`,
    `${PUBLIC}/cover/ktv23-cover.webp`,
  ];

  const [position, setPosition] = useState({ top: 50, left: 50 });
  const [visibleImage, setVisibleImage] = useState(null);

  // Movimiento aleatorio cada 2 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      const top = Math.random() * 80 + 10; // evita que se salga de la pantalla
      const left = Math.random() * 80 + 10;
      setPosition({ top, left });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    const randomIndex = Math.floor(Math.random() * hiddenImages.length);
    setVisibleImage(hiddenImages[randomIndex]);
  };

  const tvSchedule = [
    { text: "====== ESTA MAÑANA ======", url: null },
    { text: "00:00 am - Intro", url: null },
    { text: "02:00 am - KeNny gaLindo", url: null },
    { text: "04:00 am - Sigiloso", url: null },
    { text: "06:00 am - Gotdamn", url: null },
    { text: "08:30 am - Damisela", url: null },
    { text: "10:45 am - Todos juzgan", url: null },
    { text: "====== ESTA TARDE ======", url: null },
    { text: "12:00 - Noticiero KTV", url: null },
    { text: "13:30 - Komo2", url: null },
    { text: "15:00 - 24/7", url: null },
    { text: "16:00 - Lo nuestro", url: null },
    { text: "16:30 - Delirante", url: null },
    { text: "17:00 - Infomerciales", url: null },
    { text: "====== ESTA NOCHE ======", url: null },
    { text: "18:00 - Trance", url: null },
    { text: "19:30 - Brou", url: null },
    { text: "20:00 - Tamagotchi", url: null },
    { text: "22:00 - CQNSD", url: null },
    { text: "22:30 - Paranoia", url: null },
    { text: "23:30 - Outro", url: null },
  ];

  const currentSong = songs[currentIndex];

  return (
    <div className="player-layout" onMouseMove={handleMouseMove}>
      {/* Botón invisible */}
      <button
        onClick={handleClick}
        style={{
          position: "fixed",
          top: `${position.top}%`,
          left: `${position.left}%`,
          width: "100px", // más grande
          height: "100px", // más grande
          opacity: 0, // visible para probar
          background: "red", // color visible
          borderRadius: "20%", // circular
          zIndex: 999,
          cursor: "pointer",
          border: "none",
          fontWeight: "bold",
          fontSize: "14px",
          color: "#fff",
        }}
      />

      {/* Imagen oculta que aparece al hacer clic */}
      {visibleImage && (
        <div
          onClick={() => setVisibleImage(null)} // clic fuera cierra
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            animation: "fadeIn 0.3s ease",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ textAlign: "center" }}
          >
            <img
              src={visibleImage}
              alt="Oculta"
              style={{
                maxWidth: "80vw",
                maxHeight: "80vh",
                borderRadius: "12px",
                boxShadow: "0 0 20px rgba(255,255,255,0.5)",
              }}
            />
          </div>
        </div>
      )}

      <div className="player-panel">
        <a
          className="live-button live-button-left"
          href="https://youtu.be/0oYSh7HUDng?si=7e3U_q1KCGFPlnKG"
          target="_blank"
          rel="noopener noreferrer"
        >
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{
              display: "flex",
              alignItems: "center",
              marginRight: "6px",
            }}
          >
            <Radio size={18} color="red" />
          </motion.div>
          EN VIVO
        </a>
        <button
          onClick={() => setShowArchivePrompt(true)}
          className="archive-button"
        >
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{
              display: "flex",
              alignItems: "center",
              marginRight: "6px",
            }}
          >
            <Files size={18} color="cyan" />
          </motion.div>
          Archivos
        </button>
        {currentSong && (
          <>
            <div
              className="cover-wrapper"
              style={{ transform: `translateX(${coverGlitchOffset}px)` }}
            >
              {!useVideo && showScaryVideo ? (
                <video
                  src={currentSong.video} // scary
                  autoPlay
                  loop
                  muted
                  className="cover-image"
                  controls={false}
                  disablePictureInPicture
                  playsInline
                  webkit-playsinline="true"
                />
              ) : useVideo ? (
                <video
                  src={currentSong.video} // cover
                  autoPlay
                  loop
                  muted
                  className="cover-image"
                  controls={false}
                  disablePictureInPicture
                  playsInline
                  webkit-playsinline="true"
                />
              ) : (
                <img
                  src={currentSong.cover} // imagen
                  alt={currentSong.title}
                  className="cover-image"
                />
              )}
            </div>

            <h2 className="song-title">{currentSong.title}</h2>
            <p className="song-artist">{currentSong.artist}</p>

            <div className="controls">
              <button className="icon-button" onClick={prevSong}>
                <SkipBack size={20} />
              </button>
              <button
                className="play-button icon-button"
                onClick={togglePlayPause}
              >
                {isPlaying ? (
                  <Pause size={22} color="white" />
                ) : (
                  <Play size={22} color="white" />
                )}
              </button>
              <button className="icon-button" onClick={nextSong}>
                <SkipForward size={20} />
              </button>
            </div>

            <div>
              <span className="time">
                {formatTime(currentTime)}/{formatTime(duration)}
              </span>
            </div>
            <div className="progress-container">
              <input
                type="range"
                className="progress-bar"
                min="0"
                max={duration}
                step="0.1"
                value={currentTime}
                onChange={handleProgressChange}
              />
            </div>
            <audio ref={audioRef} />
          </>
        )}

        {/* 🔻 Barra inferior tipo “canal” */}
        <div className="ticker-bar">
          <div className="ticker-text">
            {"KTV23 · "}
            <span
              className="ticker-program"
              onClick={() => setOpen(true)}
              style={{ cursor: "pointer", fontWeight: "bold" }}
            >
              Programacion
            </span>
            {" ·"}
            {tickerItems.map((item, index) => (
              <span key={`ticker-${index}`}>
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.text}
                  </a>
                ) : (
                  <span>{item.text}</span>
                )}
                {index !== tickerItems.length - 1 && " · "}
              </span>
            ))}
          </div>
        </div>
      </div>
      {/* Playlist */}
      <div className="playlist-panel">
        <h3 className="playlist-title">KTV23 Playlist</h3>
        <ul className="song-list">
          {songs.map((song, index) => (
            <li
              key={song.id}
              onClick={() => setCurrentIndex(index)}
              className={index === currentIndex ? "active-song" : ""}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <img src={song.cover} alt={song.title} className="mini-cover" />
                <div className="song-meta">
                  <strong className="mini-title">{song.title}</strong>
                  <div className="mini-artist">{song.artist}</div>
                </div>
              </div>
              {index === currentIndex && isPlaying && (
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{ marginLeft: "12px", display: "inline-flex" }}
                >
                  <AudioLines size={18} color="white" />
                </motion.div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* MODAL */}
      {open && (
        <div
          className="schedule-modal"
          onClick={() => setOpen(false)} // clic fuera cierra el modal
        >
          <div
            className="schedule-content"
            onClick={(e) => e.stopPropagation()} // evita que clic dentro cierre
          >
            <h2>Programación KTV23</h2>
            <ul className="schedule-content-ul">
              {tvSchedule.map((program, index) => (
                <li
                  key={index}
                  onClick={() => {
                    if (program.url) {
                      window.open(program.url, "_blank");
                    }
                  }}
                  className={program.url ? "clickable-item" : ""}
                >
                  {program.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Banner de canción oculta */}
      {hiddenNow && (
        <div className="hidden-banner">
          <h4>{hiddenNow.title}</h4>
          <p>{hiddenNow.artist}</p>
          {hiddenNow.cover && (
            <img src={hiddenNow.cover} alt={hiddenNow.title} />
          )}
        </div>
      )}

      {showArchivePrompt && (
        <div
          className="archive-modal"
          onClick={() => {
            setShowArchivePrompt(false);
            setAccessCode(""); // limpiar al cerrar
          }}
        >
          <div
            className="archive-box"
            onClick={(e) => e.stopPropagation()} // evita que clic dentro cierre
          >
            <h3>Archivos del Canal</h3>
            <p>Ingrese el código de acceso:</p>
            <input
              type="password"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="archive-input"
              placeholder="••••••••••••"
            />
            <div className="archive-buttons">
              <button onClick={handleArchiveAccess}>Entrar</button>
              <button
                onClick={() => {
                  setShowArchivePrompt(false);
                  setAccessCode(""); // limpiar al cerrar
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {accessGranted && (
        <div
          className="archive-modal"
          onClick={() => setAccessGranted(false)} // clic en el fondo cierra
        >
          <div
            className="archive-content"
            onClick={(e) => e.stopPropagation()} // evita que clic dentro cierre
          >
            <h2>
              <Files /> Archivos del Canal
            </h2>
            <p>
              Aquí se guardan las transmisiones perdidas, grabaciones inéditas y
              mensajes del Director nunca emitidos.
            </p>

            <ul className="archive-list">
              <li>
                <a
                  href="https://youtu.be/jjG8fzOjwVk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="archive-link"
                >
                  🎞️ Transmisión perdida #1
                </a>
              </li>
              <li>
                <a
                  href="https://youtu.be/fjCjrngerEM"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="archive-link"
                >
                  🔊 Grabación inédita: “El Director Habla”
                </a>
              </li>
              <li>
                <a
                  href="https://youtu.be/zgqxu_FaLVA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="archive-link"
                >
                  🕳️ Mensajes del Director
                </a>
              </li>
            </ul>

            <button
              onClick={() => setAccessGranted(false)}
              className="close-archive"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
