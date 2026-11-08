'use strict';
const fs=require('fs'), path=require('path');
const { open, sleep } = require('./cdp-lib.js');
const QA=__dirname; const ROOT=path.resolve(__dirname,'..','..','..');
const save=JSON.parse(fs.readFileSync(path.join(QA,'save-full.json'),'utf8'));
(async()=>{
 const s=await open({gpu:true,width:1280,height:720,port:9394});
 try{
  await s.seed(save); await sleep(900);
  await s.ev("document.querySelector('#screen [data-action=open-settings]')?.click()");
  await sleep(900);
  const info=await s.ev(`(() => {
    const root=document.querySelector('#screen');
    return {
      screen: window.__gameState().screen,
      rootTag: root && root.tagName,
      rootChildren: root ? root.children.length : -1,
      actionsInScreen: root ? root.querySelectorAll('[data-action]').length : -1,
      actionsDoc: document.querySelectorAll('[data-action]').length,
      actionsSample: root ? [...root.querySelectorAll('[data-action]')].slice(0,10).map(e=>e.getAttribute('data-action')) : [],
      btnSample: root ? [...root.querySelectorAll('button')].slice(0,8).map(e=>({a:e.getAttribute('data-action'),t:(e.innerText||'').slice(0,30)})) : [],
      feedbackSettings: root ? !!root.querySelector('[data-v2-feedback-settings]') : false,
      fbSettingsParent: (()=>{ const e=document.querySelector('[data-v2-feedback-settings]'); return e ? e.outerHTML.slice(0,200) : null; })()
    };
  })()`);
  console.log(JSON.stringify(info,null,2));
 } catch(e){ console.error(e); } finally { await s.close(); }
})();
