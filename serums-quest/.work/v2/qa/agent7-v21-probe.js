'use strict';
/* Sonda rápida V2.1 · no modifica el juego. Solo lectura/observación. */
const fs = require('fs');
const path = require('path');
const { open, sleep } = require('./cdp-lib.js');
const QA = __dirname;
const ROOT = path.resolve(__dirname, '..', '..', '..');
const EVIDENCE = path.join(ROOT, '.work', 'v2', 'evidence');
const OUT = path.join(QA, 'agent7-v21-probe.json');
const saveFull = JSON.parse(fs.readFileSync(path.join(QA, 'save-full.json'), 'utf8'));
const K = { KeyG: ['KeyG', 'g', 71], Escape: ['Escape', 'Escape', 27], Enter: ['Enter', 'Enter', 13], ArrowRight: ['ArrowRight', 'ArrowRight', 39] };
async function press(s, code) {
  const k = K[code] || [code, code, 0];
  await s.send('Input.dispatchKeyEvent', { type: 'keyDown', code: k[0], key: k[1], windowsVirtualKeyCode: k[2] });
  await s.send('Input.dispatchKeyEvent', { type: 'keyUp', code: k[0], key: k[1], windowsVirtualKeyCode: k[2] });
  await sleep(500);
}
(async () => {
  const s = await open({ gpu: true, width: 1280, height: 720, port: 9395 });
  const out = {};
  try {
    await s.seed(saveFull);
    await sleep(1000);
    await s.ev("document.querySelector('#screen [data-action=menu-continue]')?.click()");
    await sleep(1200);
    out.screen1 = await s.ev("window.__gameState().screen");
    // heroes
    const heroOpen = await s.ev("(() => { const b=document.querySelector('#hud [data-action=open-heroes]'); if(b){b.click();return true;} return false; })()");
    await sleep(1600);
    out.heroOpen = heroOpen;
    out.heroes = await s.ev(`(() => {
      const st = window.__gameState();
      const cards = [...document.querySelectorAll('.v2-hero-card')];
      const stage = document.querySelector('.v2-carousel-card.is-center [data-v2-stage]') || document.querySelector('[data-v2-stage]');
      return {
        screen: st.screen, cards: cards.length,
        names: cards.map(c => (c.querySelector('.v2-hero-name')||{}).textContent||''),
        center: (document.querySelector('.v2-carousel-card.is-center .v2-hero-name')||{}).textContent||'',
        hasCanvas: !!document.querySelector('.v2-hero-canvas'),
        stage: stage ? {w:stage.clientWidth,h:stage.clientHeight} : null,
        pos: (document.querySelector('[data-v2-pos]')||{}).textContent||'',
        all: [...document.querySelectorAll('[data-v2-pos],.v2-carousel-pos')].map(e=>e.innerText)
      };
    })()`);
    if (out.heroOpen) await s.shot(path.join(EVIDENCE, 'agent7-v21-probe-heroes.png'));
    const seq = [];
    for (let i=0;i<5;i++) {
      const before = await s.ev("(document.querySelector('.v2-carousel-card.is-center .v2-hero-name')||{}).textContent||''");
      await s.ev("document.querySelector('#screen [data-action=v2-hero-next]')?.click()");
      await sleep(750);
      const after = await s.ev("(document.querySelector('.v2-carousel-card.is-center .v2-hero-name')||{}).textContent||''");
      seq.push({before, after});
    }
    out.heroNav = seq;
    await s.ev("document.querySelector('#screen [data-action=close-sheet]')?.click()");
    await sleep(900);
    out.screen2 = await s.ev("window.__gameState().screen");
    // pause -> settings
    await press(s, 'Escape');
    out.screen3 = await s.ev("window.__gameState().screen");
    await s.ev("document.querySelector('#screen [data-action=open-settings]')?.click()");
    await sleep(1200);
    out.settings = await s.ev(`(() => {
      const st = window.__gameState();
      const root = document.querySelector('#screen');
      return {
        screen: st.screen,
        text: root ? root.innerText.slice(0, 3000) : '',
        actions: [...(root?root.querySelectorAll('[data-action]'):[])].map(e=>e.getAttribute('data-action')).filter((v,i,a)=>a.indexOf(v)===i),
        feedbackSettings: !!(root&&root.querySelector('[data-v2-feedback-settings]')),
        perfSettings: !!(root&&root.querySelector('[data-v2-perf-settings]')),
        settings: st.settings
      };
    })()`);
    await s.shot(path.join(EVIDENCE, 'agent7-v21-probe-settings.png'));
    // close settings, close pause
    await s.ev("document.querySelector('#screen [data-action=close-settings]')?.click()");
    await sleep(900);
    out.screen4 = await s.ev("window.__gameState().screen");
    if (out.screen4 === 'pause') { await s.ev("document.querySelector('#screen [data-action=close-pause]')?.click()"); await sleep(700); }
    if ((await s.ev("window.__gameState().screen")) !== 'hub') { await press(s, 'Escape'); await sleep(500); }
    out.screen5 = await s.ev("window.__gameState().screen");
    // modes
    await press(s, 'KeyG');
    await sleep(900);
    out.screenModes = await s.ev("window.__gameState().screen");
    await s.ev("document.querySelector('#screen [data-action=open-practice]')?.click()");
    await sleep(1000);
    out.screenPicker = await s.ev("window.__gameState().screen");
    await s.ev("document.querySelector('#screen [data-action=start-practice][data-area=\"area-psi-salud-publica\"]')?.click()");
    await sleep(1600);
    out.practiceStart = await s.ev(`(() => { const st=window.__gameState(); return {screen:st.screen, mode:st.mode, total:st.questionTotal, index:st.questionIndex, feedbackOpen:st.feedbackOpen}; })()`);
    const q1 = await s.ev(`(() => {
      const btn = document.querySelector('[data-action="toggle-question-tag"][data-tag="difficult"]');
      const id = btn && btn.getAttribute('data-question');
      const q = id && window.CAMPAIGN_DATA && window.CAMPAIGN_DATA.questions ? window.CAMPAIGN_DATA.questions[id] : null;
      return q ? {id:q.id, answer:q.answer, source:q.source, generated:q.generated, stem:q.stem.slice(0,100)} : null;
    })()`);
    out.q1 = q1;
    await s.ev(`(() => { const b=document.querySelector('#screen [data-action="answer"][data-letter="${q1 ? q1.answer : 'A'}"]'); if(b) b.click(); return !!b; })()`);
    await sleep(500);
    out.feedbackAfterAnswer = await s.ev(`(() => {
      const v2 = document.querySelector('.v2-feedback[data-v2-feedback]');
      const legacy = document.querySelector('.feedbackStrip');
      const st = window.__gameState();
      return {
        v2Open: !!v2, legacy: !!legacy, index: st.questionIndex, screen: st.screen, feedbackOpen: st.feedbackOpen,
        text: (v2||legacy)?String((v2||legacy).innerText).slice(0,800):'',
        hasContinue: !!(v2 && v2.querySelector('[data-action=v2-feedback-continue]')),
        hasFlash: !!(v2 && v2.querySelector('[data-action=v2-feedback-flashcard]')),
        actions: v2 ? [...v2.querySelectorAll('[data-action]')].map(e=>e.getAttribute('data-action')) : []
      };
    })()`);
    if (out.feedbackAfterAnswer.v2Open || out.feedbackAfterAnswer.legacy) await s.shot(path.join(EVIDENCE, 'agent7-v21-probe-feedback.png'));
    const idxBeforeWait = await s.ev("window.__gameState().questionIndex");
    await sleep(2600);
    const idxAfterWait = await s.ev("window.__gameState().questionIndex");
    out.autoAdvanceProbe = { idxBeforeWait, idxAfterWait };
    await s.ev("document.querySelector('[data-action=v2-feedback-continue]')?.click()");
    await sleep(900);
    out.afterContinueNext = await s.ev(`(() => {
      const st=window.__gameState();
      const chip = document.querySelector('#screen .chip--generated');
      const allChips = [...document.querySelectorAll('#screen .chip')].map(e=>String(e.textContent||'').trim());
      const btn = document.querySelector('[data-action="toggle-question-tag"][data-tag="difficult"]');
      const id = btn && btn.getAttribute('data-question');
      const q = id && window.CAMPAIGN_DATA.questions[id];
      return {screen:st.screen, index:st.questionIndex, feedbackOpen:st.feedbackOpen, generatedChip: chip?String(chip.textContent||'').trim():null, chips: allChips, source:q&&q.source, generated:q&&q.generated, id:id};
    })()`);
    await s.shot(path.join(EVIDENCE, 'agent7-v21-probe-question.png'));
    out.errors = s.errors;
    out.requests = s.requests.filter(r => !/^(file|data|blob|about|chrome):/i.test(r.url));
  } catch (e) {
    out.error = String(e && e.stack || e);
  } finally {
    await s.close();
  }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2).slice(0, 15000));
})();
