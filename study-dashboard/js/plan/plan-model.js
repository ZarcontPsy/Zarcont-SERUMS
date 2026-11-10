/* SERUMS STUDY — modelo de planificación (Fase 0, sin interfaz)
   Motor de cálculo puro: ruta de hoy, plan por fecha de examen, dominio por
   categoría, repaso espaciado de fichas y resumen semanal.

   Reglas del módulo:
   · Sin DOM, sin StudyStore, sin red y sin dependencias.
   · Sin Date.now() ni ninguna lectura del reloj: `now` se inyecta siempre.
   · No inventa señales: si falta una colección de estado, la declara ausente
     (null + `missing`) en vez de rellenarla con ceros.
   · Fechas civiles en America/Lima (UTC−05:00). Una fecha "YYYY-MM-DD" es un
     día civil literal y no pasa por la zona del navegador.
   · Mismo input + mismo `now` => mismo output (determinista y sin orden de
     Object.keys() no fijado).

   Contrato, fórmulas, pesos y límites: study-dashboard/docs/PLAN-MODELO.md
   Uso:
     navegador  <script src="js/plan/plan-model.js"></script> -> StudyPlanModel
     Node       require("./plan-model.js")

   © 2026 ZARCONT */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else if (typeof define === "function" && define.amd) {
    define([], factory);
  } else {
    root.StudyPlanModel = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var VERSION = "1.0.0";

  /* ==========================================================================
     1. CONSTANTES DEL MODELO (todas documentadas en PLAN-MODELO.md)
     ========================================================================== */

  /* Zona de planificación. America/Lima no aplica horario de verano, así que
     un desplazamiento fijo es exacto. Se puede sobreescribir con
     `input.zoneOffsetMinutes` en cualquier función. */
  var ZONE_OFFSET_MINUTES = -300;

  /* Valor por defecto de minutos por ficha cuando el contenido no lo declara.
     Es el mismo 6 que usa StudyStore al recomendar una ficha; aquí se marca
     `minutesEstimated: true` y se agrega un supuesto explícito. */
  var MINUTES_DEFAULT = 6;
  var MAX_MINUTES_PER_DAY = 1440;
  var MAX_CALENDAR_DAYS = 2000;

  /* Repaso de tarjetas: 30 s por tarjeta. */
  var MINUTES_PER_CARD = 0.5;
  /* Releer una ficha para repasarla cuesta la mitad que leerla por primera vez,
     con un mínimo de 3 minutos. */
  var REVIEW_MINUTES_FACTOR = 0.5;
  var REVIEW_MINUTES_MIN = 3;
  /* Resolver una duda abierta: 3 minutos. */
  var DOUBT_MINUTES = 3;

  var UNASSIGNED_AREA = "sin-area";
  var UNASSIGNED_CATEGORY = "sin-categoria";

  var TYPES = {
    REPASO: "repaso",
    TARJETAS: "tarjetas",
    DUDA: "duda",
    FICHA: "ficha"
  };

  /* Prioridad base de cada tipo en la ruta de hoy. */
  var ROUTE_WEIGHTS = { repaso: 100, tarjetas: 88, duda: 82, ficha: 70 };
  /* Desempate estable cuando dos ítems tienen la misma prioridad. */
  var ROUTE_RANK = { repaso: 0, tarjetas: 1, duda: 2, ficha: 3 };
  /* Tope de bloques por tipo en un día. Un atraso de 40 repasos no debe
     ocupar la jornada completa. */
  var ROUTE_CAPS = { repaso: 3, tarjetas: 1, duda: 2, ficha: 3 };
  var OVERDUE_BONUS_PER_DAY = 2;
  var OVERDUE_BONUS_MAX = 20;
  var CARDS_BONUS_DIVISOR = 4;
  var CARDS_BONUS_MAX = 10;
  var NEXT_SHEET_BONUS = 8;
  var AREA_PRIORITY_BONUS = 5;

  /* Escalera de repaso espaciado de fichas, en días. */
  var REVIEW_LADDER = [1, 2, 4, 7, 15, 30, 60];
  var CONFIDENCE_START_INDEX = { weak: 0, partial: 1, solid: 2 };
  var CONFIDENCE_VALUE = { solid: 1, partial: 0.55, weak: 0.15 };
  var CONFIDENCE_IDS = ["solid", "partial", "weak"];
  var UNKNOWN_CONFIDENCE_INTERVAL_DAYS = 1;
  var MAX_INTERVAL_DAYS = 90;

  /* Pesos del dominio. No son inyectables a propósito: el puntaje debe ser
     comparable entre sesiones y entre categorías. */
  var SIGNAL_WEIGHTS = { lectura: 0.3, confianza: 0.3, tarjetas: 0.25, errores: 0.15 };
  var SIGNAL_IDS = ["lectura", "confianza", "tarjetas", "errores"];
  var VIEWED_CREDIT = 0.4;
  var ERRORS_FOR_ZERO = 3;
  var ERROR_WINDOW_DAYS = 14;
  var CARD_ACCURACY_WEIGHT = 0.6;
  var CARD_VOLUME_WEIGHT = 0.4;
  var MIN_COVERAGE_FOR_SOLIDO = 0.5;
  var WEAK_MIN_COVERAGE = 0.5;
  var BAND_THRESHOLDS = { fragil: 45, enProgreso: 75 };

  var WEEKDAYS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
  var MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"];

  /* ==========================================================================
     2. UTILIDADES
     ========================================================================== */

  function isObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function asNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    var n = Number(value);
    return isFinite(n) ? n : null;
  }

  function clamp(value, min, max) {
    return value < min ? min : value > max ? max : value;
  }

  function pad2(value) {
    return value < 10 ? "0" + value : String(value);
  }

  function warn(code, message, extra) {
    var entry = { code: code, message: message };
    if (extra) {
      Object.keys(extra).forEach(function (key) { entry[key] = extra[key]; });
    }
    return entry;
  }

  function newContext() {
    return {
      warnings: [],
      assumptions: [],
      warn: function (code, message, extra) { this.warnings.push(warn(code, message, extra)); },
      assume: function (code, message) { this.assumptions.push({ code: code, message: message }); }
    };
  }

  function sumBy(list, fn) {
    var total = 0;
    for (var i = 0; i < list.length; i++) total += fn(list[i], i);
    return total;
  }

  function sortedKeys(map) {
    return Object.keys(map).sort(function (a, b) { return a < b ? -1 : a > b ? 1 : 0; });
  }

  /* ==========================================================================
     3. FECHAS CIVILES — aritmética entera, sin Date y sin zona horaria

     Un "día" es un entero: días transcurridos desde 1970-01-01. Convertir a
     fecha civil nunca usa `new Date`, así que el resultado no depende de la
     zona horaria de la máquina.
     ========================================================================== */

  function daysFromCivil(year, month, day) {
    var y = year - (month <= 2 ? 1 : 0);
    var era = Math.floor(y / 400);
    var yoe = y - era * 400;
    var doy = Math.floor((153 * (month + (month > 2 ? -3 : 9)) + 2) / 5) + day - 1;
    var doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
    return era * 146097 + doe - 719468;
  }

  function civilFromDays(days) {
    var z = days + 719468;
    var era = Math.floor(z / 146097);
    var doe = z - era * 146097;
    var yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
    var y = yoe + era * 400;
    var doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
    var mp = Math.floor((5 * doy + 2) / 153);
    var d = doy - Math.floor((153 * mp + 2) / 5) + 1;
    var m = mp + (mp < 10 ? 3 : -9);
    return { y: y + (m <= 2 ? 1 : 0), m: m, d: d };
  }

  var DAY_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

  /* "YYYY-MM-DD" -> número de día. Rechaza fechas inexistentes (2026-02-30). */
  function parseDayKey(value) {
    if (typeof value !== "string") return null;
    var match = DAY_KEY_RE.exec(value.trim());
    if (!match) return null;
    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    var number = daysFromCivil(year, month, day);
    var back = civilFromDays(number);
    if (back.y !== year || back.m !== month || back.d !== day) return null;
    return number;
  }

  function dayKey(number) {
    var civil = civilFromDays(number);
    return civil.y + "-" + pad2(civil.m) + "-" + pad2(civil.d);
  }

  /* Lunes = 0 … domingo = 6. */
  function weekday(number) {
    return ((number % 7) + 7 + 3) % 7;
  }

  function startOfWeek(number) {
    return number - weekday(number);
  }

  function dateLabel(number) {
    var civil = civilFromDays(number);
    return civil.d + " " + MONTHS[civil.m - 1] + " " + civil.y;
  }

  var MOMENT_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?(Z|[+-]\d{2}:?\d{2})?$/;

  function instantToDay(instantMs, offsetMinutes) {
    return Math.floor((instantMs + offsetMinutes * 60000) / 86400000);
  }

  /* Acepta "YYYY-MM-DD" (día civil literal), ISO con hora y sin zona (hora
     local de Lima), ISO con Z o desfase (se convierte a la zona de plan) y
     Date/epoch (se convierte a la zona de plan).
     Devuelve { day, instantMs, hadTime, explicitOffset }. */
  function parseMoment(value, offsetMinutes) {
    var offset = typeof offsetMinutes === "number" && isFinite(offsetMinutes) && Math.abs(offsetMinutes) <= 840
      ? Math.round(offsetMinutes) : ZONE_OFFSET_MINUTES;

    if (value && typeof value === "object" && typeof value.getTime === "function") {
      var stamp = value.getTime();
      if (!isFinite(stamp)) return null;
      return { day: instantToDay(stamp, offset), instantMs: stamp, hadTime: true, explicitOffset: true };
    }
    if (typeof value === "number" && isFinite(value)) {
      return { day: instantToDay(value, offset), instantMs: value, hadTime: true, explicitOffset: true };
    }
    if (typeof value !== "string") return null;

    var match = MOMENT_RE.exec(value.trim());
    if (!match) return null;
    var civilDay = parseDayKey(match[1] + "-" + match[2] + "-" + match[3]);
    if (civilDay === null) return null;

    var hadTime = match[4] !== undefined;
    var hours = hadTime ? Number(match[4]) : 0;
    var minutes = hadTime ? Number(match[5]) : 0;
    var seconds = match[6] !== undefined ? Number(match[6]) : 0;
    var millis = match[7] !== undefined ? Number((match[7] + "00").slice(0, 3)) : 0;
    if (hours > 23 || minutes > 59 || seconds > 59) return null;

    var timeMs = ((hours * 60 + minutes) * 60 + seconds) * 1000 + millis;
    var explicitOffset = match[8] !== undefined;
    var offsetUsed = offset;
    if (explicitOffset) {
      if (match[8] === "Z") {
        offsetUsed = 0;
      } else {
        var sign = match[8].charAt(0) === "-" ? -1 : 1;
        var body = match[8].slice(1).replace(":", "");
        offsetUsed = sign * (Number(body.slice(0, 2)) * 60 + Number(body.slice(2, 4)));
      }
    }
    var instantMs = civilDay * 86400000 + timeMs - offsetUsed * 60000;
    return {
      day: explicitOffset ? instantToDay(instantMs, offset) : civilDay,
      instantMs: instantMs,
      hadTime: hadTime,
      explicitOffset: explicitOffset
    };
  }

  function isoFromLocalMidnight(number, offsetMinutes) {
    var offset = typeof offsetMinutes === "number" ? offsetMinutes : ZONE_OFFSET_MINUTES;
    return new Date(number * 86400000 - offset * 60000).toISOString();
  }

  /* Lectura del reloj inyectado. `now` es obligatorio: si falta o no se puede
     interpretar, el módulo no calcula. */
  function readClock(input, ctx) {
    var offsetInput = asNumber(input.zoneOffsetMinutes);
    var offset = ZONE_OFFSET_MINUTES;
    if (input.zoneOffsetMinutes !== undefined && input.zoneOffsetMinutes !== null) {
      if (offsetInput === null || Math.abs(offsetInput) > 840) {
        ctx.warn("ZONA_INVALIDA", "El desfase de zona no es válido; uso America/Lima (UTC−05:00).");
      } else {
        offset = Math.round(offsetInput);
      }
    }
    var moment = parseMoment(input.now, offset);
    if (!moment) {
      return { ok: false, zoneOffsetMinutes: offset };
    }
    return {
      ok: true,
      day: moment.day,
      key: dayKey(moment.day),
      instantMs: moment.instantMs,
      zoneOffsetMinutes: offset
    };
  }

  function clockOut(clock) {
    return { date: clock.key, dayNumber: clock.day, zoneOffsetMinutes: clock.zoneOffsetMinutes };
  }

  /* ==========================================================================
     4. LECTURA DE ENTRADAS
     ========================================================================== */

  function readBudget(input, ctx) {
    var raw = input.budgetMinutes;
    if (raw === undefined || raw === null) raw = input.minutesPerDay;
    if (raw === undefined || raw === null || raw === "") {
      return { value: null, declared: false, adjusted: false };
    }
    var n = asNumber(raw);
    if (n === null || n < 0) {
      ctx.warn("PRESUPUESTO_INVALIDO", "El presupuesto de minutos no es un número válido; lo trato como no declarado.");
      return { value: null, declared: false, adjusted: false };
    }
    if (n === 0) return { value: 0, declared: true, adjusted: false };
    if (n > MAX_MINUTES_PER_DAY) {
      ctx.warn("PRESUPUESTO_AJUSTADO", "El presupuesto supera 24 h; lo limito a " + MAX_MINUTES_PER_DAY + " minutos.", { from: n, to: MAX_MINUTES_PER_DAY });
      return { value: MAX_MINUTES_PER_DAY, declared: true, adjusted: true };
    }
    var rounded = Math.max(1, Math.round(n));
    if (rounded !== n) {
      ctx.assume("PRESUPUESTO_REDONDEADO", "El presupuesto de minutos se redondea a " + rounded + " minutos.");
    }
    return { value: rounded, declared: true, adjusted: rounded !== n };
  }

  function readDaysPerWeek(input, ctx) {
    var explicit = input.studyDays;
    if (Array.isArray(explicit) && explicit.length) {
      var days = [];
      explicit.forEach(function (value) {
        var n = asNumber(value);
        if (n === null || n !== Math.floor(n) || n < 0 || n > 6) return;
        if (days.indexOf(n) === -1) days.push(n);
      });
      days.sort(function (a, b) { return a - b; });
      if (days.length) {
        return { value: days.length, weekdays: days, assumed: false, source: "studyDays" };
      }
      ctx.warn("DIAS_SEMANA_INVALIDO", "`studyDays` no tiene días válidos (0 lunes … 6 domingo); uso la semana completa.");
      return { value: 7, weekdays: [0, 1, 2, 3, 4, 5, 6], assumed: true, source: "defecto" };
    }

    var raw = input.daysPerWeek;
    if (raw === undefined || raw === null || raw === "") {
      ctx.warn("DIAS_SEMANA_AUSENTE", "No recibo `daysPerWeek`; planifico los 7 días para no descartar ninguno.");
      ctx.assume("DIAS_SEMANA_AUSENTE", "Sin días por semana declarados se asume 1..7 (semana completa).");
      return { value: 7, weekdays: [0, 1, 2, 3, 4, 5, 6], assumed: true, source: "defecto" };
    }
    var n = asNumber(raw);
    if (n === null || n !== Math.round(n) || n < 1 || n > 7) {
      ctx.warn("DIAS_SEMANA_INVALIDO", "`daysPerWeek` debe ser un entero de 1 a 7; planifico los 7 días.", { value: raw });
      ctx.assume("DIAS_SEMANA_INVALIDO", "Un valor inválido de días por semana no descarta días: se planifican 7.");
      return { value: 7, weekdays: [0, 1, 2, 3, 4, 5, 6], assumed: true, source: "defecto" };
    }
    var weekdays = [];
    for (var i = 0; i < n; i++) weekdays.push(i);
    return { value: n, weekdays: weekdays, assumed: false, source: "daysPerWeek" };
  }

  function readExam(input, ctx) {
    var raw = input.examDate;
    if (raw === undefined || raw === null || raw === "") {
      return { day: null, provided: false, invalid: false };
    }
    var parsed = typeof raw === "string" ? parseDayKey(raw) : null;
    if (parsed === null) {
      ctx.warn("FECHA_INVALIDA", "La fecha de examen no es una fecha válida (YYYY-MM-DD); la trato como ausente.", { value: raw });
      return { day: null, provided: true, invalid: true };
    }
    return { day: parsed, provided: true, invalid: false };
  }

  function readSheetList(rawSheets, options, ctx) {
    var opts = options || {};
    var defaultMinutes = asNumber(opts.defaultMinutes) === null ? MINUTES_DEFAULT : Math.round(opts.defaultMinutes);
    var categoryArea = isObject(opts.categoryArea) ? opts.categoryArea : null;
    var result = {
      ok: false,
      items: [],
      provided: Array.isArray(rawSheets),
      providedCount: Array.isArray(rawSheets) ? rawSheets.length : 0,
      skippedNoId: 0,
      skippedInvalid: 0,
      duplicates: 0,
      fallbackMinutes: 0,
      withoutArea: 0,
      completed: 0
    };
    if (!Array.isArray(rawSheets)) return result;
    result.ok = true;

    var seen = {};
    rawSheets.forEach(function (raw) {
      if (!isObject(raw)) { result.skippedInvalid += 1; return; }
      var id = typeof raw.id === "string" ? raw.id.trim() : "";
      if (!id) { result.skippedNoId += 1; return; }
      if (seen[id]) { result.duplicates += 1; return; }
      seen[id] = true;

      var minutesRaw = asNumber(raw.minutes);
      var minutes;
      var estimated = false;
      if (minutesRaw === null || minutesRaw <= 0) {
        minutes = defaultMinutes;
        estimated = true;
        result.fallbackMinutes += 1;
      } else {
        minutes = Math.max(1, Math.round(minutesRaw));
      }

      var areaId = typeof raw.areaId === "string" && raw.areaId ? raw.areaId :
        (typeof raw.primaryAreaId === "string" && raw.primaryAreaId ? raw.primaryAreaId : null);
      var categoryId = typeof raw.categoryId === "string" && raw.categoryId ? raw.categoryId : null;
      if (!areaId && categoryId && categoryArea && categoryArea[categoryId]) {
        areaId = categoryArea[categoryId];
      }
      if (!areaId) {
        areaId = UNASSIGNED_AREA;
        result.withoutArea += 1;
      }

      var done = raw.done === true || raw.completed === true || !!raw.completedAt;
      if (done) result.completed += 1;

      var priority = asNumber(raw.priority);
      if (priority === null || priority <= 0) priority = 1;

      result.items.push({
        id: id,
        title: typeof raw.title === "string" && raw.title ? raw.title : id,
        minutes: minutes,
        minutesEstimated: estimated,
        areaId: areaId,
        categoryId: categoryId,
        priority: priority,
        done: done,
        order: result.items.length
      });
    });

    if (result.skippedNoId || result.skippedInvalid) {
      ctx.warn("FICHAS_DESCARTADAS",
        "Descarto " + (result.skippedNoId + result.skippedInvalid) + " fichas sin identificador utilizable.",
        { sinId: result.skippedNoId, invalidas: result.skippedInvalid });
    }
    if (result.duplicates) {
      ctx.warn("FICHAS_DUPLICADAS", "Hay " + result.duplicates + " fichas repetidas; uso la primera de cada id.", { count: result.duplicates });
    }
    if (result.fallbackMinutes) {
      ctx.warn("MINUTOS_POR_DEFECTO",
        result.fallbackMinutes + " fichas no declaran minutos; uso " + defaultMinutes + " min y lo marco como estimado.",
        { count: result.fallbackMinutes, minutes: defaultMinutes });
      ctx.assume("MINUTOS_POR_DEFECTO",
        "Ficha sin `minutes`: " + defaultMinutes + " minutos (valor por defecto del contenido), marcada `minutesEstimated: true`.");
    }
    if (result.withoutArea) {
      ctx.warn("FICHAS_SIN_AREA", result.withoutArea + " fichas no declaran área ni categoría; se agrupan en «" + UNASSIGNED_AREA + "».", { count: result.withoutArea });
    }
    return result;
  }

  function readAreaPriority(input, pending, ctx) {
    var declared = isObject(input.areaPriority) ? input.areaPriority : {};
    var map = {};
    var ids = {};
    pending.forEach(function (item) { ids[item.areaId] = true; });
    sortedKeys(ids).forEach(function (id) {
      var value = asNumber(declared[id]);
      if (declared[id] !== undefined && (value === null || value <= 0)) {
        ctx.warn("PRIORIDAD_AREA_INVALIDA", "La prioridad del área «" + id + "» no es válida; uso 1.", { areaId: id, value: declared[id] });
        value = 1;
      }
      if (value === null || value <= 0) {
        /* Sin prioridad de área declarada, se usa la mayor prioridad de sus
           fichas (campo `priority` de cada ficha); si tampoco hay, 1. */
        value = 1;
        pending.forEach(function (sheet) {
          if (sheet.areaId === id && sheet.priority > value) value = sheet.priority;
        });
      }
      map[id] = value;
    });
    return map;
  }

  /* Orden proporcional al peso real de cada área (minutos), con la prioridad
     declarada como ritmo. Cada área avanza a la misma velocidad relativa, de
     modo que cualquier prefijo del plan conserva la mezcla del temario. */
  function orderByAreaBalance(pending, areaPriority) {
    var groups = {};
    pending.forEach(function (item) {
      var group = groups[item.areaId];
      if (!group) {
        group = groups[item.areaId] = { id: item.areaId, queue: [], minutes: 0, actual: 0, weight: 0, priority: 1 };
      }
      group.queue.push(item);
      group.minutes += item.minutes;
    });
    var totalWeight = 0;
    sortedKeys(groups).forEach(function (id) {
      var group = groups[id];
      group.priority = areaPriority[id] === undefined ? 1 : areaPriority[id];
      group.weight = group.minutes * group.priority;
      totalWeight += group.weight;
    });
    if (totalWeight <= 0) totalWeight = 1;

    var ordered = [];
    var scheduled = 0;
    var remaining = pending.length;
    while (remaining > 0) {
      var best = null;
      var bestDeficit = -Infinity;
      var keys = sortedKeys(groups);
      for (var i = 0; i < keys.length; i++) {
        var group = groups[keys[i]];
        if (!group.queue.length) continue;
        var deficit = (group.weight / totalWeight) * scheduled - group.actual;
        if (deficit > bestDeficit) {
          best = group;
          bestDeficit = deficit;
          continue;
        }
        if (deficit === bestDeficit && best) {
          if (group.priority > best.priority) { best = group; continue; }
          if (group.priority === best.priority) {
            var groupLeft = sumQueue(group.queue);
            var bestLeft = sumQueue(best.queue);
            if (groupLeft > bestLeft || (groupLeft === bestLeft && group.id < best.id)) best = group;
          }
        }
      }
      if (!best) break;
      var item = best.queue.shift();
      best.actual += item.minutes;
      scheduled += item.minutes;
      remaining -= 1;
      item.sequence = ordered.length;
      ordered.push(item);
    }
    return ordered;
  }

  function sumQueue(queue) {
    return sumBy(queue, function (item) { return item.minutes; });
  }

  /* Empaqueta en días de estudio. Primero que quepa (first-fit): una ficha
     grande puede saltar al día siguiente y un bloque pequeño aprovecha el
     hueco, sin dejar días vacíos al principio. Una ficha más larga que el
     presupuesto diario ocupa su propio día y se marca `overBudget`. */
  function packIntoDays(ordered, startDay, budget, isStudyDay, maxDays) {
    var horizon = Math.min(MAX_CALENDAR_DAYS, Math.max(1, maxDays));
    var studyDays = [];
    for (var offset = 0; offset < horizon; offset++) {
      if (isStudyDay(startDay + offset)) studyDays.push(startDay + offset);
    }
    var buckets = {};
    var lastDay = null;
    var unscheduled = [];
    var oversized = 0;

    ordered.forEach(function (sheet) {
      var target = null;
      var size = sheet.minutes;
      if (size > budget) {
        for (var a = 0; a < studyDays.length; a++) {
          var empty = buckets[studyDays[a]];
          if (!empty || empty.minutes === 0) { target = studyDays[a]; break; }
        }
        oversized += 1;
      } else {
        for (var b = 0; b < studyDays.length; b++) {
          var bucket = buckets[studyDays[b]];
          if (!bucket) { target = studyDays[b]; break; }
          if (bucket.minutes + size <= budget) { target = studyDays[b]; break; }
        }
      }
      if (target === null) {
        unscheduled.push({ id: sheet.id, minutes: sheet.minutes, reason: "horizonte" });
        return;
      }
      var slot = buckets[target];
      if (!slot) slot = buckets[target] = { day: target, minutes: 0, sheets: [], overBudget: false };
      slot.sheets.push(sheet);
      slot.minutes += size;
      if (slot.minutes > budget) slot.overBudget = true;
      if (lastDay === null || target > lastDay) lastDay = target;
    });

    /* Consolidación: mover hacia el hueco más temprano lo que quedó en días
       posteriores. Sin cambiar el presupuesto diario, reduce los días que el
       calendario necesita; sin este paso una ficha de 22 min "desperdicia"
       media jornada en cada corte y el plan termina días después de lo posible. */
    var usedDays = [];
    Object.keys(buckets).forEach(function (key) { usedDays.push(buckets[key]); });
    usedDays.sort(function (a, b) { return a.day - b.day; });
    for (var last = usedDays.length - 1; last >= 0; last--) {
      var late = usedDays[last];
      var kept = [];
      for (var s = 0; s < late.sheets.length; s++) {
        var sheet = late.sheets[s];
        var moved = false;
        if (sheet.minutes <= budget) {
          for (var e = 0; e < last; e++) {
            var early = usedDays[e];
            if (early.minutes + sheet.minutes <= budget) {
              early.sheets.push(sheet);
              early.minutes += sheet.minutes;
              early.overBudget = early.minutes > budget;
              late.minutes -= sheet.minutes;
              moved = true;
              break;
            }
          }
        }
        if (!moved) kept.push(sheet);
      }
      late.sheets = kept;
      if (late.minutes === 0) {
        delete buckets[late.day];
        continue;
      }
      late.overBudget = late.minutes > budget;
    }

    var finalLastDay = null;
    Object.keys(buckets).forEach(function (key) {
      var bucket = buckets[key];
      if (bucket.minutes <= 0) return;
      bucket.sheets.sort(function (a, b) { return (a.sequence || 0) - (b.sequence || 0); });
      if (finalLastDay === null || bucket.day > finalLastDay) finalLastDay = bucket.day;
    });

    return { studyDays: studyDays, buckets: buckets, lastDay: finalLastDay, unscheduled: unscheduled, oversized: oversized };
  }

  function publicSheet(sheet, areaPriority) {
    return {
      id: sheet.id,
      title: sheet.title,
      minutes: sheet.minutes,
      minutesEstimated: sheet.minutesEstimated,
      areaId: sheet.areaId,
      categoryId: sheet.categoryId,
      priority: areaPriority && areaPriority[sheet.areaId] !== undefined ? areaPriority[sheet.areaId] : sheet.priority
    };
  }

  function buildCalendar(calendar) {
    var out = [];
    if (calendar.lastDay === null) return out;
    var examDay = calendar.examDay;
    var holidaySet = calendar.holidaySet;
    var isStudyDay = calendar.isStudyDay;
    for (var day = calendar.startDay; day <= calendar.lastDay; day++) {
      var bucket = calendar.buckets[day];
      var key = dayKey(day);
      var index = weekday(day);
      out.push({
        date: key,
        dayNumber: day,
        weekday: index,
        weekdayLabel: WEEKDAYS[index],
        studyDay: isStudyDay(day),
        examDay: examDay !== null && day === examDay,
        afterExam: examDay !== null && day > examDay,
        holiday: holidaySet[key] === true,
        minutes: bucket ? bucket.minutes : 0,
        overBudget: bucket ? bucket.overBudget === true : false,
        empty: !bucket,
        sheets: bucket ? bucket.sheets.map(function (sheet) { return publicSheet(sheet, calendar.areaPriority); }) : []
      });
    }
    return out;
  }

  function countStudyDays(fromDay, toDay, isStudyDay) {
    if (toDay < fromDay) return 0;
    var count = 0;
    for (var day = fromDay; day <= toDay; day++) {
      if (isStudyDay(day)) count += 1;
    }
    return count;
  }

  function makeStudyDayPredicate(weekdays, examDay, holidaySet) {
    var allowed = {};
    weekdays.forEach(function (index) { allowed[index] = true; });
    return function (day) {
      if (examDay !== null && day === examDay) return false;
      if (holidaySet[dayKey(day)] === true) return false;
      return allowed[weekday(day)] === true;
    };
  }

  function readHolidays(input, ctx) {
    var set = {};
    var invalid = 0;
    if (Array.isArray(input.holidays)) {
      input.holidays.forEach(function (value) {
        var day = parseDayKey(value);
        if (day === null) { invalid += 1; return; }
        set[dayKey(day)] = true;
      });
    }
    if (invalid) {
      ctx.warn("FERIADO_INVALIDO", invalid + " fechas no laborables no son válidas y se ignoran.", { count: invalid });
    }
    return set;
  }

  /* ==========================================================================
     5. buildPlan
     ========================================================================== */

  function emptyPlanResponse(status, clock, ctx, extra) {
    var response = {
      ok: status === "ok" || status === "sinFecha" || status === "fechaPasada" || status === "completado",
      version: VERSION,
      status: status,
      balance: null,
      fits: null,
      examDate: null,
      examDayNumber: null,
      now: clock && clock.ok ? clockOut(clock) : null,
      today: clock && clock.ok ? clock.key : null,
      minutesPerDay: null,
      daysPerWeek: null,
      studyWeekdays: [],
      totals: {
        sheets: 0,
        completedSheets: 0,
        pendingSheets: 0,
        pendingMinutes: 0,
        minutesEstimated: 0
      },
      capacity: { studyDays: null, minutes: null, lastStudyDay: null },
      estimatedEndDate: null,
      estimatedEndDayNumber: null,
      lateDays: null,
      shortfallMinutes: null,
      minutesAfterDeadline: null,
      sheetsAfterDeadline: null,
      spareMinutes: null,
      slackStudyDays: null,
      truncated: false,
      calendar: [],
      days: 0,
      session: null,
      nextSheet: null,
      unscheduled: [],
      areas: [],
      areaMinutes: {},
      areaShare: {},
      coverage: null,
      message: "",
      warnings: ctx ? ctx.warnings : [],
      assumptions: ctx ? ctx.assumptions : []
    };
    if (extra) {
      Object.keys(extra).forEach(function (key) { response[key] = extra[key]; });
    }
    return response;
  }

  function buildPlan(input) {
    input = input === undefined || input === null ? {} : input;
    if (!isObject(input)) input = {};
    var ctx = newContext();
    var clock = readClock(input, ctx);
    if (!clock.ok) {
      return emptyPlanResponse("sinDatos", clock, ctx, {
        message: "Falta una fecha de referencia (`now`) válida. No uso el reloj del sistema: el plan debe ser reproducible."
      });
    }
    if (!Array.isArray(input.sheets)) {
      return emptyPlanResponse("sinDatos", clock, ctx, {
        message: "No recibo la lista de fichas. Sin contenido no hay plan."
      });
    }

    var read = readSheetList(input.sheets, {
      defaultMinutes: input.defaultMinutes,
      categoryArea: input.categoryArea
    }, ctx);
    var items = read.items;
    if (!items.length) {
      return emptyPlanResponse("sinFichas", clock, ctx, {
        message: "La lista de fichas está vacía: no hay nada que repartir.",
        coverage: coverageForSheets(read)
      });
    }

    var pending = items.filter(function (sheet) { return !sheet.done; });
    var pendingMinutes = sumBy(pending, function (sheet) { return sheet.minutes; });
    var completedSheets = items.length - pending.length;
    var totals = {
      sheets: items.length,
      completedSheets: completedSheets,
      pendingSheets: pending.length,
      pendingMinutes: pendingMinutes,
      minutesEstimated: read.fallbackMinutes
    };

    var budgetInfo = readBudget(input, ctx);
    if (budgetInfo.value === null) {
      return emptyPlanResponse("sinPresupuesto", clock, ctx, {
        message: "Falta el presupuesto de minutos por día. Sin ese dato no reparto fichas: «0» y «sin configurar» no son lo mismo.",
        totals: totals,
        coverage: coverageForSheets(read)
      });
    }
    var budget = budgetInfo.value;

    var daysInfo = readDaysPerWeek(input, ctx);
    var exam = readExam(input, ctx);
    var holidaySet = readHolidays(input, ctx);
    var isStudyDay = makeStudyDayPredicate(daysInfo.weekdays, exam.day, holidaySet);

    var base = {
      totals: totals,
      minutesPerDay: budget,
      daysPerWeek: daysInfo.value,
      studyWeekdays: daysInfo.weekdays.slice(),
      examDate: exam.day === null ? null : dayKey(exam.day),
      examDayNumber: exam.day,
      coverage: coverageForSheets(read)
    };

    /* Todo completado: no hay nada que repartir. */
    if (!pending.length) {
      return emptyPlanResponse("completado", clock, ctx, merge(base, {
        balance: "ahead",
        fits: exam.day === null ? null : true,
        estimatedEndDate: clock.key,
        estimatedEndDayNumber: clock.day,
        spareMinutes: exam.day === null ? null : countStudyDays(clock.day, exam.day - 1, isStudyDay) * budget,
        shortfallMinutes: 0,
        message: "No queda ninguna ficha pendiente: las " + items.length + " fichas están completadas o marcadas como hechas."
      }));
    }

    if (budget === 0) {
      var capacityZero = exam.day === null ? null : countStudyDays(clock.day, exam.day - 1, isStudyDay) * budget;
      return emptyPlanResponse("sinTiempo", clock, ctx, merge(base, {
        balance: exam.day === null || exam.day < clock.day ? null : "behind",
        fits: exam.day === null ? null : false,
        capacity: {
          studyDays: exam.day === null ? null : countStudyDays(clock.day, exam.day - 1, isStudyDay),
          minutes: capacityZero,
          lastStudyDay: exam.day === null ? null : dayKey(exam.day - 1)
        },
        shortfallMinutes: exam.day === null || exam.day < clock.day ? null : pendingMinutes,
        spareMinutes: 0,
        message: "Con 0 minutos al día no hay plan posible: las " + pending.length + " fichas (" + pendingMinutes + " min) siguen pendientes. Ajusta los minutos por día para ver un calendario."
      }));
    }

    var areaPriority = readAreaPriority(input, pending, ctx);
    var ordered = orderByAreaBalance(pending, areaPriority);

    var neededDays = Math.ceil(pendingMinutes / budget) + 30;
    var calendarHorizon = Math.ceil((neededDays * 7) / Math.max(1, daysInfo.value)) + 40;
    var requestedMax = asNumber(input.maxDays);
    if (requestedMax !== null && requestedMax > 0) calendarHorizon = Math.min(MAX_CALENDAR_DAYS, Math.round(requestedMax));
    calendarHorizon = Math.min(MAX_CALENDAR_DAYS, Math.max(1, calendarHorizon));

    var packed = packIntoDays(ordered, clock.day, budget, isStudyDay, calendarHorizon);
    if (packed.oversized) {
      ctx.warn("FICHA_MAS_LARGA_QUE_EL_DIA",
        packed.oversized + " fichas duran más que el presupuesto diario: ocupan su propio día y se marcan `overBudget`.",
        { count: packed.oversized });
    }
    if (packed.unscheduled.length) {
      ctx.warn("HORIZONTE_INSUFICIENTE",
        packed.unscheduled.length + " fichas quedan fuera del calendario: el horizonte de " + calendarHorizon + " días no alcanza.",
        { count: packed.unscheduled.length });
    }

    var calendar = buildCalendar({
      startDay: clock.day,
      lastDay: packed.lastDay,
      buckets: packed.buckets,
      isStudyDay: isStudyDay,
      examDay: exam.day,
      holidaySet: holidaySet,
      areaPriority: areaPriority
    });

    var estimatedEndDay = packed.lastDay;
    var capacityDays = exam.day === null ? null : countStudyDays(clock.day, exam.day - 1, isStudyDay);
    var capacityMinutes = capacityDays === null ? null : capacityDays * budget;
    var liveDeadline = exam.day !== null && exam.day >= clock.day;
    /* `fits` se mide sobre el calendario real, no sobre la aritmética de
       capacidad: las fichas tienen tamaños 5–22 min y no se parten, así que dos
       días de 45 min pueden no alojar exactamente 90 min de contenido. */
    var fits = liveDeadline
      ? (estimatedEndDay !== null && estimatedEndDay <= exam.day - 1)
      : null;
    var minutesAfterDeadline = null;
    var sheetsAfterDeadline = 0;
    if (exam.day !== null) {
      minutesAfterDeadline = 0;
      sortedKeys(packed.buckets).forEach(function (key) {
        var dayNumber = Number(key);
        if (dayNumber <= exam.day - 1) return;
        minutesAfterDeadline += packed.buckets[key].minutes;
        sheetsAfterDeadline += packed.buckets[key].sheets.length;
      });
    }
    var shortfallMinutes = liveDeadline ? minutesAfterDeadline : null;
    var spareMinutes = liveDeadline ? (fits ? Math.max(0, capacityMinutes - pendingMinutes) : 0) : null;
    var lateDays = exam.day === null || estimatedEndDay === null ? null : Math.max(0, estimatedEndDay - (exam.day - 1));

    var session = null;
    for (var i = 0; i < calendar.length; i++) {
      if (calendar[i].minutes > 0 && calendar[i].dayNumber >= clock.day) { session = calendar[i]; break; }
    }

    var balance = null;
    var slackStudyDays = null;
    if (liveDeadline) {
      if (!fits) {
        balance = "behind";
      } else {
        var from = estimatedEndDay + 1;
        var to = exam.day - 1;
        slackStudyDays = countStudyDays(from, to, isStudyDay);
        balance = slackStudyDays >= 1 ? "ahead" : "onTrack";
      }
    }

    var status = "ok";
    var message;
    if (exam.day === null) {
      status = "sinFecha";
      message = "Sin fecha de examen no puedo decir si llegas. A " + budget + " min/día, el contenido termina el " +
        (estimatedEndDay === null ? "—" : dateLabel(estimatedEndDay)) + " (" +
        (estimatedEndDay === null ? 0 : countStudyDays(clock.day, estimatedEndDay, isStudyDay)) + " días de estudio).";
    } else if (exam.day < clock.day) {
      status = "fechaPasada";
      message = "La fecha de examen (" + dateLabel(exam.day) + ") ya pasó. No planifico hacia atrás: a " + budget +
        " min/día desde hoy, el contenido terminaría el " + (estimatedEndDay === null ? "—" : dateLabel(estimatedEndDay)) +
        ". No prometo llegar a una fecha que ya pasó.";
    } else if (balance === "behind") {
      if (capacityDays === 0) {
        message = "El examen es hoy (" + dateLabel(exam.day) + ") y no quedan días de estudio: las " +
          pending.length + " fichas pendientes (" + pendingMinutes + " min) quedan para después. No prometo que llegues.";
      } else if (estimatedEndDay === null) {
        message = "No alcanza: con " + budget + " min/día y " + capacityDays + " días de estudio antes del " +
          dateLabel(exam.day) + " no queda ningún día de estudio disponible. " +
          "No prometo que llegues: sube los minutos por día, habilita más días o recorta contenido.";
      } else {
        message = "No alcanza: con " + budget + " min/día y " + capacityDays + " días de estudio antes del " +
          dateLabel(exam.day) + ", quedan " + shortfallMinutes + " minutos (" + sheetsAfterDeadline +
          " ficha" + (sheetsAfterDeadline === 1 ? "" : "s") + ") para después del examen. " +
          "A este ritmo terminarías el " + dateLabel(estimatedEndDay) + ", " + lateDays +
          " día" + (lateDays === 1 ? "" : "s") + " después del último día de estudio. No prometo que llegues: sube los minutos por día, habilita más días o recorta contenido.";
      }
    } else if (balance === "ahead") {
      message = "Llegas con margen: terminas el " + dateLabel(estimatedEndDay) + " y te quedan " + slackStudyDays +
        " días de estudio antes del examen (" + spareMinutes + " minutos de capacidad sin usar).";
    } else if (balance === "onTrack") {
      message = "Llegas justo: terminas el " + dateLabel(estimatedEndDay) + ", sin días de estudio de sobra antes del examen.";
    } else {
      message = "Plan generado: terminas el " + (estimatedEndDay === null ? "—" : dateLabel(estimatedEndDay)) + ".";
    }
    if (packed.unscheduled.length) {
      message += " El calendario se cortó en el horizonte de " + calendarHorizon + " días: " +
        packed.unscheduled.length + " ficha" + (packed.unscheduled.length === 1 ? "" : "s") + " sin asignar, así que la fecha de fin es parcial.";
    }

    var areas = [];
    var areaMinutes = {};
    var scheduledMinutes = {};
    var scheduledSheets = {};
    ordered.forEach(function (sheet) {
      scheduledMinutes[sheet.areaId] = (scheduledMinutes[sheet.areaId] || 0) + sheet.minutes;
      scheduledSheets[sheet.areaId] = (scheduledSheets[sheet.areaId] || 0) + 1;
    });
    var pendingByArea = {};
    var pendingSheetsByArea = {};
    pending.forEach(function (sheet) {
      pendingByArea[sheet.areaId] = (pendingByArea[sheet.areaId] || 0) + sheet.minutes;
      pendingSheetsByArea[sheet.areaId] = (pendingSheetsByArea[sheet.areaId] || 0) + 1;
    });
    sortedKeys(pendingByArea).forEach(function (areaId) {
      var minutes = pendingByArea[areaId];
      areaMinutes[areaId] = minutes;
      areas.push({
        id: areaId,
        priority: areaPriority[areaId],
        pendingSheets: pendingSheetsByArea[areaId],
        pendingMinutes: minutes,
        pendingShare: pendingMinutes > 0 ? minutes / pendingMinutes : 0,
        scheduledSheets: scheduledSheets[areaId] || 0,
        scheduledMinutes: scheduledMinutes[areaId] || 0,
        scheduledShare: pendingMinutes > 0 ? (scheduledMinutes[areaId] || 0) / pendingMinutes : 0
      });
    });

    var nextSheet = null;
    if (session && session.sheets.length) {
      nextSheet = session.sheets[0];
    } else if (ordered.length) {
      nextSheet = publicSheet(ordered[0], areaPriority);
    }

    var response = emptyPlanResponse(status, clock, ctx);
    return merge(response, {
      ok: true,
      minutesPerDay: budget,
      daysPerWeek: daysInfo.value,
      studyWeekdays: daysInfo.weekdays.slice(),
      examDate: exam.day === null ? null : dayKey(exam.day),
      examDayNumber: exam.day,
      totals: totals,
      capacity: {
        studyDays: capacityDays,
        minutes: capacityMinutes,
        lastStudyDay: exam.day === null ? null : dayKey(exam.day - 1),
        gapMinutes: capacityMinutes === null ? null : capacityMinutes - pendingMinutes
      },
      balance: balance,
      fits: fits,
      estimatedEndDate: estimatedEndDay === null ? null : dayKey(estimatedEndDay),
      estimatedEndDayNumber: estimatedEndDay,
      lateDays: lateDays,
      shortfallMinutes: shortfallMinutes,
      minutesAfterDeadline: minutesAfterDeadline,
      sheetsAfterDeadline: exam.day === null ? null : sheetsAfterDeadline,
      spareMinutes: spareMinutes,
      slackStudyDays: slackStudyDays,
      truncated: packed.unscheduled.length > 0,
      calendar: calendar,
      days: calendar.length,
      session: session ? {
        date: session.date,
        dayNumber: session.dayNumber,
        isToday: session.dayNumber === clock.day,
        minutes: session.minutes,
        sheets: session.sheets
      } : null,
      nextSheet: nextSheet,
      unscheduled: packed.unscheduled,
      areas: areas,
      areaMinutes: areaMinutes,
      areaShare: (function () {
        var share = {};
        sortedKeys(areaMinutes).forEach(function (id) {
          share[id] = pendingMinutes > 0 ? areaMinutes[id] / pendingMinutes : 0;
        });
        return share;
      })(),
      coverage: coverageForSheets(read),
      message: message
    });
  }

  function coverageForSheets(read) {
    if (!read) return null;
    return {
      sheetsProvided: read.providedCount,
      sheetsValid: read.items.length,
      sheetsSkipped: read.skippedNoId + read.skippedInvalid,
      duplicates: read.duplicates,
      sheetsWithDeclaredMinutes: read.items.length - read.fallbackMinutes,
      sheetsWithFallbackMinutes: read.fallbackMinutes,
      sheetsWithoutArea: read.withoutArea,
      minutesComplete: read.fallbackMinutes === 0
    };
  }

  function merge(target, extra) {
    Object.keys(extra || {}).forEach(function (key) { target[key] = extra[key]; });
    return target;
  }

  /* ==========================================================================
     6. buildTodayRoute
     ========================================================================== */

  function routeFailure(status, message, ctx, draft, extra) {
    var response = {
      ok: false,
      version: VERSION,
      status: status,
      date: null,
      budgetMinutes: null,
      budgetDeclared: false,
      plannedMinutes: 0,
      remainingMinutes: null,
      overload: false,
      minimumBlock: false,
      items: [],
      counts: { repaso: 0, tarjetas: 0, duda: 0, ficha: 0 },
      deferred: { repaso: 0, tarjetas: 0, duda: 0, ficha: 0 },
      excluded: { repaso: 0, ficha: 0 },
      allCompleted: false,
      empty: true,
      plan: null,
      session: null,
      message: message,
      support: null,
      coverage: null,
      warnings: ctx ? ctx.warnings : [],
      assumptions: ctx ? ctx.assumptions : []
    };
    if (draft) Object.keys(draft).forEach(function (key) { response[key] = draft[key]; });
    if (extra) Object.keys(extra).forEach(function (key) { response[key] = extra[key]; });
    return response;
  }

  function resolveSheetIds(raw, sheetMap, ctx, field) {
    var out = [];
    if (!Array.isArray(raw)) return out;
    raw.forEach(function (value) {
      var id = typeof value === "string" ? value.trim() : (isObject(value) && typeof value.id === "string" ? value.id.trim() : "");
      if (!id) return;
      if (!sheetMap[id]) {
        ctx.warn("FICHA_DESCONOCIDA", "`" + field + "` menciona una ficha que no está en la lista: " + id + ".", { sheetId: id });
        return;
      }
      if (out.indexOf(id) === -1) out.push(id);
    });
    return out;
  }

  function itemAction(type, sheetId) {
    if (type === TYPES.REPASO) {
      return { kind: "repasar-ficha", label: "Repasar ficha", href: sheetId ? "#/ficha/" + sheetId : "#/repaso" };
    }
    if (type === TYPES.FICHA) {
      return { kind: "abrir-ficha", label: "Abrir ficha", href: sheetId ? "#/ficha/" + sheetId : null };
    }
    if (type === TYPES.DUDA) {
      return { kind: "abrir-dudas", label: "Abrir dudas", href: "#/dudas" };
    }
    return { kind: "repasar-tarjetas", label: "Repasar tarjetas", href: null };
  }

  function compareRouteItems(a, b) {
    if (a.priority !== b.priority) return b.priority - a.priority;
    if (ROUTE_RANK[a.type] !== ROUTE_RANK[b.type]) return ROUTE_RANK[a.type] - ROUTE_RANK[b.type];
    if (a.order !== b.order) return a.order - b.order;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  }

  function buildTodayRoute(input) {
    input = input === undefined || input === null ? {} : input;
    if (!isObject(input)) input = {};
    var ctx = newContext();
    var clock = readClock(input, ctx);
    if (!clock.ok) {
      return routeFailure("sinDatos",
        "Falta una fecha de referencia (`now`) válida. La ruta de hoy no se calcula con el reloj del sistema.",
        ctx);
    }

    var read = readSheetList(input.sheets, {
      defaultMinutes: input.defaultMinutes,
      categoryArea: input.categoryArea
    }, ctx);
    var sheetMap = {};
    read.items.forEach(function (sheet) { sheetMap[sheet.id] = sheet; });
    var pending = read.items.filter(function (sheet) { return !sheet.done; });
    var pendingMinutes = sumBy(pending, function (sheet) { return sheet.minutes; });

    var budgetInfo = readBudget(input, ctx);
    var draft = {
      date: clock.key,
      budgetMinutes: budgetInfo.value,
      budgetDeclared: budgetInfo.declared,
      coverage: coverageForSheets(read),
      counts: { repaso: 0, tarjetas: 0, duda: 0, ficha: 0 },
      deferred: { repaso: 0, tarjetas: 0, duda: 0, ficha: 0 },
      excluded: { repaso: 0, ficha: 0 },
      allCompleted: read.ok && read.items.length > 0 && pending.length === 0
    };

    if (budgetInfo.value === null) {
      return routeFailure("sinPresupuesto",
        "Falta el presupuesto de minutos para hoy. Sin ese dato no reparto la ruta: «0» y «sin configurar» no son lo mismo.",
        ctx, draft);
    }
    if (budgetInfo.value === 0) {
      return routeFailure("sinTiempo",
        "Hoy tienes 0 minutos declarados: la ruta queda vacía a propósito. No se pierde nada; el plan se recalcula mañana.",
        ctx, draft, { remainingMinutes: 0 });
    }
    /* Sin lista de fichas la ruta todavía puede mostrar tarjetas y dudas; los
       repasos de ficha no se pueden ubicar y se declaran excluidos. */
    var sheetsAvailable = read.ok;
    if (!sheetsAvailable) {
      ctx.warn("FICHAS_AUSENTES", "No recibo la lista de fichas: los repasos vencidos no se pueden ubicar en la ruta.");
    }

    var areaPriority = readAreaPriority(input, pending, ctx);
    var caps = {
      repaso: asNumber(input.maxReviewItems) !== null && input.maxReviewItems >= 0 ? Math.round(input.maxReviewItems) : ROUTE_CAPS.repaso,
      tarjetas: asNumber(input.maxCardsItems) !== null && input.maxCardsItems >= 0 ? Math.round(input.maxCardsItems) : ROUTE_CAPS.tarjetas,
      duda: asNumber(input.maxDoubtItems) !== null && input.maxDoubtItems >= 0 ? Math.round(input.maxDoubtItems) : ROUTE_CAPS.duda,
      ficha: asNumber(input.maxSheetItems) !== null && input.maxSheetItems >= 0 ? Math.round(input.maxSheetItems) : ROUTE_CAPS.ficha
    };

    var candidates = [];
    var counter = 0;

    /* 6.1 Repasos vencidos de ficha. */
    var reviews = Array.isArray(input.reviews) ? input.reviews : [];
    var dueReviews = [];
    var dueBySheet = {};
    var duplicateReviews = 0;
    var reviewExcluded = 0;
    reviews.forEach(function (review) {
      if (!isObject(review)) return;
      if (review.deleted === true) return;
      var sheetId = typeof review.sheetId === "string" ? review.sheetId.trim() : "";
      var dueInput = review.dueDate !== undefined && review.dueDate !== null ? review.dueDate : review.dueAt;
      var dueMoment = parseMoment(dueInput, clock.zoneOffsetMinutes);
      if (dueMoment === null) {
        reviewExcluded += 1;
        ctx.warn("REPASO_SIN_FECHA", "Un repaso no trae una fecha válida: no lo puedo ubicar en la ruta.", { sheetId: sheetId || null });
        return;
      }
      if (dueMoment.day > clock.day) return;
      var sheet = sheetMap[sheetId];
      if (!sheet) {
        reviewExcluded += 1;
        if (sheetsAvailable) {
          ctx.warn("REPASO_SIN_FICHA", "Un repaso apunta a una ficha que no está en la lista: " + (sheetId || "(sin id)") + ".", { sheetId: sheetId || null });
        }
        return;
      }
      var overdueDays = clock.day - dueMoment.day;
      var existing = dueBySheet[sheetId];
      if (existing) {
        duplicateReviews += 1;
        if (dueMoment.day < existing.dueDay) {
          existing.dueDay = dueMoment.day;
          existing.overdueDays = overdueDays;
          existing.review = review;
        }
        return;
      }
      var entry = { sheet: sheet, dueDay: dueMoment.day, overdueDays: overdueDays, review: review };
      dueBySheet[sheetId] = entry;
      dueReviews.push(entry);
    });
    if (duplicateReviews) {
      ctx.warn("REPASO_DUPLICADO",
        "Hay " + duplicateReviews + " repaso" + (duplicateReviews === 1 ? "" : "s") + " repetido" + (duplicateReviews === 1 ? "" : "s") +
        " para la misma ficha; uso el vencimiento más antiguo de cada una.", { count: duplicateReviews });
    }
    dueReviews.sort(function (a, b) {
      if (a.overdueDays !== b.overdueDays) return b.overdueDays - a.overdueDays;
      if (a.dueDay !== b.dueDay) return a.dueDay - b.dueDay;
      return a.sheet.id < b.sheet.id ? -1 : a.sheet.id > b.sheet.id ? 1 : 0;
    });
    draft.counts.repaso = dueReviews.length;
    draft.excluded.repaso = reviewExcluded;
    dueReviews.slice(0, caps.repaso).forEach(function (entry) {
      var minutes = Math.max(REVIEW_MINUTES_MIN, Math.round(entry.sheet.minutes * REVIEW_MINUTES_FACTOR));
      var areaWeight = areaPriority[entry.sheet.areaId] === undefined ? 1 : areaPriority[entry.sheet.areaId];
      var priority = ROUTE_WEIGHTS.repaso +
        Math.min(OVERDUE_BONUS_MAX, entry.overdueDays * OVERDUE_BONUS_PER_DAY) +
        Math.round(areaWeight * AREA_PRIORITY_BONUS);
      candidates.push({
        id: "repaso:" + entry.sheet.id,
        type: TYPES.REPASO,
        title: entry.sheet.title,
        sheetId: entry.sheet.id,
        areaId: entry.sheet.areaId,
        categoryId: entry.sheet.categoryId,
        minutes: minutes,
        minutesSource: "estimada",
        priority: priority,
        order: counter++,
        dueDate: dayKey(entry.dueDay),
        dueDayNumber: entry.dueDay,
        overdueDays: entry.overdueDays,
        count: null,
        isNext: false,
        reason: entry.overdueDays > 0
          ? "Repaso vencido el " + dateLabel(entry.dueDay) + " (hace " + entry.overdueDays + " día" + (entry.overdueDays === 1 ? "" : "s") + "). Releerla ahora cuesta poco y evita que se olvide."
          : "Repaso programado para hoy: la ficha ya tocaba repasarse.",
        action: itemAction(TYPES.REPASO, entry.sheet.id)
      });
    });

    /* 6.2 Tarjetas vencidas (conteo inyectado). */
    var cardsRaw = input.cardsDue !== undefined ? input.cardsDue : input.dueCards;
    var cardsCount = Array.isArray(cardsRaw) ? cardsRaw.length : asNumber(cardsRaw);
    if (cardsCount === null || cardsCount < 0) cardsCount = 0;
    cardsCount = Math.round(cardsCount);
    draft.counts.tarjetas = cardsCount;
    if (cardsCount > 0 && caps.tarjetas > 0) {
      var perCard = asNumber(input.minutesPerCard);
      if (perCard === null || perCard <= 0) perCard = MINUTES_PER_CARD;
      var cardMinutes = Math.max(1, Math.round(cardsCount * perCard));
      candidates.push({
        id: "tarjetas:hoy",
        type: TYPES.TARJETAS,
        title: cardsCount + " tarjeta" + (cardsCount === 1 ? "" : "s") + " vencida" + (cardsCount === 1 ? "" : "s"),
        sheetId: null,
        areaId: null,
        categoryId: null,
        minutes: cardMinutes,
        minutesSource: "estimada",
        priority: ROUTE_WEIGHTS.tarjetas + Math.min(CARDS_BONUS_MAX, Math.floor(cardsCount / CARDS_BONUS_DIVISOR)),
        order: counter++,
        dueDate: clock.key,
        dueDayNumber: clock.day,
        overdueDays: 0,
        count: cardsCount,
        isNext: false,
        reason: "Hay " + cardsCount + " tarjeta" + (cardsCount === 1 ? "" : "s") + " vencida" + (cardsCount === 1 ? "" : "s") +
          " en Study Flashcards: recuperación activa corta, " + cardMinutes + " min.",
        action: itemAction(TYPES.TARJETAS, null)
      });
    }

    /* 6.3 Dudas abiertas (más antiguas primero). */
    var doubts = Array.isArray(input.doubts) ? input.doubts : [];
    var openDoubts = [];
    doubts.forEach(function (doubt) {
      if (!isObject(doubt)) return;
      if (doubt.deleted === true) return;
      if (doubt.resolved === true || doubt.resolvedAt) return;
      var createdDay = clock.day;
      if (doubt.createdAt !== undefined) {
        var created = parseMoment(doubt.createdAt, clock.zoneOffsetMinutes);
        if (created !== null) createdDay = created.day;
      }
      openDoubts.push({ doubt: doubt, createdDay: createdDay });
    });
    draft.counts.duda = openDoubts.length;
    openDoubts.sort(function (a, b) {
      if (a.createdDay !== b.createdDay) return a.createdDay - b.createdDay;
      var aid = typeof a.doubt.id === "string" ? a.doubt.id : "";
      var bid = typeof b.doubt.id === "string" ? b.doubt.id : "";
      return aid < bid ? -1 : aid > bid ? 1 : 0;
    });
    openDoubts.slice(0, caps.duda).forEach(function (entry) {
      var doubt = entry.doubt;
      var ageDays = Math.max(0, clock.day - entry.createdDay);
      var sheetId = typeof doubt.sheetId === "string" ? doubt.sheetId : null;
      var text = typeof doubt.note === "string" && doubt.note ? doubt.note :
        (typeof doubt.quote === "string" && doubt.quote ? doubt.quote : "Duda abierta");
      var doubtAreaWeight = sheetId && sheetMap[sheetId] && areaPriority[sheetMap[sheetId].areaId] !== undefined
        ? areaPriority[sheetMap[sheetId].areaId] : 1;
      candidates.push({
        id: "duda:" + (typeof doubt.id === "string" ? doubt.id : "sin-id-" + counter),
        type: TYPES.DUDA,
        title: text,
        sheetId: sheetId,
        areaId: sheetId && sheetMap[sheetId] ? sheetMap[sheetId].areaId : null,
        categoryId: sheetId && sheetMap[sheetId] ? sheetMap[sheetId].categoryId : null,
        minutes: DOUBT_MINUTES,
        minutesSource: "estimada",
        priority: ROUTE_WEIGHTS.duda + Math.min(OVERDUE_BONUS_MAX, Math.floor(ageDays / 2)) +
          Math.round(doubtAreaWeight * AREA_PRIORITY_BONUS),
        order: counter++,
        dueDate: dayKey(entry.createdDay),
        dueDayNumber: entry.createdDay,
        overdueDays: ageDays,
        count: null,
        isNext: false,
        reason: ageDays > 0
          ? "Duda abierta el " + dateLabel(entry.createdDay) + " (hace " + ageDays + " día" + (ageDays === 1 ? "" : "s") + "). Resolverla desbloquea la lectura de esa ficha."
          : "Duda abierta hoy: resolverla antes de seguir evita arrastrarla.",
        action: itemAction(TYPES.DUDA, sheetId)
      });
    });

    /* 6.4 Fichas del plan (o la siguiente ficha, o el orden del temario). */
    var planInfo = null;
    var todaySheets = null;
    var sessionDate = null;
    var sessionMinutes = null;
    var sessionSheetIds = null;
    if (Array.isArray(input.todaySheets)) {
      todaySheets = resolveSheetIds(input.todaySheets, sheetMap, ctx, "todaySheets");
    } else if (isObject(input.plan) && Array.isArray(input.plan.sheets)) {
      todaySheets = resolveSheetIds(input.plan.sheets, sheetMap, ctx, "plan.sheets");
    }
    if (todaySheets === null && isObject(input.plan) &&
        (input.plan.examDate !== undefined || input.plan.minutesPerDay !== undefined || input.plan.daysPerWeek !== undefined)) {
      var built = buildPlan({
        now: input.now,
        zoneOffsetMinutes: clock.zoneOffsetMinutes,
        examDate: input.plan.examDate,
        minutesPerDay: input.plan.minutesPerDay,
        daysPerWeek: input.plan.daysPerWeek,
        sheets: input.sheets,
        areaPriority: input.areaPriority,
        holidays: input.holidays,
        categoryArea: input.categoryArea,
        defaultMinutes: input.defaultMinutes,
        studyDays: input.studyDays
      });
      planInfo = {
        status: built.status,
        balance: built.balance,
        examDate: built.examDate,
        estimatedEndDate: built.estimatedEndDate,
        shortfallMinutes: built.shortfallMinutes,
        lateDays: built.lateDays
      };
      if (built.session && built.session.sheets.length) {
        todaySheets = built.session.sheets.map(function (sheet) { return sheet.id; });
        sessionDate = built.session.date;
        sessionMinutes = built.session.minutes;
        sessionSheetIds = todaySheets.slice();
      } else {
        todaySheets = [];
      }
      ctx.warnings = ctx.warnings.concat(built.warnings || []);
      ctx.assumptions = ctx.assumptions.concat(built.assumptions || []);
    }
    var nextSheetId = typeof input.nextSheetId === "string" ? input.nextSheetId.trim() : "";
    var usedPlanOrder = todaySheets !== null;
    if (!usedPlanOrder) {
      if (nextSheetId && sheetMap[nextSheetId]) {
        todaySheets = [nextSheetId].concat(pending.filter(function (sheet) {
          return sheet.id !== nextSheetId;
        }).slice(0, Math.max(0, caps.ficha - 1)).map(function (sheet) { return sheet.id; }));
      } else {
        if (nextSheetId) ctx.warn("FICHA_DESCONOCIDA", "`nextSheetId` no está en la lista de fichas: " + nextSheetId + ".", { sheetId: nextSheetId });
        todaySheets = pending.slice(0, caps.ficha).map(function (sheet) { return sheet.id; });
      }
    }

    var sheetCandidates = [];
    var reviewSheetIds = {};
    dueReviews.forEach(function (entry) { reviewSheetIds[entry.sheet.id] = true; });
    todaySheets.forEach(function (id) {
      var sheet = sheetMap[id];
      if (!sheet) return;
      if (sheet.done) {
        ctx.warn("FICHA_COMPLETADA", "La ficha «" + sheet.id + "» figura completada; no la incluyo en la ruta.", { sheetId: sheet.id });
        return;
      }
      if (reviewSheetIds[sheet.id]) {
        /* La misma ficha ya entra como repaso vencido: no se repite como
           lectura nueva en el mismo día. */
        return;
      }
      var isNext = !usedPlanOrder && id === nextSheetId;
      var sheetAreaWeight = areaPriority[sheet.areaId] === undefined ? 1 : areaPriority[sheet.areaId];
      var priority = ROUTE_WEIGHTS.ficha +
        (isNext ? NEXT_SHEET_BONUS : 0) +
        Math.round(sheetAreaWeight * AREA_PRIORITY_BONUS);
      var reason;
      if (usedPlanOrder) {
        reason = sessionDate && sessionDate !== clock.key
          ? "Tu plan asigna esta ficha a la sesión del " + dateLabel(parseDayKey(sessionDate)) + " (hoy es descanso)."
          : "Ficha asignada a la sesión de hoy en tu plan.";
      } else if (!read.items.length) {
        reason = "Ficha pendiente, en el orden del temario.";
      } else if (isNext) {
        reason = "Es la siguiente ficha del plan: continúa donde quedaste.";
      } else {
        reason = "Ficha pendiente en el orden del temario; entra si sobra tiempo hoy.";
      }
      sheetCandidates.push({
        id: "ficha:" + sheet.id,
        type: TYPES.FICHA,
        title: sheet.title,
        sheetId: sheet.id,
        areaId: sheet.areaId,
        categoryId: sheet.categoryId,
        minutes: sheet.minutes,
        minutesSource: sheet.minutesEstimated ? "porDefecto" : "declarada",
        priority: priority,
        order: counter++,
        dueDate: clock.key,
        dueDayNumber: clock.day,
        overdueDays: 0,
        count: null,
        isNext: isNext,
        reason: reason,
        action: itemAction(TYPES.FICHA, sheet.id)
      });
    });
    sheetCandidates.slice(0, caps.ficha).forEach(function (item) { candidates.push(item); });
    draft.counts.ficha = pending.length;

    /* 6.5 Orden y presupuesto. */
    var universe = {
      repaso: dueReviews.length,
      tarjetas: cardsCount > 0 ? 1 : 0,
      duda: openDoubts.length,
      ficha: sheetCandidates.length
    };
    candidates.sort(compareRouteItems);
    var selected = [];
    var used = 0;
    var selectedByType = { repaso: 0, tarjetas: 0, duda: 0, ficha: 0 };
    candidates.forEach(function (item) {
      if (used + item.minutes <= budgetInfo.value) {
        selected.push(item);
        selectedByType[item.type] += 1;
        used += item.minutes;
      }
    });
    var minimumBlock = false;
    if (!selected.length && candidates.length) {
      /* Bloque mínimo justificado: si nada cabe en el presupuesto, propongo el
         ítem más corto para no dejar el día en cero y declaro el exceso. */
      var fallbackItem = null;
      candidates.forEach(function (item) {
        if (!fallbackItem || item.minutes < fallbackItem.minutes) fallbackItem = item;
      });
      if (fallbackItem) {
        selected.push(fallbackItem);
        selectedByType[fallbackItem.type] += 1;
        used = fallbackItem.minutes;
        minimumBlock = true;
      }
    }
    if (minimumBlock) {
      selected.forEach(function (item) {
        if (item.minutes > budgetInfo.value) {
          item.minimumBlock = true;
          item.overBudgetMinutes = item.minutes - budgetInfo.value;
        }
      });
    }
    ["repaso", "tarjetas", "duda", "ficha"].forEach(function (type) {
      draft.deferred[type] = Math.max(0, universe[type] - selectedByType[type]);
    });

    var plannedMinutes = used;
    var remainingMinutes = budgetInfo.value - plannedMinutes;
    var overload = plannedMinutes > budgetInfo.value;

    var status;
    var message;
    if (!selected.length) {
      var nothingPending = read.ok && read.items.length > 0 && pending.length === 0 &&
        draft.counts.repaso === 0 && draft.counts.duda === 0 && draft.counts.tarjetas === 0;
      if (nothingPending) {
        status = "todoCompletado";
        message = "Todo el contenido está completado y no hay repasos, dudas ni tarjetas pendientes. Día libre.";
      } else if (!read.ok) {
        status = "sinDatos";
        message = "No recibo la lista de fichas ni repasos, dudas o tarjetas vencidas: no puedo armar la ruta de hoy.";
      } else if (pending.length === 0 && draft.counts.repaso === 0 && draft.counts.duda === 0 && draft.counts.tarjetas === 0) {
        status = "sinDatos";
        message = "No recibo fichas ni señales de repaso: no puedo armar la ruta de hoy.";
      } else {
        status = "vacia";
        message = "No hay bloques que quepan en el presupuesto de hoy.";
      }
    } else {
      status = "lista";
      message = "Ruta de hoy: " + plannedMinutes + " de " + budgetInfo.value + " minutos en " +
        selected.length + " bloque" + (selected.length === 1 ? "" : "s") + ".";
      if (sessionDate && sessionDate !== clock.key) {
        message += " Hoy es día de descanso en tu plan; esta es la próxima sesión (" + dateLabel(parseDayKey(sessionDate)) + ").";
      }
      if (overload) {
        message += " El bloque mínimo se pasa " + (plannedMinutes - budgetInfo.value) + " min del presupuesto: es el único que cabe.";
      }
    }

    var supportParts = [];
    var smallestDeferred = null;
    candidates.forEach(function (item) {
      if (selected.indexOf(item) !== -1) return;
      if (smallestDeferred === null || item.minutes < smallestDeferred.minutes) smallestDeferred = item;
    });
    if (planInfo && planInfo.balance === "behind") {
      supportParts.push("Tu plan no cabe antes del examen. No hay que recuperarlo todo hoy: el plan se recalcula con lo que completes, no con lo que deberías haber hecho.");
    }
    if (draft.deferred.repaso > 0) {
      supportParts.push("Quedan " + draft.deferred.repaso + " repaso" + (draft.deferred.repaso === 1 ? "" : "s") +
        " vencido" + (draft.deferred.repaso === 1 ? "" : "s") + " para los próximos días: no hace falta hacerlos todos hoy.");
    }
    if (draft.deferred.duda > 0) {
      supportParts.push("Quedan " + draft.deferred.duda + " duda" + (draft.deferred.duda === 1 ? "" : "s") + " abierta" + (draft.deferred.duda === 1 ? "" : "s") + " para otra sesión.");
    }
    if (!overload && remainingMinutes >= 3 && smallestDeferred && smallestDeferred.minutes > remainingMinutes) {
      supportParts.push("Sobran " + remainingMinutes + " minuto" + (remainingMinutes === 1 ? "" : "s") +
        ": el siguiente bloque dura " + smallestDeferred.minutes + " y no entra completo. Puedes usarlos en repaso libre o dejarlos.");
    }
    if (minimumBlock && selected.length) {
      supportParts.push("Ese bloque dura más que tu presupuesto; empieza por él y, si no llegas, retómalo mañana sin culpa.");
    }

    return merge(routeFailure(status, message, ctx, draft), {
      ok: status === "lista" || status === "todoCompletado",
      budgetMinutes: budgetInfo.value,
      budgetDeclared: budgetInfo.declared,
      plannedMinutes: plannedMinutes,
      remainingMinutes: remainingMinutes,
      overload: overload,
      minimumBlock: minimumBlock,
      items: selected,
      counts: {
        repaso: draft.counts.repaso,
        tarjetas: draft.counts.tarjetas,
        duda: draft.counts.duda,
        ficha: pending.length
      },
      deferred: draft.deferred,
      excluded: draft.excluded,
      allCompleted: draft.allCompleted,
      empty: selected.length === 0,
      plan: planInfo,
      session: sessionDate ? {
        date: sessionDate,
        isToday: sessionDate === clock.key,
        minutes: sessionMinutes,
        sheets: sessionSheetIds || []
      } : null,
      nextSheetId: nextSheetId || (todaySheets && todaySheets.length ? todaySheets[0] : null),
      nextBlockMinutes: smallestDeferred ? smallestDeferred.minutes : null,
      support: supportParts.length ? supportParts.join(" ") : null,
      coverage: coverageForSheets(read)
    });
  }

  /* ==========================================================================
     7. masteryFor
     ========================================================================== */

  function readReading(states, ctx) {
    if (!isObject(states) || states.sheets === undefined) {
      return { present: false, has: function () { return false; }, score: function () { return 0; } };
    }
    if (!isObject(states.sheets) && !Array.isArray(states.sheets)) {
      ctx.warn("LECTURA_INVALIDA", "`states.sheets` no tiene la forma esperada; la señal de lectura queda ausente.");
      return { present: false, has: function () { return false; }, score: function () { return 0; } };
    }
    var map = {};
    if (Array.isArray(states.sheets)) {
      states.sheets.forEach(function (entry) {
        if (isObject(entry) && typeof entry.id === "string") map[entry.id] = entry;
      });
    } else {
      map = states.sheets;
    }
    return {
      present: true,
      has: function (id) { return !!map[id]; },
      score: function (id) {
        var entry = map[id];
        if (!entry) return 0;
        if (entry.completedAt) return 1;
        if (entry.viewedAt || (asNumber(entry.readSeconds) || 0) > 0) return VIEWED_CREDIT;
        return 0;
      }
    };
  }

  function readConfidence(states, ctx) {
    if (!isObject(states) || states.confidence === undefined) {
      return { present: false, map: {} };
    }
    var map = {};
    function accept(record) {
      if (!isObject(record)) return;
      if (record.deleted === true) return;
      var id = typeof record.sheetId === "string" ? record.sheetId : (typeof record.id === "string" ? record.id : "");
      if (!id) return;
      var value = typeof record.value === "string" ? record.value : record;
      if (typeof value !== "string") return;
      if (CONFIDENCE_IDS.indexOf(value) === -1) {
        ctx.warn("CONFIANZA_INVALIDA", "Valor de confianza no reconocido para «" + id + "»; se ignora.", { sheetId: id, value: value });
        return;
      }
      map[id] = value;
    }
    if (Array.isArray(states.confidence)) {
      states.confidence.forEach(accept);
    } else if (isObject(states.confidence)) {
      sortedKeys(states.confidence).forEach(function (id) {
        var record = states.confidence[id];
        if (typeof record === "string") {
          if (CONFIDENCE_IDS.indexOf(record) === -1) {
            ctx.warn("CONFIANZA_INVALIDA", "Valor de confianza no reconocido para «" + id + "»; se ignora.", { sheetId: id, value: record });
            return;
          }
          map[id] = record;
          return;
        }
        if (isObject(record)) {
          var copy = { sheetId: id, value: record.value, deleted: record.deleted };
          accept(copy);
        }
      });
    }
    return { present: true, map: map };
  }

  function readCards(states, input, sheetIds, ctx) {
    if (!isObject(states) || states.cards === undefined) {
      return { present: false, bySheet: {}, ignored: 0 };
    }
    var cardSheet = isObject(input.cardSheet) ? input.cardSheet : (isObject(input.cardSheets) ? input.cardSheets : {});
    var map = {};
    var ignored = 0;
    function add(cardId, entry, sheetIdHint) {
      if (!isObject(entry)) return;
      var sheetId = cardSheet[cardId] || sheetIdHint || entry.sheetId || cardId;
      if (!sheetIds[sheetId]) {
        ignored += 1;
        return;
      }
      var target = map[sheetId] || (map[sheetId] = { reviews: 0, correct: 0, wrong: 0 });
      target.reviews += asNumber(entry.reviews) || 0;
      target.correct += asNumber(entry.correct) || 0;
      target.wrong += asNumber(entry.wrong) || 0;
    }
    if (Array.isArray(states.cards)) {
      states.cards.forEach(function (entry) {
        if (!isObject(entry)) return;
        var id = typeof entry.id === "string" ? entry.id : "";
        add(id, entry.state || entry, typeof entry.sheetId === "string" ? entry.sheetId : null);
      });
    } else if (isObject(states.cards)) {
      sortedKeys(states.cards).forEach(function (cardId) { add(cardId, states.cards[cardId]); });
    }
    if (ignored) {
      ctx.warn("TARJETAS_SIN_FICHA", ignored + " estados de tarjeta no se pueden asociar a una ficha; se ignoran.", { count: ignored });
    }
    return { present: true, bySheet: map, ignored: ignored };
  }

  function readErrors(states, clock, windowDaysRaw, ctx) {
    var windowDays = asNumber(windowDaysRaw);
    if (windowDays === null || windowDays <= 0) windowDays = ERROR_WINDOW_DAYS;
    windowDays = Math.round(windowDays);
    if (!isObject(states) || (states.errors === undefined && states.recall === undefined)) {
      return { present: false, counts: {}, windowDays: windowDays, skippedNoDate: 0, withoutSheet: 0, outsideWindow: 0 };
    }
    var counts = {};
    var skippedNoDate = 0;
    var withoutSheet = 0;
    var outsideWindow = 0;
    var minDay = clock.day - windowDays;

    function addCount(sheetId, amount) {
      if (!sheetId) { withoutSheet += 1; return; }
      counts[sheetId] = (counts[sheetId] || 0) + amount;
    }
    function inWindow(moment) {
      if (moment === null) { skippedNoDate += 1; return false; }
      if (moment.day < minDay || moment.day > clock.day) { outsideWindow += 1; return false; }
      return true;
    }

    if (Array.isArray(states.errors)) {
      states.errors.forEach(function (entry) {
        if (!isObject(entry) || entry.deleted === true) return;
        var sheetId = typeof entry.sheetId === "string" ? entry.sheetId : "";
        var moment = parseMoment(entry.at !== undefined ? entry.at : entry.createdAt, clock.zoneOffsetMinutes);
        if (!inWindow(moment)) return;
        var amount = asNumber(entry.count);
        addCount(sheetId, amount !== null && amount > 0 ? amount : 1);
      });
    } else if (isObject(states.errors)) {
      sortedKeys(states.errors).forEach(function (sheetId) {
        var value = asNumber(states.errors[sheetId]);
        if (value !== null && value > 0) addCount(sheetId, value);
      });
    }

    if (Array.isArray(states.recall)) {
      states.recall.forEach(function (entry) {
        if (!isObject(entry) || entry.deleted === true) return;
        if (entry.rating !== "again") return;
        var sheetId = typeof entry.sheetId === "string" ? entry.sheetId : "";
        var moment = parseMoment(entry.at !== undefined ? entry.at : entry.createdAt, clock.zoneOffsetMinutes);
        if (!inWindow(moment)) return;
        addCount(sheetId, 1);
      });
    }

    if (skippedNoDate) {
      ctx.warn("ERRORES_SIN_FECHA", skippedNoDate + " errores no traen fecha: no se pueden considerar recientes y no cuentan.", { count: skippedNoDate });
    }
    if (withoutSheet) {
      ctx.warn("ERRORES_SIN_FICHA", withoutSheet + " errores no traen ficha: no cuentan para el dominio.", { count: withoutSheet });
    }
    return { present: true, counts: counts, windowDays: windowDays, skippedNoDate: skippedNoDate, withoutSheet: withoutSheet, outsideWindow: outsideWindow };
  }

  function bandFor(score, coverage) {
    if (score === null) return "sinDatos";
    if (score < BAND_THRESHOLDS.fragil) return "fragil";
    if (score >= BAND_THRESHOLDS.enProgreso) {
      return coverage >= MIN_COVERAGE_FOR_SOLIDO ? "solido" : "enProgreso";
    }
    return "enProgreso";
  }

  function emptySignal(present, value, weight, used) {
    return {
      present: !!present,
      value: present ? value : null,
      weight: weight,
      sheetsUsed: present ? used : 0
    };
  }

  function masteryFor(input) {
    input = input === undefined || input === null ? {} : input;
    if (!isObject(input)) input = {};
    var ctx = newContext();
    var clock = readClock(input, ctx);
    var base = {
      ok: false,
      version: VERSION,
      status: "sinDatos",
      now: clock.ok ? clockOut(clock) : null,
      categories: [],
      areas: [],
      global: null,
      weakest: null,
      weakestArea: null,
      coverage: 0,
      sheetCoverage: 0,
      missing: SIGNAL_IDS.slice(),
      warnings: ctx.warnings,
      assumptions: ctx.assumptions
    };
    if (!clock.ok) return base;
    var raw = Array.isArray(input.sheets) ? input.sheets : null;
    if (raw === null) {
      ctx.warn("FICHAS_AUSENTES", "No recibo la lista de fichas: el dominio no se puede calcular.");
      return base;
    }
    var read = readSheetList(raw, { defaultMinutes: MINUTES_DEFAULT, categoryArea: input.categoryArea }, ctx);
    var sheetIds = {};
    read.items.forEach(function (sheet) { sheetIds[sheet.id] = true; });

    if (!read.items.length) {
      ctx.warn("FICHAS_AUSENTES", "La lista de fichas está vacía: el dominio no se puede calcular.");
      return merge(base, { coverage: 0, sheetCoverage: 0 });
    }

    var states = isObject(input.states) ? input.states : {};
    var reading = readReading(states, ctx);
    var confidence = readConfidence(states, ctx);
    var cards = readCards(states, input, sheetIds, ctx);
    var errors = readErrors(states, clock, input.errorWindowDays, ctx);

    var catMeta = {};
    if (Array.isArray(input.categories)) {
      input.categories.forEach(function (entry) {
        if (!isObject(entry) || typeof entry.id !== "string") return;
        catMeta[entry.id] = {
          title: typeof entry.title === "string" ? entry.title : (typeof entry.label === "string" ? entry.label : null),
          areaId: typeof entry.areaId === "string" ? entry.areaId : null
        };
      });
    }

    var buckets = {};
    var bucketOrder = [];
    read.items.forEach(function (sheet) {
      var catId = sheet.categoryId || UNASSIGNED_CATEGORY;
      if (!sheet.categoryId) {
        ctx.warn("FICHA_SIN_CATEGORIA", "Fichas sin categoría se agrupan en «" + UNASSIGNED_CATEGORY + "» y no entran al mapa por categoría.", { sheetId: sheet.id });
      }
      var bucket = buckets[catId];
      if (!bucket) {
        bucket = buckets[catId] = { id: catId, sheets: [], minutes: 0, areaId: null };
        bucketOrder.push(catId);
      }
      bucket.sheets.push(sheet);
      bucket.minutes += sheet.minutes;
      var areaId = sheet.areaId;
      if (catMeta[catId] && catMeta[catId].areaId) areaId = catMeta[catId].areaId;
      if (bucket.areaId === null) bucket.areaId = areaId;
    });
    if (read.withoutArea) {
      ctx.warn("FICHAS_SIN_AREA", read.withoutArea + " fichas sin área se agrupan en «" + UNASSIGNED_AREA + "».", { count: read.withoutArea });
    }
    Object.keys(catMeta).forEach(function (id) {
      if (buckets[id]) return;
      buckets[id] = { id: id, sheets: [], minutes: 0, areaId: catMeta[id].areaId };
      bucketOrder.push(id);
    });

    var categories = [];
    bucketOrder.slice().sort(function (a, b) {
      var areaA = buckets[a].areaId || "";
      var areaB = buckets[b].areaId || "";
      if (areaA !== areaB) return areaA < areaB ? -1 : 1;
      return a < b ? -1 : a > b ? 1 : 0;
    }).forEach(function (catId) {
      var bucket = buckets[catId];
      var total = bucket.sheets.length;
      var withAnySignal = 0;
      var withReading = 0;
      var withConfidence = 0;
      var withCards = 0;
      var reviewed = 0;
      var correct = 0;
      var wrong = 0;
      var sumReading = 0;
      var sumConfidence = 0;
      var readingUsed = 0;
      var confidenceUsed = 0;
      var reviewedSheets = 0;
      var sumErrors = 0;
      var errorSheets = 0;

      bucket.sheets.forEach(function (sheet) {
        var hasReading = reading.has(sheet.id);
        var confidenceValue = confidence.map[sheet.id] || null;
        var cardStats = cards.bySheet[sheet.id] || null;
        var hasCards = !!(cardStats && cardStats.reviews > 0);
        var errorCount = errors.counts[sheet.id] || 0;
        if (hasReading || confidenceValue || hasCards || errorCount > 0) withAnySignal += 1;
        if (hasReading) withReading += 1;
        if (reading.present) {
          sumReading += reading.score(sheet.id);
          readingUsed += 1;
        }
        if (confidenceValue) {
          withConfidence += 1;
          sumConfidence += CONFIDENCE_VALUE[confidenceValue];
          confidenceUsed += 1;
        }
        if (cardStats) {
          withCards += 1;
          correct += cardStats.correct;
          wrong += cardStats.wrong;
          if (hasCards) {
            reviewed += 1;
            reviewedSheets += 1;
          }
        }
        if (hasCards) {
          sumErrors += Math.max(0, 1 - errorCount / ERRORS_FOR_ZERO);
          errorSheets += 1;
        }
      });

      var lectura = null;
      if (reading.present && total > 0) lectura = sumReading / readingUsed;
      var confianza = confidenceUsed > 0 ? sumConfidence / confidenceUsed : null;
      var tarjetas = null;
      var accuracy = null;
      if (cards.present && reviewedSheets > 0) {
        var volume = reviewedSheets / total;
        accuracy = correct + wrong > 0 ? correct / (correct + wrong) : null;
        tarjetas = accuracy === null ? volume : CARD_ACCURACY_WEIGHT * accuracy + CARD_VOLUME_WEIGHT * volume;
      }
      var errores = null;
      if (errors.present && errorSheets > 0) errores = sumErrors / errorSheets;

      var signals = {
        lectura: emptySignal(lectura !== null, lectura, SIGNAL_WEIGHTS.lectura, readingUsed),
        confianza: emptySignal(confianza !== null, confianza, SIGNAL_WEIGHTS.confianza, confidenceUsed),
        tarjetas: emptySignal(tarjetas !== null, tarjetas, SIGNAL_WEIGHTS.tarjetas, reviewedSheets),
        errores: emptySignal(errores !== null, errores, SIGNAL_WEIGHTS.errores, errorSheets)
      };
      var weightSum = 0;
      var valueSum = 0;
      var missing = [];
      SIGNAL_IDS.forEach(function (id) {
        var signal = signals[id];
        if (signal.present) {
          weightSum += signal.weight;
          valueSum += signal.weight * signal.value;
        } else {
          missing.push(id);
        }
      });
      var score = weightSum > 0 ? Math.round((valueSum / weightSum) * 100) : null;
      var coverage = weightSum;
      var sheetCoverage = total > 0 ? withAnySignal / total : 0;

      categories.push({
        id: catId,
        label: catMeta[catId] ? catMeta[catId].title : null,
        areaId: bucket.areaId,
        minutes: bucket.minutes,
        sheets: {
          total: total,
          withAnySignal: withAnySignal,
          withReading: withReading,
          withConfidence: withConfidence,
          withCards: withCards,
          reviewed: reviewedSheets
        },
        accuracy: accuracy === null ? null : Math.round(accuracy * 100),
        score: score,
        band: bandFor(score, coverage),
        coverage: coverage,
        sheetCoverage: sheetCoverage,
        signals: signals,
        missing: missing
      });
    });

    var areaBuckets = {};
    var areaOrder = [];
    categories.forEach(function (category) {
      var areaId = category.areaId || UNASSIGNED_AREA;
      var bucket = areaBuckets[areaId];
      if (!bucket) {
        bucket = areaBuckets[areaId] = { id: areaId, categories: [], minutes: 0, sheets: 0, scoreWeight: 0, scoreSum: 0, coverageWeight: 0, coverageSum: 0, sheetTotal: 0, sheetWithSignal: 0, missingAll: SIGNAL_IDS.slice() };
        areaOrder.push(areaId);
      }
      bucket.categories.push(category.id);
      bucket.minutes += category.minutes;
      bucket.sheets += category.sheets.total;
      bucket.sheetTotal += category.sheets.total;
      bucket.sheetWithSignal += category.sheets.withAnySignal;
      if (category.score !== null) {
        var weight = category.minutes > 0 ? category.minutes : 1;
        bucket.scoreWeight += weight;
        bucket.scoreSum += weight * category.score;
        bucket.coverageWeight += weight;
        bucket.coverageSum += weight * category.coverage;
        bucket.missingAll = bucket.missingAll.filter(function (id) { return category.missing.indexOf(id) !== -1; });
      }
    });

    var areas = areaOrder.map(function (areaId) {
      var bucket = areaBuckets[areaId];
      var score = bucket.scoreWeight > 0 ? Math.round(bucket.scoreSum / bucket.scoreWeight) : null;
      var coverage = bucket.coverageWeight > 0 ? bucket.coverageSum / bucket.coverageWeight : 0;
      return {
        id: areaId,
        categories: bucket.categories.slice().sort(),
        minutes: bucket.minutes,
        sheets: bucket.sheets,
        sheetsWithSignal: bucket.sheetWithSignal,
        score: score,
        band: bandFor(score, coverage),
        coverage: coverage,
        sheetCoverage: bucket.sheetTotal > 0 ? bucket.sheetWithSignal / bucket.sheetTotal : 0,
        missing: score === null ? SIGNAL_IDS.slice() : bucket.missingAll
      };
    }).sort(function (a, b) { return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; });

    var globalWeight = 0;
    var globalSum = 0;
    var globalCoverageWeight = 0;
    var globalCoverageSum = 0;
    var globalSheets = 0;
    var globalSheetsWithSignal = 0;
    var globalMissing = SIGNAL_IDS.slice();
    areas.forEach(function (area) {
      globalSheets += area.sheets;
      globalSheetsWithSignal += area.sheetsWithSignal;
      if (area.score === null) return;
      var weight = area.minutes > 0 ? area.minutes : 1;
      globalWeight += weight;
      globalSum += weight * area.score;
      globalCoverageWeight += weight;
      globalCoverageSum += weight * area.coverage;
      globalMissing = globalMissing.filter(function (id) { return area.missing.indexOf(id) !== -1; });
    });
    var globalScore = globalWeight > 0 ? Math.round(globalSum / globalWeight) : null;
    var globalCoverage = globalCoverageWeight > 0 ? globalCoverageSum / globalCoverageWeight : 0;
    /* Presencia de cada señal medida en minutos del temario: dice qué parte del
       contenido tiene ese dato, aunque el puntaje se calcule con lo disponible. */
    var signalPresence = {};
    SIGNAL_IDS.forEach(function (id) { signalPresence[id] = 0; });
    var presenceWeight = 0;
    categories.forEach(function (category) {
      var weight = category.minutes > 0 ? category.minutes : 1;
      presenceWeight += weight;
      SIGNAL_IDS.forEach(function (id) {
        if (category.signals[id].present) signalPresence[id] += weight;
      });
    });
    SIGNAL_IDS.forEach(function (id) {
      signalPresence[id] = presenceWeight > 0 ? signalPresence[id] / presenceWeight : 0;
    });
    var global = {
      score: globalScore,
      band: bandFor(globalScore, globalCoverage),
      coverage: globalCoverage,
      sheetCoverage: globalSheets > 0 ? globalSheetsWithSignal / globalSheets : 0,
      signals: signalPresence,
      minutes: sumBy(areas, function (area) { return area.minutes; }),
      sheets: globalSheets,
      missing: globalScore === null ? SIGNAL_IDS.slice() : globalMissing
    };

    function weakestOf(list) {
      var best = null;
      list.forEach(function (entry) {
        if (entry.score === null) return;
        if (entry.coverage < WEAK_MIN_COVERAGE) return;
        if (!best) { best = entry; return; }
        if (entry.score < best.score) { best = entry; return; }
        if (entry.score === best.score) {
          if (entry.minutes > best.minutes) best = entry;
          else if (entry.minutes === best.minutes && entry.id < best.id) best = entry;
        }
      });
      return best;
    }
    var weakestCategory = weakestOf(categories);
    var weakestArea = weakestOf(areas);

    return merge(base, {
      ok: globalScore !== null,
      status: globalScore !== null ? "ok" : "sinDatos",
      categories: categories,
      areas: areas,
      global: global,
      weakest: weakestCategory ? { scope: "categoria", id: weakestCategory.id, label: weakestCategory.label, score: weakestCategory.score, band: weakestCategory.band, coverage: weakestCategory.coverage } : null,
      weakestArea: weakestArea ? { scope: "area", id: weakestArea.id, score: weakestArea.score, band: weakestArea.band, coverage: weakestArea.coverage } : null,
      coverage: globalCoverage,
      sheetCoverage: global.sheetCoverage,
      missing: globalScore === null ? SIGNAL_IDS.slice() : globalMissing
    });
  }

  /* ==========================================================================
     8. nextSheetReview
     ========================================================================== */

  function nextSheetReview(input) {
    input = input === undefined || input === null ? {} : input;
    if (!isObject(input)) input = {};
    var ctx = newContext();
    var clock = readClock(input, ctx);
    if (!clock.ok) {
      return {
        ok: false,
        version: VERSION,
        status: "sinDatos",
        sheetId: typeof input.sheetId === "string" ? input.sheetId : null,
        dueDate: null,
        dueAt: null,
        intervalDays: null,
        ladderIndex: null,
        confidence: null,
        confidenceSource: "ausente",
        isFirst: null,
        overdue: false,
        overdueDays: 0,
        source: "confidence",
        reason: "Falta una fecha de referencia (`now`) válida: no puedo programar el repaso.",
        warnings: ctx.warnings,
        assumptions: ctx.assumptions
      };
    }

    var confidence = typeof input.confidence === "string" ? input.confidence : null;
    if (confidence !== null && CONFIDENCE_IDS.indexOf(confidence) === -1) {
      ctx.warn("CONFIANZA_INVALIDA", "Confianza no reconocida («" + confidence + "»); programo sin confianza declarada.", { value: confidence });
      confidence = null;
    }
    var reviewCount = asNumber(input.reviewCount);
    if (reviewCount === null || reviewCount < 0) reviewCount = 0;
    reviewCount = Math.round(reviewCount);
    var lapses = asNumber(input.lapses);
    if (lapses === null || lapses < 0) lapses = 0;
    lapses = Math.round(lapses);
    var previousInterval = asNumber(input.previousIntervalDays);
    if (previousInterval !== null) previousInterval = Math.round(previousInterval);

    var lastReviewedDay = null;
    var lastReviewedKey = null;
    if (input.lastReviewedAt !== undefined && input.lastReviewedAt !== null) {
      var last = parseMoment(input.lastReviewedAt, clock.zoneOffsetMinutes);
      if (last === null) {
        ctx.warn("ULTIMO_REPASO_INVALIDO", "`lastReviewedAt` no es una fecha válida; cuento el repaso desde hoy.", { value: input.lastReviewedAt });
      } else {
        lastReviewedDay = last.day;
        lastReviewedKey = dayKey(last.day);
      }
    }
    var overdueDays = 0;
    var dueDay = null;
    if (input.dueDate !== undefined && input.dueDate !== null) {
      var due = parseMoment(input.dueDate, clock.zoneOffsetMinutes);
      if (due === null) {
        ctx.warn("REPASO_SIN_FECHA", "`dueDate` no es una fecha válida; no puedo medir el atraso.");
      } else {
        dueDay = due.day;
        if (due.day < clock.day) overdueDays = clock.day - due.day;
      }
    } else if (input.dueAt !== undefined && input.dueAt !== null) {
      var dueIso = parseMoment(input.dueAt, clock.zoneOffsetMinutes);
      if (dueIso === null) {
        ctx.warn("REPASO_SIN_FECHA", "`dueAt` no es una fecha válida; no puedo medir el atraso.");
      } else {
        dueDay = dueIso.day;
        if (dueIso.day < clock.day) overdueDays = clock.day - dueIso.day;
      }
    }

    var anchorDay = lastReviewedDay === null ? clock.day : Math.max(lastReviewedDay, clock.day);
    var isFirst = reviewCount === 0 && lastReviewedDay === null && previousInterval === null;
    var intervalDays;
    var ladderIndex = null;
    var confidenceSource = confidence === null ? "ausente" : "declarada";

    if (confidence === null) {
      if (previousInterval !== null && previousInterval > 0) {
        intervalDays = clamp(previousInterval, 1, MAX_INTERVAL_DAYS);
        ctx.assume("CONFIANZA_AUSENTE", "Sin confianza declarada mantengo el intervalo previo (" + intervalDays + " días); no lo aumento.");
      } else {
        intervalDays = UNKNOWN_CONFIDENCE_INTERVAL_DAYS;
        ctx.assume("CONFIANZA_AUSENTE", "Sin confianza declarada propongo el intervalo conservador de " + intervalDays + " día para no perder la ficha.");
      }
    } else {
      ladderIndex = CONFIDENCE_START_INDEX[confidence] + Math.min(reviewCount, REVIEW_LADDER.length);
      if (lapses > 0) ladderIndex = 0;
      ladderIndex = clamp(ladderIndex, 0, REVIEW_LADDER.length - 1);
      intervalDays = REVIEW_LADDER[ladderIndex];
    }
    if (!isFirst && overdueDays > 0) {
      /* Un repaso atrasado se reprograma desde hoy: contar desde la última
         lectura daría un vencimiento ya pasado. */
      anchorDay = Math.max(anchorDay, clock.day);
    }
    if (anchorDay < clock.day) anchorDay = clock.day;

    var dueDayNumber = anchorDay + intervalDays;
    var reasonParts = [];
    if (confidence === null) {
      reasonParts.push("No hay confianza declarada: uso un intervalo conservador.");
    } else if (lapses > 0) {
      reasonParts.push("Hubo " + lapses + " lapso" + (lapses === 1 ? "" : "s") + ": la escalera vuelve a " + REVIEW_LADDER[0] + " día.");
    } else if (isFirst) {
      reasonParts.push("Primer repaso de una ficha con confianza «" + confidence + "»: " + intervalDays + " día" + (intervalDays === 1 ? "" : "s") + ".");
    } else {
      reasonParts.push("Confianza «" + confidence + "» con " + reviewCount + " repaso" + (reviewCount === 1 ? "" : "s") +
        " previo" + (reviewCount === 1 ? "" : "s") + ": " + intervalDays + " día" + (intervalDays === 1 ? "" : "s") + ".");
    }
    if (overdueDays > 0) {
      reasonParts.push("Estaba vencido desde el " + dateLabel(dueDay) + " (hace " + overdueDays + " día" + (overdueDays === 1 ? "" : "s") +
        "); cuento el nuevo plazo desde hoy.");
    }

    return {
      ok: true,
      version: VERSION,
      status: overdueDays > 0 ? "atrasado" : (isFirst ? "primeraVez" : "programado"),
      sheetId: typeof input.sheetId === "string" ? input.sheetId : null,
      dueDate: dayKey(dueDayNumber),
      dueAt: isoFromLocalMidnight(dueDayNumber, clock.zoneOffsetMinutes),
      intervalDays: intervalDays,
      ladderIndex: ladderIndex,
      confidence: confidence,
      confidenceSource: confidenceSource,
      lastReviewedAt: lastReviewedKey,
      isFirst: isFirst,
      overdue: overdueDays > 0,
      overdueDays: overdueDays,
      previousDueDate: dueDay === null ? null : dayKey(dueDay),
      source: "confidence",
      reason: reasonParts.join(" "),
      warnings: ctx.warnings,
      assumptions: ctx.assumptions
    };
  }

  /* ==========================================================================
     9. buildWeeklySummary
     ========================================================================== */

  function isoWeekKey(dayNumber) {
    var index = weekday(dayNumber);
    var thursday = dayNumber - index + 3;
    var civil = civilFromDays(thursday);
    var jan1 = daysFromCivil(civil.y, 1, 1);
    var week = Math.floor((thursday - jan1) / 7) + 1;
    return civil.y + "-W" + pad2(week);
  }

  function buildWeeklySummary(input) {
    input = input === undefined || input === null ? {} : input;
    if (!isObject(input)) input = {};
    var ctx = newContext();
    var clock = readClock(input, ctx);
    var emptyResponse = {
      ok: false,
      version: VERSION,
      status: "sinDatos",
      weekId: null,
      weekStart: null,
      weekEnd: null,
      rangeStart: null,
      rangeEnd: null,
      partial: false,
      days: 0,
      activity: {
        daysWithActivity: 0,
        sheetViews: null,
        sheetsCompleted: null,
        cardsReviewed: null,
        correct: null,
        wrong: null,
        accuracy: null,
        minutesRead: null,
        minutesSource: "ausente",
        completedFromStates: null
      },
      mastery: null,
      priority: [],
      pending: null,
      empty: true,
      message: "",
      missing: [],
      warnings: ctx.warnings,
      assumptions: ctx.assumptions
    };
    if (!clock.ok) {
      emptyResponse.message = "Falta una fecha de referencia (`now`) válida: el resumen semanal no usa el reloj del sistema.";
      emptyResponse.missing = ["now"];
      return emptyResponse;
    }

    var weekStartDay;
    if (input.weekStart !== undefined && input.weekStart !== null) {
      var parsed = parseDayKey(input.weekStart);
      if (parsed === null) {
        ctx.warn("SEMANA_INVALIDA", "`weekStart` no es una fecha válida; uso la semana en curso.", { value: input.weekStart });
        weekStartDay = startOfWeek(clock.day);
      } else {
        weekStartDay = parsed;
      }
    } else {
      weekStartDay = startOfWeek(clock.day);
    }
    var weekEndDay = weekStartDay + 6;
    var rangeEndDay = Math.min(weekEndDay, clock.day);
    var partial = clock.day < weekEndDay;

    var activityInput = isObject(input.activity) ? input.activity : null;
    var totals = {
      daysWithActivity: 0,
      sheetViews: null,
      sheetsCompleted: null,
      cardsReviewed: null,
      correct: null,
      wrong: null,
      accuracy: null,
      minutesRead: null,
      minutesSource: "ausente",
      completedFromStates: null
    };
    var anyRow = false;
    var anyMovement = false;
    var secondsDeclared = false;
    var sum = { sheetViews: 0, sheetCompletions: 0, cardReviews: 0, correct: 0, wrong: 0, seconds: 0 };
    if (activityInput) {
      for (var day = weekStartDay; day <= rangeEndDay; day++) {
        var row = activityInput[dayKey(day)];
        if (!isObject(row)) continue;
        anyRow = true;
        var views = asNumber(row.sheetViews) || 0;
        var completions = asNumber(row.sheetCompletions) || 0;
        var reviews = asNumber(row.cardReviews) || 0;
        var correct = asNumber(row.correct) || 0;
        var wrong = asNumber(row.wrong) || 0;
        if (row.seconds !== undefined && asNumber(row.seconds) !== null) secondsDeclared = true;
        sum.sheetViews += views;
        sum.sheetCompletions += completions;
        sum.cardReviews += reviews;
        sum.correct += correct;
        sum.wrong += wrong;
        sum.seconds += asNumber(row.seconds) || 0;
        if (views || completions || reviews || correct || wrong) {
          totals.daysWithActivity += 1;
          anyMovement = true;
        }
      }
    }
    if (anyRow) {
      totals.sheetViews = sum.sheetViews;
      totals.sheetsCompleted = sum.sheetCompletions;
      totals.cardsReviewed = sum.cardReviews;
      totals.correct = sum.correct;
      totals.wrong = sum.wrong;
      totals.accuracy = sum.correct + sum.wrong > 0 ? Math.round((sum.correct / (sum.correct + sum.wrong)) * 100) : null;
      if (secondsDeclared) {
        totals.minutesRead = Math.round(sum.seconds / 60);
        totals.minutesSource = "declarada";
      }
    }

    var states = isObject(input.states) ? input.states : null;
    if (states && isObject(states.sheets) && !Array.isArray(states.sheets)) {
      var completedInRange = 0;
      sortedKeys(states.sheets).forEach(function (sheetId) {
        var entry = states.sheets[sheetId];
        if (!isObject(entry) || !entry.completedAt) return;
        var moment = parseMoment(entry.completedAt, clock.zoneOffsetMinutes);
        if (moment === null) return;
        if (moment.day >= weekStartDay && moment.day <= rangeEndDay) completedInRange += 1;
      });
      totals.completedFromStates = completedInRange;
    }

    var mastery = null;
    if (Array.isArray(input.sheets)) {
      mastery = masteryFor({
        now: input.now,
        zoneOffsetMinutes: clock.zoneOffsetMinutes,
        sheets: input.sheets,
        categories: input.categories,
        states: input.states,
        cardSheet: input.cardSheet,
        cardSheets: input.cardSheets,
        categoryArea: input.categoryArea,
        errorWindowDays: input.errorWindowDays
      });
      ctx.warnings = ctx.warnings.concat(mastery.warnings || []);
      ctx.assumptions = ctx.assumptions.concat(mastery.assumptions || []);
    }

    var pending = null;
    if (Array.isArray(input.sheets)) {
      var pendingRead = readSheetList(input.sheets, { defaultMinutes: input.defaultMinutes, categoryArea: input.categoryArea }, ctx);
      var pendingSheets = pendingRead.items.filter(function (sheet) { return !sheet.done; });
      pending = {
        sheets: pendingSheets.length,
        minutes: sumBy(pendingSheets, function (sheet) { return sheet.minutes; }),
        minutesEstimated: pendingRead.fallbackMinutes > 0,
        reviewsDue: null,
        doubtsOpen: null,
        cardsDue: null
      };
      if (Array.isArray(input.reviews)) {
        pending.reviewsDue = 0;
        input.reviews.forEach(function (review) {
          if (!isObject(review) || review.deleted === true) return;
          var dueInput = review.dueDate !== undefined && review.dueDate !== null ? review.dueDate : review.dueAt;
          var moment = parseMoment(dueInput, clock.zoneOffsetMinutes);
          if (moment === null) return;
          if (moment.day <= clock.day) pending.reviewsDue += 1;
        });
      }
      if (Array.isArray(input.doubts)) {
        pending.doubtsOpen = 0;
        input.doubts.forEach(function (doubt) {
          if (!isObject(doubt) || doubt.deleted === true) return;
          if (doubt.resolved === true || doubt.resolvedAt) return;
          pending.doubtsOpen += 1;
        });
      }
      var weeklyCards = asNumber(input.cardsDue !== undefined ? input.cardsDue : input.dueCards);
      if (Array.isArray(input.cardsDue)) weeklyCards = input.cardsDue.length;
      pending.cardsDue = weeklyCards === null || weeklyCards < 0 ? null : Math.round(weeklyCards);
    }

    var priority = [];
    if (mastery && mastery.weakestArea) {
      var areaLabel = mastery.weakestArea.id;
      var weakCategory = mastery.weakest;
      priority.push({
        kind: "dominio",
        id: mastery.weakestArea.id,
        label: "Reforzar " + areaLabel,
        reason: "Es el área con dominio más bajo disponible (" + mastery.weakestArea.score + "/100, " +
          mastery.weakestArea.band + ", " + Math.round(mastery.weakestArea.coverage * 100) + " % de señales)" +
          (weakCategory ? "; la categoría más floja es «" + (weakCategory.label || weakCategory.id) + "» (" + weakCategory.score + "/100)." : "."),
        score: mastery.weakestArea.score,
        coverage: mastery.weakestArea.coverage
      });
    }
    if (pending && pending.reviewsDue > 0) {
      priority.push({
        kind: "repaso",
        id: null,
        label: "Repasar " + pending.reviewsDue + " ficha" + (pending.reviewsDue === 1 ? "" : "s") + " vencida" + (pending.reviewsDue === 1 ? "" : "s"),
        reason: "Tienes " + pending.reviewsDue + " repaso" + (pending.reviewsDue === 1 ? "" : "s") + " de ficha con vencimiento de hoy o anterior.",
        count: pending.reviewsDue
      });
    }
    if (pending && pending.doubtsOpen > 0) {
      priority.push({
        kind: "duda",
        id: null,
        label: "Resolver " + pending.doubtsOpen + " duda" + (pending.doubtsOpen === 1 ? "" : "s") + " abierta" + (pending.doubtsOpen === 1 ? "" : "s"),
        reason: "Las dudas abiertas frenan la lectura de las fichas donde aparecieron.",
        count: pending.doubtsOpen
      });
    }
    if (pending && pending.sheets > 0) {
      priority.push({
        kind: "ficha",
        id: null,
        label: "Quedan " + pending.sheets + " ficha" + (pending.sheets === 1 ? "" : "s") + " pendiente" + (pending.sheets === 1 ? "" : "s"),
        reason: pending.minutes + " minutos de lectura" + (pending.minutesEstimated ? " (algunas fichas sin minutos declarados, estimadas en " + MINUTES_DEFAULT + " min)" : "") + " en el temario.",
        count: pending.sheets
      });
    }
    priority = priority.slice(0, 3);

    var status;
    var message;
    var missing = [];
    if (!anyRow) {
      status = "sinDatos";
      missing.push("actividad");
      message = "Aún no hay actividad registrada esta semana. Cuando leas una ficha o repases tarjetas, el resumen aparecerá aquí.";
    } else if (!anyMovement) {
      status = "sinActividad";
      message = "La semana tiene registros, pero ningún movimiento: 0 fichas leídas, 0 completadas y 0 tarjetas repasadas.";
    } else {
      status = "ok";
      var parts = [];
      if (totals.sheetViews) parts.push(totals.sheetViews + " lectura" + (totals.sheetViews === 1 ? "" : "s") + " de ficha");
      if (totals.sheetsCompleted) parts.push(totals.sheetsCompleted + " ficha" + (totals.sheetsCompleted === 1 ? "" : "s") + " completada" + (totals.sheetsCompleted === 1 ? "" : "s"));
      if (totals.cardsReviewed) {
        parts.push(totals.cardsReviewed + " tarjeta" + (totals.cardsReviewed === 1 ? "" : "s") + " repasada" + (totals.cardsReviewed === 1 ? "" : "s") +
          (totals.accuracy === null ? "" : " (" + totals.accuracy + " % de acierto)"));
      }
      if (totals.minutesRead !== null) parts.push(totals.minutesRead + " minutos de lectura");
      message = "Esta semana: " + parts.join(", ") + ".";
      if (partial) message += " Semana en curso: cuento del " + dateLabel(weekStartDay) + " al " + dateLabel(rangeEndDay) + ".";
      if (totals.minutesRead === null) missing.push("minutos de lectura");
    }
    if (!mastery || mastery.status === "sinDatos") missing.push("dominio");
    else if (mastery.global && mastery.global.sheetCoverage < 0.05) missing.push("dominio");
    if (!pending) missing.push("pendientes");

    return {
      ok: status === "ok",
      version: VERSION,
      status: status,
      weekId: isoWeekKey(clock.day),
      weekStart: dayKey(weekStartDay),
      weekEnd: dayKey(weekEndDay),
      rangeStart: dayKey(weekStartDay),
      rangeEnd: dayKey(rangeEndDay),
      partial: partial,
      days: rangeEndDay - weekStartDay + 1,
      activity: totals,
      mastery: mastery && mastery.status !== "sinDatos" ? {
        global: mastery.global,
        weakest: mastery.weakest,
        weakestArea: mastery.weakestArea
      } : null,
      priority: priority,
      pending: pending,
      empty: !anyRow || !anyMovement,
      message: message,
      missing: missing,
      warnings: ctx.warnings,
      assumptions: ctx.assumptions
    };
  }

  /* ==========================================================================
     10. EXPORTACIÓN
     ========================================================================== */

  return {
    version: VERSION,
    constants: {
      ZONE_OFFSET_MINUTES: ZONE_OFFSET_MINUTES,
      MINUTES_DEFAULT: MINUTES_DEFAULT,
      MAX_MINUTES_PER_DAY: MAX_MINUTES_PER_DAY,
      MAX_CALENDAR_DAYS: MAX_CALENDAR_DAYS,
      MINUTES_PER_CARD: MINUTES_PER_CARD,
      REVIEW_MINUTES_FACTOR: REVIEW_MINUTES_FACTOR,
      REVIEW_MINUTES_MIN: REVIEW_MINUTES_MIN,
      DOUBT_MINUTES: DOUBT_MINUTES,
      UNASSIGNED_AREA: UNASSIGNED_AREA,
      UNASSIGNED_CATEGORY: UNASSIGNED_CATEGORY,
      TYPES: TYPES,
      ROUTE_WEIGHTS: ROUTE_WEIGHTS,
      ROUTE_RANK: ROUTE_RANK,
      ROUTE_CAPS: ROUTE_CAPS,
      OVERDUE_BONUS_PER_DAY: OVERDUE_BONUS_PER_DAY,
      OVERDUE_BONUS_MAX: OVERDUE_BONUS_MAX,
      NEXT_SHEET_BONUS: NEXT_SHEET_BONUS,
      AREA_PRIORITY_BONUS: AREA_PRIORITY_BONUS,
      REVIEW_LADDER: REVIEW_LADDER.slice(),
      CONFIDENCE_START_INDEX: CONFIDENCE_START_INDEX,
      CONFIDENCE_VALUE: CONFIDENCE_VALUE,
      UNKNOWN_CONFIDENCE_INTERVAL_DAYS: UNKNOWN_CONFIDENCE_INTERVAL_DAYS,
      MAX_INTERVAL_DAYS: MAX_INTERVAL_DAYS,
      SIGNAL_WEIGHTS: SIGNAL_WEIGHTS,
      SIGNAL_IDS: SIGNAL_IDS.slice(),
      VIEWED_CREDIT: VIEWED_CREDIT,
      ERRORS_FOR_ZERO: ERRORS_FOR_ZERO,
      ERROR_WINDOW_DAYS: ERROR_WINDOW_DAYS,
      CARD_ACCURACY_WEIGHT: CARD_ACCURACY_WEIGHT,
      CARD_VOLUME_WEIGHT: CARD_VOLUME_WEIGHT,
      MIN_COVERAGE_FOR_SOLIDO: MIN_COVERAGE_FOR_SOLIDO,
      WEAK_MIN_COVERAGE: WEAK_MIN_COVERAGE,
      BAND_THRESHOLDS: BAND_THRESHOLDS,
      WEEKDAYS: WEEKDAYS.slice(),
      MONTHS: MONTHS.slice()
    },
    dates: {
      parse: parseDayKey,
      key: dayKey,
      addDays: function (key, days) {
        var parsed = parseDayKey(key);
        var delta = asNumber(days);
        if (parsed === null || delta === null) return null;
        return dayKey(parsed + Math.round(delta));
      },
      diffDays: function (fromKey, toKey) {
        var from = parseDayKey(fromKey);
        var to = parseDayKey(toKey);
        if (from === null || to === null) return null;
        return to - from;
      },
      weekday: function (key) {
        var parsed = parseDayKey(key);
        return parsed === null ? null : weekday(parsed);
      },
      weekdayLabel: function (key) {
        var parsed = parseDayKey(key);
        return parsed === null ? null : WEEKDAYS[weekday(parsed)];
      },
      startOfWeek: function (key) {
        var parsed = parseDayKey(key);
        return parsed === null ? null : dayKey(startOfWeek(parsed));
      },
      today: function (now, zoneOffsetMinutes) {
        var clock = readClock({ now: now, zoneOffsetMinutes: zoneOffsetMinutes }, newContext());
        return clock.ok ? clock.key : null;
      },
      label: function (key) {
        var parsed = parseDayKey(key);
        return parsed === null ? null : dateLabel(parsed);
      },
      isoWeek: function (key) {
        var parsed = parseDayKey(key);
        return parsed === null ? null : isoWeekKey(parsed);
      }
    },
    buildPlan: buildPlan,
    buildTodayRoute: buildTodayRoute,
    masteryFor: masteryFor,
    nextSheetReview: nextSheetReview,
    buildWeeklySummary: buildWeeklySummary
  };
});
