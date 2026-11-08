'use strict';
/* Dry-run de selectores V2.1 sobre el build actual. No escribe evidencia final. */
const fs = require('fs');
const path = require('path');
const { open, sleep } = require('./cdp-lib.js');
const QA = __dirname;
const ROOT = path.resolve(__dirname, '..', '..', '..');
const saveMission = JSON.parse(fs.readFileSync(path.join(QA, 'save-world-low.json'), 'utf8'));
saveMission.missions = {}; saveMission.questions = {}; saveMission.errors = {}; saveMission.questionTags = {};
saveMission.settings = { feedbackMode: 'end', onlyOriginalBank: false, effectsQuality: 'alto', qualityChosen: true, backupReminder: false, tutorialSeen: true, sourceWeights: { campaign: 0.6, dashboard: 0.15, flashcards: 0.25 } };
const saveHigh = JSON.parse(fs.readFileSync(path.join(QA, 'save-world-mastery-etica.json'), 'utf8'));
saveHigh.settings = saveMission.settings;
saveHigh.v2 = saveHigh.v2 || {}; saveHigh.v2.world = saveHigh.v2.world || {};
saveHigh.v2.world.restored = { 'area-psi-salud-publica': 3, 'area-psi-cuidado-integral': 2, 'area-psi-etica': 3, 'area-psi-investigacion': 1, 'area-psi-gestion': 2 };

(async () => {
  const s = await open({ gpu: true, width: 1280, height: 720, port: 9396 });
  const out = {};
  try {
    await s.seed(saveMission);
    await sleep(900);
    out.version = await s.ev("({title:(document.querySelector('.titleVersion')||{}).textContent||'', V:window.__V2&&window.__V2.version, apis:{summary:!!(window.__V2&&window.__V2.summary),perf:!!(window.__V2&&window.__V2.perf),duel:!!(window.__V2&&window.__V2.duel),fb:window.__V2&&window.__V2.feedback?{inline:typeof window.__V2.feedback.inlineEnabled,auto:typeof window.__V2.feedback.autoAdvanceDelay,mode:typeof window.__V2.feedback.feedbackMode}:null}})");
    await s.ev("document.querySelector('#screen [data-action=menu-continue]')?.click()");
    await sleep(1000);
    // settings selectors
    await s.ev("document.querySelector('#hud [data-action=open-pause]')?.click()"); await sleep(500);
    await s.ev("document.querySelector('#screen [data-action=open-settings]')?.click()"); await sleep(900);
    out.settings = await s.ev(`(() => {
      const text = String((document.querySelector('#screen')||{}).innerText||'');
      return { screen: window.__gameState().screen,
        modeBtns: [...document.querySelectorAll('[data-action=v2-feedback-mode]')].map(e=>({m:e.getAttribute('data-mode'),t:e.innerText.replace(/\\n/g,' | ').slice(0,90)})),
        bank: !!document.querySelector('[data-action=v2-perf-original-bank]'),
        perf: !!document.querySelector('[data-v2-perf-settings]'),
        modeSection: !!document.querySelector('[data-v2-feedback-mode-settings]'),
        endText: /al final/i.test(text), eachText: /tras cada|cada pregunta/i.test(text), bankText: /banco original/i.test(text) };
    })()`);
    // close settings and pause
    await s.ev("document.querySelector('#screen [data-action=close-settings]')?.click()"); await sleep(500);
    if (await s.ev("window.__gameState().screen") === 'pause') { await s.ev("document.querySelector('#screen [data-action=close-pause]')?.click()"); await sleep(500); }
    // mission summary
    await s.ev("document.querySelector('#hud [data-action=open-journal], #screen [data-action=open-journal]')?.click()"); await sleep(800);
    await s.ev("document.querySelector('#screen [data-action=select-area][data-area=\"area-psi-salud-publica\"]')?.click()"); await sleep(500);
    await s.ev("document.querySelector('#screen [data-action=select-mission][data-mission=\"mission-sp-1\"]')?.click()"); await sleep(500);
    await s.ev("document.querySelector('#screen [data-action=start-mission]')?.click()"); await sleep(1600);
    out.missionScreen = await s.ev("window.__gameState().screen");
    async function q() { return s.ev(`(() => { const b=document.querySelector('[data-action="toggle-question-tag"][data-tag="difficult"]'); const id=b&&b.getAttribute('data-question'); const q=id&&window.CAMPAIGN_DATA.questions[id]; return q?{id,answer:q.answer,opts:q.options.map(o=>o.id)}:null; })()`); }
    for (let i=0;i<5;i++) {
      const qq = await q(); if (!qq) break;
      const letter = i===1 ? qq.opts.find(x=>x!==qq.answer) : qq.answer;
      await s.ev(`(() => { const b=document.querySelector('#screen [data-action=answer][data-letter="${letter}"]'); if(b)b.click(); })()`);
      await sleep(2200);
      if (await s.ev("window.__gameState().screen === 'result'")) break;
    }
    await sleep(800);
    out.result = await s.ev(`(() => {
      const root = document.querySelector('[data-v2-summary]');
      const items = root ? [...root.querySelectorAll('[data-v2-summary-item]')] : [];
      return { screen: window.__gameState().screen,
        summary: !!root, items: items.length,
        statuses: items.map(e=>({c:e.className, t:String((e.querySelector('.v2-summary__status')||{}).innerText||'').trim()})),
        filters: root ? [...root.querySelectorAll('[data-action=v2-summary-filter]')].map(e=>({f:e.getAttribute('data-filter'),t:e.innerText.trim()})) : [],
        difficult: root ? root.querySelectorAll('[data-action=v2-summary-difficult]').length : 0,
        flash: root ? root.querySelectorAll('[data-action=v2-summary-flashcard]').length : 0,
        text: String((document.querySelector('#screen')||{}).innerText||'').slice(0,600) };
    })()`);
    if (out.result.summary) {
      await s.ev("document.querySelector('[data-action=v2-summary-filter][data-filter=wrong]')?.click()"); await sleep(600);
      out.filtered = await s.ev(`(() => ({items:document.querySelectorAll('[data-v2-summary-item]').length, wrong:document.querySelectorAll('[data-v2-summary-item].is-wrong').length, txt:String((document.querySelector('[data-v2-summary]')||{}).innerText||'').slice(0,300)}))()`);
      await s.ev("document.querySelector('[data-action=v2-summary-filter][data-filter=all]')?.click()"); await sleep(400);
      await s.ev("document.querySelector('[data-action=v2-summary-flashcard]')?.click()"); await sleep(700);
      out.flashcard = await s.ev("({open:!!document.querySelector('.v2-flashcard,[data-v2-flashcard]'), txt:String((document.querySelector('.v2-flashcard,[data-v2-flashcard]')||{}).innerText||'').slice(0,160)})");
      await s.ev("document.querySelector('[data-action=v2-flashcard-close]')?.click()"); await sleep(400);
    }
    out.warnings = Array.from(new Set(s.errors));
    // restoration decay
    await s.seed(saveHigh); await sleep(1000);
    await s.ev("document.querySelector('#screen [data-action=menu-continue]')?.click()"); await sleep(1400);
    out.restoreBefore = await s.ev("window.__V2 && window.__V2.world ? window.__V2.world.stats().restoration : null");
    const st = await s.ev(`(() => { try { return JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')||'null'); } catch(e){ return null; } })()`);
    if (st) {
      st.v2 = st.v2 || {}; st.v2.world = st.v2.world || {};
      st.v2.world.stations = {}; st.v2.world.chests = {}; st.v2.world.guides = {}; st.v2.world.fragments = {}; st.v2.world.visited = {};
      await s.ev(`localStorage.setItem('serumsquest:voxel:state:v1', ${JSON.stringify(JSON.stringify(st))})`);
      await s.send('Page.reload', { ignoreCache: true }); await sleep(2600);
      await s.ev("document.querySelector('#screen [data-action=menu-continue]')?.click()"); await sleep(1600);
      out.restoreAfter = await s.ev("window.__V2 && window.__V2.world ? window.__V2.world.stats().restoration : null");
    }
  } catch (e) { out.error = String(e && e.stack || e); }
  finally { await s.close(); }
  console.log(JSON.stringify(out, null, 2).slice(0, 16000));
})();

