# PROGRESO · SERUMS QUEST V2.3 · FASE 2

Actualizado: 2026-11-08 20:50 (America/Lima)
Coordinador: Agente 0.
Versión: **V2.3 · Fase 2**.
Estado: **CHECKPOINT 2**, a la espera de «OK fase 2».

> El estándar reforzado completo (prueba de silueta, mínimos por rareza, firmas de efectos, referencias por pieza, diferencia estructural, miniaturas y presupuesto) está reproducido sin recortes en [`docs/V2.3-FASE2-ART-DIRECTION.md`](../../docs/V2.3-FASE2-ART-DIRECTION.md). No faltaba: se aplicó completo; la puerta solo se calibró a los mínimos escritos (3 formas/4 tonos, señal en raro+, parte animada en épico, órbitas/partículas en legendario).

| # | Tarea | Agente | Archivos | Estado |
| --- | --- | --- | --- | --- |
| 1 | Copia previa, captura «antes» homogénea y miniaturas antes | 0 | backup `SERUMS-QUEST_v2.3-fase2-pre-2026-11-08-1940`, `.work/v2.3/evidence/before/`, `thumbs-before/` | HECHO |
| 2 | Dirección de arte y puerta de calidad | 1 | `docs/V2.3-FASE2-ART-DIRECTION.md`, `part17g-v23c-gate.js` | HECHO · 61/61 |
| 3 | Auras y suelo | 2 | `part17b-v23c-auras.js` | HECHO |
| 4 | Efectos de movimiento y armas | 3 | `part17c-v23c-motion.js` | HECHO |
| 5 | Marcos y mascotas | 4 | `part17d-v23c-frames.js` | HECHO |
| 6 | Ropa | 5 | `part17e-v23c-clothing.js` | HECHO |
| 7 | Accesorios, amuletos, trofeos y tocados | 6 | `part17f-v23c-accessories.js` | HECHO |
| 8 | Integración, encaje, build y evidencias | 0 | `part17a-v23c-core.js`, `part3c`, `part11`, `part12`, build | HECHO |
| 9 | QA final: matriz, efectos, FPS, miniaturas, peso, reducción | 7 | `.work/v2.3/qa/`, `.work/v2.3/evidence/qa/` | HECHO |
| 10 | Hojas antes/después, siluetas, diferencia y rarezas | 0 | `.work/v2.3/evidence/*.jpg` | HECHO |
| 11 | Export, README, docs y CHECKPOINT 2 | 0 | `dist/`, `export/`, `README.md`, `docs/V2.3-FASE2.md` | HECHO |

## Métricas de la puerta

- **61/61 piezas** pasan la puerta (69 cosméticos menos 8 títulos sin malla).
- **Silueta:** `boxiness` mínimo 0,149 · mediana 0,452 · máximo 0,879; ninguna por encima de 0,90. Componentes + extremos del perfil: 1–15 (mediana 5).
- **Formas/tonos:** 3–7 familias de geometría y 5–12 tonos por pieza.
- **Efectos:** 45 pares; `1−IoU` mínimo **0,585** (Sello vs Prisma), media **0,836**, máximo **0,956**; **0 pares por debajo de 0,45**. Auras/suelo: mínimo **0,684** (Alba vs Amanecer).
- **Visor:** 33/33 efectos visibles; héroe mínimo **0,606** del alto (Bruma/Kian), mediana 0,791.
- **Matriz:** **690/690**.
- **Miniaturas:** 69/69 en tienda y 69/69 en inventario; 11/11 de control cambiaron respecto al antes.
- **Peso:** 4.051.057 B; **+238.422 B (6,3 %)** respecto a Fase 1B; presupuesto 1,2 MB; no se comprimieron definiciones.
- **FPS:** 75 en título/tienda en baja, media y alta; mínimo 74 en la pasada extra.
- **Reducción de movimiento:** 3D congelado; diferencia máxima 2 niveles, 0 píxeles >2.
- **Consola:** 0 errores, 0 warnings.

## Rechazos y rehacer

| Pieza | Motivo | Resultado |
| --- | --- | --- |
| `c-torso-bata` | boxiness 0,943 | 0,710 con solapas, faldón y bolsillos |
| `c-piernas-falda` | boxiness 0,922 | 0,813 con paneles, rollos y vuelo |
| `c-torso-manto` | banda oscura en el cuello | capelina al frente, estrellas y broche; 0,815 |
| `c-efecto-aura` | héroe 0,54–0,55 | héroe 0,67–0,69 |
| `c-efecto-constelacion` | héroe 0,42–0,54 | héroe 0,66–0,70 |
| `c-marco-constelacion` | 19 penetraciones | 0 penetraciones; aro de mapa estelar |
| `x-capa-errorario` | 33 penetraciones de cráneo | 0 penetraciones; capucha detrás |
| `c-marco-platino` | flotaba en Kian (1,241) | regla histórica retirada; gap 0 |
| `c-accesorios-brujula` | no se leía | 1,62× delante de la muñeca |
| `x-luciernaga-observatorio` | escala diminuta | 1,6× |
| `x-zorro-tinta` | demasiado estrecho | +33 % ancho / +21 % largo |
| `x-trofeo-*` | escala pequeña | +18 % |

Máximo dos rondas: una ronda de rehacer por pieza; la segunda se usó solo para el ajuste visual del aro de constelación, ya con 690/690.

## Entrega

- **Game Studio:** versión **129**, build **`b41b7a7a04db`**.
- **`dist/index.html` = `export/serums-quest.html`:** **4.051.057 B**, SHA-256 **`B41B7A7A04DB652A489971C50D7F55AD16E3CFC306FC0317091B4A2161ED55DE`**.
- **`game.js`:** 3.265.508 B, SHA-256 **`58F15D398C161C466FA2E5A35786D0965A584B288E9026AB1984392DA945EEF5`**.
- 12 slots intactos; sin imágenes de IA; guardado compatible; HUB, legacy, `archivo/`, `_backups/`, `INTEGRITY.sha256`, study-dashboard y study-flashcards no se tocaron.

## Evidencia (rutas fijas)

- `.work/v2.3/evidence/sheet-antes-3-heroes.jpg`
- `.work/v2.3/evidence/sheet-despues-3-heroes.jpg`
- `.work/v2.3/evidence/sheet-antes-efectos-3-heroes.jpg`
- `.work/v2.3/evidence/sheet-despues-efectos-3-heroes.jpg`
- `.work/v2.3/evidence/sheet-siluetas-despues.jpg`
- `.work/v2.3/evidence/sheet-diferencia-efectos.jpg`
- `.work/v2.3/evidence/sheet-una-pieza-por-rareza.jpg`
- `.work/v2.3/evidence/sheet-miniaturas-tienda-1.jpg`
- `.work/v2.3/evidence/sheet-miniaturas-tienda-2.jpg`
- Datos: `.work/v2.3/evidence/qa/gate.json`, `phase2-qa.json`, `phase2-extra.json`.
- Reporte: `.work/v2.3/agents/REPORTE-FASE2.md`; informe: `docs/V2.3-FASE2.md`.

## Pendiente

- **Detenido en CHECKPOINT 2.** No se inicia la Fase 3 hasta recibir «OK fase 2».
- La Fase 3 conserva lista → «OK lista» → modelado y hereda este estándar.
