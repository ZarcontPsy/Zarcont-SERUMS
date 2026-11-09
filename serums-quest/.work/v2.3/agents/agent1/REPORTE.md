# AGENTE 1 · V2.3 · Fase 1 · Sistema de encaje 69 × 10

Fecha: 2026-11-08 · Estado: **ENTREGADO** · Matriz final: **690/690 PASS (100 %)**.

## Qué se hizo

Se sustituyó el encaje por categoría (que colgaba cada pieza de un pivote sin medir
el cuerpo) por un sistema de anclas medidas de la geometría real de cada avatar y
una transformación por pieza/ranura:

1. **Anclas reales por héroe** (`window.__v23Anchors.anchors(id)`): coronilla
   (incluye la coronilla real del pelo en columna central, no una coleta alta),
   frente/ojos (deducidos de la caja del cráneo), cuello, pecho, espalda, cintura,
   caderas, manos izquierda/derecha, pies, suelo (y=0), caja del arma, capa base y
   silueta completa. Todo en unidades locales del cuerpo (la escala no uniforme
   del héroe se cancela); nada se supone.
2. **Encaje por ranura** en `addPieceGroup` (punto único por el que pasan tanto
   `applyOutfitToAvatar` como `v22AttachSlot`), sin tocar la geometría:
   - cabeza/peinado: asiento en coronilla/frente; diadema asentada sobre el pelo
     y adelantada a la frente;
   - torso: ancho escalado al torso real (estilos armor/robe/poncho) y paneles
     llevados al frente del pecho; cubre-espalda intacto;
   - piernas: se compensa el pivote de la pierna (0,93) que dejaba perneras y
     grebas sobre el pecho;
   - accesorios: gafas separadas del cristal base de Noa; brújula en la muñeca;
   - extras: bolso al costado y delante del brazo, pluma fuera del torso,
     trofeos fuera del hombro, cuaderno orbital con centro propio delante del
     torso, reloj separado del brazo;
   - amuletos: el pendiente descansa sobre el pecho o sobre la prenda equipada;
   - efectos de arma: escala y centro calculados con la caja real del arma
     (antes flotaban 1–1,5 m por encima de armas cortas) y adelantados para no
     quedar enterrados en la malla del arma;
   - marcos: tamaño ajustado a la silueta y centrado en el cuerpo; el marco de
     platino retrasa sus barras interiores (estaban en z=0, dentro del cuerpo);
   - mascota: órbita desplazada fuera del alcance del brazo;
   - estela: pies/suelo.
3. **Animaciones**: se envuelve `animateAvatarCosmetics` para reaplicar el
   desplazamiento de encaje en las piezas cuya animación sobrescribe la posición
   (`pet`, `orbit`, `float`, `frame`, `trail`, `aura`, estrellas) sin duplicarlo.
4. **Capas de profundidad**: todas las piezas conservan `polygonOffset` negativo
   por ranura (sin z-fighting); el auditor comprueba que no falte en ningún
   material.
5. **HUB**: al final del módulo se llama una vez a `rebuildHeroAvatar()` para que
   el héroe ya construido en `boot()` use las anclas nuevas (sin recrear el
   renderer). El visor conserva su renderer y su cámara.

## QA (`window.__v23Anchors`)

- `audit(hero, cosmetic, {raw})` → por caso: `hero, cosmetic, slot, visible,
  penetraCuerpo (visible), penetraInterna (solape permitido), huecoFlotante,
  parpadeo, bbox(size/center/minY/maxY), areaFull/areaBust/areaFront, gap,
  penCount/penDepth/penZone, transform, anchor, note, status`.
- `matrix({from,to,raw})` / `matrixAsync` → matriz 69×10 con resumen y fallos.
- Renderiza el avatar **con y sin la pieza** en tres cámaras (tres cuartos,
  busto y frontal) y compara píxeles (>14 px); evita falsos positivos de fondo
  (fondo transparente) y de brillo (bbox de malla separada del brillo).
- Penetración: puntos de superficie de la pieza contra volúmenes reales del
  cuerpo. Se separa **penetraInterna** (solape de ropa con su propio soporte,
  permitido) de **penetraCuerpo** (parte ajena: cara/cráneo, cuello, torso,
  brazos o piernas; sí falla).
- Hueco flotante: distancia mínima de la pieza a su volumen de anclaje con
  tolerancia por ranura.
- Parpadeo: 3 fotogramas idénticos + auditoría de `polygonOffset`/capas; el
  jitter de cámara se guarda como dato, no como fallo.
- Degradación: todo en `try/catch`; si faltara una función del motor,
  `ready=false`, motivo en `reason` y el juego sigue con el encaje anterior.
- `heroSwitchCheck()`, `stateSnapshot()`, `visorInfo()` y `shot()` para la
  comprobación de guardado, del visor y de las capturas.

## Resultado

- **690/690 PASS (100 %)**, 0 fallos residuales, 0 errores de script.
  - 610 casos 3D (malla + brillo) + 80 de título (ranura de texto, validada por
    asignación al HUD; no tienen geometría 3D por diseño).
  - Por ranura: cabeza 150/150, peinado 40/40, torso 60/60, piernas 30/30,
    accesorios 20/20, extras 90/90, amuletos 40/40, efectos 100/100,
    marcos 40/40, mascota 30/30, estela 10/10, título 80/80.
- Área de visibilidad mínima 143 px (mediana 4.907 px por caso): no hay aprobados
  por un píxel de brillo.
- La muestra antes/después (42 casos, 14 piezas × 3 héroes) pasa de 34/42 a
  42/42; las capturas muestran las correcciones reales (diadema, perneras,
  efectos de arma, cuaderno, marco de platino, trofeo, bolso, bata).
- Línea base sin encaje (`matrix-before-slice.json`, Ilan+Noa, 138 casos):
  127/138 PASS con este criterio (11 fallos: mascota 6, marcos 2, extras 3).
  El número no refleja todos los defectos porque la pieza enterrada o mal
  anclada sigue siendo visible y el solape con su propio soporte está permitido;
  los defectos de aspecto se documentan con las capturas antes/después y con la
  inspección de encaje (perneras sobre el pecho, diadema enterrada, efectos de
  arma flotando, patas de gafas, etc.).
- Cambio de héroe: los 10 conservan su atuendo (4–5 grupos) y
  `state.collection.equipped` no cambia (`savedUnchanged: true`).
- Visor de inventario: al recorrer los 10 héroes del selector, todos montan su
  atuendo guardado (4–5 grupos, 0 fallos), sin recrear el renderer.
- Sin excepciones en consola; `node --check` del build: OK.

## Archivos propios

- `.work/src/part11-v23-anchors.js` (~61 KB) y `.work/src/part11-v23-anchors.css`.
- Evidencia en `.work/v2.3/agents/agent1/`:
  - `matrix-after.json` (690 casos + resumen + fallos [] + stats),
  - `matrix-before-slice.json` (muestra sin encaje, para comparar),
  - `evidence-summary.json` (antes/después de 42 casos, cambio de héroe, visor,
    guardado, stats),
  - `hoja-antes.jpg`, `hoja-despues.jpg` (42 capturas cada una, 1.464 px),
    `hoja-casos-criticos.jpg` (16 celdas antes/después), `hoja-visor.jpg`,
  - `shots/` (86 PNG: 14 piezas × 3 héroes × antes/después + 2 del visor),
  - `save-agent1.json` (guardado de prueba con atuendo por héroe; no es del juego),
  - `qa.js`, `evidence.js`, `final-check.js`, `diag-ona.js`, `probe.js`.
- No se tocó `game.js`, `game.json`, `dist/`, `export/`, `build-game.js`, otros
  `part*`, assets, HUB, legacy ni `INTEGRITY.sha256`.

## Límites y decisiones honestas

- El casco de vigía cubre la cara por diseño (visor oscuro): es la única pieza con
  cobertura facial; se conserva su silueta. No se considera defecto.
- La diadema se asienta sobre la coronilla real (queda como tiara sobre el pelo,
  no enterrada). Es la transformación más agresiva del sistema (asiento + frente).
- El marco de platino se retrasa 0,62 para que sus barras interiores, modeladas en
  z=0, queden detrás de la silueta; el marco se sigue viendo alrededor del cuerpo.
- La métrica de visibilidad usa la diferencia de píxeles de la pieza completa
  (malla + brillo). Por eso además se comprueban penetración y capturas: el brillo
  decorativo por sí solo no basta para aprobar un caso.
- El QA se ejecuta en tandas de 30 casos (una llamada CDP por tanda) para no
  exceder los tiempos del arnés; la matriz completa tarda unos minutos en
  headless con SwiftShader.
- No se añadieron partículas ni geometría nueva. El HTML crece ~61 KB (módulo de
  anclas + QA); el CSS queda vacío de efecto visual salvo un host oculto de QA.

## Reproducir

```powershell
$env:GAME_OUT=".work/v2.3/preview/a1-game.js"
$env:GAME_PARTS_ONLY="part11-v23-anchors"
$env:GAME_CSS_ONLY="part11-v23-anchors"
node .work/build-game.js
node .work/v2.3/tools/make-test-html.js .work/v2.3/preview/a1-game.js .work/v2.3/preview/a1.html
node .work/v2.3/agents/agent1/qa.js matrix
node .work/v2.3/agents/agent1/evidence.js
```

`qa.js matrix` escribe `matrix-after.json`; `evidence.js` escribe
`evidence-summary.json` y `shots/`. Las hojas se generan con
`.work/v2.3/tools/contact_sheet.py` (máx. 1.600 px) y el script
`make_pairs.py` de esta carpeta.
