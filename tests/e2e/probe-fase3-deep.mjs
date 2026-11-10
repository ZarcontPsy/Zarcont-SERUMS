/* Sonda temporal de QA (Fase 3): mide la carrera de arranque en deep links.
 * Se elimina al terminar; no forma parte de la matriz. */
import path from "node:path";
import os from "node:os";
import { mkdtemp } from "node:fs/promises";
import { StaticServer } from "./lib/server.mjs";
import { Chrome, Page, sleep } from "./lib/cdp.mjs";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PYTHON = "C:\\Python313\\python.exe";

const server = new StaticServer({ root: ROOT, port: 8794, python: PYTHON });
await server.start();
const profileRoot = await mkdtemp(path.join(os.tmpdir(), "zarcont-qa-deep-"));
const chrome = new Chrome({ chromePath: CHROME, userDataDir: path.join(profileRoot, "p"), port: 9394 });
let page = null;
const rows = [];
try {
  await chrome.start();
  const conn = await chrome.newTarget("about:blank");
  page = new Page(conn, { browser: chrome, port: 9394 });
  await page.init();
  await page.viewport(1440, 900);
  const routes = ["#/ultimo-dia", "#/relampago", "#/glosario", "#/datos", "#/trampas"];
  for (let i = 0; i < 3; i += 1) {
    for (const hash of routes) {
      await page.goto(`${server.baseURL}/study-dashboard/index.html?qa=deep${i}#${hash}`, { settle: 1200 });
      await sleep(300);
      const state = await page.eval(`(() => ({
        hash: location.hash,
        title: document.title,
        mounted: !!document.querySelector("[data-ref-view], section[data-plan-view=\\"relampago\\"], section[data-plan-view=\\"ultimo-dia\\"]"),
        lastday: !!(window.StudyPlanLastDay && window.StudyPlanLastDay.__registered),
        relampago: !!(window.StudyPlanRelampago && window.StudyPlanRelampago.__registered),
        refViews: !!(window.StudyGlossary && window.StudyGlossary.__registered)
      }))()`);
      rows.push({ ...state, notFound: /no encontramos/i.test(state.title) });
      console.log(`${i} ${hash} -> notFound=${rows[rows.length - 1].notFound} mounted=${state.mounted} lastday=${state.lastday} relampago=${state.relampago} ref=${state.refViews}`);
    }
  }
} finally {
  try { if (page) await page.close(); } catch {}
  await chrome.stop().catch(() => {});
  await server.stop().catch(() => {});
}
const notFound = rows.filter((row) => row.notFound).length;
console.log(`RESUMEN deep links: ${rows.length} cargas, ${notFound} con 404`);
