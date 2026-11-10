/* Study Dashboard — Lectura activa · componentes
   © 2026 ZARCONT
   Funciones puras: reciben datos y devuelven HTML escapado. No leen ni escriben
   el store, no conocen rutas y no guardan preferencias. La interacción se declara
   con data-ac-action / data-ac-input y la resuelve la capa de integración. */
(function (global) {
  "use strict";

  var A = global.StudyActive = global.StudyActive || {};
  var U = A.util;
  var M = A.marks;
  var esc = U.esc;
  var icon = A.icon;

  function plural(n, one, many) {
    var ui = global.StudyUI;
    if (ui && typeof ui.plural === "function") return ui.plural(n, one, many);
    return Number(n) === 1 ? one : many;
  }

  /* ------------------------------------------------------------------ */
  /* Piezas compartidas                                                  */
  /* ------------------------------------------------------------------ */

  function kicker(text, withDot) {
    return '<span class="ac-kicker">' + (withDot ? '<span class="ac-dot" aria-hidden="true"></span>' : "") +
      esc(text) + "</span>";
  }

  function markBadge(key, size) {
    var m = M.get(key);
    return '<span class="ac-markbadge' + (size === "sm" ? " ac-markbadge--sm" : "") + '" data-mark="' + esc(m.key) + '">' +
      '<span class="ac-markbadge__ico" aria-hidden="true">' + icon(m.icon, size === "sm" ? 12 : 14) + "</span>" +
      '<span class="ac-markbadge__label">' + esc(m.label) + "</span></span>";
  }

  function actionButton(def) {
    var a = def || {};
    var variant = U.oneOf(a.variant, ["primary", "ghost", "soft", "quiet", "danger"], "ghost");
    var cls = "ac-btn ac-btn--" + variant;
    if (a.size === "sm") cls += " ac-btn--sm";
    if (a.block) cls += " ac-btn--block";
    var attrs = ' data-ac-action="' + esc(a.action) + '"';
    if (a.value != null) attrs += ' data-ac-value="' + esc(a.value) + '"';
    if (a.id != null) attrs += ' data-ac-id="' + esc(a.id) + '"';
    if (a.index != null) attrs += ' data-index="' + esc(a.index) + '"';
    var content = (a.icon ? '<span class="ac-btn__ico" aria-hidden="true">' + icon(a.icon, a.iconSize || 15) + "</span>" : "") +
      '<span class="ac-btn__label">' + esc(a.label) + "</span>";
    if (a.href) {
      return '<a class="' + cls + '" href="' + esc(a.href) + '"' + attrs +
        (a.disabled ? ' aria-disabled="true" tabindex="-1"' : "") + ">" + content + "</a>";
    }
    return '<button class="' + cls + '" type="button"' + attrs +
      (a.disabled ? " disabled" : "") + (a.pressed != null ? ' aria-pressed="' + (a.pressed ? "true" : "false") + '"' : "") +
      (a.title ? ' title="' + esc(a.title) + '"' : "") + ">" + content + "</button>";
  }

  function statusLine(text, tone, iconName) {
    if (!text) return "";
    var safeTone = U.oneOf(tone, ["ok", "warn", "error", "muted"], "muted");
    return '<p class="ac-status ac-status--' + safeTone + '" role="' + (safeTone === "error" ? "alert" : "status") + '">' +
      (iconName ? '<span class="ac-status__ico" aria-hidden="true">' + icon(iconName, 14) + "</span>" : "") +
      "<span>" + esc(text) + "</span></p>";
  }

  function quoteBlock(o) {
    var opts = o || {};
    var cite = opts.source ? '<footer class="ac-quote__source">' + esc(opts.source) + "</footer>" : "";
    var idAttr = opts.id ? ' id="' + esc(opts.id) + '"' : "";
    return '<blockquote class="ac-quote" data-mark="' + esc(opts.color || "important") + '"' + idAttr + ">" +
      '<p class="ac-quote__text">“' + esc(opts.quote) + "”</p>" + cite + "</blockquote>";
  }

  function stateCard(opts) {
    var o = opts || {};
    var tone = U.oneOf(o.tone, ["empty", "error", "success", "info", "loading"], "empty");
    var iconName = o.icon || (tone === "error" ? "alert" : tone === "success" ? "checkCircle" : tone === "info" ? "info" : "highlighter");
    var titleTag = U.oneOf(o.titleTag, ["h2", "h3", "h4"], "h3");
    var actions = (o.actions || []).map(actionButton).join("");
    return '<div class="ac ac-state" data-ac-component="state" data-tone="' + tone + '">' +
      '<span class="ac-state__icon" aria-hidden="true">' + icon(iconName, 22) + "</span>" +
      "<div class=\"ac-state__copy\">" +
      "<" + titleTag + ">" + esc(o.title || "Sin contenido") + "</" + titleTag + ">" +
      "<p>" + esc(o.text || "") + "</p>" +
      "</div>" +
      (actions ? '<div class="ac-state__actions">' + actions + "</div>" : "") +
      "</div>";
  }

  function skeleton(opts) {
    var o = opts || {};
    var rows = Math.max(1, Math.min(8, U.num(o.rows, 3)));
    var lines = "";
    for (var i = 0; i < rows; i += 1) {
      lines += '<div class="ac-skeleton-row"><span class="ac-skeleton ac-skeleton--dot"></span>' +
        '<span class="ac-skeleton ac-skeleton--line" style="width:' + (88 - (i % 3) * 14) + '%"></span></div>';
    }
    return '<div class="ac ac-loading" role="status" aria-label="' + esc(o.label || "Cargando subrayados") + '" aria-busy="true">' +
      lines + '<span class="ac-sr">' + esc(o.label || "Cargando subrayados") + "</span></div>";
  }

  function alertBox(opts) {
    var o = opts || {};
    var tone = U.oneOf(o.tone, ["info", "warn", "error", "success"], "info");
    var iconName = o.icon || (tone === "error" ? "alert" : tone === "success" ? "checkCircle" : tone === "warn" ? "alert" : "info");
    var action = o.action ? actionButton(o.action) : "";
    return '<div class="ac ac-alert ac-alert--' + tone + '" role="' + (tone === "error" ? "alert" : "status") + '">' +
      '<span class="ac-alert__ico" aria-hidden="true">' + icon(iconName, 16) + "</span>" +
      '<div class="ac-alert__copy"><b>' + esc(o.title || "") + "</b>" +
      (o.text ? "<p>" + esc(o.text) + "</p>" : "") + "</div>" + action + "</div>";
  }

  /* ------------------------------------------------------------------ */
  /* 1 · Barra de selección                                              */
  /* ------------------------------------------------------------------ */

  var SELECTION_STATES = ["ready", "saving", "saved", "error", "disabled"];

  function selectionColors(o) {
    var selected = M.get(o.color).key;
    var disabled = o.disabled || o.state === "saving";
    return M.list().map(function (m) {
      var pressed = m.key === selected;
      return '<button class="ac-colorbtn" type="button" data-ac-action="selection:color" data-color="' + esc(m.key) + '"' +
        ' aria-pressed="' + (pressed ? "true" : "false") + '"' + (disabled ? " disabled" : "") +
        ' aria-label="' + esc(m.label + (pressed ? ", seleccionado" : "")) + '">' +
        '<span class="ac-colorbtn__ico" aria-hidden="true">' + icon(m.icon, 17) + "</span>" +
        '<span class="ac-colorbtn__label">' + esc(m.label) + "</span>" +
        (pressed ? '<span class="ac-colorbtn__check" aria-hidden="true">' + icon("check", 12) + "</span>" : "") +
        "</button>";
    }).join("");
  }

  function selectionBar(opts) {
    var o = opts || {};
    var variant = U.oneOf(o.variant, ["floating", "sheet", "inline"], "floating");
    var layerless = variant === "inline" || !!o.noLayer;
    var state = U.oneOf(o.state, SELECTION_STATES, "ready");
    var disabled = !!o.disabled || state === "disabled";
    var color = M.get(o.color).key;
    var mark = M.get(color);
    var base = U.idOf(o, "acsel");
    var quote = U.str(o.quote);
    var source = U.str(o.source);
    var noteOpen = !!o.noteOpen;
    var noteValue = U.str(o.note);
    var max = U.num(o.maxLength, 280);
    var saving = state === "saving";
    var done = state === "saved";
    var errorText = state === "error" ? U.str(o.error) || "No se pudo guardar el subrayado." : "";
    var sheet = variant === "sheet";
    var label = saving ? "Guardando…" : "Subrayar";
    var hint = U.str(o.hint);
    if (!hint) {
      hint = sheet
        ? "También puedes subrayar con el botón de cada párrafo."
        : o.keyHints
          ? "Teclas 1–4 eligen el color. Esc cierra sin guardar."
          : "La etiqueta acompaña siempre a la cita. La nota es opcional.";
    }
    var titleId = base + "-title";
    var noteId = base + "-note";

    if (done) {
      var doneInner =
        '<div class="ac ac-selbar ac-selbar--done" data-state="saved" role="group" aria-label="Subrayado guardado">' +
          '<span class="ac-selbar__ok" aria-hidden="true">' + icon("checkCircle", 20) + "</span>" +
          '<div class="ac-selbar__donecopy"><b>Subrayado guardado</b>' +
            "<span>" + esc(mark.label + (noteValue ? " · con nota" : " · sin nota")) + "</span></div>" +
          '<button class="ac-btn ac-btn--quiet ac-btn--sm" type="button" data-ac-action="selection:close">Cerrar</button>' +
          '<p class="ac-sr" role="status">Subrayado guardado.</p>' +
        "</div>";
      if (layerless) {
        return '<div class="ac ac-selbar ac-selbar--done" data-variant="inline" data-state="saved" role="group" aria-label="Subrayado guardado">' +
          '<span class="ac-selbar__ok" aria-hidden="true">' + icon("checkCircle", 20) + "</span>" +
          '<div class="ac-selbar__donecopy"><b>Subrayado guardado</b><span>' +
          esc(mark.label + (noteValue ? " · con nota" : " · sin nota")) + "</span></div></div>";
      }
      return wrapLayer(doneInner, o, false, "selection");
    }

    var colors = selectionColors({ color: color, state: state, disabled: disabled });

    var noteField = noteOpen
      ? '<div class="ac-selbar__notebody" id="' + esc(noteId) + '">' +
          '<label class="ac-field">' +
            '<span class="ac-field__label">Nota <span class="ac-field__optional">(opcional)</span></span>' +
            '<textarea class="ac-textarea" rows="2" maxlength="' + max + '" data-ac-input="note" ' +
              'aria-describedby="' + esc(noteId) + '-count" placeholder="Qué quieres recordar de esta cita">' +
              esc(noteValue) + "</textarea>" +
          "</label>" +
          '<span class="ac-count" id="' + esc(noteId) + '-count" data-ac-note-count>' +
            noteValue.length + "/" + max + "</span>" +
        "</div>"
      : "";

    var noteToggle = '<button class="ac-noteToggle" type="button" data-ac-action="selection:note" ' +
      'aria-expanded="' + (noteOpen ? "true" : "false") + '" aria-controls="' + esc(noteId) + '"' +
      (disabled ? " disabled" : "") + ">" +
      '<span class="ac-noteToggle__ico" aria-hidden="true">' + icon(noteOpen ? "close" : "plus", 14) + "</span>" +
      '<span>' + (noteOpen ? "Quitar nota" : "Añadir nota") + "</span></button>";

    var body =
      '<div class="ac ac-selbar" data-ac-component="selection-bar" data-variant="' + variant + '"' +
        ' data-state="' + state + '" data-color="' + esc(color) + '" data-mark="' + esc(color) + '"' +
        (o.static ? ' data-static="true"' : "") +
        ' role="' + (variant === "inline" ? "group" : "dialog") + '"' +
        (variant === "inline" ? "" : ' aria-modal="' + (sheet ? "true" : "false") + '"') +
        ' aria-labelledby="' + esc(titleId) + '"' +
        (saving ? ' aria-busy="true"' : "") + (disabled ? ' data-disabled="true"' : "") + ">" +
        (sheet ? '<span class="ac-sheet__grab" aria-hidden="true"></span>' : "") +
        '<header class="ac-selbar__head">' +
          "<div>" + kicker("Subrayar", true) +
            '<h2 class="ac-selbar__title" id="' + esc(titleId) + '">Elige un color</h2>' +
          "</div>" +
          '<button class="ac-iconbtn ac-iconbtn--sm" type="button" data-ac-action="selection:cancel" ' +
            'aria-label="Cerrar sin subrayar"' + (disabled ? " disabled" : "") + ">" + icon("close", 15) + "</button>" +
        "</header>" +
        '<blockquote class="ac-selbar__quote" data-mark="' + esc(color) + '">' +
          '<p>“' + esc(quote) + "”</p>" +
          (source ? "<footer>" + esc(source) + "</footer>" : "") +
        "</blockquote>" +
        '<p class="ac-selbar__hint" id="' + esc(base) + '-hint">' + esc(hint) + "</p>" +
        '<div class="ac-selbar__colors" role="group" aria-labelledby="' + esc(base) + '-hint">' + colors + "</div>" +
        '<div class="ac-selbar__note">' + noteToggle + noteField + "</div>" +
        '<div class="ac-selbar__actions">' +
          '<button class="ac-btn ac-btn--ghost" type="button" data-ac-action="selection:cancel"' +
            (disabled ? " disabled" : "") + ">Cancelar</button>" +
          '<button class="ac-btn ac-btn--primary ac-btn--mark" type="button" data-ac-action="selection:submit"' +
            (disabled || saving ? " disabled" : "") + ">" +
            (saving ? '<span class="ac-spinner" aria-hidden="true"></span>' : '<span class="ac-btn__ico" aria-hidden="true">' + icon("highlighter", 15) + "</span>") +
            "<span>" + esc(label) + "</span></button>" +
        "</div>" +
        (errorText ? statusLine(errorText, "error", "alert") : "") +
        (sheet ? '<p class="ac-selbar__sheetnote">' + icon("info", 13) + " La nota es opcional · toca fuera para cerrar</p>" : "") +
      "</div>";

    if (layerless) return body;
    return wrapLayer(body, o, sheet, "selection");
  }

  function wrapLayer(inner, opts, modal, name) {
    var o = opts || {};
    if (o.noLayer) return inner;
    var scrim = modal
      ? '<div class="ac-scrim" data-ac-action="selection:cancel" aria-hidden="true"></div>'
      : "";
    return '<div class="ac-layer' + (modal ? " ac-layer--modal" : "") + '" data-ac-layer="' + esc(name || "selection") + '">' +
      scrim + inner + "</div>";
  }

  /* Un párrafo de lectura con su botón de subrayado. El botón es la alternativa
     sin gesto: sirve con teclado y en táctil. */
  function readingParagraph(opts) {
    var o = opts || {};
    var index = U.num(o.index, 0);
    var base = U.idOf(o, "acpara");
    var highlighted = o.highlight ? ' data-highlight="' + esc(o.highlight) + '"' : "";
    var target = o.sheetTitle ? " de «" + U.str(o.sheetTitle) + "»" : "";
    return '<div class="ac ac-para" data-ac-component="paragraph" data-index="' + index + '"' + highlighted + ">" +
      '<p class="ac-para__text" id="' + esc(base) + '">' + esc(o.text) + "</p>" +
      '<button class="ac-para__btn" type="button" data-ac-action="paragraph:open" data-index="' + index + '"' +
        ' aria-label="' + esc("Subrayar el párrafo " + (index + 1) + target + ": " + U.excerpt(o.text, 90)) + '">' +
        '<span class="ac-para__ico" aria-hidden="true">' + icon("highlighter", 15) + "</span>" +
        '<span class="ac-para__label">Subrayar</span>' +
      "</button></div>";
  }

  /* ------------------------------------------------------------------ */
  /* 2 · Nota asociada a un subrayado                                    */
  /* ------------------------------------------------------------------ */

  function noteCard(opts) {
    var o = opts || {};
    var state = U.oneOf(o.state, ["idle", "saving", "saved", "error", "disabled"], "idle");
    var mode = U.oneOf(o.mode, ["view", "edit"], "view");
    if (state === "saving" || state === "error") mode = "edit";
    var color = M.get(o.color).key;
    var base = U.idOf(o, "acnote");
    var note = U.str(o.note);
    var max = U.num(o.maxLength, 280);
    var disabled = state === "disabled";
    var saving = state === "saving";
    var noteId = base + "-field";
    var titleId = base + "-title";
    var count = note.length + "/" + max;
    var when = U.relative(o.updatedAt);
    var whenAbs = U.absDate(o.updatedAt);

    var body;
    if (mode === "edit") {
      body = '<div class="ac-note__body">' +
        '<label class="ac-field" for="' + esc(noteId) + '">' +
          '<span class="ac-field__label">Nota del subrayado</span>' +
          '<span class="ac-field__hint">Opcional. La nota se guarda junto a esta cita.</span>' +
        "</label>" +
        '<textarea class="ac-textarea" id="' + esc(noteId) + '" rows="3" maxlength="' + max + '" data-ac-input="note" ' +
          'aria-describedby="' + esc(noteId) + '-count"' + (saving || disabled ? " disabled" : "") +
          ' placeholder="Escribe una idea, una duda o lo que quieras recordar">' + esc(note) + "</textarea>" +
        '<div class="ac-note__countrow">' +
          '<span class="ac-count" id="' + esc(noteId) + '-count" data-ac-note-count data-over="false">' + count + "</span>" +
          '<span class="ac-hint">Máximo ' + max + " caracteres.</span>" +
        "</div>" +
        "</div>";
    } else if (note) {
      body = '<div class="ac-note__body"><p class="ac-note__text">' + esc(note) + "</p></div>";
    } else {
      body = '<div class="ac-note__body"><p class="ac-note__empty">' + icon("note", 14) +
        " Todavía no hay nota. La cita se guarda igual.</p></div>";
    }

    var foot = "";
    var status = "";
    if (mode === "edit") {
      if (state === "error") {
        status = alertBox({
          tone: "error", title: "No se pudo guardar la nota",
          text: U.str(o.error) || "Revisa el espacio de almacenamiento del navegador y vuelve a intentarlo."
        });
      }
      foot = '<footer class="ac-note__foot">' +
        '<button class="ac-btn ac-btn--ghost ac-btn--sm" type="button" data-ac-action="note:cancel"' +
          (saving ? " disabled" : "") + ">Cancelar</button>" +
        (saving
          ? '<button class="ac-btn ac-btn--primary ac-btn--sm" type="button" disabled><span class="ac-spinner" aria-hidden="true"></span>Guardando…</button>'
          : '<button class="ac-btn ac-btn--primary ac-btn--sm" type="button" data-ac-action="note:save"' +
            (disabled ? " disabled" : "") + ' data-ac-id="' + esc(o.annotationId) + '">' +
            '<span class="ac-btn__ico" aria-hidden="true">' + icon("check", 14) + "</span>Guardar nota</button>") +
        "</footer>";
    } else {
      if (state === "saved") {
        status = statusLine("Nota guardada" + (when ? " · " + when : ""), "ok", "checkCircle");
      }
      var off = disabled ? " disabled" : "";
      foot = '<footer class="ac-note__foot">' +
        '<div class="ac-note__footmain">' +
          '<button class="ac-btn ac-btn--ghost ac-btn--sm" type="button" data-ac-action="note:goto" data-ac-id="' + esc(o.annotationId) + '">' +
            '<span class="ac-btn__ico" aria-hidden="true">' + icon("cornerDown", 14) + "</span>Ir al contexto</button>" +
          (note
            ? '<button class="ac-btn ac-btn--soft ac-btn--sm" type="button" data-ac-action="note:edit" data-ac-id="' + esc(o.annotationId) + '"' + off + ">" +
              '<span class="ac-btn__ico" aria-hidden="true">' + icon("note", 14) + "</span>Editar nota</button>"
            : '<button class="ac-btn ac-btn--soft ac-btn--sm" type="button" data-ac-action="note:edit" data-ac-id="' + esc(o.annotationId) + '"' + off + ">" +
              '<span class="ac-btn__ico" aria-hidden="true">' + icon("plus", 14) + "</span>Añadir nota</button>") +
        "</div>" +
        (note
          ? '<button class="ac-btn ac-btn--quiet ac-btn--sm" type="button" data-ac-action="note:clear" data-ac-id="' + esc(o.annotationId) + '"' + off + ">Quitar nota</button>"
          : "") +
        "</footer>";
    }

    return '<article class="ac ac-note" data-ac-component="note" data-mode="' + mode + '" data-state="' + state + '"' +
      ' data-mark="' + esc(color) + '"' + (o.annotationId ? ' data-ac-id="' + esc(o.annotationId) + '"' : "") +
      ' aria-labelledby="' + esc(titleId) + '"' + (saving ? ' aria-busy="true"' : "") + ">" +
      "<h3 class=\"ac-sr\" id=\"" + esc(titleId) + "\">Nota del subrayado " + esc(M.label(color)) + "</h3>" +
      '<header class="ac-note__head">' + markBadge(color) +
        (when ? '<span class="ac-note__when" title="' + esc(whenAbs) + '">' + esc(when) + "</span>" : "") +
      "</header>" +
      quoteBlock({ quote: o.quote, source: o.source, color: color }) +
      body + foot + status +
      "</article>";
  }

  /* ------------------------------------------------------------------ */
  /* 3 · Mis subrayados                                                  */
  /* ------------------------------------------------------------------ */

  function filterAnnotations(list, filters) {
    var f = filters || {};
    var colors = (f.colors || []).filter(function (c) { return M.has(c); });
    var query = U.normalize(f.query);
    var scope = f.scope || "all";
    var counts = { total: 0, important: 0, understand: 0, review: 0, doubt: 0, notes: 0, orphans: 0 };
    var alive = [];
    (list || []).forEach(function (item) {
      if (!item || item.deleted) return;
      alive.push(item);
      counts.total += 1;
      if (Object.prototype.hasOwnProperty.call(counts, item.color)) counts[item.color] += 1;
      if (item.note) counts.notes += 1;
      if (item.orphan) counts.orphans += 1;
    });
    var items = alive.filter(function (item) {
      if (colors.length && colors.indexOf(item.color) === -1) return false;
      if (scope !== "all" && item.sheetId !== scope && item.areaId !== scope) return false;
      if (query) {
        var hay = U.normalize([item.quote, item.note, item.sheetTitle, item.sectionTitle].join(" "));
        if (hay.indexOf(query) === -1) return false;
      }
      return true;
    });
    return { items: items, counts: counts, filtered: items.length, total: alive.length, hasFilters: !!(colors.length || query || scope !== "all") };
  }

  function ringStyle(counts) {
    var total = counts.total || 0;
    if (!total) return "";
    var stops = [];
    var at = 0;
    M.list().forEach(function (m) {
      var value = counts[m.key] || 0;
      if (!value) return;
      var pct = (value / total) * 100;
      stops.push("var(--ac-mark-" + m.key + ") " + at.toFixed(2) + "% " + (at + pct).toFixed(2) + "%");
      at += pct;
    });
    if (!stops.length) return "";
    return ' style="--ac-ring: conic-gradient(' + stops.join(", ") + ')"';
  }

  function ringMarkup(counts) {
    if (!counts.total) return "";
    var legend = M.list().map(function (m) {
      return '<li><span class="ac-dot" data-mark="' + esc(m.key) + '" aria-hidden="true"></span>' +
        "<span>" + esc(m.label) + "</span><b>" + (counts[m.key] || 0) + "</b></li>";
    }).join("");
    return '<div class="ac-hlpanel__ringwrap">' +
      '<div class="ac-ring" aria-hidden="true"' + ringStyle(counts) + "><span class=\"ac-ring__hole\">" +
        '<b>' + counts.total + "</b><small>" + esc(plural(counts.total, "marca", "marcas")) + "</small>" +
      "</span></div>" +
      '<ul class="ac-legend">' + legend + "</ul></div>";
  }

  function scopesMarkup(o) {
    var scopes = o.scopes || [];
    if (!scopes.length) return "";
    var current = o.filters && o.filters.scope ? o.filters.scope : "all";
    var options = scopes.map(function (s) {
      return '<option value="' + esc(s.value) + '"' + (s.value === current ? " selected" : "") + ">" + esc(s.label) + "</option>";
    }).join("");
    return '<label class="ac-select">' +
      '<span class="ac-select__ico" aria-hidden="true">' + icon("filter", 14) + "</span>" +
      '<span class="ac-sr">Filtrar por ficha o área</span>' +
      '<select data-ac-input="scope">' + options + "</select>" +
      '<span class="ac-select__chev" aria-hidden="true">' + icon("chevronDown", 13) + "</span>" +
      "</label>";
  }

  function filtersMarkup(o) {
    var filters = o.filters || {};
    var counts = o.counts || { total: 0 };
    var activeColors = filters.colors || [];
    var allPressed = activeColors.length === 0;
    var chips = '<button class="ac-chipf" type="button" data-ac-action="highlights:filter" data-color="all"' +
      ' aria-pressed="' + (allPressed ? "true" : "false") + '">Todos <b>' + counts.total + "</b></button>";
    chips += M.list().map(function (m) {
      var pressed = activeColors.indexOf(m.key) !== -1;
      return '<button class="ac-chipf" type="button" data-ac-action="highlights:filter" data-color="' + esc(m.key) + '"' +
        ' aria-pressed="' + (pressed ? "true" : "false") + '">' +
        '<span class="ac-dot" data-mark="' + esc(m.key) + '" aria-hidden="true"></span>' +
        esc(m.label) + " <b>" + (counts[m.key] || 0) + "</b></button>";
    }).join("");
    var query = filters.query || "";
    return '<div class="ac-hlfilters">' +
      '<div class="ac-chipset" role="group" aria-label="Filtrar por color">' + chips + "</div>" +
      scopesMarkup(o) +
      '<label class="ac-search">' +
        '<span class="ac-search__ico" aria-hidden="true">' + icon("search", 15) + "</span>" +
        '<span class="ac-sr">Buscar en la cita o en la nota</span>' +
        '<input type="search" data-ac-input="query" autocomplete="off" placeholder="Buscar en la cita o la nota"' +
          ' value="' + esc(query) + '">' +
        (query || o.keyHint === false ? "" : '<span class="ac-kbd" aria-hidden="true">/</span>') +
      "</label>" +
      "</div>";
  }

  function highlightRow(item) {
    var m = M.get(item.color);
    var orphan = item.orphan || false;
    var href = item.href || "";
    var gotoAttrs = ' data-ac-action="highlights:goto" data-ac-id="' + esc(item.id) + '"';
    var goto = href
      ? '<a class="ac-btn ac-btn--ghost ac-btn--sm" href="' + esc(href) + '"' + gotoAttrs + ">" +
        '<span class="ac-btn__ico" aria-hidden="true">' + icon("cornerDown", 14) + "</span>Ir al contexto</a>"
      : '<button class="ac-btn ac-btn--ghost ac-btn--sm" type="button"' + gotoAttrs + ">" +
        '<span class="ac-btn__ico" aria-hidden="true">' + icon("cornerDown", 14) + "</span>Ir al contexto</button>";
    var orphanBadge = orphan
      ? '<span class="ac-badge ac-badge--warn">' + icon("linkOff", 12) + (orphan === "missing-sheet" ? "Ficha no disponible" : "Ancla perdida") + "</span>"
      : "";
    var meta = [item.sheetTitle, item.sectionTitle].filter(Boolean).join(" · ");
    var note = item.note
      ? '<p class="ac-hlrow__note"><span class="ac-hlrow__notelabel">Nota</span>' + esc(item.note) + "</p>"
      : "";
    var recovery = "";
    if (orphan) {
      recovery = '<p class="ac-hlrow__recovery">' + icon("info", 13) +
        " La cita y la nota se conservan. Puedes abrir la ficha o eliminar el subrayado.</p>";
    }
    return '<article class="ac-hlrow" data-mark="' + esc(item.color) + '" data-ac-id="' + esc(item.id) + '"' +
      (orphan ? ' data-orphan="' + esc(orphan) + '"' : "") + ">" +
      '<span class="ac-hlrow__rail" aria-hidden="true"></span>' +
      '<div class="ac-hlrow__body">' +
        '<header class="ac-hlrow__head">' + markBadge(item.color, "sm") +
          orphanBadge +
          '<span class="ac-hlrow__when">' + esc(U.relative(item.updatedAt)) + "</span>" +
        "</header>" +
        '<blockquote class="ac-hlrow__quote">“' + esc(item.quote) + "”</blockquote>" +
        (meta ? '<p class="ac-hlrow__source">' + esc(meta) + "</p>" : "") +
        note + recovery +
        '<footer class="ac-hlrow__foot">' + goto +
          '<button class="ac-btn ac-btn--quiet ac-btn--sm" type="button" data-ac-action="highlights:note" data-ac-id="' + esc(item.id) + '">' +
            '<span class="ac-btn__ico" aria-hidden="true">' + icon("note", 14) + "</span>" +
            (item.note ? "Editar nota" : "Añadir nota") + "</button>" +
          '<button class="ac-iconbtn ac-iconbtn--sm ac-iconbtn--quiet" type="button" data-ac-action="highlights:delete" data-ac-id="' + esc(item.id) + '"' +
            ' aria-label="Eliminar el subrayado: ' + esc(U.excerpt(item.quote, 60)) + '">' + icon("trash", 15) + "</button>" +
        "</footer>" +
      "</div></article>";
  }

  function highlightsPanel(opts) {
    var o = opts || {};
    if (U.oneOf(o.view, ["rail"], "full") === "rail") return highlightsRail(o);
    var state = U.oneOf(o.state, ["ready", "loading", "error", "empty"], "ready");
    var base = U.idOf(o, "achl");
    var titleTag = U.oneOf(o.titleTag, ["h2", "h3"], "h2");
    var result = filterAnnotations(o.annotations, o.filters);
    var counts = result.counts;
    var filters = o.filters || {};
    var items = state === "ready" ? result.items : [];
    var subline = counts.total
      ? counts.total + " " + plural(counts.total, "subrayado", "subrayados") +
        (counts.notes ? " · " + counts.notes + " con nota" : "")
      : "Todavía no hay subrayados";

    var list = "";
    if (state === "loading") {
      list = skeleton({ rows: 3, label: "Cargando subrayados" });
    } else if (state === "error") {
      list = stateCard({
        tone: "error", icon: "alert", title: "No se pudieron leer los subrayados",
        text: U.str(o.error) || "El almacenamiento local no respondió. Tus notas siguen en el navegador.",
        actions: [{ label: "Reintentar", action: "highlights:retry", icon: "rotate", variant: "soft" }]
      });
    } else if (!counts.total) {
      list = stateCard({
        tone: "empty", icon: "highlighter", title: "Todavía no hay subrayados",
        text: "Marca un párrafo en cualquier ficha y aparecerá aquí con su cita y su nota.",
        actions: [{ label: "Volver a la lectura", action: "highlights:back", icon: "arrowLeft" }]
      });
    } else if (!items.length) {
      list = stateCard({
        tone: "empty", icon: "search", title: "Ningún subrayado coincide",
        text: "Prueba con otra palabra o quita los filtros para ver todas tus marcas.",
        actions: [{ label: "Limpiar filtros", action: "highlights:clear", icon: "undo", variant: "soft" }]
      });
    } else {
      list = items.map(highlightRow).join("");
    }

    var summary = state === "ready" && counts.total
      ? '<p class="ac-hlsummary" role="status">Mostrando <b>' + result.filtered + "</b> de " + counts.total +
        " " + plural(counts.total, "subrayado", "subrayados") +
        (result.hasFilters ? " con los filtros activos" : "") + "</p>"
      : "";

    var orphanBanner = state === "ready" && counts.orphans
      ? alertBox({
          tone: "warn", icon: "linkOff", title: counts.orphans + " " + plural(counts.orphans, "subrayado necesita", "subrayados necesitan") + " atención",
          text: "La ficha o el párrafo cambiaron desde que lo guardaste. La cita y la nota se conservan."
        })
      : "";

    return '<section class="ac ac-hlpanel" data-ac-component="highlights" data-view="full" data-state="' + state + '"' +
      ' aria-labelledby="' + esc(base) + '-title">' +
      '<header class="ac-hlpanel__head">' +
        '<div class="ac-hlpanel__intro">' + kicker(U.str(o.kicker) || "Tu lectura activa", true) +
          "<" + titleTag + ' id="' + esc(base) + '-title">' + esc(U.str(o.title) || "Mis subrayados") + "</" + titleTag + ">" +
          '<p class="ac-hlpanel__sub">' + esc(subline) + "</p>" +
        "</div>" + ringMarkup(counts) +
      "</header>" +
      (state === "ready" && counts.total ? filtersMarkup({ filters: filters, counts: counts, scopes: o.scopes, keyHint: o.keyHint }) : "") +
      orphanBanner + summary +
      '<div class="ac-hllist">' + list + "</div>" +
      '<footer class="ac-hlpanel__foot">' +
        '<span class="ac-hint">' + icon("lock", 12) + " Tus subrayados se guardan en este navegador.</span>" +
        (state === "ready" && result.hasFilters
          ? '<button class="ac-btn ac-btn--quiet ac-btn--sm" type="button" data-ac-action="highlights:clear">Limpiar filtros</button>'
          : "") +
      "</footer>" +
      "</section>";
  }

  function highlightsRail(opts) {
    var o = opts || {};
    var result = filterAnnotations(o.annotations, o.filters);
    var counts = result.counts;
    var limit = Math.max(1, U.num(o.limit, 3));
    var items = result.items.slice(0, limit);
    var state = U.oneOf(o.state, ["ready", "loading", "error", "empty"], "ready");
    var rows = "";
    if (state === "loading") {
      rows = skeleton({ rows: 2, label: "Cargando tus subrayados" });
    } else if (!items.length) {
      rows = '<p class="ac-hlrail__empty">' +
        (counts.total ? "Ningún subrayado coincide con el filtro." : "Aún no subrayaste nada en esta ficha.") +
        "</p>";
    } else {
      rows = '<ul class="ac-hlrail">' + items.map(function (item) {
        var m = M.get(item.color);
        var meta = item.sectionTitle || item.sheetTitle || "";
        return '<li><button class="ac-hlrail__item" type="button" data-ac-action="highlights:goto" data-ac-id="' + esc(item.id) + '"' +
          (item.orphan ? ' data-orphan="true"' : "") + ">" +
          '<span class="ac-hlrail__mark" data-mark="' + esc(item.color) + '" aria-hidden="true">' + icon(m.icon, 13) + "</span>" +
          '<span class="ac-hlrail__copy">' +
            '<span class="ac-hlrail__label">' + esc(m.label) + (item.orphan ? " · ancla perdida" : "") + "</span>" +
            '<span class="ac-hlrail__quote">' + esc(U.excerpt(item.quote, 90)) + "</span>" +
            (meta ? '<span class="ac-hlrail__meta">' + esc(meta) + "</span>" : "") +
          "</span></button></li>";
      }).join("") + "</ul>";
    }
    return '<aside class="ac ac-hlpanel ac-hlpanel--rail" data-ac-component="highlights" data-view="rail" data-state="' + state + '">' +
      '<header class="ac-hlpanel__head">' +
        '<div class="ac-hlpanel__intro">' + kicker("Tus marcas") + "<h3>Mis subrayados</h3></div>" +
        (counts.total
          ? '<span class="ac-countbadge"><span aria-hidden="true">' + counts.total + "</span>" +
            '<span class="ac-sr"> ' + counts.total + " " + plural(counts.total, "subrayado", "subrayados") + " en esta ficha</span></span>"
          : "") +
      "</header>" + rows +
      (counts.total > limit
        ? '<button class="ac-hlrail__more" type="button" data-ac-action="highlights:showall">Ver ' +
          (counts.total === 1 ? "el subrayado" : "los " + counts.total + " subrayados") + "</button>"
        : "") +
      "</aside>";
  }

  /* ------------------------------------------------------------------ */
  /* 4 · Pausa de recuerdo + interruptor global                          */
  /* ------------------------------------------------------------------ */

  function pauseStateOf(o) {
    return U.oneOf(o.state, ["ask", "revealed", "rated", "skipped", "saving", "error"], "ask");
  }

  function recallPause(opts) {
    var o = opts || {};
    var state = pauseStateOf(o);
    var base = U.idOf(o, "acpause");
    var source = [U.str(o.sheetTitle), U.str(o.sectionTitle)].filter(Boolean).join(" · ");
    var rating = A.ratings.get(o.rating);
    var answerText = U.str(o.answer);
    var question = U.str(o.question) || "¿Qué recuerdas de esta sección?";
    var freeAnswer = U.str(o.freeAnswer);
    var tone = rating ? rating.tone : "warn";
    var ratingId = base + "-rating";
    var reveal = state === "revealed" || state === "rated" || state === "saving" || state === "error";

    var freeField = "";
    if (state === "ask") {
      freeField = '<label class="ac-field ac-pause__field" for="' + esc(base) + '-answer">' +
          '<span class="ac-field__label">Tu respuesta <span class="ac-field__optional">(opcional)</span></span>' +
          '<textarea class="ac-textarea" id="' + esc(base) + '-answer" rows="2" data-ac-input="answer" ' +
            'placeholder="Escríbelo si te ayuda, o solo piénsalo"></textarea>' +
        "</label>";
    } else if (freeAnswer) {
      freeField = '<div class="ac-pause__given"><span class="ac-kicker">Tu respuesta</span><p>' + esc(freeAnswer) + "</p></div>";
    }

    var revealedBlock = reveal
      ? '<div class="ac-pause__answer" data-ac-focus="answer" tabindex="-1" aria-labelledby="' + esc(base) + '-answerlabel">' +
          '<span class="ac-kicker" id="' + esc(base) + '-answerlabel">Respuesta</span>' +
          "<p>" + esc(answerText) + "</p>" +
          '<span class="ac-pause__origin">' + icon("cards", 12) + " Tomada de las tarjetas de esta ficha</span>" +
        "</div>"
      : "";

    var rateBlock = "";
    if (state === "revealed") {
      rateBlock = '<div class="ac-ratings" role="group" aria-labelledby="' + esc(ratingId) + '">' +
        '<p class="ac-ratings__q" id="' + esc(ratingId) + '">¿Qué tan cerca estuviste?</p>' +
        '<div class="ac-ratings__opts">' + A.ratings.list().map(function (r) {
          return '<button class="ac-rating" type="button" data-ac-action="recall:rate" data-value="' + esc(r.key) + '" data-tone="' + esc(r.tone) + '">' +
            '<span class="ac-rating__ico" aria-hidden="true">' + icon(r.icon, 19) + "</span>" +
            '<span class="ac-rating__label">' + esc(r.label) + "</span></button>";
        }).join("") + "</div></div>";
    }

    var ratedBlock = "";
    if (state === "rated" && rating) {
      ratedBlock = '<div class="ac-pause__rated" data-tone="' + esc(tone) + '" role="status">' +
        '<span class="ac-pause__ratedico" aria-hidden="true">' + icon(rating.icon, 18) + "</span>" +
        '<div><b>Anotado: ' + esc(rating.label) + "</b>" +
        "<span>Solo registra tu autoevaluación; no mueve tarjetas ni cajas.</span></div></div>";
    } else if (state === "saving") {
      ratedBlock = statusLine("Guardando tu autoevaluación…", "muted", "rotate");
    } else if (state === "error") {
      ratedBlock = alertBox({
        tone: "error", title: "No se pudo guardar la autoevaluación",
        text: U.str(o.error) || "Puedes seguir leyendo; inténtalo de nuevo más tarde.",
        action: { label: "Reintentar", action: "recall:retry", icon: "rotate", variant: "soft", size: "sm" }
      });
    } else if (state === "skipped") {
      ratedBlock = '<div class="ac-pause__skipped" role="status">' + icon("skip", 15) +
        "<span>Pausa saltada. Puedes volver cuando quieras.</span></div>";
    }

    var primary = "";
    if (state === "ask") {
      primary = '<button class="ac-btn ac-btn--primary" type="button" data-ac-action="recall:reveal">' +
        '<span class="ac-btn__ico" aria-hidden="true">' + icon("eye", 15) + "</span>Revelar la respuesta</button>";
    } else if (state === "skipped") {
      primary = '<button class="ac-btn ac-btn--soft" type="button" data-ac-action="recall:reopen">' +
        '<span class="ac-btn__ico" aria-hidden="true">' + icon("undo", 15) + "</span>Reabrir la pausa</button>";
    } else if (state === "rated") {
      primary = '<button class="ac-btn ac-btn--ghost" type="button" data-ac-action="recall:close">' +
        '<span class="ac-btn__ico" aria-hidden="true">' + icon("check", 15) + "</span>Cerrar</button>";
    }

    return '<section class="ac ac-pause" data-ac-component="recall-pause" data-state="' + state + '" data-tone="' + esc(tone) + '"' +
      (o.cardId ? ' data-ac-id="' + esc(o.cardId) + '"' : "") + ' aria-labelledby="' + esc(base) + '-q">' +
      '<header class="ac-pause__head">' +
        '<div class="ac-pause__kicker">' + kicker("Pausa de recuerdo", true) +
          (source ? '<span class="ac-pause__source">' + esc(source) + "</span>" : "") +
        "</div>" +
        '<button class="ac-btn ac-btn--quiet ac-btn--sm" type="button" data-ac-action="recall:skip">' +
          '<span class="ac-btn__ico" aria-hidden="true">' + icon("skip", 14) + "</span>Saltar</button>" +
      "</header>" +
      '<h3 class="ac-pause__q" id="' + esc(base) + '-q">' + esc(question) + "</h3>" +
      freeField + revealedBlock + rateBlock + ratedBlock +
      '<footer class="ac-pause__foot">' + primary +
        '<p class="ac-pause__scope">' + icon("cards", 13) + " Esta pausa no toca tus cajas de Flashcards.</p>" +
      "</footer>" +
      "</section>";
  }

  function recallSwitch(opts) {
    var o = opts || {};
    var base = U.idOf(o, "acsw");
    var state = U.oneOf(o.state, ["ready", "saving", "error"], "ready");
    var enabled = o.enabled !== false;
    var freq = U.num(o.frequency, 3);
    if ([1, 2, 3].indexOf(freq) === -1) freq = 3;
    var saving = state === "saving";
    var explain = freq === 1
      ? "Una pausa al cerrar cada sección esencial."
      : "Una pausa al cerrar 1 de cada " + freq + " secciones esenciales.";
    var freqButtons = [1, 2, 3].map(function (n) {
      var label = n === 1 ? "Cada sección" : "Cada " + n;
      var srLabel = n === 1 ? "Una pausa en cada sección" : "Una pausa cada " + n + " secciones";
      return '<button class="ac-seg__btn" type="button" role="radio" aria-checked="' + (freq === n ? "true" : "false") + '"' +
        ' aria-label="' + esc(srLabel) + '" data-ac-action="recall:freq" data-value="' + n + '"' +
        (enabled && !saving ? "" : " disabled") + ' tabindex="' + (freq === n ? "0" : "-1") + '">' +
        esc(label) + "</button>";
    }).join("");
    return '<section class="ac ac-rswitch" data-ac-component="recall-switch" data-state="' + state + '"' +
      ' data-enabled="' + (enabled ? "true" : "false") + '">' +
      '<div class="ac-rswitch__head">' +
        '<div class="ac-rswitch__copy">' + kicker("Recordar al cerrar", true) +
          '<h3 id="' + esc(base) + '-title">Pausa de recuerdo</h3>' +
          "<p>Una pregunta corta al cerrar las secciones esenciales, con la respuesta a un toque. No cambia tus tarjetas.</p>" +
        "</div>" +
        '<button class="ac-switch" type="button" role="switch" aria-checked="' + (enabled ? "true" : "false") + '"' +
          ' aria-labelledby="' + esc(base) + '-title" data-ac-action="recall:switch"' + (saving ? " disabled" : "") + ">" +
          '<span class="ac-switch__track" aria-hidden="true"><span class="ac-switch__thumb"></span></span>' +
          '<span class="ac-switch__text">' + (enabled ? "Activada" : "Desactivada") + "</span>" +
        "</button>" +
      "</div>" +
      '<div class="ac-rswitch__freq" aria-disabled="' + (enabled ? "false" : "true") + '">' +
        '<span class="ac-field__label">Frecuencia</span>' +
        '<div class="ac-seg" role="radiogroup" aria-label="Cada cuántas secciones esenciales aparece la pausa">' + freqButtons + "</div>" +
        '<p class="ac-rswitch__explain" role="status">' + esc(explain) +
          (enabled ? " Siempre puedes saltarla." : " Actívala para elegir la frecuencia.") + "</p>" +
      "</div>" +
      (state === "error" ? alertBox({ tone: "error", title: "No se pudo guardar la preferencia", text: "Se aplicará solo en esta sesión." }) : "") +
      '<p class="ac-rswitch__persist">' + icon("lock", 12) + " La preferencia se guarda en este navegador.</p>" +
      "</section>";
  }

  /* ------------------------------------------------------------------ */
  /* 5 · Modo recordar                                                   */
  /* ------------------------------------------------------------------ */

  function recallMode(opts) {
    var o = opts || {};
    var base = U.idOf(o, "acrm");
    var concepts = (o.concepts || []).map(U.str).filter(function (c) { return c; });
    var revealed = o.revealed || [];
    var isRevealed = function (i) { return !!revealed[i]; };
    var total = concepts.length;
    var shown = 0;
    concepts.forEach(function (_, i) { if (isRevealed(i)) shown += 1; });
    var allShown = total > 0 && shown === total;
    var state = !total ? "empty" : allShown ? "revealed" : shown ? "partial" : "hidden";

    var items = concepts.map(function (concept, i) {
      var on = isRevealed(i);
      var num = String(i + 1).padStart(2, "0");
      return '<li class="ac-rmode__item">' +
        '<button class="ac-concept" type="button" data-ac-action="memory:toggle" data-index="' + i + '"' +
          ' data-state="' + (on ? "revealed" : "hidden") + '" aria-pressed="' + (on ? "true" : "false") + '"' +
          ' aria-label="Concepto ' + (i + 1) + " de " + total + ", " + (on ? "revelado. Activar para ocultar." : "oculto. Activar para revelar.") + '">' +
          '<span class="ac-concept__top">' +
            '<span class="ac-concept__num" aria-hidden="true">' + num + "</span>" +
            '<span class="ac-concept__badge" aria-hidden="true">' +
              (on ? icon("eye", 12) + " Revelado" : icon("eyeOff", 12) + " Oculto") +
            "</span>" +
          "</span>" +
          '<span class="ac-concept__text">' + esc(concept) + "</span>" +
          '<span class="ac-concept__veil" aria-hidden="true">' +
            '<span class="ac-concept__veilcopy">' + icon("lock", 13) + " Toca para revelar</span>" +
          "</span>" +
        "</button></li>";
    }).join("");

    return '<section class="ac ac-rmode" data-ac-component="recall-mode" data-state="' + state + '"' +
      ' aria-labelledby="' + esc(base) + '-title">' +
      '<header class="ac-rmode__head">' +
        '<div>' + kicker("Modo recordar", true) +
          '<h2 id="' + esc(base) + '-title">' + esc(U.str(o.title) || "Conceptos clave") + "</h2>" +
          '<p class="ac-rmode__sub">' + esc(U.str(o.subtitle) || "Intenta decirlos antes de revelar. La ficha queda a la vista.") + "</p>" +
        "</div>" +
        '<div class="ac-rmode__tools">' +
          '<span class="ac-rmode__count" role="status">' + shown + " de " + total + " " + plural(total, "revelado", "revelados") + "</span>" +
          (total
            ? '<button class="ac-btn ac-btn--ghost ac-btn--sm" type="button" data-ac-action="' + (allShown ? "memory:none" : "memory:all") + '">' +
              '<span class="ac-btn__ico" aria-hidden="true">' + icon(allShown ? "eyeOff" : "eye", 14) + "</span>" +
              (allShown ? "Ocultar todos" : "Mostrar todos") + "</button>"
            : "") +
        "</div>" +
      "</header>" +
      (total
        ? '<ol class="ac-rmode__grid">' + items + "</ol>"
        : stateCard({ tone: "empty", icon: "brain", title: "Esta ficha no tiene conceptos clave", text: "Cuando existan, aparecerán aquí para practicar el recuerdo." })) +
      '<footer class="ac-rmode__foot">' +
        '<span class="ac-hint">' + icon("keyboard", 12) + " Tab para recorrer · Enter o toque para revelar</span>" +
        '<span class="ac-hint">' + icon("eyeOff", 12) + " Oculto · " + icon("eye", 12) + " Revelado</span>" +
      "</footer>" +
      "</section>";
  }

  /* ------------------------------------------------------------------ */
  /* 6 · Selector de confianza                                           */
  /* ------------------------------------------------------------------ */

  function confidencePicker(opts) {
    var o = opts || {};
    var state = U.oneOf(o.state, ["idle", "selected", "saving", "saved", "error", "disabled"], "idle");
    var value = A.confidence.has(o.value) ? o.value : null;
    if (state === "selected" && !value) state = "idle";
    if (state === "saved" && !value) state = "idle";
    var base = U.idOf(o, "acconf");
    var disabled = state === "disabled" || state === "saving";
    var saving = state === "saving";
    var labelId = base + "-label";
    var selectedMeta = value ? A.confidence.get(value) : null;
    var options = A.confidence.list().map(function (c) {
      var checked = value === c.key;
      var tab = checked || (!value && c.key === "solid") ? "0" : "-1";
      return '<button class="ac-conf__opt" type="button" role="radio" aria-checked="' + (checked ? "true" : "false") + '"' +
        ' data-ac-action="confidence:pick" data-value="' + esc(c.key) + '" data-tone="' + esc(c.tone) + '"' +
        ' tabindex="' + tab + '"' + (disabled ? " disabled" : "") + ">" +
        '<span class="ac-conf__ico" aria-hidden="true">' + icon(c.icon, 18) + "</span>" +
        '<span class="ac-conf__text"><b>' + esc(c.label) + "</b><small>" + esc(c.hint) + "</small></span>" +
        '<span class="ac-conf__check" aria-hidden="true">' + icon("check", 13) + "</span>" +
        "</button>";
    }).join("");

    var actions = "";
    var status = "";
    if (state === "idle") {
      actions = '<button class="ac-btn ac-btn--quiet ac-btn--sm" type="button" data-ac-action="confidence:dismiss">Ahora no</button>';
    } else if (state === "selected") {
      status = statusLine("Elegiste «" + (selectedMeta ? selectedMeta.label : "") + "». Guárdalo cuando quieras.", "muted");
      actions = '<button class="ac-btn ac-btn--quiet ac-btn--sm" type="button" data-ac-action="confidence:dismiss">Ahora no</button>' +
        '<button class="ac-btn ac-btn--primary ac-btn--sm" type="button" data-ac-action="confidence:save">' +
        '<span class="ac-btn__ico" aria-hidden="true">' + icon("check", 14) + "</span>Guardar</button>";
    } else if (state === "saving") {
      status = statusLine("Guardando…", "muted", "rotate");
      actions = '<button class="ac-btn ac-btn--primary ac-btn--sm" type="button" disabled><span class="ac-spinner" aria-hidden="true"></span>Guardando…</button>';
    } else if (state === "saved") {
      status = statusLine("Guardado" + (U.relative(o.updatedAt) ? " · " + U.relative(o.updatedAt) : ""), "ok", "checkCircle");
      actions = '<button class="ac-btn ac-btn--quiet ac-btn--sm" type="button" data-ac-action="confidence:clear">Quitar</button>' +
        '<button class="ac-btn ac-btn--ghost ac-btn--sm" type="button" data-ac-action="confidence:edit">Cambiar</button>';
    } else if (state === "error") {
      status = alertBox({
        tone: "error", title: "No se pudo guardar la confianza",
        text: U.str(o.error) || "Tu lectura no se bloquea. Reintenta cuando puedas.",
        action: { label: "Reintentar", action: "confidence:save", icon: "rotate", variant: "soft", size: "sm" }
      });
      actions = '<button class="ac-btn ac-btn--quiet ac-btn--sm" type="button" data-ac-action="confidence:dismiss">Ahora no</button>';
    } else if (state === "disabled") {
      status = statusLine("La ficha aún no está completada. Marca «Completada» para responder.", "muted", "info");
      actions = "";
    }

    return '<section class="ac ac-conf" data-ac-component="confidence" data-state="' + state + '"' +
      (value ? ' data-value="' + esc(value) + '"' : "") +
      (o.sheetId ? ' data-ac-id="' + esc(o.sheetId) + '"' : "") +
      ' aria-labelledby="' + esc(labelId) + '">' +
      '<div class="ac-conf__intro">' + kicker("Al terminar", true) +
        '<div class="ac-conf__titleline">' +
          '<h3 id="' + esc(labelId) + '">' + esc(U.str(o.title) || "¿Cómo te sientes con esta ficha?") + "</h3>" +
          '<span class="ac-chip ac-chip--quiet">Opcional</span>' +
        "</div>" +
        '<p class="ac-conf__hint">' + esc(U.str(o.hint) || "Puedes cambiarlo más tarde; esta pregunta no interrumpe la lectura.") + "</p>" +
      "</div>" +
      '<div class="ac-conf__opts" role="radiogroup" aria-labelledby="' + esc(labelId) + '"' +
        (disabled ? ' aria-disabled="true"' : "") + ">" + options + "</div>" +
      '<div class="ac-conf__foot">' +
        '<div class="ac-conf__statuswrap">' + status + "</div>" +
        '<div class="ac-conf__actions">' + actions + "</div>" +
      "</div>" +
      "</section>";
  }

  /* ------------------------------------------------------------------ */
  /* Exportación                                                         */
  /* ------------------------------------------------------------------ */

  A.components = {
    selectionBar: selectionBar,
    readingParagraph: readingParagraph,
    noteCard: noteCard,
    highlightsPanel: highlightsPanel,
    recallPause: recallPause,
    recallSwitch: recallSwitch,
    recallMode: recallMode,
    confidencePicker: confidencePicker,
    stateCard: stateCard,
    skeleton: skeleton,
    alert: alertBox,
    markBadge: markBadge,
    quote: quoteBlock,
    kicker: kicker,
    actionButton: actionButton,
    statusLine: statusLine
  };

  A.query = {
    highlights: filterAnnotations
  };
})(window);
