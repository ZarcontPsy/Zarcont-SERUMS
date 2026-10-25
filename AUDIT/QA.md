# AUDIT/QA.md — Matriz E2E real y resultados finales

**Proyecto:** ZARCONT SERUMS · **Agente:** 8 (QA, regresión y validación integral)
**Fecha de la corrida final:** 2026-10-25 17:50–17:55 (America/Lima)
**Repositorio:** `C:\Users\USARIO\Documents\ZARCONT SERUMS` · HEAD `2a808b7` (`V1.0`)
**Estado del árbol:** modificado sin commit (integración de los 8 especialistas). El run final
vigiló 23 archivos de producción: `changedDuringRun = []`, por lo que la matriz es estable.

## 1. Veredicto

| Métrica | Resultado |
|---|---|
| Pruebas ejecutadas | **85** |
| PASS | **83** |
| FAIL | **0** |
| SKIP | **2** (limitaciones documentadas, no fallos) |
| Apps cubiertas | Hub, Study Dashboard, Study Flashcards, SERUMS QUEST, Plaza SERUMS, Serums Map, Banqueo y Examen Studio (práctica) |
| Viewports | 360×640, 390×844, 768×1024, 1024×768, 1440×900 y 844×390 landscape |
| Regresión de contenido | Sin pérdida: 210 fichas / 630 tarjetas / 51 exámenes / 5.100 preguntas / 7.323 plazas / 10 personajes |

**Resultado honesto:** el ecosistema queda **correcto y verificado** en la matriz ejecutada, con dos
limitaciones declaradas (HUB-11 y QUEST-10) y las limitaciones de entorno de §8. No se declara PASS
ninguna prueba que no se haya observado; las cifras salen de `run.json`.

## 2. Entorno y método

- Node.js **v24.21.0** (`C:\Users\USARIO\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe`).
- Chrome **155.0.8059.85** headless (`--headless=new`) en `127.0.0.1:9390`, perfil temporal.
- Python **3.13.3** sirviendo el repo en `http://127.0.0.1:8790` (`python -m http.server`).
- Cliente CDP propio, sin dependencias: `PUT /json/new?url=…`, WebSocket, `Page`, `Runtime`,
  `Log`, `Network`. Clic real con `Input.dispatchMouseEvent`; navegaciones de documento
  contadas con `Page.frameNavigated`; caché HTTP deshabilitada en cada página.
- Cada prueba registra PASS/FAIL/SKIP, duración, valor medido y captura en fallo.
- Evidencia: `AUDIT/evidencias/agent8-final/run.json`, `run-meta.json` y 29 capturas en `img/`.

## 3. Resultado por aplicación

| App / suite | PASS | FAIL | SKIP | Evidencia directa |
|---|---:|---:|---:|---|
| Contenido (regresión de datos) | 7 | 0 | 0 | CONTENT-01…07 |
| HUB | 13 | 0 | 1 | HUB-01…14; SKIP HUB-11 |
| Study Dashboard | 9 | 0 | 0 | DASH-01…09 |
| Study Flashcards | 8 | 0 | 0 | FLASH-01…08 |
| SERUMS QUEST | 10 | 0 | 1 | QUEST-01…11; SKIP QUEST-10 |
| Plaza SERUMS | 7 | 0 | 0 | PLAZAS-01…07 |
| Serums Map | 5 | 0 | 0 | MAP-01…05 |
| Banqueo · Examen Studio | 10 | 0 | 0 | BANQ-01…10 |
| Responsive transversal | 6 | 0 | 0 | RESP-* |
| Persistencia | 8 | 0 | 0 | PERSIST-01…08 |
| **Total** | **83** | **0** | **2** | |

## 4. Matriz obligatoria (COORDINATION §6)

| Aplicación | Navegación | Persistencia | Recargas | Responsive | Pantalla completa |
|---|---|---|---|---|---|
| HUB | PASS cartillas y apertura (HUB-03…07); app→HUB (HUB-12); D1/D2 (HUB-13/14) | SKIP selección de tarjeta (HUB-11; no exigida) | PASS cambio de tarjeta sin recarga (HUB-02) | PASS 6 viewports (HUB-10) | PASS con gesto real (HUB-09) |
| Study Dashboard | PASS portada→biblioteca→área/categoría→tema→ficha; ficha→inicio; URL directa; atrás/adelante (DASH-02…05) | PASS ficha completada + refresh (DASH-06); tema (DASH-07); pestaña/reentrada/cierre (PERSIST-01/02) | PASS filtro y tema sin recarga (DASH-08) | PASS 6 viewports + interna 390 (RESP-DASHBOARD, RESP-INTERNAS) | PASS (DASH-09) |
| Study Flashcards | PASS biblioteca→mazo→sesión; inicio; HUB; URL directa; atrás/adelante (FLASH-02…05) | PASS sesión y tarjeta revisada tras refresh y reinicio (FLASH-06, PERSIST-04); reanudación `?deck=&resume=1` (FLASH-07) | PASS sin recarga al revelar/calificar (FLASH-02) | PASS 6 viewports + interna (RESP-FLASHCARDS, RESP-INTERNAS) | PASS (FLASH-08) |
| SERUMS QUEST | PASS 5 secciones, inicio→misión→sesión, HUB, URL directa, atrás/adelante (QUEST-02…08) | PASS tema/misión/estado tras reinicio (QUEST-09, PERSIST-05); selección alternativa SKIP (QUEST-10) | PASS foco de personaje y filtros sin recarga (QUEST-03) | PASS 6 viewports + interna (RESP-QUEST) | PASS (QUEST-11) |
| Plaza SERUMS | PASS mapa/filtros/resultados, ficha modal y favorito (PLAZAS-01…06); rail interno (PLAZAS-05) | PASS favorito y preferencias tras refresh/reinicio (PLAZAS-04, PERSIST-06) | PASS búsqueda, limpiar y filtro rápido sin recarga (PLAZAS-02, MAP-05) | PASS 6 viewports + interna (RESP-PLAZAS, RESP-INTERNAS) | PASS (PLAZAS-07) |
| Banqueo | PASS hub→banco→pregunta, inicio, HUB, URL directa, atrás/adelante (BANQ-02…05) | PASS intento en Progreso (BANQ-07), revisión `banqueo-review-v1` (BANQ-08), IndexedDB tras reinicio (PERSIST-07) | PASS cambio de pregunta/filtro/búsqueda sin recarga (BANQ-02, BANQ-09) | PASS 6 viewports + interna (RESP-BANQUEO, RESP-INTERNAS) | PASS (BANQ-10) |
| Examen Studio (práctica) | PASS configuración→sesión→respuesta→resultado (BANQ-06) | PASS intento persistido (BANQ-07, PERSIST-07) | PASS navegación de preguntas sin reinicio (BANQ-06) | PASS vista de banco/practice (RESP-BANQUEO) | PASS (BANQ-10) |
| Serums Map | PASS mapa/detalles/rail (MAP-01/02/05) | PASS tema (MAP-03) y favoritos (PLAZAS-04/PERSIST-06) | PASS filtros localizados (MAP-05) | PASS (RESP-PLAZAS) | PASS (PLAZAS-07) |

## 5. Regresión de contenido (CONTENT-01…07)

| Dato | Esperado | Medido | Resultado |
|---|---:|---:|---|
| Áreas oficiales de Study | 5 | 5 | PASS |
| Categorías | 20 | 20 | PASS |
| Módulos/temas | 86 | 86 | PASS |
| Fichas | 210 | 210 (IDs únicos) | PASS |
| Tarjetas | 630 | 630 (IDs únicos, 3 por ficha) | PASS |
| Exámenes | 51 | 51 | PASS |
| Preguntas | 5.100 | 5.100 | PASS |
| Claves válidas | 5.100 | 5.100 | PASS |
| Profesiones | 17 | 17 | PASS |
| Plazas | 7.323 | 7.323 | PASS |
| Adjudicaciones | 7.297 | 7.297 | PASS |
| Personajes QUEST | 10 | 10 | PASS |
| Cosméticos / ranuras | 33 / 9 | 33 / 9 | PASS |
| Preguntas mapeadas QUEST | 300 | 300 | PASS |

No se borró ni renombró ninguna clave: `study-state-v1`, `studyhub:snapshot:v1`, `study-theme`,
`serumsquest:state:v1`, `serumsquest:snapshot:v1`, `serumsquest:theme`, `serums_theme`,
`serums_favoritos`, `banqueo-review-v1`, `banqueo-profession-v1` (CONTENT-05, PERSIST-08).
Bases IndexedDB `study-serums` y `examenstudio` presentes (CONTENT-06).

## 6. Fallos finales

**No hay fallos de producto en la corrida final (0 FAIL).** Los cuatro fallos de la primera
corrida completa (`agent8-final`, 79/4/2; luego 82/1/2) fueron artefactos del arnés, no del
producto, y quedaron corregidos. La evidencia cruda de la línea base fue reemplazada por
reejecuciones parciales durante la estabilización; los recuentos citados son los medidos y
registrados en esta sesión.

| Prueba | Causa probable | Archivo corregido | Verificación |
|---|---|---|---|
| DASH-02 | El test iba de área a `details.topic-block` sin pasar por categoría; además había re-render entre captura y clic | `tests/e2e/suites/study.mjs`, `tests/e2e/lib/cdp.mjs` | PASS en corrida final; flujo área→categoría→tema→ficha |
| FLASH-02 | El clic sobre la tarjeta aterrizaba en `#/sesion` por solapamiento con CTA; el test buscaba modos antes de que renderizara la tarjeta | `tests/e2e/suites/study.mjs` | PASS; espera `#/sesion` + tarjeta antes de interactuar |
| QUEST-03 | La tira de personajes está bajo el pliegue; sin scroll el hit-test podía fallar | `tests/e2e/suites/quest.mjs` | PASS; `scrollIntoView` + espera `.is-focused` |
| PLAZAS-03 | El fallback de Google Maps re-renderiza la ficha y desplaza el botón entre el hit-test y el clic | `tests/e2e/suites/plazas.mjs` | PASS; favorito desde la fila de resultados, con reintento |
| PERSIST-05 | `taskkill /F` mataba Chrome antes de volcar localStorage | `tests/e2e/lib/cdp.mjs` | PASS; cierre con `Browser.close` y relanzamiento |

## 7. SKIP declarados (no cuentan como PASS)

| ID | Motivo | Decisión |
|---|---|---|
| HUB-11 | El HUB no persiste la tarjeta del carrusel entre recargas. La matriz dice «selección si aplica»; el producto no lo exige. | SKIP documentado, no fallo |
| QUEST-10 | Con perfil limpio solo se posee a Ilan (0 monedas); no hay héroe alternativo para probar el cambio de selección persistente. El progreso de misión y el tema sí se probaron (QUEST-05, PERSIST-05). | SKIP documentado |

## 8. Limitaciones de entorno (no son fallos del producto)

- **Google Maps:** la clave demo agotó su cuota durante la corrida (`Maps Demo Key limit reached`).
  Se clasifica como error externo (`externalErrorCount`, no `productErrorCount`). `MAP-04`
  bloquea `maps.googleapis.com` y verifica que el fallback avisa y que filtros, listado,
  estadísticas y exportación siguen usables.
- **Headless / iOS:** la pantalla completa se probó con gesto real y `document.fullscreenElement`
  en Chrome headless (PASS en Hub y las 5 apps). Safari en iPhone no implementa
  `requestFullscreen` en elementos; no se pudo validar en iOS desde este entorno.
- **`file://`:** no se prueba. El producto declara que el progreso compartido requiere el mismo
  origen HTTP; el arnés usa `http://127.0.0.1:8790`.
- **PDF.js/Tesseract/OCR:** no se prueba importación de PDFs nuevos ni OCR (requiere archivos,
  red y tiempo fuera de la matriz). El banco oficial, revisión y práctica sí se probaron.
- **Datos reales:** no se usó el perfil del usuario; todos los perfiles Chrome son temporales y
  se descartan al terminar.

## 9. Evidencias

- `AUDIT/evidencias/agent8-final/run.json` — 85 resultados con observaciones medidas.
- `AUDIT/evidencias/agent8-final/run-meta.json` — entorno y 23 archivos vigilados.
- `AUDIT/evidencias/agent8-final/img/` — 29 capturas (viewports, progreso, fallos intermedios).
- Arnés: `tests/e2e/` (ver `tests/e2e/README.md`).

## 10. Reproducción

```powershell
& 'C:\Users\USARIO\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe' tests/e2e/run.mjs --out=agent8-final
```

El ejecutor no modifica producción. Sale con código 0 si no hay FAIL y 2 si hay alguno.
