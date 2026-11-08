# SERUMS QUEST V2.1 · Agente 5 · Selector de héroes

**Fecha:** 2026-11-06. **Propiedad:** solo `.work/src/part5-heroes.js` y `.work/src/part5-heroes.css`.
**Referencia visual:** la imagen adjunta **no estaba visible en esta sesión**. El reajuste se hizo con la descripción textual y el diseño actual del Observatorio; no se copiaron colores de una referencia desconocida.

## Archivos tocados

- `.work/src/part5-heroes.js` · markup de cabecera/tarjetas, geometría de layout, renderer y ciclo de vida del canvas.
- `.work/src/part5-heroes.css` · cabecera, tarjeta central, placas laterales, reclutamiento y responsive.
- `.work/v21/agent5/**` · harness y capturas propias. No se integra en el build.
- No se tocaron `game.js`, `game.json`, `dist/`, `export/`, `build-game.js`, `part2-world.js`, `part3c-cosmetics-models.js`, HUB, legacy, `_backups/` ni `INTEGRITY.sha256`.

## Cambios

### JS

1. **Cabecera**: la onda pasa a ir justo debajo del título y la entradilla debajo de la onda (antes onda → párrafo). Entradilla acortada a una línea. `h1` con `clamp(26px, 3vw, 37px)` para que no parta en dos líneas a 1280×720 (la cabecera baja de 179 px a 116 px y la tarjeta gana altura).
2. **Layout del carrusel** (`v2hLayout`): tarjeta central `min(0.60·ancho, 1.42·alto, 640px)`; laterales a media tarjeta (`--v2-step = 0.5·cardW`) con tope para que el borde exterior no se recorte (`ancho/2 − 0.39·cardW − 6`). La tercera tarjeta queda fuera de foco (`step2 = step + 0.62·cardW`). Resultado medido: central 552×396 (960×540), 640×465 (1280×720), 565×525 (1024×768); franjas laterales visibles 187/263/192 px.
3. **Placa de tarjeta vecina**: rareza + nombre + clase, anclada al 24 %/76 % (mitad visible) y oculta en `prev2/next2`; así deja de quedar medio tapada por la tarjeta central o cortada por el viewport.
4. **Renderer del modelo central**:
   - `WebGLRenderer({ antialias: true, alpha: true, depth: true, stencil: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' })`.
   - Se elimina el reinicio de la animación CSS `is-in` en cada navegación (opacidad 0 → 1 + `scale(0.985)`); el canvas conserva opacidad 1 y `transform: none` al cambiar de héroe (medido: mismo canvas, PNG no vacío ~54–64 kB, ~27–31 ms).
   - `ResizeObserver` sobre el escenario + reencuadre en el siguiente `requestAnimationFrame`, para que el buffer coincida con el escenario desde el primer frame (antes se medía 274 px de canvas para 278 px de escenario).
   - **No se crea geometría propia**: el modelo sigue saliendo de `buildHeroAvatar()` / `applyOutfitToAvatar()` de part2/part3c (geometría `mergedVoxels` corregida por el Agente 1). Este módulo solo la encuadra y la reutiliza.
5. **Acciones/estados/precios intactos**: `select-hero`, `open-recruit`, `recruit-confirm`, `v2-hero-prev/next/goto`, `heroRequirementState`, `formatNumber` y los textos de precio/estado no cambiaron.
6. **Reclutamiento**: los hijos de la columna flexible con scroll ya no se encogen (`flex: 0 0 auto`); antes la descripción de un héroe largo (Zenón) desaparecía a 960×540. Scrollbar fina y oscura; a 960×540 encaja sin scroll.

### CSS

- Cabecera: onda bajo el título, entradilla después; `h1` máximo 37 px.
- Tarjeta central: filo superior con acento del héroe (`::before`, 2 px) y radio/marco existentes del Observatorio.
- Atributos: separador superior dentro de `.v2-hero-copy` (no en reclutamiento).
- CTA principal: 44 px (48 px táctil), sombra dorada en estado de compra.
- Placas laterales: 32 % de ancho, 24 %/76 %, rareza con color por rareza sin heredar la píldora de la ficha.
- Responsive:
  - `max-height: 760px`: se oculta la cita del reclutamiento (libera 30 px a 1280×720).
  - `max-height: 660px`: cabecera compacta ya existente, tag de título oculto, CTA 38 px, reclutamiento con huecos reducidos y nota final oculta; la descripción sigue visible.
  - `max-height: 620px` y ancho ≥900: `.v2-hero-overlay` con 10/20/12 px (el `.overlay` compartido se aprieta a 8/16/10; el selector no debe tocar el borde).
  - Táctil: nav 46 px, CTA 48 px, cierre 44 px (sin cambios de contrato).
  - Movimiento reducido y alto contraste conservados.

## Tamaños y comprobaciones

Harness local que reproduce la concatenación del build **sin escribir `game.js` ni `dist/`** (three.js y `window.GAME` se toman del dist vigente; solo en el harness `FINAL_RELEASE=false` para abrir `devScreen: heroes`).

| Tamaño | Central | Cabecera | Carrusel | Laterales | Resultado |
|---|---|---|---|---|---|
| 960×540 | 552×396 | 70.9 px | 392 px alto | 187 px por lado | sin fallos |
| 1280×720 | 640×465 | 116.4 px | 465 px alto | 263 px por lado | sin fallos |
| 1024×768 | 565×525 | 109.9 px | 525 px alto | 192 px por lado | sin fallos |
| 1024×768 táctil (`pointer: coarse`) | 565×519 | 109.9 px | 519 px alto | 192 px por lado | sin fallos |

Comprobado en los tres estados del carrusel (primera, intermedia y última tarjeta):

- Sin desbordamiento de viewport; el overlay mide exactamente la pantalla.
- Cabecera por encima del carrusel y sin tapar la tarjeta.
- Tarjeta central dentro de la vista; copia sin clipping (`scrollHeight == clientHeight`); CTA visible y clickeable (`elementFromPoint`).
- Escenario dentro de la tarjeta y canvas no vacío; canvas del mismo tamaño que el escenario (`canvasMatchesStage`).
- Placas laterales dentro de la mitad visible y dentro del viewport; tercera tarjeta no dominante.
- En 960×540 el CTA y el reclutamiento caben sin scroll; en 1280×720 el reclutamiento tiene scroll interno con botón principal visible; en 1024×768 cabe completo.
- Sin errores de consola en ninguna pasada.

### Prueba funcional de acciones (1024×768, partida sembrada)

- `open-recruit`: Mara, CTA «Comprar ◇ 480» → ficha «Reclutar por ◇480» con `recruit-confirm`.
- `recruit-confirm`: monedas 99.999 → 99.519, `ownedCharacterIds = [ilan, mara]`, toast de compra, vuelve al carrusel con CTA «Elegir».
- `select-hero`: «Elegir» → «En ruta» deshabilitado, `selectedCharacterId = mara`, avatar de cabecera «Mara Solís».
- Teclado: `ArrowRight` cambia Mara → Noa. Sin errores.

## Validación

- `node --check .work/src/part5-heroes.js` → OK.
- `node --check` del bundle completo del harness → OK.
- CSS: 246 `{` / 246 `}`, profundidad final 0, sin cierres negativos.
- Tokens verificados: `select-hero`, `open-recruit`, `recruit-confirm`, `v2-hero-prev/next/goto`, `data-v2-card`, `data-v2-stage`, `heroRequirementState`, `formatNumber`, `buildHeroAvatar`, `applyOutfitToAvatar`, `depth: true`, `antialias: true`, `ResizeObserver`.
- No se añadieron imágenes ni slots; el módulo no lee `assets/`.

## No verificado / límites

- **La imagen de referencia no estaba visible**: no se puede confirmar parecido exacto de proporciones, colores o composición. Se siguió la descripción (cabecera título/onda, avatar y monedas arriba, laterales parciales, central con fondo propio, nombre, descripción, rareza, atributos y botón de precio/estado) y el diseño actual del Observatorio.
- Parpadeo medido en headless (SwiftShader) y por estado del canvas; falta una pasada en GPU real, con `devicePixelRatio > 1` y sesión larga.
- El carrusel sigue siendo lineal: en la primera/última tarjeta solo hay una tarjeta lateral (se conserva el comportamiento y los botones deshabilitados).
- No se ejecutó `build-game.js` ni se regeneró `dist/` (lo hace el Agente 0). El harness usa las partes de otros agentes tal como estén en `.work/src` en el momento de la prueba.
- No se probaron gestos con hardware táctil; los handlers de puntero/rueda/teclado no se modificaron.

## Reproducción del harness

```powershell
cd serums-quest
node .work/v21/agent5/harness/build.js      # HTML de pruebas en .work/v21/agent5/harness/
node .work/v21/agent5/harness/serve.js 8899 # servidor estático de solo lectura
# Edge headless con --remote-debugging-port=9338 (perfil temporal)
node .work/v21/agent5/harness/probe.js 9338      # layout 960×540 / 1280×720 / 1024×768 / táctil
node .work/v21/agent5/harness/actions.js         # compra → reclutar → elegir
node .work/v21/agent5/harness/validate.js        # node --check, llaves CSS, contratos
```

Evidencias: `.work/v21/agent5/shots/layout-current.json`, `actions-verify.json` y las capturas `current-*`, `actions-*`.
