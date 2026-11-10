# CONTRATOS · Study Dashboard 2.3

**Estado:** publicado para la Fase 0 (9 nov 2026)
**Ámbito:** app `study-dashboard/`, capa compartida `study-shared/` y datos derivados `study-data/derived/`.
**Regla de oro:** cada agente escribe solo en los archivos que se le asignan. Un cambio necesario en un archivo ajeno se anota en `docs/PEDIDOS.md`; no se edita ni se espera bloqueado.

---

## 1. Versiones y caché

- Versión de producto de esta revisión: **2.3.0** (`Study Dashboard · Estudio activo`).
- `study-dashboard/index.html` apunta todos los assets propios y compartidos con `?v=2.3.0`, salvo `study-data/temario.js`, que conserva `?v=2.5.0` (versión de contenido).
- El contenido y sus IDs no cambian en la Fase 0.
- `study-shared/store.js` conserva la clave `study-state-v1` y la base IndexedDB `study-serums` versión 1: cambia el esquema del valor, no el nombre ni la ubicación. Study Flashcards debe poder seguir leyendo el estado con la misma API.
- Al modificar `study-shared/store.js`, `base.css` o `ui.js`, el coordinador actualiza los `?v=` de Study Flashcards de forma mínima y ejecuta FLASH-01..09.
- Toda cabecera de archivo propio lleva `© 2026 ZARCONT` cuando el archivo se cree o se reescriba de forma sustancial. No se añaden cabeceras a archivos de terceros.

## 2. Propiedad de archivos (Fase 0)

| Agente | Archivos exclusivos |
|---|---|
| 1 · Coordinador | `study-dashboard/app.js`, `study-dashboard/index.html`, `study-dashboard/docs/CONTRATOS.md`, `study-dashboard/docs/PEDIDOS.md`, `study-dashboard/CHANGELOG.md`, `study-dashboard/informe/fase0/*`, `AUTORIA.md`, `INTEGRITY.sha256`, metadatos/marca/© de los archivos propios |
| 2 · Datos | `study-shared/store.js`, `study-dashboard/js/data/*`, `study-dashboard/css/data.css`, `tools/build-derived.js`, `study-data/derived/*`, `study-dashboard/tests/data/*` |
| 3 · Lectura activa | `study-dashboard/js/active/*`, `study-dashboard/css/active.css`, `study-dashboard/docs/preview-active.html`, `study-dashboard/docs/ACTIVE-CONTRATO.md` |
| 4 · Planificación | `study-dashboard/js/plan/*`, `study-dashboard/css/plan.css`, `study-dashboard/tests/unit/plan/*`, `study-dashboard/docs/PLAN-MODELO.md` |
| 5 · Navegación | `study-dashboard/js/nav/*`, `study-dashboard/css/nav.css`, `study-dashboard/docs/preview-nav.html`, `study-dashboard/docs/NAV-CONTRATO.md` |
| 6 · Diseño y QA | `study-shared/base.css`, `study-dashboard/styles.css`, `study-shared/icons.js`, `study-shared/ui.js`, `tests/e2e/*`, `tools/qa/*` |

Los previsualizadores `docs/preview-*.html` son material interno de revisión: no se enlazan desde la app, no se cargan al arrancar y no forman parte de la navegación del producto.

## 3. Registro de módulos

`app.js` expone `window.StudyApp` antes de que se ejecute cualquier módulo. Un módulo se registra una sola vez:

```js
window.StudyApp.registerModule({
  id: "backup",                    // kebab-case, único
  routes: [{
    path: "respaldo",             // sin #/; un solo segmento en Fase 0
    title: "Respaldo y datos",    // document.title = title + " · Study Dashboard"
    restoreScroll: false,          // si true, el router recupera el scroll de esa ruta
    render: function (ctx) { return "<section>…</section>"; }, // string escapado
    mount: function (ctx) {},      // opcional, tras innerHTML
    unmount: function (ctx) {}     // opcional, antes del siguiente render
  }],
  init: function (ctx) {},         // una vez, después de store.init()
  onRoute: function (ctx) {},      // después de CADA render de ruta
  onSheetRender: function (ctx) {},// además, solo en #/ficha/:id
  onKeydown: function (event, ctx) {} // opcional; no consumir si el foco está en un campo
});
```

- `render` devuelve una cadena HTML confiable; todo dato dinámico se escapa con `StudyUI.escapeHTML`. No se admite `eval` ni HTML del usuario sin escapar.
- La ruta de módulo se declara como `#/respaldo`; el router resuelve `path` sin `#/`.
- Si un módulo se registra después del arranque, `init` se ejecuta inmediatamente; los módulos deben ser idempotentes y tolerar que no haya ruta activa.
- Si una ruta no existe o su módulo aún no está registrado, se muestra el 404 editorial existente, nunca una pantalla vacía.
- Un módulo no debe contener selectores CSS globales (`body`, `a`, `button`, `:root`): todo su CSS vive bajo su prefijo (`.data-*`, `.ac-*`, `.plan-*`, `.navx-*`) y su propia hoja.

Contexto (`ctx`) entregado por el router:

```js
{
  app, store, ui, content, taxonomy,
  route,            // {name, params, path, sheetId?}
  previousRoute,
  root,             // #view-root
  isSheet,
  sheet,            // ficha cuando isSheet
  params,           // segmentos posteriores de la ruta
  navigate(hash, {replace, announce}),
  refresh({scrollY, focus}),
  announce(text)
}
```

También se exponen:

- `StudyApp.events.on(type, fn) -> off`, `off(type, fn)`, `once(type, fn)`, `emit(type, detail)`.
- `StudyApp.shortcuts.register({id, key, ctrlKey, metaKey, shiftKey, altKey, when, allowInInputs, run})`. El router ignora atajos mientras el foco está en `input`, `textarea`, `select` o editable, salvo `allowInInputs`.
- `StudyApp.navigate(hash, opts)` y `StudyApp.refresh(opts)`.
- `StudyApp.getRoute()` devuelve la ruta activa.
- `StudyApp.version` = `"2.3.0"`.

### Eventos del bus

| Evento | Cuándo | Detalle mínimo |
|---|---|---|
| `app:ready` | Store y router listos | `{version}` |
| `route:change` | Tras cada render | `{route, previousRoute, root}` |
| `sheet:rendered` | Tras renderizar una ficha | `{sheet, root}` |
| `store:change` | Cualquier escritura de `StudyStore` que notifique | `{change?}` |
| `annotation:changed` | Alta/edición/borrado de subrayado | `{id, action}` |
| `doubt:changed` | Alta/resolución/reapertura de duda | `{id, action}` |
| `confidence:changed` | Cambio de confianza | `{sheetId, value}` |
| `review:changed` | Cambio de repaso de ficha | `{sheetId}` |
| `plan:changed` | Cambio del plan | `{plan}` |
| `backup:changed` | Exportación, importación o borrado | `{action}` |
| `progress:cleared` | Borrado total confirmado | `{at}` |

Los módulos no emiten eventos globales nuevos sin anotarlo en `CONTRATOS.md` (lo hace el Coordinador) ni dependen de `window` para comunicarse entre sí.

## 4. Rutas

Las rutas actuales (`#/`, `#/biblioteca`, `#/biblioteca/:area`, `#/biblioteca/:area/:categoria`, `#/ficha/:sheetId`, `#/progreso`) no cambian.

Rutas reservadas y dueño previsto:

> Las rutas de Fase 1 (`#/subrayados`, `#/dudas`), las cuatro de Fase 2 (`#/ruta`, `#/plan`, `#/dominio`, `#/repaso`) y las cinco de Fase 3 (`#/relampago`, `#/ultimo-dia`, `#/glosario`, `#/datos`, `#/trampas`) ya están implementadas. No quedan rutas reservadas públicas.

| Ruta | Vista | Fase | Módulo |
|---|---|---|---|
| `#/respaldo` | Exportar, importar, borrar progreso | 0 | `js/data/backup.js` |
| `#/subrayados` | Mis subrayados (global) | 1 | `active` |
| `#/dudas` | Bandeja de dudas | 1 | `active` |
| `#/ruta` | Ruta de hoy | 2 | `plan` |
| `#/plan` | Plan por fecha de examen | 2 | `plan` |
| `#/dominio` | Mapa de dominio | 2 | `plan` |
| `#/repaso` | Repaso espaciado de fichas | 2 | `plan` |
| `#/relampago` | Repaso relámpago | 3 | `plan` |
| `#/ultimo-dia` | Hoja de último día | 3 | `plan` |
| `#/glosario` | Glosario global | 3 | `nav` |
| `#/datos` | Datos para memorizar | 3 | `nav` |
| `#/trampas` | Trampas frecuentes | 3 | `nav` |

`#/respaldo` es la única ruta de módulo que se enlaza durante la Fase 0. Las demás no se muestran al usuario hasta que su módulo esté completo.

La paleta (Ctrl+K), el índice flotante y los paneles son capas, no rutas. La búsqueda global usa la ruta `#/biblioteca` existente.

### Scroll por ruta

- `#/biblioteca/*` y `#/progreso` conservan la posición al volver a la misma ruta; las fichas usan su propio `scroll` persistido.
- Una ruta de módulo puede declarar `restoreScroll: true`.
- `refresh({scrollY})` conserva el píxel actual; una navegación nueva a una ruta sin memoria empieza arriba.
- El paginador anterior/siguiente de fichas abre desde el inicio.

## 5. API de estado v2

`window.StudyStore` conserva toda la API actual. Se añade `StudyStore.SCHEMA_VERSION = 2` y el espacio `StudyStore.<colección>` descrito abajo. Todos los métodos son síncronos, devuelven copias y escriben con la misma cola defensiva del store.

### Estado

```js
{
  version: 2,                 // esquema del estado (no cambia el nombre de la clave)
  schemaVersion: 2,
  createdAt, updatedAt,
  resetAt: null,              // sello del último borrado total; invalida estados previos de otra pestaña

  // legado intacto
  sheets, cards, sessions, activity, goals, history, last, flashSession,

  // colecciones nuevas: mapas por id, con tombstones
  annotations: {},
  doubts: {},
  sheetConfidence: {},
  sheetReview: {},
  recall: {},
  userCards: {},
  plan: null,                 // un registro único {id:"plan", ...}; null si no hay plan
  weekly: {},
  factsKnown: {}
}
```

- **No se alteran** las cajas de repaso (`cards`) ni el significado de `sheets`. Lo nuevo guarda contadores propios.
- Migración v1→v2 aditiva: todo el estado v1 se conserva tal cual; las colecciones nuevas nacen vacías. `version` pasa a 2 y se escribe `schemaVersion:2`. No se borra nada durante la migración.
- Cada registro nuevo incluye `id`, `createdAt`, `updatedAt` y `deleted` (booleano). Los borrados son lógicos. `mergeStates` resuelve por `updatedAt`; a igualdad, gana `deleted:true`.
- `resetAt` más reciente gana: un estado anterior a un borrado total no puede resucitar el progreso al fusionarse entre pestañas.
- Escritura segura: antes de un borrado total o una importación se guarda una copia de seguridad en `study-backup-preclear-v1` / `study-backup-preimport-v1`. Si no se puede guardar, la operación se cancela.
- El snapshot `studyhub:snapshot:v1` se sigue escribiendo con el mismo formato; el HUB no debe notar la migración.

### Formas de registro

```js
Annotation = {
  id, sheetId, sectionIndex, sectionTitle, paragraphIndex, color,
  quote, prefix, suffix, note,
  createdAt, updatedAt, deleted: false
}
// color: "important" | "understand" | "review" | "doubt"

Doubt = {
  id, sheetId, sectionIndex, paragraphIndex, quote, note,
  annotationId: null, resolvedAt: null,
  createdAt, updatedAt, deleted: false
}

Confidence = {
  id: sheetId, sheetId, value: "solid" | "partial" | "weak",
  createdAt, updatedAt, deleted: false
}

SheetReview = {
  id: "review-" + sheetId, sheetId,
  dueAt, intervalDays, lastReviewedAt, source: "confidence" | "spaced",
  createdAt, updatedAt, deleted: false
}

Recall = {
  id, sheetId, cardId, sectionIndex,
  question, answer, rating: "again" | "hard" | "good" | "easy" | "skipped",
  createdAt, updatedAt, deleted: false
}

UserCard = {
  id, sheetId, front, back, source: "annotation" | "manual", annotationId,
  createdAt, updatedAt, deleted: false
}

Plan = {
  id: "plan", examDate: "YYYY-MM-DD" | null,
  minutesPerDay: 0..1440, daysPerWeek: 1..7,
  areaPriority: { [areaId]: número > 0 },  // Fase 2; default {}
  createdAt, updatedAt, deleted: false
}

Weekly = { id: "YYYY-Www", weekStart: "YYYY-MM-DD", createdAt, updatedAt, deleted: false, ... }
FactKnown = { id: factId, factId, known: boolean, createdAt, updatedAt, deleted: false }
```

### Métodos nuevos

```js
StudyStore.annotations = {
  list({sheetId, color, includeDeleted} = {}),  // orden updatedAt desc
  get(id), add(data), update(id, patch), remove(id)
};
StudyStore.doubts = {
  list({sheetId, resolved, includeDeleted} = {}),
  get(id), add(data), update(id, patch), resolve(id), reopen(id), remove(id)
};
StudyStore.sheetConfidence = {
  get(sheetId), set(sheetId, value), clear(sheetId), list()
};
StudyStore.sheetReview = {
  get(sheetId), save(schedule), due(at), list(), remove(sheetId)
};
StudyStore.recall = {
  list({sheetId, includeDeleted} = {}), add(data), remove(id)
};
StudyStore.userCards = {
  list({sheetId, includeDeleted} = {}), get(id), add(data), update(id, patch), remove(id)
};
StudyStore.plan = {
  get(), save({examDate, minutesPerDay, daysPerWeek, areaPriority}), remove()
};
StudyStore.weekly = {
  get(weekStart), save(record), list(limit)
};
StudyStore.factsKnown = {
  get(factId), set(factId, known), listKnown()
};
```

Mutaciones:

- `add()` valida campos mínimos, recorta espacios, genera `id` con prefijo estable (`ann-`, `doubt-`, `ucard-`, `recall-`), completa `createdAt/updatedAt` y `deleted:false`, y devuelve el registro copiado.
- `update()` no permite cambiar `id`, `createdAt` ni `deleted`; sella `updatedAt`.
- `remove()` escribe el tombstone (`deleted:true`, `updatedAt`) y lo devuelve.
- Las listas excluyen tombstones por defecto.
- `sheetConfidence.set(sheetId, value)` acepta solo los tres valores; `clear` escribe tombstone.
- `sheetReview.save(schedule)` exige `sheetId` y `dueAt` válido; `source` por defecto `confidence`.
- `plan.remove()` escribe un tombstone; `get()` devuelve `null` si no hay plan vivo.

### Exportar / importar / borrar

```js
StudyStore.exportProgress() -> {
  format: "serums-study-progress",
  schema: 2,
  app: "study-dashboard",
  appVersion: "2.3.0",
  contentVersion: StudyContent.version,
  exportedAt: "ISO",
  state: { ...copia completa del estado... }
}

StudyStore.previewImport(raw) -> {
  ok: boolean,
  errors: [string],
  warnings: [string],
  summary: {
    exportedAt, appVersion, contentVersion,
    sheets, completedSheets, favorites, cardsReviewed, sessions,
    annotations, doubts, userCards, recalls, hasPlan, factsKnown
  }
}

StudyStore.importProgress(raw, {mode: "merge" | "replace", confirmReplace: false})
  -> { ok, mode, summary, safetyCopy: true }
```

- `raw` es el objeto JSON ya parseado; el lector de archivos lo valida antes.
- `previewImport` no muta el estado ni escribe almacenamiento.
- `importProgress` siempre llama a la validación y exige `confirmReplace:true` cuando `mode:"replace"`.
- La importación por defecto es **merge aditivo**. Los tombstones cuentan al fusionar.
- Antes de escribir se crea la copia de seguridad de la operación; si falla, no se importa.
- El estado importado conserva `cards`, `sheets` y todas las claves legado.
- El archivo no ejecuta código: se parsea con `JSON.parse` y se valida estructura/tipos. Límite prudente: 12 MB de archivo.

```js
StudyStore.clearAllProgress({confirm: true}) -> { ok, safetyCopy: true, at }
StudyStore.getBackupStatus() -> {
  hasActivity, due, neverExported, lastExportAt, daysSinceExport
}
StudyStore.markBackupExported(at?)
StudyStore.snoozeBackupReminder()
```

- `clearAllProgress` exige `confirm:true`; la doble confirmación es de la interfaz. Crea copia de seguridad, fija `resetAt`, vacía las colecciones y el progreso legado y reescribe el snapshot en cero. No borra el tema, el modo de lectura ni la preferencia de movimiento.
- El recordatorio de respaldo se muestra como máximo una vez cada 7 días en Panel/Progreso, solo si hay actividad, y se puede posponer. Metadatos en `study-backup-meta-v1` (fuera del estado y fuera del archivo exportado).
- La UI de respaldo vive en `#/respaldo` y usa `docs/preview` no; es una ruta real, no un diálogo improvisado.

## 6. Contenido derivado (lazy)

`tools/build-derived.js` genera de forma determinista, desde `study-data/temario.js`:

```
study-data/derived/manifest.json      # versión, fecha, tamaños, conteos, hashes
study-data/derived/search.json        # índice de búsqueda sin acentos
study-data/derived/glossary.json
study-data/derived/facts.json
study-data/derived/warnings.json
study-data/derived/related.json
study-data/derived/report.json        # validación: incluidos, descartados y motivo
```

Reglas:

- Nada se inventa: cada entrada apunta a `sheetId`, `sectionIndex` y `paragraphIndex`/tabla reales. Una definición que no está en el texto no se publica.
- La búsqueda normaliza mayúsculas y diacríticos; el resultado guarda un fragmento y el índice de párrafo para resaltar y saltar.
- Ningún archivo derivado se carga al arrancar. Se cargan al enfocar/usar la búsqueda o al abrir la vista que los necesita, una sola vez por sesión.
- `StudyDerived.load(name)` devuelve una promesa cacheada; `StudyDerived.get(name)` devuelve lo cargado o `null`; `StudyDerived.state()` devuelve `idle|loading|ready|error`.
- El generador no necesita dependencias npm, no escribe fuera de `study-data/derived/` y falla con código 1 si la validación estructural no cuadra.
- `report.json` debe declarar cuántas entradas se generaron, cuántas se descartaron y por qué.

## 7. Diseño 2.3 y tokens

Se conserva ámbar sobre negro, papel claro, Inter + Zen Dots, rejilla, anillos cónicos, bordes finos y versalitas espaciadas. Todo componente nuevo debe verse nativo del producto, no un añadido.

- Duraciones: `--t-fast` 140 ms, `--t-base` 220 ms, `--t-slow` 420 ms. No inventar duraciones decorativas.
- Radios: `--r-xs/sm/md/lg/xl/full`. No añadir radios fuera de la escala sin justificación.
- Espaciado base 4/8/12/16/24/32/48/64. Las vistas nuevas usan `clamp()` para los bloques grandes.
- Tema claro y oscuro con la misma jerarquía; nada de `#fff` fijo para texto/iconos.
- `prefers-reduced-motion` respetado en toda animación nueva.
- En puntero grueso, controles nuevos ≥44 px; los controles existentes del lector suben a 44 px sin romper la appbar.
- La appbar móvil no recibe iconos nuevos. El botón **Más** reutiliza el espacio de acciones secundarias y su panel contiene Flashcards, Inicio, HUB, pantalla completa y tema. Los destinos nuevos se ofrecen desde el Panel y la paleta cuando existan. La barra móvil debe quedar en 5 controles visibles como máximo (marca, 3 destinos, Más).

### Tokens añadidos a `study-shared/base.css` (propiedad del Agente 6)

```css
--mark-important, --mark-important-bg, --mark-important-line, --mark-important-ink
--mark-understand, --mark-understand-bg, --mark-understand-line, --mark-understand-ink
--mark-review,   --mark-review-bg,   --mark-review-line,   --mark-review-ink
--mark-doubt,    --mark-doubt-bg,    --mark-doubt-line,    --mark-doubt-ink
--target-min: 44px
--z-appbar, --z-sheet, --z-popover, --z-modal, --z-toast
```

- `*-ink` es para texto sobre `*-bg`; el color principal `--mark-*` es para iconos, bordes y puntos. Ambos temas deben alcanzar texto ≥4,5:1 y elementos gráficos ≥3:1.
- Los subrayados nunca dependen solo del color: llevan etiqueta textual (Importante/Entender/Repasar/Duda), patrón de borde o icono.
- El resaltado del texto mantiene el contraste del texto original; el color de marca actúa en fondo translúcido, borde y etiqueta.

## 8. Accesibilidad y QA

- 0 violaciones axe en todas las rutas reales, ambos temas, 390 y 1440 px.
- Nombres accesibles dinámicos en los botones del lector móvil. La tabla desplazable es enfocable (`tabindex="0"`, `role="region"`, `aria-label`).
- Marca: el nombre accesible contiene el texto visible («SERUMS STUDY, Dashboard de estudio, inicio»).
- Números decorativos (`01`, `02`…) con `aria-hidden="true"` o contraste suficiente si aportan información.
- Diálogos/popovers: foco gestionado, `Esc`, retorno al disparador, fondo `inert` cuando corresponda.
- Pruebas: `tools/qa/contraste.mjs`, `tools/qa/run-qa.mjs`, suite `tests/e2e` DASH-10+.
- Comandos de referencia (desde la raíz):

```powershell
node tools/build-derived.js
node --test "study-dashboard/tests/data/**/*.test.js"
node --test "study-dashboard/tests/unit/plan/**/*.test.mjs"
& 'C:\Users\USARIO\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe' tests/e2e/run.mjs --suite=dash,flash --quick
```

## 9. Supuestos de la Fase 0

1. La app se sirve desde la raíz del repositorio por HTTP; no se soporta `file://` para compartir progreso.
2. Se puede tocar Study Flashcards solo en la query de caché y en pruebas, nunca en su lógica.
3. Los índices derivados se descargan bajo demanda; la portada debe seguir funcionando sin ellos.
4. Los componentes de lectura activa y navegación de la Fase 0 se entregan como biblioteca + previsualizador; su integración pública es la Fase 1.
5. El contenido clínico no se amplía ni se corrige en este proyecto.
6. La copia de seguridad previa a operaciones destructivas es una red de seguridad, no una funcionalidad de restauración en la interfaz.

---

© 2026 ZARCONT — Documento interno del proyecto.
