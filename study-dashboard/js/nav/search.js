/* © 2026 ZARCONT — Study Dashboard · Búsqueda en el cuerpo
   Núcleo puro (índice, ranking, fragmento) + panel editorial reutilizable.
   El índice se construye al enfocar el campo, nunca al cargar la página. */
(function () {
  "use strict";

  var SN = window.StudyNav;
  if (!SN) throw new Error("StudyNav: carga core.js antes de search.js");
  var U = SN.util;
  var MARK_RE = /\p{M}/u;

  /* ------------------------------------------------------------------ */
  /* Normalización y términos                                            */
  /* ------------------------------------------------------------------ */

  function normalizeWithMap(value) {
    var source = String(value == null ? "" : value);
    var out = [];
    var map = [];
    var i = 0;
    while (i < source.length) {
      var code = source.codePointAt(i);
      var ch = String.fromCodePoint(code);
      var start = i;
      i += ch.length;
      var folded = ch.normalize("NFD");
      for (var j = 0; j < folded.length; j += 1) {
        var part = folded.charAt(j);
        if (MARK_RE.test(part)) continue;
        var lower = part.toLowerCase();
        for (var k = 0; k < lower.length; k += 1) {
          out.push(lower.charAt(k));
          map.push(start);
        }
      }
    }
    return { text: out.join(""), map: map };
  }

  function normalize(value) {
    return normalizeWithMap(value).text;
  }

  function tokenize(query) {
    var normalized = normalize(query).replace(/\s+/g, " ").trim();
    if (!normalized) return [];
    var parts = normalized.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    var seen = {};
    var out = [];
    parts.forEach(function (part) {
      var token = part.length > 48 ? part.slice(0, 48) : part;
      if (!token || seen[token]) return;
      seen[token] = true;
      out.push(token);
    });
    return out.slice(0, 8);
  }

  function cleanQuery(query) {
    return normalize(query).replace(/[^\p{L}\p{N}\s]+/gu, " ").replace(/\s+/g, " ").trim();
  }

  function tokenRegex(token) {
    var body = U.escapeRegExp(token) + (token.length >= 3 ? "[\\p{L}\\p{N}]*" : "");
    return new RegExp("(?<![\\p{L}\\p{N}])" + body + "(?![\\p{L}\\p{N}])", "gu");
  }

  function compileMatchers(tokens) {
    return (tokens || []).map(function (token) {
      return { token: token, re: tokenRegex(token) };
    });
  }

  function nowMs() {
    try {
      if (window.performance && typeof window.performance.now === "function") return window.performance.now();
    } catch (e) {}
    return Date.now();
  }

  function countInNormalized(text, matcher) {
    if (!text || !matcher) return 0;
    matcher.re.lastIndex = 0;
    var count = 0;
    var match;
    while ((match = matcher.re.exec(text)) !== null) {
      count += 1;
      if (match[0].length === 0) matcher.re.lastIndex += 1;
      if (count > 400) break;
    }
    return count;
  }

  function countInText(text, matcher) {
    return countInNormalized(normalize(text), matcher);
  }

  function allTokensIn(normalizedText, matchers) {
    if (!normalizedText || !matchers.length) return false;
    return matchers.every(function (matcher) { return countInNormalized(normalizedText, matcher) > 0; });
  }

  function containsPhrase(normalizedText, phrase) {
    return !!normalizedText && !!phrase && normalizedText.indexOf(phrase) !== -1;
  }

  function isWordBoundary(text, index) {
    if (index <= 0) return true;
    return !/[\p{L}\p{N}]/u.test(text.charAt(index - 1));
  }

  function findRanges(text, input) {
    var matchers = input && input.length && input[0].token ? input : compileMatchers(input);
    var normalized = normalizeWithMap(text);
    var ranges = [];
    matchers.forEach(function (matcher) {
      matcher.re.lastIndex = 0;
      var match;
      while ((match = matcher.re.exec(normalized.text)) !== null) {
        var start = match.index;
        var end = start + match[0].length;
        if (end <= start || normalized.map[start] == null) {
          if (end <= start) matcher.re.lastIndex += 1;
          continue;
        }
        var originalStart = normalized.map[start];
        var originalEnd = normalized.map[end - 1] + 1;
        if (isWordBoundary(text, originalStart)) {
          ranges.push({ start: originalStart, end: originalEnd });
        }
      }
    });
    ranges.sort(function (a, b) { return a.start - b.start || b.end - a.end; });
    var merged = [];
    ranges.forEach(function (range) {
      var last = merged[merged.length - 1];
      if (last && range.start <= last.end) {
        last.end = Math.max(last.end, range.end);
      } else {
        merged.push({ start: range.start, end: range.end });
      }
    });
    return merged;
  }

  function escapeSegment(text) {
    return SN.escape(text);
  }

  function highlightRanges(text, ranges) {
    if (!ranges || !ranges.length) return escapeSegment(text);
    var html = [];
    var cursor = 0;
    ranges.forEach(function (range) {
      if (range.start < cursor) return;
      html.push(escapeSegment(text.slice(cursor, range.start)));
      html.push('<mark class="navx-mark">' + escapeSegment(text.slice(range.start, range.end)) + "</mark>");
      cursor = range.end;
    });
    html.push(escapeSegment(text.slice(cursor)));
    return html.join("");
  }

  function highlightText(text, input) {
    var matchers = input && input.length && input[0].token ? input : compileMatchers(tokenize(input || ""));
    return highlightRanges(String(text == null ? "" : text), findRanges(String(text == null ? "" : text), matchers));
  }

  /* ------------------------------------------------------------------ */
  /* Fragmento editorial                                                 */
  /* ------------------------------------------------------------------ */

  function buildSnippet(text, matchers, options) {
    var opts = options || {};
    var source = String(text == null ? "" : text).replace(/\s+/g, " ").trim();
    var maxLength = opts.maxLength || 200;
    var ranges = findRanges(source, matchers);
    if (!ranges.length) {
      var plain = source.length > maxLength ? source.slice(0, maxLength).replace(/\s+\S*$/, "") + "…" : source;
      return { html: escapeSegment(plain), plain: plain, ranges: [] };
    }
    var first = ranges[0];
    var start = 0;
    var end = source.length;
    if (source.length > maxLength) {
      start = Math.max(0, first.start - 64);
      if (start > 0) {
        var space = source.indexOf(" ", start);
        if (space !== -1 && space < first.start) start = space + 1;
      }
      end = Math.min(source.length, start + maxLength);
      if (end < source.length) {
        var cut = source.lastIndexOf(" ", end);
        if (cut > first.end) end = cut;
      }
    }
    var prefix = start > 0 ? "…" : "";
    var suffix = end < source.length ? "…" : "";
    var slice = source.slice(start, end);
    var localRanges = [];
    ranges.forEach(function (range) {
      if (range.end <= start || range.start >= end) return;
      localRanges.push({
        start: Math.max(0, range.start - start),
        end: Math.min(slice.length, range.end - start)
      });
    });
    return {
      html: escapeSegment(prefix) + highlightRanges(slice, localRanges) + escapeSegment(suffix),
      plain: prefix + slice + suffix,
      ranges: localRanges
    };
  }

  function makeSnippet(text, query, options) {
    return buildSnippet(text, compileMatchers(tokenize(query)), options || {});
  }

  /* ------------------------------------------------------------------ */
  /* Índice derivado del contenido real                                  */
  /* ------------------------------------------------------------------ */

  function byId(list) {
    var map = {};
    (list || []).forEach(function (item) { if (item && item.id) map[item.id] = item; });
    return map;
  }

  function findArea(content, id) {
    if (!content || !id) return null;
    if (content.primaryAreaById && content.primaryAreaById[id]) return content.primaryAreaById[id];
    if (content.areaById && content.areaById[id]) return content.areaById[id];
    return (content.areas || []).filter(function (area) { return area.id === id; })[0] || null;
  }

  function findCategory(content, id) {
    if (!content || !id) return null;
    if (content.categoryById && content.categoryById[id]) return content.categoryById[id];
    return (content.categories || []).filter(function (cat) { return cat.id === id; })[0] || null;
  }

  function block(kind, text, sectionIndex, sectionTitle, paragraphIndex) {
    var value = String(text == null ? "" : text);
    return {
      kind: kind,
      text: value,
      n: normalize(value),
      sectionIndex: sectionIndex == null ? null : sectionIndex,
      sectionTitle: sectionTitle || "",
      paragraphIndex: paragraphIndex == null ? null : paragraphIndex
    };
  }

  function buildDoc(sheet, content, taxonomy) {
    if (!sheet || !sheet.id) return null;
    var cat = taxonomy && typeof taxonomy.categoryForSheet === "function"
      ? taxonomy.categoryForSheet(sheet)
      : findCategory(content, sheet.categoryId);
    var area = cat && taxonomy && typeof taxonomy.area === "function"
      ? taxonomy.area(cat.areaId)
      : findArea(content, (cat && cat.areaId) || sheet.primaryAreaId || sheet.areaId);
    var topic = content.topicById
      ? content.topicById[sheet.topicId]
      : (content.topics || []).filter(function (t) { return t.id === sheet.topicId; })[0];
    var sections = Array.isArray(sheet.sections) ? sheet.sections : [];
    var blocks = [];
    var sectionTitles = [];

    sections.forEach(function (section, sectionIndex) {
      if (!section) return;
      var title = section.title || "";
      if (title) sectionTitles.push(title);
      (section.body || []).forEach(function (paragraph, paragraphIndex) {
        if (String(paragraph || "").trim()) blocks.push(block("body", paragraph, sectionIndex, title, paragraphIndex));
      });
      (section.bullets || []).forEach(function (bullet, bulletIndex) {
        if (String(bullet || "").trim()) blocks.push(block("bullet", bullet, sectionIndex, title, bulletIndex));
      });
      if (section.table && Array.isArray(section.table.headers)) {
        var headers = section.table.headers.filter(function (h) { return String(h || "").trim(); });
        var headerText = headers.join(" · ");
        if (headerText) blocks.push(block("table", headerText, sectionIndex, title, 0));
        (section.table.rows || []).forEach(function (row, rowIndex) {
          var rowText = (row || []).filter(function (cell) { return String(cell || "").trim(); }).join(" · ");
          if (rowText) blocks.push(block("table", rowText, sectionIndex, title, rowIndex + 1));
        });
      }
      var callouts = [];
      if (section.callout) callouts.push(section.callout);
      if (Array.isArray(section.callouts)) callouts = callouts.concat(section.callouts);
      callouts.forEach(function (callout, calloutIndex) {
        if (!callout || (!callout.title && !callout.text)) return;
        var calloutText = [callout.title, callout.text].filter(Boolean).join(". ");
        blocks.push(block("callout", calloutText, sectionIndex, title, calloutIndex));
      });
    });

    var concepts = (sheet.keyConcepts || []).map(function (concept) { return String(concept || ""); }).filter(Boolean);
    var title = String(sheet.title || "");
    var summary = String(sheet.summary || "");
    var bodyN = blocks.map(function (item) { return item.n; }).join(" \n ");
    var areaTitle = area ? String(area.title || area.short || "") : "";
    var categoryTitle = cat ? String(cat.title || cat.short || "") : "";
    var topicTitle = topic ? String(topic.title || "") : "";

    return {
      id: sheet.id,
      type: "sheet",
      title: title,
      titleN: normalize(title),
      summary: summary,
      summaryN: normalize(summary),
      keyConcepts: concepts,
      conceptsN: normalize(concepts.join(" · ")),
      kicker: String(sheet.kicker || ""),
      minutes: Number(sheet.minutes) || 0,
      level: String(sheet.level || ""),
      areaId: area ? area.id : String((cat && cat.areaId) || sheet.primaryAreaId || sheet.areaId || ""),
      areaTitle: areaTitle,
      areaShort: area ? String(area.short || areaTitle) : areaTitle,
      categoryId: cat ? cat.id : String(sheet.categoryId || ""),
      categoryTitle: categoryTitle,
      categoryShort: cat ? String(cat.short || categoryTitle) : categoryTitle,
      topicId: String(sheet.topicId || ""),
      topicTitle: topicTitle,
      sections: sections.length,
      sectionTitlesN: normalize(sectionTitles.join(" · ")),
      sectionTitles: sectionTitles,
      blocks: blocks,
      bodyN: bodyN,
      href: "#/ficha/" + encodeURIComponent(sheet.id)
    };
  }

  function indexMeta(source, docs, content) {
    return {
      version: 1,
      source: source || "content",
      builtAt: new Date().toISOString(),
      docs: docs,
      counts: {
        sheets: docs.length,
        areas: (content && content.primaryAreas ? content.primaryAreas.length : 0),
        categories: (content && content.categories ? content.categories.length : 0)
      }
    };
  }

  function buildIndex(content, options) {
    var opts = options || {};
    var source = content || window.STUDY_CONTENT;
    if (!source || !Array.isArray(source.sheets)) {
      throw new Error("No hay contenido del temario para indexar.");
    }
    var taxonomy = opts.taxonomy || window.StudyTaxonomy || null;
    var docs = source.sheets.map(function (sheet) { return buildDoc(sheet, source, taxonomy); }).filter(Boolean);
    return indexMeta(opts.source || "content", docs, source);
  }

  function buildIndexAsync(content, options) {
    var opts = options || {};
    var source = content || window.STUDY_CONTENT;
    if (!source || !Array.isArray(source.sheets)) {
      return Promise.reject(new Error("No hay contenido del temario para indexar."));
    }
    var taxonomy = opts.taxonomy || window.StudyTaxonomy || null;
    var chunkSize = Math.max(1, Number(opts.chunkSize) || 18);
    var docs = [];
    var total = source.sheets.length;
    var cursor = 0;
    var signal = opts.signal || null;

    return new Promise(function (resolve, reject) {
      function step() {
        if (signal && signal.aborted) {
          var abort = new Error("Indexación cancelada.");
          abort.name = "AbortError";
          reject(abort);
          return;
        }
        var end = Math.min(total, cursor + chunkSize);
        for (; cursor < end; cursor += 1) {
          var doc = buildDoc(source.sheets[cursor], source, taxonomy);
          if (doc) docs.push(doc);
        }
        if (typeof opts.onProgress === "function") {
          opts.onProgress({ done: cursor, total: total, percent: total ? Math.round((cursor / total) * 100) : 100 });
        }
        if (cursor < total) {
          window.setTimeout(step, 0);
        } else {
          resolve(indexMeta(opts.source || "content", docs, source));
        }
      }
      window.setTimeout(step, 0);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Adaptador para study-data/derived/search.json (Agente 2)            */
  /* ------------------------------------------------------------------ */

  function firstDefined(object, keys) {
    for (var i = 0; i < keys.length; i += 1) {
      if (object && object[keys[i]] != null) return object[keys[i]];
    }
    return null;
  }

  function syntheticSheetFromDoc(entry, content) {
    var id = firstDefined(entry, ["sheetId", "id", "sheet_id"]);
    if (!id) return null;
    var base = (content.sheetById && content.sheetById[id]) ||
      (content.sheets || []).filter(function (sheet) { return sheet.id === id; })[0] || {};
    var title = firstDefined(entry, ["title", "sheetTitle"]) || base.title || id;
    var summary = firstDefined(entry, ["summary", "resumen"]) || base.summary || "";
    var concepts = firstDefined(entry, ["keyConcepts", "concepts", "conceptos"]);
    if (!Array.isArray(concepts)) concepts = base.keyConcepts || [];
    var sections = [];
    var rawSections = firstDefined(entry, ["sections", "blocks"]);
    if (Array.isArray(rawSections) && rawSections.length) {
      sections = rawSections.map(function (section) {
        if (typeof section === "string") return { title: "", body: [section] };
        return {
          title: section.title || section.sectionTitle || "",
          depth: section.depth || "core",
          body: Array.isArray(section.body) ? section.body :
            (section.text ? [section.text] : (section.paragraphs ? section.paragraphs : [])),
          bullets: Array.isArray(section.bullets) ? section.bullets : []
        };
      });
    } else {
      var body = firstDefined(entry, ["body", "text", "content", "paragraphs"]);
      if (Array.isArray(body)) sections = [{ title: "", depth: "core", body: body }];
      else if (body) sections = [{ title: "", depth: "core", body: [String(body)] }];
    }
    return Object.assign({}, base, {
      id: id,
      title: title,
      summary: summary,
      keyConcepts: concepts,
      areaId: firstDefined(entry, ["areaId", "primaryAreaId"]) || base.areaId,
      categoryId: firstDefined(entry, ["categoryId"]) || base.categoryId,
      sections: sections
    });
  }

  function sheetsFromEntries(entries, content) {
    var groups = {};
    var order = [];
    entries.forEach(function (entry) {
      if (!entry || typeof entry !== "object") return;
      var id = firstDefined(entry, ["sheetId", "id", "sheet_id"]);
      if (!id) return;
      if (!groups[id]) { groups[id] = []; order.push(id); }
      groups[id].push(entry);
    });
    return order.map(function (id) {
      var base = (content.sheetById && content.sheetById[id]) ||
        (content.sheets || []).filter(function (sheet) { return sheet.id === id; })[0] || {};
      var list = groups[id].slice().sort(function (a, b) {
        var sa = Number(firstDefined(a, ["sectionIndex", "section"])) || 0;
        var sb = Number(firstDefined(b, ["sectionIndex", "section"])) || 0;
        var pa = Number(firstDefined(a, ["paragraphIndex", "paragraph"])) || 0;
        var pb = Number(firstDefined(b, ["paragraphIndex", "paragraph"])) || 0;
        return sa - sb || pa - pb;
      });
      var sections = [];
      list.forEach(function (entry) {
        var sectionIndex = Number(firstDefined(entry, ["sectionIndex", "section"])) || 0;
        if (!sections[sectionIndex]) sections[sectionIndex] = { title: "", depth: "core", body: [], bullets: [] };
        var section = sections[sectionIndex];
        if (entry.sectionTitle) section.title = entry.sectionTitle;
        var text = firstDefined(entry, ["text", "snippet", "body", "paragraph"]);
        if (text == null) return;
        if (entry.kind === "bullet" || entry.field === "bullet") section.bullets.push(String(text));
        else section.body.push(String(text));
        if (!section.title && entry.sectionTitle) section.title = entry.sectionTitle;
      });
      sections = sections.filter(Boolean);
      if (!sections.length) {
        var allText = list.map(function (entry) {
          return firstDefined(entry, ["text", "snippet", "body", "paragraph"]);
        }).filter(Boolean);
        sections = [{ title: "", depth: "core", body: allText }];
      }
      return Object.assign({}, base, {
        id: id,
        sections: sections,
        title: base.title || (list[0] && firstDefined(list[0], ["title", "sheetTitle"])) || id,
        summary: base.summary || (list[0] && firstDefined(list[0], ["summary", "resumen"])) || "",
        keyConcepts: base.keyConcepts || (list[0] && firstDefined(list[0], ["keyConcepts", "concepts"])) || []
      });
    });
  }

  /* Formato compacto real de study-data/derived/search.json:
     entries[] con {k, sid, s, p, t, f}. k identifica el bloque:
       m título de la ficha, y resumen, s título de sección, p párrafo,
       b viñeta, t fila de tabla, w aviso y c concepto clave.
     t es el texto normalizado completo que se indexa; f, si existe, conserva
     acentos y se prefiere para el fragmento visible. */
  var COMPACT_KINDS = { m: true, y: true, s: true, p: true, b: true, t: true, w: true, c: true };

  function compactText(entry) {
    var full = entry && entry.t != null ? String(entry.t).trim() : "";
    var display = entry && entry.f != null ? String(entry.f).trim() : "";
    if (!full) full = display;
    if (!display) display = full;
    return { full: full, display: display };
  }

  function compactSheetId(entry) {
    if (!entry) return "";
    var id = entry.sid != null ? entry.sid : (entry.sheetId != null ? entry.sheetId : entry.id);
    return id == null ? "" : String(id);
  }

  function compactGroupEntries(entries) {
    var groups = {};
    var order = [];
    (entries || []).forEach(function (entry) {
      if (!entry || typeof entry !== "object") return;
      var kind = String(entry.k || "").toLowerCase();
      if (!COMPACT_KINDS[kind]) return;
      var id = compactSheetId(entry);
      if (!id) return;
      if (!groups[id]) {
        groups[id] = { id: id, entries: [] };
        order.push(groups[id]);
      }
      groups[id].entries.push(entry);
    });
    return order;
  }

  function compactSheetFromGroup(group, content) {
    var base = (content && content.sheetById && content.sheetById[group.id]) ||
      ((content && content.sheets) || []).filter(function (sheet) { return sheet.id === group.id; })[0] ||
      null;
    /* El derivado no puede inventar fichas: si el contenido no la conoce, se omite. */
    if (content && Array.isArray(content.sheets) && !base) return null;
    base = base || {};
    var baseSections = Array.isArray(base.sections) ? base.sections : [];
    var title = String(base.title || "");
    var summary = String(base.summary || "");
    var concepts = Array.isArray(base.keyConcepts) ? base.keyConcepts.slice() : [];
    var sectionMeta = {};
    var conceptByIndex = [];
    var maxSection = -1;
    var display = { body: {}, bullet: {}, table: {}, callout: {} };

    function ensureSection(index) {
      if (!Number.isFinite(index) || index < 0) return null;
      maxSection = Math.max(maxSection, index);
      if (!sectionMeta[index]) {
        var baseSection = baseSections[index] || {};
        sectionMeta[index] = {
          title: String(baseSection.title || ""),
          depth: baseSection.depth === "full" ? "full" : "core",
          body: [],
          bullets: [],
          table: null,
          callouts: []
        };
      }
      return sectionMeta[index];
    }

    group.entries.forEach(function (entry) {
      var kind = String(entry.k || "").toLowerCase();
      var sectionIndex = Number(entry.s);
      var paragraphIndex = Number(entry.p);
      var text = compactText(entry);
      if (kind === "m") {
        if (!title) title = text.display;
        return;
      }
      if (kind === "y") {
        if (!summary) summary = text.display;
        return;
      }
      if (kind === "c") {
        if (Number.isFinite(paragraphIndex) && paragraphIndex >= 0) {
          if (conceptByIndex[paragraphIndex] == null) conceptByIndex[paragraphIndex] = text.display;
        } else if (text.display) {
          conceptByIndex.push(text.display);
        }
        return;
      }
      if (kind === "s") {
        if (!Number.isFinite(sectionIndex) || sectionIndex < 0) return;
        var section = ensureSection(sectionIndex);
        if (section && text.display) section.title = text.display;
        return;
      }
      if (!Number.isFinite(sectionIndex) || sectionIndex < 0) return;
      var targetSection = ensureSection(sectionIndex);
      if (!targetSection) return;
      if (kind === "p" && Number.isFinite(paragraphIndex) && paragraphIndex >= 0) {
        targetSection.body[paragraphIndex] = text.full;
        (display.body[sectionIndex] = display.body[sectionIndex] || {})[paragraphIndex] = text.display;
      } else if (kind === "b" && Number.isFinite(paragraphIndex) && paragraphIndex >= 0) {
        targetSection.bullets[paragraphIndex] = text.full;
        (display.bullet[sectionIndex] = display.bullet[sectionIndex] || {})[paragraphIndex] = text.display;
      } else if (kind === "t" && Number.isFinite(paragraphIndex) && paragraphIndex >= 0) {
        if (!targetSection.table) targetSection.table = { headers: [], rows: [] };
        targetSection.table.rows[paragraphIndex] = [text.full];
        (display.table[sectionIndex] = display.table[sectionIndex] || {})[paragraphIndex + 1] = text.display;
      } else if (kind === "w") {
        var calloutIndex = targetSection.callouts.length;
        targetSection.callouts.push({ title: "", text: text.full });
        (display.callout[sectionIndex] = display.callout[sectionIndex] || {})[calloutIndex] = text.display;
      }
    });

    var compactConcepts = [];
    conceptByIndex.forEach(function (value) {
      if (value && compactConcepts.indexOf(value) === -1) compactConcepts.push(value);
    });
    if (!concepts.length) concepts = compactConcepts;

    var sections = [];
    for (var index = 0; index <= maxSection; index += 1) {
      var meta = sectionMeta[index];
      if (!meta) {
        meta = { title: "", depth: "core", body: [], bullets: [], table: null, callouts: [] };
      }
      var section = {
        title: meta.title,
        depth: meta.depth,
        body: meta.body,
        bullets: meta.bullets
      };
      if (meta.table) section.table = meta.table;
      if (meta.callouts.length) section.callouts = meta.callouts;
      sections.push(section);
    }

    return Object.assign({}, base, {
      id: group.id,
      title: title || group.id,
      summary: summary,
      keyConcepts: concepts,
      sections: sections,
      __navxCompactDisplay: display
    });
  }

  function applyCompactDisplay(doc, sheet) {
    var display = sheet && sheet.__navxCompactDisplay;
    if (!doc || !display) return doc;
    (doc.blocks || []).forEach(function (block) {
      var bySection = display[block.kind];
      if (!bySection) return;
      var values = bySection[block.sectionIndex];
      if (!values) return;
      var visible = values[block.paragraphIndex];
      if (visible != null && visible !== block.text) block.display = visible;
    });
    delete sheet.__navxCompactDisplay;
    return doc;
  }

  function adaptCompactEntries(entries, content, taxonomy) {
    var docs = [];
    compactGroupEntries(entries).forEach(function (group) {
      var sheet = compactSheetFromGroup(group, content || {});
      if (!sheet) return;
      var doc = buildDoc(sheet, content || {}, taxonomy);
      if (doc) docs.push(applyCompactDisplay(doc, sheet));
    });
    return docs;
  }

  function adaptDerivedIndex(data, options) {
    var opts = options || {};
    var content = opts.content || window.STUDY_CONTENT;
    var taxonomy = opts.taxonomy || window.StudyTaxonomy || null;
    if (!data) throw new Error("El índice derivado está vacío.");
    if (Array.isArray(data) && data.length && data[0].sectionIndex != null) {
      data = { entries: data };
    } else if (Array.isArray(data) && data.length && data[0].k != null && compactSheetId(data[0])) {
      data = { entries: data };
    }
    if (data.contentVersion && content && content.version &&
        String(data.contentVersion) !== String(content.version)) {
      throw new Error("El índice derivado no corresponde a la versión del contenido.");
    }
    var compact = !!(Array.isArray(data.entries) && data.entries.some(function (entry) {
      return entry && entry.k != null && compactSheetId(entry);
    }));
    var docs = [];
    if (compact) {
      docs = adaptCompactEntries(data.entries, content || {}, taxonomy);
      if (!docs.length) throw new Error("El índice derivado no contiene fichas válidas.");
      var compactIndex = indexMeta("derived", docs, content || {});
      compactIndex.derivedVersion = data.version || null;
      compactIndex.generatedAt = data.generatedAt || data.builtAt || null;
      compactIndex.compact = true;
      return compactIndex;
    }
    if (Array.isArray(data.docs) && data.docs.length) {
      data.docs.forEach(function (entry) {
        var sheet = syntheticSheetFromDoc(entry, content || {});
        if (sheet) {
          var doc = buildDoc(sheet, content || {}, taxonomy);
          if (doc) docs.push(doc);
        }
      });
    } else if (Array.isArray(data.entries) || Array.isArray(data.items)) {
      var entries = data.entries || data.items;
      var sheets = sheetsFromEntries(entries, content || {});
      sheets.forEach(function (sheet) {
        var doc = buildDoc(sheet, content || {}, taxonomy);
        if (doc) docs.push(doc);
      });
    } else if (Array.isArray(data.sheets) && data.sheets.length) {
      data.sheets.forEach(function (entry) {
        var sheet = syntheticSheetFromDoc(entry, content || {});
        if (sheet) {
          var doc = buildDoc(sheet, content || {}, taxonomy);
          if (doc) docs.push(doc);
        }
      });
    } else {
      throw new Error("Formato de índice derivado no reconocido.");
    }
    if (!docs.length) throw new Error("El índice derivado no contiene fichas válidas.");
    var index = indexMeta("derived", docs, content || {});
    index.derivedVersion = data.version || null;
    index.generatedAt = data.generatedAt || data.builtAt || null;
    return index;
  }

  /* ------------------------------------------------------------------ */
  /* Ranking                                                             */
  /* ------------------------------------------------------------------ */

  function scoreDoc(doc, matchers, full) {
    var counts = {
      title: 0, concepts: 0, summary: 0, sections: 0,
      body: 0, bullets: 0, tables: 0, callout: 0
    };
    var tokenHits = 0;
    var blockMatches = [];
    var bodyCounts = { body: 0, bullet: 0, table: 0, callout: 0 };

    doc.blocks.forEach(function (item) {
      var count = 0;
      matchers.forEach(function (matcher) { count += countInNormalized(item.n, matcher); });
      if (count > 0) {
        blockMatches.push({ block: item, matches: count });
        if (item.kind === "bullet") bodyCounts.bullet += count;
        else if (item.kind === "table") bodyCounts.table += count;
        else if (item.kind === "callout") bodyCounts.callout += count;
        else bodyCounts.body += count;
      }
    });

    matchers.forEach(function (matcher) {
      var titleCount = countInNormalized(doc.titleN, matcher);
      var conceptCount = countInNormalized(doc.conceptsN, matcher);
      var summaryCount = countInNormalized(doc.summaryN, matcher);
      var sectionCount = countInNormalized(doc.sectionTitlesN, matcher);
      var bodyCount = countInNormalized(doc.bodyN, matcher);
      counts.title += titleCount;
      counts.concepts += conceptCount;
      counts.summary += summaryCount;
      counts.sections += sectionCount;
      counts.body += bodyCount;
      if (titleCount + conceptCount + summaryCount + sectionCount + bodyCount > 0) tokenHits += 1;
    });
    if (tokenHits < matchers.length) return null;

    counts.body = bodyCounts.body;
    counts.bullets = bodyCounts.bullet;
    counts.tables = bodyCounts.table;
    counts.callout = bodyCounts.callout;

    var score = 240;
    if (counts.title) score += 170 + Math.min(120, counts.title * 38);
    if (allTokensIn(doc.titleN, matchers)) score += 520;
    if (containsPhrase(doc.titleN, full)) score += 300;
    if (doc.titleN === full) score += 900;
    else if (doc.titleN.indexOf(full) === 0) score += 260;
    if (counts.concepts) score += 48 + Math.min(90, counts.concepts * 10);
    if (allTokensIn(doc.conceptsN, matchers)) score += 190;
    if (containsPhrase(doc.conceptsN, full)) score += 85;
    if (counts.summary) score += 12 + Math.min(32, counts.summary * 4);
    if (counts.sections) score += 22 + Math.min(30, counts.sections * 4);
    score += Math.min(60, counts.body * 3);
    score += Math.min(38, counts.bullets * 4);
    score += Math.min(28, counts.tables * 3);
    score += Math.min(12, counts.callout * 2);
    if (containsPhrase(doc.bodyN, full)) score += 26;

    var total = counts.title + counts.concepts + counts.summary + counts.sections +
      counts.body + counts.bullets + counts.tables + counts.callout;
    return {
      doc: doc,
      counts: counts,
      total: total,
      blockMatches: blockMatches,
      score: score
    };
  }

  /* El índice compacto trae dos textos por entrada: t (normalizado, completo,
     para buscar) y f (con acentos, a veces recortado, para mostrar). Se usa f
     cuando contiene alguna coincidencia y, si no, el texto completo. */
  function snippetSource(block, matchers) {
    if (!block) return "";
    var display = block.display;
    if (display && display !== block.text && findRanges(display, matchers || []).length) {
      return display;
    }
    return block.text;
  }

  function chooseSnippetData(doc, ranked) {
    var candidates = [];
    var priority = { body: 100, bullet: 90, table: 82, callout: 70 };
    (ranked.blockMatches || []).forEach(function (item) {
      candidates.push({
        text: snippetSource(item.block, ranked.matchers),
        matches: item.matches,
        kind: item.block.kind,
        priority: priority[item.block.kind] || 50
      });
    });
    doc.keyConcepts.forEach(function (concept) {
      var count = 0;
      var matchers = ranked.matchers || [];
      matchers.forEach(function (matcher) { count += countInText(concept, matcher); });
      if (count) candidates.push({ text: concept, matches: count, kind: "concept", priority: 55 });
    });
    if (doc.summary) {
      var summaryMatches = 0;
      (ranked.matchers || []).forEach(function (matcher) { summaryMatches += countInText(doc.summary, matcher); });
      if (summaryMatches) candidates.push({ text: doc.summary, matches: summaryMatches, kind: "summary", priority: 40 });
    }
    if (doc.title) {
      var titleMatches = 0;
      (ranked.matchers || []).forEach(function (matcher) { titleMatches += countInText(doc.title, matcher); });
      if (titleMatches) candidates.push({ text: doc.title, matches: titleMatches, kind: "title", priority: 30 });
    }
    candidates.sort(function (a, b) {
      return b.matches - a.matches || b.priority - a.priority;
    });
    return candidates[0] || { text: doc.summary || doc.title || "", matches: 0, kind: "none" };
  }

  function matchFieldLabel(counts) {
    var fields = [];
    if (counts.title) fields.push("el título");
    if (counts.concepts) fields.push("los conceptos");
    if (counts.sections) fields.push("las secciones");
    if (counts.summary) fields.push("el resumen");
    if (counts.body) fields.push("el cuerpo");
    if (counts.bullets) fields.push("las viñetas");
    if (counts.tables) fields.push("las tablas");
    if (counts.callout) fields.push("los avisos");
    if (!fields.length) return "";
    if (fields.length === 1) return " en " + fields[0];
    return " en " + fields.slice(0, 2).join(" y ");
  }

  function searchIndex(index, query, options) {
    var opts = options || {};
    var start = nowMs();
    var tokens = tokenize(query);
    var full = cleanQuery(query);
    if (!tokens.length) {
      return { query: String(query || ""), tokens: [], results: [], total: 0, shown: 0, truncated: false, ms: 0, indexSource: index ? index.source : "" };
    }
    if (!index || !Array.isArray(index.docs)) {
      throw new Error("El índice de búsqueda no está disponible.");
    }
    var matchers = compileMatchers(tokens);
    var areaId = opts.areaId || "";
    var scored = [];
    index.docs.forEach(function (doc) {
      if (areaId && doc.areaId !== areaId) return;
      var ranked = scoreDoc(doc, matchers, full);
      if (!ranked) return;
      ranked.matchers = matchers;
      scored.push(ranked);
    });
    scored.sort(function (a, b) {
      return b.score - a.score ||
        a.doc.title.localeCompare(b.doc.title, "es") ||
        a.doc.id.localeCompare(b.doc.id);
    });
    var limit = opts.limit == null ? 40 : opts.limit;
    var results = scored.slice(0, limit).map(function (ranked) {
      var doc = ranked.doc;
      var snippetData = chooseSnippetData(doc, ranked);
      var snippet = buildSnippet(snippetData.text, matchers, { maxLength: opts.snippetLength || 200 });
      return {
        id: doc.id,
        type: "sheet",
        title: doc.title,
        titleHTML: highlightText(doc.title, matchers),
        areaId: doc.areaId,
        areaTitle: doc.areaTitle,
        categoryId: doc.categoryId,
        categoryTitle: doc.categoryTitle,
        topicTitle: doc.topicTitle,
        path: [doc.areaTitle, doc.categoryTitle].filter(Boolean),
        href: opts.hrefFor ? opts.hrefFor(doc.id) : doc.href,
        snippet: snippet.html,
        snippetPlain: snippet.plain,
        matches: ranked.total,
        matchLabel: ranked.total + " " + (ranked.total === 1 ? "coincidencia" : "coincidencias") + matchFieldLabel(ranked.counts),
        counts: ranked.counts,
        score: ranked.score,
        minutes: doc.minutes
      };
    });
    var end = nowMs();
    return {
      query: String(query || ""),
      tokens: tokens,
      results: results,
      total: scored.length,
      shown: results.length,
      truncated: scored.length > results.length,
      ms: Math.max(1, Math.round(end - start)),
      indexSource: index.source || ""
    };
  }

  /* ------------------------------------------------------------------ */
  /* Markup de resultados                                                */
  /* ------------------------------------------------------------------ */

  function renderResultsHTML(results, tokensOrMatchers, options) {
    var opts = options || {};
    var matchers = tokensOrMatchers && tokensOrMatchers.length && tokensOrMatchers[0].token
      ? tokensOrMatchers : compileMatchers(tokenize(tokensOrMatchers || ""));
    return (results || []).map(function (result) {
      var titleHTML = result.titleHTML || highlightText(result.title, matchers);
      var href = opts.hrefFor ? opts.hrefFor(result.id) : result.href;
      var path = (result.path || []).length ? result.path.join(" · ") : "Ficha del temario";
      return '<li class="navx-result-item">' +
        '<article class="navx-result" data-navx-result="' + SN.escape(result.id) + '">' +
          '<a class="navx-result-link" href="' + SN.escape(href) + '" data-navx-sheet="' + SN.escape(result.id) + '">' +
            '<span class="navx-result-type">Ficha</span>' +
            '<h3 class="navx-result-title">' + titleHTML + '</h3>' +
            '<span class="navx-result-path">' + SN.escape(path) + '</span>' +
            '<span class="navx-result-snippet">' + result.snippet + '</span>' +
            '<span class="navx-result-foot">' +
              '<span class="navx-result-count">' + SN.escape(result.matchLabel || (result.matches + " coincidencias")) + '</span>' +
              '<span class="navx-result-open">Abrir ficha ' + SN.icon("arrow", 14) + '</span>' +
            '</span>' +
          '</a>' +
        '</article>' +
      '</li>';
    }).join("");
  }

  /* ------------------------------------------------------------------ */
  /* Proveedor de índice (compartido por búsqueda y paleta)              */
  /* ------------------------------------------------------------------ */

  function createIndexProvider(options) {
    var opts = options || {};
    var state = "idle";
    var index = null;
    var error = null;
    var progress = { done: 0, total: 0, percent: 0 };
    var promise = null;
    var listeners = [];
    var generation = 0;
    var controller = null;

    function snapshot() {
      return {
        state: state,
        index: index,
        error: error,
        progress: progress,
        source: index ? index.source : "",
        counts: index ? index.counts : null
      };
    }
    function notify() {
      var value = snapshot();
      listeners.slice().forEach(function (fn) {
        try { fn(value); } catch (e) {}
      });
    }
    function ensure() {
      if (state === "ready" && index) return Promise.resolve(index);
      if (promise) return promise;
      if (!opts.content && !window.STUDY_CONTENT) {
        state = "error";
        error = new Error("No hay contenido del temario para indexar.");
        notify();
        return Promise.reject(error);
      }
      var myGeneration = generation;
      state = "loading";
      error = null;
      progress = { done: 0, total: opts.content ? (opts.content.sheets || []).length : (window.STUDY_CONTENT.sheets || []).length, percent: 0 };
      notify();
      if (typeof opts.load === "function") {
        promise = Promise.resolve().then(opts.load);
      } else {
        if (typeof AbortController === "function") controller = new AbortController();
        promise = buildIndexAsync(opts.content || window.STUDY_CONTENT, {
          taxonomy: opts.taxonomy,
          chunkSize: opts.chunkSize || 18,
          source: opts.source || "content",
          signal: controller ? controller.signal : null,
          onProgress: function (value) {
            if (myGeneration !== generation) return;
            progress = value;
            notify();
          }
        });
      }
      var current = promise;
      promise = current.then(function (next) {
        if (myGeneration !== generation) return next;
        if (!next || !Array.isArray(next.docs)) throw new Error("El índice no tiene un formato válido.");
        index = next;
        state = "ready";
        error = null;
        progress = { done: next.docs.length, total: next.docs.length, percent: 100 };
        controller = null;
        notify();
        return index;
      }).catch(function (err) {
        if (myGeneration !== generation) throw err;
        state = "error";
        error = err || new Error("No se pudo preparar el índice.");
        controller = null;
        promise = null;
        notify();
        throw error;
      });
      return promise;
    }
    function reset() {
      generation += 1;
      if (controller) {
        try { controller.abort(); } catch (e) {}
        controller = null;
      }
      state = "idle";
      index = null;
      error = null;
      progress = { done: 0, total: 0, percent: 0 };
      promise = null;
      notify();
    }
    function subscribe(fn) {
      if (typeof fn !== "function") return function () {};
      listeners.push(fn);
      return function () {
        listeners = listeners.filter(function (item) { return item !== fn; });
      };
    }

    return {
      ensure: ensure,
      reset: reset,
      subscribe: subscribe,
      get: function () { return index; },
      getState: function () { return snapshot(); },
      isReady: function () { return state === "ready" && !!index; }
    };
  }

  /* ------------------------------------------------------------------ */
  /* Panel de búsqueda                                                   */
  /* ------------------------------------------------------------------ */

  function idList() {
    var seen = {};
    var out = [];
    (window.StudyTaxonomy && window.StudyTaxonomy.primaryAreas ? window.StudyTaxonomy.primaryAreas() : []).forEach(function (area) {
      if (area && !seen[area.id]) { seen[area.id] = true; out.push(area); }
    });
    return out;
  }

  function createPanel(options) {
    var opts = options || {};
    var mount = typeof opts.mount === "string" ? document.querySelector(opts.mount) : opts.mount;
    if (!mount) throw new Error("StudyNav.search.createPanel: falta el contenedor.");
    var content = opts.content || window.STUDY_CONTENT;
    var taxonomy = opts.taxonomy || window.StudyTaxonomy || null;
    var provider = opts.provider || createIndexProvider({
      content: content,
      taxonomy: taxonomy,
      chunkSize: opts.chunkSize || 18
    });
    /* Host externo opcional: la app reserva #library-body-results para los
       resultados, fuera del bloque del campo. El panel sigue siendo el dueño
       del render y de la delegación de eventos. */
    var resultsMount = opts.resultsMount
      ? (typeof opts.resultsMount === "string" ? document.querySelector(opts.resultsMount) : opts.resultsMount)
      : null;
    var externalBody = !!(resultsMount && resultsMount !== mount);
    var baseId = U.uid("navx-search");
    var inputId = baseId + "-input";
    var filterId = baseId + "-filter";
    var statusId = baseId + "-status";
    var bodyId = externalBody && resultsMount.id ? resultsMount.id : baseId + "-body";
    var query = String(opts.value || "");
    var areaId = String(opts.areaId || "");
    var lastResult = null;
    var searchTimer = null;
    var debugState = null;
    var destroyed = false;
    var unsubscribe = null;
    var externalBodyClassAdded = false;

    function esc(value) { return SN.escape(value); }

    function areaOptions() {
      var areas = taxonomy && typeof taxonomy.primaryAreas === "function"
        ? taxonomy.primaryAreas().filter(function (area, index, list) {
          return area && list.map(function (item) { return item.id; }).indexOf(area.id) === index;
        })
        : idList();
      return areas.map(function (area) {
        return '<option value="' + esc(area.id) + '"' + (areaId === area.id ? " selected" : "") + ">" + esc(area.title) + "</option>";
      }).join("");
    }

    var shell =
      '<div class="navx-search" data-navx-search>' +
        '<div class="navx-search-bar">' +
          '<div class="navx-field">' +
            '<span class="navx-field-icon" aria-hidden="true">' + SN.icon("search", 18) + '</span>' +
            '<label class="s-sr-only" for="' + inputId + '">Buscar en títulos, conceptos y cuerpo de las fichas</label>' +
            '<input id="' + inputId + '" class="navx-field-input" data-navx-search-input type="search" autocomplete="off" spellcheck="false" placeholder="Buscar en el temario: título, concepto o cuerpo" value="' + esc(query) + '" aria-describedby="' + statusId + '">' +
            '<button class="navx-field-clear" type="button" data-navx-search-clear aria-label="Limpiar búsqueda" hidden>' + SN.icon("close", 15) + '</button>' +
          '</div>' +
          '<label class="navx-select" for="' + filterId + '">' +
            '<span class="navx-select-label">Área</span>' +
            '<select id="' + filterId + '" data-navx-search-area aria-label="Filtrar resultados por área">' +
              '<option value="">Todas las áreas</option>' + areaOptions() +
            '</select>' +
            '<span class="navx-select-icon" aria-hidden="true">' + SN.icon("chevronDown", 14) + '</span>' +
          '</label>' +
        '</div>' +
        '<p id="' + statusId + '" class="navx-search-status" data-navx-search-status role="status" aria-live="polite">La búsqueda se activa al enfocar el campo.</p>' +
        (externalBody ? "" : '<div id="' + bodyId + '" class="navx-search-body" data-navx-search-body aria-busy="false"></div>') +
      '</div>';

    mount.innerHTML = shell;
    var root = mount.querySelector("[data-navx-search]");
    var input = root.querySelector("[data-navx-search-input]");
    if (!input) input = root.querySelector("input[type='search']");
    var areaSelect = root.querySelector("[data-navx-search-area]");
    var clearButton = root.querySelector("[data-navx-search-clear]");
    var status = root.querySelector("[data-navx-search-status]");
    var body = externalBody ? resultsMount : root.querySelector("[data-navx-search-body]");
    if (externalBody && body) {
      if (!body.id) body.id = bodyId;
      bodyId = body.id;
      if (!body.classList.contains("navx-search-body")) {
        body.classList.add("navx-search-body");
        externalBodyClassAdded = true;
      }
      body.setAttribute("data-navx-search-body", "");
      body.setAttribute("aria-busy", "false");
    }
    if (input && bodyId) input.setAttribute("aria-controls", bodyId);
    if (input && opts.inputAttributes && typeof opts.inputAttributes === "object") {
      Object.keys(opts.inputAttributes).forEach(function (name) {
        if (!/^[a-zA-Z][a-zA-Z0-9:_-]*$/.test(name)) return;
        var value = opts.inputAttributes[name];
        if (value == null || value === false) return;
        input.setAttribute(name, value === true ? "" : String(value));
      });
    }

    function setStatus(text) {
      if (status) status.textContent = text || "";
    }
    function setClearVisible() {
      if (clearButton) clearButton.hidden = !input.value;
    }
    function notifyQuery() {
      if (typeof opts.onQueryChange !== "function") return;
      try {
        opts.onQueryChange(query, { active: !!query.trim(), areaId: areaId });
      } catch (e) {}
    }
    function updateAreaFromDom() {
      areaId = areaSelect ? areaSelect.value : "";
    }
    function renderState(kind, html, options) {
      if (!body) return;
      var o = options || {};
      body.dataset.state = kind;
      body.setAttribute("aria-busy", o.busy ? "true" : "false");
      body.innerHTML = html;
    }
    function idleHTML() {
      var index = provider.get();
      var count = index && index.counts ? index.counts.sheets : (content && content.sheets ? content.sheets.length : 0);
      var area = areaId && taxonomy && taxonomy.area ? taxonomy.area(areaId) : null;
      if (provider.getState().state === "ready") {
        return '<div class="navx-search-hint">' +
          '<span class="navx-search-hint-icon" aria-hidden="true">' + SN.icon("book", 18) + '</span>' +
          '<div><b>' + (area ? "Buscando en " + esc(area.title) : "Índice listo") + '</b>' +
          '<p>' + (area ? "Escribe para buscar en esta área. El índice incluye títulos, conceptos, párrafos, viñetas y tablas." : "Escribe una palabra para buscar en las " + count + " fichas del temario. También puedes filtrar por área.") + '</p></div>' +
          '</div>';
      }
      return '<div class="navx-search-hint">' +
        '<span class="navx-search-hint-icon" aria-hidden="true">' + SN.icon("search", 18) + '</span>' +
        '<div><b>Busca dentro del temario</b><p>El índice se prepara al enfocar el campo, no al cargar la página. La búsqueda ignora tildes y mayúsculas.</p></div>' +
        '</div>';
    }
    function loadingHTML() {
      var state = provider.getState();
      var percent = state.progress && state.progress.percent ? state.progress.percent : 0;
      var countText = state.progress && state.progress.total
        ? "Indexando " + state.progress.done + " de " + state.progress.total + " fichas"
        : "Preparando el índice";
      return '<div class="navx-search-loading" role="status">' +
        '<div class="navx-search-loading-head"><span>' + esc(countText) + '</span><span>' + percent + '%</span></div>' +
        '<div class="navx-skeleton-track" aria-hidden="true"><span style="--navx-p:' + percent + '%"></span></div>' +
        '<div class="navx-skeleton" aria-hidden="true"><span></span><span></span><span></span></div>' +
        '<p class="navx-small navx-muted">La búsqueda se activará en cuanto termine. Puedes seguir escribiendo.</p>' +
        '</div>';
    }
    function errorHTML() {
      var message = (provider.getState().error && provider.getState().error.message) || "No se pudo preparar el índice de búsqueda.";
      return '<div class="navx-state navx-state--error">' +
        '<span class="navx-state-icon" aria-hidden="true">' + SN.icon("alert", 22) + '</span>' +
        '<h3>La búsqueda no está disponible</h3>' +
        '<p>' + esc(message) + ' Revisa que el temario esté cargado y vuelve a intentarlo.</p>' +
        '<button class="s-btn s-btn--ghost s-btn--sm" type="button" data-navx-search-retry>Volver a intentar</button>' +
        '</div>';
    }
    function emptyHTML() {
      var area = areaId && taxonomy && taxonomy.area ? taxonomy.area(areaId) : null;
      var scope = area ? " en " + area.title : "";
      return '<div class="navx-state navx-state--empty">' +
        '<span class="navx-state-icon" aria-hidden="true">' + SN.icon("search", 22) + '</span>' +
        '<h3>Sin coincidencias</h3>' +
        '<p>No encontramos “' + esc(input.value.trim() || "tu búsqueda") + '”' + esc(scope) + '. Prueba con otra palabra, revisa la tilde o quita el filtro de área.</p>' +
        '<div class="navx-state-actions">' +
          '<button class="s-btn s-btn--sm" type="button" data-navx-search-clear>Limpiar búsqueda</button>' +
          (areaId ? '<button class="s-btn s-btn--ghost s-btn--sm" type="button" data-navx-search-all-areas>Ver todas las áreas</button>' : "") +
        '</div>' +
        '</div>';
    }
    function resultsHTML(result) {
      var label = result.total + " " + (result.total === 1 ? "ficha" : "fichas");
      if (result.truncated) label += " · mostrando " + result.shown;
      var time = result.ms + " ms";
      return '<div class="navx-search-summary">' +
          '<span class="navx-search-count"><b>' + result.total + '</b> ' + (result.total === 1 ? "ficha" : "fichas") + '</span>' +
          '<span class="navx-search-time">' + esc(time) + '</span>' +
        '</div>' +
        '<ol class="navx-results" aria-label="Resultados de búsqueda">' +
          renderResultsHTML(result.results, result.tokens, {
            hrefFor: opts.hrefFor
          }) +
        '</ol>';
    }
    function render() {
      if (destroyed || !body) return;
      if (debugState) {
        if (debugState === "loading") {
          renderState("loading", loadingHTML(), { busy: true });
          setStatus("Preparando el índice de búsqueda.");
        } else if (debugState === "error") {
          renderState("error", errorHTML());
          setStatus("La búsqueda no está disponible.");
        } else {
          renderState("empty", emptyHTML());
          setStatus("Sin coincidencias.");
        }
        setClearVisible();
        return;
      }
      var state = provider.getState();
      if (state.state === "error") {
        renderState("error", errorHTML());
        setStatus("La búsqueda no está disponible.");
        return;
      }
      if (state.state === "loading") {
        renderState("loading", loadingHTML(), { busy: true });
        setStatus("Preparando el índice de búsqueda.");
        return;
      }
      if (!query.trim()) {
        renderState("idle", idleHTML());
        setStatus(state.state === "ready" ? "Índice listo. Escribe para buscar." : "La búsqueda se activa al enfocar el campo.");
        return;
      }
      if (state.state !== "ready") {
        renderState("idle", idleHTML());
        return;
      }
      try {
        var result = searchIndex(state.index, query, {
          areaId: areaId,
          limit: opts.limit || 30,
          hrefFor: opts.hrefFor
        });
        lastResult = result;
        if (!result.results.length) {
          renderState("empty", emptyHTML());
          setStatus("Sin coincidencias para " + query + ".");
          return;
        }
        renderState("results", resultsHTML(result));
        setStatus(result.total + " " + (result.total === 1 ? "ficha" : "fichas") + " para " + query + ".");
      } catch (err) {
        renderState("error", errorHTML());
        setStatus("La búsqueda no está disponible.");
      }
    }
    function scheduleSearch() {
      if (searchTimer) window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(function () {
        searchTimer = null;
        render();
      }, 30);
    }
    function ensureAndRender() {
      var state = provider.getState();
      if (state.state === "idle") {
        render();
        provider.ensure().catch(function () { render(); });
      } else {
        render();
      }
    }
    function openSheet(result) {
      if (!result) return;
      if (typeof opts.onOpenSheet === "function") {
        opts.onOpenSheet(result.id, result);
      } else {
        window.location.hash = "#/ficha/" + encodeURIComponent(result.id);
      }
    }

    function onFocusIn(event) {
      if (event.target !== input && event.target !== areaSelect) return;
      if (debugState) return;
      updateAreaFromDom();
      /* Si el índice ya está listo no se vuelve a pintar el resultado: el
         foco en un enlace o botón del panel no debe reemplazar el DOM. */
      if (provider.getState().state === "ready") {
        if (!query.trim()) render();
        return;
      }
      ensureAndRender();
    }
    function onInput() {
      query = input.value;
      setClearVisible();
      notifyQuery();
      if (debugState) { debugState = null; }
      if (provider.getState().state === "idle") {
        render();
        provider.ensure().catch(function () { render(); });
      } else {
        scheduleSearch();
      }
    }
    function onChange() {
      updateAreaFromDom();
      if (debugState) debugState = null;
      if (provider.getState().state === "idle") provider.ensure().catch(function () { render(); });
      scheduleSearch();
    }
    function onKeydown(event) {
      /* Enter/Escape personalizados solo cuando el foco está en el campo:
         Enter en el select o en un botón debe conservar su comportamiento. */
      if (event.target !== input) return;
      if (event.key === "Enter") {
        var first = body && body.querySelector("a[data-navx-sheet]");
        if (first) {
          event.preventDefault();
          first.click();
        }
      } else if (event.key === "Escape" && input.value) {
        event.preventDefault();
        input.value = "";
        query = "";
        setClearVisible();
        notifyQuery();
        render();
      }
    }
    function onClick(event) {
      var target = event.target;
      if (!target || !target.closest) return;
      if (target.closest("[data-navx-search-retry]")) {
        event.preventDefault();
        debugState = null;
        provider.reset();
        provider.ensure().catch(function () { render(); });
        render();
        return;
      }
      if (target.closest("[data-navx-search-clear]")) {
        event.preventDefault();
        debugState = null;
        input.value = "";
        query = "";
        setClearVisible();
        notifyQuery();
        if (provider.getState().state === "idle") provider.ensure().catch(function () {});
        render();
        input.focus();
        return;
      }
      if (target.closest("[data-navx-search-all-areas]")) {
        event.preventDefault();
        areaId = "";
        if (areaSelect) areaSelect.value = "";
        debugState = null;
        scheduleSearch();
        return;
      }
      var link = target.closest("a[data-navx-sheet]");
      if (link && typeof opts.onOpenSheet === "function") {
        event.preventDefault();
        openSheet(lastResult && lastResult.results.filter(function (r) { return r.id === link.getAttribute("data-navx-sheet"); })[0]);
      }
    }

    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("input", onInput);
    root.addEventListener("change", onChange);
    root.addEventListener("keydown", onKeydown);
    root.addEventListener("click", onClick);
    if (externalBody && body) body.addEventListener("click", onClick);
    unsubscribe = provider.subscribe(function () {
      if (destroyed) return;
      if (provider.getState().state === "ready" && query.trim()) scheduleSearch();
      else render();
    });
    setClearVisible();
    render();

    var api = {
      root: root,
      provider: provider,
      focus: function () { if (input) input.focus(); },
      setQuery: function (value, options) {
        query = String(value || "");
        input.value = query;
        setClearVisible();
        debugState = null;
        notifyQuery();
        if (options && options.focus) input.focus();
        if (provider.getState().state === "idle") provider.ensure().catch(function () {});
        render();
      },
      setArea: function (value) {
        areaId = String(value || "");
        if (areaSelect) areaSelect.value = areaId;
        render();
      },
      getArea: function () { return areaId; },
      getQuery: function () { return query; },
      run: function () { render(); return lastResult; },
      getResult: function () { return lastResult; },
      /* Solo previsualizador / QA: fuerza una vista sin tocar el índice. */
      setDebugState: function (state) {
        debugState = state === "loading" || state === "error" || state === "empty" ? state : null;
        render();
      },
      destroy: function () {
        destroyed = true;
        if (searchTimer) window.clearTimeout(searchTimer);
        if (unsubscribe) unsubscribe();
        if (externalBody && body) {
          body.removeEventListener("click", onClick);
          body.innerHTML = "";
          body.setAttribute("aria-busy", "false");
          body.removeAttribute("data-navx-search-body");
          body.removeAttribute("data-state");
          if (externalBodyClassAdded) body.classList.remove("navx-search-body");
        }
        mount.innerHTML = "";
      }
    };
    return api;
  }

  SN.search = {
    normalize: normalize,
    normalizeWithMap: normalizeWithMap,
    tokenize: tokenize,
    cleanQuery: cleanQuery,
    tokenRegex: tokenRegex,
    compileMatchers: compileMatchers,
    countInText: countInText,
    findRanges: findRanges,
    highlightText: highlightText,
    buildSnippet: buildSnippet,
    makeSnippet: makeSnippet,
    buildIndex: buildIndex,
    buildIndexAsync: buildIndexAsync,
    searchIndex: searchIndex,
    adaptDerivedIndex: adaptDerivedIndex,
    createIndexProvider: createIndexProvider,
    createPanel: createPanel,
    renderResultsHTML: renderResultsHTML
  };
})();
