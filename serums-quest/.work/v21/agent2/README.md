# Agente 2 · SERUMS QUEST V2.1 · banderines/estandartes

## Objetivo

El estandarte de arena atravesaba el palo por la mitad. Corregir todos los
banderines/estandartes/banderas/colgantes/telas sin tocar nada fuera de
`.work/src/part5-assets.js` ni ejecutar builds.

## Causa raíz

En `.work/src/part5-assets.js` (versión original) los tres estandartes de la
arena eran `THREE.Sprite` con la textura del banderín y `scale (0.76, 1.0)`,
colocados exactamente en el eje del palo:

```js
sprite.position.set(sx, 1.98, sz);   // sx, sz = cos/sin(30°,150°,270°) * 5.85
```

Un sprite tiene pivote central y siempre mira a cámara, así que el mástil
(0.09 de lado, de y=0 a y=2.33) quedaba proyectado justo por el centro de la
tela (el paño ocupaba 18..174 de 192 px del canvas). El resultado era el palo
partiendo el banderín por la mitad y ocultando el motivo central.

## Solución aplicada (solo `part5-assets.js`)

1. **Textura re-anclada** (`v2aBannerTexture`, líneas 718-783): la driza ocupa
   `u = 0` del canvas y todo el paño crece hacia la derecha. Se sustituyó la
   barra horizontal superior (que era el "palo" dibujado) por un orillo vertical
   de driza, galón, motivo centrado, muesca de golondrina y colgantes. Se
   conserva el `CanvasTexture` de 192×256, el gradiente por área y el motivo.
2. **Malla plana con pivote en el borde** (líneas 1373-1416):
   `PlaneGeometry(0.66, 1.02, 10, 12)` trasladada `(+width/2, -height/2)` para
   que el origen de la geometría sea el borde de la driza y el borde superior.
   La malla hija está a `x = 0.075` dentro de un `Group` pivote situado en el
   eje del palo. Así el pivote propio de la tela es el borde y la tela queda
   media anchura hacia fuera.
3. **Material** `MeshBasicMaterial` con `side: THREE.DoubleSide`, `map` canvas,
   `transparent`, `depthWrite:false`, `fog:false`, una sola textura y un solo
   material compartido (3 mallas, mismos 3 draw calls que antes).
4. **Billboard alrededor del palo, no del centro** (líneas 1598-1620): cada
   frame se calcula el ángulo hacia la cámara desde el eje del palo
   (`atan2(camX - origenX - baseX, camZ - origenZ - baseZ)`) y se rota el
   `Group` pivote. El borde de la driza se mantiene sobre el palo; la tela
   queda a un lado. Funciona también con «reducir movimiento» (el billboard se
   actualiza antes del `if (motion) return`).
5. **Ondulación anclada** (líneas 1621-1641): onda de vértices con
   `u = x / width` y `anclaje = u * (0.32 + 0.68 * drop)`; en el borde
   (`u = 0`) el desplazamiento es exactamente 0 en X, Y y Z y crece hacia el
   vuelo. Máximo ~0.048 m en el borde lejano al tiempo del harness. Se guarda
   una copia `Float32Array` de las posiciones base para no derivar.
6. **Separación y remate** (líneas 1386-1390): `pGap = 0.075` desde el eje.
   El palo mide 0.09 de lado (medio lado 0.045, esquina 0.0636), así que el
   barrido completo del billboard deja 0.0114 m de aire mínimo en la esquina y
   0.030 m de frente. `pTop = 2.24` deja 0.06 m libres bajo el remate, que
   empieza en 2.30: no hizo falta mover el finial ni tocar la geometría del
   palo.
7. **Limpieza**: `v2aArena.origin` se captura con `group.getWorldPosition` al
   montar la variante (líneas 1498-1505) y se anula en
   `v2aClearArenaVariant` (línea 1535).

No se tocaron posiciones de interacción, colisiones, cámara, HUD ni ningún
otro archivo del proyecto. No se ejecutó ningún build.

## Validación

- `node --check .work/src/part5-assets.js` → OK (exit 0).
- Harness propio con three.js **0.187.0**, la misma revisión que el bundle de
  `dist/index.html`: se carga el `part5-assets.js` real y se ejecutan
  `v2aApplyArenaVariant` y `v2aUpdateArena`.
- Resultado (`shots/validation.json`), idéntico en las 5 vistas y con
  «reducir movimiento»:

| Comprobación | Valor |
|---|---|
| Banderines | 3 |
| Vértices por malla | 143 |
| Pivote geometría (borde) | x = 0.000 |
| Borde de la tela al eje del palo | 0.075 m |
| Aire mínimo barrido 360° (esquina del palo) | 0.0114 m |
| Aire de frente | 0.030 m |
| Aire bajo el remate | 0.060 m |
| Material | `DoubleSide` |
| Onda en la driza | 0.00000 |
| Onda máxima en el vuelo | 0.0483 m (0 con reducir movimiento) |
| Errores de página | 0 |

Las aserciones del `shot.mjs` fallan si el pivote no es 0, si el borde entra
en el palo, si el barrido toca el palo, si toca el remate, si no es
`DoubleSide` o si la onda no es cero en la driza. Las 9 capturas pasaron.

## Evidencia visual

- `shots/antes-despues.png` — comparativa recortada antes/después.
- `shots/orig-duel.png` / `shots/duel.png` — vista real de duelo.
- `shots/close30_detalle.png` — detalle del borde y del aire.
- `shots/inside.png`, `shots/back.png`, `shots/side.png`.
- `shots/motion-back.png`, `shots/motion-close30.png` — reducir movimiento.
- `shots/contacto-vistas.png` — hoja de contactos.

El "antes" se renderizó con `part5-assets.orig.js` (copia íntegra del archivo
original guardada aquí) y el mismo harness/cámara.

## Archivos de este agente

- `.work/src/part5-assets.js` — **único archivo de juego modificado**.
- `.work/v21/agent2/harness.html` — harness (three 0.187 local en `vendor/`).
- `.work/v21/agent2/shot.mjs` — capturas/validación con puppeteer-core.
- `.work/v21/agent2/part5-assets.orig.js` — copia del original para el diff.
- `.work/v21/agent2/shots/**` — capturas y `validation.json`.

Para reproducir: `python -m http.server 8765 --directory .work` desde
`serums-quest/`, `npm i puppeteer-core@24` en esta carpeta y
`node shot.mjs duel inside close30 back side motion-close30 motion-back orig-close30 orig-duel`.

## Barrido de otros archivos

Se buscó `banner|flag|estandarte|banderín|pennant|crest|tela|capa|cola|colgante`
en todo `.work/src` y en `assets/`.

- **No hay otros banderines/estandartes 3D en el proyecto.** Los únicos son
  los 3 de `part5-assets.js`.
- `part2-world.js`, `part7-duel.js`, `part9-perf.js`: sin coincidencias.
- `part6-world.js` / `part6-world.css`: `.v2-world-banner` y
  `v2wFlashBanner` son avisos DOM (toast), no tela 3D.
- `part3m-final.js` / `part3n-final.css`: `storageBanner`/`backupBanner` son
  avisos DOM de guardado.
- `part3c-cosmetics-models.js`: `x-capa-errorario` es una capa del avatar
  (cajas sobre la espalda, sin palo) y `c-type:'cloth'` anima la falda; no hay
  estandarte atravesado. Pertenece al Agente 0; no se tocó.
- `assets/`: 12 slots de personajes/armas/objetos; ninguna imagen de banderín.

## No verificado visualmente

- La composición final dentro del juego real: no se ejecutó el build y
  `part2-world.js` estaba siendo modificado por el Agente 1 durante esta
  tarea. El harness renderiza el código real de `part5-assets.js` con la
  cámara de duelo, pero no la escena completa de `part2-world.js` (dais,
  pilares, luces y post-proceso del juego).
- El comportamiento en móvil real/GPU de gama baja: el coste añadido es de
  3 mallas de 143 vértices (mismos draw calls) y ~858 `Math.sin`/frame en la
  onda, pero no se midió FPS en dispositivo.
- La apariencia exacta con las calidades baja/media/alta del juego: el
  harness fuerza `quality() = 'alto'`; el código de los banderines no depende
  de la calidad.
