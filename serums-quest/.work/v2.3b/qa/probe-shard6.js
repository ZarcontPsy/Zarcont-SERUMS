'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../v2.3/qa/cdp.js');
(async () => {
  const h = await open({ port: 9574, profile: path.join(__dirname, 'profiles', 'probe7'), bundle: path.join(ROOT, 'dist', 'index.html'), width: 390, height: 844 });
  try {
    await h.seed(JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8')), { reload: true });
    await sleep(2000);
    const list = await h.ev(`(() => {
      const out = []; let i = 0;
      window.__v23b.scene().traverse(o => {
        if (!o.isMesh && !o.isSprite && !o.isPoints && !o.isLine) return;
        if (o.isInstancedMesh) return;
        const p = o.getWorldPosition(new THREE.Vector3());
        out.push({ i: i++, type: o.type, geo: o.geometry && o.geometry.type, pos: [Math.round(p.x*10)/10, Math.round(p.y*10)/10, Math.round(p.z*10)/10], scale: [Math.round(o.scale.x*10)/10, Math.round(o.scale.y*10)/10], color: o.material && o.material.color ? '#' + o.material.color.getHexString() : null, opacity: o.material && o.material.opacity });
      });
      return out;
    })()`);
    console.log(JSON.stringify(list, null, 1));
  } finally { await h.close(); }
})().catch(e => { console.error(e); process.exit(1); });
