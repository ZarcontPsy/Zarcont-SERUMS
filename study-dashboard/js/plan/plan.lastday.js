/* SERUMS STUDY — Hoja de último día (#/ultimo-dia, Fase 3)
   Módulo `plan-lastday`: una hoja compacta y printable con datos, definiciones
   y avisos reales del temario para leer en los últimos minutos.

   Reglas del módulo:
   · Los derivados se cargan SOLO al montar la vista, con StudyReference.load.
   · No crea ni modifica el plan: solo lee StudyStore.plan.get() para mostrar
     la fecha de examen y los días restantes.
   · No toca Study Flashcards ni escribe estado.
   · Print con window.print(); la hoja usa @media print para ocultar la app y
     los paneles (selectores globales SOLO dentro de ese bloque, ver el CSS).
   · Todo el HTML se escapa; el CSS vive en css/plan-lastday.css bajo `.plan-*`.

   Contrato: study-dashboard/docs/CONTRATOS-FASE3.md §4.5
   Uso:
     navegador  <script src="js/plan/plan.lastday.js"></script>
                -> window.StudyPlanLastDay (se registra solo)
     Node       require("./plan.lastday.js")  (funciones puras, sin DOM)

   © 2026 ZARCONT */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root);
  } else {
    root.StudyPlanLastDay = factory(root);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var MODULE_ID = "plan-lastday";
  var VIEW = "ultimo-dia";
  var ROUTE_PATH = "ultimo-dia";
  var TITLE = "Hoja de último día";
  var TITLE_ID = "plan-lastday-title";
  var KIND_ORDER = ["facts", "glossary", "warnings"];
  var KIND_TITLE = {
    facts: "Datos para memorizar",
    glossary: "Definiciones",
    warnings: "Avisos y distinciones"
  };
  var KIND_EMPTY = {
    facts: "No hay datos de esta área.",
    glossary: "No hay definiciones de esta área.",
    warnings: "No hay avisos de esta área."
  };
  /* Límites pensados para que los tres bloques quepan en una hoja A4: con
     3 columnas de ~226 px, 18 datos ya ocupaban más de una página. */
  var LIMITS = { facts: 12, glossary: 8, warnings: 8 };
  var CLIP = { facts: 130, glossary: 150, warnings: 150 };
  var MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  var ZONE_OFFSET_MINUTES = -300;

  var page = {
    ctx: null,
    section: null,
    body: null,
    stage: null,
    loading: null,
    error: null,
    clickHandler: null,
    changeHandler: null,
    token: 0,
    phase: "idle",
    entries: null,
    areaId: "",
    plan: null
  };

  /* ------------------------------------------------------------------ */
  /* Host y utilidades                                                  */
  /* ------------------------------------------------------------------ */

  function reference() {
    return root && root.StudyReference ? root.StudyReference : null;
  }
  function documentRoot() {
    return root && root.document ? root.document : null;
  }
  function hasDom() {
    return !!documentRoot();
  }
  function store() {
    return root && root.StudyStore ? root.StudyStore : null;
  }
  function esc(value) {
    var R = reference();
    if (R && typeof R.escape === "function") return R.escape(value);
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  function icon(name, size) {
    var R = reference();
    return R && typeof R.icon === "function" ? R.icon(name, size || 15) : "";
  }
  function plural(n, one, many) {
    var R = reference();
    if (R && typeof R.plural === "function") return R.plural(n, one, many);
    return Number(n) === 1 ? one : (many || one + "s");
  }
  function clip(value, max) {
    var R = reference();
    if (R && typeof R.clip === "function") return R.clip(value, max);
    var text = String(value == null ? "" : value).replace(/\s+/g, " ").trim();
    return text.length > max ? text.slice(0, max - 1) + "…" : text;
  }

  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }
  function todayKey() {
    return new Date(Date.now() + ZONE_OFFSET_MINUTES * 60000).toISOString().slice(0, 10);
  }
  function parseDayKey(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value == null ? "" : value));
    if (!match) return null;
    var y = Number(match[1]);
    var m = Number(match[2]);
    var d = Number(match[3]);
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    return Date.UTC(y, m - 1, d) / 86400000;
  }
  function dayLabel(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value == null ? "" : value));
    if (!match) return "";
    return Number(match[3]) + " " + MONTHS[Number(match[2]) - 1] + " " + match[1];
  }

  /* Fecha de examen y días restantes: solo lectura del plan, nunca escritura. */
  function examInfo(plan, nowKey) {
    var today = parseDayKey(nowKey || todayKey());
    var examDate = plan && typeof plan.examDate === "string" ? plan.examDate : null;
    if (!examDate) {
      return {
        state: plan ? "sinFecha" : "sinPlan",
        dateKey: null,
        dateLabel: "",
        days: null,
        hasPlan: !!plan
      };
    }
    var examDay = parseDayKey(examDate);
    if (examDay === null) {
      return { state: "sinFecha", dateKey: null, dateLabel: "", days: null, hasPlan: !!plan };
    }
    var days = examDay - today;
    return {
      state: days < 0 ? "pasado" : days === 0 ? "hoy" : "programado",
      dateKey: examDate,
      dateLabel: dayLabel(examDate),
      days: days,
      hasPlan: !!plan
    };
  }

  /* ------------------------------------------------------------------ */
  /* Selección del contenido                                            */
  /* ------------------------------------------------------------------ */

  function byArea(list, areaId) {
    var source = Array.isArray(list) ? list : [];
    return areaId ? source.filter(function (entry) { return entry && entry.areaId === areaId; }) : source;
  }

  /* Reparte la selección entre áreas (round-robin) para que la hoja no salga
     toda del mismo bloque del temario. Conserva el orden de entrada. */
  function spreadByArea(list, max) {
    var groups = {};
    var order = [];
    (Array.isArray(list) ? list : []).forEach(function (entry) {
      if (!entry) return;
      var key = entry.areaId || "sin-area";
      if (!groups[key]) {
        groups[key] = [];
        order.push(key);
      }
      groups[key].push(entry);
    });
    var out = [];
    var index = 0;
    while (out.length < max) {
      var added = false;
      for (var g = 0; g < order.length && out.length < max; g += 1) {
        var bucket = groups[order[g]];
        if (index < bucket.length) {
          out.push(bucket[index]);
          added = true;
        }
      }
      if (!added) break;
      index += 1;
    }
    return out;
  }

  function buildSheet(entries, options) {
    var opts = options || {};
    var areaId = typeof opts.areaId === "string" ? opts.areaId : "";
    var sheet = {};
    KIND_ORDER.forEach(function (kind) {
      var list = byArea(entries && entries[kind], areaId);
      sheet[kind] = {
        kind: kind,
        items: pickForSheet(kind, list, LIMITS[kind]),
        total: list.length,
        limit: LIMITS[kind]
      };
    });
    return sheet;
  }

  /* En los avisos se repiten títulos («No confundir»); la hoja prefiere títulos
     distintos y solo repite cuando no hay más material. */
  function pickForSheet(kind, list, max) {
    if (kind !== "warnings") return spreadByArea(list, max);
    var seen = {};
    var unique = [];
    var rest = [];
    list.forEach(function (entry) {
      var key = String(entry && entry.title ? entry.title : "").toLowerCase().replace(/\s+/g, " ").trim();
      if (!key || seen[key]) {
        rest.push(entry);
        return;
      }
      seen[key] = true;
      unique.push(entry);
    });
    var picked = spreadByArea(unique, max);
    if (picked.length < max) picked = picked.concat(spreadByArea(rest, max - picked.length));
    return picked;
  }

  /* ------------------------------------------------------------------ */
  /* HTML                                                               */
  /* ------------------------------------------------------------------ */

  function skeletonHTML() {
    return '<div class="plan-lastday-loading" data-lastday-loading role="status">' +
      '<span class="plan-lastday-loading-text">Preparando la hoja con datos, definiciones y avisos…</span>' +
      '<span class="plan-lastday-skeleton" aria-hidden="true"><i></i><i></i><i></i></span>' +
      '</div>';
  }

  function errorHTML(message) {
    return '<p class="plan-lastday-error-text">' + esc(message) + '</p>' +
      '<div class="plan-lastday-error-actions">' +
        '<button class="s-btn s-btn--sm" type="button" data-lastday-retry>Volver a intentar</button>' +
        '<a class="s-btn s-btn--ghost s-btn--sm" href="#/" data-nav>Volver al panel</a>' +
      '</div>';
  }

  function examLine(exam) {
    if (exam.state === "programado") {
      return 'Examen: <b>' + esc(exam.dateLabel) + '</b> · faltan <b>' + exam.days + '</b> ' + plural(exam.days, "día", "días") + '.';
    }
    if (exam.state === "hoy") return 'El examen es <b>hoy</b> (' + esc(exam.dateLabel) + ').';
    if (exam.state === "pasado") return 'La fecha de examen (' + esc(exam.dateLabel) + ') ya pasó.';
    if (exam.state === "sinFecha") return 'Tu plan no tiene fecha de examen. <a href="#/plan" data-nav>Fijarla en el plan</a>.';
    return 'Sin plan guardado. <a href="#/plan" data-nav>Configurar fecha de examen</a>.';
  }

  function heroHTML(exam, areaId) {
    var R = reference();
    var areas = R && typeof R.areaOptions === "function" ? R.areaOptions() : [];
    return '<header class="plan-lastday-hero">' +
      '<a class="plan-lastday-back" href="#/" data-nav>' + icon("arrowLeft", 14) + '<span>Panel</span></a>' +
      '<span class="plan-lastday-kicker"><span class="plan-lastday-dot" aria-hidden="true"></span>Última hora · Hoja</span>' +
      '<h1 class="plan-lastday-title" id="' + TITLE_ID + '">' + TITLE + '</h1>' +
      '<p class="plan-lastday-lede">Lo esencial del temario en una hoja: datos para memorizar, definiciones y avisos. Lee, subraya y entra al examen.</p>' +
      '<p class="plan-lastday-exam" data-lastday-exam>' + examLine(exam) + '</p>' +
      '<div class="plan-lastday-toolbar">' +
        (areas.length
          ? '<label class="plan-lastday-field" for="plan-lastday-area"><span>Área</span>' +
            '<select id="plan-lastday-area" data-lastday-area>' +
              '<option value="">Todas las áreas</option>' +
              areas.map(function (area) {
                return '<option value="' + esc(area.id) + '"' + (area.id === areaId ? " selected" : "") + '>' +
                  esc(area.short || area.title || area.id) + '</option>';
              }).join("") +
            '</select></label>'
          : "") +
        '<button class="s-btn s-btn--ghost" type="button" data-lastday-print>' + icon("bookmark", 15) + ' Imprimir hoja</button>' +
      '</div>' +
      '</header>';
  }

  function counterText(block) {
    if (!block.total) return "0";
    return block.items.length + " de " + block.total;
  }

  function factsHTML(block) {
    var body = block.items.length
      ? '<ul class="plan-lastday-facts">' + block.items.map(function (entry) {
          var headers = Array.isArray(entry.headers) && entry.headers.length ? entry.headers.join(" · ") : "";
          return '<li class="plan-lastday-fact">' +
            '<b class="plan-lastday-term">' + esc(entry.term || "") + '</b>' +
            '<span class="plan-lastday-detail">' + esc(clip(entry.detail, CLIP.facts)) + '</span>' +
            (headers ? '<small class="plan-lastday-meta">' + esc(clip(headers, 70)) + '</small>' : "") +
            '</li>';
        }).join("") + '</ul>'
      : '<p class="plan-lastday-empty">' + esc(KIND_EMPTY.facts) + '</p>';
    return '<section class="plan-lastday-block" data-lastday-facts aria-labelledby="plan-lastday-facts-title">' +
      '<header class="plan-lastday-block-head">' +
        '<h2 class="plan-lastday-h2" id="plan-lastday-facts-title">' + esc(KIND_TITLE.facts) + '</h2>' +
        '<span class="plan-lastday-count">' + esc(counterText(block)) + '</span>' +
      '</header>' + body +
      '</section>';
  }

  function glossaryHTML(block) {
    var body = block.items.length
      ? '<dl class="plan-lastday-glossary">' + block.items.map(function (entry) {
          return '<div class="plan-lastday-def">' +
            '<dt class="plan-lastday-term">' + esc(entry.term || "") + '</dt>' +
            '<dd class="plan-lastday-detail">' + esc(clip(entry.definition, CLIP.glossary)) + '</dd>' +
            '</div>';
        }).join("") + '</dl>'
      : '<p class="plan-lastday-empty">' + esc(KIND_EMPTY.glossary) + '</p>';
    return '<section class="plan-lastday-block" data-lastday-glossary aria-labelledby="plan-lastday-glossary-title">' +
      '<header class="plan-lastday-block-head">' +
        '<h2 class="plan-lastday-h2" id="plan-lastday-glossary-title">' + esc(KIND_TITLE.glossary) + '</h2>' +
        '<span class="plan-lastday-count">' + esc(counterText(block)) + '</span>' +
      '</header>' + body +
      '</section>';
  }

  function trapsHTML(block) {
    var body = block.items.length
      ? '<ul class="plan-lastday-traps">' + block.items.map(function (entry) {
          var label = entry.source === "bullet" ? "Distinción" : "Aviso";
          return '<li class="plan-lastday-trap" data-source="' + esc(entry.source || "callout") + '">' +
            '<span class="plan-lastday-trap-label">' + esc(label) + '</span>' +
            '<b class="plan-lastday-trap-title">' + esc(entry.title || "") + '</b>' +
            '<span class="plan-lastday-detail">' + esc(clip(entry.text, CLIP.warnings)) + '</span>' +
            '</li>';
        }).join("") + '</ul>'
      : '<p class="plan-lastday-empty">' + esc(KIND_EMPTY.warnings) + '</p>';
    return '<section class="plan-lastday-block" data-lastday-traps aria-labelledby="plan-lastday-traps-title">' +
      '<header class="plan-lastday-block-head">' +
        '<h2 class="plan-lastday-h2" id="plan-lastday-traps-title">' + esc(KIND_TITLE.warnings) + '</h2>' +
        '<span class="plan-lastday-count">' + esc(counterText(block)) + '</span>' +
      '</header>' + body +
      '</section>';
  }

  function sheetHTML(entries, meta) {
    var info = meta || {};
    var sheet = buildSheet(entries, { areaId: info.areaId || "" });
    var areaName = "Todo el temario";
    if (info.areaId) {
      var R = reference();
      var areas = R && typeof R.areaOptions === "function" ? R.areaOptions() : [];
      for (var i = 0; i < areas.length; i += 1) {
        if (areas[i].id === info.areaId) {
          areaName = areas[i].title || areas[i].short || info.areaId;
          break;
        }
      }
    }
    return '<div class="plan-lastday-sheet" data-lastday-sheet>' +
      '<div class="plan-lastday-sheet-head">' +
        '<p class="plan-lastday-sheet-scope">' + esc(areaName) + '</p>' +
        '<p class="plan-lastday-sheet-date">' + esc(dayLabel(info.nowKey || todayKey())) + '</p>' +
      '</div>' +
      '<div class="plan-lastday-columns">' +
        factsHTML(sheet.facts) +
        glossaryHTML(sheet.glossary) +
        trapsHTML(sheet.warnings) +
      '</div>' +
      '<p class="plan-lastday-foot">Hoja generada desde el temario de estudio. Verifica cada dato en la fuente original; no sustituye la norma vigente.</p>' +
      '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* Render y estado                                                    */
  /* ------------------------------------------------------------------ */

  function setState(name) {
    if (page.section) page.section.setAttribute("data-plan-state", name || "loading");
  }

  function planForView() {
    var s = store();
    if (!s || !s.plan || typeof s.plan.get !== "function") return null;
    try {
      return s.plan.get();
    } catch (error) {
      return null;
    }
  }

  function updateExamLine() {
    if (!page.section) return;
    var el = page.section.querySelector("[data-lastday-exam]");
    if (!el) return;
    el.innerHTML = examLine(examInfo(page.plan || planForView(), todayKey()));
  }

  function renderSheet() {
    page.phase = "ready";
    setState("ready");
    if (page.stage) {
      page.stage.innerHTML = sheetHTML(page.entries, { areaId: page.areaId, nowKey: todayKey() });
    }
    updateExamLine();
  }

  function showLoading() {
    if (!page.body) return;
    if (page.error) page.error.hidden = true;
    if (!page.section.querySelector("[data-lastday-loading]")) {
      var holder = documentRoot().createElement("div");
      holder.innerHTML = skeletonHTML();
      page.body.insertBefore(holder.firstElementChild, page.error || page.body.firstChild);
    }
    page.loading = page.section.querySelector("[data-lastday-loading]");
    page.body.setAttribute("aria-busy", "true");
    setState("loading");
  }

  function hideLoading() {
    if (page.loading && page.loading.parentNode) page.loading.parentNode.removeChild(page.loading);
    page.loading = null;
    if (page.body) page.body.setAttribute("aria-busy", "false");
  }

  function showError(token, error) {
    if (token !== page.token) return;
    hideLoading();
    page.phase = "error";
    setState("error");
    if (page.stage) page.stage.innerHTML = "";
    var message = error && typeof error.message === "string" && error.message
      ? error.message
      : "No pude cargar los datos de la hoja.";
    if (page.error) {
      page.error.innerHTML = errorHTML(message);
      page.error.hidden = false;
    }
    var retry = page.error ? page.error.querySelector("[data-lastday-retry]") : null;
    if (retry && typeof retry.focus === "function") {
      try { retry.focus({ preventScroll: true }); } catch (error2) { retry.focus(); }
    }
  }

  function load(ctx) {
    page.ctx = ctx || page.ctx;
    page.token += 1;
    var token = page.token;
    showLoading();
    var R = reference();
    if (!R || typeof R.load !== "function") {
      showError(token, new Error("El motor de consulta (StudyReference) no está cargado. Recarga la página para volver a intentarlo."));
      return;
    }
    page.plan = planForView();
    var jobs = KIND_ORDER.map(function (kind) {
      try {
        return R.load(kind);
      } catch (error) {
        return Promise.reject(error);
      }
    });
    Promise.all(jobs).then(function (lists) {
      if (token !== page.token) return;
      page.entries = { facts: lists[0] || [], glossary: lists[1] || [], warnings: lists[2] || [] };
      hideLoading();
      if (page.error) page.error.hidden = true;
      renderSheet();
    }).catch(function (error) {
      if (token !== page.token) return;
      showError(token, error);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Eventos                                                            */
  /* ------------------------------------------------------------------ */

  function onClick(event) {
    var target = event && event.target && event.target.closest ? event.target.closest("[data-lastday-print], [data-lastday-retry]") : null;
    if (!target || (page.section && !page.section.contains(target))) return;
    if (target.hasAttribute("data-lastday-print")) {
      event.preventDefault();
      printSheet();
      return;
    }
    if (target.hasAttribute("data-lastday-retry")) {
      event.preventDefault();
      load(page.ctx);
    }
  }

  function onChange(event) {
    var target = event && event.target;
    if (!target || !target.hasAttribute || !target.hasAttribute("data-lastday-area")) return;
    page.areaId = target.value || "";
    renderSheet();
  }

  function printSheet() {
    var win = root && typeof root.print === "function" ? root : null;
    if (!win) return;
    try {
      win.print();
    } catch (error) {
      /* Algunos navegadores bloquean print fuera de un gesto: no hacemos nada. */
    }
  }

  /* ------------------------------------------------------------------ */
  /* Ciclo de vida                                                      */
  /* ------------------------------------------------------------------ */

  function findSection(ctx) {
    var container = ctx && ctx.root ? ctx.root : documentRoot();
    if (!container || typeof container.querySelector !== "function") return null;
    return container.querySelector('[data-plan-view="' + VIEW + '"]');
  }

  function mount(ctx) {
    var section = findSection(ctx);
    if (!section) return;
    page.ctx = ctx || page.ctx;
    page.section = section;
    page.body = section.querySelector("[data-lastday-body]");
    page.stage = section.querySelector("[data-lastday-stage]");
    page.error = section.querySelector("[data-lastday-error]");
    page.loading = section.querySelector("[data-lastday-loading]");
    page.phase = "idle";
    page.entries = null;
    page.areaId = "";
    page.plan = planForView();
    page.clickHandler = onClick;
    page.changeHandler = onChange;
    section.addEventListener("click", page.clickHandler);
    section.addEventListener("change", page.changeHandler);
    updateExamLine();
    load(ctx);
  }

  function unmount() {
    page.token += 1;
    if (page.section && page.clickHandler) page.section.removeEventListener("click", page.clickHandler);
    if (page.section && page.changeHandler) page.section.removeEventListener("change", page.changeHandler);
    page.ctx = null;
    page.section = null;
    page.body = null;
    page.stage = null;
    page.loading = null;
    page.error = null;
    page.clickHandler = null;
    page.changeHandler = null;
    page.entries = null;
    page.plan = null;
    page.phase = "idle";
  }

  function shellHTML() {
    var exam = examInfo(planForView(), todayKey());
    return '<section class="plan-lastday" data-plan-view="' + VIEW + '" data-plan-state="loading" aria-labelledby="' + TITLE_ID + '">' +
      heroHTML(exam, "") +
      '<div class="plan-lastday-body" data-lastday-body aria-busy="true">' +
        skeletonHTML() +
        '<div class="plan-lastday-error" data-lastday-error role="alert" hidden></div>' +
        '<div class="plan-lastday-stage" data-lastday-stage></div>' +
      '</div>' +
      '</section>';
  }

  function render(ctx) {
    page.ctx = ctx || null;
    return shellHTML();
  }

  /* ------------------------------------------------------------------ */
  /* Registro                                                           */
  /* ------------------------------------------------------------------ */

  var api = {
    version: VERSION,
    moduleId: MODULE_ID,
    view: VIEW,
    routePath: ROUTE_PATH,
    titleId: TITLE_ID,
    title: TITLE,
    limits: LIMITS,
    render: render,
    mount: mount,
    unmount: unmount,
    shellHTML: shellHTML,
    skeletonHTML: skeletonHTML,
    errorHTML: errorHTML,
    heroHTML: heroHTML,
    sheetHTML: sheetHTML,
    buildSheet: buildSheet,
    spreadByArea: spreadByArea,
    pickForSheet: pickForSheet,
    examInfo: examInfo,
    todayKey: todayKey,
    __registered: false,
    __page: page,
    register: function register(scope) {
      if (api.__registered) return false;
      var host = scope || root;
      if (!host || !host.StudyApp || typeof host.StudyApp.registerModule !== "function") return false;
      host.StudyApp.registerModule({
        id: MODULE_ID,
        routes: [{
          path: ROUTE_PATH,
          title: TITLE,
          render: render,
          mount: mount,
          unmount: unmount
        }]
      });
      api.__registered = true;
      return true;
    }
  };

  if (hasDom()) {
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

  return api;
});
