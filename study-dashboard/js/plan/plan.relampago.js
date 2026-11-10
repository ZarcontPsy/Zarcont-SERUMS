/* SERUMS STUDY — Repaso relámpago (#/relampago, Fase 3)
   Módulo `plan-relampago`: ronda de 10 preguntas cortas con datos reales del
   temario (datos para memorizar, definiciones y avisos), sin cronómetro, sin
   tarjetas de Study Flashcards y sin guardar la ronda.

   Reglas del módulo:
   · Los derivados se cargan SOLO al montar la vista, con StudyReference.load;
     nunca al evaluar el archivo ni en la portada.
   · No escribe en el store: la calificación es de la ronda, no de `factsKnown`
     ni de las cajas de Flashcards.
   · Si un derivado falla: error con reintento; nunca preguntas inventadas.
   · Todo el HTML se escapa; el CSS vive en css/plan-relampago.css bajo `.plan-*`.

   Contrato: study-dashboard/docs/CONTRATOS-FASE3.md §4.4
   Uso:
     navegador  <script src="js/plan/plan.relampago.js"></script>
                -> window.StudyPlanRelampago (se registra solo)
     Node       require("./plan.relampago.js")  (funciones puras, sin DOM)

   © 2026 ZARCONT */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root);
  } else {
    root.StudyPlanRelampago = factory(root);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var MODULE_ID = "plan-relampago";
  var VIEW = "relampago";
  var ROUTE_PATH = "relampago";
  var TITLE = "Repaso relámpago";
  var TITLE_ID = "plan-relampago-title";
  var ROUND_SIZE = 10;
  /* Reparto de la ronda: más datos (son el grueso del temario), luego
     definiciones y avisos. Si un tipo no alcanza, los huecos se rellenan. */
  var QUOTA = { facts: 4, glossary: 3, warnings: 3 };
  var KIND_ORDER = ["facts", "glossary", "warnings"];
  var KIND_LABEL = { facts: "Dato", glossary: "Definición", warnings: "Aviso" };
  var KIND_TOTAL = { facts: "datos", glossary: "definiciones", warnings: "avisos" };

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
    round: null,
    index: 0,
    known: 0,
    again: 0,
    revealed: false,
    areaId: ""
  };

  /* ------------------------------------------------------------------ */
  /* Host: StudyReference y utilidades                                  */
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

  /* PRNG determinista para poder probar la ronda sin DOM. */
  function mulberry32(seed) {
    var a = (Number(seed) || 0) >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(list, rand) {
    var out = list.slice();
    for (var i = out.length - 1; i > 0; i -= 1) {
      var j = Math.floor(rand() * (i + 1));
      var tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  /* ------------------------------------------------------------------ */
  /* Ronda: preguntas reales                                            */
  /* ------------------------------------------------------------------ */

  function questionFor(kind, entry) {
    if (!entry) return null;
    var prompt = "";
    var answer = "";
    var extra = "";
    var label = KIND_LABEL[kind] || "Pregunta";
    if (kind === "facts") {
      prompt = entry.term || "";
      answer = entry.detail || "";
      extra = Array.isArray(entry.headers) && entry.headers.length ? entry.headers.join(" · ") : "";
    } else if (kind === "glossary") {
      prompt = entry.term || "";
      answer = entry.definition || "";
    } else {
      prompt = entry.title || "";
      answer = entry.text || "";
      label = entry.source === "bullet" ? "Distinción" : "Aviso";
    }
    if (!prompt || !answer) return null;
    return {
      id: kind + ":" + entry.id,
      kind: kind,
      label: label,
      prompt: prompt,
      answer: answer,
      extra: extra,
      context: [entry.sheetTitle, entry.sectionTitle].filter(Boolean).join(" · "),
      sheetId: entry.sheetId || "",
      areaId: entry.areaId || "",
      areaShort: entry.areaShort || "",
      source: entry.source || ""
    };
  }

  function filtered(entries, kind, areaId) {
    var list = entries && Array.isArray(entries[kind]) ? entries[kind] : [];
    return list.filter(function (entry) {
      return !!entry && (!areaId || entry.areaId === areaId);
    });
  }

  function countsFor(entries, areaId) {
    var counts = { facts: 0, glossary: 0, warnings: 0, total: 0 };
    KIND_ORDER.forEach(function (kind) {
      counts[kind] = filtered(entries, kind, areaId).length;
      counts.total += counts[kind];
    });
    return counts;
  }

  function normalizePrompt(value) {
    var R = reference();
    if (R && typeof R.normalize === "function") return R.normalize(value);
    return String(value == null ? "" : value).toLowerCase().replace(/\s+/g, " ").trim();
  }

  /* Construye la ronda: cuotas por tipo, relleno si falta y barajado final.
     Devuelve también los totales disponibles para que la UI no invente cifras. */
  function buildRound(entries, options) {
    var opts = options || {};
    var count = Math.max(1, Math.floor(Number(opts.count) || ROUND_SIZE));
    var areaId = typeof opts.areaId === "string" ? opts.areaId : "";
    var seed = opts.seed === undefined || opts.seed === null ? 1 : Number(opts.seed) >>> 0;
    var rand = mulberry32(seed);
    var buckets = {};
    var available = {};
    KIND_ORDER.forEach(function (kind) {
      var list = shuffle(filtered(entries, kind, areaId), rand);
      buckets[kind] = list;
      available[kind] = list.length;
    });

    var picked = [];
    var used = {};
    var usedPrompts = {};
    function take(kind, n) {
      var list = buckets[kind];
      for (var i = 0; i < list.length && n > 0 && picked.length < count; i += 1) {
        var entry = list[i];
        var key = kind + ":" + entry.id;
        if (used[key]) continue;
        var question = questionFor(kind, entry);
        if (!question) continue;
        /* Un mismo enunciado dos veces en la misma ronda confunde: se salta. */
        var promptKey = normalizePrompt(question.prompt);
        if (usedPrompts[promptKey]) continue;
        used[key] = true;
        usedPrompts[promptKey] = true;
        picked.push(question);
        n -= 1;
      }
    }

    KIND_ORDER.forEach(function (kind) { take(kind, QUOTA[kind] || 0); });
    /* Relleno: una vuelta por tipo hasta completar o agotar el material. */
    while (picked.length < count) {
      var before = picked.length;
      KIND_ORDER.forEach(function (kind) {
        if (picked.length < count) take(kind, 1);
      });
      if (picked.length === before) break;
    }

    var questions = shuffle(picked, rand);
    return {
      questions: questions,
      available: available,
      availableTotal: available.facts + available.glossary + available.warnings,
      count: questions.length,
      requested: count,
      short: questions.length < count,
      seed: seed,
      areaId: areaId
    };
  }

  /* ------------------------------------------------------------------ */
  /* HTML                                                               */
  /* ------------------------------------------------------------------ */

  function skeletonHTML() {
    return '<div class="plan-quick-loading" data-quick-loading role="status">' +
      '<span class="plan-quick-loading-text">Cargando datos, definiciones y avisos…</span>' +
      '<span class="plan-quick-skeleton" aria-hidden="true"><i></i><i></i><i></i></span>' +
      '</div>';
  }

  function errorHTML(message) {
    return '<p class="plan-quick-error-text">' + esc(message) + '</p>' +
      '<div class="plan-quick-error-actions">' +
        '<button class="s-btn s-btn--sm" type="button" data-quick-retry>Volver a intentar</button>' +
        '<a class="s-btn s-btn--ghost s-btn--sm" href="#/" data-nav>Volver al panel</a>' +
      '</div>';
  }

  function headerHTML() {
    return '<header class="plan-quick-hero">' +
      '<a class="plan-quick-back" href="#/" data-nav>' + icon("arrowLeft", 14) + '<span>Panel</span></a>' +
      '<span class="plan-quick-kicker"><span class="plan-quick-dot" aria-hidden="true"></span>Última hora · Herramientas</span>' +
      '<h1 class="plan-quick-title" id="' + TITLE_ID + '">' + TITLE + '</h1>' +
      '<p class="plan-quick-lede">Diez preguntas de memoria rápida con datos reales del temario: definiciones, datos y avisos. Sin cronómetro, sin tarjetas y sin guardar nada.</p>' +
      '<nav class="plan-quick-nav" aria-label="Herramientas de última hora">' +
        '<a href="#/ruta" data-nav>Ruta de hoy</a>' +
        '<a href="#/ultimo-dia" data-nav>Hoja de último día</a>' +
        '<a href="#/glosario" data-nav>Glosario</a>' +
        '<a href="#/datos" data-nav>Datos</a>' +
      '</nav>' +
      '</header>';
  }

  function shellHTML() {
    return '<section class="plan-quick" data-plan-view="' + VIEW + '" data-plan-state="loading" aria-labelledby="' + TITLE_ID + '">' +
      headerHTML() +
      '<div class="plan-quick-body" data-quick-body aria-busy="true">' +
        skeletonHTML() +
        '<div class="plan-quick-error" data-quick-error role="alert" hidden></div>' +
        '<div class="plan-quick-stage" data-quick-stage></div>' +
      '</div>' +
      '</section>';
  }

  function areaOptionsHTML(areaId) {
    var R = reference();
    var areas = R && typeof R.areaOptions === "function" ? R.areaOptions() : [];
    if (!areas.length) return "";
    return '<label class="plan-quick-field" for="plan-quick-area">' +
        '<span>Área</span>' +
        '<select id="plan-quick-area" data-quick-area>' +
          '<option value="">Todas las áreas</option>' +
          areas.map(function (area) {
            return '<option value="' + esc(area.id) + '"' + (area.id === areaId ? " selected" : "") + '>' +
              esc(area.title || area.short || area.id) + '</option>';
          }).join("") +
        '</select>' +
      '</label>';
  }

  function startHTML(counts, areaId) {
    var pool = counts.total;
    var size = Math.min(ROUND_SIZE, pool);
    var short = pool < ROUND_SIZE;
    var disabled = pool === 0;
    var detail = KIND_ORDER.map(function (kind) {
      return counts[kind] + " " + KIND_TOTAL[kind];
    }).join(" · ");
    return '<div class="plan-quick-start" data-quick-startpanel>' +
      '<div class="plan-quick-start-copy">' +
        '<h2 class="plan-quick-h2">Una ronda corta, sin notas</h2>' +
        '<p class="plan-quick-text">Te muestro un término, un dato o el título de un aviso del temario; intentas recordarlo y luego lo compruebas. La calificación es solo de esta ronda: no toca tus tarjetas ni tu progreso.</p>' +
        '<p class="plan-quick-pool" data-quick-pool>' + esc(detail) + ' disponibles · ' +
          (disabled ? "no hay material para esta área" : (short ? "la ronda tendrá " + size + " preguntas" : "ronda de " + size + " preguntas")) + '</p>' +
      '</div>' +
      '<div class="plan-quick-start-form">' +
        areaOptionsHTML(areaId) +
        '<button class="s-btn plan-quick-start-btn" type="button" data-quick-start' + (disabled ? " disabled" : "") + '>' +
          'Empezar ronda de ' + size +
        '</button>' +
        (disabled ? '<p class="plan-quick-hint">Prueba con otra área o vuelve a cargar los datos.</p>' : "") +
      '</div>' +
      '</div>';
  }

  function progressHTML(answered, total, label) {
    var value = total > 0 ? Math.round((Math.min(answered, total) / total) * 100) : 0;
    var text = label || ("Pregunta " + (answered + 1) + " de " + total);
    return '<div class="plan-quick-progress">' +
      '<span class="plan-quick-progress-text" data-quick-progress>' + esc(text) + '</span>' +
      '<span class="plan-quick-progress-track" role="progressbar" aria-label="Progreso de la ronda" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + Math.min(answered, total) + '" aria-valuetext="' + esc(answered + " de " + total + " preguntas") + '">' +
        '<span class="plan-quick-progress-fill" style="--plan-quick-fill:' + value + '%"></span>' +
      '</span>' +
      '</div>';
  }

  function questionHTML(question, index, total, revealed) {
    var context = question.context
      ? '<p class="plan-quick-context">' + esc(clip(question.context, 110)) + '</p>'
      : "";
    var answer = revealed
      ? '<div class="plan-quick-answer" data-quick-answer>' +
          '<p class="plan-quick-answer-text">' + esc(question.answer) + '</p>' +
          (question.extra ? '<p class="plan-quick-answer-extra">' + esc(question.extra) + '</p>' : "") +
        '</div>'
      : '<div class="plan-quick-answer" data-quick-answer hidden></div>';
    var actions = revealed
      ? '<div class="plan-quick-rate" data-quick-rate-group>' +
          '<button class="s-btn plan-quick-rate-btn is-known" type="button" data-quick-rate="known">' + icon("check", 15) + ' La sabía</button>' +
          '<button class="s-btn s-btn--ghost plan-quick-rate-btn" type="button" data-quick-rate="again">' + icon("rotate", 15) + ' Repasar</button>' +
        '</div>'
      : '<button class="s-btn plan-quick-reveal" type="button" data-quick-reveal>Mostrar respuesta</button>';
    return '<div class="plan-quick-card" data-quick-card data-kind="' + esc(question.kind) + '" role="group" aria-labelledby="plan-quick-prompt">' +
      progressHTML(index, total) +
      '<p class="plan-quick-kind"><span class="plan-quick-kind-dot" aria-hidden="true"></span>' + esc(question.label) +
        (question.areaShort ? " · " + esc(question.areaShort) : "") + '</p>' +
      '<h2 class="plan-quick-prompt" id="plan-quick-prompt" data-quick-prompt>' + esc(question.prompt) + '</h2>' +
      context +
      answer +
      '<div class="plan-quick-actions">' + actions + '</div>' +
      '</div>' +
      '<p class="s-sr-only" aria-live="polite">' + esc("Pregunta " + (index + 1) + " de " + total + ": " + question.prompt) + '</p>';
  }

  function scoreHTML(known, again, total) {
    var pct = total > 0 ? Math.round((known / total) * 100) : 0;
    return '<div class="plan-quick-score" data-quick-score>' +
      progressHTML(total, total, "Ronda completada") +
      '<p class="plan-quick-score-value"><b>' + known + '</b><span>de ' + total + '</span></p>' +
      '<p class="plan-quick-score-text">' + (again === 0
        ? "Ronda completa: recordaste todo lo que te propuse."
        : again + " " + plural(again, "pregunta", "preguntas") + " para repasar la próxima vez. " + pct + " % de acierto.") + '</p>' +
      '<div class="plan-quick-score-actions">' +
        '<button class="s-btn" type="button" data-quick-restart>Otra ronda</button>' +
        '<button class="s-btn s-btn--ghost" type="button" data-quick-change-area>Cambiar de área</button>' +
        '<a class="s-btn s-btn--ghost" href="#/ultimo-dia" data-nav>Hoja de último día</a>' +
      '</div>' +
      '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* Render y estado                                                    */
  /* ------------------------------------------------------------------ */

  function setState(name) {
    if (page.section) page.section.setAttribute("data-plan-state", name || "loading");
  }

  function focusIn(selector) {
    if (!page.stage || !selector) return;
    var el = page.stage.querySelector(selector);
    if (!el || typeof el.focus !== "function") return;
    try {
      el.focus({ preventScroll: true });
    } catch (error) {
      el.focus();
    }
  }

  function renderStart() {
    var counts = countsFor(page.entries, page.areaId);
    page.phase = "start";
    page.round = null;
    page.revealed = false;
    setState("start");
    page.stage.innerHTML = startHTML(counts, page.areaId);
  }

  function startRound() {
    var round = buildRound(page.entries, {
      areaId: page.areaId,
      count: ROUND_SIZE,
      seed: (Date.now() >>> 0) ^ Math.floor(Math.random() * 0xffffffff)
    });
    page.round = round;
    page.index = 0;
    page.known = 0;
    page.again = 0;
    page.revealed = false;
    if (!round.questions.length) {
      renderStart();
      return;
    }
    renderQuestion();
    focusIn("[data-quick-reveal]");
  }

  function renderQuestion() {
    var round = page.round;
    page.phase = "question";
    setState("question");
    page.stage.innerHTML = questionHTML(round.questions[page.index], page.index, round.questions.length, page.revealed);
    if (page.revealed) focusIn('[data-quick-rate="known"]');
    else focusIn("[data-quick-reveal]");
  }

  function reveal() {
    if (!page.round || page.phase !== "question") return;
    page.revealed = true;
    page.phase = "revealed";
    setState("revealed");
    page.stage.innerHTML = questionHTML(page.round.questions[page.index], page.index, page.round.questions.length, true);
    focusIn('[data-quick-rate="known"]');
  }

  function rate(value) {
    if (page.phase !== "revealed" || !page.round) return;
    if (value === "known") page.known += 1;
    else page.again += 1;
    page.index += 1;
    page.revealed = false;
    if (page.index >= page.round.questions.length) {
      renderScore();
      focusIn("[data-quick-restart]");
      return;
    }
    renderQuestion();
  }

  function renderScore() {
    page.phase = "score";
    setState("score");
    page.stage.innerHTML = scoreHTML(page.known, page.again, page.round.questions.length);
  }

  function showLoading() {
    if (!page.body) return;
    if (page.error) page.error.hidden = true;
    if (!page.section.querySelector("[data-quick-loading]")) {
      var holder = documentRoot().createElement("div");
      holder.innerHTML = skeletonHTML();
      page.body.insertBefore(holder.firstElementChild, page.error || page.body.firstChild);
    }
    page.loading = page.section.querySelector("[data-quick-loading]");
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
      : "No pude cargar los datos de la ronda.";
    if (page.error) {
      page.error.innerHTML = errorHTML(message);
      page.error.hidden = false;
    }
    var retry = page.error ? page.error.querySelector("[data-quick-retry]") : null;
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
      renderStart();
    }).catch(function (error) {
      if (token !== page.token) return;
      showError(token, error);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Eventos                                                            */
  /* ------------------------------------------------------------------ */

  function onClick(event) {
    var target = event && event.target && event.target.closest ? event.target.closest("[data-quick-start], [data-quick-reveal], [data-quick-rate], [data-quick-restart], [data-quick-change-area], [data-quick-retry]") : null;
    if (!target || (page.section && !page.section.contains(target))) return;
    if (target.hasAttribute("data-quick-retry")) {
      event.preventDefault();
      load(page.ctx);
      return;
    }
    if (target.hasAttribute("data-quick-start")) {
      event.preventDefault();
      startRound();
      return;
    }
    if (target.hasAttribute("data-quick-reveal")) {
      event.preventDefault();
      reveal();
      return;
    }
    if (target.hasAttribute("data-quick-rate")) {
      event.preventDefault();
      rate(target.getAttribute("data-quick-rate"));
      return;
    }
    if (target.hasAttribute("data-quick-restart")) {
      event.preventDefault();
      startRound();
      return;
    }
    if (target.hasAttribute("data-quick-change-area")) {
      event.preventDefault();
      renderStart();
      focusIn("[data-quick-start]");
    }
  }

  function onChange(event) {
    var target = event && event.target;
    if (!target || !target.hasAttribute || !target.hasAttribute("data-quick-area")) return;
    page.areaId = target.value || "";
    if (page.phase === "start") {
      renderStart();
      focusIn("[data-quick-area]");
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
    page.body = section.querySelector("[data-quick-body]");
    page.stage = section.querySelector("[data-quick-stage]");
    page.error = section.querySelector("[data-quick-error]");
    page.loading = section.querySelector("[data-quick-loading]");
    page.phase = "idle";
    page.entries = null;
    page.round = null;
    page.index = 0;
    page.known = 0;
    page.again = 0;
    page.revealed = false;
    page.areaId = "";
    page.clickHandler = onClick;
    page.changeHandler = onChange;
    section.addEventListener("click", page.clickHandler);
    section.addEventListener("change", page.changeHandler);
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
    page.round = null;
    page.phase = "idle";
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
    roundSize: ROUND_SIZE,
    quota: QUOTA,
    render: render,
    mount: mount,
    unmount: unmount,
    shellHTML: shellHTML,
    skeletonHTML: skeletonHTML,
    errorHTML: errorHTML,
    startHTML: startHTML,
    questionHTML: questionHTML,
    scoreHTML: scoreHTML,
    buildRound: buildRound,
    countsFor: countsFor,
    questionFor: questionFor,
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
