const fs = require('fs');
const path = require('path');
const campaign = JSON.parse(fs.readFileSync('src/campaign.json', 'utf8'));
const questions = Object.values(campaign.questions);
const byStem = new Map(questions.map((q) => [q.stem, q]));
const fixture = fs.readFileSync('.work/offline-fixture.json', 'utf8');

(async () => {
  const list = await (await fetch('http://127.0.0.1:9333/json/list')).json();
  const target = list.find((x) => x.type === 'page' && x.url.startsWith('file:'));
  if (!target) throw new Error('No file:// page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0;
  const pending = new Map();
  const requests = [];
  const logs = [];
  const exceptions = [];
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
      return;
    }
    if (msg.method === 'Network.requestWillBeSent') requests.push(msg.params.request.url);
    if (msg.method === 'Runtime.consoleAPICalled') logs.push(msg.params.args.map((a) => a.value).join(' '));
    if (msg.method === 'Runtime.exceptionThrown') exceptions.push(msg.params.exceptionDetails.text + ': ' + (msg.params.exceptionDetails.exception && msg.params.exceptionDetails.exception.description || ''));
  };
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const mid = ++id;
      pending.set(mid, { resolve, reject });
      ws.send(JSON.stringify({ id: mid, method, params }));
    });
  }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function evaluate(expression, awaitPromise = false) {
    const res = await send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true, userGesture: true });
    if (res.exceptionDetails) throw new Error(res.exceptionDetails.text + ' ' + (res.exceptionDetails.exception && res.exceptionDetails.exception.description || ''));
    return res.result ? res.result.value : undefined;
  }
  async function waitFor(expr, timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await evaluate(expr)) return true;
      await sleep(80);
    }
    return false;
  }
  async function click(selector) {
    const ok = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; el.click(); return true; })()`);
    if (!ok) throw new Error('Click target missing: ' + selector);
    await sleep(120);
  }
  async function shot(name) {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join('docs', name), Buffer.from(r.data, 'base64'));
    return name;
  }
  async function localStorageState() {
    const raw = await evaluate("localStorage.getItem('serumsquest:voxel:state:v1')");
    return raw ? JSON.parse(raw) : null;
  }
  async function localStorageSettings() {
    const raw = await evaluate("localStorage.getItem('serumsquest:voxel:settings:v1')");
    return raw ? JSON.parse(raw) : null;
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Page.reload', { ignoreCache: true });
  await sleep(2400);
  const result = { file: target.url, menu: false, importOk: false, shopOk: false, equipOk: false, map: false, victory: false, defeat: false, review: false, reloadPersistence: false, network: [], fps: {}, screenshots: [] };

  result.menu = await evaluate("!!document.querySelector('.titleScreen')");
  const menuText = await evaluate('document.body.innerText');
  result.menuLabels = ['Mapa', 'Arena', 'Inventario', 'Tienda', 'Bitácora', 'Ajustes', 'Importar'].filter((x) => menuText.includes(x));
  result.screenshots.push(await shot('offline-final-menu.png'));

  await click('[data-action="open-settings"]');
  await waitFor("!!document.querySelector('.settingsPanel')");
  result.settings = await evaluate("!!document.querySelector('.settingsPanel')");
  await evaluate("(() => { const el=document.querySelector('[data-volume]'); if(!el)return; el.value=42; el.dispatchEvent(new Event('input',{bubbles:true})); document.querySelector('[data-action=toggle-reduced-motion]').click(); document.querySelector('[data-action=set-effects-quality][data-quality=bajo]').click(); return true; })()");
  await sleep(250);
  result.reducedMotion = await evaluate("document.body.classList.contains('reduced-motion')");
  result.settingsSaved = await localStorageSettings();
  await click('[data-action="close-settings"]');

  await click('[data-action="open-import"]');
  await waitFor("!!document.querySelector('#legacyText')");
  await evaluate(`(() => { document.querySelector('#legacyText').value = ${JSON.stringify(fixture)}; return true; })()`);
  await click('[data-action="legacy-analyze"]');
  await sleep(250);
  await click('[data-action="import-confirm"]');
  await sleep(1200);
  const imported = await localStorageState();
  result.importOk = !!(imported && imported.profile && imported.profile.name === 'Offline QA');
  result.importedProfile = imported && imported.profile;

  await click('[data-action="open-shop"]');
  await waitFor("!!document.querySelector('[data-action=shop-item][data-id=\"c-accesorios-brujula\"]')");
  await click('[data-action="shop-item"][data-id="c-accesorios-brujula"]');
  await waitFor("!!document.querySelector('[data-action=shop-buy][data-id=\"c-accesorios-brujula\"]')");
  await click('[data-action="shop-buy"][data-id="c-accesorios-brujula"]');
  await waitFor("!!document.querySelector('[data-action=shop-confirm][data-id=\"c-accesorios-brujula\"]')");
  await click('[data-action="shop-confirm"][data-id="c-accesorios-brujula"]');
  await sleep(500);
  let stateNow = await localStorageState();
  result.shopOk = !!(stateNow && stateNow.collection.ownedCosmeticIds.includes('c-accesorios-brujula') && stateNow.coins === 2425);
  result.shopState = stateNow ? { coins: stateNow.coins, owned: stateNow.collection.ownedCosmeticIds.length } : null;
  result.screenshots.push(await shot('offline-final-shop.png'));
  await click('[data-action="close-sheet"]');
  await sleep(250);

  await click('[data-action="open-wardrobe"]');
  await waitFor("!!document.querySelector('[data-action=wardrobe-slot][data-slot=accesorios]')");
  await click('[data-action="wardrobe-slot"][data-slot="accesorios"]');
  await sleep(300);
  await click('[data-action="wardrobe-item"][data-id="c-accesorios-brujula"]');
  await sleep(250);
  await click('[data-action="wardrobe-save"]');
  await sleep(500);
  stateNow = await localStorageState();
  result.equipOk = !!(stateNow && stateNow.collection.equipped && stateNow.collection.equipped.ilan && stateNow.collection.equipped.ilan.accesorios === 'c-accesorios-brujula');
  result.screenshots.push(await shot('offline-final-wardrobe.png'));
  await click('[data-action="close-sheet"]');
  await sleep(300);

  await send('Page.reload', { ignoreCache: true });
  await sleep(2200);
  const afterReload = await localStorageState();
  result.reloadPersistence = !!(afterReload && afterReload.profile && afterReload.profile.name === 'Offline QA' && afterReload.collection.equipped && afterReload.collection.equipped.ilan && afterReload.collection.equipped.ilan.accesorios === 'c-accesorios-brujula');

  await click('[data-action="open-map"]');
  await waitFor("!!document.querySelector('.mapScreen')");
  await sleep(800);
  result.map = await evaluate("!!document.querySelector('.mapScreen')");
  result.screenshots.push(await shot('offline-final-map.png'));

  const hasMapStart = await evaluate("!!document.querySelector('[data-action=map-start]')");
  if (hasMapStart) {
    await click('[data-action="map-start"]');
    await waitFor("!!document.querySelector('.duelPanel')", 3000);
    const combat = await evaluate(`(async () => {
      const samples = [];
      for (let i = 0; i < 220; i++) {
        const st = window.__gameState();
        if (st && st.fps) samples.push(st.fps);
        if (!document.querySelector('.resultScreen')) window.__autoplay();
        await new Promise((r) => setTimeout(r, 100));
        if (document.querySelector('.resultScreen')) break;
      }
      return { fps: samples, phase: window.__gameState().phase, result: !!document.querySelector('.resultScreen'), text: document.body.innerText, state: window.__gameState() };
    })()`, true);
    result.victory = combat.phase === 'won' || /La ruta queda sellada|Ruta superada/.test(combat.text);
    result.fps.duelSamples = combat.fps;
    result.victoryState = combat.state;
    result.screenshots.push(await shot('offline-final-victory.png'));
    const cont = await evaluate("!!document.querySelector('[data-action=result-continue]')");
    if (cont) { await click('[data-action="result-continue"]'); await sleep(700); }
  }
  await click('[data-action="map-area"][data-area="area-psi-cuidado-integral"]');
  await sleep(500);
  await click('[data-action="map-full"]');
  await sleep(300);

  await click('[data-action="open-review"]');
  await sleep(400);
  const inReview = await evaluate("!!document.querySelector('.duelPanel')");
  result.review = inReview;
  let defeatText = '';
  if (inReview) {
    for (let qn = 0; qn < 6; qn++) {
      if (await evaluate("!!document.querySelector('.resultScreen')")) break;
      const data = await evaluate("(() => ({ stem: document.querySelector('.questionText') ? document.querySelector('.questionText').innerText : '', opts: Array.from(document.querySelectorAll('.answerBtn')).map(b => ({ letter: b.getAttribute('data-letter'), text: b.innerText })) }))()");
      const source = byStem.get(data.stem);
      const correct = source ? source.answer : null;
      const wrong = data.opts.find((o) => o.letter !== correct) || data.opts[0];
      if (!wrong) break;
      await click(`[data-action="answer"][data-letter="${wrong.letter}"]`);
      await sleep(400);
      if (await evaluate("!!document.querySelector('.resultScreen')")) break;
      const next = await evaluate("!!document.querySelector('[data-action=next-question]')");
      if (next) { await click('[data-action="next-question"]'); await sleep(300); }
    }
    defeatText = await evaluate("document.querySelector('.resultScreen') ? document.body.innerText : ''");
    result.defeat = /La memoria vuelve|repaso|tarea abierta|pregunta/i.test(defeatText) && !!(await evaluate("!!document.querySelector('.resultScreen')"));
    result.screenshots.push(await shot('offline-final-review-defeat.png'));
  }

  await send('Page.reload', { ignoreCache: true });
  await sleep(2000);
  result.finalReload = !!(await evaluate("!!document.querySelector('.titleScreen')"));
  const finalState = await localStorageState();
  result.finalCoins = finalState && finalState.coins;
  result.finalEquipped = finalState && finalState.collection.equipped && finalState.collection.equipped.ilan;
  result.network = Array.from(new Set(requests)).filter((u) => /^https?:/i.test(u));
  result.exceptions = exceptions;
  result.console = logs.slice(0, 20);
  fs.writeFileSync('.work/offline-verification.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  ws.close();
})().catch((err) => { console.error('VERIFY_ERROR', err.stack || err); process.exitCode = 1; });
