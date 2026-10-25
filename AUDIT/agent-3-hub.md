# Agente 3 — HUB: dock, responsive real y navegación continua

Fecha: 2026-10-25 · Archivo propietario: `index.html` · Estado: **completado y verificado**
Ámbito: hub SERUMS (`SERUMS HUB 2.3.0`). No se reconstruyó nada ni se editó ninguna app,
`AUTORIA.md`, `DESIGN-SYSTEM.md`, `NOTICE.md` ni `INTEGRITY.sha256`.

## 1. Archivos y límites respetados

- **Modificado:** `index.html` (solo CSS/HTML/JS del hub).
- **Sin tocar (verificado con `git diff`):** `CONFIG.apps`, `dashboardHref`, `flashcardsHref`,
  la línea `link.setAttribute("href", opts.href || CONFIG.apps[kind]);` de `setProgress` y los
  cinco `href` de `.app-card`. Tampoco se tocaron datos, textos de producto ni identidad visual.
- **Textos ajustados (autorizados por el coordinador):** solo las dos frases que describían el
  dock eliminado (modal de atajos y «Acerca de»). No se inventaron funciones nuevas.
- **Evidencias nuevas:** `AUDIT/evidencias/agent3-*` (métricas JSON, capturas PNG y arnés CDP).
- No se ejecutó `git checkout/reset/clean/stash`.

## 2. Hallazgos y causa raíz

### 2.1 Dock inferior (D2)

- Existía un `.dock` fijo lateral con `#dock`, `.dock-btn`, animación de entrada,
  `body.launching .dock`, soporte `@supports` y `@media (max-width:1100px)` que lo ocultaba,
  más `buildNav()`/`setActive()`/listener dedicados.
- **Funciones cubiertas:** barra inferior (`#prevBtn`, `#nextBtn`, `#openCurrent`), puntos,
  flechas del topbar, swipe y teclado ya permiten seleccionar y abrir. No había función
  exclusiva del dock.
- **Causa raíz:** componente redundante que además duplicaba estado (`aria-pressed`) y podía
  desincronizarse.

### 2.2 Responsive

- A ≤600 px la tarjeta imponía `--card-h: clamp(520px, calc(100dvh - 190px), 640px)`: el mínimo
  de 520 px desbordaba 320×568 (página 686 px) y 360×640 (686 px); barra y puntos quedaban bajo
  el pliegue. En 844×390 la tarjeta medía 480 px y la página 669 px.
- `#btnFs{display:none}` a ≤600 px eliminaba la pantalla completa en móvil.
- No había `viewport-fit=cover` ni `env(safe-area-inset-*)`: una muesca podía tapar barra/puntos.
- El arte al 60 % dejaba el cuerpo con 153–167 px a poca altura; el contenido natural de
  BANQUEO/PLAZAS (~172 px) y Study (~163 px) se recortaba si se reducía la tarjeta sin ajustar
  el reparto.
- En 901–966 px, `--side-offset: .88 × --card-w` podía sacar la tarjeta lateral del viewport
  (el `overflow-x:hidden` lo ocultaba, pero el arte quedaba cortado).
- Colisión de clases: el punto decorativo de QUEST usaba `.dot`, igual que los puntos de
  navegación (afectaba a selectores externos y a la medición; el CSS lo tapaba por
  especificidad).

### 2.3 Navegación continua

- `setActive()` ya era estado/clases, **sin recarga**. Se confirmó con CDP:
  `Page.frameNavigated` (marco principal) = **0** en 5 acciones de selección y
  `performance.getEntriesByType('navigation').length` se mantuvo en 1.
- Transiciones animaban `filter`, `border-color` y `box-shadow` (repintados) además de
  `transform/opacity`.
- El gesto solo evaluaba `pointerup`; no distinguía eje durante el movimiento ni ignoraba
  punteros secundarios. Un arrastre horizontal podía acabar como clic.

### 2.4 Pantalla completa

- La API era nativa, pero no exponía `aria-pressed`, no sincronizaba `title`, no gestionaba
  `fullscreenerror` ni anunciaba el resultado. `hidden` podía ser anulado por
  `.icon-btn{display:grid}` si el navegador no soportaba fullscreen.

## 3. Cambios aplicados

### A. Dock eliminado

- CSS: bloque `.dock`/`.dock-btn` completo, `body.launching .dock`, transición de entrada
  (`html.js .dock`, `body.ready .dock`, `transition-delay`), `@media (max-width:1100px)` y
  `.dock` del `@supports`. La transición de entrada queda solo para topbar y carrusel.
- HTML: eliminado `<aside class="dock" id="dock" aria-label="Ir a una aplicación"></aside>`.
- JS: eliminados `const dock`, el pintado del dock en `buildNav()`, su rama en `setActive()`
  y su listener. `buildNav()` sigue generando los cinco puntos.
- Textos: atajos y «Acerca de» ya no mencionan el dock; describen flechas, puntos, tarjetas
  laterales, swipe y teclado.
- **No se creó otro dock, cuadrícula ni patrón alternativo.**

### B. Responsive real

- `viewport-fit=cover`; `[hidden]{display:none!important}` para que `btnFs.hidden` sea real.
- **≤600 px:** topbar 50 px con iconos de 38×38 (antes 32) y flechas 38×38 (antes 29),
  `padding`/`gap` compactos, marca con truncado seguro (se sigue ocultando a ≤380 px).
  `#btnFs` visible y cabiendo en 320, 360 y 390. Tarjeta
  `--card-h: clamp(360px, calc(100dvh - 184px - safe-top - safe-bottom), 640px)`
  (320×568 → 384 px; 360×640 → 456 px); barra 58 px con botones de 40, puntos de 40×40.
- **≤600 px y ≤700 px de alto:** arte de la tarjeta activa al 52 % para que quepan título,
  descripción, metadatos, progreso, último punto y CTA sin recorte.
- **≤820 px:** tarjeta de ancho fluido; **≤900 px** laterales ocultos y stage con safe-area.
- **901–1100 px:** `--side-offset` limitado con `min(0.88 × --card-w, 50vw - 0.5 × --card-w - 10px)`
  para que las laterales nunca salgan del viewport.
- **Escritorio bajo (≤820 px de alto):** arte al 56 % (antes 58 %) para dar margen al contenido
  de BANQUEO en 1280×720.
- **Móvil horizontal (≤560 px de alto):** cartilla apaisada (arte 32 % + cuerpo), barra de
  50 px, puntos de 40×40 y altura
  `clamp(150px, calc(100dvh - 158px - safe-*), 300px)` (844×390 → 232 px; 568×320 → 162 px).
  A ≤360 px de alto se ocultan metadatos/punto anterior y la descripción pasa a una línea
  (contenido redundante, no datos académicos). Sin scroll vertical.
- **Safe-area:** stage, topbar, carrusel, barra y puntos descuentan
  `env(safe-area-inset-top/right/bottom/left)`; la altura de tarjeta también.
- Paleta, tipografía, radios, arte y jerarquía se conservan. Sin scroll horizontal en ningún
  viewport medido.

### C. Navegación continua y táctil

- `setActive()` mantiene estado/clases, `aria-current`, `tabIndex`, `aria-live`, clamp de índice
  y foco; no recarga ni desmonta tarjetas.
- Transición reducida a `transform 520 ms` + `opacity 320 ms` (sin animar `filter`,
  `border-color` ni `box-shadow`). Respuesta táctil con `:active` en tarjeta, botones y puntos.
- Indicador de selección: tarjeta activa con borde/glow, barra con color y nombre de app,
  puntos con pastilla activa y `aria-current`.
- Gesto: `touch-action: pan-y` se conserva; se ignoran punteros no primarios; `pointermove`
  detecta eje horizontal (>28 px y 1.35× el vertical) y suprime el clic del arrastre; `pointerup`
  decide con umbral 44 px; un gesto vertical no cambia tarjeta ni captura el scroll.
- Puntos: 40×40 reales sin cambiar el punto visual (6 px; activo 22 px), sin solapamiento
  (pitch 40 px). El punto decorativo de QUEST se renombró a `.quest-dot` para eliminar la
  colisión con `.dot`.
- Se mantiene `display:none` únicamente para contenido no activo dentro de tarjetas de altura
  fija (no altera el layout del carrusel) y para el modo compacto de ≤360 px; no hay saltos de
  tarjeta/barra al seleccionar.

### D. Pantalla completa nativa

- Botón con `aria-pressed="false"` y `title` inicial; en `fullscreenchange` se sincronizan
  `is-fs`, `aria-pressed`, `aria-label`, `title`, `data-tip` y el icono (CSS refleja el estado
  real, no lo simula).
- `requestFullscreen()/exitFullscreen()` conservados; rechazo de la promesa y
  `fullscreenerror` llaman a `fsFailed()`, que resetea el estado y anuncia en
  `#fsLive` («No se pudo cambiar el modo de pantalla completa.»).
- `fullscreenchange` anuncia activación/desactivación. Si `document.fullscreenEnabled` es falso
  el botón se oculta de verdad (`[hidden]`), no se finge.
- `Esc` sigue siendo del navegador.

## 4. Pruebas ejecutadas

### Entorno

```powershell
python -m http.server 8773 --bind 127.0.0.1
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' --headless=new --disable-gpu --no-first-run `
  --remote-allow-origins=* --user-data-dir=$env:TEMP\a3-chrome --remote-debugging-port=9333 about:blank
& 'C:\Users\USARIO\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe' `
  'AUDIT\evidencias\agent3-measure.mjs' --mode=after --screens
& 'C:\Users\USARIO\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe' `
  'AUDIT\evidencias\agent3-interact.mjs'
```

Chrome 155 headless, Node 24, CDP con `Emulation.setDeviceMetricsOverride` (sin perfil real),
`Page.frameNavigated`, `Runtime.evaluate`, `Input.dispatchKeyEvent`,
`Emulation.setSafeAreaInsetsOverride`, capturas `Page.captureScreenshot`. En la medición de
layout se inyecta `transition:none` para leer el layout final, no el estado animado.

### 4.1 Antes / después (11 viewports)

| Viewport | Antes página (scrollH/innerH) | Antes tarjeta | Antes fs | Antes dock | Después página | Después tarjeta |
|---|---|---|---|---|---|---|
| 320×568 | **686/568** | 296×520 | oculto | sí | **568/568** | 296×384 |
| 360×640 | **686/640** | 336×520 | oculto | sí | **640/640** | 336×456 |
| 390×844 | 844/844 | 366×640 | oculto | sí | 844/844 | 366×640 |
| 414×896 | 896/896 | 390×640 | oculto | sí | 896/896 | 390×640 |
| 768×1024 | 1024/1024 | 448×640 | visible | sí | 1024/1024 | 448×640 |
| 1024×768 | 768/768 | 350×520 | visible | sí | 768/768 | 350×520 |
| 1280×800 | 800/800 | 435.2×552 | visible | sí | 800/800 | 435.2×552 |
| 1440×900 | 900/900 | 448×620 | visible | sí | 900/900 | 448×620 |
| 568×320 (H) | **686/320** | 448×520 | oculto | sí | **320/320** | 544×162 |
| 844×390 (H) | **669/390** | 350×480 | visible | sí | **390/390** | 820×232 |
| 1280×720 | 720/720 | 435.2×480 | visible | sí | 720/720 | 435.2×480 |

Resultado en los 11: `scrollWidth == clientWidth`, `scrollHeight == innerHeight`,
**0** elementos fuera de viewport, **0** recortes de `.app-body`, **0** elementos bajo el
pliegue, **0** desbordes internos de topbar, **0** `.dock` en DOM.
Medido: `AUDIT/evidencias/agent3-before-metrics.json` y `agent3-after-metrics.json`.

### 4.2 Áreas táctiles (medidas finales)

| Control | 320–414 px | 768–1440 px | 568×320 / 844×390 |
|---|---|---|---|
| Puntos | **40×40** | 40×40 | 40×40 |
| Flechas topbar | **38×38** | 34×34 | 36×36 |
| Pantalla completa / ayuda / acerca de | **38×38** | 34×34 | 36×36 |
| Flechas barra | **40×40** | 38×38 | 38×38 |
| «Abrir» barra | **40×40** | 73×38 | 40×38 / 67×38 |

Mínimo medido: **38 px** en retrato móvil, **36 px** en horizontal móvil, **34 px** en
escritorio. Puntos: 5 botones de 40×40, sin solapamiento; clic en el punto *i* selecciona la
cartilla *i* (probado 0→BANQUEO, 1→PLAZAS, 2→DASHBOARD, 3→FLASHCARDS, 4→QUEST; un solo
`.is-active` y `aria-current="true"` correcto).

### 4.3 Navegación continua (sin recarga)

Secuencia con CDP: `next`, `prev`, punto 3, tarjeta lateral, flecha del topbar, `→` de teclado,
swipe horizontal y swipe vertical. Resultado:

- `Page.frameNavigated` de marco principal durante toda la secuencia: **0**.
- `performance.getEntriesByType('navigation').length`: **1** (solo la carga inicial).
- Estado coherente: `plazas/1 → banqueo/0 → dashboard/2 → flashcards/3 → quest/4 → banqueo/0`
  y `tbPos` 2/5…1/5; `carouselLive` anuncia cada cambio.
- Swipe horizontal (dx −120, dy 10): BANQUEO → PLAZAS. Swipe vertical (dx 5, dy 150): sin
  cambio. Clic lateral: selecciona. `performance navigation` final: 1.
- Apertura por teclado `2`: **una** navegación a `serums map/serums-map-explorer/index.html`
  (apertura normal de app, permitida por D4).

### 4.4 Pantalla completa (nativa)

Con gesto de usuario (`Runtime.evaluate` + `userGesture:true`):

| Estado | aria-pressed | aria-label / title | `document.fullscreenElement` | `html.is-fs` |
|---|---|---|---|---|
| Inicial | false | Pantalla completa | null | false |
| Tras pulsar | **true** | Salir de pantalla completa | **HTML** | **true** |
| Tras salir | **false** | Pantalla completa | null | false |

`#fsLive`: «Pantalla completa activada.» / «Pantalla completa desactivada.».
`fullscreenerror` (evento sintético): vuelve a `false`, quita `is-fs`, etiqueta correcta y
anuncia «No se pudo cambiar el modo de pantalla completa.».
Visible y medido en 320/360/390 (38×38), 568×320 y 844×390 (36×36).

### 4.5 Safe-area y redimensionado

- Retrato 390×844 con insets **top 47 / bottom 34**: topbar 57–107, tarjeta 115–694,
  barra 702–760, puntos 766–802, `scrollWidth/Height` 390/844, sin overflow. `stage`
  `padding-top:115px`, `padding-bottom:42px`.
- Horizontal 844×390 con insets **left/right 47, bottom 21**: topbar 57–787, tarjeta 59–785,
  barra 162–682, documento 844×390, sin overflow.
- Redimensionado con CDP: 390×844 → 390×760 → 390×700 → 360×640 → 320×568 → 844×390 →
  568×320 → 390×844: `fits=True` en todos (tarjeta, barra y puntos dentro; sin overflow).
- Emulación móvil real (`mobile:true` + recarga, meta viewport): 390×844, `innerWidth=390`,
  `scrollWidth=390`, `scrollHeight=844`, sin overflow, `#btnFs` visible.

### 4.6 Consola y sintaxis

- `Runtime.exceptionThrown`, `console.error` y `Log.entryAdded` del hub: **0**.
- `node --check` del JS inline: **0** errores; ids HTML únicos.
- El único 404 observado es `/favicon.ico` solicitado por la app PLAZAS al abrirla en la prueba
  de teclado, no por el hub (el hub declara favicon data URI).

### 4.7 Capturas

`AUDIT/evidencias/agent3-after-{320x568,390x844,844x390-landscape,1440x900}.png` y
`agent3-after-mobile-390x844.png` (movimiento desactivado en la medición). Capturas «antes»
equivalentes en `agent3-before-*.png`.

## 5. Limitaciones

1. Pruebas con Chrome 155 headless y emulación CDP, no con hardware físico. Las métricas de
   layout usan `Emulation.setDeviceMetricsOverride` con `mobile:false` (ancho CSS exacto) y una
   comprobación adicional con `mobile:true` + recarga a 390×844. La emulación `mobile:true` a
   568×320 produjo un viewport escalado (857×483) por shrink-to-fit de Chrome; por eso la matriz
   se midió con viewport determinista y el caso móvil se validó aparte con recarga.
2. `fullscreenerror` se verificó con un evento sintético; la activación real se hizo con
   `userGesture` de CDP. En un navegador sin `document.fullscreenEnabled` el botón se oculta
   (no se pudo probar ese navegador aquí).
3. Las fuentes web (Inter, Zen Dots) cargaron desde Google Fonts en las pruebas; con fallback
   local los anchos pueden variar unos píxeles. El layout no depende de ello para no desbordar
   (todo va con `clamp`/`min` y contenedores flexibles).
4. La matriz no incluye ventanas de escritorio con altura muy baja (< ~700 px y ancho >600 px,
   p. ej. 1024×650): el modo compacto solo se activa en móvil horizontal ≤560 px. En esos casos
   no hay scroll horizontal ni recorte lateral, pero podría requerirse scroll vertical; no se
   declara probado.
5. Un 320×568 con insets simultáneos grandes (top 47 + bottom 34) es un caso teórico fuera de
   dispositivo real: el mínimo de tarjeta de 360 px más la safe-area podría exigir scroll. No se
   simuló.
6. `DESIGN-SYSTEM.md` (§6/§7) y `AUTORIA.md` siguen mencionando el dock en la descripción del
   hub. No son de mi propiedad; el coordinador debe actualizarlos. Del mismo modo, el estado
   actual de `DESIGN-SYSTEM.md` describe el hub con dock.
7. El parche D1 de `dashboardHref`/`flashcardsHref` queda para el Agente 1; este informe no lo
   incluye.

## 6. Conclusión

- Dock eliminado sin pérdida de funciones; navegación por tarjeta, flechas, barra, puntos,
  swipe y teclado intacta.
- Los 11 viewports de la matriz caben sin scroll horizontal ni vertical, sin recortes y con
  safe-area; el móvil horizontal usa una cartilla apaisada compacta.
- Cambiar de cartilla no recarga ni navega: 0 navegaciones de marco principal, contador de
  performance estable.
- Pantalla completa nativa con estado real, `aria-pressed`, etiqueta dinámica, `aria-live` y
  manejo de error.
- Áreas táctiles: 38 px mínimo en móvil retrato, 36 px en horizontal, 34 px en escritorio
  (puntos 40×40 sin cambiar el punto visual).
