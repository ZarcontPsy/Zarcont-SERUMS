# AGENTE 5 · QA · SERUMS QUEST V2.3 · Fase 1

Fecha: 2026-11-08 (America/Lima) · Estado: **PASS** · Cero fallos · 8 notas (ninguna bloqueante).
Alcance: solo lectura sobre `dist/index.html`, `game.js`, `game.json`, `.work/src`, `export/`, assets y docs. Todo lo escrito vive en `.work/v2.3/agents/qa/`.

## Build verificado

- Game Studio **versión 97**, buildId **93e2032ced82**, etiqueta visible «V2.3 · Fase 1» (CSS en mayúsculas a ≥1024 px).
- `dist/index.html` = `export/serums-quest.html` = **3.719.283 B**, SHA-256 `93E2032CED82A2D6720EC2165AFD5A3EC90122CDBD6574FE8A2CC7131595E126`.
- `node --check game.js`: OK. `__v23.version` = `2.3.0-phase1`.
- Abierto siempre el build final con el arnés CDP (puerto 9545, perfil propio, Chrome headless). Nunca previews.

## Veredicto

**PASS · 9/9 bloques obligatorios · 0 fallos · 690/690 en la matriz · 75 FPS · 0 recargas completas · 0 errores de consola · 0 peticiones externas.**

| # | Caso | Resultado | Métrica clave |
|---|---|---|---|
| 1 | 7 tamaños (bienvenida, tutorial, tienda, inventario) | **PASS** | 7/7 sin desbordes de documento; 2 CTAs + 5 rutas + 3 herramientas dentro; 12 completas a 1308×662 |
| 2 | Tutorial: causa raíz, visto/no visto y recarga | **PASS** | Pasos 0→4 con el mismo overlay, `.titleScreen` y `#game`; `renderCount` +0; 0 mutaciones de `#screen` |
| 3 | Almacenamiento bloqueado | **PASS** | Bienvenida + tutorial + chip «SIN GUARDADO»; sin pantalla de recuperación; avanzar no remonta |
| 4 | Matriz de encaje 69 × 10 | **PASS** | **690/690 (100 %)**; 0 penetraciones, huecos, parpadeos o invisibles |
| 5 | Visor/efectos 3 héroes × 9 piezas | **PASS** | 27/27 con `effect.visible` y píxeles medidos (2.026–31.235 px) |
| 6 | Catálogo: 12+, búsqueda, orden, filtros, selección y miniaturas | **PASS** | 33/16/**12** a 1308×662; búsqueda 1; miniaturas 16→28→33 |
| 7 | Rendimiento y calidad | **PASS** | 75 FPS en título, tutorial, tienda e inventario; baja 73; reducción estática |
| 8 | Regresión de navegación | **PASS** | Mapa/Ajustes/Ayuda y Esc; tienda e inventario cierran a la bienvenida |
| 9 | Cero recargas, consola y red | **PASS** | `navigationCount` 1, 0 `Page.frameNavigated`, 0 errores, 0 red externa |

## Tamaños (sin desbordes de documento en ninguno)

| Tamaño | Bienvenida (CTAs/rutas/herram.) | Tutorial (alto panel · scroll) | Tienda total/visibles/completas | Inventario total/visibles/completas | Canvas tienda |
|---|---|---|---|---|---|
| 640×360 | 2 / 5 / 3, dentro | 285 px · 0 | 33 / 4 / 4 | 15 / 4 / 2 | 192×40 |
| 844×390 | 2 / 5 / 3, dentro | 285 px · 0 | 33 / 10 / 5 | 15 / 6 / 3 | 257×49 |
| 1024×600 | 2 / 5 / 3, dentro | 343 px · 0 | 33 / 16 / **12** | 15 / 12 / 8 | 360×287 |
| **1308×662** | 2 / 5 / 3, dentro | 457 px · 0 | **33 / 16 / 12** | 15 / 15 / 12 | **400×317** |
| 768×1024 | 2 / 5 / 3, dentro | 460 px · 0 | 33 / 20 / 15 | 15 / 6 / 4 | 233×168 |
| 1280×720 | 2 / 5 / 3, dentro | 460 px · 0 | 33 / 20 / 16 | 15 / 15 / 15 | 400×329 |
| 1920×1080 | 2 / 5 / 3, dentro | 480 px · 0 | 33 / 33 / 33 | 15 / 15 / 15 | 400×329 |

- El desborde interno de `.titleScreen` (48–145 px) es decorativo (`.v23wBg`, `.v23wAura`, retrato), queda recortado por `overflow:hidden` y no afecta a ningún control ni al documento.
- El canvas del visor es el mismo nodo en todos los tamaños y pantallas (`v23-vis-1`); a 640×360 el visor de tienda se reduce a 192×40 por el layout estrecho (documentado por los Agentes 2 y 3).

## Tutorial y almacenamiento

- `save-v23-all` (tutorialSeen true): el tutorial **no** se abre; bienvenida con 2 CTAs y 5 rutas.
- `save-v23-tutorial` (tutorialSeen false): se abre solo (paso 0/5). Cuatro «Siguiente»: pasos 0→1→2→3→4, **mismo nodo** de overlay, **mismo** `.titleScreen`, **mismo** `#game`, `screen='title'`, `renderCount` +0, `titlePaints` +0 y 0 mutaciones de `#screen`. Capturas del paso 1 y del paso 5.
- Tras saltar y recargar: `tutorialSeen=true`, no reaparece.
- Con `localStorage` bloqueado (preload del arnés): la bienvenida y el tutorial se ven, chip **«SIN GUARDADO»** y banner explicativo, **sin** «No he borrado tu partida» ni recuperación (`storageEnabled:false`, `corrupt:false`, `lock:false`). Avanzar no remonta; tras recargar el tutorial vuelve a ofrecerse (correcto sin almacenamiento). Un aviso `console.warn` por carga (2 en la sesión de tutorial bloqueado), ningún error.

## Encaje, visor y catálogo

- **Matriz**: 690/690 PASS en 12,9 s (tandas de 30). Por ranura: cabeza 150, peinado 40, torso 60, piernas 30, accesorios 20, extras 90, amuletos 40, efectos 100, marcos 40, mascota 30, estela 10, títulos 80. Área mínima 105 px, mediana 1.438 px; 0 penetraciones de cuerpo, 0 huecos, 0 parpadeos. `heroSwitchCheck()` OK y guardado idéntico (`saveEqual/snapshotEqual` true).
- **Efectos y marcos**: Ilan, Noa y Zenón × 5 efectos + 4 marcos. 15/15 efectos y 12/12 marcos con `effect.visible=true`, proyección dentro del canvas y píxeles reales (efectos 2.026–20.646; marcos 11.845–31.235). Mismo canvas en las 27 pruebas y `renderCount` +0.
- **Catálogo 1308×662**: 33 totales, 16 visibles y **12 completamente visibles** (4 columnas × 3 filas; 60 px de cabecera; 524 px de cuadrícula). Búsqueda «corona» → 1 resultado; limpiar → 33. Orden por precio con precios mostrados 90/100/120/140/170 (asc) y 900/650/620/560/380 (desc); nombre alfabético. Rareza legendario → 3; estado «En tienda» → 16; colección Extras → 36, todos `x-*`; reset → 33 Originales. Selección con scroll 430 conservada, `aria-pressed=true`, mismo canvas, `renderCount` +0.
- **Miniaturas bajo demanda**: 16 generadas al abrir (33 en catálogo), 28 tras desplazar 420 px y 33 al final; nunca 33/69 de golpe al abrir.

## Rendimiento y calidad

| Contexto | Mín. | Mediana | rAF (2 s) |
|---|---:|---:|---:|
| Título | 75 | 75 | 75,0 |
| Tutorial | 75 | 75 | 75,0 |
| Tienda | 75 | 75 | 75,0 (visor 74,8) |
| Inventario | 75 | 75 | 75,3 (visor 75,1) |
| Calidad baja | 73 | 75 | — |
| Calidad media / alta | 75 | 75 | — |

- Calidades baja/media/alta: sin errores; Chispas de racha mide 647 / 1.267 / 1.920 px (visible en las tres; la baja respeta `qCount`).
- `reducedMotion(true)`: animaciones CSS del título, halo y aura en `none`; transición del tutorial 0 s; efecto visible (16.556 px); dos capturas del canvas separadas 800 ms son **idénticas** (hash `033615821381eb54`); con movimiento normal difieren. Al desactivarlo, vuelve `v23wDrift`.

## Recargas, consola y red

- En toda la pasada de interacción: `performance.getEntriesByType('navigation').length` = 1, `__v23.navigationCount()` = 1, 0 eventos `Page.frameNavigated` y generación de documento constante (2 = carga inicial + seed; 1 en la sesión bloqueada). Las únicas navegaciones fueron el seed y las recargas explícitas de las pruebas de tutorial/bloqueado.
- 0 errores de consola y 0 excepciones en todas las sesiones; 3 avisos esperados (uno por carga) solo con almacenamiento bloqueado.
- 0 peticiones no locales: solo el documento `file://` y retratos `data:image/png`; coherente con CSP `connect-src 'none'`.

## Hallazgos (6 con seguimiento; 8 notas completas en `qa-phase1.json`)

1. **[Baja · API] `window.__v23.welcome` es `null`.** `part15` enlaza `root.welcome = window.__v23Welcome`, pero `part14` expone `window.__v23welcome`. QA usó `window.__v23welcome`. Corrección de una línea en `part15-v23-integration.js`: `root.welcome = window.__v23welcome`.
2. **[Informativa · Bienvenida] Desborde interno decorativo de `.titleScreen`.** `scrollWidth/scrollHeight` internos superan la ventana (p. ej. 99×94 px a 1308×662) por `.v23wBg`, `.v23wAura` y el retrato; `overflow:hidden` los recorta y ningún control/texto sale de la ventana. Documento sin desbordes en los 7 tamaños (evidencia `data/overflow.json`).
3. **[Informativa · Etiqueta] «V2.3 · FASE 1» en mayúsculas a ≥1024 px.** El texto fuente es «V2.3 · Fase 1»; el CSS lo transforma. La versión es visible e inequívoca en todos los tamaños.
4. **[Informativa · Navegación] Mapa vuelve al atrio (hub), no a la bienvenida.** Comportamiento heredado de V2.2; Ajustes y Ayuda sí vuelven a la bienvenida. Se documenta para que el coordinador confirme si es el retorno esperado.
5. **[Informativa · QA/guardado] `heroSwitchCheck()` reporta 0 grupos de atuendo.** Los guardados de QA (`all` y `mixed`) tienen `collection.equipped = {}`; por eso los 10 héroes salen con 0 grupos. `savedUnchanged=true` y el guardado no cambia; el Agente 1 validó la conservación con un guardado con atuendo.
6. **[Baja · Accesibilidad 640×360] Controles compactos.** Tarjetas de ruta de 20 px de alto y visor de tienda de 192×40: visibles y accesibles, pero por debajo de 44 px táctiles. No incumple el criterio de la fase; se anota para una mejora futura.

## Evidencia

- **88 capturas y 6 hojas de contacto** en `.work/v2.3/agents/qa/shots/`: 28 de los 7 tamaños (bienvenida, tutorial, tienda, inventario), 4 de tutorial/recarga, 6 de almacenamiento bloqueado, 27 de efectos/marcos, 9 del catálogo, 3 de calidad, 7 de reducción de movimiento y 4 de regresión.
- **6 hojas de contacto** (todas ≤1600 px en ambos lados): `sheet-efectos-3-heroes.jpg` (1.548×1.004), `sheet-marcos-3-heroes.jpg` (1.320×1.064), `sheet-tamanos-a.jpg` (1.320×1.416), `sheet-tamanos-b.jpg` (1.320×1.064), `sheet-catalogo-1308x662.jpg` (1.560×832), `sheet-bloqueado.jpg` (1.232×440).
- **Datos crudos**: `data/probe.json`, `sizes.json`, `tutorial.json`, `matrix.json`, `visor.json`, `catalog.json`, `misc.json`, `perf.json`, `reduced.json`, `regression.json`, `blocked-welcome.json`, `overflow.json`.
- **Resumen estructurado**: `qa-phase1.json` (build, casos PASS/FAIL/NOTE, métricas, FPS, matriz, fallos y rutas de capturas).

## Límites

- Importar/exportar no se probó con archivos, según el encargo de esta fase.
- Las capturas se tomaron en Chrome headless con SwiftShader; los FPS (75) son la referencia de este entorno, no una medida de hardware real.
- No se modificó el juego ni archivos compartidos. No se usaron imágenes de IA ni Game Studio build/export.
