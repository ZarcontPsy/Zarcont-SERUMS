'use strict';
const fs=require('fs'),path=require('path');
const { open, sleep }=require('./cdp-lib.js');
const QA=__dirname;
const save=JSON.parse(fs.readFileSync(path.join(QA,'save-world-low.json'),'utf8'));
save.settings={feedbackMode:'end',onlyOriginalBank:false,effectsQuality:'alto',qualityChosen:true,backupReminder:false,tutorialSeen:true,sourceWeights:{campaign:0.6,dashboard:0.15,flashcards:0.25}};
save.missions={};save.questions={};save.errors={};
(async()=>{
 const s=await open({gpu:true,width:1280,height:720,port:9393});
 const out={};
 try{
  await s.seed(save); await sleep(900);
  await s.ev("document.querySelector('#screen [data-action=menu-continue]')?.click()"); await sleep(900);
  await s.send('Input.dispatchKeyEvent',{type:'keyDown',code:'KeyG',key:'g',windowsVirtualKeyCode:71});
  await s.send('Input.dispatchKeyEvent',{type:'keyUp',code:'KeyG',key:'g',windowsVirtualKeyCode:71});
  await sleep(700);
  await s.ev("document.querySelector('#screen [data-action=open-practice]')?.click()"); await sleep(500);
  await s.ev("document.querySelector('#screen [data-action=start-practice][data-area=\"area-psi-salud-publica\"]')?.click()"); await sleep(1300);
  out.start=await s.ev("({screen:__gameState().screen,mode:__gameState().mode,idx:__gameState().questionIndex,feedbackOpen:__gameState().feedbackOpen,inline:window.__V2.feedback.inlineEnabled(),delay:window.__V2.feedback.autoAdvanceDelay({mode:'practice'})})");
  const q=await s.ev(`(() => { const b=document.querySelector('[data-action="toggle-question-tag"][data-tag="difficult"]'); const id=b&&b.getAttribute('data-question'); const q=id&&CAMPAIGN_DATA.questions[id]; return q?{a:q.answer,id}:null; })()`);
  await s.ev(`(() => { const b=document.querySelector('#screen [data-action=answer][data-letter="${q.a}"]'); if(b)b.click(); })()`);
  await sleep(350);
  out.after350=await s.ev("({idx:__gameState().questionIndex,open:__gameState().feedbackOpen,v2:!!document.querySelector('.v2-feedback[data-v2-feedback]'),legacy:!!document.querySelector('.feedbackStrip'),screen:__gameState().screen})");
  await sleep(1700);
  out.after2050=await s.ev("({idx:__gameState().questionIndex,open:__gameState().feedbackOpen,v2:!!document.querySelector('.v2-feedback[data-v2-feedback]'),legacy:!!document.querySelector('.feedbackStrip'),screen:__gameState().screen})");
 }catch(e){out.error=String(e&&e.stack||e);}finally{await s.close();}
 console.log(JSON.stringify(out,null,2));
})();
