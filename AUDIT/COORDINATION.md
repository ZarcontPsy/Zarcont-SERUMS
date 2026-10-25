# AUDITORÍA SERUMS — Coordinación del equipo (Agente 0)

Fecha: 2026-10-25 · Repositorio: `C:\Users\USARIO\Documents\ZARCONT SERUMS`
Coordinador: Agente 0. Especialistas: Agentes 1–8 (8 subagentes reales + coordinador = 9 roles).

## 0. Estado real del repositorio (verificado por el coordinador)

- No existe `SYSTEM.md` ni `AGENTS.md` en la raíz. Las instrucciones equivalentes son
  `DESIGN-SYSTEM.md`, `AUTORIA.md`, `NOTICE.md` y `.opencode/opencode.json`.
- Hub: `index.html` (SERUMS HUB 2.3.0, un solo archivo con CSS y JS inline).
- Aplicaciones y entradas canónicas:
  | App | Entrada real | Datos |
  |---|---|---|
  | BANQUEO · Examen Studio | `EXAMEN STUDIO/Examen Studio.html` | `EXAMEN STUDIO/datos/banco-oficial.js`, `auditoria-oficial.json` |
  | PLAZAS SERUMS · Map Explorer | `serums map/serums-map-explorer/index.html` | `datos/datos_plazas.js`, `datos/datos_adjudicados.js` |
  | Study Dashboard | `study-dashboard/index.html` | `study-data/temario.js`, `study-shared/*` |
  | Study Flashcards | `study-flashcards/index.html` | `study-data/temario.js`, `study-shared/*` |
  | SERUMS QUEST | `serums-quest/index.html` | banco + temario + `data/quest-map.js` |
- Persistencia: Study usa IndexedDB `study-serums` + `study-state-v1` + snapshot `studyhub:snapshot:v1`;
  QUEST `serumsquest:state:v1` (+ backup/journal/snapshot); Banqueo IndexedDB `examenstudio` v2;
  Plazas `serumsdb` + claves `serums_*`. **No cambiar claves ni borrar datos.**
- No hay Node en PATH; sí en `C:\Users\USARIO\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe` (v24, con `WebSocket` global).
- Chrome: `C:\Program Files\Google\Chrome\Application\chrome.exe`. Python 3.13 en `C:\Python313\python.exe`.
- `INTEGRITY.sha256` cubre 322 archivos. Al final el coordinador regenera el manifiesto
  (`python verificar_integridad.py --generar`). **Ningún especialista edita INTEGRITY.sha256,
  AUTORIA.md ni DESIGN-SYSTEM.md**; se anotan los cambios en `AUDIT/`.

## 1. Decisiones vinculantes del coordinador

- **D1 — Acceso principal del hub = portada de cada app.** Las tarjetas de Study Dashboard y
  Study Flashcards enlazan a `./study-dashboard/index.html` y `./study-flashcards/index.html`
  sin query. La reanudación de un punto concreto sigue existiendo dentro de cada app
  (`?sheet=`, `?deck=&resume=1`, enlaces «Continuar») y en las rutas directas; no se elimina.
  Motivo: el requisito pide biblioteca/portada al entrar desde el hub. El bloque de rutas del
  hub lo aplica el Agente 1 cuando el Agente 3 libere el archivo.
- **D2 — Dock inferior del hub: se elimina.** No se sustituye por otro dock ni por una
  cuadrícula. Se conservan carrusel, barra inferior, puntos, swipe, flechas y teclado.
  Si el dock tuviera funciones, ya están cubiertas por barra/puntos/teclado.
- **D3 — Controles comunes.** `serums-chrome.js` (nuevo, raíz) expone `window.SerumsChrome`
  (ver §3). Botones: **Inicio de la app**, **Volver al HUB**, **Pantalla completa**. Deben ser
  tres controles diferenciados, con icono, `aria-label`, `title`, foco visible y estado
  `aria-pressed` en pantalla completa. Nada de fullscreen simulado por CSS.
- **D4 — Sin recargas innecesarias.** Cambiar tarjeta del hub, personaje en QUEST, filtros,
  categoría o tarjeta en Study no debe recargar el documento. Sí se permite navegación normal
  al abrir otra aplicación. No usar `history.back()` como único regreso.
- **D5 — Contenido intocable.** No borrar ni regenerar fichas, flashcards, preguntas, plazas,
  personajes, IDs, fuentes ni claves. Solo presentación, navegación, estado y persistencia.
- **D6 — Compatibilidad de datos.** Cualquier cambio de almacenamiento debe leer lo existente,
  migrar sin pérdida y mantener claves. Prohibido `localStorage.clear()` o borrar IndexedDB.
- **D7 — Estética.** Hub: no rediseñar. Study Flashcards: simplificar contenedores sin perder
  contenido académico. QUEST/Banqueo/Plazas: conservar identidad y jerarquía.
- **D8 — Archivos nuevos** con cabecera `© 2026 ZARCONT` y sin dependencias externas nuevas.

## 2. Propiedad de archivos (estricta)

| Agente | Puede modificar | NO puede modificar |
|---|---|---|
| 1 Rutas | `AUDIT/ROUTES.md`, `tools/` nuevos de auditoría de rutas y, **solo tras aviso del coordinador**, el bloque de rutas de `index.html` | cualquier otro archivo |
| 2 Persistencia | `study-shared/store.js`, `serums-quest/js/store.js`, `EXAMEN STUDIO/js/store.js`, `serums map/serums-map-explorer/js/services.js`, `AUDIT/PERSISTENCIA.md` | app.js de features, HTML, CSS |
| 3 Hub | `index.html` completo **excepto** `CONFIG.apps`, `dashboardHref`, `flashcardsHref`, la línea de `href` de `setProgress`, y los atributos `href` de las 5 tarjetas | resto de apps |
| 4 QUEST | `serums-quest/js/app.js`, `characters.js`, `collection.js`, `scenes.js`, `character-art.js`, `reactions.js`, `styles-game.css`, `styles-rpg.css`, `serums-quest/tests/*` | `serums-quest/js/store.js`, `serums-quest/index.html`, datos |
| 5 Flashcards | `study-flashcards/app.js`, `study-flashcards/styles.css` | `study-flashcards/index.html`, `study-shared/*`, datos |
| 6 Dashboard/Banqueo/Plazas | `study-dashboard/app.js`, `study-dashboard/styles.css`, `EXAMEN STUDIO/js/app.js`, `EXAMEN STUDIO/js/parser.js`, `EXAMEN STUDIO/styles.css`, `serums map/serums-map-explorer/js/app.js`, `filters.js`, `panels.js`, `mapview.js`, `adjudicacion.js`, `styles.css` | `EXAMEN STUDIO/Examen Studio.html`, `serums map/.../index.html`, stores/servicios, `study-shared/*` |
| 7 Controles | `serums-chrome.js`, `serums-chrome.css`, `study-shared/ui.js`, `study-shared/icons.js`, `study-shared/base.css`, los 6 HTML de entrada (`index.html` del hub queda excluido), `AUDIT/CONTROLES.md` | JS de features, stores |
| 8 QA | `tests/e2e/**` nuevo, `AUDIT/QA.md` | código de producción (solo lectura; reporta fallos) |

Reglas de edición: **leer antes de editar; usar `edit` (nunca `write` sobre un archivo existente
de otro agente); no ejecutar `git checkout/reset/clean/stash`; no borrar archivos; no tocar
`INTEGRITY.sha256`, `AUTORIA.md`, `DESIGN-SYSTEM.md`, `study-data/`, `EXAMEN STUDIO/datos/`,
`EXAMEN STUDIO/documentos/`, `serums map/*.json`.**

## 3. Contrato de `serums-chrome.js` (Agente 7)

Script clásico, sin módulos, idempotente, sin dependencias. Se incluye con
`<script src="../serums-chrome.js"></script>` (o `../../` desde `serums map/serums-map-explorer/`)
**antes** del JS de la app.

```js
window.SerumsChrome = {
  mount(container, {
    hubHref,        // opcional; por defecto se calcula desde la URL de serums-chrome.js
    homeHref,       // opcional; si falta, no se pinta "Inicio"
    buttonClass,    // clase de botón existente de la app (obligatoria, para integrarse)
    fullscreen: true,
    order: ["home", "hub", "fullscreen"]
  }),
  hubHref(), homeButton(),  // helpers opcionales
  requestFullscreen(), exitFullscreen(), isFullscreen()
};
```
- Si `document.fullscreenEnabled` es falso, no se pinta el botón de pantalla completa.
- Sincroniza `aria-pressed`, `aria-label`, `title` con `fullscreenchange` y `fullscreenerror`.
- No secuestra `Esc`; el navegador gestiona la salida.
- Calcula `hubHref` con `new URL("index.html", scriptUrl)` para funcionar desde cualquier nivel.
- Los botones son `<button type="button">` (salvo HUB, que puede ser `<a href>`), sin formularios.

Integración por app:
- Study Dashboard/Flashcards: montar en `.s-appbar-actions`, `buttonClass: "s-iconbtn"`,
  `homeHref: "#/"` (el brand ya es inicio; el botón explícito evita ambigüedad).
- QUEST: `.q-appbar-actions`, `buttonClass: "q-iconbtn"`, `homeHref: "#/"`.
- Plazas: `#topbar`, `buttonClass: "btn sm icon"`, sin home (el mapa es la portada) o `#`.
- Banqueo: el topbar lo pinta `EXAMEN STUDIO/js/app.js`; el Agente 6 añade un contenedor
  `[data-chrome-mount]` y llama a `SerumsChrome.mount(...)` con `buttonClass: "btn icon"` (o la
  clase real del topbar). El Agente 7 deja el script cargado en `Examen Studio.html`.

## 4. Entorno de pruebas

- Servidor estático: `python -m http.server <puerto> --bind 127.0.0.1` desde la raíz.
  Puertos por agente: A1 8771, A2 8772, A3 8773, A4 8774, A5 8775, A6 8776, A7 8777, A8 8790.
- Chrome headless: `chrome.exe --headless=new --disable-gpu --no-first-run
  --user-data-dir=<temp>\perfil --remote-debugging-port=<9330+N> about:blank`.
- QA construye el arnés CDP en `tests/e2e/` con Node 24 (WebSocket global). Los demás pueden
  usar el arnés cuando exista, o capturas `--screenshot` y comprobaciones DOM con `--dump-dom`.
- Medir recargas: contar navegaciones (`Page.frameNavigated`), no solo mirar el DOM.
- Nunca borrar el perfil de usuario real: usar siempre `--user-data-dir` temporal y un origen
  HTTP de pruebas. Documentar la limitación de `file://`.

## 5. Entregables de cada especialista

1. `AUDIT/agent-N-<tema>.md` con: hallazgos, causa raíz + evidencia, archivos, riesgos,
   cambios aplicados, pruebas ejecutadas (comando + resultado) y pendientes.
2. Respuesta final breve (máx. 80 líneas): qué se arregló, con qué evidencia, qué queda abierto.
3. No declarar probado lo que no se ejecutó. No atribuir cambios a otros agentes.

## 6. Matriz de pruebas (Agente 8, resultados reales)

| Aplicación | Navegación | Persistencia | Recargas | Responsive | Pantalla completa |
|---|---|---|---|---|---|
| Hub | cartillas/apertura | selección si aplica | sin recarga al cambiar | 360/390/768/1024/1440 + landscape | sí |
| Study Dashboard | panel/áreas/fichas | progreso/contexto | interna sin recarga | principal/interna | sí |
| Study Flashcards | biblioteca/mazos/tarjeta | progreso/contexto | interna sin recarga | biblioteca/estudio | sí |
| Serum Quest | inicio/personajes | selección+progreso | cambio de personaje sin recarga | móvil/tablet | sí |
| Plaza SERUMS | mapa/filtros/ficha | favoritos/adjudicadas | filtros localizados | mapa/paneles | sí |
| Banqueo | profesiones/exámenes | preferencias/intento | navegación eficiente | principales | sí |
| Examen Studio (práctica) | selección/intento/resultado | intento según reglas | cambio de pregunta sin reinicio | examen | sí |
| Serums Map | mapa/detalles | preferencias | filtros eficientes | varios tamaños | sí |

## 7. Cierre

El coordinador: revisa diffs, resuelve conflictos, actualiza versiones/`AUTORIA.md`/
`DESIGN-SYSTEM.md`/`INTEGRITY.sha256` si procede, ejecuta la matriz final con QA y redacta
`INFORME-AUDITORIA-ECOSISTEMA.md`. Clasificación final honesta: correcto y verificado /
funcional con limitaciones / no validado.
