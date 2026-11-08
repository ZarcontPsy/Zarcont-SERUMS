'use strict';
/* Comprueba que el HTML exportado incluye el snapshot para el HUB.
   Siembra un guardado válido con 130 XP, abre export/serums-quest.html,
   verifica la clave y el panel del HUB (file://), antes y después de recargar. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');
const ROOT = 'C:\\Users\\USARIO\\Documents\\ZARCONT SERUMS';
const SQ = path.join(ROOT, 'serums-quest');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const port = 9381;
  const dir = path.join(os.tmpdir(), 'export-snapshot-verify');
  fs.rmSync(dir, { recursive: true, force: true });
  const exportUrl = pathToFileURL(path.join(SQ, 'export', 'serums-quest.html')).href;
  const hubUrl = pathToFileURL(path.join(ROOT, 'index.html')).href;
  const child = spawn(CHROME, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu-sandbox',
    `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--window-size=1280,800', exportUrl], { stdio: 'ignore' });
  let page;
  for (let i = 0; i < 100; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      page = list.find((x) => x.type === 'page');
      if (page) break;
    } catch {}
    await sleep(200);
  }
  if (!page) throw new Error('Chrome sin página');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0;
  const pending = new Map();
  const errors = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text + ' ' + ((m.params.exceptionDetails.exception || {}).description || ''));
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => { const mid = ++id; pending.set(mid, { resolve, reject }); ws.send(JSON.stringify({ id: mid, method, params })); });
  await send('Page.enable'); await send('Runtime.enable');
  const ev = async (expr) => {
    const x = await send('Runtime.evaluate', { expression: expr, returnByValue: true, userGesture: true });
    if (x.exceptionDetails) throw new Error(x.exceptionDetails.text);
    return x.result ? x.result.value : undefined;
  };
  const waitFor = async (expr, ms = 15000) => {
    const end = Date.now() + ms;
    while (Date.now() < end) { try { if (await ev(expr)) return true; } catch {} await sleep(150); }
    return false;
  };
  const readPanel = () => ev(`(() => {
    const p = document.querySelector('[data-progress="quest"]');
    const l = document.querySelector('[data-last="quest"]');
    return p ? { value: p.querySelector('[data-progress-value]').textContent.trim(), note: p.querySelector('[data-progress-note]').textContent.trim(), bar: p.querySelector('[data-progress-bar]').style.transform, lastHidden: l.hidden, lastText: l.querySelector('[data-last-text]').textContent.trim() } : null;
  })()`);
  const out = { exportedFile: path.join(SQ, 'export', 'serums-quest.html'), exportUrl, hubUrl };
  try {
    await waitFor("typeof window.__gameState === 'function'", 20000);
    const seeded = {
      schema: 2, appVersion: 'Versión final completa',
      createdAt: '2026-11-06T12:23:25.701Z', updatedAt: '2026-11-06T12:23:32.646Z',
      profile: { name: 'Prueba export', createdAt: '2026-11-06T12:23:25.701Z' },
      xp: 130, coins: 28, stage: 1,
      academic: { answered: 5, correct: 5, wrong: 0, totalTimeMs: 3402, sessions: 1, byArea: {}, recent: [] },
      questions: {}, questionTags: {}, errors: {},
      missions: { 'mission-sp-1': { id: 'mission-sp-1', kind: 'mission', areaId: 'area-psi-salud-publica', attempts: 1, completedAt: '2026-11-06T12:23:32.645Z', bestScore: 500, bestAccuracy: 1, lastAt: '2026-11-06T12:23:32.645Z', lastScore: 500, lastAccuracy: 1, passedAt: '2026-11-06T12:23:32.645Z' } },
      achievements: {}, collection: { ownedCharacterIds: ['ilan'], ownedCosmeticIds: [], selectedCharacterId: 'ilan', equipped: {} },
      daily: { lastCompletedDate: '2026-11-06', streak: 1, bestStreak: 1, totalCompleted: 1, graceWeek: null },
      reviews: { lastCompletedDate: null, completed: 0, onTimeSessions: 0, earlySessions: 0 },
      settings: { sound: false, ambient: false, muted: false, volume: 0.7, reducedMotion: false, extraTime: false, effectsQuality: 'medio', qualityChosen: false, hide3dFrames: false, textScale: 'normal', highContrast: false, tutorialSeen: true, backupReminder: true },
      modeStats: { dailyDate: null, claims: {}, simulacroHistory: [] }, backup: { lastExportedAt: null, lastPromptAt: null }, events: []
    };
    await ev(`localStorage.setItem('serumsquest:voxel:state:v1', ${JSON.stringify(JSON.stringify(seeded))})`);
    await send('Page.reload', { ignoreCache: true });
    await waitFor("typeof window.__gameState === 'function'", 20000);
    await sleep(900);
    out.snapshot = await ev("(() => { const r = localStorage.getItem('serumsquest:snapshot:v1'); return r ? JSON.parse(r) : null; })()");
    out.game = await ev('window.__gameState()');
    out.saveXp = await ev("(() => { const r = localStorage.getItem('serumsquest:voxel:state:v1'); return r ? JSON.parse(r).xp : null; })()");
    out.snapshotOkay = !!out.snapshot && out.snapshot.xp === 130 && out.snapshot.level === 2 && out.snapshot.answered === 5 && out.snapshot.hasActivity === true;

    await send('Page.navigate', { url: hubUrl });
    await sleep(1600);
    await waitFor("!!document.querySelector('[data-progress=\"quest\"]')", 8000);
    out.hubPanel = await readPanel();
    await send('Page.reload', { ignoreCache: true });
    await sleep(1600);
    await waitFor("!!document.querySelector('[data-progress=\"quest\"]')", 8000);
    out.hubPanelAfterReload = await readPanel();
    out.errors = errors;
  } catch (e) {
    out.failure = e.stack || String(e);
  } finally {
    try { ws.close(); } catch {}
    try { child.kill(); } catch {}
  }
  fs.writeFileSync(path.join(SQ, '.work', 'export-snapshot-verify.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  if (out.failure || !out.snapshotOkay) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
