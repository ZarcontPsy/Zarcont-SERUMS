# Arnés E2E — Agente 8 (QA)

Arnés real basado en Chrome DevTools Protocol, sin dependencias npm. Lanza el servidor
estático y Chrome headless con un perfil temporal, abre targets por `PUT /json/new`,
conecta por WebSocket y ejecuta la matriz de `AUDIT/COORDINATION.md` §6.

## Requisitos

| Componente | Ruta / versión |
|---|---|
| Node.js | `C:\Users\USARIO\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe` (v24, `WebSocket` global) |
| Python | `C:\Python313\python.exe` (servidor `http.server`) |
| Chrome | `C:\Program Files\Google\Chrome\Application\chrome.exe` |

No se instala nada. El perfil de Chrome es **temporal** (`%TEMP%\zarcont-qa-*`);
no se toca el perfil real del usuario. El servidor escucha en `127.0.0.1:8790` y
Chrome en `127.0.0.1:9390`.

## Ejecutar

```powershell
# Matriz completa (incluye persistencia con reinicio de Chrome y responsive)
& 'C:\Users\USARIO\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe' tests/e2e/run.mjs --out=agent8-final

# Solo algunas familias
... tests/e2e/run.mjs --suite=hub,dash,flash,quest,plaza,banq
... tests/e2e/run.mjs --suite=persist
... tests/e2e/run.mjs --quick        # sin responsive ni persistencia
```

Salida:

- `AUDIT/evidencias/<out>/run.json` — resultados completos (observaciones medidas, entorno, repo).
- `AUDIT/evidencias/<out>/run-meta.json` — entorno y estado del repo durante la corrida.
- `AUDIT/evidencias/<out>/img/*.png` — capturas de viewports, fallos y evidencias.

`--out` por defecto es `agent8-baseline`; la corrida final usa `--out=agent8-final`.

Código de salida: `0` si no hubo FAIL, `2` si hubo FAIL, `1` si el ejecutor falló.

## Qué mide

- Navegación real con `Input.dispatchMouseEvent` (mousePressed + mouseReleased),
  no `element.click()` sintético. `click()` hace scroll, espera visibilidad y usa el centro.
- Navegaciones de documento con `Page.frameNavigated` (frame principal). Un cambio de
  hash no cuenta como recarga; una recarga sí.
- Errores: `Runtime.exceptionThrown`, `Log.entryAdded`, `Runtime.consoleAPICalled`
  (error/assert) y `Network.loadingFailed`. Los fallos de CDN/Google Fonts/Google Maps
  se clasifican aparte; el favicon 404 se ignora.
- Persistencia: `localStorage`, `sessionStorage` e `indexedDB.databases()`; la prueba de
  cerrar/reabrir usa `--user-data-dir` persistente, cierra con `Browser.close` (para que Chrome
  vuelque a disco, como al cerrar la ventana) y relanza el proceso.
- Responsive: `Emulation.setDeviceMetricsOverride` en 360×640, 390×844, 768×1024,
  1024×768, 1440×900 y 844×390 landscape; mide overflow del documento y targets.
- Pantalla completa: clic real sobre el control y verificación de
  `document.fullscreenElement` + `aria-pressed`; documenta la limitación de headless
  y de iOS (Safari en iPhone no implementa `requestFullscreen` en elementos).

## Estructura

```
tests/e2e/
  run.mjs                 ejecutor de la matriz
  lib/cdp.mjs             cliente CDP, Chrome, Page (goto/eval/click/viewport/screenshot/...)
  lib/server.mjs          python -m http.server 8790
  lib/harness.mjs         registro PASS/FAIL/SKIP, evidencias, aserciones
  lib/apps.mjs            rutas, esperas de arranque, filtro de errores
  suites/content.mjs      regresión de datos (210/630, 51/5100, 7323, 10)
  suites/hub.mjs          HUB
  suites/study.mjs        Study Dashboard + Study Flashcards
  suites/quest.mjs        SERUMS QUEST
  suites/plazas.mjs       Plaza SERUMS + Serums Map
  suites/banqueo.mjs      Banqueo + Examen Studio (práctica)
  suites/responsive.mjs   viewports y targets
  suites/persistence.mjs  pestaña, refresh, reentrada, cerrar/reabrir, orientación
  probe*.mjs              sondas de reconocimiento (no forman parte de la matriz)
```

## Límites conocidos

- `file://` no se prueba: el producto declara que el progreso compartido requiere el
  mismo origen HTTP. El arnés usa `http://127.0.0.1:8790`.
- Google Maps depende de red y de la clave demo del proyecto. La prueba `MAP-04`
  bloquea `maps.googleapis.com` para forzar el fallback y verificar que la app sigue usable.
- PDF.js/Tesseract se cargan por CDN; no se prueba OCR ni importación de PDFs nuevos
  porque requieren archivos y tiempo fuera del alcance de la matriz base.
- Headless puede denegar `requestFullscreen`; en ese caso la prueba registra la
  limitación y no inventa un PASS.
