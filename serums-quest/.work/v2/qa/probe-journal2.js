'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep } = require('./cdp-lib');
(async () => {
  const save = JSON.parse(fs.readFileSync(path.join(__dirname, 'save-full.json'), 'utf8'));
  const s = await open({ port: 9361 });
  await s.seed(save);
  if (await s.ev("!!document.querySelector('[data-action=menu-continue]')")) await s.click('[data-action="menu-continue"]', 900);
  console.log('screen', (await s.state()).screen);
  await s.key('KeyJ');
  await sleep(700);
  console.log('screenJ', (await s.state()).screen, 'areas', await s.ev("[...document.querySelectorAll('[data-action=select-area]')].length"));
  await s.shot(path.join(__dirname, 'probe-journal2.png'));
  await s.close();
})().catch((e) => { console.error(e); process.exit(1); });
