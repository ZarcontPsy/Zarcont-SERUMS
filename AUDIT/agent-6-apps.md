# Agente 6 — Study Dashboard, Plaza SERUMS, Banqueo y Examen Studio

Fecha: 2026-10-25 · Repositorio: `C:\Users\USARIO\Documents\ZARCONT SERUMS`
Alcance: corrección de defectos reales verificados en navegación, estado, persistencia y
accesibilidad de tres aplicaciones. **No se reconstruyó ninguna app, no se tocaron datos,
IDs, claves, tiradas ni contenido académico, y no se modificó ningún store.**
Documentos leídos: `AUDIT/COORDINATION.md`, `DESIGN-SYSTEM.md`, `AUTORIA.md` y el código de
cada aplicación.

## 0. Entorno y método

- Servidor: `python -m http.server 8776 --bind 127.0.0.1` (raíz del repositorio).
- Chrome: `chrome.exe --headless=new --disable-gpu --no-first-run --remote-allow-origins=*
  --remote-debugging-port=9336 --user-data-dir=%TEMP%\a6-*` (perfil temporal por ejecución).
- Node 24 (`...\dependencies\node\bin\node.exe`) + arnés CDP de `tests/e2e/lib` (solo lectura;
  no se modificó). Sondas propias fuera del repositorio (`%TEMP%\a6\*.mjs`).
- Medición de recargas con `Page.frameNavigated`; errores con `Runtime.exceptionThrown`,
  `Runtime.consoleAPICalled` y `Log.entryAdded`.
- Resoluciones: 1440×900, 768×1024, 390×844 y 320×700; landscape 844×390; teclado real por
  `Input.dispatchKeyEvent`; `prefers-reduced-motion` por `Emulation.setEmulatedMedia`.
- Resultado global: **128/128 comprobaciones PASS** (Study 44, Banqueo 40, Plazas 44),
  **0 excepciones JS y 0 errores de consola de las apps**.

## 1. Resumen por aplicación

| App | Problema verificado | Causa | Cambio aplicado | Prueba |
|---|---|---|---|---|
| Study Dashboard | `?sheet=<id obsoleto>` (enlace guardado del HUB) mostraba «Esta ficha no está disponible» y dejaba la ruta antigua en la URL | `initQuery()` convertía cualquier `?sheet=` en `#/ficha/<id>` sin validar; el `replaceState` conservaba la query | `?sheet=` inválido ⇒ query limpia + portada `#/` + aviso discreto (`UI.toast`), sin bucle; `?sheet=` válido limpia la query y abre la ficha | 44/44; «deep link inválido: vuelve a portada», «aviso visible», `navigations=1` |
| Study Dashboard | Al refrescar/volver tras leer al 60 %, la posición visible era ~9 % y **sobrescribía** el 60 % guardado | `renderRoute` calculaba `scrollRatio × max` en el primer rAF, antes del layout final (fuentes); `scroll`/`flushReading` guardaban la posición provisional | Restauración con doble rAF + `document.fonts.ready` + margen 900 ms, `scrollHeight` final y scroll instantáneo (base.css usa `smooth`); `saveScroll`/`recordScrollOnly` bloqueados con `state.restoring`; un scroll real cancela la restauración | `0.6000` guardado → `0.6000` restaurado (`scrollY 732/1220`); `saved` no se degrada tras 1,6 s |
| Study Dashboard | «Retomar lectura» y `#/ficha/<id>` abrían siempre arriba; la lectura guardada solo se usaba con `?sheet=` | La restauración dependía de `resumeSheet` y solo se aplicaba en la carga con query | La ficha reabierta (panel, biblioteca o deep link) restaura si hay lectura previa > 2 %; el paginador «anterior/siguiente» abre desde el principio | «panel: retomar lectura abre la ficha» + restauración al 60 % |
| Study Dashboard | Las fuentes/referencias del lector eran texto inerte: no se podía abrir el PDF citado | `renderSheet()` pintaba `<div class="reader-source-row">` sin enlace | Cada referencia es `<a … target="_blank" rel="noopener">` al PDF con `#page=<página>` + icono externo, hover y `:focus-visible` | «fuentes enlazan al PDF y pagina» (`…#page=5`, `_blank`) |
| Study Dashboard | Los temas desplegados de la biblioteca se cerraban al cambiar de pestaña y volver (`visibilitychange`) | `renderRoute` reconstruía `<details class="topic-block">` sin recordar el estado abierto | `state.openTopics[topicId]` + listener `toggle` en captura (el evento no burbujea); estado de interfaz de la sesión | Abrir 2 temas → `visibilitychange` → siguen los 2 abiertos (16 bloques comprobados) |
| Banqueo | No había regreso explícito al HUB ni pantalla completa en el topbar | El topbar lo pinta `renderShell()` y no tenía contenedor de controles | `<span class="top-chrome" data-chrome-mount>` como primer hijo de `.top-actions` + `mountChrome()` con `SerumsChrome.mount(host,{homeHref:"#hub",hubHref:"../index.html",buttonClass:"icon-btn",fullscreen:true,order:["home","hub","fullscreen"]})`; tolerante si el módulo falta | 1 grupo `.serums-chrome`, 3 botones, sin duplicados tras navegar; HUB `../index.html`, Inicio `#hub`; fullscreen activa/desactiva con `aria-pressed` |
| Banqueo | Refrescar durante una práctica (`#practice/session`) perdía la sesión en memoria y obligaba a buscar «Intentos en curso» | El intento se guardaba, pero la sesión activa solo vivía en `APP.practice.session` | Marcador efímero `sessionStorage["banqueo-active-attempt-v1"]` + `sessionFromAttempt()`; `onRoute()` recupera el intento `prog` en `#practice/session`; se limpia al entregar/salir/reintentar | Tras `location.reload()`: misma pregunta, `answers=2`, `index=1`, mismo `attemptId` |
| Banqueo | Al salir de la práctica con la navegación del topbar se perdía la última respuesta marcada | `onRoute()` llamaba a `saveSessionProgress()`, que difiere 200 ms, y acto seguido vaciaba la sesión (el guardado se descartaba) | `persistSession()` guarda de inmediato al abandonar la sesión; también en `beforeunload`/`visibilitychange` (antes usaban el temporizador diferido) | «respuestas se guardan durante el intento» + recuperación tras recarga |
| Banqueo | El nombre y las preferencias de práctica no se conservaban: `localGet("banqueo-name")` se leía pero nunca se escribía | Faltaba la escritura en `localStorage` en `handleInput`/`handleChange` | Se guardan `banqueo-name`, `banqueo-practice-count`, `banqueo-practice-minutes`, `banqueo-practice-mode`, `banqueo-practice-shuffle`; se restauran con validación al arrancar | Preferencias visibles tras recarga (`A6 Prueba`, 10, 30, simulacro, sin mezclar) |
| Banqueo | A 320 px los botones de cada convocatoria («Abrir banco»/«Practicar»/PDF) se recortaban dentro de la tarjeta | `.exam-actions` no envolvía y `.btn { flex:1 }` con `white-space:nowrap` desbordaba la columna | `@media (max-width:380px)`: `.exam-actions{flex-wrap:wrap}` + botones `flex:1 1 auto; min-width:0` | 320 px: 0 botones recortados, `scrollWidth=320` |
| Plazas SERUMS | Al quitar una favorita/adjudicada dentro del filtro rápido, la lista seguía mostrándola aunque los contadores ya decían 0 | `afterStateChange()` no invalidaba `_filteredCache`, así que `Results.render()` reutilizaba la lista anterior | `_filteredCache = null` al inicio de `afterStateChange()` | Favorita dentro de «Favoritas» → quitar → `rows=0`, `filtered=0`, `count=0`, sin recarga |
| Plazas SERUMS | Tras recargar, el contador del rail de adjudicadas mostraba 0 aunque hubiera 1 guardada | En `init()` se pintaban favoritos/comparador/notificaciones, pero no el badge de adjudicación | `if (window.AdjCenter) window.AdjCenter.badge();` en el arranque | Recarga: `adjCount=1`, badge `1` |
| Plazas SERUMS | La ficha, la clave y la exportación no se cerraban con `Esc`, no tenían `role="dialog"`/`aria-modal` y el foco quedaba detrás | Los overlays se abrían con `classList.add("open")` y solo el botón de cierre | `openBackdrop()`/`closeBackdrop()`: `role`, `aria-modal`, foco dentro y retorno al disparador; `Esc` cierra ficha/clave/exportación y el panel de notificaciones | Ficha: `role=dialog`, foco dentro, `Esc` cierra y el foco vuelve a un `BUTTON` |
| Plazas SERUMS | En móvil, al elegir una plaza desde el panel lateral la tarjeta contextual quedaba tapada por el propio panel | `selectPlaza()` no cerraba el drawer móvil | Si `isMobileSide()` y el panel está abierto, se cierra al seleccionar | «plaza: seleccion abre tarjeta contextual» + drawer cerrado al seleccionar |
| Plazas SERUMS | A 390 px `#btnImport/#btnTheme/#btnNotif` se comprimían a ~31 px (20 px a 320) por `flex-shrink`; el chrome se mantenía a 44 px | `.btn.icon` base 44 px con `flex-shrink:1` y topbar flexible: los cuatro botones de la app cedían ancho para que cupiera el grupo de chrome | `#topbar .btn{flex:0 0 auto}`; `#topbar .btn.icon:not([data-serums-chrome])` a 36×36; `#btnExport` mínimo 36; a ≤380 se oculta solo `#brandHome` (el mapa sigue en el rail); chrome con sus 44 px intactos | 320/360/390: botones de app 36×36, chrome 44×44, sin solapes, `scrollWidth=clientWidth` y `barSW=barCW`; importar/tema/notificaciones presentes en los tres anchos |

### Lo que se verificó sin cambios (no era defecto)

- Study Dashboard entra por `study-dashboard/index.html` sin query ni hash antiguo; no existe
  una página antigua alternativa. Las **5 áreas oficiales de Psicología** se pintan desde
  `StudyTaxonomy.primaryAreas()` (Salud pública, Cuidado integral, Ética, Investigación, Gestión).
- Navegación interna de Study (área → categoría → ficha), filtros y búsqueda se conservan y no
  recargan; `aria-current`, foco en `h1`, `/` para buscar y modo rápido/completo funcionan.
- Banqueo: hub de 17 profesiones, detalle por profesión, banco con 300 preguntas, chips de
  filtro, detalle maestro-detalle en escritorio y hoja con `Esc` en móvil; en simulacro no se
  revela la clave antes de entregar; resultado, historial y ranking local se calculan igual.
- Plazas: mapa Google operativo con la clave demo incluida (no se modificó), selección,
  favoritos, adjudicación con confirmación, cinco subvistas, regreso al mapa desde la marca y
  el rail, y actualización localizada de filtros sin recargar.

## 2. Pruebas ejecutadas

| App | Comprobaciones | Resultado |
|---|---|---|
| Study Dashboard | 44 | **44 PASS** (navegación, 5 áreas, fichas, fuentes-enlace, estado, búsqueda/filtros, deep links válidos e inválidos, scroll 60 %, temas abiertos, progreso, 1440/768/390, reduced motion, consola) |
| Banqueo / Examen Studio | 40 | **40 PASS** (hub, profesiones, banco/filtros/detalle, `Esc` móvil, simulacro sin clave, refresco recuperado, entrega/resultado/historial/ranking, preferencias, chrome 3 botones, fullscreen, 1440/768/390/320/landscape, reduced motion, consola) |
| Plazas SERUMS | 44 | **44 PASS** (dataset 7.323 plazas, mapa y fallback, filtros, selección, ficha, favoritos, adjudicadas persistentes, 5 subvistas, regreso, móvil/tablet, topbar 320/360/390, reduced motion, consola) |

- Recargas: **1 navegación inicial por app**; toda acción interna medida (filtros, favoritos,
  adjudicación, cambio de ficha, cambio de pregunta, cambio de vista) mantuvo
  `Page.frameNavigated` sin incremento.
- Topbar de Plazas barrido de 320 a 600 px (320/360/375/380/381/390/400/420/520/600):
  `barSW=barCW` y `docSW=vw` en todos los anchos, botones de app 36×36, chrome 44×44,
  exportación 36–40×36, sin solapes y con importar/tema/notificaciones presentes.
- Fallback de Plazas sin clave válida (probado forzando una clave inválida y recargando):
  overlay «Google Maps no se pudo cargar» + instrucciones, `Maps: error`, y **el listado,
  los filtros y la exportación siguen operando** (118 resultados tras filtrar por Biología).
- Capturas: `AUDIT/evidencias/agent6-dashboard-*`, `agent6-banqueo-*`, `agent6-plazas-*`
  (24 imágenes: portada, ficha, banco, práctica, resultado, fallback, móvil/tablet/landscape).

## 3. Archivos modificados

| Archivo | Cambios |
|---|---|
| `study-dashboard/app.js` | `cleanQueryTo`, validación de `?sheet=`, `state.pendingNotice`, restauración estable de scroll (`restoreScroll`, `scrollToInstant`, bloqueo de guardado), `state.suppressScrollRestore`, fuentes enlazadas al PDF, `state.openTopics` + listener `toggle`, `restoreScroll:true` en portada/hash |
| `study-dashboard/styles.css` | `.reader-source-row` como enlace (hover, `focus-visible`), `.reader-source-copy`, `.reader-source-open` |
| `EXAMEN STUDIO/js/app.js` | `data-chrome-mount` + `mountChrome()`; `ACTIVE_ATTEMPT_KEY`, `sessionFromAttempt()`, `persistSession()`, recuperación en `onRoute()`, guardado inmediato al salir/ocultar/descargar; preferencias de práctica persistidas y restauradas |
| `EXAMEN STUDIO/styles.css` | `.top-chrome` (+`:empty`), wrap de `.exam-actions` y ajuste del topbar a ≤380 px |
| `serums map/serums-map-explorer/js/app.js` | Invalidación de `_filteredCache` en `afterStateChange`, `AdjCenter.badge()` al arrancar, `openBackdrop`/`closeBackdrop` (rol, foco, `Esc`), cierre del drawer móvil al seleccionar |
| `serums map/serums-map-explorer/styles.css` | Topbar móvil: botones de app sin `flex-shrink` y 36×36, exportación ≥36, ocultación de la marca a ≤380 para no perder ningún control ni desbordar |

No se modificaron: `study-shared/*`, `EXAMEN STUDIO/js/store.js`, `EXAMEN STUDIO/js/parser.js`,
`serums map/.../js/services.js`, `filters.js`, `panels.js`, `mapview.js`, `adjudicacion.js`,
ningún `index.html`, datos, PDFs, `INTEGRITY.sha256`, `AUTORIA.md` ni `DESIGN-SYSTEM.md`.
Los cambios en `index.html`/stores que aparecen en `git status` son de otros agentes.

## 4. Integración de controles comunes (`SerumsChrome`)

- **Banqueo (mío):** contenedor `[data-chrome-mount]` creado por `renderShell()` dentro de
  `.top-actions` y montaje con `buttonClass:"icon-btn"` (clase real de los botones del topbar),
  `homeHref:"#hub"`, `hubHref:"../index.html"`. Cada `renderShell()` recrea el contenedor, por lo
  que el módulo monta un único grupo (verificado: 1 grupo, 3 botones, sin duplicados tras
  navegar). Si `window.SerumsChrome` no existe, no se pinta nada y la app sigue igual.
- **Plazas y Study Dashboard:** el HTML (propiedad del Agente 7) ya carga `serums-chrome.js/.css`
  y monta los controles; verifiqué que existen y apuntan al lanzador (`/index.html`). No edité
  esos HTML. Plazas no muestra «Inicio» (el mapa es su portada), como define el contrato.
  En Plazas el chrome conserva 44×44 px en móvil; la app reduce solo sus propios iconos a
  36×36 y oculta la marca a ≤380, sin quitar HUB, pantalla completa, tema, importar,
  notificaciones ni exportar.
- Pantalla completa: nativa (`document.fullscreenElement`), con `aria-pressed` y etiqueta
  sincronizadas; probada en Banqueo (activar/desactivar). `Esc` no se secuestra.

## 5. Riesgos, límites y pendientes

1. **Origen de un `?sheet=` obsoleto:** el HUB (`index.html`, `setProgress`) construye el enlace
   desde `studyhub:snapshot:v1`. El Dashboard ya tolera IDs inexistentes sin página antigua ni
   bucle. No hay evidencia de que el snapshot escriba IDs retirados; si el Agente 1/3 cambia el
   enlace de reanudación a la portada (D1), el caso deja de ser visible. No se tocó el store.
2. **Temas desplegados:** se conservan durante la sesión (memoria); un refresco completo de la
   página los reinicia. Se clasificó como estado de interfaz temporal, no como progreso.
3. **Google Maps:** la clave demo incluida funcionó en las pruebas; el fallback se validó
   forzando una clave inválida. Sin red o sin clave válida el mapa no se dibuja, pero listado,
   filtros, estadísticas y exportación siguen disponibles (documentado en el propio overlay).
4. **`file://`:** todas las pruebas se hicieron por HTTP (mismo origen). Bajo `file://` el
   almacenamiento compartido de Study y las descargas de exportación pueden comportarse distinto.
5. **No ejercitado:** importación real de PDF/Excel (depende de CDN de PDF.js/SheetJS) y
   geocodificación por lotes (requiere clave con facturación). No se modificó ese código.
6. **Alcance:** no se reorganizó contenido académico ni se alteraron claves, puntuación,
   preguntas, plazas o IDs. No se declara revisión humana (`reviewed = 0` sigue visible).
7. **Marca en el ancho mínimo:** en Plazas, a ≤380 px se oculta solo `#brandHome` para que
   ningún control pierda área táctil ni se recorte; el mapa sigue accesible desde el botón
   «Explorar mapa» del rail. No se ocultó HUB, pantalla completa, tema, importar,
   notificaciones ni exportar.

## 6. Evidencia

- `AUDIT/evidencias/agent6-dashboard-home-1440.png`, `…-sheet-1440.png`,
  `…-resume-1440.png`, `…-tablet-768.png`, `…-mobile-390.png`,
  `…-sheet-tablet-768.png`, `…-sheet-mobile-390.png`.
- `AUDIT/evidencias/agent6-banqueo-hub-1440.png`, `…-banco-1440.png`,
  `…-practica-1440.png`, `…-resultado-1440.png`, `…-tablet-768.png`,
  `…-mobile-390.png`, `…-mobile-angosto-320.png`, `…-landscape-844.png`.
- `AUDIT/evidencias/agent6-plazas-mapa-1440.png`, `…-ficha-1440.png`,
  `…-fallback-1440.png`, `…-tablet-768.png`, `…-movil-390.png`,
  `…-topbar-320.png`, `…-topbar-360.png`, `…-topbar-390.png`.
- Las capturas se tomaron con movimiento reducido cuando aplica y sin recortes que oculten el
  estado; los datos mostrados provienen del dataset real del repositorio.
