const fs = require('fs');
const campaign = JSON.parse(fs.readFileSync('src/campaign.json', 'utf8'));
const qs = Object.values(campaign.questions);
const byStem = new Map(qs.map((q) => [q.stem, q]));
const tags = [qs[2].id, qs[10].id, qs[20].id];
const errorIds = [qs[4].id, qs[18].id, qs[33].id];
const areas = {
  'area-psi-salud-publica': { answered: 15, correct: 10, wrong: 5, totalTimeMs: 90000, reliableAnswered: 15, reliableCorrect: 10, reliableWrong: 5 },
  'area-psi-cuidado-integral': { answered: 13, correct: 8, wrong: 5, totalTimeMs: 110000, reliableAnswered: 13, reliableCorrect: 8, reliableWrong: 5 },
  'area-psi-etica': { answered: 10, correct: 7, wrong: 3, totalTimeMs: 70000, reliableAnswered: 10, reliableCorrect: 7, reliableWrong: 3 },
  'area-psi-investigacion': { answered: 8, correct: 4, wrong: 4, totalTimeMs: 50000, reliableAnswered: 8, reliableCorrect: 4, reliableWrong: 4 },
  'area-psi-gestion': { answered: 14, correct: 10, wrong: 4, totalTimeMs: 70000, reliableAnswered: 14, reliableCorrect: 10, reliableWrong: 4 }
};
const errors = {};
errorIds.forEach((id, i) => {
  const q = qs.find((x) => x.id === id);
  errors[id] = { questionId: id, areaId: q.areaId, firstAt: '2026-11-01T10:00:00.000Z', lastAt: '2026-11-05T10:00:00.000Z', lastWrongAt: '2026-11-05T10:00:00.000Z', count: 3 - i, recoveryLevel: 0, recoveredAt: null, nextReviewAt: '2026-11-05T10:00:00.000Z', confidence: q.confidence };
});
const recent = [];
const areaIds = Object.keys(areas);
const recentPatterns = [
  [true, false, false, true, true, true],
  [true, true, false, true, false, false],
  [true, false, true, true, false, true],
  [false, false, true, true, true, true],
  [true, true, true, false, true, true]
];
areaIds.forEach((areaId, idx) => {
  recentPatterns[idx].forEach((correct, j) => {
    recent.push({ at: '2026-10-' + String(20 + j).padStart(2, '0') + 'T10:00:00.000Z', correct: correct, areaId: areaId, confidence: 'alta', durationMs: 4200 + (j % 4) * 900, mode: j % 2 ? 'practice' : 'mission' });
  });
});
const state = {
  schema: 1,
  appVersion: 'Bloque 2 · aprendizaje',
  profile: { name: 'Aprendiz del observatorio', createdAt: '2026-10-01T10:00:00.000Z' },
  xp: 1840, coins: 420, stage: 3,
  academic: { answered: 60, correct: 39, wrong: 21, totalTimeMs: 390000, sessions: 9, byArea: areas, recent: recent },
  questions: {},
  questionTags: {},
  errors: errors,
  missions: {},
  achievements: {},
  collection: { ownedCharacterIds: ['ilan', 'mara'], ownedCosmeticIds: [], selectedCharacterId: 'ilan', equipped: {} },
  daily: { lastCompletedDate: null, streak: 0, bestStreak: 0, totalCompleted: 0, graceWeek: null },
  reviews: { lastCompletedDate: null, completed: 0, onTimeSessions: 0, earlySessions: 0 },
  settings: { sound: false, ambient: false, muted: false, volume: 0.6, reducedMotion: false, extraTime: false, effectsQuality: 'medio', hide3dFrames: false },
  modeStats: { dailyDate: null, claims: {}, dailyWins: 1, survivalWins: 1, survivalBest: 8, timedRuns: 2, timedBest: 0.83, timedAce: 0, simulacros: 1, simulacroHistory: [{ date: '2026-11-04', accuracy: 75, correct: 15, total: 20, passed: true, areas: {} }, { date: '2026-11-02', accuracy: 60, correct: 12, total: 20, passed: false, areas: {} }] },
  importedFrom: null, importedAt: null, events: []
};
const tagMap = {};
tags.forEach((id, i) => { tagMap[id] = { difficult: i !== 1, favorite: i === 1 || i === 2, updatedAt: '2026-11-05T10:00:00.000Z' }; });
state.questionTags = tagMap;

(async () => {
  const list = await (await fetch('http://127.0.0.1:9336/json/list')).json();
  const t = list.find((x) => x.type === 'page' && x.url.startsWith('file:'));
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map(); const exceptions = [];
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.j(new Error(JSON.stringify(m.error))) : p.r(m.result); } if (m.method === 'Runtime.exceptionThrown') exceptions.push(m.params.exceptionDetails.text + ' ' + (m.params.exceptionDetails.exception && m.params.exceptionDetails.exception.description || '')); };
  const send = (method, params = {}) => new Promise((r, j) => { const mid = ++id; pend.set(mid, { r, j }); ws.send(JSON.stringify({ id: mid, method, params })); });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function ev(expression, awaitPromise = false) { const x = await send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true, userGesture: true }); if (x.exceptionDetails) throw new Error(x.exceptionDetails.text + ' ' + (x.exceptionDetails.exception && x.exceptionDetails.exception.description || '')); return x.result && x.result.value; }
  async function click(sel) { const ok = await ev(`(() => { const e=document.querySelector(${JSON.stringify(sel)}); if(!e)return false; e.click(); return true; })()`); if (!ok) throw new Error('Missing ' + sel); await sleep(220); }
  async function shot(name) { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync('docs/' + name, Buffer.from(r.data, 'base64')); }
  await send('Page.enable'); await send('Runtime.enable');
  await ev(`localStorage.setItem('serumsquest:voxel:state:v1', ${JSON.stringify(JSON.stringify(state))}); localStorage.setItem('serumsquest:voxel:settings:v1', ${JSON.stringify(JSON.stringify(state.settings))}); true`);
  await send('Page.reload', { ignoreCache: true }); await sleep(2100);
  await click('[data-action="open-modes"]'); await click('[data-action="open-stats"]'); await sleep(600);
  const statsText = await ev("document.body.innerText");
  await shot('bloque2-estadisticas.jpg');
  const statsInfo = { hasRecommendation: statsText.includes('Tu área con más margen'), hasTrend: statsText.includes('tendencia'), hasHistory: statsText.includes('Simulacros'), text: statsText.slice(0, 900) };
  await click('[data-action="open-practice"]'); await sleep(350); await shot('bloque2-practica-selector.jpg');
  await click('[data-action="start-practice"][data-area="area-psi-salud-publica"]'); await sleep(500);
  await shot('bloque2-practica-libre.jpg');
  const practiceState = await ev('window.__gameState()');
  const cur = await ev("(() => ({ stem: document.querySelector('.questionText') ? document.querySelector('.questionText').innerText : '', opts: Array.from(document.querySelectorAll('.answerBtn')).map(b => ({ letter: b.getAttribute('data-letter'), text: b.innerText })) }))()");
  const source = byStem.get(cur.stem);
  const wrong = cur.opts.find((o) => o.letter !== (source ? source.answer : '')) || cur.opts[0];
  await click(`[data-action="answer"][data-letter="${wrong.letter}"]`); await sleep(260);
  const feedbackText = await ev("document.body.innerText");
  await shot('bloque2-retroalimentacion.jpg');
  await click('[data-action="toggle-question-tag"][data-tag="difficult"]'); await sleep(150);
  await click('[data-action="toggle-question-tag"][data-tag="favorite"]'); await sleep(150);
  const tagged = await ev("JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')).questionTags");
  await send('Page.reload', { ignoreCache: true }); await sleep(1800);
  await click('[data-action="menu-continue"]'); await sleep(450);
  await click('[data-action="open-pause"]'); await sleep(250);
  await click('[data-action="open-review"]'); await sleep(450);
  const reviewText = await ev("document.body.innerText");
  await shot('bloque2-repaso-marcadas.jpg');
  await send('Page.reload', { ignoreCache: true }); await sleep(1800);
  await click('[data-action="open-settings"]'); await sleep(300);
  const audioBefore = await ev('window.__audioProbe()');
  await shot('bloque2-audio-apagado.jpg');
  await click('[data-action="toggle-sound"]'); await sleep(200);
  const audioSound = await ev('window.__audioProbe()');
  await click('[data-action="toggle-ambient"]'); await sleep(250);
  const audioAmbient = await ev('window.__audioProbe()');
  await ev("(() => { const e=document.querySelector('[data-volume]'); e.value=30; e.dispatchEvent(new Event('input',{bubbles:true})); return true; })()"); await sleep(150);
  const audioVolume = await ev('window.__audioProbe()');
  await click('[data-action="toggle-muted"]'); await sleep(200);
  const audioMuted = await ev('window.__audioProbe()');
  await shot('bloque2-audio-silencio.jpg');
  const result = { statsInfo, practiceState, feedbackText: feedbackText.slice(-600), tagged, reviewText: reviewText.slice(0, 600), audio: { before: audioBefore, sound: audioSound, ambient: audioAmbient, volume: audioVolume, muted: audioMuted }, exceptions };
  fs.writeFileSync('.work/block2-verify.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  ws.close();
})().catch((e) => { console.error('BLOCK2_VERIFY_ERROR', e.stack || e); process.exitCode = 1; });
