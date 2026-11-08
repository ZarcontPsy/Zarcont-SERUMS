'use strict';
const fs = require('fs');
const path = require('path');
const PORT = 9338;
const URL_BASE = 'http://127.0.0.1:8899/.work/v21/agent5/harness/harness.html';
(async () => {
  const list = await (await fetch('http://127.0.0.1:' + PORT + '/json/list')).json();
  const target = list.find((x) => x.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.j(new Error(JSON.stringify(m.error))) : p.r(m.result); } };
  const send = (method, params = {}) => new Promise((r, j) => { const mid = ++id; pend.set(mid, { r, j }); ws.send(JSON.stringify({ id: mid, method, params })); });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const ev = async (expression, awaitPromise = false) => {
    const x = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise, userGesture: true });
    if (x.exceptionDetails) throw new Error(x.exceptionDetails.text + ' ' + ((x.exceptionDetails.exception || {}).description || ''));
    return x.result && x.result.value;
  };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 960, height: 540, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: URL_BASE });
  await ev('window.__H5 && window.__H5.ready()', true);
  await sleep(1200);
  await ev('window.__H5.freeze()');
  await sleep(500);
  const out = await ev(`(function(){
    function r(el){ if(!el) return null; var b=el.getBoundingClientRect(); return {x:+b.x.toFixed(1),y:+b.y.toFixed(1),w:+b.width.toFixed(1),h:+b.height.toFixed(1),right:+b.right.toFixed(1),bottom:+b.bottom.toFixed(1)}; }
    var center=document.querySelector('.v2-carousel-card.is-center');
    var next=document.querySelector('.v2-carousel-card.is-next');
    var next2=document.querySelector('.v2-carousel-card.is-next2');
    var deck=document.querySelector('.v2-carousel-deck');
    var car=document.querySelector('.v2-carousel');
    var info=function(el,name){
      if(!el) return {name:name,missing:true};
      var cs=getComputedStyle(el);
      return {name:name, rect:r(el), className:el.className, width:cs.width, left:cs.left, transform:cs.transform, transformOrigin:cs.transformOrigin, step:cs.getPropertyValue('--v2-step').trim(), cardW:cs.getPropertyValue('--v2-card-w').trim(), offsetLeft:el.offsetLeft, offsetWidth:el.offsetWidth};
    };
    return {deck:r(deck), deckPersp:getComputedStyle(deck).perspective, center:info(center,'center'), next:info(next,'next'), next2:info(next2,'next2'), carStyle:car.getAttribute('style')};
  })()`);
  console.log(JSON.stringify(out, null, 2));
  ws.close();
  process.exit(0);
})().catch((e) => { console.error('INSPECT_ERROR', e.stack || e); process.exit(1); });
