'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep } = require('./cdp-lib');
const save = JSON.parse(fs.readFileSync(path.join(__dirname, 'save-world-due.json'), 'utf8'));
let S = null;
(async () => {
  const s = await open({ port: 9377, width: 1280, height: 720, gpu: true });
  S = s;
  await s.seed(save);
  if (await s.ev("!!document.querySelector('[data-action=menu-continue]')")) await s.click('[data-action="menu-continue"]', 900);
  if (await s.ev("!!document.querySelector('[data-action=backup-off]')")) await s.click('[data-action="backup-off"]', 200);
  const ok = await s.ev("!!window.__V2.world.interact('v2w-shadow-salud-publica')");
  await sleep(500);
  const info = await s.ev(`(() => {
    const r = document.querySelector('.v2-world-overlay.is-open');
    if (!r) return null;
    return {
      title: (r.querySelector('.v2-world-title') || {}).textContent,
      actions: [...r.querySelectorAll('[data-action]')].map(function (e) { return e.getAttribute('data-action'); }),
      body: (r.querySelector('#v2w-body') || {}).innerText
    };
  })()`);
  console.log(JSON.stringify({ ok: ok, info: info }, null, 2));
  await s.close();
})().catch((e) => { console.error(e); if (S) S.close(); process.exit(1); });
