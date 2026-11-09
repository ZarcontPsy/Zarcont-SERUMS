'use strict';
const path = require('path');
const { open, sleep, ROOT } = require('./cdp');
(async () => {
  const s = await open({ bundle: path.join(ROOT, '.work', 'v2.3', 'preview', 'int.html'), port: 9534, width: 1280, height: 720 });
  await s.seed(JSON.parse(require('fs').readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8')));
  await sleep(600);
  const out = await s.ev(`(() => ({
    v23: window.__v23 ? window.__v23.snapshot() : null,
    api: window.__v23 ? Object.keys(window.__v23) : null,
    buttons: [...document.querySelectorAll('.titleScreen button')].map(b => (b.textContent || '').trim()).slice(0, 6)
  }))()`);
  console.log(JSON.stringify(out, null, 2));
  console.log('errors', JSON.stringify((s.errors || []).slice(0, 5), null, 1));
  await s.close();
})();
