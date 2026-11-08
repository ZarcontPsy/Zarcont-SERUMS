# Agente 4 · Duelo adaptativo (V2.1)

Archivos propios:

- `.work/src/part7-duel.js` — layout, cámara, barra de ataque y API.
- `.work/src/part7-duel.css` — panel acoplado, tipografía compacta y safe-area.
- `.work/v21/agent4/**` — harness, calculadora/informe, capturas y este README.

No se tocó `game.js`, `game.json`, `build-game.js`, `dist/`, `export/`, `part2-world.js`,
`part3-ui.js`, `part4-flow.js`, HUB, legacy, archivo, backups ni `INTEGRITY.sha256`.

---

## 1. Problema y causa raíz

En tablet/móvil el panel de pregunta era `position: fixed; left: 0; right: 0; bottom: 0`
con hasta 61 vh de alto. La cámara de duelo seguía usando el viewport completo y
encuadraba a héroe y guardián en el centro (x ±2.45 del mundo). Consecuencias:

1. El panel tapaba la mitad inferior de la arena y, en retrato, buena parte de los
   propios personajes.
2. La cámara no sabía que existía un panel: su composición seguía centrada en la
   pantalla completa.
3. En retrato (aspecto 390/844 = 0.46) la separación horizontal de los personajes
   (±2.45) no cabía en el frustum: el héroe quedaba fuera de pantalla.
4. `duelHudExtra`, `duelStatus` y el aviso «gira el dispositivo» podían ocupar el
   escenario. No había safe-area ni contracción durante el golpe.

---

## 2. Diseño

### 2.1 Acople del panel

| Situación | Acople | Ocupación |
|---|---|---|
| `H > W` (retrato) | inferior, ancho completo | alto ≤ **40 % de H** (reservado por JS) |
| `W > H` normal | lateral derecho, hoja ajustada al contenido | ancho **40 vw** (máx. 480 px) |
| `W > H`, `H < 520` (apaisado bajo) | lateral derecho, **altura completa** | ancho **42 vw** (44 vw si `H ≤ 340`) |
| `W > H` microscópico (< 520×220) | inferior (fallback) | 40 % de H |

- En vertical el panel real se mide una vez por render/resize y se limita a 40 %;
  la cámara reserva 40 % + padding + 8 px. Un panel más bajo deja más escena visible.
- En horizontal la hoja lateral se ajusta al contenido (para no dejar una pared vacía
  de 900 px en 1920×1080) salvo en apaisado bajo, donde ocupa toda la altura para que
  quepan las 4 alternativas.
- **Interpretación del 38–40 %**: en horizontal se aplica al **ancho** de la hoja
  (37–44 %) y al **área** ocupada (≈9–37 %). Recortar la altura de una hoja lateral a
  156 px en 844×390 haría ilegible la pregunta. En vertical sí se aplica al alto.
- Modos compactos: `v2d-compact` (W<1000/H<520 en lateral; W<560/H<640 en inferior),
  `v2d-tiny` (H<380 o W<350) y `v2d-short` (H<520). Escalan tipografía, ocultan
  metadatos secundarios (fuente, chip de generada, etiquetas de texto) y reducen
  espacios. Las 4 alternativas van en 2 columnas y mantienen ≥44 px de alto táctil.
- En apaisado bajo la pregunta conserva scroll propio; las 4 respuestas se priorizan
  y quedan visibles sin scroll (medido en 844×390 y 828×295).

### 2.2 Área libre y cámara

La zona del panel es **estable** (no depende del contenido de cada pregunta):

```
topHud = max(safeTop, bottom(.duelTop), bottom(.duelHudExtra visible)) + 6

inferior:
  panelMaxH  = round(0.40 * H)
  freeBottom = H - (panelMaxH + max(8, safeBottom) + 2 + 8)
  free = [safeLeft+8, topHud] .. [W-safeRight-8, freeBottom]

lateral:
  panelW    = clamp(300, 40vw, 480)   // 42vw short, 44vw si H<=340
  freeRight = panelLeft - 12
  free = [safeLeft+8, topHud] .. [freeRight, H-(max(8,safeBottom)+2)-8]
```

Se proyecta una caja conservadora del duelo con la cámara neutra (zoom 1, sin
viewOffset): `x = ARENA.x ± 3.35`, `y = 0.03..3.90`, `z = ARENA.z -1.05..+0.30`.
Con `tanV = tan(fov/2)` y el `matrixWorldInverse`:

```
ndcX = vx / (-vz * tanV * aspect)
ndcY = vy / (-vz * tanV)
```

Luego, con márgenes `mx = max(10, 0.055·free.w)` y `my = max(10, 0.070·free.h)`:

```
fitZoom = clamp(min((free.w-2mx)/baseW, (free.h-2my)/baseH), 0.30, 1.90)
targetX = free.x + free.w/2
targetY = free.y + free.h * (side ? 0.50 : 0.46)
centerX = W/2 + (baseCx - W/2) * zoom
offsetX = centerX - targetX        // idem Y
camera.zoom = zoom
camera.setViewOffset(W, H, offsetX, offsetY, W, H)
```

- `placeCamera` sigue mandando: no se tocan `position`, `quaternion` ni `lookAt`;
  solo la proyección (`zoom` + view offset).
- Corrección suavizada (`k = min(1, dt·5)`); snap inicial y al cambiar el área >12 %.
- Mientras la cámara viaja del atrio al duelo (distancia al área >45) no se encuadra;
  se usa proyección neutra para evitar saltos. Al llegar, encuadra.
- `resize`/`orientationchange`/`visualViewport` recalculan; también se detecta un
  cambio de `innerWidth/innerHeight` en `afterCamera`.
- Al desmontar se restaura `zoom` original y se limpia el view offset.

### 2.3 Ataque

`onAttack(correct)` marca `attackUntil = now + 650 ms` (cubre 600 ms del héroe y
450 ms del guardián). En el mount inmediato de `renderScreen('duel')`:

1. Se mide el panel expandido.
2. Se añade `v2d-attacking` en el mismo tick.
3. CSS contrae la altura a **52 px** (46 px si `H ≤ 340`) en 130 ms y oculta
   head/body; aparece la barra «Resolviendo el golpe…» con punto animado.
4. A los 650 ms se retira la clase y el panel vuelve a su altura. Un resize durante
   el golpe no recalcula la altura hasta 260 ms después.

### 2.4 Safe-area, HUD y accesibilidad

- `.v2d-safe-probe` lee `env(safe-area-inset-*)` con `getComputedStyle`; el área libre
  y el padding del panel/HUD respetan notch. También hay `env()` directo en CSS.
- `.duelStatus` se oculta (duplica información). `.duelHudExtra` solo aparece en
  ≥1180×700, desplazado a la izquierda del panel, y su altura se suma a `topHud`.
- `.duelProgress`/`.duelCoins` se ocultan en compacto; los corazones, timer y pausa
  quedan en la barra superior, siempre por encima del área libre.
- El aviso global «gira el dispositivo» se oculta **solo durante el duelo**
  (`body.v2d-duel #rotatePrompt`), porque el duelo ya tiene layout vertical. Fuera
  del duelo el aviso sigue como antes.
- `prefers-reduced-motion`/`body.reduced-motion` eliminan las transiciones; la
  contracción sigue siendo funcional.

---

## 3. API

```js
V2.duel = {
  mount(),                 // tras renderScreen('duel'); idempotente
  unmount(),               // setScreen / fin de duelo; restaura cámara
  onAttack(correct),       // answerCurrent antes de renderScreen
  afterCamera(dt, time),   // cada frame, después de placeCamera
  onDuelStart(areaId),     // reset de estado (si el Agente 0 lo cablea)
  onDuelEnd(),             // alias de cleanup
  isActive(),              // true mientras el panel está montado
  metrics(),               // extra QA: viewport, panel, free, zoom, offset, ataque
  refresh()                // extra QA: recalcular layout a mano
};
```

`V2.duel` se registra con `V2.register('duel', api)`. No usa `screen` (evita el
choque con `window.screen`), no reemplaza `duelScreenHTML` y añade un único nodo
propio (`.v2d-duel-bar`) más la sonda de safe-area.

---

## 4. Validación

Harness con **three.js real** (extraído de `dist/index.html`), DOM de duelo fiel a
`duelScreenHTML`, cámara con la fórmula exacta de `placeCamera`, escena 2D de
depuración y Chrome headless por CDP.

```powershell
cd serums-quest/.work/v21/agent4
node run-harness.js     # 8 tamaños + 828×295 efectivo + ataque + resize + safe-area + unmount
node report.js          # tabla sizes.md desde harness-results.json
```

Resultados (panel real, área libre, zoom/offset y encaje de la caja del duelo):

| Tamaño | Acople | Panel | Alto | Ancho | Área | Libre | Zoom | Offset | Encaja | 4 respuestas |
|---|---|---|---|---|---|---|---|---|---|---|
| 390×844 | inferior | 374×323 | 38.3 % | 95.9 % | 36.7 % | 374×423 | 0.434 | 2,157 | sí | sí |
| 844×390 | lateral | 346×309 | 79.2 % * | 41.1 % | 32.5 % | 470×307 | 1.178 | 181,-31 | sí | sí |
| 768×1024 | inferior | 752×253 | 24.7 % | 97.9 % | 24.2 % | 752×517 | 0.719 | 3,184 | sí | sí |
| 1024×768 | lateral | 402×386 | 50.3 % * | 39.2 % | 19.7 % | 594×671 | 0.758 | 209,-40 | sí | sí |
| 820×1180 | inferior | 804×253 | 21.4 % | 98 % | 21 % | 804×611 | 0.667 | 3,218 | sí | sí |
| 960×540 | lateral | 376×298 | 55.2 % * | 39.2 % | 21.6 % | 556×457 | 1.008 | 196,-32 | sí | sí |
| 1280×720 | lateral | 472×366 | 50.8 % * | 36.9 % | 18.7 % | 780×610 | 1.060 | 245,-49 | sí | sí |
| 1920×1080 | lateral | 472×382 | 35.4 % * | 24.6 % | 8.7 % | 1420×970 | 1.287 | 248,-59 | sí | sí |
| **828×295 efectivo** | lateral | 356×221 | 74.9 % * | 43 % | 32.2 % | 444×219 | 1.255 | 186,-26 | sí | sí |

\* hoja lateral: la regla de 38–40 % se aplica al ancho/área, no al alto.
En 844×390 y 828×295 la hoja es de altura completa por diseño (apaisado bajo).

Otras comprobaciones del harness:

- Ataque en 390×844 y 844×390: barra de 52 px, clase `v2d-attacking` activa y
  retirada a los 650 ms; panel restaurado.
- Resize 390×844 → 844×390 sin recargar: `bottom` → `side`, encaje correcto.
- Safe-area simulada (notch 44/34 en retrato; 44/44/21 en apaisado): `topHud` 105 px
  en retrato, área libre 426×294 en apaisado; el aviso de rotación no aparece.
- Unmount: zoom 0.434 → 1.000, viewOffset desactivado, `isActive` false; remount
  vuelve a encajar.
- `coarse: true` en móvil, `#rotatePrompt` con `display:none` durante el duelo.
- `node --check` del JS y llaves CSS balanceadas. Cero excepciones en consola.

Capturas en `.work/v21/agent4/shots/` (pregunta, ataque, feedback, safe-area,
resize, intro y estrés de opciones largas). Tabla completa en
[`sizes.md`](./sizes.md); datos crudos en `harness-results.json`.

---

## 5. Límites / lo que no pude verificar

- **No hice build** (regla de la V2.1). El harness carga `part7-duel.js/.css` reales,
  pero no el `game.js` integrado con las demás partes. La integración DOM exacta de
  `duelScreenHTML` se replica a mano; el Agente 0/7 debe confirmar en el build final.
- **No hay WebGL en el harness**: el encuadre se valida con la cámara real de three.js
  y una escena 2D de depuración. No se evaluó el aspecto final de la arena, sombras,
  partículas ni el feedback flotante del Agente 3.
- **Safe-area**: la sonda y las fórmulas se prueban con insets simulados; el
  comportamiento real de `env()` en iOS/Safari con notch y `visualViewport` requiere
  dispositivo o QA en navegador real.
- **FPS**: el trabajo por frame es proyección de 8 puntos + una actualización de
  matriz cuando cambia el encuadre, sin allocations; no se midió FPS con el render
  WebGL completo.
- **Hooks del Agente 0**: `onDuelStart/onDuelEnd` están implementados pero hoy no se
  invocan desde `part2/3/4`; `mount/unmount` cubren el ciclo real. Si el Agente 0 los
  cablea, `onDuelEnd()` limpia y `onDuelStart()` reinicia el estado.
- En `part3-ui.js` hay dos ramas duplicadas para `duel`/`result` (la segunda es
  inalcanzable); no las toqué por propiedad.
- El modo de feedback «tras cada pregunta» del Agente 3 abre un overlay propio a
  pantalla completa; queda fuera del alcance de este módulo.
