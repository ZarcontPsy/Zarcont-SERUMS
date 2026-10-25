/* A2-RESTART fase 1: crear estado en las cinco apps y cerrar el navegador por completo. */
import { connect, newPage, evalJS, sleep, ORIGIN, report } from "./agent2-lib.mjs";

const out = { fase: "1-antes-de-cerrar", steps: [] };
function step(name, data) { out.steps.push({ name, ...data }); console.log("· " + name + " → " + JSON.stringify(data)); }
const b = await connect();

/* Dashboard: abrir ficha, desplazar, dejar favorito */
const dash = await newPage(b, ORIGIN + "/study-dashboard/index.html");
await sleep(1500);
const dashInfo = await evalJS(dash, `(async () => {
  const id = window.STUDY_CONTENT.sheets[4].id;
  const r = await window.StudyStore.recordSheetView(id, window.STUDY_CONTENT.sheets[4].topicId);
  window.StudyStore.toggleFavorite(id);
  window.StudyStore.setSheetScroll(id, 0.42);
  return { id, views: r.views, fav: window.StudyStore.getSheetState(id).favorite, scroll: window.StudyStore.getSheetState(id).scroll };
})()`);
step("dashboard", dashInfo);

/* Flashcards: sesión activa con una respuesta */
const flash = await newPage(b, ORIGIN + "/study-flashcards/index.html");
await sleep(1600);
const flashInfo = await evalJS(flash, `(() => {
  const deck = window.STUDY_CONTENT.sheets.find(s => window.STUDY_CONTENT.cards.some(c => c.sheetId === s.id)).id;
  const s = window.StudyStore.startSession("free", deck, window.STUDY_CONTENT.cards.filter(c => c.sheetId === deck).map(c => c.id));
  window.StudyStore.recordSessionAnswer(s.queue[0], { correct: true, rating: "good", selected: null });
  window.StudyStore.updateFlashSession({ index: 1 });
  const now = window.StudyStore.getFlashSession();
  return { deck, id: now.id, index: now.index, answers: Object.keys(now.answers).length, correct: now.correct };
})()`);
step("flashcards", flashInfo);

/* QUEST: sesión activa con una respuesta */
const quest = await newPage(b, ORIGIN + "/serums-quest/index.html");
await sleep(2000);
await evalJS(quest, `location.hash = "#/modo/supervivencia"`);
await sleep(800);
await evalJS(quest, `document.querySelector('[data-action="start-mode"]').click()`);
await sleep(600);
await evalJS(quest, `(() => { const d = document.querySelector("#q-dialog"); const c = d && d.querySelector("[data-dialog-confirm]"); if (c) c.click(); })()`);
await sleep(1500);
await evalJS(quest, `(() => { const b = document.querySelector('[data-action="answer"]'); if (b) b.click(); })()`);
await sleep(1000);
const questInfo = await evalJS(quest, `(() => { const s = window.QuestStore.get().getState(); return { xp: s.xp, coins: s.coins, revision: s.revision,
  active: s.activeSession ? { id: s.activeSession.id, answered: Object.keys(s.activeSession.answers || {}).length, index: s.activeSession.index } : null,
  name: s.profile.name }; })()`);
step("quest", questInfo);

/* Banqueo: práctica iniciada + respuesta + revisión marcada */
const ban = await newPage(b, ORIGIN + "/EXAMEN%20STUDIO/Examen%20Studio.html");
await sleep(4500);
const banInfo = await evalJS(ban, `(() => {
  const q = window.BanqueoStore.state.questions[0];
  window.BanqueoStore.markReviewed(q.id, true);
  return { qid: q.id, review: Object.keys(JSON.parse(localStorage.getItem("banqueo-review-v1") || "{}")) };
})()`);
await evalJS(ban, `location.hash = "#practice"`);
await sleep(1200);
await evalJS(ban, `document.querySelector('[data-act="practice-start"]').click()`);
await sleep(1600);
const banSession = await evalJS(ban, `(() => { const b = document.querySelector('[data-act="practice-answer"]'); if (b) b.click(); return { url: location.href, practice: !!document.querySelector(".practice-card") }; })()`);
step("banqueo", { banInfo, banSession });

/* Plazas */
const plazas = await newPage(b, ORIGIN + "/serums%20map/serums-map-explorer/index.html");
await sleep(3200);
const plazasInfo = await evalJS(plazas, `(() => { const p = window.App.allPlazas()[3]; window.App.toggleFav(p); window.Store.set("theme", "light");
  return { favs: window.Store.get("favoritos", []), theme: window.Store.get("theme", "dark") }; })()`);
step("plazas", plazasInfo);

const persistence = await evalJS(dash, `(() => ({
  studyState: JSON.parse(localStorage.getItem("study-state-v1") || "null").updatedAt,
  snapshot: !!localStorage.getItem("studyhub:snapshot:v1"),
  quest: !!localStorage.getItem("serumsquest:state:v1"),
  review: Object.keys(JSON.parse(localStorage.getItem("banqueo-review-v1") || "{}")).length,
  plazasFavs: JSON.parse(localStorage.getItem("serums_favoritos") || "[]").length,
  keys: Object.keys(localStorage).sort()
}))()`);
step("estado en disco antes de cerrar", persistence);

report("AUDIT/evidencias/agent2-restart-fase1.json", out);
await b.send("Browser.close");
await sleep(1500);
b.close();
