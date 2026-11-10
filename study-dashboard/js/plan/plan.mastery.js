/* SERUMS STUDY — Mapa de dominio (#/dominio, Fase 2)
   Módulo `plan-mastery`: vista operativa del dominio por área y categoría.

   Reglas del módulo (docs/CONTRATOS-FASE2.md §2, §4.3):
   · La página se pinta al instante con un esqueleto. `StudyPlanRuntime.ensureModel()`
     se llama SOLO desde `mount`, nunca al cargar el script ni desde `render`.
   · El puntaje sale de `StudyPlanModel.masteryFor(StudyPlanRuntime.input())`:
     señales reales del store, sin ceros inventados. Sin evidencia de lectura,
     confianza o tarjetas se muestra un estado vacío honesto (una lectura en 0 no
     se presenta como medición).
   · Reacciona a `store:change` y `confidence:changed` con debounce y limpia
     listeners, timers y tokens en `unmount`.
   · Todo el HTML se escapa. El CSS vive en css/plan-mastery.css bajo .plan-mastery*
     y .plan-page--mastery, sin selectores globales.

   Contrato: docs/CONTRATOS-FASE2.md §4.3 · docs/PLAN-MODELO.md §6 y §9
   © 2026 ZARCONT */
(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var MODULE_ID = "plan-mastery";
  var ROUTE_PATH = "dominio";
  var VIEW = "dominio";
  var TITLE_ID = "plan-mastery-title";
  var DEBOUNCE_MS = 180;
  var MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

  var SIGNAL_ORDER = ["lectura", "confianza", "tarjetas", "errores"];
  var SIGNAL_LABELS = {
    lectura: "la lectura de fichas",
    confianza: "la confianza declarada",
    tarjetas: "la práctica con tarjetas",
    errores: "los errores recientes"
  };
  var SIGNAL_SHORT = {
    lectura: "Lectura",
    confianza: "Confianza",
    tarjetas: "Tarjetas",
    errores: "Errores"
  };
  var BAND_LABELS = {
    solido: "Sólido",
    enProgreso: "En progreso",
    fragil: "Frágil",
    sinDatos: "Sin datos"
  };
  var BAND_HELP = {
    solido: "Puntaje de 75 o más con una cobertura de señales de al menos 50 %.",
    enProgreso: "Puntaje de 45 a 74. Con 75 o más pero cobertura menor al 50 %, tampoco se declara sólido.",
    fragil: "Puntaje por debajo de 45.",
    sinDatos: "No hay señales suficientes para calcular una banda."
  };

  var state = {
    section: null,
    body: null,
    token: 0,
    model: null,
    debounce: 0,
    onStore: null,
    onClick: null
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
  function ratio(value) {
    var n = asNumber(value);
    if (n === null) return null;
    return Math.max(0, Math.min(1, n));
  }
  function percent(value) {
    var r = ratio(value);
    return r === null ? null : Math.round(r * 100);
  }
  function percentLabel(value, fallback) {
    var p = percent(value);
    return p === null ? (fallback || "Sin datos") : p + " %";
  }
  function minutesLabel(value) {
    var rt = runtime();
    if (rt && rt.format && typeof rt.format.minutes === "function") {
      try {
        var text = rt.format.minutes(value);
        if (text) return text;
      } catch (error) { /* formato local */ }
    }
    var n = asNumber(value);
    return n === null ? "—" : Math.round(n) + " min";
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
  function joinLabels(labels) {
    var list = (labels || []).filter(Boolean);
    if (!list.length) return "";
    if (list.length === 1) return list[0];
    if (list.length === 2) return list[0] + " y " + list[1];
    return list.slice(0, -1).join(", ") + " y " + list[list.length - 1];
  }
  function bandOf(value) {
    return hasOwn(BAND_LABELS, value) ? value : "sinDatos";
  }
  function content() {
    var rt = runtime();
    if (rt && typeof rt.content === "function") {
      try { return rt.content(); } catch (error) { return null; }
    }
    return root.STUDY_CONTENT || null;
  }
  function areaInfo(id) {
    var c = content();
    if (!c || !id) return null;
    if (c.primaryAreaById && c.primaryAreaById[id]) return c.primaryAreaById[id];
    if (c.legacyAreaById && c.legacyAreaById[id]) return c.legacyAreaById[id];
    var list = Array.isArray(c.areas) ? c.areas : [];
    for (var i = 0; i < list.length; i += 1) {
      if (list[i] && list[i].id === id) return list[i];
    }
    return null;
  }
  function categoryInfo(id) {
    var c = content();
    if (!c || !id) return null;
    if (c.categoryById && c.categoryById[id]) return c.categoryById[id];
    var list = Array.isArray(c.categories) ? c.categories : [];
    for (var i = 0; i < list.length; i += 1) {
      if (list[i] && list[i].id === id) return list[i];
    }
    return null;
  }
  function areaTitle(id) {
    var info = areaInfo(id);
    if (info && typeof info.title === "string" && info.title) return info.title;
    if (id === "sin-area") return "Sin área";
    return id || "Sin área";
  }
  function areaShort(id) {
    var info = areaInfo(id);
    return info && typeof info.short === "string" ? info.short : "";
  }
  function categoryTitle(category) {
    if (category && typeof category.label === "string" && category.label) return category.label;
    if (category && category.id) {
      var info = categoryInfo(category.id);
      if (info && typeof info.title === "string" && info.title) return info.title;
      if (category.id === "sin-categoria") return "Sin categoría";
      return category.id;
    }
    return "Sin categoría";
  }
  function areaOrder(id) {
    var c = content();
    var list = c && Array.isArray(c.primaryAreas) ? c.primaryAreas : (c && Array.isArray(c.areas) ? c.areas : []);
    for (var i = 0; i < list.length; i += 1) {
      if (list[i] && list[i].id === id) return i;
    }
    return 999;
  }
  function categoryOrder(category) {
    var info = categoryInfo(category && category.id);
    return info && typeof info.order === "number" ? info.order : 999;
  }
  function uniqueEntries(list, max) {
    var seen = {};
    var output = [];
    (Array.isArray(list) ? list : []).forEach(function (entry) {
      if (!entry || typeof entry.message !== "string" || !entry.message) return;
      var key = (entry.code || "") + "|" + entry.message;
      if (seen[key]) return;
      seen[key] = true;
      output.push({ code: entry.code || "AVISO", message: entry.message });
    });
    return output.slice(0, max || 6);
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
      '<h1 class="plan-page-title" id="' + TITLE_ID + '">Mapa de dominio</h1>' +
      '<p class="plan-page-lede">Un mapa honesto de lo que ya estudiaste: puntaje por área y categoría, con la banda y la cobertura de cada señal a la vista. Donde no hay datos, lo dice; no rellena con ceros.</p>' +
      '<nav class="plan-page-links" aria-label="Otras vistas de planificación">' +
        '<a class="plan-page-link" href="#/ruta" data-nav data-plan-link="ruta">' + icon("compass", 14) + '<span>Ruta de hoy</span></a>' +
        '<a class="plan-page-link" href="#/plan" data-nav data-plan-link="plan">' + icon("calendar", 14) + '<span>Plan de estudio</span></a>' +
        '<a class="plan-page-link" href="#/repaso" data-nav data-plan-link="repaso">' + icon("rotate", 14) + '<span>Repaso de fichas</span></a>' +
      '</nav>' +
      '</header>';
  }

  function loadingHTML() {
    return '<div class="plan-mastery-skeleton" data-plan-loading role="status" aria-live="polite" aria-busy="true">' +
      '<span class="s-sr-only">Cargando el mapa de dominio…</span>' +
      '<div class="plan-mastery-skeleton-global s-skeleton"></div>' +
      '<div class="plan-mastery-skeleton-grid">' +
        '<div class="plan-mastery-skeleton-card s-skeleton"></div>' +
        '<div class="plan-mastery-skeleton-card s-skeleton"></div>' +
        '<div class="plan-mastery-skeleton-card s-skeleton"></div>' +
      '</div>' +
    '</div>';
  }

  function errorHTML(message) {
    return '<div class="plan-mastery-error" data-plan-error role="alert">' +
      '<span class="plan-mastery-error-icon" aria-hidden="true">' + icon("alert", 20) + '</span>' +
      '<div class="plan-mastery-error-copy">' +
        '<h2 class="plan-mastery-error-title">No pude cargar el mapa de dominio</h2>' +
        '<p class="plan-mastery-error-text">' + esc(message) + '</p>' +
        '<button class="s-btn s-btn--sm" type="button" data-plan-action="retry">Reintentar</button>' +
      '</div>' +
    '</div>';
  }

  function bandSpan(band) {
    var b = bandOf(band);
    return '<span class="plan-mastery-band" data-mastery-band data-band="' + b + '">' + esc(BAND_LABELS[b]) + '</span>';
  }

  function scoreMarkup(score) {
    var n = asNumber(score);
    if (n === null) {
      return '<b class="plan-mastery-score-value">—</b><span class="plan-mastery-score-unit">sin datos</span>';
    }
    return '<b class="plan-mastery-score-value">' + Math.round(n) + '</b><span class="plan-mastery-score-unit">de 100</span>';
  }

  function meterHTML(score, band, label, coverage) {
    var n = asNumber(score);
    if (n === null) {
      return '<div class="plan-mastery-meter is-empty" aria-hidden="true"></div>';
    }
    var now = Math.max(0, Math.min(100, Math.round(n)));
    var text = now + ' de 100 · ' + BAND_LABELS[bandOf(band)] + ' · cobertura ' + percentLabel(coverage);
    return '<div class="plan-mastery-meter" role="progressbar" aria-label="' + esc(label) + '"' +
      ' aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + now + '"' +
      ' aria-valuetext="' + esc(text) + '">' +
      '<span class="plan-mastery-meter-fill" style="--plan-meter:' + now + '%"></span>' +
    '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* Estado vacío y estado con señales                                   */
  /* ------------------------------------------------------------------ */

  function emptyHTML() {
    return '<section class="plan-mastery-global is-empty" data-mastery-global data-band="sinDatos" aria-labelledby="plan-mastery-global-title">' +
        '<div class="plan-mastery-global-main">' +
          '<h2 class="plan-mastery-kicker" id="plan-mastery-global-title">Puntaje global</h2>' +
          '<p class="plan-mastery-score">' + scoreMarkup(null) + '</p>' +
          bandSpan("sinDatos") +
          '<p class="plan-mastery-band-note">Todavía no hay señales con las que medir el dominio.</p>' +
        '</div>' +
        '<p class="plan-mastery-missing">Sin datos de lectura, confianza, tarjetas ni errores recientes. No convierto esa ausencia en un cero.</p>' +
      '</section>' +
      '<div class="plan-mastery-empty">' +
        '<span class="plan-mastery-empty-icon" aria-hidden="true">' + icon("target", 22) + '</span>' +
        '<div class="plan-mastery-empty-copy">' +
          '<h2 class="plan-mastery-empty-title">Todavía no hay señales de dominio</h2>' +
          '<p class="plan-mastery-empty-text">El mapa se construye con lo que ya hiciste: fichas leídas o completadas, tu confianza al terminarlas, tarjetas repasadas y errores recientes. Ahora mismo no hay ninguna de esas señales.</p>' +
          '<p class="plan-mastery-empty-note">Leer una ficha, marcar tu confianza o repasar tarjetas ya deja una señal. El puntaje aparece en cuanto exista; no muestro un 0 como si fuera una medición.</p>' +
          '<div class="plan-mastery-empty-actions">' +
            '<a class="s-btn s-btn--sm" href="#/biblioteca" data-nav>Leer una ficha</a>' +
            '<a class="s-btn s-btn--ghost s-btn--sm" href="#/ruta" data-nav>Ver la ruta de hoy</a>' +
            '<a class="s-btn s-btn--ghost s-btn--sm" href="#/plan" data-nav>Ajustar el plan</a>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function signalsHTML(global) {
    var present = global && isObject(global.signals) ? global.signals : {};
    return '<ul class="plan-mastery-signals" aria-label="Presencia de cada señal en el temario">' +
      SIGNAL_ORDER.map(function (id) {
        var value = percent(present[id]);
        var isMissing = value === null || value === 0;
        return '<li class="plan-mastery-signal' + (isMissing ? ' is-missing' : '') + '" data-signal="' + id + '">' +
          '<span class="plan-mastery-signal-name">' + esc(SIGNAL_SHORT[id]) + '</span>' +
          '<b class="plan-mastery-signal-value">' + (isMissing ? 'Sin datos' : value + ' %') + '</b>' +
        '</li>';
      }).join("") +
    '</ul>';
  }

  function missingExplanation(mastery) {
    var missing = (mastery && Array.isArray(mastery.missing) ? mastery.missing : [])
      .filter(function (id) { return hasOwn(SIGNAL_LABELS, id); });
    var global = mastery && mastery.global ? mastery.global : {};
    var coverage = percent(global.coverage);
    if (missing.length) {
      return 'Sin datos de ' + joinLabels(missing.map(function (id) { return SIGNAL_LABELS[id]; })) +
        ' en ninguna categoría. El puntaje se calcula solo con las señales presentes y no se castiga la ausencia.';
    }
    if (coverage !== null && coverage < 100) {
      return 'Las cuatro señales existen, pero no cubren todo el temario. La cobertura indica cuánto peso real tienen.';
    }
    return 'Las cuatro señales están presentes en todo el temario.';
  }

  function globalHTML(mastery) {
    var global = mastery.global || {};
    var sheets = asNumber(global.sheets);
    var withSignal = sheets !== null && sheets > 0 ? Math.round((ratio(global.sheetCoverage) || 0) * sheets) : null;
    var sheetsMeta = withSignal !== null
      ? withSignal + ' de ' + sheets + ' ' + plural(sheets, 'ficha', 'fichas') + ' con algún dato'
      : 'Sin conteo de fichas.';
    var minutes = asNumber(global.minutes);
    return '<section class="plan-mastery-global" data-mastery-global data-band="' + bandOf(global.band) + '" aria-labelledby="plan-mastery-global-title">' +
      '<div class="plan-mastery-global-main">' +
        '<h2 class="plan-mastery-kicker" id="plan-mastery-global-title">Puntaje global</h2>' +
        '<p class="plan-mastery-score">' + scoreMarkup(global.score) + '</p>' +
        bandSpan(global.band) +
        '<p class="plan-mastery-band-note">' + esc(BAND_HELP[bandOf(global.band)]) + '</p>' +
      '</div>' +
      '<div class="plan-mastery-global-aside">' +
        '<div class="plan-mastery-coverage">' +
          '<div class="plan-mastery-coverage-item">' +
            '<span class="plan-mastery-coverage-label">Cobertura de señales</span>' +
            '<span class="plan-mastery-coverage-value">' + esc(percentLabel(global.coverage)) + '</span>' +
            '<p>Peso de las señales disponibles sobre el total posible.</p>' +
          '</div>' +
          '<div class="plan-mastery-coverage-item">' +
            '<span class="plan-mastery-coverage-label">Fichas con algún dato</span>' +
            '<span class="plan-mastery-coverage-value">' + esc(percentLabel(global.sheetCoverage)) + '</span>' +
            '<p>' + esc(sheetsMeta) + (minutes !== null && minutes > 0 ? ' · ' + esc(minutesLabel(minutes)) + ' de temario' : '') + '</p>' +
          '</div>' +
        '</div>' +
        signalsHTML(global) +
        '<p class="plan-mastery-missing">' + esc(missingExplanation(mastery)) + '</p>' +
      '</div>' +
    '</section>';
  }

  function weakestHTML(mastery) {
    var weakest = mastery.weakest;
    if (weakest && asNumber(weakest.score) !== null) {
      return '<div class="plan-mastery-weakest" data-mastery-weakest>' +
        '<span class="plan-mastery-weakest-icon" aria-hidden="true">' + icon("target", 18) + '</span>' +
        '<div class="plan-mastery-weakest-copy">' +
          '<span class="plan-mastery-weakest-kicker">Categoría más floja</span>' +
          '<p class="plan-mastery-weakest-title">' + esc(weakest.label || categoryTitle({ id: weakest.id })) + '</p>' +
          '<p class="plan-mastery-weakest-meta">Puntaje ' + Math.round(asNumber(weakest.score)) + ' de 100 · ' +
            esc(BAND_LABELS[bandOf(weakest.band)]) + ' · cobertura ' + esc(percentLabel(weakest.coverage)) + '.</p>' +
        '</div>' +
      '</div>';
    }
    return '<div class="plan-mastery-weakest is-empty">' +
      '<span class="plan-mastery-weakest-icon" aria-hidden="true">' + icon("info", 18) + '</span>' +
      '<div class="plan-mastery-weakest-copy">' +
        '<span class="plan-mastery-weakest-kicker">Punto más flojo</span>' +
        '<p class="plan-mastery-weakest-title">Aún no se puede señalar la más floja.</p>' +
        '<p class="plan-mastery-weakest-meta">Ninguna categoría alcanza el 50 % de cobertura de señales. Cuando la tenga, la marco aquí.</p>' +
      '</div>' +
    '</div>';
  }

  function areaMeta(area) {
    var parts = ['Cobertura ' + percentLabel(area.coverage)];
    var sheets = asNumber(area.sheets);
    var withSignal = asNumber(area.sheetsWithSignal);
    if (sheets !== null && sheets > 0) {
      parts.push((withSignal === null ? 0 : withSignal) + ' de ' + sheets + ' ' + plural(sheets, 'ficha', 'fichas') + ' con algún dato');
    }
    var minutes = asNumber(area.minutes);
    if (minutes !== null && minutes > 0) parts.push(minutesLabel(minutes) + ' de temario');
    return parts.join(' · ');
  }

  function areaMissing(area) {
    var missing = (Array.isArray(area.missing) ? area.missing : []).filter(function (id) { return hasOwn(SIGNAL_LABELS, id); });
    if (missing.length) {
      return 'Faltan señales en esta área: ' + joinLabels(missing.map(function (id) { return SIGNAL_SHORT[id]; })) + '.';
    }
    return 'Las cuatro señales están presentes en el área.';
  }

  function categoryMeta(category) {
    var parts = ['Cobertura ' + percentLabel(category.coverage)];
    var sheets = category.sheets && isObject(category.sheets) ? category.sheets : {};
    var total = asNumber(sheets.total);
    var withSignal = asNumber(sheets.withAnySignal);
    if (total !== null && total > 0) {
      parts.push((withSignal === null ? 0 : withSignal) + ' de ' + total + ' ' + plural(total, 'ficha', 'fichas') + ' con algún dato');
    }
    var accuracy = asNumber(category.accuracy);
    if (accuracy !== null) parts.push('Acierto ' + Math.round(accuracy) + ' %');
    return parts.join(' · ');
  }

  function categoryMissingText(category) {
    var missing = (Array.isArray(category.missing) ? category.missing : []).filter(function (id) { return hasOwn(SIGNAL_LABELS, id); });
    if (!missing.length) return '';
    return 'Faltan: ' + joinLabels(missing.map(function (id) { return SIGNAL_SHORT[id]; })) + '.';
  }

  function categoryHTML(category, areaName) {
    var band = bandOf(category.band);
    var score = asNumber(category.score);
    var title = categoryTitle(category);
    var scoreHTML = score === null
      ? '<span class="plan-mastery-category-score is-empty">—</span>'
      : '<span class="plan-mastery-category-score">' + Math.round(score) + '<small>/100</small></span>';
    var missingText = categoryMissingText(category);
    return '<li class="plan-mastery-category" data-mastery-category data-category-id="' + esc(category.id || "sin-categoria") + '" data-band="' + band + '">' +
      '<div class="plan-mastery-category-head">' +
        '<h4 class="plan-mastery-category-title">' + esc(title) + '</h4>' +
        scoreHTML +
        bandSpan(category.band) +
      '</div>' +
      meterHTML(score, band, 'Puntaje de la categoría «' + title + '» en ' + areaName, category.coverage) +
      '<p class="plan-mastery-category-meta">' + esc(categoryMeta(category)) + '</p>' +
      (missingText ? '<p class="plan-mastery-category-missing">' + esc(missingText) + '</p>' : '') +
    '</li>';
  }

  function areaHTML(area, index, categoryMap) {
    var band = bandOf(area.band);
    var score = asNumber(area.score);
    var title = areaTitle(area.id);
    var short = areaShort(area.id);
    var headingId = 'plan-mastery-area-title-' + index;
    var scoreHTML = score === null
      ? '<span class="plan-mastery-area-score-value is-empty">—</span><span class="plan-mastery-area-score-unit">sin datos</span>'
      : '<span class="plan-mastery-area-score-value">' + Math.round(score) + '</span><span class="plan-mastery-area-score-unit">de 100</span>';
    var categoryIds = (Array.isArray(area.categories) ? area.categories : []).slice();
    categoryIds.sort(function (a, b) {
      var oa = categoryOrder({ id: a });
      var ob = categoryOrder({ id: b });
      if (oa !== ob) return oa - ob;
      return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0;
    });
    return '<article class="plan-mastery-area" data-mastery-area data-area-id="' + esc(area.id || "sin-area") + '" data-band="' + band + '" aria-labelledby="' + headingId + '">' +
      '<header class="plan-mastery-area-head">' +
        '<div class="plan-mastery-area-heading">' +
          '<span class="plan-mastery-area-kicker">Área' + (short ? ' · ' + esc(short) : '') + '</span>' +
          '<h3 class="plan-mastery-area-title" id="' + headingId + '">' + esc(title) + '</h3>' +
        '</div>' +
        '<div class="plan-mastery-area-score">' + scoreHTML + bandSpan(area.band) + '</div>' +
      '</header>' +
      meterHTML(score, band, 'Puntaje del área «' + title + '»', area.coverage) +
      '<p class="plan-mastery-area-meta">' + esc(areaMeta(area)) + '</p>' +
      '<p class="plan-mastery-area-missing">' + esc(areaMissing(area)) + '</p>' +
      '<ul class="plan-mastery-categories" aria-label="Categorías del área «' + esc(title) + '»">' +
        categoryIds.map(function (categoryId) {
          var category = categoryMap[categoryId];
          return category ? categoryHTML(category, title) : '';
        }).join('') +
      '</ul>' +
    '</article>';
  }

  function areasHTML(mastery) {
    var categoryMap = {};
    (Array.isArray(mastery.categories) ? mastery.categories : []).forEach(function (category) {
      if (category && category.id) categoryMap[category.id] = category;
    });
    var areas = (Array.isArray(mastery.areas) ? mastery.areas : []).slice();
    areas.sort(function (a, b) {
      var oa = areaOrder(a.id);
      var ob = areaOrder(b.id);
      if (oa !== ob) return oa - ob;
      return String(a.id) < String(b.id) ? -1 : String(a.id) > String(b.id) ? 1 : 0;
    });
    return '<h2 class="plan-mastery-section-title">Áreas y categorías</h2>' +
      '<div class="plan-mastery-areas">' +
        areas.map(function (area, index) {
          return areaHTML(area, index, categoryMap);
        }).join('') +
      '</div>';
  }

  function notesHTML(mastery) {
    var assumptions = uniqueEntries(mastery.assumptions, 6);
    var warnings = uniqueEntries(mastery.warnings, 6);
    return '<details class="plan-mastery-notes">' +
      '<summary class="plan-mastery-notes-summary">' + icon("info", 14) + '<span>Cómo se calcula y qué falta</span></summary>' +
      '<div class="plan-mastery-notes-body">' +
        '<p class="plan-mastery-notes-formula">Puntaje = media ponderada de lectura (30 %), confianza (30 %), tarjetas (25 %) y errores recientes (15 %), solo con las señales presentes. Bandas: frágil &lt; 45; en progreso 45–74, o 75 o más con cobertura &lt; 50 %; sólido 75 o más con cobertura ≥ 50 %.</p>' +
        (assumptions.length ? '<div class="plan-mastery-notes-block">' +
          '<span class="plan-mastery-notes-label">Supuestos del cálculo</span>' +
          '<ul>' + assumptions.map(function (entry) {
            return '<li><b>' + esc(entry.code) + '</b> ' + esc(entry.message) + '</li>';
          }).join('') + '</ul>' +
        '</div>' : '') +
        (warnings.length ? '<div class="plan-mastery-notes-block">' +
          '<span class="plan-mastery-notes-label">Avisos del cálculo</span>' +
          '<ul>' + warnings.map(function (entry) {
            return '<li><b>' + esc(entry.code) + '</b> ' + esc(entry.message) + '</li>';
          }).join('') + '</ul>' +
        '</div>' : '') +
      '</div>' +
    '</details>';
  }

  function measuredHTML(mastery) {
    return globalHTML(mastery) + weakestHTML(mastery) + areasHTML(mastery) + notesHTML(mastery);
  }

  /* ------------------------------------------------------------------ */
  /* Evidencia real: no presentar un 0 sin actividad como medición       */
  /* ------------------------------------------------------------------ */

  function hasSheetEvidence(sheets, sheetIds) {
    if (Array.isArray(sheets)) {
      return sheets.some(function (entry) {
        return isObject(entry) && (!sheetIds || !entry.id || sheetIds[entry.id]) &&
          (!!entry.completedAt || !!entry.viewedAt || asNumber(entry.readSeconds) > 0);
      });
    }
    if (!isObject(sheets)) return false;
    var ids = Object.keys(sheets);
    for (var i = 0; i < ids.length; i += 1) {
      if (sheetIds && !sheetIds[ids[i]]) continue;
      var record = sheets[ids[i]];
      if (!isObject(record)) continue;
      if (record.completedAt || record.viewedAt) return true;
      if ((asNumber(record.readSeconds) || 0) > 0) return true;
    }
    return false;
  }

  function hasCardEvidence(cards, cardSheet, sheetIds) {
    function linkedToSheet(cardId, entry) {
      var sheetId = cardSheet && cardSheet[cardId] ? cardSheet[cardId] : (entry && entry.sheetId ? entry.sheetId : null);
      return !sheetIds || (sheetId && sheetIds[sheetId]);
    }
    if (Array.isArray(cards)) {
      return cards.some(function (entry) {
        if (!isObject(entry)) return false;
        var id = typeof entry.id === "string" ? entry.id : "";
        if (!linkedToSheet(id, entry)) return false;
        return asNumber(entry.reviews) > 0 || asNumber(entry.correct) > 0 || asNumber(entry.wrong) > 0;
      });
    }
    if (!isObject(cards)) return false;
    var ids = Object.keys(cards);
    for (var i = 0; i < ids.length; i += 1) {
      var record = cards[ids[i]];
      if (!isObject(record)) continue;
      if (!linkedToSheet(ids[i], record)) continue;
      if ((asNumber(record.reviews) || 0) > 0) return true;
      if ((asNumber(record.correct) || 0) > 0) return true;
      if ((asNumber(record.wrong) || 0) > 0) return true;
    }
    return false;
  }

  function hasEvidence(input) {
    var states = input && isObject(input.states) ? input.states : {};
    var sheetIds = {};
    (Array.isArray(input && input.sheets) ? input.sheets : []).forEach(function (sheet) {
      if (sheet && typeof sheet.id === "string") sheetIds[sheet.id] = true;
    });
    if (hasSheetEvidence(states.sheets, sheetIds)) return true;
    if (isObject(states.confidence)) {
      var confidenceIds = Object.keys(states.confidence);
      for (var i = 0; i < confidenceIds.length; i += 1) {
        if (!sheetIds[confidenceIds[i]]) continue;
        if (["solid", "partial", "weak"].indexOf(states.confidence[confidenceIds[i]]) !== -1) return true;
      }
    }
    if (hasCardEvidence(states.cards, input && input.cardSheet, sheetIds)) return true;
    /* `recall` sin práctica de tarjetas no cuenta para el modelo de dominio:
       no lo uso como evidencia para no presentar un puntaje de 0 falso. */
    return false;
  }

  /* ------------------------------------------------------------------ */
  /* Carga, pintura y eventos                                            */
  /* ------------------------------------------------------------------ */

  function isCurrent(token) {
    if (token !== state.token || !state.section) return false;
    if (typeof state.section.isConnected === "boolean") return state.section.isConnected;
    return !!(root.document && root.document.documentElement && root.document.documentElement.contains(state.section));
  }

  function showLoading() {
    if (state.body) state.body.innerHTML = loadingHTML();
  }
  function showError(message) {
    if (state.body) state.body.innerHTML = errorHTML(message);
  }

  function paint(token) {
    if (!isCurrent(token)) return;
    var rt = runtime();
    var model = state.model;
    if (!rt || !model || typeof model.masteryFor !== "function") {
      showError("El modelo de planificación no está disponible en esta página.");
      return;
    }
    var input;
    try {
      input = rt.input();
    } catch (error) {
      showError("No pude leer tus datos para calcular el dominio.");
      return;
    }
    var mastery;
    try {
      mastery = model.masteryFor(input);
    } catch (error) {
      showError("No pude calcular el mapa de dominio con los datos disponibles.");
      return;
    }
    if (!mastery || typeof mastery !== "object") {
      showError("El modelo de dominio no devolvió un resultado utilizable.");
      return;
    }
    if (rt && typeof rt.sheets === "function" && rt.sheets().length === 0) {
      showError("No pude leer las fichas del temario; sin fichas no hay mapa de dominio.");
      return;
    }
    if (!hasEvidence(input) || mastery.status === "sinDatos" || !mastery.global || asNumber(mastery.global.score) === null) {
      if (state.body) state.body.innerHTML = emptyHTML();
      return;
    }
    var detailsOpen = false;
    var detailsFocus = false;
    if (state.body) {
      var currentDetails = state.body.querySelector(".plan-mastery-notes");
      detailsOpen = !!(currentDetails && currentDetails.open);
      detailsFocus = !!(currentDetails && root.document && root.document.activeElement === currentDetails.querySelector("summary"));
    }
    if (!state.body) return;
    state.body.innerHTML = measuredHTML(mastery);
    if (detailsOpen) {
      var nextDetails = state.body.querySelector(".plan-mastery-notes");
      if (nextDetails) {
        nextDetails.open = true;
        if (detailsFocus && typeof nextDetails.querySelector === "function") {
          var summary = nextDetails.querySelector("summary");
          if (summary && typeof summary.focus === "function") summary.focus({ preventScroll: true });
        }
      }
    }
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
      paint(token);
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
      paint(state.token);
    }, DEBOUNCE_MS);
  }

  function bindEvents() {
    unbindEvents();
    state.onStore = function () { scheduleRefresh(); };
    if (typeof root.addEventListener === "function") {
      root.addEventListener("store:change", state.onStore);
      root.addEventListener("confidence:changed", state.onStore);
    }
    if (state.section) {
      state.onClick = function (event) {
        var target = event.target && typeof event.target.closest === "function"
          ? event.target.closest('[data-plan-action="retry"]')
          : null;
        if (!target || !state.section || !state.section.contains(target)) return;
        event.preventDefault();
        state.token += 1;
        state.model = null;
        showLoading();
        load(state.token);
      };
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
    return '<section class="plan-page plan-page--mastery" data-plan-view="' + VIEW + '" aria-labelledby="' + TITLE_ID + '">' +
      headerHTML() +
      '<div class="plan-mastery-body" data-plan-body>' + loadingHTML() + '</div>' +
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
    state.body = section.querySelector("[data-plan-body]");
    state.model = null;
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
    state.body = null;
    state.model = null;
  }

  var moduleDefinition = {
    id: MODULE_ID,
    routes: [{
      path: ROUTE_PATH,
      title: "Mapa de dominio",
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
          root.console.warn("StudyPlanMastery: no se pudo registrar la ruta", error);
        }
        return false;
      }
    },
    __registered: false
  };

  if (root) root.StudyPlanMastery = api;
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
