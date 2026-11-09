'use strict';
const path = require('path');
const { open, sleep, ROOT } = require('../../qa/cdp');
const PREVIEW = path.join(ROOT, '.work', 'v2.3', 'preview', 'a3.html');
(async () => {
  const s = await open({ bundle: PREVIEW, port: 9543, width: 640, height: 360 });
  try {
    const m = await s.ev(`(() => {
      const host = document.createElement('div');
      host.style.cssText = 'position:fixed;left:0;top:0;width:600px;height:200px;display:flex;align-items:center;gap:5px;z-index:9999;background:#111;';
      for (let i=0;i<4;i++) {
        const lab = document.createElement('label');
        lab.style.cssText = 'display:flex;flex-direction:column;flex:1 1 104px;min-width:0;gap:2px;';
        const span = document.createElement('span'); span.textContent='Ranura'; span.style.display='none';
        const sel = document.createElement('select');
        sel.className='selectMini v23Select';
        for (let j=0;j<13;j++) { const o=document.createElement('option'); o.textContent='Opción '+j; sel.appendChild(o); }
        lab.appendChild(span); lab.appendChild(sel); host.appendChild(lab);
      }
      document.body.appendChild(host);
      const sel = host.querySelector('select');
      const lab = host.querySelector('label');
      const out1 = { sel: Math.round(sel.getBoundingClientRect().height), lab: Math.round(lab.getBoundingClientRect().height), host: Math.round(host.getBoundingClientRect().height) };
      sel.style.flex = '0 0 26px';
      const out2 = { sel: Math.round(sel.getBoundingClientRect().height), lab: Math.round(lab.getBoundingClientRect().height) };
      host.remove();
      return { out1, out2 };
    })()`);
    console.log(JSON.stringify(m, null, 2));
  } finally { await s.close(); }
})();
