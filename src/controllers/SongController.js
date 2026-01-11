import Song from "../models/Song";

export default class SongController {
  static getSongs() {
    const PUBLIC = process.env.PUBLIC_URL; // raíz de la app

    // 🎵 canciones visibles
     // Primero define los 6 infomerciales posibles:
  /*const infomerciales = [
    `${PUBLIC}/music/Infomerciales/Infomercial A.mp3`,
    `${PUBLIC}/music/Infomerciales/Infomercial B.mp3`,
    `${PUBLIC}/music/Infomerciales/Infomercial C.mp3`,
    `${PUBLIC}/music/Infomerciales/Infomercial D.mp3`
  ];

  const noticieros = [
    `${PUBLIC}/music/Noticieros/Noticiero A.mp3`,
    `${PUBLIC}/music/Noticieros/Noticiero B.mp3`,
    `${PUBLIC}/music/Noticieros/Noticiero C.mp3`,
    `${PUBLIC}/music/Noticieros/Jingle A.mp3`
  ];*/

  const img = [
    `${PUBLIC}/cover/ktv23-cover.webp`,
    `${PUBLIC}/cover/ktv23-cover2.webp`,
    `${PUBLIC}/cover/ktv23-cover3.webp`

  ];

  // Luego elige uno al azar:
  //const randomInfomercial = infomerciales[Math.floor(Math.random() * infomerciales.length)];
  //const randomNoticieros = noticieros[Math.floor(Math.random() * noticieros.length)];
  const randomImg = img[Math.floor(Math.random() * img.length)];


  // Y ahora define tu lista normalmente:
  const visibles = [
    new Song(1, "Intro", "Wildberry", `${PUBLIC}/music/Canciones/00.mp3`, randomImg, `${PUBLIC}/cover/VideoA.mp4`),
    new Song(2, "KeNny gaLindo", "Wildberry", `${PUBLIC}/music/Canciones/01.mp3`, randomImg, `${PUBLIC}/cover/VideoA.mp4`),
    new Song(3, "Sigiloso", "Wildberry", `${PUBLIC}/music/Canciones/02.mp3`, randomImg, `${PUBLIC}/cover/VideoA.mp4`),
    new Song(4, "Gotdamn", "Wildberry", `${PUBLIC}/music/Canciones/03.mp3`, randomImg, `${PUBLIC}/cover/VideoA.mp4`),
    new Song(5, "24/7", "Wildberry", `${PUBLIC}/music/Canciones/04.mp3`, randomImg, `${PUBLIC}/cover/VideoA.mp4`),

    // Aquí reemplazamos Infomerciales por uno aleatorio:
    new Song(6, "Llamada", "Wildberry", `${PUBLIC}/music/Interludios/Llamada.mp3`, randomImg, `${PUBLIC}/cover/VideoA.mp4`),

    new Song(7, "Damisela", "Wildberry", `${PUBLIC}/music/Canciones/05.mp3`, randomImg, `${PUBLIC}/cover/VideoA.mp4`),
    new Song(8, "Komo2", "Wildberry", `${PUBLIC}/music/Canciones/06.mp3`, randomImg, `${PUBLIC}/cover/VideoA.mp4`),
    new Song(9, "Baby", "Wildberry", `${PUBLIC}/music/Canciones/07.mp3`, randomImg, `${PUBLIC}/cover/VideoA.mp4`),
    
    // Aquí reemplazamos Infomerciales por uno aleatorio:
    new Song(6, "Micro On", "Wildberry", `${PUBLIC}/music/Interludios/Micro on.mp3`, randomImg, `${PUBLIC}/cover/VideoA.mp4`),
    
    new Song(11, "Brou", "Wildberry", `${PUBLIC}/music/Canciones/08.mp3`, randomImg, `${PUBLIC}/cover/VideoA.mp4`),
    new Song(12, "Lo nuestro", "Wildberry", `${PUBLIC}/music/Canciones/09.mp3`, randomImg, `${PUBLIC}/cover/VideoA.mp4`),
    new Song(13, "CQNSD", "Wildberry", `${PUBLIC}/music/Canciones/10.mp3`, randomImg, `${PUBLIC}/cover/VideoA.mp4`),
    new Song(14, "Delirante", "Wildberry", `${PUBLIC}/music/Canciones/11.mp3`, randomImg, `${PUBLIC}/cover/VideoA.mp4`),
    new Song(15, "Todos juzgan", "Wildberry", `${PUBLIC}/music/Canciones/12.mp3`, randomImg, `${PUBLIC}/cover/VideoA.mp4`),
    
    // Aquí reemplazamos Infomerciales por uno aleatorio:
    new Song(6, "Burry Malta", "Wildberry", `${PUBLIC}/music/Interludios/Burry Malta.mp3`, randomImg, `${PUBLIC}/cover/VideoA.mp4`),

    new Song(17, "Trance", "Wildberry", `${PUBLIC}/music/Canciones/13.mp3`, randomImg, `${PUBLIC}/cover/VideoA.mp4`),
    new Song(18, "Tamagotchi", "Wildberry", `${PUBLIC}/music/Canciones/14.mp3`, randomImg, `${PUBLIC}/cover/VideoA.mp4`),   
    new Song(19, "Paranoia", "Wildberry", `${PUBLIC}/music/Canciones/15.mp3`, randomImg, `${PUBLIC}/cover/VideoA.mp4`),
    new Song(20, "Viches", "Wildberry", `${PUBLIC}/music/Canciones/16.mp3`, randomImg, `${PUBLIC}/cover/VideoA.mp4`),

    new Song(18, "Outro", "Wildberry", `${PUBLIC}/music/Canciones/17.mp3`, randomImg, `${PUBLIC}/cover/VideoA.mp4`),
  ];

    // 🔒 canciones ocultas (con `afterId`)
    const ocultas = [
//El Director
      /*{ 
        song: new Song(111, "Bienvenido", "El Director", `${PUBLIC}/music/ED/ED1.mp3`, `${PUBLIC}/cover/ED.png`, null), 
        afterId: 1,  // suena después de "Intro"
        chance: 0.50 // 50% de probabilidad
      },
      { 
        song: new Song(112, "Intruso", "El Director", `${PUBLIC}/music/ED/ED2.mp3`, `${PUBLIC}/cover/ED.png`, null), 
        afterId: 5,  // suena después de "Damisela"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(113, "Disfrutas?", "El Director", `${PUBLIC}/music/ED/ED3.mp3`, `${PUBLIC}/cover/ED.png`, null), 
        afterId: 9,  // suena después de "27/7"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(114, "Control", "El Director", `${PUBLIC}/music/ED/ED4.mp3`, `${PUBLIC}/cover/ED.png`, null), 
        afterId: 14,  // suena después de "Brou"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(115, "Consecuencias", "El Director", `${PUBLIC}/music/ED/ED5.mp3`, `${PUBLIC}/cover/ED.png`, null), 
        afterId: 17,  // suena después de "Paranoia"
        chance: 0.50 // 50% de probabilidad
      },
      { 
        song: new Song(116, "El Director", "El Director", `${PUBLIC}/music/ED/ED100.mp3`, `${PUBLIC}/cover/ED.png`, null), 
        afterId: 30,  // suena después de "1 al 17"
        chance: 0.05 // 5% de probabilidad
      },
      { 
        song: new Song(116, "Hijo mio", "El Director", `${PUBLIC}/music/ED/ED101.mp3`, `${PUBLIC}/cover/ED.png`, null), 
        afterId: 30,  // suena después de "1 al 17"
        chance: 0.05 // 5% de probabilidad
      },
      { 
        song: new Song(117, "A que le temes?", "El Director", `${PUBLIC}/music/ED/ED6.mp3`, `${PUBLIC}/cover/ED.png`, null), 
        afterId: 5,  // suena después de "Canción 3"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(118, "Dentro de ti", "El Director", `${PUBLIC}/music/ED/ED7.mp3`, `${PUBLIC}/cover/ED.png`, null), 
        afterId: 9,  // suena después de "Canción 1"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(119, "Que te trajo aqui?", "El Director", `${PUBLIC}/music/ED/ED8.mp3`, `${PUBLIC}/cover/ED.png`, null), 
        afterId: 14,  // suena después de "Canción 3"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(120, "Ahi estas", "El Director", `${PUBLIC}/music/ED/ED9.mp3`, `${PUBLIC}/cover/ED.png`, null), 
        afterId: 17,  // suena después de "Canción 3"
        chance: 0.30 // 30% de probabilidad
      },
//Desconocido
      { 
        song: new Song(121, "Hola", "Desconocido", `${PUBLIC}/music/H/H1.mp3`, `${PUBLIC}/cover/H.png`, null), 
        afterId: 1,  // suena después de "Intro"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(122, "Control mental", "Desconocido", `${PUBLIC}/music/H/H2.mp3`, `${PUBLIC}/cover/H.png`, null), 
        afterId: 3,  // suena después de "Canción 1"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(123, "Estas seguro?", "Desconocido", `${PUBLIC}/music/H/H3.mp3`, `${PUBLIC}/cover/H.png`, null), 
        afterId: 10,  // suena después de "Canción 3"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(124, "Paranoia", "Desconocido", `${PUBLIC}/music/H/H4.mp3`, `${PUBLIC}/cover/H.png`, null), 
        afterId: 15,  // suena después de "Canción 1"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(125, "Despedida", "Desconocido", `${PUBLIC}/music/H/H5.mp3`, `${PUBLIC}/cover/H.png`, null), 
        afterId: 16,  // suena después de "Canción 3"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(126, "Gracias", "Desconocido", `${PUBLIC}/music/H/H6.mp3`, `${PUBLIC}/cover/H.png`, null), 
        afterId: 17,  // suena después de "Canción 3"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(127, "Gracias", "Desconocido", `${PUBLIC}/music/H/H7.mp3`, `${PUBLIC}/cover/H.png`, null), 
        afterId: null,  // suena después de "Canción 1"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(128, "????", "Desconocido", `${PUBLIC}/music/H/H8.mp3`, `${PUBLIC}/cover/H.png`, null), 
        afterId: null,  // suena después de "Canción 3"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(129, "????", "Desconocido", `${PUBLIC}/music/H/H9.mp3`, `${PUBLIC}/cover/H.png`, null), 
        afterId: null,  // suena después de "Canción 1"
        chance: 0.30 // 30% de probabilidad
      },
      { 
        song: new Song(130, "????", "Desconocido", `${PUBLIC}/music/H/H10.mp3`, `${PUBLIC}/cover/H.png`, null), 
        afterId: null,  // suena después de "Canción 3"
        chance: 0.30 // 30% de probabilidad
      }*/
    ];

    return { visibles, ocultas };
  }
}