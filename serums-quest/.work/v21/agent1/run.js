'use strict';
/* =========================================================================
   Lanzador del banco de pruebas (Node, sin dependencias).
   Construye harness.html, abre Chrome/Edge headless con CDP local,
   ejecuta el driver y guarda out/report-<label>.json + capturas en out/shots.
   Uso:
     node .work/v21/agent1/run.js --label antes
     node .work/v21/agent1/run.js --label despues --mode full
     node .work/v21/agent1/run.js --label rapido --mode quick --no-shot
   No construye el juego ni escribe fuera de .work/v21/agent1.
   ========================================================================= */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');
const { build } = require('./build-harness');

const HERE = __dirname;
const OUT = path.join(HERE, 'out');
const SHOTS = path.join(OUT, 'shots');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseArgs(argv) {
  const args = { label: 'run', mode: 'full', port: 9401, shots: true, strict: false, timeout: 300000 };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--label') args.label = argv[++i];
    else if (arg === '--mode') args.mode = argv[++i];
    else if (arg === '--port') args.port = Number(argv[++i]) || args.port;
    else if (arg === '--no-shot') args.shots = false;
    else if (arg === '--strict') args.strict = true;
    else if (arg === '--timeout') args.timeout = Number(argv[++i]) || args.timeout;
    else if (arg === '--help' || arg === '-h') {
      console.log('uso: node run.js [--label nombre] [--mode full|quick] [--port 9401] [--no-shot] [--strict]');
      process.exit(0);
    }
  }
  return args;
}

function chromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ].filter(Boolean);
  for (const candidate of candidates) {
    try { if (fs.existsSync(candidate)) return candidate; } catch (e) {}
  }
  return null;
}

async function waitForTarget(port, timeoutMs) {
  const started = Date.now();
  let lastError = null;
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await response.json();
      const page = list.find((item) => item.type === 'page' && /^file:/.test(item.url)) || list.find((item) => item.type === 'page');
      if (page && page.webSocketDebuggerUrl) return page;
    } catch (error) {
      lastError = error;
    }
    await sleep(250);
  }
  throw new Error('Chrome no expuso una pestaña en el puerto ' + port + (lastError ? ' (' + lastError.message + ')' : ''));
}

async function main() {
  const args = parseArgs(process.argv);
  fs.mkdirSync(SHOTS, { recursive: true });
  const executable = chromePath();
  if (!executable) throw new Error('No se encontró Chrome ni Edge. Define CHROME_PATH.');

  const built = build();
  console.log('harness:', built.out, '(' + Math.round(built.bytes / 1024) + ' KB)');

  const profile = path.join(OUT, 'profile-' + args.port);
  fs.rmSync(profile, { recursive: true, force: true });
  const url = pathToFileURL(path.join(HERE, 'harness.html')).href;
  const chromeArgs = [
    '--headless=new',
    '--disable-gpu',
    '--enable-unsafe-swiftshader',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--mute-audio',
    '--window-size=960,900',
    `--remote-debugging-port=${args.port}`,
    `--user-data-dir=${profile}`,
    url
  ];
  const proc = spawn(executable, chromeArgs, { stdio: 'ignore' });
  const errors = [];
  let ws = null;
  let finished = false;
  const watchdog = setTimeout(() => {
    if (!finished) {
      console.error('TIEMPO DE ESPERA AGOTADO (' + args.timeout + ' ms). Abortando.');
      try { proc.kill(); } catch (e) {}
      process.exit(2);
    }
  }, args.timeout);

  try {
    const page = await waitForTarget(args.port, 30000);
    ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
    let nextId = 0;
    const pending = new Map();
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.id && pending.has(message.id)) {
        const entry = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) entry.reject(new Error(JSON.stringify(message.error)));
        else entry.resolve(message.result);
        return;
      }
      if (message.method === 'Runtime.exceptionThrown') {
        const details = message.params.exceptionDetails || {};
        errors.push((details.text || '') + ' ' + ((details.exception && details.exception.description) || ''));
      }
      if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
        errors.push(String(message.params.entry.text || ''));
      }
      if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
        errors.push((message.params.args || []).map((a) => a.value || a.description || '').join(' '));
      }
    };
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async (expression, awaitPromise = false) => {
      const result = await send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true, userGesture: true });
      if (result.exceptionDetails) {
        const details = result.exceptionDetails;
        throw new Error((details.text || 'excepción') + ' ' + ((details.exception && details.exception.description) || ''));
      }
      return result.result ? result.result.value : undefined;
    };

    await send('Runtime.enable');
    await send('Log.enable');
    await send('Page.enable');

    const started = Date.now();
    let ready = false;
    while (Date.now() - started < 40000) {
      ready = await evaluate('!!(window.__V21_READY && window.__V21RUN)');
      if (ready) break;
      const pageErrors = await evaluate('(window.__V21RUN && window.__V21RUN.error) || null');
      if (pageErrors) throw new Error('El banco no cargó: ' + pageErrors);
      await sleep(300);
    }
    if (!ready) {
      const logText = await evaluate('(document.getElementById("log")||{}).textContent || ""');
      throw new Error('El banco no quedó listo. Log de la página: ' + String(logText).slice(0, 600));
    }
    const logText = await evaluate('(document.getElementById("log")||{}).textContent || ""');
    console.log('página:', String(logText).slice(0, 300));

    console.log('ejecutando banco (' + args.mode + ')…');
    const report = await evaluate('window.__V21RUN.run(' + JSON.stringify({ mode: args.mode }) + ')', true);
    if (!report) throw new Error('El driver no devolvió informe.');
    if (String(args.mode).indexOf('probe') === 0) {
      const probeFile = path.join(OUT, 'report-' + args.label + '.json');
      fs.writeFileSync(probeFile, JSON.stringify({ label: args.label, probe: report }, null, 2));
      console.log(JSON.stringify(report, null, 2));
      finished = true;
      clearTimeout(watchdog);
      return;
    }

    const shots = args.shots ? (report.shots || []) : [];
    report.shots = shots.map((shot) => shot.name);
    const json = {
      label: args.label,
      mode: args.mode,
      generatedAt: report.generatedAt,
      env: report.env,
      control: report.control,
      warnings: report.warnings,
      summary: report.summary,
      cases: report.cases
    };
    const reportFile = path.join(OUT, 'report-' + args.label + '.json');
    fs.writeFileSync(reportFile, JSON.stringify(json, null, 2));
    for (const shot of shots) {
      const match = /^data:image\/(jpeg|png);base64,(.+)$/.exec(shot.data || '');
      if (!match) continue;
      const ext = match[1] === 'png' ? 'png' : 'jpg';
      const file = path.join(SHOTS, args.label + '-' + String(shot.name).replace(/[^a-z0-9_.-]+/gi, '_').slice(0, 120) + '.' + ext);
      fs.writeFileSync(file, Buffer.from(match[2], 'base64'));
    }

    const s = report.summary || {};
    console.log('--- RESUMEN ' + args.label + ' ---');
    console.log('control           :', JSON.stringify(report.control));
    console.log('parpadeo héroes   :', s.heroFlatTotal, 'peor', JSON.stringify(s.heroFlatWorst && s.heroFlatWorst.worst));
    console.log('parpadeo guardian :', s.guardianFlatTotal);
    console.log('parpadeo efectos  :', s.effectFlatTotal);
    console.log('coplanares héroe  : sin resolver', s.heroCoplanarUnresolvedTotal, '· brutos', s.heroCoplanarRawCrossColorTotal);
    console.log('coplanares guardián:', s.guardianCoplanarUnresolvedTotal, '· brutos', s.guardianCoplanarRawCrossColorTotal);
    console.log('coplanares efectos:', s.effectCoplanarUnresolvedTotal, '· brutos', s.effectCoplanarRawCrossColorTotal);
    console.log('cosméticos (69×10):', s.cosmeticAuditCases, 'casos · sin resolver', s.cosmeticAuditUnresolvedTotal, '· brutos', s.cosmeticAuditCrossColorTotal, '· sameMesh color', s.cosmeticAuditSameMeshColorTotal);
    console.log('TOTAL             :', 'flicker', s.flickerTotal, '· coplanares sin resolver', s.coplanarUnresolvedTotal, '· brutos', s.coplanarRawCrossColorTotal, '· ok', s.ok);
    console.log('cámara near/far   :', report.env.cameraNear + '/' + report.env.cameraFar, '· shadowType', report.env.shadowTypeInitial, '->', report.env.shadowTypeAfterFirstRender);
    console.log('informe:', reportFile);
    if (errors.length) {
      console.log('errores de consola (' + errors.length + '):');
      errors.slice(0, 12).forEach((line) => console.log('  ·', line.slice(0, 300)));
    }
    finished = true;
    clearTimeout(watchdog);
    if (args.strict && !s.ok) process.exitCode = 1;
  } finally {
    if (ws) { try { ws.close(); } catch (e) {} }
    try { proc.kill(); } catch (e) {}
    setTimeout(() => { try { proc.kill(); } catch (e) {} }, 500);
  }
}

main().catch((error) => {
  console.error('ERROR:', error && error.message || error);
  process.exitCode = 1;
});
