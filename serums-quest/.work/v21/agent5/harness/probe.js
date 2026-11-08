'use strict';
/* Agente 5 · prueba de layout por CDP contra el harness local. */
const fs = require('fs');
const path = require('path');
const outDir = path.join(__dirname, '..', 'shots');
fs.mkdirSync(outDir, { recursive: true });
const PORT = Number(process.argv[2]) || 9338;
const URL_BASE = process.argv[3] || 'http://127.0.0.1:8899/.work/v21/agent5/harness/harness.html';
const sizes = [
  { label: '960x540', w: 960, h: 540, mobile: false },
  { label: '1280x720', w: 1280, h: 720, mobile: false },
  { label: '1024x768', w: 1024, h: 768, mobile: false },
  { label: 'tablet-touch-1024x768', w: 1024, h: 768, mobile: true }
];

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.onopen = () => resolve(ws);
    ws.onerror = (e) => reject(new Error('ws error'));
  });
}

(async () => {
  const list = await (await fetch('http://127.0.0.1:' + PORT + '/json/list')).json();
  let target = list.find((x) => x.type === 'page');
  if (!target) throw new Error('sin página en el navegador');
  const ws = await connect(target.webSocketDebuggerUrl);
  let id = 0;
  const pend = new Map();
  const consoleErrors = [];
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pend.has(msg.id)) {
      const p = pend.get(msg.id); pend.delete(msg.id);
      msg.error ? p.j(new Error(JSON.stringify(msg.error))) : p.r(msg.result);
    }
    if (msg.method === 'Runtime.exceptionThrown') consoleErrors.push(msg.params.exceptionDetails.text + ' ' + ((msg.params.exceptionDetails.exception || {}).description || ''));
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') consoleErrors.push(msg.params.entry.text);
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
    const file = path.join(outDir, name + '.png');
    fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
    return file;
  };
  const reload = async () => {
    await send('Page.navigate', { url: URL_BASE });
    /* La navegación devuelve antes de cargar: espera al documento nuevo antes
       de consultar __H5, o el driver respondería desde la página anterior. */
    await sleep(1600);
    await ev('window.__H5 && window.__H5.ready()', true);
    await sleep(1500);
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  /* Deja la partida por defecto (Ilan, 1/10, 0 monedas) tras las pruebas de
     compra: localStorage persiste entre navegaciones del mismo perfil. */
  await send('Page.navigate', { url: URL_BASE });
  await sleep(2600);
  await ev("try{localStorage.removeItem('serumsquest:voxel:state:v1');}catch(e){}");
  const results = { url: URL_BASE, sizes: {}, consoleErrors };
  for (const size of sizes) {
    await send('Emulation.setDeviceMetricsOverride', { width: size.w, height: size.h, deviceScaleFactor: 1, mobile: size.mobile });
    if (size.mobile) {
      await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
      await send('Emulation.setEmitTouchEventsForMouse', { enabled: false });
    } else {
      await send('Emulation.setTouchEmulationEnabled', { enabled: false });
    }
    await reload();
    await ev('window.__H5.freeze()');
    await sleep(size.mobile ? 900 : 500);
    const first = await ev('window.__H5.measure()');
    const diag = await ev(`(function(){
      var center=document.querySelector('.v2-carousel-card.is-center');
      return { hasCarousel: !!document.querySelector('.v2-carousel'), hasCenter: !!center, centerId: center?center.getAttribute('data-v2-id'):null,
        screenText: document.body.innerText.replace(/\\s+/g,' ').slice(0,160),
        cards: document.querySelectorAll('[data-v2-card]').length,
        tutorials: !!document.querySelector('.tutorialShell'), overlayClass: (document.querySelector('.overlay')||{}).className||'' };
    })()`);
    await shot('current-' + size.label + '-heroes');
    const beforeId = await ev('(function(){var c=document.querySelector(".v2-carousel-card.is-center");return c?c.getAttribute("data-v2-id"):null;})()');
    if (!beforeId) {
      results.sizes[size.label] = { first, diag, skip: 'sin tarjeta central' };
      await send('Page.navigate', { url: 'about:blank' });
      await sleep(150);
      continue;
    }
    /* Cambio de tarjeta en el mismo tick: comprueba que el canvas se mueve al
       nuevo centro sin quedar vacío, sin opacidad 0 ni transform heredado. */
    const navSync = await ev(`(function(){
      var c=document.querySelector('.v2-hero-stage canvas');
      var b=document.querySelector('[data-action="v2-hero-next"]');
      if(!b) return null;
      var t=performance.now();
      b.click();
      var el=document.querySelector('.v2-carousel-card.is-center .v2-hero-stage canvas');
      var r=el?el.getBoundingClientRect():null;
      return {
        after: document.querySelector('.v2-carousel-card.is-center') ? document.querySelector('.v2-carousel-card.is-center').getAttribute('data-v2-id') : null,
        sameCanvas: el===c, png: el?el.toDataURL('image/png').length:0,
        opacity: el?getComputedStyle(el).opacity:null, transform: el?getComputedStyle(el).transform:null,
        w: r?Math.round(r.width):0, h: r?Math.round(r.height):0,
        ms: Math.round((performance.now()-t)*10)/10
      };
    })()`);
    await sleep(420);
    const afterNext = await ev('window.__H5.measure()');
    const afterId = await ev('(function(){var c=document.querySelector(".v2-carousel-card.is-center");return c?c.getAttribute("data-v2-id"):null;})()');
    await shot('current-' + size.label + '-heroes-next');
    await ev('window.__H5.key("ArrowRight")');
    await sleep(420);
    const afterKeyId = await ev('(function(){var c=document.querySelector(".v2-carousel-card.is-center");return c?c.getAttribute("data-v2-id"):null;})()');
    await ev('window.__H5.key("End")');
    await sleep(420);
    const last = await ev('window.__H5.measure()');
    const lastId = await ev('(function(){var c=document.querySelector(".v2-carousel-card.is-center");return c?c.getAttribute("data-v2-id"):null;})()');
    await shot('current-' + size.label + '-heroes-last');
    /* pantalla de reclutamiento: pulsar el CTA bloqueado/comprar del centro */
    const recruitOpened = await ev('(function(){var c=document.querySelector(".v2-carousel-card.is-center .v2-hero-cta[data-action=open-recruit]"); if(!c) return false; c.click(); return true;})()');
    await sleep(600);
    const recruit = recruitOpened ? await ev(`(function(){
      var q=function(s){return document.querySelector(s);};
      var r=function(el){if(!el)return null;var b=el.getBoundingClientRect();return {x:Math.round(b.left),y:Math.round(b.top),w:Math.round(b.width),h:Math.round(b.height),bottom:Math.round(b.bottom),right:Math.round(b.right)};};
      var shell=q('.v2-hero-shell'), media=q('.v2-hero-recruitMedia'), body=q('.v2-hero-recruitBody'), btn=q('.v2-hero-recruitBody .btn');
      var stage=q('.v2-hero-recruitMedia .v2-hero-stage');
      var canvas=q('.v2-hero-recruitMedia canvas');
      var desc=q('.v2-hero-recruitBody .v2-hero-desc');
      var bodyScroll=body?{scrollH:body.scrollHeight,clientH:body.clientHeight}:null;
      var btnOk=!!(btn&&body)&&btn.getBoundingClientRect().top>=body.getBoundingClientRect().top&&btn.getBoundingClientRect().bottom<=body.getBoundingClientRect().bottom;
      return {shell:r(shell),media:r(media),body:r(body),stage:r(stage),mainBtn:r(btn),mainBtnVisible:btnOk,mainBtnText:btn?btn.textContent.replace(/\\s+/g,' ').trim().slice(0,60):'',desc:r(desc),descText:desc?desc.textContent.trim().slice(0,50):'',bodyScroll:bodyScroll,canvas:canvas?{w:canvas.width,h:canvas.height,css:r(canvas),png:canvas.toDataURL('image/png').length}:null,overflowX:document.documentElement.scrollWidth>window.innerWidth+1,overflowY:document.documentElement.scrollHeight>window.innerHeight+1};
    })()`) : null;
    if (recruit) await shot('current-' + size.label + '-recruit');
    results.sizes[size.label] = { first, navSync, beforeId, afterNext, afterId, afterKeyId, last, lastId, recruit };
    const brief = (m) => ({
      checks: m.checks,
      headH: m.head.rect ? m.head.rect.h : null, h1: m.head.h1, h1Size: m.head.h1Size,
      carouselH: m.carousel.rect ? m.carousel.rect.h : null, viewport: m.carousel.viewport, vars: m.carousel.vars, narrow: m.carousel.narrow,
      card: m.center.rect, copyScrollH: m.center.copyScrollH, copyClientH: m.center.copyClientH,
      cta: m.center.cta, ctaText: m.center.ctaText,
      sides: { prevBandW: m.sides.prevBandW, nextBandW: m.sides.nextBandW, prev2BandW: m.sides.prev2BandW, next2BandW: m.sides.next2BandW, prevName: m.sides.prevName, nextName: m.sides.nextName, prevLabelClear: m.sides.prevLabelClear, nextLabelClear: m.sides.nextLabelClear, next2VisibleW: m.sides.next2VisibleW },
      canvas: m.canvas, errors: m.errors
    });
    results.compact = results.compact || {};
    results.compact[size.label] = { first: brief(first), afterNext: brief(afterNext), last: brief(last), navSync, recruit: recruit ? { media: recruit.media, body: recruit.body, mainBtn: recruit.mainBtn, bodyScroll: recruit.bodyScroll, overflowX: recruit.overflowX, overflowY: recruit.overflowY } : null };
    await send('Page.navigate', { url: 'about:blank' });
    await sleep(150);
  }
  results.consoleErrors = consoleErrors.slice(-20);
  const file = path.join(outDir, 'layout-current.json');
  fs.writeFileSync(file, JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ file, sizes: Object.keys(results.sizes), consoleErrors: results.consoleErrors }, null, 2));
  ws.close();
})().catch((e) => { console.error('PROBE_ERROR', e.stack || e); process.exitCode = 1; });
