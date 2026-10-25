# Agente 1 — Auditoría de rutas, enlaces e integraciones

© 2026 ZARCONT · 2026-10-25 · Repositorio `C:\Users\USARIO\Documents\ZARCONT SERUMS`
Documento de cierre. El inventario detallado, el parche y las tablas anterior→actual están en
`AUDIT/ROUTES.md`. Aquí: hallazgos, causa raíz, archivos, cambios, pruebas y pendientes.

**Estado:** parche P1/P2 del hub **aplicado a las 17:16** (con autorización del coordinador y el
archivo liberado por el Agente 3) y **revalidado a las 17:22** tras otra edición del hub que no
reintrodujo query. Resultado final: `route_audit.py` exit 0 (0 faltantes) y arnés de navegación
**39/39 OK**, más una comprobación puntual de snapshot/rutas directas **6/6 OK**.

## 1. Alcance realizado

- Inventario de las **6 entradas reales** y de **16 documentos HTML** (hub, 5 apps y 10 páginas de
  prueba de QUEST), con `href`/`src`, query, hash y rutas relativas/absolutas.
- Auditoría automática de existencia de destinos (`AUDIT/route_audit.py`) con distinción de
  mayúsculas, decodificación de URI y omisión de query/fragmento.
- Inventario de **rutas internas legítimas** por aplicación (lectura de las tablas de rutas de
  cada `app.js`) y de los deep links con query que se conservan.
- Navegación real en Chrome headless (39 pruebas) con perfil temporal y servidor local.
- Búsqueda de páginas/nombres antiguos y de `history.back()` como mecanismo de regreso.

## 2. Hallazgos

1. **H-1 (D1, RESUELTO por este agente).** Las tarjetas Study del hub recibían en tiempo de
   ejecución un `href` con `?sheet=<id>` / `?deck=<id>&resume=1`
   (`index.html::dashboardHref/flashcardsHref`) mediante `applySnapshot()`. Con snapshot de Study,
   el clic entraba en una ficha o en una sesión en lugar de la portada. **Los cinco `href`
   estáticos ya eran correctos**: el parche se limitó a esas dos funciones más el comentario de
   `CONFIG`. Aplicado a las 17:16; verificado con **H5.2/H5.3** y con la sonda de snapshot
   (`agent1-snapshot-check.json`, S1-S6).
2. **H-2 (resuelto por Agente 6).** `?sheet=<id>` con id inexistente llevaba a `#/ficha/<id>` y a
   «Esta ficha no está disponible». Corregido en `study-dashboard/app.js::initQuery()`
   (líneas 1244-1254): limpia la query y entra en `#/` con aviso. Verificado: **H2.12 PASS**.
3. **H-3 (resuelto por Agente 5).** `?deck=<id>` inexistente llevaba a `#/mazo/<id>` y dejaba
   «Mazo no encontrado» como pantalla de entrada. Corregido en
   `study-flashcards/app.js::bootApp()` (líneas 1538-1540). Verificado: **H3.8 PASS**.
4. **H-4 (resuelto por Agente 6).** Banqueo no tenía ningún camino de regreso al HUB: su topbar y
   su pie se generan en `EXAMEN STUDIO/js/app.js::renderShell()` y no incluían HUB. Añadió
   `[data-chrome-mount]` y `SerumsChrome.mount()` (líneas 480 y 492-499). Verificado: **H4.2 PASS**.
5. **H-5.** No existe `EXAMEN STUDIO/index.html` (la tabla §2 de `AUDIT/COORDINATION.md` la cita
   como archivo del Agente 6). Ningún enlace la usa: es una **inconsistencia documental**, no un
   enlace roto. No se creó el archivo.
6. **H-6.** Plazas no expone rutas ni deep links: su ficha de plaza es un panel en memoria
   (`data-nav` con botones, sin `location.hash` ni `?plaza=`). No se inventan rutas; queda como
   limitación funcional conocida.
7. **H-7.** No hay referencias a nombres antiguos (`study-board`, `dashboard.html`,
   `flashcards.html`, `plaza*.html`, `serums-map.html`, `old/`, `/v1/`): **0 coincidencias**.
   No hay entradas duplicadas ni `href` repetidos en el hub (5 destinos únicos).
8. **H-8.** Ningún `history.back()` ni `history.go(-1)` en HTML/JS/CSS de producción (0 usos); los
   regresos usan enlaces o controles explícitos. Los cambios de vista internos no recargan el
   documento (0 `Page.frameNavigated` en las pruebas H2.5, H2.7, H3.3, H3.6, H4.6).

## 3. Causa raíz (una sola, con tres síntomas)

El hub conservaba `CONFIG.apps` (portadas limpias) **y además** un mecanismo de reanudación que
reescribía el `href` de las tarjetas con el último punto del snapshot (`studyhub:snapshot:v1`). Ese
mecanismo producía los tres síntomas: entrar en ficha/sesión (H-1), entrar en una ficha/mazo
inexistente si el snapshot estaba desfasado (H-2/H-3) y depender de una ruta con query como acceso
principal. La decisión D1 separa las dos responsabilidades: **hub = portada**; **reanudación =
dentro de la app o ruta directa explícita**. El parche aplicado elimina la inyección y conserva
intactas las rutas directas y los controles de reanudación internos.

## 4. Rutas individuales preservadas (no se eliminan)

| Ruta | Verificación |
|---|---|
| Dashboard `#/ficha/<sheetId>` (real: `#/ficha/sheet-psi-sp-1-1`) | H2.4 |
| Dashboard `?sheet=<id>` directa (limpia query) | H2.11 |
| Dashboard `#/biblioteca/<area>/<categoría>` | H2.4 |
| Flashcards `#/mazo/<deckId>` (real: `#/mazo/sheet-aps-01`) | H3.2 |
| Flashcards `?deck=<id>&resume=1` (limpia query) | H3.7 |
| Flashcards `#/sesion`, `#/resumen`, `#/historial` | tabla de rutas, `study-flashcards/app.js` |
| QUEST `#/personajes`, `#/mapa`, `#/mision/<id>`, `#/inventario/<id>`, `#/resultado/<id>`… | H4.6 |
| Banqueo `#hub/<prof>`, `#bank/<prof>/<exam>`, `#review/<exam>`, `#practice/result/<attempt>` | tabla de rutas, `EXAMEN STUDIO/js/app.js` |
| «Volver a la biblioteca» (`#/`) ≠ «Volver al HUB» (`/index.html`) | H3.4, H3.5 |

## 5. Archivos creados y modificación autorizada

| Archivo | Contenido |
|---|---|
| `AUDIT/route_audit.py` | Auditor de `href`/`src` locales; exit 0 solo sin destinos faltantes. Stdlib, Python 3.13 |
| `tools/route_nav_audit.mjs` | Arnés CDP de navegación real (Node 24, WebSocket global, sin dependencias, perfil temporal) |
| `AUDIT/ROUTES.md` | Inventario, tablas anterior→actual, parche del hub, traspasos y pruebas |
| `AUDIT/agent-1-rutas.md` | Este informe |
| `AUDIT/evidencias/agent1-route-audit.json` / `.log` | Salida completa del auditor (regenerada tras el parche) |
| `AUDIT/evidencias/agent1-route-audit-selftest.txt` | Autoprueba con HTML roto (exit 1) |
| `AUDIT/evidencias/agent1-nav-tests.json` / `.log` | Arnés antes del parche: 37/39 (H5.2, H5.3 fallan) |
| `AUDIT/evidencias/agent1-nav-tests-postparche.json` / `.log` | Arnés después del parche: **39/39** |
| `AUDIT/evidencias/agent1-snapshot-check.json` / `.log` | Sonda de snapshot y rutas directas: **6/6** |

**Única modificación a un archivo de producción:** `index.html`, autorizada por el coordinador a las
17:16 con el archivo liberado por el Agente 3. Solo se cambiaron `dashboardHref`,
`flashcardsHref` y el comentario de `CONFIG`; no se tocaron `CONFIG.apps`, los cinco `href`,
`applySnapshot()` ni la línea de `href` de `setProgress()`. No se editaron `INTEGRITY.sha256`,
`AUTORIA.md`, `DESIGN-SYSTEM.md`, datos ni archivos de otros agentes.

## 6. Pruebas ejecutadas (comando → resultado real)

```powershell
C:\Python313\python.exe AUDIT\route_audit.py --legacy --json AUDIT\evidencias\agent1-route-audit.json
# → EXIT 0 · 16 HTML · 168 enlaces locales · faltantes=0 · capitalización=0 · fuera=0 · obsoletos=0

C:\Python313\python.exe AUDIT\route_audit.py     # con AUDIT/evidencias/_selftest_broken.html
# → EXIT 1 · DESTINOS FALTANTES (1) · CAPITALIZACIÓN DISTINTA (1)   [autoprueba; archivo eliminado]

C:\Python313\python.exe -m http.server 8771 --bind 127.0.0.1
node tools\route_nav_audit.mjs --json AUDIT\evidencias\agent1-nav-tests.json
# ANTES del parche → EXIT 1 · 37/39 OK · fallan H5.2 y H5.3

node tools\route_nav_audit.mjs --json AUDIT\evidencias\agent1-nav-tests-postparche.json
# DESPUÉS del parche → EXIT 0 · 39/39 OK · H5.2 y H5.3 PASS

node %TEMP%\a1-snapcheck.mjs     # sonda temporal; evidencia en el repositorio
# → EXIT 0 · 6/6 OK: tarjetas sin query con snapshot válido y obsoleto, «Último punto» visible,
#   ?sheet=<real> → #/ficha/sheet-psi-sp-1-1, ?deck=<real>&resume=1 → #/mazo/sheet-aps-01
```

Detalle de las 39: hub (5), Dashboard (12), Flashcards (8), Banqueo/Plazas/QUEST (9), URL directa
y snapshots (4), estático (1). Ver `agent1-nav-tests-postparche.log` y los JSON de evidencia.

## 7. Riesgos y límites

- **Números de línea volátiles**: `index.html` cambió durante la auditoría (2.102 → ~2.180 líneas).
  El parche se aplicó **por texto**; si alguien vuelve a editar el hub, debe conservar la regla D1.
- **Selectores del arnés**: usa `.dot[data-index]`, `.app-card`, `.s-navlink[data-route]`,
  `.sheet-row`, `.category-card`, `.flash-back` y `[data-serums-chrome]`. Si el Agente 3 o el 7 los
  renombran, hay que ajustar el arnés antes de leer un fallo como defecto del producto.
- **Origen HTTP obligatorio**: `file://` aísla IndexedDB/localStorage y rompe la reanudación; todas
  las pruebas se hicieron sobre `http://127.0.0.1:8771`.
- **Rutas hash no validadas por `route_audit.py`** (solo archivos): las cubre el arnés; si se añade
  una ruta nueva sin enlace, el auditor no la ve.
- **Red externa desactivada** en las pruebas (fuentes/CDN fallan rápido). No se probó la carga real
  de Google Fonts, PDF.js, SheetJS ni Google Maps; no afecta a la navegación entre páginas.
- **Plazas** no tiene deep link de ficha: si se necesita, es una función nueva.
- **Sonda de snapshot**: el script quedó en `%TEMP%` (no se distribuye); la evidencia JSON sí está
  en el repositorio y el arnés committed reproduce los mismos casos (H5.2/H5.3).

## 8. Pendientes

1. Reejecutar `route_audit.py --legacy` al cierre del equipo (los demás agentes pueden añadir
   enlaces HTML); hoy: 16 HTML, 168 enlaces, 0 faltantes.
2. Corregir en `AUDIT/COORDINATION.md` §2 la mención a `EXAMEN STUDIO/index.html` (no existe).
3. Si el hub quiere ofrecer «Continuar» explícito, debe ser un control aparte (no el `href` de la
   tarjeta), según D1; hoy la reanudación vive dentro de cada app.
4. Cualquier edición futura del hub debe mantener D1: tarjeta = portada sin query; la reanudación
   se conserva en `?sheet=` / `?deck=&resume=1` y dentro de las apps.
