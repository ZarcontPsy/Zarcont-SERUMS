/* Escenario A2-FLASH — Study Flashcards: sesión, índice, respuestas, visibilidad,
   refresco, reentrada, URL directa, atrás/adelante, orientación. */
import { connect, newPage, navigate, evalJS, sleep, ORIGIN, screenshot, setVisibility, setViewport, report } from "./agent2-lib.mjs";

const out = { app: "study-flashcards", steps: [] };
function step(name, data) { out.steps.push({ name, ...data }); console.log("· " + name + " → " + JSON.stringify(data)); }

const b = await connect();
const page = await newPage(b, ORIGIN + "/study-flashcards/index.html");
await sleep(1400);

const deckId = await evalJS(page, `(() => { const s = window.STUDY_CONTENT.sheets.find(s => window.STUDY_CONTENT.cards.some(c => c.sheetId === s.id)); return s.id; })()`);
step("0 portada", { url: await evalJS(page, "location.href"), deckId, active: await evalJS(page, "!!window.StudyStore.getFlashSession()"), navs: page.navs });

/* --- entrar por URL directa con modo (crea sesión) --- */
await navigate(page, ORIGIN + "/study-flashcards/index.html?deck=" + encodeURIComponent(deckId) + "&mode=free");
await sleep(1800);
const start = await evalJS(page, `(() => { const s = window.StudyStore.getFlashSession(); return {
  url: location.href, hash: location.hash, title: document.title,
  session: s ? { id: s.id, mode: s.mode, index: s.index, len: s.queue.length, answers: Object.keys(s.answers).length } : null,
  stage: !!document.querySelector("#session-stage"),
  hasRating: !!document.querySelector(".rating-grid"), hasReveal: !!document.querySelector(".reveal-zone"),
  hasOptions: document.querySelectorAll(".flash-option").length }; })()`);
step("1 URL directa ?mode=free crea sesión", start);
const navsBefore = page.navs;

/* --- revelar + calificar la primera tarjeta --- */
if (start.hasReveal) {
  await evalJS(page, `document.querySelector('[data-action="reveal"]').click()`);
  await sleep(300);
}
const revealed = await evalJS(page, `({ hasRating: !!document.querySelector(".rating-grid"), hasReveal: !!document.querySelector(".reveal-zone") })`);
const rated = await evalJS(page, `(() => { const btn = document.querySelector('[data-action="rate"]'); if (!btn) return { ok:false }; btn.click(); return { ok:true, rating: btn.getAttribute("data-rating") }; })()`);
await sleep(600);
const afterAnswer = await evalJS(page, `(() => { const s = window.StudyStore.getFlashSession(); return { index: s && s.index, answers: s && Object.keys(s.answers).length, correct: s && s.correct,
  stage: !!document.querySelector("#session-stage"), hasRating: !!document.querySelector(".rating-grid"), h1: (document.querySelector(".flash-prompt")||{}).textContent }; })()`);
step("2 revelar y calificar", { revealed, rated, afterAnswer, navsDuring: page.navs - navsBefore });

/* --- cambiar de pestaña y volver --- */
const yBefore = await evalJS(page, "Math.round(window.scrollY)");
await setVisibility(page, true);
await sleep(350);
await setVisibility(page, false);
await sleep(500);
const afterTab = await evalJS(page, `(() => { const s = window.StudyStore.getFlashSession(); return { index: s && s.index, answers: s && Object.keys(s.answers).length,
  hash: location.hash, scrollY: Math.round(window.scrollY), hasRating: !!document.querySelector(".rating-grid"), hasReveal: !!document.querySelector(".reveal-zone"), hasOptions: document.querySelectorAll(".flash-option").length }; })()`);
step("3 pestaña oculta/visible", { yBefore, afterTab, navsDuring: page.navs - navsBefore });

/* --- abrir la tarjeta en el estado medio (sin responder) y cambiar de pestaña --- */
await evalJS(page, `(() => { const b = document.querySelector('[data-action="next"]'); if (b) b.click(); })()`);
await sleep(500);
const midBefore = await evalJS(page, `(() => { const s = window.StudyStore.getFlashSession(); const opt = document.querySelector(".flash-option"); if (opt) opt.click();
  return { index: s && s.index, selected: document.querySelectorAll(".flash-option.is-selected").length, reveal: !!document.querySelector(".reveal-zone") }; })()`);
await setVisibility(page, true);
await sleep(300);
await setVisibility(page, false);
await sleep(500);
const midAfter = await evalJS(page, `(() => ({ selected: document.querySelectorAll(".flash-option.is-selected").length, reveal: !!document.querySelector(".reveal-zone"), rating: !!document.querySelector(".rating-grid"), index: (window.StudyStore.getFlashSession()||{}).index }))()`);
step("4 estado intermedio + pestaña", { midBefore, midAfter });

/* --- refrescar --- */
await page.send("Page.reload");
await sleep(2200);
const afterReload = await evalJS(page, `(() => { const s = window.StudyStore.getFlashSession(); return { url: location.href, hash: location.hash,
  session: s ? { index: s.index, answers: Object.keys(s.answers).length, len: s.queue.length } : null,
  stage: !!document.querySelector("#session-stage"), h1: (document.querySelector("h1")||{}).textContent }; })()`);
step("5 refrescar en sesión", afterReload);

/* --- salir al inicio y volver por la barra de sesión --- */
await evalJS(page, `document.querySelector('a.s-navlink[href="#/"]').click()`);
await sleep(800);
const home = await evalJS(page, `({ hash: location.hash, banner: !!document.querySelector(".active-session"), bannerHref: (document.querySelector(".active-session")||{}).getAttribute ? document.querySelector(".active-session").getAttribute("href") : null })`);
await evalJS(page, `(() => { const a = document.querySelector(".active-session"); if (a) a.click(); })()`);
await sleep(800);
const reentry = await evalJS(page, `(() => { const s = window.StudyStore.getFlashSession(); return { hash: location.hash, index: s && s.index, answers: s && Object.keys(s.answers).length, stage: !!document.querySelector("#session-stage") }; })()`);
step("6 salir al inicio y reentrar por la barra", { home, reentry });

/* --- atrás/adelante --- */
await evalJS(page, "history.back()");
await sleep(900);
const back = await evalJS(page, `({ hash: location.hash, title: document.title })`);
await evalJS(page, "history.forward()");
await sleep(900);
const fwd = await evalJS(page, `({ hash: location.hash, title: document.title, stage: !!document.querySelector("#session-stage") })`);
step("7 atrás/adelante", { back, fwd });

/* --- orientación --- */
await setViewport(page, 390, 844, true);
const portrait = await evalJS(page, `({ w: innerWidth, hash: location.hash, stage: !!document.querySelector("#session-stage"), options: document.querySelectorAll(".flash-option").length })`);
await setViewport(page, 844, 390, true);
const landscape = await evalJS(page, `({ w: innerWidth, hash: location.hash, stage: !!document.querySelector("#session-stage") })`);
await setViewport(page, 1280, 800, false);
step("8 orientación", { portrait, landscape });

/* --- terminar la sesión --- */
for (let i = 0; i < 4; i++) {
  const done = await evalJS(page, `(() => {
    const s = window.StudyStore.getFlashSession(); if (!s) return { done: true };
    const rate = document.querySelector('[data-action="rate"]');
    if (rate) { rate.click(); return { rated: true }; }
    const rev = document.querySelector('[data-action="reveal"]'); if (rev) { rev.click(); return { revealed: true }; }
    const next = document.querySelector('[data-action="next"]'); if (next) { next.click(); return { next: true }; }
    const check = document.querySelector('[data-action="check"]'); if (check) { check.click(); return { check: true }; }
    const opt = document.querySelector(".flash-option"); if (opt) { opt.click(); return { opt: true }; }
    const end = document.querySelector('[data-action="end-session"]'); if (end) { end.click(); return { end: true }; }
    return { stuck: true };
  })()`);
  await sleep(450);
  if (done.stuck || done.done) break;
}
const ended = await evalJS(page, `(() => { const s = window.StudyStore.getFlashSession(); const st = window.StudyStore.getState();
  return { hash: location.hash, active: !!s, sessions: st.sessions.length, last: st.sessions[0] ? { total: st.sessions[0].total, correct: st.sessions[0].correct } : null,
    summaryVisible: !!document.querySelector(".summary"), title: document.title }; })()`);
step("9 terminar sesión", ended);

const stateDump = await evalJS(page, `(() => { const st = window.StudyStore.getState(); const raw = JSON.parse(localStorage.getItem("study-state-v1")||"null");
  return { flashSession: st.flashSession, sessions: st.sessions.length, cards: Object.keys(st.cards).length,
    lastFlash: st.last.flashcards, snap: JSON.parse(localStorage.getItem("studyhub:snapshot:v1")||"null"),
    sameInLocal: !!raw && raw.updatedAt === st.updatedAt, localKeys: Object.keys(localStorage) }; })()`);
step("10 estado persistido", stateDump);

await screenshot(page, "AUDIT/evidencias/agent2-flash-final.png");
out.errors = page.errors;
out.console = page.console.filter(c => c.type === "error" || c.type === "warning");
report("AUDIT/evidencias/agent2-flash-antes.json", out);
await b.send("Target.closeTarget", { targetId: page.targetId });
b.close();
