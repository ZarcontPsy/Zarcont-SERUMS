/* Banqueo · analizador de PDF
   © 2026 ZARCONT — Licencia propietaria (ver LICENSE)
   - Extrae texto por coordenadas y reconstruye líneas/columnas.
   - Detecta resaltados amarillos renderizados (también en PDFs sin anotaciones).
   - Clasifica por el contenido del encabezado, no por el nombre del archivo.
   - Usa OCR solo cuando una página no tiene texto seleccionable.
   - Todo ocurre en el navegador; el PDF original no se modifica. */
(function () {
  "use strict";

  const SCALE = 1.5;
  const MAXMB = 60;
  const MAXPG = 300;
  const OFFICIAL = window.BANCO_OFICIAL || { professions: [] };
  const PDF_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  const TESSERACT_SRC = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
  const MONTHS = {
    enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
    julio: 7, agosto: 8, setiembre: 9, septiembre: 9, octubre: 10,
    noviembre: 11, diciembre: 12,
  };

  if (window.pdfjsLib) window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER;

  function normalize(value) {
    return String(value || "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
  }

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function stripQuestionNumber(value) {
    return String(value || "").replace(/^\d{1,3}\s*[.)]\s*/, "").trim();
  }

  function stripOptionMarker(value) {
    return String(value || "").replace(/^[A-F]\s*[.)]\s*/, "").trim();
  }

  async function sha256(buffer) {
    if (window.crypto?.subtle) {
      const digest = await crypto.subtle.digest("SHA-256", buffer);
      return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    }
    let h1 = 0x811c9dc5;
    let h2 = 0x9e3779b9;
    const bytes = new Uint8Array(buffer);
    for (let index = 0; index < bytes.length; index += 1) {
      h1 ^= bytes[index];
      h1 = Math.imul(h1, 0x01000193) >>> 0;
      h2 = (Math.imul(h2 ^ bytes[index], 0x85ebca6b) + index) >>> 0;
    }
    return `fnv1a-${h1.toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}`;
  }

  async function loadTesseract() {
    if (window.Tesseract) return window.Tesseract;
    if (!window.__banqueoTesseractPromise) {
      window.__banqueoTesseractPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = TESSERACT_SRC;
        script.async = true;
        const timer = setTimeout(() => reject(new Error("OCR no disponible: tiempo de espera agotado.")), 30000);
        script.onload = () => { clearTimeout(timer); resolve(window.Tesseract); };
        script.onerror = () => { clearTimeout(timer); reject(new Error("OCR no disponible: no se pudo cargar el motor.")); };
        document.head.append(script);
      });
    }
    return window.__banqueoTesseractPromise;
  }

  function itemLineText(items) {
    const ordered = [...items].sort((a, b) => a.x0 - b.x0);
    let text = "";
    let last = null;
    ordered.forEach((item) => {
      const raw = String(item.text || "");
      if (!raw) return;
      if (last) {
        const gap = item.x0 - last.x1;
        if (gap > Math.max(0.8, (item.fontHeight || 8) * 0.12) && !/\s$/.test(text) && !/^\s/.test(raw)) text += " ";
      }
      text += raw;
      last = item;
    });
    return cleanText(text);
  }

  function groupPageItems(items) {
    const withGeometry = items
      .filter((item) => item.text && item.text.trim())
      .map((item) => ({
        text: item.text,
        x0: item.x0,
        x1: item.x1,
        base: item.base,
        y0: item.y0,
        y1: item.y1,
        fontHeight: item.fontHeight || 10,
      }))
      .sort((a, b) => a.base - b.base || a.x0 - b.x0);

    const baseLines = [];
    withGeometry.forEach((item) => {
      let line = baseLines.find((candidate) => Math.abs(candidate.base - item.base) <= Math.max(2.2, item.fontHeight * 0.28));
      if (!line) {
        line = { base: item.base, items: [] };
        baseLines.push(line);
      }
      line.items.push(item);
    });

    const segments = [];
    baseLines.forEach((line) => {
      const ordered = line.items.sort((a, b) => a.x0 - b.x0);
      let current = [];
      const flush = () => {
        if (!current.length) return;
        const text = itemLineText(current);
        if (!text) { current = []; return; }
        const x0 = Math.min(...current.map((item) => item.x0));
        const x1 = Math.max(...current.map((item) => item.x1));
        const y0 = Math.min(...current.map((item) => item.y0));
        const y1 = Math.max(...current.map((item) => item.y1));
        segments.push({
          text, x0, x1, y0, y1, base: line.base,
          fontHeight: Math.max(...current.map((item) => item.fontHeight)),
          items: [...current],
        });
        current = [];
      };
      ordered.forEach((item) => {
        if (!current.length) { current.push(item); return; }
        const last = current[current.length - 1];
        const gap = item.x0 - last.x1;
        if (gap > Math.max(28, item.fontHeight * 2.1)) flush();
        current.push(item);
      });
      flush();
    });
    return segments;
  }

  function annotationRects(annotations, viewport) {
    return annotations
      .filter((annotation) => annotation.subtype === "Highlight")
      .filter((annotation) => {
        if (!annotation.color) return true;
        const color = Array.isArray(annotation.color) ? annotation.color : [];
        if (color.length < 3) return true;
        return color[0] > 180 && color[1] > 150 && color[2] < 190;
      })
      .map((annotation) => {
        if (Array.isArray(annotation.quadPoints) && annotation.quadPoints.length >= 8) {
          const points = annotation.quadPoints;
          const xs = [points[0], points[2], points[4], points[6]];
          const ys = [points[1], points[3], points[5], points[7]];
          const a = viewport.convertToViewportPoint(Math.min(...xs), Math.min(...ys));
          const b = viewport.convertToViewportPoint(Math.max(...xs), Math.max(...ys));
          return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])];
        }
        if (Array.isArray(annotation.rect) && annotation.rect.length === 4) {
          const a = viewport.convertToViewportPoint(annotation.rect[0], annotation.rect[1]);
          const b = viewport.convertToViewportPoint(annotation.rect[2], annotation.rect[3]);
          return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])];
        }
        return null;
      })
      .filter(Boolean);
  }

  function buildPixelReader(canvas) {
    const context = canvas.getContext("2d", { willReadFrequently: true });
    let imageData = null;
    try { imageData = context.getImageData(0, 0, canvas.width, canvas.height); } catch { imageData = null; }
    if (!imageData) return null;
    return {
      isYellow(line) {
        const x0 = Math.max(0, Math.floor(line.x0 - 9));
        const x1 = Math.min(canvas.width, Math.ceil(Math.max(line.x1, line.x0 + 55) + 9));
        const y0 = Math.max(0, Math.floor(line.y0 + 1));
        const y1 = Math.min(canvas.height, Math.ceil(line.y1 - 1));
        if (x1 <= x0 || y1 <= y0) return false;
        let yellow = 0;
        let total = 0;
        for (let y = y0; y < y1; y += 1) {
          for (let x = x0; x < x1; x += 1) {
            const offset = (y * canvas.width + x) * 4;
            const r = imageData.data[offset];
            const g = imageData.data[offset + 1];
            const b = imageData.data[offset + 2];
            total += 1;
            if (r > 185 && g > 155 && b < 185 && r > g * 0.9 && r + g > 320 && Math.abs(r - g) < 110) yellow += 1;
          }
        }
        return total > 20 && yellow / total > 0.16;
      },
    };
  }

  function fillToRgb(args, kind) {
    if (!args) return null;
    const values = Array.from(args);
    if (!values.length) return null;
    if (kind === "gray") {
      const gray = values[0] <= 1 ? values[0] * 255 : values[0];
      return [gray, gray, gray];
    }
    if (kind === "cmyk") {
      const [c, m, y, k] = values.map((value) => (value > 1 ? value / 255 : value));
      return [
        255 * (1 - c) * (1 - k),
        255 * (1 - m) * (1 - k),
        255 * (1 - y) * (1 - k),
      ];
    }
    return values.length >= 3
      ? values.slice(0, 3).map((value) => (value <= 1 && values.some((item) => item > 1) ? value * 255 : value))
      : null;
  }

  function isYellowFill(color) {
    if (!color || color.length < 3) return false;
    const [r, g, b] = color;
    return r > 200 && g > 170 && b < 130 && r > g * 0.95 && g > b * 1.5;
  }

  function rectToViewport(x0, y0, x1, y1, viewport) {
    const points = [
      viewport.convertToViewportPoint(x0, y0),
      viewport.convertToViewportPoint(x1, y0),
      viewport.convertToViewportPoint(x1, y1),
      viewport.convertToViewportPoint(x0, y1),
    ];
    const xs = points.map((point) => point[0]);
    const ys = points.map((point) => point[1]);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  }

  function yellowVectorRects(operatorList, viewport) {
    const OPS = window.pdfjsLib?.OPS;
    if (!OPS || !operatorList?.fnArray?.length) return [];
    const rectangle = OPS.rectangle ?? 19;
    const fillOps = new Set([OPS.fill, OPS.eoFill, OPS.fillStroke, OPS.eoFillStroke, OPS.closeFillStroke, OPS.closeEOFillStroke].filter(Number.isFinite));
    const clipOps = new Set([OPS.clip, OPS.eoClip, OPS.endPath].filter(Number.isFinite));
    const rects = [];
    const stack = [];
    let fill = [0, 0, 0];
    let pending = null;
    for (let index = 0; index < operatorList.fnArray.length; index += 1) {
      const fn = operatorList.fnArray[index];
      const args = operatorList.argsArray[index];
      if (fn === OPS.save) stack.push(fill.slice());
      else if (fn === OPS.restore) fill = stack.pop() || [0, 0, 0];
      else if (fn === OPS.setFillRGBColor) fill = fillToRgb(args, "rgb") || [0, 0, 0];
      else if (fn === OPS.setFillGray) fill = fillToRgb(args, "gray") || [0, 0, 0];
      else if (fn === OPS.setFillCMYKColor) fill = fillToRgb(args, "cmyk") || [0, 0, 0];
      else if (fn === OPS.constructPath) {
        const pathOps = Array.from(args?.[0] || []);
        const coords = Array.from(args?.[1] || []);
        const minMax = Array.from(args?.[2] || []);
        const paths = [];
        if (pathOps.length && pathOps.every((op) => op === rectangle) && coords.length >= pathOps.length * 4) {
          pathOps.forEach((op, pathIndex) => {
            const offset = pathIndex * 4;
            const x = coords[offset];
            const y = coords[offset + 1];
            const width = coords[offset + 2];
            const height = coords[offset + 3];
            paths.push([x, y, x + width, y + height]);
          });
        } else if (minMax.length >= 4) {
          paths.push([minMax[0], minMax[2], minMax[1], minMax[3]]);
        }
        pending = { fill: fill.slice(), paths };
      } else if (fillOps.has(fn)) {
        if (pending && isYellowFill(pending.fill)) {
          pending.paths.forEach((path) => {
            const rect = rectToViewport(path[0], path[1], path[2], path[3], viewport);
            if (rect[2] - rect[0] >= 2 && rect[3] - rect[1] >= 2) rects.push(rect);
          });
        }
        pending = null;
      } else if (clipOps.has(fn)) {
        pending = null;
      }
    }
    return rects;
  }

  async function renderPageCanvas(page, viewport, timeout) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    let task = null;
    try {
      task = page.render({ canvasContext: canvas.getContext("2d", { willReadFrequently: true }), viewport });
    } catch {
      return null;
    }
    let timer = null;
    const timeoutPromise = new Promise((resolve) => {
      timer = setTimeout(() => {
        try { task.cancel(); } catch {}
        resolve(null);
      }, timeout);
    });
    try {
      const result = await Promise.race([task.promise.then(() => canvas).catch(() => null), timeoutPromise]);
      return result;
    } finally {
      clearTimeout(timer);
    }
  }

  function overlapsAnnotation(line, annotationRects) {
    return annotationRects.some((rect) => {
      const vertical = Math.max(0, Math.min(line.y1, rect[3]) - Math.max(line.y0, rect[1]));
      const horizontal = Math.max(0, Math.min(line.x1, rect[2]) - Math.max(line.x0, rect[0]));
      return vertical > Math.max(4, (line.y1 - line.y0) * 0.45) && horizontal > 8;
    });
  }

  function ocrLinesFromResult(data) {
    const words = Array.isArray(data.words) ? data.words : [];
    if (words.length) {
      const groups = new Map();
      words.forEach((word, index) => {
        if (!word.text || !word.text.trim() || !word.bbox) return;
        const center = (word.bbox.y0 + word.bbox.y1) / 2;
        const key = word.line !== undefined ? `l${word.line}` : `y${Math.round(center / 12)}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push({
          text: word.text,
          x0: word.bbox.x0, x1: word.bbox.x1,
          y0: word.bbox.y0, y1: word.bbox.y1,
          fontHeight: Math.max(7, word.bbox.y1 - word.bbox.y0),
        });
      });
      const lines = [];
      groups.forEach((group) => {
        const ordered = group.sort((a, b) => a.x0 - b.x0);
        let current = [];
        const flush = () => {
          if (!current.length) return;
          const text = current.map((item) => item.text).join(" ").replace(/\s+/g, " ").trim();
          if (text) {
            lines.push({
              text,
              x0: Math.min(...current.map((item) => item.x0)),
              x1: Math.max(...current.map((item) => item.x1)),
              y0: Math.min(...current.map((item) => item.y0)),
              y1: Math.max(...current.map((item) => item.y1)),
              base: Math.min(...current.map((item) => item.y0)),
              fontHeight: Math.max(...current.map((item) => item.fontHeight)),
            });
          }
          current = [];
        };
        ordered.forEach((word) => {
          if (!current.length) { current.push(word); return; }
          const last = current[current.length - 1];
          if (word.x0 - last.x1 > Math.max(30, word.fontHeight * 2.2)) flush();
          current.push(word);
        });
        flush();
      });
      return lines;
    }
    if (Array.isArray(data.lines)) {
      return data.lines.filter((line) => line.text && line.bbox).map((line) => ({
        text: line.text.replace(/\s+/g, " ").trim(),
        x0: line.bbox.x0, x1: line.bbox.x1,
        y0: line.bbox.y0, y1: line.bbox.y1,
        base: line.bbox.y0,
        fontHeight: Math.max(7, line.bbox.y1 - line.bbox.y0),
      }));
    }
    return [];
  }

  async function readPage(page, pageNumber, options, onProgress) {
    const viewport = page.getViewport({ scale: SCALE });
    const textContent = await page.getTextContent();
    const pageItems = (textContent.items || []).filter((item) => item.str && item.str.trim()).map((item) => {
      const transform = window.pdfjsLib.Util.transform(viewport.transform, item.transform);
      const fontHeight = Math.hypot(transform[2], transform[3]) || (item.height || 10) * SCALE;
      return {
        text: item.str,
        x0: transform[4],
        x1: transform[4] + (item.width || 0) * SCALE,
        base: transform[5],
        y0: transform[5] - fontHeight,
        y1: transform[5] + fontHeight * 0.22,
        fontHeight,
      };
    });
    let lines = groupPageItems(pageItems);
    const operatorList = await page.getOperatorList().catch(() => null);
    const vectorRects = operatorList ? yellowVectorRects(operatorList, viewport) : [];
    const annotations = await page.getAnnotations().catch(() => []);
    const highlightRects = annotationRects(annotations, viewport).concat(vectorRects);

    let chars = lines.reduce((total, line) => total + line.text.length, 0);
    let usedOcr = false;
    let ocrError = null;
    let canvas = null;
    const needsOcr = chars < 20 && options.ocr !== false;
    const needsPixels = chars >= 20 && highlightRects.length === 0 && options.pixelFallback !== false;
    if ((needsOcr || needsPixels) && !options.renderBlocked) {
      canvas = await renderPageCanvas(page, viewport, needsOcr ? 12000 : 3000);
      if (!canvas) {
        if (needsOcr) {
          options.renderBlocked = true;
          ocrError = "No se pudo rasterizar la página para aplicar OCR.";
        } else {
          options.pixelFallback = false;
        }
      }
    } else if (needsOcr && options.renderBlocked) {
      ocrError = "No se pudo rasterizar la página para aplicar OCR.";
    }
    const reader = canvas ? buildPixelReader(canvas) : null;

    if (needsOcr && canvas) {
      try {
        onProgress({ page: pageNumber, stage: "ocr", message: "Aplicando OCR…" });
        const Tesseract = await loadTesseract();
        const result = await Tesseract.recognize(canvas, "spa+eng", {
          logger: (message) => {
            if (message.status === "recognizing text") {
              onProgress({ page: pageNumber, stage: "ocr", progress: message.progress, message: "OCR " + Math.round((message.progress || 0) * 100) + "%" });
            }
          },
        });
        const ocrLines = ocrLinesFromResult(result.data || {});
        if (ocrLines.length) {
          lines = ocrLines;
          chars = lines.reduce((total, line) => total + line.text.length, 0);
          usedOcr = true;
        }
      } catch (error) {
        ocrError = error.message || "No se pudo aplicar OCR.";
      }
    }

    lines = lines.map((line) => ({
      ...line,
      hl: overlapsAnnotation(line, highlightRects) || Boolean(reader && reader.isYellow(line)),
      pdfX0: line.x0 / SCALE,
      pdfY0: line.y0 / SCALE,
      pdfX1: line.x1 / SCALE,
      pdfY1: line.y1 / SCALE,
      page: pageNumber,
      ocr: usedOcr,
    }));

    return {
      page: pageNumber,
      lines,
      chars,
      ocr: usedOcr,
      ocrError,
      width: canvas?.width || Math.ceil(viewport.width),
      height: canvas?.height || Math.ceil(viewport.height),
    };
  }

  function classify(page, fileName) {
    const headerLines = page.lines.filter((line) => line.pdfY1 < 62);
    const allFirstPage = page.lines;
    const headerText = headerLines.map((line) => line.text).join(" ");
    const headerKey = normalize(headerText);
    const fileNameKey = normalize(fileName.replace(/\.pdf$/i, "").replace(/[-_]+/g, " "));
    let match = null;
    let matchLength = 0;
    OFFICIAL.professions.forEach((profession) => {
      (profession.aliases || [profession.name]).forEach((alias) => {
        const aliasKey = normalize(alias);
        if (!aliasKey) return;
        if (headerKey.includes(aliasKey) && aliasKey.length > matchLength) {
          match = profession;
          matchLength = aliasKey.length;
        }
      });
    });
    let suggestion = null;
    let suggestionLength = 0;
    if (!match) {
      OFFICIAL.professions.forEach((profession) => {
        (profession.aliases || [profession.name]).forEach((alias) => {
          const aliasKey = normalize(alias);
          if (!aliasKey) return;
          if (fileNameKey.includes(aliasKey) && aliasKey.length > suggestionLength) {
            suggestion = profession;
            suggestionLength = aliasKey.length;
          }
        });
      });
    }
    const dateMatch = allFirstPage.map((line) => line.text).join(" ").match(/(\d{1,2})\s+de\s+([a-záéíóú]+)\s+(?:de\s+)?(20\d{2})/i);
    let year = null;
    let convocatoria = null;
    let date = "";
    if (dateMatch) {
      const month = MONTHS[normalize(dateMatch[2]).toLowerCase()];
      year = Number(dateMatch[3]);
      if (month) date = `${String(dateMatch[1]).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
    }
    const cycleMatch = headerText.match(/SERUMS\s+(20\d{2})\s*[-\u2013]\s*(I{1,2})/i);
    if (cycleMatch) {
      year = Number(cycleMatch[1]);
      convocatoria = cycleMatch[2].toUpperCase();
    } else {
      const suffix = headerText.match(/[-\u2013]\s*(I{1,2})\s*$/i);
      if (suffix) convocatoria = suffix[1].toUpperCase();
    }
    if (!year) {
      const anyYear = headerText.match(/(20\d{2})/);
      if (anyYear) year = Number(anyYear[1]);
    }
    const confidence = match && year && convocatoria ? "alta" : match || suggestion ? "media" : "baja";
    return {
      professionId: match ? match.id : null,
      professionName: match ? match.name : null,
      suggestedProfessionId: suggestion ? suggestion.id : null,
      suggestedProfessionName: suggestion ? suggestion.name : null,
      year,
      convocatoria,
      cycle: year && convocatoria ? `${year}-${convocatoria}` : null,
      date,
      confidence,
      header: cleanText(headerText),
      evidence: headerLines.map((line) => line.text).slice(0, 6),
    };
  }

  function parseQuestions(pages) {
    const questions = [];
    let current = null;
    let previousNumber = null;
    const questionPattern = /^(\d{1,3})\s*[.)]\s*(\S.*)$/;
    const optionPattern = /^([A-F])\s*[.)]\s*(.*)$/;

    pages.forEach((page) => {
      const bodyLines = page.lines.filter((line) => {
        if (line.pdfY1 < 55 || line.pdfY0 > 800) return false;
        if (/^P.gina\s+\d+\s+de\s+\d+$/i.test(line.text)) return false;
        if (/^\d{1,2}\s+de\s+[a-záéíóú]+\s+(?:de\s+)?\d{4}$/i.test(line.text)) return false;
        return true;
      });
      const rows = [];
      bodyLines.forEach((line) => {
        let row = rows.find((candidate) => Math.abs(candidate.y - line.y0) <= 3.1);
        if (!row) { row = { y: line.y0, items: [] }; rows.push(row); }
        row.items.push(line);
      });
      rows.forEach((row) => row.items.sort((a, b) => a.x0 - b.x0));

      rows.forEach((row) => {
        let startLine = null;
        for (const line of row.items) {
          const match = line.text.match(questionPattern);
          if (match && line.pdfX0 < 100) {
            const number = Number(match[1]);
            if (current === null || (number > previousNumber && number <= previousNumber + 15)) {
              startLine = line;
              break;
            }
          }
        }
        let remaining = row.items;
        if (startLine) {
          const match = startLine.text.match(questionPattern);
          current = {
            n: Number(match[1]),
            p: page.page,
            statementLines: [startLine],
            options: {},
            ocr: startLine.ocr || false,
          };
          questions.push(current);
          previousNumber = current.n;
          remaining = row.items.filter((line) => line !== startLine);
        }
        if (!current) return;
        remaining.forEach((line) => {
          const optionMatch = line.text.match(optionPattern);
          if (optionMatch) {
            const letter = optionMatch[1];
            current.options[letter] = {
              letter,
              lines: [line],
              x0: line.x0, x1: line.x1, y0: line.y0, y1: line.y1,
              hl: Boolean(line.hl),
              ocr: Boolean(line.ocr),
            };
            current.ocr = current.ocr || Boolean(line.ocr);
            return;
          }
          const columnLeft = line.x0 < (page.width / 2);
          const candidates = Object.values(current.options).filter((option) => {
            const optionLeft = option.x0 < (page.width / 2);
            return optionLeft === columnLeft && option.y0 <= line.y0 + 2;
          });
          if (candidates.length) {
            const option = candidates.sort((a, b) => b.y0 - a.y0)[0];
            option.lines.push(line);
            option.x1 = Math.max(option.x1, line.x1);
            option.y1 = Math.max(option.y1, line.y1);
            option.hl = option.hl || Boolean(line.hl);
            return;
          }
          if (!Object.keys(current.options).length) {
            current.statementLines.push(line);
            current.ocr = current.ocr || Boolean(line.ocr);
          } else {
            const last = Object.values(current.options).sort((a, b) => b.y0 - a.y0)[0];
            last.lines.push(line);
            last.x1 = Math.max(last.x1, line.x1);
            last.y1 = Math.max(last.y1, line.y1);
            last.hl = last.hl || Boolean(line.hl);
          }
        });
      });
    });

    return questions.map((rawQuestion) => {
      const statementLines = rawQuestion.statementLines.map((line) => line.text);
      if (statementLines.length) statementLines[0] = stripQuestionNumber(statementLines[0]);
      const rawStatement = rawQuestion.statementLines.map((line) => line.text).join("\n");
      const statement = cleanText(statementLines.join(" "));
      const options = [];
      Object.keys(rawQuestion.options).sort().forEach((letter) => {
        const option = rawQuestion.options[letter];
        const parts = option.lines.map((line) => line.text);
        if (!parts.length) return;
        const text = cleanText(stripOptionMarker(parts[0]) + " " + parts.slice(1).join(" "));
        if (!text) return;
        options.push({
          id: letter,
          text,
          raw: parts.join("\n"),
          hl: Boolean(option.hl),
          box: [option.x0 / SCALE, option.y0 / SCALE, option.x1 / SCALE, option.y1 / SCALE],
          page: option.lines[0]?.page || rawQuestion.p,
        });
      });
      const highlighted = options.filter((option) => option.hl);
      const correct = highlighted.length === 1 ? highlighted[0].id : "";
      const status = correct && options.length >= 2 && !rawQuestion.ocr ? "valid" : "pending";
      const confidence = status === "valid" ? "alta" : correct ? "media" : "baja";
      return {
        n: rawQuestion.n,
        p: rawQuestion.p,
        s: statement,
        r: rawStatement,
        o: options,
        c: correct,
        ev: highlighted.length === 1 ? highlighted[0].box : null,
        evPage: highlighted.length === 1 ? highlighted[0].page : null,
        st: status,
        cf: confidence,
        ocr: Boolean(rawQuestion.ocr),
        ambiguous: highlighted.length > 1,
        incidental: rawQuestion.statementLines.filter((line) => line.hl).map((line) => ({ text: line.text, page: line.page })),
        page: rawQuestion.p,
        optionsCount: options.length,
        statement,
        correct,
        status,
        confidence,
        statementLines: rawQuestion.statementLines,
      };
    });
  }

  function buildAudit(classification, questions, pages, issues) {
    const answers = questions.filter((question) => question.c);
    const verified = questions.filter((question) => question.status === "valid" && question.c && question.optionsCount >= 2 && !question.ambiguous);
    const missing = questions.filter((question) => question.status !== "valid" || !question.c || question.ambiguous || question.optionsCount < 2);
    const highIssues = issues.filter((issue) => issue.severity === "alta");
    const coverage = questions.length ? (answers.length / questions.length) * 100 : 0;
    let status = "validado";
    if (!classification.professionId || !classification.year || !classification.convocatoria) status = "excepcion";
    else if (!questions.length || missing.length || highIssues.length) status = "revision";
    return {
      status,
      coverage: Math.round(coverage * 100) / 100,
      pagesProcessed: pages.length,
      pagesWithText: pages.filter((page) => page.chars > 20 || page.ocr).length,
      pagesWithoutText: pages.filter((page) => page.chars <= 20 && !page.ocr).length,
      pagesOcr: pages.filter((page) => page.ocr).length,
      questionsDetected: questions.length,
      questionsVerified: verified.length,
      answersIdentified: answers.length,
      incidents: issues.length,
      highIssues: highIssues.length,
      reviewRequired: missing.length,
      ambiguousAnswers: questions.filter((question) => question.ambiguous).length,
      missingAnswers: questions.filter((question) => !question.c).length,
      incompleteOptions: questions.filter((question) => question.optionsCount < 2).length,
      missingNumbers: [],
      duplicateQuestions: 0,
      duplicateGroups: 0,
      reviewed: 0,
      generatedAt: new Date().toISOString(),
      source: "extracción local",
    };
  }

  function collectIssues(classification, questions, pages) {
    const issues = [];
    const add = (type, severity, detail, extra = {}) => issues.push({ type, severity, detail, ...extra });
    if (!classification.professionId) {
      add("profesion_no_determinada", "alta", "No se pudo determinar la profesión desde el contenido. Envía el archivo a excepciones o selecciona la profesión manualmente.", {
        suggestions: classification.suggestedProfessionId ? [classification.suggestedProfessionId] : [],
      });
    }
    if (!classification.year || !classification.convocatoria) {
      add("ciclo_no_determinado", "alta", "No se pudo determinar el año y la convocatoria desde el contenido.");
    }
    pages.filter((page) => page.ocrError).forEach((page) => {
      add("ocr_error", "alta", page.ocrError, { page: page.page });
    });
    pages.filter((page) => page.chars <= 20 && !page.ocr).forEach((page) => {
      add("pagina_sin_texto", "alta", "La página no tiene texto seleccionable y el OCR no está disponible o no se activó.", { page: page.page });
    });
    pages.filter((page) => page.ocr).forEach((page) => {
      add("ocr_aplicado", "info", "Página procesada con OCR. Revisa el texto y la respuesta antes de confiar en ella.", { page: page.page });
    });
    questions.forEach((question) => {
      if (question.ambiguous) {
        add("respuesta_ambigua", "alta", `Pregunta ${question.n}: hay más de una alternativa resaltada.`, { page: question.p, questions: [question.n] });
      } else if (!question.c) {
        add("respuesta_no_identificada", "alta", `Pregunta ${question.n}: no se detectó una única respuesta resaltada.`, { page: question.p, questions: [question.n] });
      }
      if (question.optionsCount < 2) {
        add("alternativas_incompletas", "alta", `Pregunta ${question.n}: solo se detectaron ${question.optionsCount} alternativas.`, { page: question.p, questions: [question.n] });
      }
      (question.incidental || []).forEach((incident) => {
        add("resaltado_incidental", "info", `Pregunta ${question.n}: hay un resaltado amarillo sobre el enunciado; no se usó como respuesta.`, {
          page: incident.page || question.p,
          questions: [question.n],
          snippet: incident.text,
        });
      });
    });
    for (let index = 1; index < questions.length; index += 1) {
      if (questions[index].n !== questions[index - 1].n + 1) {
        add("salto_numeracion", "alta", `Salto de numeración: ${questions[index - 1].n} → ${questions[index].n}.`, {
          page: questions[index].p,
          questions: [questions[index - 1].n, questions[index].n],
        });
      }
    }
    return issues;
  }

  async function analyzeBuffer(buffer, fileName, options = {}, onProgress = () => {}) {
    if (!window.pdfjsLib) throw new Error("No se pudo cargar el motor de PDF. Comprueba tu conexión e inténtalo de nuevo.");
    if (buffer.byteLength > MAXMB * 1048576) throw new Error(`El archivo supera el límite de ${MAXMB} MB.`);
    if (!/^%PDF-/.test(new TextDecoder().decode(buffer.slice(0, 5)))) throw new Error("El archivo no es un PDF válido.");
    const hash = await sha256(buffer);
    let pdf;
    try {
      pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
    } catch {
      throw new Error("El PDF está dañado, protegido o no se puede leer.");
    }
    if (pdf.numPages > MAXPG) throw new Error(`El PDF supera el límite de ${MAXPG} páginas.`);
    const pages = [];
    const extraction = { ocr: options.ocr !== false, pixelFallback: options.pixelFallback !== false, renderBlocked: false };
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      onProgress({ page: pageNumber, total: pdf.numPages, stage: "text", message: `Analizando página ${pageNumber} de ${pdf.numPages}…` });
      const page = await pdf.getPage(pageNumber);
      const result = await readPage(page, pageNumber, extraction, onProgress);
      pages.push(result);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    const firstPage = pages[0] || { lines: [] };
    const classification = classify(firstPage, fileName);
    const questions = parseQuestions(pages);
    const issues = collectIssues(classification, questions, pages);
    const audit = buildAudit(classification, questions, pages, issues);
    const numbers = questions.map((question) => question.n);
    audit.missingNumbers = [];
    if (questions.length && numbers[0] !== 1) audit.missingNumbers.push(1);
    for (let index = 1; index < numbers.length; index += 1) {
      for (let missing = numbers[index - 1] + 1; missing < numbers[index]; missing += 1) audit.missingNumbers.push(missing);
    }
    if (audit.missingNumbers.length) {
      issues.push({
        type: "preguntas_omitidas",
        severity: "alta",
        detail: `Faltan los números de pregunta: ${audit.missingNumbers.join(", ")}.`,
        questions: audit.missingNumbers,
      });
      audit.status = "revision";
      audit.incidents = issues.length;
      audit.highIssues = issues.filter((issue) => issue.severity === "alta").length;
    }
    const profession = OFFICIAL.professions.find((item) => item.id === classification.professionId);
    const suggestedTitle = profession && classification.cycle
      ? `${profession.name} · SERUMS ${classification.cycle} · Importado`
      : fileName.replace(/\.pdf$/i, "");
    return {
      name: fileName,
      hash,
      bytes: buffer.byteLength,
      pages: pdf.numPages,
      pagesWithText: audit.pagesWithText,
      pagesWithoutText: audit.pagesWithoutText,
      classification,
      questions,
      issues,
      audit,
      pageStats: pages.map((page) => ({ page: page.page, chars: page.chars, lines: page.lines.length, ocr: page.ocr })),
      suggestedTitle,
    };
  }

  async function analyzeFile(file, options = {}, onProgress = () => {}) {
    const buffer = await file.arrayBuffer();
    return analyzeBuffer(buffer, file.name, options, onProgress);
  }

  window.BanqueoParser = {
    analyzeFile,
    analyzeBuffer,
    sha256,
    classify,
    MAXMB,
    MAXPG,
  };
})();
