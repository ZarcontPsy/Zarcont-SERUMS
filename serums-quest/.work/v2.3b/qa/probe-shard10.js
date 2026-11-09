'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../v2.3/qa/cdp.js');
const OUT = path.resolve(__dirname, '..', 'evidence', 'debug');
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await open({ port: 9578, profile: path.join(__dirname, 'profiles', 'probe11'), bundle: path.join(ROOT, 'dist', 'index.html'), width: 390, height: 844 });
  try {
    await h.seed(JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8')), { reload: true });
    await sleep(2000);
    await h.ev("(() => { document.getElementById('ui').style.display='none'; document.getElementById('game').style.display='none'; return true; })()");
    await sleep(300); await h.shot(path.join(OUT, '390-cinema-only.png'));
    await h.ev("(() => { const s=document.getElementById('v23bCinema'); s.style.display='none'; return true; })()");
    await sleep(300); await h.shot(path.join(OUT, '390-nothing.png'));
  } finally { await h.close(); }
})().catch(e => { console.error(e); process.exit(1); });
