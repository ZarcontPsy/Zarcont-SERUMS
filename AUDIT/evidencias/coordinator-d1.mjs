/* © 2026 ZARCONT — Verificación D1 del coordinador (snapshot sembrado). */
import { Chrome, Page } from "../../tests/e2e/lib/cdp.mjs";
import { StaticServer } from "../../tests/e2e/lib/server.mjs";
import path from "node:path";

const ROOT = path.resolve(".");
const PORT = 8766, CDP = 9366;
const server = new StaticServer({ root: ROOT, port: PORT, python: "C:\\Python313\\python.exe" });
const chrome = new Chrome({ chromePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", userDataDir: path.join(process.env.TEMP, "serums-d1"), port: CDP });
let page;
try {
  await server.start(); await chrome.start(); await chrome.newTarget("about:blank");
  page = new Page([...chrome.pages][0], { browser: chrome, port: CDP }); await page.init(); await page.viewport(1280, 900);
  const base = `http://127.0.0.1:${PORT}`;
  await page.goto(`${base}/index.html`, { settle: 600 });
  const snap = {
    version: 1,
    dashboard: { totalSheets: 210, completedSheets: 2, startedTopics: 3, percent: 1, streak: 2, last: { sheetId: "sheet-aps-02", title: "Accesibilidad y longitudinalidad", at: new Date().toISOString() } },
    flashcards: { totalCards: 630, reviewedCards: 10, masteredCards: 2, dueCards: 4, todayReviews: 3, last: { deckId: "sheet-aps-01", title: "Salud pública y funciones esenciales", at: new Date().toISOString() } }
  };
  await page.eval(`localStorage.setItem('studyhub:snapshot:v1', ${JSON.stringify(JSON.stringify(snap))}); localStorage.setItem('serumsquest:snapshot:v1', JSON.stringify({hasActivity:true, level:3, levelPercent:40, xp:120, rank:"Bachiller", answered:30, lastSession:{title:"Misión APS"}}));`);
  await page.goto(`${base}/index.html`, { settle: 800 });
  const data = await page.eval(`(() => {
    const out = {};
    document.querySelectorAll('.app-card[data-app]').forEach(c => out[c.dataset.app] = c.getAttribute('href'));
    const last = {};
    document.querySelectorAll('[data-last]').forEach(el => last[el.getAttribute('data-last')] = el.hidden ? "" : el.textContent.trim());
    return { out, last, progress: [...document.querySelectorAll('[data-progress] [data-progress-value]')].map(e => e.textContent) };
  })()`);
  console.log(JSON.stringify(data, null, 2));
  const okDash = data.out.dashboard === "./study-dashboard/index.html";
  const okFlash = data.out.flashcards === "./study-flashcards/index.html";
  console.log(`${okDash ? "PASS" : "FAIL"} · dashboard sin query`);
  console.log(`${okFlash ? "PASS" : "FAIL"} · flashcards sin query`);
  console.log(`${data.last.dashboard && data.last.flashcards ? "PASS" : "FAIL"} · último punto sigue visible`);
  process.exit(okDash && okFlash && data.last.dashboard && data.last.flashcards ? 0 : 1);
} finally {
  try { await chrome.stop(); } catch {}
  try { await server.stop(); } catch {}
}
