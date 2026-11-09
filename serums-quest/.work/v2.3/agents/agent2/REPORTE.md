# REPORTE · AGENTE 2 · VISOR Y ESCENARIO DE PRUEBA (V2.3 Fase 1)

Fecha: 2026-11-08 · America/Lima
Propiedad respetada: solo se escribieron `part12-v23-visor.js`, `part12-v23-visor.css` y `agent2/`. No se tocaron `game.js`, `game.json`, `dist/`, `export/`, `.work/build-game.js`, `.work/v2.3/qa/cdp.js`, otros `part*`, assets, HUB, `legacy`, `archivo/`, `_backups/`, `INTEGRITY.sha256` ni study-dashboard/flashcards. Sin imágenes de IA. Slots de Game Studio intactos. Sin dependencias nuevas.

## Archivos propios

- `.work/src/part12-v23-visor.js` (47,4 KB): motor 3D del visor, encuadre por ranura, selector de 10 héroes, zoom, escenario por rareza, refuerzo local de efectos/marcos y API QA.
- `.work/src/part12-v23-visor.css` (9,2 KB): escenario limpio, franja de rótulos/controles, fondos por rareza y responsive.
- `.work/v2.3/agents/agent2/scripts/` (`diag2.js`, `probe.js`, `evidence.js`) y `.work/v2.3/agents/agent2/evidence.json`.
- `.work/v2.3/agents/agent2/shots/evidence/` (54 capturas) y `evidence/sheet-*.jpg` (5 hojas de contacto; ninguna supera 1560 px).

## Causa raíz → corrección

| # | Causa raíz comprobada | Corrección |
|---|---|---|
| 1 | **Cámara sin FOV/aspecto**: `v22FramePreview` usaba distancias fijas (2,1–4,9) para un canvas de 436×183; a 26° de FOV solo cabía la cara. | Encuadre nuevo calculado con `Box3` del avatar completo + cajas reales de cada malla/sprite (incluida la pieza) y la FOV/aspecto vivos; distancia exacta por esquina con padding 1,12–1,20. Encuadre por ranura: **busto** (cabeza/peinado), **medio cuerpo** (torso, amuletos, accesorios, extras), **cuerpo completo con suelo** (piernas, efectos, estela, marco, mascota). |
| 2 | **La tienda no probaba piezas poseídas**: `V22.shopTryId` solo se asignaba si `!cosmeticOwned(id)`; al elegir un efecto/marco ya poseído el visor seguía mostrando el atuendo equipado. | La pieza seleccionada se aplica siempre a la previsualización de tienda (también poseída), sin tocar `shop.selectedId`, la selección de tarjetas ni el guardado. En inventario se mantiene el borrador guardado y no se modifica. |
| 3 | **Marco flotante**: `buildFramePiece` centra la geometría en y=1,35 y `animateAvatarCosmetics` volvía a sumar `baseY=1,35` al grupo; el marco quedaba sobre la cabeza y fuera de cámara. | En el visor se fija `baseY≈0` para la animación del marco y se conserva el origen real; ahora rodea el cuerpo completo. |
| 4 | **Aditivos casi invisibles**: `toneMapped` con ACES apagaba los brillos, opacidades 0,12–0,2, bruma con mezcla normal y sprites ocluidos por el cuerpo. | `toneMapped=false`, opacidad/medida ajustadas, `renderOrder`, `frustumCulled=false`, halos suaves y `depthTest` según pieza. Bruma pasa a aditivo visible. En baja calidad se respetan los `qCount` (p. ej. chispas 9→3). Con reducir movimiento los efectos quedan fijos pero visibles. |
| 5 | **Texto sobre la pieza**: nombre del héroe, rareza, ranura, «Prueba en vivo» y «Arrastra para girar» estaban dentro del canvas y tapaban la pieza. | El canvas queda como rectángulo limpio; todos los rótulos y controles viven en una franja propia debajo del canvas. |
| 6 | **Sin selector ni zoom**: `V22.previewMode` fijaba al héroe equipado y no había controles. | Selector de los 10 héroes con `V23.preview.heroId`; al cambiar se reconstruye solo el avatar del visor (sin `renderScreen`, sin `persist`, sin cambiar el héroe equipado). Zoom +/−, rueda y botón «Restablecer». |
| 7 | **Canvas diminuto**: el mount V2.2 medía 180–270 px de alto. | En escritorio el escenario mide ~318 px de alto útil a 1308×662 (436×318) y hasta 330 px; el mount conserva el renderer vivo. |
| 8 | **Z-fighting / suelo ausente**. | Suelo/plataforma sólo en ranuras de cuerpo completo, con discos/aros aditivos, `depthWrite=false`, offsets de Y y sin intersección con la pieza. Luz de borde y fondo degradado por rareza. |

## Comportamiento entregado

- Montajes en `#shopPreviewMount` y `#wardrobePreviewMount`; se conservan `v22FramePreview`, `updateWardrobeAvatar`, `mountWardrobePreview`, `v22MountShopPreview`, `updateWardrobePreview`, `v22UpdateShopPreview` y `ensureWardrobePreview` como nombres compatibles para el catálogo del Agente 3.
- Un único `WebGLRenderer` y canvas para toda la sesión (`canvasId` `v23-vis-1`): sobrevive a cambios de pieza/héroe, cambio de pantalla y reapertura de tienda. No se recrea al cambiar de pieza/héroe.
- `v22UpdateShopPreview()` refresca el visor sin rehacer la pantalla y limpia el override de QA.
- API `window.__v23Visor`: `openShop`, `openWardrobe`, `select`, `clearSelect`, `hero`, `zoom`, `reset`, `info`, `measure`, `catalog`, `quality`, `reducedMotion`, `fps`, `tree`.
  - `info()` devuelve canvas (buffer/CSS), `canvasId`, categoría, héroe, pieza, rareza, zoom, cámara y `effect.visible/projected`.
  - `measure()` compara píxeles con la pieza oculta/visible y devuelve píxeles, cobertura, bbox y deltas.

## Resultado medido

- **27/27** combinaciones de 3 héroes (Ilan, Noa, Zenón) × 9 piezas (5 efectos + 4 marcos): `projected.inside=true`, `effect.visible=true` y `measure().visible=true`; 15/15 efectos y 12/12 marcos con píxeles reales (efectos 1.901–20.676 px; marcos 10.647–28.882 px).
- Tienda a 1308×662: escenario **436×318**, mount 438×373, HUD 436×53; sin desborde horizontal. Inventario a 1308×662: **384×273**.
- Matriz 640×360, 844×390, 1024×600, 1308×662, 768×1024, 1280×720, 1920×1080: visor completo, `overflowX=false` en los siete. Etapas: 438×165, 438×165, 301×255, 384×273, 438×329, 374×330, 411×522. En portrait 768×1024 se fuerza 4:3 y en pantallas estrechas el mount se centra a máx. 440 px.
- **FPS del visor: 75 fps** (188 frames en 2,51 s; el bucle del juego también da 75 en Chrome headless sin vsync). Sin errores de consola en toda la sesión.
- Selección de los 10 héroes: `renderCount` delta **0**, mismo canvas, héroe equipado y guardado idénticos (`saveEqual=true`).
- Reapertura: canvas vivo, mismo `canvasId`, `rendererAlive=true`.
- Zoom: 1 → 1,12 (+), reset 1, rueda 1,08. Botones y rueda funcionando.
- Calidad baja + movimiento reducido: chispas 9→3 sprites, aun así visibles (516 px medidos); efectos estáticos.
- Miniaturas: 33 en caché, sin cambios en `v22RenderThumb`.

## Evidencia

- `evidence/sheet-heroes-effects.jpg`: 15 capturas (3 héroes × 5 efectos).
- `evidence/sheet-heroes-frames.jpg`: 12 capturas (3 héroes × 4 marcos).
- `evidence/sheet-sizes.jpg`: visor en los 7 tamaños.
- `evidence/sheet-effects-3-sizes.jpg`: efectos/marco a 640×360, 1308×662 y 1920×1080 + baja calidad/movimiento reducido.
- `evidence/sheet-windows.jpg`: ventana completa de tienda (3 héroes) y de los 7 tamaños.
- Capturas individuales en `shots/evidence/`; datos crudos en `evidence.json`.

## Decisiones simples / límites

- El panel derecho de tienda conserva el detalle V2.2 debajo del visor; con el visor a 318 px el detalle queda en ~122 px y hace scroll. El Agente 3 reserva/rediseña ese panel; el visor no cambia la estructura del catálogo.
- En 640×360 y 844×390 el visor de tienda ocupa la columna estrecha que fija el catálogo V2.2; en inventario se centra a 440 px. Prioridad: pieza completa sobre tamaño.
- `cabeza`/`peinado` encuadran busto; si la pieza sobresale (p. ej. melena), su caja se incluye y no se recorta. El resto de ranuras usan medio cuerpo o cuerpo completo con suelo.
- Sin imágenes de IA ni assets nuevos; geometría/materiales existentes + CSS propio. El refuerzo de efectos es local al avatar del visor: no altera los builders compartidos ni las miniaturas.
- El botón «Restablecer» vuelve a zoom 1 y al ángulo por defecto de la ranura; el arrastre sigue disponible.

## Pipeline usado

```powershell
$env:GAME_OUT=".work/v2.3/preview/a2-game.js"; $env:GAME_PARTS_ONLY="part12-v23-visor"; $env:GAME_CSS_ONLY="part12-v23-visor"; node .work/build-game.js
node .work/v2.3/tools/make-test-html.js .work/v2.3/preview/a2-game.js .work/v2.3/preview/a2.html
node .work/v2.3/agents/agent2/scripts/evidence.js
```

Build final de prueba: `game.js` 2.722.716 B; `node --check: OK`. No se usó Game Studio build.
