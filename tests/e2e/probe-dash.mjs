import path from "node:path";
import os from "node:os";
import { mkdtemp } from "node:fs/promises";
import { StaticServer } from "./lib/server.mjs";
import { Chrome, Page, sleep } from "./lib/cdp.mjs";
const ROOT = path.resolve(import.meta.dirname, "..", "..");
const server = new StaticServer({ root: ROOT, port: 8790, python: "C:\\Python313\\python.exe" });
const chrome = new Chrome({ chromePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", userDataDir: path.join(await mkdtemp(path.join(os.tmpdir(), "qa-dash-")), "p"), port: 9390 });
try {
  await server.start();
  await chrome.start();
  const conn = await chrome.newTarget("about:blank");
  const page = new Page(conn, { browser: chrome, port: 9390 });
  await page.init();
  await page.viewport(1440, 900);
  await page.goto(`${server.baseURL}/study-dashboard/index.html`, { settle: 900 });
  const state = async (tag) => console.log(tag, await page.eval(`(() => ({
    hash: location.hash,
    details: Array.from(document.querySelectorAll('details.topic-block')).map(d => ({ open: d.open, topic: d.dataset.topic, links: d.querySelectorAll('a[href^="#/ficha/"]').length, rect: (() => { const r=d.getBoundingClientRect(); return {y:Math.round(r.y),h:Math.round(r.height)}; })() })),
    allLinks: document.querySelectorAll('a[href^="#/ficha/"]').length,
    h1: document.querySelector('#view-root h1')?.innerText
  }))()`));
  await state("initial");
  await page.click('#view-root a[href="#/biblioteca"]');
  await page.waitFor(`location.hash === '#/biblioteca'`, { timeout: 5000 });
  await page.waitFor(`document.querySelectorAll('a[href^="#/biblioteca/area-"]').length > 0`, { timeout: 8000 }).catch((e) => console.log("no areas", e.message));
  await state("library");
  const area = await page.eval(`document.querySelector('a[href^="#/biblioteca/area-"]')?.getAttribute('href')`);
  await page.click(`a[href="${area}"]`);
  await page.waitFor(`location.hash.startsWith(${JSON.stringify(area)})`, { timeout: 5000 });
  await page.waitFor(`document.querySelectorAll('details.topic-block').length > 0`, { timeout: 8000 }).catch((e) => console.log("no topics", e.message));
  await sleep(400);
  await state("area");
  const closed = await page.eval(`!!document.querySelector('details.topic-block:not([open]) summary')`);
  console.log("closed?", closed);
  if (closed) { await page.click("details.topic-block:not([open]) summary"); await sleep(500); }
  await state("after-open");
  console.log("sheet", await page.eval(`Array.from(document.querySelectorAll('a[href^="#/ficha/"]')).slice(0,3).map(a => { const r=a.getBoundingClientRect(); const x=r.left+r.width/2,y=r.top+r.height/2; return {href:a.getAttribute('href'), rect:{x,y,w:r.width,h:r.height}, top:(document.elementFromPoint(x,y)?.className||'').toString(), closed:!!a.closest('details:not([open])') }; })`));
  await page.close();
} finally { await chrome.stop(); await server.stop(); }
