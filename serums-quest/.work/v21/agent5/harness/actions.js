'use strict';
/* Agente 5 · contrato de acciones: open-recruit → recruit-confirm → select-hero. */
const fs = require('fs');
const path = require('path');
const PORT = 9338;
const URL_BASE = 'http://127.0.0.1:8899/.work/v21/agent5/harness/harness.html';
const SAVE = {
  coins: 99999,
  xp: 0,
  stage: 1,
  collection: { ownedCharacterIds: ['ilan'], ownedCosmeticIds: [], selectedCharacterId: 'ilan', equipped: {} },
  settings: { sound: false, ambient: false, muted: true, volume: 0.7, reducedMotion: false, extraTime: false, effectsQuality: 'alto', qualityChosen: true, hide3dFrames: false, textScale: 'normal', highContrast: false, tutorialSeen: true, backupReminder: false, feedbackMode: 'end', onlyOriginalBank: false }
};
(async () => {
  const list = await (await fetch('http://127.0.0.1:' + PORT + '/json/list')).json();
  const target = list.find((x) => x.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map();
  const consoleErrors = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.j(new Error(JSON.stringify(m.error))) : p.r(m.result); }
    if (m.method === 'Runtime.exceptionThrown') consoleErrors.push(m.params.exceptionDetails.text);
  };
  const send = (method, params = {}) => new Promise((r, j) => { const mid = ++id; pend.set(mid, { r, j }); ws.send(JSON.stringify({ id: mid, method, params })); });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const ev = async (expression, awaitPromise = false) => {
    const x = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise, userGesture: true });
    if (x.exceptionDetails) throw new Error(x.exceptionDetails.text + ' ' + ((x.exceptionDetails.exception || {}).description || ''));
    return x.result && x.result.value;
  };
  const shot = async (name) => {
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(__dirname, '..', 'shots', name + '.png'), Buffer.from(r.data, 'base64'));
  };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 768, deviceScaleFactor: 1, mobile: false });
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: "try{localStorage.setItem('serumsquest:voxel:state:v1', " + JSON.stringify(JSON.stringify(SAVE)) + ");}catch(e){}"
  });
  await send('Page.navigate', { url: URL_BASE });
  await sleep(2600);
  await ev('window.__H5 && window.__H5.ready()', true);
  await sleep(1200);
  const result = {};
  result.initial = await ev(`(function(){
    var card=document.querySelector('.v2-carousel-card.is-center');
    var cta=document.querySelector('.v2-carousel-card.is-center .v2-hero-cta');
    return { id: card.getAttribute('data-v2-id'), cta: cta.textContent.replace(/\\s+/g,' ').trim(), action: cta.getAttribute('data-action'),
      coins: (document.querySelector('.v2-hero-stat b')||{}).textContent, owner: (document.querySelector('.v2-hero-ownerText b')||{}).textContent };
  })()`);
  await ev('window.__H5.next()');
  await sleep(600);
  result.maraCard = await ev(`(function(){
    var card=document.querySelector('.v2-carousel-card.is-center');
    var cta=document.querySelector('.v2-carousel-card.is-center .v2-hero-cta');
    return { id: card.getAttribute('data-v2-id'), cta: cta.textContent.replace(/\\s+/g,' ').trim(), action: cta.getAttribute('data-action'), cls: cta.className };
  })()`);
  await ev('document.querySelector(".v2-carousel-card.is-center .v2-hero-cta[data-action=open-recruit]").click()');
  await sleep(800);
  await ev('window.__H5.freeze()');
  await sleep(250);
  result.recruit = await ev(`(function(){
    var btn=document.querySelector('.v2-hero-recruitBody [data-action=recruit-confirm]');
    var txt=document.body.innerText;
    return { hasConfirm: !!btn, confirmText: btn?btn.textContent.replace(/\\s+/g,' ').trim():null,
      screenHasName: txt.indexOf('Mara Solís') !== -1, balance: (document.querySelector('.v2-hero-balance b')||{}).textContent,
      priceRow: (document.querySelector('.v2-hero-reqRow')||{}).textContent };
  })()`);
  await shot('actions-recruit-confirm');
  if (result.recruit.hasConfirm) {
    await ev('document.querySelector(".v2-hero-recruitBody [data-action=recruit-confirm]").click()');
    await sleep(1200);
    result.afterBuy = await ev(`(function(){
      var card=document.querySelector('.v2-carousel-card.is-center');
      var cta=document.querySelector('.v2-carousel-card.is-center .v2-hero-cta');
      var save=null; try{ save=JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')); }catch(e){}
      return { screen: !!document.querySelector('.v2-carousel'), centerId: card?card.getAttribute('data-v2-id'):null,
        cta: cta?cta.textContent.replace(/\\s+/g,' ').trim():null, action: cta?cta.getAttribute('data-action'):null,
        coins: save?save.coins:null, owned: save?save.collection.ownedCharacterIds:null,
        toast: (document.querySelector('.toast')||{}).textContent || '' };
    })()`);
    await shot('actions-after-buy');
    if (result.afterBuy.action === 'select-hero') {
      await ev('document.querySelector(".v2-carousel-card.is-center .v2-hero-cta[data-action=select-hero]").click()');
      await sleep(1000);
      result.afterSelect = await ev(`(function(){
        var cta=document.querySelector('.v2-carousel-card.is-center .v2-hero-cta');
        var save=null; try{ save=JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')); }catch(e){}
        return { cta: cta?cta.textContent.replace(/\\s+/g,' ').trim():null, disabled: cta?cta.disabled:null,
          selected: save?save.collection.selectedCharacterId:null, owner: (document.querySelector('.v2-hero-ownerText b')||{}).textContent,
          toast: (document.querySelector('.toast')||{}).textContent || '' };
      })()`);
      await shot('actions-after-select');
    }
  }
  result.keyboard = await ev(`(function(){
    var before=document.querySelector('.v2-carousel-card.is-center').getAttribute('data-v2-id');
    window.dispatchEvent(new KeyboardEvent('keydown', {code:'ArrowRight', key:'ArrowRight', bubbles:true}));
    var after=document.querySelector('.v2-carousel-card.is-center').getAttribute('data-v2-id');
    return { before: before, after: after };
  })()`);
  result.errors = consoleErrors;
  fs.writeFileSync(path.join(__dirname, '..', 'shots', 'actions-verify.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  ws.close();
  process.exit(0);
})().catch((e) => { console.error('ACTIONS_ERROR', e.stack || e); process.exit(1); });
