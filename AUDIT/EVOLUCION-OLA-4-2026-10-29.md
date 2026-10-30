# EVOLUCIÓN SERUMS — Ola 4 (2026-10-29)

**Alcance:** objetivos táctiles, transparencia reducida y contraste alto.
**Decisión de alcance:** la consolidación de breakpoints se documenta como deuda; no se
reescribieron 26 umbrales sin una matriz visual completa.
**Resultado:** suite final **87 PASS · 0 FAIL · 1 SKIP** (88 casos).

## 1. Objetivos táctiles

`serums-mobile.css`
- En `(hover: none) and (pointer: coarse)` los controles de topbar alcanzan **40 × 40 px**:
  `.icon-btn` (HUB, Banqueo), `.s-iconbtn` (Study), `.q-iconbtn` (Quest) y
  `#topbar .btn.icon` (Plazas).
- `.bar-btn`/`.bar-open` del HUB y los enlaces `.nav a`/`.s-navlink` conservan una altura
  mínima de 40 px.
- El escritorio mantiene sus tamaños visuales actuales; el cambio solo afecta a puntero grueso.
- A 390 px el HUB compacta padding, gap, tracking de marca y separación de flechas para que
  los cinco iconos de 40 px sigan visibles.
- No se cambió la estructura del topbar, la navegación ni los controles compartidos.

Medido con Chrome 156, emulación táctil y viewports 390×844 y 320×568:

| App | Antes | Después | Documento |
|---|---|---|---|
| HUB | 34 px | **40 px** | 390/390 y 320/320 |
| Banqueo | 38 px | **40 px** | 390/390 y 320/320 |
| Study | 38 px | **40 px** | 390/390 y 320/320 |
| Quest | 36 px | **40 px** | 390/390 y 320/320 |
| Plazas | 36–44 px | **40 px** | 390/390 y 320/320 |

## 2. Transparencia reducida

`serums-mobile.css`
- Con `prefers-reduced-transparency: reduce`:
  - topbars, barra del carrusel, appbars, footer de juego, modales, diálogos, panel lateral,
    cajón, contador, herramientas del mapa, leyenda y tarjeta de selección pierden
    `backdrop-filter`.
  - El chrome flotante usa una superficie sólida derivada de los tokens de cada app.
  - Las tarjetas de contenido y el arte original no se aplanan.
- Los fondos se resuelven con la cadena
  `--panel-solid` → `--surface-solid` → `--panel` → `--surface` → `--bg`.
- Verificado en HUB, Study, Banqueo, Plazas y Quest, en oscuro; Study también en claro.

## 3. Contraste alto

`serums-mobile.css`
- Con `prefers-contrast: more`:
  - `:focus-visible` usa `outline: 3px solid currentColor` con `outline-offset: 3px`.
  - Los bordes del chrome (topbars, modales, panel lateral, cajón y contador) usan
    `currentColor`.
- Verificado con foco de teclado real en el HUB: `3px solid`, offset `3px`.

## 4. Breakpoints

- No se consolidaron los 26 anchos detectados.
- Se actualizó `DESIGN-SYSTEM.md` para declarar la base compartida
  (1180/1020/940/900/820/780/640/480) y aceptar umbrales intermedios por app
  (620/600/520/420/380) cuando el topbar, el mapa o el lector lo justifican.
- Motivo: cambiar umbrales vivos sin una matriz visual de todos los estados y viewports puede
  romper layouts ya verificados. Queda como deuda técnica explícita, no como mejora silenciosa.

## 5. Pruebas

| Prueba | Resultado |
|---|---|
| Suite completa | **88 casos · 87 PASS · 0 FAIL · 1 SKIP** |
| Objetivos táctiles 390/320 | PASS en 5 apps; sin overflow de documento |
| Reduced transparency | PASS en 5 apps; sin blur y con fondo sólido |
| Tema claro + reduced transparency | PASS en Study |
| Contraste alto + foco teclado | PASS: outline 3 px sólido |
| SKIP restante | QUEST-10 (sin héroe alternativo poseído) |

Evidencias:
- `AUDIT/evidencias/wave4-final/`
- `AUDIT/evidencias/wave4-a11y/` (`touch-targets.txt`,
  `reduced-transparency-contrast.txt`, `contrast-focus.txt`, capturas 390/320 y
  `resultados.json`).

## 6. Archivos modificados

| Archivo | Cambio |
|---|---|
| `serums-mobile.css` | objetivos táctiles, compactación del HUB a 390, reduced-transparency, prefers-contrast |
| `DESIGN-SYSTEM.md` | base de breakpoints, objetivos táctiles y preferencias del sistema |

No se modificaron datos, stores, rutas, contenido ni `INTEGRITY.sha256`.

## 7. Limitaciones

- La validación táctil usa emulación de Chrome, no hardware real.
- No se probó Safari/iOS, Firefox ni lector de pantalla.
- `prefers-reduced-transparency` y `prefers-contrast` son preferencias del sistema; si el
  navegador no las expone, las reglas permanecen inactivas sin romper nada.
- El HUB a 390 px mantiene un `scrollWidth` interno de 14 px en el topbar, pero todos los
  botones están dentro del viewport y el documento no desborda.
- Los breakpoints siguen siendo específicos por app.
- Las alturas de topbar (54–74 px) se mantienen por app; unificarlas exige rediseñar la
  composición de cada barra y se deja para una revisión específica.

## 8. Cierre de las cuatro olas

| Ola | Aporte | Estado |
|---|---|---|
| 1 | Tipografía, contraste, movimiento, feedback, HUB y Banqueo | Verificada |
| 2 | Diálogos, foco atrapado, inert, hojas móviles | Verificada |
| 3 | Continuidad HUB, historial de Plazas, cierre seguro Flashcards | Verificada |
| 4 | Objetivos táctiles, transparencia reducida, contraste alto | Verificada |

La suite pasó de 83 PASS / 2 SKIP a **87 PASS / 1 SKIP** con cuatro pruebas nuevas y sin
regresiones funcionales.
