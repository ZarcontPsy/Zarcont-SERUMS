const fs = require('fs');
const campaign = JSON.parse(fs.readFileSync('src/campaign.json', 'utf8'));
const byStem = new Map(Object.values(campaign.questions).map((q) => [q.stem, q]));
(async () => {
  const list = await (await fetch('http://127.0.0.1:9336/json/list')).json();
  const t = list.find((x) => x.type === 'page' && x.url.startsWith('file:'));
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.j(new Error(JSON.stringify(m.error))) : p.r(m.result); } };
  const send = (method, params = {}) => new Promise((r, j) => { const mid = ++id; pend.set(mid, { r, j }); ws.send(JSON.stringify({ id: mid, method, params })); });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function ev(expression) { const x = await send('Runtime.evaluate', { expression, returnByValue: true, userGesture: true }); if (x.exceptionDetails) throw new Error(x.exceptionDetails.text); return x.result && x.result.value; }
  async function click(sel) { const ok = await ev(`(() => { const e=document.querySelector(${JSON.stringify(sel)}); if(!e)return false; e.click(); return true; })()`); if (!ok) throw new Error('Missing ' + sel); await sleep(220); }
  await send('Page.enable'); await send('Runtime.enable'); await send('Page.reload', { ignoreCache: true }); await sleep(2000);
  await click('[data-action="open-modes"]'); await click('[data-action="start-mode"][data-mode="timed"][data-seconds="180"]'); await sleep(500);
  const cur = await ev("(() => ({ stem: document.querySelector('.questionText') ? document.querySelector('.questionText').innerText : '', opts: Array.from(document.querySelectorAll('.answerBtn')).map(b => ({ letter: b.getAttribute('data-letter'), text: b.innerText })) }))()");
  const source = byStem.get(cur.stem);
  const wrong = cur.opts.find((o) => o.letter !== (source ? source.answer : '')) || cur.opts[0];
  await click(`[data-action="answer"][data-letter="${wrong.letter}"]`); await sleep(250);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('docs/bloque2-contrarreloj-feedback.png', Buffer.from(shot.data, 'base64'));
  const text = await ev('document.body.innerText');
  const tag = await ev("(() => { const b=document.querySelector('[data-action=toggle-question-tag][data-tag=favorite]'); if(!b)return null; b.click(); return true; })()");
  await sleep(200);
  const tags = await ev("JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')).questionTags");
  console.log(JSON.stringify({ feedbackShowsKey: text.includes('La respuesta correcta era'), feedbackExcerpt: text.slice(-280), tagClicked: tag, tags }, null, 2));
  ws.close();
})().catch((e) => { console.error('TIMED_FEEDBACK_ERROR', e.stack || e); process.exitCode = 1; });
