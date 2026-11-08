# SERUMS QUEST · V2 · Final

**Fecha:** 6 de noviembre de 2026
**Versión visible:** `V2 · Final`
**Build Game Studio:** `b32f14899538` · `dist/index.html` 3.173.871 B
**Exportación única:** `export/serums-quest.html` · 3.173.871 B
**Estado:** V2 Final. Checkpoint 1 aprobado; mundo interactivo integrado.

## 1. Agentes

| # | Función | Estado | Archivos propios | Problemas / notas |
|---|---|---|---|---|
| 0 | Coordinador e integrador | Completado | build, hooks, `game.js`, `game.json`, README, informes, export | Integración final y QA |
| 1 | Combate y efectos | Completado | `.work/src/part5-combat.js` | QA final PASS |
| 2 | Selector de héroes | Completado | `.work/src/part5-heroes.js/.css` | QA final PASS |
| 3 | Assets y mundo visual | Completado | `.work/src/part5-assets.js` | 75 IDs, QA final PASS |
| 4 | Contenido pedagógico | Completado | `.work/v2/questions-v2.json`, `explanations-original.json`, `content-report.md`, `agent4-*` | Dashboard sin MCQ; capa generada marcada |
| 5 | Feedback y flujo | Completado | `.work/src/part5-feedback.js/.css` | Persistencia de pesos corregida |
| 6 | Mundo interactivo | Completado | `.work/src/part6-world.js/.css` | 7 interacciones, restauración y culling |
| 7 | QA y rendimiento | Final | `.work/v2/qa/agent7-*`, `evidence/agent7-cp2-*` | Resultado en la sección 5 |

## 2. Mundo interactivo

- **5 cofres**: uno por isla, junto a su puerta (radio 8,15). Recompensa única: +5 XP, +5 monedas (tope diario de 120) y un fragmento. Persisten abiertos.
- **15 fragmentos**: 10 libres en el atrio (2 por área) y 5 dentro de los cofres. Cada uno da +5 XP una vez, guarda `flashcardId` y desbloquea una ficha en la biblioteca.
- **5 guías**: Killa (Salud pública), Nampi (Cuidado integral), Atoq (Ética), Suni (Investigación), Tawa (Gestión). Mini-lección de 3 pantallas: presentación, explicación del banco y cómo practicar. +5 XP la primera vez.
- **Telescopio**: muestra los errores vencidos y el siguiente repaso; abre `openReview()`. No da recompensas.
- **Biblioteca**: lector local de las 15 flashcards desbloqueadas; sin red. Muestra enunciado, clave, explicación, fuente y `sheetId`.
- **Sombras del error**: una por área con errores vencidos; muestra el número y se disipa cuando el repaso deja el área sin errores vencidos. No se puede farmear.
- **Restauración visual**: 3 niveles por puerta derivados de misiones/dominio. Columnas de luz, halos, vegetación, runas y cristales; 28 drawables, 0 partículas, sin luces/sombras nuevas.
- **Interacción**: aviso `E` al acercarse (radio 1,25), tecla `E`/`Enter`, botón táctil de acción y paneles con cierre `Esc`/`X`. Los 22 marcadores se atenúan a más de 6,5 u para no saturar.

### IDs principales

| Tipo | IDs |
|---|---|
| Cofres | `v2w-chest-salud-publica`, `v2w-chest-cuidado-integral`, `v2w-chest-etica`, `v2w-chest-investigacion`, `v2w-chest-gestion` |
| Estaciones | `v2w-telescope`, `v2w-library` |
| Guías | `v2w-guide-salud-publica`, `v2w-guide-cuidado-integral`, `v2w-guide-etica`, `v2w-guide-investigacion`, `v2w-guide-gestion` |
| Sombras | `v2w-shadow-<área>` |
| Fragmentos | `v2w-frag-<área>-1`, `v2w-frag-<área>-2`, `v2w-frag-<área>-c` |

La tabla completa fragmento → pregunta → `flashcardId` está en el reporte de Agente 6 y en `.work/v2/evidence/`.

## 3. Recompensas y reglas

- Cofre: `applyXpCoins(10, 5)` la primera vez (5 XP del cofre + 5 XP del fragmento, 5 monedas); repetir no da nada. Tope diario de 120 respetado.
- Fragmento libre: +5 XP una vez.
- Guía: +5 XP al completar la primera lectura; repetir no da XP.
- Telescopio, biblioteca, sombras y restauración: 0 monedas y 0 XP.
- No se alteran XP, monedas, desbloqueos, cosméticos ni repaso espaciado existentes. Las interacciones nuevas no sustituyen el repaso real.

## 4. Guardado

`state.v2.world` es aditivo:

```
chests[id]    = { openedAt, xp, coins, capReached }
guides[area]  = { step, completedAt, xp }
fragments[id] = { collectedAt, questionId, flashcardId, sheetId, title, areaId, source, xp }
stations[id]  = { usedAt, uses }
visited[id]   = ISO
```

`normalizeState` valida y conserva; los guardados anteriores (sin `v2`) usan los valores por defecto. La exportación/importación incluye `v2.world`. No se subió `SAVE_SCHEMA_VERSION`: los cambios son aditivos y compatibles.

## 5. QA final

**Pasada de Agente 7 sobre el build `b32f14899538`.**

**Resultado: 54 casos · 53 PASS · 0 FAIL · 0 BLOCKED · 1 NOTE.** El NOTE son 21 warnings no bloqueantes de Three.js (`PCFSoftShadowMap`), preexistentes.

| Bloque | Resultado |
|---|---|
| Versión visible `V2 · Final`, API `V2.world` y censo (5 cofres, 15 fragmentos, 5 guías, 2 estaciones, 5 sombras, 22 marcadores) | PASS |
| Cofre cerrado/abierto, recompensa única, repetición sin recompensa | PASS |
| Fragmento guardado/desbloqueo de flashcard, repetición sin XP | PASS |
| Guía de 3 pantallas, +5 XP primera vez, repetición sin XP; las 5 guías abren | PASS |
| Biblioteca vacía, con fichas y lector local | PASS |
| Persistencia de `v2.world` tras recargar | PASS |
| Telescopio sin/con errores, sombra activa y disipada al completar el repaso | PASS |
| Restauración nivel 0 vs nivel 3 en la misma puerta | PASS |
| Culling de marcadores (8/22 ocultos en el spawn) | PASS |
| Tope diario: XP sí, monedas no; anti-farmeo | PASS |
| Paneles a 960×540 y 390×844 sin scroll | PASS |
| JSON exportado incluye `v2.world`; reimportación lo conserva | PASS |
| Importación 1.2 y recarga | PASS |
| Export HTML por `file://`: mundo + cofre + 0 red/errores | PASS |
| Enlace del HUB `serums-quest/index.html` → `dist/index.html` | PASS |
| 0 peticiones de red no locales de 62; 0 errores de consola/excepción; 0 `V2._errors` | PASS |
| `dist` y `export` estables (mismo SHA-256) | PASS |

**FPS (calidad alta, GPU NVIDIA RTX 4060, Chrome 156 headless, 1280×720):**

| Escena | Mínimo | Medio | Muestras | < 45 |
|---|---:|---:|---:|---:|
| Atrio en reposo | 75 | 75 | 18 | 0 |
| Atrio con mundo activo (panel) | 75 | 75 | 18 | 0 |
| Mapa | 75 | 75 | 18 | 0 |
| Duelo | 75 | 75 | 18 | 0 |

**Capturas:** `.work/v2/evidence/agent7-cp2-*.png` (38). Capturas de interacción de apoyo: `w01`–`w24` en la misma carpeta. Informe completo: `.work/v2/evidence/agent7-cp2-report.md` · datos: `agent7-cp2-qa.json`.

## 6. Tamaño y entrega

| Archivo | Bytes |
|---|---:|
| `game.js` | 2.388.325 |
| `dist/index.html` | 3.173.871 |
| `export/serums-quest.html` | 3.173.871 |
| `game.json` | 3.349 |
| Banco de preguntas (`src/content-v2.json`) | 1.424.732 |

`dist` y `export` comparten SHA-256 `b32f14899538c979b8a3317bb94feb91704f80b338115289a4dabe94567ca048`. El export es un HTML único sin red, con Three.js y todo el juego incrustado. El enlace del HUB sigue siendo `serums-quest/index.html` → `dist/index.html`.

## 7. Límites conocidos

- El atrio con todas las misiones completadas es denso (props + marcadores + restauración); los marcadores se cullan por distancia (8/22 ocultos en el spawn) y el mundo sigue a 75 FPS.
- La restauración se deriva del progreso; si el dominio bajara, el nivel visual podría bajar (no se guarda un flag `restored`).
- Las sombras se disipan cuando no quedan errores vencidos del área; los errores siguen en el repaso espaciado con su nueva fecha.
- Study Dashboard no tiene MCQ; sus 210 preguntas son una capa generada desde texto literal y marcada.
- La clave de `2026-i-psicologia-q026` admite debate; se conservó la de la fuente.
- 21 warnings preexistentes de Three.js (`PCFSoftShadowMap`), no bloqueantes.
- No se generaron imágenes de IA; los 12 slots de Game Studio siguen intactos.

## 8. Evidencia

- Informe QA: `.work/v2/evidence/agent7-cp2-report.md`
- Datos QA: `.work/v2/evidence/agent7-cp2-qa.json`
- Capturas: `.work/v2/evidence/agent7-cp2-*.png`
- Interacciones: `.work/v2/evidence/world-interactions*.json` y `w*.png`
- Contenido: `.work/v2/content-report.md`
- Checkpoint 1: `docs/V2-CHECKPOINT1.md`
