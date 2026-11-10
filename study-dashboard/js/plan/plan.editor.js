/* SERUMS STUDY — Editor del plan de estudio (Fase 2, ruta #/plan)
   Módulo `plan-editor`: fecha de examen, minutos por día, días por semana y
   prioridad por área oficial, con vista previa real y guardado en StudyStore.

   Reglas del módulo:
   · No carga plan-model.js al evaluarse: StudyPlanRuntime.ensureModel() se pide
     solo desde mount(), la primera vez que se abre #/plan.
   · No escribe en el store salvo por acción explícita del usuario
     (StudyStore.plan.save / StudyStore.plan.remove). La vista previa es de
     solo lectura y nunca guarda nada.
   · Valida antes de guardar: ningún valor inválido llega al store.
   · No inventa áreas ni cifras. Las áreas salen del contenido real
     (STUDY_CONTENT.primaryAreas / StudyPlanRuntime.categories()); la
     previsualización sale de StudyPlanModel.buildPlan().
   · Todo texto se escapa; el CSS vive en css/plan-editor.css bajo
     .plan-page--editor y .plan-editor*.

   Contrato: study-dashboard/docs/CONTRATOS-FASE2.md §4.2 y §5
   © 2026 ZARCONT */
(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var MODULE_ID = "plan-editor";
  var ROUTE_PATH = "plan";
  var TITLE_ID = "plan-editor-title";
  var PREVIEW_TITLE_ID = "plan-editor-preview-title";
  var FORM_TITLE_ID = "plan-editor-form-title";

  /* Sugerencias iniciales solo para el formulario cuando aún no hay plan:
     coinciden con los valores por defecto de StudyStore.buildPlan. */
  var DEFAULT_MINUTES = 45;
  var DEFAULT_DAYS = 5;
  var MAX_MINUTES = 1440;
  var MIN_DAYS = 1;
  var MAX_DAYS = 7;

  /* El contrato fija tres prioridades; el valor viaja como número. */
  var PRIORITY_OPTIONS = [
    { value: 1, label: "Normal", aria: "Prioridad 1, normal" },
    { value: 1.5, label: "Antes", aria: "Prioridad 1,5, antes" },
    { value: 2, label: "Primero", aria: "Prioridad 2, primero" }
  ];

  var PREVIEW_DEBOUNCE = 180;
  var STORE_DEBOUNCE = 320;
  var MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  var FIELD_ORDER = ["examDate", "minutesPerDay", "daysPerWeek"];

  /* ------------------------------------------------------------------ */
  /* Estado de la vista                                                  */
  /* ------------------------------------------------------------------ */

  var state = {
    ctx: null,
    root: null,
    store: null,
    mounted: false,
    loadToken: 0,
    previewToken: 0,
    modelReady: false,
    loading: false,
    loadError: "",
    previewTimer: 0,
    storeTimer: 0,
    subscribed: false,
    selfChange: false,
    saving: false,
    baselineSig: "",
    lastStoreSig: "",
    touched: {},
    submitAttempted: false,
    retryFocus: false,
    dialog: null
  };

  /* ------------------------------------------------------------------ */
  /* Utilidades defensivas                                               */
  /* ------------------------------------------------------------------ */

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object || {}, key);
  }
  function isObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }
  function runtime() {
    return root.StudyPlanRuntime || null;
  }
  function appApi() {
    return root.StudyApp || null;
  }
  function esc(value) {
    var rt = runtime();
    if (rt && typeof rt.escape === "function") return rt.escape(value);
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
    var rt = runtime();
    if (rt && typeof rt.icon === "function") return rt.icon(name, size || 16);
    if (root.StudyUI && typeof root.StudyUI.icon === "function") return root.StudyUI.icon(name, size || 16);
    return "";
  }
  function plural(n, one, many) {
    var rt = runtime();
    if (rt && typeof rt.plural === "function") return rt.plural(n, one, many);
    return Number(n) === 1 ? one : (many || one + "s");
  }
  function groupDigits(value) {
    var n = Math.round(Number(value));
    if (!isFinite(n)) return "0";
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  function minutesLabel(value) {
    return groupDigits(value) + " min";
  }
  function fichasLabel(n) {
    return groupDigits(n) + " " + plural(n, "ficha", "fichas");
  }
  function dateLabel(value) {
    var rt = runtime();
    if (rt && rt.format && typeof rt.format.date === "function") {
      var formatted = rt.format.date(value);
      if (formatted) return formatted;
    }
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value == null ? "" : value));
    if (!match || !isDateKey(value)) return String(value == null ? "" : value);
    return Number(match[3]) + " " + MONTHS[Number(match[2]) - 1] + " " + match[1];
  }
  function formatPriority(value) {
    return String(value).replace(".", ",");
  }
  function isDateKey(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value == null ? "" : value));
    if (!match) return false;
    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3]);
    var probe = new Date(Date.UTC(year, month - 1, day));
    return probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day;
  }
  function storeApi() {
    if (state.store) return state.store;
    if (state.ctx && state.ctx.store) return state.ctx.store;
    return root.StudyStore || null;
  }
  function storeFor(ctx) {
    if (ctx && ctx.store) return ctx.store;
    return storeApi();
  }
  function readPlanFrom(store) {
    if (!store || !store.plan || typeof store.plan.get !== "function") return null;
    try { return store.plan.get() || null; } catch (error) { return null; }
  }
  function safePlan() {
    return readPlanFrom(storeApi());
  }
  function canSavePlan(store) {
    return !!(store && store.plan && typeof store.plan.save === "function");
  }
  function canRemovePlan(store) {
    return !!(store && store.plan && typeof store.plan.remove === "function");
  }
  function announce(message) {
    var ctx = state.ctx;
    if (ctx && typeof ctx.announce === "function") {
      try { ctx.announce(message); return; } catch (error) { /* sin anuncio */ }
    }
    var app = appApi();
    if (app && typeof app.announce === "function") {
      try { app.announce(message); } catch (error) { /* sin anuncio */ }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Áreas oficiales y prioridad                                         */
  /* ------------------------------------------------------------------ */

  function contentSheets() {
    var rt = runtime();
    if (rt && typeof rt.sheets === "function") {
      var list = rt.sheets();
      return Array.isArray(list) ? list : [];
    }
    var content = root.STUDY_CONTENT;
    return content && Array.isArray(content.sheets) ? content.sheets : [];
  }

  /* Áreas oficiales reales. Se prefiere STUDY_CONTENT.primaryAreas (las cinco
     del examen) y, si aún no está aplicada la taxonomía, se derivan de las
     categorías reales; nunca se inventa un área. */
  function officialAreas() {
    var content = root.STUDY_CONTENT || null;
    var rt = runtime();
    var list = [];
    var seen = {};
    if (content && Array.isArray(content.primaryAreas) && content.primaryAreas.length) {
      list = content.primaryAreas;
    } else if (content) {
      var categories = rt && typeof rt.categories === "function"
        ? rt.categories()
        : (Array.isArray(content.categories) ? content.categories : []);
      var allowed = {};
      categories.forEach(function (category) {
        if (category && category.areaId) allowed[category.areaId] = true;
      });
      list = (Array.isArray(content.areas) ? content.areas : []).filter(function (area) {
        return area && area.id && (allowed[area.id] || (content.primaryAreaById && content.primaryAreaById[area.id]));
      });
    }
    var totals = {};
    contentSheets().forEach(function (sheet) {
      if (!sheet) return;
      var areaId = sheet.primaryAreaId || sheet.areaId || "sin-area";
      if (!totals[areaId]) totals[areaId] = { sheets: 0, minutes: 0 };
      totals[areaId].sheets += 1;
      var minutes = Number(sheet.minutes);
      if (isFinite(minutes) && minutes > 0) totals[areaId].minutes += Math.round(minutes);
    });
    return list.filter(function (area) {
      if (!area || !area.id || seen[area.id]) return false;
      seen[area.id] = true;
      return true;
    }).map(function (area) {
      var tally = totals[area.id] || { sheets: 0, minutes: 0 };
      return {
        id: area.id,
        title: area.title || area.short || area.id,
        short: area.short || area.title || area.id,
        sheets: tally.sheets,
        minutes: tally.minutes
      };
    });
  }

  function normalizePriority(value) {
    var n = Number(value);
    if (!isFinite(n) || n <= 0) return 1;
    var best = PRIORITY_OPTIONS[0].value;
    var bestDistance = Infinity;
    PRIORITY_OPTIONS.forEach(function (option) {
      var distance = Math.abs(option.value - n);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = option.value;
      }
    });
    return best;
  }

  function prioritiesFromPlan(plan) {
    var source = plan && isObject(plan.areaPriority) ? plan.areaPriority : {};
    var out = {};
    Object.keys(source).forEach(function (areaId) {
      if (!areaId || areaId === "__proto__" || areaId === "constructor" || areaId === "prototype") return;
      var n = Number(source[areaId]);
      if (isFinite(n) && n > 0) out[areaId] = n;
    });
    officialAreas().forEach(function (area) {
      if (out[area.id] === undefined) out[area.id] = 1;
    });
    return out;
  }

  function normalizePriorityObject(value) {
    var out = {};
    if (!isObject(value)) return out;
    Object.keys(value).forEach(function (areaId) {
      if (!areaId || areaId === "__proto__" || areaId === "constructor" || areaId === "prototype") return;
      var n = Number(value[areaId]);
      if (!isFinite(n) || n <= 0) return;
      out[areaId] = n;
    });
    return out;
  }

  /* ------------------------------------------------------------------ */
  /* Borrador del formulario                                             */
  /* ------------------------------------------------------------------ */

  function formEl() {
    if (!state.root || typeof state.root.querySelector !== "function") return null;
    return state.root.querySelector("[data-plan-form]");
  }
  function previewHost() {
    if (!state.root || typeof state.root.querySelector !== "function") return null;
    return state.root.querySelector("[data-plan-preview]");
  }
  function fieldInput(field) {
    var form = formEl();
    if (!form || typeof form.querySelector !== "function") return null;
    return form.querySelector('[data-plan-field="' + field + '"]');
  }

  function planDraft(plan) {
    return {
      examDate: plan && plan.examDate ? String(plan.examDate) : "",
      minutesPerDay: plan && plan.minutesPerDay !== undefined && plan.minutesPerDay !== null
        ? String(plan.minutesPerDay)
        : String(DEFAULT_MINUTES),
      daysPerWeek: plan && plan.daysPerWeek !== undefined && plan.daysPerWeek !== null
        ? String(plan.daysPerWeek)
        : String(DEFAULT_DAYS),
      areaPriority: prioritiesFromPlan(plan)
    };
  }

  function readDraft() {
    var examInput = fieldInput("examDate");
    var minutesInput = fieldInput("minutesPerDay");
    var daysInput = fieldInput("daysPerWeek");
    var examRaw = examInput ? String(examInput.value == null ? "" : examInput.value).trim() : "";
    var minutesRaw = minutesInput ? String(minutesInput.value == null ? "" : minutesInput.value).trim() : "";
    var daysRaw = daysInput ? String(daysInput.value == null ? "" : daysInput.value).trim() : "";
    return {
      examDate: examRaw || null,
      examRaw: examRaw,
      minutesRaw: minutesRaw,
      minutesPerDay: minutesRaw === "" ? null : Number(minutesRaw),
      daysRaw: daysRaw,
      daysPerWeek: daysRaw === "" ? null : Number(daysRaw),
      areaPriority: readPriorities()
    };
  }

  function readPriorities() {
    var areas = officialAreas();
    var form = formEl();
    var fromPlan = prioritiesFromPlan(safePlan());
    var out = {};
    var official = {};
    areas.forEach(function (area) { official[area.id] = true; });
    /* Se conservan prioridades de áreas que no son oficiales (p. ej. estados
       importados) para no borrarlas al guardar desde esta vista. */
    Object.keys(fromPlan).forEach(function (areaId) {
      if (!official[areaId]) out[areaId] = fromPlan[areaId];
    });
    areas.forEach(function (area, index) {
      var checked = null;
      if (form && typeof form.querySelector === "function") {
        checked = form.querySelector('input[name="plan-editor-priority-' + index + '"]:checked');
      }
      var value = checked ? Number(checked.value) : fromPlan[area.id];
      out[area.id] = normalizePriority(value === undefined ? 1 : value);
    });
    return out;
  }

  function validateDraft(draft) {
    var errors = {};
    if (draft.examRaw && !isDateKey(draft.examDate)) {
      errors.examDate = "Esa fecha no existe. Elige un día real del calendario.";
    }
    if (draft.minutesRaw === "") {
      errors.minutesPerDay = "Escribe los minutos por día. Puede ser 0: no reservar tiempo es una decisión válida.";
    } else if (!isFinite(draft.minutesPerDay) || Math.floor(draft.minutesPerDay) !== draft.minutesPerDay) {
      errors.minutesPerDay = "Escribe un número entero de minutos entre 0 y 1440.";
    } else if (draft.minutesPerDay < 0 || draft.minutesPerDay > MAX_MINUTES) {
      errors.minutesPerDay = "Los minutos por día tienen que estar entre 0 y 1440.";
    }
    if (draft.daysRaw === "") {
      errors.daysPerWeek = "Escribe cuántos días por semana vas a estudiar.";
    } else if (!isFinite(draft.daysPerWeek) || Math.floor(draft.daysPerWeek) !== draft.daysPerWeek) {
      errors.daysPerWeek = "Escribe un número entero de días entre 1 y 7.";
    } else if (draft.daysPerWeek < MIN_DAYS || draft.daysPerWeek > MAX_DAYS) {
      errors.daysPerWeek = "Los días por semana tienen que estar entre 1 y 7.";
    }
    var ok = !Object.keys(errors).length;
    return {
      ok: ok,
      errors: errors,
      values: ok ? {
        examDate: draft.examDate || null,
        minutesPerDay: draft.minutesPerDay,
        daysPerWeek: draft.daysPerWeek,
        areaPriority: normalizePriorityObject(draft.areaPriority)
      } : null
    };
  }

  function prioritiesSignature(priorities) {
    var source = isObject(priorities) ? priorities : {};
    return officialAreas().map(function (area) {
      return area.id + ":" + String(source[area.id] === undefined ? 1 : source[area.id]);
    }).join(",");
  }

  function draftSignature(draft) {
    return [
      String(draft.examRaw || ""),
      String(draft.minutesRaw || ""),
      String(draft.daysRaw || ""),
      prioritiesSignature(draft.areaPriority)
    ].join("|");
  }

  function isDirty() {
    if (!state.baselineSig) return false;
    return draftSignature(readDraft()) !== state.baselineSig;
  }

  function storeSignature(plan) {
    if (!plan) return "none";
    var priority = plan.areaPriority && isObject(plan.areaPriority) ? plan.areaPriority : {};
    var keys = Object.keys(priority).sort();
    return JSON.stringify({
      examDate: plan.examDate || null,
      minutesPerDay: plan.minutesPerDay === undefined ? null : plan.minutesPerDay,
      daysPerWeek: plan.daysPerWeek === undefined ? null : plan.daysPerWeek,
      areaPriority: keys.map(function (key) { return key + "=" + String(priority[key]); })
    });
  }

  function savedLineText(plan) {
    if (!plan) return "Ahora mismo no hay ningún plan guardado. Los valores de abajo son una propuesta inicial.";
    var parts = [];
    parts.push(minutesLabel(plan.minutesPerDay) + "/día");
    parts.push(plan.daysPerWeek + " " + plural(plan.daysPerWeek, "día", "días") + "/semana");
    parts.push(plan.examDate ? "examen " + dateLabel(plan.examDate) : "sin fecha de examen");
    var priority = prioritiesFromPlan(plan);
    var customized = officialAreas().filter(function (area) {
      return normalizePriority(priority[area.id]) !== 1;
    }).length;
    if (customized) parts.push(customized + " " + plural(customized, "área", "áreas") + " con prioridad");
    return "Guardado: " + parts.join(" · ") + ".";
  }

  /* ------------------------------------------------------------------ */
  /* Render de la página                                                 */
  /* ------------------------------------------------------------------ */

  function heroHTML() {
    return '' +
      '<header class="plan-editor-hero">' +
        '<nav class="plan-editor-breadcrumb" aria-label="Migas de pan">' +
          '<a class="plan-editor-back" href="#/" data-nav>' + icon("arrowLeft", 15) + '<span>Panel</span></a>' +
        '</nav>' +
        '<span class="plan-editor-kicker"><span class="plan-editor-dot" aria-hidden="true"></span>Planificación</span>' +
        '<h1 id="' + TITLE_ID + '" tabindex="-1">Plan de estudio</h1>' +
        '<p class="plan-editor-lead">Elige la fecha de examen, cuántos minutos puedes leer cada día y qué áreas quieres adelantar. La vista previa se calcula con el temario real: si el plan no cabe, lo dice sin adornos.</p>' +
        '<nav class="plan-editor-nav" aria-label="Otras vistas de planificación">' +
          navLinkHTML("#/ruta", "compass", "Ruta de hoy", "Lo que toca hoy, con minutos y motivos") +
          navLinkHTML("#/dominio", "target", "Mapa de dominio", "Qué áreas tienes flojas y por qué") +
          navLinkHTML("#/repaso", "rotate", "Repaso de fichas", "Qué releer hoy y cuándo vuelve") +
        '</nav>' +
      '</header>';
  }

  function navLinkHTML(href, iconName, title, text) {
    return '<a class="plan-editor-navlink" href="' + esc(href) + '" data-nav>' +
      '<span class="plan-editor-navlink-icon" aria-hidden="true">' + icon(iconName, 17) + '</span>' +
      '<span class="plan-editor-navlink-copy"><b>' + esc(title) + '</b><small>' + esc(text) + '</small></span>' +
    '</a>';
  }

  function fieldHTML(options) {
    return '' +
      '<div class="plan-editor-field' + (options.wide ? " plan-editor-field--wide" : "") + '">' +
        '<label class="plan-editor-label" for="' + options.id + '">' + esc(options.label) +
          (options.optional ? '<span class="plan-editor-optional">Opcional</span>' : "") +
        '</label>' +
        '<p class="plan-editor-hint" id="' + options.id + '-help">' + esc(options.help) + '</p>' +
        '<div class="plan-editor-input-row">' +
          '<input class="plan-editor-input" id="' + options.id + '" name="' + options.name + '" type="' + options.type + '"' +
            ' data-plan-field="' + options.field + '"' +
            ' value="' + esc(options.value) + '"' +
            (options.min !== undefined ? ' min="' + options.min + '"' : "") +
            (options.max !== undefined ? ' max="' + options.max + '"' : "") +
            (options.step !== undefined ? ' step="' + options.step + '"' : "") +
            (options.inputmode ? ' inputmode="' + options.inputmode + '"' : "") +
            ' aria-describedby="' + options.id + '-help ' + options.id + '-error"' +
          '>' +
          (options.unit ? '<span class="plan-editor-unit" aria-hidden="true">' + esc(options.unit) + '</span>' : "") +
        '</div>' +
        '<p class="plan-editor-error" id="' + options.id + '-error" data-plan-error-for="' + options.field + '" hidden></p>' +
      '</div>';
  }

  function areaChoiceHTML(area, index, option, checked) {
    var id = "plan-editor-area-" + index + "-p" + String(option.value).replace(".", "-");
    return '<label class="plan-editor-choice" for="' + id + '">' +
      '<input class="plan-editor-choice-input" type="radio" id="' + id + '"' +
        ' name="plan-editor-priority-' + index + '"' +
        ' value="' + option.value + '"' +
        ' data-plan-area-priority="' + esc(area.id) + '"' +
        ' aria-label="' + esc(option.aria) + '"' +
        (checked ? " checked" : "") +
      '>' +
      '<span class="plan-editor-choice-face">' +
        '<span class="plan-editor-choice-value">' + esc(formatPriority(option.value)) + '</span>' +
        '<span class="plan-editor-choice-label">' + esc(option.label) + '</span>' +
      '</span>' +
    '</label>';
  }

  function areasHTML(areas, priorities) {
    if (!areas.length) {
      return '<fieldset class="plan-editor-areas">' +
        '<legend class="plan-editor-legend">Prioridad por área</legend>' +
        '<p class="plan-editor-hint">No pude leer las áreas oficiales del temario. La prioridad por área quedará como está hasta que el contenido esté disponible.</p>' +
      '</fieldset>';
    }
    var rows = areas.map(function (area, index) {
      var current = normalizePriority(priorities[area.id]);
      var labelId = "plan-editor-area-" + index + "-label";
      var choices = PRIORITY_OPTIONS.map(function (option) {
        return areaChoiceHTML(area, index, option, current === option.value);
      }).join("");
      var meta = area.sheets
        ? groupDigits(area.sheets) + " " + plural(area.sheets, "ficha", "fichas") + " · " + minutesLabel(area.minutes)
        : "";
      return '<div class="plan-editor-area">' +
        '<div class="plan-editor-area-head">' +
          '<span class="plan-editor-area-name" id="' + labelId + '">' + esc(area.title) + '</span>' +
          (meta ? '<span class="plan-editor-area-meta">' + esc(meta) + '</span>' : "") +
        '</div>' +
        '<div class="plan-editor-choice-row" role="radiogroup" aria-labelledby="' + labelId + '">' + choices + '</div>' +
      '</div>';
    }).join("");
    return '<fieldset class="plan-editor-areas">' +
      '<legend class="plan-editor-legend">Prioridad por área</legend>' +
      '<p class="plan-editor-hint" id="plan-editor-areas-help">1 es el ritmo normal; 2 adelanta las fichas de esa área. La prioridad cambia el orden en que aparecen, nunca el total de minutos del área.</p>' +
      '<div class="plan-editor-area-list" aria-describedby="plan-editor-areas-help">' + rows + '</div>' +
    '</fieldset>';
  }

  function formHTML(plan, areas, canSave) {
    var values = planDraft(plan);
    var storeNotice = canSave ? "" :
      '<p class="plan-editor-alert" data-plan-store-missing role="alert">' + icon("alert", 16) +
      '<span>No pude leer el almacén del plan en este navegador. Puedes revisar los campos, pero guardar está desactivado.</span></p>';
    return '' +
      '<form class="plan-editor-form" data-plan-form novalidate aria-labelledby="' + FORM_TITLE_ID + '">' +
        '<div class="plan-editor-form-head">' +
          '<span class="plan-editor-kicker"><span class="plan-editor-dot" aria-hidden="true"></span>Ajustes</span>' +
          '<h2 id="' + FORM_TITLE_ID + '">Tu plan, en cuatro datos.</h2>' +
          '<p class="plan-editor-saved" data-plan-saved>' + esc(savedLineText(plan)) + '</p>' +
          storeNotice +
        '</div>' +
        '<div class="plan-editor-fields">' +
          fieldHTML({
            id: "plan-editor-exam-date",
            name: "examDate",
            field: "examDate",
            type: "date",
            label: "Fecha de examen",
            optional: true,
            value: values.examDate,
            help: "Si la dejas vacía, no prometeré que llegas: solo calcularé cuándo terminarías a este ritmo.",
            wide: true
          }) +
          fieldHTML({
            id: "plan-editor-minutes",
            name: "minutesPerDay",
            field: "minutesPerDay",
            type: "number",
            label: "Minutos por día",
            value: values.minutesPerDay,
            min: 0,
            max: MAX_MINUTES,
            step: 1,
            inputmode: "numeric",
            unit: "min",
            help: "De 0 a 1440. Un 0 es un valor real: significa que no reservas tiempo de lectura."
          }) +
          fieldHTML({
            id: "plan-editor-days",
            name: "daysPerWeek",
            field: "daysPerWeek",
            type: "number",
            label: "Días por semana",
            value: values.daysPerWeek,
            min: MIN_DAYS,
            max: MAX_DAYS,
            step: 1,
            inputmode: "numeric",
            unit: "días",
            help: "De 1 a 7. Los días se reparten desde hoy y el día del examen nunca cuenta como día de estudio."
          }) +
        '</div>' +
        areasHTML(areas, values.areaPriority) +
        '<div class="plan-editor-actions">' +
          '<button class="plan-editor-btn plan-editor-btn--primary" type="submit" data-plan-action="save"' +
            (canSave ? "" : " disabled aria-disabled=\"true\"") + '>' +
            '<span data-plan-save-label>' + (plan ? "Guardar cambios" : "Guardar plan") + '</span>' +
          '</button>' +
          '<button class="plan-editor-btn plan-editor-btn--quiet" type="button" data-plan-action="remove"' +
            (plan && canSave ? "" : " disabled") + '>Quitar plan</button>' +
        '</div>' +
        '<p class="plan-editor-status" data-plan-form-status role="status" aria-live="polite" aria-atomic="true" data-tone="idle"></p>' +
      '</form>';
  }

  function previewShellHTML() {
    return '' +
      '<aside class="plan-editor-preview" aria-labelledby="' + PREVIEW_TITLE_ID + '">' +
        '<div class="plan-editor-preview-head">' +
          '<span class="plan-editor-kicker"><span class="plan-editor-dot" aria-hidden="true"></span>Vista previa</span>' +
          '<h2 id="' + PREVIEW_TITLE_ID + '" tabindex="-1">Cómo queda tu plan.</h2>' +
        '</div>' +
        '<div class="plan-editor-preview-host" data-plan-preview data-plan-preview-state="loading" aria-busy="true">' +
          previewLoadingHTML() +
        '</div>' +
      '</aside>';
  }

  function render(ctx) {
    var store = storeFor(ctx);
    var plan = readPlanFrom(store);
    var canSave = canSavePlan(store);
    var areas = officialAreas();
    return '' +
      '<section class="plan-page plan-page--editor" data-plan-view="plan" aria-labelledby="' + TITLE_ID + '">' +
        heroHTML() +
        '<div class="plan-editor-layout">' +
          formHTML(plan, areas, canSave) +
          previewShellHTML() +
        '</div>' +
        '<p class="plan-editor-foot">' + icon("info", 14) +
          '<span>La vista previa usa el mismo motor que la Ruta de hoy y el Mapa de dominio. Guardar un plan no borra ni completa fichas: solo cambia cómo se reparten los minutos.</span>' +
        '</p>' +
      '</section>';
  }

  /* ------------------------------------------------------------------ */
  /* Vista previa                                                       */
  /* ------------------------------------------------------------------ */

  function previewLoadingHTML() {
    return '' +
      '<div class="plan-editor-skeleton" data-plan-loading role="status">' +
        '<span class="plan-editor-skeleton-bar"></span>' +
        '<span class="plan-editor-skeleton-bar"></span>' +
        '<span class="plan-editor-skeleton-bar"></span>' +
        '<span class="plan-editor-skeleton-grid"><span></span><span></span><span></span><span></span></span>' +
        '<span class="plan-editor-sr">Cargando el modelo de planificación…</span>' +
      '</div>';
  }

  function previewErrorHTML(message) {
    return '' +
      '<div class="plan-editor-preview-error" data-plan-error role="alert" tabindex="-1">' +
        '<span class="plan-editor-preview-icon" aria-hidden="true">' + icon("alert", 18) + '</span>' +
        '<div class="plan-editor-preview-error-copy">' +
          '<h3 class="plan-editor-preview-title">No pude cargar la vista previa.</h3>' +
          '<p class="plan-editor-preview-message">' + esc(message) +
            ' El formulario sigue funcionando: puedes guardar sin vista previa y reintentar cuando quieras.</p>' +
          '<div class="plan-editor-preview-actions">' +
            '<button class="plan-editor-btn plan-editor-btn--small" type="button" data-plan-action="retry">Reintentar</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function previewInvalidHTML(validation) {
    var messages = FIELD_ORDER.filter(function (field) {
      return !!validation.errors[field];
    }).map(function (field) {
      return '<li>' + esc(validation.errors[field]) + '</li>';
    }).join("");
    return '' +
      '<div class="plan-editor-preview-empty" data-plan-preview-invalid>' +
        '<span class="plan-editor-preview-icon" aria-hidden="true">' + icon("calendar", 18) + '</span>' +
        '<div class="plan-editor-preview-empty-copy">' +
          '<h3 class="plan-editor-preview-title">Faltan datos para calcular.</h3>' +
          '<p class="plan-editor-preview-message">Completa bien los campos del formulario y la previsualización aparecerá aquí, sin guardar nada.</p>' +
          (messages ? '<ul class="plan-editor-preview-list">' + messages + '</ul>' : "") +
        '</div>' +
      '</div>';
  }

  function previewIconName(model) {
    if (model.status === "sinDatos" || model.status === "sinFichas" || model.status === "sinPresupuesto" || model.status === "sinTiempo") {
      return "alert";
    }
    if (model.status === "completado") return "checkCircle";
    if (model.balance === "ahead") return "checkCircle";
    if (model.balance === "behind") return "alert";
    return "calendar";
  }

  function previewTitle(model) {
    if (model.status === "sinDatos") return "No pude leer el temario.";
    if (model.status === "sinFichas") return "No hay fichas que repartir.";
    if (model.status === "sinPresupuesto") return "Falta el presupuesto de minutos.";
    if (model.status === "sinTiempo") return "0 minutos al día: no hay plan.";
    if (model.status === "sinFecha") return "Sin fecha, sin promesa.";
    if (model.status === "fechaPasada") return "La fecha de examen ya pasó.";
    if (model.status === "completado") return "No queda nada pendiente.";
    if (model.balance === "ahead") return "Llegas con margen.";
    if (model.balance === "onTrack") return "Llegas justo.";
    if (model.balance === "behind") return "Con este ritmo no alcanza.";
    return "Vista previa del plan.";
  }

  function balanceBadge(model) {
    if (!model.balance) {
      if (model.status === "sinFecha") {
        return '<span class="plan-editor-badge" data-plan-balance="none">Sin fecha límite</span>';
      }
      return "";
    }
    var labels = { ahead: "Cabe con margen", onTrack: "Cabe justo", behind: "No cabe antes del examen" };
    var label = labels[model.balance] || model.balance;
    return '<span class="plan-editor-badge" data-plan-balance="' + esc(model.balance) + '">' + esc(label) + '</span>';
  }

  function fitsText(model) {
    if (model.status === "fechaPasada") return "Sin plazo: la fecha ya pasó";
    if (model.status === "sinFecha") return "Sin fecha de examen";
    if (model.status === "sinTiempo") return "Sin plan con 0 min/día";
    if (model.status === "sinPresupuesto") return "Falta el presupuesto";
    if (model.status === "completado") return "Nada que repartir";
    if (model.status === "sinFichas" || model.status === "sinDatos") return "Sin datos para calcular";
    if (model.fits === true) return "Sí, cabe completo";
    if (model.fits === false) return "No, se pasa de la fecha";
    return "Sin plazo vivo";
  }

  function pendingText(model) {
    var totals = model.totals || {};
    var text = fichasLabel(totals.pendingSheets || 0) + " · " + minutesLabel(totals.pendingMinutes || 0);
    if (totals.minutesEstimated) text += " · " + minutesLabel(totals.minutesEstimated) + " estimados";
    return text;
  }

  function afterExamText(model) {
    if (!model.examDate) return "Sin fecha de examen";
    if (model.status === "fechaPasada") return "Sin plazo: la fecha ya pasó";
    if (model.minutesAfterDeadline === null || model.minutesAfterDeadline === undefined) return "Sin cuenta atrás";
    if (model.minutesAfterDeadline <= 0) return "0 min";
    var text = minutesLabel(model.minutesAfterDeadline);
    if (model.sheetsAfterDeadline) text += " · " + fichasLabel(model.sheetsAfterDeadline);
    return text;
  }

  function coverageText(model) {
    var coverage = model.coverage;
    if (!coverage) return "Sin datos de cobertura";
    var text = groupDigits(coverage.sheetsValid) + " de " + groupDigits(coverage.sheetsProvided) + " fichas del temario";
    if (coverage.minutesComplete === false) {
      text += " · " + fichasLabel(coverage.sheetsWithFallbackMinutes) + " con minutos estimados";
    } else {
      text += " · minutos completos";
    }
    if (coverage.sheetsWithoutArea) text += " · " + fichasLabel(coverage.sheetsWithoutArea) + " sin área";
    if (coverage.sheetsSkipped) text += " · " + fichasLabel(coverage.sheetsSkipped) + " descartadas";
    if (coverage.duplicates) text += " · " + fichasLabel(coverage.duplicates) + " duplicadas";
    return text;
  }

  function sessionText(model) {
    if (model.status === "completado") return "Nada pendiente";
    if (model.session && model.session.minutes !== null && model.session.minutes !== undefined) {
      var sheets = Array.isArray(model.session.sheets) ? model.session.sheets.length : 0;
      return minutesLabel(model.session.minutes) + (sheets ? " · " + fichasLabel(sheets) : "");
    }
    return "Sin sesión de estudio hoy";
  }

  function marginText(model) {
    if (model.status === "completado") return "No queda nada pendiente";
    if (model.status === "fechaPasada") return "Sin plazo: la fecha ya pasó";
    if (model.status === "sinFecha") return "Sin fecha de examen";
    if (model.status === "sinTiempo") return "Sin plan con 0 min/día";
    if (model.status === "sinPresupuesto") return "Falta el presupuesto";
    if (model.status === "sinFichas" || model.status === "sinDatos") return "Sin datos para calcular";
    if (model.balance === "ahead") {
      var text = minutesLabel(model.spareMinutes) + " de capacidad sin usar";
      if (model.slackStudyDays) text += " · " + model.slackStudyDays + " " + plural(model.slackStudyDays, "día", "días") + " de estudio de sobra";
      return text;
    }
    if (model.balance === "onTrack") return "Cabe sin días de estudio de sobra";
    if (model.balance === "behind") {
      var late = minutesLabel(model.minutesAfterDeadline) + " quedan fuera del plazo";
      if (model.lateDays) late += " · " + model.lateDays + " " + plural(model.lateDays, "día", "días") + " tarde";
      return late;
    }
    return "Sin plazo vivo";
  }

  function factsHTML(model) {
    var rows = [
      { label: "¿Cabe antes del examen?", value: fitsText(model) },
      { label: "Margen antes del examen", value: marginText(model) },
      { label: "Terminarías", value: model.estimatedEndDate ? dateLabel(model.estimatedEndDate) : "Sin fecha estimada" }
    ];
    var showTotals = model.status === "ok" || model.status === "sinFecha" ||
      model.status === "fechaPasada" || model.status === "completado" || model.status === "sinTiempo";
    if (showTotals) {
      rows.push({ label: "Fichas y minutos pendientes", value: pendingText(model) });
    }
    rows.push({ label: "Después del examen", value: afterExamText(model) });
    rows.push({ label: "Cobertura del cálculo", value: coverageText(model) });
    rows.push({ label: "Sesión de hoy", value: sessionText(model) });
    return '<dl class="plan-editor-facts">' + rows.map(function (row) {
      return '<div class="plan-editor-fact"><dt>' + esc(row.label) + '</dt><dd>' + esc(row.value) + '</dd></div>';
    }).join("") + '</dl>';
  }

  function notesHTML(model) {
    var notes = [];
    (Array.isArray(model.warnings) ? model.warnings : []).forEach(function (warning) {
      if (!warning) return;
      notes.push({ kind: "Aviso", code: warning.code || "", text: warning.message || warning.code || "" });
    });
    (Array.isArray(model.assumptions) ? model.assumptions : []).forEach(function (assumption) {
      if (!assumption) return;
      notes.push({ kind: "Supuesto", code: assumption.code || "", text: assumption.message || assumption.code || "" });
    });
    if (!notes.length) return "";
    return '<details class="plan-editor-notes">' +
      '<summary>' + notes.length + " " + plural(notes.length, "aviso", "avisos") + ' del cálculo</summary>' +
      '<ul class="plan-editor-notes-list">' + notes.map(function (note) {
        return '<li' + (note.code ? ' data-plan-warning-code="' + esc(note.code) + '"' : "") + '>' +
          '<span class="plan-editor-note-kind">' + esc(note.kind) + '</span>' +
          '<span>' + esc(note.text) + '</span>' +
        '</li>';
      }).join("") + '</ul>' +
    '</details>';
  }

  function priorityNote() {
    var draft = readDraft();
    var changed = officialAreas().filter(function (area) {
      return normalizePriority(draft.areaPriority[area.id]) !== 1;
    });
    if (!changed.length) {
      return "Todas las áreas van a ritmo normal. La prioridad cambia el orden de las fichas, nunca el total de minutos del área.";
    }
    var names = changed.slice(0, 3).map(function (area) {
      return area.short + " ×" + formatPriority(normalizePriority(draft.areaPriority[area.id]));
    });
    var tail = changed.length > 3 ? " y " + (changed.length - 3) + " más" : "";
    return "Prioridad " + names.join(", ") + tail + ". Adelanta sus fichas; el total de minutos de cada área no cambia.";
  }

  function draftNote() {
    var plan = safePlan();
    if (!plan) {
      return isDirty()
        ? "Vista previa de un borrador: todavía no has guardado ningún plan."
        : "Vista previa de los valores propuestos: todavía no hay plan guardado.";
    }
    if (isDirty()) return "Vista previa de cambios sin guardar: todavía no están en tu plan.";
    return "Vista previa del plan guardado.";
  }

  function previewHTML(model) {
    return '' +
      '<div class="plan-editor-preview-status" data-plan-status="' + esc(model.status) + '">' +
        '<span class="plan-editor-preview-icon" aria-hidden="true">' + icon(previewIconName(model), 18) + '</span>' +
        '<div class="plan-editor-preview-status-copy">' +
          balanceBadge(model) +
          '<h3 class="plan-editor-preview-title">' + esc(previewTitle(model)) + '</h3>' +
          '<p class="plan-editor-preview-message">' + esc(model.message || "") + '</p>' +
        '</div>' +
      '</div>' +
      factsHTML(model) +
      notesHTML(model) +
      '<p class="plan-editor-preview-draft" data-plan-preview-draft>' + esc(draftNote()) + '</p>' +
      '<p class="plan-editor-preview-foot">' + esc(priorityNote()) + '</p>';
  }

  function buildPreviewModel() {
    var rt = runtime();
    if (!rt || typeof rt.input !== "function") {
      throw new Error("El runtime de planificación no está disponible en esta página.");
    }
    var planner = (typeof rt.model === "function" ? rt.model() : null) || root.StudyPlanModel;
    if (!planner || typeof planner.buildPlan !== "function") {
      throw new Error("El modelo de planificación aún no está cargado.");
    }
    var draft = readDraft();
    var validation = validateDraft(draft);
    if (!validation.ok) return { invalid: validation };
    var values = validation.values;
    var input = rt.input({
      examDate: values.examDate,
      minutesPerDay: values.minutesPerDay,
      daysPerWeek: values.daysPerWeek,
      areaPriority: values.areaPriority
    });
    return { model: planner.buildPlan(input) };
  }

  function renderPreview() {
    if (!state.mounted) return;
    var host = previewHost();
    if (!host) return;
    state.previewToken += 1;
    var token = state.previewToken;
    if (state.loadError) {
      host.innerHTML = previewErrorHTML(state.loadError);
      host.setAttribute("data-plan-preview-state", "error");
      host.setAttribute("data-plan-balance", "");
      host.setAttribute("aria-busy", "false");
      return;
    }
    if (!state.modelReady) {
      host.innerHTML = previewLoadingHTML();
      host.setAttribute("data-plan-preview-state", "loading");
      host.setAttribute("data-plan-balance", "");
      host.setAttribute("aria-busy", "true");
      return;
    }
    var result;
    try {
      result = buildPreviewModel();
    } catch (error) {
      result = { error: error && error.message ? error.message : "No pude calcular la vista previa." };
    }
    if (!state.mounted || token !== state.previewToken) return;
    if (result.error) {
      host.innerHTML = previewErrorHTML(result.error);
      host.setAttribute("data-plan-preview-state", "error");
      host.setAttribute("data-plan-balance", "");
      host.setAttribute("aria-busy", "false");
      return;
    }
    if (result.invalid) {
      host.innerHTML = previewInvalidHTML(result.invalid);
      host.setAttribute("data-plan-preview-state", "invalid");
      host.setAttribute("data-plan-balance", "");
      host.setAttribute("aria-busy", "false");
      return;
    }
    var model = result.model;
    host.innerHTML = previewHTML(model);
    host.setAttribute("data-plan-preview-state", model.status || "ok");
    host.setAttribute("data-plan-balance", model.balance || "");
    host.setAttribute("aria-busy", "false");
  }

  function schedulePreview(delay) {
    if (!state.mounted) return;
    if (state.previewTimer) {
      root.clearTimeout(state.previewTimer);
      state.previewTimer = 0;
    }
    if (!delay) {
      renderPreview();
      return;
    }
    state.previewTimer = root.setTimeout(function () {
      state.previewTimer = 0;
      renderPreview();
    }, delay);
  }

  /* ------------------------------------------------------------------ */
  /* Carga perezosa del modelo                                           */
  /* ------------------------------------------------------------------ */

  function focusPreviewTitle() {
    var title = state.root && state.root.querySelector("#" + PREVIEW_TITLE_ID);
    if (title && typeof title.focus === "function") title.focus({ preventScroll: true });
  }

  function loadModel() {
    if (!state.mounted) return;
    var rt = runtime();
    if (!rt || typeof rt.ensureModel !== "function") {
      state.modelReady = false;
      state.loading = false;
      state.loadError = "El runtime de planificación no está disponible en esta página.";
      renderPreview();
      return;
    }
    var planner = typeof rt.model === "function" ? rt.model() : null;
    if (planner) {
      state.modelReady = true;
      state.loading = false;
      state.loadError = "";
      renderPreview();
      if (state.retryFocus) {
        state.retryFocus = false;
        focusPreviewTitle();
      }
      return;
    }
    if (state.loading) return;
    state.loading = true;
    state.loadError = "";
    state.loadToken += 1;
    var token = state.loadToken;
    renderPreview();
    rt.ensureModel().then(function () {
      if (!state.mounted || token !== state.loadToken) return;
      state.loading = false;
      state.modelReady = !!((typeof rt.model === "function" ? rt.model() : null) || root.StudyPlanModel);
      state.loadError = state.modelReady ? "" : "El modelo cargó pero no expuso StudyPlanModel.";
      renderPreview();
      if (state.retryFocus) {
        state.retryFocus = false;
        if (state.modelReady) focusPreviewTitle();
        else {
          var errorBox = previewHost() && previewHost().querySelector("[data-plan-error]");
          if (errorBox && typeof errorBox.focus === "function") errorBox.focus({ preventScroll: true });
        }
      }
    }, function (error) {
      if (!state.mounted || token !== state.loadToken) return;
      state.loading = false;
      state.modelReady = false;
      state.loadError = error && error.message
        ? error.message
        : "No pude cargar el modelo de planificación.";
      renderPreview();
      if (state.retryFocus) {
        state.retryFocus = false;
        var box = previewHost() && previewHost().querySelector("[data-plan-error]");
        if (box && typeof box.focus === "function") box.focus({ preventScroll: true });
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Estado del formulario                                               */
  /* ------------------------------------------------------------------ */

  function setStatus(tone, text) {
    var form = formEl();
    if (!form) return;
    var node = form.querySelector("[data-plan-form-status]");
    if (!node) return;
    var next = text == null ? "" : String(text);
    if (node.textContent !== next) node.textContent = next;
    if (node.getAttribute("data-tone") !== tone) node.setAttribute("data-tone", tone);
  }

  function applyErrors(validation, showAll) {
    var form = formEl();
    if (!form) return;
    FIELD_ORDER.forEach(function (field) {
      var input = form.querySelector('[data-plan-field="' + field + '"]');
      var errorNode = form.querySelector('[data-plan-error-for="' + field + '"]');
      var message = validation.errors[field] || "";
      var visible = !!message && (showAll || state.submitAttempted || !!state.touched[field]);
      if (errorNode) {
        errorNode.textContent = visible ? message : "";
        if (visible) errorNode.removeAttribute("hidden");
        else errorNode.setAttribute("hidden", "hidden");
      }
      if (input) {
        if (visible) input.setAttribute("data-invalid", "true");
        else input.removeAttribute("data-invalid");
        if (visible) input.setAttribute("aria-invalid", "true");
        else input.removeAttribute("aria-invalid");
      }
    });
  }

  function hasVisibleErrors(validation, showAll) {
    return FIELD_ORDER.some(function (field) {
      return !!validation.errors[field] && (showAll || state.submitAttempted || !!state.touched[field]);
    });
  }

  function updateFormStatus(validation) {
    if (state.saving) return;
    if (hasVisibleErrors(validation, false)) {
      setStatus("error", "Revisa los campos marcados: todavía no se puede guardar.");
      return;
    }
    if (!validation.ok) {
      setStatus("idle", "Completa los minutos por día y los días por semana para poder guardar.");
      return;
    }
    if (!isDirty()) {
      setStatus("ok", safePlan() ? "Todo guardado." : "Todavía no hay plan guardado.");
      return;
    }
    setStatus("dirty", "Cambios sin guardar: la vista previa ya los usa.");
  }

  function focusFirstInvalid(validation) {
    for (var i = 0; i < FIELD_ORDER.length; i += 1) {
      var field = FIELD_ORDER[i];
      if (!validation.errors[field]) continue;
      var input = fieldInput(field);
      if (input && typeof input.focus === "function") {
        input.focus();
        return;
      }
    }
  }

  function updateSavedUI() {
    var form = formEl();
    if (!form) return;
    var store = storeApi();
    var canSave = canSavePlan(store);
    var plan = safePlan();
    var save = form.querySelector('[data-plan-action="save"]');
    var remove = form.querySelector('[data-plan-action="remove"]');
    var label = form.querySelector("[data-plan-save-label]");
    var saved = form.querySelector("[data-plan-saved]");
    if (label) label.textContent = plan ? "Guardar cambios" : "Guardar plan";
    if (save) {
      if (canSave) {
        save.removeAttribute("disabled");
        save.removeAttribute("aria-disabled");
      } else {
        save.setAttribute("disabled", "disabled");
        save.setAttribute("aria-disabled", "true");
      }
    }
    if (remove) {
      if (canSave && plan) remove.removeAttribute("disabled");
      else remove.setAttribute("disabled", "disabled");
    }
    if (saved) saved.textContent = savedLineText(plan);
  }

  function applyFormValues(values) {
    var form = formEl();
    if (!form) return false;
    var exam = form.querySelector('[data-plan-field="examDate"]');
    var minutes = form.querySelector('[data-plan-field="minutesPerDay"]');
    var days = form.querySelector('[data-plan-field="daysPerWeek"]');
    if (exam) exam.value = values.examDate || "";
    if (minutes) minutes.value = values.minutesPerDay === null || values.minutesPerDay === undefined ? "" : String(values.minutesPerDay);
    if (days) days.value = values.daysPerWeek === null || values.daysPerWeek === undefined ? "" : String(values.daysPerWeek);
    var areas = officialAreas();
    areas.forEach(function (area, index) {
      var options = form.querySelectorAll('input[name="plan-editor-priority-' + index + '"]');
      var wanted = normalizePriority(values.areaPriority[area.id]);
      for (var i = 0; i < options.length; i += 1) {
        options[i].checked = Number(options[i].value) === wanted;
      }
    });
    return true;
  }

  function applyDraftToForm(values) {
    if (!applyFormValues(values)) return;
    state.touched = {};
    state.submitAttempted = false;
    var current = readDraft();
    state.baselineSig = draftSignature(current);
    var validation = validateDraft(current);
    applyErrors(validation, false);
    updateSavedUI();
    updateFormStatus(validation);
    schedulePreview(0);
  }

  function markTouched(target) {
    if (!target || typeof target.closest !== "function") return "";
    var fieldNode = target.closest("[data-plan-field]");
    if (fieldNode) {
      var field = fieldNode.getAttribute("data-plan-field");
      if (field) {
        state.touched[field] = true;
        return field;
      }
    }
    if (target.closest("[data-plan-area-priority]")) {
      state.touched.areaPriority = true;
      return "areaPriority";
    }
    return "";
  }

  /* ------------------------------------------------------------------ */
  /* Guardar y quitar el plan                                            */
  /* ------------------------------------------------------------------ */

  function saveSummary(values) {
    var bits = [
      minutesLabel(values.minutesPerDay) + "/día",
      values.daysPerWeek + " " + plural(values.daysPerWeek, "día", "días") + "/semana"
    ];
    if (values.examDate) bits.push("examen " + dateLabel(values.examDate));
    return bits.join(", ");
  }

  function savePlan(validation) {
    var store = storeApi();
    if (!canSavePlan(store)) {
      setStatus("error", "No pude guardar: el almacén del plan no está disponible en este navegador.");
      announce("No se guardó el plan: el almacén no está disponible.");
      return;
    }
    var values = validation.values;
    var draft = readDraft();
    var record = null;
    state.saving = true;
    setStatus("pending", "Guardando el plan…");
    state.selfChange = true;
    try {
      record = store.plan.save({
        examDate: values.examDate,
        minutesPerDay: values.minutesPerDay,
        daysPerWeek: values.daysPerWeek,
        areaPriority: values.areaPriority
      });
    } catch (error) {
      record = null;
    } finally {
      state.selfChange = false;
      state.saving = false;
    }
    if (!record) {
      setStatus("error", "No se pudo guardar el plan. Revisa la fecha y los rangos, y vuelve a intentarlo.");
      announce("No se guardó el plan: el almacén rechazó los datos.");
      updateSavedUI();
      return;
    }
    state.lastStoreSig = storeSignature(safePlan());
    state.baselineSig = draftSignature(draft);
    state.touched = {};
    state.submitAttempted = false;
    var currentValidation = validateDraft(readDraft());
    applyErrors(currentValidation, false);
    updateSavedUI();
    schedulePreview(0);
    setStatus("ok", "Plan guardado. La vista previa ya refleja estos valores.");
    announce("Plan guardado: " + saveSummary(values) + ".");
  }

  function removePlan(focusAfter) {
    var store = storeApi();
    if (!canRemovePlan(store)) {
      setStatus("error", "No pude quitar el plan: el almacén no está disponible en este navegador.");
      announce("No se quitó el plan: el almacén no está disponible.");
      return;
    }
    if (!safePlan()) {
      setStatus("idle", "No hay ningún plan guardado que quitar.");
      updateSavedUI();
      return;
    }
    var removed = null;
    state.selfChange = true;
    try {
      removed = store.plan.remove();
    } catch (error) {
      removed = null;
    } finally {
      state.selfChange = false;
    }
    if (!removed) {
      setStatus("error", "No pude quitar el plan. No se cambió nada.");
      announce("No se quitó el plan. No se cambió nada.");
      updateSavedUI();
      return;
    }
    state.lastStoreSig = "none";
    applyDraftToForm(planDraft(null));
    setStatus("ok", "Plan quitado. Tu progreso de lectura, repasos y tarjetas siguen intactos.");
    announce("Plan quitado. Se conserva todo el progreso: fichas, repasos, tarjetas y actividad.");
    if (focusAfter) {
      var save = formEl() && formEl().querySelector('[data-plan-action="save"]');
      if (save && typeof save.focus === "function") save.focus({ preventScroll: true });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Diálogo accesible de confirmación                                   */
  /* ------------------------------------------------------------------ */

  function trapKeydown(event) {
    var dialog = state.dialog;
    if (!dialog || !dialog.node) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog(true);
      return;
    }
    if (event.key !== "Tab") return;
    var focusables = dialog.node.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    var list = Array.prototype.slice.call(focusables).filter(function (node) {
      return node.offsetParent !== null || node === document.activeElement;
    });
    if (!list.length) {
      event.preventDefault();
      return;
    }
    var first = list[0];
    var last = list[list.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function dialogClick(event) {
    var actionNode = event.target && event.target.closest
      ? event.target.closest("[data-dialog-action]")
      : null;
    if (!actionNode) return;
    var action = actionNode.getAttribute("data-dialog-action");
    if (action === "cancel") {
      event.preventDefault();
      closeDialog(true);
    } else if (action === "confirm") {
      event.preventDefault();
      closeDialog(false);
      removePlan(true);
    }
  }

  function openRemoveDialog(trigger) {
    if (state.dialog) return;
    if (!safePlan()) {
      setStatus("idle", "No hay ningún plan guardado que quitar.");
      return;
    }
    var wrap = document.createElement("div");
    wrap.className = "plan-editor-dialog";
    wrap.setAttribute("data-plan-dialog", "");
    wrap.innerHTML = '' +
      '<div class="plan-editor-dialog-scrim" data-dialog-action="cancel"></div>' +
      '<div class="plan-editor-dialog-panel plan-confirm" role="dialog" aria-modal="true" data-plan-confirm aria-labelledby="plan-editor-remove-title" aria-describedby="plan-editor-remove-text">' +
        '<div class="plan-editor-dialog-head">' +
          '<span class="plan-editor-kicker plan-editor-kicker--danger"><span class="plan-editor-dot" aria-hidden="true"></span>Quitar plan</span>' +
          '<p class="plan-editor-dialog-title" id="plan-editor-remove-title">¿Quitar el plan de estudio?</p>' +
        '</div>' +
        '<p class="plan-editor-dialog-text" id="plan-editor-remove-text">Se borran la fecha de examen, los minutos por día, los días por semana y la prioridad por área. <b>No se toca tu progreso</b>: las fichas leídas, los repasos, las tarjetas, las dudas y la actividad siguen intactos.</p>' +
        '<p class="plan-editor-dialog-note">Podrás crear otro plan cuando quieras. El temario y tu historial no cambian.</p>' +
        '<div class="plan-editor-dialog-actions">' +
          '<button class="plan-editor-btn plan-editor-btn--quiet" type="button" data-dialog-action="cancel" data-autofocus>Cancelar</button>' +
          '<button class="plan-editor-btn plan-editor-btn--danger" type="button" data-dialog-action="confirm">Quitar plan</button>' +
        '</div>' +
      '</div>';
    /* Se inserta al principio del body para que sea el primer diálogo del
       documento: los paneles ocultos de la appbar también usan role="dialog"
       y un lector de pantalla debe encontrar primero esta confirmación. */
    document.body.insertBefore(wrap, document.body.firstChild || null);
    wrap.addEventListener("click", dialogClick);
    document.addEventListener("keydown", trapKeydown, true);
    state.dialog = { node: wrap, trigger: trigger || null };
    var autofocus = wrap.querySelector("[data-autofocus]") || wrap.querySelector("button");
    if (autofocus && typeof autofocus.focus === "function") autofocus.focus({ preventScroll: true });
  }

  function closeDialog(restoreFocus, focusTarget) {
    var dialog = state.dialog;
    if (!dialog) return;
    document.removeEventListener("keydown", trapKeydown, true);
    if (dialog.node) {
      dialog.node.removeEventListener("click", dialogClick);
      if (dialog.node.parentNode) dialog.node.parentNode.removeChild(dialog.node);
    }
    state.dialog = null;
    if (restoreFocus !== false) {
      var target = focusTarget || dialog.trigger;
      if (target && target.isConnected && !target.disabled && typeof target.focus === "function") {
        target.focus({ preventScroll: true });
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Eventos                                                             */
  /* ------------------------------------------------------------------ */

  function onFormInput(event) {
    if (!state.mounted) return;
    markTouched(event.target);
    var validation = validateDraft(readDraft());
    applyErrors(validation, false);
    updateFormStatus(validation);
    schedulePreview(PREVIEW_DEBOUNCE);
  }

  function onSubmit(event) {
    if (event && typeof event.preventDefault === "function") event.preventDefault();
    if (!state.mounted) return;
    state.submitAttempted = true;
    var validation = validateDraft(readDraft());
    applyErrors(validation, true);
    if (!validation.ok) {
      updateFormStatus(validation);
      setStatus("error", "Revisa los campos marcados: no se ha guardado nada.");
      announce("No se guardó el plan: revisa los campos marcados.");
      focusFirstInvalid(validation);
      return;
    }
    savePlan(validation);
  }

  function onRootClick(event) {
    var target = event.target && event.target.closest
      ? event.target.closest("[data-plan-action]")
      : null;
    if (!target || !state.root || !state.root.contains(target)) return;
    var action = target.getAttribute("data-plan-action");
    if (action === "retry") {
      event.preventDefault();
      state.retryFocus = true;
      loadModel();
    } else if (action === "remove") {
      event.preventDefault();
      openRemoveDialog(target);
    }
  }

  function onPlanChanged(payload) {
    if (!state.mounted) return;
    var plan = payload && hasOwn(payload, "plan") ? payload.plan : safePlan();
    var signature = storeSignature(plan);
    var previous = state.lastStoreSig;
    state.lastStoreSig = signature;
    if (state.selfChange || state.saving) {
      updateSavedUI();
      schedulePreview(0);
      return;
    }
    if (signature !== previous && !isDirty()) {
      applyDraftToForm(planDraft(plan));
      return;
    }
    updateSavedUI();
    schedulePreview(STORE_DEBOUNCE);
  }

  function onStoreChange() {
    if (!state.mounted) return;
    var plan = safePlan();
    var signature = storeSignature(plan);
    if (!state.selfChange && !state.saving && signature !== state.lastStoreSig) {
      state.lastStoreSig = signature;
      if (!isDirty()) {
        applyDraftToForm(planDraft(plan));
        return;
      }
    }
    updateSavedUI();
    if (state.storeTimer) {
      root.clearTimeout(state.storeTimer);
      state.storeTimer = 0;
    }
    state.storeTimer = root.setTimeout(function () {
      state.storeTimer = 0;
      renderPreview();
    }, STORE_DEBOUNCE);
  }

  function subscribe() {
    if (state.subscribed) return;
    var app = appApi();
    if (!app || !app.events || typeof app.events.on !== "function") return;
    app.events.on("plan:changed", onPlanChanged);
    app.events.on("store:change", onStoreChange);
    state.subscribed = true;
  }

  function unsubscribe() {
    if (!state.subscribed) return;
    var app = appApi();
    if (app && app.events && typeof app.events.off === "function") {
      app.events.off("plan:changed", onPlanChanged);
      app.events.off("store:change", onStoreChange);
    }
    state.subscribed = false;
  }

  /* ------------------------------------------------------------------ */
  /* Ciclo de vida de la ruta                                            */
  /* ------------------------------------------------------------------ */

  function mount(ctx) {
    if (!ctx || !ctx.root) return;
    if (state.mounted) unmount();
    state.ctx = ctx;
    state.root = ctx.root;
    state.store = ctx.store || root.StudyStore || null;
    state.mounted = true;
    state.modelReady = false;
    state.loading = false;
    state.loadError = "";
    state.loadToken += 1;
    state.previewTimer = 0;
    state.storeTimer = 0;
    state.touched = {};
    state.submitAttempted = false;
    state.retryFocus = false;
    var form = formEl();
    if (form) {
      form.addEventListener("submit", onSubmit);
      form.addEventListener("input", onFormInput);
      form.addEventListener("change", onFormInput);
    }
    if (state.root && typeof state.root.addEventListener === "function") {
      state.root.addEventListener("click", onRootClick);
    }
    state.baselineSig = draftSignature(readDraft());
    state.lastStoreSig = storeSignature(safePlan());
    subscribe();
    updateSavedUI();
    var validation = validateDraft(readDraft());
    applyErrors(validation, false);
    updateFormStatus(validation);
    loadModel();
  }

  function unmount() {
    state.mounted = false;
    state.loadToken += 1;
    state.previewToken += 1;
    if (state.previewTimer) {
      root.clearTimeout(state.previewTimer);
      state.previewTimer = 0;
    }
    if (state.storeTimer) {
      root.clearTimeout(state.storeTimer);
      state.storeTimer = 0;
    }
    var form = formEl();
    if (form) {
      form.removeEventListener("submit", onSubmit);
      form.removeEventListener("input", onFormInput);
      form.removeEventListener("change", onFormInput);
    }
    if (state.root && typeof state.root.removeEventListener === "function") {
      state.root.removeEventListener("click", onRootClick);
    }
    unsubscribe();
    closeDialog(false);
    state.root = null;
    state.ctx = null;
    state.store = null;
    state.modelReady = false;
    state.loading = false;
    state.loadError = "";
    state.touched = {};
    state.submitAttempted = false;
    state.retryFocus = false;
    state.baselineSig = "";
    state.lastStoreSig = "";
  }

  /* ------------------------------------------------------------------ */
  /* Registro del módulo                                                 */
  /* ------------------------------------------------------------------ */

  var api = {
    version: VERSION,
    id: MODULE_ID,
    route: "#/" + ROUTE_PATH,
    render: render,
    mount: mount,
    unmount: unmount,
    __registered: false,
    register: function register() {
      if (api.__registered) return true;
      var app = appApi();
      if (!app || typeof app.registerModule !== "function") return false;
      var module = null;
      try {
        module = app.registerModule({
          id: MODULE_ID,
          routes: [{
            path: ROUTE_PATH,
            title: "Plan de estudio",
            restoreScroll: true,
            render: render,
            mount: mount,
            unmount: unmount
          }]
        });
      } catch (error) {
        if (root.console && root.console.warn) root.console.warn("StudyPlanEditor: no se pudo registrar", error);
        return false;
      }
      if (!module) return false;
      api.__registered = true;
      return true;
    }
  };

  if (root && root.document) {
    root.StudyPlanEditor = api;
    if (!api.register()) {
      var attempts = 0;
      (function waitForApp() {
        if (api.__registered || attempts > 40) return;
        attempts += 1;
        if (api.register()) return;
        root.setTimeout(waitForApp, 50);
      })();
    }
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
