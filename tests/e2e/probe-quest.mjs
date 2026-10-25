import path from "node:path";
import os from "node:os";
import { mkdtemp } from "node:fs/promises";
import { StaticServer } from "./lib/server.mjs";
import { Chrome, Page, sleep } from "./lib/cdp.mjs";
const ROOT = path.resolve(import.meta.dirname, "..", "..");
const server = new StaticServer({ root: ROOT, port: 8790, python: "C:\\Python313\\python.exe" });
const chrome = new Chrome({ chromePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", userDataDir: path.join(await mkdtemp(path.join(os.tmpdir(), "qa-qc-")), "p"), port: 9390 });
try {
  await server.start(); await chrome.start();
  const conn = await chrome.newTarget("about:blank"); const page = new Page(conn, { browser: chrome, port: 9390 }); await page.init(); await page.viewport(1440,900);
  await page.goto("http://127.0.0.1:8790/serums-quest/index.html#/personajes", { settle: 1000 });
  console.log("before", await page.eval(`({
    strips: Array.from(document.querySelectorAll('.q-strip-card')).map(b=>({char:b.dataset.character, cls:b.className, focused:b.classList.contains('is-focused'), pressed:b.getAttribute('aria-pressed'), rect:(()=>{const r=b.getBoundingClientRect();return {y:r.y,h:r.height}})()})).slice(0,12),
    scrollY
  })`));
  await page.eval(`document.querySelector('.q-strip-card[data-character="mara"]').scrollIntoView({block:"center"})`);
  await sleep(400);
  console.log("scrolled", await page.eval(`({scrollY, mara:(()=>{const b=document.querySelector('.q-strip-card[data-character="mara"]'); const r=b.getBoundingClientRect(); const x=r.left+r.width/2,y=r.top+r.height/2; const t=document.elementFromPoint(x,y); return {rect:{x,y,w:r.width,h:r.height}, top:t?t.tagName+'.'+t.className:null, hit:!!(t&&(t===b||b.contains(t)))};})()})`));
  await page.click('.q-strip-card[data-character="mara"]');
  await sleep(700);
  console.log("after click", await page.eval(`({
    hash:location.hash, scrollY,
    strips: Array.from(document.querySelectorAll('.q-strip-card')).map(b=>({char:b.dataset.character, cls:b.className, focused:b.classList.contains('is-focused'), pressed:b.getAttribute('aria-pressed')})).filter(x=>x.char==='mara'||x.focused),
    title: document.querySelector('.q-hero-copy, .q-hero-title, #view h1')?.innerText || document.body.innerText.slice(0,200)
  })`));
  await page.close();
} finally { await chrome.stop(); await server.stop(); }
