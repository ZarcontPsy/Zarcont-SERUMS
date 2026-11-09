'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../v2.3/qa/cdp.js');
const OUT = path.resolve(__dirname, '..', 'evidence', 'debug');
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await open({ port: 9581, profile: path.join(__dirname, 'profiles', 'motion'), bundle: path.join(ROOT, 'dist', 'index.html'), width: 1280, height: 720 });
  try {
    await h.seed(JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8')), { reload: true });
    await sleep(1800);
    await h.ev("(() => { window.__v23welcome.open('title'); return true; })()");
    await sleep(900);
    await h.shot(path.join(OUT, '1280-step1-keys.png'));
    await h.setViewport(390, 844);
    await sleep(900);
    await h.shot(path.join(OUT, '390-step1-touch.png'));
    const info = await h.ev("({ step: window.__v23b.step(), mode: window.__v23b.mode(), margins: window.__v23b.liveMargins(), errors: window.__v23b.errors() })");
    console.log(info);
  } finally { await h.close(); }
})().catch(e => { console.error(e); process.exit(1); });
