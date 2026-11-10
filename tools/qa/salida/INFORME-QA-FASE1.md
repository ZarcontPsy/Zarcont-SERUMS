# Informe de diseño, accesibilidad y QA — Fase 1

**Agente:** 6 · Diseño, accesibilidad y QA
**Fecha:** 10 de noviembre de 2026
**Alcance:** `tests/e2e/*`, `tools/qa/*`, `study-dashboard/styles.css` (solo hosts del shell), `study-shared/base.css`, `study-shared/icons.js`, `study-shared/ui.js`.
**Base contractual:** `docs/CONTRATOS.md`, `docs/CONTRATOS-FASE1.md`, `docs/ACTIVE-CONTRATO.md`, `docs/NAV-CONTRATO.md`, `docs/PLAN-MODELO.md` y `docs/PEDIDOS.md`.

> No se editó `app.js`, `index.html`, `store.js`, `js/active/*`, `js/nav/*`, `js/plan/*` ni los CSS de los módulos. Los defectos encontrados en archivos de otros agentes se reportaron en `docs/PEDIDOS.md` y al Coordinador; los arreglos los aplicaron sus dueños.

---

## 1. Resumen

| Área | Resultado |
|---|---|
| Suite E2E | **DASH-01…30 + FLASH-01…09 = 39/39 PASS** (`--suite=dash,flash --quick`) |
| Pruebas nuevas de Fase 1 | **DASH-18…DASH-30 (13 pruebas)**, sin relajar aserciones |
| axe-core real | **66 auditorías · 0 violaciones · 0 rutas pendientes · 9 estados abiertos** |
| Contraste de nodos que axe dejó incompletos | **530 nodos remididos en página · 0 fallos** |
| Contraste de tokens | **100 comprobaciones · 0 requeridas fallan** (8 avisos decorativos, igual que Fase 0) |
| Capturas | **110 PNG** · 6 viewports · 12 estados · 0 desbordes · 0 controles <44 px |
| Carga inicial | **3 436,2 KB / 28 peticiones**; sin Fase 1 (assets bloqueados): 2 901 KB / 13 → **+535,3 KB** |
| Índices derivados | **0 derivados al arrancar**; `search.json` solo al enfocar la búsqueda; `related.json` solo al abrir ficha |
| Cambios en archivos de otros agentes | **Ninguno.** 5 pedidos de QA (3 de contraste, selección y tarjeta): todos resueltos por sus dueños y verificados |
| Tokens de Fase 0 | **Sin cambios**; los ratios publicados se conservan |

---

## 2. Pruebas DASH-18…30

Archivo: `tests/e2e/suites/dash-fase1.mjs`, enlazado en `tests/e2e/run.mjs` dentro de `--suite=dash`/`study`. Helpers destacados: navegación con documento nuevo (`openDocument`), desplazamiento instantáneo para clics CDP, escritura real por CDP (`Input.insertText`), lectura del store v2 y `markFirst` por nombre accesible solo para acciones que el contrato no nombra (tarjeta, duda, ayuda).

| ID | Qué comprueba (selectores estables) |
|---|---|
| **DASH-18** | Párrafo real con `[data-ac-action="paragraph:open"]`; barra `.ac-selbar` (`role=dialog`, `aria-modal=false`, variante flotante); cita coincide con el párrafo; 4 colores; color Entender; guardado en `StudyStore.annotations` con `sheetId/sectionIndex/paragraphIndex/quote`; `.ac-para mark.ac-marktext[data-mark="understand"]` con etiqueta textual; persistencia tras refrescar; panel local `[data-module-mount="reader-active"] [data-ac-component="highlights"][data-view="rail"]`. |
| **DASH-19** | Ruta `#/subrayados` con `h1`; fila `.ac-hlrow[data-ac-id]` con cita y marca textual; `[data-ac-action="highlights:note"]`; nota editada y guardada en la anotación; `[data-ac-action="note:edit"]`; persistencia de la nota y de su edición tras refrescar. |
| **DASH-20** | `ucard:from` desde la fila del subrayado; editor con vista previa (`[data-ucard-preview-front]`), frente tomado de la cita; guardado en `StudyStore.userCards` con `annotationId` y `source:"annotation"`; edición real desde «Mis tarjetas» (`ucard:edit`), sin duplicar; persistencia del reverso editado tras refrescar. |
| **DASH-21** | Interruptor de pausa `[data-ac-component="recall-switch"]` en las preferencias del rail; apagado/encendido y `study-active-prefs-v1` (`version`, `recallPause`); frecuencia 1 persistente; pregunta idéntica a una tarjeta real de `STUDY_CONTENT.cards`; «Saltar» registra `rating:"skipped"`; revelar mueve el foco (`data-ac-focus="answer"`); autoevaluación «good» en `StudyStore.recall`; `cards` y `flashSession` idénticos antes/después; aviso «no toca tus cajas de Flashcards». |
| **DASH-22** | `memory:mode` monta `.ac-rmode` con todos los conceptos clave; revelar uno actualiza `aria-pressed` y el contador «1 de N»; control global; confianza al completar (`data-ac-component="confidence"`), 3 opciones + «Ahora no», guardado `solid` en `sheetConfidence` y persistencia tras refrescar. |
| **DASH-23** | Crear duda desde el subrayado con color Duda (`ensureDoubtForAnnotation`): `StudyStore.doubts` con `annotationId`, cita y ficha; bandeja `#/dudas` con `h1`, `.ac-doubtrow[data-ac-id]`, contexto y `doubts:goto`; `doubts:resolve` no borra el subrayado; filtro Resueltas + `doubts:reopen`; «Ir al contexto» navega a la ficha; contador `.ac-summary__doubtcount` y enlace `[href="#/dudas"]` del Panel. |
| **DASH-24** | `#/biblioteca` con documento nuevo: `StudyDerived.state("search") === "idle"`, sin peticiones a `/study-data/derived/`; `[data-library-search-input]`; estado de carga observado con red lenta real; «vacunacion» sin acentos devuelve 19 fichas; fragmento con `<mark class="navx-mark">`; `#library-body-results` visible y `#library-results`/`#library-summary` ocultos (por atributo o estilo); filtro por área con todos los resultados del área; estado vacío; limpieza restaura la biblioteca. |
| **DASH-25** | `/` enfoca la búsqueda de biblioteca sin abrir la paleta; `Ctrl+K` abre `.navx-palette-layer[data-state="open"]` con combobox enfocado, listbox y grupos; filtro «progreso» y Enter navega a `#/progreso`; Esc cierra y devuelve el foco al disparador; `/` sigue funcionando; en el lector `/` no abre la paleta y Ctrl+K sí (atajo global). |
| **DASH-26** | Índice `[data-module-mount="reader-index"] .navx-sections` con todos los enlaces; salto a la última sección sin hash, `aria-current="location"`, foco y `tabindex="-1"` en el `h2`; scrollspy; en 390 el panel es `role=dialog aria-modal=true`, botón de 44 px, foco atrapado/entregado, Esc cierra y devuelve el foco al botón; sin scroll horizontal. |
| **DASH-27** | En `sheet-audit-05` la relacionada enlaza a `sheet-audit-06` con motivo textual («Comparten el término «abstinencia» en la sección …»); `related.json` no se pide en la portada y sí al abrir la ficha; el fallback estructural aprobado («Comparten el tema/categoría») no finge evidencia textual. |
| **DASH-28** | `clearAllProgress` + `#/`: la Ruta de hoy declara estado vacío/no configurado (`sinActividad`), con `h2` y sin rejilla vacía; plan de 45 min/día visible en `.plan-today-plan`; con 2 dudas abiertas reales: contador correcto, enlace a `#/dudas`, ficha real enlazada y minutos estimados; sin métricas inventadas. |
| **DASH-29** | `?` abre la ayuda «Atajos del lector» y Esc la cierra; `/` en el lector no abre paleta ni enfoca la biblioteca; con la barra abierta, `2` elige Entender y Esc devuelve el foco al párrafo; con el campo de nota enfocado, `?` no abre ayuda, `1` no cambia el color y `/` se escribe como texto; el atajo global `Ctrl+K` no se confunde con atajos del lector. |
| **DASH-30** | Con puntero grueso a **360×800** y **844×390**: barra de selección, paleta y hoja del índice sin scroll horizontal; controles de la barra, cierre de paleta y enlaces del índice ≥44 px; entrada de paleta ≥16 px. |

**DASH-01…17 y FLASH-01…09** siguen verdes en la misma corrida; no se relajó ninguna aserción existente. Cambios de robustez, sin cambiar el recorrido ni las comprobaciones: la suite nueva usa esperas explícitas de foco/scroll, y **FLASH-02** espera ahora a que la portada de Flashcards pinte su rejilla de mazos antes de leer el primer enlace (una carrera de arranque detectada en una corrida; la aserción «enlace a mazo» se mantiene).

Archivo de evidencia: `AUDIT/evidencias/agente6-fase1-final4/run-quick.json` y `run-meta.json`.

---

## 3. Estilos del shell (`study-dashboard/styles.css`)

Solo se añadió layout de los contenedores de montaje; la piel de cada módulo sigue en `css/active.css`, `css/nav.css` y `css/plan.css`.

- `.library-search-host`: `display:flex; flex:1 1 290px; min-width:min(390px,100%)` y el campo hijo `flex:1 1 auto; min-width:0`; en ≤620 px `width:100%; flex:0 0 auto; min-width:0`. Conserva el ancho del fallback y deja que el panel del Agente 5 ocupe el mismo hueco.
- `[data-module-mount="today-route"]` y `[data-module-mount="active-summary"]`: `margin-top: clamp(26px,3.6vw,44px)` y 22 px en móvil; los hosts vacíos (`:empty`) no dejan huecos.
- `[data-module-mount="reader-related"]`: `margin-top: 33px` (mismo ritmo que `.reader-refs`); 26 px en móvil.
- `.reader-rail-index` / `.reader-rail-active` / `[data-module-mount]`: `min-width:0` y ocultación de hosts vacíos; `#library-body-results` con margen coherente con `#library-results` y `[hidden]` explícito.
- `prefers-reduced-motion`: los hosts no animan y el `scroll-behavior` no se fuerza.
- No se reescribieron reglas de los módulos, no se añadieron iconos nuevos y no se modificaron tokens de `study-shared/base.css`.

---

## 4. Accesibilidad y contraste

### 4.1 axe-core real

- **66 auditorías**: rutas `#/`, `#/biblioteca`, `#/progreso`, `#/ficha/sheet-aps-01`, `#/subrayados`, `#/dudas`, `#/respaldo` × 2 temas × 2 viewports (1440×900 y 390×844), más **9 estados abiertos**: `guardada-completada`, `activa` (subrayados + confianza + modo recordar), `pausa-recuerdo`, `barra-seleccion`, `con-datos` (subrayados y dudas), `con-actividad` (Ruta de hoy + resumen), `busqueda-resultados`, `paleta`, `hoja-indice`.
- **0 violaciones · 0 nodos · 0 rutas pendientes · 0 recursos 404.** Reglas ejecutadas: WCAG 2.0/2.1/2.2 A y AA.
- **530 nodos** `color-contrast` que axe dejó incompletos (degradados/superposiciones) se remidieron en página: **0 fallos**.
- Reglas incompletas revisadas a mano: `aria-valid-attr-value` en `#navx-palette-*-input` (su `aria-controls` apunta al listbox que existe pero está vacío hasta filtrar) y `.dash-more-btn` (panel cerrado). No son violaciones; se documentan como revisión manual, igual que en Fase 0.
- Evidencia: `tools/qa/salida/axe.json`, `axe.md`.

### 4.2 Defectos reales encontrados y resueltos por sus dueños

| Origen | Selector | Medición | Estado |
|---|---|---|---|
| `css/nav.css` (Agente 5) | `.navx-section-link.is-active .navx-section-depth` | 3,82:1 oscuro (`--muted` sobre `--accent-soft`) | Corregido a `--text-soft`; re-auditado |
| `css/nav.css` (Agente 5) | `.navx-palette-option.is-active .navx-palette-option-hint` | 3,82:1 oscuro | Corregido a `--text-soft`; re-auditado |
| `css/active.css` (Agente 3) | `.ac-conf__opt[aria-checked="true"] .ac-conf__text small` | 3,39:1 oscuro / 4,32:1 claro | Corregido a `--text-soft`; re-auditado |
| `js/active/active.integration.js` (Agente 3) | `state.selection` vs `view.selection` | La barra no se montaba en ningún navegador | Corregido; verificado con clic real |
| `js/active/active.integration.js` (Agente 3) | `ucard:from` rotulado «Editar tarjeta» | Abría `cardId:null` y duplicaría la tarjeta | Corregido: con tarjeta vinculada abre edición (`cardId`); verificado por QA |

Detalle y estado en `docs/PEDIDOS.md`. Ninguno se parcheó desde QA.

### 4.3 Contraste de tokens

- `tools/qa/contraste.mjs`: **100 comprobaciones**, **0 requeridas fallan**, 8 avisos decorativos (bordes `--*-line` y `--muted` sobre `--surface-3`), idénticos a Fase 0.
- Los módulos no añaden tokens globales: sus variantes viven en `.ac`/`.navx-*` con respaldo local y consumen los tokens publicados.
- Ratios intactos de Fase 0 (extracto): texto 15,10:1 claro / 17,42:1 oscuro; texto suave 7,40/9,31; subrayados 5,93–8,59 claro y 9,42–10,74 oscuro; mínimos de elemento gráfico ≥3 salvo avisos decorativos.
- Evidencia: `tools/qa/salida/contraste.json` y `contraste.md`.

### 4.4 Teclado real (CDP, no solo `element.focus()`)

- `/` enfoca la búsqueda de biblioteca y no abre la paleta; `Ctrl+K` abre la paleta, filtra, navega con Enter, cierra con Esc y devuelve el foco al disparador; `/` sigue funcionando después.
- En el lector: `?` abre la ayuda, Esc la cierra; `1–4` cambian el color con la barra abierta; Esc devuelve el foco al párrafo; `/` se escribe como texto en un campo; los atajos del lector no actúan mientras se escribe ni con un diálogo abierto.
- Índice: saltos con foco al `h2` (`tabindex="-1"`), scrollspy con `aria-current="location"`, hoja móvil con foco al cierre y retorno al botón.
- Diálogos de nota, tarjeta, dudas y ayuda: foco gestionado por la integración; `Esc` cierra y devuelve el foco (comprobado en DASH-19/20/23/29 y en las capturas de estado).
- Nota metodológica: en Chrome headless, `Runtime.evaluate` + `element.focus()` no dispara `focusin`; las pruebas usan clic/teclado real para las superficies que cargan bajo demanda. Ningún defecto de producto se deriva de esa diferencia.

---

## 5. Capturas y viewports

- **110 capturas** en `tools/qa/salida/capturas/`: 60 de rutas base (7 rutas × 2 temas × 1440/390 y 4 rutas × 2 temas × 360/768/1024/844×390), 6 de la hoja «Más» abierta en los viewports móviles, y **50 de estados de Fase 1** en ambos temas. Todos los PNG de estado pesan **entre 56 KB y 289 KB** (ningún lienzo vacío).
- Estados capturados: `ruta-hoy`, `con-actividad`, `relacionadas`, `con-datos` (Mis subrayados y Dudas), `activa` (subrayado + modo recordar + confianza), `pausa`, `barra-seleccion`, `busqueda`, `paleta`, `hoja-indice`, `mas-abierto` y `reduced-motion`.
- Corrección de proceso: la captura inicial de estados usaba `Page.captureScreenshot` con `clip` y `captureBeyondViewport:false`; con la página desplazada Chrome interpretaba el clip en coordenadas del documento y devolvía un lienzo del color de fondo (2,7–5,8 KB). `capturas.mjs` captura ahora el viewport **sin `clip`** (dimensiones fijadas por `Emulation.setDeviceMetricsOverride`), y la matriz comprueba que cada estado se haya abierto y medido.
- **0 desbordes horizontales** (`scrollWidth − innerWidth ≤ 1`) en los 6 viewports (360, 390, 768, 1024, 1440 y 844×390).
- **Appbar móvil = 5 controles** en 360/390/844×390; hoja «Más» incluida.
- **0 controles requeridos <44 px** con puntero grueso; se midieron también `.ac-para__btn`, colores de la barra, cierre de paleta, enlaces del índice, filtros de subrayados, acciones de dudas y `.plan-item-link`.
- Movimiento reducido: panel y ficha sin animación de entrada (`prefers-reduced-motion: reduce`).
- Evidencia: `tools/qa/salida/capturas.json`, `capturas.md` y las imágenes.

Ejemplos: `capturas/panel-ruta-hoy-oscuro-1440x900.png`, `capturas/ficha-activa-oscuro-390x844.png`, `capturas/ficha-pausa-claro-1440x900.png`, `capturas/biblioteca-busqueda-oscuro-1440x900.png`, `capturas/paleta-oscuro-390x844.png`, `capturas/ficha-indice-oscuro-390x844.png`, `capturas/subrayados-datos-claro-390x844.png`, `capturas/dudas-datos-oscuro-1440x900.png`, `capturas/mas-abierto-oscuro-390x844.png`.

---

## 6. Peso de carga inicial y derivados bajo demanda

Método reproducible en `tools/qa/peso.mjs` (Chrome headless, caché desactivada, mismo origen, `transferSize`):

| Medición | Transferencia | Peticiones | Derivados al arrancar |
|---|---:|---:|---:|
| Portada tal como está en Fase 1 | **3 436,2 KB** | 28 | **0** |
| Misma app con los assets de Fase 1 bloqueados (equivalente Fase 0) | **2 901,0 KB** | 13 | 0 |
| Delta observado | **+535,3 KB** | +15 | — |

- El delta incluye `css/active.css` (≈76 KB), `css/nav.css` (≈38 KB), `css/plan.css`, los cuatro módulos `js/active` (≈216 KB con la integración), los cinco `js/nav` + `nav.integration.js` (≈143 KB), `today.integration.js` (≈50 KB) y `derived-loader.js`; el temario (2 527 KB) ya existía y domina la carga.
- **Ningún derivado se pide al arrancar**: `performance` no registra `/study-data/derived/` en la portada.
- Al enfocar la búsqueda se pide **`search.json` una sola vez** (2,3 MB) y el índice queda listo; la petición no existe antes del foco. `related.json` no se pide en portada ni biblioteca y **sí al abrir la ficha** con relaciones.
- Evidencia: `tools/qa/salida/peso.json`, `peso.md` (incluye tamaño en disco de cada archivo nuevo y tabla de peticiones).

---

## 7. Herramientas QA actualizadas

| Comando | Qué produce |
|---|---|
| `node tools/qa/contraste.mjs` | `contraste.json/.md`; código 1 si falla un token requerido |
| `node tools/qa/peso.mjs` | `peso.json/.md`; código 1 si un derivado se pide al arrancar o falta la carga bajo demanda |
| `node tools/qa/axe-audit.mjs` | `axe.json/.md`; matriz de rutas + estados abiertos; código 1 si hay violaciones |
| `node tools/qa/capturas.mjs` | `capturas/*.png`, `capturas.json/.md`; código 1 si hay desborde, target <44 px, appbar ≠5 o un estado no abre |
| `node tools/qa/run-qa.mjs` | Ejecuta los cuatro y escribe `resumen.json/.md`; código 1 si algo falla |

- axe-core 4.10.2 sigue solo en `tools/qa/vendor/axe.min.js` (MPL-2.0); la app no lo carga.
- Los tools reutilizan el servidor y el cliente CDP de `tests/e2e/lib` sin modificarlos y no necesitan dependencias npm.
- `--quick` omite axe y capturas; `--skip-peso`, `--skip-axe`, `--skip-capturas`, `--skip-contraste` permiten aislar bloques.

---

## 8. Pendientes y pedidos

1. **`ucard:from` en la fila del subrayado** (Agente 3): con tarjeta ya creada, el botón decía «Editar tarjeta» pero abría el editor como creación (`cardId:null`). Corregido: ahora abre edición cuando la tarjeta existe; DASH-20 verifica la edición (desde «Mis tarjetas» y sin duplicar) y la corrida final queda verde.
2. **Relacionadas sin caso aislado**: el temario actual no tiene ninguna ficha sin vecinos de tema/categoría, así que el caso «bloque oculto sin motivo» no se pudo ejercitar con datos reales. Se verificó que el fallback estructural aprobado no finge evidencia textual y que una ficha con evidencia muestra el motivo y enlaza a la ficha existente. Documentado, no maquillado.
3. **Revisión humana pendiente** (no de código): NVDA/VoiceOver y un iPhone/Android reales para la hoja del índice, la barra de selección táctil y la paleta; las capturas y el teclado CDP no sustituyen esas pruebas.
4. **Headless**: Chrome 157 en Windows; no cubre Safari/iOS, zoom de texto del sistema ni lectores de pantalla. Los objetivos de 44 px se midieron con emulación de puntero grueso.
5. **`aria-valid-attr-value` incompleto**: `#navx-palette-*-input` y `.dash-more-btn`. El IDREF existe y se resuelve al abrir/filtrar; revisado a mano, sin violación. Se mantiene documentado como en Fase 0.
6. **Fase 2** no se inició. Las rutas `#/ruta`, `#/plan`, `#/dominio`, `#/repaso` siguen reservadas.

---

## 9. Cambios por archivo

| Archivo | Cambios |
|---|---|
| `tests/e2e/suites/dash-fase1.mjs` | **Nuevo.** DASH-18…30 con helpers de documento nuevo, scroll instantáneo, teclado CDP, lectura del store y descubrimiento por nombre accesible. |
| `tests/e2e/run.mjs` | Importa y ejecuta `runDashboardFase1` en `--suite=dash`/`study`. |
| `tests/e2e/suites/study.mjs` | FLASH-02: espera a la rejilla de mazos antes de leer el enlace (carrera de arranque); la aserción no cambia. |
| `tools/qa/axe-audit.mjs` | Rutas `#/subrayados`/`#/dudas`, 9 estados abiertos, helper de auditoría por estado, pendientes por integración y resumen por estado. |
| `tools/qa/capturas.mjs` | 6 viewports, estados de Fase 1, medición de appbar/targets, detección de estados que no abren, `scrollTo` para bloques y limpieza inicial. Captura de viewport sin `clip` para no devolver lienzos vacíos cuando la página está desplazada. |
| `tools/qa/peso.mjs` | **Nuevo.** Carga inicial Fase 1 vs. assets bloqueados y carga perezosa de `search.json`/`related.json`. |
| `tools/qa/run-qa.mjs` | Añade el bloque de peso, actualiza comandos/evidencias y el resumen. |
| `study-dashboard/styles.css` | Solo hosts del shell: `.library-search-host`, espaciado de `today-route`/`active-summary`/`reader-related`, hosts vacíos, `#library-body-results`, movimiento reducido. |
| `study-dashboard/docs/PEDIDOS.md` | Pedidos de contraste y de selección/tarjeta, y verificaciones de QA. |
| `tools/qa/salida/INFORME-QA-FASE1.md` | Este informe. |

No se modificaron `study-shared/base.css`, `icons.js` ni `ui.js` en esta fase.

---

## 10. Evidencias

```
tests/e2e/suites/dash-fase1.mjs
AUDIT/evidencias/agente6-fase1-final4/
  run-quick.json          (39 pruebas; sin cambios de archivo durante la corrida)
  run-meta.json           (entorno, git, archivos vigilados)
tools/qa/salida/
  contraste.json / .md    (100 comprobaciones, 0 requeridas fallan)
  peso.json / .md         (3 313,4 KB vs 2 901 KB; 0 derivados al arrancar)
  axe.json / .md          (66 auditorías, 0 violaciones, 9 estados)
  capturas.json / .md     (110 capturas, 0 problemas)
  capturas/*.png
  resumen.json / .md      (run-qa)
  INFORME-QA-FASE1.md     (este informe)
```

---

© 2026 ZARCONT — Documento interno del proyecto.
