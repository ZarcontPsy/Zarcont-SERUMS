'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep } = require('./cdp-lib');
const root = path.resolve(__dirname, '..', '..', '..');
const save = JSON.parse(fs.readFileSync(path.join(__dirname, 'save-full.json'), 'utf8'));

(async () => {
  const s = await open({ port: 9356 });
  await s.seed(save);
  console.log('screen0', (await s.state()).screen);
  if (await s.ev("!!document.querySelector('[data-action=menu-continue]')")) await s.click('[data-action="menu-continue"]', 700);
  console.log('screen1', (await s.state()).screen);
  if (!(await s.ev("!!document.querySelector('[data-action=open-journal]')"))) {
    await s.key('KeyJ'); await sleep(500);
  } else {
    await s.click('[data-action="open-journal"]', 500);
  }
  console.log('screen2', (await s.state()).screen);
  console.log('TEXT', (await s.text()).slice(0, 1200).replace(/\n/g, ' | '));
  console.log('ACTIONS', JSON.stringify(await s.ev("[...document.querySelectorAll('[data-action]')].map(e=>e.getAttribute('data-action')+'|'+(e.getAttribute('data-area')||'')+'|'+(e.getAttribute('data-mission')||'')+'|'+(e.textContent||'').trim().slice(0,30)).slice(0,60)")));
  await s.shot(path.join(__dirname, 'probe-journal.png'));
  await s.close();
})().catch((e) => { console.error('ERR', e.stack || e); process.exitCode = 1; });
