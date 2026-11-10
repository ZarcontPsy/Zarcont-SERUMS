/* SERUMS STUDY — Repaso espaciado de fichas (#/repaso, Fase 2)
   Módulo `plan-review`: lista los repasos de ficha guardados, ordenados por
   vencimiento, y permite autoevaluar cada uno con tres opciones.

   Reglas del módulo (docs/CONTRATOS-FASE2.md §2, §4.4 · PLAN-MODELO.md §7):
   · `StudyPlanRuntime.ensureModel()` se llama SOLO desde `mount`.
   · Lista `StudyStore.sheetReview.list()`; no inventa fechas.
   · Al autoevaluar, calcula el próximo vencimiento con
     `StudyPlanModel.nextSheetReview(input)` y guarda
     `StudyStore.sheetReview.save({sheetId, dueAt, intervalDays, lastReviewedAt, source:"confidence"})`.
   · No toca `cards`, `flashSession` ni las cajas de Study Flashcards.
   · `reviewCount` se reconstruye con la escalera documentada (1·2·4·7·15·30·60)
     a partir del `intervalDays` guardado y la confianza declarada actual; si el
     dato no coincide con la escalera se asume el tramo inferior y se declara.
   · Se limpia en `unmount`; el CSS vive en css/plan-review.css.

   Contrato: docs/CONTRATOS-FASE2.md §4.4
   © 2026 ZARCONT */
(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var MODULE_ID = "plan-review";
  var ROUTE_PATH = "repaso";
  var VIEW = "repaso";
  var TITLE_ID = "plan-review-title";
  var DEBOUNCE_MS = 180;
  var DAY_MS = 86400000;
  /* America/Lima no aplica horario de verano: un desfase fijo de UTC−05:00 es
     exacto para convertir un instante ISO a día civil del temario. */
  var ZONE_OFFSET_MINUTES = -300;
  var MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  var LADDER_FALLBACK = [1, 2, 4, 7, 15, 30, 60];
  var CONFIDENCE_IDS = ["weak", "partial", "solid"];
  var VARIANTS = [
    { value: "weak", label: "No lo sabía" },
    { value: "partial", label: "Más o menos" },
    { value: "solid", label: "Lo sabía" }
  ];
  var CONFIDENCE_LABELS = { weak: "No lo sabía", partial: "Más o menos", solid: "Lo sabía" };

  var state = {
    section: null,
    content: null,
    token: 0,
    model: null,
    debounce: 0,
    onStore: null,
    onClick: null,
    saving: false,
    rows: [],
    candidates: [],
    focus: null
  };

  /* ------------------------------------------------------------------ */
  /* Utilidades                                                          */
  /* ------------------------------------------------------------------ */

  function runtime() {
    return root.StudyPlanRuntime || null;
  }
  function localStore() {
    return root.StudyStore || null;
  }
  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object || {}, key);
  }
  function isObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }
  function asNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    var n = Number(value);
    return isFinite(n) ? n : null;
  }
  function esc(value) {
    var rt = runtime();
    if (rt && typeof rt.escape === "function") {
      try { return rt.escape(value); } catch (error) { /* escapador local */ }
    }
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  function icon(name, size) {
    var rt = runtime();
    if (rt && typeof rt.icon === "function") {
      try { return rt.icon(name, size || 16); } catch (error) { return ""; }
    }
    return "";
  }
  function plural(n, one, many) {
    return Number(n) === 1 ? one : (many || one + "s");
  }
  function formatDayKey(key) {
    var rt = runtime();
    if (rt && rt.format && typeof rt.format.date === "function") {
      try {
        var formatted = rt.format.date(key);
        if (formatted) return formatted;
      } catch (error) { /* formato local */ }
    }
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key == null ? "" : key));
    if (!match) return "";
    var month = Number(match[2]);
    if (month < 1 || month > 12) return "";
    return Number(match[3]) + " " + MONTHS[month - 1] + " " + match[1];
  }
  function dayKeyFromInstant(value) {
    var ms = typeof value === "number" ? value : Date.parse(value);
    if (!isFinite(ms)) return null;
    var shifted = new Date(ms - ZONE_OFFSET_MINUTES * 60000);
    if (isNaN(shifted.getTime())) return null;
    return shifted.toISOString().slice(0, 10);
  }
  function todayKey() {
    var rt = runtime();
    if (rt && typeof rt.todayKey === "function") {
      try {
        var key = rt.todayKey();
        if (key) return key;
      } catch (error) { /* cálculo local */ }
    }
    return dayKeyFromInstant(Date.now());
  }
  function dayDiff(fromKey, toKey) {
    var from = Date.parse(String(fromKey) + "T00:00:00Z");
    var to = Date.parse(String(toKey) + "T00:00:00Z");
    if (!isFinite(from) || !isFinite(to)) return null;
    return Math.round((to - from) / DAY_MS);
  }
  function content() {
    var rt = runtime();
    if (rt && typeof rt.content === "function") {
      try { return rt.content(); } catch (error) { return null; }
    }
    return root.STUDY_CONTENT || null;
  }
  function sheetById(id) {
    var rt = runtime();
    if (rt && typeof rt.sheetById === "function") {
      try {
        var sheet = rt.sheetById(id);
        if (sheet) return sheet;
      } catch (error) { /* respaldo local */ }
    }
    var c = content();
    if (c && c.sheetById && c.sheetById[id]) return c.sheetById[id];
    var list = c && Array.isArray(c.sheets) ? c.sheets : [];
    for (var i = 0; i < list.length; i += 1) {
      if (list[i] && list[i].id === id) return list[i];
    }
    return null;
  }
  function areaTitleForSheet(sheet) {
    if (!sheet) return "Sin área";
    var id = sheet.primaryAreaId || sheet.areaId || "";
    var c = content();
    var info = null;
    if (c) {
      if (id && c.primaryAreaById && c.primaryAreaById[id]) info = c.primaryAreaById[id];
      else if (id && c.legacyAreaById && c.legacyAreaById[id]) info = c.legacyAreaById[id];
      else {
        var list = Array.isArray(c.areas) ? c.areas : [];
        for (var i = 0; i < list.length; i += 1) {
          if (list[i] && list[i].id === id) { info = list[i]; break; }
        }
      }
    }
    if (info && typeof info.title === "string" && info.title) return info.title;
    return id || "Sin área";
  }
  function intervalText(value) {
    var n = asNumber(value);
    if (n === null || n < 0) return "";
    return 'Intervalo guardado: ' + Math.round(n) + ' ' + plural(Math.round(n), 'día', 'días');
  }

  /* ------------------------------------------------------------------ */
  /* Cabecera y estados de la página                                     */
  /* ------------------------------------------------------------------ */

  function headerHTML() {
    return '<header class="plan-page-head">' +
      '<div class="plan-page-topline">' +
        '<a class="plan-page-panel" href="#/" data-nav data-plan-link="panel">' +
          icon("arrowLeft", 14) + '<span>Panel</span>' +
        '</a>' +
        '<span class="plan-page-kicker"><span class="plan-page-dot" aria-hidden="true"></span>Planificación</span>' +
      '</div>' +
      '<h1 class="plan-page-title" id="' + TITLE_ID + '">Repaso de fichas</h1>' +
      '<p class="plan-page-lede">Los repasos de ficha ordenados por vencimiento. Autoevalúa cada uno con tres opciones y este panel agenda el próximo; las cajas y sesiones de Study Flashcards no se tocan.</p>' +
      '<nav class="plan-page-links" aria-label="Otras vistas de planificación">' +
        '<a class="plan-page-link" href="#/ruta" data-nav data-plan-link="ruta">' + icon("compass", 14) + '<span>Ruta de hoy</span></a>' +
        '<a class="plan-page-link" href="#/plan" data-nav data-plan-link="plan">' + icon("calendar", 14) + '<span>Plan de estudio</span></a>' +
        '<a class="plan-page-link" href="#/dominio" data-nav data-plan-link="dominio">' + icon("target", 14) + '<span>Mapa de dominio</span></a>' +
      '</nav>' +
      '</header>';
  }

  function loadingHTML() {
    return '<div class="plan-review-skeleton" data-plan-loading role="status" aria-live="polite" aria-busy="true">' +
      '<span class="s-sr-only">Cargando los repasos de ficha…</span>' +
      '<div class="plan-review-skeleton-summary s-skeleton"></div>' +
      '<div class="plan-review-skeleton-row s-skeleton"></div>' +
      '<div class="plan-review-skeleton-row s-skeleton"></div>' +
      '<div class="plan-review-skeleton-row s-skeleton"></div>' +
    '</div>';
  }

  function errorHTML(message) {
    return '<div class="plan-review-error" data-plan-error role="alert">' +
      '<span class="plan-review-error-icon" aria-hidden="true">' + icon("alert", 20) + '</span>' +
      '<div class="plan-review-error-copy">' +
        '<h2 class="plan-review-error-title">No pude cargar los repasos</h2>' +
        '<p class="plan-review-error-text">' + esc(message) + '</p>' +
        '<button class="s-btn s-btn--sm" type="button" data-plan-action="retry">Reintentar</button>' +
      '</div>' +
    '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* Datos: filas ordenadas por vencimiento                              */
  /* ------------------------------------------------------------------ */

  function findRow(sheetId) {
    for (var i = 0; i < state.rows.length; i += 1) {
      if (state.rows[i].sheetId === sheetId) return state.rows[i];
    }
    return null;
  }

  function findRecord(sheetId) {
    var s = localStore();
    if (!s || !s.sheetReview) return null;
    if (typeof s.sheetReview.get === "function") {
      try {
        var record = s.sheetReview.get(sheetId);
        if (record) return record;
      } catch (error) { /* sigue con la lista */ }
    }
    if (typeof s.sheetReview.list === "function") {
      try {
        var list = s.sheetReview.list() || [];
        for (var i = 0; i < list.length; i += 1) {
          if (list[i] && list[i].sheetId === sheetId) return list[i];
        }
      } catch (error) { /* sin registro */ }
    }
    return null;
  }

  function buildRows(records) {
    var today = todayKey();
    var rows = [];
    var skipped = 0;
    (Array.isArray(records) ? records : []).forEach(function (record) {
      if (!record || record.deleted === true) return;
      var sheetId = typeof record.sheetId === "string" ? record.sheetId : "";
      if (!sheetId) { skipped += 1; return; }
      var sheet = sheetById(sheetId);
      if (!sheet) { skipped += 1; return; }
      var dueMs = Date.parse(record.dueAt);
      var hasDue = isFinite(dueMs);
      var dueKey = hasDue ? dayKeyFromInstant(dueMs) : null;
      var diff = dueKey ? dayDiff(today, dueKey) : null;
      rows.push({
        record: record,
        sheet: sheet,
        sheetId: sheetId,
        title: typeof sheet.title === "string" && sheet.title ? sheet.title : sheetId,
        area: areaTitleForSheet(sheet),
        dueMs: hasDue ? dueMs : null,
        dueKey: dueKey,
        diff: diff,
        overdueDays: diff !== null && diff < 0 ? -diff : 0,
        intervalDays: asNumber(record.intervalDays)
      });
    });
    rows.sort(function (a, b) {
      if (a.dueMs === null && b.dueMs === null) return a.sheetId < b.sheetId ? -1 : a.sheetId > b.sheetId ? 1 : 0;
      if (a.dueMs === null) return 1;
      if (b.dueMs === null) return -1;
      if (a.dueMs !== b.dueMs) return a.dueMs - b.dueMs;
      return a.sheetId < b.sheetId ? -1 : a.sheetId > b.sheetId ? 1 : 0;
    });
    return { rows: rows, skipped: skipped, today: today };
  }

  function dueText(row) {
    if (row.dueKey === null) return "Sin fecha de vencimiento legible";
    if (row.diff < 0) return "Venció el " + formatDayKey(row.dueKey);
    if (row.diff === 0) return "Vence hoy · " + formatDayKey(row.dueKey);
    return "Vence el " + formatDayKey(row.dueKey);
  }

  /* ------------------------------------------------------------------ */
  /* Fichas leídas sin repaso programado                                 */
  /* ------------------------------------------------------------------ */

  function firstIntervalFor(confidence, model) {
    var constants = model && isObject(model.constants) ? model.constants : {};
    var ladder = Array.isArray(constants.REVIEW_LADDER) ? constants.REVIEW_LADDER : LADDER_FALLBACK;
    var starts = isObject(constants.CONFIDENCE_START_INDEX) ? constants.CONFIDENCE_START_INDEX : { weak: 0, partial: 1, solid: 2 };
    var start = starts[confidence];
    if (typeof start !== "number") return null;
    var value = ladder[start];
    return typeof value === "number" ? value : null;
  }

  function completedOrder(entry) {
    var ms = entry.completedAt ? Date.parse(entry.completedAt) : NaN;
    return isFinite(ms) ? ms : null;
  }

  function sortByCompleted(list) {
    list.sort(function (a, b) {
      var ta = completedOrder(a);
      var tb = completedOrder(b);
      if (ta !== null && tb !== null && ta !== tb) return tb - ta;
      if ((ta === null) !== (tb === null)) return ta === null ? 1 : -1;
      return a.order - b.order;
    });
    return list;
  }

  function buildCandidates(input) {
    var result = {
      items: [],
      omitted: 0,
      eligibleTotal: 0,
      withoutConfidence: [],
      withoutConfidenceTotal: 0,
      completedTotal: 0
    };
    if (!input || !Array.isArray(input.sheets)) return result;
    var states = isObject(input.states) ? input.states : {};
    var confidence = isObject(states.confidence) ? states.confidence : {};
    var sheetStates = isObject(states.sheets) ? states.sheets : {};
    var scheduled = {};
    (Array.isArray(input.reviews) ? input.reviews : []).forEach(function (review) {
      if (review && review.deleted !== true && typeof review.sheetId === "string") scheduled[review.sheetId] = true;
    });
    var eligible = [];
    var withoutConfidence = [];
    input.sheets.forEach(function (sheet, index) {
      if (!sheet || typeof sheet.id !== "string" || sheet.done !== true) return;
      if (scheduled[sheet.id]) return;
      var entry = {
        sheet: sheet,
        sheetId: sheet.id,
        title: typeof sheet.title === "string" && sheet.title ? sheet.title : sheet.id,
        area: areaTitleForSheet(sheet),
        confidence: null,
        order: index,
        completedAt: sheetStates[sheet.id] && sheetStates[sheet.id].completedAt
          ? sheetStates[sheet.id].completedAt : null
      };
      var value = confidence[sheet.id];
      if (CONFIDENCE_IDS.indexOf(value) === -1) {
        withoutConfidence.push(entry);
        return;
      }
      entry.confidence = value;
      entry.confidenceLabel = CONFIDENCE_LABELS[value];
      entry.intervalDays = firstIntervalFor(value, state.model);
      eligible.push(entry);
    });
    sortByCompleted(eligible);
    sortByCompleted(withoutConfidence);
    result.items = eligible.slice(0, 5);
    result.omitted = Math.max(0, eligible.length - result.items.length);
    result.eligibleTotal = eligible.length;
    result.withoutConfidence = withoutConfidence.slice(0, 3);
    result.withoutConfidenceTotal = withoutConfidence.length;
    result.completedTotal = eligible.length + withoutConfidence.length;
    return result;
  }

  function findCandidate(sheetId) {
    for (var i = 0; i < state.candidates.length; i += 1) {
      if (state.candidates[i].sheetId === sheetId) return state.candidates[i];
    }
    return null;
  }

  function dueBadge(row) {
    if (row.dueKey === null) return { text: "Sin fecha", className: "is-unknown", state: "unknown" };
    if (row.diff < 0) {
      return { text: row.overdueDays + ' ' + plural(row.overdueDays, 'día', 'días') + ' de atraso', className: "is-overdue", state: "overdue" };
    }
    if (row.diff === 0) return { text: "Vence hoy", className: "is-today", state: "today" };
    if (row.diff === 1) return { text: "Vence mañana", className: "is-future", state: "future" };
    return { text: "En " + row.diff + ' ' + plural(row.diff, 'día', 'días'), className: "is-future", state: "future" };
  }

  /* ------------------------------------------------------------------ */
  /* Cálculo del próximo repaso                                          */
  /* ------------------------------------------------------------------ */

  function priorReviewCount(record, declaredConfidence, clickedConfidence, model) {
    var constants = model && isObject(model.constants) ? model.constants : {};
    var ladder = Array.isArray(constants.REVIEW_LADDER) ? constants.REVIEW_LADDER : LADDER_FALLBACK;
    var starts = isObject(constants.CONFIDENCE_START_INDEX) ? constants.CONFIDENCE_START_INDEX : { weak: 0, partial: 1, solid: 2 };
    if (!record) {
      return { count: 0, assumed: false, reason: "" };
    }
    var interval = asNumber(record.intervalDays);
    if (interval === null || interval < 0) {
      return {
        count: record.lastReviewedAt ? 1 : 0,
        assumed: true,
        reason: "el repaso guardado no declara un intervalo válido"
      };
    }
    var rounded = Math.round(interval);
    var index = ladder.indexOf(rounded);
    if (index < 0) {
      return {
        count: record.lastReviewedAt ? 1 : 0,
        assumed: true,
        reason: "el intervalo guardado (" + rounded + " días) no está en la escalera 1 · 2 · 4 · 7 · 15 · 30 · 60"
      };
    }
    var base = CONFIDENCE_IDS.indexOf(declaredConfidence) !== -1 ? declaredConfidence : clickedConfidence;
    var start = starts[base];
    if (typeof start !== "number") start = 0;
    /* Un repaso programado desde esta vista aún no se ha autoevaluado: no
       cuenta como repaso previo. Al autoevaluarlo, reviewCount = 0. */
    if (!record.lastReviewedAt) {
      var pendingConsistent = index === start;
      return {
        count: 0,
        assumed: !pendingConsistent,
        reason: pendingConsistent
          ? ""
          : "el repaso está programado sin lastReviewedAt y su intervalo no es el primero de la confianza actual; cuento 0 repasos previos"
      };
    }
    var prior = Math.max(0, index - start);
    var inconsistent = index < start;
    /* El intervalo guardado se creó en un repaso que ya ocurrió: el repaso
       actual es uno más. */
    return {
      count: prior + 1,
      assumed: CONFIDENCE_IDS.indexOf(declaredConfidence) === -1 || inconsistent,
      reason: CONFIDENCE_IDS.indexOf(declaredConfidence) === -1
        ? "no hay confianza previa declarada; reconstruyo los repasos con la confianza de este repaso"
        : (inconsistent
          ? "la confianza actual («" + base + "») no coincide con el tramo del intervalo guardado (" + rounded + " días); reconstruyo desde el tramo inferior"
          : "")
    };
  }

  function declaredConfidenceFor(sheetId, baseInput) {
    var input = baseInput;
    if (!input) {
      var rt = runtime();
      if (!rt || typeof rt.input !== "function") return null;
      try { input = rt.input(); } catch (error) { return null; }
    }
    var states = input && isObject(input.states) ? input.states : {};
    var map = isObject(states.confidence) ? states.confidence : {};
    var value = map[sheetId];
    return CONFIDENCE_IDS.indexOf(value) !== -1 ? value : null;
  }

  function successMessage(next, title, derivation) {
    var dueLabel = formatDayKey(next.dueDate) || formatDayKey(next.dueAt);
    var parts = [];
    parts.push('Guardado: «' + title + '» vuelve el ' + (dueLabel || "próximo día") +
      ' (' + next.intervalDays + ' ' + plural(next.intervalDays, 'día', 'días') + ').');
    parts.push('Repasos previos usados para la escalera: ' + derivation.count + '.');
    if (next.overdueDays > 0 && next.previousDueDate) {
      parts.push('Estaba vencido desde el ' + formatDayKey(next.previousDueDate) + '; el plazo nuevo cuenta desde hoy.');
    }
    if (derivation.assumed && derivation.reason) {
      parts.push('Supuesto: ' + derivation.reason + '.');
    }
    return parts.join(' ');
  }

  /* ------------------------------------------------------------------ */
  /* Pintura                                                             */
  /* ------------------------------------------------------------------ */

  function setStatus(message, isError) {
    var el = state.section ? state.section.querySelector("[data-plan-review-status]") : null;
    if (!el) return;
    el.textContent = message || "";
    if (isError) {
      el.classList.add("is-error");
      el.classList.remove("is-ok");
    } else if (message) {
      el.classList.add("is-ok");
      el.classList.remove("is-error");
    } else {
      el.classList.remove("is-error");
      el.classList.remove("is-ok");
    }
  }

  function emptyHTML(built) {
    var skipped = built && built.skipped
      ? '<p class="plan-review-empty-note">' + built.skipped + ' ' +
        plural(built.skipped, 'repaso no se pudo mostrar', 'repasos no se pudieron mostrar') +
        ' porque su ficha no está en el temario.</p>'
      : '';
    var hasCandidates = !!(built && built.candidates && built.candidates.items.length);
    if (hasCandidates) {
      return '<div class="plan-review-empty is-compact">' +
        '<span class="plan-review-empty-icon" aria-hidden="true">' + icon("rotate", 22) + '</span>' +
        '<div class="plan-review-empty-copy">' +
          '<h2 class="plan-review-empty-title">Aún no hay repasos programados</h2>' +
          '<p class="plan-review-empty-text">Programa una primera revisión en «Fichas leídas sin repaso programado»: al guardarla aparecerá aquí, ordenada por vencimiento y con sus tres botones de autoevaluación.</p>' +
          skipped +
        '</div>' +
      '</div>';
    }
    return '<div class="plan-review-empty">' +
      '<span class="plan-review-empty-icon" aria-hidden="true">' + icon("rotate", 22) + '</span>' +
      '<div class="plan-review-empty-copy">' +
        '<h2 class="plan-review-empty-title">Aún no hay repasos de ficha guardados</h2>' +
        '<p class="plan-review-empty-text">Cuando completes una ficha y marques tu confianza, aparecerá aquí para programar su primera revisión y, después, ordenada por vencimiento con sus tres botones de autoevaluación. El estado vacío es real: este panel no inventa fechas.</p>' +
        skipped +
        '<div class="plan-review-empty-actions">' +
          '<a class="s-btn s-btn--sm" href="#/biblioteca" data-nav>Elegir una ficha</a>' +
          '<a class="s-btn s-btn--ghost s-btn--sm" href="#/dominio" data-nav>Ver el mapa de dominio</a>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function summaryHTML(built) {
    var rows = built.rows;
    var overdue = rows.filter(function (row) { return row.diff !== null && row.diff < 0; }).length;
    var todayCount = rows.filter(function (row) { return row.diff === 0; }).length;
    var future = rows.filter(function (row) { return row.diff !== null && row.diff > 0; }).length;
    var invalid = rows.filter(function (row) { return row.dueKey === null; }).length;
    var counts = [];
    if (overdue) counts.push(overdue + ' ' + plural(overdue, 'vencido', 'vencidos'));
    if (todayCount) counts.push(todayCount + ' para hoy');
    if (future) counts.push(future + ' ' + plural(future, 'próximo', 'próximos'));
    if (invalid) counts.push(invalid + ' ' + plural(invalid, 'sin fecha', 'sin fecha'));
    var next = rows.filter(function (row) { return row.dueKey !== null; })[0] || null;
    var nextText;
    if (!next) {
      nextText = "Sin vencimientos legibles.";
    } else if (next.diff < 0) {
      nextText = 'Pendiente desde el ' + formatDayKey(next.dueKey) + ' · «' + next.title + '»';
    } else if (next.diff === 0) {
      nextText = 'Para hoy · «' + next.title + '»';
    } else {
      nextText = formatDayKey(next.dueKey) + ' · «' + next.title + '»';
    }
    return '<section class="plan-review-summary" data-plan-review-next aria-label="Resumen de repasos">' +
      '<span class="plan-review-kicker">Siguiente repaso</span>' +
      '<p class="plan-review-next-title">' + esc(nextText) + '</p>' +
      '<p class="plan-review-counts">' + esc(counts.join(' · ')) + '</p>' +
    '</section>';
  }

  function itemHTML(row) {
    var badge = dueBadge(row);
    var interval = intervalText(row.intervalDays);
    var href = "#/ficha/" + encodeURIComponent(row.sheetId);
    return '<li class="plan-review-item" data-sheet-id="' + esc(row.sheetId) + '" data-due="' + esc(row.dueKey || "") + '" data-overdue="' + row.overdueDays + '" data-due-state="' + badge.state + '">' +
      '<div class="plan-review-item-main">' +
        '<span class="plan-review-item-kicker">' + esc(row.area) + '</span>' +
        '<h3 class="plan-review-item-title">' +
          '<a class="plan-review-open" href="' + esc(href) + '" data-nav data-plan-action="open"' +
            ' aria-label="Abrir la ficha «' + esc(row.title) + '»">' + esc(row.title) + '</a>' +
        '</h3>' +
        '<p class="plan-review-item-meta">' +
          '<span>' + esc(dueText(row)) + '</span>' +
          (interval ? '<span class="plan-review-sep" aria-hidden="true">·</span><span>' + esc(interval) + '</span>' : '') +
        '</p>' +
        '<span class="plan-review-due ' + badge.className + '">' + esc(badge.text) + '</span>' +
      '</div>' +
      '<div class="plan-review-actions" role="group" aria-label="Autoevaluar «' + esc(row.title) + '»">' +
        VARIANTS.map(function (variant) {
          return '<button class="plan-review-btn" type="button" data-plan-action="review" data-value="' +
            variant.value + '">' + esc(variant.label) + '</button>';
        }).join('') +
      '</div>' +
    '</li>';
  }

  function listHTML(built) {
    return '<h2 class="plan-review-list-title">Repasos programados</h2>' +
      '<ol class="plan-review-list" aria-label="Repasos de ficha por vencimiento">' +
        built.rows.map(itemHTML).join('') +
      '</ol>';
  }

  function candidateHTML(candidate) {
    var href = "#/ficha/" + encodeURIComponent(candidate.sheetId);
    var title = candidate.title;
    var meta = [];
    if (candidate.confidenceLabel) meta.push('Confianza declarada: «' + candidate.confidenceLabel + '»');
    if (candidate.intervalDays) {
      meta.push('Primer repaso en ' + candidate.intervalDays + ' ' +
        plural(candidate.intervalDays, 'día', 'días'));
    }
    return '<li class="plan-review-candidate" data-sheet-id="' + esc(candidate.sheetId) + '" data-confidence="' + esc(candidate.confidence) + '">' +
      '<div class="plan-review-candidate-main">' +
        '<span class="plan-review-item-kicker">' + esc(candidate.area) + '</span>' +
        '<h3 class="plan-review-candidate-title">' +
          '<a class="plan-review-open" href="' + esc(href) + '" data-nav data-plan-action="declare"' +
            ' aria-label="Abrir la ficha «' + esc(title) + '» para revisar su confianza">' + esc(title) + '</a>' +
        '</h3>' +
        '<p class="plan-review-candidate-meta">' + esc(meta.join(' · ')) + '</p>' +
      '</div>' +
      '<button class="plan-review-schedule" type="button" data-plan-action="schedule"' +
        ' data-sheet-id="' + esc(candidate.sheetId) + '"' +
        ' aria-label="Programar primera revisión de «' + esc(title) + '»">Programar primera revisión</button>' +
    '</li>';
  }

  function pendingConfidenceHTML(candidates) {
    if (!candidates || !candidates.withoutConfidenceTotal) return '';
    var total = candidates.withoutConfidenceTotal;
    var shown = candidates.withoutConfidence;
    var more = total > shown.length
      ? '<p class="plan-review-candidates-more">y ' + (total - shown.length) + ' ' +
        plural(total - shown.length, 'ficha más', 'fichas más') + '.</p>'
      : '';
    var links = shown.map(function (entry) {
      var href = "#/ficha/" + encodeURIComponent(entry.sheetId);
      return '<li><a class="plan-review-declare-link" href="' + esc(href) + '" data-nav data-plan-action="declare"' +
        ' aria-label="Abrir la ficha «' + esc(entry.title) + '» para declarar tu confianza">' +
        esc(entry.title) + '<span>Declarar confianza</span></a></li>';
    }).join('');
    return '<div class="plan-review-candidates-pending" data-plan-review-pending-confidence>' +
      '<span class="plan-review-candidates-pending-kicker">Sin confianza declarada</span>' +
      '<p>' + total + ' ' + plural(total,
        'ficha completada no tiene confianza declarada',
        'fichas completadas no tienen confianza declarada') +
        '. Ábrela y marca cómo la llevas; no programo una confianza que no existe.</p>' +
      '<ul class="plan-review-declare-list" aria-label="Fichas completadas sin confianza declarada">' + links + '</ul>' +
      more +
    '</div>';
  }

  function candidatesHTML(built) {
    var candidates = built && built.candidates ? built.candidates : null;
    if (!candidates) return '';
    var items = candidates.items;
    var pending = candidates.withoutConfidenceTotal;
    if (!items.length && !pending && built.rows.length) return '';
    var body = '';
    if (items.length) {
      body = '<p class="plan-review-candidates-lede">Fichas completadas con confianza declarada y sin fecha de repaso. Programa la primera revisión: el intervalo sale de esa confianza y de la escalera, sin inventar datos.</p>' +
        '<ul class="plan-review-candidate-list" aria-label="Fichas completadas sin repaso programado">' +
          items.map(candidateHTML).join('') +
        '</ul>' +
        (candidates.omitted
          ? '<p class="plan-review-candidates-more">Se muestran ' + items.length + ' de ' + candidates.eligibleTotal +
            ' fichas. Programa estas y aparecerán las siguientes.</p>'
          : '') +
        pendingConfidenceHTML(candidates);
    } else if (pending) {
      body = pendingConfidenceHTML(candidates);
    } else {
      body = '<p class="plan-review-candidates-empty-text">Cuando completes una ficha y marques tu confianza, aparecerá aquí para programar su primera revisión.</p>';
    }
    return '<section class="plan-review-candidates" data-plan-review-candidates aria-labelledby="plan-review-candidates-title">' +
      '<h2 class="plan-review-candidates-title" id="plan-review-candidates-title">Fichas leídas sin repaso programado</h2>' +
      body +
    '</section>';
  }

  function footHTML(built) {
    var skipped = built && built.skipped
      ? '<p class="plan-review-foot-note">' + built.skipped + ' ' +
        plural(built.skipped, 'repaso apunta', 'repasos apuntan') +
        ' a una ficha que no está en el temario; no se muestra.</p>'
      : '';
    return '<footer class="plan-review-foot">' +
      skipped +
      '<p class="plan-review-foot-text">Escalera de repaso: 1 · 2 · 4 · 7 · 15 · 30 · 60 días. «No lo sabía» empieza en 1 día, «Más o menos» en 2 y «Lo sabía» en 4; cada repaso confirmado avanza un tramo. Los repasos previos se reconstruyen del intervalo guardado y la confianza actual; si el dato no coincide con la escalera, se asume el tramo inferior y se avisa al guardar.</p>' +
      '<p class="plan-review-foot-text">Programar la primera revisión usa la confianza ya declarada en la ficha y no la modifica: hasta que no la autoevalúes, esa ficha queda sin <code>lastReviewedAt</code> y no cuenta como repaso previo.</p>' +
      '<p class="plan-review-foot-text">Solo se guarda el repaso de ficha. Las cajas y sesiones de Study Flashcards no cambian.</p>' +
    '</footer>';
  }

  function contentHTML(built) {
    var candidates = candidatesHTML(built);
    if (!built.rows.length) return candidates + emptyHTML(built) + footHTML(built);
    return summaryHTML(built) + listHTML(built) + candidates + footHTML(built);
  }

  function applyFocus() {
    if (!state.focus || !state.content) return;
    var focus = state.focus;
    state.focus = null;
    var items = state.content.querySelectorAll(".plan-review-item");
    for (var i = 0; i < items.length; i += 1) {
      if (items[i].getAttribute("data-sheet-id") !== focus.sheetId) continue;
      var target = null;
      if (focus.kind === "scheduled") {
        target = items[i].querySelector('[data-plan-action="open"]');
        if (!target) target = items[i].querySelector('[data-plan-action="review"]');
      } else {
        target = items[i].querySelector('[data-plan-action="review"][data-value="' + focus.value + '"]');
      }
      if (target && typeof target.focus === "function") {
        try { target.focus({ preventScroll: true }); } catch (error) { target.focus(); }
      }
      return;
    }
  }

  function renderContent() {
    if (!state.section || !state.content) return;
    if (!state.model) return;
    var s = localStore();
    if (!s || !s.sheetReview || typeof s.sheetReview.list !== "function") {
      showError("Este navegador no expone los repasos de ficha guardados. No puedo listar ni reprogramar repasos sin esa colección.");
      return;
    }
    var records;
    try {
      records = s.sheetReview.list();
    } catch (error) {
      showError("No pude leer los repasos guardados.");
      return;
    }
    if (!Array.isArray(records)) {
      showError("Los repasos guardados no llegaron como una lista; no los muestro para no inventar fechas.");
      return;
    }
    var rt = runtime();
    var input = null;
    if (rt && typeof rt.input === "function") {
      try { input = rt.input(); } catch (error) { input = null; }
    }
    var built = buildRows(records);
    built.candidates = buildCandidates(input);
    state.rows = built.rows;
    state.candidates = built.candidates.items;
    state.content.innerHTML = contentHTML(built);
    applyFocus();
  }

  function showLoading() {
    if (state.content) state.content.innerHTML = loadingHTML();
  }
  function showError(message) {
    if (state.content) state.content.innerHTML = errorHTML(message);
  }

  /* ------------------------------------------------------------------ */
  /* Carga y autoevaluación                                              */
  /* ------------------------------------------------------------------ */

  function isCurrent(token) {
    if (token !== state.token || !state.section) return false;
    if (typeof state.section.isConnected === "boolean") return state.section.isConnected;
    return !!(root.document && root.document.documentElement && root.document.documentElement.contains(state.section));
  }

  function load(token) {
    var rt = runtime();
    if (!rt || typeof rt.ensureModel !== "function") {
      showError("No pude cargar el runtime de planificación. Vuelve a intentarlo; si sigue igual, revisa que plan.runtime.js esté integrado en index.html.");
      return;
    }
    rt.ensureModel().then(function (model) {
      if (!isCurrent(token)) return;
      state.model = model;
      renderContent();
    }).catch(function (error) {
      if (!isCurrent(token)) return;
      var message = error && error.message ? error.message : "No se pudo cargar el modelo de planificación.";
      showError(message + " Puedes reintentar; el resto de la app sigue funcionando.");
    });
  }

  function scheduleRefresh() {
    if (!state.section || !state.model) return;
    if (state.debounce) root.clearTimeout(state.debounce);
    state.debounce = root.setTimeout(function () {
      state.debounce = 0;
      if (!isCurrent(state.token)) return;
      renderContent();
    }, DEBOUNCE_MS);
  }

  function setItemBusy(item, busy) {
    if (!item) return;
    item.classList.toggle("is-busy", !!busy);
    var buttons = item.querySelectorAll('[data-plan-action="review"]');
    for (var i = 0; i < buttons.length; i += 1) {
      buttons[i].disabled = !!busy;
    }
  }

  function rate(button) {
    if (state.saving) return;
    var item = button && typeof button.closest === "function" ? button.closest(".plan-review-item") : null;
    var sheetId = item ? item.getAttribute("data-sheet-id") : "";
    var value = button ? button.getAttribute("data-value") : "";
    if (!sheetId || CONFIDENCE_IDS.indexOf(value) === -1) return;
    var s = localStore();
    var rt = runtime();
    var model = state.model;
    if (!s || !s.sheetReview || typeof s.sheetReview.save !== "function") {
      setStatus("No pude guardar el repaso: este navegador no expone StudyStore.sheetReview.save.", true);
      return;
    }
    if (!model || typeof model.nextSheetReview !== "function") {
      setStatus("No pude programar el repaso: el modelo de planificación no está disponible.", true);
      return;
    }
    var row = findRow(sheetId);
    var title = row ? row.title : (sheetById(sheetId) || {}).title || sheetId;
    var record = row ? row.record : findRecord(sheetId);
    var input = null;
    try { input = rt && typeof rt.input === "function" ? rt.input() : null; } catch (error) { input = null; }
    var declaredConfidence = declaredConfidenceFor(sheetId, input);
    var derivation = priorReviewCount(record, declaredConfidence, value, model);
    var now = rt && typeof rt.nowIso === "function" ? rt.nowIso() : new Date().toISOString();
    var next;
    try {
      next = model.nextSheetReview({
        now: now,
        sheetId: sheetId,
        confidence: value,
        reviewCount: derivation.count,
        previousIntervalDays: record ? asNumber(record.intervalDays) : null,
        lastReviewedAt: record ? record.lastReviewedAt || null : null,
        dueAt: record ? record.dueAt || null : null,
        dueDate: record ? record.dueDate || null : null
      });
    } catch (error) {
      setStatus("No pude calcular el próximo vencimiento; no se guardó nada.", true);
      return;
    }
    if (!next || next.ok !== true || !next.dueAt) {
      setStatus("No pude calcular el próximo vencimiento" + (next && next.reason ? ': ' + next.reason : '') + '. No se guardó nada.', true);
      return;
    }
    state.saving = true;
    setItemBusy(item, true);
    var saved;
    try {
      saved = s.sheetReview.save({
        sheetId: sheetId,
        dueAt: next.dueAt,
        intervalDays: next.intervalDays,
        lastReviewedAt: now,
        source: "confidence"
      });
    } catch (error) {
      saved = null;
    } finally {
      state.saving = false;
      setItemBusy(item, false);
    }
    if (!saved) {
      setStatus("El store rechazó el repaso: no se guardó el nuevo vencimiento. Revisa los datos e inténtalo de nuevo.", true);
      return;
    }
    state.focus = { kind: "rate", sheetId: sheetId, value: value };
    renderContent();
    setStatus(successMessage(next, title, derivation), false);
  }

  function setScheduleBusy(button, busy) {
    if (!button) return;
    button.disabled = !!busy;
    var card = typeof button.closest === "function" ? button.closest(".plan-review-candidate") : null;
    if (card && card.classList) card.classList.toggle("is-busy", !!busy);
  }

  function scheduleFirst(button) {
    if (state.saving) return;
    var sheetId = button ? button.getAttribute("data-sheet-id") : "";
    if (!sheetId) return;
    var s = localStore();
    var rt = runtime();
    var model = state.model;
    if (!s || !s.sheetReview || typeof s.sheetReview.save !== "function") {
      setStatus("No pude guardar el repaso: este navegador no expone StudyStore.sheetReview.save.", true);
      return;
    }
    if (!model || typeof model.nextSheetReview !== "function") {
      setStatus("No pude programar el repaso: el modelo de planificación no está disponible.", true);
      return;
    }
    var input = null;
    try { input = rt && typeof rt.input === "function" ? rt.input() : null; } catch (error) { input = null; }
    var candidate = findCandidate(sheetId);
    var title = candidate ? candidate.title : (sheetById(sheetId) || {}).title || sheetId;
    var already = !!findRecord(sheetId);
    if (!already && input && Array.isArray(input.reviews)) {
      already = input.reviews.some(function (review) {
        return review && review.deleted !== true && review.sheetId === sheetId;
      });
    }
    if (already) {
      setStatus("Ese repaso ya está programado: refresco la lista para no duplicar la fecha.", false);
      renderContent();
      return;
    }
    var confidence = declaredConfidenceFor(sheetId, input);
    if (!confidence) {
      setStatus("«" + title + "» no tiene confianza declarada. Abre la ficha y marca cómo la llevas; no programo una confianza que no existe.", true);
      renderContent();
      return;
    }
    var now = rt && typeof rt.nowIso === "function" ? rt.nowIso() : new Date().toISOString();
    var next;
    try {
      next = model.nextSheetReview({
        now: now,
        sheetId: sheetId,
        confidence: confidence,
        reviewCount: 0,
        previousIntervalDays: null,
        lastReviewedAt: null,
        dueAt: null,
        dueDate: null
      });
    } catch (error) {
      setStatus("No pude calcular la primera revisión; no se guardó nada.", true);
      return;
    }
    if (!next || next.ok !== true || !next.dueAt) {
      setStatus("No pude calcular la primera revisión" + (next && next.reason ? ": " + next.reason : "") + ". No se guardó nada.", true);
      return;
    }
    state.saving = true;
    setScheduleBusy(button, true);
    var saved;
    try {
      saved = s.sheetReview.save({
        sheetId: sheetId,
        dueAt: next.dueAt,
        intervalDays: next.intervalDays,
        lastReviewedAt: null,
        source: "confidence"
      });
    } catch (error) {
      saved = null;
    } finally {
      state.saving = false;
      setScheduleBusy(button, false);
    }
    if (!saved) {
      setStatus("El store rechazó la primera revisión: no se guardó la fecha. Revisa los datos e inténtalo de nuevo.", true);
      return;
    }
    var dueLabel = formatDayKey(next.dueDate) || formatDayKey(next.dueAt);
    state.focus = { kind: "scheduled", sheetId: sheetId };
    renderContent();
    setStatus('Primera revisión programada: «' + title + '» el ' + (dueLabel || "próximo día") +
      ' (' + next.intervalDays + ' ' + plural(next.intervalDays, 'día', 'días') +
      ', según tu confianza «' + CONFIDENCE_LABELS[confidence] + '»).', false);
  }

  function retry() {
    if (state.saving) return;
    state.token += 1;
    state.model = null;
    showLoading();
    setStatus("", false);
    load(state.token);
  }

  /* ------------------------------------------------------------------ */
  /* Eventos                                                            */
  /* ------------------------------------------------------------------ */

  function onSectionClick(event) {
    var target = event.target && typeof event.target.closest === "function"
      ? event.target.closest("[data-plan-action]")
      : null;
    if (!target || !state.section || !state.section.contains(target)) return;
    var action = target.getAttribute("data-plan-action");
    if (action === "retry") {
      event.preventDefault();
      retry();
      return;
    }
    if (action === "review") {
      event.preventDefault();
      rate(target);
      return;
    }
    if (action === "schedule") {
      event.preventDefault();
      scheduleFirst(target);
      return;
    }
    /* `open` y `declare` son enlaces normales con data-nav. */
  }

  function bindEvents() {
    unbindEvents();
    state.onStore = function () {
      if (state.saving) return;
      scheduleRefresh();
    };
    if (typeof root.addEventListener === "function") {
      root.addEventListener("store:change", state.onStore);
      root.addEventListener("confidence:changed", state.onStore);
    }
    if (state.section) {
      state.onClick = onSectionClick;
      state.section.addEventListener("click", state.onClick);
    }
  }

  function unbindEvents() {
    if (typeof root.removeEventListener === "function" && state.onStore) {
      root.removeEventListener("store:change", state.onStore);
      root.removeEventListener("confidence:changed", state.onStore);
    }
    state.onStore = null;
    if (state.section && state.onClick) {
      state.section.removeEventListener("click", state.onClick);
    }
    state.onClick = null;
  }

  /* ------------------------------------------------------------------ */
  /* Módulo                                                              */
  /* ------------------------------------------------------------------ */

  function render(ctx) {
    return '<section class="plan-page plan-page--review" data-plan-view="' + VIEW + '" aria-labelledby="' + TITLE_ID + '">' +
      headerHTML() +
      '<div class="plan-review-body" data-plan-body>' +
        '<p class="plan-review-status" data-plan-review-status role="status" aria-live="polite" aria-atomic="true"></p>' +
        '<div class="plan-review-content" data-plan-review-content>' + loadingHTML() + '</div>' +
      '</div>' +
    '</section>';
  }

  function mount(ctx) {
    var section = ctx && ctx.root && typeof ctx.root.querySelector === "function"
      ? ctx.root.querySelector('section[data-plan-view="' + VIEW + '"]')
      : null;
    if (!section && root.document) section = root.document.querySelector('section[data-plan-view="' + VIEW + '"]');
    if (!section) return;
    if (state.debounce) {
      root.clearTimeout(state.debounce);
      state.debounce = 0;
    }
    state.section = section;
    state.content = section.querySelector("[data-plan-review-content]");
    state.model = null;
    state.rows = [];
    state.candidates = [];
    state.saving = false;
    state.focus = null;
    state.token += 1;
    bindEvents();
    showLoading();
    load(state.token);
  }

  function unmount() {
    state.token += 1;
    if (state.debounce) {
      root.clearTimeout(state.debounce);
      state.debounce = 0;
    }
    unbindEvents();
    state.section = null;
    state.content = null;
    state.model = null;
    state.rows = [];
    state.candidates = [];
    state.saving = false;
    state.focus = null;
  }

  var moduleDefinition = {
    id: MODULE_ID,
    routes: [{
      path: ROUTE_PATH,
      title: "Repaso de fichas",
      restoreScroll: true,
      render: function (ctx) { return render(ctx); },
      mount: function (ctx) { mount(ctx); },
      unmount: function () { unmount(); }
    }]
  };

  var api = {
    version: VERSION,
    id: MODULE_ID,
    route: "#/" + ROUTE_PATH,
    moduleDefinition: moduleDefinition,
    render: render,
    mount: mount,
    unmount: unmount,
    register: function (scope) {
      if (api.__registered) return false;
      /* `scope` puede ser StudyApp o el propio window (como en el arranque):
         se resuelve siempre al objeto que expone registerModule. */
      var app = scope || null;
      if (app && typeof app.registerModule !== "function" && app.StudyApp && typeof app.StudyApp.registerModule === "function") {
        app = app.StudyApp;
      }
      if (!app || typeof app.registerModule !== "function") app = root.StudyApp;
      if (!app || typeof app.registerModule !== "function") return false;
      try {
        app.registerModule(moduleDefinition);
        api.__registered = true;
        return true;
      } catch (error) {
        if (root.console && typeof root.console.warn === "function") {
          root.console.warn("StudyPlanReview: no se pudo registrar la ruta", error);
        }
        return false;
      }
    },
    __registered: false,
    _private: { priorReviewCount: priorReviewCount, buildRows: buildRows }
  };

  if (root) root.StudyPlanReview = api;
  if (root && root.document) {
    if (!api.register(root)) {
      var attempts = 0;
      (function waitForApp() {
        if (api.__registered || attempts > 40) return;
        attempts += 1;
        if (api.register(root)) return;
        root.setTimeout(waitForApp, 50);
      })();
    }
  }

  /* Exportación para pruebas de Node sin navegador (no registra rutas). */
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
