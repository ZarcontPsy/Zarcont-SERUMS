# SERUMS QUEST · V2.1 · PROGRESO

**Actualizado:** 2026-11-07 · sesión de continuación (la del 2026-11-06 se cortó por contexto).
**Fuente de verdad:** este archivo. Los agentes y su evidencia viven en `.work/v21/agent1…agent6` y `.work/v2/qa/` (ruta histórica de la sesión 1; `.work/v2.1/` es solo esta memoria).

## Estado por tarea

| # | Agente / función | Estado | Verificación / evidencia |
|---|---|---|---|
| 1 | Geometría y colisión voxel (parpadeo, coplanares, cámara near/far, sombras) | **hecho** | `.work/v21/agent1/out/report-qa.json`: flicker 0, coplanares sin resolver 0, 610 cosméticos, 52.356 cajas / 19.399 caras culladas. Integrado en `part2-world.js` y `part3c-cosmetics-models.js`. |
| 2 | Banderines y estandartes (pivote en driza, tela sobre el palo) | **hecho** | `.work/v21/agent2/README.md` + `shots/validation.json`; run 2 B08b PASS (close-ups de las 5 arenas) y B08e PASS en run 1 (sin cambios en banderines). Integrado en `part5-assets.js`. |
| 3 | Feedback al final (sin overlay entre preguntas, auto-avance ~900 ms) y resumen de nivel | **hecho** | `.work/v21/agent3/harness.js` 92/92; QA final B01/B01b/B02/B03a/B03b PASS. Integrado en `part5-feedback.js/.css` y `part8-summary.js/.css`. |
| 4 | Cámara y diseño del duelo (hoja lateral/inferior, safe-area, contracción al atacar) | **hecho** (corregido 2026-11-07) | Run 1: B07b FAIL (la contracción empezaba en la pregunta siguiente). Corregido en `part7-duel.js`: `onAttack` aplica `v2d-attacking` en el mismo tick. Run 2 B07b PASS: inicio 77 ms, índice 0, panel 472×368→472×52, fin 714 ms. |
| 5 | Selector de héroes (10 héroes, tarjeta central, CTA, resize) | **hecho** | `.work/v21/agent5/REPORT-AGENTE5.md` + `shots/layout-current.json`; QA final R10/B03/selector PASS. Integrado en `part5-heroes.js/.css`. |
| 6 | Rendimiento y mundo (PCF sin warnings, culling del atrio, restauración máxima, banco original) | **hecho** | `.work/v21/agent6/NOTES.md`; QA final B09/B04/B06/R11h PASS: 31 draw calls, 22 ahorrados (71 %), PCF=0 warnings. Integrado en `part6-world.js` y `part9-perf.js/.css`. |
| 7 | QA y rendimiento final sobre el build integrado | **hecho** | Run 2 sobre `ffc4e8ebd3d2`: **55 PASS · 0 FAIL · 0 BLOCKED · 1 NOTE (56 casos)**. NOTE = señal auxiliar de ojos B08c; B07b PASS. Informe `agent7-v21-final-report.md`; run 1 conservado como `agent7-v21-run1-final-report.md`. |
| 0 | Coordinador / integrador | **hecho** | Build `ffc4e8ebd3d2` (3.369.535 B), `dist` = `export` (SHA-256 idéntico), `node --check` OK, playtest abre sin errores; `docs/V2.1-FINAL.md` y `README.md` actualizados. |

## Cierre

No queda trabajo pendiente de V2.1. La única observación de QA es el NOTE B08c (señal auxiliar por píxeles oscuros), no bloqueante. Se conserva la copia previa a V2.1 y el informe de la pasada inicial para trazabilidad.

## Builds

| Build | Bytes | Nota |
|---|---:|---|
| `c08f590d7972` | 3.369.150 | V2.1 integrada antes de la sesión de continuación; run 1 de QA. |
| `ffc4e8ebd3d2` | 3.369.535 | Corrección B07b (contracción inmediata); run 2 de QA. `dist/index.html` = `export/serums-quest.html`. Game Studio: versión **83**. |

## Reglas que no se rompen

- No tocar HUB, `serums-quest-legacy`, `archivo/`, `_backups/`, `INTEGRITY.sha256`.
- 12 slots de Game Studio intactos; sin imágenes IA.
- Guardado aditivo: no perder XP, monedas, desbloqueos, cosméticos ni repaso.
- 60 FPS objetivo; calidad baja/media/alta y reducir movimiento.
