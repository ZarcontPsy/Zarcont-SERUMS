'use strict';
/* Reproducción mínima del hallazgo ST04: los pesos de fuentes se revierten
   al recargar si antes otro ajuste escribió SETTINGS_KEY.
   Solo conduce la UI; no modifica el juego. */
const fs = require('fs');
const path = require('path');
const { open, sleep } = require('./cdp-lib');

const QA_DIR = __dirname;
const EVIDENCE = path.resolve(__dirname, '..', 'evidence');
const save = JSON.parse(fs.readFileSync(path.join(QA_DIR, 'save-full.json'), 'utf8'));
const SAVE_KEY = 'serumsquest:voxel:state:v1';
const SETTINGS_KEY = 'serumsquest:voxel:settings:v1';

function readKey(s, key) {
  return s.ev(`(() => { try { return JSON.parse(localStorage.getItem(${JSON.stringify(key)}) || 'null'); } catch (e) { return null; } })()`);
}
function sliders(s) {
  return s.ev(`(() => {
    const o = {};
    document.querySelectorAll('#screen [data-v2-weight]').forEach(function (e) {
      o[e.getAttribute('data-v2-weight')] = Number(e.value) / 100;
    });
    return o;
  })()`);
}
function pickSettings(settingsObj) {
  return settingsObj ? {
    quality: settingsObj.effectsQuality,
    weights: settingsObj.sourceWeights
  } : null;
}
async function tail(s, label) {
  const main = await readKey(s, SAVE_KEY);
  const settings = await readKey(s, SETTINGS_KEY);
  const ui = await sliders(s);
  const keys = await s.ev('Object.keys(localStorage).sort()');
  const htmlWeight = await s.ev(`(() => {
    try {
      const html = window.__V2 && window.__V2.feedback && window.__V2.feedback.settingsHTML ? window.__V2.feedback.settingsHTML() : '';
      const m = /value="(\\d+)"[^>]*data-v2-weight="campaign"/.exec(html || '');
      return { matched: !!m, value: m ? Number(m[1]) / 100 : null, snippet: String(html || '').slice(0, 80) };
    } catch (e) { return { error: String(e) }; }
  })()`);
  const rawSettings = await s.ev(`(() => { const v = localStorage.getItem(${JSON.stringify(SETTINGS_KEY)}); return v == null ? null : { length: v.length, head: v.slice(0, 240) }; })()`);
  return {
    label,
    saveQuality: main && main.settings && main.settings.effectsQuality,
    saveWeights: main && main.settings && main.settings.sourceWeights,
    settingsKey: pickSettings(settings),
    rawSettingsKey: rawSettings,
    uiWeights: ui,
    htmlWeight: htmlWeight,
    storageKeys: keys
  };
}

(async () => {
  const s = await open({ port: 9387, profile: path.join(QA_DIR, 'agent7-profile-9387') });
  const out = { startedAt: new Date().toISOString(), steps: [], screenshot: null };
  try {
    await s.seed(save);
    await s.ev(`localStorage.removeItem(${JSON.stringify(SETTINGS_KEY)})`);
    await s.send('Page.reload', { ignoreCache: true });
    await sleep(2600);
    if (await s.ev("!!document.querySelector('[data-action=tutorial-skip]')")) await s.click('[data-action="tutorial-skip"]', 300);
    await s.click('#screen [data-action="open-settings"]', 600);

    // 1) Un ajuste previo (calidad) escribe SETTINGS_KEY.
    await s.click('#screen [data-action="set-effects-quality"][data-quality="bajo"]', 700);
    out.steps.push(await tail(s, 'tras cambiar calidad (sin tocar pesos)'));

    // 2) El usuario cambia el peso de Campaña a 70 %.
    await s.ev(`(() => {
      const el = document.querySelector('#screen [data-v2-weight="campaign"]');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, '70');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`);
    await sleep(800);
    out.steps.push(await tail(s, 'tras cambiar peso Campaña a 70 %'));

    // 3) Recarga y observa el peso efectivo (sliders) frente a SAVE_KEY.
    await s.send('Page.reload', { ignoreCache: true });
    await sleep(2600);
    if (await s.ev("!!document.querySelector('[data-action=tutorial-skip]')")) await s.click('[data-action="tutorial-skip"]', 300);
    await s.click('#screen [data-action="open-settings"]', 700);
    const after = await tail(s, 'tras recargar y abrir Ajustes');
    out.steps.push(after);
    out.reproduced = after.uiWeights && Math.abs(Number(after.uiWeights.campaign) - 0.7) > 0.001;
    out.screenshot = path.join(EVIDENCE, 'agent7-weight-repro.png');
    await s.shot(out.screenshot);
    fs.writeFileSync(path.join(EVIDENCE, 'agent7-weight-repro.json'), JSON.stringify(out, null, 2), 'utf8');
    console.log(JSON.stringify(out, null, 2));
  } catch (e) {
    out.error = String(e && e.stack || e);
    fs.writeFileSync(path.join(EVIDENCE, 'agent7-weight-repro.json'), JSON.stringify(out, null, 2), 'utf8');
    console.error(out.error);
    process.exitCode = 1;
  } finally {
    await s.close();
  }
})();
