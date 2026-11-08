'use strict';
const fs=require('fs'),path=require('path');
const { open, sleep }=require('./cdp-lib.js');
const QA=__dirname;
const save=JSON.parse(fs.readFileSync(path.join(QA,'save-world-low.json'),'utf8'));
save.settings={feedbackMode:'end',onlyOriginalBank:false,effectsQuality:'alto',qualityChosen:true,backupReminder:false,tutorialSeen:true,sourceWeights:{campaign:0.6,dashboard:0.15,flashcards:0.25}};
save.missions={};save.questions={};save.errors={};
(async()=>{
 const s=await open({gpu:true,width:1280,height:720,port:9390});
 const out={};
 try{
  await s.seed(save); await sleep(800);
  await s.ev("document.querySelector('#screen [data-action=menu-continue]')?.click()"); await sleep(900);
  await s.ev("document.querySelector('#hud [data-action=open-journal]')?.click()"); await sleep(700);
  await s.ev("document.querySelector('#screen [data-action=select-area][data-area=\"area-psi-salud-publica\"]')?.click()"); await sleep(400);
  await s.ev("document.querySelector('#screen [data-action=select-mission][data-mission=\"mission-sp-1\"]')?.click()"); await sleep(400);
  await s.ev("document.querySelector('#screen [data-action=start-mission]')?.click()"); await sleep(1600);
  out.before=await s.ev(`(() => { const m=window.__V2.duel.metrics(); const t=document.querySelector('.duelTop'); const tr=t?t.getBoundingClientRect():null; const p=document.querySelector('.duelPanel'); const pr=p?p.getBoundingClientRect():null; return {screen:__gameState().screen, body:document.body.className, m, top:tr?{y:Math.round(tr.y),h:Math.round(tr.height)}:null, panel:pr?{y:Math.round(pr.y),h:Math.round(pr.height)}:null}; })()`);
  const q=await s.ev(`(() => { const b=document.querySelector('[data-action="toggle-question-tag"][data-tag="difficult"]'); const id=b&&b.getAttribute('data-question'); const q=id&&CAMPAIGN_DATA.questions[id]; return q?{a:q.answer}:null; })()`);
  await s.ev(`(() => { const b=document.querySelector('#screen [data-action=answer][data-letter="${q.a}"]'); if(b)b.click(); })()`);
  const timeline=[];
  for(let i=0;i<24;i++){
    await sleep(80);
    const v=await s.ev(`(() => { const m=window.__V2.duel.metrics(); const p=document.querySelector('.duelPanel'); const pr=p?p.getBoundingClientRect():null; return {t:${i*80}, attacking:document.body.classList.contains('v2d-attacking'), attack:m.attack, panel:pr?{y:Math.round(pr.y),h:Math.round(pr.height)}:null, idx:__gameState().questionIndex, fb:__gameState().feedbackOpen}; })()`);
    timeline.push(v);
  }
  out.timeline=timeline;
  out.after=await s.ev("({body:document.body.className, m:window.__V2.duel.metrics()})");
 }catch(e){out.error=String(e&&e.stack||e);}finally{await s.close();}
 console.log(JSON.stringify(out,null,2).slice(0,14000));
})();
