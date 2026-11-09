'use strict';
/* QA extra Fase 2: reducción de movimiento en cosméticos 3D y calidad. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { open, sleep, ROOT } = require('../../v2.3/qa/cdp.js');
const EV = path.join(ROOT, '.work', 'v2.3', 'evidence');
const QA = path.join(EV, 'qa');
const BUNDLE = path.join(ROOT, 'dist', 'index.html');
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
function pixelDiff(a, b) {
  const code = [
    'from PIL import Image, ImageChops',
    'import numpy as np, sys, json',
    'a=Image.open(sys.argv[1]).convert("RGB"); b=Image.open(sys.argv[2]).convert("RGB")',
    'd=np.array(ImageChops.difference(a,b))',
    'print(json.dumps({"max":int(d.max()),"changed":int((d.max(axis=2)>2).sum())}))'
  ].join('\n');
  try { return JSON.parse(execFileSync(process.env.PYTHON || 'C:\\Python313\\python.exe', ['-c', code, a, b], { encoding: 'utf8' }).trim()); } catch (e) { return null; }
}

(async () => {
  fs.mkdirSync(QA, { recursive: true });
  const h = await open({ port: 9590, profile: path.join(__dirname, 'profiles', 'phase2-extra'), bundle: BUNDLE, width: 1308, height: 662 });
  const out = { startedAt: new Date().toISOString(), cases: {}, errors: [] };
  try {
    await h.seed(JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8')), { reload: true });
    await sleep(900);
    await h.ev("(() => { window.__v23Shop.openShop(); return true; })()");
    await sleep(900);
    await h.ev("(() => { window.__v23Shop.filter('collection', 'todos'); return true; })()");
    await sleep(400);
    await h.ev("(() => { window.__v23Visor.hero('noa'); window.__v23Shop.select('c-efecto-constelacion'); return true; })()");
    await sleep(700);
    await h.shot(path.join(QA, 'motion-normal-a.png')); await sleep(900); await h.shot(path.join(QA, 'motion-normal-b.png'));
    out.cases.normalMoves = sha(path.join(QA, 'motion-normal-a.png')) !== sha(path.join(QA, 'motion-normal-b.png'));
    await h.ev("(() => { window.__v23.setReducedMotion(true); return true; })()");
    await sleep(700);
    await h.shot(path.join(QA, 'motion-reduced-a.png')); await sleep(900); await h.shot(path.join(QA, 'motion-reduced-b.png'));
    const redPixels = pixelDiff(path.join(QA, 'motion-reduced-a.png'), path.join(QA, 'motion-reduced-b.png'));
    out.cases.reducedPixelDiff = redPixels;
    out.cases.reducedStatic = sha(path.join(QA, 'motion-reduced-a.png')) === sha(path.join(QA, 'motion-reduced-b.png')) || (redPixels && redPixels.max <= 2 && redPixels.changed === 0);
    const redInfo = await h.ev("({ reduced: !!(window.__v23 && window.__v23.state && 0), setting: (window.__v23 && window.__v23.snapshot ? window.__v23.snapshot().reducedMotion : null), fps: window.__gameState ? window.__gameState().fps : null })");
    out.reducedInfo = redInfo;
    await h.ev("(() => { window.__v23.setReducedMotion(false); return true; })()");
    for (const q of ['bajo', 'medio', 'alto']) {
      await h.ev(`(() => { window.__v23.setQuality(${JSON.stringify(q)}); return true; })()`);
      await sleep(500);
      const info = await h.ev("(() => { const i=window.__v23Visor.info(); const m=window.__v23Visor.measure(); return { quality: (window.__v23.snapshot()||{}).quality, heroHeight: i.hero && i.hero.height, visible: i.effect && i.effect.visible, pixels: m && m.pixels, fps: window.__gameState ? window.__gameState().fps : null }; })()");
      await h.shot(path.join(QA, 'quality-' + q + '.png'));
      out.cases['quality-' + q] = info;
    }
    out.errors = h.errors;
    out.summary = {
      normalMoves: out.cases.normalMoves,
      reducedStatic: out.cases.reducedStatic,
      allQualitiesVisible: ['bajo', 'medio', 'alto'].every((q) => out.cases['quality-' + q] && out.cases['quality-' + q].visible),
      minFps: Math.min.apply(null, ['bajo', 'medio', 'alto'].map((q) => out.cases['quality-' + q].fps || 0)),
      errors: h.errors.length
    };
    fs.writeFileSync(path.join(QA, 'phase2-extra.json'), JSON.stringify(out, null, 1));
    console.log(JSON.stringify(out.summary, null, 1));
    console.log(JSON.stringify(out.cases, null, 1));
  } finally { await h.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
