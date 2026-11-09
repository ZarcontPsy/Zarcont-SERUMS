# REPORTE · Agente 4 · Bienvenida y tutorial (V2.3 · Fase 1)

Fecha: 2026-11-08 · Estados: **HECHO** · Solo se escribieron archivos propios.

## Qué cambió

1. **Bienvenida rediseñada** (`titleScreenHTML`): composición de referencia adaptada al Observatorio.
   - Título grande `SERUMS / QUEST`, línea de género («Aventura RPG · Preparación SERUMS · Psicología»), descripción corta y datos (nivel, rango, nodos, repasos, partida importada, duelo en pausa).
   - Dos CTAs grandes: **Comenzar/Continuar** (`menu-continue`; «Reanudar duelo» si hay duelo en pausa) y **Cómo jugar** (abre el tutorial).
   - **Personajes voxel a la izquierda** con animación de reposo CSS: héroe equipado al frente + dos acompañantes detrás, renderizados con `renderHeroPortrait` (sin imágenes nuevas ni slots). Fondo con degradado animado y atrio visible.
   - Abajo a la derecha: 5 tarjetas de ruta (acento, nombre corto, progreso `x/y` y barra) que abren el mapa en esa isla. Abajo a la izquierda: sonido, ajustes y ayuda.
   - Mapa, Arena, Modos, Inventario, Tienda, Bitácora e Importar siguen accesibles como iconos compactos en la cabecera (con etiqueta desde 1180 px).
2. **Tutorial propio** (`openTutorial`, `closeTutorial`, `maybeShowTutorial`, contenido de 5 pasos): overlay montado en `document.body`, **fuera de `#screen`**, sobre la bienvenida. Siguiente / Atrás / Saltar / cerrar, indicador «Paso X de 5», barra y puntos clicables, transiciones suaves, Esc, foco atrapado. Contenido: movimiento, rutas/misiones, repaso/errores, cosméticos y guardado/exportar.
3. **Ayuda y Ajustes**: `helpScreenHTML` envuelto con bloque «Cómo jugar · 5 pasos»; el botón existente «Repetir tutorial» de Ajustes abre el overlay. `openHelp/closeHelp` recuerdan la pantalla de origen.
4. **Guard defensivo de almacenamiento**: si `!storageEnabled && recoveryInfo.corrupt`, el módulo limpia `recoveryInfo.corrupt/raw` y `recoveryLock` antes de que dispare `runWhenBoot`; no se toca la recuperación de un guardado realmente corrupto con almacenamiento disponible.
5. **Repintado único** de la bienvenida al cargar el módulo si `screen === 'title'` (boot ya ocurrió). No se recrea el renderer ni el canvas `#game`.

## Causa raíz corregida

La base hacía `setScreen('tutorial')` al abrir y, en cada «Siguiente», `tutorialSlide += 1; renderScreen()`. Eso reemplazaba todo el `.overlayShell` y desmontaba el título.

Ahora el paso vive en memoria (`V23.tutorial.step`, `tutorialSlide` por compatibilidad), las acciones `tutorial-*` se atienden en **fase de captura** y nunca se llama a `setScreen`/`renderScreen` al avanzar: solo se actualizan cuerpo, progreso, puntos y botones del mismo nodo.

## Resultados

**Antes** (`preview/base.html`, reproducción propia en `qa-before.json`):
- «Siguiente»: `overlayRemounted: true`, `renderDelta: 1`, `screen: "tutorial"`, `title: false`.
- Almacenamiento bloqueado: `screen: "recovery"`, «No he borrado tu partida».

**Después** (`preview/a4.html`, `qa-welcome.json`):
- Avance de pasos: mismo nodo de overlay, mismo `.titleScreen`, mismo `#game`, `screen: "title"`, `mutations` de `#screen`: 0, `renderCount` delta: 0, `step` correcto 0→4. `tutorialSeen` guardado en localStorage; tras recargar **no reaparece**.
- **Almacenamiento permitido**: bienvenida + tutorial, Ayuda→tutorial→Esc vuelve a Ayuda, Ajustes→tutorial→Esc vuelve a Ajustes.
- **Almacenamiento bloqueado** (preload del arnés): no aparece recuperación (`corrupt:false`, `lock:false`), CTA «Comenzar», banner «Sin guardado», tutorial automático y avance sin remontaje. Tras recargar el tutorial vuelve a ofrecerse (no hay almacenamiento donde guardar `tutorialSeen`, comportamiento correcto).
- **7 tamaños** (640×360, 844×390, 1024×600, 1308×662, 768×1024, 1280×720, 1920×1080): 0 desbordes horizontales/verticales; ambos CTAs y las 5 rutas dentro de la ventana; etiquetas completas («Investigación» y «Invest.» en compacto); tutorial sin scroll interno en todos (panel 285–480 px de alto; 640×360: 285 px).
- **Táctil** 844×390 emulado (`pointer: coarse`): CTAs 44 px, herramientas/rutas 40 px, navegación 38 px, sin desbordes.
- **Movimiento**: fondo y héroe cambian de `transform` en reposo; `reduced-motion` desactiva fondo, héroe, halo y transiciones del tutorial.
- **Variantes**: héroe equipado al frente (corona, manto, grebas, gafas, constelación, marco; imagen distinta a la del guardado base) y pastilla «Partida importada» en `qa-welcome.json` y `qa-variants.json`; CTA «Reanudar duelo» y pastilla «Duelo en pausa» en `qa-welcome.json`.
- **Ajustes** → «Repetir tutorial» abre el overlay y Esc vuelve a Ajustes (`returnScreen: "settings"`); «Ayuda» → tutorial → Esc vuelve a Ayuda.
- **FPS** (headless Chrome, SwiftShader): título ≈75 FPS; tutorial ≈75 FPS; sin errores de consola.

## Archivos propios

- `.work/src/part14-v23-welcome.js`
- `.work/src/part14-v23-welcome.css`
- `.work/v2.3/agents/agent4/`:
  - scripts: `qa-welcome.js`, `qa-blocked.js`, `qa-before.js`, `qa-variants.js`, `smoke.js`
  - datos: `qa-welcome.json`, `qa-blocked.json`, `qa-before.json`, `qa-variants.json`
  - capturas: `evidence/welcome-*.png`, `tutorial-*.png`, `blocked-*.png`, `before-*.png`, `help-1280x720.png`, `route-ethics-map-1280x720.png`, `welcome-touch-844x390.png`
  - hojas de contacto (≤1600 px): `contact-welcome.png`, `contact-tutorial.png`, `contact-tutorial-steps.png`, `contact-blocked.png`, `contact-before-after.png`

## Decisiones simples

- El overlay del tutorial se monta una vez y se reutiliza (oculto); el nodo persiste entre pasos y reaperturas.
- Las tarjetas de ruta abren el mapa 3D y saltan a la isla; el cierre del mapa usa el comportamiento existente (vuelve al atrio, no a la bienvenida).
- Etiqueta de versión de fase «V2.3 · Fase 1» (la versión larga de la app no cabía en la cabecera).
- Bajo 900 px las tarjetas usan etiqueta corta («Invest.») para no truncar.
- El aviso compartido «Sin guardado» se eleva en la bienvenida con `body:has(.titleScreen.v23w)` para no tapar las rutas; el tutorial queda por encima del banner (z-index 75).

No se modificaron `game.js`, `game.json`, `dist/`, `export/`, `.work/build-game.js`, `qa/cdp.js`, otros `part*`, assets, HUB, legacy, backups ni documentación compartida. Sin imágenes de IA; slots del Game Studio intactos.
