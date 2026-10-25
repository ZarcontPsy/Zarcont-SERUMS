/* Escenario A2-BANQUEO — Examen Studio: IDB examenstudio v2, revisión/tema en localStorage,
   práctica + cronómetro, visibilidad, refresco, reanudación, orientación. */
import { connect, newPage, navigate, evalJS, evalAsync, sleep, ORIGIN, screenshot, setVisibility, setViewport, report } from "./agent2-lib.mjs";

const out = { app: "banqueo", steps: [] };
function step(name, data) { out.steps.push({ name, ...data }); console.log("· " + name + " → " + JSON.stringify(data)); }
const probe = `(() => ({
  url: location.href, hash: location.hash, title: document.title,
  local: Object.keys(localStorage),
  theme: document.documentElement.dataset.theme || null,
  reviewKeys: Object.keys(JSON.parse(localStorage.getItem("banqueo-review-v1") || "{}")).length,
  practiceSessionDom: !!document.querySelector(".practice-card"),
  practiceQuestion: (document.querySelector(".practice-question")||{}).textContent ? (document.querySelector(".practice-question").textContent.slice(0,40)) : null,
  timer: (document.getElementById("practice-timer")||{}).textContent || null,
  resumeRows: document.querySelectorAll('[data-act="practice-resume"]').length,
  boot: !!document.getElementById("boot")
}))()`;

const b = await connect();
const page = await newPage(b, ORIGIN + "/EXAMEN%20STUDIO/Examen%20Studio.html");
await sleep(4000);

const idb = await evalAsync(page, `(async () => {
  const dbs = await indexedDB.databases();
  const db = await new Promise(res => { const r = indexedDB.open("examenstudio", 2); r.onsuccess = () => res(r.result); r.onerror = () => res(null); r.onblocked = () => res(null); });
  if (!db) return { dbs };
  const counts = {};
  for (const name of [...db.objectStoreNames]) {
    counts[name] = await new Promise(res => { const tx = db.transaction(name, "readonly"); const q = tx.objectStore(name).count(); q.onsuccess = () => res(q.result); q.onerror = () => res(-1); });
  }
  const attempts = await new Promise(res => { const tx = db.transaction("attempts", "readonly"); const q = tx.objectStore("attempts").getAll(); q.onsuccess = () => res(q.result); q.onerror = () => res([]); });
  return { dbs: dbs.map(d => ({ name: d.name, version: d.version })), stores: [...db.objectStoreNames], counts,
    attempts: attempts.map(a => ({ id: a.id, status: a.status, answers: Object.keys(a.answers || {}).length, index: a.index, count: a.count })) };
})()`);
step("0 arranque + IndexedDB", { probe: await evalJS(page, probe), idb });

/* --- revisión: marcar una pregunta como revisada --- */
await evalJS(page, `location.hash = "#review"`);
await sleep(1500);
const reviewScreen = await evalJS(page, `(() => ({ rows: document.querySelectorAll("[data-select], .qrow, [data-qid]").length,
  markBtn: !!document.querySelector('[data-act="review-toggle"], [data-act="mark-reviewed"], [data-act="review-mark"]'),
  actions: [...new Set([...document.querySelectorAll("[data-act]")].map(b => b.getAttribute("data-act")))].slice(0, 40) }))()`);
const marked = await evalJS(page, `(() => {
  const row = document.querySelector("[data-select]") || document.querySelector(".qrow");
  if (row) row.click();
  return { clicked: !!row };
})()`);
await sleep(900);
const markActions = await evalJS(page, `(() => ({ actions: [...new Set([...document.querySelectorAll("[data-act]")].map(b => b.getAttribute("data-act")))] }))()`);
step("1 vista revisión", { reviewScreen, marked, markActions });

/* --- tema --- */
const themeBefore = await evalJS(page, `document.documentElement.dataset.theme`);
await evalJS(page, `(() => { const b = document.querySelector('[data-act="theme"]'); if (b) b.click(); })()`);
await sleep(500);
const themeAfter = await evalJS(page, `({ theme: document.documentElement.dataset.theme, stored: localStorage.getItem("banqueo-theme-v1") || localStorage.getItem("es-theme") })`);
step("2 tema", { themeBefore, themeAfter });

/* --- práctica: iniciar --- */
await evalJS(page, `location.hash = "#practice"`);
await sleep(1200);
const setup = await evalJS(page, `(() => ({ startBtn: !!document.querySelector('[data-act="practice-start"]'), url: location.href }))()`);
await evalJS(page, `(() => { const b = document.querySelector('[data-act="practice-start"]'); if (b) b.click(); })()`);
await sleep(1600);
const started = await evalJS(page, probe);
step("3 iniciar práctica", { setup, started });
const navsBefore = page.navs;

/* --- responder y ver el cronómetro --- */
const answer = await evalJS(page, `(() => { const b = document.querySelector('[data-act="practice-answer"]'); if (!b) return { ok:false };
  b.click(); return { ok: true, letter: b.getAttribute("data-letter") }; })()`);
await sleep(700);
await evalJS(page, `(() => { const b = document.querySelector('[data-act="practice-next"]'); if (b) b.click(); })()`);
await sleep(1400);
const answered = await evalJS(page, probe);
step("4 responder + cronómetro", { answer, answered, navsDuring: page.navs - navsBefore });

/* --- pestaña oculta/visible --- */
const timerBefore = answered.timer;
await setVisibility(page, true);
await sleep(1200);
await setVisibility(page, false);
await sleep(800);
const afterTab = await evalJS(page, probe);
step("5 pestaña oculta/visible", { timerBefore, afterTab, navsDuring: page.navs - navsBefore });

/* --- refrescar en plena práctica --- */
await page.send("Page.reload");
await sleep(4000);
const afterReload = await evalJS(page, probe);
const idbAfter = await evalAsync(page, `(async () => {
  const db = await new Promise(res => { const r = indexedDB.open("examenstudio", 2); r.onsuccess = () => res(r.result); });
  const attempts = await new Promise(res => { const tx = db.transaction("attempts", "readonly"); const q = tx.objectStore("attempts").getAll(); q.onsuccess = () => res(q.result); });
  return attempts.map(a => ({ id: a.id, status: a.status, answers: Object.keys(a.answers || {}).length, index: a.index, savedAt: a.savedAt || null }));
})()`);
step("6 refrescar práctica", { afterReload, idbAfter });

/* --- reanudar el intento desde la lista --- */
const resumed = await evalJS(page, `(() => { const b = document.querySelector('[data-act="practice-resume"]'); if (!b) return { ok:false };
  b.click(); return { ok: true, id: b.getAttribute("data-id") }; })()`);
await sleep(1600);
const afterResume = await evalJS(page, probe);
step("7 reanudar intento", { resumed, afterResume });

/* --- atrás/adelante --- */
await evalJS(page, "history.back()");
await sleep(1200);
const back = await evalJS(page, `({ hash: location.hash, title: document.title })`);
await evalJS(page, "history.forward()");
await sleep(1400);
step("8 atrás/adelante", { back, fwd: await evalJS(page, probe) });

/* --- orientación --- */
await setViewport(page, 390, 844, true);
const portrait = await evalJS(page, `({ w: innerWidth, practice: !!document.querySelector(".practice-card") })`);
await setViewport(page, 844, 390, true);
const landscape = await evalJS(page, `({ w: innerWidth, practice: !!document.querySelector(".practice-card") })`);
await setViewport(page, 1280, 800, false);
step("9 orientación", { portrait, landscape });

/* --- URL directa --- */
await navigate(page, ORIGIN + "/EXAMEN%20STUDIO/Examen%20Studio.html#practice");
await sleep(4000);
step("10 URL directa #practice", await evalJS(page, probe));

await screenshot(page, "AUDIT/evidencias/agent2-banqueo-final.png");
out.errors = page.errors.filter(e => !/pdf|jsdelivr|cdnjs|sheetjs|googleapis|net::ERR/i.test(e));
report("AUDIT/evidencias/agent2-banqueo-antes.json", out);
await b.send("Target.closeTarget", { targetId: page.targetId });
b.close();
