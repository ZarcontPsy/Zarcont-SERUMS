/* SERUMS STUDY — Ruta de hoy inicial (Fase 1)
   Módulo `today`: llena [data-module-mount="today-route"] del Panel con una
   ruta de hoy construida solo con datos reales del temario y del store v2.

   Reglas del módulo:
   · Fase 2: enlaza «Ver ruta completa» a #/ruta y los repasos a #/repaso.
     El bloque sigue sin cargar plan-model.js; la vista #/ruta es la que monta
     el modelo con StudyPlanRuntime.
   · No crea ni edita el plan. Solo lee `StudyStore.plan` para respetar el
     presupuesto de minutos ya configurado.
   · No inventa señales ni cifras: si una colección no se puede leer, la marca
     como ausente (count: null) y lo dice. No hay minutos por defecto.
   · Agregación ligera propia (no carga js/plan/plan-model.js al arrancar).
     La Fase 2 sustituirá `build()` por `StudyPlanModel.buildTodayRoute()`.
   · Todo el HTML se escapa con un escapador local equivalente a
     StudyUI.escapeHTML; el CSS vive en css/plan.css bajo `.plan-*`.

   Contrato y fórmulas: study-dashboard/docs/PLAN-MODELO.md §13
   Uso:
     navegador  <script src="js/plan/today.integration.js"></script>
                -> window.StudyToday / window.StudyPlanToday
     Node       require("./today.integration.js")  (agregador puro)

   © 2026 ZARCONT */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root);
  } else {
    root.StudyPlanToday = factory(root);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  var VERSION = "1.0.0";

  /* ------------------------------------------------------------------ */
  /* Constantes documentadas en PLAN-MODELO.md §13                       */
  /* ------------------------------------------------------------------ */

  /* America/Lima no aplica horario de verano: un desfase fijo es exacto.
     Una fecha "YYYY-MM-DD" es un día civil literal y no pasa por la zona. */
  var ZONE_OFFSET_MINUTES = -300;
  var DAY_MS = 86400000;
  var MAX_MINUTES_PER_DAY = 1440;

  /* Topes por día y pesos de orden: subconjunto explícito del modelo de
     Fase 0 (ROUTE_CAPS/ROUTE_WEIGHTS). Sin prioridad de área en Fase 1. */
  var ROUTE_CAPS = { repaso: 3, tarjetas: 1, duda: 2, ficha: 3 };
  var ROUTE_WEIGHTS = { repaso: 100, tarjetas: 88, duda: 82, ficha: 70 };
  var ROUTE_RANK = { repaso: 0, tarjetas: 1, duda: 2, ficha: 3 };
  var TYPE_ORDER = ["repaso", "tarjetas", "duda", "ficha"];

  /* Fórmulas de minutos de la Fase 0, sin valores por defecto inventados:
     · ficha: `sheet.minutes` declarados; si faltan, el ítem queda sin minutos.
     · repaso: mitad de la ficha, mínimo 3 min.
     · tarjetas: 30 s por tarjeta vencida, mínimo 1 min.
     · duda: 3 min. */
  var MINUTES_PER_CARD = 0.5;
  var REVIEW_MINUTES_FACTOR = 0.5;
  var REVIEW_MINUTES_MIN = 3;
  var DOUBT_MINUTES = 3;

  var NEXT_SHEET_BONUS = 8;
  var OVERDUE_BONUS_PER_DAY = 2;
  var OVERDUE_BONUS_MAX = 20;
  var CARDS_BONUS_DIVISOR = 4;
  var CARDS_BONUS_MAX = 10;

  var TITLE_MAX = 140;
  var FALLBACK_FLASHCARDS = "../study-flashcards/index.html?mode=quick&from=dashboard";

  var MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  var SIGNAL_LABELS = {
    repaso: "los repasos de ficha",
    tarjetas: "las tarjetas vencidas",
    duda: "las dudas abiertas",
    plan: "el plan guardado"
  };
  var TYPE_LABELS = {
    repaso: "Repaso de ficha",
    tarjetas: "Práctica con tarjetas",
    duda: "Duda abierta",
    ficha: "Ficha pendiente"
  };
  var TYPE_ACTIONS = {
    repaso: { kind: "releer-ficha", label: "Repasar ficha" },
    tarjetas: { kind: "repasar-tarjetas", label: "Repasar tarjetas" },
    duda: { kind: "abrir-dudas", label: "Ver en dudas" },
    ficha: { kind: "abrir-ficha", label: "Abrir ficha" }
  };
  var TYPE_ICONS = {
    repaso: "rotate",
    tarjetas: "cards",
    duda: "flag",
    ficha: "book"
  };
  var STATES = ["lista", "sinActividad", "alDia", "sinTiempo", "error"];

  /* ------------------------------------------------------------------ */
  /* Utilidades                                                          */
  /* ------------------------------------------------------------------ */

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object || {}, key);
  }
  function asNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    var n = Number(value);
    return isFinite(n) ? n : null;
  }
  function isPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }
  function esc(value) {
    if (root && root.StudyUI && typeof root.StudyUI.escapeHTML === "function") {
      return root.StudyUI.escapeHTML(value);
    }
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  function plural(n, one, many) {
    return Number(n) === 1 ? one : (many || one + "s");
  }
  function truncate(text, max) {
    var value = String(text == null ? "" : text).replace(/\s+/g, " ").trim();
    if (value.length <= max) return value;
    return value.slice(0, Math.max(0, max - 1)).replace(/[\s,;:.-]+$/, "") + "…";
  }
  function icon(name, size) {
    if (root && root.StudyUI && typeof root.StudyUI.icon === "function") {
      return root.StudyUI.icon(name, size || 16);
    }
    return "";
  }

  /* Día civil desde 1970-01-01 en la zona de plan. Acepta "YYYY-MM-DD"
     (literal), ISO con o sin desfase, epoch en ms y Date. */
  function civilDay(value, zoneOffsetMinutes) {
    var offset = asNumber(zoneOffsetMinutes);
    if (offset === null) offset = ZONE_OFFSET_MINUTES;
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "number") {
      if (!isFinite(value)) return null;
      return Math.floor((value - offset * 60000) / DAY_MS);
    }
    if (Object.prototype.toString.call(value) === "[object Date]") {
      var time = value.getTime();
      if (!isFinite(time)) return null;
      return Math.floor((time - offset * 60000) / DAY_MS);
    }
    var text = String(value).trim();
    var literal = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
    if (literal) {
      var year = Number(literal[1]);
      var month = Number(literal[2]);
      var day = Number(literal[3]);
      var ms = Date.UTC(year, month - 1, day);
      var check = new Date(ms);
      if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
        return null;
      }
      return Math.floor(ms / DAY_MS);
    }
    var parsed = Date.parse(text);
    if (!isFinite(parsed)) return null;
    return Math.floor((parsed - offset * 60000) / DAY_MS);
  }
  function dayKey(dayNumber) {
    if (dayNumber === null || dayNumber === undefined) return null;
    var date = new Date(dayNumber * DAY_MS);
    return date.getUTCFullYear() + "-" +
      String(date.getUTCMonth() + 1).padStart(2, "0") + "-" +
      String(date.getUTCDate()).padStart(2, "0");
  }
  function dayLabel(dayNumber) {
    if (dayNumber === null || dayNumber === undefined) return "";
    var date = new Date(dayNumber * DAY_MS);
    return date.getUTCDate() + " " + MONTHS[date.getUTCMonth()] + " " + date.getUTCFullYear();
  }

  /* ------------------------------------------------------------------ */
  /* Entrada: normalización defensiva                                    */
  /* ------------------------------------------------------------------ */

  function normalizeInput(raw) {
    var src = isPlainObject(raw) ? raw : {};
    var offset = asNumber(src.zoneOffsetMinutes);
    var input = {
      now: hasOwn(src, "now") ? src.now : null,
      zoneOffsetMinutes: offset === null ? ZONE_OFFSET_MINUTES : offset,
      sheets: [],
      reviews: [],
      doubts: [],
      cardsDue: Math.max(0, Math.round(asNumber(src.cardsDue) || 0)),
      plan: isPlainObject(src.plan) ? src.plan : null,
      budgetMinutes: hasOwn(src, "budgetMinutes") ? src.budgetMinutes : undefined,
      hasActivity: src.hasActivity === true,
      lastSheetId: typeof src.lastSheetId === "string" && src.lastSheetId ? src.lastSheetId : null,
      flashcardsHref: typeof src.flashcardsHref === "string" && src.flashcardsHref
        ? src.flashcardsHref : FALLBACK_FLASHCARDS,
      signalsMissing: [],
      adapterWarnings: [],
      fatal: typeof src.fatal === "string" && src.fatal ? src.fatal : null
    };
    (Array.isArray(src.signalsMissing) ? src.signalsMissing : []).forEach(function (key) {
      if (typeof key === "string" && input.signalsMissing.indexOf(key) === -1) input.signalsMissing.push(key);
    });
    (Array.isArray(src.warnings) ? src.warnings : []).forEach(function (warning) {
      if (isPlainObject(warning) && typeof warning.message === "string") {
        input.adapterWarnings.push({ code: warning.code || "DATOS_INCOMPLETOS", message: warning.message });
      }
    });

    var seenSheets = {};
    (Array.isArray(src.sheets) ? src.sheets : []).forEach(function (rawSheet) {
      if (!isPlainObject(rawSheet)) return;
      var id = typeof rawSheet.id === "string" ? rawSheet.id.trim() : "";
      if (!id || seenSheets[id]) return;
      seenSheets[id] = true;
      var minutes = asNumber(rawSheet.minutes);
      input.sheets.push({
        id: id,
        title: typeof rawSheet.title === "string" && rawSheet.title.trim() ? rawSheet.title.trim() : id,
        minutes: minutes !== null && minutes > 0 ? Math.round(minutes) : null,
        areaId: typeof rawSheet.areaId === "string" ? rawSheet.areaId : null,
        categoryId: typeof rawSheet.categoryId === "string" ? rawSheet.categoryId : null,
        done: rawSheet.done === true
      });
    });

    (Array.isArray(src.reviews) ? src.reviews : []).forEach(function (review) {
      if (!isPlainObject(review) || review.deleted === true) return;
      var sheetId = typeof review.sheetId === "string" ? review.sheetId.trim() : "";
      if (!sheetId) return;
      input.reviews.push({
        sheetId: sheetId,
        dueAt: review.dueAt !== undefined && review.dueAt !== null ? review.dueAt : review.dueDate
      });
    });

    (Array.isArray(src.doubts) ? src.doubts : []).forEach(function (doubt) {
      if (!isPlainObject(doubt) || doubt.deleted === true) return;
      if (doubt.resolved === true || doubt.resolvedAt) return;
      var text = typeof doubt.note === "string" && doubt.note.trim()
        ? doubt.note : (typeof doubt.quote === "string" && doubt.quote.trim() ? doubt.quote : "Duda abierta");
      input.doubts.push({
        id: typeof doubt.id === "string" && doubt.id ? doubt.id : "",
        sheetId: typeof doubt.sheetId === "string" ? doubt.sheetId : null,
        text: truncate(text, TITLE_MAX),
        createdAt: doubt.createdAt
      });
    });

    return input;
  }

  /* ------------------------------------------------------------------ */
  /* Agregador puro: build(input)                                        */
  /* ------------------------------------------------------------------ */

  function failure(message, input) {
    return {
      ok: false,
      version: VERSION,
      status: "error",
      date: null,
      budgetMinutes: null,
      budgetDeclared: false,
      plannedMinutes: 0,
      remainingMinutes: null,
      minutesComplete: true,
      overload: false,
      minimumBlock: false,
      items: [],
      counts: { repaso: null, tarjetas: null, duda: null, ficha: null },
      deferred: { repaso: null, tarjetas: null, duda: null, ficha: null },
      pendingSheets: null,
      signals: {
        repaso: { present: false, count: null },
        tarjetas: { present: false, count: null },
        duda: { present: false, count: null },
        ficha: { present: false, count: null }
      },
      missing: input ? input.signalsMissing.slice() : [],
      hasActivity: false,
      plan: null,
      message: message,
      support: [],
      warnings: []
    };
  }

  function build(rawInput) {
    var input = normalizeInput(rawInput);
    if (input.fatal) return failure(input.fatal, input);

    var today = civilDay(input.now, input.zoneOffsetMinutes);
    if (today === null) {
      return failure("No pude leer la fecha de hoy; no muestro una ruta sin fecha.", input);
    }
    if (!input.sheets.length) {
      return failure("El temario llegó vacío: no hay fichas que mostrar en la ruta.", input);
    }

    var warnings = input.adapterWarnings.slice();
    function warn(code, message, extra) {
      var entry = { code: code, message: message };
      if (extra) Object.keys(extra).forEach(function (key) { entry[key] = extra[key]; });
      warnings.push(entry);
    }
    var missing = input.signalsMissing.slice();
    function signalPresent(key) { return missing.indexOf(key) === -1; }

    var sheetMap = {};
    input.sheets.forEach(function (sheet) { sheetMap[sheet.id] = sheet; });
    var pending = input.sheets.filter(function (sheet) { return !sheet.done; });

    /* Presupuesto: `budgetMinutes` explícito manda; si no, el plan guardado.
       Sin plan ni presupuesto no se inventa una jornada. */
    var budgetRaw = input.budgetMinutes !== undefined && input.budgetMinutes !== null
      ? input.budgetMinutes
      : (input.plan ? input.plan.minutesPerDay : null);
    var budgetDeclared = budgetRaw !== undefined && budgetRaw !== null && budgetRaw !== "";
    var budget = null;
    if (budgetDeclared) {
      var budgetNumber = asNumber(budgetRaw);
      if (budgetNumber === null || budgetNumber < 0) {
        warn("PRESUPUESTO_INVALIDO", "El presupuesto de minutos guardado no es válido; no reparto la jornada y muestro solo lo que ya está abierto.");
      } else if (budgetNumber === 0) {
        budget = 0;
      } else if (budgetNumber > MAX_MINUTES_PER_DAY) {
        budget = MAX_MINUTES_PER_DAY;
        warn("PRESUPUESTO_AJUSTADO", "El presupuesto supera 24 horas; lo limito a 1440 minutos.");
      } else {
        budget = Math.max(1, Math.round(budgetNumber));
      }
    }

    /* Repasos vencidos de ficha: `sheetReview` (dueAt <= hoy). */
    var dueBySheet = {};
    var dueReviews = [];
    var excludedReviews = 0;
    var duplicateReviews = 0;
    if (signalPresent("repaso")) {
      input.reviews.forEach(function (review) {
        var dueDay = civilDay(review.dueAt, input.zoneOffsetMinutes);
        if (dueDay === null) {
          excludedReviews += 1;
          warn("REPASO_SIN_FECHA", "Un repaso no trae una fecha válida y no lo incluyo.");
          return;
        }
        if (dueDay > today) return;
        var sheet = sheetMap[review.sheetId];
        if (!sheet) {
          excludedReviews += 1;
          warn("REPASO_SIN_FICHA", "Un repaso apunta a una ficha que no está en el temario; no lo incluyo.", { sheetId: review.sheetId });
          return;
        }
        var existing = dueBySheet[sheet.id];
        if (existing) {
          duplicateReviews += 1;
          if (dueDay < existing.dueDay) {
            existing.dueDay = dueDay;
            existing.overdueDays = today - dueDay;
          }
          return;
        }
        dueBySheet[sheet.id] = { sheet: sheet, dueDay: dueDay, overdueDays: today - dueDay };
        dueReviews.push(dueBySheet[sheet.id]);
      });
      dueReviews.sort(function (a, b) {
        if (a.overdueDays !== b.overdueDays) return b.overdueDays - a.overdueDays;
        if (a.sheet.id < b.sheet.id) return -1;
        return a.sheet.id > b.sheet.id ? 1 : 0;
      });
      if (duplicateReviews) {
        warn("REPASO_DUPLICADO", "Hay " + duplicateReviews + " repaso" + (duplicateReviews === 1 ? "" : "s") + " repetido" + (duplicateReviews === 1 ? "" : "s") + "; uso el vencimiento más antiguo.");
      }
    }

    /* Dudas abiertas: `doubts` sin resolver, las más antiguas primero. */
    var openDoubts = [];
    if (signalPresent("duda")) {
      openDoubts = input.doubts.map(function (doubt) {
        var createdDay = civilDay(doubt.createdAt, input.zoneOffsetMinutes);
        return {
          doubt: doubt,
          createdDay: createdDay === null ? today : createdDay
        };
      });
      openDoubts.sort(function (a, b) {
        if (a.createdDay !== b.createdDay) return a.createdDay - b.createdDay;
        var aid = a.doubt.id || "";
        var bid = b.doubt.id || "";
        if (aid < bid) return -1;
        return aid > bid ? 1 : 0;
      });
    }

    var cardsDue = signalPresent("tarjetas") ? input.cardsDue : null;
    var counts = {
      repaso: signalPresent("repaso") ? dueReviews.length : null,
      tarjetas: cardsDue,
      duda: signalPresent("duda") ? openDoubts.length : null,
      ficha: pending.length
    };
    var quietStart = !input.hasActivity && missing.length === 0 &&
      (counts.repaso || 0) === 0 && (counts.tarjetas || 0) === 0 && (counts.duda || 0) === 0;

    var caps = {
      repaso: ROUTE_CAPS.repaso,
      tarjetas: ROUTE_CAPS.tarjetas,
      duda: ROUTE_CAPS.duda,
      ficha: quietStart ? 1 : ROUTE_CAPS.ficha
    };
    var candidates = [];
    var order = 0;

    function sheetHref(id) { return "#/ficha/" + encodeURIComponent(id); }

    dueReviews.slice(0, caps.repaso).forEach(function (entry) {
      var sheet = entry.sheet;
      var minutes = sheet.minutes === null ? null
        : Math.max(REVIEW_MINUTES_MIN, Math.round(sheet.minutes * REVIEW_MINUTES_FACTOR));
      var overdueDays = entry.overdueDays;
      candidates.push({
        id: "repaso:" + sheet.id,
        type: "repaso",
        title: sheet.title,
        sheetId: sheet.id,
        areaId: sheet.areaId,
        categoryId: sheet.categoryId,
        minutes: minutes,
        minutesSource: minutes === null ? "desconocida" : "estimada",
        priority: ROUTE_WEIGHTS.repaso + Math.min(OVERDUE_BONUS_MAX, overdueDays * OVERDUE_BONUS_PER_DAY),
        order: order++,
        dueDate: dayKey(entry.dueDay),
        overdueDays: overdueDays,
        count: null,
        isNext: false,
        kind: TYPE_LABELS.repaso,
        reason: overdueDays > 0
          ? "Repaso vencido el " + dayLabel(entry.dueDay) + " (hace " + overdueDays + " " + plural(overdueDays, "día", "días") + "). Releerla ahora cuesta poco y evita que se olvide."
          : "Repaso programado para hoy.",
        action: {
          kind: TYPE_ACTIONS.repaso.kind,
          label: TYPE_ACTIONS.repaso.label,
          href: "#/repaso",
          external: false
        }
      });
    });

    if (cardsDue > 0 && caps.tarjetas > 0) {
      var cardsMinutes = Math.max(1, Math.round(cardsDue * MINUTES_PER_CARD));
      candidates.push({
        id: "tarjetas:hoy",
        type: "tarjetas",
        title: cardsDue + " " + plural(cardsDue, "tarjeta vencida", "tarjetas vencidas"),
        sheetId: null,
        areaId: null,
        categoryId: null,
        minutes: cardsMinutes,
        minutesSource: "estimada",
        priority: ROUTE_WEIGHTS.tarjetas + Math.min(CARDS_BONUS_MAX, Math.floor(cardsDue / CARDS_BONUS_DIVISOR)),
        order: order++,
        dueDate: dayKey(today),
        overdueDays: 0,
        count: cardsDue,
        isNext: false,
        kind: TYPE_LABELS.tarjetas,
        reason: "Hay " + cardsDue + " " + plural(cardsDue, "tarjeta vencida", "tarjetas vencidas") + " en Study Flashcards: recuperación activa corta, " + cardsMinutes + " min.",
        action: {
          kind: TYPE_ACTIONS.tarjetas.kind,
          label: TYPE_ACTIONS.tarjetas.label,
          href: input.flashcardsHref,
          external: true
        }
      });
    }

    openDoubts.slice(0, caps.duda).forEach(function (entry) {
      var doubt = entry.doubt;
      var ageDays = Math.max(0, today - entry.createdDay);
      var sheet = doubt.sheetId ? sheetMap[doubt.sheetId] : null;
      candidates.push({
        id: "duda:" + (doubt.id || "sin-id-" + order),
        type: "duda",
        title: doubt.text,
        sheetId: doubt.sheetId,
        areaId: sheet ? sheet.areaId : null,
        categoryId: sheet ? sheet.categoryId : null,
        minutes: DOUBT_MINUTES,
        minutesSource: "estimada",
        priority: ROUTE_WEIGHTS.duda + Math.min(OVERDUE_BONUS_MAX, Math.floor(ageDays / 2)),
        order: order++,
        dueDate: dayKey(entry.createdDay),
        overdueDays: ageDays,
        count: null,
        isNext: false,
        kind: TYPE_LABELS.duda,
        reason: ageDays > 0
          ? "Duda abierta el " + dayLabel(entry.createdDay) + " (hace " + ageDays + " " + plural(ageDays, "día", "días") + "). Resolverla desbloquea la lectura de esa ficha."
          : "Duda abierta hoy: resolverla antes de seguir evita arrastrarla.",
        action: {
          kind: TYPE_ACTIONS.duda.kind,
          label: TYPE_ACTIONS.duda.label,
          href: "#/dudas",
          external: false
        }
      });
    });

    /* Fichas del recorrido: se empieza por la última ficha abierta si sigue
       pendiente; si no, por la primera pendiente del temario. Una ficha con
       repaso vencido ya entra como `repaso` y no se repite como lectura. */
    var reviewSheetIds = {};
    dueReviews.forEach(function (entry) { reviewSheetIds[entry.sheet.id] = true; });
    var ordered = pending.slice();
    if (input.lastSheetId) {
      var position = -1;
      for (var i = 0; i < ordered.length; i += 1) {
        if (ordered[i].id === input.lastSheetId) { position = i; break; }
      }
      if (position > 0) ordered = ordered.slice(position).concat(ordered.slice(0, position));
    }
    ordered.filter(function (sheet) { return !reviewSheetIds[sheet.id]; })
      .slice(0, caps.ficha)
      .forEach(function (sheet, index) {
      var isNext = sheet.id === input.lastSheetId;
      var reason;
      if (isNext) {
        reason = "Continúa donde quedaste: esta ficha sigue pendiente.";
      } else if (!input.hasActivity && index === 0) {
        reason = "Primera ficha pendiente del recorrido.";
      } else if (index === 0) {
        reason = "Siguiente ficha pendiente del recorrido.";
      } else {
        reason = "Ficha pendiente en el orden del temario; entra si te sobra tiempo hoy.";
      }
      candidates.push({
        id: "ficha:" + sheet.id,
        type: "ficha",
        title: sheet.title,
        sheetId: sheet.id,
        areaId: sheet.areaId,
        categoryId: sheet.categoryId,
        minutes: sheet.minutes,
        minutesSource: sheet.minutes === null ? "desconocida" : "declarada",
        priority: ROUTE_WEIGHTS.ficha + (isNext ? NEXT_SHEET_BONUS : 0),
        order: order++,
        dueDate: dayKey(today),
        overdueDays: 0,
        count: null,
        isNext: isNext,
        kind: isNext ? "Siguiente ficha" : TYPE_LABELS.ficha,
        reason: reason,
        action: {
          kind: TYPE_ACTIONS.ficha.kind,
          label: TYPE_ACTIONS.ficha.label,
          href: sheetHref(sheet.id),
          external: false
        }
      });
    });

    candidates.sort(function (a, b) {
      if (a.priority !== b.priority) return b.priority - a.priority;
      if (ROUTE_RANK[a.type] !== ROUTE_RANK[b.type]) return ROUTE_RANK[a.type] - ROUTE_RANK[b.type];
      if (a.order !== b.order) return a.order - b.order;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });

    var selected = [];
    var used = 0;
    if (budget !== 0) {
      candidates.forEach(function (item) {
        if (item.minutes === null) {
          selected.push(item);
          return;
        }
        if (budget === null || used + item.minutes <= budget) {
          selected.push(item);
          used += item.minutes;
        }
      });
      if (!selected.length && candidates.length && budget !== null && budget > 0) {
        /* Bloque mínimo: si nada cabe, se propone el más corto y se declara
           el exceso. No se deja el día en cero por aritmética. */
        var shortest = candidates[0];
        candidates.forEach(function (item) {
          if (item.minutes === null) return;
          if (shortest.minutes === null || item.minutes < shortest.minutes) shortest = item;
        });
        selected.push(shortest);
        used = shortest.minutes === null ? 0 : shortest.minutes;
        shortest.minimumBlock = true;
        if (shortest.minutes !== null && budget !== null && shortest.minutes > budget) {
          shortest.overBudgetMinutes = shortest.minutes - budget;
        }
      }
    }

    var plannedMinutes = selected.reduce(function (total, item) {
      return total + (item.minutes === null ? 0 : item.minutes);
    }, 0);
    var minutesComplete = selected.every(function (item) { return item.minutes !== null; });
    var remainingMinutes = budget === null ? null : budget - plannedMinutes;
    var overload = budget !== null && plannedMinutes > budget;
    var minimumBlock = selected.some(function (item) { return item.minimumBlock === true; });

    var selectedByType = { repaso: 0, tarjetas: 0, duda: 0, ficha: 0 };
    selected.forEach(function (item) { selectedByType[item.type] += 1; });
    var universe = {
      repaso: dueReviews.length,
      tarjetas: cardsDue > 0 ? 1 : 0,
      duda: openDoubts.length,
      ficha: pending.length
    };
    var deferred = {
      repaso: Math.max(0, universe.repaso - selectedByType.repaso),
      tarjetas: Math.max(0, universe.tarjetas - selectedByType.tarjetas),
      duda: Math.max(0, universe.duda - selectedByType.duda),
      ficha: Math.max(0, universe.ficha - selectedByType.ficha)
    };

    var status;
    if (budget === 0) status = "sinTiempo";
    else if (!selected.length) status = "alDia";
    else status = quietStart ? "sinActividad" : "lista";

    var message;
    if (status === "sinTiempo") {
      message = "El presupuesto de hoy es de 0 minutos: la ruta queda vacía a propósito.";
    } else if (status === "alDia") {
      message = missing.length
        ? "No hay pendientes en las señales que pude leer; el resto no está disponible."
        : "No quedan fichas pendientes, dudas abiertas, repasos vencidos ni tarjetas vencidas.";
    } else if (status === "sinActividad") {
      message = "Todavía no hay actividad registrada; esta es la primera ficha del recorrido.";
    } else if (budget === null) {
      message = "Ruta de hoy: " + selected.length + " " + plural(selected.length, "bloque", "bloques") +
        " y " + minutesText(plannedMinutes, minutesComplete) + " con lo que ya está abierto.";
    } else {
      message = "Ruta de hoy: " + minutesText(plannedMinutes, minutesComplete) + " de " + budget +
        " min en " + selected.length + " " + plural(selected.length, "bloque", "bloques") + ".";
      if (overload) {
        message += " El bloque mínimo se pasa " + (plannedMinutes - budget) + " min del presupuesto: es el único que cabe.";
      }
    }

    var support = [];
    if (status === "sinActividad" && pending.length > 1) {
      support.push("El recorrido tiene " + pending.length + " fichas pendientes: hoy basta con una.");
    } else if (status !== "sinTiempo" && deferred.ficha > 0) {
      support.push("Quedan " + deferred.ficha + " " + plural(deferred.ficha, "ficha pendiente", "fichas pendientes") + " del recorrido.");
    }
    if (deferred.repaso > 0) {
      support.push("Quedan " + deferred.repaso + " " + plural(deferred.repaso, "repaso vencido", "repasos vencidos") + " para los próximos días: no hace falta hacerlos todos hoy.");
    }
    if (deferred.duda > 0) {
      support.push("Quedan " + deferred.duda + " " + plural(deferred.duda, "duda abierta", "dudas abiertas") + " para otra sesión.");
    }
    if (minimumBlock) {
      support.push("Ese bloque dura más que tu presupuesto; empieza por él y, si no llegas, retómalo mañana sin culpa.");
    } else if (!overload && minutesComplete && remainingMinutes !== null && remainingMinutes >= 3) {
      var smallestDeferred = null;
      candidates.forEach(function (item) {
        if (selected.indexOf(item) !== -1 || item.minutes === null) return;
        if (!smallestDeferred || item.minutes < smallestDeferred.minutes) smallestDeferred = item;
      });
      if (smallestDeferred && smallestDeferred.minutes > remainingMinutes) {
        support.push("Sobran " + remainingMinutes + " min: el siguiente bloque dura " + smallestDeferred.minutes + " y no entra completo. Puedes usarlos en repaso libre o dejarlos.");
      }
    }
    if (!minutesComplete) {
      support.push("Una ficha no declara minutos: no los estimo ni los sumo al total.");
    }
    if (excludedReviews > 0) {
      support.push("Dejé fuera " + excludedReviews + " " + plural(excludedReviews, "repaso", "repasos") + " que no pude ubicar en el temario.");
    }
    var missingLabels = missing.map(function (key) { return SIGNAL_LABELS[key] || key; });
    if (missingLabels.length) {
      support.push("No pude leer " + missingLabels.join(", ") + "; muestro solo lo que sí está disponible.");
    }
    if (budgetDeclared && budget === null) {
      support.push("El presupuesto guardado no es válido; no reparto minutos.");
    }

    return {
      ok: true,
      version: VERSION,
      status: status,
      date: dayKey(today),
      budgetMinutes: budget,
      budgetDeclared: budgetDeclared && budget !== null,
      plannedMinutes: plannedMinutes,
      remainingMinutes: remainingMinutes,
      minutesComplete: minutesComplete,
      overload: overload,
      minimumBlock: minimumBlock,
      items: selected,
      counts: counts,
      deferred: deferred,
      pendingSheets: pending.length,
      signals: {
        repaso: { present: signalPresent("repaso"), count: counts.repaso },
        tarjetas: { present: signalPresent("tarjetas"), count: counts.tarjetas },
        duda: { present: signalPresent("duda"), count: counts.duda },
        ficha: { present: true, count: counts.ficha }
      },
      missing: missing,
      hasActivity: input.hasActivity,
      flashcardsHref: input.flashcardsHref,
      plan: input.plan ? {
        minutesPerDay: input.plan.minutesPerDay,
        daysPerWeek: input.plan.daysPerWeek,
        examDate: typeof input.plan.examDate === "string" ? input.plan.examDate : null
      } : null,
      message: message,
      support: support,
      warnings: warnings
    };
  }

  function minutesText(minutes, complete) {
    return (complete === false ? "al menos " : "") + minutes + " min";
  }

  /* ------------------------------------------------------------------ */
  /* Adaptador real: StudyStore + STUDY_CONTENT -> input de build()      */
  /* ------------------------------------------------------------------ */

  function buildInput(opts) {
    var options = opts || {};
    var store = options.store || (root ? root.StudyStore : null);
    var content = options.content || (root ? root.STUDY_CONTENT : null);
    var input = {
      now: options.now,
      sheets: [],
      reviews: [],
      doubts: [],
      cardsDue: 0,
      plan: null,
      hasActivity: false,
      lastSheetId: null,
      flashcardsHref: FALLBACK_FLASHCARDS,
      signalsMissing: [],
      warnings: []
    };

    if (!content || !Array.isArray(content.sheets)) {
      input.fatal = "No pude leer el temario compartido; no hay fichas para la ruta.";
      return input;
    }
    var state = null;
    try {
      state = store && typeof store.getState === "function" ? store.getState() : null;
    } catch (error) {
      state = null;
    }
    if (!store || !isPlainObject(state)) {
      input.fatal = "No pude leer tu progreso guardado; la ruta no se puede calcular sin datos.";
      return input;
    }

    var sheetStates = isPlainObject(state.sheets) ? state.sheets : {};
    content.sheets.forEach(function (sheet) {
      if (!sheet || typeof sheet.id !== "string" || !sheet.id) return;
      var record = sheetStates[sheet.id];
      input.sheets.push({
        id: sheet.id,
        title: sheet.title,
        minutes: sheet.minutes,
        areaId: sheet.primaryAreaId || sheet.areaId || null,
        categoryId: sheet.categoryId || null,
        done: !!(record && record.completedAt)
      });
    });

    var stats = null;
    try {
      stats = store && typeof store.getDashboardStats === "function" ? store.getDashboardStats() : null;
    } catch (error) {
      stats = null;
    }
    if (stats) {
      input.hasActivity = stats.hasActivity === true;
      input.lastSheetId = stats.lastSheet && stats.lastSheet.sheetId ? stats.lastSheet.sheetId : null;
    } else {
      input.hasActivity = Object.keys(sheetStates).length > 0;
      input.lastSheetId = state.last && state.last.dashboard && state.last.dashboard.sheetId
        ? state.last.dashboard.sheetId : null;
    }

    if (store.sheetReview && typeof store.sheetReview.list === "function") {
      try {
        var reviewList = store.sheetReview.list();
        if (Array.isArray(reviewList)) {
          input.reviews = reviewList;
        } else {
          input.signalsMissing.push("repaso");
          input.warnings.push({ code: "DATOS_INCOMPLETOS", message: "Los repasos programados no llegaron como lista." });
        }
      } catch (error) {
        input.signalsMissing.push("repaso");
        input.warnings.push({ code: "DATOS_INCOMPLETOS", message: "No pude leer los repasos programados." });
      }
    } else {
      input.signalsMissing.push("repaso");
      input.warnings.push({ code: "DATOS_INCOMPLETOS", message: "Este navegador no expone los repasos programados." });
    }

    if (store.doubts && typeof store.doubts.list === "function") {
      try {
        var doubtList = store.doubts.list({ resolved: false });
        if (Array.isArray(doubtList)) {
          input.doubts = doubtList;
        } else {
          input.signalsMissing.push("duda");
          input.warnings.push({ code: "DATOS_INCOMPLETOS", message: "Las dudas abiertas no llegaron como lista." });
        }
      } catch (error) {
        input.signalsMissing.push("duda");
        input.warnings.push({ code: "DATOS_INCOMPLETOS", message: "No pude leer las dudas abiertas." });
      }
    } else {
      input.signalsMissing.push("duda");
      input.warnings.push({ code: "DATOS_INCOMPLETOS", message: "Este navegador no expone la bandeja de dudas." });
    }

    /* Tarjetas vencidas: solo tarjetas ya repasadas cuya caja vuelve a tocar.
       Una tarjeta nueva no está «vencida» y no se cuenta aquí. */
    var nowMs = Date.parse(options.now === undefined ? new Date().toISOString() : options.now);
    if (!isFinite(nowMs) && options.now instanceof Date) nowMs = options.now.getTime();
    if (!isFinite(nowMs)) nowMs = Date.now();
    var cards = isPlainObject(state.cards) ? state.cards : {};
    var cardsDue = 0;
    Object.keys(cards).forEach(function (cardId) {
      var record = cards[cardId];
      if (!record || !(record.reviews > 0)) return;
      if (!record.dueAt) { cardsDue += 1; return; }
      var due = Date.parse(record.dueAt);
      if (!isFinite(due) || due <= nowMs) cardsDue += 1;
    });
    input.cardsDue = cardsDue;

    if (store.plan && typeof store.plan.get === "function") {
      try {
        var plan = store.plan.get();
        if (plan) {
          input.plan = {
            minutesPerDay: plan.minutesPerDay,
            daysPerWeek: plan.daysPerWeek,
            examDate: plan.examDate || null
          };
        }
      } catch (error) {
        input.signalsMissing.push("plan");
        input.warnings.push({ code: "DATOS_INCOMPLETOS", message: "No pude leer el plan guardado." });
      }
    }

    var urls = store.urls;
    if (urls && typeof urls.appUrl === "function") {
      try {
        var flashcards = urls.appUrl("study-flashcards", { mode: "quick", from: "dashboard" });
        if (flashcards) input.flashcardsHref = flashcards;
      } catch (error) { /* se conserva la ruta relativa */ }
    }

    return input;
  }

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  function minutesLabel(item) {
    return item.minutes === null ? "min sin dato" : item.minutes + " min";
  }
  function plannedMinutesLabel(model) {
    if (model.minutesComplete === false && model.plannedMinutes === 0) return "sin minutos conocidos";
    return (model.minutesComplete === false ? "al menos " : "") + model.plannedMinutes + " min";
  }

  function titleFor(model) {
    if (model.status === "lista") return "Lo que toca hoy.";
    if (model.status === "sinActividad") return "Empieza por una ficha.";
    if (model.status === "alDia") return "Nada pendiente por hoy.";
    if (model.status === "sinTiempo") return "Hoy no hay ruta.";
    return "No pude leer tu ruta.";
  }
  function ledeFor(model) {
    if (model.status === "sinActividad") {
      return "Todavía no hay actividad registrada. Esta es la primera ficha pendiente del recorrido y sus minutos son los declarados en el temario.";
    }
    if (model.status === "alDia") return "Puedes leer por gusto o practicar sin deuda.";
    if (model.status === "sinTiempo") return "La ruta de hoy queda vacía a propósito.";
    if (model.status === "error") return "Prefiero no mostrar cifras que no existen.";
    if (model.budgetDeclared) {
      return model.items.length + " " + plural(model.items.length, "bloque", "bloques") + ", " +
        plannedMinutesLabel(model) + " de los " + model.budgetMinutes +
        " que tienes hoy, con lo que ya está abierto.";
    }
    return model.items.length + " " + plural(model.items.length, "bloque", "bloques") + " y " +
      plannedMinutesLabel(model) + " con lo que ya está abierto.";
  }

  function tallyHTML(model) {
    if (model.status === "error" || !model.items.length) return "";
    var byType = { repaso: 0, tarjetas: 0, duda: 0, ficha: 0 };
    model.items.forEach(function (item) { byType[item.type] += 1; });
    var entries = [];
    if (byType.repaso) entries.push({ type: "repaso", label: byType.repaso + " " + plural(byType.repaso, "repaso", "repasos") });
    if (byType.tarjetas && model.counts.tarjetas) {
      entries.push({ type: "tarjetas", label: model.counts.tarjetas + " " + plural(model.counts.tarjetas, "tarjeta", "tarjetas") });
    }
    if (byType.duda) entries.push({ type: "duda", label: byType.duda + " " + plural(byType.duda, "duda", "dudas") });
    if (byType.ficha) entries.push({ type: "ficha", label: byType.ficha + " " + plural(byType.ficha, "ficha", "fichas") });
    if (!entries.length) return "";
    return '<ul class="plan-today-tally" aria-label="Composición de la ruta">' +
      entries.map(function (entry) {
        return '<li data-type="' + entry.type + '"><span class="plan-today-tally-dot" aria-hidden="true"></span>' + esc(entry.label) + '</li>';
      }).join("") +
      '</ul>';
  }

  function meterHTML(model) {
    if (!model.items.length || model.status === "error") return "";
    var planned = model.plannedMinutes;
    var incomplete = model.minutesComplete === false;
    if (model.budgetMinutes === null || !model.budgetDeclared) {
      return '<div class="plan-today-meter">' +
        '<div class="plan-today-meter-copy"><b>' + (incomplete ? (planned === 0 ? "—" : "al menos " + planned) : planned) + '</b><span>' + (incomplete && planned === 0 ? "min sin dato" : "min en la ruta") + '</span></div>' +
        '<span class="plan-today-meter-note">Sin presupuesto configurado</span>' +
        '</div>';
    }
    var fill = model.budgetMinutes > 0 ? Math.min(100, Math.round((planned / model.budgetMinutes) * 100)) : 0;
    var ariaNow = Math.min(planned, model.budgetMinutes);
    var valueText = incomplete && planned === 0
      ? "sin minutos conocidos de " + model.budgetMinutes + " presupuestados"
      : (incomplete ? "al menos " : "") + planned + " de " + model.budgetMinutes + " minutos presupuestados" +
        (model.overload ? "; se pasa de " + (planned - model.budgetMinutes) : "");
    var copyValue = incomplete && planned === 0 ? "—" : (incomplete ? "al menos " + planned : String(planned));
    var copyLabel = incomplete && planned === 0 ? "min sin dato" : "de " + model.budgetMinutes + " min";
    return '<div class="plan-today-meter">' +
      '<div class="plan-today-meter-copy"><b>' + copyValue + '</b><span>' + copyLabel + '</span></div>' +
      '<div class="plan-today-track' + (model.overload ? " is-over" : "") + '" role="progressbar" aria-valuemin="0" aria-valuemax="' + model.budgetMinutes + '" aria-valuenow="' + ariaNow + '" aria-valuetext="' + esc(valueText) + '">' +
      '<span class="plan-today-fill" style="--plan-fill:' + fill + '%"></span>' +
      '</div>' +
      (model.overload ? '<span class="plan-today-meter-note is-over">El bloque mínimo se pasa ' + (planned - model.budgetMinutes) + ' min</span>' : "") +
      '</div>';
  }

  function planLineHTML(model) {
    if (model.status === "error") return "";
    if (model.plan && model.budgetDeclared && model.budgetMinutes !== null) {
      var exam = model.plan.examDate ? civilDay(model.plan.examDate) : null;
      return '<p class="plan-today-plan">Plan guardado: ' + model.plan.minutesPerDay + ' min/día' +
        (exam !== null ? ' · examen ' + esc(dayLabel(exam)) : "") + '.</p>';
    }
    if (model.plan) {
      return '<p class="plan-today-plan">Plan guardado sin un presupuesto de minutos válido.</p>';
    }
    return '<p class="plan-today-plan">Sin plan de minutos configurado: la ruta usa solo lo que ya está abierto.</p>';
  }

  function itemHTML(item, index) {
    var label = item.action && item.action.label ? item.action.label : "";
    var aria = label + " · " + item.title;
    var link = item.action && item.action.href
      ? '<a class="plan-item-link" href="' + esc(item.action.href) + '"' +
        (item.action.external ? ' target="_blank" rel="noopener"' : ' data-nav') +
        ' aria-label="' + esc(aria) + '">' + esc(label) + " " + icon("arrow", 14) + '</a>'
      : '<span class="plan-item-link is-static">' + esc(label) + '</span>';
    return '<li class="plan-item" data-type="' + esc(item.type) + '">' +
      '<span class="plan-item-ordinal" aria-hidden="true">' + String(index + 1).padStart(2, "0") + '</span>' +
      '<span class="plan-item-icon" aria-hidden="true">' + icon(TYPE_ICONS[item.type] || "book", 17) + '</span>' +
      '<div class="plan-item-copy">' +
        '<span class="plan-item-kind">' + esc(item.kind) + ' · ' + esc(minutesLabel(item)) + '</span>' +
        '<h3 class="plan-item-title">' + esc(item.title) + '</h3>' +
        '<p class="plan-item-reason">' + esc(item.reason) + '</p>' +
      '</div>' +
      link +
      '</li>';
  }

  function listHTML(model) {
    return '<ol class="plan-today-list" aria-label="Bloques de la ruta de hoy">' +
      model.items.map(itemHTML).join("") +
      '</ol>';
  }

  function emptyHTML(model) {
    if (model.status === "error") {
      return '<div class="plan-empty plan-empty--error">' +
        '<span class="plan-empty-icon" aria-hidden="true">' + icon("alert", 20) + '</span>' +
        '<div class="plan-empty-copy">' +
          '<p class="plan-empty-text">' + esc(model.message) + '</p>' +
          '<div class="plan-empty-actions">' +
            '<button class="s-btn s-btn--sm" type="button" data-action="retry">Volver a intentar</button>' +
            '<a class="s-btn s-btn--ghost s-btn--sm" href="#/biblioteca" data-nav>Ver biblioteca</a>' +
          '</div>' +
        '</div>' +
        '</div>';
    }
    if (model.status === "sinTiempo") {
      return '<div class="plan-empty">' +
        '<span class="plan-empty-icon" aria-hidden="true">' + icon("timer", 20) + '</span>' +
        '<div class="plan-empty-copy"><p class="plan-empty-text">' + esc(model.message) + '</p></div>' +
        '</div>';
    }
    return '<div class="plan-empty">' +
      '<span class="plan-empty-icon" aria-hidden="true">' + icon("checkCircle", 20) + '</span>' +
      '<div class="plan-empty-copy">' +
        '<p class="plan-empty-text">' + esc(model.message) + '</p>' +
        '<div class="plan-empty-actions">' +
          '<a class="s-btn s-btn--ghost s-btn--sm" href="#/biblioteca" data-nav>Explorar la biblioteca</a>' +
          '<a class="s-btn s-btn--ghost s-btn--sm" href="' + esc(model.flashcardsHref || FALLBACK_FLASHCARDS) + '" target="_blank" rel="noopener">Abrir Flashcards</a>' +
        '</div>' +
      '</div>' +
      '</div>';
  }

  function formulaText(model) {
    if (!model.items.length) return "";
    var estimated = model.items.some(function (item) { return item.minutesSource === "estimada"; });
    if (estimated) {
      return "Minutos: fichas por su duración declarada; repaso a la mitad (mín. 3); 30 s por tarjeta; 3 min por duda.";
    }
    return "Minutos declarados en el temario para cada ficha.";
  }

  function footHTML(model) {
    if (model.status === "error") return "";
    var parts = [];
    if (model.support.length) {
      parts.push('<p class="plan-today-support">' + esc(model.support.join(" ")) + '</p>');
    }
    var formula = formulaText(model);
    if (formula) parts.push('<p class="plan-today-formula">' + esc(formula) + '</p>');
    if (!parts.length) return "";
    return '<footer class="plan-today-foot">' + parts.join("") + '</footer>';
  }

  function safeHeadingId(value) {
    return typeof value === "string" && /^[A-Za-z][A-Za-z0-9_-]*$/.test(value) ? value : null;
  }

  function moreLinkHTML(model) {
    if (model.status === "error") return "";
    return '<a class="plan-today-more" href="#/ruta" data-nav>Ver ruta completa ' + icon("arrow", 14) + '</a>';
  }

  function renderHTML(model, titleId) {    var headingId = titleId || "plan-today-title";
    return '<section class="plan-today" data-plan-state="' + esc(model.status) + '" aria-labelledby="' + esc(headingId) + '">' +
      '<div class="plan-today-layout">' +
        '<header class="plan-today-head">' +
          '<span class="s-kicker"><span class="dot" aria-hidden="true"></span>Ruta de hoy</span>' +
          '<h2 id="' + esc(headingId) + '">' + esc(titleFor(model)) + '</h2>' +
          '<p class="plan-today-lede">' + esc(ledeFor(model)) + '</p>' +
          meterHTML(model) +
          tallyHTML(model) +
          planLineHTML(model) +
          moreLinkHTML(model) +
        '</header>' +
        '<div class="plan-today-body">' +
          (model.status === "error" || !model.items.length ? emptyHTML(model) : listHTML(model)) +
        '</div>' +
        footHTML(model) +
      '</div>' +
      '</section>';
  }

  function render(container, context) {
    if (!container || typeof container.innerHTML !== "string") return false;
    var ctx = context || {};
    var model;
    try {
      var input = buildInput({
        store: ctx.store,
        content: ctx.content,
        now: ctx.now
      });
      model = build(input);
    } catch (error) {
      model = failure("No pude construir la ruta de hoy con los datos disponibles.", null);
    }
    container.innerHTML = renderHTML(model, safeHeadingId(ctx.titleId));
    container.setAttribute("data-plan-state", model.status);
    return model.status !== "error";
  }

  function clear(container) {
    if (!container || typeof container.innerHTML !== "string") return;
    container.innerHTML = "";
    container.removeAttribute("data-plan-state");
  }

  /* ------------------------------------------------------------------ */
  /* Registro como módulo de la app                                      */
  /* ------------------------------------------------------------------ */

  var MOUNT_SELECTOR = '[data-module-mount="today-route"]';

  function mountIn(ctx) {
    if (ctx && ctx.root && typeof ctx.root.querySelector === "function") {
      var scoped = ctx.root.querySelector(MOUNT_SELECTOR);
      if (scoped) return scoped;
    }
    if (root && root.document) return root.document.querySelector(MOUNT_SELECTOR);
    return null;
  }
  function currentRoute() {
    if (!root || !root.StudyApp || typeof root.StudyApp.getRoute !== "function") return null;
    try { return root.StudyApp.getRoute(); } catch (error) { return null; }
  }
  function refresh() {
    var mount = mountIn(null);
    if (!mount) return;
    var route = currentRoute();
    if (!route || route.name !== "home") {
      clear(mount);
      return;
    }
    render(mount, {
      store: root.StudyStore,
      content: root.STUDY_CONTENT,
      now: new Date().toISOString()
    });
  }
  function scheduleRefresh() {
    if (!root || !root.document) return;
    if (api.__frame) return;
    var raf = root.requestAnimationFrame || function (fn) { return root.setTimeout(fn, 16); };
    api.__frame = raf(function () {
      api.__frame = 0;
      var route = currentRoute();
      if (route && route.name === "home") refresh();
    });
  }
  function handleRoute(ctx) {
    var mount = mountIn(ctx);
    if (!mount) return;
    if (!ctx || !ctx.route || ctx.route.name !== "home") {
      clear(mount);
      return;
    }
    render(mount, {
      store: ctx.store,
      content: ctx.content,
      now: new Date().toISOString()
    });
  }

  var api = {
    version: VERSION,
    states: STATES,
    constants: {
      ZONE_OFFSET_MINUTES: ZONE_OFFSET_MINUTES,
      MAX_MINUTES_PER_DAY: MAX_MINUTES_PER_DAY,
      ROUTE_CAPS: ROUTE_CAPS,
      ROUTE_WEIGHTS: ROUTE_WEIGHTS,
      MINUTES_PER_CARD: MINUTES_PER_CARD,
      REVIEW_MINUTES_FACTOR: REVIEW_MINUTES_FACTOR,
      REVIEW_MINUTES_MIN: REVIEW_MINUTES_MIN,
      DOUBT_MINUTES: DOUBT_MINUTES,
      MOUNT_SELECTOR: MOUNT_SELECTOR
    },
    build: build,
    buildInput: buildInput,
    render: render,
    clear: clear,
    __registered: false,
    __subscribed: false,
    __frame: 0,
    register: function register(scope) {
      if (api.__registered) return false;
      var host = scope || root;
      if (!host || !host.StudyApp || typeof host.StudyApp.registerModule !== "function") return false;
      host.StudyApp.registerModule({
        id: "today",
        routes: [],
        init: function () {
          if (api.__subscribed) return;
          var events = host.StudyApp.events;
          if (!events || typeof events.on !== "function") return;
          events.on("store:change", scheduleRefresh);
          events.on("plan:changed", scheduleRefresh);
          api.__subscribed = true;
          /* Si el módulo se registra con la app ya arrancada, rellena el mount
             en el siguiente frame; si aún no hay mount, no hace nada. */
          scheduleRefresh();
        },
        onRoute: handleRoute
      });
      api.__registered = true;
      return true;
    }
  };

  /* En el navegador, StudyApp existe cuando este script se carga al final de
     index.html; si aún no está, se reintenta durante ~2 s sin bloquear. */
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

  return api;
});
