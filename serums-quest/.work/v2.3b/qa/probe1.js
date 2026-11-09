'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../v2.3/qa/cdp.js');
const OUT = path.resolve(__dirname, '..', 'evidence', 'probe1');
const SAVE = path.resolve(__dirname, '..', '..', 'v2.3', 'qa', 'save-v23-all.json');
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await open({ port: 9561, profile: path.join(__dirname, 'profiles', 'probe1'), bundle: path.join(ROOT, 'dist', 'index.html'), width: 1280, height: 720 });
  try {
    await h.seed(JSON.parse(fs.readFileSync(SAVE, 'utf8')), { reload: true });
    await sleep(1800);
    await h.ev("(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); return true; })()");
    const info = await h.ev(`(() => ({
      ready: window.__v23b && window.__v23b.ready(),
      failed: window.__v23b && window.__v23b.failed(),
      version: window.__v23b && window.__v23b.version,
      mode: window.__v23b && window.__v23b.mode(),
      active: window.__v23b && window.__v23b.active(),
      zone: window.__v23b && window.__v23b.zone(),
      framing: window.__v23b && window.__v23b.framing(),
      margins: window.__v23b && window.__v23b.projectedMargins(),
      stats: window.__v23b && window.__v23b.stats(),
      errors: window.__v23b && window.__v23b.errors(),
      v23: window.__v23 && window.__v23.snapshot ? window.__v23.snapshot() : null,
      canvases: Array.from(document.querySelectorAll('canvas')).map(c => ({ id: c.id, cls: c.className, w: c.width, h: c.height, rect: (() => { const r=c.getBoundingClientRect(); return [Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)]; })() })),
      titleRect: (() => { const r=document.querySelector('.titleScreen'); return r ? [Math.round(r.getBoundingClientRect().width), Math.round(r.getBoundingClientRect().height)] : null; })(),
      logo: (() => { const el=document.querySelector('.v23wLogo'); if(!el) return null; const r=el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), fs: getComputedStyle(el).fontSize }; })(),
      stage: (() => { const r=document.querySelector('.v23wStage'); if(!r) return null; const b=r.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height), r.className]; })(),
      copy: (() => { const r=document.querySelector('.v23wCopy'); if(!r) return null; const b=r.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; })()
    }))()`);
    console.log(JSON.stringify(info, null, 1));
    await h.shot(path.join(OUT, 'welcome-1280.png'));
    await h.ev("(() => { window.__v23welcome.open('title'); return true; })()");
    await sleep(1200);
    const tut = await h.ev(`(() => ({
      active: window.__v23welcome.tutorialState(),
      mode: window.__v23b.mode(), step: window.__v23b.step(), zone: window.__v23b.zone(), margins: window.__v23b.projectedMargins(),
      panel: (() => { const r=document.querySelector('.v23tutPanel'); if(!r) return null; const b=r.getBoundingClientRect(); return [Math.round(b.x),Math.round(b.y),Math.round(b.width),Math.round(b.height),r.scrollHeight]; })(),
      scene: (() => { const r=document.querySelector('.v23tutScene'); if(!r) return null; const b=r.getBoundingClientRect(); return [Math.round(b.x),Math.round(b.y),Math.round(b.width),Math.round(b.height)]; })(),
      title: (() => { const r=document.querySelector('#v23TutTitle'); if(!r) return null; const b=r.getBoundingClientRect(); return [Math.round(b.x),Math.round(b.y),Math.round(b.width),Math.round(b.height),getComputedStyle(r).fontSize]; })()
    }))()`);
    console.log('TUT', JSON.stringify(tut, null, 1));
    await h.shot(path.join(OUT, 'tutorial-0-1280.png'));
    await h.ev("(() => { window.__v23welcome.stepTo(3); return true; })()");
    await sleep(1100);
    await h.shot(path.join(OUT, 'tutorial-3-1280.png'));
    console.log('errors', JSON.stringify(h.errors));
    console.log('warnings', JSON.stringify(h.warnings.slice(0, 10)));
  } finally { await h.close(); }
})().catch(e => { console.error(e); process.exit(1); });
