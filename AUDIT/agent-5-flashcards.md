# Agente 5 — Study Flashcards: biblioteca jerárquica y simplificación
**Rol:** Especialista en Study Flashcards y simplificación de la interfaz.
**Fecha:** 2026-10-25 · **Repositorio:** `C:\Users\USARIO\Documents\ZARCONT SERUMS`
**Archivos propios modificados:** `study-flashcards/app.js`, `study-flashcards/styles.css`.
**No modificado:** `study-flashcards/index.html` (Agente 7), `study-shared/*` (Agentes 2/7),
`study-dashboard/*`, `study-data/*`, datos, `INTEGRITY.sha256`, `AUTORIA.md`, `DESIGN-SYSTEM.md`.
No se usó `git checkout/reset/clean`; no se borraron archivos; no se alteró ningún ID, ficha,
tarjeta, categoría, fuente ni clave de almacenamiento.

---

## 1. Resumen ejecutivo

La portada de Study Flashcards era una página de aterrizaje con el temario completo debajo:
hero de 898 px a 360 px de ancho, 4 tarjetas explicativas de modo y **210 tarjetas de mazo completas**
(cada una con resumen, 4 métricas, barra de dominio y 2 CTA). El documento medía **100.893 px a 360 px**
y **37.548 px a 1440 px**, con **642 elementos interactivos** en la portada.

Se sustituyó por una **biblioteca de estudio con jerarquía progresiva**: hero compacto, progreso
global en una línea, buscador y filtros compactos, cinco áreas como grupos desplegables y filas de
mazo densas con un solo CTA principal y las acciones secundarias agrupadas en un menú. La portada
inicial mide ahora **1.560 px a 360 px** (documento, no hero) y **19 elementos interactivos**. Se
conservan todas las áreas, categorías, mazos, tarjetas, textos, modos, progreso, historial, rutas y la
identidad verde menta/ámbar. La navegación interna sigue sin recargar el documento y el regreso a la
biblioteca restaura filtros, grupos abiertos y posición de scroll.

Cambio de contrato recibido del Agente 1 (H3.8): un `?deck=<id obsoleto>` ya no deja «Mazo no
encontrado» como entrada; vuelve a la biblioteca con aviso y sin bucle.

---

## 2. Diagnóstico funcional (estado anterior, medido con navegador)

Entorno: servidor `python -m http.server 8775 --bind 127.0.0.1`, Chrome headless
`--headless=new --remote-allow-origins=* --remote-debugging-port=9335`, arnés CDP propio con Node 24.
Capturas base: `AUDIT/evidencias/agent5-before-*.png`.

| Viewport | Hero | Documento | Mazos visibles | Tarjetas de modo | Controles interactivos |
|---|---:|---:|---:|---:|---:|
| 360×640 | 898 px | 100.893 px | 210 | 4 | 642 |
| 390×844 | 748 px | 87.962 px | 210 | 4 | 642 |
| 768×1024 | 715 px | 68.790 px | 210 | 4 | 642 |
| 1440×900 | 526 px | 37.548 px | 210 | 4 | 642 |

Hallazgos funcionales:

1. **Todo el temario se renderizaba siempre.** 5 áreas × 20 categorías × 210 mazos con `<article>` de
   335 px de alto, resumen largo, métrica de tarjetas/nuevas/por repasar/con error, barra de dominio y
   dos CTA («Abrir», «Repasar»). Dentro de cajas (área → categoría → tarjeta) con borde y fondo.
2. **No existía biblioteca como tal:** sin buscador, sin filtros por estado o área, sin grupos
   plegables y sin forma de «ver todos» más allá de recorrer 100.000 px.
3. **Progreso duplicado y confuso.** El hero mostraba 4 cifras globales; cada tarjeta repetía 4
   métricas + barra; la vista de mazo repetía chips + anillo + leyenda + barra. «Por repasar» no
   incluía tarjetas nuevas: un mazo recién creado mostraba «0 por repasar» con 3 nuevas.
4. **Cuatro tarjetas de modo no interactivas** que repetían la información de los botones de modo de
   la vista de mazo; ocupaban 168 px de alto y no eran controles.
5. **Regreso sin contexto.** Volver de un mazo a la biblioteca perdía el scroll (medido: 900 → 0) y
   no había filtros ni grupos que conservar. «Todos los mazos» era el único destino.
6. **Sesión sin navegación hacia atrás.** Solo «Salir al mazo» y «Terminar»; sin tarjeta anterior,
   sin acceso directo a la biblioteca. El resumen solo ofrecía «Volver al mazo».
7. **Teclado incompleto.** `Espacio`, `1–4` y `Enter` funcionaban en sesión, pero `/` no enfocaba
   ningún buscador (DESIGN-SYSTEM §7) porque no existía.
8. **Rutas correctas pero con dos defectos:** `?deck=`, `?resume=1` y `?mode=` funcionaban y no
   recargaban; un `?deck=` inválido dejaba «Mazo no encontrado» como entrada (H3.8, corregido) y
   `UI.cleanQuery()` borraba cualquier parámetro, incluido contexto no consumido.
9. **Sin estados vacíos de filtro** (no había filtros) y sin forma de distinguir «biblioteca» de «HUB»
   dentro de la app (el HUB lo pone el AppBar del Agente 7).

Causa raíz: la portada se diseñó como landing de marketing (hero grande + explicador + catálogo
completo) en lugar de como herramienta de consulta. Cada dato recibió su propio contenedor y cada
mazo dos CTA, sin jerarquía ni estados de plegado.

---

## 3. Patrón elegido y por qué

**Jerarquía progresiva con divulgación nativa** (`<details>` + `summary`):

```
hero compacto (identidad + progreso global en una línea)
  → barra de herramientas (buscar · estado · área · expandir/contraer)
  → 5 áreas plegables (resumen: categorías, mazos, tarjetas, dominio, pendientes, última práctica)
      → categoría (encabezado con «N de M mazos»)
          → fila densa de mazo (título, tarjetas, dominio, pendientes, última práctica, error)
              → CTA «Abrir»/«Continuar» + menú «⋯» (repaso rápido, errores, examen, libre, ficha)
  → «Cuatro formas de practicar» plegado (contenido conservado)
  → cita de método (reducida)
```

Motivos:

- **210 elementos no son una portada, son un catálogo.** Plegar por área reduce la carga inicial sin
  borrar contenido; el usuario abre lo que necesita.
- **`<details>/<summary>` da semántica y teclado gratis** (Enter/Espacio, foco, estado expandido) y
  evita ARIA manual propensa a errores; se conserva el estado en la URL.
- **Filas densas** permiten comparar tarjetas, dominio, pendientes y última práctica sin cuatro cajas
  por mazo; el contenido académico (título, resumen del mazo) sigue disponible en la vista de mazo.
- **Un CTA principal + menú agrupado** elimina la duplicación «Abrir/Repasar» en 210 tarjetas y deja
  las cuatro modalidades donde se usan: la vista de mazo.
- **Progreso integrado:** una línea en la biblioteca, un resumen por área y una línea de datos en el
  mazo; sin anillos ni leyendas repetidas.
- **Vista de estudio enfocada:** la tarjeta es el contenedor protagonista; respuesta y feedback se
  marcan con una regla lateral, no con cajas dentro de cajas.

---

## 4. Cambios aplicados

### 4.1 `study-flashcards/app.js`

**Biblioteca**

- `state.library` (`filter`, `area`, `q`, `open`), `librarySaved` (`hash`, `scroll`) y `restoreScroll`.
- `parseLibraryParams()` / `libraryHash()`: estado en el hash `#/?estado=&area=&q=&abiertas=`;
  `parseRoute()` separa ruta y query del hash, de modo que `#/`, `#/mazo/<id>`, `#/sesion`,
  `#/resumen` y `#/historial` siguen intactos.
- `deckModel()`, `pendingCount()`, `libraryModels()` (caché invalidada por `updatedAt` de StudyStore),
  `computeLibrary()` (conteos, filtros, agrupación por área/categoría, estadísticas por área).
- **Pendientes reales** = nuevas + vencidas + errores que aún no vencen; se acabó el «0 por repasar»
  con tarjetas nuevas.
- `renderDecks()`: hero compacto + herramientas + `#library-body` + ayuda plegada + cita.
- Hero: una línea con tarjetas/revisadas/dominadas/pendientes/acierto, barra de dominio global,
  CTA «Empezar a practicar» (primer mazo con pendientes) o «Continuar sesión», enlace «Consultar
  temario» y línea de sesión en curso (mazo, modo, tarjeta N de M). Se eliminó el banner aparte.
- Barra de herramientas: buscador (`/`), 4 filtros con contadores (`Todas`, `Pendientes`, `En curso`,
  `Completadas`), selector de área, botón expandir/contraer y contador con `aria-live`.
- Áreas `<details>` con cuerpo perezoso: un grupo cerrado no genera filas; al abrirlo se calculan e
  insertan sus categorías y mazos. Resumen con icono, nombre, «categorías · mazos · tarjetas»,
  dominio, pendientes, última práctica, barra y chevrón. Dentro del área abierta se conserva su
  descripción editorial y el enlace a la fuente documental (antes en la cabecera del área).
- Filas: enlace con título + métricas (tarjetas, dominio, pendientes, última práctica, error) y
  `aria-label` completo; CTA «Abrir» o «Continuar» si hay sesión; menú `<details class="row-menu">`
  con Repaso rápido, Errores (si hay), Examen, Estudio libre y Ficha resumen. El menú se cierra con
  Escape o clic fuera y se abre hacia arriba si no cabe.
- Filtros: si hay pocas coincidencias (≤48) se abren los grupos con resultados; si hay muchas se abre
  solo el primero y el contador indica cuántas áreas coinciden. Los grupos sin coincidencias no se
  muestran y su resumen describe el subconjunto visible. Estado vacío con «Limpiar filtros».
- «Cuatro formas de practicar»: mismas descripciones de los 4 modos, ahora en un `<details>`; la nota
  «las tarjetas nuevas no cuentan como error» se conserva en la ayuda y en la vista de mazo.
- Cita de método conservada con tipografía y márgenes reducidos.

**Vista de mazo**

- Línea superior: «Biblioteca» (con `data-restore-library`) a la izquierda; «Continuar sesión» (si
  aplica) y «Ficha resumen» a la derecha. Se eliminó la fila de acciones duplicada.
- Cabecera: migas área → categoría → ficha, título, resumen, línea de datos (tarjetas, revisadas,
  dominadas, pendientes, errores, última práctica), barra de dominio y línea de sesión en curso.
- Cuatro modos como botones compactos (estudio libre primario cuando no hay sesión; el resto
  secundarios) con su conteo o motivo de deshabilitado.
- Contenido (tarjetas del mazo) justo después de la cabecera; lista densa con tipo, enunciado,
  repasos, vencimiento, estado (Nueva/Programada/Para repasar/Con error/Dominada) y enlace a ficha.
- Se eliminaron: panel de anillo de progreso, chips duplicados, banner de sesión, caja punteada de
  nota (ahora línea informativa) y la fila extra de acciones.

**Sesión**

- Botón «Anterior» cuando `index > 0`, en todas las ramas (concepto sin revelar, concepto revelado,
  opción múltiple antes/después de comprobar y examen); teclas `←`/`→` junto a las existentes
  (`Espacio`, `1–4`, `Enter`).
- Enlace «Biblioteca» en la cabecera, separado de «Volver al mazo»; al volver se restauran filtros,
  grupos y scroll de la biblioteca.
- Respuesta y feedback sin caja anidada: regla lateral de acento/estado sobre el fondo de la tarjeta.
- Tarjeta de sesión sin sombra pesada; cabecera más baja en móvil (38 px de botón y «Terminar»
  compacto).

**Resumen**

- Línea superior con «Volver al mazo» y «Biblioteca» (restaura contexto).
- Se mantiene el resto del resumen, revisión plegable, acciones e historial.
- Se suprimió el contorno de foco del `h1` enfocado programáticamente (solo ese caso; el foco de
  teclado conserva el anillo global).

**Navegación y contexto**

- `readEntry()`: recuerda origen con `sheet`/`deck` aunque no haya `mode`; `cleanEntryQuery()` elimina
  solo `deck`, `mode`, `resume`, `sheet` y `from`, y **conserva** otros parámetros; `replaceHash()`
  conserva `location.search`.
- `bootApp()`: entrada sin query muestra la biblioteca (no fuerza sesión); `?deck` válido abre el
  mazo; `?resume=1`/`?mode=` abren o crean la sesión; `?deck` inválido → biblioteca + aviso (H3.8);
  `?deck=&mode=errors` sin errores → mazo + aviso; entrada desde Dashboard
  (`?deck&mode=free&sheet&from=dashboard`) sigue creando la sesión.
- `hashchange` guarda `{hash, scroll}` de la biblioteca al salir; `goLibrary()` los restaura. Las
  flechas del navegador siguen funcionando porque las rutas usan entradas de historial; los filtros
  usan `replaceState` para no llenar el historial.

### 4.2 `study-flashcards/styles.css`

- Nuevos componentes: `.lib-hero`, `.lib-hero-line`, `.lib-hero-meter`, `.lib-session-line`,
  `.lib-library`, `.lib-tools`, `.lib-search`, `.lib-seg`, `.lib-select`, `.lib-expand`, `.lib-count`,
  `.mini-bar`, `.lib-area*`, `.lib-cat*`, `.deck-row*`, `.row-menu*`, `.lib-help*`, `.deck-topline*`,
  `.deck-facts`, `.deck-meter`, `.deck-live`, `.deck-modes`, `.mode-btn*`, `.summary-topline`,
  `.summary-library`, `.session-header-left`, `.session-library`.
- Eliminados: `.flash-hero*`, `.flash-stats`, `.mode-grid`, `.mode-card*`, `.active-session*`,
  `.deck-area*`, `.deck-category*`, `.deck-grid`, `.deck-card*`, `.deck-progress*`, `.deck-stats`,
  `.deck-dashboard`, `.mode-actions`, `.mode-action*`, `.deck-head-meta`, `.deck-head-actions`.
- Session: `.answer-block` y `.flash-feedback` pasan de caja con borde/fondo a regla lateral; el
  `h1` enfocado por ruta no dibuja caja; se conserva el anillo de foco global.
- Responsive: hero de dos columnas solo en escritorio amplio, barra pegajosa ≥901 px, filtros 2×2 de
  38 px en móvil, filas de 2 columnas, modos 2×2, cabecera de sesión compacta y resumen apilado.
- Movimiento: se mantienen las entradas breves; `prefers-reduced-motion` de `base.css` las reduce a
  ~0 (medido: `animation-duration: 1e-05s`).

---

## 5. Contenedores y controles eliminados (sin perder contenido)

| Antes | Después |
|---|---|
| 210 `<article class="deck-card">` con 4 métricas, barra y 2 CTA (335 px c/u) | 210 filas densas (~46–50 px) dentro de categorías, generadas solo al abrir su área |
| 5 `<section class="deck-area">` + 20 `<div class="deck-category">` con borde | 5 `<details class="lib-area">` nativos con encabezados de categoría |
| Hero de 898/526 px con arte grande y 4 cifras | Hero de 261/313 px con una línea de progreso y barra |
| 4 `.mode-card` no interactivas (168 px) | `<details>` «Cuatro formas de practicar» con las mismas descripciones |
| Panel de progreso con anillo + leyenda + chips duplicados | Línea de datos + barra en la cabecera del mazo |
| Banner «Sesión en curso» + CTA «Continuar» en hero | Una línea de sesión + CTA único en el hero |
| Chips de 4 métricas + panel con las mismas 3 cifras | Una sola línea de datos con tarjetas/revisadas/dominadas/pendientes/error/última práctica |
| Nota en caja punteada | Línea informativa con icono |
| Respuesta/feedback como cajas dentro de la tarjeta | Regla lateral de acento/estado |
| Enlace «Todos los mazos» sin contexto | «Biblioteca» restaura filtros, grupos y scroll |
| «Salir al mazo» como único regreso | «Volver al mazo» + «Biblioteca» (sesión y resumen) |
| Sin anterior | «Anterior» + `←` / `→` |

Se conservan: 5 áreas (con su descripción y fuente documental en el grupo abierto), 20 categorías,
210 mazos, 630 tarjetas, resúmenes y títulos, 4 modos con sus descripciones y conteos, estadísticas,
programación, historial, referencias, enlaces a fichas, deep links, sesión persistente, el párrafo
introductorio del método (en la ayuda plegada) y la identidad visual (menta/ámbar, radios, tipografía
Inter/Zen Dots).

---

## 6. Navegación, rutas y persistencia

Rutas mantenidas:

- `study-flashcards/index.html` sin query → **biblioteca** (`#/`), sin forzar sesión.
- `?deck=<id>` → `#/mazo/<id>`; `?deck=<id>&resume=1` → `#/sesion` si hay sesión del mazo, si no el
  mazo; `?deck=<id>&mode=<libre|quick|exam|errors>` → sesión (o mazo + aviso si no hay tarjetas).
- `?deck=<id obsoleto>` → `#/` + aviso «El mazo guardado ya no está disponible…» (H3.8).
- `?deck&mode=free&sheet=<id>&from=dashboard` → sesión (enlace de Study Dashboard).
- `#/historial`, `#/resumen`, `#/mazo/<id>`, `#/sesion` directos.
- Biblioteca compartible: `#/?estado=pendientes&area=<id>&q=<texto>&abiertas=<id>,<id>`.
- `data-restore-library` restaura el hash y el scroll guardados; «volver al HUB» sigue siendo el
  control del AppBar (Agente 7), no se duplica.

Persistencia:

- Solo se usa la API pública de `StudyStore`; **no se añadieron claves ni se cambió el formato**
  (`study-serums`, `study-state-v1`, `studyhub:snapshot:v1`, `study-flash-origin-v1` intactos).
- La caché de modelos se invalida con `updatedAt`/`flashSession.updatedAt`, de modo que el progreso
  guardado se refleja al volver a la biblioteca.
- La sesión activa sobrevive a una recarga; la biblioteca muestra «Sesión en curso · … · tarjeta N de
  M» y el CTA «Continuar sesión».
- Contexto de origen en `sessionStorage` con la misma clave; se recuerda al entrar con `sheet` o
  `deck` aunque no haya `mode`, para no perder el origen al recargar.
- **Defecto de persistencia observado (no corregido aquí):** `StudyStore.getErrorCards()` y
  `getDeckStats()` mantienen un mazo como «con error» mientras `lapses > 0`, aunque la tarjeta se
  vuelva a responder bien. Evidencia: tras fallar y luego acertar una tarjeta, su estado queda
  `lastResult: "good"`, `box: 1`, `lapses: 1`, y el mazo sigue mostrando «1 con error» y el modo
  Errores vuelve a incluirla. Se reporta al Agente 2/coordinador; no se tocó `store.js`.

---

## 7. Pruebas ejecutadas (reales)

Entorno: Python 3.13 (`http.server 8775`), Chrome 155 headless (CDP 9335), Node 24.21. Arnés CDP
propio en `%TEMP%` (fuera del repositorio) para navegar, medir, pulsar teclas y capturar. Origen HTTP
`http://127.0.0.1:8775`; perfil temporal `%TEMP%\a5-chrome`; sin `file://`.

### 7.1 Portada: antes / después

| Viewport | Documento antes | Documento después | Hero antes | Hero después | Interactivos antes | Después (plegada) |
|---|---:|---:|---:|---:|---:|---:|
| 360×640 | 100.893 px | **1.560 px** (−98,5 %) | 898 | 261 | 642 | 19 |
| 390×844 | 87.962 px | **1.568 px** (−98,2 %) | 748 | 263 | 642 | 19 |
| 768×1024 | 68.790 px | **1.353 px** (−98,0 %) | 715 | 215 | 642 | 19 |
| 1440×900 | 37.548 px | **1.392 px** (−96,3 %) | 526 | 313 | 642 | 19 |
| 844×390 (landscape) | — | **1.352 px** | — | 219 | — | 19 |

Estados expandidos (filas solo al abrir):

| Estado | Viewport | Filas | Documento |
|---|---:|---:|---:|
| Un área (Salud pública) | 390 | 43 | 4.406 px |
| Las cinco áreas | 390 | 210 | 15.247 px |
| Un área | 1440 | 43 | 3.990 px |

`scrollWidth == innerWidth` en 320, 360, 390, 768, 844 y 1440 (sin scroll horizontal).

### 7.2 Barra de filtros (petición del coordinador)

| Viewport | `#lib-search` ancho | `.lib-seg` client / scroll | Alto mínimo de botón | Solapes | `document.scrollWidth` |
|---|---:|---:|---:|---|---:|
| 320 | 241 px | 290 / **290** | 38 px | ninguno | 320 |
| 360 | 281 px | 330 / **330** | 38 px | ninguno | 360 |
| 390 | 311 px | 360 / **360** | 38 px | ninguno | 390 |

Comprobado con rectángulos reales de buscador, segmentado, selector de área y «Expandir áreas»:
no hay intersección entre ellos en 320/360/390. El segmentado pasa a 2×2 con `flex-wrap` y borde
redondeado medio; las cuatro etiquetas quedan visibles y con área táctil de 38 px. El buscador ocupa
una fila completa y «Expandir áreas» va después del selector, sin solaparse.

### 7.3 Navegación, recargas y regreso

| Caso | Resultado |
|---|---|
| Clic en fila de mazo → vista de mazo | `#/mazo/<id>`; **0** navegaciones de documento |
| Iniciar sesión desde el mazo | `#/sesion`; **0** navegaciones |
| «Biblioteca» desde mazo/sesión/resumen | hash con `estado`, `q` y `abiertas`; **scroll restaurado (500/400 px medidos)** |
| Filtro → recarga (F5) de la URL compartida | mismo hash, mismos grupos abiertos, mismas filas |
| `?deck=<válido>` | vista de mazo; query limpiada |
| `?deck=<inválido>` | biblioteca + aviso; sin «Mazo no encontrado» ni bucle |
| `?deck=<activo>&resume=1` | sesión del mazo |
| `?deck=<sin pendientes>&resume=1` | vista de mazo |
| `?deck=<id>&mode=errors` sin errores | mazo + aviso «No hay errores registrados en este mazo» |
| `?deck&mode=free&sheet=<id>&from=dashboard` | sesión creada; `deckId` y `mode` correctos |
| `#/?estado=completadas` sin resultados | estado vacío + «Limpiar filtros» |
| Flechas del navegador | conservan la entrada de historial de la biblioteca |

Navegaciones de documento registradas (`Page.frameNavigated`): **1** por carga inicial; **0** en
cambios de mazo, sesión, filtro, búsqueda, grupo o regreso. Consola: **sin errores** en las pruebas
finales (solo un `console.warn` de «mazo no encontrado» con un id inventado antes de suavizarlo; ya no
aparece en la entrada inválida).

### 7.4 Sesión, teclado y accesibilidad

- Sesión: `Espacio` revela; `1–4` califica; `Enter` avanza; `←` anterior (visible desde la tarjeta 2);
  `→` avanza cuando la tarjeta ya está respondida; `Escape` cierra menús; `/` enfoca el buscador y
  `Escape` lo limpia.
- Flujo completo: libre (3/3), repaso rápido (desde el menú de fila), errores (1 tarjeta), examen
  (2 tarjetas, sin feedback hasta el final, resumen con revisión abierta «Todas las respuestas»).
- Foco: orden de tabulación verificado desde «Saltar al contenido» hasta los cuatro filtros, con
  anillo de 2 px menta; el buscador tiene anillo `focus-within`; el `h1` de ruta no dibuja caja.
- Nombres accesibles: filas con `aria-label` («… 3 tarjetas, 0 % de dominio, 3 pendientes. Sin
  practicar»), menú «Más acciones para …», filtros con `aria-pressed` y contador, contador con
  `aria-live="polite"`, barras con `role="progressbar"` y `aria-valuenow`, resumen de área con
  `<details>` nativo.
- Tema claro y oscuro revisados en biblioteca, mazo, sesión y resumen; contraste de texto principal
  (`#1D1B17` sobre `#F3F0E8` en claro; `#F4F1E9` sobre `#0B0B0D` en oscuro).
- `prefers-reduced-motion: reduce`: animación medida `1e-05s`, sin pérdida de información.

### 7.5 Rendimiento percibido (1440, tras caché de modelos)

| Acción | Tiempo medido (incluye 2 frames) |
|---|---:|
| Aplicar filtro «Pendientes» | 35 ms |
| Búsqueda tras debounce de 180 ms | 26 ms |
| Plegar todas las áreas | 34 ms |
| Desplegar las 210 filas | 33 ms |

Controles interactivos: 19 en la portada plegada (642 antes) y 277 con un área abierta. Nodos totales
con 30 filas visibles: 1.666.

---

## 8. Limitaciones y pendientes

1. **Errores que no se limpian (StudyStore).** `lapses > 0` mantiene la tarjeta en «Errores» y el mazo
   «con error» aunque se recupere. No se corrigió en `store.js` (propiedad del Agente 2). Mientras
   tanto, la UI muestra pendientes reales (incluye errores no vencidos) para no ocultar esos mazos.
2. **Caché de CSS.** `study-flashcards/index.html` sigue referenciando `styles.css?v=2.1.0`. El
   archivo pertenece al Agente 7; conviene subir la versión (`?v=2.2.0`) para que los usuarios no
   reciban la hoja anterior desde caché. No se editó el HTML.
3. **AppBar a 320 px.** El AppBar (Agente 7) pasa a dos filas (95 px) por la regla ≤340 px de
   `base.css`; es una decisión de controles, no de la biblioteca. La biblioteca no desborda a 320.
4. **Menú de fila.** Se abre hacia arriba si no cabe y se cierra con Escape/clic fuera, pero no se
   reposiciona si el usuario hace scroll con el menú abierto; el panel mide 196–208 px y puede requerir
   scroll en filas extremas.
5. **URL larga.** Con cinco áreas abiertas el hash ronda 150 caracteres; es intencional para compartir
   el estado. Si se prefiere, puede acortarse con IDs numéricos en una revisión futura.
6. **Cobertura de navegadores.** Probado en Chrome 155 headless (DPR 1). No se probó Safari, Firefox,
   dispositivos reales ni lectores de pantalla (solo nombres accesibles del DOM). `<details>`,
   `color-mix()` y `Object.fromEntries` ya se usaban o son estándar en navegadores actuales.
7. **Datos.** No se modificó ningún contenido, ID, categoría, fuente ni clave. El estado de prueba se
   limpió solo en el perfil temporal de Chrome (`Storage.clearDataForOrigin`), nunca en el perfil real.

---

## 9. Evidencias

En `AUDIT/evidencias/` (capturas Chrome headless, DPR 1):

- Antes: `agent5-before-360x640.png`, `agent5-before-390x844.png`, `agent5-before-768x1024.png`,
  `agent5-before-1440x900.png`, `agent5-before-decks-1440.png`, `agent5-before-390-full.png`.
- Biblioteca final: `agent5-final-library-1440.png`, `agent5-final-library-open-1440.png`,
  `agent5-final-library-390.png`, `agent5-final-library-320.png`,
  `agent5-final-library-768-search.png`, `agent5-final-landscape-844.png`,
  `agent5-final-library-light-1440.png`, `agent5-final-library-light-390.png`,
  `agent5-final-reduced-1440.png`.
- Filtros/teclado: `agent5-filter-many-360.png`, `agent5-search-few-360.png`,
  `agent5-check-320.png`, `agent5-check-360.png`, `agent5-check-390.png`,
  `agent5-lib-menu-1440.png`, `agent5-sticky-1440.png`.
- Mazo/sesión/resumen: `agent5-final-deck-1440.png`, `agent5-final-deck-360b.png`,
  `agent5-final-session-revealed-1440.png`, `agent5-final-session-360b.png`,
  `agent5-final-summary-1440.png`, `agent5-final-summary-390.png`,
  `agent5-exam-summary-390.png`.
- Medición base guardada en la salida de los scripts de auditoría (no se versionan scripts en el
  repositorio para no invadir `tools/` del Agente 1 ni `tests/` del Agente 8).

---

© 2026 ZARCONT — documento interno de auditoría. No modifica el contenido académico ni las fuentes.
