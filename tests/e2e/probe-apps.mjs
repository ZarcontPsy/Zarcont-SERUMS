/* © 2026 ZARCONT — Sonda de reconocimiento por aplicación (Agente 8). */
import path from "node:path";
import os from "node:os";
import { mkdtemp } from "node:fs/promises";
import { StaticServer } from "./lib/server.mjs";
import { Chrome, Page, sleep } from "./lib/cdp.mjs";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const OUT = path.join(ROOT, "AUDIT", "evidencias", "agent8-probe");
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const server = new StaticServer({ root: ROOT, port: 8790, python: "C:\\Python313\\python.exe" });
const profile = await mkdtemp(path.join(os.tmpdir(), "zarcont-qa-probe2-"));
const chrome = new Chrome({ chromePath, userDataDir: path.join(profile, "profile"), port: 9390 });
const apps = [
  ["dashboard", "/study-dashboard/index.html"],
  ["flashcards", "/study-flashcards/index.html"],
  ["quest", "/serums-quest/index.html"],
  ["plazas", "/serums%20map/serums-map-explorer/index.html"],
  ["banqueo", "/EXAMEN%20STUDIO/Examen%20Studio.html"],
];
try {
  await server.start();
  await chrome.start();
  const conn = await chrome.newTarget("about:blank");
  const page = new Page(conn, { browser: chrome, port: 9390 });
  await page.init();
  await page.viewport(1440, 900);
  for (const [name, url] of apps) {
    page.resetErrors();
    await page.goto(server.baseURL + url, { settle: 2500 });
    const info = await page.eval(`(() => ({
      title: document.title,
      href: location.href,
      visibleText: (document.body.innerText||"").replace(/\\s+/g," ").slice(0, 700),
      buttons: Array.from(document.querySelectorAll("button")).slice(0,40).map(b=>({text:(b.innerText||"").trim().slice(0,40), action:b.dataset.action||"", id:b.id||"", aria:b.getAttribute("aria-label")||""})),
      links: Array.from(document.querySelectorAll("a")).filter(a=>a.offsetParent).slice(0,30).map(a=>({text:(a.innerText||"").trim().slice(0,30), href:a.getAttribute("href")||"", route:a.dataset.route||""})),
      hiddenRoots: Array.from(document.querySelectorAll("[hidden]")).slice(0,10).map(e=>e.id||e.className),
      counts: {
        fichas: window.STUDY_CONTENT ? (window.STUDY_CONTENT.sheets?.length ?? window.STUDY_CONTENT.fichas?.length ?? null) : null,
        keys: window.STUDY_CONTENT ? Object.keys(window.STUDY_CONTENT) : null,
        banco: window.BANCO_OFICIAL ? window.BANCO_OFICIAL.totals : null,
        questMap: window.QUEST_CONTENT_MAP ? Object.keys(window.QUEST_CONTENT_MAP) : null,
        plazas: window.SERUMS_DATA ? window.SERUMS_DATA.length : null
      },
      storage: (()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);o[k]=String(localStorage.getItem(k)).slice(0,80)}return o})(),
      errors: null
    }))()`);
    console.log("\\n===", name, "===");
    console.log(JSON.stringify(info, null, 1).slice(0, 5000));
    console.log("errors", JSON.stringify(await page.errorsSummary()).slice(0, 2000));
    await page.screenshot(path.join(OUT, `${name}-1440.png`));
  }
  await page.close();
} finally {
  await chrome.stop();
  await server.stop();
}
