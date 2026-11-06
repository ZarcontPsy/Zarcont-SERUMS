# Assets, licencias y procedencia

**Build:** `ZARCONT-SQ-1.2.0` · **Revisión:** 2026-10-25  
Este documento registra qué assets usa SERUMS QUEST, qué se verificó y qué se decidió **no** integrar. No sustituye a `NOTICE.md`; lo amplía para la capa de juego.

---

## 1. Resumen ejecutivo

| Tipo | Origen | Licencia | Archivos en el repositorio |
| --- | --- | --- | --- |
| Personajes y cosméticos | Dibujo SVG original en `js/character-art.js` | © 2026 ZARCONT, licencia propietaria | Código, no imágenes |
| Escenarios | SVG original en `js/scenes.js` | © 2026 ZARCONT | Código, no imágenes |
| Iconos | SVG original en `js/icons.js` | © 2026 ZARCONT | Código |
| Efectos y ambiente | Síntesis original en `js/audio.js` | © 2026 ZARCONT | Código, sin muestras |
| Tipografías | Google Fonts: Inter y Zen Dots | SIL Open Font License 1.1 | Servidas por CDN; no se redistribuyen archivos |
| Assets visuales de terceros | **Ninguno** | — | 0 archivos |
| Samples de audio de terceros | **Ninguno** | — | 0 archivos |

**No se descargó ni integró ningún asset visual o sonoro de terceros en esta revisión.** Las fuentes se evaluaron con metadatos, licencias y comprobaciones de disponibilidad; no se incorporaron a la app.

---

## 2. Por qué no se integraron packs visuales

Se revisaron cuatro repositorios candidatos. Los cuatro se descartaron por motivos independientes de estilo, licencia o trazabilidad.

### 2.1 `Tiddybub/2d-assets`

- **Contenido:** ~1.101 packs, ~1,04 GB, principalmente pixel art de 16/32 px, algo de 3D y un subconjunto SVG.
- **Licencia declarada:** CC0 1.0 en un `LICENSE` de 351 bytes y en `SOURCE.md` por pack. GitHub lo clasifica como *Other / NOASSERTION*.
- **Riesgo:** la afirmación CC0 es del espejo, no del autor original. Se cruzaron 3 de 1.101 packs contra OpenGameArt y los tres eran CC0; los 1.098 restantes no se auditaron.
- **Estilo:** pixel art y 3D no encajan con el vector neón de SERUMS QUEST.
- **Decisión:** rechazado. No se descargó nada.

### 2.2 `eturner58/game-assets`

- **Contenido:** catálogo de 297 packs, 269 de Kenney (PNG/raster y glTF), más metadatos de LimeZu sin sus píxeles.
- **Licencia:** sin `LICENSE` raíz; `LICENSES.md` es detallado (Kenney CC0; LimeZu no redistribuible; advertencia de un pack *non-commercial*).
- **Estilo:** raster/3D, no SVG.
- **Decisión:** rechazado como fuente; habría sido redundante con kenney.nl y sin licencia raíz.

### 2.3 `juanpe500/2d_chars`

- **Contenido:** no es un pack de assets, es una librería JS/canvas que dibuja personajes en 8 direcciones.
- **Licencia:** MIT (obliga a conservar aviso de copyright).
- **Estilo:** cartoon rasterizado en canvas; rompería la coherencia vectorial y la ruta de sustitución por arte final.
- **Decisión:** rechazado. La app ya tiene un sistema SVG por capas más adecuado.

### 2.4 `AscensionGameDev/Intersect-Assets`

- **Contenido:** ~124 MB de tilesets, paperdolls, UI y audio para un MMORPG; pixel art 16×16.
- **Licencia:** sin `LICENSE` raíz; el README afirma uso libre, pero conviven CC BY 4.0, CC BY-SA 3.0, licencias propias y FontAwesome/SIL.
- **Riesgo grave:** la licencia por archivo está *«specified in the commit histories»*, es decir, fuera del árbol de archivos. Incompatible con la trazabilidad de `NOTICE.md` e `INTEGRITY.sha256`.
- **Estilo:** pixel art.
- **Decisión:** rechazado por estilo y por trazabilidad.

### 2.5 Kenney (referencia, no integración)

Kenney es una fuente canónica CC0 y sus packs de UI/audio son descargables. Se usó **solo como referencia geométrica** (radios, jerarquía de botones), sin copiar archivos. No se añadió ninguna entrada de atribución porque no hay assets de Kenney en el producto.

---

## 3. Audio: por qué se sintetiza

La alternativa CC0 real y verificable existía:

| Fuente | Contenido | Licencia | Peso aproximado |
| --- | --- | --- | ---: |
| Kenney Interface Sounds | 100 efectos UI | CC0 | ~815 KB |
| Kenney UI Audio | 50 botones/switches | CC0 | ~402 KB |
| Kenney RPG Audio | 50 foley/armas | CC0 | ~942 KB |
| Kenney Music Jingles | 85 stingers | CC0 | ~1,18 MB |
| OpenGameArt «Completion sound» | ding de tarea | CC0/OGA-BY (dual) | ~18 KB |
| OpenGameArt «Chill Main Menu music» | loop de menú | CC0/OGA-BY (dual) | ~1,76 MB |

Se decidió **no** incorporarlas:

1. La app es estática y sin binarios; añadir 2–3 MB de samples, preload, decodificación y fallback de formato empeora el arranque.
2. Los samples de diez autores distintos producen un «collage» tímbrico; la síntesis comparte parciales y filtros entre UI y ambiente.
3. La regla de «nada de audio antes de una interacción» ya está resuelta en `audio.js`; los samples no la mejoran.
4. Menos superficie de licencias y de mantenimiento en `NOTICE.md` / `INTEGRITY.sha256`.

La implementación resultante tiene **17 efectos** y un **pad de cinco voces**, con compresor y reverb por convolución generada en código. No hay archivos de audio ni atribución de audio de terceros.

---

## 4. Tipografías y datos

- **Inter** y **Zen Dots** se cargan desde Google Fonts con `display=swap`; su licencia es SIL Open Font License 1.1. No se redistribuyen archivos de fuente.
- El banco de preguntas y el temario de Study se consumen **por referencia** desde `EXAMEN STUDIO/` y `study-data/`; no se copian ni se modifican en `serums-quest/`.
- Las preguntas conservan su PDF y página de origen. La afinidad temática es editorial y no oficial.
- No se usan emojis como sustituto de ilustraciones.

---

## 5. Arte provisional y ruta de sustitución

Los 10 personajes son **arte vectorial original provisional**, no un encargo profesional. Cada personaje declara en `characters.js` una ruta `assetReferences.upgradePath` del tipo `assets/characters/<id>.svg`. La interfaz compone por capas y puede sustituir el arte sin rehacer pantallas, estado ni cosméticos.

Criterios para una futura sustitución:

1. Licencia propia o cesión por escrito; nada de CC BY-SA en un producto propietario sin revisión legal.
2. Mismo sistema de capas y coordenadas, o adaptador de render.
3. Fondo transparente y resolución suficiente para 2×.
4. Registro en `NOTICE.md`, `AUTORIA.md` e `INTEGRITY.sha256`.
5. Pruebas de compatibilidad con las 33 capas y los 9 estados.

---

## 6. Verificación y límites

**Verificado directamente**

- Estructura, tamaño y licencia declarada de los cuatro repositorios.
- Contenido de `LICENSES.md` (eturner58), `LICENSE`/`SOURCE.md` (Tiddybub), README de Intersect y de 2d_chars.
- Tres packs de Tiddybub cruzados con OpenGameArt (CC0 correcto en los tres).
- Licencias y conteos de las páginas de Kenney y OpenGameArt citadas.
- `200 OK`, `Content-Type` y `Content-Length` de once enlaces de descarga de audio; **no se descargó** ninguno.
- Estado del proyecto: licencia propietaria, `NOTICE.md`, paleta, `icons.js`, `character-art.js`, `audio.js` y política de no muestras.

**No verificado / supuesto**

- Que los 1.098 packs restantes de Tiddybub sean realmente CC0.
- Que el UI Pack Vector de eturner58 contenga SVG (no se comprobó).
- Nombres de archivo dentro de los ZIP de Kenney.
- Compatibilidad de Ogg Vorbis en Safari/iOS (no se usan ficheros Ogg).
- Que la estética de Kenney «desentone» es un juicio de diseño, no un hecho medible.

**No es asesoría legal.** Antes de una explotación comercial o de integrar assets de terceros, revisar las licencias con la fuente original y, si corresponde, con un profesional.
