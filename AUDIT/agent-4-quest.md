# Agente 4 — SERUMS QUEST: cambio de personaje localizado

**Fecha:** 2026-10-25 · **Rama de trabajo:** repositorio existente (sin reconstrucción).
**Alcance:** `serums-quest/js/app.js`, `characters.js` (solo lectura), `collection.js` (solo lectura),
`character-art.js`, `scenes.js` (solo lectura), `reactions.js` (solo lectura), `icons.js`,
`styles-game.css`, `tests/selection-check.html` (nuevo). **No se tocó** `store.js`, `index.html`,
datos, banco, temario ni claves de persistencia.

## 1. Diagnóstico confirmado (y matizado)

`select-character` hacía `commit()` y después `render()`; `render()` reemplaza por completo
`view.innerHTML` (app.js:2071), reconstruye la arena, el escenario SVG, los 10 retratos del elenco,
los paneles y el appbar, y vuelve a enlazar los efectos de escena. Medido en Chrome headless
(1280×900, perfil temporal): **cada cambio de héroe o de selección producía 1 reemplazo completo de
`#view`, 13 retratos y 1 escenario nuevos, 18–33 ms de trabajo síncrono, pérdida de foco (BODY) y,
según la altura del panel anterior, desplazamiento del scroll (0→210 px en el primer cambio).**
`showUnlockDialog` confirmaba con `render()` y, en el catálogo, además asignaba `location.hash` y
volvía a llamar `render()` (doble reconstrucción).

Matiz honesto: el scroll de ventana no se reiniciaba siempre a 0 porque `render()` solo hace
`scrollTo(0)` cuando cambia la ruta; lo que sí ocurría era reconstrucción total, reinicio de la
animación `q-fade-up` de `.q-page`, reinicio de las animaciones de arte/escena, pérdida de foco y
desplazamiento por *scroll anchoring* cuando cambiaba la altura del panel. La sensación de recarga
era real.

## 2. Solución aplicada

### 2.1 Cambio localizado (no re-render de la vista)

- `charactersContext()` concentra el cálculo que antes vivía dentro de `renderCharacters()`
  (app.js:692). La página se compone con fragmentos: `heroInfoMarkup`, `heroDetailMarkup`,
  `heroesFigureMarkup`, `heroStripMarkup`, `heroDotsMarkup`, `heroNeighborInner`, `heroesHeadMarkup`
  (app.js:700–926).
- Regiones marcadas con `data-sel`: `heroes-head`, `hero-filters`, `hero-info`, `hero-stage`,
  `heroes-figure`, `hero-neighbor-prev/next`, `hero-dots`, `hero-strip`, `strip-summary`.
- `refreshCharactersFocus()` (app.js:868) cambia solo escenario (si cambia el área), figura central,
  dos vecinos, puntos, paneles y marcadores del elenco. `refreshCharactersSelection()`
  (app.js:889) actualiza solo los paneles de identidad/detalle, los indicadores `is-selected` /
  `aria-current` / `aria-pressed`, el chip del appbar y anuncia el cambio; **no recrea ningún
  retrato ni escenario**.
- `refreshCharactersOwnership()` (app.js:900) refresca cabeza, filtros, paneles y textos de estado
  tras una compra o un desbloqueo, sin sustituir `#view`.
- `refreshResultSelection()` (app.js:1595) actualiza el acompañante, la escena (solo si cambia el
  área) y las acciones de las tarjetas de desbloqueo en `#/resultado/:id`.
- `refreshShopOwnership()` (app.js:1160) actualiza saldo, tarjeta comprada e historial de
  transacciones en la tienda.
- `refreshCharactersPreview()` (app.js:876) conmuta la animación de previsualización sin rehacer la
  arena.
- `showUnlockDialog` (app.js:2453): al confirmar, si la ruta es el catálogo y el héroe no es el
  enfocado, **navega por hash** a `#/personaje/:id` (render normal de ruta, documento sin recargar);
  si ya está en la ficha, aplica el parche local. Al cancelar, aplica ownership localizado en
  catálogo/tienda y no re-renderiza.
- Acciones en `handleClick`: `char-focus` (app.js:2634), `char-prev/char-next` (`moveCharFocus`),
  `preview-state`, `select-character` (app.js:2644) eligen el parche local y solo caen a `render()`
  si no existe una ruta localizada.

### 2.2 Sin datos residuales

Cada parche recalcula el contexto completo del héroe enfocado (nombre, título, personalidad,
descripción, cita, afinidad, rareza, atributos, precio, compatibles, equipo, ventaja, gesto) desde
`QuestCharacters`/`QuestCollection` y reemplaza **todo** el contenido de las regiones dependientes.
No se conserva texto del héroe anterior. El elenco se parchea tarjeta a tarjeta (estado, "En uso",
`aria-current`) sin tocar el arte de las demás.

### 2.3 Foco, scroll, animaciones y accesibilidad

- No se sustituye `#view` ni se llama `scrollTo` en los cambios locales.
- El foco se conserva en la tarjeta/vecino/punto (no se reconstruyen). Al seleccionar, el botón
  desaparece y el foco pasa al `h1` del panel (con `tabindex="-1"`), que es el ancla lógica.
- `aria-pressed` marca el héroe inspeccionado; `aria-current="true"` marca el activo (con barra
  verde y texto "En uso"); `aria-label` del chip del appbar incluye nombre, título y rareza.
- `#q-live` anuncia "Ahora juegas con …". El toast existente se conserva.
- Transición breve (`q-sel-enter`, 240 ms) solo sobre el retrato nuevo y el acompañante; pulso
  discreto del chip (`q-sel-pulse`). `prefers-reduced-motion` y la clase `reduce-motion` las anulan
  por completo (`styles-game.css`:467–490).
- El retrato del appbar ya no se reconstruye en cada `commit`: se cachea por personaje + atuendo +
  rareza (`syncChrome`, app.js:2137).

## 3. Archivos y líneas

| Archivo | Cambio |
|---|---|
| `serums-quest/js/app.js` | helpers `outfitSignature/announce/flashElement/replaceInner`; `charactersContext` (692); fragmentos y parches (700–926); `refreshShopOwnership` (1160); `refreshResultSelection` (1595); `syncChrome` con caché (2137); `showUnlockDialog` (2453); acciones localizadas (2634–2676). |
| `serums-quest/js/icons.js` | iconos `sun` y `moon` (69–70); antes `syncChrome` caía al icono `circle` y el botón de tema parecía vacío. |
| `serums-quest/js/character-art.js` | `out += 'fabricAccents(a)'` → `out += fabricAccents(a)` (796): el texto literal se colaba en cada SVG y las telas no recibían sus pliegues. |
| `serums-quest/styles-game.css` | estados de selección (`is-selected`, `aria-current`), transiciones y reduced-motion (467–490); appbar responsive (691–895). |
| `serums-quest/tests/selection-check.html` | **nuevo** arnés de 150 comprobaciones (24 mediciones) para A→B→C→A, recarga, pestaña, HUB, reduced motion, teclado, foco, scroll, centinelas y residuos. |

## 4. Mediciones antes/después

Arnés: `serums-quest/tests/selection-check.html`, Chrome headless 1280×900, perfil temporal,
`Network.setCacheDisabled`. Valores síncronos del manejador de clic (ms).

| Métrica | Antes | Después |
|---|---:|---:|
| Reconstrucciones de `#view` por cambio | **1** | **0** |
| Retratos recreados al inspeccionar | **13** | **3** (héroe + 2 vecinos) |
| Retratos recreados al seleccionar | **13** | **0** |
| Escenarios recreados al cambiar de área | **1** | **1** (solo si cambia el área; 0 si no) |
| Tiempo de foco (char-focus) | 21,1–33,3 · mediana 22,8 ms | 5,6–15,6 · mediana 9,1 ms |
| Tiempo de selección | 18,4–29,6 · mediana 20,0 ms | 7,4–15,8 · mediana 7,9 ms |
| Scroll conservado | 3/5 | **5/5** |
| Foco conservado tras seleccionar | No (BODY) | **Sí** (panel de identidad) |
| Anuncio accesible | No | **Sí** (`#q-live`) |
| Comprobaciones del arnés | 93/149 | **150/150** |

Recarga real medida en el arnés: 85–150 ms de navegación+carga (solo referencia; no es una métrica de
producto, varía con la carga del equipo). HUB y vuelta: 201–251 ms, con selección persistida. Nodos
en el DOM tras A→B→C→A: 2315 (incluye centinelas de prueba; no crece por parches).

Rendimiento gráfico existente (`perf-check.html`): **9/9**; 60 retratos en frío 7,1 ms, 600 lecturas
cacheadas 2,2 ms, 500 escenas 11,6–27,1 ms, 10 retratos 4,5–5,0 ms, 1.487 nodos SVG.

## 5. Pruebas ejecutadas

Servidor `python -m http.server 8774 --bind 127.0.0.1`; Chrome
`--headless=new --remote-allow-origins=* --remote-debugging-port=9334 --user-data-dir=$env:TEMP\a4-chrome`;
Node 24 del runtime. Todas por CDP, perfil temporal (nunca el real).

| Prueba | Resultado |
|---|---|
| `tests/selection-check.html` | **150/150** (0 fallos). A→B→C→A: Ilan→Mara→Lía→Ilan y Zenón legendario; residuos por panel; rarezas inicial/común/raro/legendario. |
| `tests/tests.html` (`__QUEST_TESTS__`) | **61/61** |
| `tests/ui-check.html` (`__QUEST_UI__`) | **44/44** |
| `tests/launcher-check.html` (`__QUEST_HUB__`) | **7/7** |
| `tests/perf-check.html` (`__QUEST_PERF__`) | **9/9** |
| Persistencia: recarga, otra pestaña, salir al HUB y reentrar | selección y UI correctas tras cada paso |
| Resultado con desbloqueo | acompañante Mara→Amaru, 0 reconstrucciones de `#view`, acción "Héroe activo", anuncio y persistencia tras recarga |
| Tienda: compra + "Ver después" | tarjeta marcada "Obtenido", saldo 28.900, selección intacta, 0 reconstrucciones |
| Tienda: compra + "Seleccionar ahora" | Lía activa, chip del appbar y tarjeta actualizados |
| Desbloqueo desde `#/personajes` | hash `#/personaje/mara`, título y panel correctos, diálogo cerrado, sin recarga de documento |
| Tema claro/oscuro | icono sol/luna, `aria-label`, `title`, `theme-color` y estado persistido; captura `AUDIT/evidencias/agent4-quest-light-390.png` |
| Movimiento reducido (preferencia de la app y `prefers-reduced-motion` emulado) | transición ausente, `animation-duration: 1e-06s`, cambio de héroe funcional |
| Teclado | flechas cambian el héroe sin reconstruir `#view`; foco visible global |
| Arnés responsive del appbar (320/360/390/620/768/900/1024/1280) | sin scroll horizontal, sin solapes, tema/audio/Jugar/3 controles visibles; área táctil 40×40 en ≤900; tema enfocable por teclado |

Nota sobre la pestaña: se emuló el cruce real de pestañas escribiendo el estado desde otro contexto
del mismo origen, lo que dispara el evento `storage` que la app ya escucha. No se abrió una segunda
ventana de Chrome; el camino de código es el real (`store.subscribe` → `external` → `render`).

## 6. Appbar responsive (petición de coordinación con Agente 7)

- **≤1280:** copia del hero-chip oculta, chip compacto y gaps reducidos; la navegación conserva sus
  cinco destinos.
- **≤1020:** marca compacta y "Jugar" solo icono; la navegación superior sigue visible.
- **≤900:** el botón de **tema deja de ocultarse** (era un control funcional perdido); audio, tema,
  Jugar y los tres controles comunes miden 40×40.
- **≤620:** appbar en dos filas (marca + retrato/monedas/Jugar/audio; Inicio/HUB/pantalla completa +
  tema). `--appbar: 96px` para que los asides sticky no queden bajo la barra.
- **≤380:** cinco columnas para que los tres controles y el tema quepan completos, también a 320 px.
- Evidencias: `AUDIT/evidencias/agent4-quest-topbar-{320,360,390,620,768,900,1024,1280}.png` y
  `agent4-quest-light-390.png`. Medición: alturas 95/95/96/96/63/63/71/71 px; `scrollWidth ===
  clientWidth` en todos; cero solapes; tema 40×40 en ≤900 y enfocable.
- **Con sesión activa** (botón "Continuar" visible) a 320 y 390: 9 controles a 40×40, 0 solapes y
  sin scroll horizontal; el botón de continuar ocupa la primera celda de la segunda fila.

## 7. Datos residuales (verificación)

Tras cada cambio se comprueba que en los paneles activos (identidad, detalle, figura central,
retrato del appbar y chip) no aparezca el nombre de ningún otro personaje del catálogo, y que
nombre, título, rareza y los cinco atributos correspondan al héroe activo. También se verifica que
exista **un solo** `aria-current` en el elenco y que el `aria-pressed` corresponda al inspeccionado.
Resultado: 0 residuos en los 4 cambios de la secuencia y en la vuelta a Ilan.

## 8. Pendientes / coordinación

1. **Cache-busting (Agente 7, no editable por mí):** `index.html` sigue cargando
   `js/app.js?v=1.2.0`, `js/icons.js?v=1.2.0`, `js/character-art.js?v=1.2.0` y
   `styles-game.css?v=1.2.0`. Para que los usuarios reciban estos cambios hay que subir esos
   `?v=` (p. ej. `1.2.1`) y, si se actualiza la versión, `AUTORIA.md`/`INTEGRITY.sha256` (coordinador).
2. La sincronización entre pestañas sigue haciendo un refresco completo de la vista cuando el
   estado cambia fuera de la pestaña activa (puede cambiar XP, monedas, sesiones…). Es deliberado;
   el cambio localizado cubre las acciones dentro de la pestaña.
3. Comprar un **cosmético** desde tienda/inventario sigue usando `render()` porque afecta a la
   rejilla y al borrador de equipamiento; fuera del alcance de «cambio de personaje».
4. El arnés nuevo mide en Chrome headless con viewport fijo; no sustituye la matriz visual de QA
   (Agente 8) en dispositivos reales.
5. `tests/tests.html` declara 61 pruebas (coincide con el README); el conteo parcial anterior era
   un artefacto del sondeo CDP, corregido esperando estabilidad del resultado.
