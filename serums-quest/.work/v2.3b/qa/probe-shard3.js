'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../v2.3/qa/cdp.js');
const OUT = path.resolve(__dirname, '..', 'evidence', 'debug');
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await open({ port: 9571, profile: path.join(__dirname, 'profiles', 'probe4'), bundle: path.join(ROOT, 'dist', 'index.html'), width: 390, height: 844 });
  try {
    await h.seed(JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8')), { reload: true });
    await sleep(2000);
    const variants = [
      ['all', ''],
      ['no-copy-before', '.v23wCopy::before{display:none!important}'],
      ['no-scrim', '.v23bScrim{display:none!important}'],
      ['no-title-after', '.titleScreen.v23w::after{display:none!important}'],
      ['no-copy-bg', '.v23wCopy::before{display:none!important}.v23bScrim{display:none!important}'],
      ['no-bg-el', '.v23wBg{display:none!important}.v23wCopy::before{display:none!important}.v23bScrim{display:none!important}.titleScreen.v23w::after{display:none!important}']
    ];
    for (const [name, css] of variants) {
      await h.ev(`(() => { let st=document.getElementById('__dbg'); if(st) st.remove(); if(${JSON.stringify(css)}) { st=document.createElement('style'); st.id='__dbg'; st.textContent=${JSON.stringify(css)}; document.head.appendChild(st); } return true; })()`);
      await sleep(300);
      await h.shot(path.join(OUT, '390-' + name + '.png'));
    }
  } finally { await h.close(); }
})().catch(e => { console.error(e); process.exit(1); });
