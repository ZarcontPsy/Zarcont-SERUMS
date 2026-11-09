'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../v2.3/qa/cdp.js');
(async () => {
  const h = await open({ port: 9562, profile: path.join(__dirname, 'profiles', 'probe2'), bundle: path.join(ROOT, 'dist', 'index.html'), width: 1280, height: 720 });
  try {
    await h.seed(JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '..', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8')), { reload: true });
    await sleep(1600);
    await h.ev("(() => { window.__v23welcome.open('title'); return true; })()");
    await sleep(800);
    const d = await h.ev(`(() => {
      const stage = document.querySelector('#v23Tutorial .v23tutStage');
      const scene = document.querySelector('#v23Tutorial .v23tutScene');
      const layout = document.querySelector('#v23Tutorial .v23tutLayout');
      const ov = document.querySelector('#v23Tutorial');
      const info = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], display: cs.display, visibility: cs.visibility, position: cs.position, inset: cs.inset, h: cs.height, w: cs.width, overflow: cs.overflow }; };
      return {
        count: document.querySelectorAll('#v23Tutorial [data-v23b-zone="tutorial"]').length,
        stage: info(stage), scene: info(scene), layout: info(layout), overlay: info(ov),
        bodyClass: document.body.className,
        mode: window.__v23b.mode(), step: window.__v23b.step(), zone: window.__v23b.zone()
      };
    })()`);
    console.log(JSON.stringify(d, null, 1));
  } finally { await h.close(); }
})().catch(e => { console.error(e); process.exit(1); });
