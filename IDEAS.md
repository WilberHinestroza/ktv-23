# Ideas para la página

> Pendientes que necesitan algo de ti: **oyentes en vivo, pedidos, chat, reacciones, muro y ranking** necesitan una base de datos gratis (Firebase o Supabase, con tu cuenta); **contacto** necesita una cuenta en Formspree; **analítica** una cuenta (ej. GoatCounter); **calidad baja** duplicaría el peso del repo; **letras e historias** necesitan que escribas el contenido (`letra` e `historia` en cada canción de radio.json).

✅ = ya está hecho · ⭐ = recomendado para lo siguiente · Las demás quedan para decidir juntos.

## Radio: escuchar

- ✅ **Visualizador**: barras que bailan con la música detrás del reproductor y la portada que brilla con los bajos.
- ✅ **¿Cuándo suena?**: buscas una canción (sin importar tildes) o filtras por tema y te dice a qué hora vuelve a sonar.
- ✅ **Avísame cuando suene** (🔔): aviso en la página, y notificación del sistema si la pestaña está en segundo plano.
- ✅ **Favoritas** (❤): en el reproductor, en la mini radio y en las listas. Se ven con su próxima hora al aire.
- ✅ **Ya sonó**: las últimas 15 canciones que pasaron.
- ✅ **Temporizador para dormir**: 15 a 90 min; baja el volumen poco a poco y apaga.
- ✅ **Atajos de teclado**: Espacio, M, ↑ ↓, F, y ? para ver la ayuda.
- ✅ **Próximo programa** en la cinta de noticias de abajo.
- ✅ **Letras sincronizadas** (karaoke) para las canciones que tengan letra en un archivo `.lrc`.
- ✅ **Pantalla completa / modo TV**: portada gigante, visualizador a pantalla completa, reloj. Ideal para dejarla puesta.
- ✅ **Ecualizador** (graves, voces) guardado por oyente.
- **Calidad baja para datos móviles**: versiones en 64 kbps de cada canción.
- ✅ **"Faltan X min para tu canción"** en la mini radio cuando hay un aviso pendiente.
- ✅ **Modo sin locutor** para quien solo quiere música.
- ✅ **Modo carro**: botón grande y simple, sin nada más en pantalla.

## Comunidad (sin servidor o con uno gratis)

- ✅ **Dedicatorias**: creas un enlace con un mensaje; quien lo abre ve la carta y escucha lo que suena.
- ⭐ **Oyentes en vivo**: "23 personas escuchando ahora" (necesita un servicio gratis tipo Firebase o Supabase).
- ⭐ **Pedidos de canciones**: la gente vota y la más pedida suena en un bloque "Los más pedidos" (necesita base de datos).
- **Chat en vivo** al lado de la radio.
- **Reacciones en vivo** (🔥❤️😂) que flotan sobre la portada para todos los que escuchan.
- **Muro de dedicatorias** público.
- **Ranking semanal** de las canciones más guardadas como favoritas.

## Juegos y secretos

- ✅ **Logros** (14, con 3 secretos): primera sintonía, horas escuchando, búho, madrugador, fan, coleccionista…
- ✅ **Código Konami** (↑↑↓↓←→←→BA): la página entra en interferencia.
- ✅ Logro **Detective** al encontrar el botón invisible.
- ✅ **Adivina la canción**: suena un pedazo de 5 s y eliges entre 4 títulos. Con récord personal.
- **ARG / misterio**: pistas escondidas en la cinta de noticias, los "Archivos del Canal" y las canciones ocultas, que llevan a un contenido secreto.
- **Dial de frecuencias**: una perilla; entre emisoras hay estática y en ciertas frecuencias suenan cosas raras.
- ✅ **Sorpresas por fecha**: Halloween, Navidad, tu cumpleaños, aniversario de KTV23.

## Música y discografía

- ✅ **Página de cada canción**: portada, letra, temas, créditos, enlaces, "próxima vez que suena" y botón de dedicar.
- ✅ **Página de cada álbum** con su historia y las canciones en orden.
- ✅ **Línea de tiempo** de lanzamientos desde el primero hasta hoy.
- ✅ **Estadísticas de la discografía**: minutos totales, canciones por tema, colaboraciones.
- ✅ **Créditos y colaboradores** (feat., productores) con su propia sección.
- ✅ **Cuenta regresiva** para el próximo lanzamiento.
- ✅ **Galería** de portadas en grande.

## El locutor (Raúl y Sabina)

- ✅ **Hora exacta**: "Son las 9 de la noche en KeNnyga Radio" cada hora en punto.
- **Noticias del día**: fecha, efemérides, clima de la ciudad.
- ✅ **Bloques "Detrás de la canción"** donde cuentas la historia de un tema.
- **Locutores con personalidad por horario**: Raúl de noche, Sabina en la mañana.
- **Leer dedicatorias en voz alta** (necesita generar la voz en el momento).

## Proyectos y perfil

- ✅ **Proyectos con capturas, demo en vivo y repositorio** (cargados de GitHub automáticamente).
- ✅ **Terminal de mentira** en "Sobre mí" donde escribes comandos (`help`, `whoami`, `ls proyectos`).
- **Tu stack** con íconos.
- **Formulario de contacto** (Formspree, gratis).
- **Bitácora** de cómo haces tu música y tus programas.

## Técnico

- ✅ **Instalable como app** (nombre, colores e ícono propios; arranca en la radio).
- ✅ **Ambiente según la hora**: morado de madrugada, dorado en la mañana, rojo en la tarde, rosado de noche.
- **Funciona sin internet** lo ya visitado (service worker).
- **Vista previa bonita** al compartir enlaces en WhatsApp (imagen por canción).
- **Analítica sencilla** sin cookies (cuánta gente entra y desde dónde).
- **Modo claro** opcional.
- ✅ **Pruebas automáticas** del motor de la radio (que todos oigan lo mismo).
