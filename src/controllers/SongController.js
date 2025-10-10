import Song from "../models/Song";

export default class SongController {
  static getSongs() {
    const PUBLIC = process.env.PUBLIC_URL; // raíz de la app

    // 🎵 canciones visibles
     const visibles = [
      new Song(1, "Intro", "Wildberry", `${PUBLIC}/music/1.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/VideoA.mp4`),
      new Song(2, "KeNny gaLindo", "Wildberry", `${PUBLIC}/music/2.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/VideoB.mp4`),
      new Song(3, "Sigiloso", "Wildberry", `${PUBLIC}/music/3.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/VideoA.mp4`),
      new Song(4, "Gotdamn", "Wildberry", `${PUBLIC}/music/4.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/VideoB.mp4`),
      new Song(5, "Damisela", "Wildberry", `${PUBLIC}/music/5.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/VideoA.mp4`),
      new Song(6, "Todos juzgan", "Wildberry", `${PUBLIC}/music/6.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/VideoB.mp4`),
      new Song(7, "Comercial #1", "Wildberry", `${PUBLIC}/music/7.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/VideoA.mp4`),
      new Song(8, "Komo2", "Wildberry", `${PUBLIC}/music/8.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/VideoB.mp4`),
      new Song(9, "24/7", "Wildberry", `${PUBLIC}/music/9.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/VideoA.mp4`),
      new Song(10, "Lo nuestro", "Wildberry", `${PUBLIC}/music/10NN.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/VideoB.mp4`),
      new Song(11, "Delirante", "Wildberry", `${PUBLIC}/music/11NN.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/VideoA.mp4`),
      new Song(12, "Comercial #2", "Wildberry", `${PUBLIC}/music/12.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/VideoB.mp4`),
      new Song(13, "Trance", "Wildberry", `${PUBLIC}/music/13.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/VideoA.mp4`),
      new Song(14, "Brou", "Wildberry", `${PUBLIC}/music/14.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/VideoB.mp4`),
      new Song(15, "Tamagotchi", "Wildberry", `${PUBLIC}/music/15.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/VideoA.mp4`),
      new Song(16, "Combo que no se deja", "Wildberry", `${PUBLIC}/music/16.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/VideoB.mp4`),
      new Song(17, "Paranoia", "Wildberry", `${PUBLIC}/music/17NN.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/VideoA.mp4`),
      new Song(18, "Outro", "Wildberry", `${PUBLIC}/music/18NN.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, `${PUBLIC}/cover/VideoB.mp4`),
    ];

    // 🔒 canciones ocultas (con `afterId`)
    const ocultas = [
//KeNnygaTV
      { 
        song: new Song(101, "Comercial #3", "KeNnygaTV", `${PUBLIC}/music/Comercial A.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, null), 
        afterId: 4,  // suena después de "Gotdamn"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(102, "Comercial #4", "KeNnygaTV", `${PUBLIC}/music/Comercial B.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, null), 
        afterId: 4,  // suena después de "Gotdamn"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(103, "Comercial #5", "KeNnygaTV", `${PUBLIC}/music/Comercial C.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, null), 
        afterId: 14,  // suena después de "Brou"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(104, "Comercial #6", "KeNnygaTV", `${PUBLIC}/music/Comercial D.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, null), 
        afterId: 14,  // suena después de "Brou"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(105, "Noticiero KTV23", "KeNnygaTV", `${PUBLIC}/music/Noticiero A.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, null), 
        afterId: 7,  // suena después de "Comercial #1"
        chance: 0.20 // 20% de probabilidad
      },
      { 
        song: new Song(106, "Noticiero KTV23", "KeNnygaTV", `${PUBLIC}/music/Noticiero B.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, null), 
        afterId: 7,  // suena después de "Comercial #1"
        chance: 0.20 // 20% de probabilidad
      },
      { 
        song: new Song(107, "Noticiero KTV23", "KeNnygaTV", `${PUBLIC}/music/Noticiero C.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, null), 
        afterId: 12,  // suena después de "Comercial #2"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(108, "Noticiero KTV23", "KeNnygaTV", `${PUBLIC}/music/Noticiero DN.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, null), 
        afterId: null,  // suena después de 12 "Comercial #2"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(109, "KTV23", "KeNnygaTV", `${PUBLIC}/music/Jingle A.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, null), 
        afterId: 20,  // suena después de "2 al 17"
        chance: 0.20 // 20% de probabilidad
      },
      { 
        song: new Song(110, "KTV23", "KeNnygaTV", `${PUBLIC}/music/Jingle BN.mp3`, `${PUBLIC}/cover/ktv23-cover.webp`, null), 
        afterId: 20,  // suena después de "2 al 17"
        chance: 0.20 // 20% de probabilidad
      },
//El Director
      { 
        song: new Song(111, "Bienvenido", "El Director", `${PUBLIC}/music/ED1.mp3`, `${PUBLIC}/cover/ED.png`, null), 
        afterId: 1,  // suena después de "Intro"
        chance: 0.50 // 50% de probabilidad
      },
      { 
        song: new Song(112, "Intruso", "El Director", `${PUBLIC}/music/ED2.mp3`, `${PUBLIC}/cover/ED.png`, null), 
        afterId: 5,  // suena después de "Damisela"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(113, "Disfrutas?", "El Director", `${PUBLIC}/music/ED3.mp3`, `${PUBLIC}/cover/ED.png`, null), 
        afterId: 9,  // suena después de "27/7"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(114, "Control", "El Director", `${PUBLIC}/music/ED4.mp3`, `${PUBLIC}/cover/ED.png`, null), 
        afterId: 14,  // suena después de "Brou"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(115, "Consecuencias", "El Director", `${PUBLIC}/music/ED5.mp3`, `${PUBLIC}/cover/ED.png`, null), 
        afterId: 17,  // suena después de "Paranoia"
        chance: 0.50 // 50% de probabilidad
      },
      { 
        song: new Song(116, "El Director", "El Director", `${PUBLIC}/music/ED100.mp3`, `${PUBLIC}/cover/ED.png`, null), 
        afterId: 30,  // suena después de "1 al 17"
        chance: 0.05 // 5% de probabilidad
      },
      { 
        song: new Song(117, "A que le temes?", "El Director", `${PUBLIC}/music/ED6.mp3`, `${PUBLIC}/cover/ED.png`, null), 
        afterId: 5,  // suena después de "Canción 3"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(118, "Dentro de ti", "El Director", `${PUBLIC}/music/ED7.mp3`, `${PUBLIC}/cover/ED.png`, null), 
        afterId: 9,  // suena después de "Canción 1"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(119, "Que te trajo aqui?", "El Director", `${PUBLIC}/music/ED8.mp3`, `${PUBLIC}/cover/ED.png`, null), 
        afterId: 14,  // suena después de "Canción 3"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(120, "Ahi estas", "El Director", `${PUBLIC}/music/ED9.mp3`, `${PUBLIC}/cover/ED.png`, null), 
        afterId: 17,  // suena después de "Canción 3"
        chance: 0.30 // 30% de probabilidad
      },
//Desconocido
      { 
        song: new Song(121, "Hola", "Desconocido", `${PUBLIC}/music/H1.mp3`, `${PUBLIC}/cover/H.png`, null), 
        afterId: 1,  // suena después de "Intro"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(122, "Control mental", "Desconocido", `${PUBLIC}/music/H2.mp3`, `${PUBLIC}/cover/H.png`, null), 
        afterId: 3,  // suena después de "Canción 1"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(123, "Estas seguro?", "Desconocido", `${PUBLIC}/music/H3.mp3`, `${PUBLIC}/cover/H.png`, null), 
        afterId: 10,  // suena después de "Canción 3"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(124, "Paranoia", "Desconocido", `${PUBLIC}/music/H4.mp3`, `${PUBLIC}/cover/H.png`, null), 
        afterId: 15,  // suena después de "Canción 1"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(125, "Despedida", "Desconocido", `${PUBLIC}/music/H5.mp3`, `${PUBLIC}/cover/H.png`, null), 
        afterId: 16,  // suena después de "Canción 3"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(126, "Gracias", "Desconocido", `${PUBLIC}/music/H6.mp3`, `${PUBLIC}/cover/H.png`, null), 
        afterId: 17,  // suena después de "Canción 3"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(127, "Gracias", "Desconocido", `${PUBLIC}/music/H7.mp3`, `${PUBLIC}/cover/H.png`, null), 
        afterId: null,  // suena después de "Canción 1"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(128, "????", "Desconocido", `${PUBLIC}/music/H8.mp3`, `${PUBLIC}/cover/H.png`, null), 
        afterId: null,  // suena después de "Canción 3"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(129, "????", "Desconocido", `${PUBLIC}/music/H9.mp3`, `${PUBLIC}/cover/H.png`, null), 
        afterId: null,  // suena después de "Canción 1"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(130, "????", "Desconocido", `${PUBLIC}/music/H10.mp3`, `${PUBLIC}/cover/H.png`, null), 
        afterId: null,  // suena después de "Canción 3"
        chance: 0.30 // 30% de probabilidad
      }
    ];

    return { visibles, ocultas };
  }
}