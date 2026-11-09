'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../v2.3/qa/cdp.js');
(async () => {
  const h = await open({ port: 9576, profile: path.join(__dirname, 'profiles', 'probe9'), bundle: path.join(ROOT, 'dist', 'index.html'), width: 390, height: 844 });
  try {
    await h.seed(JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8')), { reload: true });
    await sleep(2000);
    const out = await h.ev(`(() => {
      const scene = window.__v23b.scene();
      const cam = new THREE.PerspectiveCamera(38, innerWidth/innerHeight, 0.1, 120);
      cam.position.set(0,0,0); cam.lookAt(0,0,-1); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
      const points = [[350,430],[345,450],[355,460],[340,480]];
      const res = [];
      const rc = new THREE.Raycaster();
      points.forEach(([x,y]) => {
        const ndc = new THREE.Vector2((x/innerWidth)*2-1, -(y/innerHeight)*2+1);
        rc.setFromCamera(ndc, cam);
        const hits = rc.intersectObjects(scene.children, true).slice(0,6).map(h => ({ type: h.object.type, geo: h.object.geometry && h.object.geometry.type, dist: Math.round(h.distance*10)/10, name: h.object.name, parent: h.object.parent && h.object.parent.name, visible: h.object.visible, color: h.object.material && h.object.material.color ? '#' + h.object.material.color.getHexString() : null, point: [Math.round(h.point.x*10)/10, Math.round(h.point.y*10)/10, Math.round(h.point.z*10)/10] }));
        res.push({ x,y, hits });
      });
      return res;
    })()`);
    console.log(JSON.stringify(out, null, 1));
  } finally { await h.close(); }
})().catch(e => { console.error(e); process.exit(1); });
