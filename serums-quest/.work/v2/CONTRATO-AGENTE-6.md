# SERUMS QUEST · V2 · Contrato del Agente 6 (mundo interactivo)

**Estado:** contrato y marcadores de posición. No se integra hasta después del OK del Checkpoint 1.
**Propiedad:** `.work/src/part6-world.js` + `.work/src/part6-world.css` (nuevos). El Agente 6 no edita part1–part4; el Agente 0 inserta los hooks.

## 1. Objetivo

Convertir el atrio en un mundo que premia aprender, no repetir:

1. **Cofres escondidos** (uno por isla, 5): recompensa única dentro de las reglas (XP pequeño + fragmento o cosmético ya existente). No dan monedas fuera del tope diario. Se abren una sola vez y se guardan.
2. **Estaciones de repaso**:
   - **Telescopio** (junto al Observatorio): abre el repaso espaciado real (`openReview('due')`), muestra cuántos errores toca revisar.
   - **Biblioteca** (junto a la puerta de Cuidado integral): abre un lector local de flashcards/fichas construido con el banco V2 (`QUESTION_BY_ID` y `flashcardId/sheetId/origin`), sin red.
3. **Personajes guía por isla** (5): NPC voxel pequeño con una mini-lección de 1–3 pantallas por isla (texto breve, fuente y “Continuar”). Se leen una vez; se guarda el paso. No dan monedas por repetir.
4. **Fragmentos de conocimiento** (10–15): coleccionables repartidos por el atrio. Cada uno desbloquea una flashcard/ficha del banco (referencia `flashcardId`/`sheetId`) y se registra en la colección. No se pueden farmear.
5. **Restauración visual por isla**: la puerta/isla gana vegetación, luz, runas y color según el dominio del área (`areaProgress`, `masteredCount`). Es visual y permanente; no da recompensas.
6. **Sombras del error**: aparecen junto a la puerta del área donde hay errores pendientes de repaso. Muestran el número de errores y desaparecen al completar el repaso de esas preguntas. No se pueden derrotar respondiendo la misma pregunta una y otra vez.

## 2. Estado y guardado

Añadir a `defaultState()`:

```js
v2: {
  world: {
    chests: {},        // id -> { openedAt }
    guides: {},        // areaId -> { step, completedAt }
    fragments: {},     // id -> { collectedAt, flashcardId, sheetId }
    shadows: {},       // questionId -> { defeatedAt, reviews }
    stations: {},      // id -> { lastUsedAt, uses }
    restored: {},      // areaId -> { level, at }
    visited: {}        // id -> ISO
  }
}
```

`normalizeState()` valida con `objField`, limpia ids desconocidos y conserva el resto. El guardado antiguo sigue funcionando: si `raw.v2` no existe, se usa el default. Si se sube `SAVE_SCHEMA_VERSION`, registrar la migración `{from:2,to:3}` y mantener importación de esquemas 1/2.

## 3. API

```js
V2.world = {
  boot(),                         // crea marcadores y registra interactivos
  update(dt, time),               // anima iconos, sombras, restauración
  nearest(x, z),                  // { id, kind, label, icon, dist } | null
  interact(id),                   // ejecuta la acción; devuelve true si abrió UI
  decorate(),                     // añade props de cofre/fragmento/guía/sombra
  promptHTML(interact),           // texto del aviso "E"
  openStation(kind),              // telescopio/biblioteca
  openGuide(areaId),              // mini-lección
  openChest(id),                  // recompensa única
  collectFragment(id),            // desbloquea flashcard
  refreshShadows(),               // recalcula sombras desde state.errors
  save()                          // persist()
}
```

Los interactivos viven en el atrio (hub) y usan coordenadas del mundo 3D. No se colocan sobre el pedestal central ni bloquean `walkableAt`. Radio de interacción 1.2; se muestran con un marcador flotante (sprite/aro) y un aviso DOM cuando el héroe está cerca.

## 4. Hooks que inserta el Agente 0

- `part2-world.js` `updateInteract()`: después de calcular `best` para puertas, consultar `V2.world.nearest(hubHero.x, hubHero.z)`; si hay uno más cercano, usarlo como `currentInteract` y mostrar su prompt.
- `activateInteract()`: si `currentInteract.v2`, llamar `V2.world.interact(id)` y salir.
- `part4-flow.js` `frame`: `V2.call('world','update',dt,time)`.
- `boot`: `V2.call('world','boot')` después de `decorateHub`.
- `renderScreen`/`setScreen`: cerrar paneles del mundo y pausar el movimiento mientras hay un panel abierto (`V2.world.isOpen()`).
- `updateHub`: si `V2.world.isOpen()` no mover al héroe.
- `openReview`/`launchReview`: al completar un repaso, `V2.call('world','refreshShadows')`.

## 5. Reglas

- Recompensas únicas, sin farmeo: cada cofre/fragmento/guía se registra con `openedAt/collectedAt/completedAt`.
- Nada de monedas infinitas: si una recompensa incluye monedas, pasa por `applyXpCoins` (tope diario 120).
- El repaso espaciado real manda: las sombras no sustituyen `dueErrors()` ni `applyQuestionResult`.
- Sin red, sin imágenes IA, sin archivos externos. Todo voxel/código.
- 60 FPS: marcadores con `InstancedMesh` o sprites compartidos; ≤ 30 objetos nuevos en el atrio; calidad baja/media/alta y reducir movimiento.
- Accesibilidad: tecla E/Enter, botón táctil de acción existente, foco visible, textos grandes y alto contraste.
- El HUB, `serums-quest-legacy`, `archivo/`, `_backups/`, `INTEGRITY.sha256` y las apps study-* no se tocan.

## 6. Criterios de aceptación (Checkpoint 2)

- Captura y prueba de cada interacción: cofre, telescopio, biblioteca, guía, fragmento, restauración y sombra.
- Persistencia tras recargar; importación de la partida antigua (1.2) y del guardado nuevo.
- 0 errores de script, 0 peticiones de red, FPS ≥ 55 medio / ≥ 45 mínimo.
- HTML exportado regenerado, README actualizado, enlace del HUB intacto, regresión completa.
- Versión «V2 · Final».
