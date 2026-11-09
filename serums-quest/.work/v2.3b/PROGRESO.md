# PROGRESO · SERUMS QUEST V2.3 · FASE 1B

Actualizado: 2026-11-08 18:50 (America/Lima)
Coordinador: Agente 0.
Versión visible: **V2.3 · Fase 1B**.

| # | Tarea | Agente | Archivos | Estado |
| --- | --- | --- | --- | --- |
| 1 | Copia previa del proyecto, plan de zonas y respaldo de evidencia | 0 | `SERUMS-QUEST_v2.3b-pre-2026-11-08-1715`, `.work/v2.3b/` | HECHO |
| 2 | Bienvenida: zonas, escala fluida, 10 tamaños, modo bajo/vertical/ultra ancho | 1 | `part14-v23-welcome.js/.css` | HECHO · 10/10 sin solapes; título 8,5–9,4 % del alto |
| 3 | Escena cinematográfica compartida, independiente del atrio | 2 | `part16-v23b-cinema.js/.css` | HECHO · 1 canvas, 1 renderer, 1 escena; esfera, cristales, niebla, partículas |
| 4 | Tutorial cinematográfico de 5 pasos con mini-escenas 3D | 3 | `part14-v23-welcome.js/.css`, `part16-v23b-cinema.js` | HECHO · 5/5 pasos, 3 tamaños, 0 remontajes |
| 5 | Integración de hooks, pausa del render del mundo y versión 1B | 0 | `part4-flow.js`, `part10b-v23-core.js`, `part15-v23-integration.js`, `build-game.js`, `game.json` | HECHO |
| 6 | QA: 10 tamaños, 15 capturas de tutorial, FPS, calidad, reducción, bloqueo, remontajes | 4 | `.work/v2.3b/qa/`, `.work/v2.3b/evidence/` | HECHO · 15/15 PASS; matriz 690/690 |
| 7 | Hojas de contacto, build final, export, README y checkpoint | 0 | `.work/v2.3b/evidence/checkpoint/`, `docs/V2.3-FASE1B.md`, `README.md`, `dist/`, `export/` | HECHO |

## Checkpoint 1B

- **Build:** Game Studio **versión 115**, build **`2edeec6a488f`**.
- **Entrega:** `dist/index.html` = `export/serums-quest.html` = **3.812.635 B**; SHA-256 **`2EDEEC6A488F2A5076CE809C9F4E03F1AB45CD9B55A9D82FA10FEF42A7581E0E`**.
- **game.js:** 3.027.085 B; SHA-256 **`DEB80C9617A334DDA1419B6495C7538A8F0BF6031AE1E922BF70065256CCE821`**; `node --check` OK.
- **QA:** 15/15 funcionales PASS; 10 tamaños de bienvenida sin solapes ni controles fuera; 15 capturas del tutorial en 3 tamaños sin scroll de panel; **75 FPS** mínimo en los 6 contextos de calidad; **690/690** en la matriz; catálogo 33/16 visibles a 1308×662; **0 errores de consola**, **0 peticiones externas**.
- **Encaje:** la cámara encaja la caja proyectada real con objetivo de 9,5 % de margen y obtiene mínimo 10 % superior/inferior en el tutorial y 12 % en la bienvenida; laterales ≥ 7 % (el peor caso es el héroe caminando del paso 1 en 390×844), sin recorte.
- **Remontajes:** 0. Mismo `#v23bCinema`, mismo renderer, misma escena y mismo nodo de tutorial entre los 5 pasos; `renderCount` +0, `titlePaints` 1.
- **Almacenamiento:** permitido y bloqueado PASS. Con bloqueo: bienvenida + tutorial + «SIN GUARDADO», sin recuperación.
- **Movimiento reducido:** dos capturas separadas 900 ms con diferencia máxima de 1 nivel en 1 píxel y 0 píxeles con diferencia > 2; cámara sin deslizamiento, CSS sin animación.
- **Calidad:** partículas activas 1.010 (alta) / 848 (media) / 290 (baja); racimos de cristal 7 / 7 / 5.

## Decisiones simples (documentadas)

- **Escena propia:** un canvas y una escena exclusivos para bienvenida/tutorial, detrás de `#ui` (z-index 1). El mundo del juego se pausa solo en su `render` mientras el cine cubre la pantalla; el bucle y el FPS siguen vivos.
- **Dos pasadas, un renderer:** fondo a pantalla completa con `bgCamera` (capa 0) y grupo/mini-escena con `heroCamera` (capa 2) en viewport+scissor de la zona DOM. Así el encuadre se mide sobre la caja real y no sobre la ventana.
- **Zona del tutorial:** el escenario 3D ocupa un rectángulo interior (`inset 7 %`) para dar aire a las mini-escenas; el fondo atmosférico sigue a pantalla completa.
- **Vertical:** héroes arriba, texto abajo y CTAs a ancho completo; en 768/820 los dos CTAs van en fila para liberar altura, sin solapes.
- **Teclado frente a táctil:** las teclas WASD/E y el joystick/botón se construyen una vez y se alternan por ancho/tipo de puntero, sin remontar la escena. Si se cambia el tamaño, el encuadre se recalcula.
- **Cristales en vertical:** se ocultan para no ensuciar la lectura sobre el texto; quedan esfera, nebulosa, polvo y estrellas.
- **Viñeta:** se elimina la viñeta duplicada del título (la aporta `.v23bScrim`); su gradiente radial producía banding visible sobre el planeta en vertical.
- **Antes/después:** las capturas adjuntas de la revisión no quedaron accesibles como archivos en el proyecto; el «antes» se regeneró desde el build de Fase 1 y la referencia visual se tomó de la captura de atmósfera disponible. Queda documentado en las hojas de contacto.
- **Copia:** `C:\Users\USARIO\Documents\ZARCONT SERUMS-BACKUPS\SERUMS-QUEST_v2.3b-pre-2026-11-08-1715` (sin `.git`, perfiles, snapshots ni playtests). Informe en `_COPIA-INFO.txt`.

## Archivos de la fase

- `part14-v23-welcome.js/.css` — bienvenida, tutorial, ayuda y hooks.
- `part16-v23b-cinema.js/.css` — escena compartida, mini-escenas, encuadre, calidad y reducción.
- `part4-flow.js` — guarda de teclado del título y pausa del render del mundo.
- `part10b-v23-core.js` — versión 2.3.0-phase1b y registro del agente de cine.
- `part15-v23-integration.js` — alias `__v23.welcome` y `__v23.cinema`.
- `build-game.js` — inclusión de part16 y cabecera 1B.
- `game.json` — `rules.version = V2.3 · Fase 1B`.

## Evidencia

- 28 capturas de bienvenida, 15 del tutorial, 6 de bloqueo/reducción, 5 hojas de contacto y datos JSON en `.work/v2.3b/evidence/`.
- Hojas: `sheet-bienvenida-10-tamanos.jpg`, `sheet-bienvenida-vertical.jpg`, `sheet-tutorial-1280x720.jpg`, `sheet-tutorial-640x360.jpg`, `sheet-tutorial-390x844.jpg`, `sheet-antes-despues.jpg`.
- QA: `.work/v2.3b/agents/REPORTE-1B.md`, `evidence/data/functional.json`, `capture.json`, `regression-1b.json`.
- Informe: `docs/V2.3-FASE1B.md`.

## Pendiente

- **Detenido en el CHECKPOINT 1B.** No se inicia la Fase 2 hasta recibir «OK fase 1».
- La Fase 2 heredará el estándar reforzado de cosméticos y efectos; la Fase 3 seguirá con lista → «OK lista» → modelado.
