# Informe de diseño, accesibilidad y QA — Fase 2

**Agente:** 6 · Diseño, accesibilidad y QA
**Fecha:** 10 de noviembre de 2026
**Alcance:** `tests/e2e/*`, `tools/qa/*`, `study-dashboard/styles.css` (solo hosts del shell), `study-shared/base.css`, `study-shared/icons.js`, `study-shared/ui.js`.
**Contratos:** `docs/CONTRATOS.md`, `docs/CONTRATOS-FASE2.md` §4/§7, `docs/PLAN-MODELO.md` §10–§13, `docs/PEDIDOS.md`.

> No se editó producto: `index.html`, `app.js`, `store.js`, `js/plan/*`, `js/active/*`, `js/nav/*` ni sus CSS. Los defectos se reportaron en `docs/PEDIDOS.md` y los corrigieron sus dueños. La fase se cierra sin iniciar Fase 3.

---

## 1. Resumen

| Área | Resultado |
|---|---|
| Suite E2E | **DASH-01…38 + FLASH-01…09 = 47/47 PASS, 0 FAIL, 0 SKIP** · `stable:true` |
| Pruebas nuevas | **DASH-31…38 (8 pruebas)** contra las cuatro rutas de planificación |
| axe-core real | **100 auditorías · 0 violaciones · 0 pendientes · 12 estados** |
| Contraste remedido en página | **782 nodos incompletos · 0 fallos** |
| Contraste de tokens | **100 comprobaciones · 0 requeridas fallan** (8 avisos decorativos) |
| Capturas | **176 PNG** · 6 viewports · 15 estados · 0 desbordes · 0 controles <44 px |
| Carga inicial | **3 727 KB / 37 peticiones**; Fase 1: 3 441,6 KB / 28; Fase 0: 2 903,5 KB / 13 → **+285,4 KB de Fase 2** |
| `plan-model.js` | **0 peticiones al arrancar**; 1 al abrir `#/ruta` (bajo demanda) |
| Toques de producto desde QA | **Ninguno**; 5 defectos reportados y corregidos por sus dueños |

---

## 2. Pruebas DASH-31…38

Archivo nuevo `tests/e2e/suites/dash-fase2.mjs`, enlazado en `tests/e2e/run.mjs`. Usa los selectores del contrato §4 y navegación real; DASH-01…30 y FLASH-01…09 siguen verdes en la misma corrida.

| ID | Qué comprueba |
|---|---|
| **DASH-31** | `plan-model.js` **no** se pide en `#/`, biblioteca ni ficha; se pide exactamente al abrir `#/ruta`. Con el script bloqueado por CDP, `[data-plan-error]` visible con reintento; al desbloquear y reintentar, `StudyPlanModel` y la vista cargan. |
| **DASH-32** | `#/ruta` **sin plan**: estado real (`Sin plan`/sin presupuesto), señales accionables y CTA `[data-plan-link="plan"]` a `#/plan`; enlace del repaso vencido a `#/repaso`. **Con plan**: fecha de examen, presupuesto de 45 min, ítems `.plan-route-item[data-type]`, enlaces a `#/plan`, `#/dominio` y `#/repaso`, y `[data-plan-weekly]`. |
| **DASH-33** | `#/plan`: `form[data-plan-form]`, campos `examDate/minutesPerDay/daysPerWeek`, 5 áreas oficiales con `[data-plan-area-priority]` (radios 1/1,5/2), guardado con `areaPriority` en `StudyStore.plan`, anuncio en `[data-plan-form-status]`, previsualización, persistencia tras refrescar y **Quitar plan** con confirmación sin tocar el progreso. |
| **DASH-34** | `#/dominio`: sin señales declara el vacío y **no convierte la ausencia en un 0**; con confianza/fichas reales: `[data-mastery-global]` con puntaje, banda textual `[data-mastery-band]`, 5 áreas, categorías y punto más flojo. |
| **DASH-35** | `#/repaso`: orden por vencimiento (primero la más atrasada), `[data-plan-action="open"]` a la ficha, tres botones `weak/partial/solid`; autoevaluar guarda `dueAt` posterior, `intervalDays`, `lastReviewedAt` y `source:"confidence"`, **sin cambiar `cards` ni `flashSession`**; `[data-plan-review-status]` anuncia el nuevo vencimiento. |
| **DASH-36** | Resumen semanal real en `[data-plan-weekly]`, guardado en `StudyStore.weekly` **una sola vez** por semana tras varias visitas. |
| **DASH-37** | Descubrimiento: Más→Planificación (4 enlaces), paleta Ctrl+K con las 4 vistas, «Ver ruta completa» en el bloque Ruta de hoy del Panel; la appbar móvil sigue en **5 controles**. |
| **DASH-38** | Las 4 rutas en **6 viewports** (360/390/768/1024/1440 y 844×390): 0 scroll horizontal y controles ≥44 px con puntero grueso. |

Robustez de la suite: documento nuevo tras `clearAllProgress`, desplazamiento instantáneo para clics CDP y esperas explícitas de carga de modelo/vista. **No se relajó ninguna aserción**; las dos incidencias de la primera pasada (404 transitorio tras borrado y conteo de appbar con el panel abierto) se resolvieron aislando el escenario y excluyendo `.dash-more-panel`, respectivamente.

---

## 3. Accesibilidad

### 3.1 axe-core

- **100 auditorías**: 7 rutas base × 2 temas × 2 viewports, las 4 rutas nuevas de planificación y **12 estados** (`guardada-completada`, `activa`, `pausa-recuerdo`, `barra-seleccion`, `con-datos`, `con-actividad`, `busqueda-resultados`, `paleta`, `con-plan` (ruta y editor), `con-repasos`, `hoja-indice`, `mas-planificacion`).
- **0 violaciones · 0 nodos · 0 rutas pendientes · 0 recursos 404.**
- **782 nodos** `color-contrast` incompletos (fondos con degradado/tinte) remididos en la página: **0 fallos**.
- Reglas incompletas restantes revisadas a mano: `aria-valid-attr-value` en `#navx-palette-*-input` y `.dash-more-btn` (IDREF existe pero el panel está cerrado hasta abrir); documentado, sin violación.

### 3.2 Defectos reales encontrados en Fase 2 (corregidos por sus dueños)

| Dueño | Selector | Defecto | Estado |
|---|---|---|---|
| Agente 4 | `js/plan/plan.ruta.js` `.plan-ruta-meter-track` | `role="progressbar"` sin nombre accesible → `aria-progressbar-name` | Corregido con `aria-label="Presupuesto de la ruta"`; re-auditado |
| Agente 4 | `css/plan.css` `.plan-item-ordinal` | `--muted` al 75 % → `color-contrast` ×6 en `#/ruta` | Corregido a `--text-soft`, opacidad 1; re-auditado |
| Agente 7 | `css/plan-editor.css` opción de prioridad seleccionada | `#8F520E` sobre `#E2D8C7` = **4,38:1** en claro/móvil (incompleto de axe, fallo en remedición) | Corregido a `--text`; re-auditado |
| Coordinador | `index.html` grupos del panel Más | `div[aria-label]` sin rol → `aria-prohibited-attr` incompleto | Corregido con `role="group"`; re-auditado |
| Agente 2 | `StudyStore.urls.appUrl` | Enlace de Flashcards desde `/study-dashboard/index.html` añadía la carpeta actual | Corregido resolviendo el hermano; verificado por su dueño |

Tras las correcciones: **100 auditorías, 0 violaciones, 0 pendientes, 782 nodos medidos y 0 fallos**. El detalle vive en `docs/PEDIDOS.md`.

### 3.3 Teclado y foco (CDP real)

- `#/ruta`: enlaces internos `data-nav`, CTA al editor y al repaso operables con Enter y sin recargar documento.
- `#/plan`: formulario con `label`/`aria-describedby`, radios de prioridad con flechas del grupo (nativo), `Guardar` por submit, diálogo de borrado modal con foco inicial, trampa de Tab, Esc y retorno al disparador.
- `#/dominio` y `#/repaso`: enlaces y botones reales; la autoevaluación devuelve foco al botón y anuncia el nuevo vencimiento en `role="status"`.
- Paleta Ctrl+K y Más: las 4 vistas se alcanzan con teclado; foco gestionado y retorno al cerrar.
- Sin choques con `/` (biblioteca) ni con los atajos del lector: DASH-25/29 siguen verdes.

---

## 4. Capturas y viewports

- **176 capturas**: 108 de rutas base (10 rutas × 2 temas × 1440/390 y 8 rutas × 2 temas × 360/768/1024/844×390) y **68 de estados** en ambos temas.
- Estados nuevos de Fase 2: `ruta-con-plan`, `plan-con-plan`, `dominio-con-datos`, `repaso-con-repasos`, `mas-planificacion`; siguen los de Fase 1/0 (`ruta-hoy`, `con-actividad`, `relacionadas`, `con-datos`, `activa`, `pausa`, `barra`, `busqueda`, `paleta`, `hoja-indice`, `mas-abierto`, `reduced-motion`).
- **0 desbordes horizontales** en los 6 viewports (360, 390, 768, 1024, 1440 y 844×390).
- **0 controles requeridos <44 px** con puntero grueso, incluidos los nuevos `section[data-plan-view] button/a/input/select`, `[data-plan-area-priority] button`, `.plan-route-item a` y `.plan-review-item button`.
- Appbar móvil = **5 controles** en todas las rutas; el grupo Planificación vive en la hoja Más.
- PNG de estado entre **56 KB y 289 KB**; ninguno vacío.
- Evidencia: `tools/qa/salida/capturas.json`, `capturas.md`, `capturas/*.png`.

---

## 5. Carga inicial y modelo bajo demanda

Método reproducible en `tools/qa/peso.mjs` (Chrome headless, caché desactivada, `transferSize` del mismo origen; las líneas base se generan bloqueando assets por CDP):

| Medición | Transferencia | Peticiones |
|---|---:|---:|
| Fase 2 actual (portada) | **3 727,0 KB** | 37 |
| Sin assets de Fase 2 (equivale a Fase 1) | **3 441,6 KB** | 28 |
| Sin assets de Fase 1 ni 2 (equivale a Fase 0) | **2 903,5 KB** | 13 |
| **Delta de Fase 2** | **+285,4 KB** | +9 |
| Delta de Fase 1 (referencia) | +538,0 KB | +15 |

- **`plan-model.js` no se pide al arrancar** (0 peticiones en portada) y **sí al abrir `#/ruta`** (1 petición); el runtime y las cuatro vistas son pequeños y se cargan al inicio.
- `search.json` sigue cargándose solo al enfocar la búsqueda y `related.json` solo al abrir ficha.
- Evidencia: `tools/qa/salida/peso.json` y `peso.md` (incluye tamaños por archivo y peticiones de la portada).

---

## 6. Herramientas QA actualizadas

| Comando | Cobertura nueva |
|---|---|
| `node tools/qa/axe-audit.mjs` | 4 rutas de planificación + estados `con-plan`, `con-repasos`, `mas-planificacion` y pendientes por integración. |
| `node tools/qa/capturas.mjs` | 4 rutas en 6 viewports, estados de Fase 2, targets de plan y corrección de captura sin `clip` para páginas desplazadas. |
| `node tools/qa/peso.mjs` | Tres líneas base (Fase 2/1/0), `plan.runtime.js` en arranque, `plan-model.js` bajo demanda y archivos de ambas fases. |
| `node tools/qa/run-qa.mjs` | Ejecuta contraste + peso + axe + capturas y escribe `resumen.json/.md`; verde 4/4. |

axe-core sigue únicamente en `tools/qa/vendor/axe.min.js` (MPL-2.0); no se añadió ninguna dependencia a la app.

---

## 7. Pendientes y límites

1. **Revisión humana**: NVDA/VoiceOver y dispositivo iOS/Android reales para el editor del plan, la hoja Más y el repaso; la emulación headless no sustituye esas pruebas.
2. **`aria-valid-attr-value` incompleto** en la paleta (IDREF oculto hasta abrir) y el botón Más: revisado a mano, no es violación; se mantiene documentado.
3. **Estados de error de datos**: DASH-31 cubre el error de carga del modelo con reintento; los errores de lectura del store se ejercitan en las vistas de Fase 1 y en el modelo unitario, no con un almacenamiento corrupto real.
4. **Fase 3 no iniciada**: `#/relampago`, `#/ultimo-dia`, `#/glosario`, `#/datos` y `#/trampas` siguen fuera de alcance.
5. **Avisos de peso**: el contenido (`temario.js`, 2,5 MB) domina la portada; el aumento de Fase 2 es +285,4 KB y no incluye `plan-model.js` (se carga después, solo en las vistas que lo piden).

---

## 8. Cambios por archivo

| Archivo | Cambios |
|---|---|
| `tests/e2e/suites/dash-fase2.mjs` | **Nuevo.** DASH-31…38 con selectores del contrato, tres líneas base de carga y helpers de documento nuevo/scroll instantáneo. |
| `tests/e2e/run.mjs` | Importa y ejecuta `runDashboardFase2` en `--suite=dash`/`study`. |
| `tests/e2e/README.md` | Documenta la suite de Fase 2. |
| `tools/qa/axe-audit.mjs` | Rutas y estados de planificación, pendientes por vista ausente y resumen por estado. |
| `tools/qa/capturas.mjs` | Rutas de Fase 2 en 6 viewports, estados nuevos y targets de plan. |
| `tools/qa/peso.mjs` | Medición Fase 2/1/0 y carga perezosa de `plan-model.js`. |
| `study-dashboard/docs/PEDIDOS.md` | Defectos de Fase 2 reportados y verificados. |
| `tools/qa/salida/INFORME-QA-FASE2.md` | Este informe. |

Sin cambios de tokens en `study-shared/base.css`; `styles.css` conserva los hosts de Fase 1 (no hubo que añadir layout nuevo para las vistas).

---

## 9. Evidencias

```
tests/e2e/suites/dash-fase2.mjs
AUDIT/evidencias/agente6-fase2-final3/
  run-quick.json          (47/47; stable:true)
  run-meta.json
tools/qa/salida/
  contraste.json / .md    (100 comprobaciones, 0 requeridas fallan)
  peso.json / .md         (3 727 KB vs 3 441,6 vs 2 903,5; plan-model 0→1)
  axe.json / .md          (100 auditorías, 0 violaciones, 12 estados, 782 nodos medidos)
  capturas.json / .md     (176 capturas, 0 problemas, 0 pendientes)
  capturas/*.png
  resumen.json / .md      (run-qa verde 4/4)
  INFORME-QA-FASE2.md
```

---

© 2026 ZARCONT — Documento interno del proyecto.
