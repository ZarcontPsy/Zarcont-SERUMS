'use strict';
/* Línea base visual ANTES de la Fase 1B: bienvenida en 10 tamaños y tutorial
   en 3. Solo escribe en .work/v2.3b/qa/ (evidencia de la fase). */
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../v2.3/qa/cdp.js');

const OUT = path.resolve(__dirname, '..', 'evidence', 'before');
const SAVES = path.resolve(__dirname, '..', '..', 'v2.3', 'qa');
const BUNDLE = path.join(ROOT, 'dist', 'index.html');
const SIZES = [
  { w: 640, h: 360, name: '640x360' },
  { w: 844, h: 390, name: '844x390' },
  { w: 1024, h: 600, name: '1024x600' },
  { w: 1308, h: 662, name: '1308x662' },
  { w: 1280, h: 720, name: '1280x720' },
  { w: 1920, h: 1080, name: '1920x1080' },
  { w: 2560, h: 1080, name: '2560x1080' },
  { w: 768, h: 1024, name: '768x1024' },
  { w: 820, h: 1180, name: '820x1180' },
  { w: 390, h: 844, name: '390x844' }
];

function readSave(name) {
  return JSON.parse(fs.readFileSync(path.join(SAVES, name), 'utf8'));
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await open({
    port: 9560,
    profile: path.join(__dirname, 'profiles', 'baseline'),
    bundle: BUNDLE,
    width: 1280,
    height: 720
  });
  try {
    const save = readSave('save-v23-all.json');
    await h.seed(save, { reload: true });
    await sleep(1200);
    await h.ev("(() => { try { document.querySelectorAll('.toast').forEach(function (t) { t.remove(); }); } catch (e) {} return true; })()");
    await h.clickIf('#backupBanner [data-action="backup-later"]', 80);
    const report = [];
    for (const s of SIZES) {
      await h.setViewport(s.w, s.h);
      await sleep(850);
      await h.ev("(() => { try { document.querySelectorAll('.toast').forEach(function (t) { t.remove(); }); } catch (e) {} return true; })()");
      const file = path.join(OUT, 'welcome-' + s.name + '.png');
      await h.shot(file);
      const info = await h.ev(`(() => {
        const q = (sel) => document.querySelector(sel);
        const r = (sel) => { const el = q(sel); if (!el) return null; const b = el.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
        const imgs = Array.prototype.map.call(document.querySelectorAll('.v23wFigure img'), (el) => { const b = el.getBoundingClientRect(); return { src: el.src.slice(0, 24), x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), fit: getComputedStyle(el).objectFit }; });
        return { vw: innerWidth, vh: innerHeight, title: r('.v23wLogo'), copy: r('.v23wCopy'), stage: r('.v23wStage'), top: r('.v23wTop'), foot: r('.v23wFoot'), actions: r('.v23wActions'), routes: r('.v23wRoutes'), imgs, screen: window.__v23h ? window.__v23h.screen() : null, doc: { w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight } };
      })()`);
      report.push({ size: s.name, info, file: path.relative(ROOT, file) });
      console.log(s.name, JSON.stringify(info.title));
    }
    // Tutorial actual a 3 tamaños.
    for (const v of [{ w: 1280, h: 720, name: '1280x720' }, { w: 640, h: 360, name: '640x360' }, { w: 390, h: 844, name: '390x844' }]) {
      await h.setViewport(v.w, v.h);
      await sleep(400);
      await h.ev("(() => { window.__v23welcome && window.__v23welcome.open('title'); return true; })()");
      await sleep(700);
      const file = path.join(OUT, 'tutorial-' + v.name + '.png');
      await h.shot(file);
      const info = await h.ev(`(() => { const p = document.querySelector('.v23tutPanel'); const r = p ? p.getBoundingClientRect() : null; return { vw: innerWidth, vh: innerHeight, panel: r ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } : null, scroll: p ? p.scrollHeight : null }; })()`);
      report.push({ size: v.name, tutorial: info, file: path.relative(ROOT, file) });
      await h.ev("(() => { window.__v23welcome && window.__v23welcome.close(); return true; })()");
      await sleep(300);
    }
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
    console.log('errors', JSON.stringify(h.errors));
  } finally {
    await h.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
