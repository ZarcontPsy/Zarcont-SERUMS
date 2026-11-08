# Validación del duelo · 8 tamaños + viewport efectivo

Generado por `.work/v21/agent4/report.js` con las medidas de Chrome/CDP.

| Tamaño | Acople | Panel (px) | Alto panel | Ancho panel | Área panel | Área libre | Zoom | Offset (x,y) | Héroe+guardián | Encaja | Márgenes L/R/T/B | 4 respuestas |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 390x844 | bottom | 374×323 | 38.3 % | 95.9 % | 36.7 % | 374×423 | 0.434 | 2,157 | 333×186 | sí | 21/21/101/135 | sí |
| 844x390 | side | 346×309 | 79.2 % | 41.1 % | 32.5 % | 470×307 | 1.178 | 181,-31 | 418×234 | sí | 26/26/37/37 | sí |
| 768x1024 | bottom | 752×253 | 24.7 % | 97.9 % | 24.2 % | 752×517 | 0.719 | 3,184 | 669×375 | sí | 41/41/51/92 | sí |
| 1024x768 | side | 402×386 | 50.3 % | 39.2 % | 19.7 % | 594×671 | 0.758 | 209,-40 | 529×296 | sí | 33/33/187/187 | sí |
| 820x1180 | bottom | 804×253 | 21.4 % | 98 % | 21 % | 804×611 | 0.667 | 3,218 | 716×400 | sí | 44/44/81/130 | sí |
| 960x540 | side | 376×298 | 55.2 % | 39.2 % | 21.6 % | 556×457 | 1.008 | 196,-32 | 495×277 | sí | 31/31/90/90 | sí |
| 1280x720 | side | 472×366 | 50.8 % | 36.9 % | 18.7 % | 780×610 | 1.060 | 245,-49 | 694×388 | sí | 43/43/111/111 | sí |
| 1920x1080 | side | 472×382 | 35.4 % | 24.6 % | 8.7 % | 1420×970 | 1.287 | 248,-59 | 1264×707 | sí | 78/78/131/131 | sí |
| 828×295 efectivo | side | 356×221 | 74.9 % | 43 % | 32.2 % | 444×219 | 1.255 | 186,-26 | 337×188 | sí | 54/54/15/15 | sí |

## Notas de lectura

- **Vertical** (390×844, 768×1024, 820×1180): acople inferior; el panel ocupa ≤40 % del alto y la cámara reserva 40 % + padding + separación.
- **Horizontal normal** (960×540, 1024×768, 1280×720, 1920×1080): hoja lateral de 40vw (máx. 480 px) ajustada al contenido y acoplada abajo-derecha.
- **Horizontal bajo** (844×390 y 828×295 efectivo): hoja lateral de 42-44vw a **altura completa**, con tipografía de emergencia; las 4 alternativas quedan visibles sin scroll (la pregunta conserva scroll propio).
- La regla de ≤38-40 % en horizontal se aplica al **ancho** de la hoja lateral (37-44 %) y al **área** ocupada (9-37 %); reducir el alto de una hoja lateral a 156 px en 844×390 haría ilegible el duelo.
- `Encaja` comprueba la caja conservadora del héroe y el guardián (x ±3.35, y 0.03-3.90, z -1.05/+0.30) proyectada con la cámara real de three.js.

## Ataque, resize, safe-area y limpieza

- **390x844**: barra de ataque 52 px, clase `v2d-attacking` activa, panel restaurado 338 px, clase retirada sí.
- **844x390**: barra de ataque 52 px, clase `v2d-attacking` activa, panel restaurado 309 px, clase retirada sí.
- **Resize 390×844 → 844×390 sin recargar**: bottom → side, encaje correcto.
- **Safe-area simulada** (top 44, bottom 34 en retrato; left/right 44, bottom 21 en apaisado): topHud 105 px, área libre 426×294; el aviso «gira el dispositivo» queda oculto durante el duelo.
- **Unmount/remount**: zoom 0.434 → 1.000, viewOffset true → false, `isActive` true → false, remonta y vuelve a encajar sí.

## Fórmulas auditadas

```
dock = (W > 1.02H && W >= 520 && H >= 220) ? "side" : "bottom"
topHud = max(safeTop, bottom(.duelTop), bottom(.duelHudExtra visible)) + 6
bottom: panelMaxH = round(0.40H); freeBottom = H - (panelMaxH + safeBottomPad + 8)
side:   panelW = clamp(300, 40vw, 480) [42vw short, 44vw si H<=340]; freeRight = panelLeft - 12
márgenes: mx = max(10, 0.055*free.w), my = max(10, 0.070*free.h)
fitZoom = clamp(min((free.w-2mx)/baseW, (free.h-2my)/baseH), 0.30, 1.90)
targetX = free.x + free.w/2; targetY = free.y + free.h*(side ? 0.50 : 0.46)
centerX = W/2 + (baseCx-W/2)*zoom; offsetX = centerX - targetX (idem Y)
camera.setViewOffset(W, H, offsetX, offsetY, W, H)
```

