import path from "node:path";
import os from "node:os";
import { mkdtemp } from "node:fs/promises";
import { StaticServer } from "./lib/server.mjs";
import { Chrome, Page, sleep } from "./lib/cdp.mjs";
const ROOT = path.resolve(import.meta.dirname, "..", "..");
const server = new StaticServer({ root: ROOT, port: 8790, python: "C:\\Python313\\python.exe" });
const chrome = new Chrome({ chromePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", userDataDir: path.join(await mkdtemp(path.join(os.tmpdir(), "qa-fav-")), "p"), port: 9390 });
try {
  await server.start();
  await chrome.start();
  const conn = await chrome.newTarget("about:blank");
  const page = new Page(conn, { browser: chrome, port: 9390 });
  await page.init();
  await page.viewport(1440, 900);
  await page.goto("http://127.0.0.1:8790/serums%20map/serums-map-explorer/index.html", { settle: 1800 });
  await page.click('#sideTabs [data-tab="results"]');
  await sleep(500);
  const row = await page.eval(`(() => { const r=document.querySelector('#resultsList .resitem'); return r ? { id:r.dataset.id, text:r.innerText.slice(0,80) } : null; })()`);
  console.log("row", row);
  await page.click('#resultsList .resitem [data-act="detail"]');
  await page.waitFor(`document.getElementById('detailModal').classList.contains('open')`, { timeout: 5000 });
  const before = await page.eval(`({
    favs: JSON.parse(localStorage.getItem('serums_favoritos') || '[]'),
    title: document.getElementById('detailTitle')?.textContent,
    buttons: Array.from(document.querySelectorAll('#detailBody [data-det]')).map(b=>({det:b.dataset.det, id:b.dataset.id, pressed:b.getAttribute('aria-pressed'), text:b.innerText, title:b.title}))
  })`);
  console.log("before", before);
  const wiring = await page.eval(`(() => { const b=document.querySelector('#detailBody [data-det="fav"]'); return { onclick: typeof b.onclick, onclickText: String(b.onclick).slice(0,200), rect: (() => {const r=b.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height};})(), top: (() => {const r=b.getBoundingClientRect(); const t=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2); return t ? t.tagName+'.'+t.className : null;})() }; })()`);
  console.log("wiring", wiring);
  await page.eval(`(() => { window.__ev=[]; ['pointerdown','mousedown','mouseup','click'].forEach(t => document.addEventListener(t, e => { window.__ev.push(t + ':' + (e.target.tagName||'') + '.' + String(e.target.className||'').slice(0,40)); }, true)); return true; })()`);
  await page.click('#detailBody [data-det="fav"]');
  await sleep(900);
  console.log("after REAL fav", await page.eval(`({ favs: JSON.parse(localStorage.getItem('serums_favoritos')||'[]'), badge: document.getElementById('favBadge')?.textContent, pressed: document.querySelector('#detailBody [data-det="fav"]')?.getAttribute('aria-pressed'), toast: document.getElementById('toast')?.innerText, ev: window.__ev, modalOpen: document.getElementById('detailModal').classList.contains('open') })`));
  const jsClick = await page.eval(`(() => { document.querySelector('#detailBody [data-det="fav"]')?.click(); return true; })()`);
  await sleep(700);
  console.log("after js click", await page.eval(`({ favs: JSON.parse(localStorage.getItem('serums_favoritos')||'[]'), badge: document.getElementById('favBadge')?.textContent, pressed: document.querySelector('#detailBody [data-det="fav"]')?.getAttribute('aria-pressed'), toast: document.getElementById('toast')?.innerText })`));
  console.log("errors", await page.errorsSummary());
  await page.close();
} finally { await chrome.stop(); await server.stop(); }
