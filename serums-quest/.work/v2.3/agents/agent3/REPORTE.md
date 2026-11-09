# AGENTE 3 · Catálogo de tienda e inventario · V2.3 Fase 1

Fecha: 2026-11-08 · Estado: **ENTREGADO · part13 congelado**.

## Qué cambió

- **Tienda con tres zonas** (riel de filtros · catálogo · visor+detalle) a ≥1200 px; a 900–1199 el riel pasa a barra superior y quedan 2 columnas (catálogo + visor); a <900 una columna con catálogo y visor/detalle debajo.
- **Cuadrícula a toda la altura**: `repeat(auto-fill, minmax(132px, 1fr))`, 4 columnas a 1308 px, tarjetas compactas de **136 px** (miniatura 82 + nombre + rareza·ranura + estado + precio). Ya no queda vacío debajo del catálogo.
- **Cabecera comprimible**: 60 px a 1308×662 (< 80); a ≤620 de alto desaparece el eyebrow y baja el h1; contador de resultados y saldo siempre visibles. El h1 ya no se recorta (`line-height: 1.12`, overflow visible).
- **Filtros**: ranura, rareza, estado (Todos/Poseídos/En tienda/Bloqueados; en inventario Todos/Solo poseídos) y colección (Todos, Originales, Recompensas, Maestría, Títulos, Extras). Búsqueda por nombre/descripción (acentos incluidos) con **debounce de 150 ms** y botón limpiar; orden por rareza, precio ↑/↓ y nombre.
- **Miniaturas bajo demanda** con `IntersectionObserver` (margen 160 px) sobre `V22.thumbCache`/`v22RenderThumb`. Esqueleto limpio de altura fija (sin salto). 16 generadas al abrir a 1308×662, no 33/69.
- **Actualizaciones incrementales**: buscar/filtrar/ordenar/seleccionar/comprar/equipar no llaman a `renderScreen` ni tocan el canvas del visor. Se conserva la selección si sigue visible y el scroll al seleccionar/comprar/equipar; al cambiar filtro/búsqueda/orden la cuadrícula vuelve arriba (decisión documentada).
- **Compra y equipado** siguen funcionando: refrescan solo tarjeta, contador, saldo y detalle.
- **Inventario** con el mismo estándar: chips de ranura (con «Todas»), búsqueda, filtros y orden sobre `#wardrobeItemsGrid`, detalle bajo la cuadrícula, `#wardrobePreviewMount` y `#wardrobeItemsGrid` intactos para el Agente 2. Corregida la especificidad de V2.2 (`3 columnas 178/448/645`) con `.v23WardrobeShell .v23WardrobeGrid { 400px / 1fr }`: visor de 380×393 y catálogo de 880 px, sin columna vacía.
- **Responsive vertical**: a ≤520/≤420 de alto las tarjetas bajan a 116/104 px y el detalle se recorta a 34/30 dvh; a 640×360 y 844×390 el catálogo mantiene scroll interno y el visor sigue presente (192×40 / 257×49 en el layout de una columna). En inventario estrecho el panel completo se desplaza para que el detalle sea alcanzable.

## Archivos propios

- `.work/src/part13-v23-shop.js` (≈53 KB)
- `.work/src/part13-v23-shop.css` (≈19 KB)
- Scripts/capturas: `.work/v2.3/agents/agent3/` (`qa.js`, `probe*.js`, `integrated.html`, `shots/`, `evidence/`).
- No se editó `game.js`, `game.json`, `dist/`, `export/`, `build-game.js`, `cdp.js` ni otros `part*`.

## 12+ a 1308×662: **SÍ**

Medido por intersección real con el viewport **y** con el rect visible de la cuadrícula (`__v23Shop.state()`):
**12 tarjetas completas** (3 filas × 4 columnas) y **16 intersectando** (4 parciales de la 4.ª fila). Tarjeta 136 px, cabecera 60 px, visor 400×317, sin scroll del overlay.

| Tamaño | Total | Visibles | Completas | Cols | Tarjeta | Cabecera | Visor | Desborde X | Thumbs al abrir |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: |
| 640×360 | 33 | 4 | 4 | 4 | 104 | 31 | 192×40 | 0 | 4 |
| 844×390 | 33 | 10 | 5 | 5 | 104 | 32 | 257×49 | 0 | 10 |
| 1024×600 | 33 | 16 | 12 | 4 | 136 | 33 | 360×287 | 0 | 16 |
| **1308×662** | **33** | **16** | **12** | **4** | **136** | **60** | **400×317** | **0** | **16** |
| 768×1024 | 33 | 20 | 15 | 5 | 136 | 53 | 233×190 | 0 | 20 |
| 1280×720 | 33 | 20 | 16 | 4 | 136 | 60 | 400×329 | 0 | 20 |
| 1920×1080 | 33 | 33 | 33 | 6 | 136 | 93 | 400×329 | 0 | 33 |

Inventario: 1308×662 → 15/15 visibles (12 completas), 6 columnas, visor 380×393; 844×390 → 6/3; 640×360 → 4/2.

## Pruebas de interacción (integradas a3+a2+a4)

| Prueba | Resultado |
| --- | --- |
| Búsqueda «corona» | 33 al pulsar (debounce pendiente) → 1 a los 330 ms; scroll 280→0; `renderCount` +0; canvas mismo nodo |
| Limpiar búsqueda | 33; `renderCount` +0 |
| Orden precio ↑ | ◇85, ◇90, ◇95, ◇110…; `renderCount` +0 |
| Estado «En tienda» | 23, todas con estado «En tienda»; `renderCount` +0; scroll 0 |
| Colección «Extras» | 36, todas `x-*`; estados «Se gana»/«Poseído»; `renderCount` +0 |
| Búsqueda sin resultados | 0 + estado vacío con botón limpiar |
| Limpiar filtros | 69; `renderCount` +0 |
| Selección con scroll 430 | selección y scroll 430 conservados; `renderCount` +0; canvas intacto |
| Compra ◇85 | saldo 500→415, poseídos 34→35, tarjeta «Poseído», chips actualizados; `renderCount` +0; canvas intacto |
| Equipar | atuendo `accesorios: c-accesorios-brujula`; `renderCount` +0 |
| Miniaturas | 16 al abrir; +38 tras saltar al final (54 cacheadas de 69; las intermedias cargan al pasar) |
| Inventario: selección, ranura, búsqueda, guardado | `renderCount` +0 en los cuatro; canvas mismo nodo |
| Recargas completas | 0 (`navigation = 1`); errores JS: 0 |

## API de QA (`window.__v23Shop`)

`openShop()`, `openWardrobe()`, `close()`, `setup('shop'|'wardrobe')`, `state()`, `visible()`, `total()`, `counts()`, `select(id)`, `search(q)`, `sort(key)`, `filter(kind, value)`, `resetFilters(defaults)`, `scrollGrid(top)`, `thumbs()`, `outfit()`, `allOutfits()`, `draft()`, `saved()`, `canvas()`, `errors()`.

Selectores: `[data-v23-shop-screen]`, `[data-v23-wardrobe-screen]`, `[data-v23-shop-head]`, `[data-v23-shop-rail]`, `[data-v23-shop-catalog]`, `[data-v23-shop-detail]`, `[data-v23-grid]`, `[data-v23-card]`, `[data-v23-count]`, `[data-v23-coins-value]`, `[data-v23-owned]`, `[data-v23-filter-slot|rarity|status|collection]`, `[data-v23-sort]`, `[data-v23-search]`, `[data-v23-search-clear]`, `[data-v23-reset]`.

## Evidencia

- `.work/v2.3/agents/agent3/evidence/qa-agent3.json` (medidas completas de los 7 tamaños + interacciones + inventario).
- `.work/v2.3/agents/agent3/evidence/summary.json` (resumen compacto; `check12At1308x662.verdict = CUMPLE`).
- `.work/v2.3/agents/agent3/evidence/hoja-contacto-tienda.jpg` (15 capturas) y `hoja-contacto-inventario.jpg`.
- Capturas individuales en `.work/v2.3/agents/agent3/shots/` (7 tamaños + búsqueda, orden, filtros, compra, equipado, inventario).

## Decisiones simples (documentadas)

- La tienda usa el catálogo completo (69) pero **abre en «Originales» (33)** para conservar el catálogo comercial de V2.2; los extras se consultan como referencia y nunca se compran («Se gana», requisito visible).
- «En tienda» = original sin poseer con nivel/logro cumplidos; «Bloqueados» = requisito pendiente o extra que se gana. El saldo no cambia el estado de la tarjeta (se explica en el detalle), para que comprar no invalide el filtro.
- «Extras» es el conjunto completo de extras (36); Recompensas/Maestría/Títulos son subconjuntos disjuntos. Se muestra el recuento en cada opción.
- Cambiar filtro/búsqueda/orden lleva el scroll de la cuadrícula arriba; seleccionar, comprar y equipar lo conservan.
- En inventario el estado por defecto es «Todos» (como V2.2) con opción «Solo poseídos».
- Prueba de QA realizada sobre el build integrado a3+a2+a4 (`integrated.html`) y, además, el build aislado `GAME_PARTS_ONLY=part13-v23-shop` funciona sin errores.
