'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('./cdp');
const save = JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8'));
(async () => {
  const s = await open({ bundle: path.join(ROOT, '.work', 'v2.3', 'preview', 'combined.html'), port: 9538, width: 1308, height: 662 });
  await s.seed(save);
  await sleep(500);
  console.log('before', await s.ev(`({screen: window.__v23.screen(), screenHtml: document.querySelector('#screen').innerHTML.length, hasShop: !!document.querySelector('.shopShell')})`));
  console.log('call', await s.ev(`(() => { try { const r=window.__v23.openShop(); return { r, screen: window.__v23.screen(), html: document.querySelector('#screen').innerHTML.slice(0,200) }; } catch(e){ return {error:String(e),stack:String(e&&e.stack)}; } })()`));
  await sleep(1500);
  console.log('after', await s.ev(`({screen: window.__v23.screen(), html: document.querySelector('#screen').innerHTML.slice(0,400), shopShell: !!document.querySelector('.shopShell'), body: document.body.innerText.slice(0,300)})`));
  console.log('errors', JSON.stringify(s.errors.slice(0, 10), null, 1));
  await s.close();
})();
