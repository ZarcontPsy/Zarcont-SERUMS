# EVOLUCIÓN SERUMS — Ola 3 (2026-10-29)

**Alcance:** continuidad de sesión y navegación.
**Restricciones:** sin tocar stores, claves de datos, contenido ni contratos de las tarjetas del HUB.
**Resultado:** suite final **87 PASS · 0 FAIL · 1 SKIP** (88 casos).

## 1. HUB — recordar tarjeta y «Continuar»

`index.html`
- Nueva clave de interfaz `serumshub:active:v1` en `localStorage`: guarda el **id de la app**
  activa, no el índice. Al cargar se restaura si existe; si no, BANQUEO.
- El carrusel sigue guardando la selección al cambiar con flechas, puntos, teclado o swipe.
- Se conserva la decisión **D1**: el `href` de cada tarjeta sigue apuntando a la portada.
- Los snapshots de Study aportan `dashboard.last.url` y `flashcards.last.url`.
  El botón inferior cambia de «Abrir» a **«Continuar»** cuando existe esa URL.
- El botón expone `aria-label="Continuar en …"` y `data-continuation` con la ruta real.
- Al pulsarlo se usa `launch(card, continuation)`; si no hay continuación, abre la portada.
- Fallback: si el snapshot no tiene `last.url`, el botón vuelve a «Abrir».
- QUEST, BANQUEO y PLAZAS no publican `last.url` en su snapshot: mantienen «Abrir».

## 2. Plazas — vistas con historial

`serums map/serums-map-explorer/js/app.js`
- Nuevo mapa de rutas:

| Vista interna | Hash |
|---|---|
| `map` | `#/mapa` |
| `stats` | `#/estadisticas` |
| `geo` | `#/geolocalizacion` |
| `favoritos` | `#/favoritos` |
| `adjudicacion` | `#/adjudicacion` |
| `comparador` | `#/comparador` |
| `config` | `#/configuracion` |
| `datos` | `#/datos` |

- `setView` actualiza el hash; `hashchange` restaura la vista.
- La carga directa con hash funciona y canonicaliza una URL sin hash a `#/mapa`.
- Atrás/adelante del navegador restauran la sección y desplazan al inicio.
- El rail y los controles existentes no cambian de API: siguen usando `go(nav)`.
- Los filtros no se serializan todavía en la URL; es una limitación declarada, no una regresión.

## 3. Flashcards — cierre seguro

`study-flashcards/app.js` + `study-flashcards/styles.css`
- Nuevo estado efímero `confirmEnd` (no persiste).
- Al pulsar «Terminar» con tarjetas pendientes:
  - Aparece un aviso inline con el número restante.
  - El botón de cabecera se retira para evitar dobles acciones.
  - El foco va a **«Seguir»**.
  - Acciones: **«Seguir»** y **«Terminar ahora»**.
- «Seguir» cierra el aviso, devuelve el foco a «Terminar» y conserva la sesión.
- «Terminar ahora» finaliza y abre `#/resumen`.
- Si ya no quedan tarjetas pendientes, el flujo termina directamente sin confirmación.
- El aviso se limpia al crear sesión, avanzar, retroceder o finalizar.
- `role="alert"` en el aviso y `aria-live` existente para el anuncio.

## 4. Pruebas y evidencias

| Prueba | Resultado |
|---|---|
| Suite completa final | **87 PASS · 0 FAIL · 1 SKIP** |
| HUB-11 (antes SKIP) | PASS: la tarjeta activa sobrevive a la recarga |
| HUB-15 (nueva) | PASS: «Continuar» apunta al último punto y la tarjeta conserva su portada |
| PLAZAS-08 (nueva) | PASS: hash directo, rail y atrás restauran la vista |
| FLASH-09 (nueva) | PASS: confirmación, foco en «Seguir», reanudación y resumen |
| SKIP restante | QUEST-10 (sin héroe alternativo poseído) |

Evidencias:
- `AUDIT/evidencias/wave3-final/` (88 casos).
- `AUDIT/evidencias/wave3-probes/` (HUB, Plazas y Flashcards; `resultados.json`).

## 5. Archivos modificados

| Archivo | Cambio |
|---|---|
| `index.html` | `serumshub:active:v1`, restauración, `continuations`, CTA Continuar, `launch` con URL |
| `serums map/.../js/app.js` | mapas hash, `setView`, `hashchange`, carga directa |
| `study-flashcards/app.js` | `confirmEnd`, aviso inline, guardas y acciones |
| `study-flashcards/styles.css` | estilos del aviso y responsive |
| `tests/e2e/suites/hub.mjs` | HUB-11 real y HUB-15 |
| `tests/e2e/suites/plazas.mjs` | PLAZAS-08 |
| `tests/e2e/suites/study.mjs` | FLASH-09 |
| `DESIGN-SYSTEM.md` | continuidad del HUB, hash de Plazas y cierre seguro de Flashcards |

No se modificaron stores, claves persistidas, contenido, datos de plazas, banco de preguntas ni
`INTEGRITY.sha256`.

## 6. Limitaciones

- La tarjeta activa del HUB no se sincroniza entre pestañas abiertas; el `storage` listener
  existente solo refresca progreso.
- `last.url` depende de que Study/Flashcards hayan escrito el snapshot; si falta, el CTA usa
  la portada. No se valida la existencia del recurso antes de navegar.
- Plazas no serializa filtros, búsqueda ni ficha en la URL; solo la vista.
- La confirmación de Flashcards es inline, no un diálogo modal; no captura `Esc`.
- No se probó Safari/iOS ni lector de pantalla real.
- El manifiesto de integridad sigue desincronizado por los cambios locales previos.

## 7. Siguiente

- **Ola 4:** topbars y objetivos táctiles, consolidación de breakpoints,
  `prefers-reduced-transparency`/`contrast`.
- **Opcional:** filtros de Plazas en query/hash, continuación de QUEST por misión,
  sincronización de la tarjeta activa entre pestañas.
