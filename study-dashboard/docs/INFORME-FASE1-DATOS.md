# Fase 1 · Datos y persistencia

**Agente:** 2 · Datos y persistencia
**Fecha:** 10 nov 2026 · **Producto:** Study Dashboard 2.3.0 (`Study Dashboard · Estudio activo`)
**Ámbito:** `study-shared/store.js` y `study-dashboard/tests/data/*`.
**No se modificaron** `app.js`, `index.html`, `styles.css`, `base.css`, `study-shared/ui.js`,
`study-shared/taxonomy.js`, `js/active/*`, `js/nav/*`, `js/plan/*`, `css/*`, `tests/e2e/*` ni
Study Flashcards. Los cambios necesarios en archivos ajenos quedan en `docs/PEDIDOS.md`.

---

## 1. Resumen ejecutivo

La Fase 0 se mantiene intacta y verde; la Fase 1 añade tres cosas, sin cambiar el esquema:

1. **Filtro por área de anotaciones.** `StudyStore.annotations.list({areaId})` resuelve las
   fichas del área desde `STUDY_CONTENT` (con o sin `taxonomy.js`) y filtra en memoria. El
   registro guardado **no gana ni cambia ningún campo**; se acepta el área heredada
   (`area-aps`), la primaria oficial (`area-psi-*`) y la del tema.
2. **Evento `recall:changed`.** `recall.add()` y `recall.remove()` emiten
   `{sheetId, id, rating}` por DOM y por `StudyApp.events`, igual que el resto de eventos v2.
3. **Volumen y fusión.** Se revisaron límites, tombstones y merge de las seis colecciones; se
   añadió un atajo interno que evita la fusión completa cuando el estado persistido es
   exactamente la última escritura de esta pestaña (146 → 12 ms por mutación con 2,74 MB, y
   315 ms de fusión omitida con 6,52 MB). Si otra pestaña escribió, la fusión completa sigue
   ejecutándose.

**Verificación principal:** `node --check` PASS; **25/25 pruebas Node** (15 de Fase 0 + 10
nuevas); smoke existente de respaldo **18/18 PASS**; smoke real en Chrome de Study Dashboard y
Study Flashcards sin excepciones ni errores de consola. No se avanzó a Fase 2.

---

## 2. Archivos creados o modificados

| Archivo | Estado | Contenido |
|---|---|---|
| `study-shared/store.js` | modificado | Filtro `areaId` con índice por contenido; `recall:changed`; atajo de fusión en `writeState`; cabecera de Fase 1 |
| `study-dashboard/tests/data/helpers.js` | modificado | Contenido real (temario + taxonomía) en `vm`, bus simulado, eventos DOM y `applyTaxonomy` |
| `study-dashboard/tests/data/fase1.test.js` | nuevo | 9 pruebas: área/color, evento, merge, export/import y Flashcards |
| `study-dashboard/tests/data/volume.test.js` | nuevo | 1 prueba de volumen alto (1.200 anotaciones, 3.000 recuerdos…) |
| `study-dashboard/docs/INFORME-FASE1-DATOS.md` | nuevo | Este informe |
| `study-dashboard/docs/PEDIDOS.md` | 3 filas añadidas | Alineación de `ACTIVE-CONTRATO`, caché de `store.js` e `INTEGRITY.sha256` |

`study-dashboard/tests/data/store.test.js` y el resto de pruebas de Fase 0 **no se tocaron**.

---

## 3. API v2 de Fase 1

### 3.1 `annotations.list({sheetId, color, areaId, includeDeleted})`

```js
StudyStore.annotations.list({ areaId: "area-psi-cuidado-integral" })
StudyStore.annotations.list({ areaId: "area-aps", color: "review" })
```

- **Resolución del área (solo lectura).** Se construye una vez un índice
  `área → {sheetId: true}` con `STUDY_CONTENT.sheets` y `STUDY_CONTENT.topics`. Cada ficha se
  registra bajo `sheet.primaryAreaId`, `sheet.legacyAreaId`, `sheet.areaId` y las equivalentes
  del tema (`topic.primaryAreaId`, `topic.legacyAreaId`, `topic.areaId`). Así el filtro funciona
  con la taxonomía de la app (`area-psi-*`), con las áreas heredadas (`area-aps`, `area-mci`…)
  y con contenido que solo declara el área en el tema.
- **Compatibilidad sin `taxonomy.js`.** Si la taxonomía no se ha aplicado, el filtro sigue
  resolviendo por `areaId` heredado y por tema; al aplicarse después, la clave de caché
  (versión, nº de fichas, nº de fichas enriquecidas, nº de áreas y categorías) cambia y el
  índice se reconstruye. Probado en `fase1.test.js`.
- **Semántica.** `areaId` se combina con AND con `sheetId` y `color`; `includeDeleted:true`
  incluye tombstones (también los filtra por área). Un `areaId` desconocido devuelve `[]`; un
  área vacía o ausente no filtra. El orden sigue siendo `updatedAt` descendente y las listas
  devuelven copias.
- **Sin cambios en los datos.** Ni `add`, ni `update`, ni la migración, ni el export escriben
  `areaId` dentro de la anotación. Verificado sobre el temario real: las listas devuelven los
  mismos registros antes y después de filtrar, las anotaciones no tienen campo `areaId` y el
  JSON persistido no contiene `area-psi` dentro de `annotations`; el contenido (temario y
  taxonomía) no se modifica.
- Los identificadores de área se sanean (`__proto__`, `constructor`, `prototype` no indexan).

### 3.2 `recall:changed`

```js
// add exitoso
{ sheetId: "sheet-aps-01", id: "recall-…", rating: "good" }
// remove exitoso (el tombstone conserva el rating)
{ sheetId: "sheet-aps-01", id: "recall-…", rating: "good" }
```

- Se emite **después** de `save()` y del `store:change` correspondiente, con el mismo doble
  canal que `annotation:changed`, `doubt:changed`, `confidence:changed`, `review:changed` y
  `plan:changed`: `window.dispatchEvent(new CustomEvent(...))` y
  `StudyApp.events.emit(name, detail)` si está disponible.
- El detalle lleva **exactamente** `sheetId`, `id` y `rating` (CONTRATOS-FASE1 §4.2). No se
  añade `action` ni `cardId`: el contrato fija la forma y la integración puede releer el
  registro. No se emite en `add` inválido ni en `remove` de un id inexistente.
- **Sin cambio de esquema:** `Recall` conserva `id, sheetId, cardId, sectionIndex, question,
  answer, rating, createdAt, updatedAt, deleted`. `add()` sigue generando el `id` (`recall-…`) y
  devolviendo el registro; un `id` enviado por el llamador se ignora (ver PEDIDOS).

### 3.3 Atajo de fusión (rendimiento, no cambia la semántica)

Antes, **cada** mutación llamaba a `mergeStates(state, persisted)`; esa fusión normaliza dos
veces el estado completo. Ahora `writeState` lee el JSON persistido y se salta la fusión solo
cuando coincide con la última escritura propia:

```js
lastWrite = { updatedAt, resetAt, length }  // se guarda solo si setItem tuvo éxito
isOwnLastWrite(persisted, raw)
  = persisted.updatedAt === lastWrite.updatedAt
  && (persisted.resetAt || null) === lastWrite.resetAt
  && raw.length === lastWrite.length
```

- Si **cualquier otra pestaña** escribió en `study-state-v1`, `updatedAt` (o la longitud) difiere
  y se ejecuta la fusión completa de siempre. Si `localStorage.setItem` falla, no se actualiza
  el sello y la próxima escritura vuelve a fusionar.
- `saveFresh` (importar, borrar, reset) también actualiza el sello; `syncFromStorage` no
  (la siguiente escritura fusiona, que es lo seguro).
- No cambia el formato guardado, el snapshot `studyhub:snapshot:v1`, la migración ni la API.

---

## 4. Volumen, operaciones y fusión

### 4.1 Límites y colecciones

Se mantienen `RECORD_LIMITS` (anotaciones 20.000, dudas 20.000, confianza 5.000, repaso
5.000, recuerdos 50.000, tarjetas propias 20.000, semanal 2.000, hechos 50.000) y los
tombstones de Fase 0. `add` devuelve `null` al llegar al tope (sin excepción), igual que
antes. La importación rechaza colecciones por encima del tope y el archivo de más de 12 MB.

### 4.2 Medición (Node sobre `localStorage` simulado, contenido real)

| Estado (anotaciones + recuerdos) | JSON | Mutación antes | Mutación ahora | `list()` | `list({areaId})` | `recall.list({sheetId})` |
|---|---:|---:|---:|---:|---:|---:|
| 500 + 2.000 | 1,05 MB | ~59 ms | **4,7–5,5 ms** | 1,3 ms | 1,2 ms | 4,3 ms |
| 2.000 + 5.000 | 2,74 MB | **145–152 ms** | **11,4–13,1 ms** | 4,5 ms | 4,8 ms | 10,4 ms |
| 5.000 + 12.000 | 6,52 MB | ~340 ms | **26–28 ms** | 12,5 ms | 12,7 ms | 26,0 ms |

- «Antes» = coste de `mergeStates` medido por separado (53,6 / 135,2 / 315,3 ms) más la
  serialización; a 2.000 + 5.000 se midió la mutación real antes del cambio (146–152 ms).
- `exportProgress` 4,6 / 10,8 / 25,4 ms; `previewImport` 33 / 79 / 195 ms;
  `importProgress(merge)` 100 / 245 / 598 ms. Exportar e importar normalizan y fusionan el
  estado completo: son operaciones de respaldo, no de cada clic.
- Las cifras son de Node con `localStorage` simulado; en navegador la escritura real es más
  lenta, pero el ahorro de la fusión (la parte dominante) se mantiene.

### 4.3 Operaciones revisadas

- **Listados y filtros:** `annotations` (sheet/color/área), `doubts` (sheet/resuelta),
  `confidence.list`, `sheetReview.due/list`, `recall` (sheet), `userCards` (sheet). Todos
  excluyen tombstones por defecto, ordenan por `updatedAt` descendente y devuelven copias.
- **Tombstones:** `remove`/`clear` siguen escribiendo `deleted:true` + `updatedAt`; un segundo
  borrado devuelve `null`; `get()` devuelve `null` para tombstones; la fusión conserva el
  tombstone aunque llegue una versión viva más nueva (regla absoluta de Fase 0).
- **Fusión entre pestañas:** probada con dos stores sobre el mismo `localStorage` para
  anotaciones, dudas, confianza, tarjetas propias, repaso y recuerdos; gana el `updatedAt` más
  reciente y el tombstone no resucita. También se probó de forma determinista importando dos
  estados exportados con fechas controladas (t1…t4).
- **Recarga:** las seis colecciones y sus tombstones sobreviven a `init()` desde
  `study-state-v1`. El volumen alto de la prueba (1.200 anotaciones, 3.000 recuerdos, 300 dudas,
  120 confianzas, 120 repasos, 600 tarjetas propias) tarda ~0,8–1,0 s en total, incluida la
  importación de su propio export.
- La confianza y el repaso conservan sus claves canónicas (`sheetId`, `review-<sheetId>`), de
  modo que la fusión por id sigue siendo determinista.

---

## 5. Exportar, importar y preferencias de lectura

- `exportProgress()` incluye las seis colecciones con sus tombstones y todas las claves legado;
  `previewImport` cuenta solo registros vivos en `summary` (anotaciones, dudas, tarjetas
  propias, recuerdos) e importa tombstones sin resucitarlos.
- `importProgress({mode:"replace"})` y `{mode:"merge"}` conservan `cards`, `sheets`, `sessions`,
  `flashSession` y el resto del legado; la copia previa `study-backup-preimport-v1` sigue siendo
  obligatoria.
- Las pruebas cubren ida y vuelta con tombstones en las seis colecciones, recarga desde
  almacenamiento y la importación de un sobre v1 real sin tocar `cards`.
- **Preferencias de lectura activa:** se confirma la decisión de Fase 1. `study-active-prefs-v1`
  es una clave **externa** (versionada por `js/active`), no es progreso y **no se implementa en
  el store ni se añade al esquema v2**. Prueba de contrato añadida: una clave
  `study-active-prefs-v1` sembrada en `localStorage` no aparece en `exportProgress()` ni en el
  estado, `clearAllProgress({confirm:true})` no la borra (como el tema o el modo de lectura) y
  una importación no la crea ni la modifica.

---

## 6. Pruebas y verificación

### 6.1 Comandos ejecutados

```powershell
node --check study-shared/store.js
node --test study-dashboard/tests/data
node study-dashboard/tests/data/smoke.mjs
# smoke real: servidor estático + Chrome headless (perfil temporal) con Study Dashboard
# y Study Flashcards, usando tests/e2e/lib sin modificarlo
```

También se ejecutó la suite con el Node empaquetado del entorno DSH
(`node --test "study-dashboard/tests/data/*.test.js"`) para descartar diferencias de runtime.

### 6.2 Resultados

| Prueba | Resultado |
|---|---|
| `node --check study-shared/store.js` | **PASS** |
| Pruebas Node de `tests/data` | **PASS 25/25** (15 de Fase 0 + 9 de `fase1.test.js` + 1 de `volume.test.js`) |
| Smoke existente `tests/data/smoke.mjs` | **PASS 18/18** |
| Smoke real Study Dashboard (Chrome headless) | **PASS**: `StudyStore` v2, anotación persistida tras recargar, filtro por área heredada y primaria, sin `areaId` en el registro, `recall:changed` por DOM y bus, tombstone de recuerdo, `cards` intactas, 0 excepciones y 0 errores de consola |
| Smoke real Study Flashcards | **PASS**: store v2, `recordReview` actualiza las cajas, filtro por área disponible también allí, 0 excepciones |
| Suite de Fase 0 | **PASS 15/15** (regresión) |

### 6.3 Cobertura nueva

`fase1.test.js` (9 pruebas):

1. filtro por `areaId` con el temario real y la taxonomía (área primaria, área heredada,
   `sheetId` + área, color + área, área desconocida, `includeDeleted`, sin escribir el área);
2. área resuelta desde el tema y reconstrucción del índice si la taxonomía llega tarde;
3. filtro por color, orden `updatedAt` y tombstones con dataset sintético controlado;
4. `recall:changed` en `add`/`remove` por DOM y por `StudyApp.events` (forma exacta, sin
   eventos en operaciones inválidas);
5. merge real entre dos pestañas (anotaciones, dudas, confianza, tarjetas propias, repaso y
   recuerdos, con tombstone que no resucita);
6. merge determinista de dos exportaciones con `updatedAt` controlado y tombstones en las seis
   colecciones;
7. exportar/importar con tombstones, recarga y compatibilidad con `cards` y `flashSession`;
8. preferencias de lectura activa fuera del estado exportado y del borrado;
9. regresión de Flashcards (`cards` intactas, API antigua, `subscribe`, snapshot `version:1`).

`volume.test.js` (1 prueba): 1.200 anotaciones, 3.000 recuerdos, 300 dudas, 120 confianzas,
120 repasos, 600 tarjetas propias, 100 semanas, 200 hechos y 12 cajas de Flashcards:
listados, filtros, tombstones, escritura en frío, export/preview/merge, recarga y cajas
intactas.

---

## 7. Supuestos y decisiones

1. **`areaId` es polivalente.** El filtro acepta el id de área que use la vista (heredada
   `area-aps`, primaria `area-psi-cuidado-integral` o la del tema). La ficha puede responder a
   varias áreas; no se escribe ninguna en la anotación.
2. **Índice por contenido, no por registro.** No hay migración de anotaciones ni campo nuevo.
   El índice se reconstruye si cambia el contenido o si la taxonomía se aplica después.
3. **Área desconocida = lista vacía.** Es preferible a devolver todas las anotaciones y ocultar
   un error de filtro.
4. **`recall:changed` sin `action`/`cardId`.** Se respeta la forma exacta de
   `CONTRATOS-FASE1` §4.2; quien necesite `cardId` puede releer el registro con
   `recall.list({sheetId})` o por `id`.
5. **Tombstone absoluto.** Se conserva la regla de Fase 0: un registro borrado no resucita,
   aunque llegue una versión viva con `updatedAt` posterior.
6. **Atajo de fusión conservador.** Solo se omite cuando `updatedAt`, `resetAt` y la longitud
   del JSON persistido coinciden con la última escritura propia. La fusión completa se mantiene
   para cualquier escritura externa y para importar, borrar y resetear.
7. **El snapshot del HUB no cambia.** Sigue escribiéndose en `version:1` con el mismo formato.
8. **`getState()` sigue devolviendo la referencia viva** por compatibilidad con Study
   Flashcards; la app solo la usa para leer. Las colecciones y listas nuevas devuelven copias.
9. **Las preferencias de lectura activa no son estado.** `study-active-prefs-v1` pertenece a
   `js/active`; no se lee, no se escribe, no se exporta y no se borra desde el store.

---

## 8. Riesgos y limitaciones honestas

- **Cuota de `localStorage`.** Un estado de 2,74 MB cabe en la cuota típica (~5 MB), pero uno
  de 6,52 MB probablemente no. Si `setItem` falla, el store no lanza: IndexedDB conserva el
  estado y el snapshot se escribe, pero los eventos `storage` entre pestañas dejan de recibir
  ese estado y la sincronización entre pestañas queda degradada. Es el mismo comportamiento de
  Fase 0; el volumen medido ahora está documentado.
- **Tombstones sin compactación.** Los borrados lógicos se conservan para siempre (regla
  absoluta). Un uso muy intensivo podría acercarse a los topes y hacer que `add` devuelva
  `null` sin un error visible. Se recomienda que Fase 2 decida una retención documentada
  (p. ej. tombstones de más de N días) antes de elevar los topes.
- **Ediciones concurrentes del mismo registro.** La fusión resuelve por registro completo: si
  dos pestañas editan campos distintos del mismo registro a la vez, gana la versión con
  `updatedAt` más reciente y se pierde la otra edición de ese registro. Es la semántica de Fase 0
  y no cambia aquí; los módulos deben evitar dos editores abiertos sobre la misma anotación.
- **Colisión del atajo.** Para omitir la fusión se exige mismo `updatedAt`, mismo `resetAt` y
  mismo tamaño en bytes. Si otra pestaña escribiera en el mismo milisegundo con exactamente el
  mismo tamaño, esta pestaña no vería ese cambio hasta su siguiente escritura en la otra
  pestaña. Es un caso extremo y la fusión volvería en cuanto cambie cualquier byte o fecha.
- **Importación de estados gigantes.** El límite de 12 MB puede rechazar una exportación real
  con decenas de miles de recuerdos. Es una decisión de contrato, no un defecto nuevo.
- **Anotaciones huérfanas.** Si una ficha desaparece del contenido, sus anotaciones siguen en
  la lista global (sin filtro) pero no aparecen en un filtro por área porque ya no hay ficha que
  resuelva el área. La vista de huérfanos de la integración debe usar la lista sin `areaId`.
- **Índice de áreas y categorías.** El filtro entiende áreas, no categorías
  (`sheet.categoryId`). La biblioteca usa categorías en `#/biblioteca/:area/:categoria`; si la
  vista de subrayados quisiera filtrar por categoría, sería otra extensión mínima acordada.

---

## 9. Coordinación pendiente

Filas añadidas a `docs/PEDIDOS.md`:

1. **Agente 3 · Lectura activa:** `ACTIVE-CONTRATO.md` §4.4 dice `recall.add({id, …})` y un
   evento `{sheetId, cardId, rating}`. La API real genera el `id` y el evento es
   `{sheetId, id, rating}`. Debe usarse el registro devuelto por `add`.
2. **Coordinador:** sincronizar el `?v=` de `study-shared/store.js` en `study-dashboard` y
   `study-flashcards`, y ejecutar FLASH-01..09 (contrato §1).
3. **Coordinador:** regenerar `INTEGRITY.sha256` para `store.js`, `tests/data/*` y `docs/*` de
   esta entrega.

No hay más dependencias: la Fase 1 de datos queda cerrada. No se avanzó a Fase 2.

---

© 2026 ZARCONT — Documento interno del proyecto.
