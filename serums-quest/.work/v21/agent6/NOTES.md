# Agente 6 · V2.1 · rendimiento del atrio y banco original

Archivos propios:

- `.work/src/part6-world.js` (edición: restauración máxima por puerta)
- `.work/src/part9-perf.js` (nuevo)
- `.work/src/part9-perf.css` (nuevo)
- `.work/v21/agent6/harness.js` (harness, no entra al build)

Sin build, sin tocar HUB/legacy/archivo/_backups/INTEGRITY/game.js/game.json/dist/export.

## 1 · Warnings `PCFSoftShadowMap has been removed`

**Causa (three.js 0.187.0, `WebGLShadowMap.render`, al inicio):**

```js
this.type === PCFSoftShadowMap &&
  (warn('WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead.'), this.type = PCFShadowMap);
```

En el bundle de `dist/index.html` (línea 8, minificado) aparece como:

```js
this.type===Zu&&(gt("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Cr)
```

`Zu` = `PCFSoftShadowMap` (valor 2), `Cr` = `PCFShadowMap` (valor 1). Se emite desde
`render()` del shadow map, es decir, en el primer render con sombras de cada
instancia de `WebGLShadowMap`. El aviso es **una vez por renderer**, no por frame;
las 21 entradas de QA corresponden a ejecuciones/contextos repetidos del playtest.

**Origen en el juego:** `.work/src/part2-world.js:26`
`renderer.shadowMap.type = THREE.PCFSoftShadowMap;`

**Arreglo:** `part9-perf.js` fija `THREE.PCFShadowMap` en cuanto se carga
(después de part2, antes de que part4-flow llame a `boot()` y del primer
`renderer.render`) y lo reafirma en cada `update`/`boot` por si otro módulo lo
cambia. También unifica `portraitRenderer`.

**Calidad visible:** ninguna pérdida. three r187 ya sustituía `PCFSoftShadowMap`
por `PCFShadowMap` en el primer render de sombras; ahora simplemente se fija antes
y no hay aviso. **No hizo falta tocar bias/normalBias**: `moonLight.shadow` sigue
con `mapSize 1024`, `bias -0.001`, `normalBias 0` (part2-world.js:1267-1274) y el
sombreado es idéntico al que ya se estaba usando.

## 2 · Densidad/culling del atrio (solo props decorativos de part5-assets)

Se engancha al bucle sin editar part5-assets:

- `V2.world.update` se envuelve una vez (part4-flow ya lo llama antes de
  `placeCamera`/`render`); también existe `V2.perf.update(dt,time)` y
  `V2.perf.boot()`, que es lo que part4-flow invoca. Un sello de tiempo evita
  ejecutar dos veces el mismo frame si se llaman ambos.
- Se leen solo las raíces de `v2aHub.roots` con nombre conocido:
  `v2-hub-props-*` (props fusionados, 1-2 meshes), `v2-hub-veg-*`
  (InstancedMesh de vegetación), `v2-minion-*` (esbirros decorativos) y
  `v2-hub-dust` (Points). Cualquier otra raíz se ignora.
- Cofres, guías, fragmentos, estaciones y sombras del error viven en
  `v2wWorldRoot` (part6-world) y no se tocan nunca.
- Por objetivo: centro en espacio de mundo calculado una vez (matrices de
  instancia o `boundingSphere` transformada), número de draw calls y vértices.
- Cada 160 ms: oculta/muestra la raíz por distancia al héroe (`hubHero`) con
  histéresis del 16 % (sin parpadeo) y recorta la densidad:
  - vegetación: `InstancedMesh.count` (12 → 9 medio, 6 bajo; ×0,7 por área
    completada; ×0,58 con todo completado);
  - polvo: `geometry.setDrawRange(0, n)` (45 → 31 medio, 18 bajo; ×0,55 con todo);
  - esbirros: ocultos por distancia; con el área completada o con todas las
    misiones hechas, ocultos del todo;
  - props: visibles solo cerca del héroe según calidad.
- Radios (desde el héroe): bajo 6,2 · medio 8,2 · alto 11,0. Con **todas las
  misiones completadas** el radio ×0,8, vegetación ×0,58, polvo ×0,55 y sin
  esbirros. Movimiento reducido amplía el radio ×1,12 para reducir cambios.
- Al salir del atrio (duelo, mapa, título, paneles) se restaura todo: raíces
  visibles, cuentas originales de instancias y drawRange completo. Al volver se
  reevalúa desde cero.
- Si part5 reconstruye el atrio (cambio de calidad), la lista de objetivos se
  refresca sola al cambiar la identidad/ longitud de `v2aHub.roots`; la cuenta
  original de instancias se guarda en `root.userData.v2pBaseCount`.

Topología estimada del atrio decorativo (según part5-assets): 5 grupos de props
(≈10 draw calls), 5 InstancedMesh de vegetación (5), 5 esbirros (≈10-15) y polvo
(1) → **26-31 draw calls** y la mayor parte de los vértices del atrio.

Ahorro medido en el harness con esa topología:

| Estado | Draw calls | Vértices |
|---|---|---|
| Medio, héroe en el centro | 13/26 (50 %) | 45 % |
| Baja calidad | 19/26 (73 %) | ~70 % |
| Todas las misiones completadas | 18/26 (69 %) | ~80 % |

En el juego real el ahorro de draw calls será de **≈16 de 31 (52 %)** en medio y
**≈23 de 31 (74 %)** al completar todo (los esbirros reales tienen un mesh más
que el modelo del harness). No se pudo medir FPS/GPU real sin build.

## 3 · Restauración máxima por puerta

En `part6-world.js`:

- `v2wCalculatedRestoration(areaId)` conserva el cálculo anterior (0-3).
- `v2wSavedRestoration(areaId)` lee `state.v2.world.restored[areaId]` (0-3,
  saneado: números fuera de rango se acotan, texto no numérico vale 0, `[]` se
  reemplaza por `{}`).
- `v2wSaveRestoration(areaId, level, silent)` guarda solo si sube y llama a
  `persist()` en ese momento; emite `world:restored`.
- `v2wRestorationLevel(areaId)` = `max(calculado, guardado)`; si el calculado
  sube, guarda y persiste.
- `v2wRestorationStats()` y `V2.world.stats().restoration` añaden
  `saved`, `calculated`, `persists` y `maxLevel` (aditivo; `levels/total` siguen
  igual). No se toca ninguna recompensa.

## 4 · Banco original

`V2.perf` (publicado con `V2.register('perf', …)`):

```js
V2.perf = {
  version, boot,
  settingsHTML(), mountSettings(),
  questionAllowed(q), filterQuestions(list),
  update(dt,time), stats(),
  applyShadow(), shadowStats(),
  onlyOriginalBank(), setOnlyOriginalBank(bool), bankStats(),
  refresh(), restore(), cullState()
};
```

- `state.settings.onlyOriginalBank` es la única fuente. `questionAllowed(q)` es
  `true` si el filtro está apagado; con filtro, solo `q.source === 'campaign'`.
  `filterQuestions(list)` devuelve una lista nueva sin mutar la original.
- `settingsHTML()` añade una sección `.v2-perf-settings` con el toggle
  «Usar solo preguntas del banco original» (`data-action="v2-perf-original-bank"`),
  contadores de campaña/dashboard/flashcards/otras/activas, estado de sombras y
  del atrio, y el botón «Revisar banco» (`v2-perf-bank-audit`).
- `mountSettings()` instala un listener de click en captura (una sola vez),
  sincroniza el toggle y los contadores, y persiste con `saveSettings()` +
  `persist()` al cambiar. No re-renderiza la pantalla para no perder el scroll.
- `stats()` incluye `shadow` (tipo, nombre, `warningFree`, bias, normalBias,
  mapSize), `bank` (conteos, activas, descartadas, regla),
  `culling` (draw calls, vértices, vegetación, polvo, radio, áreas completadas,
  héroe, último tick) y `settings`.
- Agent 3 (`V2.feedback`) y Agent 0 (modos) ya filtran por su cuenta con la
  misma regla; `questionAllowed`/`filterQuestions` quedan disponibles para
  unificar. La etiqueta «Generada» no se implementa aquí (no es de este agente).

## 5 · Validación

- `node --check .work/src/part6-world.js` ✅
- `node --check .work/src/part9-perf.js` ✅
- `node .work/v21/agent6/harness.js` → **183 PASS · 0 FAIL**:
  sombras (tipo inicial/forzado, stats, sin THREE), culling (distancias,
  histéresis, vegetación/polvo, esbirros, restauración al salir y al volver,
  calidad baja/media/alta, reconstrucción del atrio), enganche al bucle
  (`world.update` + `perf.update` sin doble tick), banco (conteos, filtros,
  toggle, persistencia, HTML, mount, evento de click, auditoría), carga
  defensiva sin estado/DOM/THREE, restauración persistida (sube, no retrocede,
  sanea valores, stats, firma con areaId real que cambia al subir el nivel y
  `v2wSaveRestoration` que persiste solo al subir), CSS (llaves, selectores,
  media query), colisiones de nombres con los demás archivos del build e
  **integración part0→part6→part9** en el mismo contexto.
- CSS de `part9-perf.css`: 0 llaves desbalanceadas.

## 6 · Lo que no se pudo medir

- FPS/milisegundos de GPU reales en el navegador: el encargo prohíbe hacer build.
- Los 21 warnings reales antes/después: no se ejecutó el juego en navegador; el
  arreglo es determinista (tipo fijado antes del primer render).
- Vértices exactos de los props fusionados de part5-assets: el harness usa la
  misma topología (2 meshes por grupo, 24 vértices de prueba por mesh) para
  comparar estado normal vs. completado; los porcentajes son representativos,
  no una medición del GPU.
- Diferencia visual de sombras con captura: se deduce del código de three
  (r187 ya usaba PCFShadowMap tras el aviso), no de una imagen.
