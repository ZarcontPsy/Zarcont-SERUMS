# ACTIVE-CONTRATO · Lectura activa

**Estado:** Fase 1 integrada · lectura activa operativa en la app
**Ámbito:** `study-dashboard/js/active/*`, `study-dashboard/css/active.css`, `study-dashboard/docs/ACTIVE-CONTRATO.md`
**Dueño:** Agente 3 · Lectura activa
**Referencias:** `CONTRATOS.md` §3 (módulos), §5 (estado v2), §7 (diseño y tokens), §8 (accesibilidad); `CONTRATOS-FASE1.md` §2–§5
**Fecha:** 10 de noviembre de 2026

> La biblioteca visual está integrada mediante `js/active/active.integration.js`. `app.js` e `index.html` los mantiene el Coordinador; esta entrega solo usa los mounts y rutas acordados. El previsualizador sigue siendo material interno y no se carga en producción.

---

## 0.1 Integración de Fase 1 (10 nov 2026)

### Archivos

| Archivo | Papel en la integración |
|---|---|
| `js/active/active.integration.js` | Registro del módulo `active`, rutas `#/subrayados` y `#/dudas`, anclaje, selección, rail, pausa, confianza, modo recordar, tarjetas propias, dudas, atajos y eventos. |
| `js/active/active.components.js` | Biblioteca visual. En Fase 1 se corrigió la concordancia de «1 subrayado» en el rail y se añadió `keyHint:false` para retirar la pista `/` en las rutas donde ese atajo no existe. |
| `css/active.css` | Se añadió el bloque de integración (páginas, resumen del Panel, rail, diálogos, dudas, tarjetas, preferencias y responsive) siempre bajo `.ac-*`. |
| `js/active/active.{icons,core,behavior}.js` | Sin cambios de contrato; se consumen desde la integración. |

### Carga y montaje

`index.html` carga, en este orden y con `?v=2.3.0`: `active.icons.js`, `active.core.js`, `active.components.js`, `active.behavior.js`, `active.integration.js`. Nunca carga `active.preview.js`.

| Punto de montaje | Contenido |
|---|---|
| `[data-module-mount="reader-active"]` (dentro de `.reader-rail`, tras `.rail-progress`) | `.ac-railwrap` con el rail `highlightsPanel({view:"rail"})`, aviso de huérfanos, enlace a dudas, enlace global a `#/subrayados` y `<details class="ac-railprefs">` con pausa y atajos. |
| `[data-module-mount="active-summary"]` (Panel `#/`) | Resumen compacto `section.ac-summary`: cuatro contadores por color, dudas abiertas y tarjetas propias. Si no hay actividad, el host queda vacío. |

No se añaden atributos a `.reader-main`, `.reader-concepts`, `.reader-practice` ni `app.js`: la integración envuelve los párrafos existentes en `.ac-para`, inyecta el control de modo recordar, el host de confianza y las pausas inline.

### Rutas

```js
{ path: "subrayados", title: "Mis subrayados", restoreScroll: true }
{ path: "dudas",      title: "Bandeja de dudas", restoreScroll: true }
```

- `#/subrayados`: `h1#ac-hl-title` («Mis subrayados»), panel completo, tarjetas propias y preferencias.
- `#/dudas`: `h1#ac-doubts-title` («Bandeja de dudas»), filtros abiertas/resueltas/todas, búsqueda y acciones resolver/reabrir.
- Los enlaces de «Más» los añade el Coordinador; la integración no edita `index.html`.

### Modelo de datos y anclaje

- **Subrayado:** `StudyStore.annotations.add({sheetId, sectionIndex, sectionTitle, paragraphIndex, color, quote, prefix, suffix, note})`.
- `sectionIndex` se normaliza al índice real de `sheet.sections` (importante en modo rápido; ver PEDIDOS). `paragraphIndex` procede de `p[data-paragraph-index]`.
- `prefix`/`suffix` se guardan con un máximo de 120 caracteres de contexto y el store los recorta a 300.
- Al renderizar, se busca la cita exacta dentro del párrafo y se usa el prefijo/sufijo para desempatar repeticiones. Si no aparece con espacios exactos, se prueba una coincidencia con espacios normalizados.
- Si la ficha, la sección o el párrafo ya no existen, o la cita no se encuentra, la anotación se enriquece con `orphan: "missing-sheet" | "missing-anchor"` y **sigue visible** en el rail y en `#/subrayados`. «Recuperar» busca la cita en toda la ficha y, si la coincidencia es única, actualiza `sectionIndex`/`paragraphIndex`/`sectionTitle`/`prefix`/`suffix`; si no, queda «Ir al contexto» y «Eliminar».
- Las marcas inline son `<mark class="ac-marktext" data-mark data-ac-action="annotation:open" data-ac-id>`, con etiqueta textual, `tabindex="0"` y `role="button"`.

### Selección

- Ratón fino: barra flotante `.ac-layer[data-ac-layer="selection"]` + `.ac-selbar[data-variant="floating"]`, posicionada con `StudyActive.behavior.positionBar`.
- Puntero grueso: hoja inferior `.ac-selbar[data-variant="sheet"]` dentro de `.ac-layer--modal`, con `.ac-scrim`, foco contenido y `inert` del fondo.
- Se abre con `mouseup` en un párrafo o con `touchend` tras 420 ms (para no competir con el menú nativo móvil); se limita a un párrafo; si la selección cruza párrafos se anuncia y no se abre.
- El botón `.ac-para__btn` de cada párrafo es la alternativa permanente y operable por teclado. La barra admite `1–4`, `Ctrl/Cmd+Enter`, `Esc` y foco gestionado.
- Tras guardar: estado `saved` visible ~1,2 s, anuncio en `#live`, cierre automático y retorno del foco al botón del párrafo. Nunca se pierde el texto de la nota al cambiar color, abrir la nota o reintentar.

### Tarjetas propias

- Se crean desde el botón `ucard:from` de la nota o de una fila de `#/subrayados`.
- El frente es la cita de la anotación (recortada a 2000 por el store); el reverso lo escribe la persona; no se inventa contenido.
- Si la anotación ya tiene tarjeta, `ucard:from` abre **edición** (`cardId` vinculado), no duplica. Se verifica en prueba.
- Vista previa en el editor, lista en `#/subrayados` y diálogo `summary:cards` desde el Panel; `source:"annotation"` y `annotationId` se guardan.

### Pausa de recuerdo

- Solo cuenta secciones `depth === "core"` y solo aparece si la ficha tiene al menos una tarjeta real (`STUDY_CONTENT.cards[].sheetId`) con pregunta y respuesta. No inventa preguntas ni toca `cards`.
- Frecuencia 1/2/3 persistida en `study-active-prefs-v1`.
- Al cerrar la sección `n` con `n % frecuencia === 0` se añade `.ac-pause[data-ac-owned][data-ac-section]` al final de la sección. Si la ficha se completó en las últimas 6 h, la última sección esencial cede su lugar a la confianza; si era el único hueco, la pausa pasa a la primera sección esencial para no eliminar toda la práctica.
- Estados: `ask`, `revealed`, `rated`, `skipped`, `saving`, `error`. Respuesta libre opcional (se conserva en memoria y tras re-render), revelar, autoevaluación y «Saltar» siempre visible. Al guardar se escribe `recall`; el evento `recall:changed` lo emite el store con `{sheetId, id, rating}` y la integración **no lo duplica**.

### Confianza

- `.ac-confhost` se inserta tras `.reader-practice` cuando la ficha está completada.
- Tres opciones con icono y texto; guardar/limpiar/editar; `sheetConfidence`. No bloquea ni retrasa «Completada».
- El microcopy de las opciones usa `--text-soft` (contraste AA; ver PEDIDOS de QA).

### Modo recordar

- Control `.ac-memorybar` dentro de `.reader-concepts`; oculta `.concept-grid` y monta `recallMode` con velo, patrón y etiquetas «Oculto/Revelado».
- Teclado: Tab recorre conceptos, Enter/Espacio revela; «Mostrar todos/Ocultar todos»; estado textual, nunca solo color.

### Dudas

- Color `duda` crea una anotación y una duda enlazada (`annotationId`) si no existía.
- `#/dudas` muestra abiertas/resueltas/todas, búsqueda sin acentos, cita, ficha/sección, nota, fechas y acciones. Resolver/reabrir solo cambia `resolvedAt`; **no borra el subrayado**. El Panel muestra el contador de abiertas.

### Preferencias y atajos

- Clave externa aprobada `study-active-prefs-v1`:
  `{version:1, recallPause:true, recallEvery:2, shortcuts:true}`. No forma parte del estado exportado.
- Atajos del lector (no usan `/` ni `Ctrl+K`): `n` siguiente ficha, `p` anterior, `c` completar, `s` subrayar párrafo visible, `r` modo recordar, `?` ayuda, `Esc` cerrar, `1–4` color con barra abierta, `Ctrl/Cmd+Enter` guardar. Se registran con `StudyApp.shortcuts`, se desactivan al escribir y con un diálogo abierto, y el interruptor persiste.
- La ayuda es un diálogo accesible con `role="dialog"`, `aria-modal="true"`, foco contenido, `Esc` y retorno al disparador. Incluye el interruptor de atajos.

### Eventos y foco

- Consume `annotation:changed`, `doubt:changed`, `confidence:changed`, `recall:changed` y `store:change`; no inventa eventos globales. Las escrituras propias se hacen en silencio y refrescan solo las superficies necesarias para no perder texto ni foco.
- Anuncia con `StudyApp.announce` (`#live`) y con los `role="status"` de los componentes.
- Devuelve foco al párrafo/marca/fila/botón que abrió la superficie; si el disparador desapareció, cae al `h1` o `#main`.
- `store:change` externo refresca rail, marcas, confianza, rutas y resumen; los borrados externos cierran la nota abierta.

### Verificación de la entrega

Con Chrome headless + `python -m http.server 8787`:

| Bloque | Resultado |
|---|---|
| Smoke de integración (crear subrayado con nota, persistencia, tarjeta, memoria, pausa, confianza, rutas, dudas, resumen, ayuda) | **13/13** |
| Verificación extendida (selección real con prefijo/sufijo, huérfano y recuperación, duda resolver/reabrir/filtros, tarjeta crear/editar sin duplicar, atajos, error/reintento, hoja táctil 44 px, capturas de pausa/confianza) | **9/9** |
| Errores de consola, excepciones y peticiones fallidas | 0 / 0 / 0 |
| Scroll horizontal 360/390/768/1024/1440, ambos temas, con capa abierta | Ninguno |
| Objetivos táctiles en hoja | ≥44 px; foco contenido |
| QA de cierre (Agente 6) | 39/39 E2E y 66 auditorías axe con 0 violaciones |

---

## 0. Resumen de la Fase 1 (ejecutado)

1. Cargar `css/active.css` y los cuatro módulos `js/active/active.{icons,core,components,behavior}.js` (nunca `active.preview.js`).
2. En `renderSheet`, montar: botón por párrafo, barra de selección, panel «Mis subrayados» en el rail y pausa de recuerdo al final de las secciones esenciales.
3. Conectar cada `data-ac-action` con el store v2 y el bus (`annotation:changed`, `confidence:changed`, `store:change`).
4. Registrar `#/subrayados` como ruta del módulo `active`: el panel completo ya existe.
5. No añadir persistencia a la biblioteca. Toda escritura pasa por el store de la app.

Los cinco puntos se implementaron en `js/active/active.integration.js`; el detalle y la verificación están en §0.1.

---

## 1. Archivos entregados

| Archivo | Papel |
|---|---|
| `css/active.css` | Toda la piel de `.ac-*`. Sin reglas globales. Consume los tokens de `base.css`. |
| `js/active/active.icons.js` | Trazos nuevos (resaltador, ojo tachado, nota, salto, papelera, deshacer, medio círculo, teclado, candado…). Reutiliza `StudyIcons` cuando el nombre ya existe. |
| `js/active/active.core.js` | Utilidades puras, catálogo de marcas, escalas de autoevaluación y confianza, fechas relativas y `escapeHTML` de `StudyUI`. |
| `js/active/active.components.js` | Funciones que devuelven HTML: `selectionBar`, `readingParagraph`, `noteCard`, `highlightsPanel`, `recallPause`, `recallSwitch`, `recallMode`, `confidencePicker` y primitivas (`stateCard`, `skeleton`, `alert`, `markBadge`, `quote`, `kicker`, `actionButton`, `statusLine`). |
| `js/active/active.behavior.js` | Delegación de acciones, foco contenido, posición de la barra, lectura de la selección, grupos de radios y anuncios. Solo DOM. |
| `js/active/active.integration.js` | **Fase 1.** Conecta la biblioteca con `StudyApp`, `StudyStore` v2 y el bus: anclaje, selección, rail, pausa, confianza, memoria, tarjetas propias, dudas, atajos y rutas. |
| `js/active/active.preview.js` | **Solo previsualizador.** Datos de ejemplo a partir del temario real y cableado de la demo. |
| `docs/preview-active.html` | Banco de revisión interno. No se enlaza desde la app. |
| `docs/ACTIVE-CONTRATO.md` | Este documento. |

### Abrir el previsualizador

Desde la raíz del repositorio (`ZARCONT SERUMS/`):

```powershell
python -m http.server 8787
```

Abrir `http://127.0.0.1:8787/study-dashboard/docs/preview-active.html`.

- Sin servidor, el navegador no carga `study-data/temario.js` con el mismo origen y la demo muestra su aviso de error.
- El previsualizador carga el temario real (2,5 MB). Es material interno: no se sirve desde la app y no forma parte de la navegación.
- Controles: tema oscuro/claro, ancho simulado (Auto/360/390/768/1024/1440), dispositivos de 360/390 px para la hoja táctil y conmutadores de estado por componente.

---

## 2. Reglas de la biblioteca

- **JavaScript clásico**, sin framework, sin build, sin dependencias. Se ejecuta con `window.StudyActive`.
- **HTML puro**: cada componente recibe datos y devuelve una cadena. No lee el store, no conoce rutas, no escribe almacenamiento.
- **Todo texto pasa por `StudyUI.escapeHTML`** (con respaldo local idéntico si la utilidad no está cargada). Ningún atributo se concatena sin escapar.
- **Prefijo `.ac-*`**: ningún selector global (`body`, `a`, `button`, `:root`). Los tokens de respaldo viven en `.ac` y `html[data-theme="light"] .ac`, nunca en `:root`.
- **Nada de `eval`**, `innerHTML` con datos del usuario, ni `document.write`.
- La interacción se declara con atributos: `data-ac-action`, `data-ac-input`, `data-ac-id`, `data-index`, `data-color`, `data-value`.
- **La biblioteca no emite eventos globales**: la integración decide qué hace cada acción y qué anuncia.

---

## 3. Tokens y sistema visual

### 3.1 Consumo

`base.css` (Agente 6) ya publica `--mark-*`, `--target-min` y las capas `--z-*`. La biblioteca las usa con respaldo local, de modo que funciona incluso si esos tokens no existen:

```css
.ac {
  --ac-mark-important: var(--mark-important, #E6B566);
  --ac-mark-important-bg: var(--mark-important-bg, rgba(230,181,102,.18));
  --ac-mark-important-line: var(--mark-important-line, rgba(230,181,102,.60));
  --ac-mark-important-ink: var(--mark-important-ink, #FFE7B8);
  /* … las cuatro marcas … */
  --ac-target: var(--target-min, 44px);
}
html[data-theme="light"] .ac { /* espejo de los valores claros */ }
```

Alias semánticos usados por los estados: `--ac-ok` ← `--green`, `--ac-warn` ← `--mark-important`, `--ac-bad` ← `--danger`. Así «No lo sabía» es rojo, «Más o menos» ámbar y «Lo sabía» verde sin depender del color de la marca «Duda» (que es violeta en el sistema 2.3).

### 3.2 Contraste medido (tokens publicados, 9 nov 2026)

| Tema | Marca | tinta / `-bg` | tinta / `-bg` sobre superficie 2 | marca / superficie | texto sobre marca |
|---|---|---:|---:|---:|---:|
| oscuro | Importante | 10,56:1 | 9,82:1 | 9,78:1 | 9,90:1 |
| oscuro | Entender | 10,73:1 | 9,96:1 | 10,60:1 | 10,74:1 |
| oscuro | Repasar | 10,17:1 | 9,45:1 | 9,43:1 | 9,55:1 |
| oscuro | Duda | 9,90:1 | 9,19:1 | 9,29:1 | 9,42:1 |
| claro | Importante | 7,27:1 | 6,60:1 | 5,86:1 | 5,93:1 |
| claro | Entender | 7,81:1 | 7,08:1 | 7,09:1 | 7,18:1 |
| claro | Repasar | 8,15:1 | 7,39:1 | 6,31:1 | 6,39:1 |
| claro | Duda | 8,59:1 | 7,79:1 | 6,61:1 | 6,69:1 |

Mínimos: texto 4,5:1 · elementos gráficos 3:1. Ningún valor queda por debajo. La tabla se calcula componiendo `-bg` translúcido sobre `--surface` y `--surface-2`.

### 3.3 Objetivos, capas y movimiento

- En puntero grueso (`@media (pointer: coarse)`): botones, botones pequeños, iconos, chips de filtro, filas del rail y «Saltar» a **44 px** mínimo (`--target-min`). Medido en la verificación: 44 px botones, 62 px botones de color, 44 px botón de párrafo, 78 px filas del rail.
- Capas: `.ac-layer` usa `--z-popover` (100); `.ac-layer--modal` (hoja) usa `--z-modal` (120). La appbar queda por debajo.
- Duraciones: `--t-fast` 140 ms, `--t-base` 220 ms, `--t-slow` 420 ms. Ninguna animación decorativa nueva fuera de esos tokens.
- `prefers-reduced-motion: reduce`: animaciones y transiciones a ~0. `prefers-reduced-transparency: reduce`: el velo de la hoja deja de desenfocar y se vuelve opaco.
- `prefers-contrast: more`: se hereda el refuerzo de `base.css` (bordes y fondos de marca más sólidos).

---

## 4. Componentes

Convenciones comunes:

- `opts.id` **debe ser estable** (por ejemplo `ann-<id>`, `sheet-<id>`). Es la única forma de que `aria-controls` y los parches de DOM sobrevivan a un re-render.
- Todos los componentes generan HTML conceptualmente «estático»: la integración puede reemplazarlo, pero mientras un campo tenga el foco debe **parchear** contadores y estados (`[data-ac-note-count]`, `data-state`, `textContent`) en lugar de sustituir el bloque.
- Los mensajes usan `role="status"`; los errores, `role="alert"`.
- Los botones destructivos incluyen la cita recortada en su nombre accesible.

### 4.1 `selectionBar(opts)` — barra flotante y hoja táctil

```js
StudyActive.components.selectionBar({
  id: "ac-bar-sheet-aps-01",
  variant: "floating",            // "floating" | "sheet" | "inline"
  state: "ready",                 // "ready" | "saving" | "saved" | "error" | "disabled"
  color: "important",             // important | understand | review | doubt
  quote: "…texto seleccionado…",
  source: "Atención primaria · Fundamentos",
  noteOpen: false,
  note: "",
  maxLength: 280,
  hint: "",                       // opcional; hay textos por variante
  keyHints: false,                // muestra la ayuda 1–4 en la variante flotante
  error: "",                      // mensaje del estado error
  static: false,                  // atributo de inspección en la galería
  noLayer: false                  // devuelve solo la barra (montaje propio)
});
```

Devuelve `.ac-layer` + `.ac-selbar`, salvo `variant:"inline"` o `noLayer:true`, que devuelven solo la barra.

- **Cuatro marcas con icono y etiqueta** (Importante, Entender, Repasar, Duda). El color seleccionado tiñe el botón principal; nunca es la única señal.
- **Nota opcional** con contador `[data-ac-note-count]` y límite 280.
- **Acciones:** `selection:color` (`data-color`), `selection:note` (abre/cierra nota), `selection:submit`, `selection:cancel`, `selection:close` (estado guardado).
- **Entrada:** `data-ac-input="note"`.
- **Estados:** `saving` bloquea el envío y muestra «Guardando…»; `saved` colapsa a una confirmación; `error` conserva la cita y muestra `role="alert"`; `disabled` no permite interactuar.
- **A11y:** `role="dialog"` con `aria-labelledby`; `aria-modal="false"` en flotante y `"true"` en hoja. La hoja queda dentro de `.ac-layer--modal` con `.ac-scrim`. El foco lo gestiona la integración con `StudyActive.behavior`:
  - abrir desde ratón: no se roba el foco;
  - abrir desde párrafo o teclado: `focusFirst(bar)`;
  - hoja: `trap(bar)` + `inert` en el contenido del lector; al cerrar se libera y se devuelve el foco al disparador;
  - Esc cierra; `1–4` eligen color; `Ctrl/Cmd+Enter` confirma fuera de campos de texto.
- **Posición:** `StudyActive.behavior.positionBar(bar, rect, layer)` calcula arriba/abajo, evita salir de la ventana y ajusta `--ac-tail` (la cola de la burbuja). La barra es `position:absolute` dentro de un `.ac-layer` que la app coloca `fixed`.

**Store v2:** al confirmar, `StudyStore.annotations.add({sheetId, sectionIndex, paragraphIndex, color, quote, prefix, suffix, note})`. El `add` genera `id` (`ann-…`), `createdAt`, `updatedAt` y `deleted:false`. Después: emitir `annotation:changed` y refrescar el rail.

**Párrafo:** `readingParagraph({id, index, text, sheetTitle, highlight})` devuelve `.ac-para` con el texto y un botón «Subrayar» (44 px en táctil). En ratón fino el botón es un icono discreto en el margen; en táctil es una acción visible bajo el párrafo. Acción: `paragraph:open` con `data-index`.

### 4.2 `noteCard(opts)` — nota de un subrayado

```js
StudyActive.components.noteCard({
  id: "ac-note-ann-2",
  annotationId: "ann-demo-2",
  color: "understand",
  quote: "…cita real…",
  source: "Atención primaria · Fundamentos · De la enfermedad a la persona",
  note: "Texto de la nota",
  updatedAt: "2026-11-09T18:05:00.000Z",
  maxLength: 280,
  mode: "view",                   // "view" | "edit"
  state: "idle"                   // idle | saving | saved | error | disabled
});
```

- **La nota pertenece a la anotación.** La cita, el color y la fecha salen de la anotación; la nota es su campo opcional. No hay notas de ficha.
- Vista: cita con borde de marca, nota, fecha relativa y absoluta (`title`), acciones «Ir al contexto», «Editar/Añadir nota» y «Quitar nota».
- Edición: textarea con `aria-describedby` al contador y límite; «Guardar nota» y «Cancelar».
- Estados: `saving` deshabilita y muestra spinner; `saved` deja `role="status"` «Nota guardada · Hace un momento»; `error` conserva el texto y muestra un aviso con reintento; `disabled` bloquea acciones.
- **Acciones:** `note:edit`, `note:cancel`, `note:save`, `note:clear`, `note:goto`. **Entrada:** `data-ac-input="note"`.
- **Store v2:** `annotations.update(id, {note})` para guardar o quitar (`note:""`). El guardado de la nota no toca el subrayado ni su color.
- **A11y:** `article` con `aria-labelledby` a un `h3` solo para lectores; `aria-busy` mientras guarda; la acción «Quitar nota» explica que la cita se conserva.

### 4.3 `highlightsPanel(opts)` — Mis subrayados

```js
StudyActive.components.highlightsPanel({
  id: "ac-hl-sheet-aps-01",
  view: "full",                   // "full" | "rail"
  title: "Mis subrayados",
  kicker: "Tu lectura activa",
  titleTag: "h2",                 // h2 | h3
  annotations: [ /* ver forma abajo */ ],
  filters: { colors: [], query: "", scope: "all" },
  scopes: [{ value: "all", label: "Todas las fichas" }, { value: "sheet-aps-01", label: "APS" }],
  state: "ready",                 // ready | loading | error | empty
  error: "",
  limit: 3                        // solo rail
});
```

Forma de anotación que espera el panel (la del store v2, más tres ayudas de presentación):

```js
{
  id, sheetId, sheetTitle, areaId,
  sectionTitle, sectionIndex, paragraphIndex,
  color, quote, note, updatedAt,
  deleted: false,
  href: "#/ficha/sheet-aps-01",         // opcional: si falta, «Ir al contexto» es un botón
  orphan: false | "missing-anchor" | "missing-sheet"
}
```

- **Filtros:** por color (multi-selección + «Todos»), por ficha/área (`select` nativo) y búsqueda sin mayúsculas ni diacríticos sobre cita, nota, ficha y sección.
- **Resumen** `role="status"` («Mostrando X de Y»), anillo cónico con la distribución por color y leyenda con etiquetas.
- **Filas:** marca con icono y etiqueta, cita, ficha/sección, fecha relativa, nota y acciones. La deuda de anclaje se marca con borde discontinuo y una etiqueta textual («Ancla perdida» o «Ficha no disponible»), con explicación de recuperación: la cita y la nota se conservan; se puede abrir la ficha o eliminar la marca.
- **Vacío, cargando, error y huérfanos** tienen su propio estado, visible en el previsualizador.
- **Rail (292 px):** cabecera compacta con contador, hasta `limit` filas (sección preferida como contexto) y enlace «Ver los N subrayados». Si no hay marcas, una línea lo dice.
- **Acciones:** `highlights:filter` (`data-color`, incluido `all`), `highlights:clear`, `highlights:goto` (`data-ac-id`), `highlights:note`, `highlights:delete`, `highlights:back` (vacío sin datos), `highlights:showall` (rail), `highlights:retry`.
- **Entradas:** `data-ac-input="query"` y `data-ac-input="scope"`.
- **Filtro reutilizable:** `StudyActive.query.highlights(list, filters)` devuelve `{items, counts, filtered, total, hasFilters}`. La app puede usar los mismos conteos para el estado del rail y para la vista `#/subrayados`.
- **Store v2:** `annotations.list({sheetId, color})` y `annotations.remove(id)`. «Ir al contexto» no borra ni muta: la app navega a `#/ficha/:id` y busca `sectionIndex`/`paragraphIndex`. Nota: `annotations.list` aún no filtra por `areaId`; la integración resuelve el área desde la ficha y filtra en memoria (ver PEDIDOS).
- **A11y:** sección con `aria-labelledby`; filtros en grupo con `aria-pressed`; búsqueda con etiqueta solo para lectores; la lista no es un `listbox` (no hay selección), son artículos; el botón de borrar incluye la cita en su nombre.

### 4.4 `recallPause(opts)` — pausa de recuerdo

```js
StudyActive.components.recallPause({
  id: "ac-pause-card-1",
  cardId: "card-aps-01-1",
  question: "Explica por qué la APS no debe entenderse como una atención de segunda categoría.",
  answer: "Porque es la puerta de entrada y el eje organizador del sistema…",
  freeAnswer: "",                 // respuesta libre escrita por la persona
  rating: null,                   // again | hard | good
  state: "ask",                   // ask | revealed | rated | skipped | saving | error
  error: "",
  sheetTitle: "Una APS fuerte no es un consultorio de segunda",
  sectionTitle: "De la enfermedad a la persona"
});
```

- **Pregunta real** de una tarjeta de la ficha; la respuesta se revela a un toque.
- Respuesta libre **opcional** (textarea); al revelar se conserva como «Tu respuesta».
- Autoevaluación con tres botones: «No lo sabía» (`again`), «Más o menos» (`hard`), «Lo sabía» (`good`), con icono y tono.
- **«Saltar» siempre visible** en la cabecera, en todos los estados.
- Estados: `rated` con `role="status"` («Anotado: …») y cierre; `skipped` con reapertura; `error` con reintento; `saving` bloquea.
- Pie visible: «Esta pausa no toca tus cajas de Flashcards». **No crea ni modifica tarjetas.**
- Foco: la respuesta revelada tiene `tabindex="-1"` y `data-ac-focus="answer"` para que la integración mueva allí el foco (el demo lo hace).
- **Acciones:** `recall:reveal`, `recall:rate` (`data-value`), `recall:skip`, `recall:close`, `recall:reopen`, `recall:retry`. **Entrada:** `data-ac-input="answer"`.
- **Store v2:** `StudyStore.recall.add({id, sheetId, cardId, sectionIndex, question, answer, rating})`. «Saltar» puede registrarse con `rating:"skipped"` (el esquema lo admite) o no registrar; se recomienda registrarlo para medir la frecuencia real de aparición. No se toca `cards`.

### 4.5 `recallSwitch(opts)` — interruptor global y frecuencia

```js
StudyActive.components.recallSwitch({
  id: "ac-recall-switch",
  enabled: true,
  frequency: 3,                   // 1 | 2 | 3
  state: "ready"                  // ready | saving | error
});
```

- `role="switch"` con texto visible «Activada/Desactivada» y `aria-checked`.
- Frecuencia en un `radiogroup` («Cada sección», «Cada 2», «Cada 3») con explicación textual de cuántas secciones pasan entre pausas.
- Con el interruptor apagado, la frecuencia queda inerte (`aria-disabled`) y el texto lo explica.
- **Acciones:** `recall:switch`, `recall:freq` (`data-value`).
- **Persistencia:** la biblioteca no guarda nada. La integración usa la clave externa aprobada `study-active-prefs-v1` (fuera del estado exportado). El previsualizador guarda la preferencia en `localStorage` con prefijo `ac-preview-` **solo como demostración**.
- Frecuencia recomendada en la integración: contar solo secciones con `depth === "core"`, mostrar la pausa al cerrar la sección `n` donde `n % frecuencia === 0`, y no mostrarla en la última sección si la ficha acaba de completarse (la confianza ocupa ese lugar).

### 4.6 `recallMode(opts)` — conceptos ocultos

```js
StudyActive.components.recallMode({
  id: "ac-memory-sheet-aps-01",
  concepts: ["La APS es la puerta de entrada…", "…"],
  revealed: [false, false, true, false],
  title: "Conceptos clave",
  subtitle: "Intenta decirlos antes de revelar…"
});
```

- Rejilla `auto-fit`; cada concepto es un **botón** (`aria-pressed` + nombre accesible dinámico «Concepto 2 de 4, oculto. Activar para revelar»).
- Velo con patrón diagonal y etiqueta textual «Oculto»; al revelar, etiqueta «Revelado», borde y fondo de éxito. No depende del color.
- Contador «X de 4 revelados» (`role="status"`) y botón único que alterna «Mostrar todos» / «Ocultar todos».
- Teclado: Tab recorre los conceptos, Enter/Espacio revelan; el botón global es un control aparte.
- **Acciones:** `memory:toggle` (`data-index`), `memory:all`, `memory:none`.
- **Store v2:** no escribe. Es una ayuda de lectura; si se quiere recordar el estado entre visitas, es preferencia de interfaz (misma petición que la pausa).

### 4.7 `confidencePicker(opts)` — confianza al completar

```js
StudyActive.components.confidencePicker({
  id: "ac-conf-sheet-aps-01",
  sheetId: "sheet-aps-01",
  value: null,                    // null | solid | partial | weak
  state: "idle",                  // idle | selected | saving | saved | error | disabled
  updatedAt: null,
  title: "¿Cómo te sientes con esta ficha?",
  hint: "Opcional. Puedes cambiarlo más tarde…"
});
```

- Tres opciones con icono, etiqueta y microcopy: «Lo domino» (`solid`), «Más o menos» (`partial`), «No lo entendí» (`weak`). **Opcional** desde el primer píxel: «Ahora no» no bloquea nada.
- Selección → «Guardar»; guardado → «Guardado · fecha», «Cambiar» y «Quitar»; `saving` y `error` con reintento; `disabled` para fichas no completadas.
- `role="radiogroup"` con `tabindex` móvil; la integración debe llamar `StudyActive.behavior.radioKeys(root)` para flechas/Home/End (el demo ya lo hace).
- **Acciones:** `confidence:pick` (`data-value`), `confidence:save`, `confidence:clear`, `confidence:dismiss`, `confidence:edit`.
- **Store v2:** `sheetConfidence.set(sheetId, "solid"|"partial"|"weak")` y `sheetConfidence.clear(sheetId)`. Emite `confidence:changed` en la integración.

### 4.8 Primitivas exportadas

`stateCard({tone, icon, title, text, actions})`, `skeleton({rows,label})`, `alert({tone, icon, title, text, action})`, `markBadge(color, size)`, `quote({quote, source, color})`, `kicker(text, withDot)`, `actionButton(def)`, `statusLine(text, tone, icon)`.

`actions` es un arreglo de `{label, action, icon, variant, size, value, href}`; se renderiza con `actionButton` y nunca acepta HTML libre.

---

## 5. Catálogo de acciones y conexión con el store v2

La integración escucha una sola vez:

```js
StudyActive.behavior.bind(host, {
  click: {
    "selection:color": function (el) { /* el.getAttribute("data-color") */ },
    "selection:submit": function () { /* store.add + re-render */ },
    /* … */
  },
  input: {
    note: function (el) { /* guarda borrador en memoria; no persiste */ },
    query: function (el) { /* filtra y parchea la lista */ }
  },
  change: { scope: function (el) {} },
  keydown: function (event, actionEl, inputEl) {}
});
```

| Acción | Datos | Qué debe hacer la integración | Store v2 | Bus |
|---|---|---|---|---|
| `paragraph:open` | `data-index` | Abrir la barra con el texto del párrafo y el foco | — | — |
| `selection:color` | `data-color` | Cambiar la marca en memoria y re-renderizar la barra | — | — |
| `selection:submit` | — | Guardar la anotación y cerrar con confirmación | `annotations.add` | `annotation:changed` |
| `selection:cancel` / `selection:close` | — | Cerrar y devolver el foco al disparador | — | — |
| `note:save` | `data-ac-id` | Guardar la nota de esa anotación | `annotations.update(id,{note})` | `annotation:changed` |
| `note:clear` | `data-ac-id` | Quitar la nota sin quitar la cita | `annotations.update(id,{note:""})` | `annotation:changed` |
| `note:goto` | `data-ac-id` | Navegar a la ficha y resaltar el párrafo | — | — |
| `highlights:filter` | `data-color` | Alternar color / «Todos» y refrescar el panel | — | — |
| `highlights:clear` | — | Limpiar filtros | — | — |
| `highlights:goto` | `data-ac-id` | Abrir la ficha en el párrafo; si el ancla falta, abrir al inicio y anunciarlo | — | — |
| `highlights:note` | `data-ac-id` | Abrir la nota de esa anotación | — | — |
| `highlights:delete` | `data-ac-id` | Borrado lógico con confirmación o deshacer | `annotations.remove` | `annotation:changed` |
| `highlights:showall` | — | Ir a `#/subrayados` (o abrir el panel completo) | — | — |
| `highlights:retry` | — | Reintentar la lectura del store | — | — |
| `recall:reveal` | — | Mostrar respuesta y llevar el foco a ella | — | — |
| `recall:rate` | `data-value` | Guardar la autoevaluación | `recall.add` | `recall:changed` `{sheetId, id, rating}` (lo emite el store) |
| `recall:skip` | — | Registrar o no la omisión y cerrar la pausa | `recall.add` (opcional) | — |
| `recall:close` / `reopen` | — | Ocultar/restaurar la pausa | — | — |
| `recall:switch` | — | Guardar la preferencia | `prefs` / clave propia | — |
| `recall:freq` | `data-value` | Guardar 1/2/3 | igual | — |
| `memory:toggle` | `data-index` | Alternar el velo | — | — |
| `memory:all` / `memory:none` | — | Mostrar/ocultar todos | — | — |
| `confidence:pick` | `data-value` | Marcar opción sin guardar | — | — |
| `confidence:save` | — | Guardar la confianza | `sheetConfidence.set` | `confidence:changed` |
| `confidence:clear` | — | Escribir el tombstone | `sheetConfidence.clear` | `confidence:changed` |
| `confidence:dismiss` | — | Ocultar la pregunta en esta visita | — | — |
| `confidence:edit` | — | Volver al estado seleccionado | — | — |

Reglas:

- Los datos se leen del propio elemento (`data-ac-id`, `data-color`, `data-value`, `data-index`), no de índices frágiles.
- `data-ac-id` es el `id` de la anotación o de la ficha, según el componente. La integración debe guardar el contexto de la tarjeta de recuerdo (por ejemplo, `data-ac-id` = `cardId`) en su propio estado.
- Los textos de confirmación se anuncian en el `#live` de la app (`ctx.announce`). La biblioteca no crea regiones globales.
- Un error del store se refleja con `state:"error"` y un mensaje que no pierde el texto escrito.

---

## 6. Datos que la integración debe entregar

- `annotations.list({sheetId})` → forma de anotación del §4.3, añadiendo `sheetTitle`, `sectionTitle`, `areaId`, `href` y `orphan` si procede.
- `sheetConfidence.get(sheetId)` → `{value, updatedAt}` o `null`.
- Tarjetas de la ficha (`STUDY_CONTENT.cards` filtradas por `sheetId`) para la pausa. Mapeo recomendado sin inventar texto: `question = card.prompt`; `answer = card.answer || card.options[card.correctIndex]` (si la tarjeta es de opción múltiple, se revela la opción correcta; su `explanation` puede ir debajo como apoyo, si el coordinador lo aprueba).
- `sectionIndex` y `paragraphIndex` reales para «Ir al contexto». Si la ficha o el párrafo ya no existen, marcar `orphan`.
- El estado de la interfaz (color elegido, filtros, respuestas libres) vive **en memoria de la vista**; nunca se escribe en la biblioteca.

---

## 7. Cómo se integrará en `renderSheet` (Fase 1)

1. **Párrafos con acción.** En `sectionHTML`, sustituir cada `<p>` por `StudyActive.components.readingParagraph({id, index, text, sheetTitle})`, o envolver el `<p>` en `.ac-para` y añadir el botón. Mantener `id="section-N"` del contenedor de sección.
2. **Capa de lectura.** Montar un `.ac-layer` fijo al abrir la ficha (una sola instancia por vista). Escuchar `mouseup`/`touchend` dentro de `.reader-main`; `StudyActive.behavior.readSelection(sectionEl)` devuelve texto y rectángulo; abrir la barra flotante (ratón) o la hoja (táctil) y limpiar la selección.
3. **Rail.** `#sheet-aps-01` → panel `view:"rail"` con `limit:3` dentro de `.reader-rail`, antes o después de la tarjeta de progreso. `highlights:showall` navega a `#/subrayados`.
4. **Pausa.** Contar secciones `core`; al cerrar cada `n` con `n % frecuencia === 0`, insertar `recallPause` al final de la sección. La respuesta se busca entre las tarjetas de la ficha; si no hay tarjeta, no se muestra la pausa (no inventar preguntas).
5. **Modo recordar.** En `.reader-concepts`, añadir un control «Modo recordar» que alterna entre la rejilla estática actual y `recallMode` con `sheet.keyConcepts`. Es un modo de lectura, no una ruta.
6. **Confianza.** Al marcar completada (o justo después, dentro de `.reader-practice`), montar `confidencePicker`. No bloquea la acción de completar.
7. **Interruptor.** `recallSwitch` dentro del panel de preferencias de lectura (o en `#/respaldo`/Ajustes cuando exista). La preferencia persiste fuera del estado de anotaciones.
8. **Ruta `#/subrayados`.** Registrar el módulo `active` con `routes: [{path:"subrayados"}]`; dentro, `highlightsPanel` a pantalla completa con filtros y contexto. Los filtros pueden vivir en la URL solo si el coordinador lo aprueba; en Fase 1, en memoria.
9. **Eventos.** Conectar `annotation:changed` → re-render del rail y del panel; `confidence:changed` → refrescar el estado del selector; `store:change` → si otra pestaña escribe, revalidar.
10. **Foco.** Al cerrar la hoja, devolver el foco al párrafo o botón que la abrió. Al guardar, anunciar y no mover el foco más allá de la confirmación.

Lo que **no** hay que hacer: guardar en `localStorage` desde los componentes, duplicar textos clínicos, mostrar la pausa en la última sección de una ficha recién completada, o escribir en `cards` desde la pausa.

---

## 8. Accesibilidad

- **Contraste**: tabla del §3.2; ninguna combinación por debajo de 4,5:1 (texto) ni 3:1 (gráficos).
- **Color no único**: cada marca lleva icono y etiqueta; los subrayados en el texto se distinguen también por el estilo de borde (sólido, doble, discontinuo, punteado) y cada fila del panel lleva su etiqueta.
- **Foco**: visible con `:focus-visible`; la barra flotante no roba el foco al abrirse con ratón; la hoja lo contiene y lo devuelve; Esc cierra en ambos casos.
- **Teclado**: Tab/Shift+Tab, Enter/Espacio, `1–4` en la barra, flechas en los `radiogroup` (con `radioKeys`), Esc en la hoja.
- **Anuncios**: confirmaciones con `role="status"`; errores con `role="alert"`. La integración anuncia además en `#live`.
- **Nombres accesibles**: botones de icono con `aria-label`; el borrado incluye la cita recortada; el switch incluye su estado textual.
- **Objetivos**: 44 px en puntero grueso (verificado).
- **Movimiento**: `prefers-reduced-motion`; sin animaciones de entrada en la galería (`animation:none` en la variante en línea).
- **Transparencia**: `prefers-reduced-transparency` apaga el desenfoque del velo.
- **Zoom/reflow**: probado a 360, 390, 768, 1024 y 1440 sin desplazamiento horizontal.

---

## 9. Verificación de la Fase 0

Ejecutada con Chrome 157 headless servido por `python -m http.server 8787`:

| Comprobación | Resultado |
|---|---|
| Arranque del previsualizador con contenido real | OK (`temario.js v2.5.0`, 210 fichas, 630 tarjetas) |
| Errores de consola, excepciones y peticiones fallidas | 0 / 0 / 0 |
| Comprobaciones automatizadas de la demo | **62/62** |
| Scroll horizontal a 360/390/768/1024/1440 | Ninguno (`scrollWidth === innerWidth`) |
| Tema oscuro y claro | Ambos verificados en capturas internas |
| Objetivos táctiles con puntero grueso | 44 px botones, 62 px colores, 44 px párrafo, 78 px rail, 44 px filtros |
| Foco contenido en la hoja táctil | 10 Tabs seguidos permanecen dentro |
| Esc cierra barra y hoja | OK; el foco vuelve al disparador |
| Guardado de nota/subrayado/confianza, filtros y búsqueda | OK |
| `prefers-reduced-motion` | Transiciones a ~0 |
| Ancho del previsualizador y del dispositivo | 360/390/768/1024/1440 sin desbordes |

Las capturas de esta verificación son internas y **no** se publican; las capturas finales corresponden a QA (Agente 6).

---

## 10. Supuestos, límites y riesgos

1. **Menú nativo de selección.** En iOS/Android, tocar texto abre su propio menú. La hoja inferior aparece al soltar y es lo bastante grande para no depender de un toque de precisión; el primer toque sobre la hoja puede cerrar el menú del sistema. El botón por párrafo queda como camino alternativo sin gesto.
2. **Selección y posición.** `range.getBoundingClientRect()` devuelve el rectángulo envolvente; con selecciones de varias líneas la barra puede quedar centrada sobre el bloque. `positionBar` evita desbordes, pero si la página se desplaza con la barra abierta conviene cerrarla (el demo lo hace al hacer clic fuera).
3. **Re-render y foco.** Sustituir el HTML de un componente con un textarea enfocado pierde el cursor. La integración debe parchear contadores/estados o restaurar la selección; los ids estables son obligatorios para `aria-controls`.
4. **`inert`.** Soporte moderno (Chrome 102+, Safari 15.5+, Firefox 112+). Si se necesita un navegador anterior, la hoja conserva la trampa de foco; añadir `aria-hidden` al fondo como respaldo.
5. **Preferencias.** La pausa de recuerdo y los atajos usan la clave externa aprobada `study-active-prefs-v1`, fuera de `annotations` y del estado exportado. Si el JSON está dañado se usan los valores por defecto y el lector no se bloquea.
6. **Huérfanos.** La recuperación es manual (abrir la ficha o eliminar). No hay reanclaje automático por texto; hacerlo exige búsqueda difusa y confirmación, y no forma parte de la Fase 0.
7. **Volumen.** `filterAnnotations` recorre la lista en memoria; es suficiente para miles de anotaciones. Si el usuario acumula decenas de miles, la vista `#/subrayados` necesitará paginación o virtualización.
8. **Fechas relativas.** Se calculan al renderizar; para mantenerlas frescas, la vista debe refrescar al volver a primer plano, no con un temporizador por fila.
9. **Nota de 280 caracteres.** Es un límite de interfaz (`maxLength`), no del esquema; puede cambiarse por prop sin migrar datos.
10. **Temario cargado en el preview.** 2,5 MB de contenido real. Es material interno: no se enlaza desde la app ni se sirve en producción como parte del producto.
11. **Tema claro.** La biblioteca depende de `html[data-theme="light"]`; no usa `color-scheme` propio ni `light-dark()` para evitar romper navegadores antiguos.
12. **El demo usa `localStorage` con prefijo `ac-preview-`** (tema y pausa). Esas claves no deben copiarse a la app.

---

## 11. Pedidos abiertos (ver `docs/PEDIDOS.md`)

- ~~Fase 1: cargar `css/active.css` y los cuatro módulos en `index.html`.~~ Aplicado.
- ~~Fase 1: punto de montaje y párrafos con acción en `app.js` (`renderSheet`).~~ Aplicado; la integración envuelve los párrafos existentes.
- ~~`StudyStore.prefs` o clave aprobada para la pausa de recuerdo.~~ `study-active-prefs-v1` aprobada y usada.
- ~~Evento `recall:changed` en el bus.~~ Implementado por el store con `{sheetId, id, rating}`.
- `annotations.list({areaId})` opcional para el filtro por área: siguen pendientes; la integración filtra en memoria.
- `sectionHTML`/`renderSheet` de `app.js`: en modo rápido el índice que llega a `sectionHTML` es el de la lista filtrada, no el de `sheet.sections`. La integración alinea por título y contenido, pero conviene corregir el índice en origen (ver PEDIDOS).
- Centralizar los iconos nuevos en `study-shared/icons.js` si el Agente 6 lo considera.

---

© 2026 ZARCONT — Documento interno del proyecto.
