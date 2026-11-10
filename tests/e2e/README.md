# Arnés E2E — Agente 8 (QA)

Arnés real basado en Chrome DevTools Protocol, sin dependencias npm. Lanza el servidor
estático y Chrome headless con un perfil temporal, abre targets por `PUT /json/new`,
conecta por WebSocket y ejecuta la matriz de `AUDIT/COORDINATION.md` §6.

## Requisitos

| Componente | Ruta / versión |
|---|---|
| Node.js | `C:\Users\USARIO\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe` (v24, `WebSocket` global) |
| Python | `C:\Python313\python.exe` (servidor `http.server`) |
| Chrome | `C:\Program Files\Google\Chrome\Application\chrome.exe` |

No se instala nada. El perfil de Chrome es **temporal** (`%TEMP%\zarcont-qa-*`);
no se toca el perfil real del usuario. El servidor escucha en `127.0.0.1:8790` y
Chrome en `127.0.0.1:9390`.

## Ejecutar

```powershell
# Matriz completa (incluye persistencia con reinicio de Chrome y responsive)
& 'C:\Users\USARIO\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe' tests/e2e/run.mjs --out=agent8-final

# Solo algunas familias
... tests/e2e/run.mjs --suite=hub,dash,flash,quest,plaza,banq
... tests/e2e/run.mjs --suite=fase4          # Dashboard 01…48 + Flashcards 01…09 + HUB completos
... tests/e2e/run.mjs --suite=persist
... tests/e2e/run.mjs --quick        # sin responsive ni persistencia
```

Salida:

- `AUDIT/evidencias/<out>/run.json` — resultados completos (observaciones medidas, entorno, repo).
- `AUDIT/evidencias/<out>/run-meta.json` — entorno y estado del repo durante la corrida.
- `AUDIT/evidencias/<out>/img/*.png` — capturas de viewports, fallos y evidencias.

`--out` por defecto es `agent8-baseline`; la corrida final usa `--out=agent8-final`.

Código de salida: `0` si no hubo FAIL, `2` si hubo FAIL, `1` si el ejecutor falló.

## Qué mide

- Navegación real con `Input.dispatchMouseEvent` (mousePressed + mouseReleased),
  no `element.click()` sintético. `click()` hace scroll, espera visibilidad y usa el centro.
- Navegaciones de documento con `Page.frameNavigated` (frame principal). Un cambio de
  hash no cuenta como recarga; una recarga sí.
- Errores: `Runtime.exceptionThrown`, `Log.entryAdded`, `Runtime.consoleAPICalled`
  (error/assert) y `Network.loadingFailed`. Los fallos de CDN/Google Fonts/Google Maps
  se clasifican aparte; el favicon 404 se ignora.
- Persistencia: `localStorage`, `sessionStorage` e `indexedDB.databases()`; la prueba de
  cerrar/reabrir usa `--user-data-dir` persistente, cierra con `Browser.close` (para que Chrome
  vuelque a disco, como al cerrar la ventana) y relanza el proceso.
- Responsive: `Emulation.setDeviceMetricsOverride` en 360×640, 390×844, 768×1024,
  1024×768, 1440×900 y 844×390 landscape; mide overflow del documento y targets.
- Pantalla completa: clic real sobre el control y verificación de
  `document.fullscreenElement` + `aria-pressed`; documenta la limitación de headless
  y de iOS (Safari en iPhone no implementa `requestFullscreen` en elementos).

## Estructura

```
tests/e2e/
  run.mjs                 ejecutor de la matriz
  lib/cdp.mjs             cliente CDP, Chrome, Page (goto/eval/click/viewport/screenshot/...)
  lib/server.mjs          python -m http.server 8790
  lib/harness.mjs         registro PASS/FAIL/SKIP, evidencias, aserciones
  lib/apps.mjs            rutas, esperas de arranque, filtro de errores
  suites/content.mjs      regresión de datos (210/630, 51/5100, 7323, 10)
  suites/hub.mjs          HUB
  suites/study.mjs        Study Dashboard + Study Flashcards
  suites/dash-fase0.mjs   Study Dashboard Fase 0 (DASH-10…17: respaldo, scroll, Más, accesibilidad)
  suites/dash-fase1.mjs   Study Dashboard Fase 1 (DASH-18…30: lectura activa, búsqueda, paleta, índice, relacionadas, Ruta de hoy)
  suites/dash-fase2.mjs   Study Dashboard Fase 2 (DASH-31…38: plan-model lazy, ruta, plan, dominio, repaso, navegación)
  suites/dash-fase3.mjs   Study Dashboard Fase 3 (DASH-39…44: glosario, datos, trampas, relámpago, último día)
  suites/dash-fase4.mjs   Study Dashboard Fase 4 (DASH-45…48: core/chunks, ficha lazy, H17, cero pérdida; F4-FLASH y F4-HUB)
  probe-fase4.mjs         sonda de desarrollo que ejecuta solo la suite de Fase 4
  suites/quest.mjs        SERUMS QUEST
  suites/plazas.mjs       Plaza SERUMS + Serums Map
  suites/banqueo.mjs      Banqueo + Examen Studio (práctica)
  suites/responsive.mjs   viewports y targets
  suites/persistence.mjs  pestaña, refresh, reentrada, cerrar/reabrir, orientación
  probe*.mjs              sondas de reconocimiento (no forman parte de la matriz)
```

## Límites conocidos

- `file://` no se prueba: el producto declara que el progreso compartido requiere el
  mismo origen HTTP. El arnés usa `http://127.0.0.1:8790`.
- Google Maps depende de red y de la clave demo del proyecto. La prueba `MAP-04`
  bloquea `maps.googleapis.com` para forzar el fallback y verificar que la app sigue usable.
- PDF.js/Tesseract se cargan por CDN; no se prueba OCR ni importación de PDFs nuevos
  porque requieren archivos y tiempo fuera del alcance de la matriz base.
- Headless puede denegar `requestFullscreen`; en ese caso la prueba registra la
  limitación y no inventa un PASS.

## Fase 0 · DASH-10 a DASH-17 (Agente 6)

`--suite=dash` ejecuta además la suite de contrato de Fase 0:

| ID | Qué comprueba |
|---|---|
| DASH-10 | `#/respaldo`: exportar por la UI, validar el sobre `serums-study-progress`, importar el mismo archivo por el `<input type="file">` y conservar el progreso (con copia `study-backup-preimport-v1`). |
| DASH-11 | La biblioteca recupera su posición al entrar y volver de una ficha. |
| DASH-12 | Con el objetivo superado no aparece «N de M» y se anuncia «Objetivo superado». |
| DASH-13 | Las fichas sin ampliación no muestran Rápido/Completo; una ficha con ampliación sí. |
| DASH-14 | El historial no duplica la ficha reabierta y la mueve arriba. |
| DASH-15 | Más abre/cierra (clic, Esc, velo), gestiona el foco y la appbar móvil queda en 5 controles. |
| DASH-16 | Marca con nombre que contiene el texto visible, tabla enfocable (`tabindex`/`role`/`aria-label`) y botones del lector con nombre y 44 px en puntero grueso. |
| DASH-17 | Conmutar tema conserva los ratios de contraste (texto 4,5:1; iconos 3:1). |

Los fallos de estas pruebas se prefijan con «PENDIENTE DE INTEGRACIÓN» cuando el
contrato aún no está implementado; no se convierten en PASS ni en SKIP.

## Fase 1 · DASH-18 a DASH-30 (Agente 6)

`--suite=dash` ejecuta la suite de `docs/CONTRATOS-FASE1.md`. Selectores estables:
componentes de lectura activa por `[data-ac-component]`/`[data-ac-action]`, navegación
por `[data-navx-*]` y `#library-body-results`, montajes por `[data-module-mount="…"]`.
Las acciones que el contrato no nombra (tarjeta propia, duda, ayuda de atajos) se
localizan por nombre accesible y se etiquetan con `data-qa-mark`; nunca se inventan ids.

| ID | Qué comprueba |
|---|---|
| DASH-18 | Subrayado por párrafo con la barra real, color, cita, `mark` textual, persistencia y panel del rail. |
| DASH-19 | `#/subrayados`: fila, nota, edición y persistencia de la nota. |
| DASH-20 | Tarjeta propia desde el subrayado con vista previa, `annotationId`, edición sin duplicar y persistencia. |
| DASH-21 | Pausa de recuerdo: interruptor, frecuencia, pregunta de tarjeta real, revelar/autoevaluar/saltar y `cards` intactas. |
| DASH-22 | Modo recordar con conceptos clave y confianza al completar (guardar y persistir). |
| DASH-23 | Dudas: crear desde el subrayado, bandeja, resolver/reabrir, contador del Panel y «Ir al contexto». |
| DASH-24 | Búsqueda del cuerpo: índice lazy, sin acentos, fragmento `<mark>`, filtro por área, carga/vacío/limpieza. |
| DASH-25 | `Ctrl+K` (abrir, filtrar, navegar, Esc, foco) y convivencia con `/`. |
| DASH-26 | Índice de secciones: scrollspy, salto con foco, sin hash y hoja móvil modal. |
| DASH-27 | Fichas relacionadas con motivo textual y `related.json` bajo demanda. |
| DASH-28 | Ruta de hoy con estados vacío/no configurado, presupuesto y datos reales. |
| DASH-29 | Atajos del lector (`?`, `1–4`, Esc) sin choques con `/`/`Ctrl+K` y desactivados al escribir. |
| DASH-30 | Capas abiertas a 360 y 844×390: sin scroll horizontal y objetivos de 44 px. |

Los clics de estas pruebas usan gesto CDP real y desplazamiento instantáneo (base.css
usa `scroll-behavior:smooth`); las recargas que deben limpiar `performance` usan una
query neutra para forzar un documento nuevo. En Chrome headless, `element.focus()`
programático no dispara `focusin`: las superficies con carga lazy se activan con clic real.

## Fase 2 · DASH-31 a DASH-38 (Agente 6)

`--suite=dash` ejecuta también la suite de `docs/CONTRATOS-FASE2.md`. Selectores
estables: `section[data-plan-view="ruta|plan|dominio|repaso"]`, `#plan-*-title`,
`[data-plan-loading|error|preview|weekly|route-status|form-status]`,
`.plan-route-item[data-type]`, `.plan-review-item[data-sheet-id]`,
`[data-plan-field]`, `[data-plan-area-priority]`, `[data-plan-action]` y
`[data-mastery-global|area|category|band]`.

| ID | Qué comprueba |
|---|---|
| DASH-31 | `plan-model.js` no se pide al arrancar, biblioteca ni ficha; se carga al abrir `#/ruta`; error visible con reintento cuando el script se bloquea; `StudyPlanRuntime` expone el modelo. |
| DASH-32 | `#/ruta` sin plan (señales y CTA a `#/plan`) y con plan (fecha, presupuesto, ítems, repaso→`#/repaso`, enlaces a plan/dominio/repaso, resumen semanal). |
| DASH-33 | `#/plan`: formulario accesible, campos, prioridad por área real, guardado en store con `areaPriority`, persistencia, previsualización y borrado con confirmación sin perder progreso. |
| DASH-34 | `#/dominio`: estado vacío sin señales (sin 0 ficticio) y mapa real con banda textual, 5 áreas, categorías y punto flojo. |
| DASH-35 | `#/repaso`: orden por vencimiento, enlace a ficha, autoevaluación que guarda nuevo `dueAt/intervalDays/lastReviewedAt` y no toca `cards`/`flashSession`. |
| DASH-36 | Resumen semanal real en `#/ruta`, guardado en `StudyStore.weekly` una sola vez por semana. |
| DASH-37 | Planificación descubrible en Más (4 enlaces), paleta Ctrl+K y «Ver ruta completa» del Panel; appbar móvil de 5 controles. |
| DASH-38 | Las 4 rutas sin scroll horizontal en 6 viewports y con controles ≥44 px en puntero grueso. |

QA de diseño, contraste y axe en `tools/qa/` (ver `tools/qa/README.md`).

## Fase 3 · DASH-39 a DASH-44 (Agente 6)

`--suite=dash` (o `--suite=fase3` para ejecutar solo esta familia) ejecuta la suite de
`docs/CONTRATOS-FASE3.md`. Selectores estables: `section[data-ref-view="glosario|datos|trampas"]`,
`#ref-*-title`, `[data-ref-search|area|count|filter|source|progress|known-count|action|loading|error]`,
`.ref-glossary-item[data-term-id]`, `.ref-fact-item[data-fact-id]`, `.ref-trap-item[data-warning-id]`,
`section[data-plan-view="relampago|ultimo-dia"]`, `#plan-relampago-title` / `#plan-lastday-title`,
`[data-quick-*]` y `[data-lastday-*]`. La carga perezosa se verifica contra
`performance.getEntriesByType("resource")`: `glossary.json`, `facts.json` y `warnings.json`
deben dar 0 peticiones al arrancar y solo pedirse en su ruta.

| ID | Qué comprueba |
|---|---|
| DASH-39 | `glossary.json` solo en `#/glosario`; 57 entradas, orden alfabético, búsqueda sin acentos, filtro de área exacto, vacío con el término y enlace real a `#/ficha/…`. |
| DASH-40 | `facts.json` solo en `#/datos`; 261 datos, filtro pendientes, marcar/desmarcar en `StudyStore.factsKnown`, progreso global, persistencia tras recargar y `cards`/`flashSession` intactas. |
| DASH-41 | `warnings.json` solo en `#/trampas`; 451 avisos, etiquetas Aviso/Distinción, filtros de fuente y área exactos, paginación de 40 en 40 y contador. |
| DASH-42 | `#/relampago`: tres derivados, ronda real de 10 con pregunta/respuesta del temario, revelar, calificar, puntuación, reinicio y sin persistencia en tarjetas ni datos. |
| DASH-43 | `#/ultimo-dia`: tres derivados, tres bloques con límites, fecha/días del plan, filtro de área, `window.print()` + `@media print`, y enlace a `#/plan` sin crearlo. |
| DASH-44 | Más/Ctrl+K/franja «Antes del examen» de `#/ruta`; las 5 rutas en 6 viewports sin overflow y con controles ≥44 px en puntero grueso; appbar móvil de 5 controles. |

Los fallos de integración se prefijan con «PENDIENTE DE INTEGRACIÓN (Fase 3)» y el selector
concreto; no se convierten en PASS ni en SKIP. Los módulos pueden no estar registrados
todavía: en ese caso la suite falla con ese prefijo hasta que el Coordinador avise.

## Fase 4 · DASH-45 a DASH-48 + F4-FLASH / F4-HUB (Agente 6)

`--suite=fase4` ejecuta la **regresión completa** de Study Dashboard (DASH-01…48),
Study Flashcards (FLASH-01…09) y el HUB (HUB-01…15), más las pruebas propias de la
Fase 4. `--suite=dash` también incluye DASH-45…48 al final.

| ID | Qué comprueba |
|---|---|
| DASH-45 | `temario-core.js` y `content-loader.js` cargan; `temario.js` completo no se pide; 210 fichas con metadatos, 630 tarjetas y 48 fuentes; `sections` ausente en el core; `StudyContent.ensureSheet/loadArea/needs`; Panel, Biblioteca y Progreso no piden chunks ni áreas. |
| DASH-46 | Ficha directa con el chunk retenido: `section.sheet-gate[role="status"]` visible y `aria-busy="true"`, lector sin montar; al fallar el chunk, `role="alert"` y botón `[data-action="sheet-retry"]`; al liberar, el lector monta secciones y la lectura activa funciona; la segunda ficha de la misma área no repite el chunk; otra área pide su propio chunk; una respuesta vieja no pinta la ficha cancelada; nunca se pide `temario.js`. |
| DASH-47 | H17: `getDashboardStats().totalTopics === 85`, 1 contenedor con 22 fichas oficiales, «85 temas» y «22 fichas oficiales» visibles en Panel y Biblioteca, sin «86 módulos» ni «86 temas»; 210 fichas y 630 tarjetas se mantienen. |
| DASH-48 | Cero pérdida: exporta un estado v2 con progreso, subrayados, dudas, tarjetas propias, recuerdo, confianza, repaso, plan y datos; borra, importa en `replace` y conserva todo; `cards` y `flashSession` quedan idénticos; `studyhub:snapshot:v1` mantiene su formato v1. |
| F4-FLASH | Study Flashcards carga core (630 tarjetas) y no carga `content-loader.js` ni chunks; mazos y sesión operativos con IDs reales. |
| F4-HUB | Siembra `studyhub:snapshot:v1`, lo lee sin modificarlo, muestra «Continuar» y no descarga nada de `study-data`. |

Ganchos de Fase 4: `section.sheet-gate[role="status"]` / `[role="alert"]`,
`[data-action="sheet-retry"]`, `article.reader[data-sheet-id]`, `.reader-main`,
`.reader-section`, `window.StudyContent.state()`, `window.STUDY_CONTENT.sheets[*].sections`.
La sonda `probe-fase4.mjs` ejecuta solo esta familia mientras se desarrolla; no forma
parte de la matriz.
