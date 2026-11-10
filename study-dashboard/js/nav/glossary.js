/* © 2026 ZARCONT — Study Dashboard · Glosario emergente
   Extrae definiciones literales del temario, decora solo la primera aparición
   por sección y abre una sola definición a la vez, con foco gestionado. */
(function () {
  "use strict";

  var SN = window.StudyNav;
  if (!SN) throw new Error("StudyNav: carga core.js antes de glossary.js");
  var U = SN.util;

  function normalized(value) {
    return SN.search ? SN.search.normalize(value) : String(value == null ? "" : value)
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function splitSentences(text) {
    var source = String(text == null ? "" : text).trim();
    if (!source) return [];
    var matches = source.match(/[^.!?]+[.!?]+(?:\s|$)/g);
    if (!matches) return [source];
    var joined = matches.join("").trim();
    if (joined.length < source.length) {
      matches.push(source.slice(joined.length).trim());
    }
    return matches.map(function (sentence) { return sentence.trim(); }).filter(Boolean);
  }

  function definitionalAfter(sentence, term) {
    var text = normalized(sentence);
    var needle = normalized(term);
    if (!needle) return false;
    var index = text.indexOf(needle);
    while (index !== -1) {
      var after = text.slice(index + needle.length);
      after = after.replace(/^\s*(?:\([^)]*\))?\s*/, "");
      if (/^(es|son|se define|se refiere|implica|significa|consiste|comprende|abarca|supone|puede definirse|se entiende)\b/.test(after)) return true;
      index = text.indexOf(needle, index + needle.length);
    }
    var before = text.indexOf("se entiende por " + needle) !== -1 ||
      text.indexOf("se define " + needle) !== -1 ||
      text.indexOf("se denomina " + needle) !== -1;
    return before;
  }

  function textBlocksOfSheet(sheet) {
    var blocks = [];
    (sheet.sections || []).forEach(function (section, sectionIndex) {
      (section.body || []).forEach(function (text, paragraphIndex) {
        blocks.push({ text: text, sectionIndex: sectionIndex, sectionTitle: section.title || "", paragraphIndex: paragraphIndex, kind: "paragraph" });
      });
      (section.bullets || []).forEach(function (text, bulletIndex) {
        blocks.push({ text: text, sectionIndex: sectionIndex, sectionTitle: section.title || "", paragraphIndex: bulletIndex, kind: "bullet" });
      });
      if (section.table && Array.isArray(section.table.rows)) {
        (section.table.rows || []).forEach(function (row, rowIndex) {
          var text = (row || []).join(" · ");
          if (text) blocks.push({ text: text, sectionIndex: sectionIndex, sectionTitle: section.title || "", paragraphIndex: rowIndex, kind: "table" });
        });
      }
      if (section.callout) {
        blocks.push({
          text: [section.callout.title, section.callout.text].filter(Boolean).join(". "),
          sectionIndex: sectionIndex,
          sectionTitle: section.title || "",
          paragraphIndex: 0,
          kind: "callout"
        });
      }
    });
    (sheet.keyConcepts || []).forEach(function (text, index) {
      blocks.push({ text: text, sectionIndex: null, sectionTitle: "", paragraphIndex: index, kind: "concept" });
    });
    if (sheet.summary) {
      blocks.push({ text: sheet.summary, sectionIndex: null, sectionTitle: "", paragraphIndex: 0, kind: "summary" });
    }
    return blocks;
  }

  function findDefinition(content, term, aliases) {
    if (!content || !Array.isArray(content.sheets)) return null;
    var candidates = (aliases && aliases.length ? aliases : [term]).slice();
    if (term && candidates.indexOf(term) === -1) candidates.push(term);
    for (var s = 0; s < content.sheets.length; s += 1) {
      var sheet = content.sheets[s];
      var blocks = textBlocksOfSheet(sheet);
      for (var b = 0; b < blocks.length; b += 1) {
        var block = blocks[b];
        var sentences = splitSentences(block.text);
        for (var i = 0; i < sentences.length; i += 1) {
          var sentence = sentences[i];
          for (var a = 0; a < candidates.length; a += 1) {
            if (definitionalAfter(sentence, candidates[a])) {
              return {
                definition: sentence,
                sheetId: sheet.id,
                sheetTitle: sheet.title || "",
                sectionIndex: block.sectionIndex,
                sectionTitle: block.sectionTitle,
                paragraphIndex: block.paragraphIndex,
                kind: block.kind,
                matchedAlias: candidates[a]
              };
            }
          }
        }
      }
    }
    return null;
  }

  function fromContent(content, options) {
    var opts = options || {};
    var terms = opts.terms || [];
    var out = [];
    var missing = [];
    terms.forEach(function (config, index) {
      var term = typeof config === "string" ? config : config.term;
      if (!term) return;
      var aliases = typeof config === "string" ? [] : (config.aliases || []);
      var found = findDefinition(content, term, aliases);
      if (!found) {
        missing.push(term);
        return;
      }
      out.push({
        id: "term-" + (index + 1),
        term: term,
        display: typeof config === "string" ? term : (config.display || term),
        aliases: aliases.length ? aliases : [term],
        definition: found.definition,
        sheetId: found.sheetId,
        sheetTitle: found.sheetTitle,
        sectionIndex: found.sectionIndex,
        sectionTitle: found.sectionTitle,
        paragraphIndex: found.paragraphIndex,
        kind: found.kind
      });
    });
    out.sort(function (a, b) { return b.display.length - a.display.length; });
    return { terms: out, missing: missing };
  }

  function termMatchers(entry) {
    var aliases = entry.aliases && entry.aliases.length ? entry.aliases : [entry.term];
    return aliases.map(function (alias) {
      var escaped = U.escapeRegExp(alias);
      return {
        alias: alias,
        regex: new RegExp("(^|[^\\p{L}\\p{N}])(" + escaped + ")(?![\\p{L}\\p{N}])", "giu")
      };
    });
  }

  function firstMatchInText(text, entry) {
    var matchers = termMatchers(entry);
    var best = null;
    matchers.forEach(function (matcher) {
      matcher.regex.lastIndex = 0;
      var match = matcher.regex.exec(text);
      if (!match) return;
      var start = match.index + (match[1] ? match[1].length : 0);
      var end = start + match[2].length;
      if (!best || start < best.start || (start === best.start && end > best.end)) {
        best = { start: start, end: end, text: match[2] };
      }
    });
    return best;
  }

  function shouldSkip(node) {
    var parent = node.parentNode;
    while (parent && parent.nodeType === 1) {
      var tag = parent.tagName;
      if (/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|INPUT|SELECT|OPTION|A|BUTTON|CODE|PRE|KBD|SAMP|H1|H2|H3|H4|H5|H6)$/.test(tag)) return true;
      if (parent.hasAttribute && (parent.hasAttribute("data-navx-glossary-skip") || parent.hasAttribute("data-navx-term"))) return true;
      if (parent.classList && (parent.classList.contains("navx-gloss") || parent.classList.contains("navx-gloss-pop"))) return true;
      parent = parent.parentNode;
    }
    return false;
  }

  function createTermButton(entry, matchedText) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "navx-gloss";
    button.setAttribute("data-navx-term", entry.id);
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Ver definición de " + matchedText);
    var term = document.createElement("span");
    term.className = "navx-gloss-term";
    term.textContent = matchedText;
    var icon = document.createElement("span");
    icon.className = "navx-gloss-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = SN.icon("info", 12);
    button.appendChild(term);
    button.appendChild(icon);
    return button;
  }

  function decorate(root, glossary, options) {
    if (!root || !glossary || !glossary.terms || !glossary.terms.length) return 0;
    var opts = options || {};
    var scopeSelector = opts.scopeSelector || "";
    var oncePerSection = opts.oncePerSection !== false;
    var scopes = scopeSelector ? Array.prototype.slice.call(root.querySelectorAll(scopeSelector)) : [root];
    if (!scopes.length) scopes = [root];
    var count = 0;
    var globalUsed = {};

    scopes.forEach(function (scope) {
      var used = oncePerSection ? {} : globalUsed;
      var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
        acceptNode: function (node) {
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          if (shouldSkip(node)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      var nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(function (node) {
        if (!node.parentNode) return;
        var text = node.nodeValue;
        var matches = [];
        glossary.terms.forEach(function (entry) {
          if (used[entry.id]) return;
          var found = firstMatchInText(text, entry);
          if (found) matches.push({ entry: entry, start: found.start, end: found.end, text: found.text });
        });
        if (!matches.length) return;
        matches.sort(function (a, b) { return a.start - b.start || (b.end - b.start) - (a.end - a.start); });
        var accepted = [];
        var cursor = 0;
        matches.forEach(function (match) {
          if (match.start < cursor) return;
          accepted.push(match);
          cursor = match.end;
        });
        if (!accepted.length) return;
        var fragment = document.createDocumentFragment();
        var position = 0;
        accepted.forEach(function (match) {
          if (match.start > position) fragment.appendChild(document.createTextNode(text.slice(position, match.start)));
          fragment.appendChild(createTermButton(match.entry, match.text));
          used[match.entry.id] = true;
          position = match.end;
          count += 1;
        });
        if (position < text.length) fragment.appendChild(document.createTextNode(text.slice(position)));
        node.parentNode.replaceChild(fragment, node);
      });
    });
    return count;
  }

  function createPopover(options) {
    var opts = options || {};
    var layerId = U.uid("navx-gloss-layer");
    var titleId = layerId + "-title";
    var definitionId = layerId + "-definition";
    var layer = null;
    var popover = null;
    var active = null;
    var isOpen = false;
    var layerClose = null;

    function esc(value) { return SN.escape(value); }

    function ensureDOM() {
      if (layer) return;
      var portal = U.createPortal("navx-gloss-portal");
      portal.innerHTML =
        '<div class="navx-gloss-layer" data-state="closed" hidden>' +
          '<div class="navx-gloss-pop" role="dialog" aria-modal="false" aria-labelledby="' + esc(titleId) + '" aria-describedby="' + esc(definitionId) + '" tabindex="-1">' +
            '<div class="navx-gloss-head">' +
              '<span class="navx-kicker">Glosario del temario</span>' +
              '<button class="navx-icon-button" type="button" aria-label="Cerrar definición" data-navx-gloss-close>' + SN.icon("close", 16) + '</button>' +
            '</div>' +
            '<h3 class="navx-gloss-title" id="' + esc(titleId) + '"></h3>' +
            '<p class="navx-gloss-definition" id="' + esc(definitionId) + '"></p>' +
            '<div class="navx-gloss-source">' +
              '<span class="navx-gloss-source-label">Fuente</span>' +
              '<a class="navx-gloss-source-link" href="#/ficha/" data-navx-gloss-sheet></a>' +
              '<span class="navx-gloss-source-section"></span>' +
            '</div>' +
          '</div>' +
        '</div>';
      layer = portal.querySelector(".navx-gloss-layer");
      popover = portal.querySelector(".navx-gloss-pop");
      layerClose = function () { close({ restoreFocus: false, fromLayer: true }); };
      popover.addEventListener("click", function (event) {
        if (event.target.closest("[data-navx-gloss-close]")) {
          event.preventDefault();
          close({ restoreFocus: true });
          return;
        }
        var link = event.target.closest("[data-navx-gloss-sheet]");
        if (link) {
          if (typeof opts.onOpenSheet === "function" && active) {
            event.preventDefault();
            var sheetId = active.entry.sheetId;
            close({ restoreFocus: false });
            opts.onOpenSheet(sheetId, active.entry);
          } else {
            close({ restoreFocus: false });
          }
        }
      });
      popover.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          close({ restoreFocus: true });
        }
      });
    }

    function reposition() {
      if (!isOpen || !popover || !active) return;
      U.positionPopover(active.trigger, popover);
    }
    var repositionRaf = null;
    function requestReposition() {
      if (!isOpen || repositionRaf) return;
      repositionRaf = window.requestAnimationFrame(function () {
        repositionRaf = null;
        reposition();
      });
    }

    function documentPointerDown(event) {
      if (!isOpen || !popover) return;
      var target = event.target;
      if (!target || !target.closest) return;
      if (popover.contains(target) || (active && active.trigger.contains(target))) return;
      if (target.closest("[data-navx-term]")) return;
      var trigger = active ? active.trigger : null;
      var anotherControl = !!(target.closest("a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])"));
      close({ restoreFocus: false });
      /* Si el clic fue sobre texto o fondo, devolvemos el foco al término.
         Si fue sobre otro control, el foco debe quedarse en ese control. */
      if (!anotherControl && trigger && trigger.isConnected) {
        window.setTimeout(function () { if (trigger.isConnected) U.focus(trigger); }, 0);
      }
    }
    function documentKeydown(event) {
      if (isOpen && event.key === "Escape") {
        event.preventDefault();
        close({ restoreFocus: true });
      }
    }

    function open(entry, trigger) {
      if (!entry || !trigger) return;
      ensureDOM();
      if (active && active.trigger) active.trigger.setAttribute("aria-expanded", "false");
      if (isOpen) {
        layer.hidden = true;
      }
      active = { entry: entry, trigger: trigger };
      isOpen = true;
      layer.hidden = false;
      layer.dataset.state = "open";
      trigger.setAttribute("aria-expanded", "true");
      popover.querySelector(".navx-gloss-title").textContent = entry.display || entry.term;
      popover.querySelector(".navx-gloss-definition").textContent = entry.definition;
      var link = popover.querySelector("[data-navx-gloss-sheet]");
      link.setAttribute("href", "#/ficha/" + encodeURIComponent(entry.sheetId));
      link.textContent = entry.sheetTitle || "Abrir la ficha";
      var section = popover.querySelector(".navx-gloss-source-section");
      section.textContent = entry.sectionTitle ? "· " + entry.sectionTitle : "";
      SN.layers.open(layerId, layerClose);
      document.addEventListener("pointerdown", documentPointerDown, true);
      document.addEventListener("keydown", documentKeydown);
      window.addEventListener("scroll", requestReposition, true);
      window.addEventListener("resize", requestReposition, { passive: true });
      reposition();
      U.focus(popover);
    }

    function close(options) {
      var o = options || {};
      if (!isOpen) return;
      isOpen = false;
      document.removeEventListener("pointerdown", documentPointerDown, true);
      document.removeEventListener("keydown", documentKeydown);
      window.removeEventListener("scroll", requestReposition, true);
      window.removeEventListener("resize", requestReposition);
      if (active && active.trigger) active.trigger.setAttribute("aria-expanded", "false");
      var trigger = active ? active.trigger : null;
      active = null;
      if (layer) {
        layer.hidden = true;
        layer.dataset.state = "closed";
      }
      if (!o.fromLayer && SN.layers.isTop(layerId)) SN.layers.close(layerId, "ui");
      if (o.restoreFocus && trigger && trigger.isConnected) U.focus(trigger);
    }

    return {
      open: open,
      close: function () { close({ restoreFocus: true }); },
      isOpen: function () { return isOpen; },
      destroy: function () {
        close({ restoreFocus: false, fromLayer: true });
        if (SN.layers.isTop(layerId)) SN.layers.close(layerId, "destroy");
        if (layer && layer.parentNode && layer.parentNode.parentNode) {
          layer.parentNode.parentNode.removeChild(layer.parentNode);
        }
        layer = null;
        popover = null;
      }
    };
  }

  function enhance(options) {
    var opts = options || {};
    var root = typeof opts.root === "string" ? document.querySelector(opts.root) : opts.root;
    if (!root) throw new Error("StudyNav.glossary.enhance: falta el contenedor.");
    var glossary = opts.glossary || fromContent(opts.content || window.STUDY_CONTENT, opts);
    var popover = createPopover({ onOpenSheet: opts.onOpenSheet });
    var decorated = decorate(root, glossary, {
      scopeSelector: opts.scopeSelector || "",
      oncePerSection: opts.oncePerSection !== false
    });
    function onClick(event) {
      var trigger = event.target.closest ? event.target.closest("[data-navx-term]") : null;
      if (!trigger || !root.contains(trigger)) return;
      event.preventDefault();
      var id = trigger.getAttribute("data-navx-term");
      var entry = glossary.terms.filter(function (item) { return item.id === id; })[0];
      if (!entry) return;
      if (popover.isOpen() && trigger.getAttribute("aria-expanded") === "true") {
        popover.close();
      } else {
        popover.open(entry, trigger);
      }
    }
    root.addEventListener("click", onClick);
    return {
      glossary: glossary,
      decorated: decorated,
      close: function () { popover.close(); },
      destroy: function () {
        root.removeEventListener("click", onClick);
        popover.destroy();
      }
    };
  }

  SN.glossary = {
    fromContent: fromContent,
    findDefinition: findDefinition,
    decorate: decorate,
    createPopover: createPopover,
    enhance: enhance
  };
})();
