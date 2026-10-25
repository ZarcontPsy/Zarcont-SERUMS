# PERSISTENCIA — Auditoría real de estado y ciclo de vida (Agente 2)

Fecha: 2026-10-25 · Repositorio: `C:\Users\USARIO\Documents\ZARCONT SERUMS`
Alcance: las cinco apps + HUB, con pruebas ejecutadas en Chrome headless (CDP) sobre
`http://127.0.0.1:8772`, perfil temporal `%TEMP%\a2-chrome`.
Dueño de este documento y de los archivos citados en §1: Agente 2.

> **Aviso de contexto.** Mientras se ejecutaba esta auditoría, otros agentes editaban
> `study-dashboard/app.js`, `study-flashcards/app.js`, `serums-quest/js/app.js`,
> `EXAMEN STUDIO/js/app.js` y `index.html` (mtime 05:04–05:22). Las mediciones «antes»
> corresponden a la versión servida a las 05:04 y las «después» a la de 05:20–05:22.
> Los cuatro archivos de persistencia que edité no tenían cambios de otros agentes
> (`store.js` de Study seguía con mtime del 21/10).

---

## 1. Cambios aplicados (solo archivos propios)

| Archivo | Cambio | Motivo |
|---|---|---|
| `study-shared/store.js` | `rememberDeckContext()`: `last.flashcards` conserva el **mazo de la sesión activa** (con `resume=1`) en lugar de saltar al tema de la tarjeta. Si no hay sesión se mantiene el formato anterior (tema). | El HUB y `?deck=&resume=1` reanudaban un mazo distinto al de la sesión. |
| `study-shared/store.js` | `setSheetScroll()` no acepta un `0` que borre una posición previa > 0,05. | Abrir una ficha sin reanudar dejaba el scroll en 0 y el siguiente guardado destruía la posición de lectura. |
| `study-shared/store.js` | `pageshow` → `syncFromStorage()` dentro de `watchStorage()`. | Vuelta desde bfcache/otra app con estado en memoria anterior a lo guardado. |
| `serums-quest/js/store.js` | `loadRaw()` compara `freshness(estado)` y `freshness(diario)` (revisión + `updatedAt`); un diario viejo ya no sustituye a un estado más reciente (se limpia). | Recuperación de diario a ciegas podía revertir la última acción. |
| `EXAMEN STUDIO/js/store.js` | Revisión e incidencias: mezcla por id antes de escribir (`mergeReview`), `ts` más reciente gana; `storage` recalcula desde otra pestaña; `readStoredMap()` archiva `banqueo-review-v1-corrupt-<ISO>` antes de continuar. | Dos pestañas se pisaban la revisión y se perdían marcas; un JSON dañado se descartaba en silencio. |
| `serums map/serums-map-explorer/js/services.js` | `Store.set(k, undefined)` elimina la clave en vez de guardar la cadena `"undefined"`; `saveCache()` mezcla el geocaché con lo que ya hay en disco. | «Restablecer preferencias» dejaba claves basura; dos pestañas geocodificando podían borrarse entradas. |

**No se cambió ningún nombre de clave, formato, versión de IndexedDB ni se borró dato
alguno.** Los formatos antiguos se siguen leyendo (el fallback de `last.flashcards`
sin sesión es idéntico al anterior; la mezcla de revisión tolera mapas parciales).

---

## 2. Inventario de estado por app y clasificación

Leyenda: **P** persistente (sobrevive refresco y reinicio del navegador) · **S**
restaurable en la sesión/pestaña actual · **T** temporal (se pierde al refrescar) ·
**R** reiniciable por diseño (no hay nada que conservar).

### HUB (`index.html` — Agente 3, solo lectura)

| Estado | Dónde | Clase | Evidencia |
|---|---|---|---|
| Tarjeta seleccionada | `activeIndex` en memoria; `setActive(0)` al arrancar | T | Código 1650/1933. No hay clave de almacenamiento. |
| Snapshots de Study y QUEST | lee `studyhub:snapshot:v1` y `serumsquest:snapshot:v1` | P (solo lectura) | Se refresca con `storage`, `pageshow` y `visibilitychange` (1861‑1867). Medido: tras responder en QUEST el HUB leyó `answered:1`, `hasActivity:true`. |

### Study Dashboard (`study-shared/store.js` + `study-dashboard/app.js`)

| Estado | Dónde | Clase | Nota / medición |
|---|---|---|---|
| Ficha abierta | hash `#/ficha/<id>`, `?sheet=<id>`, `state.last.dashboard` y snapshot | P | URL directa restaura ficha y anuncio «Ficha restaurada». |
| Área / categoría | ruta `#/biblioteca/<área>/<cat>` | P | El hash conserva ambas. |
| Scroll de lectura | `sheets[id].scroll` (0‑1) | P (con guarda) | Antes: salir de la ficha desde el inicio guardaba `0` y borraba 0,57 de posición (prueba t1: `storedScroll` 0,5767 → 0,0909). Después: se conserva 0,71 y la entrada directa vuelve a 1398 px de 1960. |
| Filtros de biblioteca (texto, estado) | `state.libraryQuery/libraryFilter` memoria | T | `APS` sobrevive al cambio de pestaña, se pierde al recargar (t13). |
| Acordeones de tema (`<details>`) | atributo `open` recalculado en cada render | T | Un acordeón abierto se cierra tras volver de otra pestaña (t13: `secondOpen` true → false). Requiere `study-dashboard/app.js` (§5.1). |
| Progreso real (vistas, completadas, favoritas, tarjetas, sesiones, racha) | IndexedDB `study-serums` v1 + `study-state-v1` + snapshot | P | Sobrevive reinicio real del navegador (t8: 3 fichas, 1 tarjeta, sesión de flashcards intacta). |
| Tema | `study-theme` (study-shared/ui.js) | P | — |
| Modo lector rápido/completo | `study-dashboard-mode` | P | — |
| Contador de vistas | `sheets[id].views` | P | Se incrementa en cada montaje (refresco incluido): 1→2→3→4 en t1. No marca dominio; documentado, no se corrige (vista ≠ progreso). |

### Study Flashcards (`study-shared/store.js` + `study-flashcards/app.js`)

| Estado | Dónde | Clase | Nota / medición |
|---|---|---|---|
| Biblioteca (filtro, búsqueda, área, acordeones) | `state.library` memoria | S | Los acordeones abiertos sobreviven al cambio de pestaña (t13: `area-psi-etica` sigue `open`); se pierden al refrescar. |
| Mazo abierto | hash `#/mazo/<id>` + `last.flashcards` | P | — |
| Sesión en curso | `flashSession` (id, mode, deckId, queue, index, answers, correct/wrong, status) | P | Refresco en `#/sesion`: índice 1, 1 respuesta, escenario visible (t2). Tras reinicio real del navegador: `#/sesion` reanuda (t8). |
| Tarjeta / índice | `flashSession.index` | P | Sin reinicio de sesión al refrescar ni al volver de otra pestaña. |
| Respuestas | `flashSession.answers` + `cards[id]` (caja, vencimiento, aciertos) | P | Sin doble conteo: 1 respuesta ⇒ 1 `cards` y 1 revisión; `recordSessionAnswer` no duplica si la tarjeta ya está respondida. |
| Último mazo (para HUB y `?deck&resume=1`) | `last.flashcards` | P | **Defecto corregido**: al responder, `deckId` pasaba a ser el tema de la tarjeta. El HUB publicaba `?deck=topic-aps-atributos&resume=1` con la sesión en `sheet-aps-01` y aterrizaba en `#/mazo/topic-…` sin sesión (t6/t10-antes). Ahora publica `?deck=sheet-aps-01&resume=1` y entra en `#/sesion` (t10-2.2). |
| Progreso agregado | `sessions`, `activity`, `history` | P | Snapshot `reviewedCards`/`todayReviews` actualizado. |
| Tema | `study-theme` | P | Compartido con Dashboard. |

### SERUMS QUEST (`serums-quest/js/store.js` + `js/app.js`)

| Estado | Dónde | Clase | Nota / medición |
|---|---|---|---|
| Personaje activo / colección / equipamiento | `collection` (estado versionado) | P | El snapshot del HUB expone `selectedCharacterId`. |
| XP, monedas, nivel, etapa, logros, misiones | documento `serumsquest:state:v1` (esquema 2) | P | Reinicio real: `xp 10`, `coins 5`, `revision 4` (t8). |
| Sesión activa | `activeSession` + `#/jugar` | P | Refresco y reapertura restauran pregunta y respuestas (t3, t8). |
| Pantalla actual | hash | R | Al abrir sin hash vuelve a `#/` y avisa de la sesión guardada; la sesión no se pierde. |
| Ajustes y presentación | `settings`, `presentation`, espejo `serumsquest:theme` (leído por `index.html` antes del arranque) | P | — |
| Animaciones / foco / duración elegida | `ui.*` memoria | T | Se reinician sin afectar al progreso. |
| Respaldo, diario, snapshot, archivos | `serumsquest:backup:v1`, `journal:v1`, `snapshot:v1`, `archive:*` | P | Diario viejo ya no pisa el estado reciente (t10‑4.1); diario más nuevo sí se consolida (t10‑4.2). |
| Recuperación de estado dañado | archiva `serumsquest:archive:corrupt-state-*` y usa el respaldo | P | Con estado corrupto: `xp 999` recuperado del respaldo, `meta.recoveredFromCorrupt`, sin pantalla fatal (t14). |
| Cronómetro por pregunta | `questionEndsAt` (marca absoluta) | P (con efecto) | Simulando 5 s de ausencia con el temporizador vencido, al reabrir se registró **1 omisión automática** «Tiempo agotado». Es comportamiento del motor; se documenta para decisión de producto (no tocado: `engine.js` no es mío). |

### PLAZAS SERUMS (`serums map/serums-map-explorer/js/services.js` + app de Agente 6)

| Estado | Dónde | Clase | Nota / medición |
|---|---|---|---|
| Favoritos / adjudicadas (mías) / bloqueadas / comparador | `serums_favoritos`, `serums_adjudicadas`, `serums_bloqueadas`, `serums_comparador` | P | Tras recargar, reentrar desde el HUB y reiniciar el navegador se conservan (t4, t8: 2 favoritos). |
| Tema | `serums_theme` | P | `light` tras reinicio (t8). |
| Filtros (texto, provincia, ZAF/ZE, geolocalización, filtros rápidos) | `App.S.filters` memoria | T | Provincia elegida «ABANCAY (47)» desaparece al recargar (t4‑3). La matriz los llama «filtros localizados»; no se persisten. |
| Plaza seleccionada / ficha abierta | `S.selectedId` + modal memoria | T | — |
| Pestaña lateral, vista y pestaña de estado | `S.sideTab`, `S.view`, `S.stateTab` memoria | R | Sin routing por hash: recargar vuelve al mapa (t4‑7). |
| Dataset importado | IndexedDB `serumsdb` v1, almacén `kv`, clave `dataset` | P | — |
| Geocaché | `serums_geocache` | P | Ahora se mezcla al guardar (dos pestañas no se borran entradas). |
| Claves basura | `serums_<k>` con la cadena `"undefined"` | — | Corregido en `Store.set`: `undefined` elimina la clave. |
| Favoritos dañados | `JSON.parse` falla | — | Degrada a `[]` sin excepción y sin tocar el resto (t14). |

### BANQUEO · Examen Studio (`EXAMEN STUDIO/js/store.js` + app de Agente 6)

| Estado | Dónde | Clase | Nota / medición |
|---|---|---|---|
| Profesión / examen | `banqueo-profession-v1` (localStorage) + hash `#bank/<prof>/<exam>` | P | — |
| Búsqueda, filtros, pregunta seleccionada | `APP.bank.*` memoria | T | Se resetean al refrescar y al cambiar de profesión (por diseño). |
| Tema | `banqueo-theme-v1` | P | `light` tras recargar (t5). |
| Revisión de preguntas e incidencias | `banqueo-review-v1`, `banqueo-issues-v1` | P | **Defecto corregido**: dos pestañas se pisaban (t6: q001 perdida, quedaba solo q002). Después: 5 marcas conservadas y ambas pestañas sincronizadas (t10‑3.1); desmarcar conserva la entrada `{r:0}` (t10‑3.2). Corrupto: se archiva `banqueo-review-v1-corrupt-<ISO>` (t14b). |
| Intento de práctica | `APP.practice.session` memoria + `attempts` en IndexedDB `examenstudio` v2 (`status:"prog"`, guardado con debounce 200 ms) | S/P | En memoria se pierde al refrescar; el intento **sí** está en IndexedDB y reaparece como «Intentos en curso» con botón Continuar (t5‑6/7, t8: 2 filas). No se restaura solo: ver §5.4. |
| Cronómetro de práctica | derivado de `startedAt` + `minutes` en la sesión en memoria | T | `beforeunload` pide confirmación si hay práctica activa. |
| Importaciones, exámenes importados, PDFs | IndexedDB `examenstudio` v2 (`exams`, `questions`, `keys`, `audits`, `issues`, `imports`, `files`, `attempts`) | P | Versión 2 y 8 almacenes abiertos sin upgrade; 5.100 preguntas oficiales cargadas. |
| Historial / ranking | `attempts` en IndexedDB | P | — |

---

## 3. Matriz de pruebas de ciclo de vida (ejecutada)

Servidor `python -m http.server 8772 --bind 127.0.0.1`; Chrome `--headless=new
--remote-debugging-port=9332 --user-data-dir=%TEMP%\a2-chrome`, CDP con Node 24
(`WebSocket` global) y caché desactivada (`Network.setCacheDisabled`).
Scripts y salidas en `AUDIT/evidencias/agent2-*`.

| # | Escenario | Dashboard | Flashcards | QUEST | Plazas | Banqueo |
|---|---|---|---|---|---|---|
| 1 | Cambiar de pestaña y volver | Estado y scroll conservados; 0 navegaciones; acordeones de biblioteca se cierran | Sesión, índice y selección conservados | Sin re-render; sesión y temporizador siguen | Nada depende de `visibilitychange` | Práctica y cronómetro siguen |
| 2 | Refrescar | Ficha y posición restauradas; `views` +1 | Sesión, índice y respuestas intactas | `#/jugar` intacto | Vuelve al mapa; filtros perdidos | Práctica fuera de la vista (intento en «En curso»); revisión y tema intactos |
| 3 | Cerrar/reabrir sección (otra app y volver) | Datos intactos | Ídem | Ídem | Ídem | Ídem |
| 4 | Volver al HUB y reentrar | Datos y snapshot intactos | Ídem | Ídem | Favoritos/tema intactos | Ídem |
| 5 | Abrir otra app y volver | — | — | El HUB leyó el snapshot con `answered:1` | — | — |
| 6 | URL directa | `?sheet=<id>` → ficha + scroll | `?deck=&mode=`, `?deck=&resume=1` | `#/jugar` reanuda | Sin routing interno | `#practice`, `#practice/session` |
| 7 | Atrás / adelante | Re-render sin recarga; vuelve a la ficha | Vuelve a `#/sesion` | Vuelve a `#/jugar` con sesión | Salida/entrada completa (pierde vista) | Salir de la práctica guarda el intento (`prog`) |
| 8 | Orientación (390×844 / 844×390 / 1280×800) | Sin recarga; `scrollY` se reajusta por reflujo (895→984) sin perder datos | Sin recarga | Sin recarga | Panel lateral se oculta | Sin recarga |
| 9 | Cerrar y reabrir el **navegador** (mismo perfil) | **Probado**: estado completo | **Probado**: sesión reanudada | **Probado**: xp/coins/sesión | **Probado**: favoritos/tema | **Probado**: revisión y 2 intentos «En curso» |
| 10 | `file://` vs `http://` | Ambos arrancan; ver §4 | Ídem | Ídem | Ídem | Ídem |

### Cómo se probó el escenario 9 (honestidad)
`Browser.close` por CDP (cierre ordenado), comprobación de que el puerto 9332 queda
cerrado, relanzamiento de Chrome con el **mismo** `--user-data-dir`, y lectura del
estado con el HUB y con cada app. No se simuló un cierre forzado (matar el proceso) ni
un corte de energía: en esos casos Chrome puede perder las últimas escrituras no
volcadas de `localStorage`.

### Lo que **no** se pudo probar
- **bfcache real**: en headless la vuelta atrás se resolvió con `navigationType:
  "navigate"` y `pageshow.persisted` nunca fue `true`. El `pageshow` que añadí al store
  queda como red de seguridad, pero su efecto en bfcache **no está verificado**.
- **Mapa de Google** en Plazas: `MapView.map` quedó en `false` (sin red/API en headless).
  Favoritos, adjudicadas, tema, dataset y pestañas se probaron; marcadores y
  `fit`/`cluster` del mapa, no.
- **Vista de revisión de Banqueo por UI**: en la versión observada `#review` no pintaba
  filas (el archivo estaba en edición). La revisión se probó llamando a
  `BanqueoStore.markReviewed()`, exactamente la API que usan los botones
  (`data-act="review-confirm"` / `bank-review`).
- **Cierre de pestaña con `beforeunload`** en Banqueo: el diálogo nativo se aceptó por
  CDP (`Page.handleJavaScriptDialog {accept:true}`); el comportamiento visual del
  diálogo en un navegador real no se evaluó.

---

## 3.b Causas revisadas que **no** producen pérdida (verificadas)

- **Recargas internas**: cambiar de pestaña, filtrar, cambiar de tarjeta o de mazo no
  provoca navegación. Medido con `Page.frameNavigated`: 0 navegaciones en los pasos 1‑3
  de Dashboard, Flashcards y QUEST; los re-render son de `#view-root`/`#app`.
- **Inicialización repetida**: `StudyStore.init()` memoriza la promesa (`initPromise`);
  `QuestStore.init()` re-lee y normaliza pero vuelve a persistir solo si cambia
  esquema/versión; `BanqueoStore.init()` rehidrata una vez por carga. No se observaron
  escrituras dobles ni pérdida de sesión por doble init.
- **`cleanQuery()`** (`study-shared/ui.js`): en `study-flashcards/app.js` se leen
  `deck/mode/resume/sheet/from` en `readEntry()` **antes** de `UI.cleanQuery()`, y el
  arranque usa el objeto ya capturado. No borra parámetros antes de restaurar; el
  respaldo `study-flash-origin-v1` (sessionStorage) cubre la reentrada sin query.
  En el Dashboard no se usa: `initQuery()` conserva `?sheet=` al cambiar solo el hash, por
  eso el refresco sigue reanudando (comprobado: t11 y t1).
- **`visibilitychange` que pierde scroll**: en Dashboard el handler repinta y vuelve a
  `scrollTo` la posición capturada (t1: 1181 → 1181, 0 navegaciones). Lo que sí se pierde
  es estado **visual** no persistido (acordeones, §2) y, antes, el valor guardado por el
  guardado en 0.
- **Tamaños/versiones de IndexedDB**: `study-serums` v1 (`state`), `examenstudio` v2
  (8 almacenes), `serumsdb` v1 (`kv`). Abren sin upgrade y sin `onblocked` en las pruebas;
  `openDB` de Examen Studio tiene timeout de 3,5 s y `study-shared` de 1,6 s.
- **Conflicto estado visual vs persistido**: el caso real era `last.flashcards` (mazo de la
  sesión sustituido por el tema de la tarjeta) y el scroll guardado a 0 al abrir sin
  reanudar; ambos corregidos en el store.

---

## 4. `file://` frente a `http://` (escenario 10)

| Aspecto | `file://` | `http://127.0.0.1:8772` |
|---|---|---|
| `localStorage` | Disponible (probado: escritura/lectura OK), origen `file://` | Disponible |
| IndexedDB | Disponible (`study-serums`, `examenstudio`, `serumsdb` abren) | Disponible |
| Arranque de las 5 apps | Correcto (títulos y `h1` reales, sin scripts fallidos) | Correcto |
| Origen del estado | Compartido entre **todos** los archivos locales, separado del HTTP | Un origen por puerto/host |
| Consecuencia | El progreso hecho en `file://` **no** aparece en `http://` y viceversa; el HUB y las apps comparten estado si ambas se abren por el mismo protocolo | Recomendado: servidor local |

Riesgo documentado: abrir por `file://` y luego por `http://` da la impresión de
«pérdida de progreso»; no es un fallo del almacén, es otro origen. La recomendación es
usar siempre `http://`.

---

## 5. Instrucciones para otros agentes (no puedo editar sus archivos)

### 5.1 `study-dashboard/app.js` (Agente 6) — acordeones de biblioteca
El `visibilitychange` vuelve a pintar `#view-root` y recalcula `<details open>`, así que
un tema desplegado se cierra (medido: `secondOpen` true → false).
Cambio mínimo (aprox. líneas 709‑740 de la versión actual):

```js
// en el objeto state:  openTopics: {},
// en topicBlock(...):
var kept = state.openTopics[topic.id];
var isOpen = kept === undefined ? openByDefault : kept;
return '<details class="topic-block" ' + (isOpen ? "open" : "") + ...
// una sola vez, en bootApp():
root.addEventListener("toggle", function (e) {
  var d = e.target.closest && e.target.closest("details.topic-block");
  if (d) state.openTopics[d.getAttribute("data-topic")] = d.open;
}, true);
```
No requiere tocar el store ni las claves.

### 5.2 `study-dashboard/app.js` — filtros de biblioteca (opcional)
`libraryQuery`/`libraryFilter` viven solo en memoria: al refrescar se pierde la búsqueda.
Si se quiere conservar, guardarlos en `sessionStorage` (no en `localStorage` para no
mezclarlos con el progreso real) y sembrar `state.libraryQuery/libraryFilter` en
`bootApp()` antes del primer render.

### 5.3 `study-flashcards/app.js` (Agente 5) — filtros de biblioteca (opcional)
`state.library` (filtro, `q`, `area`, `open`) ya sobrevive al cambio de pestaña pero no
al refresco. Mismo criterio: `sessionStorage` si se considera necesario.

### 5.4 `EXAMEN STUDIO/js/app.js` (Agente 6) — restaurar el intento en curso
Hoy, al refrescar en `#practice/session`, `practiceView()` no encuentra
`APP.practice.session` y muestra el setup con «No hay una práctica en curso»; el intento
sigue en IndexedDB y hay que pulsar «Continuar». Cambio mínimo en `onRoute()`, dentro de
`if (route.name === "practice")`:

```js
if (route.section === "session" && !APP.practice.session) {
  const pending = Store.attemptsFor(null).find((a) => a && a.status === "prog");
  if (pending) { resumeAttempt(pending.id); return; }
}
```
(`resumeAttempt` ya existe y reconstruye `APP.practice.session` desde el intento; el
cronómetro se recalcula con `startedAt`, así que no se pierde tiempo.)

### 5.5 HUB `index.html` (Agentes 1 y 3) — enlaces de reanudación
`flashcardsHref(snap)` construye `?deck=<last.deckId>&resume=1`. Antes de la corrección,
durante una sesión `last.deckId` era el **tema** de la tarjeta, así que ese enlace abría
otro mazo y no reanudaba. Ahora `snapshot.flashcards.last` publica el mazo real y
`resume=1`; no hay que cambiar el HUB, solo no volver a derivar el mazo desde
`last.topicId`. `snapshot.flashcards.last` incorpora además `sheetId` (campo aditivo,
ignorado por quien no lo use).

---

## 6. Riesgos y pendientes

1. **Cronómetro de QUEST y ausencias largas**: el tiempo se mide con marcas absolutas;
   cerrar el navegador con una pregunta activa hace que al volver se registre una omisión
   automática. Decisión de producto/Agente 4, no de persistencia.
2. **`beforeunload` en Banqueo** (app.js): pide confirmación al refrescar con práctica
   activa. Es correcto, pero conviene comprobar el texto/UX en móvil.
3. **Contador de vistas del Dashboard**: cada montaje (incluido refresco) suma una vista.
   No afecta a «completadas» ni al dominio; si el coordinador prefiere no contarla al
   restaurar, hay que hacerlo en `app.js` (no en el store, que no distingue intención).
4. **Estudio de bfcache**: no verificable en headless; validar en navegador con interfaz.
5. **Claves nuevas**: solo se añaden prefijos de archivo (`banqueo-review-v1-corrupt-<ISO>`,
   `serumsquest:archive:*` ya existente). No se renombró ni se borró ninguna clave.
6. **`ESTADO DE OTROS AGENTES`**: no toqué `app.js`, HTML ni CSS. Las correcciones de
   §5 son propuestas, no cambios aplicados.
