'use strict';
/* Runner CDP del harness del duelo (Agente 4).
   Abre Chrome/Edge headless, mide los 8 tamaños exigidos, prueba ataque,
   resize/orientación, intro y safe-area, y guarda capturas + JSON. */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname);
const SHOTS = path.join(ROOT, 'shots');
const HARNESS = path.join(ROOT, 'duel-harness.html');
const PORT = 9481;
const PROFILE = path.join(os.tmpdir(), 'v2d-agent4-chrome-' + process.pid);
const EXE = process.env.V2D_CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SIZES = [
  { w: 390, h: 844, name: '390x844', mobile: true, orientation: 'portraitPrimary' },
  { w: 844, h: 390, name: '844x390', mobile: true, orientation: 'landscapePrimary' },
  { w: 768, h: 1024, name: '768x1024', mobile: true, orientation: 'portraitPrimary' },
  { w: 1024, h: 768, name: '1024x768', mobile: false, orientation: 'landscapePrimary' },
  { w: 820, h: 1180, name: '820x1180', mobile: true, orientation: 'portraitPrimary' },
  { w: 960, h: 540, name: '960x540', mobile: false, orientation: 'landscapePrimary' },
  { w: 1280, h: 720, name: '1280x720', mobile: false, orientation: 'landscapePrimary' },
  { w: 1920, h: 1080, name: '1920x1080', mobile: false, orientation: 'landscapePrimary' }
];
/* Viewport efectivo reportado por QA para 844×390 en Chrome móvil
   (el chrome del navegador reduce el alto útil a ~295 px). */
const EFFECTIVE = { w: 828, h: 295, name: '828x295-effective', mobile: true, orientation: 'landscapePrimary' };

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
async function waitHttp(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (e) {}
    await sleep(120);
  }
  throw new Error('timeout esperando ' + url);
}

async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = (e) => reject(new Error('ws error ' + (e && e.message || '')));
  });
  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.onmessage = (ev) => {
    let msg;
    try { msg = JSON.parse(ev.data); } catch (e) { return; }
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
      else p.resolve(msg.result);
      return;
    }
    for (const fn of listeners) fn(msg);
  };
  return {
    ws,
    send(method, params) {
      const mid = ++id;
      return new Promise((resolve, reject) => {
        pending.set(mid, { resolve, reject });
        ws.send(JSON.stringify({ id: mid, method, params: params || {} }));
      });
    },
    on(fn) { listeners.push(fn); },
    close() { try { ws.close(); } catch (e) {} }
  };
}

async function evalIn(page, expression, awaitPromise) {
  const res = await page.send('Runtime.evaluate', {
    expression,
    awaitPromise: !!awaitPromise,
    returnByValue: true,
    userGesture: true
  });
  if (res.exceptionDetails) {
    const d = res.exceptionDetails;
    throw new Error('evaluate: ' + (d.text || '') + ' ' + JSON.stringify(d.exception && d.exception.description || ''));
  }
  return res.result && res.result.value;
}

async function screenshot(page, name) {
  const res = await page.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  fs.writeFileSync(path.join(SHOTS, name + '.png'), Buffer.from(res.data, 'base64'));
}

async function setViewport(page, size) {
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: size.w,
    height: size.h,
    deviceScaleFactor: 1,
    mobile: !!size.mobile,
    screenOrientation: { type: size.orientation, angle: size.orientation === 'portraitPrimary' ? 0 : 90 }
  });
  try {
    await page.send('Emulation.setTouchEmulationEnabled', { enabled: !!size.mobile, maxTouchPoints: 5 });
  } catch (e) {}
  /* Safe-area real si el protocolo lo soporta (Chrome reciente). */
  try {
    await page.send('Emulation.setSafeAreaInsets', {
      insets: size.mobile ? { top: 0, left: 0, bottom: 0, right: 0 } : { top: 0, left: 0, bottom: 0, right: 0 }
    });
  } catch (e) {}
  await sleep(260);
}

(async () => {
  ensureDir(SHOTS);
  const chromeArgs = [
    '--headless=new',
    '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + PROFILE,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--hide-scrollbars',
    '--allow-file-access-from-files',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
    '--force-device-scale-factor=1',
    'file:///' + HARNESS.replace(/\\/g, '/')
  ];
  const child = spawn(EXE, chromeArgs, { detached: true, stdio: 'ignore' });
  child.unref();
  let page = null;
  let browser = null;
  const errors = [];
  try {
    const version = await waitHttp('http://127.0.0.1:' + PORT + '/json/version', 12000);
    browser = await connect(version.webSocketDebuggerUrl);
    let list = await waitHttp('http://127.0.0.1:' + PORT + '/json/list', 8000);
    let target = list.find((t) => t.type === 'page' && t.url.indexOf('duel-harness.html') !== -1);
    if (!target) {
      const created = await fetch('http://127.0.0.1:' + PORT + '/json/new?' + encodeURIComponent('file:///' + HARNESS.replace(/\\/g, '/')), { method: 'PUT' });
      target = await created.json();
    }
    page = await connect(target.webSocketDebuggerUrl);
    page.on((msg) => {
      if (msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params.exceptionDetails;
        errors.push((d.text || '') + ' ' + (d.exception && d.exception.description || ''));
      } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        errors.push(msg.params.args.map((a) => a.value || a.description || '').join(' '));
      } else if (msg.method === 'Log.entryAdded' && msg.params.entry && msg.params.entry.level === 'error') {
        errors.push(msg.params.entry.text);
      }
    });
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('Log.enable');
    await page.send('Page.navigate', { url: 'file:///' + HARNESS.replace(/\\/g, '/') + '?t=' + Date.now() });
    await sleep(1600);

    const results = { generatedAt: new Date().toISOString(), sizes: [], resize: null, safe: null, intro: null, errors };
    results.api = await evalIn(page, "(() => { const a = ['mount','unmount','onAttack','afterCamera','onDuelStart','onDuelEnd','isActive']; return { contract: a.every((k) => typeof V2.duel[k] === 'function'), extras: { metrics: typeof V2.duel.metrics === 'function', refresh: typeof V2.duel.refresh === 'function' }, version: V2.duel.metrics ? V2.duel.metrics().version : null }; })()", false);
    console.log('API', JSON.stringify(results.api));
    for (const size of SIZES) {
      await setViewport(page, size);
      const prepared = await evalIn(page, '__H.prepare()', true);
      await sleep(450);
      const m = await evalIn(page, '__H.measure()', false);
      await screenshot(page, size.name + '-question');
      results.sizes.push({ size, prepared: prepared && prepared.viewport, measure: m });
      console.log(size.name, 'panel', m.panel && (m.panel.h + 'px/' + m.panel.hPct + '% h, ' + m.panel.w + 'px/' + m.panel.wPct + '% w, area ' + m.panel.areaPct + '%'),
        'free', Math.round(m.metrics.free.w) + 'x' + Math.round(m.metrics.free.h),
        'zoom', m.metrics.camera.zoom.toFixed(3),
        'offset', Math.round(m.metrics.camera.offsetX) + ',' + Math.round(m.metrics.camera.offsetY),
        'pair', m.pair.w + 'x' + m.pair.h,
        'fits', m.pair.fitsX && m.pair.fitsY,
        'coarse', m.coarse, 'rotate', m.rotateDisplay,
        'answersVisible', m.answers && m.answers.allVisible,
        'margins', m.pair.marginLeft + '/' + m.pair.marginRight + '/' + m.pair.marginTop + '/' + m.pair.marginBottom);
    }

    /* Estrés de opciones largas (más que el máximo real del banco). */
    results.stress = [];
    for (const name of ['390x844', '844x390']) {
      const size = SIZES.find((s) => s.name === name);
      await setViewport(page, size);
      await evalIn(page, '__H.prepare()', true);
      await sleep(350);
      const stress = await evalIn(page, '__H.setLongOptions()', true);
      await screenshot(page, name + '-stress-options');
      results.stress.push({ name, measure: stress });
      console.log(name, 'stress panelH', stress.panel && stress.panel.h, 'qH', stress.metrics && stress.metrics.panel && stress.panel.overflow,
        'fits', stress.pair.fitsX && stress.pair.fitsY);
    }

    /* Viewport efectivo 828×295 (móvil apaisado real, chrome del navegador). */
    await setViewport(page, EFFECTIVE);
    await evalIn(page, '__H.prepare()', true);
    await sleep(450);
    const effective = await evalIn(page, '__H.measure()', false);
    await screenshot(page, EFFECTIVE.name + '-question');
    results.effective = effective;
    console.log(EFFECTIVE.name, 'dock', effective.metrics.dock,
      'panel', effective.panel.w + 'x' + effective.panel.h,
      'answers', effective.answers.count, effective.answers.allVisible,
      'body', effective.answers.bodyScrollH + '/' + effective.answers.bodyClientH,
      'fits', effective.pair.fitsX && effective.pair.fitsY);
    /* Estrés de opciones en el viewport efectivo. */
    await evalIn(page, '__H.setLongOptions()', true);
    await screenshot(page, EFFECTIVE.name + '-stress-options');

    /* Ataque en los dos tamaños extremos. */
    for (const name of ['390x844', '844x390']) {
      const size = SIZES.find((s) => s.name === name);
      await setViewport(page, size);
      await evalIn(page, '__H.prepare()', true);
      await sleep(450);
      const before = await evalIn(page, '__H.beginAttack()', false);
      await sleep(280);
      const during = await evalIn(page, '__H.attackDuring(0)', true);
      await screenshot(page, name + '-attack');
      const after = await evalIn(page, '__H.attackAfter()', true);
      await screenshot(page, name + '-feedback');
      results['attack_' + name] = { before, during, after };
      console.log(name, 'attack', 'barH', during.panel && during.panel.h, 'class', /v2d-attacking/.test(during.bodyClass),
        'afterH', after.panel && after.panel.h, 'classAfter', /v2d-attacking/.test(after.bodyClass));
    }

    /* Resize/orientación sin recargar: 390x844 -> 844x390. */
    await setViewport(page, SIZES[0]);
    await evalIn(page, '__H.prepare()', true);
    await sleep(450);
    const portrait = await evalIn(page, '__H.measure()', false);
    await setViewport(page, SIZES[1]);
    await sleep(650);
    const landscape = await evalIn(page, '__H.measure()', false);
    await screenshot(page, 'resize-390x844-to-844x390');
    results.resize = { portrait, landscape };
    console.log('resize', portrait.metrics.dock, '->', landscape.metrics.dock,
      'fits', landscape.pair.fitsX && landscape.pair.fitsY);

    /* Safe area simulada (notch) a 390x844 y 844x390. */
    await setViewport(page, SIZES[0]);
    await evalIn(page, '__H.prepare()', true);
    await sleep(300);
    const safePortrait = await evalIn(page, '__H.safeArea(44, 0, 34, 0)', false);
    await screenshot(page, 'safearea-390x844');
    await setViewport(page, SIZES[1]);
    await sleep(300);
    const safeLandscape = await evalIn(page, '__H.safeArea(0, 44, 21, 44)', false);
    await screenshot(page, 'safearea-844x390');
    await evalIn(page, '__H.clearSafeArea()', false);
    results.safe = { portrait: safePortrait, landscape: safeLandscape };
    console.log('safe-area portrait top/h', safePortrait.metrics.topHud, safePortrait.metrics.free.h,
      'landscape free', safeLandscape.metrics.free.w + 'x' + safeLandscape.metrics.free.h);

    /* unmount: restaura zoom/offset y limpia clases; remount vuelve a encuadrar. */
    await setViewport(page, SIZES[0]);
    await evalIn(page, '__H.prepare()', true);
    await sleep(350);
    const unmount = await evalIn(page, '__H.unmountTest()', true);
    results.unmount = unmount;
    console.log('unmount before/after zoom', unmount.before.zoom.toFixed(3), unmount.after.zoom.toFixed(3),
      'view', unmount.before.view, '->', unmount.after.view,
      'active', unmount.before.active, '->', unmount.after.active,
      'remount fits', unmount.remounted.pair.fitsX && unmount.remounted.pair.fitsY);

    /* Intro: la cámara entra desde lejos; debe encuadrar igual. */
    await setViewport(page, SIZES[0]);
    await sleep(200);
    await evalIn(page, '__H.intro()', true);
    await sleep(300);
    const intro = await evalIn(page, '__H.measure()', false);
    await screenshot(page, 'intro-390x844');
    results.intro = intro;
    console.log('intro fits', intro.pair.fitsX && intro.pair.fitsY, 'zoom', intro.metrics.camera.zoom.toFixed(3));

    fs.writeFileSync(path.join(ROOT, 'harness-results.json'), JSON.stringify(results, null, 2));
    console.log('errors', errors.length, errors.slice(0, 3));
    console.log('resultados:', path.join(ROOT, 'harness-results.json'));
  } catch (error) {
    console.error('HARNESS_ERROR', error.stack || error);
    process.exitCode = 1;
  } finally {
    try { if (page) page.close(); } catch (e) {}
    try { if (browser) { await browser.send('Browser.close'); browser.close(); } } catch (e) {}
    await sleep(500);
    try {
      if (process.platform === 'win32') execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } catch (e) {}
    try { fs.rmSync(PROFILE, { recursive: true, force: true, maxRetries: 3, retryDelay: 300 }); } catch (e) {}
  }
})();
