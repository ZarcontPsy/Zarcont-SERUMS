'use strict';
/* Checkpoint 1 V2: capturas y métricas. No modifica el juego; solo lo conduce por la UI. */
const fs = require('fs');
const path = require('path');
const { open, sleep } = require('./cdp-lib');

const root = path.resolve(__dirname, '..', '..', '..');
const evidence = path.join(__dirname, '..', 'evidence');
const save = JSON.parse(fs.readFileSync(path.join(__dirname, 'save-full.json'), 'utf8'));
const campaign = JSON.parse(fs.readFileSync(path.join(root, 'src', 'campaign.json'), 'utf8'));
const results = { startedAt: new Date().toISOString(), steps: [], shots: [], errors: [], network: [], fps: {}, counts: {} };

function norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}
function questionForStem(stem) {
  const n = norm(stem);
  const list = Object.values(campaign.questions);
  return list.find((q) => norm(q.stem) === n) || list.find((q) => n.indexOf(norm(q.stem).slice(0, 50)) === 0) || null;
}
async function collectFps(s, seconds) {
  const samples = [];
  const end = Date.now() + seconds * 1000;
  while (Date.now() < end) {
    const st = await s.state();
    if (st && st.fps) samples.push(st.fps);
    await sleep(120);
  }
  if (!samples.length) return { min: null, avg: null, samples: 0 };
  return { min: Math.min.apply(null, samples), avg: Math.round(samples.reduce((a, b) => a + b, 0) / samples.length), samples: samples.length };
}
async function enterHub(s) {
  if (await s.ev("!!document.querySelector('[data-action=menu-continue]')")) await s.click('[data-action="menu-continue"]', 900);
  else if (await s.ev("!!document.querySelector('[data-action=enter-game]')")) await s.click('[data-action="enter-game"]', 900);
  await sleep(500);
  if (await s.ev("!!document.querySelector('[data-action=backup-off]')")) await s.click('[data-action="backup-off"]', 250);
}
async function openJournalFor(s, areaId, missionId) {
  const st = await s.state();
  if (st && st.screen === 'hub') await s.key('KeyJ');
  else if (await s.ev("!!document.querySelector('[data-action=open-journal]')")) await s.click('[data-action="open-journal"]', 450);
  await sleep(500);
  if (!(await s.ev("!!document.querySelector('[data-action=select-area]')"))) {
    const dbg = await s.ev("({ screen: window.__gameState && window.__gameState().screen, text: (document.body.innerText||'').slice(0,300), actions: [...document.querySelectorAll('[data-action]')].map(e=>e.getAttribute('data-action')).slice(0,30) })");
    throw new Error('journal sin áreas :: ' + JSON.stringify(dbg));
  }
  await s.click(`[data-action="select-area"][data-area="${areaId}"]`, 450);
  await s.click(`[data-action="select-mission"][data-mission="${missionId}"]`, 450);
  const start = await s.ev("!!document.querySelector('[data-action=start-mission]')");
  if (!start) throw new Error('sin botón start-mission para ' + missionId);
  await s.click('[data-action="start-mission"]', 1200);
}
async function currentAnswer(s) {
  const found = await s.ev(`(() => {
    var stem = (document.querySelector('.questionText')||{}).textContent || '';
    var norm = function (x) { return String(x||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim(); };
    var n = norm(stem);
    var qs = (window.CAMPAIGN_DATA && window.CAMPAIGN_DATA.questions) ? Object.keys(window.CAMPAIGN_DATA.questions).map(function(id){return window.CAMPAIGN_DATA.questions[id];}) : [];
    var q = qs.filter(function(x){return norm(x.stem)===n;})[0] || qs.filter(function(x){return n.indexOf(norm(x.stem).slice(0,50))===0;})[0] || null;
    return { stem: stem, answer: q ? q.answer : null, areaId: q ? q.areaId : null, source: q ? q.source : null, explanation: q ? (q.explanation||'').slice(0,120) : '' };
  })()`);
  return found || { stem: '', answer: null, areaId: null, source: null };
}
async function hideFeedback(s) {
  await s.ev(`(() => {
    document.querySelectorAll('[class*="v2-feedback"], [id*="v2-feedback"], .feedbackStrip').forEach(function(e){ e.style.visibility='hidden'; e.style.pointerEvents='none'; });
    return true;
  })()`);
}
async function shot(s, name) {
  const file = path.join(evidence, name);
  await s.shot(file);
  results.shots.push(file);
  return file;
}

(async () => {
  const s = await open({ port: 9360, width: 1280, height: 720, gpu: true });
  try {
    await s.seed(save);
    results.counts.questions = await s.ev('window.CAMPAIGN_DATA && window.CAMPAIGN_DATA.meta && window.CAMPAIGN_DATA.meta.questionCount');
    results.counts.sources = await s.ev('window.CAMPAIGN_DATA && window.CAMPAIGN_DATA.meta && window.CAMPAIGN_DATA.meta.sourceCounts');
    await enterHub(s);
    results.steps.push({ step: 'hub', state: await s.state() });
    await sleep(900);
    await shot(s, '00-atrio-v2.png');

    // Selector de héroes
    await s.key('KeyH');
    await sleep(1200);
    results.steps.push({ step: 'selector', state: await s.state(), text: (await s.text()).slice(0, 300) });
    await shot(s, '01-selector-heroes.png');
    await s.key('Escape');
    await sleep(500);

    // Ajustes con pesos de fuentes
    await s.key('Escape');
    await sleep(400);
    if (await s.ev("!!document.querySelector('[data-action=open-settings]')")) {
      await s.click('[data-action="open-settings"]', 600);
      results.steps.push({ step: 'settings', text: (await s.text()).slice(0, 500) });
      await shot(s, '02-ajustes-pesos.png');
      if (await s.ev("!!document.querySelector('[data-v2-feedback-settings]')")) {
        await s.ev("document.querySelector('[data-v2-feedback-settings]').scrollIntoView({block:'center'})");
        await sleep(350);
        await shot(s, '02b-ajustes-pesos-detalle.png');
      }
      if (await s.ev("!!document.querySelector('[data-action=close-settings]')")) await s.click('[data-action="close-settings"]', 350);
    }
    if (await s.ev("!!document.querySelector('[data-action=close-pause]')")) await s.click('[data-action="close-pause"]', 350);

    // FPS atrio
    results.fps.hub = await collectFps(s, 2.5);

    // Feedback acierto y error + ataques por área
    await s.seed(save);
    await enterHub(s);
    const areas = [
      { areaId: 'area-psi-salud-publica', mission: 'mission-sp-1', name: 'territorio' },
      { areaId: 'area-psi-cuidado-integral', mission: 'mission-ci-1', name: 'cuidado' },
      { areaId: 'area-psi-etica', mission: 'mission-et-1', name: 'confianza' },
      { areaId: 'area-psi-investigacion', mission: 'mission-in-1', name: 'evidencia' },
      { areaId: 'area-psi-gestion', mission: 'mission-ge-1', name: 'sistema' }
    ];
    for (let i = 0; i < areas.length; i++) {
      const area = areas[i];
      if (i > 0) {
        await s.seed(save);
        await enterHub(s);
      }
      await openJournalFor(s, area.areaId, area.mission);
      if (i === 0) results.fps.duel = await collectFps(s, 1.8);
      const q = await currentAnswer(s);
      results.steps.push({ step: 'duel-' + area.name, question: q.stem.slice(0, 90), answer: q.answer });
      if (!q.answer) throw new Error('No se pudo identificar la respuesta de la pregunta actual');
      // Ataque del guardián: responder mal
      const wrong = ['A', 'B', 'C', 'D'].find((x) => x !== q.answer);
      await s.click(`[data-action="answer"][data-letter="${wrong}"]`, 180);
      await shot(s, `03-ataque-${i + 1}-${area.name}-a.png`);
      await sleep(260);
      await hideFeedback(s);
      await shot(s, `04-ataque-${i + 1}-${area.name}-b.png`);
      // Feedback de error
      await s.ev(`document.querySelectorAll('[class*="v2-feedback"], [id*="v2-feedback"]').forEach(function(e){ e.style.visibility=''; e.style.pointerEvents=''; });`);
      await sleep(250);
      await shot(s, `05-feedback-error-${i + 1}-${area.name}.png`);
      if (i === 0) {
        // Continuar y acertar para el feedback de acierto
        if (await s.ev("!!document.querySelector('[data-action=v2-feedback-continue]')")) await s.click('[data-action="v2-feedback-continue"]', 600);
        else if (await s.ev("!!document.querySelector('[data-action=next-question]')")) await s.click('[data-action="next-question"]', 600);
        const q2 = await currentAnswer(s);
        if (q2.answer) {
          await s.click(`[data-action="answer"][data-letter="${q2.answer}"]`, 500);
          await shot(s, '06-feedback-acierto.png');
        }
      }
      if (await s.ev("!!document.querySelector('[data-action=open-pause]')")) {
        await s.click('[data-action="open-pause"]', 300);
        if (await s.ev("!!document.querySelector('[data-action=abandon-duel]')")) await s.click('[data-action="abandon-duel"]', 500);
      }
    }

    // Mapa e islas
    await s.seed(save);
    await enterHub(s);
    if (await s.ev("!!document.querySelector('[data-action=open-map]')")) await s.click('[data-action="open-map"]', 1800);
    else await s.key('KeyM');
    await sleep(1400);
    results.steps.push({ step: 'map', state: await s.state() });
    await shot(s, '07-mapa-completo.png');
    results.fps.map = await collectFps(s, 2);
    const areaButtons = await s.ev("[...document.querySelectorAll('[data-action=map-area]')].map(e=>e.getAttribute('data-area'))");
    for (let i = 0; i < (areaButtons || []).length; i++) {
      await s.click(`[data-action="map-area"][data-area="${areaButtons[i]}"]`, 1100);
      await shot(s, `08-isla-${i + 1}-${areaButtons[i].replace('area-psi-', '')}.png`);
    }

    results.fps.duel = results.fps.duel || { note: 'medido durante los ataques por área' };
    results.network = s.requests.filter((u) => !/^(file|data|blob):/.test(u));
    results.errors = s.errors.slice(0, 30);
    results.counts.state = await s.state();
    fs.writeFileSync(path.join(evidence, 'checkpoint1-capture.json'), JSON.stringify(results, null, 2));
    console.log(JSON.stringify({ ok: true, shots: results.shots.length, fps: results.fps, network: results.network.length, errors: results.errors.length, counts: results.counts }, null, 2));
  } catch (e) {
    results.error = e.stack || String(e);
    results.errors = s.errors.slice(0, 30);
    fs.writeFileSync(path.join(evidence, 'checkpoint1-capture.json'), JSON.stringify(results, null, 2));
    console.error('CAPTURE_ERROR', e.stack || e);
    process.exitCode = 1;
  } finally {
    await s.close();
  }
})();
