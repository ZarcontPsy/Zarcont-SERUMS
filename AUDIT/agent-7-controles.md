# Agente 7 — Controles compartidos, pantalla completa y accesibilidad

**Fecha:** 2026-10-25 · **Repositorio:** `C:\Users\USARIO\Documents\ZARCONT SERUMS`
**Alcance:** `serums-chrome.js`, `serums-chrome.css`, `study-shared/base.css` y los cinco HTML de entrada.
**Propiedad respetada:** no se editó `index.html` del HUB, ni `app.js` de features, ni stores, ni datos.
**Integración de Banqueo:** el montaje lo realiza el Agente 6 desde `EXAMEN STUDIO/js/app.js`; aquí se verificó.

---

## 1. Resumen

- Se creó `serums-chrome.js` (script clásico, sin dependencias, idempotente) y `serums-chrome.css` con las tres
  acciones: **Inicio de la app**, **Volver al HUB** y **Pantalla completa**.
- Se montaron en los topbars existentes de las cinco apps; no se añadió ninguna barra, panel ni formulario.
- Pantalla completa usa **`requestFullscreen`/`exitFullscreen` nativos**. Verificada con gestos reales de ratón
  vía CDP (`Input.dispatchMouseEvent`) en las cinco apps: entrar, salir, reentrar y salir con `Esc`.
- Se corrigió un defecto preexistente de Study: a ≤900 px la regla `.s-navlink span { display:none }`
  ocultaba también el icono de Panel/Biblioteca/Progreso. Ahora se oculta solo la etiqueta y cada destino
  conserva icono, `aria-label` y 40×40 px.
- Se ajustó la densidad del topbar en Study (≤620/≤380) y Banqueo (≤620) para que los controles nuevos
  no solapen ni recorten los existentes. QUEST conserva la rejilla móvil definida por el Agente 4.
- Medición final en 320, 360, 390, 768 y 1440 px: **sin scroll horizontal de página** y
  `scrollWidth == clientWidth` en los topbars de las cinco apps.

---

## 2. Archivos

| Archivo | Cambio | Autoría |
|---|---|---|
| `serums-chrome.js` | **Nuevo.** API y lógica de los tres controles. Cabecera `© 2026 ZARCONT`. | Agente 7 |
| `serums-chrome.css` | **Nuevo.** Área táctil mínima, foco, estado `aria-pressed`, ajustes responsive puntuales. | Agente 7 |
| `study-shared/base.css` | Marca sin copia textual ≤620; iconos de nav visibles; nav 40×40; salto de fila ≤340. | Agente 7 |
| `study-dashboard/index.html` | Carga CSS/JS, contenedor de montaje y llamada a `mount`; retirado el enlace HUB duplicado. | Agente 7 |
| `study-flashcards/index.html` | Ídem Dashboard. | Agente 7 |
| `serums-quest/index.html` | Carga CSS/JS, contenedor y llamada a `mount` (`q-iconbtn`). | Agente 7 |
| `serums map/serums-map-explorer/index.html` | Carga `../../serums-chrome.*` y monta HUB + pantalla completa en `#topbar`. | Agente 7 |
| `EXAMEN STUDIO/Examen Studio.html` | Carga CSS/JS (el montaje lo hace `js/app.js` del Agente 6). | Agente 7 |
| `AUDIT/a7-tools/cdp.mjs` | Arnés CDP de medición y pruebas (Node 24, WebSocket). | Agente 7 |
| `AUDIT/evidencias/agent7-*` | Capturas y JSON de resultados. | Agente 7 |

No se modificaron `study-shared/ui.js` ni `icons.js`: el chrome es autónomo y no necesita esos helpers.

---

## 3. API (`window.SerumsChrome`)

```js
window.SerumsChrome.mount(container, {
  hubHref,        // opcional; por defecto new URL("index.html", URL del script)
  homeHref,       // opcional; si falta, no se pinta «Inicio»
  appName,        // opcional; nombre accesible («Volver al inicio de <app>»)
  buttonClass,    // clase de botón de la app: "s-iconbtn", "q-iconbtn", "btn sm icon", "icon-btn"
  fullscreen: true,
  order: ["home", "hub", "fullscreen"]
});
window.SerumsChrome.hubHref();            // URL absoluta del HUB
window.SerumsChrome.homeButton();         // primer botón Inicio montado
window.SerumsChrome.requestFullscreen();  // API nativa
window.SerumsChrome.exitFullscreen();
window.SerumsChrome.isFullscreen();
window.SerumsChrome.sync();               // resincroniza estado/etiquetas
```

- `container` admite elemento o selector; sin argumento usa `[data-chrome-mount]`.
- `mount` devuelve `{ group, buttons, sync, destroy }` y es **idempotente**: dos llamadas con la misma
  configuración dejan **un solo** grupo (verificado: `1 → 1` en las cinco apps).
- `hubHref` se calcula desde la URL real de `serums-chrome.js`, por lo que funciona desde
  `EXAMEN STUDIO/`, `serums map/serums-map-explorer/` y las carpetas de Study. En las cinco apps el
  enlace resuelve a `http://127.0.0.1:8777/index.html` (probado).
- Botones: Inicio y HUB son `<a href>`; pantalla completa es `<button type="button">`.
  Sin formularios (`0` formularios en las cinco apps).
- Si `document.fullscreenEnabled === false` no se pinta el botón de pantalla completa; se probó con
  una simulación de `Document.prototype.fullscreenEnabled = false`: quedan solo Inicio y HUB.
- `fullscreenchange` **y** `fullscreenerror` sincronizan `aria-pressed`, `aria-label`, `title`, icono
  (`expandir`/`contraer`) y `data-state`. En error se anuncia el fallo en una región `role="status"`
  oculta («No se pudo activar la pantalla completa.») sin mover el foco.
- **No se intercepta `Esc`**: el script no registra `keydown`. La salida la gestiona el navegador.
- Iconos SVG en línea: casa (Inicio), flecha de salida (HUB), esquinas (pantalla completa/contraer).
  `aria-hidden="true"` y `focusable="false"`.

---

## 4. Integración por app

| App | Contenedor | Clase | Botones | `homeHref` | Notas |
|---|---|---|---|---|---|
| Study Dashboard | `.s-appbar-actions` | `s-iconbtn` | Inicio, HUB, Pantalla completa | `#/` | Se retiró `.dash-home-link` para no duplicar «Volver al HUB». Orden antes del tema. |
| Study Flashcards | `.s-appbar-actions` | `s-iconbtn` | Inicio, HUB, Pantalla completa | `#/` | Se retiró `.flash-home-link`. |
| SERUMS QUEST | `.q-appbar-actions` | `q-iconbtn` | Inicio, HUB, Pantalla completa | `#/` | Agente 4 integró además la rejilla móvil de dos filas ≤620 px. |
| Plazas SERUMS | `#topbar` | `btn sm icon` | HUB, Pantalla completa | — | `#brandHome` ya vuelve al mapa (`js/app.js:856`); se documenta como «inicio de la app» y no se duplica. 44×44 px. |
| Banqueo | `.top-actions` (`[data-chrome-mount]`) | `icon-btn` | Inicio, HUB, Pantalla completa | `#hub` | Montaje del Agente 6 en `renderShell()`; `hubHref: "../index.html"`. Verificado en la UI real. |

- «Inicio» navega por hash o ruta sin recargar: en Dashboard `#/biblioteca → #/`, Flashcards
  `#/historial → #/`, QUEST `#/personajes → #/`, Banqueo `#review → #hub`. **0 navegaciones de frame**
  durante el clic (CDP `Page.frameNavigated`).
- «Volver al HUB» navega a la portada del HUB desde las cinco profundidades y conserva la navegación
  normal (permitida por D4).
- No hay dos controles con la misma etiqueta: `duplicateChromeLabels = []` en las cinco apps.

---

## 5. Pantalla completa: pruebas reales

**Entorno:** Chrome 155.0.8059.85 headless (`--headless=new --disable-gpu --no-first-run
--remote-allow-origins=* --remote-debugging-port=9337 --user-data-dir=%TEMP%\a7-chrome`),
servidor `python -m http.server 8777 --bind 127.0.0.1`, Node 24
(`C:\Users\USARIO\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe`).
Los clics se enviaron con `Input.dispatchMouseEvent` (`mousePressed` + `mouseReleased` sobre el centro
real del botón), no con `Runtime.evaluate`. `Esc` se envió con `Input.dispatchKeyEvent`
(`keyDown`/`keyUp`, `key=code=Escape`, VK 27).

| App | Entrar (ratón) | `fullscreenElement` | `aria-pressed` | Etiqueta/title | `Esc` | Salir con botón |
|---|---|---|---|---|---|---|
| Study Dashboard | ✅ | `HTML` | `true` | «Salir de pantalla completa» | ✅ vuelve a `false` | ✅ |
| Study Flashcards | ✅ | `HTML` | `true` | «Salir de pantalla completa» | ✅ | ✅ |
| SERUMS QUEST | ✅ | `HTML` | `true` | «Salir de pantalla completa» | ✅ | ✅ |
| Plazas SERUMS | ✅ | `HTML` | `true` | «Salir de pantalla completa» | ✅ | ✅ |
| Banqueo | ✅ | `HTML` | `true` | «Salir de pantalla completa» | ✅ | ✅ |

- En la variante **sin emulación de viewport** (ventana real de Chrome headless), Study Dashboard pasó de
  `innerWidth×innerHeight = 1424×805` a **800×600** al entrar (tamaño de pantalla del headless), y volvió
  a `1424×805` con `Esc` y con el botón. `matchMedia('(display-mode: fullscreen)')` pasó a `true`/`false`.
  JSON: `AUDIT/evidencias/agent7-fullscreen-dashboard-native.json`.
- En las pruebas con `Emulation.setDeviceMetricsOverride` (390/768/1440) el viewport queda fijado por la
  emulación, pero el estado del navegador es real: `document.fullscreenElement`, `display-mode`,
  `aria-pressed` y las etiquetas cambian igualmente. Es la limitación esperada de la emulación, no del código.
- **Error real:** `requestFullscreen()` sin activación de usuario disparó `fullscreenerror`; el botón quedó
  en `aria-pressed="false"`, etiqueta «Pantalla completa» y la región de estado anunció
  «No se pudo activar la pantalla completa.». JSON: `agent7-fserror-dashboard.json`.
- **Sin soporte:** con `fullscreenEnabled=false` la UI pinta solo Inicio y HUB; no hay botón muerto.

### Limitaciones documentadas

- **iOS Safari (iPhone):** no permite pantalla completa de un elemento arbitrario; solo vídeo
  (`webkitEnterFullscreen`). El botón se omite porque `document.fullscreenEnabled` es falso. En iPad sí
  existe soporte de elemento en versiones recientes.
- **WebViews/embebidos:** si el contenedor no expone la Fullscreen API, el botón no se pinta.
- **Iframes:** requerirían `allow="fullscreen"`; este proyecto no embebe las apps en iframes.
- **Headless:** el tamaño de pantalla por defecto es 800×600; no representa el monitor del usuario, pero
  demuestra el cambio real de viewport. La captura `agent7-fullscreen-dashboard-entered.png` corresponde
  a esa prueba nativa (800×600).
- **Esc:** el navegador muestra su propio aviso/animación de salida; el script no lo secuestra ni lo estiliza.
- La salida por `Esc` no depende de que la página tenga foco si el navegador la procesa; en la prueba
  headless funcionó con el foco en el documento.

---

## 6. Accesibilidad

- **Etiquetas:** Inicio «Volver al inicio de <app>»; HUB «Volver al HUB»; Pantalla completa
  «Pantalla completa» ↔ «Salir de pantalla completa». `title` siempre igual al `aria-label`.
  `aria-pressed` solo en el botón de pantalla completa.
- **Foco:** anillo `2px solid currentColor` con `outline-offset: 3px`, color de texto real de cada app
  (`--text` en Study/QUEST/Banqueo, `--ink` en Plazas) y fondo `rgba(127,127,127,.16)`. El foco es
  visible sobre fondo oscuro y claro; se comprobó con Tab real y capturas `agent7-focus-*`.
- **Orden de tabulación:** Inicio → HUB → Pantalla completa → tema, después del contenido de navegación.
  En Plazas: HUB → Pantalla completa. Verificado en las cinco apps (`agent7-a11y-*.json`).
- **Área táctil:** 40×40 px en Study/QUEST/Banqueo y 44×44 px en Plazas; `min-width/min-height: 40px`
  garantiza el mínimo aunque la clase de la app mida 36/38 px.
- **Contraste** (color del icono sobre fondo efectivo):
  - Oscuro: Study 9.96–10.02:1 · QUEST 11.68:1 · Banqueo 9.26–9.42:1 · Plazas 20.03:1.
  - Claro: Study 6.89:1 · QUEST 7.77:1 · Banqueo 6.40:1 · Plazas 15.81:1.
  Todos superan 4.5:1 (texto) y 3:1 (componentes).
- **Movimiento reducido:** `@media (prefers-reduced-motion: reduce)` deja `transition-duration: 0s` y
  `animation-name: none` en los tres controles. No se añadieron animaciones. Probado con
  `Emulation.setEmulatedMedia` (`prefers-reduced-motion: reduce`): `reducedMotion=true` en las cinco apps.
- **Sin formularios:** 0 `<form>`; botones `type="button"`; sin `tabindex` artificial.
- **Estado no solo por color:** `aria-pressed`, `title`, `aria-label`, icono expandir/contraer y
  `data-state`.
- **Región de estado:** `role="status" aria-live="polite"`, visualmente oculta, solo para errores.

---

## 7. Responsive y mediciones

Anchos probados: **320, 360, 390, 768 y 1440 px**. En todos: `document.scrollWidth == innerWidth`
(sin scroll horizontal de página) y `overflow-x` del topbar sin recorte.

| App | 390×844 | 768×1024 | 1440×900 | Botones |
|---|---|---|---|---|
| Study Dashboard | 3 controles, 40 px, sin desborde | íd. | íd. | Inicio/HUB/Pantalla |
| Study Flashcards | 3 controles, 40 px | íd. | íd. | Inicio/HUB/Pantalla |
| SERUMS QUEST | 3 controles, 40 px, rejilla 2 filas | 1 fila, 40 px | 1 fila, 40 px | Inicio/HUB/Pantalla |
| Plazas SERUMS | 2 controles, 44 px | 44 px | 44 px | HUB/Pantalla |
| Banqueo | 3 controles, 40 px | 40 px | 40 px | Inicio/HUB/Pantalla |

Datos por viewport en `AUDIT/evidencias/agent7-layout.json` (rects, tamaño, `hitSelf`, contraste, orden).

### Correcciones responsive aplicadas (solo propiedad del Agente 7)

1. **Study, ≤900 px:** `.s-navlink span { display:none }` ocultaba icono **y** etiqueta, dejando enlaces
   vacíos. Se sustituyó por `.s-navlink > span:last-child { display:none }`; los tres destinos conservan
   icono, `aria-label` y 40×40 px.
2. **Study, ≤620 px:** la copia textual de la marca se oculta (el enlace mantiene el icono y su
   `aria-label="Study Dashboard, inicio"`). Sin esto, la marca se solapaba con Panel/Biblioteca/Progreso.
   El atajo cruzado `.dash-cross`/`.flash-cross` se oculta solo a ≤380 px (sigue en el pie); a 390 px
   caben los tres controles nuevos, el atajo y el tema.
3. **Study, ≤340 px:** la navegación pasa a una segunda fila (40 px por destino) para no recortar nada.
4. **Banqueo, ≤620 px:** se oculta `.topbar .brand-copy` (el enlace conserva el icono y
   `aria-label="Banqueo, inicio"`). Sin esta regla, en 390 px el topbar medía 392 px y recortaba 17 px.
5. **QUEST:** no se tocó su CSS; el Agente 4 ya integró una rejilla de dos filas ≤620 y 5 columnas ≤380
   para alojar `[data-chrome-mount]`. Verificado en 320/360/390 sin desbordes y con tema visible.
6. **Plazas:** el chrome conserva 44×44. Se detectó que los botones **preexistentes**
   `#btnImport`, `#btnTheme`, `#btnNotif` se comprimen a ~31 px a 390 px y ~19 px a 320 px
   (`flex-shrink` del topbar). No se modificaron por pertenecer al Agente 6; ver §9.

---

## 8. Pruebas ejecutadas (comandos reales)

```powershell
# Servidor
C:\Python313\python.exe -m http.server 8777 --bind 127.0.0.1

# Chrome headless
"C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu --no-first-run `
  --remote-allow-origins=* --remote-debugging-port=9337 --window-size=1440,900 `
  --user-data-dir="$env:TEMP\a7-chrome" about:blank

# Arnés CDP (Node 24)
node AUDIT/a7-tools/cdp.mjs audit                 # 5 apps × 390/768/1440 + capturas
node AUDIT/a7-tools/cdp.mjs probe 320,360,390 ... # densidad extrema
node AUDIT/a7-tools/cdp.mjs fullscreen <app>      # ratón real + Esc + reentrada/salida
node AUDIT/a7-tools/cdp.mjs fullscreen-native dashboard
node AUDIT/a7-tools/cdp.mjs fserror dashboard     # fullscreenerror
node AUDIT/a7-tools/cdp.mjs nofs dashboard        # fullscreenEnabled=false
node AUDIT/a7-tools/cdp.mjs a11y <app> 390 844    # Tab, foco, contraste, reduced-motion
node AUDIT/a7-tools/cdp.mjs light <app>           # contraste en tema claro
node AUDIT/a7-tools/cdp.mjs nav <app>             # Inicio sin recarga + HUB resuelto
```

Resultados clave:

- `audit`: 15/15 combinaciones app×viewport con `overflowX=false` y `topbarScroll == clientWidth`.
- `nav`: `frameNavigationsDuringHome: []` en Dashboard, Flashcards, QUEST y Banqueo; HUB resuelve a
  `/index.html` desde `study-dashboard/`, `serums-quest/`, `serums map/serums-map-explorer/` y
  `EXAMEN STUDIO/`.
- `a11y`: `groupsAfterDoubleMount: 1`, `duplicateChromeLabels: []`, `forms: 0`, foco
  `home > hub > fullscreen`, contraste ≥ 9.26 (oscuro) / ≥ 6.40 (claro), `reducedMotion: true`,
  transiciones `0s`.
- `fullscreen`: 5/5 apps entran, salen con `Esc`, reentran y salen con el botón; estado y etiquetas
  sincronizados.
- `nofs`: 2 botones (Inicio, HUB), sin botón de pantalla completa.

---

## 9. Pendientes y coordinación

1. **Plazas SERUMS — botones preexistentes comprimidos (Agente 6).**
   A 390 px, `#btnImport`, `#btnTheme` y `#btnNotif` miden ~31 px de ancho (19 px a 320 px) por
   `flex-shrink` del topbar. El chrome nuevo mide 44×44, pero la norma de área táctil no se cumple en
   esos tres botones. Instrucción propuesta para el Agente 6 (no aplicada por propiedad):
   ```css
   @media (max-width: 520px) {
     #topbar .btn.icon { flex: 0 0 auto; }
     /* y, si no cabe: ocultar el texto de Exportar (ya es icono a ≤600)
        o una pill redundante; no ocultar HUB ni Pantalla completa */
   }
   ```
   Alternativa: permitir scroll interno del topbar (ya tiene `overflow-x:auto`) y mantener 44 px.
2. **Banqueo — copia de marca.** La regla `.topbar .brand-copy { display:none }` a ≤620 px vive en
   `serums-chrome.css` para no editar `EXAMEN STUDIO/styles.css` (Agente 6). Si el Agente 6 prefiere
   su propia regla, puede moverla; el resultado medido es 375/375 sin desborde.
3. **Study — BOM.** Al editar los dos `index.html` se perdió el BOM UTF-8 inicial (`﻿`).
   No afecta a la codificación (`<meta charset="UTF-8">`); se documenta por transparencia.
4. **Cambios concurrentes.** Los Agentes 4, 5 y 6 modificaron sus CSS/JS durante esta sesión
   (rejilla móvil de QUEST, biblioteca de Flashcards, topbar de Banqueo). La verificación final se
   ejecutó después de esas integraciones; si vuelven a cambiar sus topbars, repetir `audit` + `a11y`.
5. **HUB:** no se tocó `index.html` (Agente 3). Este trabajo no altera el manifiesto de integridad;
   el coordinador lo regenera.

---

## 10. Evidencia

- Capturas completas: `agent7-{dashboard,flashcards,quest,plazas,banqueo}-{390x844,768x1024,1440x900}.png`.
- Topbars ampliados: `agent7-topbar-<app>-{320,360,390}.png`.
- Foco de teclado: `agent7-focus-<app>.png`.
- Pantalla completa: `agent7-fullscreen-<app>-{entered,after-esc,exited}.png` y
  `agent7-fullscreen-<app>.json`; nativo: `agent7-fullscreen-dashboard-native.json`.
- Accesibilidad: `agent7-a11y-<app>.json`; tema claro: `agent7-light-<app>.json` (y capturas).
- Layout: `agent7-layout.json`; navegación: `agent7-nav-<app>.json`; error: `agent7-fserror-dashboard.json`;
  sin soporte: `agent7-nofullscreen-dashboard.png`.
- Arnés reproducible: `AUDIT/a7-tools/cdp.mjs`.

© 2026 ZARCONT — Documento interno del proyecto.
