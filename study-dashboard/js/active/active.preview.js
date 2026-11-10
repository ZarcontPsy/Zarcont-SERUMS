/* Study Dashboard — Lectura activa · demostración del previsualizador
   © 2026 ZARCONT · material interno, NO se carga en la app.

   La demo usa párrafos, conceptos y tarjetas reales de study-data/temario.js.
   Las notas y los sellos de tiempo son de ejemplo: el contenido clínico no se
   inventa en ningún caso. Todo lo que parece persistencia vive solo en esta
   página (o en localStorage con prefijo ac-preview-). */
(function (global) {
  "use strict";

  var A = global.StudyActive;
  var C = A && A.components;
  var B = A && A.behavior;
  var U = A && A.util;
  var esc = U.esc;

  var doc = global.document;
  function $(sel, root) { return (root || doc).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); }

  /* ------------------------------------------------------------------ */
  /* Datos reales del temario                                            */
  /* ------------------------------------------------------------------ */

  var content = global.STUDY_CONTENT;
  var sheets = [];

  function findSheet(id) {
    for (var i = 0; i < sheets.length; i += 1) if (sheets[i].id === id) return sheets[i];
    return null;
  }

  function sheetBy(predicate, fallbackIndex) {
    for (var i = 0; i < sheets.length; i += 1) if (predicate(sheets[i])) return sheets[i];
    return sheets[fallbackIndex] || sheets[0];
  }

  function firstBody(sheet) {
    var sections = (sheet && sheet.sections) || [];
    for (var i = 0; i < sections.length; i += 1) {
      var body = sections[i].body || [];
      if (body.length) return { text: body[0], sectionIndex: i, sectionTitle: sections[i].title };
    }
    if (sections.length) return { text: sections[0].title, sectionIndex: 0, sectionTitle: sections[0].title };
    return { text: sheet ? sheet.summary : "", sectionIndex: 0, sectionTitle: "" };
  }

  function nthBody(sheet, n) {
    var sections = (sheet && sheet.sections) || [];
    var count = 0;
    for (var i = 0; i < sections.length; i += 1) {
      var body = sections[i].body || [];
      for (var j = 0; j < body.length; j += 1) {
        if (count === n) return { text: body[j], sectionIndex: i, sectionTitle: sections[i].title };
        count += 1;
      }
    }
    return firstBody(sheet);
  }

  function demoCard(sheet) {
    var cards = (content && content.cards) || [];
    var own = cards.filter(function (c) { return c.sheetId === sheet.id; });
    var concept = own.filter(function (c) { return c.type === "concept" && c.answer; })[0];
    var card = concept || own[0];
    if (!card) return null;
    var answer = card.answer;
    if (!answer && card.options && typeof card.correctIndex === "number") {
      answer = card.options[card.correctIndex] + (card.explanation ? " " + card.explanation : "");
    }
    return {
      id: card.id,
      question: card.prompt,
      answer: answer || card.explanation || ""
    };
  }

  function hoursAgo(hours) {
    return new Date(Date.now() - hours * 3600 * 1000).toISOString();
  }

  var data = {
    sheetA: null, sheetB: null, sheetC: null,
    paraA: null, paraA2: null, paraB: null, paraC: null,
    card: null
  };

  function buildData() {
    sheets = (content && content.sheets) || [];
    data.sheetA = findSheet("sheet-aps-01") || sheetBy(function (s) { return s.areaId === "area-aps"; }, 0);
    data.sheetB = findSheet("sheet-depresion-01") || sheetBy(function (s) { return s.areaId === "area-depresion"; }, 10);
    data.sheetC = sheetBy(function (s) { return s.areaId === "area-psi-etica"; }, 80);
    data.paraA = firstBody(data.sheetA);
    data.paraA2 = nthBody(data.sheetA, 1);
    data.paraB = firstBody(data.sheetB);
    data.paraC = firstBody(data.sheetC);
    data.card = demoCard(data.sheetA);
  }

  function sourceLabel(sheet, part, short) {
    var alpha = sheet ? (sheet.kicker || sheet.title || "") : "";
    if (short) return alpha;
    return [alpha, part ? part.sectionTitle : ""].filter(Boolean).join(" · ");
  }

  /* Los textos de nota son ejemplos de la persona que estudia, no contenido
     clínico. Las citas son párrafos literales del temario. */
  var annotations = [];
  var contextBank = {};

  function buildAnnotations() {
    var now = Date.now();
    function ann(id, sheet, part, color, note, hours, extra) {
      var item = {
        id: id,
        sheetId: sheet ? sheet.id : "sheet-demo-inexistente",
        sheetTitle: sheet ? sheet.title : "",
        areaId: sheet ? sheet.areaId : "",
        sectionTitle: part ? part.sectionTitle : "",
        sectionIndex: part ? part.sectionIndex : 0,
        paragraphIndex: 0,
        color: color,
        quote: part ? part.text : "",
        note: note || "",
        updatedAt: new Date(now - hours * 3600 * 1000).toISOString(),
        href: "#demo-contexto",
        deleted: false
      };
      if (extra) Object.keys(extra).forEach(function (k) { item[k] = extra[k]; });
      contextBank[id] = {
        sheetTitle: sheet ? sheet.title : "",
        kicker: sheet ? (sheet.kicker || sheet.title) : "",
        sectionTitle: part ? part.sectionTitle : "",
        paragraph: part ? part.text : "",
        quote: item.quote
      };
      return item;
    }
    annotations = [
      ann("ann-demo-1", data.sheetA, data.paraA, "important", "", 2),
      ann("ann-demo-2", data.sheetA, data.paraA2, "understand",
        "Relacionarlo con el ejemplo de la sección siguiente.", 26),
      ann("ann-demo-3", data.sheetB, data.paraB, "review", "", 72),
      ann("ann-demo-4", data.sheetC, data.paraC, "doubt",
        "Preguntar esto en el repaso del sábado.", 6),
      ann("ann-demo-5", data.sheetB, data.paraB, "important",
        "La sección cambió de sitio; la cita sigue siendo válida.", 216,
        { orphan: "missing-anchor" }),
      ann("ann-demo-6", null, data.paraA, "review",
        "", 288, {
          orphan: "missing-sheet",
          sheetTitle: "Ficha retirada del temario",
          href: ""
        })
    ];
  }

  /* ------------------------------------------------------------------ */
  /* Estado de la demo                                                   */
  /* ------------------------------------------------------------------ */

  var demo = {
    theme: "dark",
    width: "auto",
    deviceWidth: 390,
    note: {
      mode: "view", state: "idle", note: "", value: "",
      updatedAt: hoursAgo(2),
      annotationId: "ann-demo-2", color: "understand", quote: null, source: null
    },
    hl: { colors: [], scope: "all", query: "", mode: "all", context: null },
    sel: {
      open: false, variant: "floating", state: "ready", color: "important",
      noteOpen: false, note: "", quote: "", source: "", error: "",
      anchor: null, layer: null, trap: null, lastFocus: null,
      keyHints: false, forceError: false
    },
    pause: { state: "ask", rating: null, free: "", error: "", closed: false },
    sw: { enabled: true, freq: 3, state: "ready" },
    memory: { revealed: {} },
    conf: { value: null, state: "idle", updatedAt: null, dismissed: false },
    undo: null
  };

  var store = {
    get: function (key, fallback) {
      try {
        var raw = global.localStorage.getItem("ac-preview-" + key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { global.localStorage.setItem("ac-preview-" + key, JSON.stringify(value)); } catch (e) {}
    }
  };

  /* ------------------------------------------------------------------ */
  /* Anuncios y registro                                                 */
  /* ------------------------------------------------------------------ */

  var logCount = 0;

  function announce(text) {
    var sink = $("#demo-live");
    if (B) B.announce(sink, text);
  }

  function log(action, detail) {
    var list = $("#demo-log");
    if (!list) return;
    logCount += 1;
    var li = doc.createElement("li");
    li.className = "ac-preview__logitem";
    var time = new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    li.innerHTML = '<time datetime="' + new Date().toISOString() + '">' + esc(time) + "</time>" +
      "<code>" + esc(action) + "</code>" +
      "<span>" + esc(detail || "") + "</span>";
    list.insertBefore(li, list.firstChild);
    while (list.children.length > 16) list.removeChild(list.lastChild);
    var count = $("#demo-log-count");
    if (count) count.textContent = String(logCount);
    announce(action + (detail ? ": " + detail : ""));
  }

  /* ------------------------------------------------------------------ */
  /* Agentes de la demo                                                  */
  /* ------------------------------------------------------------------ */

  function themeMeta(theme) {
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#F3F0E8" : "#0B0B0D");
  }

  function applyTheme(theme) {
    demo.theme = theme === "light" ? "light" : "dark";
    doc.documentElement.dataset.theme = demo.theme;
    themeMeta(demo.theme);
    store.set("theme", demo.theme);
    $$("[data-demo='theme']").forEach(function (el) {
      el.setAttribute("aria-pressed", String(el.getAttribute("data-value") === demo.theme));
    });
  }

  function applyWidth(width) {
    demo.width = width;
    if (width === "auto") doc.documentElement.style.removeProperty("--ac-preview-w");
    else doc.documentElement.style.setProperty("--ac-preview-w", width + "px");
    $$("[data-demo='width']").forEach(function (el) {
      el.setAttribute("aria-pressed", String(el.getAttribute("data-value") === demo.width));
    });
    var label = $("#demo-width-label");
    if (label) label.textContent = width === "auto" ? "fluido" : width + " px";
  }

  function applyDeviceWidth(width) {
    demo.deviceWidth = width;
    var device = $("#demo-device .ac-device");
    if (device) device.style.width = width + "px";
    var label = $("#demo-device-label");
    if (label) label.textContent = width + " px";
    $$("[data-demo='device-width']").forEach(function (el) {
      el.setAttribute("aria-pressed", String(Number(el.getAttribute("data-value")) === demo.deviceWidth));
    });
  }

  /* ------------------------------------------------------------------ */
  /* 1 · Selección                                                       */
  /* ------------------------------------------------------------------ */

  function excerptHTML() {
    var sheet = data.sheetA;
    return '<div class="ac ac-read">' +
      '<div class="ac-read__head">' +
        '<span class="ac-kicker"><span class="ac-dot" aria-hidden="true"></span>' +
          esc((data.sheetA && data.sheetA.level) || "Lectura") + " · " + esc(String((data.sheetA && data.sheetA.minutes) || 6)) + " min</span>" +
        '<h3 class="ac-read__title">' + esc(sheet ? sheet.title : "Ficha") + "</h3>" +
        '<p class="ac-read__summary">' + esc(sheet ? sheet.summary : "") + "</p>" +
      "</div>" +
      C.readingParagraph({ id: "ac-preview-para-1", index: 0, text: data.paraA.text, sheetTitle: sheet.title }) +
      C.readingParagraph({ id: "ac-preview-para-2", index: 1, text: data.paraA2.text, sheetTitle: sheet.title }) +
      '<p class="ac-read__hint">' + A.icon("keyboard", 13) +
        " Selecciona texto con el ratón o entra con Tab al botón de cada párrafo. La barra también responde a 1–4 y a Esc.</p>" +
      "</div>";
  }

  function selectionBarHTML(opts) {
    var o = opts || {};
    return C.selectionBar({
      id: o.id || "ac-preview-bar",
      variant: o.variant || demo.sel.variant,
      state: o.state || demo.sel.state,
      color: o.color || demo.sel.color,
      quote: o.quote != null ? o.quote : demo.sel.quote,
      source: o.source != null ? o.source : demo.sel.source,
      noteOpen: o.noteOpen != null ? o.noteOpen : demo.sel.noteOpen,
      note: o.note != null ? o.note : demo.sel.note,
      error: o.error != null ? o.error : demo.sel.error,
      keyHints: o.keyHints != null ? o.keyHints : demo.sel.keyHints
    });
  }

  function renderSelectionDemo() {
    var host = $("#demo-selection-read");
    if (!host) return;
    host.innerHTML = excerptHTML();
    host.setAttribute("data-ready", "true");
  }

  function renderDevice() {
    var host = $("#demo-device .ac-device__content");
    if (!host) return;
    host.innerHTML =
      '<div class="ac-device__bar" aria-hidden="true"><span></span><span></span><span></span>' +
        '<b>#/ficha/' + esc(data.sheetA.id) + "</b></div>" +
      '<div class="ac ac-read ac-read--phone">' +
        '<span class="ac-kicker"><span class="ac-dot" aria-hidden="true"></span>Ficha del temario</span>' +
        '<h3 class="ac-read__title">' + esc(data.sheetA.title) + "</h3>" +
        '<p class="ac-read__summary">' + esc(U.excerpt(data.sheetA.summary, 170)) + "</p>" +
        '<p class="ac-device__para">' + esc(data.paraA.text) + "</p>" +
        '<button class="ac-btn ac-btn--soft ac-btn--block" type="button" data-ac-action="demo:sheet-open">' +
          '<span class="ac-btn__ico" aria-hidden="true">' + A.icon("highlighter", 15) + "</span>Abrir hoja táctil</button>" +
        '<p class="ac-device__hint">' + A.icon("info", 12) +
          " En móvil la barra se ancla abajo: no compite con el menú nativo de selección.</p>" +
      "</div>";
  }

  function selectionGallery() {
    var host = $("#demo-selection-gallery");
    if (!host) return;
    var quote = data.paraA2.text;
    var source = sourceLabel(data.sheetA, data.paraA2, true);
    function bar(id, state, color, extra) {
      var opts = { id: id, variant: "inline", state: state, color: color, quote: quote, source: source };
      if (extra) Object.keys(extra).forEach(function (k) { opts[k] = extra[k]; });
      return selectionBarHTML(opts);
    }
    function fig(caption, note, html) {
      return '<figure class="ac-preview__fig">' + html +
        '<figcaption><b>' + esc(caption) + "</b>" + (note ? "<span>" + esc(note) + "</span>" : "") + "</figcaption></figure>";
    }
    host.innerHTML = [
      fig("Listo", "Color elegido, sin nota.", bar("ac-gallery-1", "ready", "important")),
      fig("Con teclado", "Atajos 1–4 visibles en la ayuda.", bar("ac-gallery-2", "ready", "understand", { keyHints: true })),
      fig("Con nota", "El contador acompaña al campo opcional.", bar("ac-gallery-3", "ready", "review", { noteOpen: true, note: "Volver a esta cita." })),
      fig("Guardando", "El botón queda bloqueado mientras escribe.", bar("ac-gallery-4", "saving", "doubt")),
      fig("Guardado", "Confirmación explícita; se cierra sola en la app.", bar("ac-gallery-5", "saved", "important")),
      fig("Error", "Mensaje con reintento, sin perder la cita.", bar("ac-gallery-6", "error", "review",
        { error: "No se pudo guardar el subrayado. Tus datos siguen en el navegador." })),
      fig("Deshabilitado", "Sin selección o sin almacenamiento.", bar("ac-gallery-7", "disabled", "understand"))
    ].join("");
  }

  function mountBar(opts) {
    var o = opts || {};
    closeBar(false);
    demo.sel.open = true;
    demo.sel.variant = o.variant || "floating";
    demo.sel.state = "ready";
    demo.sel.color = o.color || "important";
    demo.sel.noteOpen = false;
    demo.sel.note = "";
    demo.sel.error = "";
    demo.sel.quote = o.quote || "";
    demo.sel.source = o.source || "";
    demo.sel.anchor = o.anchor || null;
    demo.sel.keyHints = !!o.keyHints;
    demo.sel.lastFocus = doc.activeElement;

    var sheet = demo.sel.variant === "sheet";
    var stage = sheet ? $("#demo-device .ac-device__stage") : doc.body;
    if (!stage) return;
    stage.insertAdjacentHTML("beforeend", selectionBarHTML());
    demo.sel.layer = stage.lastElementChild;
    var bar = demo.sel.layer.querySelector(".ac-selbar");
    if (!bar) return;

    if (sheet) {
      demo.sel.trap = B.trap(bar);
      var content = $("#demo-device .ac-device__content");
      if (content) content.setAttribute("inert", "");
      B.focusFirst(bar);
      log("abrir hoja", "selección táctil");
    } else {
      if (demo.sel.anchor) B.positionBar(bar, demo.sel.anchor, demo.sel.layer);
      if (o.focus) B.focusFirst(bar);
      log("abrir barra", o.variant === "keyboard" ? "desde el botón del párrafo" : "desde la selección");
    }
    announce("Barra de subrayado abierta.");
  }

  function renderBar(focusSelector) {
    if (!demo.sel.open || !demo.sel.layer) return;
    var stage = demo.sel.layer.parentNode;
    if (!stage) return;
    var anchor = demo.sel.anchor;
    var variant = demo.sel.variant;
    var sheet = variant === "sheet";
    if (demo.sel.trap) { demo.sel.trap.release(false); demo.sel.trap = null; }
    stage.removeChild(demo.sel.layer);
    stage.insertAdjacentHTML("beforeend", selectionBarHTML());
    demo.sel.layer = stage.lastElementChild;
    var bar = demo.sel.layer.querySelector(".ac-selbar");
    if (!bar) return;
    if (!sheet && anchor) B.positionBar(bar, anchor, demo.sel.layer);
    if (sheet) demo.sel.trap = B.trap(bar);
    if (focusSelector) {
      var el = bar.querySelector(focusSelector) || bar;
      if (el && el.focus) el.focus();
    }
  }

  function closeBar(restoreFocus) {
    if (demo.sel.trap) { demo.sel.trap.release(false); demo.sel.trap = null; }
    if (demo.sel.layer && demo.sel.layer.parentNode) demo.sel.layer.parentNode.removeChild(demo.sel.layer);
    demo.sel.layer = null;
    demo.sel.open = false;
    var content = $("#demo-device .ac-device__content");
    if (content) content.removeAttribute("inert");
    if (restoreFocus && demo.sel.lastFocus && doc.contains(demo.sel.lastFocus)) {
      try { demo.sel.lastFocus.focus({ preventScroll: true }); } catch (e) { demo.sel.lastFocus.focus(); }
    }
    demo.sel.lastFocus = null;
  }

  function submitSelection() {
    if (demo.sel.state === "saving" || demo.sel.state === "saved") return;
    demo.sel.state = "saving";
    renderBar('[data-ac-action="selection:submit"]');
    log("selection:submit", "M.color=" + demo.sel.color);
    global.setTimeout(function () {
      if (!demo.sel.open) return;
      if (demo.sel.forceError) {
        demo.sel.state = "error";
        demo.sel.error = "No se pudo guardar el subrayado. Reintenta.";
        renderBar('[data-ac-action="selection:submit"]');
        announce("No se pudo guardar el subrayado.");
        return;
      }
      demo.sel.state = "saved";
      demo.sel.error = "";
      renderBar('[data-ac-action="selection:close"]');
      announce("Subrayado guardado.");
      log("subrayado guardado", A.marks.label(demo.sel.color) + (demo.sel.note ? " · con nota" : ""));
    }, 550);
  }

  function openBarFromParagraph(button) {
    var index = Number(button.getAttribute("data-index")) || 0;
    var part = index === 0 ? data.paraA : data.paraA2;
    mountBar({
      variant: "floating",
      quote: part.text,
      source: sourceLabel(data.sheetA, part, true),
      anchor: button.getBoundingClientRect(),
      focus: true,
      keyHints: true,
      color: "important"
    });
  }

  /* ------------------------------------------------------------------ */
  /* 2 · Nota                                                            */
  /* ------------------------------------------------------------------ */

  function renderNote(focusSelector) {
    var host = $("#demo-note");
    if (!host) return;
    host.innerHTML = C.noteCard({
      id: "ac-preview-note",
      annotationId: demo.note.annotationId,
      color: demo.note.color,
      quote: demo.note.quote || data.paraA2.text,
      source: demo.note.source || sourceLabel(data.sheetA, data.paraA2),
      note: demo.note.mode === "edit" ? demo.note.value : demo.note.note,
      updatedAt: demo.note.updatedAt,
      mode: demo.note.mode,
      state: demo.note.state
    });
    if (focusSelector) {
      var el = host.querySelector(focusSelector);
      if (el && el.focus) el.focus();
    }
  }

  function setNoteState(kind) {
    if (kind === "view") { demo.note.mode = "view"; demo.note.state = "idle"; }
    else if (kind === "edit") { demo.note.mode = "edit"; demo.note.value = demo.note.note; demo.note.state = "idle"; }
    else if (kind === "saving") { demo.note.mode = "edit"; demo.note.value = demo.note.note; demo.note.state = "saving"; }
    else if (kind === "saved") { demo.note.mode = "view"; demo.note.state = "saved"; demo.note.updatedAt = hoursAgo(0); }
    else if (kind === "error") { demo.note.mode = "edit"; demo.note.state = "error"; }
    else if (kind === "disabled") { demo.note.mode = "view"; demo.note.state = "disabled"; }
    renderNote(kind === "edit" || kind === "error" ? "[data-ac-input='note']" : "");
    log("nota:estado", kind);
  }

  /* ------------------------------------------------------------------ */
  /* 3 · Mis subrayados                                                  */
  /* ------------------------------------------------------------------ */

  function scopeOptions() {
    var seen = {};
    var options = [{ value: "all", label: "Todas las fichas" }];
    annotations.forEach(function (a) {
      if (!a.sheetId || seen[a.sheetId] || a.orphan === "missing-sheet") return;
      seen[a.sheetId] = true;
      options.push({ value: a.sheetId, label: U.excerpt(a.sheetTitle, 38) });
    });
    return options;
  }

  function annotationsView() {
    if (demo.hl.mode === "empty") return [];
    if (demo.hl.mode === "orphans") return annotations.filter(function (a) { return a.orphan; });
    return annotations;
  }

  function renderHighlights(focusSelector) {
    var host = $("#demo-hl-full");
    if (!host) return;
    var state = demo.hl.mode === "empty" ? "empty" : demo.hl.mode === "loading" ? "loading" : demo.hl.mode === "error" ? "error" : "ready";
    host.innerHTML = C.highlightsPanel({
      id: "ac-preview-hl",
      annotations: annotationsView(),
      filters: demo.hl,
      scopes: demo.hl.mode === "all" || demo.hl.mode === "orphans" ? scopeOptions() : [],
      state: state,
      error: "El almacenamiento del navegador no respondió."
    });
    if (focusSelector) {
      var el = host.querySelector(focusSelector);
      if (el && el.focus) el.focus();
    }
    renderRail();
    renderUndo();
    renderContext();
  }

  function renderRail() {
    var host = $("#demo-hl-rail");
    if (!host) return;
    host.innerHTML = C.highlightsPanel({
      id: "ac-preview-hlrail",
      view: "rail",
      annotations: demo.hl.mode === "empty" ? [] : annotations,
      limit: 3,
      state: demo.hl.mode === "loading" ? "loading" : "ready"
    });
  }

  function renderUndo() {
    var host = $("#demo-hl-undo");
    if (!host) return;
    if (!demo.undo) { host.innerHTML = ""; return; }
    host.innerHTML = '<div class="ac-preview__undo" role="status">' +
      '<span>Subrayado retirado de la lista de demostración.</span>' +
      '<button class="ac-btn ac-btn--ghost ac-btn--sm" type="button" data-ac-action="highlights:undo">' +
      '<span class="ac-btn__ico" aria-hidden="true">' + A.icon("undo", 14) + "</span>Deshacer</button></div>";
  }

  function renderContext() {
    var host = $("#demo-hl-context");
    if (!host) return;
    if (!demo.hl.context) { host.innerHTML = ""; return; }
    var item = null;
    annotations.forEach(function (a) { if (a.id === demo.hl.context) item = a; });
    if (!item) { host.innerHTML = ""; return; }
    var bank = contextBank[item.id] || {};
    var missing = item.orphan === "missing-sheet";
    var body = missing
      ? '<div class="ac ac-alert ac-alert--warn" role="status">' + A.icon("alert", 16) +
        "<div><b>La ficha ya no existe en el temario</b><p>La cita se conserva. Puedes eliminarla o guardarla de nuevo en otra ficha cuando la recuperes.</p></div></div>"
      : '<blockquote class="ac-preview__contextquote" data-mark="' + esc(item.color) + '">' + esc(bank.paragraph || item.quote) + "</blockquote>" +
        '<p class="ac-preview__contextmeta">' + esc([bank.sheetTitle, bank.sectionTitle].filter(Boolean).join(" · ")) + "</p>";
    host.innerHTML = '<div class="ac ac-preview__context">' +
      '<div class="ac-preview__contexthead"><span class="ac-kicker"><span class="ac-dot" aria-hidden="true"></span>Contexto en la ficha</span>' +
      '<button class="ac-btn ac-btn--quiet ac-btn--sm" type="button" data-ac-action="highlights:context-close">Cerrar</button></div>' +
      body +
      '<p class="ac-preview__contexthint">' + A.icon("info", 12) + " En la app, «Ir al contexto» navega a la ficha y resalta el párrafo.</p>" +
      "</div>";
    host.setAttribute("data-ready", "true");
  }

  function highlightDemoState(kind) {
    demo.hl.mode = kind;
    demo.hl.context = null;
    renderHighlights();
    log("highlights:estado", kind);
  }

  /* ------------------------------------------------------------------ */
  /* 4 · Pausa de recuerdo                                               */
  /* ------------------------------------------------------------------ */

  function renderSwitch() {
    var host = $("#demo-rswitch");
    if (!host) return;
    host.innerHTML = C.recallSwitch({
      id: "ac-preview-switch",
      enabled: demo.sw.enabled,
      frequency: demo.sw.freq,
      state: demo.sw.state
    });
  }

  function renderPause(focusSelector) {
    var host = $("#demo-pause");
    if (!host) return;
    if (demo.pause.closed) {
      host.innerHTML = C.stateCard({
        tone: "empty", icon: "brain", title: "Pausa cerrada",
        text: "La pausa se mostró y se cerró. Puedes abrirla otra vez para revisar los estados.",
        actions: [{ label: "Reabrir pausa", action: "demo:pause-open", icon: "undo", variant: "soft" }]
      });
      return;
    }
    var card = data.card || { question: "¿Qué recuerdas de esta sección?", answer: "" };
    host.innerHTML = C.recallPause({
      id: "ac-preview-pause",
      cardId: card.id,
      question: card.question,
      answer: card.answer,
      freeAnswer: demo.pause.free,
      rating: demo.pause.rating,
      state: demo.pause.state,
      error: demo.pause.error,
      sheetTitle: data.sheetA ? data.sheetA.title : "",
      sectionTitle: data.paraA.sectionTitle
    });
    if (focusSelector) {
      var el = host.querySelector(focusSelector);
      if (el && el.focus) el.focus();
    }
  }

  function pauseState(kind) {
    demo.pause.state = kind;
    demo.pause.error = kind === "error" ? "No se pudo guardar la autoevaluación." : "";
    if (kind === "rated") demo.pause.rating = demo.pause.rating || "hard";
    if (kind === "ask") { demo.pause.rating = null; demo.pause.free = ""; }
    renderPause();
    log("pausa:estado", kind);
  }

  /* ------------------------------------------------------------------ */
  /* 5 · Modo recordar                                                   */
  /* ------------------------------------------------------------------ */

  function renderMemory(focusIndex) {
    var host = $("#demo-memory");
    if (!host) return;
    var concepts = (data.sheetA && data.sheetA.keyConcepts) || [];
    var revealed = [];
    concepts.forEach(function (_, i) { revealed.push(!!demo.memory.revealed[i]); });
    host.innerHTML = C.recallMode({
      id: "ac-preview-memory",
      concepts: concepts,
      revealed: revealed,
      title: "Conceptos clave",
      subtitle: "Intenta decirlos antes de revelar. Todo sale de la ficha abierta."
    });
    if (focusIndex != null) {
      var el = host.querySelector('[data-index="' + focusIndex + '"]');
      if (el && el.focus) el.focus();
    }
  }

  /* ------------------------------------------------------------------ */
  /* 6 · Confianza                                                       */
  /* ------------------------------------------------------------------ */

  function renderConfidence(focusSelector) {
    var host = $("#demo-conf");
    if (!host) return;
    if (demo.conf.dismissed) {
      host.innerHTML = C.stateCard({
        tone: "info", icon: "info", title: "Lo dejaste para después",
        text: "La confianza es opcional y no bloquea la lectura. Puedes responder cuando quieras.",
        actions: [{ label: "Responder ahora", action: "demo:conf-open", icon: "target", variant: "soft" }]
      });
      return;
    }
    host.innerHTML = C.confidencePicker({
      id: "ac-preview-conf",
      sheetId: data.sheetA ? data.sheetA.id : "",
      value: demo.conf.value,
      state: demo.conf.state,
      updatedAt: demo.conf.updatedAt,
      title: "¿Cómo te sientes con esta ficha?",
      hint: "Opcional. Puedes cambiarlo más tarde; esta pregunta no interrumpe la lectura."
    });
    if (focusSelector) {
      var el = host.querySelector(focusSelector);
      if (el && el.focus) el.focus();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Estados completos                                                   */
  /* ------------------------------------------------------------------ */

  function renderStates() {
    var host = $("#demo-states");
    if (!host) return;
    host.innerHTML =
      '<div class="ac-preview__grid2">' +
        '<div class="ac">' + C.stateCard({
          tone: "empty", icon: "highlighter", title: "Todavía no hay subrayados",
          text: "Marca un párrafo en cualquier ficha y aparecerá aquí con su cita y su nota.",
          actions: [{ label: "Volver a la lectura", action: "demo:none", icon: "arrowLeft" }]
        }) + "</div>" +
        '<div class="ac">' + C.stateCard({
          tone: "error", icon: "alert", title: "No se pudieron leer los subrayados",
          text: "El almacenamiento local no respondió. Tus notas siguen en el navegador.",
          actions: [{ label: "Reintentar", action: "demo:none", icon: "rotate", variant: "soft" }]
        }) + "</div>" +
        '<div class="ac">' + C.stateCard({
          tone: "success", icon: "checkCircle", title: "Subrayado guardado",
          text: "La cita y su nota quedaron asociadas a la anotación.",
          actions: [{ label: "Ir al contexto", action: "demo:none", icon: "cornerDown", variant: "ghost" }]
        }) + "</div>" +
        '<div class="ac ac-preview__loadingbox">' +
          '<span class="ac-kicker"><span class="ac-dot" aria-hidden="true"></span>Cargando</span>' +
          C.skeleton({ rows: 3, label: "Cargando subrayados" }) +
        "</div>" +
      "</div>" +
      '<div class="ac-preview__grid2 ac-preview__grid2--alerts">' +
        '<div class="ac">' + C.alert({ tone: "info", title: "La nota es opcional", text: "El subrayado se guarda igual, con o sin nota." }) + "</div>" +
        '<div class="ac">' + C.alert({ tone: "warn", icon: "linkOff", title: "Ancla perdida", text: "La ficha cambió; la cita y la nota se conservan." }) + "</div>" +
        '<div class="ac">' + C.alert({ tone: "error", title: "No se pudo guardar", text: "Reintenta cuando el navegador tenga espacio.", action: { label: "Reintentar", action: "demo:none", icon: "rotate", size: "sm", variant: "ghost" } }) + "</div>" +
      "</div>" +
      '<div class="ac-preview__grid2">' +
        '<div class="ac-preview__focusbox ac">' +
          '<span class="ac-kicker"><span class="ac-dot" aria-hidden="true"></span>Focus visible</span>' +
          '<p class="ac-preview__muted">Entra con Tab: el anillo ámbar solo aparece con teclado, nunca al hacer clic.</p>' +
          '<div class="ac-preview__focusrow">' +
            '<button class="ac-btn ac-btn--primary" type="button" data-ac-action="demo:none">Principal</button>' +
            '<button class="ac-btn ac-btn--ghost" type="button" data-ac-action="demo:none">Secundario</button>' +
            '<button class="ac-iconbtn" type="button" data-ac-action="demo:none" aria-label="Botón de icono de ejemplo">' + A.icon("highlighter", 16) + "</button>" +
          "</div>" +
          '<div class="ac-preview__focusrow">' +
            '<button class="ac-btn ac-btn--primary" type="button" disabled>Deshabilitado</button>' +
            '<button class="ac-btn ac-btn--ghost" type="button" aria-disabled="true">No disponible</button>' +
          "</div>" +
        "</div>" +
        '<div class="ac-preview__targets ac">' +
          '<span class="ac-kicker"><span class="ac-dot" aria-hidden="true"></span>Objetivos táctiles</span>' +
          '<p class="ac-preview__muted">Con puntero grueso, todo control de la biblioteca sube a 44 px de alto mínimo (--target-min).</p>' +
          '<table class="ac-preview__table">' +
            "<thead><tr><th>Control</th><th>Fino</th><th>Puntero grueso</th></tr></thead>" +
            "<tbody><tr><td>Botón</td><td>40 px</td><td>44 px</td></tr>" +
            "<tr><td>Botón pequeño</td><td>34 px</td><td>44 px</td></tr>" +
            "<tr><td>Botón de icono</td><td>34 px</td><td>44 px</td></tr>" +
            "<tr><td>Color de marca</td><td>60 px</td><td>56 px</td></tr>" +
            "<tr><td>Fila del rail</td><td>40 px</td><td>44 px</td></tr></tbody></table>" +
        "</div>" +
      "</div>";
  }

  /* ------------------------------------------------------------------ */
  /* Enlaces entre demostraciones                                        */
  /* ------------------------------------------------------------------ */

  function flash(element) {
    if (!element) return;
    element.classList.add("is-flash");
    global.setTimeout(function () { element.classList.remove("is-flash"); }, 1200);
  }

  function gotoContext(id) {
    var item = null;
    annotations.forEach(function (a) { if (a.id === id) item = a; });
    if (!item) return;
    demo.hl.context = id;
    renderContext();
    var host = $("#demo-hl-context");
    if (host) {
      if (host.scrollIntoView) host.scrollIntoView({ block: "nearest", behavior: "smooth" });
      flash($(".ac-preview__context", host));
    }
    log("highlights:goto", U.excerpt(item.sheetTitle, 40));
  }

  function openNoteFor(id) {
    var item = null;
    annotations.forEach(function (a) { if (a.id === id) item = a; });
    if (!item) return;
    var bank = contextBank[item.id] || {};
    demo.note.annotationId = item.id;
    demo.note.color = item.color;
    demo.note.quote = item.quote;
    demo.note.source = [bank.kicker || bank.sheetTitle, bank.sectionTitle].filter(Boolean).join(" · ");
    demo.note.mode = "view";
    demo.note.state = "idle";
    demo.note.note = item.note;
    demo.note.value = item.note;
    demo.note.updatedAt = item.updatedAt;
    renderNote();
    var section = $("#sec-nota");
    if (section && section.scrollIntoView) section.scrollIntoView({ block: "start", behavior: "smooth" });
    flash($("#demo-note .ac-note"));
    log("highlights:note", "abrir nota de " + U.excerpt(item.quote, 40));
  }

  /* ------------------------------------------------------------------ */
  /* Acciones                                                            */
  /* ------------------------------------------------------------------ */

  var click = {
    "selection:color": function (el) {
      demo.sel.color = el.getAttribute("data-color") || "important";
      demo.sel.state = "ready";
      renderBar('[data-color="' + demo.sel.color + '"]');
      announce("Color " + A.marks.label(demo.sel.color) + " elegido.");
    },
    "selection:note": function () {
      demo.sel.noteOpen = !demo.sel.noteOpen;
      if (!demo.sel.noteOpen) demo.sel.note = "";
      renderBar(demo.sel.noteOpen ? "[data-ac-input='note']" : "[data-ac-action='selection:note']");
    },
    "selection:submit": function () { submitSelection(); },
    "selection:cancel": function () { closeBar(true); log("selection:cancel"); },
    "selection:close": function () { closeBar(true); },
    "paragraph:open": function (el) { openBarFromParagraph(el); },

    "note:edit": function (el) {
      var item = null;
      annotations.forEach(function (a) { if (a.id === el.getAttribute("data-ac-id")) item = a; });
      if (item) {
        var bank = contextBank[item.id] || {};
        demo.note.annotationId = item.id;
        demo.note.color = item.color;
        demo.note.quote = item.quote;
        demo.note.source = [bank.kicker || bank.sheetTitle, bank.sectionTitle].filter(Boolean).join(" · ");
        demo.note.note = item.note;
      }
      demo.note.mode = "edit";
      demo.note.value = demo.note.note;
      demo.note.state = "idle";
      renderNote("[data-ac-input='note']");
      log("note:edit", "editar nota");
    },
    "note:cancel": function () {
      demo.note.mode = "view";
      demo.note.state = "idle";
      demo.note.value = demo.note.note;
      renderNote('[data-ac-action="note:edit"]');
    },
    "note:save": function () {
      demo.note.state = "saving";
      renderNote();
      log("note:save", String(demo.note.value.length) + " caracteres");
      global.setTimeout(function () {
        demo.note.note = demo.note.value;
        demo.note.mode = "view";
        demo.note.state = "saved";
        demo.note.updatedAt = hoursAgo(0);
        annotations.forEach(function (a) {
          if (a.id === demo.note.annotationId) { a.note = demo.note.note; a.updatedAt = demo.note.updatedAt; }
        });
        renderNote('[data-ac-action="note:edit"]');
        renderHighlights();
        announce("Nota guardada.");
      }, 550);
    },
    "note:clear": function () {
      demo.note.note = "";
      demo.note.value = "";
      demo.note.mode = "view";
      demo.note.state = "idle";
      annotations.forEach(function (a) {
        if (a.id === demo.note.annotationId) { a.note = ""; a.updatedAt = hoursAgo(0); }
      });
      renderNote('[data-ac-action="note:edit"]');
      renderHighlights();
      log("note:clear", "nota retirada de la anotación");
      announce("Nota retirada.");
    },
    "note:goto": function () { gotoContext(demo.note.annotationId); },

    "highlights:filter": function (el) {
      var color = el.getAttribute("data-color");
      if (color === "all") demo.hl.colors = [];
      else {
        var index = demo.hl.colors.indexOf(color);
        if (index === -1) demo.hl.colors.push(color);
        else demo.hl.colors.splice(index, 1);
      }
      renderHighlights();
      log("highlights:filter", color === "all" ? "todos" : color);
    },
    "highlights:clear": function () {
      demo.hl.colors = [];
      demo.hl.query = "";
      demo.hl.scope = "all";
      renderHighlights();
      log("highlights:clear");
    },
    "highlights:goto": function (el) { gotoContext(el.getAttribute("data-ac-id")); },
    "highlights:note": function (el) { openNoteFor(el.getAttribute("data-ac-id")); },
    "highlights:delete": function (el) {
      var id = el.getAttribute("data-ac-id");
      var index = -1;
      annotations.forEach(function (a, i) { if (a.id === id) index = i; });
      if (index === -1) return;
      demo.undo = { item: annotations[index], index: index };
      annotations.splice(index, 1);
      renderHighlights();
      log("highlights:delete", id);
    },
    "highlights:undo": function () {
      if (!demo.undo) return;
      annotations.splice(demo.undo.index, 0, demo.undo.item);
      demo.undo = null;
      renderHighlights();
      log("highlights:undo", "restaurado");
    },
    "highlights:back": function () {
      var section = $("#sec-seleccion");
      if (section && section.scrollIntoView) section.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    "highlights:showall": function () {
      var section = $("#sec-subrayados");
      if (section && section.scrollIntoView) section.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    "highlights:retry": function () {
      demo.hl.mode = "all";
      renderHighlights();
      log("highlights:retry");
    },

    "recall:reveal": function () {
      demo.pause.state = "revealed";
      demo.pause.error = "";
      renderPause('[data-ac-focus="answer"]');
      log("recall:reveal");
      announce("Respuesta revelada. Valora qué tan cerca estuviste.");
    },
    "recall:rate": function (el) {
      demo.pause.rating = el.getAttribute("data-value");
      demo.pause.state = "saving";
      renderPause();
      log("recall:rate", demo.pause.rating);
      global.setTimeout(function () {
        demo.pause.state = "rated";
        renderPause('[data-ac-action="recall:close"]');
        announce("Autoevaluación guardada.");
      }, 450);
    },
    "recall:skip": function () {
      demo.pause.state = "skipped";
      renderPause('[data-ac-action="recall:reopen"]');
      log("recall:skip");
      announce("Pausa saltada.");
    },
    "recall:close": function () {
      demo.pause.closed = true;
      renderPause();
      log("recall:close");
      announce("Pausa cerrada.");
    },
    "recall:reopen": function () {
      demo.pause.closed = false;
      demo.pause.state = "ask";
      demo.pause.rating = null;
      demo.pause.free = "";
      renderPause('[data-ac-action="recall:reveal"]');
      log("recall:reopen");
    },
    "recall:retry": function () {
      demo.pause.state = "saving";
      renderPause();
      global.setTimeout(function () {
        demo.pause.state = "rated";
        demo.pause.rating = demo.pause.rating || "good";
        renderPause('[data-ac-action="recall:close"]');
      }, 400);
    },
    "recall:switch": function () {
      demo.sw.enabled = !demo.sw.enabled;
      demo.sw.state = "saving";
      renderSwitch();
      store.set("recall", { enabled: demo.sw.enabled, frequency: demo.sw.freq });
      log("recall:switch", demo.sw.enabled ? "activada" : "desactivada");
      global.setTimeout(function () {
        demo.sw.state = "ready";
        renderSwitch();
      }, 400);
    },
    "recall:freq": function (el) {
      demo.sw.freq = Number(el.getAttribute("data-value")) || 3;
      renderSwitch();
      var picked = document.querySelector('#demo-rswitch [data-ac-action="recall:freq"][data-value="' + demo.sw.freq + '"]');
      if (picked) picked.focus();
      store.set("recall", { enabled: demo.sw.enabled, frequency: demo.sw.freq });
      log("recall:freq", "cada " + demo.sw.freq);
      announce(demo.sw.freq === 1 ? "Una pausa en cada sección." : "Una pausa cada " + demo.sw.freq + " secciones.");
    },

    "memory:toggle": function (el) {
      var i = Number(el.getAttribute("data-index"));
      demo.memory.revealed[i] = !demo.memory.revealed[i];
      renderMemory(i);
      log("memory:toggle", "concepto " + (i + 1) + ": " + (demo.memory.revealed[i] ? "revelado" : "oculto"));
    },
    "memory:all": function () {
      (data.sheetA.keyConcepts || []).forEach(function (_, i) { demo.memory.revealed[i] = true; });
      renderMemory();
      log("memory:all");
      announce("Todos los conceptos revelados.");
    },
    "memory:none": function () {
      demo.memory.revealed = {};
      renderMemory();
      log("memory:none");
      announce("Todos los conceptos ocultos.");
    },

    "confidence:pick": function (el) {
      demo.conf.value = el.getAttribute("data-value");
      demo.conf.state = "selected";
      renderConfidence('.ac-conf__opt[data-value="' + demo.conf.value + '"]');
      log("confidence:pick", demo.conf.value);
    },
    "confidence:save": function () {
      demo.conf.state = "saving";
      renderConfidence();
      log("confidence:save", demo.conf.value);
      global.setTimeout(function () {
        demo.conf.state = "saved";
        demo.conf.updatedAt = hoursAgo(0);
        renderConfidence('[data-ac-action="confidence:edit"]');
        announce("Confianza guardada.");
      }, 450);
    },
    "confidence:clear": function () {
      demo.conf.value = null;
      demo.conf.state = "idle";
      demo.conf.updatedAt = null;
      renderConfidence('.ac-conf__opt[data-value="solid"]');
      log("confidence:clear");
    },
    "confidence:dismiss": function () {
      demo.conf.dismissed = true;
      renderConfidence();
      log("confidence:dismiss");
    },
    "confidence:edit": function () {
      demo.conf.state = "selected";
      renderConfidence('.ac-conf__opt[data-value="' + demo.conf.value + '"]');
      log("confidence:edit");
    },
    "demo:conf-open": function (el) {
      var kind = el.getAttribute("data-value") || "idle";
      demo.conf.dismissed = false;
      if (kind === "idle") {
        demo.conf.value = null;
        demo.conf.state = "idle";
        demo.conf.updatedAt = null;
      } else if (kind === "selected") {
        demo.conf.value = demo.conf.value || "partial";
        demo.conf.state = "selected";
      } else if (kind === "saved") {
        demo.conf.value = demo.conf.value || "solid";
        demo.conf.state = "saved";
        demo.conf.updatedAt = hoursAgo(1);
      } else if (kind === "error") {
        demo.conf.value = demo.conf.value || "weak";
        demo.conf.state = "error";
      } else if (kind === "disabled") {
        demo.conf.state = "disabled";
      }
      renderConfidence();
      log("confidence:estado", kind);
    },

    "demo:theme": function (el) { applyTheme(el.getAttribute("data-value")); },
    "demo:width": function (el) { applyWidth(el.getAttribute("data-value")); },
    "demo:device-width": function (el) { applyDeviceWidth(Number(el.getAttribute("data-value"))); },
    "demo:note-state": function (el) { setNoteState(el.getAttribute("data-value")); },
    "demo:hl-state": function (el) { highlightDemoState(el.getAttribute("data-value")); },
    "demo:pause-state": function (el) { pauseState(el.getAttribute("data-value")); },
    "demo:pause-open": function () {
      demo.pause.closed = false;
      demo.pause.state = "ask";
      renderPause();
    },
    "demo:none": function () {},
    "demo:sel-open": function (el) {
      var index = Number(el.getAttribute("data-value")) || 0;
      var part = index === 0 ? data.paraA : data.paraA2;
      mountBar({
        variant: "floating",
        quote: part.text,
        source: sourceLabel(data.sheetA, part, true),
        anchor: el.getBoundingClientRect(),
        focus: true,
        keyHints: true
      });
    },
    "demo:sheet-open": function () {
      var part = data.paraA;
      mountBar({
        variant: "sheet",
        quote: part.text,
        source: sourceLabel(data.sheetA, part, true)
      });
    },
    "highlights:context-close": function () {
      demo.hl.context = null;
      renderContext();
    },
    "demo:log-clear": function () {
      var list = $("#demo-log");
      if (list) list.innerHTML = "";
      logCount = 0;
      var count = $("#demo-log-count");
      if (count) count.textContent = "0";
      announce("Registro vacío.");
    }
  };

  var input = {
    note: function (el) {
      var scope = el.closest('[data-ac-component="selection-bar"]');
      if (scope) {
        demo.sel.note = el.value;
      } else {
        demo.note.value = el.value;
      }
      var counter = el.parentNode.querySelector("[data-ac-note-count]") ||
        (el.closest("[data-ac-component]") || el.parentNode).querySelector("[data-ac-note-count]");
      if (counter) counter.textContent = el.value.length + "/280";
    },
    query: function (el) {
      var caret = el.selectionStart;
      demo.hl.query = el.value;
      renderHighlights();
      var next = $('#demo-hl-full [data-ac-input="query"]');
      if (next) {
        next.focus();
        try { next.setSelectionRange(caret, caret); } catch (e) {}
      }
    },
    answer: function (el) {
      demo.pause.free = el.value;
    }
  };

  var change = {
    scope: function (el) {
      demo.hl.scope = el.value;
      renderHighlights();
      var next = $('#demo-hl-full [data-ac-input="scope"]');
      if (next) next.focus();
      log("highlights:scope", el.value);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Teclado                                                             */
  /* ------------------------------------------------------------------ */

  function isEditable(el) {
    if (!el) return false;
    var tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
  }

  function onDocumentKeydown(e) {
    if (!demo.sel.open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeBar(true);
      log("selection:cancel", "Esc");
      return;
    }
    if (isEditable(doc.activeElement)) return;
    if (/^[1-4]$/.test(e.key)) {
      var index = Number(e.key) - 1;
      var mark = A.marks.list()[index];
      if (mark) {
        demo.sel.color = mark.key;
        demo.sel.state = "ready";
        renderBar('[data-color="' + mark.key + '"]');
        announce("Color " + mark.label + " elegido.");
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      submitSelection();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Arranque                                                            */
  /* ------------------------------------------------------------------ */

  function bindDemo() {
    /* Los especímenes de la galería son visuales: se pueden enfocar e inspeccionar,
       pero no alteran el estado de la demostración en vivo. */
    function withoutGallery(map) {
      var wrapped = {};
      Object.keys(map).forEach(function (key) {
        wrapped[key] = function (el, ev, extra) {
          if (el && el.closest && el.closest(".ac-preview__gallery")) return undefined;
          return map[key](el, ev, extra);
        };
      });
      return wrapped;
    }

    B.bind(doc, {
      click: withoutGallery(click),
      input: input,
      change: change
    });

    doc.addEventListener("keydown", onDocumentKeydown);
    B.radioKeys(doc, function (target) { target.click(); });

    var read = $("#demo-selection-read");
    if (read) {
      read.addEventListener("mouseup", function () {
        global.setTimeout(function () {
          var selection = B.readSelection(read);
          if (!selection) return;
          if (B.coarsePointer()) {
            mountBar({
              variant: "sheet",
              quote: selection.text,
              source: sourceLabel(data.sheetA, data.paraA, true)
            });
          } else {
            mountBar({
              variant: "floating",
              quote: selection.text,
              source: sourceLabel(data.sheetA, data.paraA, true),
              anchor: selection.rect,
              focus: false
            });
          }
          B.clearSelection();
        }, 10);
      });
    }

    doc.addEventListener("pointerdown", function (e) {
      if (!demo.sel.open) return;
      if (demo.sel.variant === "sheet") return;
      var bar = doc.querySelector(".ac-selbar");
      if (!bar) return;
      if (bar.contains(e.target)) return;
      if (e.target.closest && e.target.closest('[data-ac-action="paragraph:open"]')) return;
      closeBar(false);
    });

    var force = $("#demo-sel-forceerror");
    if (force) {
      force.addEventListener("change", function () { demo.sel.forceError = force.checked; });
    }
  }

  function boot() {
    var shell = $("#demo-body");
    var error = $("#demo-error");
    if (!content || !A || !C || !B) {
      if (error) error.hidden = false;
      if (shell) shell.hidden = true;
      return;
    }
    buildData();
    buildAnnotations();

    var savedTheme = store.get("theme", null);
    applyTheme(savedTheme || "dark");
    applyWidth("auto");
    applyDeviceWidth(390);

    var savedSwitch = store.get("recall", null);
    if (savedSwitch) {
      demo.sw.enabled = savedSwitch.enabled !== false;
      demo.sw.freq = [1, 2, 3].indexOf(savedSwitch.frequency) !== -1 ? savedSwitch.frequency : 3;
    }

    demo.note.note = annotations[1].note;
    demo.note.value = annotations[1].note;
    demo.conf.value = null;

    renderSelectionDemo();
    renderDevice();
    selectionGallery();
    renderNote();
    renderHighlights();
    renderSwitch();
    renderPause();
    renderMemory();
    renderConfidence();
    renderStates();

    bindDemo();

    var source = $("#demo-source");
    if (source) {
      source.innerHTML = esc("Contenido real") + " · temario.js v" + esc((content && content.version) || "?") +
        " · " + esc(String((content && content.sheets && content.sheets.length) || 0)) + " fichas · " +
        esc(String((content && content.cards && content.cards.length) || 0)) + " tarjetas";
    }

    if (shell) shell.hidden = false;
    log("demo:ready", "contenido " + ((content && content.version) || "?"));
    announce("Previsualizador de lectura activa listo.");
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window);
