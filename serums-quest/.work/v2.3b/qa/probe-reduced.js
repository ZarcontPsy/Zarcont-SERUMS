'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { open, sleep, ROOT } = require('../../v2.3/qa/cdp.js');
const A = path.resolve(__dirname, '..', 'evidence', 'after', 'red-a.png');
const B = path.resolve(__dirname, '..', 'evidence', 'after', 'red-b.png');
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
(async () => {
  const h = await open({ port: 9568, profile: path.join(__dirname, 'profiles', 'red'), bundle: path.join(ROOT, 'dist', 'index.html'), width: 1280, height: 720 });
  try {
    await h.seed(JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8')), { reload: true });
    await sleep(1800);
    await h.ev("(() => { window.__v23.setReducedMotion(true); return true; })()");
    await sleep(1000);
    await h.shot(A); await sleep(900); await h.shot(B);
    console.log('same', sha(A) === sha(B), sha(A).slice(0, 12), sha(B).slice(0, 12));
    console.log(await h.ev("({ reduced: window.__v23b.reduced(), mode: window.__v23b.mode() })"));
  } finally { await h.close(); }
})().catch(e => { console.error(e); process.exit(1); });
