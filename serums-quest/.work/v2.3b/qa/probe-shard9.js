'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../v2.3/qa/cdp.js');
const OUT = path.resolve(__dirname, '..', 'evidence', 'debug');
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await open({ port: 9577, profile: path.join(__dirname, 'profiles', 'probe10'), bundle: path.join(ROOT, 'dist', 'index.html'), width: 390, height: 844 });
  try {
    await h.seed(JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8')), { reload: true });
    await sleep(2000);
    const setup = await h.ev(`(() => {
      const bg = window.__v23b.scene().children.find(c => c.name === 'v23b-backdrop');
      window.__bg = bg;
      window.__cl = bg.children.filter(c => c.isGroup && c.children.some(x => x.isInstancedMesh));
      return { children: bg.children.length, clusters: window.__cl.length, types: bg.children.map(c => c.type + ':' + (c.geometry ? c.geometry.type : '') + ':' + c.children.length) };
    })()`);
    console.log(setup);
    await h.ev("(() => { window.__cl.forEach(c=>c.visible=false); return true; })()");
    await sleep(300); await h.shot(path.join(OUT, '390-hide-clusters-only.png'));
    await h.ev("(() => { window.__cl.forEach(c=>c.visible=true); window.__bg.children.forEach(c=>{ if(window.__cl.indexOf(c)===-1) c.visible=false; }); return true; })()");
    await sleep(300); await h.shot(path.join(OUT, '390-hide-nonclusters.png'));
  } finally { await h.close(); }
})().catch(e => { console.error(e); process.exit(1); });
