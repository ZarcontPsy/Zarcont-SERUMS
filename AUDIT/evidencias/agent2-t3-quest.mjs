/* Escenario A2-QUEST — SERUMS QUEST: sesión activa, respuesta, visibilidad, refresco,
   reapertura, URL directa, atrás/adelante, orientación y snapshot para el HUB. */
import { connect, newPage, navigate, evalJS, evalAsync, sleep, ORIGIN, screenshot, setVisibility, setViewport, report } from "./agent2-lib.mjs";

const out = { app: "serums-quest", steps: [] };
function step(name, data) { out.steps.push({ name, ...data }); console.log("· " + name + " → " + JSON.stringify(data)); }
const questState = () => `(() => { const s = window.QuestStore.get().getState(); return {
  hash: location.hash, xp: s.xp, coins: s.coins, level: s.stage, revision: s.revision,
  answered: s.academic.answered, sessions: s.sessions.length, daily: s.daily,
  active: s.activeSession ? { id: s.activeSession.id, mode: s.activeSession.mode, index: s.activeSession.index,
    answered: Object.keys(s.activeSession.answers || {}).length, status: s.activeSession.status,
    endsAt: s.activeSession.endsAt || null, questionEndsAt: s.activeSession.questionEndsAt || null } : null }; })()`;

const b = await connect();
const page = await newPage(b, ORIGIN + "/serums-quest/index.html");
await sleep(1600);

const boot = await evalJS(page, `(() => { const s = window.QuestStore.get().getState(); return { url: location.href, hash: location.hash, xp: s.xp, revision: s.revision,
  keys: Object.keys(localStorage), theme: s.settings.theme, char: s.collection.selectedCharacterId }; })()`);
step("0 arranque", boot);

/* --- iniciar modo supervivencia desde la ruta de modo --- */
await evalJS(page, `location.hash = "#/modo/supervivencia"`);
await sleep(1200);
const modePage = await evalJS(page, `({ hash: location.hash, title: document.title, startBtn: !!document.querySelector('[data-action="start-mode"]') })`);
const started = await evalJS(page, `(() => { const b = document.querySelector('[data-action="start-mode"][data-mode="supervivencia"]'); if (!b) return { ok: false };
  b.click(); return { ok: true }; })()`);
await sleep(600);
const dialog = await evalJS(page, `(() => { const d = document.querySelector("#q-dialog"); const c = d && d.querySelector("[data-dialog-confirm]");
  if (!c) return { open: !!(d && d.open) };
  c.click(); return { open: true, title: (d.querySelector("h2")||{}).textContent, confirm: c.textContent }; })()`);
await sleep(1800);
const afterStart = await evalJS(page, questState());
step("1 iniciar sesión", { modePage, started, dialog, afterStart });

/* --- responder la primera pregunta --- */
const answered = await evalJS(page, `(() => { const b = document.querySelector('[data-action="answer"]'); if (!b) return { ok: false };
  b.click(); return { ok: true, letter: b.getAttribute("data-letter") }; })()`);
await sleep(900);
const afterAnswer = await evalJS(page, questState());
const sessionStorageDump = await evalJS(page, `(() => ({ keys: Object.keys(localStorage), prompt: (document.querySelector(".q-prompt, .q-question, h1")||{}).textContent }))()`);
step("2 primera respuesta", { answered, afterAnswer, keys: sessionStorageDump.keys });

const navsBefore = page.navs;
/* --- cambiar de pestaña y volver --- */
await setVisibility(page, true);
await sleep(400);
await setVisibility(page, false);
await sleep(500);
const afterTab = await evalJS(page, questState());
step("3 pestaña oculta/visible", { afterTab, navsDuring: page.navs - navsBefore });

/* --- refrescar en plena sesión --- */
await page.send("Page.reload");
await sleep(2200);
const afterReload = await evalJS(page, questState());
step("4 refrescar #/jugar", afterReload);

/* --- abrir otra app (hub) y volver por URL directa --- */
await page.send("Target.createTarget", { url: "about:blank" });
await navigate(page, ORIGIN + "/index.html");
await sleep(1200);
const hubSnapshot = await evalJS(page, `(() => ({ quest: JSON.parse(localStorage.getItem("serumsquest:snapshot:v1")||"null"), cards: [...document.querySelectorAll("[data-app]")].map(c => ({ id: c.getAttribute("data-app"), href: c.getAttribute("href") })) }))()`);
step("5 HUB: snapshot de QUEST", { hubSnapshot });

await navigate(page, ORIGIN + "/serums-quest/index.html#/jugar");
await sleep(1800);
const directPlay = await evalJS(page, questState());
step("6 URL directa #/jugar", directPlay);

/* --- atrás/adelante --- */
await evalJS(page, "history.back()");
await sleep(900);
const back = await evalJS(page, `({ hash: location.hash, title: document.title })`);
await evalJS(page, "history.forward()");
await sleep(900);
const fwd = await evalJS(page, questState());
step("7 atrás/adelante", { back, fwd });

/* --- orientación --- */
await setViewport(page, 390, 844, true);
const portrait = await evalJS(page, `({ w: innerWidth, hash: location.hash, options: document.querySelectorAll(".q-option").length })`);
await setViewport(page, 844, 390, true);
const landscape = await evalJS(page, `({ w: innerWidth, hash: location.hash })`);
await setViewport(page, 1280, 800, false);
step("8 orientación", { portrait, landscape });

/* --- simular ausencia larga: envejecer questionEndsAt en disco y reabrir --- */
const aged = await evalJS(page, `(() => {
  const raw = JSON.parse(localStorage.getItem("serumsquest:state:v1"));
  if (!raw.activeSession) return { ok: false };
  const before = Object.keys(raw.activeSession.answers || {}).length;
  raw.activeSession.questionEndsAt = Date.now() - 5000;
  raw.updatedAt = new Date().toISOString();
  localStorage.setItem("serumsquest:state:v1", JSON.stringify(raw));
  return { ok: true, answerCountBefore: before, oldEnds: raw.activeSession.questionEndsAt };
})()`);
await page.send("Page.reload");
await sleep(2600);
const afterExpire = await evalJS(page, `(() => { const s = window.QuestStore.get().getState();
  const session = s.activeSession;
  const omitted = session ? Object.values(session.answers || {}).filter(a => a && (a.omitted || a.skipped || a.selected == null)).length : null;
  return { answers: session ? Object.keys(session.answers || {}).length : null, omitted, status: session && session.status,
    note: (document.querySelector(".q-toast, [role=status]")||{}).textContent, hash: location.hash }; })()`);
step("9 reapertura tras ausencia (cronómetro)", { aged, afterExpire });

/* --- cerrar pestaña y reabrir --- */
const beforeClose = await evalJS(page, questState());
await b.send("Target.closeTarget", { targetId: page.targetId });
await sleep(600);
const page2 = await newPage(b, ORIGIN + "/serums-quest/index.html");
await sleep(1800);
const afterReopen = await evalJS(page2, questState());
step("10 cerrar pestaña y reabrir", { beforeClose, afterReopen });

await screenshot(page2, "AUDIT/evidencias/agent2-quest-final.png");
out.errors = page2.errors;
report("AUDIT/evidencias/agent2-quest-antes.json", out);
await b.send("Target.closeTarget", { targetId: page2.targetId });
b.close();
