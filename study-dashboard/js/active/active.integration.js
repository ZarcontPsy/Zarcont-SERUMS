/* Study Dashboard — Lectura activa · integración de la app
   © 2026 ZARCONT
   Fase 1: conecta los componentes de Fase 0 con StudyStore v2, el router de
   StudyApp y el bus de eventos. Sin dependencias, sin build y sin estado en los
   componentes: aquí viven las lecturas, las escrituras y las preferencias
   externas aprobadas (study-active-prefs-v1). */
(function (global) {
  "use strict";

  var A = global.StudyActive;
  var App = global.StudyApp;
  var Store = global.StudyStore;
  var UI = global.StudyUI;
  var C = global.STUDY_CONTENT;
  var TAX = global.StudyTaxonomy;

  if (!A || !A.components || !A.behavior || !App || !Store || !UI || !C) {
    if (global.console && global.console.error) {
      global.console.error("StudyActive: faltan dependencias para la integración (components, behavior, StudyApp o StudyStore).");
    }
    return;
  }

  var B = A.behavior;
  var CP = A.components;
  var U = A.util;
  var esc = UI.escapeHTML;
  var icon = A.icon;

  var PREFS_KEY = "study-active-prefs-v1";
  var NOTE_MAX = 280;
  var QUOTE_MAX = 4000;
  var CARD_FRONT_MAX = 2000;
  var RECENT_COMPLETION_MS = 6 * 60 * 60 * 1000;
  var TOUCH_SELECTION_DELAY = 420;

  var DEFAULT_PREFS = {
    version: 1,
    recallPause: true,
    recallEvery: 2,
    shortcuts: true
  };

  var state = {
    initialized: false,
    prefs: null,
    prefsStored: true,
    filters: { colors: [], query: "", scope: "all" },
    doubts: { filter: "open", query: "" },
    pauses: {},
    memory: {},
    confidence: {},
    note: null,
    cardsDialog: null,
    confirm: null,
    pendingGoto: null,
    touchTimer: null,
    selectionCloseTimer: null,
    refreshTimer: null,
    silence: 0,
    lastColor: "important",
    railPrefsOpen: false,
    pagePrefsOpen: false,
    lastAnnotationEvent: null,
    lastStoreChange: ""
  };

  var view = {
    reader: null,
    route: null,
    overlay: null,
    selection: null
  };

  var refs = {
    overlayRoot: null,
    eventOffs: [],
    shortcutOffs: [],
    actionOff: null,
    inerted: [],
    pagehide: null,
    docPointerDown: null,
    docResize: null,
    docToggle: null
  };

  /* ------------------------------------------------------------------ */
  /* Utilidades básicas                                                  */
  /* ------------------------------------------------------------------ */

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function setText(node, text) {
    if (node) node.textContent = text == null ? "" : String(text);
  }

  function attr(el, name) {
    return el ? el.getAttribute(name) : null;
  }

  function num(value, fallback) {
    var n = Number(value);
    return isFinite(n) ? n : fallback;
  }

  function trim(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function clip(value, max) {
    var text = String(value == null ? "" : value);
    if (text.length <= max) return text;
    return text.slice(0, Math.max(0, max - 1)).replace(/\s+$/, "") + "…";
  }

  function plural(n, one, many) {
    return UI.plural ? UI.plural(n, one, many) : (Number(n) === 1 ? one : many);
  }

  function announce(text) {
    if (!text) return;
    try {
      if (typeof App.announce === "function") App.announce(text);
    } catch (e) {
      var live = document.getElementById("live");
      if (live) {
        live.textContent = "";
        global.setTimeout(function () { live.textContent = text; }, 40);
      }
    }
  }

  function storeReady() {
    return typeof Store.isReady !== "function" || Store.isReady();
  }

  function withSilence(fn) {
    state.silence += 1;
    try {
      return fn();
    } finally {
      state.silence = Math.max(0, state.silence - 1);
    }
  }

  function safeFocus(target, preventScroll) {
    if (!target || typeof target.focus !== "function") return false;
    try {
      target.focus({ preventScroll: preventScroll !== false });
    } catch (e) {
      try { target.focus(); } catch (err) { return false; }
    }
    return document.activeElement === target;
  }

  function focusFallback() {
    var target = document.querySelector("#view-root h1") || document.querySelector("#view-root .ac-pagehead") || document.getElementById("main");
    safeFocus(target, false);
  }

  function isEditingTarget(target) {
    if (!target || !target.tagName) return false;
    var tag = target.tagName.toLowerCase();
    return tag === "input" || tag === "textarea" || tag === "select" || !!target.isContentEditable;
  }

  function isOurElement(node) {
    return !!(node && node.closest && node.closest(".ac, .ac-layer, [data-ac-layer]"));
  }

  function reducedMotion() {
    return !!(global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function timestamp(value) {
    var t = new Date(value).getTime();
    return isFinite(t) ? t : 0;
  }

  function relative(value) {
    return U.relative ? U.relative(value) : "";
  }

  function absolute(value) {
    return U.absDate ? U.absDate(value) : "";
  }

  function debounce(fn, wait) {
    var timer = null;
    return function () {
      var args = arguments;
      var ctx = this;
      global.clearTimeout(timer);
      timer = global.setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  function safeError(error, fallback) {
    if (!error) return fallback || "No se pudo completar la acción.";
    if (error.message) return error.message;
    return String(error);
  }

  function requestFrame(fn) {
    if (typeof global.requestAnimationFrame === "function") global.requestAnimationFrame(fn);
    else global.setTimeout(fn, 16);
  }

  /* ------------------------------------------------------------------ */
  /* Preferencias de lectura activa (clave externa aprobada)             */
  /* ------------------------------------------------------------------ */

  function normalizePrefs(raw) {
    var source = raw && typeof raw === "object" ? raw : {};
    var frequency = num(source.recallEvery, DEFAULT_PREFS.recallEvery);
    if ([1, 2, 3].indexOf(frequency) === -1) frequency = DEFAULT_PREFS.recallEvery;
    return {
      version: 1,
      recallPause: source.recallPause !== false,
      recallEvery: frequency,
      shortcuts: source.shortcuts !== false
    };
  }

  function loadPrefs() {
    var prefs = normalizePrefs(DEFAULT_PREFS);
    try {
      var raw = global.localStorage.getItem(PREFS_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") prefs = normalizePrefs(parsed);
      }
    } catch (e) {
      prefs = normalizePrefs(DEFAULT_PREFS);
    }
    state.prefs = prefs;
    return prefs;
  }

  function savePrefs(patch) {
    var next = normalizePrefs(Object.assign({}, state.prefs || DEFAULT_PREFS, patch || {}));
    state.prefs = next;
    try {
      global.localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      state.prefsStored = true;
      return true;
    } catch (e) {
      state.prefsStored = false;
      return false;
    }
  }

  function prefsNotice() {
    if (state.prefsStored) return "";
    return "No se pudo guardar la preferencia en este navegador. Se aplicará solo en esta sesión.";
  }

  /* ------------------------------------------------------------------ */
  /* Contenido, fichas y anclas                                          */
  /* ------------------------------------------------------------------ */

  function sheetById(id) {
    if (!id) return null;
    try { return Store.getSheet(id) || null; } catch (e) { return null; }
  }

  function sheetHref(id) {
    return "#/ficha/" + encodeURIComponent(String(id || ""));
  }

  function areaMeta(sheet) {
    var rawId = sheet ? (sheet.primaryAreaId || sheet.areaId || "") : "";
    var id = TAX && typeof TAX.canonicalAreaId === "function" ? (TAX.canonicalAreaId(rawId) || rawId) : rawId;
    var area = TAX && typeof TAX.area === "function" ? TAX.area(id) : null;
    if (!area && C.areas) {
      for (var i = 0; i < C.areas.length; i += 1) {
        if (C.areas[i].id === id) { area = C.areas[i]; break; }
      }
    }
    return { id: id, title: area ? (area.title || area.short || "") : "" };
  }

  function sectionAt(sheet, index) {
    if (!sheet || !Array.isArray(sheet.sections)) return null;
    var n = num(index, -1);
    return n >= 0 && n < sheet.sections.length ? sheet.sections[n] : null;
  }

  function escapeRegExp(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function normalizeForAnchor(text) {
    return String(text == null ? "" : text).replace(/\s+/g, " ").trim();
  }

  function scoreCandidate(text, candidate, prefix, suffix) {
    var score = 0;
    if (prefix) {
      var before = text.slice(Math.max(0, candidate.start - prefix.length), candidate.start);
      if (before === prefix) score += 4;
      else if (normalizeForAnchor(before).slice(-prefix.length) === normalizeForAnchor(prefix)) score += 2;
    }
    if (suffix) {
      var after = text.slice(candidate.end, candidate.end + suffix.length);
      if (after === suffix) score += 4;
      else if (normalizeForAnchor(after).slice(0, suffix.length) === normalizeForAnchor(suffix)) score += 2;
    }
    return score;
  }

  function bestCandidate(text, candidates, prefix, suffix) {
    var best = candidates[0];
    var bestScore = -1;
    candidates.forEach(function (candidate) {
      var score = scoreCandidate(text, candidate, prefix, suffix);
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    });
    return best;
  }

  /* Reancla el texto exacto dentro del párrafo. Si el texto cambió, prueba
     una coincidencia con espacios normalizados; si no hay, devuelve null y la
     integración marca el subrayado como huérfano (nunca lo descarta). */
  function findQuote(text, quote, prefix, suffix) {
    var body = String(text == null ? "" : text);
    var target = String(quote == null ? "" : quote);
    if (!body || !target) return null;
    var candidates = [];
    var at = body.indexOf(target);
    while (at !== -1 && candidates.length < 80) {
      candidates.push({ start: at, end: at + target.length });
      at = body.indexOf(target, at + 1);
    }
    if (!candidates.length) {
      var tokens = normalizeForAnchor(target).split(" ").filter(Boolean);
      if (tokens.length) {
        try {
          var re = new RegExp(tokens.map(escapeRegExp).join("\\s+"), "g");
          var match;
          while ((match = re.exec(body)) && candidates.length < 80) {
            candidates.push({ start: match.index, end: match.index + match[0].length });
            if (match[0].length === 0) re.lastIndex += 1;
          }
        } catch (e) {
          candidates = [];
        }
      }
    }
    if (!candidates.length) return null;
    if (candidates.length === 1) return candidates[0];
    return bestCandidate(body, candidates, prefix, suffix);
  }

  function locateAnnotation(annotation, forcedSheet) {
    var sheet = forcedSheet || sheetById(annotation && annotation.sheetId);
    var result = {
      sheet: sheet,
      section: null,
      paragraph: "",
      start: -1,
      end: -1,
      orphan: false
    };
    if (!sheet) {
      result.orphan = "missing-sheet";
      return result;
    }
    var section = sectionAt(sheet, annotation.sectionIndex);
    if (!section) {
      result.orphan = "missing-anchor";
      return result;
    }
    result.section = section;
    var body = Array.isArray(section.body) ? section.body : [];
    var paragraph = body[num(annotation.paragraphIndex, -1)];
    if (typeof paragraph !== "string") {
      result.orphan = "missing-anchor";
      return result;
    }
    result.paragraph = paragraph;
    var found = findQuote(paragraph, annotation.quote, annotation.prefix, annotation.suffix);
    if (!found) {
      result.orphan = "missing-anchor";
      return result;
    }
    result.start = found.start;
    result.end = found.end;
    return result;
  }

  function annotationModel(annotation, forcedSheet) {
    if (!annotation) return null;
    var sheet = forcedSheet || sheetById(annotation.sheetId);
    var located = locateAnnotation(annotation, sheet);
    var area = areaMeta(sheet);
    var sectionTitle = located.section ? located.section.title : (annotation.sectionTitle || "");
    return {
      id: annotation.id,
      sheetId: annotation.sheetId,
      sectionIndex: num(annotation.sectionIndex, 0),
      sectionTitle: sectionTitle,
      paragraphIndex: num(annotation.paragraphIndex, 0),
      color: annotation.color || "important",
      quote: annotation.quote || "",
      note: annotation.note || "",
      prefix: annotation.prefix || "",
      suffix: annotation.suffix || "",
      sheetTitle: sheet ? (sheet.title || "") : "",
      areaId: area.id,
      areaTitle: area.title,
      href: sheet ? sheetHref(sheet.id) : "",
      orphan: located.orphan || false,
      located: located,
      createdAt: annotation.createdAt,
      updatedAt: annotation.updatedAt
    };
  }

  function annotationsForSheet(sheetId) {
    try {
      return Store.annotations.list({ sheetId: sheetId }).map(function (annotation) {
        return annotationModel(annotation);
      });
    } catch (e) {
      throw e;
    }
  }

  function allAnnotations() {
    try {
      return Store.annotations.list({}).map(function (annotation) {
        return annotationModel(annotation);
      });
    } catch (e) {
      throw e;
    }
  }

  function findAnnotationModel(id) {
    try {
      var annotation = Store.annotations.get(id);
      return annotation ? annotationModel(annotation) : null;
    } catch (e) {
      return null;
    }
  }

  function annotationSource(model) {
    if (!model) return "";
    return [model.sheetTitle, model.sectionTitle].filter(Boolean).join(" · ");
  }

  function cardForSheet(sheetId) {
    var cards = Array.isArray(C.cards) ? C.cards : [];
    return cards.filter(function (card) { return card && card.sheetId === sheetId; });
  }

  function cardModel(card) {
    if (!card) return null;
    var answer = String(card.answer || "").trim();
    if (!answer && Array.isArray(card.options) && typeof card.correctIndex === "number") {
      answer = String(card.options[card.correctIndex] || "").trim();
    }
    var question = String(card.prompt || "").trim();
    if (!question || !answer) return null;
    return {
      id: card.id,
      question: question,
      answer: answer,
      explanation: String(card.explanation || "").trim()
    };
  }

  function pauseCards(sheetId) {
    return cardForSheet(sheetId).map(cardModel).filter(Boolean);
  }

  function userCardModel(card) {
    if (!card) return null;
    var sheet = sheetById(card.sheetId);
    var annotation = null;
    if (card.annotationId) {
      try { annotation = Store.annotations.get(card.annotationId); } catch (e) { annotation = null; }
    }
    return {
      id: card.id,
      sheetId: card.sheetId,
      sheetTitle: sheet ? (sheet.title || "") : "",
      front: card.front || "",
      back: card.back || "",
      source: card.source || "annotation",
      annotationId: card.annotationId || null,
      annotation: annotation,
      href: sheet ? sheetHref(sheet.id) : "",
      updatedAt: card.updatedAt,
      createdAt: card.createdAt
    };
  }

  function userCardsForSheet(sheetId) {
    try {
      return Store.userCards.list({ sheetId: sheetId }).map(userCardModel);
    } catch (e) {
      return [];
    }
  }

  function allUserCards() {
    try {
      return Store.userCards.list({}).map(userCardModel);
    } catch (e) {
      return [];
    }
  }

  function cardForAnnotation(annotationId) {
    if (!annotationId) return null;
    try {
      var cards = Store.userCards.list({});
      for (var i = 0; i < cards.length; i += 1) {
        if (cards[i].annotationId === annotationId) return userCardModel(cards[i]);
      }
    } catch (e) {}
    return null;
  }

  function doubtModel(doubt) {
    if (!doubt) return null;
    var sheet = sheetById(doubt.sheetId);
    var section = sectionAt(sheet, doubt.sectionIndex);
    var annotation = null;
    if (doubt.annotationId) {
      try { annotation = Store.annotations.get(doubt.annotationId); } catch (e) { annotation = null; }
    }
    return {
      id: doubt.id,
      sheetId: doubt.sheetId,
      sheetTitle: sheet ? (sheet.title || "") : "",
      sectionIndex: num(doubt.sectionIndex, 0),
      sectionTitle: section ? (section.title || "") : "",
      paragraphIndex: num(doubt.paragraphIndex, 0),
      quote: doubt.quote || "",
      note: doubt.note || "",
      annotationId: doubt.annotationId || null,
      annotation: annotation,
      resolved: !!doubt.resolvedAt,
      resolvedAt: doubt.resolvedAt,
      createdAt: doubt.createdAt,
      updatedAt: doubt.updatedAt,
      href: sheet ? sheetHref(sheet.id) : "",
      missingSheet: !sheet
    };
  }

  function allDoubts() {
    try {
      return Store.doubts.list({}).map(doubtModel);
    } catch (e) {
      return [];
    }
  }

  function openDoubts() {
    try {
      return Store.doubts.list({ resolved: false }).map(doubtModel);
    } catch (e) {
      return [];
    }
  }

  /* ------------------------------------------------------------------ */
  /* Foco: capturar y restaurar sin perder el texto escrito              */
  /* ------------------------------------------------------------------ */

  function attrSpec(el) {
    if (!el || !el.getAttribute) return null;
    return {
      action: el.getAttribute("data-ac-action"),
      input: el.getAttribute("data-ac-input"),
      color: el.getAttribute("data-color"),
      value: el.getAttribute("data-value"),
      acId: el.getAttribute("data-ac-id"),
      index: el.getAttribute("data-index")
    };
  }

  function captureFocus(host) {
    var active = document.activeElement;
    if (!host || !active || !host.contains(active)) return null;
    if (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT") {
      return {
        type: "input",
        input: active.getAttribute("data-ac-input"),
        id: active.id || "",
        start: typeof active.selectionStart === "number" ? active.selectionStart : null,
        end: typeof active.selectionEnd === "number" ? active.selectionEnd : null
      };
    }
    var spec = attrSpec(active);
    if (spec && (spec.action || spec.input)) {
      spec.type = "action";
      return spec;
    }
    if (active.id) return { type: "id", id: active.id };
    return null;
  }

  function sameSpec(el, spec) {
    if (!el || !spec) return false;
    if (spec.input && el.getAttribute("data-ac-input") !== spec.input) return false;
    if (spec.action && el.getAttribute("data-ac-action") !== spec.action) return false;
    if (spec.color != null && el.getAttribute("data-color") !== spec.color) return false;
    if (spec.value != null && el.getAttribute("data-value") !== spec.value) return false;
    if (spec.acId != null && el.getAttribute("data-ac-id") !== spec.acId) return false;
    if (spec.index != null && el.getAttribute("data-index") !== spec.index) return false;
    return true;
  }

  function findSpec(host, spec) {
    if (!host || !spec) return null;
    if (spec.type === "id") return document.getElementById(spec.id);
    var nodes = $$("[data-ac-action], [data-ac-input]", host);
    for (var i = 0; i < nodes.length; i += 1) {
      if (sameSpec(nodes[i], spec)) return nodes[i];
    }
    return null;
  }

  function restoreFocus(host, spec) {
    if (!spec) return false;
    var target = findSpec(host, spec);
    if (!target) return false;
    if (spec.type === "input" && typeof target.setSelectionRange === "function") {
      try {
        target.focus({ preventScroll: true });
        if (spec.start != null && spec.end != null) target.setSelectionRange(spec.start, spec.end);
        return document.activeElement === target;
      } catch (e) {}
    }
    return safeFocus(target);
  }

  function replaceHTML(host, html, focusSpec) {
    if (!host) return;
    var spec = focusSpec || captureFocus(host);
    host.innerHTML = html;
    if (spec) restoreFocus(host, spec);
  }

  /* ------------------------------------------------------------------ */
  /* Capa de superposición (hojas, diálogos y confirmaciones)            */
  /* ------------------------------------------------------------------ */

  function ensureOverlayRoot() {
    if (!refs.overlayRoot || !document.body.contains(refs.overlayRoot)) {
      var root = document.createElement("div");
      root.className = "ac-overlay-root";
      root.setAttribute("data-ac-overlay-root", "");
      document.body.appendChild(root);
      refs.overlayRoot = root;
    }
    return refs.overlayRoot;
  }

  function releaseOverlayRoot() {
    if (refs.overlayRoot && !refs.overlayRoot.childNodes.length) {
      refs.overlayRoot.parentNode.removeChild(refs.overlayRoot);
      refs.overlayRoot = null;
    }
  }

  function setShellInert(on) {
    if (on) {
      if (refs.inerted.length) return;
      ["#main", ".s-appbar", ".dash-footer"].forEach(function (selector) {
        var el = $(selector);
        if (!el) return;
        var had = el.hasAttribute("inert");
        if (!had) el.setAttribute("inert", "");
        refs.inerted.push({ el: el, had: had });
      });
    } else {
      refs.inerted.forEach(function (entry) {
        if (!entry.had && entry.el) entry.el.removeAttribute("inert");
      });
      refs.inerted = [];
    }
  }

  function overlayLayer(inner, modal) {
    var layer = document.createElement("div");
    layer.className = "ac-layer" + (modal ? " ac-layer--modal" : "");
    layer.setAttribute("data-ac-layer", "overlay");
    if (modal) {
      layer.innerHTML = '<div class="ac-scrim" data-ac-action="overlay:close" aria-hidden="true"></div>' +
        '<div class="ac ac-dialog" role="dialog" aria-modal="true" tabindex="-1"></div>';
    } else {
      layer.innerHTML = '<div class="ac ac-dialog" role="dialog" aria-modal="false" tabindex="-1"></div>';
    }
    var dialog = layer.querySelector(".ac-dialog");
    dialog.innerHTML = inner;
    return { layer: layer, dialog: dialog };
  }

  function openOverlay(opts) {
    var options = opts || {};
    if (view.overlay) closeOverlay(false, true);
    if (view.selection) closeSelection(false, true);
    var built = overlayLayer(options.html || "", options.modal !== false);
    var dialog = built.dialog;
    dialog.setAttribute("aria-label", options.label || "Lectura activa");
    ensureOverlayRoot().appendChild(built.layer);
    if (options.modal !== false) setShellInert(true);
    var trap = options.modal === false ? null : B.trap(dialog);
    view.overlay = {
      kind: options.kind || "dialog",
      layer: built.layer,
      dialog: dialog,
      trap: trap,
      returnFocus: options.returnFocus || document.activeElement,
      guard: typeof options.guard === "function" ? options.guard : null,
      onClose: typeof options.onClose === "function" ? options.onClose : null,
      label: options.label || "",
      modal: options.modal !== false
    };
    if (options.focus) {
      var target = dialog.querySelector(options.focus) || dialog;
      safeFocus(target);
    } else {
      var first = dialog.querySelector('[data-ac-action="overlay:close"], button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
      safeFocus(first || dialog);
    }
    releaseOverlayRoot();
    return view.overlay;
  }

  function setOverlayContent(html, focusSelector, label) {
    if (!view.overlay) return;
    var dialog = view.overlay.dialog;
    if (view.overlay.trap && typeof view.overlay.trap.release === "function") view.overlay.trap.release(false);
    dialog.innerHTML = html;
    if (label) dialog.setAttribute("aria-label", label);
    if (view.overlay.trap !== null) view.overlay.trap = B.trap(dialog);
    var target = focusSelector ? dialog.querySelector(focusSelector) : null;
    safeFocus(target || dialog);
  }

  function closeOverlay(restoreFocus, force) {
    if (!view.overlay) return true;
    if (!force && view.overlay.guard && !view.overlay.guard()) {
      announce("Tienes cambios sin guardar. Usa Guardar o Cancelar.");
      return false;
    }
    var overlay = view.overlay;
    if (overlay.trap && typeof overlay.trap.release === "function") overlay.trap.release(false);
    if (overlay.layer && overlay.layer.parentNode) overlay.layer.parentNode.removeChild(overlay.layer);
    if (overlay.modal !== false) setShellInert(false);
    view.overlay = null;
    releaseOverlayRoot();
    if (overlay.onClose) {
      try { overlay.onClose(); } catch (e) {}
    }
    if (restoreFocus !== false) {
      if (overlay.returnFocus && overlay.returnFocus.isConnected) safeFocus(overlay.returnFocus);
      else focusFallback();
    }
    return true;
  }

  function openConfirm(opts) {
    var options = opts || {};
    state.confirm = {
      title: options.title || "Confirmar acción",
      text: options.text || "",
      quote: options.quote || "",
      confirmLabel: options.confirmLabel || "Confirmar",
      onConfirm: options.onConfirm
    };
    var html = [
      '<div class="ac-dialog__bar"><span class="ac-kicker"><span class="ac-dot" aria-hidden="true"></span>Confirmación</span>',
        '<button class="ac-iconbtn ac-iconbtn--sm" type="button" data-ac-action="confirm:no" aria-label="Cerrar la confirmación">' + icon("close", 15) + "</button></div>",
      '<div class="ac-dialog__body">',
        '<h2 class="ac-dialog__title">' + esc(state.confirm.title) + "</h2>",
        '<p class="ac-dialog__text">' + esc(state.confirm.text) + "</p>",
        state.confirm.quote ? '<blockquote class="ac-quote"><p class="ac-quote__text">“' + esc(clip(state.confirm.quote, 240)) + "”</p></blockquote>" : "",
      "</div>",
      '<div class="ac-dialog__foot">',
        '<button class="ac-btn ac-btn--ghost" type="button" data-ac-action="confirm:no">Cancelar</button>',
        '<button class="ac-btn ac-btn--danger" type="button" data-ac-action="confirm:yes">' + esc(state.confirm.confirmLabel) + "</button>",
      "</div>"
    ].join("");
    openOverlay({
      kind: "confirm",
      html: html,
      label: state.confirm.title,
      modal: true,
      returnFocus: options.returnFocus || document.activeElement,
      focus: '[data-ac-action="confirm:no"]'
    });
  }

  /* ------------------------------------------------------------------ */
  /* Piezas de HTML propias (siempre escapadas)                          */
  /* ------------------------------------------------------------------ */

  function actionButton(def) {
    return CP.actionButton(def);
  }

  function routeLink(href, label, iconName, cls) {
    return '<a class="' + (cls || "ac-btn ac-btn--ghost ac-btn--sm") + '" href="' + esc(href) + '" data-nav>' +
      (iconName ? '<span class="ac-btn__ico" aria-hidden="true">' + icon(iconName, 14) + "</span>" : "") +
      '<span class="ac-btn__label">' + esc(label) + "</span></a>";
  }

  function prefsSwitchHTML(kind) {
    var enabled = !!state.prefs.shortcuts;
    return '<div class="ac ac-prefswitch" data-ac-prefs-switch="' + esc(kind) + '">' +
      '<div class="ac-prefswitch__copy"><span class="ac-kicker">Teclado</span>' +
        '<p><b>Atajos del lector</b><span class="ac-prefswitch__hint">n, p, c, s, r y ? · se desactivan al escribir o en diálogos</span></p>' +
      "</div>" +
      '<button class="ac-switch" type="button" role="switch" aria-checked="' + (enabled ? "true" : "false") + '"' +
        ' data-ac-action="shortcuts:toggle" aria-label="Atajos del lector">' +
        '<span class="ac-switch__track" aria-hidden="true"><span class="ac-switch__thumb"></span></span>' +
        '<span class="ac-switch__text">' + (enabled ? "Activados" : "Desactivados") + "</span></button>" +
      '<button class="ac-btn ac-btn--ghost ac-btn--sm" type="button" data-ac-action="shortcuts:help">' +
        '<span class="ac-btn__ico" aria-hidden="true">' + icon("keyboard", 14) + "</span>Ver ayuda (?)</button>" +
      "</div>";
  }

  function prefsBlockHTML(kind) {
    var id = "ac-prefs-" + kind;
    return '<section class="ac ac-prefs" aria-labelledby="' + esc(id) + '-title">' +
      '<header class="ac-prefs__head"><span class="ac-kicker"><span class="ac-dot" aria-hidden="true"></span>Preferencias</span>' +
        '<h2 id="' + esc(id) + '-title">Pausa y teclado</h2>' +
        '<p>La pausa de recuerdo y los atajos se guardan en este navegador, no en tu progreso exportado.</p></header>' +
      '<div class="ac-prefs__grid">' +
        CP.recallSwitch({
          id: "ac-recall-" + kind,
          enabled: !!state.prefs.recallPause,
          frequency: state.prefs.recallEvery,
          state: state.prefsStored ? "ready" : "error"
        }) +
        prefsSwitchHTML(kind) +
      "</div>" +
      (state.prefsStored ? "" : CP.alert({ tone: "warn", title: "Preferencia no guardada", text: prefsNotice() })) +
      "</section>";
  }

  /* ------------------------------------------------------------------ */
  /* Escrituras comunes: notas, dudas, tarjetas, confianza              */
  /* ------------------------------------------------------------------ */

  function ensureDoubtForAnnotation(annotation) {
    if (!annotation || annotation.color !== "doubt") return null;
    try {
      var doubts = Store.doubts.list({});
      for (var i = 0; i < doubts.length; i += 1) {
        if (doubts[i].annotationId === annotation.id) return doubts[i];
      }
      return Store.doubts.add({
        sheetId: annotation.sheetId,
        sectionIndex: annotation.sectionIndex,
        paragraphIndex: annotation.paragraphIndex,
        quote: annotation.quote,
        note: annotation.note || "",
        annotationId: annotation.id
      });
    } catch (e) {
      if (global.console && global.console.warn) global.console.warn("StudyActive: no se pudo crear la duda", e);
      return null;
    }
  }

  function refreshAnnotationSurfaces(options) {
    var opts = options || {};
    if (view.reader) {
      refreshReaderMarks();
      renderRail(opts.focusSpec);
    }
    if (view.route) refreshRouteSurfaces(opts);
    if (!$("#view-root") || (App.getRoute() && App.getRoute().name === "home")) renderSummary();
  }

  function refreshDoubtsSurfaces(options) {
    var opts = options || {};
    if (view.reader) renderRail(opts.focusSpec);
    if (view.route) refreshRouteSurfaces(opts);
    renderSummary();
  }

  function refreshConfidenceSurfaces(options) {
    var opts = options || {};
    if (view.reader) renderConfidence(opts.focusSpec);
    if (view.route) refreshRouteSurfaces(opts);
  }

  function refreshCardSurfaces(options) {
    var opts = options || {};
    if (view.route) refreshRouteSurfaces(opts);
    renderSummary();
  }

  /* ------------------------------------------------------------------ */
  /* Nota de un subrayado                                                */
  /* ------------------------------------------------------------------ */

  function noteDraftIsDirty() {
    if (!state.note || state.note.mode !== "edit") return false;
    var annotation = null;
    try { annotation = Store.annotations.get(state.note.annotationId); } catch (e) { annotation = null; }
    if (!annotation) return true;
    return String(state.note.value || "") !== String(annotation.note || "");
  }

  function noteOverlayHTML() {
    var note = state.note;
    if (!note) return "";
    var annotation = null;
    try { annotation = Store.annotations.get(note.annotationId); } catch (e) { annotation = null; }
    if (!annotation) {
      return '<div class="ac-dialog__bar"><span class="ac-kicker">Nota</span>' +
        '<button class="ac-iconbtn ac-iconbtn--sm" type="button" data-ac-action="overlay:close" aria-label="Cerrar">' + icon("close", 15) + "</button></div>" +
        CP.stateCard({ tone: "error", icon: "alert", title: "Ese subrayado ya no existe", text: "La nota no se puede mostrar porque el subrayado fue eliminado.", actions: [{ label: "Cerrar", action: "overlay:close", variant: "soft" }] });
    }
    var model = annotationModel(annotation);
    var source = annotationSource(model);
    var card = CP.noteCard({
      id: "ac-note-" + annotation.id,
      annotationId: annotation.id,
      color: model.color,
      quote: model.quote,
      source: source,
      note: note.mode === "edit" ? note.value : (note.savedValue != null && note.state === "saved" ? note.savedValue : model.note),
      updatedAt: note.updatedAt || annotation.updatedAt,
      maxLength: NOTE_MAX,
      mode: note.mode,
      state: note.state,
      error: note.error
    });
    var linkedCard = cardForAnnotation(annotation.id);
    var extra = '<div class="ac-note__extra">' +
      '<button class="ac-btn ac-btn--soft ac-btn--sm" type="button" data-ac-action="ucard:from" data-ac-id="' + esc(annotation.id) + '">' +
        '<span class="ac-btn__ico" aria-hidden="true">' + icon("cards", 14) + "</span>" +
        (linkedCard ? "Editar tarjeta propia" : "Crear tarjeta propia") + "</button>" +
      (model.color === "doubt" ? '<a class="ac-btn ac-btn--ghost ac-btn--sm" href="#/dudas" data-nav>' +
        '<span class="ac-btn__ico" aria-hidden="true">' + icon("flag", 14) + "</span>Ver en dudas</a>" : "") +
      "</div>";
    return '<div class="ac-dialog__bar"><span class="ac-kicker"><span class="ac-dot" aria-hidden="true"></span>Subrayado</span>' +
      '<button class="ac-iconbtn ac-iconbtn--sm" type="button" data-ac-action="overlay:close" aria-label="Cerrar la nota">' + icon("close", 15) + "</button></div>" +
      card + extra;
  }

  function renderNoteOverlay(focusSelector) {
    if (!view.overlay || view.overlay.kind !== "note") return;
    view.overlay.guard = function () { return !noteDraftIsDirty(); };
    setOverlayContent(noteOverlayHTML(), focusSelector, "Nota del subrayado");
  }

  function openAnnotationNote(annotationId, trigger) {
    var annotation = null;
    try { annotation = Store.annotations.get(annotationId); } catch (e) { annotation = null; }
    if (!annotation) {
      announce("Ese subrayado ya no está disponible.");
      return;
    }
    if (view.selection) closeSelection(false, true);
    state.note = {
      annotationId: annotationId,
      mode: "view",
      state: "idle",
      value: annotation.note || "",
      savedValue: null,
      updatedAt: annotation.updatedAt,
      error: ""
    };
    openOverlay({
      kind: "note",
      html: noteOverlayHTML(),
      label: "Nota del subrayado",
      returnFocus: trigger,
      focus: '[data-ac-action="overlay:close"]'
    });
    view.overlay.guard = function () { return !noteDraftIsDirty(); };
  }

  function saveNote() {
    if (!state.note) return;
    var annotation = null;
    try { annotation = Store.annotations.get(state.note.annotationId); } catch (e) { annotation = null; }
    if (!annotation) {
      state.note.error = "El subrayado ya no existe.";
      state.note.state = "error";
      renderNoteOverlay('[data-ac-action="overlay:close"]');
      return;
    }
    var value = String(state.note.value || "").trim();
    state.note.state = "saving";
    state.note.error = "";
    renderNoteOverlay('[data-ac-action="overlay:close"]');
    var updated = withSilence(function () {
      return Store.annotations.update(annotation.id, { note: value });
    });
    if (!updated) {
      state.note.state = "error";
      state.note.error = "No se pudo guardar la nota. El texto se conserva para reintentar.";
      renderNoteOverlay('[data-ac-action="note:save"]');
      announce("No se pudo guardar la nota.");
      return;
    }
    state.note.mode = "view";
    state.note.state = "saved";
    state.note.savedValue = value;
    state.note.updatedAt = updated.updatedAt;
    refreshAnnotationSurfaces();
    renderNoteOverlay('[data-ac-action="note:edit"]');
    announce(value ? "Nota guardada." : "Nota eliminada; la cita se conserva.");
  }

  function clearNote() {
    if (!state.note) return;
    var annotation = null;
    try { annotation = Store.annotations.get(state.note.annotationId); } catch (e) { annotation = null; }
    if (!annotation) return;
    var updated = withSilence(function () {
      return Store.annotations.update(annotation.id, { note: "" });
    });
    if (!updated) {
      announce("No se pudo quitar la nota.");
      return;
    }
    state.note.mode = "view";
    state.note.state = "idle";
    state.note.value = "";
    state.note.savedValue = null;
    state.note.updatedAt = updated.updatedAt;
    refreshAnnotationSurfaces();
    renderNoteOverlay('[data-ac-action="note:edit"]');
    announce("Nota eliminada; la cita se conserva.");
  }

  /* ------------------------------------------------------------------ */
  /* Tarjetas propias                                                    */
  /* ------------------------------------------------------------------ */

  function cardsListHTML() {
    var cards = allUserCards();
    var body;
    if (!cards.length) {
      body = CP.stateCard({
        tone: "empty",
        icon: "cards",
        title: "Todavía no hay tarjetas propias",
        text: "Crea una tarjeta desde cualquier subrayado: la cita entra como frente y tú escribes el reverso, sin inventar contenido.",
        actions: [{ label: "Cerrar", action: "overlay:close", variant: "soft" }]
      });
    } else {
      body = '<ul class="ac-ucardlist">' + cards.map(function (card) {
        var meta = card.sheetTitle || "Ficha";
        return '<li class="ac-ucardlist__row" data-ac-ucard-id="' + esc(card.id) + '">' +
          '<div class="ac-ucardlist__body">' +
            '<p class="ac-ucardlist__front">' + esc(card.front) + "</p>" +
            '<p class="ac-ucardlist__back">' + esc(card.back) + "</p>" +
            '<p class="ac-ucardlist__meta">' + esc(meta) + (card.annotationId ? " · desde un subrayado" : "") + "</p>" +
          "</div>" +
          '<div class="ac-ucardlist__actions">' +
            '<button class="ac-btn ac-btn--ghost ac-btn--sm" type="button" data-ac-action="ucard:edit" data-ac-id="' + esc(card.id) + '">' +
              '<span class="ac-btn__ico" aria-hidden="true">' + icon("note", 14) + "</span>Editar</button>" +
            (card.href ? '<a class="ac-btn ac-btn--quiet ac-btn--sm" href="' + esc(card.href) + '" data-nav>Ir a la ficha</a>' : "") +
          "</div></li>";
      }).join("") + "</ul>";
    }
    return '<div class="ac-dialog__bar"><span class="ac-kicker"><span class="ac-dot" aria-hidden="true"></span>Mis tarjetas</span>' +
      '<button class="ac-iconbtn ac-iconbtn--sm" type="button" data-ac-action="overlay:close" aria-label="Cerrar las tarjetas propias">' + icon("close", 15) + "</button></div>" +
      '<div class="ac-dialog__body"><h2 class="ac-dialog__title">Tarjetas propias</h2>' +
      '<p class="ac-dialog__text">Nacen de tus subrayados. No modifican tus cajas de Flashcards.</p>' +
      body + "</div>";
  }

  function cardEditorHTML() {
    var editor = state.cardsDialog;
    if (!editor) return "";
    var isEdit = !!editor.cardId;
    var canSave = !!String(editor.front || "").trim() && !!String(editor.back || "").trim();
    var annotation = null;
    if (editor.annotationId) {
      try { annotation = Store.annotations.get(editor.annotationId); } catch (e) { annotation = null; }
    }
    var source = annotation ? annotationSource(annotationModel(annotation)) : (editor.sheetTitle || "");
    return '<div class="ac-dialog__bar"><span class="ac-kicker"><span class="ac-dot" aria-hidden="true"></span>' +
        (isEdit ? "Editar tarjeta" : "Nueva tarjeta") + "</span>" +
        '<button class="ac-iconbtn ac-iconbtn--sm" type="button" data-ac-action="ucard:cancel" aria-label="Cerrar el editor de la tarjeta">' + icon("close", 15) + "</button></div>" +
      '<div class="ac-dialog__body">' +
        '<h2 class="ac-dialog__title">' + (isEdit ? "Editar tarjeta propia" : "Crear tarjeta desde el subrayado") + "</h2>" +
        '<p class="ac-dialog__text">El frente es la cita real del subrayado. El reverso lo escribes tú; no se inventa contenido clínico.</p>' +
        (source ? '<p class="ac-ucard__source">' + esc(source) + "</p>" : "") +
        '<div class="ac-ucard__form">' +
          '<label class="ac-field"><span class="ac-field__label">Frente (cita)</span>' +
            '<textarea class="ac-textarea" rows="3" maxlength="' + CARD_FRONT_MAX + '" data-ac-input="ucard-front">' + esc(editor.front) + "</textarea></label>" +
          '<label class="ac-field"><span class="ac-field__label">Reverso (tu respuesta)</span>' +
            '<textarea class="ac-textarea" rows="4" maxlength="4000" data-ac-input="ucard-back">' + esc(editor.back) + "</textarea></label>" +
        "</div>" +
        '<article class="ac-ucard ac-ucard--preview" aria-label="Vista previa de la tarjeta">' +
          '<span class="ac-kicker">Vista previa</span>' +
          '<p class="ac-ucard__front" data-ac-ucard-preview-front>' + esc(editor.front || "El frente aparecerá aquí.") + "</p>" +
          '<div class="ac-ucard__divider" aria-hidden="true"></div>' +
          '<p class="ac-ucard__back" data-ac-ucard-preview-back>' + esc(editor.back || "El reverso aparecerá aquí.") + "</p>" +
        "</article>" +
        (editor.error ? CP.alert({ tone: "error", title: "No se pudo guardar la tarjeta", text: editor.error }) : "") +
      "</div>" +
      '<div class="ac-dialog__foot">' +
        '<button class="ac-btn ac-btn--ghost" type="button" data-ac-action="ucard:cancel">Cancelar</button>' +
        '<button class="ac-btn ac-btn--primary" type="button" data-ac-action="ucard:save"' + (canSave ? "" : " disabled") + ">" +
          '<span class="ac-btn__ico" aria-hidden="true">' + icon("check", 14) + "</span>Guardar tarjeta</button>" +
      "</div>";
  }

  function renderCardsOverlay(focusSelector) {
    if (!view.overlay || view.overlay.kind !== "cards") return;
    var editor = state.cardsDialog;
    if (!editor) return;
    view.overlay.guard = function () {
      return editor.mode !== "edit" || !editor.dirty;
    };
    if (editor.mode === "edit") {
      setOverlayContent(cardEditorHTML(), focusSelector || '[data-ac-input="ucard-front"]', editor.cardId ? "Editar tarjeta propia" : "Crear tarjeta propia");
    } else {
      setOverlayContent(cardsListHTML(), focusSelector || '[data-ac-action="overlay:close"]', "Tarjetas propias");
    }
  }

  function openCardsList(trigger) {
    if (view.selection) closeSelection(false, true);
    state.cardsDialog = {
      mode: "list",
      cardId: null,
      annotationId: null,
      sheetId: null,
      front: "",
      back: "",
      error: "",
      dirty: false,
      fromList: true,
      rootReturnFocus: trigger || document.activeElement
    };
    openOverlay({
      kind: "cards",
      html: cardsListHTML(),
      label: "Tarjetas propias",
      returnFocus: trigger,
      focus: '[data-ac-action="overlay:close"]'
    });
    view.overlay.guard = function () { return true; };
  }

  function openCardEditor(opts) {
    var options = opts || {};
    var card = null;
    if (options.cardId) {
      try { card = Store.userCards.get(options.cardId); } catch (e) { card = null; }
    }
    var annotation = null;
    if (!card && options.annotationId) {
      try { annotation = Store.annotations.get(options.annotationId); } catch (e) { annotation = null; }
    }
    if (!card && annotation) {
      card = cardForAnnotation(annotation.id);
      if (card) card = Store.userCards.get(card.id);
    }
    if (!card && !annotation) {
      announce("No se encontró el subrayado para crear la tarjeta.");
      return;
    }
    var previousReturn = view.overlay ? view.overlay.returnFocus : options.trigger;
    if (view.overlay) closeOverlay(false, true);
    if (card) {
      state.cardsDialog = {
        mode: "edit",
        cardId: card.id,
        annotationId: card.annotationId || options.annotationId || null,
        sheetId: card.sheetId || "",
        sheetTitle: (sheetById(card.sheetId) || {}).title || "",
        front: card.front || "",
        back: card.back || "",
        error: "",
        dirty: false,
        fromList: !!options.fromList,
        rootReturnFocus: previousReturn
      };
    } else if (annotation) {
      state.cardsDialog = {
        mode: "edit",
        cardId: null,
        annotationId: annotation.id,
        sheetId: annotation.sheetId || "",
        sheetTitle: (sheetById(annotation.sheetId) || {}).title || "",
        front: clip(annotation.quote || "", CARD_FRONT_MAX),
        back: annotation.note || "",
        error: "",
        dirty: false,
        fromList: !!options.fromList,
        rootReturnFocus: previousReturn
      };
    }
    openOverlay({
      kind: "cards",
      html: cardEditorHTML(),
      label: annotation ? "Crear tarjeta propia" : "Editar tarjeta propia",
      returnFocus: previousReturn,
      focus: '[data-ac-input="ucard-front"]'
    });
    view.overlay.guard = function () { return !state.cardsDialog.dirty; };
  }

  function saveCard() {
    var editor = state.cardsDialog;
    if (!editor) return;
    var front = String(editor.front || "").trim();
    var back = String(editor.back || "").trim();
    if (!front || !back) {
      editor.error = "Completa el frente y el reverso. El reverso no se inventa: escríbelo tú.";
      renderCardsOverlay('[data-ac-action="ucard:save"]');
      return;
    }
    if (!editor.sheetId) {
      editor.error = "No se pudo identificar la ficha de esta tarjeta.";
      renderCardsOverlay('[data-ac-action="ucard:save"]');
      return;
    }
    editor.error = "";
    var payload = {
      sheetId: editor.sheetId,
      front: front,
      back: back,
      source: "annotation",
      annotationId: editor.annotationId || null
    };
    var record = withSilence(function () {
      if (editor.cardId) return Store.userCards.update(editor.cardId, payload);
      return Store.userCards.add(payload);
    });
    if (!record) {
      editor.error = "No se pudo guardar la tarjeta. Revisa el espacio de almacenamiento y reintenta.";
      renderCardsOverlay('[data-ac-action="ucard:save"]');
      announce("No se pudo guardar la tarjeta propia.");
      return;
    }
    editor.cardId = record.id;
    editor.dirty = false;
    var fromList = editor.fromList;
    var routeView = view.route && view.route.name === "subrayados";
    var summaryVisible = !!$('[data-module-mount="active-summary"]');
    var returnFocus = view.overlay ? view.overlay.returnFocus : null;
    var rootReturn = editor.rootReturnFocus || returnFocus;
    closeOverlay(false, true);
    refreshCardSurfaces();
    if (fromList) {
      openCardsList(null);
      if (view.overlay && rootReturn) view.overlay.returnFocus = rootReturn;
      setTimeout(function () {
        var target = $('[data-ac-action="ucard:edit"][data-ac-id="' + record.id + '"]');
        if (target) safeFocus(target);
      }, 30);
    } else if (returnFocus && returnFocus.isConnected) {
      safeFocus(returnFocus);
    } else if (routeView) {
      setTimeout(function () {
        var target = $('[data-ac-action="ucard:edit"][data-ac-id="' + record.id + '"]');
        if (target) safeFocus(target);
        else focusFallback();
      }, 30);
    } else if (summaryVisible) {
      setTimeout(function () {
        var target = $('[data-ac-action="summary:cards"]');
        if (target) safeFocus(target);
        else focusFallback();
      }, 30);
    } else {
      focusFallback();
    }
    announce("Tarjeta propia guardada. No modifica tus cajas de Flashcards.");
  }

  /* ------------------------------------------------------------------ */
  /* Selección de texto: barra flotante, hoja táctil y botón de párrafo  */
  /* ------------------------------------------------------------------ */

  function selectionLayer(barHTML, touch) {
    var layer = document.createElement("div");
    layer.className = "ac-layer" + (touch ? " ac-layer--modal" : "");
    layer.setAttribute("data-ac-layer", "selection");
    layer.innerHTML = (touch ? '<div class="ac-scrim" data-ac-action="selection:cancel" aria-hidden="true"></div>' : "") + barHTML;
    return layer;
  }

  function focusSelection() {
    if (!view.selection || !view.selection.layer) return;
    var bar = view.selection.layer.querySelector(".ac-selbar");
    if (!bar) return;
    var focus = view.selection.focusTarget || "none";
    var target = null;
    if (focus === "note") target = bar.querySelector('[data-ac-input="note"]');
    else if (focus === "close") target = bar.querySelector('[data-ac-action="selection:close"]');
    else if (focus === "submit") target = bar.querySelector('[data-ac-action="selection:submit"]');
    else if (focus === "color") {
      target = bar.querySelector('[data-ac-action="selection:color"][data-color="' + view.selection.color + '"]') ||
        bar.querySelector('[data-ac-action="selection:color"]');
    }
    if (target) safeFocus(target);
  }

  function renderSelection(focusTarget) {
    var sel = view.selection;
    if (!sel) return;
    if (focusTarget) sel.focusTarget = focusTarget;
    var existingNote = sel.layer ? sel.layer.querySelector('[data-ac-input="note"]') : null;
    if (existingNote) sel.note = existingNote.value;
    var touch = !!sel.touch;
    var barHTML = CP.selectionBar({
      id: "ac-bar-" + sel.sheetId,
      variant: touch ? "sheet" : "floating",
      noLayer: true,
      state: sel.state,
      color: sel.color,
      quote: sel.quote,
      source: sel.source,
      noteOpen: !!sel.noteOpen,
      note: sel.note || "",
      maxLength: NOTE_MAX,
      keyHints: !touch,
      error: sel.error || ""
    });
    var layer = selectionLayer(barHTML, touch);
    var oldTrap = sel.trap;
    if (oldTrap && typeof oldTrap.release === "function") oldTrap.release(false);
    if (sel.layer && sel.layer.parentNode) sel.layer.parentNode.removeChild(sel.layer);
    ensureOverlayRoot().appendChild(layer);
    sel.layer = layer;
    sel.bar = layer.querySelector(".ac-selbar");
    if (touch) {
      setShellInert(true);
      sel.trap = B.trap(sel.bar);
    } else {
      setShellInert(false);
      sel.trap = null;
    }
    if (!touch) {
      B.positionBar(sel.bar, sel.rect, layer);
    }
    focusSelection();
    releaseOverlayRoot();
  }

  function selectionSourceText(p) {
    return p ? p.textContent || "" : "";
  }

  function sectionInfoForElement(element) {
    if (!view.reader) return { index: 0, title: "" };
    var section = element && element.closest ? element.closest(".reader-section") : null;
    if (!section) return { index: 0, title: "" };
    for (var i = 0; i < view.reader.sections.length; i += 1) {
      if (view.reader.sections[i].el === section) {
        return { index: view.reader.sections[i].index, title: view.reader.sections[i].title };
      }
    }
    return { index: num(section.getAttribute("data-section-index"), 0), title: section.getAttribute("data-section-title") || "" };
  }

  function paragraphInfo(p) {
    if (!p || !view.reader) return null;
    var section = sectionInfoForElement(p);
    var index = num(p.getAttribute("data-paragraph-index"), 0);
    return {
      sheetId: view.reader.sheet.id,
      sectionIndex: section.index,
      sectionTitle: section.title,
      paragraphIndex: index,
      text: selectionSourceText(p),
      p: p
    };
  }

  function previousContext(text, start) {
    return text.slice(Math.max(0, start - 120), start);
  }

  function nextContext(text, end) {
    return text.slice(end, end + 120);
  }

  function openSelectionFromParagraph(element, trigger) {
    var p = null;
    if (element && element.matches && element.matches("p[data-paragraph-index]")) {
      p = element;
    } else if (element && element.closest) {
      var wrapper = element.closest(".ac-para");
      if (wrapper) p = wrapper.querySelector("p[data-paragraph-index]");
      if (!p) p = element.closest("p[data-paragraph-index]");
    }
    if (!p || !view.reader) return;
    var info = paragraphInfo(p);
    if (!info) return;
    var text = info.text;
    var start = text.indexOf(text.trim());
    if (start < 0) start = 0;
    var quote = text.trim();
    if (quote.length < 2) {
      announce("Este párrafo no tiene texto para subrayar.");
      return;
    }
    var end = start + quote.length;
    if (view.selection) closeSelection(false, true);
    if (view.overlay) closeOverlay(false, true);
    var coarse = B.coarsePointer && B.coarsePointer();
    var sheetTitle = view.reader.sheet.title || "";
    view.selection = {
      sheetId: info.sheetId,
      sectionIndex: info.sectionIndex,
      sectionTitle: info.sectionTitle,
      paragraphIndex: info.paragraphIndex,
      quote: quote,
      prefix: previousContext(text, start),
      suffix: nextContext(text, end),
      text: text,
      source: [sheetTitle, info.sectionTitle].filter(Boolean).join(" · "),
      color: state.lastColor,
      note: "",
      noteOpen: false,
      state: "ready",
      error: "",
      touch: !!coarse,
      rect: p.getBoundingClientRect(),
      trigger: trigger || p,
      focusTarget: "color"
    };
    renderSelection("color");
  }

  function selectionFromRange(range, p, touch) {
    if (!p || !view.reader) return null;
    var text = selectionSourceText(p);
    var pre = document.createRange();
    try {
      pre.selectNodeContents(p);
      pre.setEnd(range.startContainer, range.startOffset);
    } catch (e) {
      return null;
    }
    var start = pre.toString().length;
    var selected = range.toString();
    var end = start + selected.length;
    var raw = text.slice(start, end);
    var left = raw.length - raw.replace(/^\s+/, "").length;
    var right = raw.length - raw.replace(/\s+$/, "").length;
    start += left;
    end -= right;
    raw = text.slice(start, end);
    if (raw.length < 2) return { error: "Selecciona al menos dos caracteres para subrayar." };
    if (raw.length > QUOTE_MAX) raw = raw.slice(0, QUOTE_MAX);
    var rect = range.getBoundingClientRect();
    if (!rect || (!rect.width && !rect.height)) rect = p.getBoundingClientRect();
    var info = paragraphInfo(p);
    if (!info) return null;
    return {
      sheetId: info.sheetId,
      sectionIndex: info.sectionIndex,
      sectionTitle: info.sectionTitle,
      paragraphIndex: info.paragraphIndex,
      quote: raw,
      prefix: previousContext(text, start),
      suffix: nextContext(text, start + raw.length),
      text: text,
      rect: rect,
      touch: !!touch
    };
  }

  function readParagraphSelection(reader) {
    var sel = global.getSelection ? global.getSelection() : null;
    if (!sel || !sel.rangeCount || sel.isCollapsed) return null;
    var range = sel.getRangeAt(0);
    var startNode = range.startContainer;
    var endNode = range.endContainer;
    var startEl = startNode && startNode.nodeType === 1 ? startNode : startNode && startNode.parentElement;
    var endEl = endNode && endNode.nodeType === 1 ? endNode : endNode && endNode.parentElement;
    if (!startEl || !endEl) return null;
    if (startEl.closest && startEl.closest(".ac-layer")) return null;
    var pStart = startEl.closest ? startEl.closest("p[data-paragraph-index]") : null;
    var pEnd = endEl.closest ? endEl.closest("p[data-paragraph-index]") : null;
    if (!pStart || !pEnd) return null;
    if (!reader.contains(pStart)) return null;
    if (pStart !== pEnd) return { error: "Selecciona texto dentro de un mismo párrafo para subrayar." };
    var details = selectionFromRange(range, pStart, false);
    if (!details) return null;
    return details;
  }

  function openSelectionFromText(details) {
    if (!details || !view.reader) return;
    if (view.selection) closeSelection(false, true);
    if (view.overlay) closeOverlay(false, true);
    var section = sectionEntry(details.sectionIndex);
    var p = section ? section.el.querySelector('p[data-paragraph-index="' + details.paragraphIndex + '"]') : null;
    var wrapper = p && p.closest ? p.closest(".ac-para") : null;
    var trigger = wrapper ? $('[data-ac-action="paragraph:open"]', wrapper) : p;
    var sheetTitle = view.reader.sheet.title || "";
    view.selection = {
      sheetId: details.sheetId,
      sectionIndex: details.sectionIndex,
      sectionTitle: details.sectionTitle,
      paragraphIndex: details.paragraphIndex,
      quote: details.quote,
      prefix: details.prefix,
      suffix: details.suffix,
      text: details.text,
      source: [sheetTitle, details.sectionTitle].filter(Boolean).join(" · "),
      color: state.lastColor,
      note: "",
      noteOpen: false,
      state: "ready",
      error: "",
      touch: !!details.touch,
      rect: details.rect,
      trigger: trigger || view.reader.reader,
      focusTarget: details.touch ? "color" : "none"
    };
    B.clearSelection();
    renderSelection(view.selection.focusTarget);
  }

  function closeSelection(restoreFocus, force) {
    var sel = view.selection;
    if (!sel) return;
    if (state.selectionCloseTimer) {
      global.clearTimeout(state.selectionCloseTimer);
      state.selectionCloseTimer = null;
    }
    if (sel.trap && typeof sel.trap.release === "function") sel.trap.release(false);
    if (sel.layer && sel.layer.parentNode) sel.layer.parentNode.removeChild(sel.layer);
    if (!view.overlay) setShellInert(false);
    view.selection = null;
    releaseOverlayRoot();
    if (restoreFocus !== false) {
      var trigger = sel.trigger;
      if (trigger && trigger.isConnected) safeFocus(trigger);
      else focusFallback();
    }
  }

  function submitSelection() {
    var sel = view.selection;
    if (!sel || sel.state === "saving" || sel.state === "saved") return;
    var noteField = sel.layer ? sel.layer.querySelector('[data-ac-input="note"]') : null;
    if (noteField) sel.note = noteField.value;
    sel.state = "saving";
    sel.error = "";
    renderSelection("submit");
    var record = withSilence(function () {
      return Store.annotations.add({
        sheetId: sel.sheetId,
        sectionIndex: sel.sectionIndex,
        sectionTitle: sel.sectionTitle,
        paragraphIndex: sel.paragraphIndex,
        color: sel.color,
        quote: sel.quote,
        prefix: sel.prefix,
        suffix: sel.suffix,
        note: sel.note || ""
      });
    });
    if (!record) {
      sel.state = "error";
      sel.error = "No se pudo guardar el subrayado. El texto y la nota se conservan.";
      renderSelection("submit");
      announce("No se pudo guardar el subrayado.");
      return;
    }
    var doubtFailed = false;
    if (record.color === "doubt") {
      doubtFailed = !ensureDoubtForAnnotation(record);
    }
    state.lastColor = record.color;
    sel.state = "saved";
    sel.error = "";
    if (view.reader) {
      refreshReaderMarks();
      renderRail();
    }
    renderSelection("close");
    announce(doubtFailed
      ? "Subrayado guardado. No se pudo añadir la duda a la bandeja."
      : "Subrayado guardado.");
    if (state.selectionCloseTimer) global.clearTimeout(state.selectionCloseTimer);
    state.selectionCloseTimer = global.setTimeout(function () {
      state.selectionCloseTimer = null;
      if (view.selection && view.selection.state === "saved") closeSelection(true);
    }, 1200);
  }

  function setSelectionColor(color) {
    if (!view.selection || !A.marks.has(color)) return;
    view.selection.color = color;
    view.selection.state = "ready";
    renderSelection("color");
  }

  function toggleSelectionNote() {
    if (!view.selection) return;
    var noteField = view.selection.layer ? view.selection.layer.querySelector('[data-ac-input="note"]') : null;
    if (noteField) view.selection.note = noteField.value;
    view.selection.noteOpen = !view.selection.noteOpen;
    view.selection.state = "ready";
    renderSelection(view.selection.noteOpen ? "note" : "color");
  }

  function bindSelectionNoteInput(input) {
    if (!view.selection) return;
    view.selection.note = input.value;
    var host = input.closest(".ac-selbar");
    var count = host ? host.querySelector("[data-ac-note-count]") : null;
    if (count) {
      count.textContent = input.value.length + "/" + NOTE_MAX;
      count.setAttribute("data-over", input.value.length >= NOTE_MAX ? "true" : "false");
    }
  }

  /* ------------------------------------------------------------------ */
  /* Lector: mapa de secciones, párrafos y marcas                        */
  /* ------------------------------------------------------------------ */

  function mapSections(reader, sheet) {
    var map = [];
    var domSections = $$(".reader-section", reader);
    var cursor = 0;
    domSections.forEach(function (sectionEl) {
      var title = sectionEl.getAttribute("data-section-title") || "";
      var firstP = sectionEl.querySelector('p[data-paragraph-index="0"]');
      var firstText = firstP ? firstP.textContent : "";
      var matched = -1;
      for (var i = cursor; i < sheet.sections.length; i += 1) {
        var candidate = sheet.sections[i];
        var body = candidate && Array.isArray(candidate.body) ? candidate.body : [];
        var bodyFirst = typeof body[0] === "string" ? body[0] : "";
        if ((candidate.title || "") === title && (!firstText || !bodyFirst || bodyFirst === firstText)) {
          matched = i;
          break;
        }
      }
      if (matched < 0) {
        for (var j = cursor; j < sheet.sections.length; j += 1) {
          if ((sheet.sections[j].title || "") === title) { matched = j; break; }
        }
      }
      if (matched < 0) matched = num(sectionEl.getAttribute("data-section-index"), cursor);
      cursor = matched + 1;
      map.push({ el: sectionEl, index: matched, title: sheet.sections[matched] ? (sheet.sections[matched].title || title) : title });
    });
    return map;
  }

  function sectionEntry(index) {
    if (!view.reader) return null;
    for (var i = 0; i < view.reader.sections.length; i += 1) {
      if (view.reader.sections[i].index === index) return view.reader.sections[i];
    }
    return null;
  }

  function enhanceParagraphs() {
    if (!view.reader) return;
    view.reader.sections.forEach(function (entry) {
      $$('p[data-paragraph-index]', entry.el).forEach(function (p) {
        if (p.closest(".ac-para")) return;
        var paragraphIndex = num(p.getAttribute("data-paragraph-index"), 0);
        var wrapper = document.createElement("div");
        wrapper.className = "ac ac-para";
        wrapper.setAttribute("data-ac-component", "paragraph");
        wrapper.setAttribute("data-index", String(paragraphIndex));
        var button = document.createElement("button");
        button.type = "button";
        button.className = "ac-para__btn";
        button.setAttribute("data-ac-action", "paragraph:open");
        button.setAttribute("data-index", String(paragraphIndex));
        button.setAttribute("data-ac-section", String(entry.index));
        button.setAttribute("data-ac-sheet", view.reader.sheet.id);
        button.setAttribute("aria-label", "Subrayar el párrafo " + (paragraphIndex + 1) + " de «" + entry.title + "»: " + clip(p.textContent, 90));
        button.innerHTML = '<span class="ac-para__ico" aria-hidden="true">' + icon("highlighter", 15) + "</span>" +
          '<span class="ac-para__label">Subrayar</span>';
        p.parentNode.insertBefore(wrapper, p);
        wrapper.appendChild(p);
        wrapper.appendChild(button);
      });
    });
  }

  function buildMarkFragment(text, models) {
    var fragment = document.createDocumentFragment();
    var ranges = [];
    models.forEach(function (model) {
      var found = findQuote(text, model.quote, model.prefix, model.suffix);
      if (!found) return;
      ranges.push({ start: found.start, end: found.end, model: model });
    });
    ranges.sort(function (a, b) {
      return a.start - b.start || (b.end - b.start) - (a.end - a.start);
    });
    var cursor = 0;
    var lastEnd = 0;
    ranges.forEach(function (range) {
      if (range.start < lastEnd) return;
      if (range.start < cursor) return;
      if (range.start > cursor) fragment.appendChild(document.createTextNode(text.slice(cursor, range.start)));
      var mark = document.createElement("mark");
      mark.className = "ac-marktext";
      mark.setAttribute("data-mark", range.model.color);
      mark.setAttribute("data-ac-action", "annotation:open");
      mark.setAttribute("data-ac-id", range.model.id);
      mark.setAttribute("tabindex", "0");
      mark.setAttribute("role", "button");
      mark.setAttribute("aria-label", A.marks.label(range.model.color) + ": «" + clip(range.model.quote, 80) + "». Activar para ver la nota y las acciones.");
      mark.textContent = text.slice(range.start, range.end);
      fragment.appendChild(mark);
      cursor = range.end;
      lastEnd = range.end;
    });
    if (cursor < text.length) fragment.appendChild(document.createTextNode(text.slice(cursor)));
    return fragment;
  }

  function refreshReaderMarks() {
    if (!view.reader) return;
    var selection = global.getSelection ? global.getSelection() : null;
    if (selection && !selection.isCollapsed && view.reader.reader.contains(selection.anchorNode)) return;
    var models = [];
    try {
      models = annotationsForSheet(view.reader.sheet.id);
    } catch (e) {
      return;
    }
    var byParagraph = {};
    models.forEach(function (model) {
      var key = model.sectionIndex + ":" + model.paragraphIndex;
      (byParagraph[key] = byParagraph[key] || []).push(model);
    });
    var activeAnn = document.activeElement && document.activeElement.getAttribute
      ? document.activeElement.getAttribute("data-ac-id")
      : null;
    view.reader.sections.forEach(function (entry) {
      $$('p[data-paragraph-index]', entry.el).forEach(function (p) {
        var paragraphIndex = num(p.getAttribute("data-paragraph-index"), 0);
        var text = p.textContent || "";
        var list = byParagraph[entry.index + ":" + paragraphIndex] || [];
        if (!list.length) {
          if (p.querySelector(".ac-marktext")) p.textContent = text;
          return;
        }
        var hadMarks = !!p.querySelector(".ac-marktext");
        if (!hadMarks && !list.length) return;
        p.textContent = "";
        p.appendChild(buildMarkFragment(text, list));
      });
    });
    if (activeAnn) {
      var target = view.reader.reader.querySelector('[data-ac-action="annotation:open"][data-ac-id="' + activeAnn + '"]');
      if (target) safeFocus(target);
    }
  }

  function openReaderNote(annotationId, trigger) {
    if (view.selection) closeSelection(false, true);
    openAnnotationNote(annotationId, trigger);
  }

  /* ------------------------------------------------------------------ */
  /* Lector: rail y preferencias                                         */
  /* ------------------------------------------------------------------ */

  function ensureReaderRailHost() {
    if (!view.reader) return null;
    var reader = view.reader.reader;
    var host = $('[data-module-mount="reader-active"]', reader);
    if (host) return host;
    host = $(".reader-rail .ac-rail-active-host", reader);
    if (host) return host;
    host = document.createElement("div");
    host.className = "ac-rail-active-host";
    var progress = $(".rail-progress", reader);
    if (progress && progress.parentNode) progress.parentNode.insertBefore(host, progress.nextSibling);
    else {
      var rail = $(".reader-rail", reader);
      if (rail) rail.insertBefore(host, rail.firstChild);
    }
    return host;
  }

  function railHTML(models, error) {
    var annotations = models || [];
    var orphans = annotations.filter(function (item) { return item.orphan; });
    var open = openDoubts().length;
    var rail = "";
    try {
      rail = CP.highlightsPanel({
        id: "ac-hl-rail-" + view.reader.sheet.id,
        view: "rail",
        annotations: annotations,
        filters: { colors: [], query: "", scope: "all" },
        state: error ? "error" : "ready",
        error: error ? safeError(error, "No se pudieron leer los subrayados de esta ficha.") : "",
        limit: 3
      });
    } catch (e) {
      rail = CP.stateCard({
        tone: "error", icon: "alert", title: "No se pudieron leer los subrayados",
        text: "El almacenamiento local no respondió. Tus notas siguen en el navegador.",
        actions: [{ label: "Reintentar", action: "highlights:retry", icon: "rotate", variant: "soft" }]
      });
    }
    var orphanNotice = orphans.length
      ? '<div class="ac-railnotice">' + icon("linkOff", 14) +
        "<div><b>" + orphans.length + " " + plural(orphans.length, "subrayado necesita", "subrayados necesitan") + " atención</b>" +
        "<p>La cita y la nota se conservan. Puedes recuperarlos o eliminarlos en Mis subrayados.</p>" +
        '<a href="#/subrayados" data-nav>Revisar huérfanos</a></div></div>'
      : "";
    var doubtsLink = open
      ? '<a class="ac-railmore ac-railmore--doubt" href="#/dudas" data-nav><span class="ac-railmore__ico" aria-hidden="true">' + icon("flag", 14) + "</span>" +
        "<span>" + open + " " + plural(open, "duda abierta", "dudas abiertas") + "</span></a>"
      : "";
    var details = '<details class="ac ac-railprefs" data-ac-prefs="rail"' + (state.railPrefsOpen ? " open" : "") + ">" +
      '<summary class="ac-railprefs__summary"><span class="ac-railprefs__title">Preferencias de lectura</span><span class="ac-railprefs__hint">Pausa y teclado</span></summary>' +
      '<div class="ac-railprefs__body">' +
        CP.recallSwitch({
          id: "ac-recall-rail",
          enabled: !!state.prefs.recallPause,
          frequency: state.prefs.recallEvery,
          state: state.prefsStored ? "ready" : "error"
        }) +
        prefsSwitchHTML("rail") +
      "</div></details>";
    return '<div class="ac ac-railwrap">' + rail + orphanNotice + doubtsLink +
      '<a class="ac-railmore" href="#/subrayados" data-nav><span class="ac-railmore__ico" aria-hidden="true">' + icon("bookmark", 14) + "</span>" +
        "<span>Ver todos mis subrayados</span><b>" + annotations.length + "</b></a>" +
      details + "</div>";
  }

  function renderRail(focusSelector) {
    if (!view.reader) return;
    var host = ensureReaderRailHost();
    if (!host) return;
    var spec = typeof focusSelector === "string" ? { type: "action", selector: focusSelector } : captureFocus(host);
    var models = [];
    var error = null;
    if (!storeReady()) {
      host.innerHTML = '<div class="ac ac-railwrap">' + CP.skeleton({ rows: 2, label: "Cargando tus subrayados" }) + "</div>";
      return;
    }
    try {
      models = annotationsForSheet(view.reader.sheet.id);
    } catch (e) {
      error = e;
    }
    host.innerHTML = railHTML(models, error);
    if (typeof focusSelector === "string") {
      var target = $(focusSelector, host);
      if (target) safeFocus(target);
    } else if (spec) {
      restoreFocus(host, spec);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Lector: pausa de recuerdo                                           */
  /* ------------------------------------------------------------------ */

  function pauseStateFor(sheetId, sectionIndex) {
    if (!state.pauses[sheetId]) state.pauses[sheetId] = {};
    var map = state.pauses[sheetId];
    if (!map[sectionIndex]) {
      map[sectionIndex] = {
        state: "ask",
        rating: null,
        freeAnswer: "",
        error: "",
        dismissed: false,
        cardId: "",
        question: "",
        answer: ""
      };
    }
    return map[sectionIndex];
  }

  function capturePauseDrafts() {
    if (!view.reader) return;
    $$(".ac-pause[data-ac-owned]", view.reader.reader).forEach(function (pause) {
      var sectionIndex = num(pause.getAttribute("data-ac-section"), -1);
      if (sectionIndex < 0) return;
      var entry = pauseStateFor(view.reader.sheet.id, sectionIndex);
      var field = pause.querySelector('[data-ac-input="answer"]');
      if (field) entry.freeAnswer = field.value;
    });
  }

  function pausedForSection(sheetId, sectionIndex, cardId, question, answer) {
    var entry = pauseStateFor(sheetId, sectionIndex);
    if (entry.state === "saving") entry.state = "ask";
    entry.cardId = cardId;
    entry.question = question;
    entry.answer = answer;
    return entry;
  }

  function pauseElementHTML(sheet, entry, sectionIndex, card, sectionTitle) {
    var html = CP.recallPause({
      id: "ac-pause-" + sheet.id + "-" + sectionIndex,
      cardId: card.id,
      question: card.question,
      answer: card.answer,
      freeAnswer: entry.freeAnswer || "",
      rating: entry.rating,
      state: entry.state,
      error: entry.error,
      sheetTitle: sheet.title || "",
      sectionTitle: sectionTitle || ""
    });
    var template = document.createElement("template");
    template.innerHTML = html;
    var pause = template.content.firstElementChild;
    if (pause) {
      pause.setAttribute("data-ac-owned", "true");
      pause.setAttribute("data-ac-section", String(sectionIndex));
      pause.setAttribute("data-ac-sheet", sheet.id);
      pause.setAttribute("data-ac-card", card.id);
    }
    return pause;
  }

  function renderPauses(focusSelector) {
    if (!view.reader) return;
    var reader = view.reader.reader;
    var sheet = view.reader.sheet;
    var spec = typeof focusSelector === "string" ? null : captureFocus(reader);
    capturePauseDrafts();
    $$(".ac-pause[data-ac-owned]", reader).forEach(function (pause) {
      if (pause.parentNode) pause.parentNode.removeChild(pause);
    });
    if (!state.prefs.recallPause) return;
    var cards = pauseCards(sheet.id);
    if (!cards.length) return;
    var st = Store.getSheetState(sheet.id) || {};
    var completedAt = timestamp(st.completedAt);
    var recentlyCompleted = completedAt && (Date.now() - completedAt) < RECENT_COMPLETION_MS;
    var coreCount = 0;
    var coreIndexes = [];
    sheet.sections.forEach(function (section, index) {
      if (section.depth === "core") { coreCount += 1; coreIndexes.push(index); }
    });
    if (!coreCount) return;
    var lastCore = coreIndexes[coreIndexes.length - 1];
    var slots = [];
    coreIndexes.forEach(function (sectionIndex, position) {
      if ((position + 1) % state.prefs.recallEvery === 0) {
        slots.push({ sectionIndex: sectionIndex, ordinal: position + 1 });
      }
    });
    /* En una ficha recién completada la última sección deja su lugar a la
       confianza. Si ese era el único hueco, la pausa pasa a la primera sección
       esencial para no borrar la práctica entera. */
    if (recentlyCompleted && slots.length && slots[slots.length - 1].sectionIndex === lastCore) {
      slots.pop();
      if (!slots.length && coreIndexes.length > 1) {
        slots.push({ sectionIndex: coreIndexes[0], ordinal: 1 });
      }
    }
    slots.forEach(function (slot) {
      var sectionIndex = slot.sectionIndex;
      var entryElement = sectionEntry(sectionIndex);
      if (!entryElement) return;
      var entry = pauseStateFor(sheet.id, sectionIndex);
      if (entry.dismissed) return;
      var card = cards[Math.max(0, slot.ordinal - 1) % cards.length];
      var prepared = pausedForSection(sheet.id, sectionIndex, card.id, card.question, card.answer);
      var pause = pauseElementHTML(sheet, prepared, sectionIndex, card, entryElement.title);
      if (!pause) return;
      entryElement.el.appendChild(pause);
      if (prepared.state === "ask") {
        var field = pause.querySelector('[data-ac-input="answer"]');
        if (field && prepared.freeAnswer) field.value = prepared.freeAnswer;
      }
    });
    if (spec) restoreFocus(reader, spec);
    if (typeof focusSelector === "string") {
      var target = $(focusSelector, reader);
      if (target) safeFocus(target);
    }
  }

  function pauseContext(el) {
    if (!view.reader) return null;
    var pause = el && el.closest ? el.closest(".ac-pause[data-ac-owned]") : null;
    if (!pause) return null;
    var sectionIndex = num(pause.getAttribute("data-ac-section"), -1);
    if (sectionIndex < 0) return null;
    var entry = pauseStateFor(view.reader.sheet.id, sectionIndex);
    return {
      pause: pause,
      sectionIndex: sectionIndex,
      entry: entry,
      sheet: view.reader.sheet
    };
  }

  function saveRecallRating(context, rating, isRetry) {
    if (!context) return;
    var entry = context.entry;
    if (!entry.cardId || !entry.question || !entry.answer) {
      entry.state = "ask";
      renderPauses();
      return;
    }
    entry.rating = rating;
    entry.state = "saving";
    entry.error = "";
    renderPauses();
    var record = withSilence(function () {
      return Store.recall.add({
        sheetId: context.sheet.id,
        cardId: entry.cardId,
        sectionIndex: context.sectionIndex,
        question: entry.question,
        answer: entry.answer,
        rating: rating
      });
    });
    if (!record) {
      entry.state = "error";
      entry.error = "No se pudo guardar la autoevaluación. Puedes seguir leyendo o reintentar.";
      renderPauses();
      announce("No se pudo guardar la autoevaluación.");
      return;
    }
    entry.state = "rated";
    entry.error = "";
    renderPauses('[data-ac-section="' + context.sectionIndex + '"] [data-ac-action="recall:close"]');
    announce("Autoevaluación guardada.");
  }

  function handleRecall(action, el) {
    var context = pauseContext(el);
    if (!context) return;
    var entry = context.entry;
    if (action === "recall:reveal") {
      capturePauseDrafts();
      entry.state = "revealed";
      renderPauses('[data-ac-section="' + context.sectionIndex + '"] [data-ac-focus="answer"]');
    } else if (action === "recall:rate") {
      saveRecallRating(context, el.getAttribute("data-value") || "good");
    } else if (action === "recall:skip") {
      capturePauseDrafts();
      entry.state = "skipped";
      renderPauses('[data-ac-section="' + context.sectionIndex + '"] [data-ac-action="recall:reopen"]');
      withSilence(function () {
        Store.recall.add({
          sheetId: context.sheet.id,
          cardId: entry.cardId,
          sectionIndex: context.sectionIndex,
          question: entry.question,
          answer: entry.answer,
          rating: "skipped"
        });
      });
      announce("Pausa saltada. Puedes reabrirla cuando quieras.");
    } else if (action === "recall:close") {
      entry.dismissed = true;
      renderPauses();
      var section = sectionEntry(context.sectionIndex);
      var heading = section ? section.el.querySelector("h2") : null;
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        safeFocus(heading);
      } else {
        focusFallback();
      }
    } else if (action === "recall:reopen") {
      entry.state = "ask";
      renderPauses('[data-ac-section="' + context.sectionIndex + '"] [data-ac-action="recall:reveal"]');
    } else if (action === "recall:retry") {
      saveRecallRating(context, entry.rating || "good", true);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Lector: modo recordar                                               */
  /* ------------------------------------------------------------------ */

  function memoryState(sheetId) {
    if (!state.memory[sheetId]) {
      state.memory[sheetId] = { on: false, revealed: [] };
    }
    return state.memory[sheetId];
  }

  function renderMemory(focusSelector) {
    if (!view.reader) return;
    var sheet = view.reader.sheet;
    var concepts = Array.isArray(sheet.keyConcepts) ? sheet.keyConcepts.filter(Boolean) : [];
    var host = $(".reader-concepts", view.reader.reader);
    if (!host) return;
    var existingBar = $(".ac-memorybar", host);
    var existingMode = $(".ac-memoryhost", host);
    var grid = $(".concept-grid", host);
    if (!concepts.length) {
      if (existingBar && existingBar.parentNode) existingBar.parentNode.removeChild(existingBar);
      if (existingMode && existingMode.parentNode) existingMode.parentNode.removeChild(existingMode);
      if (grid) grid.hidden = false;
      return;
    }
    var mem = memoryState(sheet.id);
    if (!existingBar) {
      existingBar = document.createElement("div");
      existingBar.className = "ac ac-memorybar";
      if (grid && grid.parentNode) grid.parentNode.insertBefore(existingBar, grid);
      else host.appendChild(existingBar);
    }
    existingBar.innerHTML = '<div class="ac-memorybar__copy">' +
        '<span class="ac-kicker"><span class="ac-dot" aria-hidden="true"></span>Recuerdo activo</span>' +
        '<p>Oculta los conceptos e intenta decirlos antes de revelarlos.</p></div>' +
      '<button class="ac-btn ' + (mem.on ? "ac-btn--soft" : "ac-btn--ghost") + ' ac-btn--sm" type="button" data-ac-action="memory:mode" aria-pressed="' + (mem.on ? "true" : "false") + '">' +
        '<span class="ac-btn__ico" aria-hidden="true">' + icon(mem.on ? "eye" : "eyeOff", 14) + "</span>" +
        (mem.on ? "Salir del modo recordar" : "Activar modo recordar") + "</button>";
    if (grid) grid.hidden = !!mem.on;
    if (mem.on) {
      if (!existingMode) {
        existingMode = document.createElement("div");
        existingMode.className = "ac-memoryhost";
        if (existingBar.parentNode) existingBar.parentNode.insertBefore(existingMode, existingBar.nextSibling);
        else host.appendChild(existingMode);
      }
      existingMode.innerHTML = CP.recallMode({
        id: "ac-memory-" + sheet.id,
        concepts: concepts,
        revealed: mem.revealed,
        title: "Conceptos clave",
        subtitle: "Intenta decirlos antes de revelar. La ficha queda a la vista."
      });
    } else if (existingMode && existingMode.parentNode) {
      existingMode.parentNode.removeChild(existingMode);
    }
    if (typeof focusSelector === "string") {
      var target = $(focusSelector, host);
      if (target) safeFocus(target);
    }
  }

  function handleMemory(action, el) {
    if (!view.reader) return;
    var sheet = view.reader.sheet;
    var mem = memoryState(sheet.id);
    var concepts = Array.isArray(sheet.keyConcepts) ? sheet.keyConcepts : [];
    if (action === "memory:mode") {
      mem.on = !mem.on;
      if (mem.on && !mem.revealed.length) mem.revealed = concepts.map(function () { return false; });
      renderMemory('[data-ac-action="memory:mode"]');
      announce(mem.on ? "Modo recordar activado." : "Modo recordar desactivado.");
    } else if (action === "memory:toggle") {
      var index = num(el.getAttribute("data-index"), -1);
      if (index < 0) return;
      mem.revealed[index] = !mem.revealed[index];
      renderMemory('[data-ac-action="memory:toggle"][data-index="' + index + '"]');
    } else if (action === "memory:all") {
      mem.revealed = concepts.map(function () { return true; });
      renderMemory('[data-ac-action="memory:none"]');
    } else if (action === "memory:none") {
      mem.revealed = concepts.map(function () { return false; });
      renderMemory('[data-ac-action="memory:all"]');
    }
  }

  /* ------------------------------------------------------------------ */
  /* Lector: confianza                                                   */
  /* ------------------------------------------------------------------ */

  function confidenceHost() {
    if (!view.reader) return null;
    var main = $(".reader-main", view.reader.reader);
    if (!main) return null;
    var host = $(".ac-confhost", main);
    if (host) return host;
    host = document.createElement("div");
    host.className = "ac-confhost";
    var practice = $(".reader-practice", main);
    var sections = $(".reader-sections", main);
    var anchor = practice || sections;
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(host, anchor.nextSibling);
    else main.appendChild(host);
    return host;
  }

  function confidenceUI(sheetId) {
    if (!state.confidence[sheetId]) state.confidence[sheetId] = { value: null, state: "idle", error: "", dismiss: false };
    return state.confidence[sheetId];
  }

  function renderConfidence(focusSelector) {
    if (!view.reader) return;
    var sheet = view.reader.sheet;
    var host = confidenceHost();
    if (!host) return;
    var st = Store.getSheetState(sheet.id) || {};
    if (!st.completedAt) {
      host.innerHTML = "";
      return;
    }
    var ui = confidenceUI(sheet.id);
    if (ui.dismiss) {
      host.innerHTML = "";
      return;
    }
    var record = null;
    try { record = Store.sheetConfidence.get(sheet.id); } catch (e) { record = null; }
    var value = ui.value || (record ? record.value : null);
    var pickerState = ui.state;
    if (ui.state === "idle" && record) pickerState = "saved";
    if (ui.state === "selected" && !value) pickerState = "idle";
    if (ui.state === "saved" && !value) pickerState = "idle";
    host.innerHTML = CP.confidencePicker({
      id: "ac-conf-" + sheet.id,
      sheetId: sheet.id,
      value: value,
      state: pickerState,
      updatedAt: record ? record.updatedAt : null,
      title: "¿Cómo te sientes con esta ficha?",
      hint: "Opcional. No bloquea la lectura; puedes cambiarlo o quitarlo cuando quieras."
    });
    if (typeof focusSelector === "string") {
      var target = $(focusSelector, host);
      if (target) safeFocus(target);
    }
  }

  function handleConfidence(action, el) {
    if (!view.reader) return;
    var sheet = view.reader.sheet;
    var ui = confidenceUI(sheet.id);
    if (action === "confidence:pick") {
      ui.value = el.getAttribute("data-value") || null;
      ui.state = "selected";
      ui.error = "";
      renderConfidence('[data-ac-action="confidence:pick"][data-value="' + ui.value + '"]');
    } else if (action === "confidence:dismiss") {
      ui.dismiss = true;
      renderConfidence();
      announce("Puedes responder más tarde desde la ficha.");
    } else if (action === "confidence:edit") {
      ui.state = "selected";
      renderConfidence('[data-ac-action="confidence:pick"][data-value="' + (ui.value || "solid") + '"]');
    } else if (action === "confidence:save") {
      if (!ui.value) return;
      ui.state = "saving";
      ui.error = "";
      renderConfidence();
      var record = withSilence(function () { return Store.sheetConfidence.set(sheet.id, ui.value); });
      if (!record) {
        ui.state = "error";
        ui.error = "No se pudo guardar la confianza. Tu lectura no se bloquea; reintenta cuando puedas.";
        renderConfidence('[data-ac-action="confidence:save"]');
        announce("No se pudo guardar la confianza.");
        return;
      }
      ui.state = "saved";
      ui.error = "";
      renderConfidence('[data-ac-action="confidence:edit"]');
      announce("Confianza guardada.");
    } else if (action === "confidence:clear") {
      withSilence(function () { return Store.sheetConfidence.clear(sheet.id); });
      ui.value = null;
      ui.state = "idle";
      ui.error = "";
      renderConfidence('[data-ac-action="confidence:pick"]');
      announce("Confianza eliminada; la ficha sigue completada.");
    }
  }

  /* ------------------------------------------------------------------ */
  /* Lector: montaje y listeners                                         */
  /* ------------------------------------------------------------------ */

  function readerSetup(ctx) {
    teardownReader();
    var reader = ctx.root ? $("article.reader[data-sheet-id]", ctx.root) : $("article.reader[data-sheet-id]");
    if (!reader) return;
    var sheet = ctx.sheet || sheetById(reader.getAttribute("data-sheet-id"));
    if (!sheet) return;
    view.reader = {
      sheet: sheet,
      reader: reader,
      sections: [],
      listeners: []
    };
    view.reader.sections = mapSections(reader, sheet);
    enhanceParagraphs();
    refreshReaderMarks();
    renderRail();
    renderMemory();
    renderConfidence();
    renderPauses();
    attachReaderEvents();
    consumePendingGoto();
  }

  function attachReaderEvents() {
    if (!view.reader) return;
    function mouseUp(event) {
      if (event.button !== 0) return;
      if (event.target && event.target.closest && event.target.closest(".ac-layer")) return;
      global.setTimeout(function () {
        if (!view.reader || view.selection) return;
        var details = readParagraphSelection(view.reader.reader);
        if (!details) return;
        if (details.error) {
          announce(details.error);
          return;
        }
        details.touch = false;
        openSelectionFromText(details);
      }, 0);
    }
    function touchEnd(event) {
      if (!view.reader) return;
      if (event.target && event.target.closest && event.target.closest("button, a, .ac-layer, [data-ac-action]")) return;
      if (state.touchTimer) global.clearTimeout(state.touchTimer);
      state.touchTimer = global.setTimeout(function () {
        state.touchTimer = null;
        if (!view.reader || view.selection) return;
        var details = readParagraphSelection(view.reader.reader);
        if (!details) return;
        if (details.error) {
          announce(details.error);
          return;
        }
        details.touch = true;
        openSelectionFromText(details);
      }, TOUCH_SELECTION_DELAY);
    }
    function scrollClose() {
      if (view.selection && !view.selection.touch) {
        closeSelection(true);
      }
    }
    view.reader.reader.addEventListener("mouseup", mouseUp);
    view.reader.reader.addEventListener("touchend", touchEnd, { passive: true });
    global.addEventListener("scroll", scrollClose, { passive: true });
    view.reader.listeners.push(function () {
      view.reader.reader.removeEventListener("mouseup", mouseUp);
      view.reader.reader.removeEventListener("touchend", touchEnd);
      global.removeEventListener("scroll", scrollClose);
    });
  }

  function teardownReader() {
    if (state.touchTimer) {
      global.clearTimeout(state.touchTimer);
      state.touchTimer = null;
    }
    if (state.selectionCloseTimer) {
      global.clearTimeout(state.selectionCloseTimer);
      state.selectionCloseTimer = null;
    }
    if (view.selection) closeSelection(false, true);
    if (view.overlay) closeOverlay(false, true);
    if (view.reader) {
      view.reader.listeners.forEach(function (off) { try { off(); } catch (e) {} });
    }
    view.reader = null;
  }

  /* ------------------------------------------------------------------ */
  /* Rutas: Mis subrayados y Bandeja de dudas                            */
  /* ------------------------------------------------------------------ */

  function routeRoot() {
    return view.route && view.route.ctx ? (view.route.ctx.root || $("#view-root")) : $("#view-root");
  }

  function highlightsScopes(models) {
    var areas = {};
    var sheets = {};
    (models || []).forEach(function (model) {
      if (model.areaId) areas[model.areaId] = model.areaTitle || model.areaId;
      if (model.sheetId) sheets[model.sheetId] = model.sheetTitle || model.sheetId;
    });
    var out = [{ value: "all", label: "Todas las fichas" }];
    Object.keys(areas).sort(function (a, b) { return areas[a].localeCompare(areas[b], "es"); }).forEach(function (id) {
      out.push({ value: id, label: "Área · " + clip(areas[id], 44) });
    });
    Object.keys(sheets).sort(function (a, b) { return sheets[a].localeCompare(sheets[b], "es"); }).forEach(function (id) {
      out.push({ value: id, label: "Ficha · " + clip(sheets[id], 44) });
    });
    return out;
  }

  function highlightsPanelHTML(models, error) {
    var scopes = highlightsScopes(models);
    var scopeExists = scopes.some(function (scope) { return scope.value === state.filters.scope; });
    if (!scopeExists) state.filters.scope = "all";
    var panelState = error ? "error" : "ready";
    return CP.highlightsPanel({
      id: "ac-hl-page",
      view: "full",
      kicker: "Tus marcas",
      title: "Todas tus marcas",
      titleTag: "h2",
      annotations: models,
      filters: state.filters,
      scopes: scopes,
      keyHint: false,
      state: panelState,
      error: error ? safeError(error, "El almacenamiento local no respondió. Tus notas siguen en el navegador.") : ""
    });
  }

  function enhanceHighlightRows(host, models) {
    if (!host) return;
    /* La pista de tecla «/» pertenece a la búsqueda de biblioteca; en esta
       ruta no hay atajo registrado, así que se retira para no prometerlo. */
    $$(".ac-search .ac-kbd", host).forEach(function (hint) {
      if (hint.parentNode) hint.parentNode.removeChild(hint);
    });
    var byId = {};
    (models || []).forEach(function (model) { byId[model.id] = model; });
    $$(".ac-hlrow", host).forEach(function (row) {
      var id = row.getAttribute("data-ac-id");
      var model = byId[id];
      if (!model) return;
      var when = $(".ac-hlrow__when", row);
      if (when && model.updatedAt) when.setAttribute("title", absolute(model.updatedAt));
      var footer = $(".ac-hlrow__foot", row);
      if (!footer) return;
      var del = $('[data-ac-action="highlights:delete"]', footer);
      if (model.orphan && model.located && model.located.sheet) {
        var recover = document.createElement("button");
        recover.type = "button";
        recover.className = "ac-btn ac-btn--soft ac-btn--sm";
        recover.setAttribute("data-ac-action", "highlights:recover");
        recover.setAttribute("data-ac-id", id);
        recover.innerHTML = '<span class="ac-btn__ico" aria-hidden="true">' + icon("undo", 14) + "</span>Recuperar";
        footer.insertBefore(recover, del || null);
      }
      var card = cardForAnnotation(id);
      var cardButton = document.createElement("button");
      cardButton.type = "button";
      cardButton.className = "ac-btn ac-btn--ghost ac-btn--sm";
      cardButton.setAttribute("data-ac-action", "ucard:from");
      cardButton.setAttribute("data-ac-id", id);
      cardButton.innerHTML = '<span class="ac-btn__ico" aria-hidden="true">' + icon("cards", 14) + "</span>" +
        (card ? "Editar tarjeta" : "Crear tarjeta");
      footer.insertBefore(cardButton, del || null);
    });
  }

  function renderHighlightsPanelHost(focusSelector) {
    if (!view.route || view.route.name !== "subrayados") return;
    var root = routeRoot();
    var host = $("#ac-hl-panelhost", root);
    if (!host) return;
    var spec = captureFocus(host);
    if (!storeReady()) {
      host.innerHTML = CP.skeleton({ rows: 4, label: "Cargando tus subrayados" });
      return;
    }
    var models = [];
    var error = null;
    try {
      models = allAnnotations();
    } catch (e) {
      error = e;
      models = [];
    }
    host.innerHTML = highlightsPanelHTML(models, error);
    enhanceHighlightRows(host, models);
    var restored = spec ? restoreFocus(host, spec) : false;
    if (!restored && typeof focusSelector === "string") {
      var target = $(focusSelector, host);
      if (target) safeFocus(target);
    }
  }

  function cardsSectionHTML(cards) {
    var count = cards.length;
    var body;
    if (!count) {
      body = '<div class="ac-ucards__empty">' + icon("cards", 18) +
        '<p>Todavía no hay tarjetas propias. Abre cualquier subrayado y crea una con su cita como frente.</p></div>';
    } else {
      body = '<ul class="ac-ucardlist">' + cards.map(function (card) {
        return '<li class="ac-ucardlist__row" data-ac-ucard-id="' + esc(card.id) + '">' +
          '<div class="ac-ucardlist__body">' +
            '<p class="ac-ucardlist__front">' + esc(card.front) + "</p>" +
            '<p class="ac-ucardlist__back">' + esc(card.back) + "</p>" +
            '<p class="ac-ucardlist__meta">' + esc(card.sheetTitle || "Ficha") + (card.annotationId ? " · desde un subrayado" : "") + "</p>" +
          "</div>" +
          '<div class="ac-ucardlist__actions">' +
            '<button class="ac-btn ac-btn--ghost ac-btn--sm" type="button" data-ac-action="ucard:edit" data-ac-id="' + esc(card.id) + '">' +
              '<span class="ac-btn__ico" aria-hidden="true">' + icon("note", 14) + "</span>Editar</button>" +
            (card.href ? '<a class="ac-btn ac-btn--quiet ac-btn--sm" href="' + esc(card.href) + '" data-nav>Ir a la ficha</a>' : "") +
          "</div></li>";
      }).join("") + "</ul>";
    }
    return '<header class="ac-ucards__head"><div><span class="ac-kicker"><span class="ac-dot" aria-hidden="true"></span>Estudio propio</span>' +
      '<h2 id="ac-ucards-title">Tarjetas propias <span class="ac-countbadge"><span aria-hidden="true">' + count + "</span><span class=\"ac-sr\"> " + count + " tarjetas propias</span></span></h2>" +
      '<p>Salen de tus subrayados. No cambian las cajas de Flashcards.</p></div></header>' + body;
  }

  function hydrateHighlightsRoute(options) {
    if (!view.route || view.route.name !== "subrayados") return;
    var opts = options || {};
    var root = routeRoot();
    if (!root) return;
    var spec = captureFocus(root);
    var models = [];
    var doubts = [];
    var cards = [];
    var error = null;
    try {
      models = allAnnotations();
      doubts = allDoubts();
      cards = allUserCards();
    } catch (e) {
      error = e;
    }
    var open = doubts.filter(function (doubt) { return !doubt.resolved; }).length;
    var orphanCount = models.filter(function (model) { return model.orphan; }).length;
    var subtitle = models.length
      ? models.length + " " + plural(models.length, "subrayado", "subrayados") +
        " · " + models.filter(function (model) { return model.note; }).length + " con nota" +
        " · " + open + " " + plural(open, "duda abierta", "dudas abiertas") +
        (orphanCount ? " · " + orphanCount + " " + plural(orphanCount, "ancla perdida", "anclas perdidas") : "")
      : "Marca un párrafo mientras lees y aparecerá aquí con su cita, su nota y su contexto.";
    setText($("#ac-hl-sub", root), subtitle);
    var panelHost = $("#ac-hl-panelhost", root);
    if (panelHost) {
      if (!storeReady()) {
        panelHost.innerHTML = CP.skeleton({ rows: 4, label: "Cargando tus subrayados" });
      } else {
        panelHost.innerHTML = highlightsPanelHTML(models, error);
        enhanceHighlightRows(panelHost, models);
      }
    }
    var cardsHost = $("#ac-ucards-host", root);
    if (cardsHost) cardsHost.innerHTML = cardsSectionHTML(cards);
    var prefsHost = $("#ac-hl-prefshost", root);
    if (prefsHost) prefsHost.innerHTML = prefsBlockHTML("page");
    var restored = spec ? restoreFocus(root, spec) : false;
    if (!restored && typeof opts.focusSelector === "string") {
      var target = $(opts.focusSelector, root);
      if (target) safeFocus(target);
    }
  }

  function renderHighlightsRoute() {
    return '<section class="ac ac-page" aria-labelledby="ac-hl-title">' +
      '<header class="ac-pagehead">' +
        '<a class="ac-back" href="#/" data-nav><span aria-hidden="true">' + icon("arrowLeft", 14) + "</span>Panel</a>" +
        '<span class="ac-kicker"><span class="ac-dot" aria-hidden="true"></span>Lectura activa</span>' +
        '<h1 id="ac-hl-title">Mis subrayados</h1>' +
        '<p class="ac-pagesub" id="ac-hl-sub">Cargando tus marcas…</p>' +
        '<div class="ac-pagelinks">' +
          '<a class="ac-btn ac-btn--ghost ac-btn--sm" href="#/dudas" data-nav>' + icon("flag", 14) + " Bandeja de dudas</a>" +
          '<a class="ac-btn ac-btn--ghost ac-btn--sm" href="#/biblioteca" data-nav>' + icon("book", 14) + " Seguir leyendo</a>" +
        "</div>" +
      "</header>" +
      '<div id="ac-hl-panelhost" class="ac-page__panel"></div>' +
      '<section id="ac-ucards-host" class="ac ac-ucards" aria-labelledby="ac-ucards-title"></section>' +
      '<div id="ac-hl-prefshost"></div>' +
      "</section>";
  }

  function mountHighlightsRoute(ctx) {
    view.route = { name: "subrayados", ctx: ctx, root: ctx.root };
    hydrateHighlightsRoute();
  }

  function unmountRoute() {
    if (view.overlay) closeOverlay(false, true);
    view.route = null;
  }

  function doubtsCounts(list) {
    var open = 0;
    var resolved = 0;
    (list || []).forEach(function (doubt) {
      if (doubt.resolved) resolved += 1;
      else open += 1;
    });
    return { all: (list || []).length, open: open, resolved: resolved };
  }

  function doubtsFiltersHTML(counts) {
    var filters = [
      { value: "open", label: "Abiertas", count: counts.open },
      { value: "resolved", label: "Resueltas", count: counts.resolved },
      { value: "all", label: "Todas", count: counts.all }
    ];
    return filters.map(function (filter) {
      return '<button class="ac-chipf" type="button" data-ac-action="doubts:filter" data-value="' + filter.value + '" aria-pressed="' +
        (state.doubts.filter === filter.value ? "true" : "false") + '">' + filter.label + " <b>" + filter.count + "</b></button>";
    }).join("");
  }

  function doubtRowHTML(doubt) {
    var annotationLink = doubt.annotation
      ? '<button class="ac-btn ac-btn--ghost ac-btn--sm" type="button" data-ac-action="highlights:note" data-ac-id="' + esc(doubt.annotationId) + '">' +
        '<span class="ac-btn__ico" aria-hidden="true">' + icon("bookmark", 14) + "</span>Ver subrayado</button>"
      : "";
    var context = doubt.sheetTitle
      ? esc(doubt.sheetTitle) + (doubt.sectionTitle ? " · " + esc(doubt.sectionTitle) : "")
      : "Ficha no disponible · el texto de la duda se conserva";
    return '<article class="ac ac-doubtrow" data-ac-id="' + esc(doubt.id) + '" data-state="' + (doubt.resolved ? "resolved" : "open") + '">' +
      '<header class="ac-doubtrow__head">' +
        '<span class="ac-badge ' + (doubt.resolved ? "ac-badge--ok" : "ac-badge--warn") + '">' +
          icon(doubt.resolved ? "checkCircle" : "flag", 12) + (doubt.resolved ? "Resuelta" : "Abierta") + "</span>" +
        '<span class="ac-doubtrow__when" title="' + esc(doubt.resolvedAt ? absolute(doubt.resolvedAt) : absolute(doubt.updatedAt)) + '">' +
          esc(doubt.resolved ? "Resuelta " + relative(doubt.resolvedAt) : "Creada " + relative(doubt.createdAt)) + "</span>" +
      "</header>" +
      '<blockquote class="ac-doubtrow__quote">“' + esc(doubt.quote) + "”</blockquote>" +
      '<p class="ac-doubtrow__context">' + icon(doubt.sheetTitle ? "book" : "linkOff", 12) + context + "</p>" +
      (doubt.note ? '<p class="ac-doubtrow__note"><span>Nota</span>' + esc(doubt.note) + "</p>" : "") +
      '<footer class="ac-doubtrow__foot">' +
        (doubt.sheetTitle
          ? '<button class="ac-btn ac-btn--soft ac-btn--sm" type="button" data-ac-action="doubts:goto" data-ac-id="' + esc(doubt.id) + '">' +
            '<span class="ac-btn__ico" aria-hidden="true">' + icon("cornerDown", 14) + "</span>Ir al contexto</button>"
          : "") +
        annotationLink +
        '<button class="ac-btn ' + (doubt.resolved ? "ac-btn--ghost" : "ac-btn--primary") + ' ac-btn--sm" type="button" data-ac-action="' +
          (doubt.resolved ? "doubts:reopen" : "doubts:resolve") + '" data-ac-id="' + esc(doubt.id) + '">' +
          '<span class="ac-btn__ico" aria-hidden="true">' + icon(doubt.resolved ? "undo" : "check", 14) + "</span>" +
          (doubt.resolved ? "Reabrir" : "Resolver") + "</button>" +
      "</footer></article>";
  }

  function doubtsResultsHTML(all, error) {
    if (error) {
      return CP.stateCard({
        tone: "error", icon: "alert", title: "No se pudieron leer las dudas",
        text: safeError(error, "El almacenamiento local no respondió. Tus dudas siguen en el navegador."),
        actions: [{ label: "Reintentar", action: "doubts:retry", icon: "rotate", variant: "soft" }]
      });
    }
    if (!all.length) {
      return CP.stateCard({
        tone: "empty", icon: "flag", title: "Todavía no hay dudas",
        text: "Marca un párrafo con el color Duda y aparecerá aquí. Resolverla no borra el subrayado.",
        actions: [{ label: "Volver a la lectura", action: "doubts:back", icon: "arrowLeft", variant: "soft" }]
      });
    }
    var query = U.normalize(state.doubts.query);
    var filtered = all.filter(function (doubt) {
      if (state.doubts.filter === "open" && doubt.resolved) return false;
      if (state.doubts.filter === "resolved" && !doubt.resolved) return false;
      if (query) {
        var hay = U.normalize([doubt.quote, doubt.note, doubt.sheetTitle, doubt.sectionTitle].join(" "));
        if (hay.indexOf(query) === -1) return false;
      }
      return true;
    });
    if (!filtered.length) {
      var actions;
      if (query) actions = [{ label: "Limpiar búsqueda", action: "doubts:clear", icon: "undo", variant: "soft" }];
      else if (state.doubts.filter === "open") actions = [{ label: "Ver resueltas", action: "doubts:filter", value: "resolved", icon: "checkCircle", variant: "soft" }];
      else if (state.doubts.filter === "resolved") actions = [{ label: "Ver abiertas", action: "doubts:filter", value: "open", icon: "flag", variant: "soft" }];
      else actions = [{ label: "Limpiar búsqueda", action: "doubts:clear", icon: "undo", variant: "soft" }];
      return CP.stateCard({
        tone: "empty", icon: "search", title: "Ninguna duda coincide",
        text: query ? "Prueba con otra palabra o limpia la búsqueda." : "No hay dudas en este filtro.",
        actions: actions
      });
    }
    return '<p class="ac-doubtsummary" role="status">Mostrando <b>' + filtered.length + "</b> de " + all.length + " " +
      plural(all.length, "duda", "dudas") + (query ? " con la búsqueda activa" : "") + "</p>" +
      '<div class="ac-doubtlist">' + filtered.map(doubtRowHTML).join("") + "</div>";
  }

  function hydrateDoubtsRoute(options) {
    if (!view.route || view.route.name !== "dudas") return;
    var opts = options || {};
    var root = routeRoot();
    if (!root) return;
    var spec = captureFocus(root);
    if (!storeReady()) {
      setText($("#ac-doubts-sub", root), "Cargando tus dudas…");
      var loadingFilters = $("#ac-doubt-filters", root);
      if (loadingFilters) loadingFilters.innerHTML = "";
      var loadingHost = $("#ac-doubts-host", root);
      if (loadingHost) loadingHost.innerHTML = CP.skeleton({ rows: 3, label: "Cargando tus dudas" });
      return;
    }
    var all = [];
    var error = null;
    try { all = allDoubts(); } catch (e) { error = e; all = []; }
    var counts = doubtsCounts(all);
    var filtersHost = $("#ac-doubt-filters", root);
    if (filtersHost) filtersHost.innerHTML = doubtsFiltersHTML(counts);
    var sub = $("#ac-doubts-sub", root);
    setText(sub, all.length
      ? counts.open + " " + plural(counts.open, "abierta", "abiertas") + " · " + counts.resolved + " " + plural(counts.resolved, "resuelta", "resueltas")
      : "Todo lo que marques como duda, con su cita y su contexto.");
    var resultsHost = $("#ac-doubts-host", root);
    if (resultsHost) resultsHost.innerHTML = doubtsResultsHTML(all, error);
    var restored = spec ? restoreFocus(root, spec) : false;
    if (!restored && typeof opts.focusSelector === "string") {
      var target = $(opts.focusSelector, root);
      if (target) safeFocus(target);
    }
  }

  function renderDoubtsRoute() {
    return '<section class="ac ac-page" aria-labelledby="ac-doubts-title">' +
      '<header class="ac-pagehead">' +
        '<a class="ac-back" href="#/" data-nav><span aria-hidden="true">' + icon("arrowLeft", 14) + "</span>Panel</a>" +
        '<span class="ac-kicker"><span class="ac-dot" aria-hidden="true"></span>Lectura activa</span>' +
        '<h1 id="ac-doubts-title">Bandeja de dudas</h1>' +
        '<p class="ac-pagesub" id="ac-doubts-sub">Cargando tus dudas…</p>' +
        '<div class="ac-pagelinks">' +
          '<a class="ac-btn ac-btn--ghost ac-btn--sm" href="#/subrayados" data-nav>' + icon("bookmark", 14) + " Mis subrayados</a>" +
          '<a class="ac-btn ac-btn--ghost ac-btn--sm" href="#/biblioteca" data-nav>' + icon("book", 14) + " Seguir leyendo</a>" +
        "</div>" +
      "</header>" +
      '<div class="ac-doubtbar">' +
        '<div id="ac-doubt-filters" class="ac-chipset" role="group" aria-label="Filtrar dudas"></div>' +
        '<label class="ac-search"><span class="ac-search__ico" aria-hidden="true">' + icon("search", 15) + "</span>" +
          '<span class="ac-sr">Buscar en la cita o en la nota</span>' +
          '<input type="search" data-ac-input="doubts-query" autocomplete="off" placeholder="Buscar en la cita o la nota" value="' +
            esc(state.doubts.query) + '"></label>' +
      "</div>" +
      '<div id="ac-doubts-host" class="ac-page__panel"></div>' +
      "</section>";
  }

  function mountDoubtsRoute(ctx) {
    view.route = { name: "dudas", ctx: ctx, root: ctx.root };
    hydrateDoubtsRoute();
  }

  function refreshRouteSurfaces(options) {
    if (!view.route) return;
    if (view.route.name === "subrayados") hydrateHighlightsRoute(options);
    else if (view.route.name === "dudas") hydrateDoubtsRoute(options);
  }

  /* ------------------------------------------------------------------ */
  /* Panel: resumen de lectura activa                                    */
  /* ------------------------------------------------------------------ */

  function summaryMarkHTML(color, count) {
    var mark = A.marks.get(color);
    return '<a class="ac-summary__mark" data-mark="' + esc(mark.key) + '" href="#/subrayados" data-nav>' +
      '<span class="ac-summary__dot" aria-hidden="true"></span>' +
      '<span class="ac-summary__label">' + esc(mark.label) + "</span>" +
      '<b>' + count + "</b></a>";
  }

  function renderSummary() {
    var host = $('[data-module-mount="active-summary"]');
    if (!host) return;
    if (!storeReady()) {
      host.innerHTML = '<section class="ac ac-summary" aria-label="Lectura activa"><div class="ac-summary__loading">' +
        CP.skeleton({ rows: 1, label: "Cargando tu lectura activa" }) + "</div></section>";
      return;
    }
    var models = [];
    var doubts = [];
    var cards = [];
    try {
      models = allAnnotations();
      doubts = allDoubts();
      cards = allUserCards();
    } catch (e) {
      host.innerHTML = '<section class="ac ac-summary" aria-label="Lectura activa">' +
        CP.alert({ tone: "warn", title: "No se pudo leer tu lectura activa", text: "Tus subrayados siguen guardados en este navegador." }) +
        "</section>";
      return;
    }
    if (!models.length && !doubts.length && !cards.length) {
      host.innerHTML = "";
      return;
    }
    var counts = { total: models.length, important: 0, understand: 0, review: 0, doubt: 0, notes: 0, orphans: 0 };
    models.forEach(function (model) {
      if (Object.prototype.hasOwnProperty.call(counts, model.color)) counts[model.color] += 1;
      if (model.note) counts.notes += 1;
      if (model.orphan) counts.orphans += 1;
    });
    var open = doubts.filter(function (doubt) { return !doubt.resolved; }).length;
    var subtitle = counts.total
      ? counts.total + " " + plural(counts.total, "subrayado", "subrayados") + (counts.notes ? " · " + counts.notes + " con nota" : "") +
        (counts.orphans ? " · " + counts.orphans + " " + plural(counts.orphans, "ancla perdida", "anclas perdidas") : "")
      : "Tu bandeja de dudas y tus tarjetas propias, en un solo lugar.";
    var colors = A.marks.list().map(function (mark) { return summaryMarkHTML(mark.key, counts[mark.key] || 0); }).join("");
    var doubtsBlock = '<a class="ac-summary__doubt' + (open ? " is-open" : "") + '" href="#/dudas" data-nav>' +
      '<span class="ac-summary__doubtcount" aria-hidden="true">' + open + "</span>" +
      '<span class="ac-summary__doubtcopy"><b>' + open + " " + plural(open, "duda abierta", "dudas abiertas") + "</b>" +
      "<small>" + (open ? "Resolver no borra el subrayado" : "Todo lo marcado como duda") + "</small></span>" +
      '<span class="ac-summary__arrow" aria-hidden="true">' + icon("arrow", 14) + "</span></a>";
    var cardsBlock = '<button class="ac-summary__cards" type="button" data-ac-action="summary:cards">' +
      '<span class="ac-summary__cardsico" aria-hidden="true">' + icon("cards", 17) + "</span>" +
      '<span class="ac-summary__cardsopy"><b>' + cards.length + " " + plural(cards.length, "tarjeta propia", "tarjetas propias") + "</b>" +
      "<small>Crear, previsualizar y editar</small></span>" +
      '<span class="ac-summary__arrow" aria-hidden="true">' + icon("arrow", 14) + "</span></button>";
    host.innerHTML = '<section class="ac ac-summary" aria-labelledby="ac-summary-title">' +
      '<header class="ac-summary__head"><div><span class="ac-kicker"><span class="ac-dot" aria-hidden="true"></span>Estudio activo</span>' +
        '<h2 id="ac-summary-title">Tu lectura activa</h2>' +
        '<p>' + esc(subtitle) + "</p></div>" +
        '<a class="ac-summary__all" href="#/subrayados" data-nav>Ver todos <span aria-hidden="true">' + icon("arrow", 14) + "</span></a>" +
      "</header>" +
      '<div class="ac-summary__marks" role="group" aria-label="Subrayados por color">' + colors + "</div>" +
      '<div class="ac-summary__row">' + doubtsBlock + cardsBlock + "</div>" +
      "</section>";
  }

  /* ------------------------------------------------------------------ */
  /* Contexto: navegar y reanclar                                        */
  /* ------------------------------------------------------------------ */

  function findQuoteAcrossSheet(sheet, quote, prefix, suffix) {
    if (!sheet || !quote) return null;
    var matches = [];
    (sheet.sections || []).forEach(function (section, sectionIndex) {
      (Array.isArray(section.body) ? section.body : []).forEach(function (paragraph, paragraphIndex) {
        if (typeof paragraph !== "string") return;
        var found = findQuote(paragraph, quote, prefix, suffix);
        if (found) matches.push({ sectionIndex: sectionIndex, paragraphIndex: paragraphIndex, section: section, start: found.start, end: found.end });
      });
    });
    if (!matches.length) return null;
    if (matches.length === 1) return matches[0];
    var scored = matches.map(function (match) {
      return { match: match, score: scoreCandidate(match.section.body[match.paragraphIndex], match, prefix, suffix) };
    });
    scored.sort(function (a, b) { return b.score - a.score; });
    if (scored.length > 1 && scored[0].score === scored[1].score) return null;
    return scored[0].match;
  }

  function recoverAnnotation(annotationId, trigger) {
    var annotation = null;
    try { annotation = Store.annotations.get(annotationId); } catch (e) { annotation = null; }
    if (!annotation) {
      announce("Ese subrayado ya no existe.");
      return;
    }
    var sheet = sheetById(annotation.sheetId);
    if (!sheet) {
      announce("La ficha ya no está disponible. El subrayado se conserva.");
      return;
    }
    var found = findQuoteAcrossSheet(sheet, annotation.quote, annotation.prefix, annotation.suffix);
    if (!found) {
      announce("No se encontró la cita en esta ficha. Puedes abrir el contexto o eliminar el subrayado.");
      return;
    }
    var paragraph = found.section.body[found.paragraphIndex] || "";
    var updated = withSilence(function () {
      return Store.annotations.update(annotationId, {
        sectionIndex: found.sectionIndex,
        paragraphIndex: found.paragraphIndex,
        sectionTitle: found.section.title || "",
        prefix: paragraph.slice(Math.max(0, found.start - 120), found.start),
        suffix: paragraph.slice(found.end, found.end + 120)
      });
    });
    if (!updated) {
      announce("No se pudo recuperar el subrayado. Inténtalo de nuevo.");
      return;
    }
    hydrateHighlightsRoute({ focusSelector: '[data-ac-action="highlights:goto"][data-ac-id="' + annotationId + '"]' });
    if (!$('[data-ac-action="highlights:goto"][data-ac-id="' + annotationId + '"]')) focusFallback();
    announce("Subrayado recuperado en «" + (found.section.title || "la ficha") + "».");
  }

  function flashElement(element) {
    if (!element) return;
    element.classList.add("ac-flash");
    global.setTimeout(function () {
      if (element && element.classList) element.classList.remove("ac-flash");
    }, 1800);
  }

  function scrollToReaderAnchor(ref) {
    if (!view.reader) return false;
    var entry = sectionEntry(num(ref.sectionIndex, -1));
    if (!entry && ref.sectionTitle) {
      for (var i = 0; i < view.reader.sections.length; i += 1) {
        if (view.reader.sections[i].title === ref.sectionTitle) { entry = view.reader.sections[i]; break; }
      }
    }
    if (!entry && sectionAt(view.reader.sheet, ref.sectionIndex)) {
      var fullButton = $('[data-action="reader-mode"][data-mode="full"]', view.reader.reader);
      if (fullButton && fullButton.getAttribute("aria-pressed") !== "true") {
        state.pendingGoto = {
          sheetId: ref.sheetId,
          sectionIndex: ref.sectionIndex,
          paragraphIndex: ref.paragraphIndex,
          sectionTitle: ref.sectionTitle || "",
          quote: ref.quote || "",
          annotationId: ref.annotationId || null,
          at: Date.now()
        };
        fullButton.click();
        return false;
      }
    }
    if (!entry) {
      announce("La sección de este subrayado ya no está disponible. La cita se conserva.");
      return false;
    }
    var p = entry.el.querySelector('p[data-paragraph-index="' + num(ref.paragraphIndex, 0) + '"]');
    if (!p) {
      var heading = entry.el.querySelector("h2");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        safeFocus(heading);
      }
      announce("El párrafo cambió; se conserva la cita y el subrayado.");
      return false;
    }
    p.setAttribute("tabindex", "-1");
    try {
      p.scrollIntoView({ block: "center", behavior: reducedMotion() ? "auto" : "smooth" });
    } catch (e) {
      p.scrollIntoView();
    }
    safeFocus(p);
    flashElement(p);
    var currentText = p.textContent || "";
    if (ref.quote && !findQuote(currentText, ref.quote, "", "")) {
      announce("La cita ya no está en este párrafo; el subrayado se conserva en Mis subrayados.");
    } else {
      announce("Subrayado en contexto.");
    }
    return true;
  }

  function goToContext(ref) {
    if (!ref || !ref.sheetId) return;
    var sheet = sheetById(ref.sheetId);
    if (!sheet) {
      announce("La ficha ya no está disponible. El subrayado se conserva.");
      return;
    }
    if (view.overlay) closeOverlay(false, true);
    if (view.selection) closeSelection(false, true);
    if (view.reader && view.reader.sheet.id === sheet.id) {
      scrollToReaderAnchor(ref);
      return;
    }
    state.pendingGoto = {
      sheetId: sheet.id,
      sectionIndex: num(ref.sectionIndex, 0),
      paragraphIndex: num(ref.paragraphIndex, 0),
      sectionTitle: ref.sectionTitle || "",
      quote: ref.quote || "",
      annotationId: ref.annotationId || null,
      at: Date.now()
    };
    announce("Abriendo la ficha en el subrayado.");
    App.navigate(sheetHref(sheet.id));
  }

  function consumePendingGoto() {
    var pending = state.pendingGoto;
    if (!pending || !view.reader) return;
    if (view.reader.sheet.id !== pending.sheetId) {
      state.pendingGoto = null;
      return;
    }
    global.setTimeout(function () {
      if (!state.pendingGoto || state.pendingGoto !== pending) return;
      state.pendingGoto = null;
      scrollToReaderAnchor(pending);
    }, 90);
  }

  /* ------------------------------------------------------------------ */
  /* Atajos del lector y ayuda                                           */
  /* ------------------------------------------------------------------ */

  var SHORTCUTS = [
    { key: "n", label: "Siguiente ficha" },
    { key: "p", label: "Ficha anterior" },
    { key: "c", label: "Marcar completada o pendiente" },
    { key: "s", label: "Subrayar el párrafo visible" },
    { key: "r", label: "Modo recordar" },
    { key: "?", label: "Abrir esta ayuda" },
    { key: "Esc", label: "Cerrar barras y diálogos" },
    { key: "1–4", label: "Elegir color con la barra abierta" },
    { key: "Ctrl + Enter", label: "Guardar el subrayado abierto" }
  ];

  function shortcutHelpHTML() {
    return '<div class="ac-dialog__bar"><span class="ac-kicker"><span class="ac-dot" aria-hidden="true"></span>Teclado</span>' +
        '<button class="ac-iconbtn ac-iconbtn--sm" type="button" data-ac-action="overlay:close" aria-label="Cerrar la ayuda">' + icon("close", 15) + "</button></div>" +
      '<div class="ac-dialog__body">' +
        '<h2 class="ac-dialog__title">Atajos del lector</h2>' +
        '<p class="ac-dialog__text">Funcionan en la ficha y en las vistas de lectura activa. Se desactivan mientras escribes o tienes un diálogo abierto.</p>' +
        '<ul class="ac-shortcutlist">' + SHORTCUTS.map(function (shortcut) {
          return '<li><kbd class="ac-kbd">' + esc(shortcut.key) + "</kbd><span>" + esc(shortcut.label) + "</span></li>";
        }).join("") + "</ul>" +
        '<p class="ac-hint">La búsqueda de la biblioteca usa <span class="ac-kbd">/</span> y la paleta <span class="ac-kbd">Ctrl K</span>. Esos atajos no se modifican.</p>' +
        '<div class="ac-shortcutprefs">' + prefsSwitchHTML("help") + "</div>" +
      "</div>";
  }

  function openShortcutsHelp(trigger) {
    if (view.overlay) closeOverlay(false, true);
    openOverlay({
      kind: "help",
      html: shortcutHelpHTML(),
      label: "Atajos del lector",
      returnFocus: trigger,
      focus: '[data-ac-action="overlay:close"]'
    });
  }

  function updateShortcutSwitches() {
    $$('[data-ac-action="shortcuts:toggle"]').forEach(function (button) {
      button.setAttribute("aria-checked", state.prefs.shortcuts ? "true" : "false");
      var text = $(".ac-switch__text", button);
      if (text) text.textContent = state.prefs.shortcuts ? "Activados" : "Desactivados";
    });
  }

  function toggleShortcuts() {
    state.prefs.shortcuts = !state.prefs.shortcuts;
    savePrefs({ shortcuts: state.prefs.shortcuts });
    updateShortcutSwitches();
    if (view.reader) renderRail();
    if (view.route && view.route.name === "subrayados") hydrateHighlightsRoute();
    announce(state.prefs.shortcuts ? "Atajos del lector activados." : "Atajos del lector desactivados.");
    if (!state.prefsStored) announce("La preferencia se aplicará solo en esta sesión.");
  }

  function shortcutAllowed(kind) {
    if (!state.prefs || !state.prefs.shortcuts) return false;
    if (view.overlay || view.selection) return false;
    var route = App.getRoute ? App.getRoute() : null;
    var name = route ? route.name : "";
    if (kind === "help") return name === "sheet" || name === "subrayados" || name === "dudas";
    return name === "sheet";
  }

  function currentReaderParagraph() {
    if (!view.reader) return null;
    var active = document.activeElement;
    if (active && active.getAttribute) {
      var activeParagraph = active.closest ? active.closest("p[data-paragraph-index]") : null;
      if (activeParagraph) return activeParagraph;
      if (active.matches && active.matches('[data-ac-action="paragraph:open"]')) {
        var sectionIndex = active.getAttribute("data-ac-section");
        var pIndex = active.getAttribute("data-index");
        var entry = sectionEntry(num(sectionIndex, -1));
        if (entry) return entry.el.querySelector('p[data-paragraph-index="' + pIndex + '"]');
      }
    }
    var visible = $$('.reader-section p[data-paragraph-index]', view.reader.reader).filter(function (p) {
      var rect = p.getBoundingClientRect();
      return rect.bottom > 90 && rect.top < global.innerHeight - 40;
    });
    return visible[0] || $('.reader-section p[data-paragraph-index]', view.reader.reader);
  }

  function readerShortcutAction(kind, event) {
    if (!shortcutAllowed(kind)) return;
    if (kind === "help") {
      openShortcutsHelp(document.activeElement && document.activeElement !== document.body ? document.activeElement : null);
      return;
    }
    if (view.reader) {
      if (kind === "next") {
        var next = $(".reader-pager .pager-next");
        if (next) {
          announce("Abriendo la siguiente ficha.");
          next.click();
        } else announce("No hay una ficha siguiente.");
      } else if (kind === "prev") {
        var prev = $(".reader-pager .pager-prev");
        if (prev) {
          announce("Abriendo la ficha anterior.");
          prev.click();
        } else announce("No hay una ficha anterior.");
      } else if (kind === "complete") {
        var complete = $('.reader-tools [data-action="toggle-complete"]') || $('.rail-progress [data-action="toggle-complete"]');
        if (complete) complete.click();
      } else if (kind === "highlight") {
        var p = currentReaderParagraph();
        if (p) {
          var button = p.closest && p.closest(".ac-para") ? $(".ac-para__btn", p.closest(".ac-para")) : null;
          openSelectionFromParagraph(p, button || p);
        }
      } else if (kind === "memory") {
        var control = $('[data-ac-action="memory:mode"]', view.reader.reader);
        if (control) {
          handleMemory("memory:mode", control);
        } else {
          announce("Esta ficha no tiene conceptos clave para el modo recordar.");
        }
      }
    }
  }

  function registerShortcuts() {
    if (refs.shortcutOffs.length) return;
    var specs = [
      { id: "active-next", key: "n", when: function () { return shortcutAllowed("sheet"); }, run: function (e) { readerShortcutAction("next", e); } },
      { id: "active-prev", key: "p", when: function () { return shortcutAllowed("sheet"); }, run: function (e) { readerShortcutAction("prev", e); } },
      { id: "active-complete", key: "c", when: function () { return shortcutAllowed("sheet"); }, run: function (e) { readerShortcutAction("complete", e); } },
      { id: "active-highlight", key: "s", when: function () { return shortcutAllowed("sheet"); }, run: function (e) { readerShortcutAction("highlight", e); } },
      { id: "active-memory", key: "r", when: function () { return shortcutAllowed("sheet"); }, run: function (e) { readerShortcutAction("memory", e); } },
      { id: "active-help", key: "?", shiftKey: true, when: function () { return shortcutAllowed("help"); }, run: function (e) { readerShortcutAction("help", e); } },
      { id: "active-help-alt", key: "?", shiftKey: false, when: function () { return shortcutAllowed("help"); }, run: function (e) { readerShortcutAction("help", e); } }
    ];
    specs.forEach(function (spec) {
      var off = App.shortcuts.register(spec);
      if (typeof off === "function") refs.shortcutOffs.push(off);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Acciones, entradas y delegación                                     */
  /* ------------------------------------------------------------------ */

  function handleNoteAction(action, el) {
    if (!state.note) return;
    if (action === "note:edit") {
      var annotation = null;
      try { annotation = Store.annotations.get(state.note.annotationId); } catch (e) { annotation = null; }
      if (!annotation) return;
      state.note.mode = "edit";
      state.note.state = "idle";
      state.note.value = annotation.note || "";
      state.note.error = "";
      renderNoteOverlay('[data-ac-input="note"]');
    } else if (action === "note:cancel") {
      var current = null;
      try { current = Store.annotations.get(state.note.annotationId); } catch (e) { current = null; }
      state.note.mode = "view";
      state.note.state = "idle";
      state.note.error = "";
      state.note.value = current ? current.note || "" : state.note.value;
      renderNoteOverlay('[data-ac-action="note:edit"]');
    } else if (action === "note:save") {
      saveNote();
    } else if (action === "note:clear") {
      clearNote();
    } else if (action === "note:goto") {
      var target = null;
      try { target = Store.annotations.get(state.note.annotationId); } catch (e) { target = null; }
      if (!target) return;
      var model = annotationModel(target);
      closeOverlay(false, true);
      goToContext(model);
    }
  }

  function handleHighlightsAction(action, el) {
    if (action === "highlights:filter") {
      var color = el.getAttribute("data-color") || "all";
      if (color === "all") state.filters.colors = [];
      else {
        var index = state.filters.colors.indexOf(color);
        if (index >= 0) state.filters.colors.splice(index, 1);
        else state.filters.colors.push(color);
      }
      renderHighlightsPanelHost('[data-ac-action="highlights:filter"][data-color="' + color + '"]');
    } else if (action === "highlights:clear") {
      state.filters = { colors: [], query: "", scope: "all" };
      hydrateHighlightsRoute({ focusSelector: '[data-ac-action="highlights:filter"][data-color="all"]' });
    } else if (action === "highlights:goto") {
      var model = findAnnotationModel(el.getAttribute("data-ac-id"));
      if (model) goToContext(model);
    } else if (action === "highlights:note") {
      openAnnotationNote(el.getAttribute("data-ac-id"), el);
    } else if (action === "highlights:delete") {
      var annotation = findAnnotationModel(el.getAttribute("data-ac-id"));
      if (!annotation) return;
      openConfirm({
        title: "Eliminar subrayado",
        text: "La cita y la nota se borrarán de este navegador. Si hay una duda o una tarjeta propia asociada, se conservan.",
        quote: annotation.quote,
        confirmLabel: "Eliminar subrayado",
        returnFocus: el,
        onConfirm: function () {
          var removed = withSilence(function () { return Store.annotations.remove(annotation.id); });
          if (!removed) {
            announce("No se pudo eliminar el subrayado.");
            return;
          }
          refreshAnnotationSurfaces();
          announce("Subrayado eliminado. La duda y las tarjetas propias se conservan.");
          focusFallback();
        }
      });
    } else if (action === "highlights:recover") {
      recoverAnnotation(el.getAttribute("data-ac-id"), el);
    } else if (action === "highlights:showall") {
      App.navigate("#/subrayados");
    } else if (action === "highlights:back") {
      App.navigate("#/biblioteca");
    } else if (action === "highlights:retry") {
      if (view.reader) { refreshReaderMarks(); renderRail(); }
      if (view.route) hydrateHighlightsRoute();
      renderSummary();
      announce("Reintentando leer tus subrayados.");
    }
  }

  function handleRecallSwitch(action, el) {
    if (action === "recall:switch") {
      state.prefs.recallPause = !state.prefs.recallPause;
      savePrefs({ recallPause: state.prefs.recallPause });
      renderPauses();
      if (view.reader) renderRail();
      if (view.route && view.route.name === "subrayados") hydrateHighlightsRoute();
      announce(state.prefs.recallPause ? "Pausa de recuerdo activada." : "Pausa de recuerdo desactivada.");
      if (!state.prefsStored) announce("La preferencia se aplicará solo en esta sesión.");
    } else if (action === "recall:freq") {
      var frequency = num(el.getAttribute("data-value"), 2);
      if ([1, 2, 3].indexOf(frequency) === -1) frequency = 2;
      state.prefs.recallEvery = frequency;
      savePrefs({ recallEvery: frequency });
      renderPauses();
      if (view.reader) renderRail();
      if (view.route && view.route.name === "subrayados") hydrateHighlightsRoute();
      announce(frequency === 1 ? "Una pausa al cerrar cada sección esencial." : "Una pausa cada " + frequency + " secciones esenciales.");
      if (!state.prefsStored) announce("La preferencia se aplicará solo en esta sesión.");
    }
  }

  function handleDoubtsAction(action, el) {
    if (action === "doubts:filter") {
      state.doubts.filter = el.getAttribute("data-value") || "open";
      hydrateDoubtsRoute({ focusSelector: '[data-ac-action="doubts:filter"][data-value="' + state.doubts.filter + '"]' });
    } else if (action === "doubts:resolve" || action === "doubts:reopen") {
      var id = el.getAttribute("data-ac-id");
      var resolved = action === "doubts:resolve";
      var result = withSilence(function () {
        return resolved ? Store.doubts.resolve(id) : Store.doubts.reopen(id);
      });
      if (!result) {
        announce("No se pudo actualizar la duda.");
        return;
      }
      hydrateDoubtsRoute();
      var target = $('[data-ac-action="' + (resolved ? "doubts:resolve" : "doubts:reopen") + '"][data-ac-id="' + id + '"]');
      if (!target) target = $('[data-ac-action="doubts:filter"][data-value="' + (resolved ? "open" : "resolved") + '"]');
      if (target) safeFocus(target);
      announce(resolved ? "Duda resuelta. El subrayado se conserva." : "Duda reabierta.");
    } else if (action === "doubts:goto") {
      var doubt = null;
      try { doubt = Store.doubts.get(el.getAttribute("data-ac-id")); } catch (e) { doubt = null; }
      if (doubt) goToContext(doubt);
    } else if (action === "doubts:clear") {
      state.doubts.query = "";
      var input = $('[data-ac-input="doubts-query"]');
      if (input) input.value = "";
      hydrateDoubtsRoute({ focusSelector: '[data-ac-input="doubts-query"]' });
    } else if (action === "doubts:retry") {
      hydrateDoubtsRoute();
      announce("Reintentando leer tus dudas.");
    } else if (action === "doubts:back") {
      App.navigate("#/biblioteca");
    }
  }

  function handleAction(action, el, event) {
    if (!action) return;
    if (el && el.getAttribute && el.getAttribute("aria-disabled") === "true") return;
    if (action === "overlay:close") {
      closeOverlay(true);
      return;
    }
    if (action === "confirm:yes") {
      var confirm = state.confirm;
      state.confirm = null;
      closeOverlay(false, true);
      if (confirm && typeof confirm.onConfirm === "function") {
        try { confirm.onConfirm(); } catch (e) { announce(safeError(e, "No se pudo completar la acción.")); }
      }
      return;
    }
    if (action === "confirm:no") {
      state.confirm = null;
      closeOverlay(true);
      return;
    }
    if (action === "selection:color") { setSelectionColor(el.getAttribute("data-color")); return; }
    if (action === "selection:note") { toggleSelectionNote(); return; }
    if (action === "selection:submit") { submitSelection(); return; }
    if (action === "selection:cancel" || action === "selection:close") { closeSelection(true); return; }
    if (action === "paragraph:open") { openSelectionFromParagraph(el, el); return; }
    if (action === "annotation:open") { openReaderNote(el.getAttribute("data-ac-id"), el); return; }
    if (action.indexOf("note:") === 0) { handleNoteAction(action, el); return; }
    if (action.indexOf("highlights:") === 0) { handleHighlightsAction(action, el); return; }
    if (action === "recall:switch" || action === "recall:freq") { handleRecallSwitch(action, el); return; }
    if (action.indexOf("recall:") === 0) { handleRecall(action, el); return; }
    if (action.indexOf("memory:") === 0) { handleMemory(action, el); return; }
    if (action.indexOf("confidence:") === 0) { handleConfidence(action, el); return; }
    if (action === "ucard:from") {
      if (view.overlay && view.overlay.kind === "note" && noteDraftIsDirty()) {
        announce("Guarda o cancela la nota antes de crear una tarjeta.");
        return;
      }
      openCardEditor({ annotationId: el.getAttribute("data-ac-id"), trigger: el });
      return;
    }
    if (action === "ucard:edit") {
      openCardEditor({ cardId: el.getAttribute("data-ac-id"), fromList: !!(state.cardsDialog && state.cardsDialog.fromList), trigger: el });
      return;
    }
    if (action === "ucard:save") { saveCard(); return; }
    if (action === "ucard:cancel" || action === "ucard:back") {
      var editor = state.cardsDialog;
      if (!editor) { closeOverlay(true); return; }
      editor.dirty = false;
      if (editor.fromList) {
        editor.mode = "list";
        editor.cardId = null;
        editor.annotationId = null;
        editor.front = "";
        editor.back = "";
        editor.error = "";
        renderCardsOverlay('[data-ac-action="overlay:close"]');
      } else {
        closeOverlay(true);
      }
      return;
    }
    if (action.indexOf("doubts:") === 0) { handleDoubtsAction(action, el); return; }
    if (action === "shortcuts:toggle") { toggleShortcuts(); return; }
    if (action === "shortcuts:help") { openShortcutsHelp(el); return; }
    if (action === "summary:cards") { openCardsList(el); return; }
  }

  function updateNoteCounter(input) {
    var host = input.closest ? input.closest(".ac-selbar, .ac-note") : null;
    if (!host) return;
    var count = $("[data-ac-note-count]", host);
    if (!count) return;
    var max = num(input.getAttribute("maxlength"), NOTE_MAX);
    count.textContent = input.value.length + "/" + max;
    count.setAttribute("data-over", input.value.length >= max ? "true" : "false");
  }

  function handleInput(input) {
    var name = input.getAttribute("data-ac-input");
    if (name === "note") {
      updateNoteCounter(input);
      if (view.overlay && view.overlay.kind === "note" && state.note) {
        state.note.value = input.value;
      } else if (view.selection) {
        view.selection.note = input.value;
      }
    } else if (name === "query") {
      state.filters.query = input.value;
      scheduleHighlightsPanel();
    } else if (name === "doubts-query") {
      state.doubts.query = input.value;
      scheduleDoubtsResults();
    } else if (name === "answer") {
      var context = pauseContext(input);
      if (context) context.entry.freeAnswer = input.value;
    } else if (name === "ucard-front" || name === "ucard-back") {
      var editor = state.cardsDialog;
      if (!editor) return;
      if (name === "ucard-front") editor.front = input.value;
      else editor.back = input.value;
      editor.dirty = true;
      var previewFront = $("[data-ac-ucard-preview-front]");
      var previewBack = $("[data-ac-ucard-preview-back]");
      if (previewFront) previewFront.textContent = editor.front || "El frente aparecerá aquí.";
      if (previewBack) previewBack.textContent = editor.back || "El reverso aparecerá aquí.";
      var save = $('[data-ac-action="ucard:save"]');
      if (save) save.disabled = !(String(editor.front || "").trim() && String(editor.back || "").trim());
    }
  }

  function handleChange(input) {
    var name = input.getAttribute("data-ac-input");
    if (name === "scope" && view.route && view.route.name === "subrayados") {
      state.filters.scope = input.value || "all";
      renderHighlightsPanelHost('[data-ac-input="scope"]');
    }
  }

  var highlightsTimer = null;
  function scheduleHighlightsPanel() {
    if (highlightsTimer) global.clearTimeout(highlightsTimer);
    highlightsTimer = global.setTimeout(function () {
      highlightsTimer = null;
      renderHighlightsPanelHost('[data-ac-input="query"]');
    }, 160);
  }

  var doubtsTimer = null;
  function scheduleDoubtsResults() {
    if (doubtsTimer) global.clearTimeout(doubtsTimer);
    doubtsTimer = global.setTimeout(function () {
      doubtsTimer = null;
      hydrateDoubtsRoute({ focusSelector: '[data-ac-input="doubts-query"]' });
    }, 160);
  }

  var ACTION_NAMES = [
    "overlay:close", "confirm:yes", "confirm:no",
    "selection:color", "selection:note", "selection:submit", "selection:cancel", "selection:close",
    "paragraph:open", "annotation:open",
    "note:edit", "note:cancel", "note:save", "note:clear", "note:goto",
    "highlights:filter", "highlights:clear", "highlights:goto", "highlights:note", "highlights:delete",
    "highlights:recover", "highlights:showall", "highlights:back", "highlights:retry",
    "recall:reveal", "recall:rate", "recall:skip", "recall:close", "recall:reopen", "recall:retry",
    "recall:switch", "recall:freq",
    "memory:mode", "memory:toggle", "memory:all", "memory:none",
    "confidence:pick", "confidence:save", "confidence:clear", "confidence:dismiss", "confidence:edit",
    "ucard:from", "ucard:edit", "ucard:save", "ucard:cancel", "ucard:back",
    "doubts:filter", "doubts:resolve", "doubts:reopen", "doubts:goto", "doubts:clear", "doubts:retry", "doubts:back",
    "shortcuts:toggle", "shortcuts:help", "summary:cards"
  ];

  function bindDelegatedActions() {
    if (refs.actionOff) return;
    var click = {};
    ACTION_NAMES.forEach(function (action) {
      click[action] = function (el, event) {
        handleAction(action, el, event);
      };
    });
    refs.actionOff = B.bind(document.body, {
      click: click,
      input: {
        note: handleInput,
        query: handleInput,
        "doubts-query": handleInput,
        answer: handleInput,
        scope: handleInput,
        "ucard-front": handleInput,
        "ucard-back": handleInput
      },
      change: {
        scope: handleChange
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Eventos del bus y refresco                                          */
  /* ------------------------------------------------------------------ */

  var externalRefreshTimer = null;

  function scheduleExternalRefresh() {
    if (state.silence) return;
    if (externalRefreshTimer) global.clearTimeout(externalRefreshTimer);
    externalRefreshTimer = global.setTimeout(function () {
      externalRefreshTimer = null;
      refreshAfterExternalChange();
    }, 70);
  }

  function refreshAfterExternalChange() {
    if (state.silence) return;
    if (["reset", "clear", "import"].indexOf(state.lastStoreChange) !== -1) {
      state.confidence = {};
      state.pauses = {};
      if (view.overlay && (view.overlay.kind === "note" || view.overlay.kind === "cards")) closeOverlay(false, true);
    }
    if (view.reader) {
      refreshReaderMarks();
      renderRail();
      renderConfidence();
      if (["complete", "sync", "reset", "import", "clear"].indexOf(state.lastStoreChange) !== -1) {
        renderPauses();
      }
    }
    if (view.route) refreshRouteSurfaces();
    renderSummary();
  }

  function bindEvents() {
    if (refs.eventOffs.length) return;
    refs.eventOffs.push(App.events.on("annotation:changed", function (detail) {
      state.lastAnnotationEvent = detail || null;
      if (state.silence) return;
      if (detail && detail.action === "remove" && view.overlay && view.overlay.kind === "note" && state.note && state.note.annotationId === detail.id) {
        closeOverlay(false, true);
        announce("El subrayado abierto fue eliminado.");
      }
      scheduleExternalRefresh();
    }));
    refs.eventOffs.push(App.events.on("doubt:changed", function () {
      if (state.silence) return;
      scheduleExternalRefresh();
    }));
    refs.eventOffs.push(App.events.on("confidence:changed", function (detail) {
      if (state.silence) return;
      if (detail && view.reader && view.reader.sheet.id === detail.sheetId) {
        var ui = confidenceUI(detail.sheetId);
        if (ui.state !== "selected") {
          ui.value = detail.value || null;
          ui.state = detail.value ? "saved" : "idle";
          ui.dismiss = false;
        }
      }
      scheduleExternalRefresh();
    }));
    refs.eventOffs.push(App.events.on("recall:changed", function () {
      /* La pausa actualiza su propio estado; no se vuelve a montar para no
         perder la respuesta libre que la persona esté escribiendo. */
    }));
    refs.eventOffs.push(App.events.on("store:change", function (detail) {
      if (state.silence) return;
      state.lastStoreChange = detail && detail.change ? String(detail.change) : "";
      if (["annotation", "doubt", "confidence", "userCard", "complete", "sync", "reset", "import", "clear"].indexOf(state.lastStoreChange) === -1) return;
      scheduleExternalRefresh();
    }));
  }

  function bindDocumentGuards() {
    if (refs.docPointerDown) return;
    refs.docPointerDown = function (event) {
      if (!view.selection || view.selection.touch) return;
      var target = event.target;
      if (target && target.closest && target.closest(".ac-layer, [data-ac-action]")) return;
      closeSelection(false, true);
    };
    refs.docResize = function () {
      if (view.selection && !view.selection.touch) closeSelection(false, true);
    };
    refs.docToggle = function (event) {
      var target = event.target;
      if (target && target.getAttribute && target.getAttribute("data-ac-prefs") === "rail") {
        state.railPrefsOpen = !!target.open;
      }
    };
    document.addEventListener("pointerdown", refs.docPointerDown, true);
    global.addEventListener("resize", refs.docResize, { passive: true });
    document.addEventListener("toggle", refs.docToggle, true);
  }

  /* ------------------------------------------------------------------ */
  /* Teclado de la integración                                           */
  /* ------------------------------------------------------------------ */

  function onKeydown(event) {
    var target = event.target;
    if (view.overlay) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeOverlay(true);
        return;
      }
      if (event.key === "Tab") return;
      if ((event.ctrlKey || event.metaKey) && String(event.key).toLowerCase() === "k") {
        event.preventDefault();
        return;
      }
      return;
    }
    if (view.selection) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSelection(true);
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        submitSelection();
        return;
      }
      if (!isEditingTarget(target) && /^[1-4]$/.test(event.key)) {
        event.preventDefault();
        setSelectionColor(A.marks.list()[Number(event.key) - 1].key);
        return;
      }
      if ((event.ctrlKey || event.metaKey) && String(event.key).toLowerCase() === "k") {
        event.preventDefault();
        return;
      }
    }
    if (target && target.closest && target.closest('[data-ac-action="annotation:open"]') && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      target.click();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Ciclo de vida del módulo                                            */
  /* ------------------------------------------------------------------ */

  function init() {
    if (state.initialized) return;
    state.initialized = true;
    loadPrefs();
    bindDelegatedActions();
    bindEvents();
    bindDocumentGuards();
    registerShortcuts();
    refs.pagehide = function () {
      if (view.overlay) closeOverlay(false, true);
      if (view.selection) closeSelection(false, true);
      if (highlightsTimer) global.clearTimeout(highlightsTimer);
      if (doubtsTimer) global.clearTimeout(doubtsTimer);
      if (externalRefreshTimer) global.clearTimeout(externalRefreshTimer);
      refs.eventOffs.splice(0).forEach(function (off) { try { off(); } catch (e) {} });
      refs.shortcutOffs.splice(0).forEach(function (off) { try { off(); } catch (e) {} });
    };
    global.addEventListener("pagehide", refs.pagehide);
  }

  function onRoute(ctx) {
    var route = ctx.route || {};
    if (route.name !== "sheet") {
      if (view.reader) teardownReader();
      state.pendingGoto = null;
    }
    if (route.name === "home") renderSummary();
    if (route.name === "subrayados" && view.route && view.route.name === "subrayados") {
      /* El montaje de la ruta ya rehidrató; aquí solo se refresca el resumen
         del Panel cuando vuelve a estar presente. */
    } else if (route.name === "dudas" && view.route && view.route.name === "dudas") {
      /* Igual: el montaje hace el trabajo. */
    }
    if (!view.route) renderSummary();
  }

  function onSheetRender(ctx) {
    readerSetup(ctx);
    state.pendingGoto = state.pendingGoto || null;
  }

  var module = App.registerModule({
    id: "active",
    routes: [
      {
        path: "subrayados",
        title: "Mis subrayados",
        restoreScroll: true,
        render: renderHighlightsRoute,
        mount: mountHighlightsRoute,
        unmount: unmountRoute
      },
      {
        path: "dudas",
        title: "Bandeja de dudas",
        restoreScroll: true,
        render: renderDoubtsRoute,
        mount: mountDoubtsRoute,
        unmount: unmountRoute
      }
    ],
    init: init,
    onRoute: onRoute,
    onSheetRender: onSheetRender,
    onKeydown: onKeydown
  });

  if (!module) {
    if (global.console && global.console.error) {
      global.console.error("StudyActive: el módulo activo no pudo registrarse.");
    }
  }
})(window);
