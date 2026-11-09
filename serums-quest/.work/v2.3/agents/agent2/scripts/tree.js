'use strict';
const path = require('path');
const fs = require('fs');
const { open, sleep, ROOT } = require(path.resolve(__dirname, '..', '..', '..', 'qa', 'cdp.js'));
const save = JSON.parse(fs.readFileSync(path.resolve(ROOT, '.work', 'v2', 'qa', 'save-full.json'), 'utf8'));
(async () => {
  const b = await open({ port: 9542, width: 1308, height: 662, bundle: path.resolve(ROOT, '.work', 'v2.3', 'preview', 'a2.html') });
  try {
    await b.seed(save);
    await b.ev('window.__v23Visor.openShop()');
    await sleep(1000);
    await b.ev("window.__v23Visor.select('c-marco-bronce')");
    await sleep(500);
    console.log(JSON.stringify(await b.ev('window.__v23Visor.tree()'), null, 1));
    const info = await b.ev('window.__v23Visor.info()');
    console.log('CAM', JSON.stringify(info.camera));
    console.log('EFFECT', JSON.stringify(info.effect));
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
