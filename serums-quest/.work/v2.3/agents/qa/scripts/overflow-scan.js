'use strict';
/* Diagnóstico de desbordes internos de la bienvenida (solo lectura). */
const C = require('./common');

async function scan(s) {
  return s.ev(`(() => {
    const vw = innerWidth, vh = innerHeight;
    const out = [];
    const all = Array.prototype.slice.call(document.querySelectorAll('.titleScreen *'));
    all.forEach(function (el) {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      const overX = Math.max(0, Math.round(r.right - vw), Math.round(-r.left));
      const overY = Math.max(0, Math.round(r.bottom - vh), Math.round(-r.top));
      if (overX > 2 || overY > 2) out.push({ tag: el.tagName, cls: String(el.className || '').slice(0, 60), overX, overY, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), overflow: cs.overflow });
    });
    out.sort(function (a, b) { return (b.overX + b.overY) - (a.overX + a.overY); });
    const ts = document.querySelector('.titleScreen');
    return {
      vw: vw, vh: vh,
      title: ts ? { scrollW: ts.scrollWidth, scrollH: ts.scrollHeight, clientW: ts.clientWidth, clientH: ts.clientHeight, overflow: getComputedStyle(ts).overflow } : null,
      count: out.length,
      top: out.slice(0, 12)
    };
  })()`);
}

(async () => {
  const report = { startedAt: new Date().toISOString(), sizes: {}, fatal: null };
  let s;
  try {
    s = await C.launch({ width: 1308, height: 662 });
    await s.seed(C.readSave('all'));
    await C.sleep(800);
    report.sizes['1308x662'] = await scan(s);
    await s.setViewport(640, 360);
    await C.sleep(500);
    report.sizes['640x360'] = await scan(s);
    await s.setViewport(1920, 1080);
    await C.sleep(500);
    report.sizes['1920x1080'] = await scan(s);
  } catch (e) {
    report.fatal = String(e && e.stack || e);
  } finally {
    if (s) await s.close();
  }
  C.writeJSON('overflow.json', report);
  console.log(JSON.stringify(report, null, 1));
})();
