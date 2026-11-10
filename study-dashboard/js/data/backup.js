/* © 2026 ZARCONT — Study Dashboard · módulo de respaldo y datos (#/respaldo)
   Registro: StudyApp.registerModule. Si StudyApp todavía no existe, el archivo no
   lanza: deja window.StudyDataBackup listo para que el Coordinador lo integre. */
(function () {
  "use strict";

  var MODULE_ID = "backup";
  var ROUTE_PATH = "respaldo";
  var MAX_FILE_BYTES = 12 * 1024 * 1024;
  var UI = null;

  var page = {
    ctx: null,
    root: null,
    mounted: false,
    file: null,
    preview: null,
    payload: null,
    mode: "merge",
    busy: false,
    dialog: null,
    dialogTrigger: null,
    dialogKeydown: null,
    handlers: null,
    reminder: null,
    reminderHandler: null
  };

  function ui() { return window.StudyUI || null; }
  function store() { return window.StudyStore || null; }
  function esc(value) {
    var utility = ui();
    if (utility && utility.escapeHTML) return utility.escapeHTML(value);
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function icon(name, size) {
    var utility = ui();
    return utility && utility.icon ? utility.icon(name, size) : "";
  }
  function plural(n, one, many) {
    var utility = ui();
    if (utility && utility.plural) return utility.plural(n, one, many);
    return Number(n) === 1 ? one : (many || one + "s");
  }
  function relative(iso) {
    var utility = ui();
    if (utility && utility.formatRelative) return utility.formatRelative(iso);
    return iso ? new Date(iso).toLocaleDateString("es-PE") : "";
  }
  function dateShort(iso) {
    var utility = ui();
    if (utility && utility.formatDateShort) return utility.formatDateShort(iso);
    return iso ? new Date(iso).toLocaleDateString("es-PE") : "";
  }
  function toast(message) {
    var utility = ui();
    if (utility && utility.toast) utility.toast(message);
  }
  function announce(ctx, message) {
    if (ctx && typeof ctx.announce === "function") { ctx.announce(message); return; }
    var live = document.getElementById("live") || document.querySelector("[data-data-live]");
    if (!live) return;
    live.textContent = "";
    window.setTimeout(function () { live.textContent = message; }, 40);
  }
  function reducedMotion() {
    var utility = ui();
    if (utility && utility.reducedMotion) return utility.reducedMotion();
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }
  function localDay() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }
  function fileName() { return "study-dashboard-progreso-" + localDay() + ".json"; }
  function focusMain() {
    var main = document.getElementById("main");
    if (main && typeof main.focus === "function") main.focus({ preventScroll: true });
  }
  function safeStoreCall(name, fallback) {
    var api = store();
    if (!api || typeof api[name] !== "function") return fallback;
    try { return api[name](); } catch (e) { return fallback; }
  }
  function statusInfo() {
    var api = store();
    if (!api || typeof api.getBackupStatus !== "function") {
      return { hasActivity: false, due: false, neverExported: true, lastExportAt: null, daysSinceExport: null };
    }
    var status = api.getBackupStatus();
    return status || { hasActivity: false, due: false, neverExported: true, lastExportAt: null, daysSinceExport: null };
  }
  function counts() {
    var api = store();
    var stats = api && api.getDashboardStats ? api.getDashboardStats() : null;
    function listLength(path, method) {
      if (!api || !api[path] || typeof api[path][method] !== "function") return 0;
      try { return api[path][method]().length; } catch (e) { return 0; }
    }
    return {
      completedSheets: stats ? stats.completedSheets : 0,
      totalSheets: stats ? stats.totalSheets : 0,
      reviewedCards: stats ? stats.reviewedCards : 0,
      annotations: listLength("annotations", "list"),
      doubts: listLength("doubts", "list"),
      userCards: listLength("userCards", "list"),
      recalls: listLength("recall", "list"),
      hasPlan: !!(api && api.plan && typeof api.plan.get === "function" && api.plan.get())
    };
  }

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  function healthCard() {
    var status = statusInfo();
    var data = counts();
    var tone = "is-muted";
    var label = "Sin actividad todavía";
    var advice = "Cuando leas tu primera ficha, este panel te recordará descargar una copia.";
    if (status.hasActivity) {
      if (status.neverExported) {
        tone = "is-warn";
        label = "Sin copia todavía";
        advice = "Todo tu progreso vive en este navegador. Descarga una copia para no depender de él.";
      } else if (status.daysSinceExport >= 7) {
        tone = "is-warn";
        label = "Toca actualizar la copia";
        advice = "Han pasado " + status.daysSinceExport + " días desde la última exportación. Una copia nueva tarda un momento.";
      } else {
        tone = "is-ok";
        label = "Copia al día";
        advice = "Tu última copia es reciente. Puedes descargar otra cuando quieras.";
      }
    }
    var last = status.lastExportAt
      ? relative(status.lastExportAt) + (dateShort(status.lastExportAt) ? " · " + dateShort(status.lastExportAt) : "")
      : "Nunca se ha exportado desde este navegador";
    return '' +
      '<section class="data-card data-health" aria-labelledby="data-health-title" data-health-slot>' +
        '<div class="data-card-head">' +
          '<div>' +
            '<span class="data-kicker"><span class="data-dot" aria-hidden="true"></span>Salud del respaldo</span>' +
            '<h2 id="data-health-title">Tu progreso, en una sola copia</h2>' +
          '</div>' +
          '<span class="data-pill ' + tone + '">' + esc(label) + '</span>' +
        '</div>' +
        '<p class="data-health-last"><span class="data-label">Última exportación</span><span data-health-last>' + esc(last) + '</span></p>' +
        '<p class="data-health-advice">' + esc(advice) + '</p>' +
        '<dl class="data-mini-grid">' +
          '<div><dt>Fichas completadas</dt><dd>' + data.completedSheets + ' <span>de ' + data.totalSheets + '</span></dd></div>' +
          '<div><dt>Tarjetas repasadas</dt><dd>' + data.reviewedCards + '</dd></div>' +
          '<div><dt>Subrayados</dt><dd>' + data.annotations + '</dd></div>' +
          '<div><dt>Dudas abiertas</dt><dd>' + data.doubts + '</dd></div>' +
          '<div><dt>Tarjetas propias</dt><dd>' + data.userCards + '</dd></div>' +
          '<div><dt>Plan</dt><dd>' + (data.hasPlan ? "Definido" : "Sin definir") + '</dd></div>' +
        '</dl>' +
        '<p class="data-note">' + icon("info", 14) + '<span>El progreso se guarda en este navegador (IndexedDB y localStorage). No hay cuenta ni nube: si borras los datos del navegador, se pierde.</span></p>' +
      '</section>';
  }

  function exportCard() {
    var status = statusInfo();
    var disabled = !status.hasActivity;
    return '' +
      '<section class="data-card" aria-labelledby="data-export-title">' +
        '<div class="data-card-head">' +
          '<div>' +
            '<span class="data-kicker"><span class="data-dot" aria-hidden="true"></span>Exportar</span>' +
            '<h2 id="data-export-title">Lleva una copia contigo</h2>' +
          '</div>' +
          '<span class="data-card-icon" aria-hidden="true">' + icon("bookmark", 20) + '</span>' +
        '</div>' +
        '<p>Descarga un archivo JSON legible con tu progreso, subrayados, dudas, tarjetas propias y plan. Sirve para recuperarlo en este u otro navegador.</p>' +
        '<ul class="data-list">' +
          '<li>Incluye fichas, tarjetas, sesiones, actividad y las colecciones nuevas.</li>' +
          '<li>No incluye el tema ni el modo de lectura: son preferencias de este navegador.</li>' +
        '</ul>' +
        '<p class="data-filename"><span class="data-label">Archivo</span> <code>' + esc(fileName()) + '</code></p>' +
        '<div class="data-actions">' +
          '<button class="data-btn data-btn--primary" type="button" data-action="export"' + (disabled ? ' disabled aria-describedby="data-export-empty"' : '') + '>' +
            icon("drop", 16) + ' Exportar progreso</button>' +
          (disabled ? '<p class="data-hint" id="data-export-empty">Aún no hay progreso que exportar. Abre una ficha y vuelve.</p>' : '') +
        '</div>' +
        '<p class="data-live" data-export-status role="status" aria-live="polite"></p>' +
      '</section>';
  }

  function importCard() {
    return '' +
      '<section class="data-card" aria-labelledby="data-import-title">' +
        '<div class="data-card-head">' +
          '<div>' +
            '<span class="data-kicker"><span class="data-dot" aria-hidden="true"></span>Importar</span>' +
            '<h2 id="data-import-title">Recupera o fusiona una copia</h2>' +
          '</div>' +
          '<span class="data-card-icon" aria-hidden="true">' + icon("drop", 20) + '</span>' +
        '</div>' +
        '<p>Elige un archivo <code>.json</code> exportado por Study Dashboard. Se lee en tu navegador, nunca se ejecuta y puedes cancelar antes de aplicar nada.</p>' +
        '<div class="data-drop" data-drop>' +
          '<span class="data-drop-icon" aria-hidden="true">' + icon("drop", 22) + '</span>' +
          '<div class="data-drop-copy">' +
            '<p>Arrastra tu copia JSON a esta zona o usa el selector.</p>' +
            '<p class="data-hint">Máximo 12 MB. Se valida la estructura antes de mostrar la vista previa.</p>' +
          '</div>' +
          '<label class="data-file" for="data-file">' +
            '<span class="data-file-btn" aria-hidden="true">Seleccionar archivo JSON</span>' +
            '<span class="data-file-name" data-file-name>Ningún archivo</span>' +
            '<input class="data-file-input" id="data-file" data-file-input type="file" accept=".json,application/json">' +
          '</label>' +
        '</div>' +
        '<p class="data-drop-status" data-drop-status role="status" aria-live="polite"></p>' +
        '<div class="data-import-preview" data-import-preview>' +
          '<p class="data-import-empty">Ningún archivo seleccionado todavía.</p>' +
        '</div>' +
      '</section>';
  }

  function deleteCard() {
    var data = counts();
    var disabled = !statusInfo().hasActivity;
    return '' +
      '<section class="data-card data-danger-card" aria-labelledby="data-delete-title">' +
        '<div class="data-card-head">' +
          '<div>' +
            '<span class="data-kicker"><span class="data-dot data-dot--danger" aria-hidden="true"></span>Borrar</span>' +
            '<h2 id="data-delete-title">Empezar de cero</h2>' +
          '</div>' +
          '<span class="data-card-icon data-card-icon--danger" aria-hidden="true">' + icon("alert", 20) + '</span>' +
        '</div>' +
        '<p>Borra todo el progreso guardado en este navegador. Antes se guarda una copia de seguridad interna, pero la interfaz no la restaura: si quieres conservar algo, expórtalo primero.</p>' +
        '<div class="data-keeps">' +
          '<div><span class="data-label">Se pierde</span><p>Fichas y tarjetas repasadas, sesiones, actividad, subrayados, dudas, tarjetas propias, plan y recordatorios de repaso.</p></div>' +
          '<div><span class="data-label">Se conserva</span><p>Tema claro u oscuro, modo de lectura y preferencia de movimiento.</p></div>' +
        '</div>' +
        '<p class="data-hint">Ahora mismo hay ' + data.completedSheets + ' ' + plural(data.completedSheets, "ficha completada", "fichas completadas") + ', ' + data.annotations + ' ' + plural(data.annotations, "subrayado", "subrayados") + ' y ' + data.doubts + ' ' + plural(data.doubts, "duda", "dudas") + '.</p>' +
        '<div class="data-actions">' +
          '<button class="data-btn data-btn--danger" type="button" data-action="delete-start"' + (disabled ? ' disabled' : '') + '>' + icon("alert", 16) + ' Borrar todo el progreso</button>' +
        '</div>' +
      '</section>';
  }

  function render(ctx) {
    return '' +
      '<section class="data-page" aria-labelledby="data-title" data-data-page>' +
        '<header class="data-hero">' +
          '<span class="data-kicker"><span class="data-dot" aria-hidden="true"></span>Respaldo y datos</span>' +
          '<h1 id="data-title" tabindex="-1">Tus datos, bajo tu control.</h1>' +
          '<p class="data-lead">Tu progreso vive en este navegador, no en una cuenta ni en un servidor. Exportar una copia es la forma más simple de no perderlo al limpiar el navegador, cambiar de equipo o empezar de nuevo.</p>' +
          '<ul class="data-facts">' +
            '<li>' + icon("checkCircle", 15) + '<span>Exportar e importar es local: el archivo no se sube a ningún sitio.</span></li>' +
            '<li>' + icon("checkCircle", 15) + '<span>Puedes fusionar una copia con lo que ya tienes o reemplazarlo todo.</span></li>' +
            '<li>' + icon("checkCircle", 15) + '<span>Borrar progreso pide dos confirmaciones y conserva tema y modo de lectura.</span></li>' +
          '</ul>' +
        '</header>' +
        '<div class="data-layout">' +
          healthCard() +
          exportCard() +
          importCard() +
          deleteCard() +
        '</div>' +
        '<p class="data-foot">' + icon("info", 14) + '<span>Study Dashboard no envía tus datos a ninguna parte. Guarda este archivo donde puedas encontrarlo.</span></p>' +
        '<div class="data-live" data-data-live role="status" aria-live="polite"></div>' +
      '</section>';
  }

  function setHealthCard() {
    var slot = page.root && page.root.querySelector("[data-health-slot]");
    if (!slot) return;
    var temp = document.createElement("div");
    temp.innerHTML = healthCard();
    var next = temp.firstElementChild;
    if (next) slot.parentNode.replaceChild(next, slot);
  }

  function setExportStatus(message) {
    var el = page.root && page.root.querySelector("[data-export-status]");
    if (el) el.textContent = message;
  }
  function setDropStatus(message) {
    var el = page.root && page.root.querySelector("[data-drop-status]");
    if (el) el.textContent = message;
  }
  function errorList(errors, className) {
    if (!errors || !errors.length) return "";
    return '<ul class="' + (className || "data-error-list") + '">' + errors.map(function (error) {
      return '<li>' + icon("alert", 14) + '<span>' + esc(error) + '</span></li>';
    }).join("") + '</ul>';
  }
  function warningList(warnings) {
    if (!warnings || !warnings.length) return "";
    return '<div class="data-warnings"><span class="data-label">' + icon("alert", 13) + ' Avisos</span><ul>' + warnings.map(function (warning) {
      return '<li>' + esc(warning) + '</li>';
    }).join("") + '</ul></div>';
  }

  function previewMarkup(preview, file) {
    if (!preview || !preview.ok) {
      return '<div class="data-preview data-preview--error">' +
        '<h3 tabindex="-1">No se puede importar este archivo</h3>' +
        '<p>Revisa el archivo y vuelve a elegirlo. No se ha cambiado nada.</p>' +
        errorList(preview && preview.errors) +
        '<div class="data-actions"><button class="data-btn" type="button" data-action="cancel-import">Cancelar</button></div>' +
        '</div>';
    }
    var s = preview.summary || {};
    var rows = [
      ["Fichas con progreso", s.sheets],
      ["Completadas", s.completedSheets],
      ["Tarjetas repasadas", s.cardsReviewed],
      ["Sesiones", s.sessions],
      ["Subrayados", s.annotations],
      ["Dudas", s.doubts],
      ["Tarjetas propias", s.userCards],
      ["Datos de recuperación", s.recalls],
      ["Plan de estudio", s.hasPlan ? "Sí" : "No"]
    ];
    return '<div class="data-preview">' +
      '<div class="data-preview-head">' +
        '<div><span class="data-label">Vista previa</span><h3 tabindex="-1">' + esc(file && file.name ? file.name : "Copia de Study Dashboard") + '</h3></div>' +
        '<span class="data-pill is-ok">Archivo válido</span>' +
      '</div>' +
      '<p class="data-preview-meta">' + esc(s.exportedAt ? "Exportado el " + relative(s.exportedAt) : "Sin fecha de exportación") +
        (s.appVersion ? " · app " + esc(s.appVersion) : "") +
        (s.contentVersion ? " · contenido " + esc(s.contentVersion) : "") + '</p>' +
      '<dl class="data-count-grid">' + rows.map(function (row) {
        return '<div><dt>' + esc(row[0]) + '</dt><dd>' + esc(row[1]) + '</dd></div>';
      }).join("") + '</dl>' +
      warningList(preview.warnings) +
      '<fieldset class="data-modes">' +
        '<legend>Cómo aplicar la copia</legend>' +
        '<label class="data-radio"><input type="radio" name="data-import-mode" value="merge" checked><span><b>Fusionar</b><small>Añade lo que falta y conserva tu progreso actual. Los borrados del archivo se respetan.</small></span></label>' +
        '<label class="data-radio"><input type="radio" name="data-import-mode" value="replace"><span><b>Reemplazar</b><small>Sustituye todo el progreso actual por el del archivo. Pide una confirmación adicional.</small></span></label>' +
      '</fieldset>' +
      '<p class="data-hint data-replace-hint" data-replace-hint hidden>Al reemplazar, lo que no esté en el archivo se pierde en este navegador.</p>' +
      '<div class="data-actions">' +
        '<button class="data-btn data-btn--primary" type="button" data-action="import"' + (page.busy ? " disabled" : "") + '>Importar copia</button>' +
        '<button class="data-btn data-btn--ghost" type="button" data-action="cancel-import">Cancelar</button>' +
      '</div>' +
      '</div>';
  }

  function renderPreview(preview, file) {
    page.preview = preview;
    if (page.root) {
      var host = page.root.querySelector("[data-import-preview]");
      if (host) {
        host.innerHTML = previewMarkup(preview, file);
        var heading = host.querySelector("h3");
        if (heading) heading.focus({ preventScroll: true });
      }
      var mode = page.root.querySelector('input[name="data-import-mode"][value="merge"]');
      if (mode) mode.checked = true;
      page.mode = "merge";
    }
  }

  function resetImportUI(message) {
    page.file = null;
    page.preview = null;
    page.payload = null;
    page.busy = false;
    var input = page.root && page.root.querySelector("[data-file-input]");
    if (input) input.value = "";
    setFileName("");
    if (page.root) {
      var host = page.root.querySelector("[data-import-preview]");
      if (host) host.innerHTML = '<p class="data-import-empty">Ningún archivo seleccionado todavía.</p>';
    }
    setDropStatus(message || "");
  }

  /* ------------------------------------------------------------------ */
  /* Exportar                                                            */
  /* ------------------------------------------------------------------ */

  function downloadJSON(json, name) {
    if (typeof Blob === "undefined" || !window.URL || typeof window.URL.createObjectURL !== "function") {
      throw new Error("Este navegador no permite descargar archivos desde la página.");
    }
    var blob = new Blob([json], { type: "application/json;charset=utf-8" });
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    try { a.click(); } finally {
      window.setTimeout(function () {
        if (a.parentNode) a.parentNode.removeChild(a);
        try { window.URL.revokeObjectURL(url); } catch (e) {}
      }, 1200);
    }
  }

  function doExport(ctx) {
    var api = store();
    if (!api || typeof api.exportProgress !== "function") {
      setExportStatus("No se pudo preparar la exportación: el almacén no está disponible.");
      return;
    }
    try {
      var data = api.exportProgress();
      var json = JSON.stringify(data, null, 2);
      downloadJSON(json, fileName());
      if (typeof api.markBackupExported === "function") api.markBackupExported();
      setExportStatus("Copia descargada: " + fileName() + ". Guárdala donde puedas encontrarla.");
      setHealthCard();
      if (page.reminder) removeReminder();
      toast("Copia de respaldo descargada");
      announce(ctx || page.ctx, "Copia de respaldo descargada: " + fileName());
    } catch (error) {
      var message = error && error.message ? error.message : "No se pudo descargar la copia.";
      setExportStatus(message);
      announce(ctx || page.ctx, message);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Importar                                                            */
  /* ------------------------------------------------------------------ */

  function setFileName(name) {
    var el = page.root && page.root.querySelector("[data-file-name]");
    if (el) el.textContent = name || "Ningún archivo";
  }

  function handleFile(file) {
    if (!file) return;
    page.file = file;
    setFileName(file.name);
    setDropStatus("");
    if (file.size > MAX_FILE_BYTES) {
      renderPreview({ ok: false, errors: ["El archivo supera el límite de 12 MB."], warnings: [] }, file);
      return;
    }
    if (!/\.json$/i.test(file.name) && file.type && file.type.indexOf("json") < 0 && file.type.indexOf("text") < 0) {
      setDropStatus("El archivo no parece JSON; se intentará leer de todos modos.");
    }
    var api = store();
    if (!api || typeof api.previewImport !== "function") {
      renderPreview({ ok: false, errors: ["El almacén no está disponible; recarga la página."], warnings: [] }, file);
      return;
    }
    page.busy = true;
    setDropStatus("Validando archivo…");
    var reader = new FileReader();
    reader.onerror = function () {
      page.busy = false;
      setDropStatus("No se pudo leer el archivo.");
      renderPreview({ ok: false, errors: ["No se pudo leer el archivo. Inténtalo de nuevo."], warnings: [] }, file);
    };
    reader.onload = function () {
      page.busy = false;
      var parsed;
      try {
        parsed = JSON.parse(String(reader.result || ""));
      } catch (error) {
        setDropStatus("El archivo no contiene JSON válido.");
        renderPreview({ ok: false, errors: ["El archivo no contiene JSON válido. No se ha ejecutado nada."], warnings: [] }, file);
        return;
      }
      var preview;
      try {
        preview = api.previewImport(parsed);
      } catch (error) {
        preview = { ok: false, errors: ["No se pudo validar el archivo: " + (error && error.message ? error.message : "error desconocido")], warnings: [] };
      }
      page.preview = preview;
      page.payload = parsed;
      setDropStatus("Archivo validado.");
      renderPreview(preview, file);
      announce(page.ctx, preview.ok
        ? "Archivo válido. " + preview.summary.sheets + " fichas con progreso, " + preview.summary.annotations + " subrayados y " + preview.summary.doubts + " dudas."
        : "El archivo no se puede importar. Revisa los errores.");
    };
    reader.readAsText(file, "utf-8");
  }

  function performImport(mode, confirmReplace) {
    var api = store();
    if (!api || typeof api.importProgress !== "function") return;
    if (!page.payload) return;
    page.busy = true;
    var result;
    try {
      result = api.importProgress(page.payload, { mode: mode, confirmReplace: confirmReplace });
    } catch (error) {
      result = { ok: false, errors: ["No se pudo importar: " + (error && error.message ? error.message : "error desconocido")] };
    }
    page.busy = false;
    if (!result || !result.ok) {
      var failedFile = page.file;
      var message = result && result.errors && result.errors.length ? result.errors[0] : "No se pudo importar la copia.";
      resetImportUI("");
      renderPreview({ ok: false, errors: (result && result.errors) || [message], warnings: (result && result.warnings) || [] }, failedFile);
      announce(page.ctx, message);
      return;
    }
    var summary = result.summary || {};
    resetImportUI("");
    toast(mode === "replace" ? "Progreso reemplazado con la copia" : "Copia fusionada con tu progreso");
    announce(page.ctx, "Importación completada. " + summary.sheets + " fichas con progreso, " + summary.annotations + " subrayados y " + summary.doubts + " dudas.");
    refreshPage({ keepScroll: true });
  }

  function askReplace() {
    var s = (page.preview && page.preview.summary) || {};
    openDialog({
      title: "Reemplazar todo el progreso",
      body: '<p>Vas a sustituir el progreso de este navegador por el del archivo. Lo que no esté en la copia se pierde.</p>' +
        '<dl class="data-count-grid data-count-grid--compact">' +
          '<div><dt>Fichas</dt><dd>' + (Number(s.sheets) || 0) + '</dd></div>' +
          '<div><dt>Completadas</dt><dd>' + (Number(s.completedSheets) || 0) + '</dd></div>' +
          '<div><dt>Subrayados</dt><dd>' + (Number(s.annotations) || 0) + '</dd></div>' +
          '<div><dt>Dudas</dt><dd>' + (Number(s.doubts) || 0) + '</dd></div>' +
        '</dl>' +
        '<p class="data-note data-note--warn">' + icon("alert", 15) + '<span>Se guarda una copia de seguridad interna antes de importar, pero la interfaz no la restaura.</span></p>',
      actions: '<button class="data-btn data-btn--ghost" type="button" data-dialog-action="cancel" data-autofocus>Cancelar</button>' +
        '<button class="data-btn data-btn--danger" type="button" data-dialog-action="replace">Reemplazar todo</button>',
      onAction: function (action) {
        if (action === "replace") {
          closeDialog();
          performImport("replace", true);
        }
      }
    });
  }

  function onImportClick() {
    var checked = page.root && page.root.querySelector('input[name="data-import-mode"]:checked');
    var mode = checked ? checked.value : "merge";
    if (!page.preview || !page.preview.ok) return;
    if (mode === "replace") askReplace();
    else performImport("merge", false);
  }

  /* ------------------------------------------------------------------ */
  /* Borrar progreso (doble confirmación)                                */
  /* ------------------------------------------------------------------ */

  function openDeleteStep1() {
    openDialog({
      title: "Borrar todo el progreso",
      body: '<p>Se borrarán las fichas completadas y vistas, las tarjetas repasadas, las sesiones, la actividad, los subrayados, las dudas, las tarjetas propias, el plan y los repasos programados.</p>' +
        '<p><b>Se conservan</b> el tema claro u oscuro, el modo de lectura y la preferencia de movimiento. Antes de borrar se guarda una copia de seguridad interna.</p>' +
        '<p class="data-note data-note--warn">' + icon("alert", 15) + '<span>La copia interna no se restaura desde esta pantalla. Si quieres conservar algo, cancela y expórtalo primero.</span></p>',
      actions: '<button class="data-btn data-btn--ghost" type="button" data-dialog-action="cancel" data-autofocus>Cancelar</button>' +
        '<button class="data-btn data-btn--danger" type="button" data-dialog-action="next">Continuar</button>',
      onAction: function (action) {
        if (action === "next") openDeleteStep2();
      }
    });
  }

  function openDeleteStep2() {
    openDialog({
      title: "Confirmar borrado definitivo",
      body: '<p>Es la segunda confirmación. Si continúas, este navegador quedará sin progreso de estudio.</p>' +
        '<label class="data-check"><input type="checkbox" data-delete-ack><span>Entiendo que se borrará todo el progreso y que no podré deshacerlo desde la interfaz.</span></label>' +
        '<p class="data-note data-note--warn">' + icon("alert", 15) + '<span>Se guardará una copia en <code>study-backup-preclear-v1</code> antes de borrar.</span></p>' +
        '<p class="data-live" data-delete-error role="alert"></p>',
      actions: '<button class="data-btn data-btn--ghost" type="button" data-dialog-action="cancel" data-autofocus>Cancelar</button>' +
        '<button class="data-btn data-btn--danger" type="button" data-dialog-action="clear" disabled>Borrar definitivamente</button>',
      onAction: function (action, dialog) {
        if (action !== "clear") return;
        var api = store();
        var result;
        try { result = api && api.clearAllProgress ? api.clearAllProgress({ confirm: true }) : null; }
        catch (error) { result = { ok: false, errors: [error && error.message ? error.message : "Error desconocido"] }; }
        if (!result || !result.ok) {
          var errorEl = dialog.querySelector("[data-delete-error]");
          if (errorEl) errorEl.textContent = (result && result.errors && result.errors[0]) || "No se pudo borrar el progreso.";
          return;
        }
        closeDialog();
        var message = "Progreso borrado. Se conservaron el tema y el modo de lectura.";
        toast(message);
        announce(page.ctx, message);
        navigateAfterClear();
      }
    });
  }

  function navigateAfterClear() {
    if (page.ctx && typeof page.ctx.navigate === "function") {
      page.ctx.navigate("#/" + ROUTE_PATH, { replace: true, announce: "Progreso borrado. Se conservaron el tema y el modo de lectura." });
      return;
    }
    if (page.ctx && typeof page.ctx.refresh === "function") {
      page.ctx.refresh({ scrollY: 0, focus: true });
      return;
    }
    refreshPage({ keepScroll: false });
    focusMain();
  }

  /* ------------------------------------------------------------------ */
  /* Diálogos accesibles                                                 */
  /* ------------------------------------------------------------------ */

  function focusable(container) {
    if (!container) return [];
    var nodes = container.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
    return Array.prototype.slice.call(nodes).filter(function (el) {
      return el.offsetWidth || el.offsetHeight || el.getClientRects().length;
    });
  }

  function setBackgroundInert(on) {
    ["#main", ".s-appbar", ".dash-footer"].forEach(function (selector) {
      var el = document.querySelector(selector);
      if (!el) return;
      if (on) {
        if (!el.hasAttribute("data-data-inert")) {
          el.setAttribute("data-data-inert", "1");
          el.setAttribute("inert", "");
          try { el.inert = true; } catch (e) {}
        }
      } else if (el.hasAttribute("data-data-inert")) {
        el.removeAttribute("data-data-inert");
        el.removeAttribute("inert");
        try { el.inert = false; } catch (e) {}
      }
    });
  }

  function closeDialog() {
    if (!page.dialog) return;
    if (page.dialogKeydown) document.removeEventListener("keydown", page.dialogKeydown, true);
    page.dialogKeydown = null;
    if (page.dialog.parentNode) page.dialog.parentNode.removeChild(page.dialog);
    page.dialog = null;
    setBackgroundInert(false);
    var trigger = page.dialogTrigger;
    page.dialogTrigger = null;
    if (trigger && trigger.isConnected && typeof trigger.focus === "function") {
      trigger.focus({ preventScroll: true });
    } else {
      focusMain();
    }
  }

  function openDialog(options) {
    var opts = options || {};
    if (page.dialog) {
      var keepTrigger = page.dialogTrigger;
      if (page.dialogKeydown) document.removeEventListener("keydown", page.dialogKeydown, true);
      if (page.dialog.parentNode) page.dialog.parentNode.removeChild(page.dialog);
      page.dialog = null;
      page.dialogTrigger = keepTrigger;
    } else {
      page.dialogTrigger = document.activeElement && document.activeElement !== document.body
        ? document.activeElement : null;
    }
    var titleId = "data-dialog-title";
    var wrap = document.createElement("div");
    wrap.className = "data-modal";
    wrap.innerHTML = '<div class="data-modal-backdrop" data-dialog-action="cancel"></div>' +
      '<div class="data-modal-panel" role="dialog" aria-modal="true" aria-labelledby="' + titleId + '">' +
        '<div class="data-modal-head">' +
          '<h2 id="' + titleId + '">' + esc(opts.title || "Confirmar") + '</h2>' +
          '<button class="data-modal-close" type="button" data-dialog-action="cancel" aria-label="Cerrar">' + icon("close", 18) + '</button>' +
        '</div>' +
        '<div class="data-modal-body">' + (opts.body || "") + '</div>' +
        '<div class="data-modal-actions">' + (opts.actions || "") + '</div>' +
      '</div>';
    document.body.appendChild(wrap);
    page.dialog = wrap;
    setBackgroundInert(true);
    var panel = wrap.querySelector(".data-modal-panel");
    var ack = wrap.querySelector("[data-delete-ack]");
    var clearButton = wrap.querySelector('[data-dialog-action="clear"]');
    if (ack && clearButton) {
      ack.addEventListener("change", function () { clearButton.disabled = !ack.checked; });
    }
    wrap.addEventListener("click", function (event) {
      var target = event.target.closest("[data-dialog-action]");
      if (!target) return;
      var action = target.getAttribute("data-dialog-action");
      if (action === "cancel") { closeDialog(); return; }
      if (opts.onAction) opts.onAction(action, wrap);
    });
    page.dialogKeydown = function (event) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeDialog();
        return;
      }
      if (event.key !== "Tab") return;
      var nodes = focusable(panel);
      if (!nodes.length) return;
      var first = nodes[0];
      var last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", page.dialogKeydown, true);
    var autofocus = wrap.querySelector("[data-autofocus]") || focusable(panel)[0] || panel;
    if (autofocus && autofocus.focus) autofocus.focus({ preventScroll: true });
  }

  /* ------------------------------------------------------------------ */
  /* Recordatorio de respaldo (solo portada y progreso)                  */
  /* ------------------------------------------------------------------ */

  function reminderHTML(status) {
    var last = status.lastExportAt ? "Última copia: " + relative(status.lastExportAt) + "." : "Todavía no has descargado ninguna copia.";
    return '<div class="data-reminder" role="region" aria-label="Recordatorio de respaldo">' +
      '<span class="data-reminder-icon" aria-hidden="true">' + icon("bookmark", 18) + '</span>' +
      '<div class="data-reminder-copy">' +
        '<b>Tu progreso no tiene copia reciente</b>' +
        '<span>' + esc(last) + ' Exportar tarda un momento y no sale de este navegador.</span>' +
      '</div>' +
      '<div class="data-reminder-actions">' +
        '<button class="data-btn data-btn--sm data-btn--primary" type="button" data-reminder-action="export">Exportar</button>' +
        '<button class="data-btn data-btn--sm data-btn--ghost" type="button" data-reminder-action="snooze">Ahora no</button>' +
      '</div>' +
    '</div>';
  }

  function clearReminder() {
    if (!page.reminder) return;
    if (page.reminderHandler) page.reminder.removeEventListener("click", page.reminderHandler);
    page.reminderHandler = null;
    page.reminder.innerHTML = "";
    page.reminder = null;
  }

  function removeReminder(focusNext) {
    var hadFocus = page.reminder && page.reminder.contains(document.activeElement);
    clearReminder();
    if (hadFocus && focusNext !== false) focusMain();
  }

  function mountReminder(ctx) {
    var mount = document.querySelector('[data-module-mount="backup-reminder"]');
    if (!mount) return;
    var status = statusInfo();
    if (!status.hasActivity || !status.due) {
      clearReminder();
      mount.innerHTML = "";
      return;
    }
    if (page.reminder === mount && mount.innerHTML) return;
    clearReminder();
    page.reminder = mount;
    mount.innerHTML = reminderHTML(status);
    page.reminderHandler = function (event) {
      var target = event.target.closest("[data-reminder-action]");
      if (!target) return;
      var action = target.getAttribute("data-reminder-action");
      if (action === "export") {
        doExport(ctx || page.ctx);
        removeReminder();
      } else if (action === "snooze") {
        var api = store();
        if (api && typeof api.snoozeBackupReminder === "function") api.snoozeBackupReminder();
        removeReminder();
        announce(ctx || page.ctx, "Recordatorio pospuesto. Volverá a aparecer en 7 días.");
      }
    };
    mount.addEventListener("click", page.reminderHandler);
  }

  function onRoute(ctx) {
    if (ctx) page.ctx = ctx;
    var route = ctx && ctx.route ? ctx.route : (window.StudyApp && window.StudyApp.getRoute ? window.StudyApp.getRoute() : null);
    var name = route && route.name;
    if (name === "home" || name === "progress") {
      mountReminder(ctx);
    } else {
      removeReminder(false);
      var mount = document.querySelector('[data-module-mount="backup-reminder"]');
      if (mount) mount.innerHTML = "";
    }
  }

  /* ------------------------------------------------------------------ */
  /* Ciclo de vida del módulo                                            */
  /* ------------------------------------------------------------------ */

  function onRootClick(event) {
    var target = event.target.closest("[data-action]");
    if (!target || !page.root || !page.root.contains(target)) return;
    var action = target.getAttribute("data-action");
    if (action === "export") doExport(page.ctx);
    else if (action === "import") onImportClick();
    else if (action === "cancel-import") {
      resetImportUI("Importación cancelada. No se cambió nada.");
      announce(page.ctx, "Importación cancelada. No se cambió nada.");
    } else if (action === "delete-start") openDeleteStep1();
  }

  function onRootChange(event) {
    var target = event.target;
    if (target && target.matches && target.matches("[data-file-input]")) {
      var file = target.files && target.files[0];
      if (file) handleFile(file);
      return;
    }
    if (target && target.matches && target.matches('input[name="data-import-mode"]')) {
      page.mode = target.value;
      var hint = page.root && page.root.querySelector("[data-replace-hint]");
      if (hint) hint.hidden = target.value !== "replace";
    }
  }

  function onRootDrag(event) {
    var drop = event.target.closest && event.target.closest("[data-drop]");
    if (!drop) return;
    event.preventDefault();
    if (event.type === "dragover" || event.type === "dragenter") drop.classList.add("is-drag");
    else drop.classList.remove("is-drag");
  }
  function onRootDrop(event) {
    var drop = event.target.closest && event.target.closest("[data-drop]");
    if (!drop) return;
    event.preventDefault();
    drop.classList.remove("is-drag");
    var files = event.dataTransfer && event.dataTransfer.files;
    if (files && files.length) handleFile(files[0]);
  }

  function bind() {
    var root = page.root;
    if (!root || page.mounted) return;
    page.handlers = {
      click: onRootClick,
      change: onRootChange,
      dragover: onRootDrag,
      dragenter: onRootDrag,
      dragleave: onRootDrag,
      drop: onRootDrop
    };
    root.addEventListener("click", page.handlers.click);
    root.addEventListener("change", page.handlers.change);
    root.addEventListener("dragover", page.handlers.dragover);
    root.addEventListener("dragenter", page.handlers.dragenter);
    root.addEventListener("dragleave", page.handlers.dragleave);
    root.addEventListener("drop", page.handlers.drop);
    page.mounted = true;
  }

  function unbind() {
    var root = page.root;
    if (!root || !page.handlers) return;
    Object.keys(page.handlers).forEach(function (type) {
      root.removeEventListener(type, page.handlers[type]);
    });
    page.handlers = null;
    page.mounted = false;
  }

  function refreshPage(opts) {
    var options = opts || {};
    if (page.ctx && typeof page.ctx.refresh === "function") {
      page.ctx.refresh({ scrollY: options.keepScroll ? window.scrollY : 0, focus: false });
      return;
    }
    if (page.root) {
      page.root.innerHTML = render(page.ctx);
      if (!options.keepScroll) window.scrollTo(0, 0);
    }
  }

  function mount(ctx) {
    page.ctx = ctx || page.ctx;
    page.root = ctx && ctx.root ? ctx.root : document.getElementById("view-root");
    page.store = ctx && ctx.store ? ctx.store : window.StudyStore;
    if (!page.root) return;
    bind();
  }

  function unmount() {
    closeDialog();
    unbind();
    removeReminder(false);
    page.file = null;
    page.preview = null;
    page.payload = null;
    page.root = null;
  }

  function init(ctx) {
    if (ctx) page.ctx = ctx;
    if (ctx && ctx.store) page.store = ctx.store;
  }

  var routes = [{
    path: ROUTE_PATH,
    title: "Respaldo y datos",
    restoreScroll: false,
    render: function (ctx) { return render(ctx); },
    mount: function (ctx) { mount(ctx); },
    unmount: function () { unmount(); }
  }];

  var moduleDefinition = {
    id: MODULE_ID,
    routes: routes,
    init: init,
    onRoute: onRoute
  };

  var api = {
    id: MODULE_ID,
    route: "#/" + ROUTE_PATH,
    moduleDefinition: moduleDefinition,
    register: function () {
      var app = window.StudyApp;
      if (!app || typeof app.registerModule !== "function") return false;
      try {
        app.registerModule(moduleDefinition);
        return true;
      } catch (error) {
        if (window.console && console.warn) console.warn("StudyDataBackup: no se pudo registrar", error);
        return false;
      }
    },
    render: render,
    mount: mount,
    unmount: unmount,
    onRoute: onRoute,
    _private: page
  };

  window.StudyDataBackup = api;
  /* Integración normal: app.js ya expuso StudyApp antes de cargar este archivo.
     Si aún no está, no se lanza nada; el Coordinador lo cargará en la Fase 0. */
  api.register();
})();
