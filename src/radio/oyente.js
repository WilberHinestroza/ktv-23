// Datos de cada oyente. Viven solo en su navegador (localStorage): nadie más los ve.

export function leer(clave, porDefecto) {
  try {
    const v = JSON.parse(localStorage.getItem(clave));
    return v ?? porDefecto;
  } catch {
    return porDefecto;
  }
}

export function guardar(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // modo privado o almacenamiento lleno: se pierde al cerrar, no pasa nada
  }
}

// Logros que se desbloquean escuchando. `icono` es un emoji para no cargar imágenes.
export const LOGROS = [
  { id: "primera", icono: "📻", titulo: "Primera sintonía", texto: "Sintonizaste la radio por primera vez." },
  { id: "media-hora", icono: "🎧", titulo: "Oyente fiel", texto: "30 minutos escuchando." },
  { id: "hora", icono: "⏱️", titulo: "Una hora al aire", texto: "Una hora completa escuchando." },
  { id: "diez-horas", icono: "🏆", titulo: "Parte de la emisora", texto: "10 horas escuchando." },
  { id: "buho", icono: "🦉", titulo: "Búho", texto: "Escuchaste entre la medianoche y las 5 a.m." },
  { id: "madrugador", icono: "🌅", titulo: "Madrugador", texto: "Escuchaste entre las 5 y las 8 a.m." },
  { id: "fan", icono: "❤️", titulo: "Fan", texto: "Guardaste 5 canciones favoritas." },
  { id: "coleccionista", icono: "💿", titulo: "Coleccionista", texto: "Oíste 25 canciones distintas." },
  { id: "enciclopedia", icono: "📚", titulo: "Enciclopedia KeNnyga", texto: "Oíste 75 canciones distintas." },
  { id: "senal", icono: "📡", titulo: "Señal extraña", texto: "Escuchaste una transmisión que no debía sonar." },
  { id: "cartero", icono: "💌", titulo: "Cartero", texto: "Enviaste una dedicatoria." },
  { id: "dormilon", icono: "😴", titulo: "Dormilón", texto: "Dejaste la radio con temporizador para dormir." },
  { id: "oido", icono: "👂", titulo: "Oído de oro", texto: "Sacaste 8 o más en Adivina la canción." },
  { id: "perfecto", icono: "💯", titulo: "Perfecto", texto: "10 de 10 en Adivina la canción." },
  { id: "temporada", icono: "🎃", titulo: "De temporada", texto: "Escuchaste la radio en una fecha especial." },
  { id: "konami", icono: "👾", titulo: "↑↑↓↓←→←→BA", texto: "Ya sabes lo que hiciste." },
  { id: "detective", icono: "🔎", titulo: "Detective", texto: "Encontraste algo escondido en la pantalla." },
];
