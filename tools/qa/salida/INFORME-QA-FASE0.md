# Informe de diseño, accesibilidad y QA — Fase 0

**Agente:** 6 · Diseño, accesibilidad y QA
**Fecha:** 9 nov 2026
**Alcance:** `study-shared/base.css`, `study-dashboard/styles.css`, `study-shared/icons.js`, `study-shared/ui.js`, `tests/e2e/*`, `tools/qa/*`.
**Contrato de referencia:** `study-dashboard/docs/CONTRATOS.md` §7 y §8; informe `INFORME-STUDY-DASHBOARD.md` (H1, H2, H5, H9, H11, H16, H20).

---

## 1. Resumen

| Área | Resultado |
|---|---|
| Contraste de tokens | **100 comprobaciones · 0 requeridas fallan** (92 pasan; 8 avisos decorativos) |
| axe-core real | **24 auditorías · 0 violaciones · 0 rutas pendientes** |
| Contraste de nodos que axe dejó incompletos | **236 nodos medidos en página · 0 fallos** |
| Capturas de diseño | **24 PNG** (escritorio/móvil × claro/oscuro + hoja «Más» + movimiento reducido) |
| Desborde horizontal / targets táctiles | **0 px de overflow · 0 controles < 44 px** en las rutas medidas |
| Suite E2E | **26/26 PASS** (DASH-01…17 + FLASH-01…09) |
| Cambios en archivos de otros agentes | **Ninguno.** Un pedido de copy en `PEDIDOS.md` (no bloqueante). |

---

## 2. Tokens y contraste (H1)

### 2.1 Qué se añadió a `study-shared/base.css`

- Semánticos de tema claro: `--green`, `--green-soft`, `--danger`, `--danger-soft` y sus bordes
  `--green-line` / `--danger-line` (el tema oscuro conserva sus valores).
- Los cuatro subrayados con sus cuatro variantes:
  `--mark-important|understand|review|doubt` + `-bg`, `-line`, `-ink`.
- `--target-min: 44px`.
- Capas: `--z-appbar: 50`, `--z-sheet: 80`, `--z-popover: 100`, `--z-modal: 120`, `--z-toast: 160`.
- Los `z-index` de `.s-appbar`, `.s-modal`, `.s-toast-stack` y `.s-skip` ya usan esos tokens.
- Los colores literales de `.s-chip--green`, `.s-chip--danger`, `.s-btn--danger` y `.s-alert--danger`
  pasaron a `--green-line` / `--danger-line`.

### 2.2 Valores finales (tema claro)

| Token | Valor | Uso |
|---|---|---|
| `--green` | `#186043` | texto e iconos de éxito |
| `--green-soft` | `rgba(24, 96, 67, .12)` | fondo de chip completada |
| `--green-line` | `rgba(24, 96, 67, .34)` | borde decorativo |
| `--danger` | `#A92016` | avisos y etiquetas de peligro |
| `--danger-soft` | `rgba(169, 32, 22, .11)` | fondo de alerta |
| `--danger-line` | `rgba(169, 32, 22, .30)` | borde decorativo |
| `--mark-important` | `#8F520E` | icono/punto |
| `--mark-important-bg` | `rgba(143, 82, 14, .14)` | resaltado |
| `--mark-important-line` | `rgba(143, 82, 14, .72)` | subrayado/borde |
| `--mark-important-ink` | `#6B3A05` | texto sobre el resaltado |
| `--mark-understand` | `#186043` | icono/punto |
| `--mark-understand-ink` | `#0F4A32` | texto |
| `--mark-review` | `#1F5E9C` | icono/punto |
| `--mark-review-ink` | `#14406B` | texto |
| `--mark-doubt` | `#7A3E9C` | icono/punto |
| `--mark-doubt-ink` | `#4E2A6B` | texto |

En oscuro se mantienen `--green #8FD3B0`, `--danger #F07A7A`, `--mark-important #E6B566`,
`--mark-understand #8FD3B0`, `--mark-review #8FBDF5`, `--mark-doubt #D9A6EC`, con
`-bg` al 18 % y `-line` al 60 %.

**Ajuste del acento en claro:** `--accent` pasó de `#9A5B12` a `#8F520E` (misma familia ámbar,
ligeramente más profundo). Era necesario para que badges («Ampliación»), chips y los números
decorativos del lector superen 4,5:1 en sus fondos compuestos (4,41 → 5,01/5,41). El tema
oscuro no cambia y Study Flashcards conserva la identidad (solo se comparte el token).

### 2.3 Ratios medidos (extracto; el detalle completo está en `salida/contraste.md`)

| Comprobación | Oscuro | Claro | Mínimo |
|---|---:|---:|---:|
| Texto principal sobre fondo | 17,42:1 | 15,10:1 | 4,5 |
| Texto suave sobre superficie | 9,31:1 | 7,40:1 | 4,5 |
| Chip «Completada» (verde sobre `--green-soft`) | 7,77:1 | 5,35:1 | 4,5 |
| Peligro sobre `--surface` | 5,64:1 | 6,82:1 | 4,5 |
| Peligro sobre `--danger-soft` | 5,29:1 | 5,13:1 | 4,5 |
| Acento sobre `--accent-soft` (badge/números) | 7,64:1 | 5,01:1 | 4,5 |
| Acento sobre `--bg-soft` (números de concepto) | 10,25:1 | 5,41:1 | 4,5 |
| Subrayado Importante: texto sobre su fondo | 10,56:1 | 7,27:1 | 4,5 |
| Subrayado Entender: texto sobre su fondo | 10,73:1 | 7,81:1 | 4,5 |
| Subrayado Repasar: texto sobre su fondo | 10,17:1 | 8,15:1 | 4,5 |
| Subrayado Duda: texto sobre su fondo | 9,90:1 | 8,59:1 | 4,5 |
| Línea de subrayado más baja | 4,08:1 | 3,16:1 | 3,0 |

Los 8 avisos son bordes decorativos (`--accent-line`, `--green-line`, `--danger-line`) y
`--muted` sobre `--surface-3`; no transmiten información por sí solos y no bloquean.

### 2.4 Cómo se verifica

`tools/qa/contraste.mjs` lee los tokens de `base.css` (bloques `:root` y
`html[data-theme="light"]`), compone las capas translúcidas con la superficie real y calcula
el ratio WCAG 2.2. Fórmulas documentadas en `tools/qa/README.md` y en `salida/contraste.md`.
El script **sale con código 1** si una comprobación requerida falla.

---

## 3. Accesibilidad en CSS/UI compartida

### H2 · Nombres accesibles en el lector móvil

- En `styles.css` (≤620 px) `.reader-tool-text` ya no usa `display:none`: se oculta con la
  técnica de `.s-sr-only` (clip, 1×1, absolute). El texto sigue en el árbol de accesibilidad.
- El Coordinador añadió además `aria-label` dinámico en `app.js` («Guardar en favoritas · …»,
  «Completada: marcar como pendiente · …»); ambas capas son redundantes a propósito.
- Los botones se ven como cuadrados de 44 px con el icono centrado (comprobado por DASH-16).

### H5 · Tabla desplazable enfocable

- El Coordinador añadió `tabindex="0" role="region" aria-label` en `.reader-table-wrap`.
- `styles.css` añade `:focus-visible` con anillo de acento, `outline-offset: 2px`,
  `overscroll-behavior-x: contain` y `scrollbar-width: thin`.
- Prueba DASH-16: la región recibe foco, tiene rol/etiqueta y es realmente desplazable a 390 px.

### H9 · Marca

- `index.html` usa `aria-label="SERUMS STUDY, Dashboard de estudio, inicio"`, que contiene el
  texto visible. DASH-16 lo verifica en escritorio; axe no reporta `label-content-name-mismatch`.

### H16 · Appbar móvil y objetivos táctiles

- CSS para la estructura exacta de `index.html`:
  `.dash-more`, `.dash-more-btn`, `.dash-more-panel`, `.dash-more-scrim`, `.dash-more-head`,
  `.dash-more-group`, `.dash-more-label`, `.dash-more-item`, `.dash-more-item-icon`,
  `.dash-more-item-copy`, `.dash-more-kbd`, `.dash-more-title`, `.dash-more-close`,
  `.dash-more-item-arrow` (el markup real usa flecha) y `html.is-more-open`.
- **>900 px:** `.dash-more` oculto; se conservan los controles actuales (Flashcards, Inicio,
  HUB, pantalla completa y tema).
- **≤900 px:** se ocultan `.dash-cross`, `[data-chrome-mount]` y `[data-theme-toggle]` directos
  del appbar del Dashboard y aparece `.dash-more`; la barra queda en 5 controles (marca,
  Panel, Biblioteca, Progreso, Más), comprobado por DASH-15 y por las capturas.
- **621–900 px:** popover anclado a la derecha, opaco, con sombra y animación de 220 ms.
- **≤620 px:** hoja inferior `position: fixed`, superficie opaca (`--surface` + degradado de
  acento sobre base opaca), `env(safe-area-inset-bottom)`, asa visual, cierre visible,
  animación de 220 ms y `max-height` con scroll interno; nunca scroll horizontal.
- El appbar deja de crear containing block para `fixed` mientras el menú está abierto
  (`html.is-more-open .s-appbar { backdrop-filter:none }`) para que velo y hoja midan el
  viewport; el fondo se bloquea con `overflow:hidden`.
- Objetivos táctiles en `(pointer: coarse)`: nav y botones de icono del Dashboard, chrome
  compartido, botón/cierre de Más, ítems de la hoja, acciones del lector (44×44), `reader-back`,
  `goal-step`, `sheet-row`, `pager-card`, `storage-actions` y campo de búsqueda a 44 px.
  En `base.css` se suben los controles de contenido compartidos (`.s-btn`, `.s-seg button`,
  `.s-source`) sin tocar la appbar de Study Flashcards, que es más densa.

### H20 · Foco programático del `h1`

- El router mueve el foco al `h1` (`tabindex="-1"`) para anunciar la vista. Ese `h1` no es
  alcanzable con Tab (solo foco programático), así que se retira el anillo ámbar únicamente en
  ese destino (`#view-root h1[tabindex="-1"]:focus`). Todos los controles interactivos
  conservan `:focus-visible`.

### Preferencias del usuario

- `prefers-reduced-motion`: ya existía; las animaciones nuevas (hoja, scrim) se desactivan.
- `prefers-contrast: more`: refuerza líneas, textos suaves y fondos suaves en ambos temas.
- `prefers-reduced-transparency`: appbar opaca, sin `backdrop-filter` y scrim más sólido.
- `prefers-color-scheme` no se usa: el tema es explícito y persistente (decisión del producto).

### H11 / H14 / H19 / H7 (pedidos del Coordinador)

| Pedido | Cobertura |
|---|---|
| H11 una sola recomendación | `.rec-grid > .rec-card:only-child { grid-column: 1 / -1 }` |
| H14 pista `/` | `.search-field:has(input:not(:placeholder-shown)) .search-kbd { display:none }` |
| H19 aviso persistente | `.app-notice-host` / `.app-notice` bajo la appbar, sin tapar contenido |
| Respaldo desde Progreso | `.storage-actions` con dos enlaces y 44 px en táctil |
| H7 objetivo superado | `.goal-exceeded` como chip verde (texto «objetivo de N superado») |
| H12 cabecera duplicada | `.library-area--focused` compacta el índice del área |

### Enlace «Respaldo y datos» en el aside del Panel

- El markup `.hero-aside-note.hero-aside-link` recibe un estilo propio en `styles.css`:
  sin subrayado permanente, icono de acento, texto `--text-soft`, `min-height` de 32 px
  (44 px en puntero grueso) y `border-radius` para el fondo de hover.
- Al pasar el cursor o al enfocar con teclado, el color pasa a `--accent` y el subrayado
  aparece con `--accent-line`; el foco visible conserva el anillo de acento con
  `outline-offset: 2px`.
- En móvil, el aside pasa a fila con `flex-wrap`; las dos notas y el enlace comparten
  `flex: 1 1 120px` y `min-width: 0`, por lo que la fila no desborda a 390 px. DASH-15 lo
  mide (`scrollWidth − clientWidth` del aside, borde derecho dentro del viewport, enlace
  con `href="#/respaldo"`, sin subrayado permanente y 44 px de alto).

### Iconos y autoría

- No hizo falta ningún icono nuevo: el panel usa `menu`, `cards`, `loop`, `grid`, `external`,
  `eye`, `sun`/`moon` y `chevronRight`, ya presentes en `study-shared/icons.js`.
- Se añadió la cabecera `© 2026 ZARCONT` a `base.css`, `styles.css`, `icons.js` y `ui.js`
  (los dos últimos solo cabecera; sin cambios funcionales).

---

## 4. Herramientas de QA

| Comando | Qué produce |
|---|---|
| `node tools/qa/contraste.mjs` | `salida/contraste.json` + `.md`; código 1 si falla un token |
| `node tools/qa/axe-audit.mjs` | `salida/axe.json` + `.md`; 24 auditorías con Chrome headless |
| `node tools/qa/capturas.mjs` | `salida/capturas/*.png` + `capturas.json`/`.md` |
| `node tools/qa/run-qa.mjs` | Ejecuta los tres y escribe `salida/resumen.json`/`.md`; código 1 si algo falla |

- axe-core 4.10.2 está en `tools/qa/vendor/axe.min.js` con su licencia MPL-2.0; no se carga en la app.
- Rutas auditadas: `#/`, `#/biblioteca`, `#/progreso`, `#/ficha/sheet-aps-01` (estado base y
  guardada/completada) y `#/respaldo`; temas claro/oscuro; 1440×900 y 390×844 con puntero
  grueso emulado.
- El servidor y el cliente CDP se reutilizan de `tests/e2e/lib` sin modificarlos.
- `#/respaldo` se marca como pendiente si el módulo no existe; **nunca se convierte en PASS**.

---

## 5. Resultados de las pruebas

### 5.1 Contraste

- 100 comprobaciones (50 por tema): 92 pasan, **0 requeridas fallan**, 8 avisos decorativos.
- Salida 0. Evidencia: `salida/contraste.json`, `salida/contraste.md`.

### 5.2 axe-core

- 24 auditorías (5 rutas × 2 temas × 2 viewports + 4 del estado guardada/completada).
- **0 violaciones**, 0 rutas pendientes, 0 recursos 404.
- 236 nodos `color-contrast` que axe dejó incompletos (fondos con degradado/superposición) se
  remidieron en la página: **0 fallos**.
- Revisión manual documentada: `aria-valid-attr-value` queda «incompleto» en `.dash-more-btn`
  porque `aria-controls` apunta a `#dash-more-panel`, que está `hidden` hasta abrir el panel;
  el destino existe y se resuelve al abrirlo (DASH-15). No es una violación ni requiere cambio.
- Evidencia: `salida/axe.json`, `salida/axe.md`.

### 5.3 Capturas y métricas

- 24 capturas: Panel, Biblioteca, Ficha, Progreso y Respaldo en claro/oscuro a 1440×900 y
  390×844; hoja «Más» abierta en ambos temas; dos pasadas con `prefers-reduced-motion: reduce`.
- **0 px de overflow horizontal** en todas; **0 controles requeridos < 44 px** en móvil con
  puntero grueso; la appbar móvil mide 5 controles en todas las rutas (incluida la hoja abierta).
- Evidencia: `salida/capturas/*.png`, `salida/capturas.json`, `salida/capturas.md`.

### 5.4 Suite E2E

- **Antes de los cambios:** DASH-01…09 + FLASH-01…09 → **18/18 PASS**
  (`AUDIT/evidencias/agente6-baseline/run-quick.json`).
- **Después:** DASH-01…17 + FLASH-01…09 → **26/26 PASS**
  (`AUDIT/evidencias/agente6-final-v2/run-quick.json`).
- DASH-02 (prueba preexistente) tenía una carrera: leía `details.topic-block` y enlaces de
  categoría antes de que el router pintara la ruta nueva, por lo que podía intentar pulsar un
  enlace de la vista anterior. Se endureció la espera (doble `requestAnimationFrame` + margen,
  y fallback por hash si el nodo se re-renderiza) sin cambiar el recorrido ni relajar
  aserciones. No se tocó `app.js` ni ningún archivo de producto.
- La corrida final (`agente6-final-v2`) no registró cambios de archivos durante la ejecución:
  línea base estable.

| Prueba nueva | Qué deja comprobado |
|---|---|
| DASH-10 | Exporta por la UI (`format: serums-study-progress`, esquema 2, app 2.3.0), importa el mismo archivo por el input real y conserva 1 ficha completada; copia `study-backup-preimport-v1` presente. |
| DASH-11 | Biblioteca: 1200 px antes de entrar a una ficha; 1200 px al volver (delta 0). |
| DASH-12 | Objetivo 1, 2 completadas: Progreso «2 fichas completadas hoy · objetivo de 1 superado»; Panel «Objetivo superado»; sin «2 de 1». |
| DASH-13 | 22 fichas sin ampliación no muestran selector; una con ampliación conserva Rápido/Completo. |
| DASH-14 | Historial: la ficha reabierta aparece una vez y en primer lugar. |
| DASH-15 | 5 controles móviles; Más abre con foco dentro, Esc/velo cierran y devuelven el foco; el aside del panel no desborda; el enlace a Respaldo es real, sin subrayado permanente y de 44 px. |
| DASH-16 | Marca con texto visible dentro del nombre accesible; tabla enfocable y etiquetada; botones del lector con nombre y 44×44 en puntero grueso. |
| DASH-17 | Al conmutar tema, texto ≥4,5:1 (lector, chips, botones, badge) e iconos ≥3:1 (aviso y los cuatro subrayados) medidos en la página. |

---

## 6. Cambios por archivo

| Archivo | Cambios |
|---|---|
| `study-shared/base.css` | Semánticos de tema claro (`--green`, `--danger` + soft/line), 4 subrayados completos, `--target-min`, capas `--z-*` (aplicadas a appbar/modal/toast/skip), cabecera ©, puntero grueso para controles de contenido, `prefers-contrast: more` y `prefers-reduced-transparency`. |
| `study-dashboard/styles.css` | Se retiró la duplicación de tokens de acento (fuente única en `base.css`), H1/H2/H5/H7/H9/H11/H12/H14/H16/H20: `.app-notice`, `.storage-actions`, `.goal-exceeded`, `.rec-grid > :only-child`, `.search-kbd`, `.library-area--focused`, foco de tabla, `.reader-tool-text` sr-only, 44 px, appbar de 5 controles y hoja `.dash-more-*`, `html.is-more-open`, `.hero-aside-link`, foco del `h1`, © 2026 ZARCONT. |
| `study-shared/icons.js` | Solo cabecera ©; no hizo falta ningún icono nuevo (todos los del panel ya existían). |
| `study-shared/ui.js` | Solo cabecera ©; `applyTheme`/`initTheme` siguen funcionando con el botón de tema oculto y con `[data-action="more-theme"]` gestionado por `app.js`. |
| `tests/e2e/run.mjs` | Importa y ejecuta `runDashboardFase0` con `--suite=dash`/`study`. |
| `tests/e2e/suites/dash-fase0.mjs` | Nueva suite DASH-10…17. |
| `tests/e2e/suites/study.mjs` | DASH-02: espera de render y fallback por hash (robustez, sin relajar aserciones). |
| `tests/e2e/README.md` | Documenta la suite de Fase 0 y `tools/qa`. |
| `tools/qa/*` | `contraste.mjs`, `axe-audit.mjs`, `capturas.mjs`, `run-qa.mjs`, `lib/color.mjs`, `lib/css-tokens.mjs`, `vendor/axe.min.js` + licencia, `README.md`. |

---

## 7. Supuestos

1. Los tokens medidos son colores literales; un `var()`/`color-mix()` en uno de ellos haría
   fallar `contraste.mjs` con mensaje explícito.
2. Los degradados se aproximan por su superficie base en el cálculo estático; axe los marca
   como incompletos y se remiden en la página real.
3. El puntero grueso se emula con Chrome (`Emulation.setTouchEmulationEnabled`), no con un
   dispositivo físico; los tamaños se miden con `getBoundingClientRect`.
4. `#/respaldo` se audita cuando `js/data/backup.js` está registrado; si no, el runner lo deja
   como pendiente.
5. axe se ejecuta con etiquetas WCAG 2.0/2.1/2.2 A y AA; las reglas de mejores prácticas y los
   `incomplete` se documentan y revisan aparte.
6. Headless Chrome 157 en Windows; no sustituye NVDA/VoiceOver, iOS/Safari ni Android reales.

---

## 8. Pedidos y pendientes

- **No hay pedidos bloqueantes.** Los cuatro pedidos del Coordinador a este agente quedaron
  cubiertos en `styles.css` (aviso, `storage-actions`, H11/H14, `is-more-open`/`.dash-more-*`,
  `goal-exceeded`, `reader-tool-text`, tabla enfocable y 44 px), más el enlace
  `.hero-aside-note.hero-aside-link` del Panel.
- **Un pedido de copy** en `docs/PEDIDOS.md`: el aside del Panel muestra «1 fichas vistas hoy»
  (`app.js`); debería concordar en singular. No afecta a la accesibilidad ni a las pruebas.
- Pendiente de revisión humana (no de código): comprobar la hoja «Más» y el lector en un
  iPhone/Android real y con NVDA/VoiceOver; las capturas están en `salida/capturas/`.
- Observación para el Coordinador: la suite final reportó que `study-shared/store.js` cambió
  durante la ejecución (edición concurrente del Agente 2). Los 26 PASS son válidos, pero la
  línea base ideal es una corrida sin cambios de archivos; repetir el comando cuando el
  repositorio esté quieto.

---

## 9. Evidencias

```
tools/qa/salida/
  contraste.json / contraste.md
  axe.json / axe.md
  capturas.json / capturas.md
  capturas/*.png                     (24 imágenes)
  resumen.json / resumen.md
  INFORME-QA-FASE0.md                (este informe)
AUDIT/evidencias/agente6-baseline/run-quick.json   (antes: 18/18)
AUDIT/evidencias/agente6-final-v2/run-quick.json   (después: 26/26, línea base estable)
```

---

© 2026 ZARCONT — Documento interno del proyecto.
