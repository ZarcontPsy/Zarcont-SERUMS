# SERUMS QUEST · V2 · Contratos de integración

Versión objetivo Checkpoint 1: **V2 · Checkpoint 1**. Fecha: 2026-11-06.
Este documento lo escribe y mantiene el **Agente 0**. Ningún agente edita archivos de otro.

## 1. Pipeline

```
.work/src/part0-v2-core.js          ← Agente 0 (namespace V2 y utilidades)
.work/src/part1-core.js             ← existente, solo Agente 0 (hooks/estado)
.work/src/part2-world.js            ← existente, solo Agente 0 añade hooks; los agentes NO la editan
.work/src/part3-ui.js               ← existente, solo Agente 0 (hooks)
.work/src/part3h-modes.js           ← existente, solo Agente 0 (hooks)
.work/src/part3j-learning.js        ← existente, solo Agente 0 (hooks)
.work/src/part4-flow.js             ← existente, solo Agente 0 (hooks)
.work/src/part5-combat.js           ← Agente 1
.work/src/part5-heroes.js           ← Agente 2
.work/src/part5-heroes.css          ← Agente 2 (se inyecta en STYLE_CSS)
.work/src/part5-assets.js           ← Agente 3
.work/src/part5-assets.css          ← Agente 3 (opcional)
.work/src/part5-feedback.js         ← Agente 5
.work/src/part5-feedback.css        ← Agente 5
.work/src/styles.css + part3*.css   ← existentes, solo Agente 0
src/content-v2.json                 ← Agente 4 (datos, no código)
.work/build-game.js                 ← solo Agente 0
game.js, game.json, dist/, export/  ← solo Agente 0
```

Orden de concatenación dentro del IIFE (build-game.js):
part0 → part1 → part2 → part3 → part3b…part3m → **part5-combat → part5-heroes → part5-assets → part5-feedback** → part4-flow.
Los módulos part5 se cargan antes del bucle y del boot, y comparten el mismo ámbito que part1–part4: pueden leer y asignar `guardian`, `arenaGroup`, `scene`, `camera`, `state`, `session`, `lastFeedback`, `heroAvatar`, etc. No crean otro IIFE.

Build: `node .work/build-game.js` (solo Agente 0) valida con `node --check`.
Game Studio: `game_studio_build` (solo Agente 0) → `dist/index.html`; `game_studio_export` → `export/serums-quest.html`.

**No ejecutes `.work/build-game.js`, `game_studio_build` ni escribas `game.js`, `dist/` o `export/`.** Varios agentes comparten el árbol: un build concurrente corrompería la integración. Valida tu archivo con `node --check .work/src/tu-archivo.js` y, si necesitas una prueba aislada, crea un HTML de banco de pruebas en tu carpeta de trabajo (no en `dist/`). El Agente 0 integra y hace las capturas.

## 2. Namespace V2 (part0-v2-core.js)

```js
V2.version
V2.call(module, method, ...args)  // devuelve el valor del módulo o undefined; nunca lanza
V2.quality()                      // 'bajo' | 'medio' | 'alto' (Ajustes)
V2.reducedMotion()                // bool (Ajustes + prefers-reduced-motion)
V2.isTouch()                      // puntero grueso
V2.clamp/lerp/rand
V2.budget()                       // {props, particles, decor, maxDrawCalls}
V2.palette                        // colores del Observatorio
V2.assets.ids                     // Agente 3 publica aquí su catálogo
V2.assets.prop(id, opts)          // fábrica opcional de props por ID
V2.emit(type, payload)            // event bus interno (para QA)
```

Cada módulo se registra al final de su archivo:

```js
V2.combat = { update, onDuelStart, onDuelEnd, heroAttack, guardianAttack, onHeartsChanged, onSessionEnd, reset };
V2.heroes = { mount, unmount, update, boot, open, close };
V2.assets = { decorateHub, decorateMapIsland, applyArenaVariant, clearArenaVariant, update, ids };
V2.feedback = { onAnswer, hide, isOpen, update, settingsHTML, mountSettings, mixMissionQuestions, mixModeQuestions, mixPracticeQuestions };
```

`V2.call('feedback','onAnswer', …)` se llama después de `renderScreen()` en `answerCurrent`.
Si un módulo no existe o lanza, el juego sigue con el comportamiento anterior (fallback).

## 3. Contratos por agente

### Agente 1 · `part5-combat.js` (combate y efectos)
Puede leer/escribir: `guardian`, `heroAvatar`, `arenaGroup`, `scene`, `camera`, `cameraShake`, `heroShield`, `heroShieldPulse`, `duelPositions`, `ARENA_POS`, `state`, `session`, `CAMP`, `AREA_BY_ID`, `HERO_LOOKS`, `RULES`, `THREE`, helpers `spawnSparksAt`, `spawnPulse`, `spawnLightProjectile`, `spawnSlashArc`, `disposeObject`, `makeGlowSprite`, `pulseHeroShield`, `tone/chord`.

API:
- `update(dt, time)`: anima efectos propios, respeta `V2.quality()` y `V2.reducedMotion()`.
- `onDuelStart(areaId)`: prepara el estilo del guardián (territorio/raíces, cuidado/pulso, confianza/reflejos y balanzas, evidencia/rayos de prisma, sistema/engranajes y planos). No borra ni sustituye el guardián existente.
- `onDuelEnd()` / `reset()`: limpia efectos.
- `heroAttack(question, applied)`: variante por arma/héroe; devuelve `true` si dibujó el ataque (el flujo no llamará al ataque genérico). Debe llamar a `impactGuardian` o su propio impacto y mostrar número de daño.
- `guardianAttack(question, chosenOption)`: aviso de ataque (0.3–0.5 s), golpe con el estilo del área, reacción del héroe y escudo; devuelve `true`. El daño de reglas ya se aplicó antes; aquí solo es visual.
- `onHeartsChanged(session, question)`: cambio de fase en jefes (halo, color, anillos, ritmo) sin alterar reglas.
- `onSessionEnd(session, result)`: derrota del guardián en victoria (disolución de luz) o retirada en derrota; no bloquea el cambio de pantalla.
- Números de daño: capa DOM `#v2-damage-layer` (pointer-events:none) o sprites; máx. 4 vivos; sin allocations por frame.
- Presupuesto: ≤ 80 partículas simultáneas en alto, 40 medio, 18 bajo; reutilizar geometrías/materiales; nada de `new` por frame. Sacudida de cámara ≤ 0.14. Sin violencia explícita: luz, escudos, partículas.
- Accesibilidad: con `V2.reducedMotion()`, telegraph estático + fundido, sin sacudida ni proyectiles rápidos.

### Agente 2 · `part5-heroes.js` + `.css` (selector de héroes)
Sustituye `heroesScreenHTML()` y, si hace falta, `recruitScreenHTML()` definiéndolas de nuevo (quedan después de part3-ui). El flujo existente `openHeroes()`, `selectHero()`, `openRecruit()`, `confirmRecruit()`, `purchaseHero()` y `heroRequirementState()` se conserva. No cambies reglas, precios ni desbloqueos.
- Cabecera con título y onda SVG, avatar y monedas arriba.
- Carrusel horizontal: tarjeta central grande, tarjetas laterales parciales (máx. 2 visibles por lado), fondo propio por héroe dibujado en código (gradiente + isla/símbolo del área), no imágenes IA.
- Modelo 3D giratorio con arma y cosméticos equipados: usa `buildHeroAvatar(id)`, `applyOutfitToAvatar(avatar,id)`, `HERO_LOOKS`, `THREE`; renderer propio con alpha, píxel ratio limitado (≤1.5), pausa cuando la pestaña no está visible o `V2.reducedMotion()`.
- Datos: nombre, clase (`look.klass`), descripción corta, rareza (`rarityLabel`), atributos (`attributes`), arma (`look.weapon`), título si existe (`titleText`).
- Botón: Elegir (poseído y no activo), En ruta (activo), Comprar ◇ precio (si `canRecruit`), Bloqueado con requisito (nivel/misiones/monedas). Usa las mismas acciones existentes (`select-hero`, `open-recruit`, `recruit-confirm`) o añade `data-action` propios manejados por el módulo.
- Gestos: swipe táctil, arrastre de ratón, rueda, flechas ←/→, Home/End, Enter para elegir. Foco visible y `aria-label`. Responsive horizontal; en vertical se mantiene el aviso de giro existente.
- Montaje: `V2.heroes.mount()` tras `renderScreen` (hook de Agente 0), `unmount()` al salir, `update(dt,time)` desde el frame.
- CSS: usar variables del Observatorio (`--ink`, `--gold`, `--line`, `--blue`, `--teal`, `--violet`, `--lime`, `--amber`); nada de fuentes ni imágenes externas. Respetar `body.reduced-motion` y `@media (prefers-reduced-motion)`.
- No tocar Game Studio slots ni assets. Sin red.

### Agente 3 · `part5-assets.js` (assets y mundo visual)
Puede leer: `THREE`, `scene`, `hubGroup`, `arenaGroup`, `gateGroups`, `ARENA_POS`, `CAMP`, `state`, `palette`, `BOX`, `dummy`, `mergedVoxels`, `addPartBoxes`, `makeGlowSprite`, `color`, `rng`, `mapState` (mapa), `MAP_ISLANDS`.
API:
- `ids`: catálogo `{ areaId: [{id,label,kind}] }` con 8–12 props por área + minions + arena + sky. El Agente 0 lo copia al reporte.
- `decorateHub()`: añade props alrededor de las 5 puertas/islas del atrio sin bloquear el paso (`HUB_RADIUS` 9.2, puertas a 7.1). Usa `mergedVoxels`/`InstancedMesh`; no más de ~8 draw calls por área.
- `decorateMapIsland(area, group, cfg)`: hook llamado por `mapBuildIsland`; añade vegetación, instrumentos, estructuras y luces a cada isla del mapa. No rompe el picking de nodos.
- `applyArenaVariant(areaId)`: variante del escenario de duelo por área (banderines, runas, pilares, partículas ambientales); no mueve `duelPositions` ni la cámara.
- `clearArenaVariant()`.
- `update(dt, time)`: anima partículas/minions; coste O(1) por frame, sin allocations.
- Esbirros decorativos: 5 (uno por área), no combaten, no dan recompensas, no interceptan `walkableAt`.
- Cielo/ambiente: capa de nebulosa/aurora y partículas ambientales; calidad baja/media/alta y `reducedMotion`.
- Presupuesto: props low/med/high = 5/8/12 por isla; partículas 20/45/80; usar `InstancedMesh` para vegetación repetida; materiales compartidos; no sombras nuevas.
- Nada de texturas externas ni IA; todo geometría/código.

### Agente 4 · `src/content-v2.json` + `explanations-original.json` + reporte
Contrato de datos en `.work/v2/content-report.md` y en la sección 5. No edita código.

### Agente 5 · `part5-feedback.js` + `.css` (feedback y flujo)
API:
- `onAnswer(question, feedback, session)`: muestra una pantalla/overlay de feedback tras CADA respuesta (salvo `session.deferred` = Simulacro). Debe contener: veredicto neutro y alentador, respuesta correcta, explicación breve (1–3 líneas), y si falló, por qué la opción elegida no es la correcta cuando haya dato (compara con `q.explanation`/opciones). Botón **Continuar** (Enter/Space), **Marcar como difícil** (`toggleQuestionTag`), **Ver en flashcard** (overlay local con enunciado, clave, explicación y fuente; sin red). No revelar clave en Simulacro.
- `hide()`: cierra overlay; se llama en `setScreen` y en nextQuestion.
- `isOpen()`: bool; el reloj de Contrarreloj y el temporizador de pregunta se pausan mientras esté abierto.
- `settingsHTML()`: fila de Ajustes con pesos de las tres fuentes (Campaña / Fichas dashboard / Flashcards), sliders o botones; normaliza a 100 %; se guarda en `state.settings.sourceWeights` y persiste con el guardado/exportación.
- `mountSettings()`: conecta los controles.
- `mixMissionQuestions(mission, qids)`: devuelve la lista final de ids para una misión/jefe, mezclando las 3 fuentes según pesos y manteniendo el número de preguntas; conserva al menos 1 pregunta de campaña cuando el peso campaña > 0. No cambia recompensas ni reglas.
- `mixModeQuestions(mode, qids)` y `mixPracticeQuestions(areaId, qids)`: variantes ponderadas; si no hay pool de una fuente, redistribuye.
- `update(dt,time)`: animación de entrada/salida, sin bloquear el frame.
- Usa `previous`/`state`, `QUESTION_BY_ID`, `session`, `lastFeedback`, `renderScreen`, `nextQuestion`, `toggleQuestionTag`, `sfx*`, `icon`, `esc`, `formatNumber`, `AREA_BY_ID`. El flujo base sigue siendo el de part4; si el overlay está abierto, `answerCurrent` no acepta otra respuesta (ya lo impide `lastFeedback`).
- En Contrarreloj: no consumir reloj; al continuar, reanudar. En Simulacro: no mostrar overlay, el informe final ya lleva explicaciones. En repaso: igual que campaña.
- Errores ya entran al repaso espaciado por `applyQuestionResult`; no dupliques esa lógica.
- Sin farmeo: no añadas monedas/XP extra; el feedback es solo presentación.
- CSS: obsidiana, azul, verde agua, violeta, lima, ámbar, hueso; legible en 960×540 y 390×844; botones ≥44 px en táctil; foco visible; sin imágenes.

### Agente 6 · mundo interactivo (post-Checkpoint 1)
Reservado. Interfaces previstas: `V2.world.registerInteractive({id,kind,areaId,x,z,r,label,icon,action})`, `update`, `decorate`, `canInteract`, `interact`, `saveState` en `state.v2.world`. No iniciar antes del OK del Checkpoint 1.

### Agente 7 · QA
Scripts propios en `.work/v2/qa/`. No modifica el juego. Usa Chrome/Edge headless, `file://`, perfil limpio, sin red. Comprueba menú, mapa, modos, campaña, repaso, tienda, inventario, pausa, importar/exportar, FPS mín/medio, 0 peticiones de red y 0 errores de script. Capturas en `.work/v2/evidence/`.

## 4. Hooks que inserta el Agente 0 (ya presentes o pendientes)

- `answerCurrent` (part4): tras `renderScreen()` → `V2.call('feedback','onAnswer', q, lastFeedback, session)`.
- `answerCurrent` rama visual → `V2.call('combat','heroAttack', q, applied)` / `V2.call('combat','guardianAttack', q, chosenOption)`; si devuelve falsy, fallback actual.
- `nextQuestion` → `V2.call('feedback','hide')`.
- `setScreen` → `V2.call('feedback','hide')`; `V2.call('heroes','unmount')`.
- `renderScreen` heroes/recruit → `V2.call('heroes','mount')`; settings → `V2.call('feedback','mountSettings')`.
- `settingsScreenHTML` → inserta `V2.call('feedback','settingsHTML')`.
- `frame` → `V2.call('combat','update',dt,time)`, `V2.call('assets','update',dt,time)`, `V2.call('heroes','update',dt,time)`, `V2.call('feedback','update',dt,time)`.
- `beginDuelStage` → `V2.call('combat','onDuelStart',areaId)`, `V2.call('assets','applyArenaVariant',areaId)`.
- `endDuelStage` → `V2.call('combat','onDuelEnd')`, `V2.call('assets','clearArenaVariant')`.
- `finishSession` → `V2.call('combat','onSessionEnd',session,result)` antes de `setScreen('result')`.
- `launchMission` → `V2.call('feedback','mixMissionQuestions',mission,qids)`.
- `startMode` → `V2.call('feedback','mixModeQuestions',mode,qids)`.
- `startPractice` → `V2.call('feedback','mixPracticeQuestions',areaId,qs)`.
- `updateModeClock` → si `V2.call('feedback','isOpen')` no descuenta tiempo.
- `boot` → `V2.call('assets','decorateHub')`, `V2.call('heroes','boot')`.
- `mapBuildIsland` → `V2.call('assets','decorateMapIsland',area,group,cfg)`.
- `defaultState/normalizeState` → `settings.sourceWeights` y `settings.v2` opcionales; guardado compatible.

## 5. Esquema de pregunta runtime

```
{
  id: "v2-fc-...",
  areaId: "area-psi-...",
  stem: "texto",
  options: [{id:"A",text:"..."},...],
  answer: "A",
  examTitle: "Study Flashcards · ...",
  cycle: "2026-II",
  page: null,
  complexity: 18|25|28|35|38,
  confidence: "alta"|"media",
  source: "campaign"|"dashboard"|"flashcards",
  origin: "texto de la fuente",
  explanation: "1–2 frases",
  explanationGenerated: false,
  difficulty: "base"|"media"|"alta",
  tags: ["..."],
  flashcardId: "...", sheetId: "...",
  generated: false,
  sourceRefs: [{sourceId, pages}]
}
```

`CAMP.questions` es un objeto `{id: q}`. `QUESTION_BY_ID` se llena al arrancar. Los ids originales no cambian.

## 6. Reglas invariantes

- Guardado `serumsquest:voxel:state:v1` y `saveSchema` compatible; campos nuevos opcionales; exportación/importación con vista previa; migración registrada si se sube `SAVE_SCHEMA_VERSION`.
- Progreso, desbloqueos, precios, cosméticos, XP, monedas, tope diario (120) y repaso espaciado intactos.
- Sin red, sin cuentas, sin imágenes IA, sin archivos externos. Todo en código.
- 60 FPS: presupuesto por asset, instancing, sin allocations por frame, calidad baja/media/alta y reducir movimiento operativos.
- Estilo: obsidiana + azul/verde agua/violeta/lima/ámbar/hueso. Sin violencia explícita.
- Game Studio: 12 slots intactos (`game.json`). No añadir imágenes.
- El HUB, `serums-quest-legacy`, `archivo/`, `_backups/` e `INTEGRITY.sha256` no se tocan. `study-dashboard`/`study-flashcards` solo lectura.

## 7. QA mínima Checkpoint 1

- Regresión de menú, mapa, modos, campaña, repaso, tienda, inventario, pausa, importar/exportar.
- FPS mínimo y medio en mapa y duelo (objetivo ≥ 55 medio, ≥ 45 mínimo; reportar real).
- 0 peticiones de red, 0 errores de consola.
- Capturas: selector, un ataque de cada guardián, feedback acierto y error, assets nuevos en cada isla, ajustes con pesos.
- Recuento de preguntas por área y origen; muestra ≥30 claves verificadas.
- Versión «V2 · Checkpoint 1» en `game.json` y en Ajustes.
