/* Escenario A2-DASH — Study Dashboard: visibilidad, refresco, scroll, URL directa,
   atrás/adelante, orientación, recarga de sección y snapshot para el HUB. */
import { connect, newPage, navigate, evalJS, sleep, ORIGIN, screenshot, setVisibility, setViewport, report } from "./agent2-lib.mjs";

const out = { app: "study-dashboard", steps: [], console: [], errors: [] };
function step(name, data) { out.steps.push({ name, ...data }); console.log("· " + name + " → " + JSON.stringify(data)); }

const b = await connect();
const page = await newPage(b, ORIGIN + "/study-dashboard/index.html");
await sleep(1200);

const info = await evalJS(page, `(() => ({
  sheets: window.STUDY_CONTENT.sheets.slice(0, 3).map(s => ({ id: s.id, title: s.title })),
  storeReady: window.StudyStore.isReady(),
  mode: window.StudyStore.getMode()
}))()`);
const sheet = info.sheets[1];
step("0 carga limpia", { url: await evalJS(page, "location.href"), sheet: sheet.id, store: info.mode });

/* --- URL directa con ?sheet= --- */
await navigate(page, ORIGIN + "/study-dashboard/index.html?sheet=" + encodeURIComponent(sheet.id));
await sleep(1500);
const direct = await evalJS(page, `(() => {
  const st = window.StudyStore.getSheetState(${JSON.stringify(sheet.id)});
  return { url: location.href, hash: location.hash, title: document.title,
    views: st ? st.views : null, scroll: st ? st.scroll : null,
    scrollY: Math.round(window.scrollY), docH: document.documentElement.scrollHeight,
    navCount: performance.getEntriesByType("navigation").length };
})()`);
step("1 URL directa ?sheet=", direct);
const navsBefore = page.navs;

/* --- scroll 60 % y cambio de pestaña (visibilitychange) --- */
const scrolled = await evalJS(page, `(() => { const max = document.documentElement.scrollHeight - window.innerHeight; window.scrollTo(0, Math.round(max*0.6)); return { max, y: Math.round(window.scrollY) }; })()`);
await sleep(400);
await setVisibility(page, true);   // ocultar
await sleep(400);
const afterHidden = await evalJS(page, `(() => { const st = window.StudyStore.getSheetState(${JSON.stringify(sheet.id)}); return { scroll: st && st.scroll, readSeconds: st && st.readSeconds, scrollY: Math.round(window.scrollY) }; })()`);
await setVisibility(page, false);  // volver
await sleep(500);
const afterVisible = await evalJS(page, `(() => ({ scrollY: Math.round(window.scrollY), docH: document.documentElement.scrollHeight,
  h1: (document.querySelector("h1")||{}).textContent, html: document.querySelector("#view-root").innerHTML.length }))()`);
step("2 scroll 60% + pestaña oculta/visible", { scrolled, afterHidden, afterVisible, navsDuring: page.navs - navsBefore });

/* --- refrescar (F5) en la misma URL hash --- */
const hashBefore = await evalJS(page, "location.href");
await page.send("Page.reload");
await sleep(2000);
const afterReload = await evalJS(page, `(() => { const st = window.StudyStore.getSheetState(${JSON.stringify(sheet.id)});
  return { url: location.href, scrollY: Math.round(window.scrollY), docH: document.documentElement.scrollHeight,
    views: st && st.views, scroll: st && st.scroll, h1: (document.querySelector("h1")||{}).textContent }; })()`);
step("3 refrescar (hash #/ficha)", { hashBefore, afterReload });

/* --- volver al panel por el enlace superior y reentrar a la ficha --- */
const home = await evalJS(page, `(() => { const a = document.querySelector('.s-navlink[href="#/"]'); if (a) { a.click(); return true; } const brand = document.querySelector('a[href="#/"]'); if (brand) { brand.click(); return true; } return false; })()`);
await sleep(700);
const panel = await evalJS(page, `(() => ({ hash: location.hash, title: document.title, scrollY: Math.round(window.scrollY) }))()`);
// reentrar por la biblioteca
const reentry = await evalJS(page, `(() => { const link = document.querySelector('a[href*="#/ficha/"]'); if (!link) return { ok: false };
  link.click(); return { ok: true, href: link.getAttribute("href") }; })()`);
await sleep(800);
const afterReentry = await evalJS(page, `(() => { const st = window.StudyStore.getSheetState(${JSON.stringify(sheet.id)});
  return { hash: location.hash, scrollY: Math.round(window.scrollY), views: st && st.views, storedScroll: st && st.scroll }; })()`);
step("4 panel → ficha de nuevo", { home, panel, reentry, afterReentry });

/* --- atrás / adelante --- */
await evalJS(page, "history.back()");
await sleep(900);
const back = await evalJS(page, `(() => ({ hash: location.hash, title: document.title, scrollY: Math.round(window.scrollY) }))()`);
await evalJS(page, "history.forward()");
await sleep(900);
const fwd = await evalJS(page, `(() => ({ hash: location.hash, title: document.title, scrollY: Math.round(window.scrollY) }))()`);
step("5 atrás/adelante", { back, fwd });

/* --- orientación (viewport) --- */
await evalJS(page, "window.scrollTo(0, Math.round((document.documentElement.scrollHeight - window.innerHeight)*0.5))");
await sleep(300);
const beforeOrient = await evalJS(page, "({ y: Math.round(window.scrollY), w: innerWidth, h: innerHeight })");
await setViewport(page, 390, 844, true);
const portrait = await evalJS(page, "({ y: Math.round(window.scrollY), w: innerWidth, h: innerHeight, docH: document.documentElement.scrollHeight })");
await setViewport(page, 844, 390, true);
const landscape = await evalJS(page, "({ y: Math.round(window.scrollY), w: innerWidth, h: innerHeight, docH: document.documentElement.scrollHeight })");
await setViewport(page, 1280, 800, false);
const desktop = await evalJS(page, "({ y: Math.round(window.scrollY), w: innerWidth, h: innerHeight })");
step("6 orientación", { beforeOrient, portrait, landscape, desktop });

/* --- snapshot para el HUB --- */
const snap = await evalJS(page, `(() => {
  const raw = localStorage.getItem("studyhub:snapshot:v1");
  const state = JSON.parse(localStorage.getItem("study-state-v1") || "null");
  return { snapshot: raw ? JSON.parse(raw) : null,
    stateKeys: state ? Object.keys(state) : null,
    stateUpdatedAt: state && state.updatedAt,
    sheetEntry: state && state.sheets[${JSON.stringify(sheet.id)}],
    localKeys: Object.keys(localStorage).filter(k => k.startsWith("study")),
    idb: null };
})()`);
step("7 claves y snapshot", snap);

/* --- IndexedDB --- */
const idb = await evalJS(page, `(async () => {
  const dbs = await indexedDB.databases();
  const open = await new Promise(res => { const r = indexedDB.open("study-serums", 1); r.onsuccess = () => res(r.result); r.onerror = () => res(null); });
  if (!open) return { dbs };
  const val = await new Promise(res => { const tx = open.transaction("state", "readonly"); const q = tx.objectStore("state").get("main"); q.onsuccess = () => res(q.result); q.onerror = () => res(null); });
  return { dbs: dbs.map(d => ({ name: d.name, version: d.version })), stores: [...open.objectStoreNames], idbUpdatedAt: val && val.updatedAt, idbSheets: val && Object.keys(val.sheets || {}).length };
})()`);
step("8 indexedDB", idb);

await screenshot(page, "AUDIT/evidencias/agent2-dash-final.png");
out.console = page.console;
out.errors = page.errors;
report("AUDIT/evidencias/agent2-dash-antes.json", out);
await b.send("Target.closeTarget", { targetId: page.targetId });
b.close();
