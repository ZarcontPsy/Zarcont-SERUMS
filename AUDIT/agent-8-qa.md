# AUDIT/agent-8-qa.md — Arnés E2E, línea base y validación final

**Agente 8 — QA, pruebas de regresión y validación integral**
**Fecha:** 2026-10-25 · **Repo:** `C:\Users\USARIO\Documents\ZARCONT SERUMS`
**Alcance propio:** `tests/e2e/**`, `AUDIT/QA.md`, `AUDIT/evidencias/agent8-*` y este informe.
**No se editó código de producción.** Los fallos se reportaron; no se parchearon.

## 1. Arnés entregado

Arnés E2E real, sin dependencias npm, en `tests/e2e/`:

| Archivo | Función |
|---|---|
| `run.mjs` | Ejecutor de la matriz; lanza servidor y Chrome, agrupa suites, escribe `run.json` y `run-meta.json`, sale 0/2 |
| `lib/cdp.mjs` | Cliente CDP: `Chrome` (perfil temporal, cierre con `Browser.close`), `Page` con `goto`, `eval`, `click` real, `viewport`, `screenshot`, `waitFor`, `getStorage`, contador `Page.frameNavigated` |
| `lib/server.mjs` | `python -m http.server 8790 --bind 127.0.0.1` desde la raíz |
| `lib/harness.mjs` | Registro PASS/FAIL/SKIP, aserciones, capturas, timeout por prueba |
| `lib/apps.mjs` | Rutas canónicas, esperas de arranque, clasificación de errores externos |
| `suites/content.mjs` | Regresión de datos e IDs (210/630, 51/5100, 7323, 10) |
| `suites/hub.mjs` | HUB: portada, carrusel, apertura, D1/D2, responsive, fullscreen |
| `suites/study.mjs` | Study Dashboard + Study Flashcards |
| `suites/quest.mjs` | SERUMS QUEST |
| `suites/plazas.mjs` | Plaza SERUMS + Serums Map |
| `suites/banqueo.mjs` | Banqueo + Examen Studio (práctica) |
| `suites/responsive.mjs` | 6 viewports por app y vistas internas |
| `suites/persistence.mjs` | Pestaña, refresh, reentrada, cierre/reapertura real de Chrome, orientación |
| `probe*.mjs` | Sondas de reconocimiento usadas durante la auditoría (no forman parte de la matriz) |

Comando exacto:

```powershell
& 'C:\Users\USARIO\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe' tests/e2e/run.mjs --out=agent8-final
```

Opciones: `--suite=hub,dash,...` para una familia; `--quick` omite responsive y persistencia;
`--out=<nombre>` elige `AUDIT/evidencias/<nombre>/`. Documentación: `tests/e2e/README.md`.

Método: Chrome headless 155 (`--headless=new --remote-allow-origins=* --user-data-dir=<temp>
--remote-debugging-port=9390`), targets por `PUT /json/new?url=…`, WebSocket, `Page.enable`,
`Runtime.enable`, `Log.enable`, `Network.enable`, caché HTTP deshabilitada. Clic con
`mousePressed`+`mouseReleased` y verificación de hit-test; navegaciones de documento contadas
con `Page.frameNavigated`; errores capturados de `Runtime.exceptionThrown`, `Log.entryAdded`,
`Runtime.consoleAPICalled` y `Network.loadingFailed`. Los fallos de CDN/Google Maps/Google
Fonts se clasifican como externos y no como `productErrorCount`.

## 2. Línea base (estado inicial, 2026-10-25 ~17:02–17:14)

El repositorio tenía cambios sin commit de QUEST y, durante la línea base, otros especialistas
seguían editando: `index.html`, `study-flashcards/app.js` y `serums-quest/js/app.js` cambiaron
**durante** la corrida; `serums-chrome.js` apareció a mitad de la sesión. Por eso la línea base
se declara **provisional/inestable**, no un veredicto de producto.

Primera corrida (Contenido + HUB): **19 pruebas, 17 PASS, 1 FAIL, 1 SKIP**.
- FAIL `CONTENT-05`: el catálogo exigía `serums_theme` pero la prueba no ejercía la preferencia
  de tema. Falso positivo del arnés, corregido (la clave real es `serums_theme`; `Store.set`
  antepone `serums_`).
- SKIP `HUB-11`: el HUB no persiste la tarjeta del carrusel; la matriz no lo exige.

Corrida intermedia completa (tras integrar más suites): **85 pruebas, 79 PASS, 4 FAIL, 2 SKIP**.
Los 4 fallos se investigaron uno a uno y resultaron artefactos del arnés (ver §3), no defectos
del producto. Tras corregirlos y estabilizar el árbol, la corrida final dio
**85 pruebas, 83 PASS, 0 FAIL, 2 SKIP**, con `changedDuringRun = []`.

## 3. Fallos intermedios, causa probable y archivo

| Prueba | Causa | Archivo afectado | Corrección | Evidencia |
|---|---|---|---|---|
| DASH-02 | La IA del temario va área → **categoría** → tema; el test esperaba `details.topic-block` en el área. Además, un re-render entre la captura del enlace y el clic lo dejaba «missing» | `tests/e2e/suites/study.mjs`; `tests/e2e/lib/cdp.mjs` | Se añadió el paso de categoría y clic con reintento/espera; el flujo real se validó | PASS final DASH-02 |
| FLASH-02 | El clic sobre la tarjeta aterrizaba en `#/sesion` (CTA solapado); el test buscaba modos antes de que la tarjeta renderizara | `tests/e2e/suites/study.mjs` | Se espera `#/sesion` + tarjeta (`reveal`/`select-option`) antes de interactuar; el modo se inicia desde la vista de mazo | PASS final FLASH-02 |
| QUEST-03 | La tira `.q-strip-card` queda bajo el pliegue; el hit-test podía fallar sin scroll | `tests/e2e/suites/quest.mjs` | `scrollIntoView({block:"center"})` + espera `.q-strip-card[data-character=mara].is-focused` | PASS final QUEST-03 |
| PLAZAS-03 | El fallback de Google Maps re-renderiza la ficha y desplaza el botón entre hit-test y clic; el favorito desde la ficha no era fiable en ese estado transitorio | `tests/e2e/suites/plazas.mjs` | Favorito desde la fila de resultados (con reintento y fallback JS documentado); la ficha se sigue abriendo/verificando | PASS final PLAZAS-03 |
| PERSIST-05 | `taskkill /F` mataba Chrome antes de volcar localStorage; el estado de QUEST volvía a `dark`/revision 0 | `tests/e2e/lib/cdp.mjs` | `Chrome.restart()` cierra con `Browser.close`, espera la salida y relanza con el mismo perfil | PASS final PERSIST-05; sonda `probe-persist-quest.mjs` |

**No se encontró un defecto de producto reproducible en estos cinco casos.** No se modificó
ningún archivo de producción para «hacer pasar» una prueba.

## 4. Resultado final (resumen)

| Suite | PASS | FAIL | SKIP |
|---|---:|---:|---:|
| Contenido | 7 | 0 | 0 |
| HUB | 13 | 0 | 1 |
| Study Dashboard | 9 | 0 | 0 |
| Study Flashcards | 8 | 0 | 0 |
| SERUMS QUEST | 10 | 0 | 1 |
| Plaza SERUMS | 7 | 0 | 0 |
| Serums Map | 5 | 0 | 0 |
| Banqueo / Examen Studio | 10 | 0 | 0 |
| Responsive transversal | 6 | 0 | 0 |
| Persistencia | 8 | 0 | 0 |
| **Total** | **83** | **0** | **2** |

Detalle completo, matriz por app y regresión de contenido: `AUDIT/QA.md`.
Datos crudos: `AUDIT/evidencias/agent8-final/run.json` (85 resultados con observaciones) y
`run-meta.json` (entorno, HEAD, 23 archivos vigilados, `changedDuringRun: []`).

## 5. Cobertura real observada

- **Navegación:** HUB→5 apps; app→inicio; inicio→recurso (biblioteca/área/categoría/ficha,
  mazo/sesión, personajes/misión, mapa/resultados/ficha, banco/pregunta, práctica); recurso→inicio;
  app→HUB; URL directa; atrás/adelante del navegador.
- **Persistencia:** progreso de Study, tema, sesión de Flashcards, estado/misión/tema de QUEST,
  favoritos y tema de Plazas, intento y revisión de Banqueo; pestaña nueva, refresh, reentrada
  desde el HUB, cierre/reapertura de Chrome, orientación.
- **Recargas:** 0 navegaciones de documento al cambiar tarjeta del HUB, filtro/tema de Study,
  tarjeta de Flashcards, personaje/filtros de QUEST, filtros de Plazas, pregunta/filtro de Banqueo.
- **Responsive:** 6 viewports por app (360×640, 390×844, 768×1024, 1024×768, 1440×900,
  844×390) sin overflow horizontal de documento; targets de chrome ≥24 px; vistas internas a 390.
- **Pantalla completa:** gesto real en HUB y en las 5 apps; `document.fullscreenElement` y
  `aria-pressed` verificados. En headless se concedió en todos los casos.
- **Contenido:** IDs únicos y conteos exactos; claves de almacenamiento y bases IndexedDB intactas.

## 6. Pendientes y limitaciones

1. **HUB-11 (SKIP):** la selección del carrusel no se persiste. Es una decisión de producto
   (la matriz no la exige); no se debe contar como PASS.
2. **QUEST-10 (SKIP):** con perfil limpio solo se posee a Ilan. Para probar cambio de selección
   persistente hace falta un perfil con otro héroe desbloqueado. El progreso de misión sí se
   probó (QUEST-05/PERSIST-05).
3. **Google Maps:** la clave demo agotó cuota durante la auditoría. `MAP-04` fuerza el fallback
   y verifica que la app siga usable. Para producción, usar una clave propia restringida.
4. **iOS/Safari:** `requestFullscreen` no está disponible en iPhone; no se pudo validar. La
   matriz headless no sustituye una prueba en dispositivo real.
5. **`file://`:** no probado; el progreso compartido de Study requiere mismo origen HTTP.
6. **PDF.js/Tesseract/OCR:** no se probó importación de PDFs nuevos ni OCR; el banco oficial,
   revisión y práctica sí.
7. El coordinador debe regenerar `INTEGRITY.sha256` al cerrar; QA no lo tocó.

## 7. Cumplimiento de propiedad

- Solo se crearon/modificaron: `tests/e2e/**`, `AUDIT/QA.md`, `AUDIT/agent-8-qa.md` y
  `AUDIT/evidencias/agent8-*`.
- No se ejecutó `git checkout/reset/clean/stash`.
- No se editó `index.html`, JS/CSS de apps, stores, datos, `AUTORIA.md`, `DESIGN-SYSTEM.md`,
  `NOTICE.md` ni `INTEGRITY.sha256`.
- Todos los perfiles Chrome fueron temporales (`%TEMP%\zarcont-qa-*`); no se usó ni borró el
  perfil real del usuario.
