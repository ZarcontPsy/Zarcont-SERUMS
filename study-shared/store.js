/* SERUMS STUDY — almacén compartido
   IndexedDB (estado completo) + localStorage (respaldo y snapshot para el HUB).
   No toca las claves de BANQUEO ni de PLAZAS SERUMS. */
(function () {
  "use strict";

  var DB_NAME = "study-serums";
  var DB_VERSION = 1;
  var STORE_NAME = "state";
  var STATE_KEY = "main";
  var LS_KEY = "study-state-v1";
  var SNAPSHOT_KEY = "studyhub:snapshot:v1";
  var VERSION = 1;
  var INTERVALS = [0, 1, 2, 4, 7, 15, 30];

  var state = null;
  var db = null;
  var ready = false;
  var initPromise = null;
  var storageMode = "local";
  var listeners = [];

  function content() { return window.STUDY_CONTENT || { sheets: [], cards: [], topics: [], areas: [], sources: [] }; }
  function nowISO() { return new Date().toISOString(); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function dayKey(d) {
    var x = d || new Date();
    var m = String(x.getMonth() + 1).padStart(2, "0");
    var day = String(x.getDate()).padStart(2, "0");
    return x.getFullYear() + "-" + m + "-" + day;
  }
  function addDays(days) {
    var d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString();
  }
  function parseDate(value) {
    if (!value) return null;
    var d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  function defaultState() {
    return {
      version: VERSION,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      sheets: {},
      cards: {},
      sessions: [],
      activity: {},
      goals: { dailySheets: 2 },
      history: [],
      last: {},
      flashSession: null
    };
  }
  function normalize(raw) {
    var base = defaultState();
    var s = raw && typeof raw === "object" ? raw : {};
    base.createdAt = s.createdAt || base.createdAt;
    base.updatedAt = s.updatedAt || base.updatedAt;
    base.sheets = s.sheets && typeof s.sheets === "object" ? s.sheets : {};
    base.cards = s.cards && typeof s.cards === "object" ? s.cards : {};
    base.sessions = (Array.isArray(s.sessions) ? s.sessions : []).filter(function (x) {
      return x && (Number(x.total) > 0 || (Number(x.correct) || 0) + (Number(x.wrong) || 0) > 0);
    });
    base.activity = s.activity && typeof s.activity === "object" ? s.activity : {};
    base.goals = Object.assign({ dailySheets: 2 }, s.goals || {});
    base.history = (Array.isArray(s.history) ? s.history : []).filter(function (h) {
      return !(h && h.type === "session" && / · 0 tarjetas$/.test(h.title || ""));
    });
    base.last = s.last && typeof s.last === "object" ? s.last : {};
    base.flashSession = s.flashSession || null;
    return base;
  }
  function readLocal() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }
  function readSnapshot() {
    try {
      var raw = localStorage.getItem(SNAPSHOT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function syncFromStorage(raw) {
    if (!state) return state;
    var incoming = raw !== undefined ? raw : readLocal();
    if (!incoming) return state;
    var chosen = pickNewer(state, incoming);
    if (!chosen || chosen === state) return state;
    state = normalize(chosen);
    notify();
    return state;
  }
  function watchStorage() {
    if (!window || watchStorage.done) return;
    watchStorage.done = true;
    window.addEventListener("storage", function (e) {
      if (e.key !== LS_KEY || !e.newValue) return;
      try { syncFromStorage(JSON.parse(e.newValue)); } catch (err) {}
    });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) syncFromStorage();
    });
  }
  function notify() {
    var payload = { state: state, snapshot: readSnapshot() };
    listeners.slice().forEach(function (fn) {
      try { fn(payload); } catch (e) { console.warn("StudyStore listener", e); }
    });
    try { window.dispatchEvent(new CustomEvent("study:change", { detail: payload })); } catch (e) {}
  }
  function openDB() {
    return new Promise(function (resolve) {
      if (!window.indexedDB) return resolve(null);
      var settled = false;
      var req;
      try { req = indexedDB.open(DB_NAME, DB_VERSION); } catch (e) { return resolve(null); }
      req.onupgradeneeded = function () {
        var d = req.result;
        if (!d.objectStoreNames.contains(STORE_NAME)) d.createObjectStore(STORE_NAME);
      };
      req.onsuccess = function () { settled = true; resolve(req.result); };
      req.onerror = function () { if (!settled) resolve(null); };
      req.onblocked = function () { if (!settled) resolve(null); };
      setTimeout(function () { if (!settled) resolve(null); }, 1600);
    });
  }
  function idbGet() {
    return new Promise(function (resolve) {
      if (!db) return resolve(null);
      try {
        var tx = db.transaction(STORE_NAME, "readonly");
        var req = tx.objectStore(STORE_NAME).get(STATE_KEY);
        req.onsuccess = function () { resolve(req.result || null); };
        req.onerror = function () { resolve(null); };
      } catch (e) { resolve(null); }
    });
  }
  function idbPut(payload) {
    return new Promise(function (resolve) {
      if (!db) return resolve(false);
      try {
        var tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(payload, STATE_KEY);
        tx.oncomplete = function () { resolve(true); };
        tx.onerror = function () { resolve(false); };
      } catch (e) { resolve(false); }
    });
  }
  function pickNewer(a, b) {
    if (!a) return b;
    if (!b) return a;
    var da = parseDate(a.updatedAt) ? parseDate(a.updatedAt).getTime() : 0;
    var dbb = parseDate(b.updatedAt) ? parseDate(b.updatedAt).getTime() : 0;
    return dbb > da ? b : a;
  }
  async function load() {
    db = await openDB();
    var fromDB = null;
    if (db) fromDB = await idbGet();
    var local = readLocal();
    var chosen = pickNewer(fromDB, local);
    state = normalize(chosen);
    storageMode = db ? "indexeddb" : "local";
    save();
    ready = true;
    watchStorage();
    notify();
    return state;
  }
  function init() {
    if (initPromise) return initPromise;
    initPromise = load().catch(function (e) {
      console.warn("StudyStore init", e);
      state = normalize(readLocal());
      storageMode = "local";
      ready = true;
      save();
      return state;
    });
    return initPromise;
  }
  function save() {
    if (!state) return state;
    var persisted = readLocal();
    if (persisted && persisted !== state) {
      try { state = mergeStates(state, persisted); } catch (e) { console.warn("StudyStore merge", e); }
    }
    state.updatedAt = nowISO();
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
    writeSnapshot();
    if (db) idbPut(clone(state)).then(function (ok) { if (!ok) storageMode = "local"; });
    notify();
    return state;
  }
  function saveFresh() {
    if (!state) return state;
    state.updatedAt = nowISO();
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
    writeSnapshot();
    if (db) idbPut(clone(state));
    notify();
    return state;
  }
  function timestamp(value) {
    var d = parseDate(value);
    return d ? d.getTime() : 0;
  }
  function mergeCardMaps(current, persisted) {
    var out = Object.assign({}, persisted || {});
    Object.keys(current || {}).forEach(function (id) {
      var a = current[id];
      var b = out[id];
      if (!b) { out[id] = a; return; }
      var ta = timestamp(a.lastReviewAt);
      var tb = timestamp(b.lastReviewAt);
      if (ta !== tb) { out[id] = ta > tb ? a : b; return; }
      out[id] = (Number(b.reviews) || 0) > (Number(a.reviews) || 0) ? b : a;
    });
    return out;
  }
  function mergeSessions(current, persisted) {
    var map = {};
    (persisted || []).concat(current || []).forEach(function (s) {
      if (!s || !s.id) return;
      var prev = map[s.id];
      if (!prev) { map[s.id] = s; return; }
      var pa = prev.answers ? Object.keys(prev.answers).length : 0;
      var sa = s.answers ? Object.keys(s.answers).length : 0;
      if (sa > pa || timestamp(s.endedAt) > timestamp(prev.endedAt)) map[s.id] = s;
    });
    return Object.keys(map).map(function (id) { return map[id]; })
      .sort(function (a, b) { return timestamp(b.endedAt) - timestamp(a.endedAt); })
      .slice(0, 100);
  }
  function mergeActivity(current, persisted) {
    var out = Object.assign({}, persisted || {});
    Object.keys(current || {}).forEach(function (day) {
      var a = current[day] || {};
      var b = out[day] || {};
      out[day] = {
        sheetViews: Math.max(Number(a.sheetViews) || 0, Number(b.sheetViews) || 0),
        sheetCompletions: Math.max(Number(a.sheetCompletions) || 0, Number(b.sheetCompletions) || 0),
        cardReviews: Math.max(Number(a.cardReviews) || 0, Number(b.cardReviews) || 0),
        correct: Math.max(Number(a.correct) || 0, Number(b.correct) || 0),
        wrong: Math.max(Number(a.wrong) || 0, Number(b.wrong) || 0),
        seconds: Math.max(Number(a.seconds) || 0, Number(b.seconds) || 0)
      };
    });
    return out;
  }
  function mergeHistory(current, persisted) {
    var map = {};
    (persisted || []).concat(current || []).forEach(function (h) {
      if (!h) return;
      var key = (h.type || "") + "|" + (h.id || "") + "|" + (h.at || "");
      map[key] = h;
    });
    return Object.keys(map).map(function (k) { return map[k]; })
      .sort(function (a, b) { return timestamp(b.at) - timestamp(a.at); })
      .slice(0, 60);
  }
  function mergeLast(current, persisted) {
    var out = Object.assign({}, persisted || {}, current || {});
    ["dashboard", "flashcards"].forEach(function (key) {
      var a = current && current[key];
      var b = persisted && persisted[key];
      if (!a) { out[key] = b || null; return; }
      if (!b) { out[key] = a; return; }
      out[key] = timestamp(b.at) > timestamp(a.at) ? b : a;
    });
    return out;
  }
  function mergeStates(current, persisted) {
    var merged = normalize(current);
    var old = normalize(persisted);
    merged.createdAt = timestamp(old.createdAt) && timestamp(old.createdAt) < timestamp(merged.createdAt) ? old.createdAt : merged.createdAt;
    merged.sheets = Object.assign({}, old.sheets, merged.sheets);
    merged.cards = mergeCardMaps(merged.cards, old.cards);
    merged.sessions = mergeSessions(merged.sessions, old.sessions);
    merged.activity = mergeActivity(merged.activity, old.activity);
    merged.history = mergeHistory(merged.history, old.history);
    merged.last = mergeLast(merged.last, old.last);
    merged.goals = Object.assign({}, old.goals, merged.goals);
    if (merged.flashSession && old.flashSession) {
      merged.flashSession = timestamp(old.flashSession.updatedAt) > timestamp(merged.flashSession.updatedAt)
        ? old.flashSession : merged.flashSession;
    } else if (!merged.flashSession && old.flashSession) {
      if (timestamp(old.updatedAt) > timestamp(merged.updatedAt)) merged.flashSession = old.flashSession;
    }
    return merged;
  }
  function sheetById(id) { return content().sheets.find(function (s) { return s.id === id; }) || null; }
  function topicById(id) { return content().topics.find(function (t) { return t.id === id; }) || null; }
  function areaById(id) { return content().areas.find(function (a) { return a.id === id; }) || null; }
  function cardById(id) { return content().cards.find(function (c) { return c.id === id; }) || null; }
  function sourceById(id) { return content().sources.find(function (s) { return s.id === id; }) || null; }

  function ensureSheet(sheetId) {
    if (!state.sheets[sheetId]) {
      state.sheets[sheetId] = {
        views: 0, viewedAt: null, lastOpenedAt: null, completedAt: null,
        favorite: false, scroll: 0, readSeconds: 0
      };
    }
    return state.sheets[sheetId];
  }
  function activityFor(key) {
    if (!state.activity[key]) {
      state.activity[key] = { sheetViews: 0, sheetCompletions: 0, cardReviews: 0, correct: 0, wrong: 0, seconds: 0 };
    }
    return state.activity[key];
  }
  function touchActivity() {
    var a = activityFor(dayKey());
    return a;
  }
  function pushHistory(entry) {
    var last = state.history[0];
    if (last && last.type === entry.type && last.id === entry.id) {
      var dt = (parseDate(last.at) || new Date(0)).getTime();
      if (Date.now() - dt < 5 * 60 * 1000) return;
    }
    state.history.unshift(entry);
    state.history = state.history.slice(0, 60);
  }
  function appUrl(folder, params) {
    try {
      var u = new URL(window.location.href);
      var marker = "/" + folder + "/";
      var idx = u.pathname.indexOf(marker);
      var path;
      if (idx >= 0) path = u.pathname.slice(0, idx + 1) + folder + "/index.html";
      else path = u.pathname.replace(/[^/]*$/, "") + folder + "/index.html";
      u.pathname = path;
      u.search = "";
      u.hash = "";
      Object.keys(params || {}).forEach(function (k) {
        if (params[k] !== undefined && params[k] !== null && params[k] !== "") u.searchParams.set(k, params[k]);
      });
      return u.href;
    } catch (e) { return ""; }
  }
  function lastDashboardUrl(sheetId, topicId) {
    return appUrl("study-dashboard", { sheet: sheetId, topic: topicId || "" });
  }
  function lastFlashcardsUrl(deckId, resume) {
    return appUrl("study-flashcards", { deck: deckId || "", resume: resume ? "1" : "" });
  }

  function recordSheetView(sheetId, topicId, meta) {
    var sheet = sheetById(sheetId);
    if (!sheet) return null;
    var st = ensureSheet(sheetId);
    var first = !st.viewedAt;
    st.views = (st.views || 0) + 1;
    st.viewedAt = st.viewedAt || nowISO();
    st.lastOpenedAt = nowISO();
    st.topicId = topicId || sheet.topicId;
    var topic = topicById(st.topicId);
    var area = topic ? areaById(topic.areaId) : null;
    var activity = touchActivity();
    activity.sheetViews += 1;
    pushHistory({
      type: "sheet", id: sheetId, title: sheet.title, topicId: sheet.topicId,
      areaId: sheet.areaId, at: nowISO()
    });
    state.last.dashboard = {
      sheetId: sheetId,
      topicId: sheet.topicId,
      title: sheet.title,
      context: topic ? topic.title : (area ? area.title : ""),
      at: nowISO(),
      url: lastDashboardUrl(sheetId, sheet.topicId)
    };
    if (first && meta && meta.seconds) activity.seconds += Math.max(0, meta.seconds);
    save();
    return st;
  }
  function recordSheetTime(sheetId, seconds) {
    var secs = Math.max(0, Math.round(seconds || 0));
    if (secs < 3) return;
    var st = ensureSheet(sheetId);
    st.readSeconds = (st.readSeconds || 0) + secs;
    touchActivity().seconds += secs;
    save();
  }
  function setSheetScroll(sheetId, ratio) {
    var st = ensureSheet(sheetId);
    st.scroll = Math.max(0, Math.min(1, Number(ratio) || 0));
    save();
  }
  function toggleSheetComplete(sheetId) {
    var sheet = sheetById(sheetId);
    if (!sheet) return null;
    var st = ensureSheet(sheetId);
    var active = !st.completedAt;
    if (active) {
      st.completedAt = nowISO();
      touchActivity().sheetCompletions += 1;
      pushHistory({
        type: "sheet-complete", id: sheetId, title: sheet.title, topicId: sheet.topicId,
        areaId: sheet.areaId, at: nowISO()
      });
    } else {
      st.completedAt = null;
    }
    save();
    return active;
  }
  function toggleFavorite(sheetId) {
    var st = ensureSheet(sheetId);
    st.favorite = !st.favorite;
    save();
    return st.favorite;
  }
  function setDailyGoal(value) {
    var n = Math.max(1, Math.min(20, Math.round(Number(value) || 2)));
    state.goals.dailySheets = n;
    save();
    return n;
  }
  function reviewSchedule(currentBox, rating) {
    var box = Number(currentBox) || 0;
    var due;
    if (rating === "again") {
      box = 0;
      due = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    } else if (rating === "hard") {
      box = Math.max(1, box);
      due = addDays(1);
    } else if (rating === "easy") {
      box = Math.min(5, box + 2);
      due = addDays(INTERVALS[box] || 30);
    } else {
      box = Math.min(5, box + 1);
      due = addDays(INTERVALS[box] || 15);
    }
    return { box: box, dueAt: due };
  }
  function applyReview(cardId, rating, meta) {
    var card = cardById(cardId);
    if (!card) return null;
    var prev = state.cards[cardId] || {
      box: 0, reviews: 0, correct: 0, wrong: 0, lapses: 0,
      lastReviewAt: null, lastResult: null, dueAt: null
    };
    var next = reviewSchedule(prev.box, rating);
    var correct = meta && typeof meta.correct === "boolean" ? meta.correct : rating !== "again";
    var st = {
      box: next.box,
      dueAt: next.dueAt,
      lastReviewAt: nowISO(),
      lastResult: rating,
      reviews: (prev.reviews || 0) + 1,
      correct: (prev.correct || 0) + (correct ? 1 : 0),
      wrong: (prev.wrong || 0) + (correct ? 0 : 1),
      lapses: (prev.lapses || 0) + (rating === "again" ? 1 : 0)
    };
    state.cards[cardId] = st;
    var activity = touchActivity();
    activity.cardReviews += 1;
    if (correct) activity.correct += 1;
    else activity.wrong += 1;
    var topic = topicById(card.topicId);
    state.last.flashcards = {
      deckId: card.topicId,
      topicId: card.topicId,
      title: topic ? topic.title : card.prompt,
      at: nowISO(),
      url: lastFlashcardsUrl(card.topicId)
    };
    return st;
  }
  function recordReview(cardId, rating, meta) {
    var st = applyReview(cardId, rating, meta);
    save();
    return st;
  }
  function touchDeck(deckId) {
    var topic = topicById(deckId);
    if (!topic) return null;
    state.last.flashcards = {
      deckId: deckId,
      topicId: deckId,
      title: topic.title,
      at: nowISO(),
      url: lastFlashcardsUrl(deckId)
    };
    save();
    return state.last.flashcards;
  }
  function startSession(mode, deckId, cardIds) {
    var topic = topicById(deckId);
    state.flashSession = {
      id: "session-" + Date.now(),
      mode: mode,
      deckId: deckId,
      queue: (cardIds || []).slice(),
      index: 0,
      answers: {},
      correct: 0,
      wrong: 0,
      status: "active",
      startedAt: nowISO(),
      updatedAt: nowISO()
    };
    if (topic) {
      state.last.flashcards = {
        deckId: deckId, topicId: deckId, title: topic.title,
        at: nowISO(), url: lastFlashcardsUrl(deckId, true)
      };
    }
    save();
    return state.flashSession;
  }
  function getFlashSession(deckId) {
    var s = state.flashSession;
    if (!s) return null;
    if (deckId && s.deckId !== deckId) return null;
    return s;
  }
  function updateFlashSession(patch) {
    if (!state.flashSession) return null;
    Object.assign(state.flashSession, patch || {});
    state.flashSession.updatedAt = nowISO();
    save();
    return state.flashSession;
  }
  function recordSessionAnswer(cardId, payload) {
    var session = state.flashSession;
    if (!session) return null;
    var first = !session.answers[cardId];
    var correct = !!(payload && payload.correct);
    var rating = (payload && payload.rating) || (correct ? "good" : "again");
    if (first) {
      session.answers[cardId] = {
        correct: correct,
        rating: rating,
        selected: payload ? payload.selected : null,
        at: nowISO()
      };
      if (correct) session.correct += 1;
      else session.wrong += 1;
    }
    applyReview(cardId, rating, { correct: correct });
    session.updatedAt = nowISO();
    save();
    return session;
  }
  function finishSession() {
    var s = state.flashSession;
    if (!s) return null;
    var total = s.correct + s.wrong;
    if (!total) {
      state.flashSession = null;
      state.updatedAt = nowISO();
      save();
      return null;
    }
    var endedAt = nowISO();
    var summary = {
      id: s.id, mode: s.mode, deckId: s.deckId, startedAt: s.startedAt, endedAt: endedAt,
      total: total, correct: s.correct, wrong: s.wrong,
      accuracy: total ? Math.round((s.correct / total) * 100) : 0,
      cardIds: s.queue.slice(), answers: clone(s.answers)
    };
    state.sessions.unshift(summary);
    state.sessions = state.sessions.slice(0, 100);
    var topic = topicById(s.deckId);
    pushHistory({
      type: "session", id: s.id, title: (topic ? topic.title : "Sesión") + " · " + total + " tarjetas",
      topicId: s.deckId, at: endedAt
    });
    state.last.flashcards = {
      deckId: s.deckId, topicId: s.deckId, title: topic ? topic.title : "Sesión de flashcards",
      at: endedAt, url: lastFlashcardsUrl(s.deckId, true)
    };
    state.flashSession = null;
    state.updatedAt = nowISO();
    save();
    return summary;
  }
  function abandonSession() {
    state.flashSession = null;
    state.updatedAt = nowISO();
    save();
  }

  function reviewedCardIds() {
    return Object.keys(state.cards).filter(function (id) { return state.cards[id].reviews > 0; });
  }
  function isDue(cardId) {
    var c = state.cards[cardId];
    if (!c) return true;
    if (!c.dueAt) return true;
    var d = parseDate(c.dueAt);
    return !d || d.getTime() <= Date.now();
  }
  function getDueCards(deckId) {
    return content().cards.filter(function (c) {
      return (!deckId || c.topicId === deckId) && isDue(c.id);
    });
  }
  function getErrorCards(deckId) {
    return content().cards.filter(function (c) {
      if (deckId && c.topicId !== deckId) return false;
      var st = state.cards[c.id];
      return st && (st.lastResult === "again" || st.lapses > 0);
    });
  }
  function getDeckStats(deckId) {
    var cards = content().cards.filter(function (c) { return c.topicId === deckId; });
    var reviewed = 0, mastered = 0, due = 0, errors = 0, lastReviewAt = null;
    cards.forEach(function (c) {
      var st = state.cards[c.id];
      if (st && st.reviews > 0) {
        reviewed += 1;
        if ((st.box || 0) >= 4) mastered += 1;
        if (isDue(c.id)) due += 1;
        if (st.lastResult === "again" || st.lapses > 0) errors += 1;
        if (st.lastReviewAt && (!lastReviewAt || st.lastReviewAt > lastReviewAt)) lastReviewAt = st.lastReviewAt;
      }
    });
    return {
      deckId: deckId, total: cards.length, reviewed: reviewed, mastered: mastered,
      due: due, newCards: cards.length - reviewed, errors: errors,
      percent: cards.length ? Math.round((mastered / cards.length) * 100) : 0,
      reviewedPercent: cards.length ? Math.round((reviewed / cards.length) * 100) : 0,
      lastReviewAt: lastReviewAt
    };
  }
  function getTopicProgress(topicId) {
    var topic = topicById(topicId);
    if (!topic) return null;
    var sheets = content().sheets.filter(function (s) { return s.topicId === topicId; });
    var viewed = 0, completed = 0;
    sheets.forEach(function (s) {
      var st = state.sheets[s.id];
      if (st && st.viewedAt) viewed += 1;
      if (st && st.completedAt) completed += 1;
    });
    var decks = getDeckStats(topicId);
    return {
      topicId: topicId, total: sheets.length, viewed: viewed, completed: completed,
      percent: sheets.length ? Math.round((completed / sheets.length) * 100) : 0,
      deck: decks
    };
  }
  function getDashboardStats() {
    var sheets = content().sheets;
    var completed = 0, viewed = 0, favorites = 0;
    sheets.forEach(function (s) {
      var st = state.sheets[s.id];
      if (st && st.completedAt) completed += 1;
      if (st && st.viewedAt) viewed += 1;
      if (st && st.favorite) favorites += 1;
    });
    var startedTopics = content().topics.filter(function (t) {
      return content().sheets.some(function (s) {
        return s.topicId === t.id && state.sheets[s.id] && state.sheets[s.id].viewedAt;
      }) || content().cards.some(function (c) {
        return c.topicId === t.id && state.cards[c.id] && state.cards[c.id].reviews > 0;
      });
    }).length;
    var completedTopics = content().topics.filter(function (t) {
      var topicSheets = content().sheets.filter(function (s) { return s.topicId === t.id; });
      return topicSheets.length > 0 && topicSheets.every(function (s) {
        return state.sheets[s.id] && state.sheets[s.id].completedAt;
      });
    }).length;
    var reviewed = 0, mastered = 0, due = 0;
    content().cards.forEach(function (c) {
      var st = state.cards[c.id];
      if (st && st.reviews > 0) {
        reviewed += 1;
        if ((st.box || 0) >= 4) mastered += 1;
        if (isDue(c.id)) due += 1;
      }
    });
    var a = state.activity[dayKey()] || {};
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    var streak = 0;
    var cursor = new Date();
    var todayHas = !!(a.sheetViews || a.sheetCompletions || a.cardReviews);
    if (!todayHas) cursor.setDate(cursor.getDate() - 1);
    for (var i = 0; i < 365; i++) {
      var k = dayKey(cursor);
      var x = state.activity[k] || {};
      if (x.sheetViews || x.sheetCompletions || x.cardReviews) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else break;
    }
    return {
      totalSheets: sheets.length,
      completedSheets: completed,
      viewedSheets: viewed,
      favorites: favorites,
      startedTopics: startedTopics,
      totalTopics: content().topics.length,
      completedTopics: completedTopics,
      totalCards: content().cards.length,
      reviewedCards: reviewed,
      masteredCards: mastered,
      dueCards: due,
      newCards: content().cards.length - reviewed,
      percent: sheets.length ? Math.round((completed / sheets.length) * 100) : 0,
      today: {
        sheetsViewed: a.sheetViews || 0,
        sheetsCompleted: a.sheetCompletions || 0,
        cardReviews: a.cardReviews || 0,
        correct: a.correct || 0,
        wrong: a.wrong || 0,
        seconds: a.seconds || 0
      },
      goal: state.goals.dailySheets,
      goalPercent: Math.min(100, Math.round(((a.sheetCompletions || 0) / state.goals.dailySheets) * 100)),
      streak: streak,
      hasActivity: completed > 0 || viewed > 0 || reviewed > 0,
      lastSheet: state.last.dashboard || null,
      lastDeck: state.last.flashcards || null
    };
  }
  function getRecommendations() {
    var stats = getDashboardStats();
    var recs = [];
    var due = getDueCards().filter(function (c) { return state.cards[c.id] && state.cards[c.id].reviews > 0; });
    if (due.length > 0) {
      recs.push({
        kind: "flashcards", mode: "quick", deckId: due[0].topicId,
        title: "Repaso pendiente",
        text: "Hay " + due.length + " tarjeta" + (due.length === 1 ? "" : "s") + " para repasar hoy.",
        action: "Repasar ahora"
      });
    }
    var started = content().topics.filter(function (t) {
      var p = getTopicProgress(t.id);
      return p && p.viewed > 0 && p.completed < p.total;
    });
    started.forEach(function (t) {
      var pending = content().sheets.filter(function (s) {
        return s.topicId === t.id && !(state.sheets[s.id] && state.sheets[s.id].completedAt);
      })[0];
      if (pending && recs.length < 3) {
        recs.push({
          kind: "sheet", sheetId: pending.id, topicId: t.id,
          title: "Retoma " + t.title,
          text: "Te falta completar " + pending.title + ".",
          action: "Abrir ficha"
        });
      }
    });
    var unstarted = content().topics.filter(function (t) {
      var p = getTopicProgress(t.id);
      return p && p.viewed === 0;
    });
    if (unstarted.length && recs.length < 3) {
      var first = unstarted[0];
      var sheet = content().sheets.filter(function (s) { return s.topicId === first.id; })[0];
      if (sheet) {
        recs.push({
          kind: "sheet", sheetId: sheet.id, topicId: first.id,
          title: "Empieza por " + first.title,
          text: "Una primera ficha de " + (sheet.minutes || 6) + " minutos para abrir el tema.",
          action: "Empezar"
        });
      }
    }
    var errors = getErrorCards();
    if (errors.length && recs.length < 3) {
      recs.push({
        kind: "flashcards", mode: "errors", deckId: errors[0].topicId,
        title: "Refuerza tus errores",
        text: "Tienes " + errors.length + " tarjeta" + (errors.length === 1 ? "" : "s") + " con errores previos.",
        action: "Practicar"
      });
    }
    if (!recs.length) {
      recs.push({
        kind: "flashcards", mode: "free", deckId: content().topics[0] ? content().topics[0].id : "",
        title: "Cierra el círculo",
        text: "Convierte lo leído en recuperación activa con una sesión corta.",
        action: "Abrir flashcards"
      });
    }
    return recs.slice(0, 3);
  }
  function getHistory(limit) {
    return state.history.slice(0, limit || 12);
  }
  function getStreak() { return getDashboardStats().streak; }
  function getSnapshot() { return readSnapshot(); }
  function writeSnapshot() {
    if (!state) return null;
    var stats = getDashboardStats();
    var snapshot = {
      version: VERSION,
      contentVersion: content().version || "",
      updatedAt: nowISO(),
      hasActivity: stats.hasActivity,
      dashboard: {
        totalSheets: stats.totalSheets,
        completedSheets: stats.completedSheets,
        viewedSheets: stats.viewedSheets,
        startedTopics: stats.startedTopics,
        completedTopics: stats.completedTopics,
        percent: stats.percent,
        last: stats.lastSheet,
        todayCompleted: stats.today.sheetsCompleted,
        goal: stats.goal,
        streak: stats.streak
      },
      flashcards: {
        totalCards: stats.totalCards,
        reviewedCards: stats.reviewedCards,
        masteredCards: stats.masteredCards,
        dueCards: stats.dueCards,
        newCards: stats.newCards,
        percent: stats.totalCards ? Math.round((stats.masteredCards / stats.totalCards) * 100) : 0,
        last: stats.lastDeck,
        todayReviews: stats.today.cardReviews
      }
    };
    try { localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot)); } catch (e) {}
    return snapshot;
  }
  function getState() { return state; }
  function isReady() { return ready; }
  function subscribe(fn) {
    if (typeof fn !== "function") return function () {};
    listeners.push(fn);
    return function () { listeners = listeners.filter(function (x) { return x !== fn; }); };
  }
  function reset() {
    state = defaultState();
    saveFresh();
  }

  window.StudyStore = {
    init: init,
    getState: getState,
    isReady: isReady,
    subscribe: subscribe,
    getSnapshot: getSnapshot,
    getMode: function () { return storageMode; },
    getSheet: sheetById,
    getTopic: topicById,
    getArea: areaById,
    getCard: cardById,
    getSource: sourceById,
    getSheetState: function (id) { return state.sheets[id] || null; },
    getCardState: function (id) { return state.cards[id] || null; },
    recordSheetView: recordSheetView,
    recordSheetTime: recordSheetTime,
    setSheetScroll: setSheetScroll,
    toggleSheetComplete: toggleSheetComplete,
    toggleFavorite: toggleFavorite,
    setDailyGoal: setDailyGoal,
    recordReview: recordReview,
    touchDeck: touchDeck,
    startSession: startSession,
    getFlashSession: getFlashSession,
    updateFlashSession: updateFlashSession,
    recordSessionAnswer: recordSessionAnswer,
    finishSession: finishSession,
    abandonSession: abandonSession,
    getDueCards: getDueCards,
    getErrorCards: getErrorCards,
    getDeckStats: getDeckStats,
    getTopicProgress: getTopicProgress,
    getDashboardStats: getDashboardStats,
    getRecommendations: getRecommendations,
    getHistory: getHistory,
    getStreak: getStreak,
    reset: reset,
    urls: { appUrl: appUrl, dashboard: lastDashboardUrl, flashcards: lastFlashcardsUrl }
  };
})();
