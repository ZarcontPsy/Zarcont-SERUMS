'use strict';
/* Verificación del snapshot SERUMS QUEST → HUB (6 nov 2026).
   - file:// y http:// con perfiles limpios.
   - Juega la primera misión respondiendo correctamente (XP real), sube de nivel.
   - Comprueba la clave serumsquest:snapshot:v1, el guardado, el panel del HUB
     y su persistencia tras recargar.
   - Comprueba exportación e importación sin romper el guardado.
   No modifica el HUB. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const ROOT = 'C:\\Users\\USARIO\\Documents\\ZARCONT SERUMS';
const SQ = path.join(ROOT, 'serums-quest');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FIXTURE = JSON.parse(fs.readFileSync(path.join(SQ, '.work', 'offline-fixture.json'), 'utf8'));
const SAVE_KEY = 'serumsquest:voxel:state:v1';
const SNAPSHOT_KEY = 'serumsquest:snapshot:v1';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };

function startServer(port) {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0].split('#')[0]).replace(/^\/+/, '');
    const file = path.resolve(ROOT, rel || 'index.html');
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('not found'); return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

async function launch(port, profile, url, extraArgs) {
  const dir = path.join(os.tmpdir(), profile);
  fs.rmSync(dir, { recursive: true, force: true });
  const args = ['--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu-sandbox',
    `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--window-size=1280,800'];
  if (extraArgs) args.push(...extraArgs);
  args.push(url);
  const child = spawn(CHROME, args, { stdio: 'ignore' });
  for (let i = 0; i < 120; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find((x) => x.type === 'page');
      if (page) return { child, page };
    } catch {}
    await sleep(200);
  }
  throw new Error('Chrome did not expose a page on port ' + port);
}

async function connect(page) {
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0;
  const pending = new Map();
  const errors = [];
  ws.onmessage = (event) => {
    const m = JSON.parse(event.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id);
      m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result);
    }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text + ' ' + ((m.params.exceptionDetails.exception || {}).description || ''));
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id; pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
  await send('Page.enable'); await send('Runtime.enable');
  const ev = async (expression, awaitPromise = false) => {
    const x = await send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true, userGesture: true });
    if (x.exceptionDetails) throw new Error(x.exceptionDetails.text + ' ' + (x.exceptionDetails.exception && x.exceptionDetails.exception.description || ''));
    return x.result ? x.result.value : undefined;
  };
  const waitFor = async (expr, ms = 10000) => {
    const end = Date.now() + ms;
    while (Date.now() < end) { try { const v = await ev(expr); if (v) return v; } catch {} await sleep(160); }
    return false;
  };
  const waitUrl = async (re, ms = 15000) => {
    const end = Date.now() + ms;
    while (Date.now() < end) { try { const u = await ev('location.href'); if (re.test(u)) return u; } catch {} await sleep(200); }
    return '';
  };
  const click = async (sel) => {
    const ok = await ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true; })()`);
    if (!ok) throw new Error('Missing ' + sel);
    await sleep(300);
  };
  const skipTutorial = async () => {
    for (let i = 0; i < 20; i++) {
      if (await ev("!!document.querySelector('[data-action=\"tutorial-skip\"]')").catch(() => false)) {
        await click('[data-action="tutorial-skip"]');
      }
      if (await ev("!!document.querySelector('.titleScreen')").catch(() => false)) return true;
      await sleep(200);
    }
    return false;
  };
  const state = () => ev(`(() => { const raw = localStorage.getItem(${JSON.stringify(SAVE_KEY)}); return raw ? JSON.parse(raw) : null; })()`);
  const snapshot = () => ev(`(() => { const raw = localStorage.getItem(${JSON.stringify(SNAPSHOT_KEY)}); return raw ? JSON.parse(raw) : null; })()`);
  return { ws, send, ev, click, waitFor, waitUrl, skipTutorial, state, snapshot, errors };
}

function check(condition, label, details) {
  if (!condition) {
    const error = new Error('CHECK FAILED: ' + label + (details ? ' :: ' + JSON.stringify(details) : ''));
    error.check = { label, details };
    throw error;
  }
}

async function readPanel(c) {
  return c.ev(`(() => {
    const panel = document.querySelector('[data-progress="quest"]');
    const last = document.querySelector('[data-last="quest"]');
    if (!panel) return null;
    const note = panel.querySelector('[data-progress-note]');
    const value = panel.querySelector('[data-progress-value]');
    const bar = panel.querySelector('[data-progress-bar]');
    return {
      empty: panel.classList.contains('is-empty'),
      value: value ? value.textContent.trim() : '',
      note: note ? note.textContent.trim() : '',
      bar: bar ? bar.style.transform : '',
      lastHidden: last ? !!last.hidden : null,
      lastText: last && last.querySelector('[data-last-text]') ? last.querySelector('[data-last-text]').textContent.trim() : ''
    };
  })()`);
}

function parseBarScale(transform) {
  const m = /scaleX\(([-0-9.]+)\)/.exec(String(transform || ''));
  return m ? Number(m[1]) : null;
}

function levelAt(xp) {
  const LV = { base: 80, linear: 40, quadratic: 10, maxLevel: 50 };
  let level = 1;
  let remaining = Math.max(0, Number(xp) || 0);
  const curve = (l) => LV.base + LV.linear * (l - 1) + LV.quadratic * Math.pow(l - 1, 2);
  while (level < LV.maxLevel && remaining >= curve(level)) { remaining -= curve(level); level += 1; }
  if (level >= LV.maxLevel) return { level, percent: 100 };
  return { level, percent: Math.round((remaining / curve(level)) * 1000) / 10 };
}

async function openGameFromHub(c) {
  const out = {};
  out.hubUrl = await c.ev('location.href');
  out.hubPanelBefore = await readPanel(c);
  const card = await c.waitFor("!!document.querySelector('[data-app=\"quest\"]')", 12000);
  check(card, 'HUB: tarjeta de SERUMS QUEST');
  await c.ev("(() => { document.querySelector('[data-app=\"quest\"]').click(); return true; })()");
  await sleep(650);
  out.selectedAfterFirstClick = await c.ev("document.querySelector('[data-app=\"quest\"]').classList.contains('is-active')");
  await c.ev("(() => { document.querySelector('[data-app=\"quest\"]').click(); return true; })()");
  out.gameUrl = await c.waitUrl(/serums-quest\/dist\/index\.html/, 15000);
  check(out.gameUrl, 'HUB → juego: navegación', out.gameUrl);
  const loaded = await c.waitFor("typeof window.__gameState === 'function'", 20000);
  check(loaded, 'juego: __gameState disponible');
  await sleep(500);
  out.tutorial = await c.waitFor("!!document.querySelector('.tutorialShell') || !!document.querySelector('.titleScreen')", 10000);
  out.skippedTutorial = await c.skipTutorial();
  check(out.skippedTutorial, 'juego: menú de título tras tutorial');
  out.title = await c.ev('document.title');
  await c.click('[data-action="menu-continue"]');
  const hub = await c.waitFor("window.__gameState().screen === 'hub'", 10000);
  check(hub, 'juego: observatorio');
  return out;
}

async function playFirstMission(c) {
  const out = { answers: [] };
  const initialSave = await c.state();
  out.initialXp = initialSave ? initialSave.xp : 0;
  await c.click('[data-action="open-journal"]');
  check(await c.waitFor("!!document.querySelector('[data-action=\"start-mission\"]')", 8000), 'bitácora: botón de inicio');
  await c.click('[data-action="start-mission"]');
  check(await c.waitFor("window.__gameState().screen === 'duel'", 8000), 'duelo iniciado');
  const mission = await c.ev(`(() => {
    const gs = window.__gameState();
    const m = window.CAMPAIGN_DATA.missions.find((x) => x.id === gs.activeMissionId);
    return m ? { id: m.id, title: m.title, total: m.questionIds.length, questionIds: m.questionIds } : null;
  })()`);
  check(mission, 'misión activa con datos');
  out.mission = mission;

  for (let i = 0; i < 12; i++) {
    const gs = await c.ev('window.__gameState()');
    if (gs.screen === 'result') break;
    check(gs.screen === 'duel', 'pantalla de duelo', gs);
    const info = await c.ev(`(() => {
      const gs = window.__gameState();
      const m = window.CAMPAIGN_DATA.missions.find((x) => x.id === gs.activeMissionId);
      if (!m) return null;
      const qid = m.questionIds[gs.questionIndex];
      const q = window.CAMPAIGN_DATA.questions[qid];
      return q ? { qid, index: gs.questionIndex, total: gs.questionTotal, answer: q.answer, stem: String(q.stem || '').slice(0, 80) } : null;
    })()`);
    check(info && info.answer, 'pregunta activa con clave', info);
    await c.click(`[data-action="answer"][data-letter="${info.answer}"]`);
    const nextVisible = await c.waitFor("!!document.querySelector('[data-action=\"next-question\"]')", 6000);
    check(nextVisible, 'botón Siguiente tras responder', info);
    const afterAnswer = { save: await c.state(), snap: await c.snapshot(), game: await c.ev('window.__gameState()') };
    out.answers.push({ index: info.index, qid: info.qid, answer: info.answer, saveXp: afterAnswer.save && afterAnswer.save.xp, answered: afterAnswer.save && afterAnswer.save.academic && afterAnswer.save.academic.answered, snapXp: afterAnswer.snap && afterAnswer.snap.xp, snapLevel: afterAnswer.snap && afterAnswer.snap.level, gameXp: afterAnswer.game && afterAnswer.game.xp });
    if (i === 0) out.afterFirstAnswer = afterAnswer;
    await c.click('[data-action="next-question"]');
    await sleep(450);
  }
  const result = await c.waitFor("window.__gameState().screen === 'result'", 10000);
  check(result, 'resultado de la misión');
  out.finalGame = await c.ev('window.__gameState()');
  out.finalSave = await c.state();
  out.finalSnapshot = await c.snapshot();
  out.resultText = ((await c.ev('document.body.innerText')) || '').slice(0, 320);
  return out;
}

async function returnToHub(c, hubUrl) {
  await c.click('[data-action="result-continue"]');
  check(await c.waitFor("window.__gameState().screen === 'hub'", 8000), 'resultado → observatorio');
  await c.ev('history.back()');
  const backOk = await c.waitFor("location.href.endsWith('/index.html') && location.href.indexOf('/serums-quest/') === -1", 10000);
  const back = await c.ev('location.href');
  check(backOk && back.indexOf('/serums-quest/') === -1, 'volver al HUB con Atrás', back);
  await c.waitFor("!!document.querySelector('[data-progress=\"quest\"]')", 8000);
  await sleep(500);
  return { backUrl: back, panel: await readPanel(c) };
}

async function exportAndImport(c, downloadDir) {
  const out = {};
  fs.mkdirSync(downloadDir, { recursive: true });
  for (const f of fs.readdirSync(downloadDir)) fs.unlinkSync(path.join(downloadDir, f));
  await c.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadDir, eventsEnabled: true });
  await c.click('[data-action="open-settings"]');
  const hasExport = await c.waitFor("!!document.querySelector('[data-action=\"export-save\"]')", 5000);
  check(hasExport, 'ajustes: botón Exportar');
  await c.click('[data-action="export-save"]');
  let file = '';
  for (let i = 0; i < 40; i++) {
    const files = fs.readdirSync(downloadDir).filter((f) => f.endsWith('.json'));
    if (files.length) { file = files[0]; break; }
    await sleep(250);
  }
  check(file, 'exportación: archivo descargado');
  const exported = JSON.parse(fs.readFileSync(path.join(downloadDir, file), 'utf8'));
  out.exportFile = file;
  out.exported = { app: exported.app, saveSchema: exported.saveSchema, xp: exported.state && exported.state.xp, name: exported.state && exported.state.profile && exported.state.profile.name };
  const saveBefore = await c.state();
  check(exported.state.xp === saveBefore.xp, 'exportación conserva XP', { exported: exported.state.xp, save: saveBefore.xp });

  await c.click('[data-action="open-import"]');
  const hasText = await c.waitFor("!!document.querySelector('#legacyText')", 6000);
  check(hasText, 'importación: campo de texto');
  await c.ev(`(() => { const t = document.querySelector('#legacyText'); t.value = ${JSON.stringify(JSON.stringify(FIXTURE))}; t.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  await c.click('[data-action="legacy-analyze"]');
  check(await c.waitFor("document.body.innerText.includes('Offline QA')", 8000), 'importación: vista previa');
  await c.click('[data-action="import-confirm"]');
  await sleep(1400);
  out.afterImportSave = await c.state();
  out.afterImportSnapshot = await c.snapshot();
  out.afterImportGame = await c.ev('window.__gameState ? window.__gameState() : null');
  out.afterImportText = ((await c.ev('document.body.innerText')) || '').slice(0, 260);
  return out;
}

function assertSnapshotMatches(snap, save, game, label, opts) {
  opts = opts || {};
  check(snap, label + ': snapshot existe');
  check(save, label + ': guardado existe');
  check(snap.xp === save.xp, label + ': snapshot.xp = guardado.xp', { snap: snap.xp, save: save.xp });
  if (game) check(snap.xp === game.xp, label + ': snapshot.xp = juego.xp', { snap: snap.xp, game: game.xp });
  check(snap.level === levelAt(save.xp).level, label + ': snapshot.level coherente', { snap: snap.level, xp: save.xp });
  if (game) check(snap.level === game.level, label + ': snapshot.level = juego.level', { snap: snap.level, game: game.level });
  check(Math.abs(Number(snap.levelPercent) - levelAt(save.xp).percent) < 0.01, label + ': levelPercent coherente', { snap: snap.levelPercent, expected: levelAt(save.xp).percent });
  check(snap.answered === save.academic.answered, label + ': snapshot.answered = guardado.answered', { snap: snap.answered, save: save.academic.answered });
  check(snap.hasActivity === true, label + ': hasActivity true', snap.hasActivity);
  check(typeof snap.rank === 'string' && snap.rank.length > 0, label + ': rank presente', snap.rank);
  if (opts.lastTitle) check(snap.lastSession && snap.lastSession.title === opts.lastTitle, label + ': lastSession.title', snap.lastSession);
}

function assertPanel(panel, snap, label, opts) {
  opts = opts || {};
  check(panel, label + ': panel del HUB');
  const expectedValue = 'Nv ' + snap.level;
  const expectedNote = snap.hasActivity
    ? (snap.rank || 'Bachiller') + ' · ' + (Number(snap.xp) || 0) + ' XP · ' + (Number(snap.answered) || 0) + ' respuestas'
    : 'Sin actividad registrada todavía';
  check(panel.value === expectedValue, label + ': valor Nv', { got: panel.value, expected: expectedValue });
  check(panel.note === expectedNote, label + ': nota rango/XP/respuestas', { got: panel.note, expected: expectedNote });
  const scale = parseBarScale(panel.bar);
  check(scale !== null && Math.abs(scale - (Number(snap.levelPercent) || 0) / 100) < 0.001, label + ': barra de nivel', { got: panel.bar, expectedPercent: snap.levelPercent });
  check(panel.empty === false, label + ': panel deja de estar vacío');
  if (snap.lastSession && snap.lastSession.title) {
    check(panel.lastHidden === false, label + ': última sesión visible');
    check(panel.lastText === snap.lastSession.title, label + ': última sesión', { got: panel.lastText, expected: snap.lastSession.title });
  }
}

async function scenarioFile() {
  const port = 9371;
  const profile = 'hub-snapshot-file';
  const hubUrl = pathToFileURL(path.join(ROOT, 'index.html')).href;
  const { child, page } = await launch(port, profile, hubUrl);
  const c = await connect(page);
  const out = { scenario: 'file://', hubUrl };
  try {
    await sleep(2400);
    out.open = await openGameFromHub(c);
    out.play = await playFirstMission(c);

    assertSnapshotMatches(out.play.afterFirstAnswer.snap, out.play.afterFirstAnswer.save, out.play.afterFirstAnswer.game, 'file:// tras 1.ª respuesta');
    check(out.play.afterFirstAnswer.snap.xp > out.play.initialXp, 'file://: el snapshot sube al ganar XP', { before: out.play.initialXp, after: out.play.afterFirstAnswer.snap.xp });

    assertSnapshotMatches(out.play.finalSnapshot, out.play.finalSave, out.play.finalGame, 'file:// al terminar', { lastTitle: out.play.mission.title });
    check(out.play.finalSnapshot.level >= 2, 'file://: sube de nivel', { level: out.play.finalSnapshot.level, xp: out.play.finalSnapshot.xp });
    check(out.play.finalSnapshot.answered === out.play.mission.total, 'file://: respuestas contadas', { answered: out.play.finalSnapshot.answered, total: out.play.mission.total });

    out.returnHub = await returnToHub(c, hubUrl);
    assertPanel(out.returnHub.panel, out.play.finalSnapshot, 'file:// HUB al volver');

    await c.send('Page.reload', { ignoreCache: true });
    await sleep(2200);
    await c.waitFor("!!document.querySelector('[data-progress=\"quest\"]')", 8000);
    await sleep(400);
    out.hubAfterReload = await readPanel(c);
    assertPanel(out.hubAfterReload, out.play.finalSnapshot, 'file:// HUB tras recargar');

    await c.send('Page.navigate', { url: pathToFileURL(path.join(SQ, 'dist', 'index.html')).href });
    await c.waitFor("typeof window.__gameState === 'function'", 20000);
    await sleep(900);
    await c.skipTutorial();
    out.gameAfterReload = { snapshot: await c.snapshot(), save: await c.state(), game: await c.ev('window.__gameState()') };
    assertSnapshotMatches(out.gameAfterReload.snapshot, out.gameAfterReload.save, out.gameAfterReload.game, 'file:// juego tras recargar', { lastTitle: out.play.mission.title });

    await c.send('Page.navigate', { url: hubUrl });
    await sleep(1500);
    await c.waitFor("!!document.querySelector('[data-progress=\"quest\"]')", 8000);
    await sleep(300);
    out.hubAgain = await readPanel(c);
    assertPanel(out.hubAgain, out.gameAfterReload.snapshot, 'file:// HUB tras recargar el juego');

    await c.send('Page.navigate', { url: pathToFileURL(path.join(SQ, 'dist', 'index.html')).href });
    await c.waitFor("typeof window.__gameState === 'function'", 20000);
    await sleep(900);
    await c.skipTutorial();
    out.exportImport = await exportAndImport(c, path.join(os.tmpdir(), 'hub-snapshot-downloads'));
    check(out.exportImport.afterImportSave && out.exportImport.afterImportSave.importedFrom, 'file:// importación aplicada', out.exportImport.afterImportSave && out.exportImport.afterImportSave.importedFrom);
    check(out.exportImport.afterImportSnapshot && out.exportImport.afterImportSnapshot.xp === out.exportImport.afterImportSave.xp, 'file:// snapshot refleja la importación', { snap: out.exportImport.afterImportSnapshot && out.exportImport.afterImportSnapshot.xp, save: out.exportImport.afterImportSave && out.exportImport.afterImportSave.xp });

    await c.send('Page.navigate', { url: hubUrl });
    await sleep(1500);
    await c.waitFor("!!document.querySelector('[data-progress=\"quest\"]')", 8000);
    await sleep(300);
    out.hubAfterImport = await readPanel(c);
    assertPanel(out.hubAfterImport, out.exportImport.afterImportSnapshot, 'file:// HUB tras importar');
    await c.send('Page.reload', { ignoreCache: true });
    await sleep(1800);
    await c.waitFor("!!document.querySelector('[data-progress=\"quest\"]')", 8000);
    out.hubAfterImportReload = await readPanel(c);
    assertPanel(out.hubAfterImportReload, out.exportImport.afterImportSnapshot, 'file:// HUB tras importar y recargar');

    out.errors = c.errors.slice();
  } catch (e) {
    out.failure = e.stack || String(e);
    out.errorAt = e.check || null;
  } finally {
    try { c.ws.close(); } catch {}
    try { child.kill(); } catch {}
  }
  return out;
}

async function scenarioHttp(server) {
  const port = 9372;
  const base = 'http://127.0.0.1:8124';
  const profile = 'hub-snapshot-http';
  const { child, page } = await launch(port, profile, base + '/index.html');
  const c = await connect(page);
  const out = { scenario: 'http://', hubUrl: base + '/index.html' };
  try {
    await sleep(2000);
    out.origin = await c.ev('location.origin');
    out.open = await openGameFromHub(c);
    out.play = await playFirstMission(c);
    assertSnapshotMatches(out.play.finalSnapshot, out.play.finalSave, out.play.finalGame, 'http:// al terminar', { lastTitle: out.play.mission.title });
    check(out.play.finalSnapshot.level >= 2, 'http://: sube de nivel', { level: out.play.finalSnapshot.level, xp: out.play.finalSnapshot.xp });

    out.returnHub = await returnToHub(c, base + '/index.html');
    assertPanel(out.returnHub.panel, out.play.finalSnapshot, 'http:// HUB al volver');

    await c.send('Page.reload', { ignoreCache: true });
    await sleep(1800);
    await c.waitFor("!!document.querySelector('[data-progress=\"quest\"]')", 8000);
    out.hubAfterReload = await readPanel(c);
    assertPanel(out.hubAfterReload, out.play.finalSnapshot, 'http:// HUB tras recargar');

    out.errors = c.errors.slice();
  } catch (e) {
    out.failure = e.stack || String(e);
    out.errorAt = e.check || null;
  } finally {
    try { c.ws.close(); } catch {}
    try { child.kill(); } catch {}
  }
  return out;
}

(async () => {
  const report = { at: new Date().toISOString(), saveKey: SAVE_KEY, snapshotKey: SNAPSHOT_KEY };
  report.file = await scenarioFile();
  const server = await startServer(8124);
  try { report.http = await scenarioHttp(server); }
  finally { server.close(); }
  fs.writeFileSync(path.join(SQ, '.work', 'hub-snapshot-verify.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  const failed = [report.file, report.http].filter((x) => x.failure);
  if (failed.length) process.exitCode = 1;
})().catch((e) => { console.error('HUB_SNAPSHOT_VERIFY_ERROR', e.stack || e); process.exitCode = 1; });
