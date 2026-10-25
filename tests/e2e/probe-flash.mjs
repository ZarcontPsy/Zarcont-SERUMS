import path from "node:path";
import os from "node:os";
import { mkdtemp } from "node:fs/promises";
import { StaticServer } from "./lib/server.mjs";
import { Chrome, Page, sleep } from "./lib/cdp.mjs";
const ROOT = path.resolve(import.meta.dirname, "..", "..");
const server = new StaticServer({ root: ROOT, port: 8790, python: "C:\\Python313\\python.exe" });
const chrome = new Chrome({ chromePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", userDataDir: path.join(await mkdtemp(path.join(os.tmpdir(), "qa-fl-")), "p"), port: 9390 });
try {
  await server.start(); await chrome.start();
  const conn = await chrome.newTarget("about:blank"); const page = new Page(conn, { browser: chrome, port: 9390 }); await page.init(); await page.viewport(1440,900);
  await page.goto("http://127.0.0.1:8790/study-flashcards/index.html", { settle: 1200 });
  console.log("initial", await page.eval(`({
    heroLink: document.querySelector('a[href^="#/mazo/"]')?.getAttribute('href') || null,
    areas: Array.from(document.querySelectorAll('details.lib-area')).slice(0,4).map(d=>({open:d.open, id:d.dataset.areaId, text:d.innerText.slice(0,60)})),
    deckRows: document.querySelectorAll('.deck-row').length,
    ctas: Array.from(document.querySelectorAll('.deck-row-cta')).slice(0,3).map(a=>({tag:a.tagName, text:a.innerText.slice(0,30), href:a.getAttribute('href')})),
    linkCount: document.querySelectorAll('a[href^="#/mazo/"]').length
  })`));
  const closed = await page.eval(`!!document.querySelector('details.lib-area:not([open]) summary')`);
  if (closed) { await page.click("details.lib-area:not([open]) summary"); await sleep(600); }
  console.log("opened", await page.eval(`({
    areas: Array.from(document.querySelectorAll('details.lib-area')).map(d=>d.open),
    deckRows: document.querySelectorAll('.deck-row').length,
    links: Array.from(document.querySelectorAll('a[href^="#/mazo/"]')).slice(0,4).map(a=>({cls:a.className, href:a.getAttribute('href'), text:a.innerText.slice(0,40)}))
  })`));
  const href = await page.eval(`document.querySelector('.deck-row-cta')?.getAttribute('href') || document.querySelector('a[href^="#/mazo/"]')?.getAttribute('href')`);
  console.log("href", href);
  if (href) { await page.goto("http://127.0.0.1:8790/study-flashcards/index.html" + href, { settle: 900 }); console.log("deck", await page.eval(`({ hash:location.hash, modes:Array.from(document.querySelectorAll('[data-action="start-session"]')).map(b=>{const s=getComputedStyle(b);const r=b.getBoundingClientRect();return {mode:b.dataset.mode, rect:{x:r.x,y:r.y,w:r.width,h:r.height}, display:s.display, vis:s.visibility, parentHidden:!!b.closest('[hidden]'), details:b.closest('details')?.className||null, detailsOpen:b.closest('details')?.open??null};}), text:document.getElementById('view-root').innerText.slice(0,300) })`)); }
  await page.close();
} finally { await chrome.stop(); await server.stop(); }
