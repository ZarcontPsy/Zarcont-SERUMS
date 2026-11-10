/* SERUMS STUDY — Runtime compartido de planificación (Fase 2)
   Puente único entre StudyStore/StudyTaxonomy y StudyPlanModel.

   · No carga plan-model.js al evaluarse: solo cuando una vista llama a
     ensureModel() desde su mount, nunca en la portada.
   · Input puro y explícito; las vistas pueden añadir extras.
   · No escribe en el store ni registra rutas.
   · Carga clásica: window.StudyPlanRuntime.

   Contrato: study-dashboard/docs/CONTRATOS-FASE2.md §3
   © 2026 ZARCONT */
(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var MODEL_SRC = "js/plan/plan-model.js?v=2.3.0";
  var MODEL_LOAD_TIMEOUT = 12000;
  var MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  var WEEKDAYS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

  var model = null;
  var loading = null;
  var loadTimer = null;

  function content() {
    return root.STUDY_CONTENT || null;
  }
  function store() {
    return root.StudyStore || null;
  }
  function safeCall(target, name, fallback) {
    if (!target || typeof target[name] !== "function") return fallback;
    try { return target[name](); } catch (error) { return fallback; }
  }
  function isObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }
  function copy(value) {
    if (Array.isArray(value)) return value.slice();
    if (isObject(value)) {
      var out = {};
      Object.keys(value).forEach(function (key) { out[key] = value[key]; });
      return out;
    }
    return value;
  }
  function escapeHTML(value) {
    if (root.StudyUI && typeof root.StudyUI.escapeHTML === "function") {
      return root.StudyUI.escapeHTML(value);
    }
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  function icon(name, size) {
    if (root.StudyUI && typeof root.StudyUI.icon === "function") {
      return root.StudyUI.icon(name, size || 16);
    }
    return "";
  }
  function plural(n, one, many) {
    return Number(n) === 1 ? one : (many || one + "s");
  }
  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }
  function parseDateKey(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value == null ? "" : value));
    if (!match) return null;
    var y = Number(match[1]), m = Number(match[2]), d = Number(match[3]);
    var probe = new Date(Date.UTC(y, m - 1, d));
    if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) return null;
    return { y: y, m: m, d: d, weekday: (probe.getUTCDay() + 6) % 7 };
  }
  function formatDate(value) {
    var date = parseDateKey(value);
    if (!date) return "";
    return date.d + " " + MONTHS[date.m - 1] + " " + date.y;
  }
  function formatWeekday(value) {
    var date = parseDateKey(value);
    return date ? WEEKDAYS[date.weekday] : "";
  }
  function formatMinutes(value) {
    var n = Number(value);
    if (!isFinite(n) || n < 0) return "—";
    n = Math.round(n);
    if (n < 60) return n + " min";
    var hours = Math.floor(n / 60);
    var minutes = n % 60;
    return hours + " h" + (minutes ? " " + minutes + " min" : "");
  }
  function nowIso() {
    return new Date().toISOString();
  }
  function todayKey() {
    return new Date(Date.now() - 5 * 60 * 60000).toISOString().slice(0, 10);
  }

  function ensureModel() {
    if (root.StudyPlanModel) {
      model = root.StudyPlanModel;
      return Promise.resolve(model);
    }
    if (loading) return loading;
    if (typeof document === "undefined") {
      return Promise.reject(new Error("El modelo de planificación solo está disponible en el navegador."));
    }
    loading = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = MODEL_SRC;
      script.async = true;
      var settled = false;
      function fail(message) {
        if (settled) return;
        settled = true;
        if (loadTimer) { root.clearTimeout(loadTimer); loadTimer = null; }
        loading = null;
        if (script.parentNode) script.parentNode.removeChild(script);
        reject(new Error(message));
      }
      function succeed() {
        if (settled) return;
        if (!root.StudyPlanModel) {
          fail("El modelo de planificación cargó pero no expuso StudyPlanModel.");
          return;
        }
        settled = true;
        if (loadTimer) { root.clearTimeout(loadTimer); loadTimer = null; }
        model = root.StudyPlanModel;
        resolve(model);
      }
      script.onload = succeed;
      script.onerror = function () { fail("No se pudo cargar el modelo de planificación."); };
      loadTimer = root.setTimeout(function () {
        fail("El modelo de planificación tardó demasiado en cargar.");
      }, MODEL_LOAD_TIMEOUT);
      (document.head || document.documentElement).appendChild(script);
    });
    return loading;
  }

  function plan() {
    var s = store();
    if (!s || !s.plan || typeof s.plan.get !== "function") return null;
    try { return s.plan.get(); } catch (error) { return null; }
  }
  function areaPriority() {
    var p = plan();
    return p && isObject(p.areaPriority) ? copy(p.areaPriority) : {};
  }
  function sheets() {
    var c = content();
    return c && Array.isArray(c.sheets) ? c.sheets : [];
  }
  function sheetById(id) {
    var c = content();
    if (c && c.sheetById && c.sheetById[id]) return c.sheetById[id];
    var list = sheets();
    for (var i = 0; i < list.length; i += 1) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }
  function categories() {
    var c = content();
    return c && Array.isArray(c.categories) ? c.categories : [];
  }
  function categoryArea() {
    var map = {};
    categories().forEach(function (category) {
      if (category && category.id && category.areaId) map[category.id] = category.areaId;
    });
    return map;
  }
  function cardSheetMap() {
    var c = content();
    var map = {};
    (c && Array.isArray(c.cards) ? c.cards : []).forEach(function (card) {
      if (card && card.id && card.sheetId) map[card.id] = card.sheetId;
    });
    return map;
  }
  function cardsDue(state, nowMs) {
    var cards = state && isObject(state.cards) ? state.cards : {};
    var count = 0;
    Object.keys(cards).forEach(function (id) {
      var card = cards[id];
      if (!card || !(card.reviews > 0)) return;
      if (!card.dueAt) { count += 1; return; }
      var due = Date.parse(card.dueAt);
      if (!isFinite(due) || due <= nowMs) count += 1;
    });
    return count;
  }

  function input(extra) {
    var s = store();
    var state = s && typeof s.getState === "function" ? s.getState() || {} : {};
    var p = plan();
    var now = nowIso();
    var nowMs = Date.parse(now);
    var sheetList = sheets().map(function (sheet) {
      var entry = state.sheets && state.sheets[sheet.id] ? state.sheets[sheet.id] : null;
      return {
        id: sheet.id,
        title: sheet.title,
        minutes: sheet.minutes,
        areaId: sheet.primaryAreaId || sheet.areaId || null,
        categoryId: sheet.categoryId || null,
        priority: sheet.priority,
        done: !!(entry && entry.completedAt)
      };
    });
    var confidence = {};
    var reviews = [];
    var doubts = [];
    var recall = [];
    if (s) {
      if (s.sheetConfidence && typeof s.sheetConfidence.list === "function") {
        try {
          s.sheetConfidence.list().forEach(function (record) {
            if (record && record.sheetId && record.value) confidence[record.sheetId] = record.value;
          });
        } catch (error) { /* señal ausente: el modelo la declarará */ }
      }
      if (s.sheetReview && typeof s.sheetReview.list === "function") {
        try { reviews = s.sheetReview.list() || []; } catch (error) { reviews = []; }
      }
      if (s.doubts && typeof s.doubts.list === "function") {
        try { doubts = s.doubts.list({ resolved: false }) || []; } catch (error) { doubts = []; }
      }
      if (s.recall && typeof s.recall.list === "function") {
        try { recall = s.recall.list() || []; } catch (error) { recall = []; }
      }
    }
    var states = { sheets: state.sheets || {} };
    if (s && s.sheetConfidence) states.confidence = confidence;
    if (state.cards) states.cards = state.cards;
    if (s && s.recall) states.recall = recall;

    var base = {
      now: now,
      examDate: p ? p.examDate || null : null,
      minutesPerDay: p && p.minutesPerDay !== undefined ? p.minutesPerDay : null,
      daysPerWeek: p && p.daysPerWeek !== undefined ? p.daysPerWeek : 6,
      budgetMinutes: p && p.minutesPerDay !== undefined ? p.minutesPerDay : null,
      areaPriority: areaPriority(),
      sheets: sheetList,
      reviews: reviews,
      doubts: doubts,
      cardsDue: cardsDue(state, nowMs),
      states: states,
      cardSheet: cardSheetMap(),
      categories: categories(),
      categoryArea: categoryArea(),
      activity: state.activity || {},
      planRecord: p || null
    };
    if (isObject(extra)) {
      Object.keys(extra).forEach(function (key) { base[key] = extra[key]; });
    }
    return base;
  }

  root.StudyPlanRuntime = {
    version: VERSION,
    ensureModel: ensureModel,
    model: function () {
      if (root.StudyPlanModel) model = root.StudyPlanModel;
      return model;
    },
    input: input,
    nowIso: nowIso,
    todayKey: todayKey,
    content: content,
    sheets: sheets,
    sheetById: sheetById,
    categories: categories,
    plan: plan,
    areaPriority: areaPriority,
    hasStore: function () { return !!store(); },
    format: {
      date: formatDate,
      weekday: formatWeekday,
      minutes: formatMinutes,
      days: function (n) { return Number(n) + " " + plural(n, "día", "días"); }
    },
    escape: escapeHTML,
    icon: icon,
    plural: plural,
    pad2: pad2
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
