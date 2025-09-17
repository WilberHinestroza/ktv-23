import Song from "../models/Song";

export default class SongController {
  static getSongs() {
    const PUBLIC = process.env.PUBLIC_URL; // raíz de la app

    // 🎵 canciones visibles
     const visibles = [
      new Song(1, "Intro", "Berry", `${PUBLIC}/music/1.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/video.mp4`),
      new Song(2, "Canción 1", "Berry", `${PUBLIC}/music/2.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/video.mp4`),
      new Song(3, "Canción 2", "Berry", `${PUBLIC}/music/3.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/video.mp4`),
      new Song(4, "Canción 3", "Berry", `${PUBLIC}/music/4.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/video.mp4`),
      new Song(5, "Comercial #1", "Berry", `${PUBLIC}/music/5.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `/cover/video.mp4`),
      new Song(6, "Canción 5", "Berry", `${PUBLIC}/music/6.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/video.mp4`),
      new Song(7, "Canción 6", "Berry", `${PUBLIC}/music/7.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/video.mp4`),
      new Song(8, "Canción 7", "Berry", `${PUBLIC}/music/8.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/video.mp4`),
      new Song(9, "Canción 8", "Berry", `${PUBLIC}/music/9.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/video.mp4`),
      new Song(10, "Canción 9", "Berry", `${PUBLIC}/music/10NN.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/video.mp4`),
      new Song(11, "Canción 10", "Berry", `${PUBLIC}/music/11NN.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/video.mp4`),
      new Song(12, "Comercial #2", "Berry", `${PUBLIC}/music/12.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/video.mp4`),
      new Song(13, "Canción 11", "Berry", `${PUBLIC}/music/13NN.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/video.mp4`),
      new Song(14, "Canción 12", "Berry", `${PUBLIC}/music/14.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/video.mp4`),
      new Song(15, "Canción 13", "Berry", `${PUBLIC}/music/15.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/video.mp4`),
      new Song(16, "Canción 14", "Berry", `${PUBLIC}/music/16NN.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/video.mp4`),
      new Song(17, "Canción 15", "Berry", `${PUBLIC}/music/17NN.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/video.mp4`),
      new Song(18, "Outro", "Berry", `${PUBLIC}/music/18NN.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/video.mp4`),
    ];

    // 🔒 canciones ocultas (con `afterId`)
    const ocultas = [
      { 
        song: new Song(101, "Comercial #3", "Berry", `${PUBLIC}/music/Comercial A.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, null), 
        afterId: 2,  // suena después de "Canción 1"
        chance: 0.25 // 25% de probabilidad
      },
      { 
        song: new Song(102, "Comercial #4", "Berry", `${PUBLIC}/music/Comercial C.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, null), 
        afterId: 4,  // suena después de "Canción 3"
        chance: 0.25 
      }
    ];

    return { visibles, ocultas };
  }
}