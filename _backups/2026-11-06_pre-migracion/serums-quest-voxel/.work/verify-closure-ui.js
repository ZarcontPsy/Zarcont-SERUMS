const fs = require('fs');
(async () => {
  const list = await (await fetch('http://127.0.0.1:9338/json/list')).json();
  const t = list.find((x) => x.type === 'page' && x.url.startsWith('file:'));
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map(); const errors = [];
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.j(new Error(JSON.stringify(m.error))) : p.r(m.result); } if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text); };
  const send = (method, params = {}) => new Promise((r, j) => { const mid = ++id; pend.set(mid, { r, j }); ws.send(JSON.stringify({ id: mid, method, params })); });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function ev(expression) { const x = await send('Runtime.evaluate', { expression, returnByValue: true, userGesture: true }); if (x.exceptionDetails) throw new Error(x.exceptionDetails.text + ' ' + (x.exceptionDetails.exception && x.exceptionDetails.exception.description || '')); return x.result && x.result.value; }
  async function click(sel) { const ok = await ev(`(() => { const e=document.querySelector(${JSON.stringify(sel)}); if(!e)return false; e.click(); return true; })()`); if (!ok) throw new Error('Missing ' + sel); await sleep(220); }
  async function shot(name) { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync('docs/' + name, Buffer.from(r.data, 'base64')); }
  await send('Page.enable'); await send('Runtime.enable'); await send('Page.reload', { ignoreCache: true }); await sleep(2200);
  const tutorialOpen = await ev("!!document.querySelector('.tutorialShell')");
  if (tutorialOpen) await shot('bloque3-tutorial.png');
  if (tutorialOpen) await click('[data-action="tutorial-skip"]');
  await click('[data-action="open-settings"]'); await sleep(350);
  await shot('bloque3-ajustes.png');
  const settingsText = await ev('document.body.innerText');
  const settingsChecks = {
    tutorialOpen,
    version: settingsText.includes('Bloque 3 · cierre'),
    buildDate: settingsText.includes('2026-11-06'),
    qualityHelp: settingsText.includes('1×, sin sombras') || settingsText.includes('1×, sin sombras'),
    textScale: settingsText.includes('Tamaño del texto'),
    contrast: settingsText.includes('Alto contraste'),
    backup: settingsText.includes('Recordatorio semanal'),
    tutorialButton: await ev("!!document.querySelector('[data-action=open-tutorial]')"),
    helpButton: await ev("!!document.querySelector('[data-action=open-help]')"),
    creditsButton: await ev("!!document.querySelector('[data-action=open-credits]')")
  };
  await click('[data-action="set-text-scale"][data-scale="grande"]'); await sleep(160);
  const largeText = await ev("document.body.classList.contains('text-large')");
  await click('[data-action="toggle-contrast"]'); await sleep(160);
  const highContrast = await ev("document.body.classList.contains('high-contrast')");
  await shot('bloque3-accesibilidad.png');
  await click('[data-action="open-help"]'); await sleep(300); await shot('bloque3-ayuda.png');
  const helpText = await ev("document.body.innerText");
  await click('[data-action="close-help"]'); await sleep(200);
  await click('[data-action="open-credits"]'); await sleep(300); await shot('bloque3-creditos.png');
  const creditsText = await ev("document.body.innerText");
  await click('[data-action="close-credits"]'); await sleep(200);
  await click('[data-action="open-tutorial"]'); await sleep(200);
  const tutorialRepeat = await ev("!!document.querySelector('.tutorialShell')");
  await click('[data-action="tutorial-skip"]'); await sleep(200);
  const result = { settingsChecks, largeText, highContrast, tutorialRepeat, help: helpText.slice(0, 900), credits: creditsText.slice(0, 700), errors };
  fs.writeFileSync('.work/block3-ui-verify.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  ws.close();
})().catch((e) => { console.error('BLOCK3_UI_ERROR', e.stack || e); process.exitCode = 1; });
