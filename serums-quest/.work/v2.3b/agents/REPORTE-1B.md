# AGENTES · V2.3 FASE 1B · RESUMEN CORTO

**Número de agentes:** 5 (coordinador + 3 de trabajo + QA). Todos los cambios se integraron en el build final; ningún agente tocó archivos ajenos.

| Agente | Función | Archivos | Estado |
| --- | --- | --- | --- |
| 0 · Coordinador | Copia, arquitectura, integración, build, documentación y checkpoint | `part4-flow.js`, `part10b-v23-core.js`, `part15-v23-integration.js`, `build-game.js`, `game.json`, `.work/v2.3b/` | HECHO |
| 1 · Layout | Zonas, escala fluida, 10 tamaños, modos bajo/vertical/ultra ancho y áreas seguras | `part14-v23-welcome.js/.css` | HECHO · 10/10 sin solapes; título 8,5–9,4 % del alto |
| 2 · Escena | Escena cinematográfica compartida (esfera, cristales, niebla, partículas, halo, viñeta), un renderer/escena y calidad/reducción | `part16-v23b-cinema.js/.css` | HECHO · 1 canvas, 1 renderer, 1 escena; 0 recargas |
| 3 · Tutorial | Cinco pasos cinematográficos con mini-escenas 3D, constelación, teclado, foco y aria-live | `part14-v23-welcome.js/.css`, `part16-v23b-cinema.js` | HECHO · 5/5 en 3 tamaños; 0 remontajes |
| 4 · QA | 10 tamaños, 15 capturas del tutorial, FPS, calidad, reducción, bloqueo, guardado, matriz y catálogo | `.work/v2.3b/qa/`, `.work/v2.3b/evidence/` | HECHO · PASS 15/15; 690/690; 0 errores |

## Estado de la puerta

- Bienvenida: 10 tamaños sin solapes ni controles fuera; héroe con márgenes ≥ 12 % superior/inferior y ≥ 10 % lateral.
- Tutorial: 5 pasos × 3 tamaños; panel sin scroll; apoyo de 2 líneas; constelación de 5 estrellas; foco atrapado.
- Escena: un renderizador y una escena reutilizados; sin remontar canvas, escena, overlay ni título al avanzar.
- Rendimiento: 75 FPS mínimos en bienvenida y tutorial, en calidad baja/media/alta.
- Almacenamiento: permitido y bloqueado PASS; bloqueado no muestra recuperación.
- Reducción de movimiento: escena y textos estáticos; sin deslizamiento de cámara.
- Regresión: matriz 69×10 = 690/690; catálogo 33 totales / 16 visibles a 1308×662.
- Build: V2.3 · Fase 1B · Game Studio 115 · `2edeec6a488f`.

**Detenido en CHECKPOINT 1B a la espera de «OK fase 1».**
