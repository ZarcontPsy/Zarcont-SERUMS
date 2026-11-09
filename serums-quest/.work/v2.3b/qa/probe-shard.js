'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../v2.3/qa/cdp.js');
const OUT = path.resolve(__dirname, '..', 'evidence', 'debug');
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await open({ port: 9569, profile: path.join(__dirname, 'profiles', 'debug'), bundle: path.join(ROOT, 'dist', 'index.html'), width: 390, height: 844 });
  try {
    await h.seed(JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8')), { reload: true });
    await sleep(2000);
    await h.ev("(() => { document.getElementById('v23bCinema').style.opacity = '0'; return true; })()");
    await sleep(300);
    await h.shot(path.join(OUT, '390-canvas-off.png'));
    await h.ev("(() => { const c=document.getElementById('v23bCinema'); c.style.opacity='1'; document.querySelector('.v23wShell').style.visibility='hidden'; return true; })()");
    await sleep(300);
    await h.shot(path.join(OUT, '390-ui-off.png'));
    const info = await h.ev(`(() => ({
      scenes: window.__v23b.scene().children.map(o => ({ name: o.name, type: o.type, visible: o.visible, pos: [o.position.x,o.position.y,o.position.z] })),
      canvasZ: getComputedStyle(document.getElementById('v23bCinema')).zIndex,
      titleBg: getComputedStyle(document.querySelector('.titleScreen')).backgroundColor
    }))()`);
    console.log(JSON.stringify(info, null, 1));
  } finally { await h.close(); }
})().catch(e => { console.error(e); process.exit(1); });
