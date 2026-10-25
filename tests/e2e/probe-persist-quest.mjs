import path from "node:path";
import os from "node:os";
import { mkdtemp } from "node:fs/promises";
import { StaticServer } from "./lib/server.mjs";
import { Chrome, Page, sleep } from "./lib/cdp.mjs";
const ROOT = path.resolve(import.meta.dirname, "..", "..");
const server = new StaticServer({ root: ROOT, port: 8790, python: "C:\\Python313\\python.exe" });
const chrome = new Chrome({ chromePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", userDataDir: path.join(await mkdtemp(path.join(os.tmpdir(), "qa-q-")), "p"), port: 9391 });
const base = "http://127.0.0.1:8790/serums-quest/index.html";
async function snap(page, tag) {
  console.log(tag, await page.eval(`(() => { const s=JSON.parse(localStorage.getItem('serumsquest:state:v1')||'null'); return { theme: localStorage.getItem('serumsquest:theme'), docTheme: document.documentElement.dataset.theme, revision: s?.revision, answers: s?.activeSession ? Object.keys(s.activeSession.answers||{}).length : 0, keys: Object.keys(localStorage).sort() }; })()`));
}
try {
  await server.start();
  await chrome.start();
  let conn = await chrome.newTarget("about:blank"); let page = new Page(conn, { port: 9391 }); await page.init(); await page.viewport(1440,900);
  await page.goto(base, { settle: 1000 });
  await snap(page, "initial");
  const t = await page.eval(`document.documentElement.dataset.theme`);
  if (t !== "light") await page.click('[data-theme-toggle]');
  await sleep(400);
  await snap(page, "after toggle");
  await page.goto(base + "#/mision/mission-sp-1", { settle: 800 });
  await snap(page, "mission");
  await page.waitFor(`!!document.querySelector('[data-action="start-mission"]')`, { timeout: 8000 });
  await page.click('[data-action="start-mission"]');
  await page.waitFor(`!!document.querySelector('[data-action="answer"]')`, { timeout: 8000 });
  await page.click('[data-action="answer"]');
  await page.waitFor(`!!document.querySelector('[data-action="next"]')`, { timeout: 5000 });
  await page.click('[data-action="next"]');
  await sleep(600);
  await snap(page, "before restart");
  await chrome.restart();
  conn = await chrome.newTarget("about:blank"); page = new Page(conn, { port: 9391 }); await page.init(); await page.viewport(1440,900);
  await page.goto(base, { settle: 1200 });
  await snap(page, "after restart");
  await page.close();
} finally { await chrome.stop(); await server.stop(); }
