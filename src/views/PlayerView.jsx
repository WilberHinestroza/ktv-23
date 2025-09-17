import { useEffect, useRef, useState, useCallback } from "react";
import SongController from "../controllers/SongController";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Radio, AudioLines, Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import "./PlayerView.css";

export default function PlayerView() {
    const [songs, setSongs] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isRandom, setIsRandom] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [useVideo, setUseVideo] = useState(false);
    const [showScaryVideo, setShowScaryVideo] = useState(false);
    const [hiddenSongs, setHiddenSongs] = useState([]);

    const [showGlitch, setShowGlitch] = useState(false);
    const [coverGlitchOffset, setCoverGlitchOffset] = useState(0);
    const glitchTimeout = useRef(null);

    const audioRef = useRef(null);

    /** 🔹 Función para reproducir canción aleatoria */
    const playRandom = useCallback(() => {
        if (songs.length > 1) {
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * songs.length);
            } while (randomIndex === currentIndex);
            setCurrentIndex(randomIndex);
        }
    }, [songs, currentIndex]);

    /** 🔹 Siguiente y anterior canción */
    const nextSong = useCallback(() => {
        const currentSong = songs[currentIndex];

        // Buscar ocultos que vayan después de esta canción
        const posiblesOcultos = hiddenSongs.filter(h => h.afterId === currentSong.id);

        if (posiblesOcultos.length > 0) {
            const elegido = posiblesOcultos[Math.floor(Math.random() * posiblesOcultos.length)];
            if (Math.random() < elegido.chance) {
                // Reproduce el oculto directo SIN ponerlo en la lista
                const audio = new Audio(elegido.song.src);
                audio.volume = volume; // 👈 aquí agregas la línea
                audio.play();
                audio.onended = () => {
                    // cuando termine → pasamos al siguiente visible
                    setCurrentIndex(prev => (prev + 1) % songs.length);
                };
                return;
            }
        }

        // Si no hay oculto → sigue normal
        if (isRandom) playRandom();
        else setCurrentIndex(prev => (prev + 1) % songs.length);
    }, [songs, hiddenSongs, currentIndex, isRandom, playRandom]);

    const prevSong = useCallback(() => {
        const currentSong = songs[currentIndex];

        // Buscar ocultos que vayan ANTES de esta canción
        const posiblesOcultos = hiddenSongs.filter(h => h.beforeId === currentSong.id);

        if (posiblesOcultos.length > 0) {
            // Elegir un oculto aleatorio entre los posibles
            const elegido = posiblesOcultos[Math.floor(Math.random() * posiblesOcultos.length)];
            if (Math.random() < elegido.chance) {
                // Reproduce el oculto SIN mostrarlo en la lista
                const audio = new Audio(elegido.song.src);
                audio.volume = volume; // 👈 aquí agregas la línea
                audio.play();
                audio.onended = () => {
                    // cuando termine → pasamos al anterior visible
                    if (isRandom) playRandom();
                    else setCurrentIndex(prev => (prev - 1 + songs.length) % songs.length);
                };
                return;
            }
        }

        // Si no hay oculto → sigue normal
        if (isRandom) playRandom();
        else setCurrentIndex(prev => (prev - 1 + songs.length) % songs.length);
    }, [songs, hiddenSongs, currentIndex, isRandom, playRandom]);

    /** 🔹 Cargar canciones al inicio */
    useEffect(() => {
        const { visibles, ocultas } = SongController.getSongs();
        setSongs(visibles);       // solo visibles van a la lista
        setHiddenSongs(ocultas);  // guardamos ocultas en otro estado
    }, []);

    const isPlayingRef = useRef(isPlaying);

    // Mantener actualizado el ref cada vez que cambie isPlaying
    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    // Efecto para cambiar canción
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || songs.length === 0) return;

        audio.src = songs[currentIndex].src;
        setUseVideo(Math.random() < 0.15);
        audio.load();

        // usar el ref en lugar de isPlaying
        if (isPlayingRef.current) {
            audio.play().catch(() => setIsPlaying(false));
        }
    }, [currentIndex, songs]); // ahora ESLint ya no se queja

    /** 🔹 Eventos de audio (no reinician la canción) */
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
                const duration = Math.random() * 1000 + 1000; // 1-2 seg
                setTimeout(() => setShowScaryVideo(false), duration);
            }
        }, 60000); // cada 60 seg
        return () => clearInterval(interval);
    }, [useVideo]);

    /** 🔹 Controles de reproducción */
    const togglePlayPause = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => { });
        }
    };

    const toggleRandom = () => setIsRandom(prev => !prev);

    const handleVolumeChange = (e) => {
        const vol = parseFloat(e.target.value);
        setVolume(vol);
        if (audioRef.current) audioRef.current.volume = vol;
    };

    const handleProgressChange = (e) => {
        const newTime = parseFloat(e.target.value);
        if (audioRef.current) audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const formatTime = (secs) => {
        if (!secs || isNaN(secs)) return "0:00";
        const minutes = Math.floor(secs / 60);
        const seconds = Math.floor(secs % 60).toString().padStart(2, "0");
        return `${minutes}:${seconds}`;
    };

    /** 🔹 Glitch al mover mouse */
    const handleMouseMove = () => {
        setShowGlitch(true);
        if (glitchTimeout.current) clearTimeout(glitchTimeout.current);
        glitchTimeout.current = setTimeout(() => setShowGlitch(false), 1000);
        setCoverGlitchOffset(Math.random() * 6 - 3);
    };

    const renderGlitches = () => {
        const glitches = [];
        for (let i = 0; i < 5; i++) {
            glitches.push(
                <div
                    key={i}
                    className="glitch-line"
                    style={{
                        top: `${Math.random() * 100}%`,
                        height: `${Math.random() * 6 + 2}px`,
                        opacity: Math.random() * 0.1 + 0.2,
                    }}
                />
            );
        }
        return glitches;
    };

    const currentSong = songs[currentIndex];

    return (
        <div className="player-layout" onMouseMove={handleMouseMove}>
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
                        style={{ display: "flex", alignItems: "center", marginRight: "6px" }}
                    >
                        <Radio size={18} color="red" />
                    </motion.div>
                    EN VIVO
                </a>

                {currentSong && (
                    <>
                        <div className="cover-wrapper" style={{ transform: `translateX(${coverGlitchOffset}px)` }}>
                            {!useVideo && showScaryVideo ? (
                                <video
                                    src={currentSong.video} // scary
                                    autoPlay
                                    loop
                                    muted
                                    className="cover-image"
                                />
                            ) : useVideo ? (
                                <video
                                    src={currentSong.video} // cover
                                    autoPlay
                                    loop
                                    muted
                                    className="cover-image"
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
                            <button
                                onClick={toggleRandom}
                                className={`icon-button ${isRandom ? "random-on" : "random-off"}`}
                            >
                                {isRandom ? <Shuffle size={20} /> : <Repeat size={20} />}
                            </button>
                            <button className="icon-button" onClick={prevSong}>
                                <SkipBack size={20} />
                            </button>
                            <button className="play-button icon-button" onClick={togglePlayPause}>
                                {isPlaying ? <Pause size={22} color="white" /> : <Play size={22} color="white" />}
                            </button>
                            <button className="icon-button" onClick={nextSong}>
                                <SkipForward size={20} />
                            </button>
                            <div className="volume-control icon-button">
                                <button className="volume-button">
                                    <Volume2 size={20} />
                                    <input
                                        className="volume-slider"
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={volume}
                                        onChange={handleVolumeChange}
                                    />
                                </button>
                            </div>
                        </div>

                        <div>
                            <span className="time">{formatTime(currentTime)}/{formatTime(duration)}</span>
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
            </div>

            <div className="playlist-panel">
                <h3 className="playlist-title">KTV23 Playlist</h3>
                <ul className="song-list">
                    {songs.map((song, index) => (
                        <li
                            key={song.id}
                            onClick={() => setCurrentIndex(index)}
                            className={index === currentIndex ? "active-song" : ""}
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
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
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                    style={{ marginLeft: "12px", display: "inline-flex" }}
                                >
                                    <AudioLines size={18} color="white" />
                                </motion.div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            {showGlitch && (
                <div className="glitch-overlay">
                    {renderGlitches()}
                </div>
            )}
        </div>
    );
}
