# EVOLUCIÓN SERUMS — Ola 2 (2026-10-29)

**Alcance:** diálogos, foco, fondo inerte y hojas modales en Plazas y Banqueo.
**Restricciones respetadas:** sin cambios en datos, claves, rutas, persistencia ni contratos entre apps.
**Estado:** Ola 2A verificada. Las transiciones de salida y los objetivos táctiles quedan para Ola 2B/4.

## 1. Plazas SERUMS

### 1.1 Pila de diálogos

`serums map/serums-map-explorer/js/app.js`
- `openBackdrop` / `closeBackdrop` ahora mantienen una **pila** de modales y un mapa de foco de retorno por modal.
- `#app` recibe `inert` mientras hay un diálogo abierto.
- El foco se mueve al control indicado y se restaura al disparador al cerrar.
- `Tab`/`Shift+Tab` quedan atrapados dentro del diálogo superior.
- `Escape` cierra solo el diálogo superior.
- Abrir un modal cierra el cajón de notificaciones y actualiza `aria-expanded`.

### 1.2 Modales cubiertos

| Modal | Semántica | Foco inicial | Fondo inerte | Retorno |
|---|---|---|---|---|
| Importar Excel | `role=dialog`, `aria-modal`, `aria-labelledby=importTitle` | `#impClose` | `#app.inert` | `#btnImport` / disparador |
| Clave API | `role=dialog`, `aria-labelledby=keyTitle` | `#keyInput` | `#app.inert` | disparador |
| Ficha de plaza | `role=dialog`, `aria-labelledby=detailTitle` | `#detailClose` | `#app.inert` | botón/fila de origen |
| Exportación | `role=dialog`, `aria-labelledby=exportTitle` | `#exportClose` | `#app.inert` | disparador |
| Confirmación | `role=dialog`, `aria-labelledby=confirmTitle` | `#confirmOk` | `#app.inert` | disparador, incluso si la ficha sigue abierta |

- `ImportWiz.open()` y `ImportWiz.close()` usan la API común (`App.openBackdrop`/`App.closeBackdrop`).
- `askConfirm()` usa la misma pila; se conserva la promesa y el callback original.
- `confirmModal` ya no tiene un listener de Escape duplicado.

### 1.3 Cajones cerrados

`serums map/serums-map-explorer/styles.css`
- `.drawer` y `#side` móvil usan `visibility:hidden` + `pointer-events:none` cuando están cerrados.
- La transición de salida conserva los 220 ms y luego oculta.
- `#side` de escritorio sigue visible; el cambio solo aplica en `max-width: 920px`.
- `btnNotif` expone `aria-controls` y `aria-expanded`.

## 2. Banqueo · Examen Studio

### 2.1 Hoja de detalle móvil

`EXAMEN STUDIO/js/app.js`
- En `max-width: 940px`, al abrir una pregunta:
  - `.qdetail-panel` recibe `role="dialog"`, `aria-modal="true"`, `aria-label` y `tabindex="-1"`.
  - El foco va al botón de cierre.
  - `#topbar`, `#foot`, listado y cabeceras quedan `inert`.
  - `Tab`/`Shift+Tab` quedan atrapados en la hoja.
  - `Escape` cierra y devuelve el foco a la fila de la pregunta.
- En escritorio no se añade semántica de diálogo ni se inerte la página: el panel sigue siendo la columna de detalle.
- `bank-filter`, `bank-select`, `bank-close`, `review-select` y `review-close` usan el nuevo flujo.
- Se añadió `focusDetail` al estado efímero de `bank`/`review`; no se persiste.
- `resize` recalcula el modo hoja/escritorio con debounce de 120 ms.

### 2.2 Modales genéricos

- `openModal()` inerte `#app`, `#topbar` y `#foot`.
- `closeModal()` restaura el fondo antes de devolver el foco.
- El primer `h2` del modal recibe un `id` generado y se usa como `aria-labelledby`.
- El trap de foco existente se mantiene.
- Si hay una hoja móvil abierta y se abre un modal (por ejemplo, «Registrar incidencia»), al cerrar el modal se recupera la hoja y el foco vuelve al botón que lo abrió.

## 3. Archivos modificados

| Archivo | Cambio |
|---|---|
| `serums map/.../js/app.js` | pila de modales, trap, inert, retorno de foco, confirmación, Escape, API pública |
| `serums map/.../js/panels.js` | ImportWiz usa la API común |
| `serums map/.../index.html` | roles, `aria-labelledby`, `aria-controls/expanded` |
| `serums map/.../styles.css` | visibilidad/pointer-events de drawer y side móvil |
| `EXAMEN STUDIO/js/app.js` | hoja móvil, trap, inert, foco inicial/retorno, aria-labelledby, resize |

No se tocaron stores, datos, `INTEGRITY.sha256`, rutas ni formatos de persistencia.

## 4. Validación

| Prueba | Resultado |
|---|---|
| Suite focalizada Plazas + Map + Banqueo | **22 PASS · 0 FAIL** |
| Suite completa final | **83 PASS · 0 FAIL · 2 SKIP** |
| Plazas: importador | rol, `aria-modal`, `aria-labelledby`, foco en `#impClose`, 6 Tabs dentro, Escape cierra, foco vuelve a `#btnImport` |
| Plazas: ficha | rol, `aria-modal`, foco en `#detailClose`, Tabs dentro, Escape cierra, `#app.inert` vuelve a false |
| Plazas: confirmación | foco en `#confirmOk`, Tabs dentro, Escape cierra |
| Plazas móvil | `#side` y `#notifDrawer` cerrados con `visibility:hidden`; abiertos visibles; `aria-expanded` correcto |
| Banqueo móvil | hoja `role=dialog`, foco en cierre, 6 Tabs dentro, topbar/foot inert, Escape cierra y enfoca la fila |
| Banqueo escritorio | sin rol de diálogo, topbar/foot no inertes |
| Banqueo Review | misma hoja accesible y retorno a `review-select` |
| Banqueo modal anidado | «Registrar incidencia» con nombre accesible, foco dentro, cierre devuelve foco a `bank-flag` y conserva la hoja |

Evidencias:
- `AUDIT/evidencias/wave2-final/`
- `AUDIT/evidencias/wave2-a11y/*.txt` y `resultados.json`

## 5. Limitaciones y pendientes

- **No probado en Safari/iOS ni con lector de pantalla real.** `inert` y `aria-modal` son estándar en Chrome/Edge/Firefox modernos; la validación fue con Chrome 156 headless y teclado CDP.
- **Salidas animadas:** los modales siguen cerrando de forma inmediata; no se añadió animación de salida para no retrasar el retorno de foco.
- **Objetivos táctiles:** siguen existiendo controles de 32–38 px en algunas apps; corresponde a Ola 4.
- **Breakpoints:** no se consolidaron.
- **HUB:** ya tenía trap, `inert` y retorno de foco; no se modificó.
- **Study:** no usa diálogos; sus modales/toasts se revisaron en Ola 1 y no requieren este cambio.
- **Rendimiento:** el trap solo se ejecuta con un diálogo abierto; no hay listeners por frame.

## 6. Siguiente paso propuesto

1. **Ola 2B:** salida breve de modales (120–160 ms) con `is-closing` y retorno de foco al terminar, sin bloquear interacción.
2. **Ola 3:** continuidad HUB (recordar tarjeta, CTA «Continuar»), rutas hash de Plazas y confirmación de fin de sesión en Flashcards.
3. **Ola 4:** topbars/objetivos táctiles, breakpoints y `prefers-reduced-transparency`/`contrast`.
