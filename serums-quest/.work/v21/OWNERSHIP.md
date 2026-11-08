# SERUMS QUEST · V2.1 · Propiedad de archivos y contratos

**Fecha:** 2026-11-06. **Agente 0** define; ningún agente edita archivos de otro. Solo el Agente 0 toca archivos compartidos, `game.js`, `game.json`, `dist/`, `export/` y el build.

## Archivos existentes

| Archivo | Dueño | Uso |
|---|---|---|
| `.work/src/part0-v2-core.js` | Agente 0 | namespace y hooks |
| `.work/src/part1-core.js` | Agente 0 | estado, save, settings defaults |
| `.work/src/part2-world.js` | **Agente 1** | geometría voxel, cámara near/far, sombras/acné, arena |
| `.work/src/part3-ui.js` | Agente 0 | pantallas, hooks summary/duel/perf |
| `.work/src/part3b–part3g` | Agente 0 | sin cambios salvo hooks |
| `.work/src/part3h-modes.js` | Agente 0 | filtro banco original y textos |
| `.work/src/part3j-learning.js` | Agente 0 | sin cambios |
| `.work/src/part3m-final.js` | Agente 0 | ajustes/calidad/shadow type |
| `.work/src/part4-flow.js` | Agente 0 | flujo, auto-avance, cámara |
| `.work/src/part5-assets.js` | **Agente 2** | banderines, estandartes, arena y props |
| `.work/src/part5-heroes.js/.css` | **Agente 5** | selector |
| `.work/src/part5-feedback.js/.css` | **Agente 3** | feedback, resumen, ajustes de feedback |
| `.work/src/part6-world.js` | **Agente 6** | mundo, restauración máxima |
| `.work/build-game.js` | Agente 0 | orden de partes, CSS opcional |

## Archivos nuevos

| Archivo | Dueño | Uso |
|---|---|---|
| `.work/src/part7-duel.js/.css` | **Agente 4** | layout/cámara de duelo, panel compacto, contracción al atacar |
| `.work/src/part8-summary.js/.css` | **Agente 3** | resumen de nivel con preguntas, errores, filtros, difícil y flashcard |
| `.work/src/part9-perf.js/.css` | **Agente 6** | culling del atrio, ajuste «solo banco original», settings, sombras |
| `.work/v21/agent*/**` | cada agente | harness, capturas y notas; no se integran en el build |
| `.work/v2/qa/**` | **Agente 7** | QA y capturas |

## Contratos de hooks (Agente 0)

- `V2.duel = { mount(), unmount(), onAttack(correct), afterCamera(dt,time), onDuelStart(areaId), onDuelEnd(), isActive() }`
  - `renderScreen('duel')` → `mount`; `setScreen` → `unmount`; `answerCurrent` → `onAttack`.
  - `frame` después de `placeCamera` → `afterCamera` (ajusta cámara/proyección al área libre).
- `V2.summary = { html(result), mount(result), unmount(), refresh() }`
  - `resultScreenHTML` inserta `html(result)` en lugar del bloque `answerReview` si existe.
  - `renderScreen('result')` → `mount(lastResult)`.
- `V2.feedback = { onAnswer, hide, isOpen, update, settingsHTML, mountSettings, mix*, inlineEnabled(), autoAdvanceDelay(session), isEndMode(), feedbackMode() }`
  - `inlineEnabled()` devuelve `false` en modo «al final» (por defecto).
  - `autoAdvanceDelay(session)` devuelve ~900 ms en «al final» y en Simulacro; 0 en «tras cada pregunta».
- `V2.perf = { settingsHTML(), mountSettings(), questionAllowed(q), filterQuestions(list), update(dt,time), stats() }`
  - `state.settings.onlyOriginalBank` filtra `source !== 'campaign'`.
  - `settingsHTML` añade el toggle y el botón de banco original.
- `V2.feedback` debe respetar `state.settings.onlyOriginalBank` en sus `mix*` (solo campaña).
- `V2.duel` no toca `part3-ui`; ajusta el DOM tras `renderScreen` y la cámara en `afterCamera`.

## State (Agente 0 ya añadió defaults)

```
state.settings.feedbackMode: 'end' | 'each'   // default 'end'
state.settings.onlyOriginalBank: false
state.v2.world.restored[areaId]: number        // máximo alcanzado (Agente 6)
```

## Reglas

- No tocar HUB, `serums-quest-legacy`, `archivo/`, `_backups/`, `INTEGRITY.sha256`; `study-dashboard`/`study-flashcards` solo lectura.
- No imágenes IA; 12 slots de Game Studio intactos.
- Sin builds: validar `node --check` y harness propio. El Agente 0 integra y construye.
- 60 FPS, calidad baja/media/alta y reducir movimiento.
- Guardado aditivo; no perder progreso, monedas, desbloqueos ni cosméticos.
