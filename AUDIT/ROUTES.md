# AUDIT/ROUTES.md — Rutas, enlaces e integraciones (Agente 1)

© 2026 ZARCONT · Auditoría del **2026-10-25**, estado del repositorio a las **17:20** (America/Lima).
Repositorio: `C:\Users\USARIO\Documents\ZARCONT SERUMS`.
Este documento registra el inventario, la causa de cada enlace antiguo y el parche del hub,
**aplicado a las 17:16** con autorización del coordinador (Agente 3 confirmó `index.html` libre).

> **Aviso sobre líneas.** `index.html` creció de 2.102 a ~2.197 líneas durante la auditoría. Los
> números de línea citados son una **foto** y pueden haberse desplazado: localizar siempre por el
> texto. Tras el parche, `dashboardHref` quedó en 1711 y `flashcardsHref` en 1714 (foto 17:22,
> después de otra edición del hub que no reintrodujo query y no tocó el parche).

---

## 0. Resumen ejecutivo

| Comprobación | Resultado final (17:20, parche aplicado) |
|---|---|
| Entradas reales de aplicación | **6**: hub + 5 apps (tabla §2) |
| Tarjetas del hub | **5**, `data-app` únicos, `href` únicos |
| Enlaces locales comprobados (16 HTML) | **168** |
| Destinos locales faltantes | **0** |
| Errores de capitalización (hosting Linux) | **0** |
| Nombres/páginas obsoletas (`study-board`, `dashboard.html`, `flashcards.html`, `plaza*.html`, `old/`, `/v1/`) | **0 coincidencias** |
| Pruebas de navegación real (Chrome headless) | **39/39 OK** tras el parche (37/39 antes) |
| Comprobación puntual de snapshot y rutas directas | **6/6 OK** (§10.4) |
| `history.back()` como mecanismo de regreso | **0 usos** en código de producción |

**Causa estructural del «acceso a una vista antigua» desde el hub (resuelta):** los `href`
estáticos de las tarjetas siempre apuntaron a la portada, pero en tiempo de ejecución
`dashboardHref()` / `flashcardsHref()` (`index.html`) reescribían el `href` de la tarjeta con
`?sheet=<id>` / `?deck=<id>&resume=1`. **Parche P1 aplicado a las 17:16**: ambas funciones
devuelven la portada limpia; el «último punto» sigue visible como texto y las rutas directas con
query siguen funcionando. Ver §7 y §10.

---

## 1. Método y alcance

1. **Inventario estático automático** — `AUDIT/route_audit.py` (Python 3.13, sin dependencias):
   recorre el repositorio, extrae `href`/`src` de todos los `.html`, ignora query/fragmento,
   decodifica `%XX`, resuelve directorios a su `index.html` y verifica la existencia **con
   capitalización exacta**. Sale con 0 solo si no hay destinos faltantes ni errores de mayúsculas.
2. **Inventario de rutas internas** — lectura de las tablas de rutas de cada app
   (`parseRoute()` / `parseRoute` de Banqueo y QUEST) y de los enlaces `#/...` generados.
3. **Navegación real** — `tools/route_nav_audit.mjs` (Node 24, WebSocket global, sin dependencias)
   contra `python -m http.server` en `127.0.0.1:8771`, con Chrome headless 155, perfil temporal y
   resolución DNS externa desactivada (`--host-resolver-rules`), de modo que las fuentes/CDN fallan
   rápido y no contaminan las mediciones. Se cuentan navegaciones de documento
   (`Page.frameNavigated`) frente a cambios de hash (`Page.navigatedWithinDocument`).
4. **Búsqueda de referencias antiguas** — patrones de nombres de página inexistentes
   (`AUDIT/route_audit.py --legacy`).

**Límites declarados:** `route_audit.py` valida existencia de archivos, no semántica de rutas hash;
las rutas hash las cubre el arnés de navegación (H2/H3/H4). Un enlace a una carpeta devolvería 200
con listado del servidor: por eso la comprobación autoritativa es la de archivos, no la HTTP.

---

## 2. Entradas canónicas (destinos reales)

| App | Entrada canónica | Estado | Verificación |
|---|---|---|---|
| SERUMS HUB | `index.html` | 200 | H1.1 |
| BANQUEO · Examen Studio | `EXAMEN STUDIO/Examen Studio.html` | 200 | H4.1 |
| PLAZAS SERUMS · Map Explorer | `serums map/serums-map-explorer/index.html` | 200 | H4.3 |
| Study Dashboard | `study-dashboard/index.html` | 200 | H2.1 |
| Study Flashcards | `study-flashcards/index.html` | 200 | H3.1 |
| SERUMS QUEST | `serums-quest/index.html` | 200 | H4.5 |

No existen `EXAMEN STUDIO/index.html`, `study-board*`, `dashboard.html`, `flashcards.html`,
`plaza*.html`, `serums-map.html` ni carpetas `old/` o `v1/`.

---

## 3. Inventario del hub (`index.html`)

### 3.1 Tarjetas (`href` servido, sin ejecutar JS)

| # | `data-app` | Línea (foto 17:12) | `href` estático | Destino real | HTTP | Query |
|---|---|---|---|---|---|---|
| 0 | banqueo | 1254 | `./EXAMEN STUDIO/Examen Studio.html?v=2.1.5` | `EXAMEN STUDIO/Examen Studio.html` | 200 | `?v=2.1.5` (cache-buster documentado en `AUTORIA.md`) |
| 1 | plazas | 1301 | `./serums map/serums-map-explorer/index.html` | idem | 200 | — |
| 2 | dashboard | 1353 | `./study-dashboard/index.html` | idem | 200 | — (correcto) |
| 3 | flashcards | 1405 | `./study-flashcards/index.html` | idem | 200 | — (correcto) |
| 4 | quest | 1455 | `./serums-quest/index.html` | idem | 200 | — |

Los cinco `href` estáticos son correctos y **no necesitan cambios**. El problema es solo dinámico.

### 3.2 `CONFIG.apps` (líneas 1602-1614, foto 17:12)

```js
banqueo:   "./EXAMEN STUDIO/Examen Studio.html?v=2.1.5",
plazas:    "./serums map/serums-map-explorer/index.html",
dashboard: "./study-dashboard/index.html",
flashcards:"./study-flashcards/index.html",
quest:     "./serums-quest/index.html"
```

Coinciden exactamente con los `href` de las tarjetas (H1.2: cinco destinos únicos, sin duplicados).

### 3.3 Reanudación en las tarjetas (resuelto: parche P1 aplicado)

**Estado anterior (17:02-17:15)** — las funciones devolvían una URL con query cuando el snapshot
tenía un último punto:

```js
function dashboardHref(snap){
  const last = snap && snap.dashboard ? snap.dashboard.last : null;
  if (last && last.sheetId){
    return "./study-dashboard/index.html?sheet=" + encodeURIComponent(last.sheetId);
  }
  return CONFIG.apps.dashboard;
}
function flashcardsHref(snap){
  const last = snap && snap.flashcards ? snap.flashcards.last : null;
  if (last && last.deckId){
    return "./study-flashcards/index.html?deck=" + encodeURIComponent(last.deckId) + "&resume=1";
  }
  return CONFIG.apps.flashcards;
}
```

**Estado actual (desde 17:16; líneas 1707-1716 en la foto 17:22)**

```js
  /* D1 — el acceso principal del hub es la portada, sin query. La reanudación de un punto
     concreto sigue viva dentro de cada app («Continuar», «Continuar sesión») y en las rutas
     directas ?sheet=<id> / ?deck=<id>&resume=1, que no se eliminan. `snap` se conserva en la
     firma porque applySnapshot() lo pasa; ya no altera la URL de la tarjeta. */
  function dashboardHref(snap){
    return CONFIG.apps.dashboard;
  }
  function flashcardsHref(snap){
    return CONFIG.apps.flashcards;
  }
```

`applySnapshot()` y `setProgress()` no se tocaron: reciben la portada limpia. Con snapshot
sembrado, los `href` quedan en `./study-dashboard/index.html` y `./study-flashcards/index.html`
(sin query) mientras el bloque «Último punto» sigue mostrando el título guardado (S1-S3 en §10.4).

### 3.4 Navegación del hub

`launch(card)` (líneas 1953-1998) navega con `window.location.assign(url)`; no hay
`history.back()`. Teclado `1`–`5`, flechas, puntos, swipe y barra inferior siguen funcionando
(H1.1 exige `.app-card` × 5 y `body.ready`, ambos presentes).

---

## 4. Rutas internas legítimas (se conservan)

### Study Dashboard (`study-dashboard/app.js::parseRoute`, líneas 57-67)

| Ruta | Vista |
|---|---|
| `#/` | Panel (portada) |
| `#/biblioteca` | Las cinco áreas |
| `#/biblioteca/<areaId>` | Área y sus categorías |
| `#/biblioteca/<areaId>/<categoryId>` | Categoría con fichas (`.sheet-row`) |
| `#/ficha/<sheetId>` | Lector de ficha |
| `#/progreso` | Progreso |
| `?sheet=<id>` (+ `&from=flashcards&deck=<id>`) | **Ruta directa** de entrada a ficha; se limpia la query a `#/ficha/<id>` con `replaceState` |
| `#/biblioteca/<alias>` | Se normaliza al `areaId` canónico con `replaceState` (líneas 315-316) |

### Study Flashcards (`study-flashcards/app.js::parseRoute`)

| Ruta | Vista |
|---|---|
| `#/` | Biblioteca de mazos (portada) |
| `#/mazo/<deckId>` | Mazo |
| `#/sesion` | Sesión activa |
| `#/resumen` | Resumen de sesión |
| `#/historial` | Historial y programación |
| `?deck=<id>&mode=<modo>&resume=1&from=dashboard` | **Ruta directa**: `resume=1` con sesión activa → `#/sesion`; sin sesión → `#/mazo/<id>`; `mode` crea sesión → `#/sesion` |

### SERUMS QUEST (`serums-quest/js/app.js::render`, línea ~1736)

`#/`, `#/jugar`, `#/mapa`, `#/mision/<id>`, `#/modo/<id>`, `#/resultado/<id>`,
`#/personajes`, `#/personaje/<id>`, `#/inventario`, `#/inventario/<characterId>`,
`#/tienda`, `#/perfil`, `#/logros`, `#/registro`, `#/errores`, `#/ajustes`.

### BANQUEO (`EXAMEN STUDIO/js/app.js::parseRoute`, líneas 405-423)

`#hub`, `#hub/<professionId>`, `#bank/<professionId>[/<examId>]`, `#review[/<examId>[/<tab>]]`,
`#import`, `#prog[/<tab>]`, `#practice[/<examId>]`, `#practice/session`, `#practice/result/<attemptId>`.
Sin `location.hash` se normaliza a `#hub` con `replaceState` (línea 2272).

### PLAZAS SERUMS

**No expone rutas ni deep links**: las vistas y la ficha de plaza son paneles en memoria
(`data-nav` con botones, sin `location.hash` ni `?plaza=`). No se inventan rutas; si se quisiera
enlazar una plaza concreta habría que añadirlo en otra tarea.

---

## 5. Parámetros de consulta y versionado `?v=`

| Parámetro | Consumidor | Comportamiento |
|---|---|---|
| `?sheet=<id>` (+ `from`, `deck`) | Study Dashboard | Abre la ficha y limpia la query; id inexistente → portada + aviso (verificado H2.11/H2.12) |
| `?deck=<id>` (+ `mode`, `resume`, `from`) | Study Flashcards | Abre mazo/sesión y limpia la query; id inexistente → portada + aviso (verificado H3.7/H3.8) |
| `?v=<versión>` | 144 enlaces locales | Cache-buster de scripts/estilos (`2.1.5` Banqueo, `2.2.0`/`2.1.0` Study, `1.2.0` QUEST, `2.0.0` Plazas, `1.0.0` `serums-chrome`). No altera el destino; el auditor lo ignora |

Ningún enlace local depende de la query para resolver el archivo.

---

## 6. Regreso a portada y al HUB (matriz verificada)

| App | Inicio de la app | Volver al HUB | Evidencia |
|---|---|---|---|
| Hub | — | — | — |
| Dashboard | brand `#/` + control `[data-serums-chrome="home"]` (`#/`) | `[data-serums-chrome="hub"]` → `/index.html` + enlace «HUB» del pie | H2.6, H2.9, H2.10 |
| Flashcards | brand `#/` + control home (`#/`) | control hub → `/index.html` + enlace «HUB» del pie | H3.4, H3.5 |
| QUEST | brand `#/`, nav superior e inferior | control hub + enlace del pie | H4.7, H4.8, H4.9 |
| Banqueo | brand `#hub` | `.top-chrome [data-chrome-mount]` → `SerumsChrome.mount()` (`EXAMEN STUDIO/js/app.js` 480, 492-499) | H4.2 |
| Plazas | `#brandHome` (mapa) | control hub de `SerumsChrome` en `#topbar` | H4.4 |

**«Volver a la biblioteca» ≠ «volver al HUB»**: en el mazo, `.flash-back` apunta a `#/`
(biblioteca) y el control hub resuelve a `/index.html`; son controles distintos (H3.4) y el
regreso a la biblioteca no recarga el documento (H3.6).

---

## 7. Parche del hub (D1) — **APLICADO a las 17:16**

> Aplicado por el Agente 1 con autorización del coordinador y `index.html` congelado por el
> Agente 3. Solo se modificaron `dashboardHref`, `flashcardsHref` y el comentario de `CONFIG`;
> **no** se tocaron `CONFIG.apps`, los cinco `href`, `applySnapshot()` ni la línea de `href` de
> `setProgress()`. Diffs verificados por lectura del archivo y por el arnés.

### P1 — aplicado: `dashboardHref` / `flashcardsHref`

**Antes**

```js
  function dashboardHref(snap){
    const last = snap && snap.dashboard ? snap.dashboard.last : null;
    if (last && last.sheetId){
      return "./study-dashboard/index.html?sheet=" + encodeURIComponent(last.sheetId);
    }
    return CONFIG.apps.dashboard;
  }
  function flashcardsHref(snap){
    const last = snap && snap.flashcards ? snap.flashcards.last : null;
    if (last && last.deckId){
      return "./study-flashcards/index.html?deck=" + encodeURIComponent(last.deckId) + "&resume=1";
    }
    return CONFIG.apps.flashcards;
  }
```

**Después**

```js
  /* D1 — el acceso principal del hub es la portada, sin query. La reanudación de un punto
     concreto sigue viva dentro de cada app («Continuar», «Continuar sesión») y en las rutas
     directas ?sheet=<id> / ?deck=<id>&resume=1, que no se eliminan. `snap` se conserva en la
     firma porque applySnapshot() lo pasa; ya no altera la URL de la tarjeta. */
  function dashboardHref(snap){
    return CONFIG.apps.dashboard;
  }
  function flashcardsHref(snap){
    return CONFIG.apps.flashcards;
  }
```

Consecuencias: `applySnapshot()` (1758-1759) y `setProgress()` (1735) reciben la portada limpia;
el texto del «último punto» (`[data-last]`) se sigue mostrando porque no depende del `href`.
No hace falta tocar los cinco `href` estáticos ni `CONFIG.apps`. Las rutas directas con query
siguen funcionando (H2.11, H3.7) y son las que usan «Practicar con flashcards» y «Consultar ficha».

### P2 — aplicado: comentario de `CONFIG`

**Antes**

```js
  /* ==================================================================
     CONFIGURACIÓN — rutas base de las aplicaciones.
     Cada tarjeta conserva su href real; si Study tiene un último punto,
     se reemplaza por el enlace de reanudación.
     ================================================================== */
```

**Después**

```js
  /* ==================================================================
     CONFIGURACIÓN — rutas base de las aplicaciones.
     D1: las tarjetas abren siempre la portada (sin query). El progreso y
     el último punto se muestran como información; la reanudación se hace
     dentro de cada app o con una ruta directa explícita.
     ================================================================== */
```

### Verificación posterior al parche (ejecutada el 2026-10-25 a las 17:17-17:20)

1. `C:\Python313\python.exe AUDIT\route_audit.py --legacy --json AUDIT\evidencias\agent1-route-audit.json`
   → **EXIT 0** · 16 HTML · 168 enlaces locales · faltantes=0 · capitalización=0 · obsoletos=0.
2. `node tools\route_nav_audit.mjs --json AUDIT\evidencias\agent1-nav-tests-postparche.json`
   → **EXIT 0 · 39/39 OK**, incluidas **H5.2** y **H5.3**.
3. Comprobación puntual con snapshot sembrado y rutas directas
   (`AUDIT/evidencias/agent1-snapshot-check.json`) → **6/6 OK**:
   tarjetas Dashboard/Flashcards sin query con snapshot válido y con snapshot obsoleto,
   «Último punto» visible como texto, `?sheet=<real>` → `#/ficha/sheet-psi-sp-1-1`,
   `?deck=<real>&resume=1` → `#/mazo/sheet-aps-01`.
4. `Banqueo` conserva su `?v=2.1.5` documentado (cache-buster), no es una ruta de reanudación.
5. **Revalidación a las 17:22**, después de otra edición del hub (17:20, +14 líneas sin cambios en
   el parche ni query reintroducida): `route_audit.py` EXIT 0 (0 faltantes) y arnés **39/39 OK**.

---

## 8. Tabla anterior → actual (referencias antiguas o documentadas)

| Referencia anterior / documentada | ¿Existe hoy? | Destino real actual | Causa y tratamiento |
|---|---|---|---|
| `./study-dashboard/index.html?sheet=<id>` como **href de la tarjeta** | Sí, pero solo como ruta directa | `./study-dashboard/index.html` (portada) | Lo inyectaba `dashboardHref(snap)` vía `applySnapshot()`. **Eliminado del hub con P1 (17:16)**; la ruta directa se conserva |
| `./study-flashcards/index.html?deck=<id>&resume=1` como **href de la tarjeta** | Sí, solo como ruta directa | `./study-flashcards/index.html` (biblioteca) | Lo inyectaba `flashcardsHref(snap)`. **Eliminado del hub con P1 (17:16)**; la ruta directa se conserva |
| `?sheet=<id>` con id **obsoleto** | El id no existe | Antes: `#/ficha/<id>` + «Esta ficha no está disponible». Ahora: `#/` + aviso (`study-dashboard/app.js` 1244-1254) | El snapshot podía quedar desfasado. Corregido por Agente 6; verificado H2.12 |
| `?deck=<id>` con id **obsoleto** | El id no existe | Antes: `#/mazo/<id>` + «Mazo no encontrado». Ahora: `#/` + aviso (`study-flashcards/app.js` 1538-1540) | Mismo patrón. Corregido por Agente 5; verificado H3.8 |
| `EXAMEN STUDIO/index.html` (citada en `AUDIT/COORDINATION.md` §2) | **No** | `EXAMEN STUDIO/Examen Studio.html` | Inconsistencia **documental**: ningún enlace la usa. Solo debe corregirse el texto de coordinación; no crear el archivo |
| `study-board/`, `study_board` | **No** | Study Dashboard | 0 coincidencias en el repositorio |
| `dashboard.html`, `flashcards.html` | **No** | `study-*/index.html` | 0 coincidencias |
| `plaza*.html`, `serums-map.html`, `examen-studio.html` (minúsculas) | **No** | Plazas: panel interno (sin URL); Map: `serums map/serums-map-explorer/index.html` | 0 coincidencias |
| `.../old/`, `/v1/`, `*_v1.html` | **No** | — | 0 coincidencias |
| `#/biblioteca/<alias de área>` | Alias no canónico | `#/biblioteca/<areaId>` | `replaceState` normaliza el hash (H2.4 usa ids canónicos) |

No hay entradas duplicadas en el hub (H1.2) ni enlaces rotos a carpetas movidas.

---

## 9. Traspasos enviados a otros agentes (resueltos)

| # | Archivo y línea | Cambio solicitado | Estado |
|---|---|---|---|
| 1 | `EXAMEN STUDIO/js/app.js::renderShell()` (hoy 480, 492-499) | Contenedor `[data-chrome-mount]` + `SerumsChrome.mount(...)` para ofrecer «Volver al HUB» | **Aplicado** por Agente 6; H4.2 pasa |
| 2 | `study-flashcards/app.js::bootApp()` (hoy 1538-1540) | `?deck=` inexistente → `#/` + `state.notice`, sin entrar en «Mazo no encontrado» | **Aplicado** por Agente 5; H3.8 pasa |
| 3 | `study-dashboard/app.js::initQuery()` (hoy 1244-1254) | `?sheet=` inexistente → `#/` + aviso, sin bucle | **Ya estaba corregido** (Agente 6); H2.12 pasa |

---

## 10. Pruebas ejecutadas (comando + resultado)

### 10.1 Auditoría estática (antes y después del parche)

```powershell
C:\Python313\python.exe AUDIT\route_audit.py --legacy --json AUDIT\evidencias\agent1-route-audit.json
# → EXIT 0 · 16 HTML · 168 enlaces locales · faltantes=0 · capitalización=0 · fuera=0 · obsoletos=0
#   (log: AUDIT/evidencias/agent1-route-audit.log — regenerado a las 17:17, ya con el parche)
```

### 10.2 Autoprueba del auditor (HTML roto temporal, eliminado después)

```powershell
C:\Python313\python.exe AUDIT\route_audit.py     # con AUDIT/evidencias/_selftest_broken.html
# → EXIT 1 · DESTINOS FALTANTES (1) + CAPITALIZACIÓN DISTINTA (1)
#   (log: AUDIT/evidencias/agent1-route-audit-selftest.txt)
```

### 10.3 Navegación real (servidor 8771 + Chrome headless 155, perfil temporal)

```powershell
C:\Python313\python.exe -m http.server 8771 --bind 127.0.0.1
C:\Users\USARIO\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe `
  tools\route_nav_audit.mjs --json AUDIT\evidencias\agent1-nav-tests-postparche.json
# ANTES del parche (17:13): EXIT 1 · 37/39 · fallan H5.2 y H5.3
#   (AUDIT/evidencias/agent1-nav-tests.json y .log)
# DESPUÉS del parche (17:18): EXIT 0 · 39/39 OK, incluidas H5.2 y H5.3
#   (AUDIT/evidencias/agent1-nav-tests-postparche.json y .log)
```

### 10.4 Comprobación puntual con snapshot sembrado y rutas directas — 6/6

Sonda temporal (no se distribuye) cuya evidencia queda en el repositorio:

```powershell
node %TEMP%\a1-snapcheck.mjs
# → EXIT 0 · 6/6 OK
#   S1 tarjeta Dashboard sin ?sheet=  ·  S2 tarjeta Flashcards sin ?deck=/?resume=
#   S3 «Último punto: Ficha real» visible como texto  ·  S4 ?sheet=<real> → #/ficha/sheet-psi-sp-1-1
#   S5 ?deck=<real>&resume=1 → #/mazo/sheet-aps-01  ·  S6 snapshot obsoleto sin query
#   (evidencia: AUDIT/evidencias/agent1-snapshot-check.json y .log)
```

Pruebas destacadas (detalle completo en los JSON):

- **H2.4** portada → categoría → ficha real: `#/biblioteca/area-psi-salud-publica/cat-sp-metodos`
  → `#/ficha/sheet-psi-sp-1-1`.
- **H2.11 / H3.7** rutas directas con query: abren ficha/mazo y **limpian la query**.
- **H2.12 / H3.8** ids obsoletos: portada + aviso, sin bucle.
- **H2.5 / H2.7 / H3.3 / H3.6 / H4.6** cambios internos con **0 navegaciones de documento**.
- **H2.8** atrás/adelante conservan `#/ficha/…` y `#/`.
- **H2.9-H2.10, H3.4-H3.5, H4.7-H4.9** app → HUB → atrás, con controles explícitos.
- **H5.1** las seis entradas abren por URL directa con su título.
- **H5.2 / H5.3** snapshot (obsoleto y válido) no inyecta query en las tarjetas.
- **H6.1** 0 usos de `history.back()` / `history.go(-1)` en HTML/JS/CSS de producción.

---

## 11. Pendientes

1. Repetir `AUDIT/route_audit.py --legacy` al cierre del equipo: si otros agentes añaden enlaces
   en HTML, el auditor debe seguir en 0 faltantes (hoy: 0).
2. Plazas no tiene deep link de plaza individual: si el producto lo requiere, es una función nueva,
   no un enlace roto.
3. La prueba de navegación depende de selectores del carrusel (`.dot[data-index]`, `.app-card`) y
   de `[data-serums-chrome]`; si el Agente 3/7 los renombra, ajustar el arnés antes de interpretar
   fallos.
4. El parche P1/P2 está aplicado; cualquier cambio posterior del hub debe conservar la regla D1
   (tarjeta = portada sin query).

---

© 2026 ZARCONT — Documento interno de auditoría. No modifica código de producción.
