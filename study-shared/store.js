/* SERUMS STUDY — almacén compartido
   IndexedDB (estado completo) + localStorage (respaldo y snapshot para el HUB).
   No toca las claves de BANQUEO ni de PLAZAS SERUMS.

   Esquema v2 (Study Dashboard 2.3, Fase 0):
   - Conserva intacta la clave `study-state-v1`, la base `study-serums` v1 y toda
     la API anterior que usa Study Flashcards.
   - Añade colecciones con tombstones y protección `resetAt` frente a la
     resurrección de progreso después de un borrado total.

   Fase 1 (lectura activa, sin cambio de esquema):
   - `annotations.list({areaId})` resuelve el área desde `STUDY_CONTENT`
     (fichas/temas, con o sin taxonomy.js) sin escribir el área en el registro.
   - `recall.add/remove` emiten `recall:changed` `{sheetId, id, rating}` por DOM
     y por `StudyApp.events`, como el resto de eventos v2.
   - La fusión entre pestañas se omite solo cuando el estado persistido es
     exactamente la última escritura de esta pestaña (sello updatedAt+longitud);
     así el alto volumen no penaliza cada mutación. Si otra pestaña escribió,
     la fusión completa sigue ejecutándose.
   © 2026 ZARCONT */
(function () {
  "use strict";

  var DB_NAME = "study-serums";
  var DB_VERSION = 1;
  var STORE_NAME = "state";
  var STATE_KEY = "main";
  var LS_KEY = "study-state-v1";
  var SNAPSHOT_KEY = "studyhub:snapshot:v1";
  var BACKUP_META_KEY = "study-backup-meta-v1";
  var PRE_CLEAR_KEY = "study-backup-preclear-v1";
  var PRE_IMPORT_KEY = "study-backup-preimport-v1";
  var SCHEMA_VERSION = 2;
  var APP_VERSION = "2.3.0";
  var EXPORT_FORMAT = "serums-study-progress";
  var MAX_IMPORT_BYTES = 12 * 1024 * 1024;
  var INTERVALS = [0, 1, 2, 4, 7, 15, 30];
  /* Aplicaciones hermanas servidas desde una raíz común. El enlace entre apps
     se construye desde el prefijo anterior a este segmento, no desde el
     directorio actual (que en `/study-dashboard/index.html` es la propia app). */
  var APP_SEGMENTS = ["study-dashboard", "study-flashcards", "serums-quest"];
  var EPOCH = "1970-01-01T00:00:00.000Z";
  var COLORS = ["important", "understand", "review", "doubt"];
  var CONFIDENCE_VALUES = ["solid", "partial", "weak"];
  var RATINGS = ["again", "hard", "good", "easy", "skipped"];
  var REVIEW_SOURCES = ["confidence", "spaced"];
  var CARD_SOURCES = ["annotation", "manual"];
  var RECORD_LIMITS = {
    annotations: 20000,
    doubts: 20000,
    sheetConfidence: 5000,
    sheetReview: 5000,
    recall: 50000,
    userCards: 20000,
    weekly: 2000,
    factsKnown: 50000
  };

  var state = null;
  var db = null;
  var ready = false;
  var initPromise = null;
  var storageMode = "local";
  var listeners = [];
  /* Sello de la última escritura propia: `updatedAt` + `resetAt` + longitud del
     JSON guardado. Solo sirve para saltar una fusión que no aportaría nada. */
  var lastWrite = null;

  function content() { return window.STUDY_CONTENT || { version: "", sheets: [], cards: [], topics: [], areas: [], sources: [] }; }
  function nowISO() { return new Date().toISOString(); }
  function clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
  function isPlainObject(v) { return !!v && typeof v === "object" && !Array.isArray(v); }
  function isDangerousKey(key) { return key === "__proto__" || key === "constructor" || key === "prototype"; }
  function safeMap(raw) {
    if (!isPlainObject(raw)) return {};
    var out = {};
    Object.keys(raw).forEach(function (key) {
      if (isDangerousKey(key)) return;
      out[key] = raw[key];
    });
    return out;
  }
  function hasOwn(o, k) { return Object.prototype.hasOwnProperty.call(o || {}, k); }
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
  function isoOrNull(value) {
    var d = parseDate(value);
    return d ? d.toISOString() : null;
  }
  function timestamp(value) {
    var d = parseDate(value);
    return d ? d.getTime() : 0;
  }
  function text(value, max) {
    if (value == null) return "";
    return String(value).replace(/\s+/g, " ").trim().slice(0, max || 2000);
  }
  function rawText(value, max) {
    if (value == null) return "";
    return String(value).trim().slice(0, max || 4000);
  }
  function dayString(value) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return null;
    var d = new Date(String(value) + "T00:00:00Z");
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10) === String(value) ? String(value) : null;
  }
  function intValue(value, min, max) {
    var n = Number(value);
    if (!isFinite(n)) return null;
    n = Math.floor(n);
    if (n < min || n > max) return null;
    return n;
  }
  function byteLength(str) {
    try {
      if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(str).length;
      return unescape(encodeURIComponent(str)).length;
    } catch (e) { return String(str).length; }
  }
  function uid(prefix) {
    uid.counter = (uid.counter || 0) + 1;
    return prefix + Date.now().toString(36) + "-" + uid.counter.toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }
  function isoWeek(dateStr) {
    var d = new Date(String(dateStr) + "T00:00:00Z");
    var target = new Date(d.valueOf());
    var dayNr = (d.getUTCDay() + 6) % 7;
    target.setUTCDate(target.getUTCDate() - dayNr + 3);
    var firstThursday = target.valueOf();
    target.setUTCMonth(0, 1);
    if (target.getUTCDay() !== 4) target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
    var week = 1 + Math.ceil((firstThursday - target) / 604800000);
    return target.getUTCFullYear() + "-W" + String(week).padStart(2, "0");
  }
  function emptyCollection() { return {}; }
  function defaultGoals() { return { dailySheets: 2 }; }
  function defaultState() {
    return {
      version: SCHEMA_VERSION,
      schemaVersion: SCHEMA_VERSION,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      resetAt: null,
      /* Legado v1: mismo significado, mismas cajas de repaso. */
      sheets: {},
      cards: {},
      sessions: [],
      activity: {},
      goals: defaultGoals(),
      history: [],
      last: {},
      flashSession: null,
      /* Colecciones v2. Mapas por id con tombstones. */
      annotations: {},
      doubts: {},
      sheetConfidence: {},
      sheetReview: {},
      recall: {},
      userCards: {},
      plan: null,
      weekly: {},
      factsKnown: {}
    };
  }

  /* ------------------------------------------------------------------ */
  /* Normalización del estado (migración aditiva)                        */
  /* ------------------------------------------------------------------ */

  function loadInt(value, def, min, max) {
    var n = Number(value);
    if (!isFinite(n)) return def;
    n = Math.floor(n);
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }
  function safeText(value, max) {
    if (value == null) return "";
    return String(value).trim().slice(0, max || 2000);
  }
  function normalizeAnnotation(raw, key) {
    if (!isPlainObject(raw)) return null;
    var id = text(raw.id, 140) || text(key, 140);
    var sheetId = text(raw.sheetId, 140);
    var quote = rawText(raw.quote, 4000);
    if (!id || !sheetId || !quote) return null;
    var createdAt = isoOrNull(raw.createdAt) || isoOrNull(raw.updatedAt) || EPOCH;
    return {
      id: id,
      sheetId: sheetId,
      sectionIndex: loadInt(raw.sectionIndex, 0, 0, 100000),
      sectionTitle: safeText(raw.sectionTitle, 300),
      paragraphIndex: loadInt(raw.paragraphIndex, 0, 0, 100000),
      color: COLORS.indexOf(raw.color) >= 0 ? raw.color : "important",
      quote: quote,
      prefix: safeText(raw.prefix, 300),
      suffix: safeText(raw.suffix, 300),
      note: safeText(raw.note, 2000),
      createdAt: createdAt,
      updatedAt: isoOrNull(raw.updatedAt) || createdAt,
      deleted: raw.deleted === true
    };
  }
  function normalizeDoubt(raw, key) {
    if (!isPlainObject(raw)) return null;
    var id = text(raw.id, 140) || text(key, 140);
    var sheetId = text(raw.sheetId, 140);
    var quote = rawText(raw.quote, 4000);
    if (!id || !sheetId || !quote) return null;
    var createdAt = isoOrNull(raw.createdAt) || isoOrNull(raw.updatedAt) || EPOCH;
    return {
      id: id,
      sheetId: sheetId,
      sectionIndex: loadInt(raw.sectionIndex, 0, 0, 100000),
      paragraphIndex: loadInt(raw.paragraphIndex, 0, 0, 100000),
      quote: quote,
      note: safeText(raw.note, 2000),
      annotationId: raw.annotationId ? text(raw.annotationId, 140) : null,
      resolvedAt: isoOrNull(raw.resolvedAt),
      createdAt: createdAt,
      updatedAt: isoOrNull(raw.updatedAt) || createdAt,
      deleted: raw.deleted === true
    };
  }
  function normalizeConfidence(raw, key) {
    if (!isPlainObject(raw)) return null;
    var sheetId = text(raw.sheetId, 140) || text(raw.id, 140) || text(key, 140);
    if (!sheetId || CONFIDENCE_VALUES.indexOf(raw.value) < 0) return null;
    var createdAt = isoOrNull(raw.createdAt) || isoOrNull(raw.updatedAt) || EPOCH;
    return {
      id: sheetId,
      sheetId: sheetId,
      value: raw.value,
      createdAt: createdAt,
      updatedAt: isoOrNull(raw.updatedAt) || createdAt,
      deleted: raw.deleted === true
    };
  }
  function normalizeReview(raw, key) {
    if (!isPlainObject(raw)) return null;
    var sheetId = text(raw.sheetId, 140) || text(key, 140).replace(/^review-/, "");
    var dueAt = isoOrNull(raw.dueAt);
    if (!sheetId || !dueAt) return null;
    var createdAt = isoOrNull(raw.createdAt) || isoOrNull(raw.updatedAt) || EPOCH;
    return {
      id: "review-" + sheetId,
      sheetId: sheetId,
      dueAt: dueAt,
      intervalDays: Math.max(0, loadInt(raw.intervalDays, 1, 0, 3650)),
      lastReviewedAt: isoOrNull(raw.lastReviewedAt),
      source: REVIEW_SOURCES.indexOf(raw.source) >= 0 ? raw.source : "confidence",
      createdAt: createdAt,
      updatedAt: isoOrNull(raw.updatedAt) || createdAt,
      deleted: raw.deleted === true
    };
  }
  function normalizeRecall(raw, key) {
    if (!isPlainObject(raw)) return null;
    var id = text(raw.id, 140) || text(key, 140);
    var sheetId = text(raw.sheetId, 140);
    var question = rawText(raw.question, 2000);
    var answer = rawText(raw.answer, 4000);
    if (!id || !sheetId || !question || !answer) return null;
    var createdAt = isoOrNull(raw.createdAt) || isoOrNull(raw.updatedAt) || EPOCH;
    return {
      id: id,
      sheetId: sheetId,
      cardId: safeText(raw.cardId, 140),
      sectionIndex: loadInt(raw.sectionIndex, 0, 0, 100000),
      question: question,
      answer: answer,
      rating: RATINGS.indexOf(raw.rating) >= 0 ? raw.rating : "skipped",
      createdAt: createdAt,
      updatedAt: isoOrNull(raw.updatedAt) || createdAt,
      deleted: raw.deleted === true
    };
  }
  function normalizeUserCard(raw, key) {
    if (!isPlainObject(raw)) return null;
    var id = text(raw.id, 140) || text(key, 140);
    var sheetId = text(raw.sheetId, 140);
    var front = rawText(raw.front, 2000);
    var back = rawText(raw.back, 4000);
    if (!id || !sheetId || !front || !back) return null;
    var createdAt = isoOrNull(raw.createdAt) || isoOrNull(raw.updatedAt) || EPOCH;
    return {
      id: id,
      sheetId: sheetId,
      front: front,
      back: back,
      source: CARD_SOURCES.indexOf(raw.source) >= 0 ? raw.source : "manual",
      annotationId: raw.annotationId ? text(raw.annotationId, 140) : null,
      createdAt: createdAt,
      updatedAt: isoOrNull(raw.updatedAt) || createdAt,
      deleted: raw.deleted === true
    };
  }
  /* Áreas con prioridad declarada en el plan. Solo se conservan pares
     {areaId: número finito > 0}; las claves vacías, peligrosas o con valores
     inválidos se ignoran sin romper el guardado (contrato Fase 2 §5). */
  function sanitizeAreaPriority(value) {
    var out = {};
    if (!isPlainObject(value)) return out;
    Object.keys(value).forEach(function (key) {
      if (isDangerousKey(key)) return;
      var areaId = text(key, 140);
      if (!areaId) return;
      var number = value[key];
      if (typeof number !== "number" || !isFinite(number) || number <= 0) return;
      out[areaId] = number;
    });
    return out;
  }
  function normalizePlan(raw) {
    if (!isPlainObject(raw)) return null;
    var createdAt = isoOrNull(raw.createdAt) || isoOrNull(raw.updatedAt) || EPOCH;
    var examDate = raw.examDate == null || raw.examDate === "" ? null : dayString(raw.examDate);
    if (raw.examDate != null && raw.examDate !== "" && !examDate) return null;
    return {
      id: "plan",
      examDate: examDate,
      minutesPerDay: loadInt(raw.minutesPerDay, 45, 0, 1440),
      daysPerWeek: loadInt(raw.daysPerWeek, 5, 1, 7),
      areaPriority: sanitizeAreaPriority(raw.areaPriority),
      createdAt: createdAt,
      updatedAt: isoOrNull(raw.updatedAt) || createdAt,
      deleted: raw.deleted === true
    };
  }
  function normalizeWeekly(raw, key) {
    if (!isPlainObject(raw)) return null;
    var weekStart = dayString(raw.weekStart);
    if (!weekStart) return null;
    var createdAt = isoOrNull(raw.createdAt) || isoOrNull(raw.updatedAt) || EPOCH;
    var record = {
      id: isoWeek(weekStart),
      weekStart: weekStart,
      createdAt: createdAt,
      updatedAt: isoOrNull(raw.updatedAt) || createdAt,
      deleted: raw.deleted === true
    };
    Object.keys(raw).forEach(function (k) {
      if (k === "id" || k === "weekStart" || k === "createdAt" || k === "updatedAt" || k === "deleted") return;
      if (isDangerousKey(k)) return;
      try { record[k] = clone(raw[k]); } catch (e) {}
    });
    return record;
  }
  function normalizeFactKnown(raw, key) {
    if (!isPlainObject(raw)) return null;
    var factId = text(raw.factId, 200) || text(raw.id, 200) || text(key, 200);
    if (!factId) return null;
    var createdAt = isoOrNull(raw.createdAt) || isoOrNull(raw.updatedAt) || EPOCH;
    return {
      id: factId,
      factId: factId,
      known: raw.known === true,
      createdAt: createdAt,
      updatedAt: isoOrNull(raw.updatedAt) || createdAt,
      deleted: raw.deleted === true
    };
  }
  function normalizeMap(raw, normalizer) {
    if (!isPlainObject(raw)) return emptyCollection();
    var out = {};
    Object.keys(raw).forEach(function (key) {
      if (isDangerousKey(key)) return;
      var record = normalizer(raw[key], key);
      if (record && record.id && !isDangerousKey(record.id)) out[record.id] = record;
    });
    return out;
  }
  function normalize(raw) {
    var base = defaultState();
    var s = isPlainObject(raw) ? raw : {};
    base.createdAt = isoOrNull(s.createdAt) || base.createdAt;
    base.updatedAt = isoOrNull(s.updatedAt) || base.updatedAt;
    base.resetAt = isoOrNull(s.resetAt);
    base.sheets = safeMap(s.sheets);
    base.cards = safeMap(s.cards);
    base.sessions = (Array.isArray(s.sessions) ? s.sessions : []).filter(function (x) {
      return x && (Number(x.total) > 0 || (Number(x.correct) || 0) + (Number(x.wrong) || 0) > 0);
    });
    base.activity = safeMap(s.activity);
    base.goals = Object.assign(defaultGoals(), safeMap(s.goals));
    base.history = (Array.isArray(s.history) ? s.history : []).filter(function (h) {
      return !(h && h.type === "session" && / · 0 tarjetas$/.test(h.title || ""));
    });
    base.last = safeMap(s.last);
    base.flashSession = isPlainObject(s.flashSession) ? s.flashSession : null;
    base.annotations = normalizeMap(s.annotations, normalizeAnnotation);
    base.doubts = normalizeMap(s.doubts, normalizeDoubt);
    base.sheetConfidence = normalizeMap(s.sheetConfidence, normalizeConfidence);
    base.sheetReview = normalizeMap(s.sheetReview, normalizeReview);
    base.recall = normalizeMap(s.recall, normalizeRecall);
    base.userCards = normalizeMap(s.userCards, normalizeUserCard);
    base.plan = isPlainObject(s.plan) ? normalizePlan(s.plan) : null;
    base.weekly = normalizeMap(s.weekly, normalizeWeekly);
    base.factsKnown = normalizeMap(s.factsKnown, normalizeFactKnown);
    base.version = SCHEMA_VERSION;
    base.schemaVersion = SCHEMA_VERSION;
    return base;
  }

  /* ------------------------------------------------------------------ */
  /* Persistencia y sincronización                                       */
  /* ------------------------------------------------------------------ */

  function readLocal() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }
  function readLocalRaw() {
    try { return localStorage.getItem(LS_KEY); } catch (e) { return null; }
  }
  function readSnapshot() {
    try {
      var raw = localStorage.getItem(SNAPSHOT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function pickNewer(a, b) {
    if (!a) return b;
    if (!b) return a;
    /* Un borrado total más reciente manda sobre cualquier estado de otra pestaña. */
    var ra = timestamp(a.resetAt);
    var rb = timestamp(b.resetAt);
    if (ra !== rb) return rb > ra ? b : a;
    var da = timestamp(a.updatedAt);
    var dbb = timestamp(b.updatedAt);
    return dbb > da ? b : a;
  }
  /* Verdadero solo si el JSON persistido es el que esta pestaña acaba de
     escribir: nadie ha tocado `study-state-v1` desde entonces. La fusión
     completa normaliza dos veces el estado, así que se evita cuando es inútil. */
  function isOwnLastWrite(persisted, raw) {
    if (!lastWrite || !persisted || typeof raw !== "string") return false;
    if (persisted.updatedAt !== lastWrite.updatedAt) return false;
    if ((persisted.resetAt || null) !== lastWrite.resetAt) return false;
    return raw.length === lastWrite.length;
  }
  function syncFromStorage(raw) {
    if (!state) return state;
    var incoming = raw !== undefined ? raw : readLocal();
    if (!incoming) return state;
    var chosen = pickNewer(state, incoming);
    if (!chosen || chosen === state) return state;
    state = normalize(chosen);
    notify("sync");
    return state;
  }
  function watchStorage() {
    if (!window || watchStorage.done) return;
    watchStorage.done = true;
    window.addEventListener("storage", function (e) {
      if (e.key !== LS_KEY || !e.newValue) return;
      try { syncFromStorage(JSON.parse(e.newValue)); } catch (err) {}
    });
    if (document && document.addEventListener) {
      document.addEventListener("visibilitychange", function () {
        if (!document.hidden) syncFromStorage();
      });
    }
    /* Vuelta desde la caché de retroceso (bfcache) o desde otra app: el estado en
       memoria puede ser anterior a lo que otra pestaña ya guardó. */
    window.addEventListener("pageshow", function () { syncFromStorage(); });
  }
  function dispatch(name, detail) {
    try {
      if (typeof CustomEvent === "undefined") return;
      window.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
    } catch (e) {}
  }
  function notify(change) {
    var payload = { state: state, snapshot: readSnapshot(), change: change || null };
    listeners.slice().forEach(function (fn) {
      try { fn(payload); } catch (e) { console.warn("StudyStore listener", e); }
    });
    try {
      if (typeof CustomEvent !== "undefined") {
        window.dispatchEvent(new CustomEvent("study:change", { detail: payload }));
        window.dispatchEvent(new CustomEvent("store:change", { detail: { change: change || null } }));
      }
    } catch (e) {}
  }
  function emit(name, detail) {
    /* Doble canal: DOM (para quien escuche window) y el bus de StudyApp si ya
       está disponible. app.js traduce por su cuenta `store:change`. */
    try {
      if (window.StudyApp && window.StudyApp.events && typeof window.StudyApp.events.emit === "function") {
        window.StudyApp.events.emit(name, detail || {});
      }
    } catch (e) {}
    dispatch(name, detail);
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
    notify("init");
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
  function writeState(change, merge) {
    if (!state) return state;
    if (merge) {
      var rawPersisted = readLocalRaw();
      if (rawPersisted) {
        var persisted = null;
        try { persisted = JSON.parse(rawPersisted); } catch (e) { persisted = null; }
        if (persisted && !isOwnLastWrite(persisted, rawPersisted)) {
          try { state = mergeStates(state, persisted); } catch (e) { console.warn("StudyStore merge", e); }
        }
      }
    }
    state.version = SCHEMA_VERSION;
    state.schemaVersion = SCHEMA_VERSION;
    state.updatedAt = nowISO();
    var serialized = null;
    try { serialized = JSON.stringify(state); } catch (e) { serialized = null; }
    if (serialized !== null) {
      var stored = false;
      try { localStorage.setItem(LS_KEY, serialized); stored = true; } catch (e) {}
      if (stored) {
        lastWrite = { updatedAt: state.updatedAt, resetAt: state.resetAt || null, length: serialized.length };
      }
    }
    writeSnapshot();
    if (db) idbPut(clone(state)).then(function (ok) { if (!ok) storageMode = "local"; });
    notify(change);
    return state;
  }
  function save(change) { return writeState(change, true); }
  function saveFresh(change) { return writeState(change, false); }

  /* ------------------------------------------------------------------ */
  /* Fusión entre pestañas: legado + tombstones + resetAt               */
  /* ------------------------------------------------------------------ */

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
    function collect(list, base) {
      (list || []).forEach(function (h, index) {
        if (!h) return;
        /* H13: la misma ficha o sesión se guarda una sola vez; la más reciente gana. */
        var key = (h.type || "") + "|" + (h.id || ("at:" + (h.at || "")));
        var priority = base + ((list || []).length - index);
        var prev = map[key];
        if (!prev) { map[key] = { h: h, priority: priority }; return; }
        var diff = timestamp(h.at) - timestamp(prev.h.at);
        if (diff > 0 || (diff === 0 && priority >= prev.priority)) {
          map[key] = { h: h, priority: priority };
        }
      });
    }
    /* `current` es el estado que se acaba de escribir: gana los empates y, si dos
       vistas caen en el mismo milisegundo, conserva el orden nuevo (índice bajo). */
    collect(persisted, 0);
    collect(current, 100000);
    return Object.keys(map).map(function (k) { return map[k]; })
      .sort(function (a, b) {
        var diff = timestamp(b.h.at) - timestamp(a.h.at);
        return diff || (b.priority - a.priority);
      })
      .slice(0, 60)
      .map(function (x) { return x.h; });
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
  /* Un tombstone nunca pierde: aunque un estado antiguo conserve la versión viva
     del registro, la fusión no la resucita. */
  function mergeRecord(a, b) {
    if (!a) return b;
    if (!b) return a;
    var ad = a.deleted === true;
    var bd = b.deleted === true;
    if (ad || bd) {
      if (ad && bd) return timestamp(a.updatedAt) >= timestamp(b.updatedAt) ? a : b;
      return ad ? a : b;
    }
    var ta = timestamp(a.updatedAt);
    var tb = timestamp(b.updatedAt);
    if (ta === tb) return a;
    return ta > tb ? a : b;
  }
  function mergeMap(a, b) {
    var out = Object.assign({}, b || {});
    Object.keys(a || {}).forEach(function (id) {
      out[id] = mergeRecord(a[id], out[id]);
    });
    return out;
  }
  function mergePlan(a, b) {
    if (!a) return b;
    if (!b) return a;
    return mergeRecord(a, b);
  }
  function mergeSameReset(current, persisted) {
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
    merged.annotations = mergeMap(merged.annotations, old.annotations);
    merged.doubts = mergeMap(merged.doubts, old.doubts);
    merged.sheetConfidence = mergeMap(merged.sheetConfidence, old.sheetConfidence);
    merged.sheetReview = mergeMap(merged.sheetReview, old.sheetReview);
    merged.recall = mergeMap(merged.recall, old.recall);
    merged.userCards = mergeMap(merged.userCards, old.userCards);
    merged.plan = mergePlan(merged.plan, old.plan);
    merged.weekly = mergeMap(merged.weekly, old.weekly);
    merged.factsKnown = mergeMap(merged.factsKnown, old.factsKnown);
    merged.resetAt = pickNewer(merged, old).resetAt;
    merged.version = SCHEMA_VERSION;
    merged.schemaVersion = SCHEMA_VERSION;
    return merged;
  }
  /* De un estado anterior al borrado total solo sobrevive lo que se escribió
     después del sello resetAt: el progreso previo no puede resucitar. */
  function stateAfterBoundary(s, boundary) {
    var out = defaultState();
    out.createdAt = s.createdAt;
    out.updatedAt = s.updatedAt;
    out.resetAt = s.resetAt;
    ["annotations", "doubts", "sheetConfidence", "sheetReview", "recall", "userCards", "weekly", "factsKnown"].forEach(function (key) {
      out[key] = {};
      Object.keys(s[key] || {}).forEach(function (id) {
        var record = s[key][id];
        if (record && timestamp(record.updatedAt) > boundary) out[key][id] = record;
      });
    });
    if (s.plan && !s.plan.deleted && timestamp(s.plan.updatedAt) > boundary) out.plan = s.plan;
    return out;
  }
  function mergeStates(current, persisted) {
    var a = normalize(current);
    var b = normalize(persisted);
    var ra = timestamp(a.resetAt);
    var rb = timestamp(b.resetAt);
    if (ra === rb) return mergeSameReset(a, b);
    var boundary = Math.max(ra, rb);
    var high = ra > rb ? a : b;
    var low = ra > rb ? b : a;
    var filtered = stateAfterBoundary(low, boundary);
    var merged = mergeSameReset(high, filtered);
    merged.resetAt = high.resetAt;
    merged.version = SCHEMA_VERSION;
    merged.schemaVersion = SCHEMA_VERSION;
    return merged;
  }

  /* ------------------------------------------------------------------ */
  /* Contenido y helpers legados                                        */
  /* ------------------------------------------------------------------ */

  function sheetById(id) { return content().sheets.find(function (s) { return s.id === id; }) || null; }
  function topicById(id) { return content().topics.find(function (t) { return t.id === id; }) || null; }
  function areaById(id) { return content().areas.find(function (a) { return a.id === id; }) || null; }
  function cardById(id) { return content().cards.find(function (c) { return c.id === id; }) || null; }
  function sourceById(id) { return content().sources.find(function (s) { return s.id === id; }) || null; }

  /* ------------------------------------------------------------------ */
  /* Índice de fichas por área (solo lectura, no toca los registros)     */
  /* ------------------------------------------------------------------ */

  var areaIndexCache = { key: null, map: {} };
  /* Clave barata que cambia si el contenido se recarga o si taxonomy.js
     enriquece las fichas después de la primera consulta. */
  function areaIndexKey() {
    var c = content();
    var sheets = c.sheets || [];
    var enriched = 0;
    for (var i = 0; i < sheets.length; i += 1) if (sheets[i] && sheets[i].primaryAreaId) enriched += 1;
    return [c.version || "", sheets.length, enriched,
      (c.areas || []).length, (c.categories || []).length].join("|");
  }
  /* Una ficha puede responder a varias áreas: la heredada (area-aps), la
     primaria oficial (area-psi-*) y las del tema. Así el filtro acepta el id
     que use la vista, sin migrar ni reescribir anotaciones. */
  function sheetAreaIds(sheet) {
    var ids = {};
    function add(id) {
      if (!id || isDangerousKey(String(id))) return;
      ids[String(id)] = true;
    }
    add(sheet.primaryAreaId);
    add(sheet.legacyAreaId);
    add(sheet.areaId);
    var topics = content().topics || [];
    var topic = sheet.topicId ? topics.filter(function (t) { return t && t.id === sheet.topicId; })[0] : null;
    if (topic) {
      add(topic.primaryAreaId);
      add(topic.legacyAreaId);
      add(topic.areaId);
    }
    return Object.keys(ids);
  }
  function sheetIdsByArea() {
    var key = areaIndexKey();
    if (areaIndexCache.key === key) return areaIndexCache.map;
    var map = {};
    (content().sheets || []).forEach(function (sheet) {
      if (!sheet || !sheet.id || isDangerousKey(String(sheet.id))) return;
      sheetAreaIds(sheet).forEach(function (areaId) {
        if (!hasOwn(map, areaId)) map[areaId] = {};
        map[areaId][sheet.id] = true;
      });
    });
    areaIndexCache = { key: key, map: map };
    return map;
  }

  function deckKind(deckId) {
    if (!deckId) return { kind: "all", sheet: null, topic: null };
    var sheet = sheetById(deckId);
    if (sheet) return { kind: "sheet", sheet: sheet, topic: topicById(sheet.topicId) };
    var topic = topicById(deckId);
    if (topic) return { kind: "topic", sheet: null, topic: topic };
    console.warn("StudyStore: mazo no encontrado", deckId);
    return { kind: "missing", sheet: null, topic: null };
  }
  function cardsForDeck(deckId) {
    var deck = deckKind(deckId);
    if (deck.kind === "all") return content().cards.slice();
    if (deck.kind === "missing") return [];
    return content().cards.filter(function (c) {
      return deck.kind === "sheet" ? c.sheetId === deckId : c.topicId === deckId;
    });
  }
  function deckTitle(deck) {
    if (deck.kind === "sheet") return deck.sheet.title;
    if (deck.kind === "topic") return deck.topic.title;
    return "Sesión de flashcards";
  }
  function deckTopicId(deck) {
    if (deck.kind === "sheet") return deck.sheet.topicId;
    if (deck.kind === "topic") return deck.topic.id;
    return "";
  }
  function cardDeckId(card) {
    if (!card) return "";
    var sheet = sheetById(card.sheetId);
    if (sheet) return sheet.id;
    var topic = topicById(card.topicId);
    return topic ? topic.id : "";
  }

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
  /* H13: el historial no duplica la misma ficha o sesión. Al volver a verla, la
     entrada anterior se retira y la nueva sube al principio; el tope sigue en 60. */
  function pushHistory(entry) {
    state.history = state.history.filter(function (item) {
      return !(item && item.type === entry.type && item.id === entry.id);
    });
    state.history.unshift(entry);
    state.history = state.history.slice(0, 60);
  }
  /* Raíz común de las apps. Si el pathname contiene un segmento de app
     conocido, la raíz es todo su prefijo; si no, el directorio actual.
     Ejemplos: `/study-dashboard/index.html` → `/`,
     `/prefix/study-dashboard/index.html` → `/prefix/`, `/` → `/`. */
  function appRoot(pathname) {
    var path = String(pathname || "/");
    var parts = path.split("/");
    for (var i = 1; i < parts.length; i++) {
      if (APP_SEGMENTS.indexOf(parts[i]) >= 0) {
        return parts.slice(0, i).join("/") + "/";
      }
    }
    var dir = path.replace(/[^/]*$/, "");
    return dir || "/";
  }
  function appUrl(folder, params) {
    try {
      var u = new URL(window.location.href);
      u.pathname = appRoot(u.pathname) + folder + "/index.html";
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
    save("sheet");
    return st;
  }
  function recordSheetTime(sheetId, seconds) {
    var secs = Math.max(0, Math.round(seconds || 0));
    if (secs < 3) return;
    var st = ensureSheet(sheetId);
    st.readSeconds = (st.readSeconds || 0) + secs;
    touchActivity().seconds += secs;
    save("sheet");
  }
  function setSheetScroll(sheetId, ratio) {
    var st = ensureSheet(sheetId);
    var next = Math.max(0, Math.min(1, Number(ratio) || 0));
    var previous = Number(st.scroll) || 0;
    /* Abrir una ficha que no se reanuda deja el scroll en 0; ese 0 no debe borrar
       la posición de lectura ya guardada. Solo se conserva la posición cuando la
       lectura previa era significativa. */
    if (next === 0 && previous > 0.05) return previous;
    st.scroll = next;
    save("sheet");
    return next;
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
    save("sheet");
    return active;
  }
  function toggleFavorite(sheetId) {
    var st = ensureSheet(sheetId);
    st.favorite = !st.favorite;
    save("sheet");
    return st.favorite;
  }
  function setDailyGoal(value) {
    var n = Math.max(1, Math.min(20, Math.round(Number(value) || 2)));
    state.goals.dailySheets = n;
    save("goal");
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
  /* «Último mazo» para el HUB y para `?deck=&resume=1`. Mientras hay una sesión
     activa manda su mazo: responder una tarjeta no debe cambiar el contexto que
     se usa para reanudar (antes se guardaba el tema de la tarjeta y la reanudación
     apuntaba a otro mazo, donde no existía sesión). */
  function rememberDeckContext(card) {
    var active = state.flashSession;
    var activeDeck = active && active.deckId ? deckKind(active.deckId) : null;
    if (activeDeck && activeDeck.kind !== "missing") {
      state.last.flashcards = {
        deckId: active.deckId,
        topicId: deckTopicId(activeDeck),
        sheetId: activeDeck.kind === "sheet" ? activeDeck.sheet.id : "",
        title: deckTitle(activeDeck),
        at: nowISO(),
        url: lastFlashcardsUrl(active.deckId, true)
      };
      return state.last.flashcards;
    }
    var topic = topicById(card.topicId);
    state.last.flashcards = {
      deckId: card.topicId,
      topicId: card.topicId,
      sheetId: card.sheetId || "",
      title: topic ? topic.title : card.prompt,
      at: nowISO(),
      url: lastFlashcardsUrl(card.topicId)
    };
    return state.last.flashcards;
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
    rememberDeckContext(card);
    return st;
  }
  function recordReview(cardId, rating, meta) {
    var st = applyReview(cardId, rating, meta);
    save("card");
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
    save("deck");
    return state.last.flashcards;
  }
  function startSession(mode, deckId, cardIds) {
    var deck = deckKind(deckId);
    if (deck.kind === "missing") return null;
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
    if (deck.kind === "sheet" || deck.kind === "topic") {
      state.last.flashcards = {
        deckId: deckId,
        topicId: deckTopicId(deck),
        sheetId: deck.kind === "sheet" ? deck.sheet.id : "",
        title: deckTitle(deck),
        at: nowISO(), url: lastFlashcardsUrl(deckId, true)
      };
    }
    save("session");
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
    save("session");
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
    save("session");
    return session;
  }
  function finishSession() {
    var s = state.flashSession;
    if (!s) return null;
    var total = s.correct + s.wrong;
    if (!total) {
      state.flashSession = null;
      state.updatedAt = nowISO();
      save("session");
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
    var deck = deckKind(s.deckId);
    pushHistory({
      type: "session", id: s.id, title: deckTitle(deck) + " · " + total + " tarjetas",
      topicId: deckTopicId(deck), sheetId: deck.kind === "sheet" ? deck.sheet.id : "", at: endedAt
    });
    state.last.flashcards = {
      deckId: s.deckId, topicId: deckTopicId(deck), sheetId: deck.kind === "sheet" ? deck.sheet.id : "",
      title: deckTitle(deck),
      at: endedAt, url: lastFlashcardsUrl(s.deckId, true)
    };
    state.flashSession = null;
    state.updatedAt = nowISO();
    save("session");
    return summary;
  }
  function abandonSession() {
    state.flashSession = null;
    state.updatedAt = nowISO();
    save("session");
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
    return cardsForDeck(deckId).filter(function (c) {
      return isDue(c.id);
    });
  }
  function getErrorCards(deckId) {
    return cardsForDeck(deckId).filter(function (c) {
      var st = state.cards[c.id];
      return st && (st.lastResult === "again" || st.lapses > 0);
    });
  }
  function getDeckStats(deckId) {
    var cards = cardsForDeck(deckId);
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
      if (t.isContainer) return false;
      return content().sheets.some(function (s) {
        return s.topicId === t.id && state.sheets[s.id] && state.sheets[s.id].viewedAt;
      }) || content().cards.some(function (c) {
        return c.topicId === t.id && state.cards[c.id] && state.cards[c.id].reviews > 0;
      });
    }).length;
    var completedTopics = content().topics.filter(function (t) {
      if (t.isContainer) return false;
      var topicSheets = content().sheets.filter(function (s) { return s.topicId === t.id; });
      return topicSheets.length > 0 && topicSheets.every(function (s) {
        return state.sheets[s.id] && state.sheets[s.id].completedAt;
      });
    }).length;
    var officialSheets = content().sheets.filter(function (s) {
      var topic = content().topicById ? content().topicById[s.topicId] : null;
      return !!(topic && topic.isContainer);
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
      totalTopics: content().topics.filter(function (t) { return !t.isContainer; }).length,
      completedTopics: completedTopics,
      totalOfficialSheets: officialSheets,
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
      var dueDeck = cardDeckId(due[0]);
      if (dueDeck) recs.push({
        kind: "flashcards", mode: "quick", deckId: dueDeck,
        title: "Repaso pendiente",
        text: "Hay " + due.length + " tarjeta" + (due.length === 1 ? "" : "s") + " para repasar hoy.",
        action: "Repasar ahora"
      });
    }
    var started = content().topics.filter(function (t) {
      if (t.isContainer) return false;
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
      if (t.isContainer) return false;
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
      var errorDeck = cardDeckId(errors[0]);
      if (errorDeck) recs.push({
        kind: "flashcards", mode: "errors", deckId: errorDeck,
        title: "Refuerza tus errores",
        text: "Tienes " + errors.length + " tarjeta" + (errors.length === 1 ? "" : "s") + " con errores previos.",
        action: "Practicar"
      });
    }
    if (!recs.length) {
      var firstSheet = content().sheets[0];
      recs.push({
        kind: "flashcards", mode: "free", deckId: firstSheet ? firstSheet.id : "",
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
      /* El snapshot del HUB conserva su formato v1: el HUB no debe notar la
         migración interna del estado a v2. */
      version: 1,
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

  /* ------------------------------------------------------------------ */
  /* Colecciones v2: constructores de mutación                           */
  /* ------------------------------------------------------------------ */

  function ensureState() {
    if (!state) state = normalize(readLocal());
    return state;
  }
  function liveRecord(map, id) {
    var record = map[id];
    return record && record.deleted !== true ? record : null;
  }
  function listRecords(map, opts, filter) {
    var out = [];
    var includeDeleted = !!(opts && opts.includeDeleted);
    Object.keys(map || {}).forEach(function (id) {
      var record = map[id];
      if (!record) return;
      if (!includeDeleted && record.deleted === true) return;
      if (filter && !filter(record)) return;
      out.push(record);
    });
    out.sort(function (a, b) {
      var d = timestamp(b.updatedAt) - timestamp(a.updatedAt);
      if (d) return d;
      return String(a.id) < String(b.id) ? -1 : 1;
    });
    return out.map(clone);
  }
  function copyRecord(record) { return record ? clone(record) : null; }
  function applyText(rec, src, key, max, required) {
    if (!hasOwn(src, key)) return true;
    var value = rawText(src[key], max);
    if (!value && required) return false;
    rec[key] = value;
    return true;
  }
  function applyInt(rec, src, key, min, max) {
    if (!hasOwn(src, key)) return true;
    var value = intValue(src[key], min, max);
    if (value === null) return false;
    rec[key] = value;
    return true;
  }
  function applyEnum(rec, src, key, allowed, required) {
    if (!hasOwn(src, key)) return !required;
    if (allowed.indexOf(src[key]) < 0) return false;
    rec[key] = src[key];
    return true;
  }
  function buildAnnotation(src, existing) {
    var rec = existing ? clone(existing) : { id: uid("ann-"), createdAt: nowISO(), deleted: false };
    src = src || {};
    if (!applyText(rec, src, "sheetId", 140, true)) return null;
    if (!applyText(rec, src, "quote", 4000, true)) return null;
    if (!applyText(rec, src, "sectionTitle", 300, false)) return null;
    if (!applyText(rec, src, "prefix", 300, false)) return null;
    if (!applyText(rec, src, "suffix", 300, false)) return null;
    if (!applyText(rec, src, "note", 2000, false)) return null;
    if (!applyInt(rec, src, "sectionIndex", 0, 100000)) return null;
    if (!applyInt(rec, src, "paragraphIndex", 0, 100000)) return null;
    if (!applyEnum(rec, src, "color", COLORS, false)) return null;
    if (!rec.sheetId || !rec.quote) return null;
    if (existing) {
      rec.id = existing.id;
      rec.createdAt = existing.createdAt;
      rec.deleted = false;
    } else {
      if (!hasOwn(src, "color")) rec.color = "important";
      if (!hasOwn(src, "sectionIndex")) rec.sectionIndex = 0;
      if (!hasOwn(src, "paragraphIndex")) rec.paragraphIndex = 0;
      if (!hasOwn(src, "sectionTitle")) rec.sectionTitle = "";
      if (!hasOwn(src, "prefix")) rec.prefix = "";
      if (!hasOwn(src, "suffix")) rec.suffix = "";
      if (!hasOwn(src, "note")) rec.note = "";
    }
    rec.updatedAt = nowISO();
    return rec;
  }
  function buildDoubt(src, existing) {
    var rec = existing ? clone(existing) : {
      id: uid("doubt-"), createdAt: nowISO(), deleted: false,
      resolvedAt: null, annotationId: null, note: ""
    };
    src = src || {};
    if (!applyText(rec, src, "sheetId", 140, true)) return null;
    if (!applyText(rec, src, "quote", 4000, true)) return null;
    if (!applyText(rec, src, "note", 2000, false)) return null;
    if (!applyInt(rec, src, "sectionIndex", 0, 100000)) return null;
    if (!applyInt(rec, src, "paragraphIndex", 0, 100000)) return null;
    if (hasOwn(src, "annotationId")) rec.annotationId = src.annotationId ? text(src.annotationId, 140) : null;
    if (!rec.sheetId || !rec.quote) return null;
    if (existing) {
      rec.id = existing.id;
      rec.createdAt = existing.createdAt;
      rec.deleted = false;
      rec.resolvedAt = existing.resolvedAt || null;
    } else {
      if (!hasOwn(src, "sectionIndex")) rec.sectionIndex = 0;
      if (!hasOwn(src, "paragraphIndex")) rec.paragraphIndex = 0;
    }
    rec.updatedAt = nowISO();
    return rec;
  }
  function buildRecall(src) {
    var rec = { id: uid("recall-"), createdAt: nowISO(), updatedAt: nowISO(), deleted: false };
    src = src || {};
    if (!applyText(rec, src, "sheetId", 140, true)) return null;
    if (!applyText(rec, src, "question", 2000, true)) return null;
    if (!applyText(rec, src, "answer", 4000, true)) return null;
    if (!applyText(rec, src, "cardId", 140, false)) return null;
    if (!applyInt(rec, src, "sectionIndex", 0, 100000)) return null;
    if (!applyEnum(rec, src, "rating", RATINGS, false)) return null;
    if (!rec.sheetId || !rec.question || !rec.answer) return null;
    if (!hasOwn(src, "cardId")) rec.cardId = "";
    if (!hasOwn(src, "sectionIndex")) rec.sectionIndex = 0;
    if (!hasOwn(src, "rating")) rec.rating = "skipped";
    return rec;
  }
  function buildUserCard(src, existing) {
    var rec = existing ? clone(existing) : { id: uid("ucard-"), createdAt: nowISO(), deleted: false };
    src = src || {};
    if (!applyText(rec, src, "sheetId", 140, true)) return null;
    if (!applyText(rec, src, "front", 2000, true)) return null;
    if (!applyText(rec, src, "back", 4000, true)) return null;
    if (!applyEnum(rec, src, "source", CARD_SOURCES, false)) return null;
    if (hasOwn(src, "annotationId")) rec.annotationId = src.annotationId ? text(src.annotationId, 140) : null;
    if (!rec.sheetId || !rec.front || !rec.back) return null;
    if (existing) {
      rec.id = existing.id;
      rec.createdAt = existing.createdAt;
      rec.deleted = false;
    } else {
      if (!hasOwn(src, "source")) rec.source = "manual";
      if (!hasOwn(src, "annotationId")) rec.annotationId = null;
    }
    rec.updatedAt = nowISO();
    return rec;
  }
  function buildPlan(src, existing) {
    var prev = existing && existing.deleted !== true ? existing : null;
    var rec = {
      id: "plan",
      examDate: prev ? prev.examDate : null,
      minutesPerDay: prev ? prev.minutesPerDay : 45,
      daysPerWeek: prev ? prev.daysPerWeek : 5,
      areaPriority: prev ? sanitizeAreaPriority(prev.areaPriority) : {},
      createdAt: prev ? prev.createdAt : nowISO(),
      updatedAt: nowISO(),
      deleted: false
    };
    src = src || {};
    if (hasOwn(src, "areaPriority") && src.areaPriority !== undefined) {
      if (!isPlainObject(src.areaPriority)) return null;
      rec.areaPriority = sanitizeAreaPriority(src.areaPriority);
    }
    if (hasOwn(src, "examDate")) {
      if (src.examDate == null || src.examDate === "") rec.examDate = null;
      else {
        var d = dayString(src.examDate);
        if (!d) return null;
        rec.examDate = d;
      }
    }
    if (hasOwn(src, "minutesPerDay")) {
      var m = intValue(src.minutesPerDay, 0, 1440);
      if (m === null) return null;
      rec.minutesPerDay = m;
    }
    if (hasOwn(src, "daysPerWeek")) {
      var w = intValue(src.daysPerWeek, 1, 7);
      if (w === null) return null;
      rec.daysPerWeek = w;
    }
    return rec;
  }
  function buildReview(schedule) {
    var s = schedule || {};
    var sheetId = text(s.sheetId, 140);
    var dueAt = isoOrNull(s.dueAt);
    if (!sheetId || !dueAt) return null;
    var id = "review-" + sheetId;
    var prev = state.sheetReview[id];
    var interval = hasOwn(s, "intervalDays") ? intValue(s.intervalDays, 0, 3650) : (prev ? prev.intervalDays : 1);
    if (interval === null) return null;
    var lastReviewedAt = null;
    if (hasOwn(s, "lastReviewedAt")) {
      lastReviewedAt = isoOrNull(s.lastReviewedAt);
      if (s.lastReviewedAt && !lastReviewedAt) return null;
    } else if (prev) {
      lastReviewedAt = prev.lastReviewedAt;
    }
    var source = hasOwn(s, "source") ? s.source : (prev ? prev.source : "confidence");
    if (REVIEW_SOURCES.indexOf(source) < 0) return null;
    return {
      id: id,
      sheetId: sheetId,
      dueAt: dueAt,
      intervalDays: interval,
      lastReviewedAt: lastReviewedAt,
      source: source,
      createdAt: prev ? prev.createdAt : nowISO(),
      updatedAt: nowISO(),
      deleted: false
    };
  }

  /* ------------------------------------------------------------------ */
  /* Respaldo previo y metadatos del recordatorio                        */
  /* ------------------------------------------------------------------ */

  function buildExport() {
    ensureState();
    return {
      format: EXPORT_FORMAT,
      schema: 2,
      app: "study-dashboard",
      appVersion: APP_VERSION,
      contentVersion: content().version || "",
      exportedAt: nowISO(),
      state: clone(state)
    };
  }
  function writeSafetyCopy(key) {
    if (!state) return false;
    try {
      localStorage.setItem(key, JSON.stringify(buildExport()));
      return true;
    } catch (e) {
      return false;
    }
  }
  function readBackupMeta() {
    var meta = { lastExportAt: null, snoozedAt: null };
    try {
      var raw = localStorage.getItem(BACKUP_META_KEY);
      var parsed = raw ? JSON.parse(raw) : null;
      if (isPlainObject(parsed)) {
        meta.lastExportAt = isoOrNull(parsed.lastExportAt);
        meta.snoozedAt = isoOrNull(parsed.snoozedAt);
      }
    } catch (e) {}
    return meta;
  }
  function writeBackupMeta(meta) {
    var payload = {
      lastExportAt: isoOrNull(meta && meta.lastExportAt),
      snoozedAt: isoOrNull(meta && meta.snoozedAt)
    };
    try { localStorage.setItem(BACKUP_META_KEY, JSON.stringify(payload)); return true; }
    catch (e) { return false; }
  }
  function hasRealActivity() {
    ensureState();
    if (Object.keys(state.sheets).some(function (id) {
      var s = state.sheets[id] || {};
      return !!(s.views || s.viewedAt || s.completedAt || s.favorite || Number(s.scroll) > 0 || Number(s.readSeconds) > 0);
    })) return true;
    if (Object.keys(state.cards).some(function (id) { return (Number(state.cards[id].reviews) || 0) > 0; })) return true;
    if (state.sessions.length > 0 || state.history.length > 0) return true;
    if (Object.keys(state.activity).some(function (day) {
      var a = state.activity[day] || {};
      return !!(Number(a.sheetViews) || Number(a.sheetCompletions) || Number(a.cardReviews) || Number(a.seconds));
    })) return true;
    var collections = ["annotations", "doubts", "userCards", "recall"];
    if (collections.some(function (key) {
      return Object.keys(state[key] || {}).some(function (id) { return state[key][id].deleted !== true; });
    })) return true;
    if (state.plan && state.plan.deleted !== true) return true;
    if (Object.keys(state.factsKnown || {}).some(function (id) {
      return state.factsKnown[id].known === true && state.factsKnown[id].deleted !== true;
    })) return true;
    return false;
  }

  /* ------------------------------------------------------------------ */
  /* Importación: validación estricta, sin mutaciones en la vista previa */
  /* ------------------------------------------------------------------ */

  function validateRecordShape(kind, id, record, errors) {
    var label = kind + " " + (id || "(sin id)");
    if (!isPlainObject(record)) { errors.push(label + ": el registro no es un objeto."); return; }
    if (record.id && record.id !== id) errors.push(label + ": el id no coincide con la clave del mapa.");
    if (typeof record.deleted !== "boolean") errors.push(label + ": falta deleted booleano.");
    if (!isoOrNull(record.createdAt)) errors.push(label + ": createdAt no es una fecha válida.");
    if (!isoOrNull(record.updatedAt)) errors.push(label + ": updatedAt no es una fecha válida.");
    if (kind === "annotation") {
      if (!text(record.sheetId, 140)) errors.push(label + ": falta sheetId.");
      if (!rawText(record.quote, 4000)) errors.push(label + ": falta quote.");
      if (COLORS.indexOf(record.color) < 0) errors.push(label + ": color no válido.");
      if (!hasOwn(record, "sectionIndex") || !hasOwn(record, "paragraphIndex")) errors.push(label + ": faltan índices de sección o párrafo.");
    } else if (kind === "doubt") {
      if (!text(record.sheetId, 140)) errors.push(label + ": falta sheetId.");
      if (!rawText(record.quote, 4000)) errors.push(label + ": falta quote.");
    } else if (kind === "confidence") {
      if (!text(record.sheetId, 140)) errors.push(label + ": falta sheetId.");
      if (CONFIDENCE_VALUES.indexOf(record.value) < 0) errors.push(label + ": confianza no válida.");
    } else if (kind === "review") {
      if (!text(record.sheetId, 140)) errors.push(label + ": falta sheetId.");
      if (!isoOrNull(record.dueAt)) errors.push(label + ": dueAt no es una fecha válida.");
      if (REVIEW_SOURCES.indexOf(record.source) < 0) errors.push(label + ": source no válido.");
    } else if (kind === "recall") {
      if (!text(record.sheetId, 140)) errors.push(label + ": falta sheetId.");
      if (!rawText(record.question, 2000) || !rawText(record.answer, 4000)) errors.push(label + ": faltan pregunta o respuesta.");
      if (RATINGS.indexOf(record.rating) < 0) errors.push(label + ": rating no válido.");
    } else if (kind === "userCard") {
      if (!text(record.sheetId, 140)) errors.push(label + ": falta sheetId.");
      if (!rawText(record.front, 2000) || !rawText(record.back, 4000)) errors.push(label + ": faltan frente o reverso.");
      if (CARD_SOURCES.indexOf(record.source) < 0) errors.push(label + ": source no válido.");
    } else if (kind === "weekly") {
      if (!dayString(record.weekStart)) errors.push(label + ": weekStart no es una fecha válida.");
    } else if (kind === "factKnown") {
      if (!text(record.factId, 200)) errors.push(label + ": falta factId.");
      if (typeof record.known !== "boolean") errors.push(label + ": known debe ser booleano.");
    }
  }
  function validateEnvelope(raw) {
    var errors = [];
    var warnings = [];
    var data = raw;
    var bytes = 0;
    try {
      if (typeof raw === "string") {
        bytes = byteLength(raw);
        if (bytes > MAX_IMPORT_BYTES) {
          return { ok: false, errors: ["El archivo supera el límite de 12 MB."], warnings: warnings, summary: emptySummary(), state: null, bytes: bytes };
        }
        try { data = JSON.parse(raw); }
        catch (e) { return { ok: false, errors: ["El archivo no contiene JSON válido."], warnings: warnings, summary: emptySummary(), state: null, bytes: bytes }; }
      } else if (isPlainObject(raw)) {
        try { bytes = byteLength(JSON.stringify(raw)); } catch (e) { bytes = 0; }
        if (bytes > MAX_IMPORT_BYTES) {
          return { ok: false, errors: ["El archivo supera el límite de 12 MB."], warnings: warnings, summary: emptySummary(), state: null, bytes: bytes };
        }
      } else {
        return { ok: false, errors: ["El archivo debe ser un objeto JSON."], warnings: warnings, summary: emptySummary(), state: null, bytes: 0 };
      }
    } catch (e) {
      return { ok: false, errors: ["No se pudo leer el archivo como JSON."], warnings: warnings, summary: emptySummary(), state: null, bytes: 0 };
    }
    if (!isPlainObject(data)) {
      return { ok: false, errors: ["El archivo debe contener un objeto JSON en la raíz."], warnings: warnings, summary: emptySummary(), state: null, bytes: bytes };
    }
    if (data.format !== EXPORT_FORMAT) errors.push("El archivo no es una copia de Study Dashboard (falta format: \"" + EXPORT_FORMAT + "\").");
    if (data.app !== "study-dashboard") errors.push("El archivo pertenece a otra aplicación (app no reconocida).");
    var schema = Number(data.schema);
    if (!isFinite(schema) || schema < 1) errors.push("Falta la versión de esquema del archivo.");
    else if (schema > 2) errors.push("El archivo usa un esquema más nuevo (" + schema + ") que esta versión de la app.");
    else if (schema < 2) warnings.push("El archivo usa el esquema " + schema + "; se migrará al importar.");
    if (data.exportedAt && !isoOrNull(data.exportedAt)) warnings.push("La fecha de exportación no es válida; se conservará el estado igualmente.");
    if (!data.state || !isPlainObject(data.state)) {
      errors.push("El archivo no contiene un estado (state) válido.");
      return { ok: false, errors: errors, warnings: warnings, summary: emptySummary(), state: null, bytes: bytes };
    }
    var sourceState = data.state;
    var version = Number(sourceState.version);
    if (!isFinite(version) || version < 1) errors.push("El estado no declara una versión válida.");
    else if (version > 2) errors.push("El estado usa una versión más nueva (" + version + ") que esta app.");
    else if (version < 2) warnings.push("El estado viene del esquema 1; se migrará sin pérdida.");
    if (sourceState.resetAt != null && !isoOrNull(sourceState.resetAt)) errors.push("resetAt no es una fecha válida.");
    ["sheets", "cards", "activity", "goals", "last"].forEach(function (key) {
      if (sourceState[key] != null && !isPlainObject(sourceState[key])) errors.push("El campo " + key + " debe ser un objeto.");
    });
    ["sessions", "history"].forEach(function (key) {
      if (sourceState[key] != null && !Array.isArray(sourceState[key])) errors.push("El campo " + key + " debe ser una lista.");
    });
    if (sourceState.flashSession != null && !isPlainObject(sourceState.flashSession)) errors.push("flashSession debe ser un objeto o null.");
    var mapKinds = [
      ["annotations", "annotation"], ["doubts", "doubt"], ["sheetConfidence", "confidence"],
      ["sheetReview", "review"], ["recall", "recall"], ["userCards", "userCard"],
      ["weekly", "weekly"], ["factsKnown", "factKnown"]
    ];
    mapKinds.forEach(function (pair) {
      var key = pair[0];
      var kind = pair[1];
      if (sourceState[key] == null) return;
      if (!isPlainObject(sourceState[key])) {
        errors.push("El campo " + key + " debe ser un mapa de registros.");
        return;
      }
      var ids = Object.keys(sourceState[key]);
      if (RECORD_LIMITS[key] && ids.length > RECORD_LIMITS[key]) {
        errors.push("La colección " + key + " supera el máximo de " + RECORD_LIMITS[key] + " registros.");
      }
      ids.forEach(function (id) {
        validateRecordShape(kind, id, sourceState[key][id], errors);
      });
    });
    if (sourceState.plan != null) {
      if (!isPlainObject(sourceState.plan)) errors.push("plan debe ser un objeto o null.");
      else {
        validateRecordShape("plan", "plan", sourceState.plan, errors);
        if (sourceState.plan.examDate != null && sourceState.plan.examDate !== "" && !dayString(sourceState.plan.examDate)) errors.push("plan: examDate no es una fecha válida.");
        var pm = Number(sourceState.plan.minutesPerDay);
        var pw = Number(sourceState.plan.daysPerWeek);
        if (!isFinite(pm) || pm < 0 || pm > 1440) errors.push("plan: minutesPerDay fuera de rango.");
        if (!isFinite(pw) || pw < 1 || pw > 7) errors.push("plan: daysPerWeek fuera de rango.");
        if (sourceState.plan.areaPriority != null) {
          if (!isPlainObject(sourceState.plan.areaPriority)) {
            errors.push("plan: areaPriority debe ser un objeto plano.");
          } else {
            Object.keys(sourceState.plan.areaPriority).forEach(function (key) {
              var value = sourceState.plan.areaPriority[key];
              if (isDangerousKey(key) || !text(key, 140)) {
                warnings.push("plan: se ignora la prioridad de área con clave no válida.");
              } else if (typeof value !== "number" || !isFinite(value) || value <= 0) {
                warnings.push("plan: se ignora la prioridad no positiva de «" + text(key, 140) + "».");
              }
            });
          }
        }
      }
    }
    var knownKeys = ["version", "schemaVersion", "createdAt", "updatedAt", "resetAt", "sheets", "cards", "sessions",
      "activity", "goals", "history", "last", "flashSession", "annotations", "doubts", "sheetConfidence",
      "sheetReview", "recall", "userCards", "plan", "weekly", "factsKnown"];
    Object.keys(sourceState).forEach(function (key) {
      if (knownKeys.indexOf(key) < 0) warnings.push("La clave desconocida «" + key + "» no se importará.");
    });
    if (data.contentVersion && content().version && data.contentVersion !== content().version) {
      warnings.push("El archivo se generó con el contenido " + data.contentVersion + " y la app usa " + content().version + ". Se conservarán todos los datos, pero las fichas nuevas o retiradas pueden no coincidir.");
    } else if (!data.contentVersion) {
      warnings.push("El archivo no indica la versión de contenido.");
    }
    var normalized = normalize(sourceState);
    var current = ensureState();
    if (timestamp(normalized.resetAt) < timestamp(current.resetAt)) {
      warnings.push("El archivo es anterior a un borrado total de este navegador. En modo Fusionar no se resucitará el progreso anterior al borrado.");
    }
    var unknownSheets = Object.keys(normalized.sheets).filter(function (id) { return !sheetById(id); });
    if (unknownSheets.length) {
      warnings.push(unknownSheets.length + " ficha" + (unknownSheets.length === 1 ? "" : "s") + " del archivo ya no existe" + (unknownSheets.length === 1 ? "" : "n") + " en el contenido actual; sus datos se conservan.");
    }
    return {
      ok: errors.length === 0,
      errors: errors.slice(0, 40),
      warnings: warnings.slice(0, 40),
      summary: summaryOf(normalized, data),
      state: normalized,
      bytes: bytes
    };
  }
  function emptySummary() {
    return {
      exportedAt: null, appVersion: null, contentVersion: null,
      sheets: 0, completedSheets: 0, favorites: 0, cardsReviewed: 0, sessions: 0,
      annotations: 0, doubts: 0, userCards: 0, recalls: 0, hasPlan: false, factsKnown: 0
    };
  }
  function summaryOf(st, envelope) {
    var env = envelope || {};
    var completed = 0, favorites = 0;
    Object.keys(st.sheets || {}).forEach(function (id) {
      var s = st.sheets[id] || {};
      if (s.completedAt) completed += 1;
      if (s.favorite) favorites += 1;
    });
    var cardsReviewed = 0;
    Object.keys(st.cards || {}).forEach(function (id) {
      if ((Number(st.cards[id].reviews) || 0) > 0) cardsReviewed += 1;
    });
    var factsKnown = 0;
    Object.keys(st.factsKnown || {}).forEach(function (id) {
      var r = st.factsKnown[id];
      if (r && r.deleted !== true && r.known === true) factsKnown += 1;
    });
    return {
      exportedAt: env.exportedAt || null,
      appVersion: env.appVersion || null,
      contentVersion: env.contentVersion || null,
      sheets: Object.keys(st.sheets || {}).length,
      completedSheets: completed,
      favorites: favorites,
      cardsReviewed: cardsReviewed,
      sessions: (st.sessions || []).length,
      annotations: listRecords(st.annotations, {}).length,
      doubts: listRecords(st.doubts, {}).length,
      userCards: listRecords(st.userCards, {}).length,
      recalls: listRecords(st.recall, {}).length,
      hasPlan: !!(st.plan && st.plan.deleted !== true),
      factsKnown: factsKnown
    };
  }
  function failure(check, mode, extra) {
    return Object.assign({
      ok: false,
      mode: mode,
      errors: check && check.errors ? check.errors : ["No se pudo importar el archivo."],
      warnings: check && check.warnings ? check.warnings : [],
      summary: check && check.summary ? check.summary : emptySummary(),
      safetyCopy: false
    }, extra || {});
  }

  /* ------------------------------------------------------------------ */
  /* API pública                                                        */
  /* ------------------------------------------------------------------ */

  function annotationsList(opts) {
    ensureState();
    opts = opts || {};
    var areaId = opts.areaId ? text(opts.areaId, 140) : "";
    var areaSheetIds = null;
    if (areaId) {
      var byArea = sheetIdsByArea();
      areaSheetIds = hasOwn(byArea, areaId) ? byArea[areaId] : null;
    }
    return listRecords(state.annotations, opts, function (record) {
      if (opts.sheetId && record.sheetId !== opts.sheetId) return false;
      if (opts.color && record.color !== opts.color) return false;
      if (areaId && !(areaSheetIds && hasOwn(areaSheetIds, record.sheetId))) return false;
      return true;
    });
  }
  function annotationAdd(data) {
    ensureState();
    var rec = buildAnnotation(data, null);
    if (!rec) return null;
    if (Object.keys(state.annotations).length >= RECORD_LIMITS.annotations) return null;
    state.annotations[rec.id] = rec;
    save("annotation");
    emit("annotation:changed", { id: rec.id, action: "add" });
    return copyRecord(rec);
  }
  function annotationUpdate(id, patch) {
    ensureState();
    var prev = liveRecord(state.annotations, id);
    if (!prev) return null;
    var rec = buildAnnotation(patch, prev);
    if (!rec) return null;
    state.annotations[rec.id] = rec;
    save("annotation");
    emit("annotation:changed", { id: rec.id, action: "update" });
    return copyRecord(rec);
  }
  function annotationRemove(id) {
    ensureState();
    var prev = liveRecord(state.annotations, id);
    if (!prev) return null;
    prev.deleted = true;
    prev.updatedAt = nowISO();
    save("annotation");
    emit("annotation:changed", { id: prev.id, action: "remove" });
    return copyRecord(prev);
  }

  function doubtsList(opts) {
    ensureState();
    opts = opts || {};
    return listRecords(state.doubts, opts, function (record) {
      if (opts.sheetId && record.sheetId !== opts.sheetId) return false;
      if (typeof opts.resolved === "boolean" && (!!record.resolvedAt) !== opts.resolved) return false;
      return true;
    });
  }
  function doubtAdd(data) {
    ensureState();
    var rec = buildDoubt(data, null);
    if (!rec) return null;
    if (Object.keys(state.doubts).length >= RECORD_LIMITS.doubts) return null;
    state.doubts[rec.id] = rec;
    save("doubt");
    emit("doubt:changed", { id: rec.id, action: "add" });
    return copyRecord(rec);
  }
  function doubtUpdate(id, patch) {
    ensureState();
    var prev = liveRecord(state.doubts, id);
    if (!prev) return null;
    var rec = buildDoubt(patch, prev);
    if (!rec) return null;
    state.doubts[rec.id] = rec;
    save("doubt");
    emit("doubt:changed", { id: rec.id, action: "update" });
    return copyRecord(rec);
  }
  function doubtResolve(id) {
    ensureState();
    var rec = liveRecord(state.doubts, id);
    if (!rec) return null;
    rec.resolvedAt = nowISO();
    rec.updatedAt = nowISO();
    save("doubt");
    emit("doubt:changed", { id: rec.id, action: "resolve" });
    return copyRecord(rec);
  }
  function doubtReopen(id) {
    ensureState();
    var rec = liveRecord(state.doubts, id);
    if (!rec) return null;
    rec.resolvedAt = null;
    rec.updatedAt = nowISO();
    save("doubt");
    emit("doubt:changed", { id: rec.id, action: "reopen" });
    return copyRecord(rec);
  }
  function doubtRemove(id) {
    ensureState();
    var prev = liveRecord(state.doubts, id);
    if (!prev) return null;
    prev.deleted = true;
    prev.updatedAt = nowISO();
    save("doubt");
    emit("doubt:changed", { id: prev.id, action: "remove" });
    return copyRecord(prev);
  }

  function confidenceGet(sheetId) {
    ensureState();
    var rec = state.sheetConfidence[sheetId];
    return rec && rec.deleted !== true ? copyRecord(rec) : null;
  }
  function confidenceSet(sheetId, value) {
    ensureState();
    var id = text(sheetId, 140);
    if (!id || CONFIDENCE_VALUES.indexOf(value) < 0) return null;
    var prev = state.sheetConfidence[id];
    var rec = normalizeConfidence({
      id: id, sheetId: id, value: value,
      createdAt: prev ? prev.createdAt : nowISO(),
      updatedAt: nowISO(), deleted: false
    }, id);
    state.sheetConfidence[id] = rec;
    save("confidence");
    emit("confidence:changed", { sheetId: id, value: value });
    return copyRecord(rec);
  }
  function confidenceClear(sheetId) {
    ensureState();
    var id = text(sheetId, 140);
    var prev = state.sheetConfidence[id];
    if (!prev || prev.deleted === true) return null;
    prev.deleted = true;
    prev.updatedAt = nowISO();
    save("confidence");
    emit("confidence:changed", { sheetId: id, value: null });
    return copyRecord(prev);
  }
  function confidenceList() {
    ensureState();
    return listRecords(state.sheetConfidence, {}, null);
  }

  function reviewGet(sheetId) {
    ensureState();
    var id = "review-" + text(sheetId, 140);
    var rec = state.sheetReview[id];
    return rec && rec.deleted !== true ? copyRecord(rec) : null;
  }
  function reviewSave(schedule) {
    ensureState();
    var rec = buildReview(schedule);
    if (!rec) return null;
    state.sheetReview[rec.id] = rec;
    save("review");
    emit("review:changed", { sheetId: rec.sheetId });
    return copyRecord(rec);
  }
  function reviewDue(at) {
    ensureState();
    var limit = at == null ? Date.now() : timestamp(at);
    if (!limit) return [];
    var out = [];
    Object.keys(state.sheetReview).forEach(function (id) {
      var rec = state.sheetReview[id];
      if (!rec || rec.deleted === true) return;
      if (timestamp(rec.dueAt) <= limit) out.push(clone(rec));
    });
    out.sort(function (a, b) {
      var d = timestamp(a.dueAt) - timestamp(b.dueAt);
      return d || String(a.sheetId).localeCompare(String(b.sheetId));
    });
    return out;
  }
  function reviewList() {
    ensureState();
    return listRecords(state.sheetReview, {}, null);
  }
  function reviewRemove(sheetId) {
    ensureState();
    var id = "review-" + text(sheetId, 140);
    var prev = state.sheetReview[id];
    if (!prev || prev.deleted === true) return null;
    prev.deleted = true;
    prev.updatedAt = nowISO();
    save("review");
    emit("review:changed", { sheetId: prev.sheetId });
    return copyRecord(prev);
  }

  function recallList(opts) {
    ensureState();
    opts = opts || {};
    return listRecords(state.recall, opts, function (record) {
      return !opts.sheetId || record.sheetId === opts.sheetId;
    });
  }
  function recallAdd(data) {
    ensureState();
    var rec = buildRecall(data);
    if (!rec) return null;
    if (Object.keys(state.recall).length >= RECORD_LIMITS.recall) return null;
    state.recall[rec.id] = rec;
    save("recall");
    emit("recall:changed", { sheetId: rec.sheetId, id: rec.id, rating: rec.rating });
    return copyRecord(rec);
  }
  function recallRemove(id) {
    ensureState();
    var prev = liveRecord(state.recall, id);
    if (!prev) return null;
    prev.deleted = true;
    prev.updatedAt = nowISO();
    save("recall");
    emit("recall:changed", { sheetId: prev.sheetId, id: prev.id, rating: prev.rating });
    return copyRecord(prev);
  }

  function userCardsList(opts) {
    ensureState();
    opts = opts || {};
    return listRecords(state.userCards, opts, function (record) {
      return !opts.sheetId || record.sheetId === opts.sheetId;
    });
  }
  function userCardsGet(id) {
    ensureState();
    return copyRecord(liveRecord(state.userCards, id));
  }
  function userCardsAdd(data) {
    ensureState();
    var rec = buildUserCard(data, null);
    if (!rec) return null;
    if (Object.keys(state.userCards).length >= RECORD_LIMITS.userCards) return null;
    state.userCards[rec.id] = rec;
    save("userCard");
    return copyRecord(rec);
  }
  function userCardsUpdate(id, patch) {
    ensureState();
    var prev = liveRecord(state.userCards, id);
    if (!prev) return null;
    var rec = buildUserCard(patch, prev);
    if (!rec) return null;
    state.userCards[rec.id] = rec;
    save("userCard");
    return copyRecord(rec);
  }
  function userCardsRemove(id) {
    ensureState();
    var prev = liveRecord(state.userCards, id);
    if (!prev) return null;
    prev.deleted = true;
    prev.updatedAt = nowISO();
    save("userCard");
    return copyRecord(prev);
  }

  function planGet() {
    ensureState();
    var rec = state.plan;
    return rec && rec.deleted !== true ? copyRecord(rec) : null;
  }
  function planSave(data) {
    ensureState();
    var rec = buildPlan(data, state.plan);
    if (!rec) return null;
    state.plan = rec;
    save("plan");
    emit("plan:changed", { plan: copyRecord(rec) });
    return copyRecord(rec);
  }
  function planRemove() {
    ensureState();
    var prev = state.plan;
    if (!prev || prev.deleted === true) return null;
    prev.deleted = true;
    prev.updatedAt = nowISO();
    save("plan");
    emit("plan:changed", { plan: null });
    return copyRecord(prev);
  }

  function weeklyGet(weekStart) {
    ensureState();
    var key = text(weekStart, 40);
    if (!key) return null;
    var id = /^\d{4}-W\d{2}$/.test(key) ? key : isoWeek(key);
    return copyRecord(liveRecord(state.weekly, id));
  }
  function weeklySave(record) {
    ensureState();
    var src = record || {};
    var weekStart = dayString(src.weekStart);
    if (!weekStart) return null;
    var id = isoWeek(weekStart);
    var prev = state.weekly[id];
    var plain;
    try { plain = clone(src); } catch (e) { return null; }
    var rec = {
      id: id,
      weekStart: weekStart,
      createdAt: prev ? prev.createdAt : nowISO(),
      updatedAt: nowISO(),
      deleted: false
    };
    Object.keys(plain).forEach(function (k) {
      if (k === "id" || k === "weekStart" || k === "createdAt" || k === "updatedAt" || k === "deleted") return;
      if (k === "__proto__" || k === "constructor" || k === "prototype") return;
      rec[k] = plain[k];
    });
    state.weekly[id] = rec;
    save("weekly");
    return copyRecord(rec);
  }
  function weeklyList(limit) {
    ensureState();
    var out = listRecords(state.weekly, {}, null).sort(function (a, b) {
      return String(b.weekStart).localeCompare(String(a.weekStart));
    });
    if (limit && limit > 0) out = out.slice(0, limit);
    return out;
  }

  function factGet(factId) {
    ensureState();
    var id = text(factId, 200);
    var rec = state.factsKnown[id];
    return rec && rec.deleted !== true ? copyRecord(rec) : null;
  }
  function factSet(factId, known) {
    ensureState();
    var id = text(factId, 200);
    if (!id) return null;
    var prev = state.factsKnown[id];
    var rec = normalizeFactKnown({
      id: id, factId: id, known: known === true,
      createdAt: prev ? prev.createdAt : nowISO(),
      updatedAt: nowISO(), deleted: false
    }, id);
    state.factsKnown[id] = rec;
    save("factKnown");
    return copyRecord(rec);
  }
  function factsListKnown() {
    ensureState();
    return Object.keys(state.factsKnown).filter(function (id) {
      var rec = state.factsKnown[id];
      return rec && rec.deleted !== true && rec.known === true;
    }).sort();
  }
  function factsList() {
    ensureState();
    return listRecords(state.factsKnown, {}, null);
  }

  /* ------------------------------------------------------------------ */
  /* Exportar / importar / borrar / recordatorio                        */
  /* ------------------------------------------------------------------ */

  function exportProgress() {
    return buildExport();
  }
  function previewImport(raw) {
    var check = validateEnvelope(raw);
    return {
      ok: check.ok,
      errors: check.errors,
      warnings: check.warnings,
      summary: check.summary
    };
  }
  function importProgress(raw, opts) {
    ensureState();
    opts = opts || {};
    var mode = opts.mode == null ? "merge" : opts.mode;
    if (mode !== "merge" && mode !== "replace") {
      return { ok: false, mode: mode, errors: ["Modo de importación no válido: usa merge o replace."], warnings: [], summary: emptySummary(), safetyCopy: false };
    }
    var check = validateEnvelope(raw);
    if (!check.ok) return failure(check, mode);
    if (mode === "replace" && opts.confirmReplace !== true) {
      return failure(check, mode, { errors: ["Reemplazar exige confirmación explícita (confirmReplace: true)."] });
    }
    if (!writeSafetyCopy(PRE_IMPORT_KEY)) {
      return failure(check, mode, { errors: ["No se pudo guardar la copia de seguridad previa. La importación se canceló."] });
    }
    if (mode === "merge") {
      state = mergeStates(state, check.state);
      /* La importación explícita conserva la sesión activa de Flashcards aunque el
         estado local recién creado tenga un updatedAt más nuevo y esté vacío. */
      if (!state.flashSession && check.state.flashSession) {
        state.flashSession = clone(check.state.flashSession);
      }
    } else {
      var next = normalize(check.state);
      next.resetAt = pickNewer(next, state).resetAt;
      next.updatedAt = nowISO();
      state = next;
    }
    saveFresh("import");
    emit("backup:changed", { action: "import" });
    return { ok: true, mode: mode, summary: check.summary, safetyCopy: true, warnings: check.warnings };
  }
  function clearAllProgress(opts) {
    ensureState();
    if (!opts || opts.confirm !== true) {
      return { ok: false, safetyCopy: false, errors: ["Borrar el progreso exige confirm:true."] };
    }
    if (!writeSafetyCopy(PRE_CLEAR_KEY)) {
      return { ok: false, safetyCopy: false, errors: ["No se pudo guardar la copia de seguridad previa. El borrado se canceló."] };
    }
    var at = nowISO();
    var createdAt = state.createdAt || at;
    var goals = Object.assign(defaultGoals(), state.goals || {});
    state = defaultState();
    state.createdAt = createdAt;
    state.updatedAt = at;
    state.resetAt = at;
    state.goals = goals;
    saveFresh("clear");
    emit("backup:changed", { action: "clear" });
    emit("progress:cleared", { at: at });
    return { ok: true, safetyCopy: true, at: at };
  }
  function getBackupStatus() {
    ensureState();
    var meta = readBackupMeta();
    var hasActivity = hasRealActivity();
    var lastExport = meta.lastExportAt ? parseDate(meta.lastExportAt) : null;
    var lastSnooze = meta.snoozedAt ? parseDate(meta.snoozedAt) : null;
    var daysSinceExport = lastExport ? Math.floor((Date.now() - lastExport.getTime()) / 86400000) : null;
    var daysSinceSnooze = lastSnooze ? Math.floor((Date.now() - lastSnooze.getTime()) / 86400000) : null;
    var neverExported = !lastExport;
    var due = hasActivity && (neverExported || daysSinceExport >= 7) && (daysSinceSnooze == null || daysSinceSnooze >= 7);
    return {
      hasActivity: hasActivity,
      due: due,
      neverExported: neverExported,
      lastExportAt: meta.lastExportAt,
      daysSinceExport: daysSinceExport,
      lastSnoozeAt: meta.snoozedAt,
      daysSinceSnooze: daysSinceSnooze
    };
  }
  function markBackupExported(at) {
    var meta = readBackupMeta();
    meta.lastExportAt = isoOrNull(at) || nowISO();
    meta.snoozedAt = null;
    writeBackupMeta(meta);
    emit("backup:changed", { action: "export" });
    return meta;
  }
  function snoozeBackupReminder() {
    var meta = readBackupMeta();
    meta.snoozedAt = nowISO();
    writeBackupMeta(meta);
    emit("backup:changed", { action: "snooze" });
    return meta;
  }

  function reset() {
    var at = nowISO();
    var goals = state ? Object.assign(defaultGoals(), state.goals || {}) : defaultGoals();
    state = defaultState();
    state.updatedAt = at;
    state.resetAt = at;
    state.goals = goals;
    saveFresh("reset");
  }

  window.StudyStore = {
    SCHEMA_VERSION: SCHEMA_VERSION,
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
    urls: { appUrl: appUrl, dashboard: lastDashboardUrl, flashcards: lastFlashcardsUrl },

    annotations: {
      list: annotationsList,
      get: function (id) { ensureState(); return copyRecord(liveRecord(state.annotations, id)); },
      add: annotationAdd,
      update: annotationUpdate,
      remove: annotationRemove
    },
    doubts: {
      list: doubtsList,
      get: function (id) { ensureState(); return copyRecord(liveRecord(state.doubts, id)); },
      add: doubtAdd,
      update: doubtUpdate,
      resolve: doubtResolve,
      reopen: doubtReopen,
      remove: doubtRemove
    },
    sheetConfidence: {
      get: confidenceGet,
      set: confidenceSet,
      clear: confidenceClear,
      list: confidenceList
    },
    sheetReview: {
      get: reviewGet,
      save: reviewSave,
      due: reviewDue,
      list: reviewList,
      remove: reviewRemove
    },
    recall: {
      list: recallList,
      add: recallAdd,
      remove: recallRemove
    },
    userCards: {
      list: userCardsList,
      get: userCardsGet,
      add: userCardsAdd,
      update: userCardsUpdate,
      remove: userCardsRemove
    },
    plan: {
      get: planGet,
      save: planSave,
      remove: planRemove
    },
    weekly: {
      get: weeklyGet,
      save: weeklySave,
      list: weeklyList
    },
    factsKnown: {
      get: factGet,
      set: factSet,
      listKnown: factsListKnown,
      list: factsList
    },

    exportProgress: exportProgress,
    previewImport: previewImport,
    importProgress: importProgress,
    clearAllProgress: clearAllProgress,
    getBackupStatus: getBackupStatus,
    markBackupExported: markBackupExported,
    snoozeBackupReminder: snoozeBackupReminder,

    /* Diagnóstico de solo lectura, útil para QA y para el informe. */
    _internal: {
      mergeStates: mergeStates,
      normalize: normalize,
      hasRealActivity: hasRealActivity,
      constants: {
        LS_KEY: LS_KEY, SNAPSHOT_KEY: SNAPSHOT_KEY, BACKUP_META_KEY: BACKUP_META_KEY,
        PRE_CLEAR_KEY: PRE_CLEAR_KEY, PRE_IMPORT_KEY: PRE_IMPORT_KEY,
        MAX_IMPORT_BYTES: MAX_IMPORT_BYTES, APP_VERSION: APP_VERSION
      }
    }
  };
})();
