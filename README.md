# KeNnyga Radio 112.3 FM · Wildberry

Página personal: radio en vivo con mi música, proyectos de programación y más.
Publicada en https://WilberHinestroza.github.io/ktv-23

## Cómo funciona la radio

No hay servidor. Cada visitante calcula qué suena usando la hora actual,
los programas y la duración de cada canción. Por eso todos escuchan lo
mismo en el mismo segundo, y si entras a mitad de una canción, la oyes desde ahí.

- No se puede adelantar ni retroceder: es una radio.
- "Apagar" y volver a "Sintonizar" te pone otra vez en lo que suena en vivo.
- Si un archivo falla, muestra "Señal perdida" y vuelve con la siguiente canción.

## Cómo editar el contenido

Todo está en `public/contenido/`. No hace falta tocar código.

| Archivo | Qué controla |
| --- | --- |
| `sitio.json` | Nombre, menú y secciones |
| `radio.json` | Canciones, ocultas, ticker, archivos secretos |
| `proyectos.json` | Tarjetas de proyectos |
| `perfil.json` | Sección "Sobre mí" |

### Agregar una canción

1. Copia el `.mp3` a `public/music/...`
2. Agrega una entrada en `canciones` de `radio.json` (sin `duracion`, se calcula sola):
   ```json
   { "id": 23, "titulo": "Nueva", "artista": "Wildberry", "album": "kennyga", "archivo": "music/Canciones/19.mp3" }
   ```
3. Publica (ver abajo). El script `npm run duraciones` revisa que el archivo exista
   **con las mismas mayúsculas** (GitHub Pages las distingue) y guarda la duración.

### Álbumes y géneros

En `albumes` de `radio.json`:

```json
{ "id": "nocturno", "titulo": "Nocturno", "artista": "Wildberry", "anio": 2026,
  "genero": "Trap", "portada": "cover/nocturno.webp", "descripcion": "Opcional" }
```

Cada canción dice a qué álbum pertenece con `"album": "nocturno"`. La portada y el
género salen del álbum, pero una canción puede tener su propio `"genero"` o `"portada"`.
Los álbumes aparecen solos en la sección **Música**.

### Programas

En `programas` de `radio.json`. Las horas están en `zonaHoraria` (Colombia, `-05:00`);
cada visitante las ve convertidas a su hora.

```json
{
  "id": "trap-nocturno",
  "titulo": "Trap Nocturno",
  "descripcion": "Lo más oscuro del catálogo",
  "desde": "22:00", "hasta": "02:00",
  "dias": [5, 6],
  "generos": ["Trap"],
  "orden": "mezcla",
  "intro": { "archivo": "music/Programas/trap-nocturno.mp3" }
}
```

- `dias` (opcional): 0 = domingo … 6 = sábado. Sin `dias`, es todos los días.
- Qué suena: `albumes`, `generos`, `temas` o una lista exacta de ids en `canciones`. Sin nada, suena todo.
- `temas`: cada canción puede tener `"temas": ["Amor", "Malandreo"]`, y el programa pone las que
  tengan alguno de los suyos. Si ninguna canción tiene esos temas, el programa no sale al aire y
  suena la programación general.
- La intro que dice el locutor al empezar cada programa se escribe en `programas` de
  `scripts/locutor-plantillas.json` (por id del programa) y se genera con `npm run locutor -- --ia`.
- `orden`: `"lista"` (en orden) o `"mezcla"` (aleatorio, pero igual para todos).
- `intro` (opcional): un audio que suena al empezar el programa (jingle o locutor).
- Las horas sin programa usan `programaGeneral`.
- Cuando un programa termina, la canción que suena acaba completa y luego empieza el siguiente.
- `npm run duraciones` avisa si un programa menciona un álbum, género o canción que no existe.

### Canciones ocultas

En `radio.json`, pon `"ocultasActivas": true`. Cada oculta tiene `despuesDe`
(ids tras los que puede sonar) y `probabilidad` (0 a 1). Todos los oyentes ven
las mismas apariciones.

### Locutor

Se configura en la sección `locutor` de `radio.json` (`"activo": false` lo apaga). Hay dos tipos de clips:

- **Para todos (en la programación):** `cunas` suenan cada `cadaCanciones` canciones, y y a
  veces (`presentaciones.probabilidad`) el locutor presenta la canción que viene.
  Todos los oyentes los escuchan al mismo tiempo.
- **Para cada visitante:** al sintonizar, el locutor saluda según la hora de quien escucha
  (`saludos.madrugada`, `manana`, `tarde`, `noche`) o con `saludos.regreso` si ya había entrado
  antes. Mientras siga escuchando, cada `compania.cadaMinutos` le dice algo de `compania.archivos`.
  Mientras habla, la música baja a `musicaAlHablar` (0.25 = 25 %).

Los textos salen de `scripts/locutor-plantillas.json` (no edites los del locutor en `radio.json`
a mano: se regeneran). Ahí están los saludos, la compañía, las cuñas, las plantillas para
presentar canciones (`{titulo}`, `{album}`, `{tipo}`, `{anio}`, `{artista}`) y `pronunciar`,
para decir bien nombres como KTV23.

Hay dos locutores, **Raúl** y **Sabina** (voces de IA de Windows, gratis y sin internet). Se
configuran en `voces` de las plantillas: `velocidad` (1 = normal) y `tono` (semitonos; Raúl usa -3
para sonar más grave). Las frases se reparten solas entre los dos; para que una la diga alguien
en particular, escríbela como `{ "texto": "...", "voz": "sabina" }`. La página muestra quién habla.

```bash
npm run locutor -- --ia        # crea con Raúl y Sabina los audios que falten (≈1 min para todo)
npm run locutor -- --limpiar   # borra audios que ya no se usan
```

Cada audio se llama según su texto y su voz: si cambias una frase o agregas canciones, solo se
generan las nuevas.

También se puede usar tu voz clonada con [Chatterbox](https://github.com/resemble-ai/chatterbox)
(gratis, licencia MIT, ≈1 min por frase en procesador) con `npm run locutor -- --voz`. Vive en
`../voz` (fuera del repo): `voz/.venv` es el entorno de Python y `voz/muestras/voz.wav` la grabación de referencia.

### Agregar una sección nueva

Añade una entrada en `sitio.json` y crea su archivo. Tipos disponibles:

- `tarjetas`: lista de tarjetas con imagen, texto, etiquetas y enlaces (como `proyectos.json`)
- `perfil`: foto, bio, habilidades y enlaces (como `perfil.json`)
- `radio`: el reproductor
- `discografia`: álbumes y canciones de `radio.json`

Ejemplo, una sección de videos:

```json
{ "id": "videos", "titulo": "Videos", "tipo": "tarjetas", "archivo": "videos.json" }
```

## Comandos

```bash
npm install        # una vez
npm start          # ver en local: http://localhost:3000/ktv-23
npm run locutor    # guion del locutor (LOCUTOR-GUION.md)
npm run deploy     # calcular duraciones, compilar y publicar en GitHub Pages
```
