/* SERUMS STUDY — Ruta de hoy completa (Fase 2)
   Módulo `plan-ruta`: ruta `#/ruta`, título «Ruta de hoy», restoreScroll.

   Reglas del módulo:
   · El modelo se carga SOLO en su mount, con StudyPlanRuntime.ensureModel();
     nunca al evaluar el archivo ni en el Panel.
   · No lee ni escribe el plan: muestra buildTodayRoute() y buildWeeklySummary()
     con el input que entrega el runtime.
   · Persiste el resumen semanal con StudyStore.weekly.save(), una sola vez por
     contenido y semana (el store indexa por semana: no hay duplicados).
   · Escapa todo texto del temario/usuario; el CSS vive en css/plan-ruta.css
     bajo `.plan-*`; se limpia en unmount (listeners, frames, tokens).

   Contrato: study-dashboard/docs/CONTRATOS-FASE2.md §4.1
   Fórmulas: study-dashboard/docs/PLAN-MODELO.md §5, §8 y §14
   Uso:
     navegador  <script src="js/plan/plan.ruta.js"></script>
                -> window.StudyPlanRuta (se registra solo)
     Node       require("./plan.ruta.js")  (render puro, sin DOM)

   © 2026 ZARCONT */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root);
  } else {
    root.StudyPlanRuta = factory(root);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var MODULE_ID = "plan-ruta";
  var VIEW = "ruta";
  var ROUTE_PATH = "ruta";
  var TITLE = "Ruta de hoy";
  var TITLE_ID = "plan-ruta-title";
  var FALLBACK_FLASHCARDS = "../study-flashcards/index.html?mode=quick&from=dashboard";

  var TYPE_LABELS = {
    repaso: "Repaso de ficha",
    tarjetas: "Práctica con tarjetas",
    duda: "Duda abierta",
    ficha: "Ficha pendiente"
  };
  var TYPE_ICONS = { repaso: "rotate", tarjetas: "cards", duda: "flag", ficha: "book" };
  var TYPE_ORDER = ["repaso", "tarjetas", "duda", "ficha"];
  var STATUS_COPY = {
    lista: "Lista para hoy",
    vacia: "Sin bloques",
    sinTiempo: "Sin tiempo hoy",
    sinPresupuesto: "Sin plan",
    todoCompletado: "Todo al día",
    sinDatos: "Sin datos"
  };
  var BALANCE_COPY = {
    ahead: { label: "Llegas con margen", tone: "ahead" },
    onTrack: { label: "Llegas justo", tone: "onTrack" },
    behind: { label: "No alcanza", tone: "behind" }
  };
  var BAND_COPY = {
    fragil: "Frágil",
    enProgreso: "En progreso",
    solido: "Sólido",
    sinDatos: "Sin datos"
  };

  /* ------------------------------------------------------------------ */
  /* Estado de la vista y accesos al host                                */
  /* ------------------------------------------------------------------ */

  var page = {
    ctx: null,
    section: null,
    content: null,
    loading: null,
    error: null,
    body: null,
    clickHandler: null,
    offs: [],
    frame: 0,
    token: 0,
    selfWrite: false,
    savedSignature: null,
    savedRecord: null
  };

  function runtime() {
    return root && root.StudyPlanRuntime ? root.StudyPlanRuntime : null;
  }
  function store(ctx) {
    if (ctx && ctx.store) return ctx.store;
    return root && root.StudyStore ? root.StudyStore : null;
  }
  function documentRoot() {
    return root && root.document ? root.document : null;
  }
  function hasDom() {
    return !!documentRoot();
  }
  function appEvents() {
    var app = root && root.StudyApp;
    return app && app.events ? app.events : null;
  }
  function currentRouteName() {
    var app = root && root.StudyApp;
    if (!app || typeof app.getRoute !== "function") return null;
    try {
      var route = app.getRoute();
      return route && route.name ? route.name : null;
    } catch (error) {
      return null;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Utilidades                                                          */
  /* ------------------------------------------------------------------ */

  function esc(value) {
    var R = runtime();
    if (R && typeof R.escape === "function") return R.escape(value);
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  function icon(name, size) {
    var R = runtime();
    if (R && typeof R.icon === "function") return R.icon(name, size || 16);
    return "";
  }
  function plural(n, one, many) {
    var R = runtime();
    if (R && typeof R.plural === "function") return R.plural(n, one, many);
    return Number(n) === 1 ? one : (many || one + "s");
  }
  function numberOrNull(value) {
    if (value === null || value === undefined || value === "") return null;
    var n = Number(value);
    return isFinite(n) ? n : null;
  }
  /* Redondeo de proporciones para que el registro semanal guarde valores
     estables y legibles (0,3 en vez de 0,30000000000000004). */
  function ratio(value) {
    var n = numberOrNull(value);
    return n === null ? null : Math.round(n * 1000) / 1000;
  }
  function isObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }
  function minutesLabel(value, estimated) {
    var n = numberOrNull(value);
    var R = runtime();
    var text;
    if (n === null) {
      text = "min sin dato";
    } else if (R && R.format && typeof R.format.minutes === "function") {
      text = R.format.minutes(n);
    } else {
      var v = Math.round(n);
      text = v < 60 ? v + " min" : Math.floor(v / 60) + " h" + (v % 60 ? " " + (v % 60) + " min" : "");
    }
    return estimated ? "≈ " + text : text;
  }
  function dateLabel(value) {
    var R = runtime();
    if (R && R.format && typeof R.format.date === "function") {
      var text = R.format.date(value);
      if (text) return text;
    }
    return typeof value === "string" && value ? value : "";
  }
  function areaLabel(areaId) {
    if (!areaId) return "";
    var R = runtime();
    var content = R && typeof R.content === "function" ? R.content() : (root.STUDY_CONTENT || null);
    if (!content) return areaId;
    var list = content.primaryAreas || content.areas || [];
    for (var i = 0; i < list.length; i += 1) {
      if (list[i] && list[i].id === areaId) return list[i].title || list[i].short || areaId;
    }
    return areaId;
  }
  function categoryLabel(categoryId, fallback) {
    if (fallback) return fallback;
    if (!categoryId) return "";
    var R = runtime();
    var list = R && typeof R.categories === "function" ? R.categories() : [];
    for (var i = 0; i < list.length; i += 1) {
      if (list[i] && list[i].id === categoryId) return list[i].title || list[i].short || categoryId;
    }
    return categoryId;
  }
  function flashcardsHref() {
    /* La app vive en /study-dashboard/ y Flashcards en /study-flashcards/:
       se resuelve desde la URL actual, que es lo único que no depende de cómo
       esté montado el store. `urls.flashcards` queda como respaldo. */
    var doc = documentRoot();
    if (doc && doc.location && typeof doc.location.href === "string" && typeof URL === "function") {
      try {
        var url = new URL("../study-flashcards/index.html", doc.location.href);
        url.searchParams.set("mode", "quick");
        url.searchParams.set("from", "dashboard");
        return url.href;
      } catch (error) {
        /* sin URL disponible: se usa el respaldo relativo */
      }
    }
    var s = store(page.ctx);
    try {
      if (s && s.urls && typeof s.urls.flashcards === "function") {
        var href = s.urls.flashcards("", false);
        if (href) return href;
      }
    } catch (error) {
      /* sin URLs del store: se usa la ruta relativa conocida */
    }
    return FALLBACK_FLASHCARDS;
  }
  function encodeId(value) {
    try {
      return encodeURIComponent(String(value == null ? "" : value));
    } catch (error) {
      return "";
    }
  }

  /* ------------------------------------------------------------------ */
  /* Preparación de datos                                                */
  /* ------------------------------------------------------------------ */

  /* Añade al input del runtime la configuración del plan para que
     buildTodayRoute() devuelva también sesión y estado del plan. */
  function viewInput(R, ctx) {
    var input = typeof R.input === "function" ? R.input({}) : {};
    var record = input.planRecord || (typeof R.plan === "function" ? R.plan() : null);
    if (record) {
      input.plan = {
        examDate: record.examDate || null,
        minutesPerDay: numberOrNull(record.minutesPerDay),
        daysPerWeek: numberOrNull(record.daysPerWeek)
      };
    }
    return input;
  }

  /* Señales abiertas para cuando no hay presupuesto: se declaran, no se
     convierten en una ruta que el plan no autoriza. */
  function signalsFor(input, Model) {
    var today = null;
    if (Model && Model.dates && typeof Model.dates.today === "function") {
      today = Model.dates.today(input.now);
    }
    var reviews = Array.isArray(input.reviews) ? input.reviews : null;
    var reviewsDue = null;
    if (reviews) {
      reviewsDue = 0;
      reviews.forEach(function (review) {
        if (!isObject(review) || review.deleted === true) return;
        var due = review.dueDate !== undefined && review.dueDate !== null ? review.dueDate : review.dueAt;
        if (!due) return;
        var dueDay = Model && Model.dates && typeof Model.dates.today === "function"
          ? Model.dates.today(due)
          : String(due).slice(0, 10);
        if (!dueDay || !today) return;
        if (dueDay <= today) reviewsDue += 1;
      });
    }
    var doubts = Array.isArray(input.doubts) ? input.doubts : null;
    var sheets = Array.isArray(input.sheets) ? input.sheets : null;
    var pendingSheets = null;
    var pendingMinutes = null;
    var minutesIncomplete = false;
    if (sheets) {
      pendingSheets = 0;
      pendingMinutes = 0;
      sheets.forEach(function (sheet) {
        if (!sheet || sheet.done === true) return;
        pendingSheets += 1;
        var minutes = numberOrNull(sheet.minutes);
        if (minutes === null) minutesIncomplete = true;
        else pendingMinutes += Math.round(minutes);
      });
      if (minutesIncomplete && pendingMinutes === 0) pendingMinutes = null;
    }
    var cards = numberOrNull(input.cardsDue);
    return {
      reviewsDue: reviewsDue,
      doubtsOpen: doubts ? doubts.length : null,
      pendingSheets: pendingSheets,
      pendingMinutes: pendingMinutes,
      minutesIncomplete: minutesIncomplete,
      cardsDue: cards
    };
  }

  function build(input, Model) {
    var route = null;
    var weekly = null;
    if (!Model || typeof Model.buildTodayRoute !== "function") {
      return { route: null, weekly: null, signals: null };
    }
    route = Model.buildTodayRoute(input);
    if (typeof Model.buildWeeklySummary === "function") {
      try {
        weekly = Model.buildWeeklySummary(input);
      } catch (error) {
        weekly = null;
      }
    }
    return { route: route, weekly: weekly, signals: signalsFor(input, Model) };
  }

  /* Registro semanal: solo cambia cuando cambia el resumen. El store indexa
     por semana ISO, así que no puede duplicar la semana; además se compara con
     lo guardado para no reescribir el mismo contenido en cada render. */
  function weeklyPayload(summary) {
    var activity = (summary && summary.activity) || {};
    var mastery = (summary && summary.mastery) || null;
    var global = mastery && mastery.global ? mastery.global : null;
    var weakest = mastery && mastery.weakest ? mastery.weakest : null;
    var weakestArea = mastery && mastery.weakestArea ? mastery.weakestArea : null;
    var pending = (summary && summary.pending) || null;
    var priority = Array.isArray(summary && summary.priority) ? summary.priority : [];
    return {
      weekStart: summary && summary.weekStart ? summary.weekStart : null,
      weekEnd: summary && summary.weekEnd ? summary.weekEnd : null,
      status: summary && summary.status ? summary.status : null,
      partial: !!(summary && summary.partial),
      days: numberOrNull(summary && summary.days),
      activity: {
        daysWithActivity: numberOrNull(activity.daysWithActivity),
        sheetViews: numberOrNull(activity.sheetViews),
        sheetsCompleted: numberOrNull(activity.sheetsCompleted),
        cardsReviewed: numberOrNull(activity.cardsReviewed),
        correct: numberOrNull(activity.correct),
        wrong: numberOrNull(activity.wrong),
        accuracy: numberOrNull(activity.accuracy),
        minutesRead: numberOrNull(activity.minutesRead)
      },
      mastery: global ? {
        score: numberOrNull(global.score),
        band: global.band || null,
        coverage: ratio(global.coverage),
        weakest: weakest ? {
          id: weakest.id || null,
          score: numberOrNull(weakest.score),
          band: weakest.band || null
        } : null,
        weakestArea: weakestArea ? {
          id: weakestArea.id || null,
          score: numberOrNull(weakestArea.score),
          band: weakestArea.band || null
        } : null
      } : null,
      pending: pending ? {
        sheets: numberOrNull(pending.sheets),
        minutes: numberOrNull(pending.minutes),
        reviewsDue: numberOrNull(pending.reviewsDue),
        doubtsOpen: numberOrNull(pending.doubtsOpen),
        cardsDue: numberOrNull(pending.cardsDue)
      } : null,
      priority: priority.map(function (item) {
        return { kind: item && item.kind ? item.kind : null, label: item && item.label ? item.label : null };
      }),
      message: summary && summary.message ? summary.message : ""
    };
  }

  function persistWeekly(weekly) {
    if (!weekly || !weekly.weekStart) return null;
    var s = store(page.ctx);
    if (!s || !s.weekly || typeof s.weekly.save !== "function") return null;
    var payload = weeklyPayload(weekly);
    var signature = JSON.stringify(payload);
    if (page.savedSignature === signature) return page.savedRecord;
    var existing = null;
    try {
      existing = s.weekly.get(weekly.weekStart);
    } catch (error) {
      existing = null;
    }
    if (existing && JSON.stringify(weeklyPayload(existing)) === signature) {
      page.savedSignature = signature;
      page.savedRecord = existing;
      return existing;
    }
    page.selfWrite = true;
    try {
      var saved = s.weekly.save(payload);
      page.savedSignature = signature;
      page.savedRecord = saved || null;
      return saved || null;
    } catch (error) {
      return null;
    } finally {
      page.selfWrite = false;
    }
  }

  /* ------------------------------------------------------------------ */
  /* HTML: armazón, carga y error                                        */
  /* ------------------------------------------------------------------ */

  function skeletonHTML() {
    return '<div class="plan-ruta-loading" data-plan-loading role="status">' +
      '<span class="plan-ruta-loading-text">Cargando la ruta de hoy…</span>' +
      '<span class="plan-ruta-skeleton" aria-hidden="true"><i></i><i></i><i></i></span>' +
      '</div>';
  }

  function errorHTML(message) {
    return '<p class="plan-ruta-error-text">' + esc(message) + '</p>' +
      '<div class="plan-ruta-error-actions">' +
        '<button class="s-btn s-btn--sm" type="button" data-plan-action="retry-model">Volver a intentar</button>' +
        '<a class="s-btn s-btn--ghost s-btn--sm" href="#/" data-nav>Volver al panel</a>' +
      '</div>';
  }

  function navHTML() {
    return '<nav class="plan-ruta-nav" aria-label="Planificación">' +
      '<a class="plan-ruta-navlink" data-plan-link="plan" href="#/plan" data-nav>' + icon("calendar", 15) + '<span>Editar plan</span></a>' +
      '<a class="plan-ruta-navlink" data-plan-link="dominio" href="#/dominio" data-nav>' + icon("target", 15) + '<span>Mapa de dominio</span></a>' +
      '<a class="plan-ruta-navlink" data-plan-link="repaso" href="#/repaso" data-nav>' + icon("rotate", 15) + '<span>Repaso</span></a>' +
      '</nav>';
  }

  function shellHTML() {
    return '<section class="plan-ruta" data-plan-view="' + VIEW + '" data-plan-state="loading" aria-labelledby="' + TITLE_ID + '">' +
      '<header class="plan-ruta-hero">' +
        '<a class="plan-ruta-back" href="#/" data-nav>' + icon("arrowLeft", 14) + '<span>Panel</span></a>' +
        '<span class="plan-ruta-kicker"><span class="plan-ruta-dot" aria-hidden="true"></span>Planificación</span>' +
        '<h1 class="plan-ruta-title" id="' + TITLE_ID + '">' + TITLE + '</h1>' +
        '<p class="plan-ruta-lede">Lo que toca hoy, en orden y con el motivo. La ruta se recalcula cada vez que completas una ficha o cambia tu plan.</p>' +
        navHTML() +
      '</header>' +
      '<div class="plan-ruta-body" data-plan-body aria-busy="true">' +
        skeletonHTML() +
        '<div class="plan-ruta-error" data-plan-error role="alert" hidden></div>' +
        '<div class="plan-ruta-content" data-plan-content></div>' +
      '</div>' +
      '</section>';
  }

  function render(ctx) {
    page.ctx = ctx || null;
    return shellHTML();
  }

  /* ------------------------------------------------------------------ */
  /* HTML: contenido cargado (puro, sin DOM)                             */
  /* ------------------------------------------------------------------ */

  function meterHTML(route) {
    var budget = numberOrNull(route.budgetMinutes);
    var planned = numberOrNull(route.plannedMinutes) || 0;
    var budgetDeclared = route.budgetDeclared === true && budget !== null;
    if (!budgetDeclared) {
      return '<div class="plan-ruta-meter">' +
        '<span class="plan-ruta-meter-value">' + esc(minutesLabel(planned, false)) + '</span>' +
        '<span class="plan-ruta-meter-note">sin presupuesto de minutos</span>' +
        '</div>';
    }
    if (budget === 0) {
      return '<div class="plan-ruta-meter">' +
        '<span class="plan-ruta-meter-value">0 min</span>' +
        '<span class="plan-ruta-meter-note">presupuesto en cero: la ruta queda vacía a propósito</span>' +
        '</div>';
    }
    var fill = Math.max(0, Math.min(100, Math.round((planned / budget) * 100)));
    var ariaNow = Math.min(planned, budget);
    var ariaText = planned + " de " + budget + " minutos" + (route.overload ? "; se pasa de " + (planned - budget) : "");
    return '<div class="plan-ruta-meter">' +
      '<span class="plan-ruta-meter-value">' + esc(minutesLabel(planned, false)) + ' <i>de ' + esc(minutesLabel(budget, false)) + '</i></span>' +
      '<span class="plan-ruta-meter-track' + (route.overload ? " is-over" : "") + '" role="progressbar" aria-label="Presupuesto de la ruta" aria-valuemin="0" aria-valuemax="' + budget + '" aria-valuenow="' + ariaNow + '" aria-valuetext="' + esc(ariaText) + '">' +
        '<span class="plan-ruta-meter-fill" style="--plan-route-fill:' + fill + '%"></span>' +
      '</span>' +
      (route.overload ? '<span class="plan-ruta-meter-note is-over">El bloque mínimo se pasa ' + (planned - budget) + ' min del presupuesto.</span>' : '') +
      '</div>';
  }

  function actionFor(item, meta) {
    if (item.type === "repaso" && item.sheetId) {
      return { href: "#/repaso", label: "Repasar ficha", external: false };
    }
    if (item.type === "ficha" && item.sheetId) {
      return { href: "#/ficha/" + encodeId(item.sheetId), label: "Abrir ficha", external: false };
    }
    if (item.type === "duda") {
      return { href: "#/dudas", label: "Ver en dudas", external: false };
    }
    if (item.type === "tarjetas") {
      return { href: meta && meta.flashcardsHref ? meta.flashcardsHref : FALLBACK_FLASHCARDS, label: "Repasar tarjetas", external: true };
    }
    return null;
  }

  function itemHTML(item, index, meta) {
    var action = actionFor(item, meta);
    var kind = TYPE_LABELS[item.type] || "Bloque";
    var minutes = minutesLabel(item.minutes, item.minutesSource === "estimada");
    var reason = item.reason || "";
    var title = item.title || "";
    var aria = action ? action.label + " · " + title : title;
    var actionHTML = action
      ? '<a class="plan-item-link" href="' + esc(action.href) + '"' +
          (action.external ? ' target="_blank" rel="noopener"' : " data-nav") +
          ' aria-label="' + esc(aria) + '">' + esc(action.label) + " " + icon("arrow", 14) + '</a>'
      : '<span class="plan-item-link is-static">' + esc(kind) + '</span>';
    return '<li class="plan-item plan-route-item" data-type="' + esc(item.type) + '"' +
      (item.sheetId ? ' data-sheet-id="' + esc(item.sheetId) + '"' : "") +
      ' data-plan-item-id="' + esc(item.id || "") + '">' +
      '<span class="plan-item-ordinal" aria-hidden="true">' + (index + 1 < 10 ? "0" : "") + (index + 1) + '</span>' +
      '<span class="plan-item-icon" aria-hidden="true">' + icon(TYPE_ICONS[item.type] || "book", 17) + '</span>' +
      '<div class="plan-item-copy">' +
        '<span class="plan-item-kind">' + esc(kind) + " · " + esc(minutes) + '</span>' +
        '<h3 class="plan-item-title">' + esc(title) + '</h3>' +
        (reason ? '<p class="plan-item-reason">' + esc(reason) + '</p>' : "") +
      '</div>' +
      actionHTML +
      '</li>';
  }

  function listHTML(route, meta) {
    return '<ol class="plan-ruta-list" aria-label="Bloques de la ruta de hoy">' +
      route.items.map(function (item, index) { return itemHTML(item, index, meta); }).join("") +
      '</ol>';
  }

  function deferredNote(route) {
    var deferred = route.deferred || {};
    var parts = [];
    TYPE_ORDER.forEach(function (type) {
      var count = numberOrNull(deferred[type]) || 0;
      if (count <= 0) return;
      var one = { repaso: "repaso", tarjetas: "bloque de tarjetas", duda: "duda", ficha: "ficha" }[type];
      var many = { repaso: "repasos", tarjetas: "bloques de tarjetas", duda: "dudas", ficha: "fichas" }[type];
      parts.push(count + " " + plural(count, one, many));
    });
    if (!parts.length) return "";
    return '<p class="plan-ruta-deferred">Quedan ' + esc(parts.join(", ")) + ' para los próximos días: no hace falta meterlo todo hoy.</p>';
  }

  function notesHTML(route) {
    var parts = [];
    if (route.support) parts.push('<p class="plan-ruta-support">' + esc(route.support) + '</p>');
    var deferred = deferredNote(route);
    if (deferred) parts.push(deferred);
    var warnings = Array.isArray(route.warnings) ? route.warnings : [];
    if (warnings.length) {
      parts.push('<ul class="plan-ruta-notes" data-plan-notes>' +
        warnings.slice(0, 4).map(function (warning) {
          return '<li>' + esc(warning.message || warning.code || "") + '</li>';
        }).join("") +
        (warnings.length > 4 ? "<li>y " + (warnings.length - 4) + " avisos más</li>" : "") +
        '</ul>');
    }
    var assumptions = Array.isArray(route.assumptions) ? route.assumptions : [];
    if (assumptions.length) {
      parts.push('<details class="plan-ruta-details"><summary>Supuestos del cálculo</summary><ul>' +
        assumptions.map(function (assumption) {
          return '<li>' + esc(assumption.message || assumption.code || "") + '</li>';
        }).join("") + '</ul></details>');
    }
    if (!parts.length) return "";
    return '<div class="plan-ruta-aside-notes">' + parts.join("") + '</div>';
  }

  function signalsHTML(signals) {
    if (!signals) return "";
    var rows = [];
    if (signals.reviewsDue !== null) {
      rows.push({ href: "#/repaso", label: signals.reviewsDue + " " + plural(signals.reviewsDue, "repaso vencido", "repasos vencidos") });
    }
    if (signals.doubtsOpen !== null) {
      rows.push({ href: "#/dudas", label: signals.doubtsOpen + " " + plural(signals.doubtsOpen, "duda abierta", "dudas abiertas") });
    }
    if (signals.cardsDue !== null) {
      rows.push({ href: flashcardsHref(), external: true, label: signals.cardsDue + " " + plural(signals.cardsDue, "tarjeta vencida", "tarjetas vencidas") });
    }
    if (signals.pendingSheets !== null) {
      rows.push({
        href: "#/biblioteca",
        label: signals.pendingSheets + " " + plural(signals.pendingSheets, "ficha pendiente", "fichas pendientes") +
          (signals.pendingMinutes !== null ? " · " + minutesLabel(signals.pendingMinutes, false) + " de lectura" : "") +
          (signals.minutesIncomplete ? " · algunas sin minutos declarados" : "")
      });
    }
    if (!rows.length) return "";
    return '<section class="plan-ruta-signals" data-plan-signals aria-labelledby="plan-ruta-signals-title">' +
      '<h2 class="plan-ruta-h2" id="plan-ruta-signals-title">Señales abiertas</h2>' +
      '<p class="plan-ruta-signals-lede">Sin presupuesto de minutos no reparto la jornada. Esto es lo que el modelo sí puede leer de tu progreso.</p>' +
      '<ul class="plan-ruta-signals-list">' +
        rows.map(function (row) {
          return '<li><a href="' + esc(row.href) + '"' + (row.external ? ' target="_blank" rel="noopener"' : " data-nav") + '>' +
            esc(row.label) + " " + icon("arrow", 13) + '</a></li>';
        }).join("") +
      '</ul>' +
      '</section>';
  }

  function emptyHTML(route, meta, signals) {
    var iconName = "checkCircle";
    var actions = [];
    if (route.status === "sinPresupuesto" || route.status === "sinTiempo") {
      iconName = "timer";
      actions.push('<a class="s-btn s-btn--sm" data-plan-link="plan" href="#/plan" data-nav>Configurar el plan</a>');
    } else if (route.status === "todoCompletado") {
      iconName = "checkCircle";
      actions.push('<a class="s-btn s-btn--ghost s-btn--sm" href="#/repaso" data-nav>Ver repaso</a>');
      actions.push('<a class="s-btn s-btn--ghost s-btn--sm" href="#/biblioteca" data-nav>Explorar la biblioteca</a>');
    } else {
      iconName = "alert";
      actions.push('<a class="s-btn s-btn--ghost s-btn--sm" href="#/biblioteca" data-nav>Explorar la biblioteca</a>');
      actions.push('<a class="s-btn s-btn--ghost s-btn--sm" href="#/plan" data-nav>Revisar el plan</a>');
    }
    var body = '<div class="plan-ruta-empty" data-plan-empty>' +
      '<span class="plan-ruta-empty-icon" aria-hidden="true">' + icon(iconName, 20) + '</span>' +
      '<div class="plan-ruta-empty-copy">' +
        '<p class="plan-ruta-empty-text">' + esc(route.message || "No hay bloques para hoy.") + '</p>' +
        (route.support ? '<p class="plan-ruta-empty-support">' + esc(route.support) + '</p>' : "") +
        '<div class="plan-ruta-empty-actions">' + actions.join("") + '</div>' +
      '</div>' +
      '</div>';
    if (route.status === "sinPresupuesto") body += signalsHTML(signals);
    return body;
  }

  function planFacts(record, plan) {
    var facts = [];
    var minutesPerDay = record ? numberOrNull(record.minutesPerDay) : null;
    var daysPerWeek = record ? numberOrNull(record.daysPerWeek) : null;
    facts.push({ label: "Examen", value: record && record.examDate ? dateLabel(record.examDate) : "Sin fecha" });
    facts.push({
      label: "Ritmo",
      value: minutesPerDay !== null
        ? minutesLabel(minutesPerDay, false) + "/día" + (daysPerWeek !== null ? " · " + daysPerWeek + " " + plural(daysPerWeek, "día", "días") + "/semana" : "")
        : "Sin minutos por día"
    });
    if (!plan) return facts;
    var balance = BALANCE_COPY[plan.balance] || null;
    if (balance) {
      /* El estado ya se muestra como banda; no se repite como dato. */
      facts.push({ label: "Fin estimado", value: plan.estimatedEndDate ? dateLabel(plan.estimatedEndDate) : "—" });
      if (numberOrNull(plan.shortfallMinutes) !== null && plan.shortfallMinutes > 0) {
        facts.push({
          label: "No cabe",
          value: plan.shortfallMinutes + " min" + (numberOrNull(plan.lateDays) !== null ? " · " + plan.lateDays + " " + plural(plan.lateDays, "día", "días") + " de atraso" : "")
        });
      } else {
        facts.push({ label: "Cabe", value: "Sí, con el ritmo actual" });
      }
      return facts;
    }
    if (plan.status === "fechaPasada") {
      facts.push({ label: "Estado", value: "La fecha de examen ya pasó" });
      facts.push({ label: "Fin estimado", value: plan.estimatedEndDate ? dateLabel(plan.estimatedEndDate) : "—" });
    } else if (plan.status === "sinFecha") {
      facts.push({ label: "Estado", value: "Sin fecha de examen" });
      facts.push({ label: "Fin estimado", value: plan.estimatedEndDate ? dateLabel(plan.estimatedEndDate) : "—" });
    } else if (plan.status === "sinTiempo") {
      facts.push({ label: "Estado", value: "0 minutos al día: no hay plan posible" });
    } else {
      facts.push({ label: "Estado", value: "Sin datos suficientes" });
    }
    return facts;
  }

  function planSummaryHTML(route, meta) {
    var record = meta && meta.planRecord ? meta.planRecord : null;
    var plan = route.plan || null;
    if (!record) {
      return '<section class="plan-ruta-plan" data-plan-summary aria-labelledby="plan-ruta-plan-title">' +
        '<h2 class="plan-ruta-h2" id="plan-ruta-plan-title">Tu plan</h2>' +
        '<p class="plan-ruta-plan-empty">Todavía no hay plan guardado. Con fecha de examen y minutos por día, la ruta y el calendario se calculan solos.</p>' +
        '<a class="s-btn s-btn--sm" data-plan-link="plan" href="#/plan" data-nav>Crear plan</a>' +
        '</section>';
    }
    var facts = planFacts(record, plan);
    var balance = plan && BALANCE_COPY[plan.balance] ? BALANCE_COPY[plan.balance] : null;
    var session = route.session || null;
    return '<section class="plan-ruta-plan" data-plan-summary aria-labelledby="plan-ruta-plan-title">' +
      '<h2 class="plan-ruta-h2" id="plan-ruta-plan-title">Tu plan</h2>' +
      (balance ? '<p class="plan-ruta-band" data-band="' + esc(balance.tone) + '">' + esc(balance.label) + '</p>' : "") +
      '<dl class="plan-ruta-facts">' +
        facts.map(function (fact) {
          return '<div><dt>' + esc(fact.label) + '</dt><dd>' + esc(fact.value) + '</dd></div>';
        }).join("") +
      '</dl>' +
      (session
        ? '<p class="plan-ruta-session">' + esc(sessionLine(session, route)) + '</p>'
        : "") +
      '<a class="plan-ruta-cardlink" href="#/plan" data-nav>Editar plan ' + icon("arrow", 14) + '</a>' +
      '</section>';
  }

  function sessionLine(session, route) {
    if (!session) return "";
    var count = Array.isArray(session.sheets) ? session.sheets.length : 0;
    var minutes = numberOrNull(session.minutes);
    var detail = (minutes !== null ? minutesLabel(minutes, false) : "duración sin dato") + " en " +
      count + " " + plural(count, "ficha", "fichas");
    if (!session.isToday) {
      return "Hoy es día de descanso en el plan; la próxima sesión es el " + dateLabel(session.date) + " (" + detail + ").";
    }
    var line = "Sesión planificada para hoy: " + detail + ".";
    /* La ruta no es la sesión completa: el presupuesto y el tope diario recortan
       fichas. Se dice explícitamente para no leer dos cifras como la misma. */
    var routeSheets = (route && Array.isArray(route.items) ? route.items : [])
      .filter(function (item) { return item.type === "ficha"; }).length;
    if (routeSheets > 0 && count > routeSheets) {
      line += " La ruta de hoy comparte el presupuesto con repasos y dudas y respeta el tope diario de fichas: incluye " +
        routeSheets + " de esas " + count + " y deja " + (count - routeSheets) + " para los próximos días.";
    } else if (route && route.status === "sinTiempo") {
      line += " La ruta de hoy no reparte trabajo porque el presupuesto es cero.";
    }
    return line;
  }

  function weeklyStat(label, value) {
    return '<div class="plan-ruta-stat"><dt>' + esc(label) + '</dt><dd>' + esc(value) + '</dd></div>';
  }

  function weeklyFoot(weekly, saved) {
    var weekId = weekly && (weekly.weekId || weekly.weekStart) ? (weekly.weekId || weekly.weekStart) : "";
    if (saved) {
      return weekly && weekly.status === "sinDatos"
        ? "Semana registrada sin actividad todavía (" + esc(weekId) + ")."
        : "Resumen guardado en la semana " + esc(weekId) + ".";
    }
    return "Sin almacenamiento disponible, el resumen de esta semana no se guarda.";
  }

  function weeklyHTML(weekly, saved) {
    if (!weekly) {
      return '<section class="plan-ruta-weekly" data-plan-weekly data-weekly-status="sinDatos">' +
        '<h2 class="plan-ruta-h2">Esta semana</h2>' +
        '<p class="plan-ruta-weekly-empty">No se pudo calcular el resumen semanal con los datos disponibles.</p>' +
        '</section>';
    }
    var activity = weekly.activity || {};
    var range = weekly.weekStart && weekly.weekEnd
      ? dateLabel(weekly.weekStart) + " – " + dateLabel(weekly.weekEnd)
      : "";
    var stats = [];
    if (weekly.status === "sinDatos") {
      return '<section class="plan-ruta-weekly" data-plan-weekly data-weekly-status="sinDatos">' +
        '<div class="plan-ruta-weekly-head"><h2 class="plan-ruta-h2">Esta semana</h2>' +
        (range ? '<p class="plan-ruta-weekly-range">' + esc(range) + (weekly.partial ? " · en curso" : "") + '</p>' : "") +
        '</div>' +
        '<p class="plan-ruta-weekly-empty">' + esc(weekly.message || "Aún no hay actividad registrada esta semana.") + '</p>' +
        '<p class="plan-ruta-weekly-foot">' + weeklyFoot(weekly, saved) + '</p>' +
        '</section>';
    }
    function statValue(value, suffix) {
      var n = numberOrNull(value);
      return n === null ? "—" : String(n) + (suffix || "");
    }
    stats.push(weeklyStat("Lecturas", statValue(activity.sheetViews)));
    stats.push(weeklyStat("Fichas completadas", statValue(activity.sheetsCompleted)));
    stats.push(weeklyStat("Tarjetas repasadas", statValue(activity.cardsReviewed)));
    stats.push(weeklyStat("Acierto", statValue(activity.accuracy, " %")));
    stats.push(weeklyStat("Minutos de lectura", statValue(activity.minutesRead)));
    var mastery = weekly.mastery || null;
    var weakest = mastery && mastery.weakestArea ? mastery.weakestArea : null;
    var missing = Array.isArray(weekly.missing) ? weekly.missing : [];
    var priority = Array.isArray(weekly.priority) ? weekly.priority : [];
    return '<section class="plan-ruta-weekly" data-plan-weekly data-weekly-status="' + esc(weekly.status || "ok") + '">' +
      '<div class="plan-ruta-weekly-head">' +
        '<h2 class="plan-ruta-h2">Esta semana</h2>' +
        (range ? '<p class="plan-ruta-weekly-range">' + esc(range) + (weekly.partial ? " · en curso" : "") + '</p>' : "") +
      '</div>' +
      '<dl class="plan-ruta-weekly-stats">' + stats.join("") + '</dl>' +
      (weekly.message && weekly.status !== "ok" ? '<p class="plan-ruta-weekly-message">' + esc(weekly.message) + '</p>' : "") +
      (weakest
        ? '<p class="plan-ruta-weekly-focus">Punto más flojo: <b>' + esc(areaLabel(weakest.id)) + '</b> · ' +
          esc(weakest.score) + '/100 · ' + esc(BAND_COPY[weakest.band] || weakest.band || "") +
          (numberOrNull(weakest.coverage) !== null ? " · " + Math.round(weakest.coverage * 100) + " % de señales" : "") + '</p>'
        : '<p class="plan-ruta-weekly-focus">Sin datos suficientes para señalar un punto flojo.</p>') +
      (priority.length
        ? '<ol class="plan-ruta-weekly-priority" aria-label="Prioridades de la semana">' +
            priority.map(function (item) {
              return '<li data-kind="' + esc(item.kind || "") + '"><span class="plan-ruta-priority-label">' + esc(item.label || "") + '</span>' +
                (item.reason ? '<span class="plan-ruta-priority-reason">' + esc(item.reason) + '</span>' : "") + '</li>';
            }).join("") +
          '</ol>'
        : "") +
      (missing.length ? '<p class="plan-ruta-weekly-missing">Faltan datos de: ' + esc(missing.join(", ")) + '.</p>' : "") +
      '<p class="plan-ruta-weekly-foot">' + weeklyFoot(weekly, saved) + '</p>' +
      '</section>';
  }

  /* El mensaje del modelo empieza por «Ruta de hoy:»; el h1 de la página ya lo
     dice, así que en esta vista se muestra sin ese prefijo. */
  function statusMessage(route) {
    var text = route && route.message ? String(route.message) : "";
    return text.replace(/^Ruta de hoy:\s*/i, "");
  }

  /* Franja de herramientas de última hora (Fase 3): se ven desde escritorio sin
     depender del menú «Más». No cargan nada: solo enlazan. */
  function beforeExamHTML() {
    return '<section class="plan-ruta-before" data-plan-before aria-labelledby="plan-ruta-before-title">' +
      '<h2 class="plan-ruta-h2" id="plan-ruta-before-title">Antes del examen</h2>' +
      '<div class="plan-ruta-before-links">' +
        '<a class="plan-ruta-before-link" href="#/relampago" data-nav>' +
          '<span class="plan-ruta-before-icon" aria-hidden="true">' + icon("flame", 18) + '</span>' +
          '<span class="plan-ruta-before-copy"><b>Repaso relámpago</b><small>Diez preguntas rápidas con datos reales del temario.</small></span>' +
          icon("arrow", 14) +
        '</a>' +
        '<a class="plan-ruta-before-link" href="#/ultimo-dia" data-nav>' +
          '<span class="plan-ruta-before-icon" aria-hidden="true">' + icon("calendar", 18) + '</span>' +
          '<span class="plan-ruta-before-copy"><b>Hoja de último día</b><small>Datos, definiciones y avisos en una hoja para imprimir.</small></span>' +
          icon("arrow", 14) +
        '</a>' +
      '</div>' +
      '</section>';
  }

  function contentHTML(view, meta) {
    var route = view && view.route ? view.route : null;
    if (!route) {
      return '<div class="plan-ruta-empty" data-plan-empty>' +
        '<p class="plan-ruta-empty-text">No pude construir la ruta de hoy con los datos disponibles.</p>' +
        '</div>';
    }
    var signals = view.signals || null;
    var items = Array.isArray(route.items) ? route.items : [];
    var hasItems = items.length > 0;
    var statusCopy = STATUS_COPY[route.status] || route.status;
    var balance = route.plan && route.plan.balance ? route.plan.balance : "";
    var statusHTML = '<div class="plan-ruta-status" data-plan-route-status data-status="' + esc(route.status) + '"' +
      ' data-balance="' + esc(balance) + '">' +
      '<span class="plan-ruta-status-label">' + esc(statusCopy) + '</span>' +
      '<p class="plan-ruta-status-message">' + esc(statusMessage(route)) + '</p>' +
      '</div>';
    var main = statusHTML + (hasItems ? meterHTML(route) : "") +
      (hasItems ? listHTML(route, meta) : emptyHTML(route, meta, signals)) +
      notesHTML(route);
    var aside = planSummaryHTML(route, meta);
    return '<div class="plan-ruta-layout">' +
        '<div class="plan-ruta-main">' + main + '</div>' +
        '<aside class="plan-ruta-side">' + aside + '</aside>' +
      '</div>' +
      beforeExamHTML() +
      weeklyHTML(view.weekly, meta && meta.savedWeekly);
  }

  /* ------------------------------------------------------------------ */
  /* Ciclo de vida DOM                                                   */
  /* ------------------------------------------------------------------ */

  function findSection(ctx) {
    var container = ctx && ctx.root ? ctx.root : documentRoot();
    if (!container || typeof container.querySelector !== "function") return null;
    return container.querySelector('[data-plan-view="' + VIEW + '"]');
  }

  function setState(stateName) {
    if (page.section) page.section.setAttribute("data-plan-state", stateName || "loading");
  }

  function showLoading() {
    if (!page.body) return;
    if (page.error) page.error.hidden = true;
    if (!page.section.querySelector("[data-plan-loading]")) {
      var holder = documentRoot().createElement("div");
      holder.innerHTML = skeletonHTML();
      page.body.insertBefore(holder.firstElementChild, page.error || page.body.firstChild);
    }
    page.loading = page.section.querySelector("[data-plan-loading]");
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
    var message = error && typeof error.message === "string" && error.message
      ? error.message
      : "No pude cargar el modelo de planificación.";
    hideLoading();
    setState("error");
    if (page.content) page.content.innerHTML = "";
    if (page.error) {
      page.error.innerHTML = errorHTML(message);
      page.error.hidden = false;
    }
    var retry = page.error ? page.error.querySelector("[data-plan-action]") : null;
    if (retry && typeof retry.focus === "function") {
      try { retry.focus({ preventScroll: true }); } catch (clickError) { retry.focus(); }
    }
  }

  function paint(token, ctx) {
    if (!page.section || token !== page.token) return;
    var R = runtime();
    var Model = (R && typeof R.model === "function" ? R.model() : null) || (root && root.StudyPlanModel) || null;
    if (!Model || typeof Model.buildTodayRoute !== "function") {
      showError(token, new Error("El modelo de planificación no está disponible."));
      return;
    }
    var input;
    try {
      input = R && typeof R.input === "function" ? viewInput(R, ctx) : null;
    } catch (error) {
      showError(token, error);
      return;
    }
    if (!input) {
      showError(token, new Error("El runtime de planificación no entrega datos."));
      return;
    }
    var view;
    try {
      view = build(input, Model);
    } catch (error) {
      showError(token, error);
      return;
    }
    var saved = persistWeekly(view.weekly);
    if (token !== page.token || !page.content) return;
    hideLoading();
    setState(view.route && view.route.status ? view.route.status : "sinDatos");
    if (page.error) page.error.hidden = true;
    page.content.innerHTML = contentHTML(view, {
      flashcardsHref: flashcardsHref(),
      savedWeekly: saved,
      planRecord: input.planRecord || (R && typeof R.plan === "function" ? R.plan() : null)
    });
  }

  function load(ctx) {
    page.ctx = ctx || page.ctx;
    page.token += 1;
    var token = page.token;
    showLoading();
    var R = runtime();
    if (!R || typeof R.ensureModel !== "function") {
      showError(token, new Error("El runtime de planificación no está cargado. Recarga la página para volver a intentarlo."));
      return;
    }
    var current = typeof R.model === "function" ? R.model() : null;
    if (current) {
      paint(token, page.ctx);
      return;
    }
    var ready;
    try {
      ready = R.ensureModel();
    } catch (error) {
      showError(token, error);
      return;
    }
    if (!ready || typeof ready.then !== "function") {
      paint(token, page.ctx);
      return;
    }
    ready.then(function () {
      if (token === page.token) paint(token, page.ctx);
    }).catch(function (error) {
      if (token === page.token) showError(token, error);
    });
  }

  function refresh() {
    if (!page.section) return;
    var name = currentRouteName();
    if (name && name !== VIEW) return;
    load(page.ctx);
  }

  function schedule() {
    if (page.frame) return;
    var raf = root.requestAnimationFrame || function (fn) { return root.setTimeout(fn, 16); };
    page.frame = raf(function () {
      page.frame = 0;
      refresh();
    });
  }

  function onStoreChange(detail) {
    if (page.selfWrite) return;
    if (detail && detail.change === "weekly") return;
    schedule();
  }

  function onClick(event) {
    var target = event && event.target && event.target.closest ? event.target.closest("[data-plan-action]") : null;
    if (!target) return;
    if (page.section && !page.section.contains(target)) return;
    var action = target.getAttribute("data-plan-action");
    if (action === "retry-model") {
      event.preventDefault();
      load(page.ctx);
    }
  }

  function subscribe() {
    var events = appEvents();
    if (!events || typeof events.on !== "function") return;
    page.offs.push(events.on("plan:changed", schedule));
    page.offs.push(events.on("store:change", onStoreChange));
    page.offs.push(events.on("review:changed", schedule));
    page.offs.push(events.on("doubt:changed", schedule));
  }

  function mount(ctx) {
    var section = findSection(ctx);
    if (!section) return;
    page.ctx = ctx || page.ctx;
    page.section = section;
    page.body = section.querySelector("[data-plan-body]");
    page.content = section.querySelector("[data-plan-content]");
    page.error = section.querySelector("[data-plan-error]");
    page.loading = section.querySelector("[data-plan-loading]");
    page.token = 0;
    page.frame = 0;
    page.clickHandler = onClick;
    section.addEventListener("click", page.clickHandler);
    subscribe();
    load(ctx);
  }

  function unmount() {
    page.token += 1;
    if (page.frame) {
      var cancel = root.cancelAnimationFrame || root.clearTimeout;
      if (typeof cancel === "function") cancel(page.frame);
      page.frame = 0;
    }
    (page.offs || []).forEach(function (off) {
      try { if (typeof off === "function") off(); } catch (error) { /* listener ya retirado */ }
    });
    page.offs = [];
    if (page.section && page.clickHandler) {
      page.section.removeEventListener("click", page.clickHandler);
    }
    page.ctx = null;
    page.section = null;
    page.body = null;
    page.content = null;
    page.error = null;
    page.loading = null;
    page.clickHandler = null;
    page.savedSignature = null;
    page.savedRecord = null;
    page.selfWrite = false;
  }

  /* ------------------------------------------------------------------ */
  /* Registro                                                            */
  /* ------------------------------------------------------------------ */

  var api = {
    version: VERSION,
    moduleId: MODULE_ID,
    view: VIEW,
    routePath: ROUTE_PATH,
    titleId: TITLE_ID,
    title: TITLE,
    render: render,
    mount: mount,
    unmount: unmount,
    shellHTML: shellHTML,
    skeletonHTML: skeletonHTML,
    errorHTML: errorHTML,
    contentHTML: contentHTML,
    weeklyPayload: weeklyPayload,
    build: build,
    signalsFor: signalsFor,
    viewInput: viewInput,
    persistWeekly: persistWeekly,
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
          restoreScroll: true,
          render: render,
          mount: mount,
          unmount: unmount
        }]
      });
      api.__registered = true;
      return true;
    }
  };

  /* En el navegador, StudyApp existe cuando este script se carga después de
     app.js; si aún no está, se reintenta durante ~2 s sin bloquear. */
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
