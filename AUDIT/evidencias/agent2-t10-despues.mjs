/* A2-DESPUÉS — verificación de las correcciones aplicadas (mismo navegador/perfil). */
import { connect, newPage, navigate, evalJS, evalAsync, sleep, ORIGIN, report } from "./agent2-lib.mjs";

const out = { fase: "despues", steps: [] };
function step(name, data) { out.steps.push({ name, ...data }); console.log("· " + name + " → " + JSON.stringify(data)); }
const b = await connect();

/* ============ 1. study-shared/store.js ============ */
const dash = await newPage(b, ORIGIN + "/study-dashboard/index.html");
await sleep(1600);
const sheetId = await evalJS(dash, "window.STUDY_CONTENT.sheets[8].id");

const scrollGuard = await evalJS(dash, `(() => {
  const id = ${JSON.stringify(sheetId)};
  window.StudyStore.setSheetScroll(id, 0.42);
  const a = window.StudyStore.getSheetState(id).scroll;
  window.StudyStore.setSheetScroll(id, 0);          // apertura sin reanudar
  const b = window.StudyStore.getSheetState(id).scroll;
  window.StudyStore.setSheetScroll(id, 0.71);       // avance real
  const c = window.StudyStore.getSheetState(id).scroll;
  window.StudyStore.setSheetScroll(id, 0.04);       // avance real (pequeño, no cero)
  const d = window.StudyStore.getSheetState(id).scroll;
  window.StudyStore.setSheetScroll(id, 0);          // otra apertura sin reanudar
  const e = window.StudyStore.getSheetState(id).scroll;
  return { tras_042: a, tras_cero: b, tras_071: c, tras_004: d, tras_cero_otra_vez: e };
})()`);
step("1.1 setSheetScroll no borra la posición con un 0 de apertura", scrollGuard);

/* ============ 2. study: último mazo con sesión activa ============ */
const flash = await newPage(b, ORIGIN + "/study-flashcards/index.html");
await sleep(1800);
const deckCtx = await evalJS(flash, `(() => {
  const sheets = window.STUDY_CONTENT.sheets;
  const deck = sheets.find(s => window.STUDY_CONTENT.cards.filter(c => c.sheetId === s.id).length >= 3);
  const s = window.StudyStore.startSession("free", deck.id, window.STUDY_CONTENT.cards.filter(c => c.sheetId === deck.id).map(c => c.id));
  window.StudyStore.recordSessionAnswer(s.queue[0], { correct: true, rating: "good", selected: null });
  const last = window.StudyStore.getState().last.flashcards;
  const active = window.StudyStore.getFlashSession();
  const snap = JSON.parse(localStorage.getItem("studyhub:snapshot:v1") || "null");
  return { deckId: deck.id, deckTitle: deck.title, last, activeDeck: active.deckId,
    resumeUrl: last.url, resumeConDeck: window.StudyStore.getFlashSession(deck.id) ? true : false,
    snapshotLast: snap && snap.flashcards ? snap.flashcards.last : null };
})()`);
step("2.1 la respuesta conserva el mazo de la sesión (no el tema)", deckCtx);

/* reanudación real por la URL que publica el HUB */
await navigate(flash, deckCtx.last.url.replace(/^.*?(?=study-flashcards)/, ORIGIN + "/"));
await sleep(2000);
const resumed = await evalJS(flash, `(() => { const s = window.StudyStore.getFlashSession(); return { url: location.href, hash: location.hash,
  active: !!s, deck: s && s.deckId, index: s && s.index, stage: !!document.querySelector("#session-stage") }; })()`);
step("2.2 ?deck=&resume=1 reanuda la sesión correcta", resumed);

/* sin sesión: el último mazo vuelve a ser el tema de la tarjeta (compatibilidad) */
const noSession = await evalJS(flash, `(() => {
  window.StudyStore.abandonSession();
  const card = window.STUDY_CONTENT.cards.find(c => c.type === "concept");
  window.StudyStore.recordReview(card.id, "good", { correct: true });
  const last = window.StudyStore.getState().last.flashcards;
  return { lastDeck: last.deckId, cardTopic: card.topicId, igualAlTema: last.deckId === card.topicId, url: last.url };
})()`);
step("2.3 sin sesión activa se mantiene el formato anterior (tema)", noSession);

/* ============ 3. EXAMEN STUDIO: revisión entre pestañas ============ */
const banA = await newPage(b, ORIGIN + "/EXAMEN%20STUDIO/Examen%20Studio.html");
const banB = await newPage(b, ORIGIN + "/EXAMEN%20STUDIO/Examen%20Studio.html");
await sleep(4500);
const qids = await evalJS(banA, `window.BanqueoStore.state.questions.slice(3, 6).map(q => q.id)`);
const cross = await evalJS(banA, `(() => { window.BanqueoStore.markReviewed(${JSON.stringify(qids[0])}, true); return Object.keys(JSON.parse(localStorage.getItem("banqueo-review-v1")||"{}")); })()`);
const crossB = await evalJS(banB, `(() => { window.BanqueoStore.markReviewed(${JSON.stringify(qids[1])}, true); return Object.keys(JSON.parse(localStorage.getItem("banqueo-review-v1")||"{}")); })()`);
await sleep(600);
const disk = await evalJS(banB, `(() => { const m = JSON.parse(localStorage.getItem("banqueo-review-v1")||"{}");
  return { total: Object.keys(m).length, hasA: !!m[${JSON.stringify(qids[0])}], hasB: !!m[${JSON.stringify(qids[1])}],
    memA: Object.keys(window.BanqueoStore.state.review).length, memB: Object.keys(window.BanqueoStore.state.review).length }; })()`);
const memA = await evalJS(banA, `Object.keys(window.BanqueoStore.state.review).length`);
step("3.1 revisión entre dos pestañas (antes se perdía una)", { qids, cross, crossB, disk, memA });

/* marcar y desmarcar conserva la clave */
const toggled = await evalJS(banA, `(() => {
  window.BanqueoStore.markReviewed(${JSON.stringify(qids[2])}, true);
  window.BanqueoStore.markReviewed(${JSON.stringify(qids[2])}, false);
  const m = JSON.parse(localStorage.getItem("banqueo-review-v1")||"{}");
  return { entry: m[${JSON.stringify(qids[2])}], sigueExistiendo: !!m[${JSON.stringify(qids[2])}], total: Object.keys(m).length };
})()`);
step("3.2 desmarcar conserva la entrada (no borra historial)", toggled);

/* ============ 4. QUEST: estado reciente frente a diario viejo ============ */
const quest = await newPage(b, ORIGIN + "/serums-quest/index.html");
await sleep(2200);
const journalBefore = await evalJS(quest, `(() => { const raw = JSON.parse(localStorage.getItem("serumsquest:state:v1")); return { revision: raw.revision, xp: raw.xp, updatedAt: raw.updatedAt }; })()`);
const injectOld = await evalJS(quest, `(() => {
  const state = JSON.parse(localStorage.getItem("serumsquest:state:v1"));
  state.xp = 999;
  state.revision = 1;
  state.updatedAt = "2026-01-01T00:00:00.000Z";
  localStorage.setItem("serumsquest:journal:v1", JSON.stringify({ at: new Date().toISOString(), updatedAt: state.updatedAt, state }));
  state.xp = 111; state.revision = Number(localStorage.getItem("__rev__") || 0);
  return { journalXp: 999, journalRev: 1 };
})()`);
await quest.send("Page.reload");
await sleep(2500);
const afterOldJournal = await evalJS(quest, `(() => { const raw = JSON.parse(localStorage.getItem("serumsquest:state:v1")); const s = window.QuestStore.get().getState();
  return { diskRevision: raw.revision, diskXp: raw.xp, memXp: s.xp, journalPresent: !!localStorage.getItem("serumsquest:journal:v1") }; })()`);
step("4.1 diario viejo no sustituye al estado más reciente", { journalBefore, injectOld, afterOldJournal });

/* diario nuevo sí se consolida */
const injectNew = await evalJS(quest, `(() => {
  const state = JSON.parse(localStorage.getItem("serumsquest:state:v1"));
  state.coins = 777;
  state.revision = Number(state.revision) + 5;
  state.updatedAt = new Date(Date.now() + 60000).toISOString();
  localStorage.setItem("serumsquest:journal:v1", JSON.stringify({ at: new Date().toISOString(), updatedAt: state.updatedAt, state }));
  return { esperado: 777, journalRev: state.revision };
})()`);
await quest.send("Page.reload");
await sleep(2500);
const afterNewJournal = await evalJS(quest, `(() => { const raw = JSON.parse(localStorage.getItem("serumsquest:state:v1"));
  return { coins: raw.coins, revision: raw.revision, memCoins: window.QuestStore.get().getState().coins, journalPresent: !!localStorage.getItem("serumsquest:journal:v1") }; })()`);
step("4.2 diario más reciente sí se consolida", { injectNew, afterNewJournal });

/* ============ 5. PLAZAS: set(undefined) y geocache ============ */
const plazas = await newPage(b, ORIGIN + "/serums%20map/serums-map-explorer/index.html");
await sleep(3200);
const plazasStore = await evalJS(plazas, `(() => {
  window.Store.set("__a2_probe__", { a: 1 });
  const before = localStorage.getItem("serums___a2_probe__");
  window.Store.set("__a2_probe__", undefined);
  const after = localStorage.getItem("serums___a2_probe__");
  const cache = { "g:x": { lat: 1, lon: 2 } };
  const saved = window.Geocoder.getCache(); // lee de disco
  window.Store.set("geocache", { "g:uno": { lat: -12, lon: -77 } });
  return { before, after, quitada: after === null, cacheKeys: Object.keys(saved || {}).length, get: window.Store.get("favoritos", []).length };
})()`);
step("5.1 Store.set(undefined) elimina la clave en vez de guardar 'undefined'", plazasStore);

out.errors = [];
report("AUDIT/evidencias/agent2-despues-store.json", out);
for (const p of [dash, flash, banA, banB, quest, plazas]) await b.send("Target.closeTarget", { targetId: p.targetId });
b.close();
