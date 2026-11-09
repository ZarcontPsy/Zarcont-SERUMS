# AGENTES · V2.3 · FASE 2 · COSMÉTICOS CON ESTÁNDAR REFORZADO

**Número de agentes:** 8 (1 coordinador, 1 dirección de arte, 5 de trabajo, 1 QA).
**Versión:** V2.3 · Fase 2.
**Estado:** CHECKPOINT 2, a la espera de «OK fase 2».

| Agente | Función | Archivos | Estado |
| --- | --- | --- | --- |
| 0 · Coordinador | Copia, núcleo de registro, integración, encaje, build, evidencias y checkpoint | `part17a-v23c-core.js`, `part3c-cosmetics-models.js`, `part12-v23-visor.js`, `part11-v23-anchors.js`, `build-game.js`, `game.json` | HECHO |
| 1 · Dirección de arte | Guía revisada, puerta de silueta, mínimos por rareza, firmas y rondas | `docs/V2.3-FASE2-ART-DIRECTION.md`, `part17g-v23c-gate.js` | HECHO |
| 2 · Auras y suelo | Alba, amanecer, bruma y constelación | `part17b-v23c-auras.js` | HECHO |
| 3 · Movimiento | Chispas, estela, cinco efectos de arma y Destello | `part17c-v23c-motion.js` | HECHO |
| 4 · Marcos y mascotas | Bronce, platino, vacío, constelación; luciérnaga, búho y zorro | `part17d-v23c-frames.js` | HECHO |
| 5 · Ropa | Cabeza, peinado, torso y piernas | `part17e-v23c-clothing.js` | HECHO |
| 6 · Accesorios | Bolso, brújula, gafas, pluma, amuletos, trofeos, reloj, cuaderno y tocados | `part17f-v23c-accessories.js` | HECHO |
| 7 · QA | 690/690, 33 efectos, FPS, miniaturas, peso, reducción y hojas | `.work/v2.3/qa/`, `.work/v2.3/evidence/` | HECHO |

## Puerta de calidad

- **Piezas medidas:** 61/61 PASS (69 cosméticos menos 8 títulos sin malla 3D).
- **Silueta:** `boxiness` mínimo 0,149 · mediana 0,452 · máximo 0,879 (ninguna por encima de 0,90); componentes+extremos del perfil 1–15 (mediana 5).
- **Formas y tonos:** 3–7 familias de geometría y 5–12 tonos por pieza.
- **Efectos:** 45 pares comparados; `1−IoU` mínimo **0,585** (Sello vs Prisma), media **0,836**, máximo **0,956**; **0 pares por debajo de 0,45**. Entre auras/suelo, mínimo **0,684** (Alba vs Amanecer); el resto entre 0,827 y 0,937.
- **Visor:** 33/33 combinaciones efecto × héroe visibles; héroe mínimo **0,606** del alto (Bruma/Kian), mediana 0,791; todas ≥0,60.
- **Matriz de encaje:** **690/690** (69 × 10), 0 penetraciones, huecos, parpadeos o invisibles.
- **Miniaturas:** 69/69 generadas en tienda y 69/69 en inventario; 11/11 miniaturas de control cambiaron respecto al antes.
- **Peso:** 4.051.057 B; crecimiento **+238.422 B (6,3 %)** respecto a Fase 1B, dentro del presupuesto de 1,2 MB. No se comprimieron definiciones.
- **FPS:** 75 en título y tienda con calidad baja/media/alta; mínimo 74 en la pasada extra.
- **Reducción de movimiento:** dos capturas separadas 900 ms con diferencia máxima de 2 niveles y 0 píxeles con diferencia >2; animaciones 3D congeladas.
- **Consola:** 0 errores y 0 warnings en las sesiones de QA.

## Rechazos y rehacer (máx. 2 rondas)

| Pieza | Rechazo | Resultado |
| --- | --- | --- |
| `c-torso-bata` | boxiness 0,943; rectángulo con muesca | solapas, hombros, faldón y bolsillos; 0,710 |
| `c-piernas-falda` | boxiness 0,922; caja marrón | paneles plegados, rollos y vuelo; 0,813 |
| `c-torso-manto` | visual: banda oscura en el cuello | capelina visible al frente, campo de estrellas y broche; 0,815 |
| `c-efecto-aura` | héroe 0,54–0,55 del alto | rayos/disco compactados; héroe 0,67–0,69 |
| `c-efecto-constelacion` | héroe 0,42–0,54 | cúpula/órbita compactadas; héroe 0,66–0,70 |
| `c-marco-constelacion` | 19 penetraciones de cuerpo | órbitas al plano z≤−0,90; 0 penetraciones; marco de vitrina de cuatro lados + dial estelar y estrellas orbitando |
| `x-capa-errorario` | 33 penetraciones de cráneo | capucha detrás del cráneo; 0 penetraciones |
| `c-marco-platino` | flotaba en Kian (gap 1,241) | regla de desplazamiento histórico retirada; gap 0 y 690/690 |
| `c-accesorios-brujula` | no se leía en el visor | instrumento 1,62× delante de la muñeca; visible |
| `x-luciernaga-observatorio` | escala de palo/insecto diminuto | 1,6× de alto; alas y abdomen legibles |
| `x-zorro-tinta` | demasiado estrecho | +33 % de ancho y +21 % de largo |
| `x-trofeo-*` | escala pequeña | +18 % de escala, base/placa/emblema |

No hizo falta una segunda ronda de arte en ninguna pieza; el marco de constelación necesitó la ronda 2 para pasar de aro bajo a marco de vitrina de cuatro lados con dial estelar, ya con la matriz en 690/690.

## Build

- Game Studio **versión 129**, build **`b41b7a7a04db`**.
- `dist/index.html` = `export/serums-quest.html` = **4.051.057 B**, SHA-256 **`B41B7A7A04DB652A489971C50D7F55AD16E3CFC306FC0317091B4A2161ED55DE`**.
- `game.js` 3.265.508 B, SHA-256 **`58F15D398C161C466FA2E5A35786D0965A584B288E9026AB1984392DA945EEF5`**.

## Evidencia principal

- [`sheet-antes-3-heroes.jpg`](../evidence/sheet-antes-3-heroes.jpg) y [`sheet-despues-3-heroes.jpg`](../evidence/sheet-despues-3-heroes.jpg) — mismo formato, 11 piezas × Ilan/Kian/Noa.
- [`sheet-antes-efectos-3-heroes.jpg`](../evidence/sheet-antes-efectos-3-heroes.jpg) y [`sheet-despues-efectos-3-heroes.jpg`](../evidence/sheet-despues-efectos-3-heroes.jpg) — 11 efectos × 3 héroes.
- [`sheet-siluetas-despues.jpg`](../evidence/sheet-siluetas-despues.jpg) — 11 piezas + 11 efectos con métricas.
- [`sheet-diferencia-efectos.jpg`](../evidence/sheet-diferencia-efectos.jpg) — matriz 1−IoU.
- [`sheet-una-pieza-por-rareza.jpg`](../evidence/sheet-una-pieza-por-rareza.jpg).
- [`sheet-miniaturas-tienda-1.jpg`](../evidence/sheet-miniaturas-tienda-1.jpg) y [`sheet-miniaturas-tienda-2.jpg`](../evidence/sheet-miniaturas-tienda-2.jpg).
- Datos: `evidence/qa/gate.json`, `phase2-qa.json`, `phase2-extra.json`, `matrix` en `phase2-qa.json`.
