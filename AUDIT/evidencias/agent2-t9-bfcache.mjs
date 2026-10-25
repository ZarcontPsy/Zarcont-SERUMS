/* A2-BFCACHE — ¿la vuelta atrás entre apps restaura desde bfcache con estado viejo? */
import { connect, newPage, navigate, evalJS, sleep, ORIGIN, report } from "./agent2-lib.mjs";

const out = { app: "bfcache", steps: [] };
function step(name, data) { out.steps.push({ name, ...data }); console.log("· " + name + " → " + JSON.stringify(data)); }
const b = await connect();

const dash = await newPage(b, ORIGIN + "/study-dashboard/index.html");
await sleep(1600);
const sheetId = await evalJS(dash, "window.STUDY_CONTENT.sheets[6].id");
await evalJS(dash, `(async () => { window.StudyStore.recordSheetView(${JSON.stringify(sheetId)}, window.STUDY_CONTENT.sheets[6].topicId); })()`);
await evalJS(dash, `(() => { const a = [...document.querySelectorAll('a[href*="study-flashcards"]')][0]; if (a) { a.click(); return a.href; } location.href = "../study-flashcards/index.html"; return "js"; })()`);
await sleep(2500);
const flashUrl = await evalJS(dash, "location.href").catch(() => null);
step("1 dashboard → flashcards", { sheetId, flashUrl });

/* en flashcards: marcar la ficha como completada y una tarjeta revisada (cambia el estado compartido) */
await evalJS(dash, `(() => { window.StudyStore.toggleSheetComplete(${JSON.stringify(sheetId)}); return true; })()`);
await sleep(500);

/* volver atrás */
await evalJS(dash, "history.back()");
await sleep(2000);
const back = await evalJS(dash, `(() => {
  const nav = performance.getEntriesByType("navigation")[0];
  return {
    url: location.href,
    navigationType: nav ? nav.type : null,
    persisted: window.__persisted === true,
    completedVisible: !!document.querySelector('[data-action="toggle-complete"].is-on, .sheet-complete.is-on'),
    completeBtnText: (document.querySelector('[data-action="toggle-complete"]')||{}).textContent || null,
    storeSays: (window.StudyStore.getSheetState(${JSON.stringify(sheetId)}) || {}).completedAt,
    domSays: document.body.innerHTML.includes("Completada") || document.body.innerHTML.includes("completada")
  };
})()`);
step("2 vuelta atrás al dashboard", back);

/* sondear pageshow */
await evalJS(dash, `window.__persisted = null; window.addEventListener("pageshow", e => { window.__persisted = e.persisted; });`);
await evalJS(dash, `location.href = "../study-flashcards/index.html"`);
await sleep(2200);
await evalJS(dash, "history.back()");
await sleep(2000);
step("3 pageshow.persisted", await evalJS(dash, `({ persisted: window.__persisted, url: location.href,
  navType: performance.getEntriesByType("navigation")[0].type,
  storeCompleted: (window.StudyStore.getSheetState(${JSON.stringify(sheetId)})||{}).completedAt,
  domCompleted: document.body.innerHTML.includes("Completada") })`));

report("AUDIT/evidencias/agent2-bfcache-antes.json", out);
b.close();
