import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const exe = fs.existsSync(EDGE) ? EDGE : CHROME;
const views = process.argv.slice(2).length ? process.argv.slice(2) : ['duel', 'inside', 'close30', 'back', 'side'];
const outDir = path.resolve('shots');
fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: exe,
  headless: true,
  args: [
    '--enable-unsafe-swiftshader',
    '--use-angle=swiftshader',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-dev-shm-usage'
  ]
});

const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 700, deviceScaleFactor: 1 });
const pageErrors = [];
page.on('console', function (m) { if (m.type() === 'error') console.log('[console]', m.text()); });
page.on('pageerror', function (e) { pageErrors.push(e.message); console.log('[pageerror]', e.message); });
const results = {};

for (const view of views) {
  const useOrig = view.indexOf('orig-') === 0;
  const useMotion = view.indexOf('motion-') === 0;
  const rawView = useOrig ? view.slice(5) : (useMotion ? view.slice(7) : view);
  const url = 'http://127.0.0.1:8765/v21/agent2/harness.html?view=' + encodeURIComponent(rawView) +
    (useOrig ? '&src=orig' : '') + (useMotion ? '&motion=1' : '');
  await page.goto(url, {
    waitUntil: 'networkidle0',
    timeout: 60000
  });
  await page.waitForFunction('window.__ready === true', { timeout: 60000 });
  await new Promise(function (r) { setTimeout(r, 200); });
  await page.screenshot({ path: path.join(outDir, view + '.png') });
  const check = await page.evaluate(function () { return window.__check; });
  results[view] = check;
  console.log(view, JSON.stringify(check));
  if (check.mode === 'mesh') {
    const bad = [];
    if (check.pivotLocalX !== 0) bad.push('pivote no está en el borde (x=' + check.pivotLocalX + ')');
    if (!(check.edgeX >= 0.055)) bad.push('borde dentro del palo (edgeX=' + check.edgeX + ')');
    if (!(check.sweepClear >= 0.009)) bad.push('barrido 360° toca el palo (' + check.sweepClear + ')');
    if (!(check.topClear >= 0.02)) bad.push('tela toca el remate (' + check.topClear + ')');
    if (check.doubleSide !== true) bad.push('material no es DoubleSide');
    if (!(check.edgeAmp <= 1e-6)) bad.push('onda no anclada (' + check.edgeAmp + ')');
    if (bad.length) throw new Error(view + ' FALLA: ' + bad.join('; '));
  }
}

fs.writeFileSync(path.join(outDir, 'validation.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  engine: 'three.js 0.187.0 (vendor local, same revision as dist/index.html)',
  source: '../../src/part5-assets.js',
  pageErrors: pageErrors,
  views: results
}, null, 2));

await browser.close();
console.log('OK');
