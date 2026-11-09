'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../v2.3/qa/cdp.js');
const OUT = path.resolve(__dirname, '..', 'evidence', 'debug');
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await open({ port: 9572, profile: path.join(__dirname, 'profiles', 'probe5'), bundle: path.join(ROOT, 'dist', 'index.html'), width: 390, height: 844 });
  try {
    await h.seed(JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8')), { reload: true });
    await sleep(2000);
    const info = await h.ev(`(() => {
      window.__clusters = [];
      window.__v23b.scene().traverse(o => { if (o.isInstancedMesh) window.__clusters.push(o); });
      return { instanced: window.__clusters.length, groups: window.__v23b.scene().children.map(c => c.name + ':' + c.visible) };
    })()`);
    console.log(info);
    await h.ev("(() => { document.getElementById('game').style.display='none'; return true; })()");
    await sleep(300);
    await h.shot(path.join(OUT, '390-no-game.png'));
    await h.ev("(() => { document.getElementById('game').style.display=''; document.getElementById('v23bCinema').style.display='none'; document.getElementById('game').style.filter='brightness(3)'; return true; })()");
    await sleep(300);
    await h.shot(path.join(OUT, '390-no-cinema-bright.png'));
    await h.ev("(() => { const c=document.getElementById('v23bCinema'); c.style.display=''; window.__clusters.forEach(o => o.visible=false); return true; })()");
    await sleep(300);
    await h.shot(path.join(OUT, '390-no-instanced.png'));
  } finally { await h.close(); }
})().catch(e => { console.error(e); process.exit(1); });
