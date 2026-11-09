# SERUMS QUEST · V2.3 · Fase 1 — plan de trabajo

Fecha: 2026-11-08 (America/Lima)
Carpeta de trabajo: `C:\Users\USARIO\Documents\ZARCONT SERUMS\serums-quest`
Copia previa: `C:\Users\USARIO\Documents\ZARCONT SERUMS-BACKUPS\SERUMS-QUEST_v2.3-pre-2026-11-08` (103,3 MB; ver `_COPIA-INFO.txt` por exclusiones).

## Estado real de partida (verificado)

- `git status --short`: limpio. Rama `master`, último commit `b91580b V1.3.2`.
- Game Studio: versión **96**, build `b6ab87f0a86a`, «V2.2 · Tienda 3D e interfaz · final etiquetas».
- `dist/index.html` = `export/serums-quest.html` = **3.448.508 B**, SHA-256 `B6AB87F0A86A2F7ACB5C0074CDCC71E38677B5E0DC4DD9050407D88CCB7AC6D8`.
- `game.js` = 2.662.945 B, SHA-256 `4D049F7EA859D50F8A7E7C35EB9C7F767A84607A7885E191D201932E4C7B95A2EA` (contiene 69 cosméticos y 951 preguntas).
- Línea base reproducible en `.work/v2.3/qa/baseline.json` y `.work/v2.3/evidence/base-*.png`:
  - Bienvenida V2.2: un solo héroe (`img`), 8 botones de menú y CTA; a 1280×720 el menú inferior queda cortado.
  - Tutorial: al pulsar Siguiente se reemplaza **todo** el `.overlayShell` (`overlayRemounted: true`, `renderScreen` +1); el título no está montado (`title: false`). Causa: `setScreen('tutorial')` + `renderScreen()` completo.
  - Tienda 1308×662: 33 tarjetas, **9 visibles** (objetivo ≥12), sin búsqueda ni orden.
  - Visor de tienda a 1308×662: canvas de 436×183; Aura de alba se ve muy tenue/recortada.
  - Con almacenamiento bloqueado el juego entra en «No he borrado tu partida» (recuperación) en lugar de mostrar bienvenida. Causa: `loadState()` trata cualquier excepción de `localStorage` como corrupción.
- No se tocaron HUB, `serums-quest-legacy`, `archivo/`, `_backups/`, `INTEGRITY.sha256`, study-dashboard ni study-flashcards.

## Reglas de convivencia

- Cada agente de trabajo escribe **solo** su `part1x-v23-*.js` y `part1x-v23-*.css` en `.work/src/`, y sus scripts/capturas en `.work/v2.3/agents/agentN/`. Nada de editar `game.js`, `game.json`, `dist/`, `export/`, `.work/build-game.js`, `.work/v2.3/qa/cdp.js`, otros `part*` ni assets.
- El coordinador (Agente 0) es el único que toca archivos compartidos, integra, construye Game Studio, actualiza README/docs y regenera `dist/`/`export/`.
- Sin imágenes de IA. Slots de Game Studio intactos. Guardado y progreso intactos (cambios de esquema solo aditivos). Estilo del Observatorio, 60 FPS, calidades baja/media/alta y reducir movimiento funcionando.
- Respuestas de agentes al coordinador: resumen corto (qué cambió, archivos propios, resultados), sin pegar código ni logs; capturas en baja resolución guardadas en disco.

## Reparto y propiedad de archivos

| Agente | Función | Archivos propios |
| --- | --- | --- |
| 0 | Coordinación, integración, build, docs | `part10b-v23-core.js`, `part15-v23-integration.js/.css`, build-game.js, pipeline QA, dist/export/docs |
| 1 | Sistema de encaje 69×10 | `part11-v23-anchors.js`, `part11-v23-anchors.css` |
| 2 | Visor y escenario de prueba | `part12-v23-visor.js`, `part12-v23-visor.css` |
| 3 | Catálogo de tienda e inventario | `part13-v23-shop.js`, `part13-v23-shop.css` |
| 4 | Bienvenida y tutorial | `part14-v23-welcome.js`, `part14-v23-welcome.css` |
| 5 | QA | `.work/v2.3/agents/qa/` (solo lectura del juego) |

## Pipeline de previsualización (sin tocar archivos compartidos)

Cada agente construye su propio HTML de prueba. El build lee todos los `part*`, pero
`GAME_PARTS_ONLY`/`GAME_CSS_ONLY` limitan los módulos V2.3 a los del agente; el resto
del juego (V2.2) se incluye normal. `GAME_OUT` evita escribir `game.js`.

```powershell
$env:GAME_OUT=".work/v2.3/preview/a1-game.js"
$env:GAME_PARTS_ONLY="part11-v23-anchors"
$env:GAME_CSS_ONLY="part11-v23-anchors"
node .work/build-game.js
node .work/v2.3/tools/make-test-html.js .work/v2.3/preview/a1-game.js .work/v2.3/preview/a1.html
```

`make-test-html.js` sustituye el último `<script>` de `dist/index.html` por el `game.js`
generado. No modifica `dist/`. Para el coordinador, sin variables de entorno, el build
final escribe `game.js` y luego Game Studio genera `dist/`.

Arnés CDP sin dependencias: `.work/v2.3/qa/cdp.js` (`open`, `seed`, `click`, `shot`,
`setViewport`, `preload`, `ev`, `waitFor`). Puertos por agente: 9541 (A1), 9542 (A2),
9543 (A3), 9544 (A4), 9545 (QA). Perfiles bajo `.work/v2.3/qa/profiles/`.

## Contrato mínimo entre módulos

- El visor (Agente 2) se monta dentro de `#shopPreviewMount` y `#wardrobePreviewMount`,
  que ya existen en el V2.2 y debe conservar el catálogo (Agente 3). El visor no cambia
  `shop.selectedId` ni el guardado: usa `V23.preview.heroId` para probar héroes.
- El catálogo (Agente 3) puede reemplazar `shopScreenHTML`, `wardrobeScreenHTML`,
  `v22UpdateShopCards`, `v22UpdateWardrobeItems`, `shopSelect` y sus filtros. No debe
  redefinir `v22FramePreview`, `v22MountShopPreview`, `mountWardrobePreview` ni
  `updateWardrobePreview` (propiedad del Agente 2). Debe incluir los dos mounts del visor
  y llamar a `v22UpdateShopPreview()` al cambiar la pieza seleccionada.
- La bienvenida (Agente 4) reemplaza `titleScreenHTML`, `openTutorial`, `closeTutorial`
  y puede envolver `helpScreenHTML`; no usa `setScreen('tutorial')` ni re-renderiza el
  título al avanzar. Su overlay de tutorial vive fuera de `#screen` y actualiza solo su
  cuerpo/progreso.
- El encaje (Agente 1) puede envolver `chooseAnchorForCosmetic`, `addPieceGroup` o
  `applyOutfitToAvatar`; no debe tocar la geometría de los 69 cosméticos salvo
  transformaciones de encaje. Debe exponer un hook de QA en `window.__v23Anchors`.
- El coordinador expondrá `window.__v23` con apertura de tienda/inventario/bienvenida,
  estado del visor, `matrix()` de encaje y contadores de render para QA.

## Matriz de verificación visual (todas las tareas visuales)

640×360, 844×390, 1024×600, 1308×662, 768×1024, 1280×720, 1920×1080. En cada una:
ventana completa y reducida, sin desbordes horizontales, sin recortes de la pieza,
texto legible y controles alcanzables. Capturas en baja resolución y hojas de contacto
en `.work/v2.3/evidence/`.

## Criterios de aceptación de la fase 1

1. Matriz 69 cosméticos × 10 héroes: 690/690 montajes, 100 % visibles, sin atravesar el
   cuerpo, sin huecos flotantes y sin parpadeo. Reportar tasa y fallos residuales.
2. Visor: encuadre por ranura, zoom + restablecer, luz de borde, fondo por rareza,
   texto que no tapa la pieza, selector de 10 héroes; los 5 efectos y 4 marcos visibles
   con claridad. Evidencia en 3 héroes.
3. Catálogo: ≥12 ítems visibles a 1308×662, cuadrícula a toda la altura, columnas
   automáticas, tarjetas compactas, miniaturas bajo demanda, cabecera comprimida,
   búsqueda, orden y filtros; responsive 2→1; sin recarga completa y conservando
   scroll/selección.
4. Bienvenida: composición de referencia (título grande, línea de género, descripción,
   dos botones, personajes voxel a la izquierda con el héroe equipado al frente, tarjetas
   de 5 rutas abajo a la derecha, iconos de sonido/ajustes/ayuda abajo a la izquierda,
   fondo degradado con movimiento suave). Tutorial por pasos con Siguiente/Atrás/Saltar
   y progreso; el contenedor/fondo no se remonta y el renderer no se recrea; accesible
   desde Ayuda; no se repite una vez visto. Con almacenamiento bloqueado y permitido.
5. QA: 7 tamaños, 0 recargas completas, FPS, 5 problemas originales corregidos. Capturas
   del catálogo con 12+ ítems, efectos/marcos en 3 héroes, bienvenida y tutorial.
6. Build Game Studio «V2.3 · Fase 1», `dist/index.html` y `export/serums-quest.html`
   regenerados, README/docs actualizados, PROGRESO.md al día. Detenerse y esperar
   «OK fase 1».
