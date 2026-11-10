# Fase 0 · Datos, persistencia y contenido derivado

**Agente:** 2 · Datos, persistencia y contenido derivado
**Fecha:** 9 nov 2026 · **Producto:** Study Dashboard 2.3.0 (`Study Dashboard · Estudio activo`)
**Ámbito:** `study-shared/store.js`, `study-dashboard/js/data/*`, `study-dashboard/css/data.css`,
`tools/build-derived.js`, `study-data/derived/*` y `study-dashboard/tests/data/*`.
**No se modificaron** `study-dashboard/app.js`, `index.html`, `styles.css`, `study-shared/base.css`,
`study-shared/ui.js`, `tests/e2e/*` ni Study Flashcards.

---

## 1. Resumen ejecutivo

Se entregaron los tres bloques de la Fase 0:

1. **Store v2 seguro y compatible.** `StudyStore` conserva la API, la clave `study-state-v1` y
   `study-serums` v1; migra v1→v2 sin pérdida, incorpora tombstones, `resetAt` y las nueve
   colecciones nuevas, y añade exportar/importar/borrar con copia de seguridad y las mismas
   garantías para Study Flashcards.
2. **Ruta real `#/respaldo`.** Módulo `backup` registrado con `StudyApp.registerModule`, página
   editorial en ambos temas, exportación, importación con vista previa y modos fusionar/reemplazar,
   borrado en dos pasos, recordatorio de 7 días en portada/progreso y foco/Esc/teclado.
3. **Contenido derivado lazy.** `tools/build-derived.js` genera siete archivos desde `temario.js`
   en sandbox `vm`; `StudyDerived` los carga bajo demanda por HTTP. Nada se baja al arrancar.

**Verificación principal:** 15/15 pruebas Node del store, 18/18 comprobaciones del smoke HTTP
(Chrome headless, arnés `tests/e2e/lib`), 0 violaciones axe en la ruta real (ambos temas,
1440 y 390), y compatibilidad sin errores con Study Dashboard y Study Flashcards reales.

---

## 2. Archivos creados o modificados

| Archivo | Estado | Contenido |
|---|---|---|
| `study-shared/store.js` | modificado | Esquema v2, migración, tombstones, `resetAt`, API nueva, exportar/importar/borrar, metadatos de respaldo, H13 |
| `study-dashboard/js/data/backup.js` | nuevo | Módulo `backup` de `#/respaldo` y recordatorio |
| `study-dashboard/js/data/derived-loader.js` | nuevo | `window.StudyDerived` (carga bajo demanda) |
| `study-dashboard/css/data.css` | nuevo | Estilos bajo `.data-*`, sin selectores globales |
| `tools/build-derived.js` | nuevo | Generador determinista sin dependencias |
| `study-data/derived/manifest.json` | generado | Versión, fecha, tamaños, hashes y conteos |
| `study-data/derived/search.json` | generado | Índice de búsqueda sin acentos |
| `study-data/derived/glossary.json` | generado | Definiciones explícitas del texto |
| `study-data/derived/facts.json` | generado | Filas de tabla con datos numéricos |
| `study-data/derived/warnings.json` | generado | Avisos, distinciones y precauciones |
| `study-data/derived/related.json` | generado | Relaciones con término compartido en el texto |
| `study-data/derived/report.json` | generado | Incluidos, descartados, motivos y validación |
| `study-dashboard/tests/data/helpers.js` | nuevo | Arnés Node con `vm`, localStorage/document simulados |
| `study-dashboard/tests/data/store.test.js` | nuevo | 15 pruebas del store v2 |
| `study-dashboard/tests/data/fixtures/v1-state.json` | nuevo | Fixture real v1 extraído de AUDIT |
| `study-dashboard/tests/data/fixtures/README.md` | nuevo | Procedencia del fixture |
| `study-dashboard/tests/data/smoke.html` | nuevo | Arnés de humo con StudyApp mínimo |
| `study-dashboard/tests/data/smoke.mjs` | nuevo | Smoke Chrome/HTTP usando `tests/e2e/lib` |
| `study-dashboard/docs/PEDIDOS.md` | fila añadida | Integración de `index.html` (ya aplicada por el Coordinador) |
| `study-dashboard/docs/INFORME-FASE0-DATOS.md` | nuevo | Este informe |

`study-dashboard/index.html` ya incorpora, por el Coordinador, `css/data.css`, `js/data/backup.js`
y los huecos `[data-module-mount="backup-reminder"]`; no fue editado por este agente.

---

## 3. Store v2

### 3.1 Estado

```js
{
  version: 2,
  schemaVersion: 2,
  createdAt, updatedAt, resetAt,
  sheets, cards, sessions, activity, goals, history, last, flashSession, // legado intacto
  annotations, doubts, sheetConfidence, sheetReview,
  recall, userCards, plan, weekly, factsKnown
}
```

- `StudyStore.SCHEMA_VERSION === 2`.
- La misma clave `study-state-v1`, la misma base `study-serums` y `DB_VERSION = 1`.
- El snapshot del HUB conserva **`version: 1`**: cambia el esquema del estado, no el snapshot.
- `resetAt` es el sello ISO del último borrado total; `null` si nunca se borró.

### 3.2 Migración v1→v2

`normalize()` es aditiva: copia `sheets`, `cards` (cajas de repaso sin tocar), `sessions`,
`activity`, `goals`, `history`, `last` y `flashSession` tal como están y crea las colecciones
nuevas vacías. No se elimina progreso durante la migración. El fixture real de prueba está
documentado en `study-dashboard/tests/data/fixtures/README.md`.

### 3.3 Fusión, tombstones y `resetAt`

- Cada registro nuevo lleva `id`, `createdAt`, `updatedAt` y `deleted`.
- `mergeStates()` fusiona por id; a mayor `updatedAt` gana. **Un tombstone nunca pierde**: si
  cualquiera de las dos versiones está borrada, el resultado queda borrado. Es más estricto que
  «a igualdad gana deleted:true» y cumple «nunca resucita un registro borrado».
- Si un estado tiene `resetAt` más reciente, el estado con sello más antiguo solo aporta registros
  nuevos escritos **después** del sello. Su progreso legado (sin marcas por registro) se descarta:
  no puede resucitar fichas, tarjetas, sesiones, actividad, historial ni `flashSession` anteriores
  al borrado. Lo escrito después del borrado en otra pestaña sí se conserva en las colecciones.
- `pickNewer()` compara primero `resetAt` y después `updatedAt` para cargar, sincronizar entre
  pestañas y fusionar.

### 3.4 API implementada

Todas las mutaciones son síncronas, devuelven copias y escriben con la cola del store. Un valor
inválido devuelve `null` (no lanza).

```js
StudyStore.annotations = {
  list({sheetId, color, includeDeleted} = {}), // updatedAt desc
  get(id), add(data), update(id, patch), remove(id)
};
StudyStore.doubts = {
  list({sheetId, resolved, includeDeleted} = {}),
  get(id), add(data), update(id, patch), resolve(id), reopen(id), remove(id)
};
StudyStore.sheetConfidence = { get(sheetId), set(sheetId, value), clear(sheetId), list() };
StudyStore.sheetReview = { get(sheetId), save(schedule), due(at), list(), remove(sheetId) };
StudyStore.recall = { list({sheetId, includeDeleted} = {}), add(data), remove(id) };
StudyStore.userCards = { list({sheetId, includeDeleted} = {}), get(id), add(data), update(id, patch), remove(id) };
StudyStore.plan = { get(), save({examDate, minutesPerDay, daysPerWeek}), remove() };
StudyStore.weekly = { get(weekStart), save(record), list(limit) };
StudyStore.factsKnown = { get(factId), set(factId, known), listKnown(), list() };
```

Decisiones concretas:

- `get()` devuelve `null` para tombstones; las listas los excluyen salvo `includeDeleted:true`.
- `update()` ignora `id`, `createdAt` y `deleted` (no se puede borrar ni cambiar identidad por patch).
- `remove()` devuelve el tombstone; un segundo `remove()` devuelve `null`.
- `factsKnown.listKnown()` devuelve **ids** de hechos marcados como conocidos (además, `list()`
  devuelve los registros completos).
- `weekly.list(limit)` devuelve todo si se omite `limit`; `weekly.get()` acepta `YYYY-MM-DD` o
  `YYYY-Www`.
- `sheetReview.due(at)` acepta una fecha ISO; sin argumento usa ahora.
- `plan.save()` es un upsert; `plan.remove()` escribe tombstone y `get()` devuelve `null`.
- Los ids generados usan prefijos estables: `ann-`, `doubt-`, `recall-`, `ucard-`, `review-<sheetId>`.

### 3.5 Eventos

`notify()` conserva `study:change` con `{state, snapshot, change}` y añade `store:change` con
`{change}`. Las mutaciones nuevas emiten además, por DOM y por `StudyApp.events` cuando existe:

| Evento | Detalle |
|---|---|
| `annotation:changed` | `{id, action}` (`add`, `update`, `remove`) |
| `doubt:changed` | `{id, action}` (`add`, `update`, `resolve`, `reopen`, `remove`) |
| `confidence:changed` | `{sheetId, value}` (`value:null` al borrar) |
| `review:changed` | `{sheetId}` |
| `plan:changed` | `{plan}` o `{plan:null}` |
| `backup:changed` | `{action}` (`export`, `import`, `clear`, `snooze`) |
| `progress:cleared` | `{at}` |

`app.js` ya traduce `store:change` a su bus; los eventos específicos se emiten también en el bus
si `StudyApp.events` está disponible.

### 3.6 Exportar, importar y borrar

- `exportProgress()` devuelve
  `{format:"serums-study-progress", schema:2, app:"study-dashboard", appVersion:"2.3.0",
  contentVersion, exportedAt, state}`. No incluye metadatos de respaldo.
- `previewImport(raw)` acepta objeto o cadena, mide bytes, valida estructura y tipos, y **no muta
  estado ni escribe almacenamiento**. Devuelve `{ok, errors, warnings, summary}`.
- `importProgress(raw, {mode, confirmReplace})` valida siempre, exige `confirmReplace:true` para
  `replace`, guarda `study-backup-preimport-v1` antes de escribir y conserva todas las claves legado.
  Si la copia de seguridad falla, la importación se cancela.
- `clearAllProgress({confirm:true})` guarda `study-backup-preclear-v1`, fija `resetAt`, vacía
  legado y colecciones, reescribe el snapshot en cero y conserva tema, modo de lectura y
  preferencia de movimiento (fuera del estado). También conserva `goals.dailySheets` por ser una
  preferencia, no progreso.
- Límite de archivo: **12 MB**; se comprueba antes de leer y en el store.
- Un JSON dañado devuelve errores claros; nunca lanza una excepción sin control.

### 3.7 Recordatorio de respaldo

`getBackupStatus()` devuelve `{hasActivity, due, neverExported, lastExportAt, daysSinceExport,
lastSnoozeAt, daysSinceSnooze}`. Metadatos en `study-backup-meta-v1`, fuera del estado y del JSON.
El recordatorio vence a los 7 días, solo si hay actividad real, y `markBackupExported` /
`snoozeBackupReminder` lo actualizan. **No se exporta**.

### 3.8 H13 · historial sin duplicados

`pushHistory()` elimina cualquier entrada previa con el mismo `type+id` antes de insertar la nueva;
`mergeHistory()` aplica la misma deduplicación al fusionar pestañas y desempata por orden de
llegada cuando dos vistas caen en el mismo milisegundo. El tope sigue en 60. Prueba incluida:
dos vistas de la misma ficha dejan una sola entrada y la más reciente queda arriba.

### 3.9 Compatibilidad con Study Flashcards

Se conservan todos los métodos usados por `study-flashcards/app.js` (`init`, `getState`,
`recordReview`, `startSession`, `recordSessionAnswer`, `finishSession`, `updateFlashSession`,
`getDeckStats`, `getDueCards`, `getErrorCards`, `getDashboardStats`, etc.). `getState()` sigue
devolviendo la referencia viva por compatibilidad histórica; el resto de métodos nuevos devuelve
copias. Probado en Chrome real: sesión, calificación «again», `cards` y `flashSession` funcionan
sin errores.

### 3.10 Garantías para el modelo de plan (Fase 2)

Pedido del Agente 4, verificado con pruebas propias:

- `plan.save({minutesPerDay: 0})` conserva **0** como valor explícito; `plan.save()` parcial,
  recarga desde `study-state-v1` y `plan.get()` siguen devolviendo `0`, nunca 6 ni `null`.
  `plan.get()` devuelve `null` únicamente cuando no hay plan vivo.
- `activity[día].seconds` se escribe con la primera `recordSheetView(..., {seconds})` y se acumula
  con cada `recordSheetTime()`; los cierres de ficha suman y las vistas posteriores no duplican la
  lectura. Persiste en `study-state-v1` y no toca las cajas de `cards`.

---

## 4. UI de respaldo (`#/respaldo`)

### 4.1 Integración ya presente

El Coordinador añadió en `index.html`:

```html
<link rel="stylesheet" href="css/data.css?v=2.3.0">
...
<script src="app.js?v=2.3.0"></script>
<script src="js/data/backup.js?v=2.3.0"></script>
```

y los huecos `<div data-module-mount="backup-reminder"></div>` en Panel y Progreso. La ruta
`#/respaldo` ya responde en la app real con `document.title = "Respaldo y datos · Study Dashboard"`.

### 4.2 Página

La ruta contiene cuatro tarjetas:

1. **Salud del respaldo:** estado (sin actividad, sin copia, copia al día, toca actualizar),
   última exportación, recomendación y mini-resumen (fichas completadas, tarjetas repasadas,
   subrayados, dudas abiertas, tarjetas propias y plan).
2. **Exportar:** descarga `study-dashboard-progreso-YYYY-MM-DD.json`, confirma con toast y
   región `aria-live`, marca la exportación y actualiza la tarjeta de salud.
3. **Importar:** zona de arrastrar/soltar con input real, vista previa con conteos, avisos de
   versión de contenido, radios Fusionar/Reemplazar, Cancelar y confirmación adicional para
   reemplazar. Se parsea con `JSON.parse`; nunca se ejecuta código.
4. **Borrar:** dos diálogos consecutivos. El primero explica qué se pierde y qué se conserva; el
   segundo exige marcar «Entiendo…» y habilita «Borrar definitivamente». Cancelar está enfocado
   por defecto. Al terminar navega a `#/respaldo`, anuncia y conserva tema/modo.

Estados vacío/cargando/error/éxito cubiertos; los errores del store se muestran escapados.

### 4.3 Accesibilidad y responsive

- Esc cierra diálogos; foco atrapado en el diálogo y devuelto al disparador.
- Fondo `inert` mientras hay diálogo.
- `aria-live` para exportación/importación/borrado; `role="status"` y `role="alert"`.
- Foco visible propio del módulo; el input de archivo es real y se puede operar con teclado
  (label + input visualmente oculto con foco en el contenedor).
- Targets ≥44 px en puntero grueso (el smoke midió 44/44/44).
- `prefers-reduced-motion` desactiva animaciones/transiciones del módulo.
- Sin scroll horizontal en 360/390/768/1024/1440 y ambos temas (medido por el smoke).
- 0 violaciones axe en la ruta real, ambos temas, 1440 y 390.

### 4.4 Recordatorio

`onRoute` monta `[data-module-mount="backup-reminder"]` solo si `route.name` es `home` o `progress`
y `getBackupStatus().due` es verdadero. Muestra una tarjeta discreta con **Exportar** y **Ahora no**
(pospone). No es modal, no bloquea y usa `role="region"`. En cualquier otra ruta se retira.

### 4.5 Snippet de integración (referencia)

```html
<!-- en <head>, después de styles.css -->
<link rel="stylesheet" href="css/data.css?v=2.3.0">

<!-- al final del body, DESPUÉS de app.js (StudyApp ya expuesto) -->
<script src="js/data/backup.js?v=2.3.0"></script>

<!-- opcional, solo si la búsqueda o las vistas lo usan; no se descarga al arrancar -->
<script src="js/data/derived-loader.js?v=2.3.0"></script>
```

```html
<!-- dentro de #view-root de Panel y de Progreso, antes del contenido -->
<div data-module-mount="backup-reminder"></div>
```

Si por orden de carga `StudyApp` no existiera, `backup.js` no lanza; queda
`window.StudyDataBackup.register()` disponible para registrar cuando la app esté lista.

---

## 5. Contenido derivado lazy

### 5.1 Generador

`node tools/build-derived.js` lee `study-data/temario.js` con `vm.createContext({window:{}})` y
`vm.runInContext(...)` (sin `eval`, sin dependencias). No escribe fuera de `study-data/derived/`.
Valida referencias a ficha/sección/párrafo/fila antes de escribir y sale con código 1 si falla.
La fecha `generatedAt` procede de la `mtime` de `temario.js` para que dos ejecuciones sobre la misma
fuente produzcan exactamente los mismos bytes (comprobado con SHA-256).

### 5.2 Archivos y tamaños

| Archivo | Bytes | Contenido |
|---|---:|---|
| `search.json` | 2.378.627 | 10.014 entradas normalizadas |
| `glossary.json` | 29.306 | 57 definiciones |
| `facts.json` | 100.641 | 261 datos de tabla |
| `warnings.json` | 188.418 | 451 avisos/precauciones |
| `related.json` | 102.225 | 116 vínculos entre 210 fichas |
| `report.json` | 4.524 | Incluidos/descartados y validación |
| `manifest.json` | 1.969 | Versión, fecha, tamaños, hashes y conteos |
| **Total** | **2.805.710** | Los datos suman 2.803.741; el resto es el manifiesto |

El temario son 2.587.623 B. El índice de búsqueda es 2,38 MB (92 % del temario) porque guarda el
texto normalizado de cuerpo, títulos, conceptos, viñetas, tablas y avisos; los derivados se cargan
solo bajo demanda y por archivo, nunca al arrancar. `search.json` va compacto (sin indentación)
para no inflar el JSON; `report.json` y `manifest.json` van legibles.

### 5.3 Búsqueda

Cada entrada: `{k, sid, s, p, t, f}`.

- `k`: `m` título de ficha, `y` resumen, `s` título de sección, `p` párrafo, `b` viñeta,
  `t` fila de tabla, `w` callout, `c` concepto clave.
- `sid`, `s` (índice de sección o `-1`) y `p` (índice de párrafo/viñeta/fila/concepto o `-1`).
- `t`: texto normalizado NFD, minúsculas y solo `a-z0-9`; **cero acentos** en todo el archivo.
- `f`: fragmento con acentos para mostrar. En títulos y entradas >140 caracteres se conserva; en
  entradas cortas va vacío y el consumidor usa `t` (ver `StudyDerived.fragment(entry)`).

### 5.4 Glosario, datos, avisos y relacionadas

- **Glosario:** solo definiciones explícitas. Se extraen de tablas con cabeceras
  `Definición / Significado / Qué designa / Desarrollo` y de párrafos de secciones
  `Qué es… / Qué significa… / Definición…` con patrones `X es…`, `define X como…`,
  `X abarca…`. Se descartaron 15 párrafos sin patrón y 2 viñetas que no eran definiciones.
  No se publican definiciones inferidas.
- **Datos:** filas de tabla con al menos un número, con `term`, `detail`, `headers`, ficha,
  sección y fila. Se descartaron 1.028 filas sin datos numéricos.
- **Avisos:** callouts `warn/warning` y callouts informativos con título de precaución; viñetas
  `Distinción: …`; y frases del cuerpo con `no se debe / nunca / contraindicad / no administrar /
  no indicar / no usar`. Se descartaron 130 callouts informativos y 3.777 viñetas que no eran
  distinciones. Las 358 distinciones son explícitas y llevan `source:"bullet"` para que una vista
  pueda filtrarlas si prefiere solo avisos de callout.
- **Relacionadas:** solo dentro del mismo tema. Se publican 116 vínculos, todos con evidencia de un término compartido en títulos de sección
  (con `sectionIndex` de ambas fichas). Las parejas del mismo tema sin término compartido (525) y
  las parejas entre temas (21.420) se descartan porque no tienen evidencia textual directa. Se
  limitan a 4 por ficha; 22 vínculos adicionales se truncaron y el `report.json` lo declara.

### 5.5 Cargador

`js/data/derived-loader.js` (no incluido en `index.html` hasta que se integre la búsqueda):

```js
StudyDerived.load("glossary").then(function (data) { /* … */ });
StudyDerived.get("glossary");      // datos o null
StudyDerived.state();              // idle | loading | ready | error
StudyDerived.state("search");      // estado por archivo
StudyDerived.fragment(entry);      // entry.f || entry.t
StudyDerived.reset();              // limpia la caché de sesión
```

Calcula la base desde `document.currentScript` (capturado al cargar) y cae a
`../study-data/derived/` desde la URL de la página. Usa `fetch` relativo con
`credentials:"same-origin"`, cachea la promesa por nombre y no descarga nada hasta que se llama.
Un fallo deja `state === "error"`; un reintento posterior vuelve a intentarlo.

---

## 6. Pruebas y verificación

### 6.1 Comandos ejecutados

```powershell
node --test study-dashboard/tests/data
node study-dashboard/tests/data/smoke.mjs
node tools/build-derived.js
node --test study-dashboard/tests/unit
node -e "..."  # comprobación de determinismo de los siete archivos
```

### 6.2 Resultados

| Prueba | Resultado |
|---|---|
| Store v2 (15 pruebas Node) | **PASS 15/15** |
| Smoke Chrome/HTTP de `#/respaldo` y loader | **PASS 18/18** |
| App real `#/respaldo` (Chrome, servidor HTTP) | PASS: título, 4 tarjetas, exportar, recordatorio, sin errores |
| Axe en app real (oscuro/claro × 1440/390) | **0 violaciones** |
| Study Dashboard real tras migración | PASS: cargado, `version:2`, snapshot `version:1` |
| Study Flashcards real | PASS: sesión, «Mostrar respuesta», calificación, `cards` y `flashSession` |
| Plan existente (`tests/unit`) | PASS 84/84 (no modificado) |
| Generador determinista | PASS: los 7 archivos mantienen SHA-256 en dos ejecuciones |
| `node --check` de los 7 archivos JS propios | PASS |

Las 15 pruebas Node cubren: migración sin pérdida; API legado; CRUD/validación/copias/tombstones;
export→import ida y vuelta; merge de tombstones; `resetAt` entre pestañas; import inválido; entradas `__proto__`;
`clearAllProgress`; fallo de copia de seguridad; `minutesPerDay:0` del plan; acumulación de
`activity[día].seconds`; recordatorio de 7 días; H13; import de un estado v1 en sobre válido. El fixture v1 es real y su procedencia está en `fixtures/README.md`.

El smoke valida: cabecera, estructura, estado vacío, 360/390/768/1024/1440 × ambos temas sin
scroll horizontal, targets ≥44 px, recordatorio y «Ahora no», exportación (descarga interceptada),
vista previa con conteos, fusión, diálogo de reemplazo con foco en Cancelar y Esc, borrado en dos
pasos con casilla, carga bajo demanda de `glossary`/`search`, borrado final con ruta/tema/modo y
ausencia de excepciones/errores de red.

---

## 7. Supuestos y decisiones

1. **Tombstone absoluto.** Un registro borrado no se resucita aunque una versión viva tenga un
   `updatedAt` posterior; la API no permite desborrar y la fusión lo garantiza.
2. **`resetAt` con corte temporal.** De un estado anterior al borrado solo sobreviven registros
   nuevos con `updatedAt` posterior al sello. El legado sin marcas por registro se descarta.
3. **Reemplazo y `resetAt`.** Al importar en modo reemplazar se conserva el `resetAt` más reciente
   entre el estado actual y el archivo, para que una copia antigua no anule un borrado total
   reciente en otra pestaña. Los datos del archivo sí se aplican.
4. **`flashSession` al importar.** Si el estado local no tiene sesión activa, una importación
   explícita adopta la del archivo aunque su `updatedAt` sea anterior; sin esto se perdía la sesión
   de Flashcards al restaurar una copia. En la fusión normal entre pestañas se conserva la regla
   histórica de `updatedAt`.
5. **Snapshot `version:1`.** El HUB no debe notar la migración; su formato no cambia.
6. **Objetivos y metadatos de respaldo al borrar.** `clearAllProgress` conserva
   `goals.dailySheets` (preferencia) y `study-backup-meta-v1`; los últimos datos de exportación
   siguen siendo reales aunque ya no haya progreso.
7. **H13.** Se deduplica por `type+id` (fichas y sesiones), como pidió el Coordinador; una vista y
   una completación de la misma ficha siguen siendo eventos distintos.
8. **Derivados deterministas.** `generatedAt` es la `mtime` de `temario.js`, no la hora de la
   máquina, para que el build sea reproducible. Si se toca el temario, cambia la fecha y el hash.
9. **Alta precisión del glosario.** Se prefirió descartar 15 párrafos dudosos antes que publicar
   definiciones inventadas. Los datos salen de tablas estructuradas.
10. **Relacionadas solo intratema.** Las parejas entre temas no tienen una referencia textual
    directa; se descartan y se documenta el número.
11. **`f` vacío en búsqueda corta.** Para no duplicar texto corto, el fragmento con acentos solo se
    guarda en títulos y entradas >140 caracteres; el consumidor debe usar
    `StudyDerived.fragment(entry)` o `entry.f || entry.t`.
12. **UI de importación sin código.** El archivo se parsea con `JSON.parse`; no hay `eval`,
    `Function`, `innerHTML` de datos sin escapar ni carga remota.
13. **Garantías pedidas por el Agente 4 (Fase 2).** `plan.save({minutesPerDay:0})` conserva `0`
    como valor explícito (también al recargar) y `plan.get()` devuelve `null` solo si no hay plan
    vivo. `activity[día].seconds` se escribe en la primera vista con `meta.seconds`, se acumula con
    `recordSheetTime()` y se persiste en `study-state-v1`; una vista posterior no lo duplica.
    Ambas garantías tienen prueba Node propia.

---

## 8. Riesgos y limitaciones honestas

- **Fallo de escritura principal.** Si `localStorage`/IndexedDB falla justo al persistir el estado
  (no la copia de seguridad), `save()` mantiene el estado en memoria y no lanza; la UI no recibe un
  error específico. La copia previa sí es obligatoria y su fallo cancela la operación.
- **Cuota de almacenamiento.** Una copia de seguridad de un estado muy grande puede no caber en
  `localStorage`; en ese caso importar/borrar se cancela con error visible. La importación está
  limitada a 12 MB.
- **Descarga del archivo.** Depende de `Blob` + `URL.createObjectURL`; si el navegador embebido los
  bloquea, se muestra el error en la tarjeta y no se marca la exportación.
- **Recordatorio sin hueco.** Si el Coordinador no deja `[data-module-mount="backup-reminder"]` en
  Panel/Progreso, el módulo no lo inventa: simplemente no aparece.
- **Eventos del bus.** El store emite los eventos específicos por DOM y por `StudyApp.events` si
  existe. `app.js` ya traduce `store:change`; si en el futuro se añade otro puente, conviene no
  duplicar la suscripción.
- **Derivados no integrados en UI.** `js/data/derived-loader.js` no está en `index.html` (la tarea
  pedía no cargarlo al arrancar) y todavía no hay vista de búsqueda que lo consuma. El smoke lo
  prueba desde un arnés; su integración pública es de la fase de navegación/búsqueda.
- **Advertencias de derivados.** `warnings.json` incluye 358 distinciones explícitas además de los
  callouts; es contenido real, pero una vista puede querer filtrar `source:"bullet"` para mostrar
  solo avisos de callout.
- **Smoke propio.** Usa el arnés `tests/e2e/lib` sin modificarlo y un `smoke.html` con un
  `StudyApp` mínimo; además se ejecutó la app real con el Coordinador ya integrado. No se
  modificaron `tests/e2e` ni `app.js`.
- **No se avanzó de fase.** No se implementaron las rutas de Fase 1/2/3 ni la UI de búsqueda.

---

## 9. Coordinación pendiente

- `index.html` ya tiene CSS/módulo/huecos; **no requiere más cambios de este agente**.
- Cuando se integre la búsqueda/glosario/datos, añadir
  `<script src="js/data/derived-loader.js?v=2.3.0"></script>` (no antes de necesitarlo) y usar
  `StudyDerived.load(...)`/`fragment(...)`.
- Si el bus de `StudyApp` necesita los eventos específicos, ya se emiten; no hay que tocar el store.
- La fila añadida a `docs/PEDIDOS.md` quedó marcada como aplicada por el Coordinador.

---

© 2026 ZARCONT — Documento interno del proyecto.
