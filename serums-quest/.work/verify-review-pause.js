const fs = require('fs');
const campaign = JSON.parse(fs.readFileSync('src/campaign.json', 'utf8'));
const byStem = new Map(Object.values(campaign.questions).map((q) => [q.stem, q]));
const fixture = fs.readFileSync('.work/offline-fixture.json', 'utf8');

(async () => {
  const list = await (await fetch('http://127.0.0.1:9333/json/list')).json();
  const target = list.find((x) => x.type === 'page' && x.url.startsWith('file:'));
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0; const pending = new Map();
  ws.onmessage = (event) => { const msg = JSON.parse(event.data); if (msg.id && pending.has(msg.id)) { const p = pending.get(msg.id); pending.delete(msg.id); msg.error ? p.reject(new Error(JSON.stringify(msg.error))) : p.resolve(msg.result); } };
  const send = (method, params = {}) => new Promise((resolve, reject) => { const mid = ++id; pending.set(mid, { resolve, reject }); ws.send(JSON.stringify({ id: mid, method, params })); });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function ev(expression, awaitPromise = false) { const r = await send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true, userGesture: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text); return r.result && r.result.value; }
  async function waitFor(expr, timeout = 5000) { const t = Date.now(); while (Date.now() - t < timeout) { if (await ev(expr)) return true; await sleep(80); } return false; }
  async function click(sel) { const ok = await ev(`(() => { const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return false; e.click(); return true; })()`); if (!ok) throw new Error('Missing ' + sel); await sleep(150); }
  async function shot(name) { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync('docs/' + name, Buffer.from(r.data, 'base64')); }
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.reload', { ignoreCache: true }); await sleep(2200);
  await click('[data-action="open-import"]');
  await waitFor("!!document.querySelector('#legacyText')");
  await ev(`document.querySelector('#legacyText').value = ${JSON.stringify(fixture)}`);
  await click('[data-action="legacy-analyze"]'); await sleep(250);
  await click('[data-action="import-confirm"]'); await sleep(900);
  await click('[data-action="open-map"]'); await sleep(1200);
  const hasStart = await ev("!!document.querySelector('[data-action=map-start]')");
  if (!hasStart) throw new Error('No map start');
  await click('[data-action="map-start"]'); await sleep(1200);
  const questionBefore = await ev("document.querySelector('.questionText') ? document.querySelector('.questionText').innerText : ''");
  await click('[data-action="open-pause"]'); await sleep(300);
  await click('[data-action="suspend-duel-map"]'); await sleep(700);
  const mapWhilePaused = await ev("!!document.querySelector('.mapScreen') && !!document.querySelector('[data-action=resume-suspended-duel]')");
  await shot('offline-final-pause-map.png');
  await click('[data-action="resume-suspended-duel"]'); await sleep(500);
  const questionAfter = await ev("document.querySelector('.questionText') ? document.querySelector('.questionText').innerText : ''");
  const pausedPreserved = questionBefore === questionAfter;
  await click('[data-action="open-pause"]'); await sleep(200);
  await click('[data-action="suspend-duel-menu"]'); await sleep(500);
  const menuPaused = await ev("!!document.querySelector('.titleScreen') && document.body.innerText.includes('Reanudar duelo en pausa')");
  await click('[data-action="menu-continue"]'); await sleep(500);
  const resumedMenu = await ev("!!document.querySelector('.duelPanel')");
  await send('Page.reload', { ignoreCache: true }); await sleep(1800);
  await click('[data-action="open-map"]'); await sleep(1000);
  await click('[data-action="open-review"]'); await sleep(400);
  await waitFor("!!document.querySelector('[data-action=start-review][data-mode=due]')");
  await click('[data-action="start-review"][data-mode="due"]'); await sleep(900);
  const inReview = await ev("!!document.querySelector('.duelPanel')");
  let lost = false;
  if (inReview) {
    for (let qn = 0; qn < 5; qn++) {
      if (await ev("!!document.querySelector('.resultScreen')")) break;
      const data = await ev("(() => ({ stem: document.querySelector('.questionText') ? document.querySelector('.questionText').innerText : '', opts: Array.from(document.querySelectorAll('.answerBtn')).map(b => ({ letter: b.getAttribute('data-letter'), text: b.innerText })) }))()");
      const source = byStem.get(data.stem);
      const wrong = data.opts.find((o) => o.letter !== (source ? source.answer : '')) || data.opts[0];
      if (!wrong) break;
      await click(`[data-action="answer"][data-letter="${wrong.letter}"]`); await sleep(450);
      if (await ev("!!document.querySelector('.resultScreen')")) break;
      if (await ev("!!document.querySelector('[data-action=next-question]')")) { await click('[data-action="next-question"]'); await sleep(350); }
    }
    lost = await ev("window.__gameState().phase === 'lost'");
    await shot('offline-final-review-defeat.png');
  }
  const result = { pausedMap: mapWhilePaused, pausedQuestionPreserved: pausedPreserved, menuPaused: menuPaused, resumedFromMenu: resumedMenu, review: inReview, defeat: lost, phase: await ev("window.__gameState().phase") };
  fs.writeFileSync('.work/offline-review-verification.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  ws.close();
})().catch((e) => { console.error('REVIEW_VERIFY_ERROR', e.stack || e); process.exitCode = 1; });
