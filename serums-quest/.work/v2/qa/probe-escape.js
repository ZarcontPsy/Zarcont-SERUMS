'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep } = require('./cdp-lib');
const save = JSON.parse(fs.readFileSync(path.join(__dirname, 'save-world-empty.json'), 'utf8'));
let S = null;
(async () => {
  const s = await open({ port: 9375, width: 1280, height: 720, gpu: true });
  S = s;
  await s.seed(save);
  if (await s.ev("!!document.querySelector('[data-action=menu-continue]')")) await s.click('[data-action="menu-continue"]', 900);
  if (await s.ev("!!document.querySelector('[data-action=backup-off]')")) await s.click('[data-action="backup-off"]', 200);
  const pos0 = (await s.state()).hero;
  await s.key('KeyE'); await sleep(450);
  const open1 = await s.ev("!!document.querySelector('.v2-world-overlay.is-open')");
  // Intentar mover con el panel abierto
  await s.key('ArrowLeft'); await sleep(500);
  const pos1 = (await s.state()).hero;
  await s.key('Escape'); await sleep(450);
  const open2 = await s.ev("!!document.querySelector('.v2-world-overlay.is-open')");
  await s.key('Escape'); await sleep(450);
  const screen = (await s.state()).screen;
  console.log(JSON.stringify({ open1, pos0, pos1, movedWhileOpen: pos0.x !== pos1.x || pos0.y !== pos1.y, open2, screenAfterEsc: screen, errors: s.errors }, null, 2));
  await s.close();
})().catch((e) => { console.error(e); if (S) S.close(); process.exit(1); });
