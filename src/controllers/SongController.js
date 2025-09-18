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
      new Song(5, "Canción 4", "Berry", `${PUBLIC}/music/5.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `/cover/video.mp4`),
      new Song(6, "Canción 5", "Berry", `${PUBLIC}/music/6.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/video.mp4`),
      new Song(7, "Comercial #1", "Berry", `${PUBLIC}/music/7.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/video.mp4`),
      new Song(8, "Canción 6", "Berry", `${PUBLIC}/music/8.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/video.mp4`),
      new Song(9, "Canción 7", "Berry", `${PUBLIC}/music/9.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/video.mp4`),
      new Song(10, "Canción 8", "Berry", `${PUBLIC}/music/10NN.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/video.mp4`),
      new Song(11, "Canción 9", "Berry", `${PUBLIC}/music/11NN.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/video.mp4`),
      new Song(12, "Comercial #2", "Berry", `${PUBLIC}/music/12.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/video.mp4`),
      new Song(13, "Canción 10", "Berry", `${PUBLIC}/music/13NN.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/video.mp4`),
      new Song(14, "Canción 11", "Berry", `${PUBLIC}/music/14.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/video.mp4`),
      new Song(15, "Canción 12", "Berry", `${PUBLIC}/music/15.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/video.mp4`),
      new Song(16, "Canción 13", "Berry", `${PUBLIC}/music/16NN.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/video.mp4`),
      new Song(17, "Canción 14", "Berry", `${PUBLIC}/music/17NN.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/video.mp4`),
      new Song(18, "Outro", "Berry", `${PUBLIC}/music/18NN.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/video.mp4`),
    ];

    // 🔒 canciones ocultas (con `afterId`)
    const ocultas = [
//KeNnygaTV
      { 
        song: new Song(101, "Comercial #3", "KeNnygaTV", `${PUBLIC}/music/Comercial A.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, null), 
        afterId: 4,  // suena después de "Canción 1"
        chance: 0.25 // 25% de probabilidad
      },
      { 
        song: new Song(102, "Comercial #4", "KeNnygaTV", `${PUBLIC}/music/Comercial B.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, null), 
        afterId: 9,  // suena después de "Canción 3"
        chance: 0.25 // 25% de probabilidad
      },
      { 
        song: new Song(103, "Comercial #5", "KeNnygaTV", `${PUBLIC}/music/Comercial C.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, null), 
        afterId: 14,  // suena después de "Canción 1"
        chance: 0.25 // 25% de probabilidad
      },
      { 
        song: new Song(104, "Noticia #1", "KeNnygaTV", `${PUBLIC}/music/Noticiero A.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, null), 
        afterId: 20,  // suena después de "Canción 3"
        chance: 0.05 // 5% de probabilidad
      },
      { 
        song: new Song(105, "Noticia #2", "KeNnygaTV", `${PUBLIC}/music/Noticiero B.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, null), 
        afterId: 20,  // suena después de "Canción 1"
        chance: 0.05 // 5% de probabilidad
      },
//El Director
      { 
        song: new Song(106, "Bienvenido", "El Director", `${PUBLIC}/music/ED1.mp3`, `${PUBLIC}/cover/ED.png`, null), 
        afterId: 1,  // suena después de "Canción 3"
        chance: 0.05 // 25% de probabilidad
      },
      { 
        song: new Song(107, "Intruso", "El Director", `${PUBLIC}/music/ED2".mp3`, `${PUBLIC}/cover/ED.png`, null), 
        afterId: 5,  // suena después de "Canción 1"
        chance: 0.25 // 25% de probabilidad
      },
      { 
        song: new Song(108, "Disfrutas?", "El Director", `${PUBLIC}/music/ED3.mp3`, `${PUBLIC}/cover/ED.png`, null), 
        afterId: 9,  // suena después de "Canción 3"
        chance: 0.25 // 25% de probabilidad
      },
      { 
        song: new Song(109, "Control", "El Director", `${PUBLIC}/music/ED4.mp3`, `${PUBLIC}/cover/ED.png`, null), 
        afterId: 14,  // suena después de "Canción 1"
        chance: 0.25 // 25% de probabilidad
      },
      { 
        song: new Song(110, "Consecuencias", "El Director", `${PUBLIC}/music/ED5.mp3`, `${PUBLIC}/cover/ED.png`, null), 
        afterId: 17,  // suena después de "Canción 3"
        chance: 0.25 // 25% de probabilidad
      },
      { 
        song: new Song(116, "El Director", "El Director", `${PUBLIC}/music/ED100.mp3`, `${PUBLIC}/cover/ED.png`, null), 
        afterId: 30,  // suena después de "Canción 3"
        chance: 0.50 // 50% de probabilidad
      },
//Desconocido
      { 
        song: new Song(111, "Hola", "Desconocido", `${PUBLIC}/music/H1.mp3`, `${PUBLIC}/cover/H.png`, null), 
        afterId: 1,  // suena después de "Canción 3"
        chance: 0.25 // 25% de probabilidad
      },
      { 
        song: new Song(112, "Control mental", "Desconocido", `${PUBLIC}/music/H2.mp3`, `${PUBLIC}/cover/H.png`, null), 
        afterId: 3,  // suena después de "Canción 1"
        chance: 0.25 // 25% de probabilidad
      },
      { 
        song: new Song(113, "Estas seguro?", "Desconocido", `${PUBLIC}/music/H3.mp3`, `${PUBLIC}/cover/H.png`, null), 
        afterId: 10,  // suena después de "Canción 3"
        chance: 0.25 // 25% de probabilidad
      },
      { 
        song: new Song(114, "Paranoia", "Desconocido", `${PUBLIC}/music/H4.mp3`, `${PUBLIC}/cover/H.pngp`, null), 
        afterId: 15,  // suena después de "Canción 1"
        chance: 0.25 // 25% de probabilidad
      },
      { 
        song: new Song(115, "Despedida", "Desconocido", `${PUBLIC}/music/H5.mp3`, `${PUBLIC}/cover/H.png`, null), 
        afterId: 16,  // suena después de "Canción 3"
        chance: 0.25 // 25% de probabilidad
      }
    ];

    return { visibles, ocultas };
  }
}