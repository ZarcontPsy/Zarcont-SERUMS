/* © 2026 ZARCONT — Reproducción del tema de QUEST (coordinador). */
import { Chrome, Page } from "../../tests/e2e/lib/cdp.mjs";
import { StaticServer } from "../../tests/e2e/lib/server.mjs";
import path from "node:path";
const ROOT = path.resolve(".");
const PORT = 8769, CDP = 9369;
const server = new StaticServer({ root: ROOT, port: PORT, python: "C:\\Python313\\python.exe" });
const chrome = new Chrome({ chromePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", userDataDir: path.join(process.env.TEMP, "serums-theme-test"), port: CDP });
let page;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function newPage() {
  const conn = await chrome.newTarget("about:blank");
  const p = new Page(conn, { browser: chrome, port: CDP });
  await p.init();
  return p;
}
async function read(p) {
  return p.eval(`(() => { const s = JSON.parse(localStorage.getItem('serumsquest:state:v1') || '{}'); return { doc: document.documentElement.dataset.theme, key: localStorage.getItem('serumsquest:theme'), stateTheme: s.settings && s.settings.theme, rev: s.revision }; })()`);
}
try {
  await server.start(); await chrome.start();
  page = await newPage();
  await page.goto(`http://127.0.0.1:${PORT}/serums-quest/index.html#/`, { settle: 1200 });
  console.log("inicio", await read(page));
  if ((await read(page)).doc !== "light") { await page.click('[data-theme-toggle]'); await sleep(500); }
  console.log("tras toggle", await read(page));
  await page.goto(`http://127.0.0.1:${PORT}/serums-quest/index.html#/personajes`, { settle: 900 });
  console.log("antes restart", await read(page));
  await chrome.restart();
  page = await newPage();
  await page.goto(`http://127.0.0.1:${PORT}/serums-quest/index.html#/`, { settle: 1200 });
  console.log("tras restart", await read(page));
} finally { try { await chrome.stop(); } catch {} try { await server.stop(); } catch {} }
