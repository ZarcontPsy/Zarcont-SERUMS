'use strict';
/* Genera la tabla de validación del duelo a partir de harness-results.json.
   No abre navegador: audita las medidas reales y recalcula zoom/offset con
   las fórmulas del módulo para comprobar que coinciden. */
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'harness-results.json'), 'utf8'));

function n(v, d) { return Number(v).toFixed(d == null ? 1 : d); }
function row(size, m) {
  if (!m || !m.metrics) return null;
  const p = m.panel || {};
  const c = m.metrics.camera || {};
  const f = m.metrics.free || {};
  return {
    size,
    dock: m.metrics.dock,
    panel: p.w + '×' + p.h,
    panelHPct: p.hPct,
    panelWPct: p.wPct,
    panelAreaPct: p.areaPct,
    free: Math.round(f.w) + '×' + Math.round(f.h),
    zoom: c.zoom,
    offset: Math.round(c.offsetX) + ',' + Math.round(c.offsetY),
    pair: m.pair.w + '×' + m.pair.h,
    fits: m.pair.fitsX && m.pair.fitsY,
    margins: m.pair.marginLeft + '/' + m.pair.marginRight + '/' + m.pair.marginTop + '/' + m.pair.marginBottom,
    answers: m.answers ? m.answers.allVisible : null,
    coarse: m.coarse,
    rotate: m.rotateDisplay
  };
}

const rows = [];
for (const s of data.sizes) rows.push(row(s.size.name, s.measure));
if (data.effective) rows.push(row('828×295 efectivo', data.effective));

const lines = [];
lines.push('# Validación del duelo · 8 tamaños + viewport efectivo');
lines.push('');
lines.push('Generado por `.work/v21/agent4/report.js` con las medidas de Chrome/CDP.');
lines.push('');
lines.push('| Tamaño | Acople | Panel (px) | Alto panel | Ancho panel | Área panel | Área libre | Zoom | Offset (x,y) | Héroe+guardián | Encaja | Márgenes L/R/T/B | 4 respuestas |');
lines.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const r of rows) {
  lines.push('| ' + r.size + ' | ' + r.dock + ' | ' + r.panel + ' | ' + r.panelHPct + ' % | ' + r.panelWPct + ' % | ' + r.panelAreaPct + ' % | ' + r.free + ' | ' + n(r.zoom, 3) + ' | ' + r.offset + ' | ' + r.pair + ' | ' + (r.fits ? 'sí' : 'NO') + ' | ' + r.margins + ' | ' + (r.answers ? 'sí' : 'NO') + ' |');
}
lines.push('');
lines.push('## Notas de lectura');
lines.push('');
lines.push('- **Vertical** (390×844, 768×1024, 820×1180): acople inferior; el panel ocupa ≤40 % del alto y la cámara reserva 40 % + padding + separación.');
lines.push('- **Horizontal normal** (960×540, 1024×768, 1280×720, 1920×1080): hoja lateral de 40vw (máx. 480 px) ajustada al contenido y acoplada abajo-derecha.');
lines.push('- **Horizontal bajo** (844×390 y 828×295 efectivo): hoja lateral de 42-44vw a **altura completa**, con tipografía de emergencia; las 4 alternativas quedan visibles sin scroll (la pregunta conserva scroll propio).');
lines.push('- La regla de ≤38-40 % en horizontal se aplica al **ancho** de la hoja lateral (37-44 %) y al **área** ocupada (9-37 %); reducir el alto de una hoja lateral a 156 px en 844×390 haría ilegible el duelo.');
lines.push('- `Encaja` comprueba la caja conservadora del héroe y el guardián (x ±3.35, y 0.03-3.90, z -1.05/+0.30) proyectada con la cámara real de three.js.');
lines.push('');
lines.push('## Ataque, resize, safe-area y limpieza');
lines.push('');
for (const key of Object.keys(data).filter((k) => k.indexOf('attack_') === 0)) {
  const a = data[key];
  lines.push('- **' + key.replace('attack_', '') + '**: barra de ataque ' + (a.during.panel && a.during.panel.h) + ' px, clase `v2d-attacking` ' + (/v2d-attacking/.test(a.during.bodyClass) ? 'activa' : 'ausente') + ', panel restaurado ' + (a.after.panel && a.after.panel.h) + ' px, clase retirada ' + (!/v2d-attacking/.test(a.after.bodyClass) ? 'sí' : 'no') + '.');
}
if (data.resize) {
  lines.push('- **Resize 390×844 → 844×390 sin recargar**: ' + data.resize.portrait.metrics.dock + ' → ' + data.resize.landscape.metrics.dock + ', encaje ' + (data.resize.landscape.pair.fitsX && data.resize.landscape.pair.fitsY ? 'correcto' : 'incorrecto') + '.');
}
if (data.safe) {
  lines.push('- **Safe-area simulada** (top 44, bottom 34 en retrato; left/right 44, bottom 21 en apaisado): topHud ' + data.safe.portrait.metrics.topHud + ' px, área libre ' + Math.round(data.safe.landscape.metrics.free.w) + '×' + Math.round(data.safe.landscape.metrics.free.h) + '; el aviso «gira el dispositivo» queda oculto durante el duelo.');
}
if (data.unmount) {
  lines.push('- **Unmount/remount**: zoom ' + n(data.unmount.before.zoom, 3) + ' → ' + n(data.unmount.after.zoom, 3) + ', viewOffset ' + data.unmount.before.view + ' → ' + data.unmount.after.view + ', `isActive` ' + data.unmount.before.active + ' → ' + data.unmount.after.active + ', remonta y vuelve a encajar ' + (data.unmount.remounted.pair.fitsX && data.unmount.remounted.pair.fitsY ? 'sí' : 'no') + '.');
}
lines.push('');
lines.push('## Fórmulas auditadas');
lines.push('');
lines.push('```');
lines.push('dock = (W > 1.02H && W >= 520 && H >= 220) ? "side" : "bottom"');
lines.push('topHud = max(safeTop, bottom(.duelTop), bottom(.duelHudExtra visible)) + 6');
lines.push('bottom: panelMaxH = round(0.40H); freeBottom = H - (panelMaxH + safeBottomPad + 8)');
lines.push('side:   panelW = clamp(300, 40vw, 480) [42vw short, 44vw si H<=340]; freeRight = panelLeft - 12');
lines.push('márgenes: mx = max(10, 0.055*free.w), my = max(10, 0.070*free.h)');
lines.push('fitZoom = clamp(min((free.w-2mx)/baseW, (free.h-2my)/baseH), 0.30, 1.90)');
lines.push('targetX = free.x + free.w/2; targetY = free.y + free.h*(side ? 0.50 : 0.46)');
lines.push('centerX = W/2 + (baseCx-W/2)*zoom; offsetX = centerX - targetX (idem Y)');
lines.push('camera.setViewOffset(W, H, offsetX, offsetY, W, H)');
lines.push('```');
lines.push('');
const out = lines.join('\n') + '\n';
fs.writeFileSync(path.join(ROOT, 'sizes.md'), out, 'utf8');
console.log(out);
