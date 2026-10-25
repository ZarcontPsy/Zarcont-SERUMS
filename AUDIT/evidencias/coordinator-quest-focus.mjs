/* © 2026 ZARCONT — Sonda de foco de la tira de QUEST. */
import { Chrome, Page } from "../../tests/e2e/lib/cdp.mjs";
import { StaticServer } from "../../tests/e2e/lib/server.mjs";
import path from "node:path";
const ROOT = path.resolve(".");
const PORT = 8772, CDP = 9372;
const server = new StaticServer({ root: ROOT, port: PORT, python: "C:\\Python313\\python.exe" });
const chrome = new Chrome({ chromePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", userDataDir: path.join(process.env.TEMP, "serums-quest-focus"), port: CDP });
let page;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
try {
  await server.start(); await chrome.start();
  page = new Page(await chrome.newTarget("about:blank"), { browser: chrome, port: CDP });
  await page.init(); await page.viewport(1440, 900);
  await page.goto(`http://127.0.0.1:${PORT}/serums-quest/index.html#/personajes`, { settle: 1400 });
  const before = await page.eval(`(() => { const c=document.querySelector('.q-strip-card[data-character="mara"]'); const r=c.getBoundingClientRect(); const el=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2); return { rect:[r.left,r.top,r.width,r.height], hit: el && (el.closest('[data-action]')?.getAttribute('data-character') || el.className), focused:[...document.querySelectorAll('.q-strip-card.is-focused')].map(x=>x.dataset.character), pressed: c.getAttribute('aria-pressed') }; })()`);
  await page.eval(`document.querySelector('.q-strip-card[data-character="mara"]').click(); true`);
  await sleep(400);
  const afterJs = await page.eval(`({ focused:[...document.querySelectorAll('.q-strip-card.is-focused')].map(x=>x.dataset.character), pressed: document.querySelector('.q-strip-card[data-character="mara"]').getAttribute('aria-pressed'), title: document.querySelector('#view h1')?.innerText || '' })`);
  console.log("before", JSON.stringify(before));
  console.log("afterJs", JSON.stringify(afterJs));
} finally { try { await chrome.stop(); } catch {} try { await server.stop(); } catch {} }
