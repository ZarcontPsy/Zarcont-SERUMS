# Agente 1 · geometría/collisión voxel y parpadeo (V2.1)

Banco de pruebas y notas de la corrección del **z-fighting** de SERUMS QUEST.
No construye el juego, no toca `game.js`/`dist/`/`export/` y solo escribe en esta carpeta.

Archivos propios modificados:
- `.work/src/part2-world.js`
- `.work/src/part3c-cosmetics-models.js`

## 1 · Causa raíz

1. **`mergedVoxels` fusionaba cada caja como un cubo completo de 6 caras**
   (`part2-world.js:104-141` en la versión previa). Las cajas son axis-aligned y
   muchas comparten planos exactos: pelo/cara (`makeHead`, p. ej. caja de pelo
   `z=[-0.26,0.22]` y cara `z=[-0.22,0.22]`), placas sobre el torso, cinturones,
   detalles del arma, hombreras, botas, etc. Al quedar en la misma malla (o en
   mallas distintas con el mismo material) dos caras coplanaradas del mismo
   sentido se disputan el mismo valor de profundidad → parpadeo.
2. **Partes del héroe en mallas separadas**: la cabeza base y el pelo se
   construían con dos `addPartBoxes`; los detalles de identidad compartían malla
   con el pelo. Cosmético, prenda base, capa nativa, cola de pelo, arma y mano
   quedaban en mallas distintas sin orden de profundidad determinista.
3. **`applyOutfitToAvatar` solo ocultaba `baseHatGroups`**: el pelo base seguía
   debajo del peinado, la cola de pelo solo se ocultaba con `outfit.peinado` y
   nunca se ocultaba la capa nativa bajo prendas que cubren la espalda. Las
   superficies coplanaradas entre base y cosmético quedaban visibles.
4. **Cámara `0.1/500`** y **`PCFSoftShadowMap`**:
   `dist/index.html` incluye three r187, que ya avisa
   `WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead.`
   El tipo efectivo era PCF, pero el warning se emitía en cada arranque y el
   sesgo de sombra (`bias=-0.001`, sin `normalBias`) no estaba ajustado al PCF.
5. **Transparencias**: la bruma usaba blending normal ordenado por distancia
   (`sortObjects`), el halo de mascota escribía profundidad siendo transparente
   y el aura/estela/marco no tenían `renderOrder` fijo.

## 2 · Cambios por archivo

### `.work/src/part2-world.js`

| Línea | Cambio |
|---|---|
| 28 | `renderer.shadowMap.type = THREE.PCFShadowMap` (elimina el warning de r187) |
| 48 | `PerspectiveCamera(42, 1, 0.2, 320)`; conserva estrellas (radio máx. ~295 desde la cámara) y arena |
| 106-374 | **`mergedVoxels` reescrito**: normaliza tamaños, descarta cajas degeneradas, deduplica cajas idénticas (prioriza glow), descarta cajas contenidas, culla caras interiores/de contacto, resuelve caras coplanaradas del mismo sentido con **resta de rectángulos 2D** (gana glow y luego el índice mayor) y emite cuads con el winding de una `BoxGeometry` plantilla (normales y colores intactos). Estadísticas en `mergedVoxelsStats`. |
| 383-410 | `setVoxelDepthLayer(root, unidades)`: asigna `polygonOffset` por capa con factor `-1`; cada capa semántica usa múltiplos de 10 y la malla `voxels-glow` queda un paso más cerca, de modo que nunca hay dos mallas con el mismo offset. |
| 542-548 | El pelo base pasa a su propio grupo `base-hair` (capa 1) y se puede ocultar entero; antes iba mezclado con los accesorios. |
| 658-664 | Accesorios/detalles de cabeza en `base-head-details` (capa 3). |
| 920-945 | Detalles de torso/cuerpo, capa nativa y cola de pelo en subgrupos con nombre y capa 1. |
| 1131-1133 | Arma en capa 1 (gana empates contra la mano). |
| 1600-1602 | `moonLight.shadow.bias = -0.0006`, `normalBias = 0.028` (1 texel del mapa 1024/26 unidades) |
| 2684 | Cámara de retratos `PerspectiveCamera(25, 1, 0.2, 30)` |
| varios | Nombres de grupos/mallas (`hero-head`, `hero-torso`, `hero-arm-*`, `base-weapon`…) para QA; z-fighting interno de guardianes resuelto por el nuevo `mergedVoxels` + capas de ramas/hojas/manos/bandejas/lentes/paneles/placa del prisma |

### `.work/src/part3c-cosmetics-models.js`

| Línea | Cambio |
|---|---|
| 43-63 | `COSMETIC_DEPTH_LAYER` (cabeza 12 … marcos 2), `COSMETIC_Z_LIFT` (0,004–0,005 en Z, solo piezas sólidas) y `HEAD_COSMETIC_HIDES_HAIR` (casco/gorro); `applyCosmeticLayering` aplica `polygonOffset` único y el desplazamiento mínimo al montar. |
| 257 | `coversBack` para manto, poncho, abrigo, bata y capa del Errorario. |
| 426-431, 445-450, 483-501, 524-525, 578-581 | `renderOrder` fijo en aura, bruma (orden estable, blending normal), marco, halo de mascota y estela; `depthWrite:false` en el halo y el aro del aura. |
| 609-622 | `addPieceGroup` aplica capa + desplazamiento + nombre `cosmetic-<slot>-<id>`. |
| 624-647 | `clearAvatarCosmetics` restaura sombreros, **pelo base**, cola y **capa nativa**. |
| 648-695 | `applyOutfitToAvatar` oculta de verdad: sombreros con tocado/peinado, **todo el pelo base** con peinado, pelo en casco/gorro, **cola** con peinado y **capa nativa** con prendas que cubren la espalda. |

## 3 · Banco de pruebas

Sin dependencias. Usa el three.js r187 ya empaquetado en `dist/index.html`
(solo lectura), los datos de `src/campaign.json` + `src/extras.json` + `game.json`,
los 10 `HERO_LOOKS` de `part1-core.js` y **los dos archivos reales** de `.work/src`.
Renderiza con el **renderer, escena, luces, cámara y shadowMap reales** del juego
(oculta el atrio y la arena) para que near/far y sombras se prueben de verdad.

- `build-harness.js` → genera `harness.html` (three + datos + part2 + part3c + driver).
- `driver.js` → escenarios y métricas.
- `run.js` → Chrome/Edge headless con CDP (perfil limpio, `file://`, sin red) y guarda informe + capturas.

```
node .work/v21/agent1/build-harness.js
node .work/v21/agent1/run.js --label despues --mode full      # ~20 s en SwiftShader
node .work/v21/agent1/run.js --label rapido --mode quick      # sin auditoría por cosmético
node .work/v21/agent1/run.js --label antes --mode full --strict
```

Salidas en `.work/v21/agent1/out/`:
`report-<label>.json` y `shots/<label>-*.jpg`.
Requiere Chrome o Edge (`CHROME_PATH` si no está en las rutas habituales).

### Qué mide

1. **Parpadeo de píxeles interiores planos** (prueba principal):
   384×384, 3 distancias × 4 ángulos, dos fotogramas con la cámara desplazada
   `0,0014 rad` y `0,00012 rad` de elevación. Un píxel cuenta si su color cambia
   ≥18/255 **y** su vecindad de radio 3 px es plana (≤7/255) en ambos fotogramas.
   Así los bordes/siluetas no cuentan: solo superficies planas que cambian de
   color por empate de profundidad. `control` renderiza dos veces sin mover la
   cámara y debe dar `0` (determinismo).
2. **Auditoría geométrica** de caras coplanaradas del mismo sentido que se solapan
   de verdad (SAT 2D sobre triángulos, no AABB). Separa:
   - `sameMesh…`: dentro de la misma malla (debe ser 0 tras el culling);
   - `unresolvedCrossColorPairs`: mallas distintas con **la misma capa**
     `polygonOffset` (riesgo real);
   - `raw/crossColorPairs`: todas las parejas de color distinto, incluidas las
     resueltas por capas distintas.
   Las parejas con capas distintas no parpadean: el offset desempata siempre.
3. Escenarios: 10 héroes con todas las ranuras, 5 guardianes, 10 efectos y
   **69 cosméticos × 10 héroes (610 casos)** equipados uno a uno.

Umbral de aceptación (`summary.ok`): `control.changed === 0 &&
flickerTotal === 0 && coplanarUnresolvedTotal === 0`.
`flickerTotal` es la suma de píxeles interiores planos cambiados en héroes,
guardianes y efectos.

## 4 · Resultados

| Métrica | Antes (código previo) | Después |
|---|---|---|
| Control de determinismo | 0 | 0 |
| Parpadeo héroes (12 vistas × 10) | **3063** | **0** |
| Parpadeo guardianes (12 × 5) | 0 | 0 |
| Parpadeo efectos | 0 | 0 |
| Coplanaradas sin resolver (héroes + guardianes + efectos + 610 cosméticos) | no medido con capas (auditoría previa: 9931 parejas cross-color) | **0** |
| Cosmético × héroe | 610 casos, 9677 parejas cross-color | 610 casos, 3721 cross-color **resueltas por capa**, 0 sin resolver |
| Cámara | 0.1 / 500 | 0.2 / 320 |
| `shadowMap.type` | 2 (`PCFSoftShadowMap`) → 1 tras el primer render + warning | 1 (`PCFShadowMap`), sin warning |
| Cajas fusionadas (toda la ejecución) | — | 52 356; 1 191 descartadas; 19 399 caras culladas |
| Triángulos emitidos | 628 272 antes de culling | 583 850 (−7,1 %) |

Nota metodológica: las cifras «antes» se midieron con el mismo detector de píxeles
pero con la vista cercana a 1,12 m; después se subió a 1,70 m porque a 1,12 m la
cámara entraba dentro del pelo/manto de teo (artefacto de clipping del near plane,
no reproducible con las cámaras reales del juego, que no bajan de ~4,8 m).
La auditoría geométrica también se refinó a mitad del trabajo (SAT en vez de AABB
y capas), por lo que la comparación estricta es la métrica de parpadeo.

## 5 · Qué cubre

- Héroes completos: cabeza, cara, pelo base, tocados/peinados, torso base y
  placas, cinturones, capas nativas, piernas, botas, brazos, manos, arma.
- Las 10 ranuras de cosmético (cabeza, peinado, torso, piernas, accesorios,
  extras, amuletos, efectos, marcos, mascota, estela; título no tiene modelo).
- Todos los guardianes (árbol, corazón, espejo, prisma, torre) y sus piezas.
- Efectos: aura, chispas, bruma, constelación, arma, pet, estela, marcos y
  holograma de ona.
- Cámara near/far y sombras con los valores reales del juego.
- 3 distancias (1,70 / 3,05 / 8,60 m) × 4 ángulos, con cámara en movimiento.

## 6 · Qué NO pude verificar

- **No hice build** (`game.js`/`dist/`): el harness carga `.work/src` directamente.
  Falta que Agent 0 construya y que Agent 7 repita este banco y capture el juego real.
- No probé las cámaras de juego (hub 14 m, duelo 9,85 m) ni el mapa/selector de
  héroes reales, aunque el banco usa la escena/luces/cámara base del juego.
- No hay prueba numérica de acné de sombras; solo revisión visual de capturas con
  las luces reales. El ajuste es `PCFShadowMap`, `bias=-0,0006`, `normalBias=0,028`;
  si en la captura real aparece peter-panning, bajar `normalBias` a 0,02.
- No se tocan las cámaras de otros archivos: `part3d` (0.1/80), `part3f` mapa
  (0.1/120), `part5-heroes` (0.1/60). Son escenas de un solo modelo y su
  profundidad es suficiente; si Agent 0 quiere unificarlas, es su archivo.
- No probé GPU real ni móvil (SwiftShader en headless). No hay medición de FPS
  de este cambio; el culling/resta no añade allocations por frame (solo al montar).
- Los cosméticos de otros agentes que usen `mergedVoxels` (part5-assets,
  part5-combat, part6) no se renderizaron aquí; el cambio de firma es compatible
  (siguen recibiendo un `Group`).

## 7 · Qué debe capturar Agent 7 / Agent 0

1. Rebuild (`node .work/build-game.js`) y **abrir consola**: no debe aparecer el
   warning de `PCFSoftShadowMap`.
2. Selector de héroes: los 10 modelos con y sin cosméticos, de frente y de lado
   (cabeza/pelo, torso, piernas, arma en la mano, marco, mascota).
3. Duelo: un ataque de cada guardián (5 capturas) y una captura amplia de la
   arena; comprobar que no hay parpadeo en el aura/escudo/rayo.
4. Con un héroe con capa nativa (ilan/iris/zenon), equipar manto/poncho/capa del
   Errorario: la capa nativa debe quedar oculta y no parpadear.
5. Con un héroe con pelo largo (iris/zenon), equipar peinado: debe desaparecer
   todo el pelo base, no solo la cola.
6. Con casco/gorro: el pelo base se oculta por diseño (HEAD_COSMETIC_HIDES_HAIR);
   confirmar que se ve correcto.
7. Sombras: captura de suelo y del héroe con calidad media y alta; revisar acné
   y peter-panning.
8. Repetir `node .work/v21/agent1/run.js --label qa --mode full --strict` y adjuntar
   `report-qa.json`; debe dar `ok:true` (flicker 0, sin resolver 0).
