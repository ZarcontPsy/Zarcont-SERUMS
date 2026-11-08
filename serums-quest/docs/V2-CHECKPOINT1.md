# SERUMS QUEST · V2 · Checkpoint 1

**Fecha:** 6 de noviembre de 2026
**Versión visible:** `V2 · Checkpoint 1`
**Build Game Studio:** `850400a8e762` · `dist/index.html` 3.036.252 B
**Estado:** Checkpoint 1 entregado. El mundo interactivo (Agente 6) queda para después del OK del usuario.
**Copia de seguridad:** `C:\Users\USARIO\Documents\ZARCONT SERUMS-BACKUPS\SERUMS-QUEST_v66_2026-11-06_0727.zip` (29.999.867 B; SHA-256 `753ECA3D9C29BC9853151C910900EFB86BD79103D049D62D648422A086BFCFBE`; 416 entradas).

## 1. Limpieza anterior

La limpieza del 29 de octubre de 2026 está aplicada:

- `__pycache__`: 0 · archivos `.pyc`: 0.
- Los 31 archivos y las 3 carpetas de caché del informe `AUDIT/LIMPIEZA-2026-10-29.md` siguen eliminados.
- `temp_digest.py` se conserva a propósito: es el generador de los 42 digests documentados.
- `INTEGRITY.sha256`: 673 archivos verificados, 25 modificados preexistentes, **0 faltantes** (exit 1 solo por los 25 cambios legítimos del usuario). No se tocó el manifiesto.

## 2. Agentes

| # | Función | Estado | Archivos propios | Problemas / notas |
|---|---|---|---|---|
| 0 | Coordinador e integrador | Completado | `.work/build-game.js`, `part0-v2-core.js`, hooks en part1/part2/part3/part3f/part3h/part3j/part4, `game.js`, `game.json`, `src/content-v2.json`, `src/explanations-original.json`, README, este informe | Integración y capturas; sin conflictos de archivos. |
| 1 | Combate y efectos | Completado | `.work/src/part5-combat.js` | Sin verificación visual propia; integrado y probado por Agente 0/7. |
| 2 | Selector de héroes | Completado | `.work/src/part5-heroes.js`, `part5-heroes.css` | Corregido el recorte de tarjetas laterales y la cabecera a 960×540. |
| 3 | Assets y mundo visual | Completado | `.work/src/part5-assets.js` | 75 IDs; sin verificación visual propia; integrado y probado. |
| 4 | Contenido pedagógico | Completado | `.work/v2/questions-v2.json`, `explanations-original.json`, `content-report.md`, herramientas `agent4-*` | Study Dashboard no tiene MCQ; sus 210 preguntas son una capa generada desde texto literal, marcada. |
| 5 | Feedback y flujo | Completado | `.work/src/part5-feedback.js`, `part5-feedback.css` | Corregidos el compacto a 960×540 y la persistencia de pesos (`saveSettings`). |
| 6 | Mundo interactivo | No iniciado (contrato listo) | `.work/v2/CONTRATO-AGENTE-6.md` | Se integra tras el OK del Checkpoint 1. |
| 7 | QA y rendimiento | Base + final | `.work/v2/qa/agent7-*`, evidencia `agent7-*` | Base: 47 PASS, 1 FAIL (pesos, ya corregido), 1 NOTE. Pasada final sobre el build `8504…`. |

## 3. Cambios de esta entrega

### Combate
Cinco estilos de guardián (territorio/raíces, cuidado/pulso, confianza/reflejos y balanzas, evidencia/prisma, sistema/engranajes y planos), telegraph antes del golpe, impacto, escudo, partículas, números de daño, reacción del héroe, derrota por disolución de luz y cambio de fase en jefes. Ataques de héroe por arma (10 sabores). Presupuesto: 18/40/80 partículas y 4 números de daño máximo; sacudida ≤ 0.14; con movimiento reducido se sustituyen proyectiles por fundidos.

### Selector de héroes
Carrusel con tarjeta central y laterales parciales, fondo propio por héroe (SVG/CSS generado en código), modelo 3D giratorio con arma y cosméticos, avatar/monedas arriba, y botón según estado real (`Elegir`, `En ruta`, `Comprar ◇`, `Bloqueado`). Teclado, ratón, rueda y gestos táctiles. Montaje/desmontaje del renderer propio y fallback a retrato si WebGL falla.

### Mundo visual
60 props (12 por isla: vegetación, instrumentos, estructuras, luces y agua), 5 esbirros decorativos, 5 variantes de arena y cielo/auroras/polvo estelar. Todo en código, sin texturas externas; instancing y batching; presupuesto 5/8/12 props por isla y 18/45/80 partículas según calidad. Los props del atrio no bloquean el paso ni el raycast de las puertas.

### Contenido
- 840 preguntas nuevas: 630 de Study Flashcards (420 MCQ literales + 210 abiertas convertidas) y 210 de fichas de Study Dashboard.
- 111 preguntas de campaña conservadas; se les añadió explicación (todas marcadas `explanationGenerated`).
- 0 duplicados; 0 descartes; 951 preguntas totales.
- Muestra verificada de 37 claves; verificación automática completa en `.work/v2/tools/agent4-verify-report.json`.

### Feedback y flujo
Overlay tras cada respuesta (excepto Simulacro), con clave, explicación, diferencia con la opción elegida, Continuar (Enter/Espacio), Marcar como difícil y Ver en flashcard local. En Contrarreloj/Supervivencia el reloj se desplaza por el tiempo exacto del feedback; en Simulacro se mantiene el informe final. Pesos de fuentes configurables y persistentes en Ajustes (60/15/25 por defecto).

## 4. Recuento por área y origen

| Área | Campaña | Flashcards | Dashboard (fichas) | Total |
|---|---:|---:|---:|---:|
| Salud pública | 25 | 129 | 43 | 197 |
| Cuidado integral | 25 | 405 | 135 | 565 |
| Ética e interculturalidad | 18 | 27 | 9 | 54 |
| Investigación | 18 | 21 | 7 | 46 |
| Gestión de servicios | 25 | 48 | 16 | 89 |
| **Total** | **111** | **630** | **210** | **951** |

- Tarjetas de Study Flashcards: 210 `multiple` + 210 `application` (literales) + 210 `concept` convertidas = 630.
- Fichas de Study Dashboard: 210 (una por ficha, generadas desde texto literal).
- Generadas: 420 preguntas (210 concept + 210 fichas) y 321 explicaciones (210 fichas + 111 originales).
- Study Dashboard no tiene MCQ: se documenta y se marca la capa generada; no se presenta como banco oficial de examen.

## 5. QA

- Regresión base: 49 casos, 47 PASS, 1 FAIL (persistencia de pesos), 1 NOTE. El FAIL se corrigió (verificado con `agent7-weight-repro.js`: `reproduced:false`).
- Pasada final: ver sección 7 (se actualiza al cerrar el checkpoint).
- Red: 0 peticiones no locales; 0 errores de consola/excepción; 0 errores V2.
- FPS con GPU (Chrome headless, 960×540, calidad alta): atrio 75/75, duelo 75/75, mapa 75/75 en la captura de Agente 0; Agente 7 reportó mapa mínimo 65 durante la transición de isla. Ninguna muestra < 45.
- Calidad baja/media/alta: 18/45/80 partículas, persistente; reducir movimiento persistente.
- Importación 1.2 y del guardado nuevo, exportación y reimportación: verificadas por Agente 7.
- Guardado: esquema 2 sin cambios estructurales; `settings.sourceWeights` es aditivo y compatible. No se pierde progreso, monedas, desbloqueos ni cosméticos.

### Muestra de claves (37)
La tabla completa está en [`.work/v2/content-report.md`](.work/v2/content-report.md#10-muestra-verificada-de-claves-37-filas). Incluye 10 claves de campaña reverificadas, 20 de flashcards cerradas/abiertas y 7 de fichas; 37/37 OK. Las 420 MCQ literales se compararon además contra `options[correctIndex]` de la fuente (420/420) y las 210 concept contra el inicio exacto de `card.answer` (210/210).

## 6. Capturas

- [Atrio V2](.work/v2/evidence/00-atrio-v2.png)
- [Selector de héroes](.work/v2/evidence/01-selector-heroes.png)
- [Ajustes · mezcla de fuentes](.work/v2/evidence/02b-ajustes-pesos-detalle.png)
- [Feedback de error](.work/v2/evidence/05-feedback-error-1-territorio.png)
- [Feedback de acierto](.work/v2/evidence/06-feedback-acierto.png)
- [Flashcard local](.work/v2/evidence/09-feedback-flashcard.png)
- Ataques: [territorio](.work/v2/evidence/04-ataque-1-territorio-b.png) · [cuidado](.work/v2/evidence/04-ataque-2-cuidado-b.png) · [confianza](.work/v2/evidence/04-ataque-3-confianza-b.png) · [evidencia](.work/v2/evidence/04-ataque-4-evidencia-b.png) · [sistema](.work/v2/evidence/04-ataque-5-sistema-b.png)
- [Mapa completo](.work/v2/evidence/07-mapa-completo.png) y las cinco islas (`08-isla-1..5-*.png`).
- Selector con estados: [Comprar](.work/v2/evidence/selector-lateral.png) · [Bloqueado](.work/v2/evidence/selector-bloqueado.png).

## 7. Pasada final de QA

**Build verificado:** `dist/index.html` buildId `850400a8e762` · SHA-256 `850400a8e762534abdd66588538326d0462f221f49c4676da14cf618c2e13a6e` · 3.036.252 B.

**Resultado:** **51 casos · 50 PASS · 0 FAIL · 0 BLOCKED · 0 SKIP · 1 NOTE.** El NOTE son 28 warnings no bloqueantes de Three.js (`PCFSoftShadowMap` retirado en r187), preexistentes.

| Comprobación | Resultado |
|---|---|
| Título, menú, versión «V2 · Checkpoint 1» | PASS |
| Tutorial de 5 pasos | PASS |
| Atrio, pausa y reanudación en duelo | PASS |
| Mapa de 5 islas | PASS |
| Modos, práctica libre | PASS |
| Misión de campaña de 5 preguntas y resultado | PASS |
| Feedback de acierto y error a 960×540 (clave, explicación, porqué, difícil, flashcard) | PASS |
| Ataques de los 5 guardianes (telegraph + impacto) | PASS |
| Selector de 10 héroes y estados En ruta / Comprar / Bloqueado | PASS |
| Tienda, inventario/vestuario | PASS |
| Ajustes, calidad baja/media/alta y reducir movimiento | PASS |
| Persistencia de pesos tras cambiar calidad y recargar | PASS (ST04 corregido) |
| Importación de la partida 1.2 (Offline QA) | PASS |
| Repaso de 3 errores vencidos | PASS |
| Exportación + reimportación (XP/monedas/nodos/cosméticos/héroe) | PASS |
| Recargas y persistencia | PASS |
| 951 preguntas y 42 claves auditadas | PASS |
| Red: 0 peticiones no locales de 119 (27 `file`, 92 `data`) | PASS |
| Errores de consola/excepción y `V2._errors` | 0 / 0 |

**FPS (calidad alta, GPU NVIDIA RTX 4060, Chrome 156 headless, 960×540):**

| Escena | Mínimo | Medio | Muestras |
|---|---:|---:|---:|
| Atrio | 75 | 75 | 18 |
| Mapa | 75 | 75 | 18 |
| Duelo | 75 | 75 | 18 |

Ninguna muestra por debajo de 45 FPS. La base de Agente 7 había registrado un mínimo de 65 en el mapa durante la transición de isla; la pasada final no lo reprodujo.

**Capturas definitivas** en `.work/v2/evidence/` (31):

- Selector: `agent7-cp1-selector-heroes.png`, `agent7-cp1-selector-en-ruta.png`, `agent7-cp1-selector-comprar.png`, `agent7-cp1-selector-bloqueado.png`.
- Feedback: `agent7-cp1-feedback-error.png`, `agent7-cp1-feedback-acierto.png`, `agent7-cp1-flashcard.png`.
- Ataques: `agent7-cp1-ataque-1-territorio.png` … `-5-sistema.png`.
- Mundo: `agent7-cp1-atrio.png`, `agent7-cp1-mapa-completo.png`, `agent7-cp1-isla-1..5-*.png`.
- Ajustes/versión: `agent7-cp1-ajustes-pesos.png`, `agent7-cp1-titulo-version.png`, `agent7-cp1-modos.png`, `agent7-cp1-tienda.png`, `agent7-cp1-inventario.png`, `agent7-cp1-importar-antigua.png`, `agent7-cp1-resultado-mision.png`.
- Datos: `.work/v2/evidence/agent7-qa.json` · informe: `.work/v2/evidence/agent7-report.md`.

## 8. Límites conocidos

- Study Dashboard no contiene MCQ; sus 210 preguntas son una capa pedagógica generada y marcada. No son preguntas oficiales.
- El banco está desbalanceado por área (Cuidado integral 565 vs Investigación 46), porque el material de origen lo está.
- Algunas respuestas `concept` se acortaron a la primera oración exacta (117/210); la tarjeta original conserva el texto completo.
- La clave de `2026-i-psicologia-q026` admite debate (pasiva/activa); se conservó la de la fuente y se anotó.
- El feedback abierto congela el reloj indefinidamente en Contrarreloj/Supervivencia (es lo pedido; permite pausar).
- En jefes, la clave sigue sellada hasta el informe final, como el diseño anterior.
- Agente 7 detectó 26 warnings de Three.js (`PCFSoftShadowMap removed`) preexistentes, no bloqueantes.
- La versión final V2 (mundo interactivo, export regenerado) queda para el Checkpoint 2.
