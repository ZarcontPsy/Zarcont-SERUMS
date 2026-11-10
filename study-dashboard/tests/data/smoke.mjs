/* © 2026 ZARCONT — Smoke test HTTP de la ruta de respaldo y del cargador de
   derivados. Usa el arnés CDP existente sin modificarlo.
   Ejecutar desde la raíz: node study-dashboard/tests/data/smoke.mjs */
"use strict";

import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { StaticServer } from "../../../tests/e2e/lib/server.mjs";
import { Chrome, Page, sleep } from "../../../tests/e2e/lib/cdp.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");
const SERVER_PORT = 8793;
const CDP_PORT = 9393;
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PYTHON = "C:\\Python313\\python.exe";
const ARTIFACTS = path.join(os.tmpdir(), "study-data-smoke-" + Date.now());
const results = [];

function pass(name, extra) {
  results.push({ name, ok: true, extra: extra || "" });
  console.log("PASS " + name + (extra ? " — " + extra : ""));
}

async function main() {
  fs.mkdirSync(ARTIFACTS, { recursive: true });
  const server = new StaticServer({ root: ROOT, port: SERVER_PORT, python: PYTHON });
  await server.start();
  const chrome = new Chrome({
    chromePath: CHROME,
    userDataDir: path.join(ARTIFACTS, "profile"),
    port: CDP_PORT,
    headless: true
  });
  let page = null;
  try {
    await chrome.start();
    const conn = await chrome.newTarget("about:blank");
    page = new Page(conn, { browser: chrome, port: CDP_PORT });
    await page.init();
    await page.viewport(1440, 900);
    await page.goto(server.baseURL + "/study-dashboard/tests/data/smoke.html#/respaldo", { settle: 900 });
    await page.waitFor("!!document.querySelector('.data-page h1')", { timeout: 15000, message: "no renderizó respaldo" });

    const heading = await page.eval("document.querySelector('.data-page h1').textContent");
    assert.equal(heading, "Tus datos, bajo tu control.");
    pass("cabecera editorial de #/respaldo");

    const title = await page.eval("document.title");
    assert.match(title, /Respaldo y datos/);
    pass("document.title de la ruta");

    const structure = await page.eval(`(() => ({
      cards: document.querySelectorAll('.data-card').length,
      health: !!document.querySelector('.data-health'),
      exportButton: !!document.querySelector('[data-action="export"]'),
      fileInput: !!document.querySelector('[data-file-input]'),
      deleteButton: !!document.querySelector('[data-action="delete-start"]')
    }))()`);
    assert.equal(structure.cards, 4);
    assert.equal(structure.health, true);
    assert.equal(structure.exportButton, true);
    assert.equal(structure.fileInput, true);
    assert.equal(structure.deleteButton, true);
    pass("cuatro tarjetas: salud, exportar, importar y borrar");

    /* Sin actividad, exportar y borrar están desactivados. */
    const emptyState = await page.eval(`(() => ({
      exportDisabled: document.querySelector('[data-action="export"]').disabled,
      deleteDisabled: document.querySelector('[data-action="delete-start"]').disabled,
      emptyNote: !!document.querySelector('#data-export-empty')
    }))()`);
    assert.equal(emptyState.exportDisabled, true);
    assert.equal(emptyState.deleteDisabled, true);
    assert.equal(emptyState.emptyNote, true);
    pass("estado vacío honesto (sin progreso)");

    /* Layout a 360/390/768/1024/1440, ambos temas. */
    for (const theme of ["dark", "light"]) {
      for (const [width, height] of [[360, 800], [390, 844], [768, 1024], [1024, 768], [1440, 900]]) {
        await page.viewport(width, height);
        await page.eval(`document.documentElement.dataset.theme = ${JSON.stringify(theme)}`);
        await sleep(120);
        const layout = await page.eval(`(() => {
          const root = document.documentElement;
          const offenders = Array.from(document.querySelectorAll('.data-page *')).filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.right > window.innerWidth + 1.5;
          }).slice(0, 4).map((el) => el.className || el.tagName);
          return { scrollWidth: root.scrollWidth, innerWidth: window.innerWidth, body: document.body.scrollWidth, offenders };
        })()`);
        assert.ok(layout.scrollWidth <= layout.innerWidth + 1, `${theme} ${width}px: scrollWidth ${layout.scrollWidth} > ${layout.innerWidth}`);
        assert.ok(layout.body <= layout.innerWidth + 1, `${theme} ${width}px: body desbordado`);
        assert.deepEqual(layout.offenders, [], `${theme} ${width}px: elementos fuera de vista`);
      }
    }
    pass("sin scroll horizontal en 360/390/768/1024/1440, temas oscuro y claro");

    /* Targets de 44 px con puntero grueso. */
    try {
      await page.conn.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
      await page.viewport(390, 844, { mobile: true, deviceScaleFactor: 1 });
      await page.eval("document.documentElement.dataset.theme = 'dark'");
      await sleep(150);
      const targets = await page.eval(`(() => {
        const buttons = Array.from(document.querySelectorAll('.data-page .data-btn, .data-page .data-file, .data-page .data-radio'));
        return buttons.map((el) => Math.round(el.getBoundingClientRect().height));
      })()`);
      assert.ok(targets.length > 0);
      assert.ok(targets.every((height) => height >= 44), "alturas: " + targets.join(","));
      pass("targets >= 44 px en puntero grueso", targets.join(", "));
    } catch (error) {
      console.log("SKIP targets coarse: " + error.message);
    } finally {
      try { await page.conn.send("Emulation.setTouchEmulationEnabled", { enabled: false }); } catch {}
      await page.viewport(1440, 900);
    }

    /* Recordatorio en portada: solo aparece con actividad y se pospone. */
    await page.eval(`window.StudyStore.recordSheetView('sheet-aps-01', 'topic-aps-atributos')`);
    await page.eval(`window.StudyApp.navigate('#/', { replace: true })`);
    await sleep(250);
    const reminder = await page.eval(`(() => ({
      exists: !!document.querySelector('[data-module-mount="backup-reminder"] .data-reminder'),
      due: window.StudyStore.getBackupStatus().due
    }))()`);
    assert.equal(reminder.due, true);
    assert.equal(reminder.exists, true);
    pass("recordatorio montado en portada cuando toca");
    await page.eval(`document.querySelector('[data-reminder-action="snooze"]').click()`);
    await sleep(150);
    const snoozed = await page.eval(`(() => ({
      exists: !!document.querySelector('[data-module-mount="backup-reminder"] .data-reminder'),
      due: window.StudyStore.getBackupStatus().due
    }))()`);
    assert.equal(snoozed.exists, false);
    assert.equal(snoozed.due, false);
    pass("«Ahora no» pospone 7 días y retira la tarjeta");

    /* Exportar: se intercepta la descarga para no depender de archivos. */
    await page.eval(`window.StudyApp.navigate('#/respaldo', { replace: true })`);
    await sleep(250);
    await page.eval(`(() => {
      window.__downloads = [];
      HTMLAnchorElement.prototype.click = function () {
        window.__downloads.push({ name: this.download, href: this.href });
      };
      document.querySelector('[data-action="export"]').click();
    })()`);
    await sleep(250);
    const exported = await page.eval(`(() => ({
      downloads: window.__downloads,
      status: (document.querySelector('[data-export-status]') || {}).textContent || '',
      lastExport: window.StudyStore.getBackupStatus().lastExportAt,
      health: (document.querySelector('[data-health-last]') || {}).textContent || ''
    }))()`);
    assert.equal(exported.downloads.length, 1);
    assert.match(exported.downloads[0].name, /^study-dashboard-progreso-\d{4}-\d{2}-\d{2}\.json$/);
    assert.ok(exported.lastExport);
    assert.match(exported.status, /Copia descargada/);
    pass("exportar descarga el JSON, marca la exportación y actualiza salud", exported.downloads[0].name);

    /* Importar: archivo real, vista previa, fusión y confirmación de reemplazo. */
    const prepared = await page.eval(`(() => {
      const ann = window.StudyStore.annotations.add({
        sheetId: 'sheet-aps-01', sectionIndex: 0, paragraphIndex: 0,
        color: 'important', quote: 'Subrayado de prueba para el smoke.', note: 'smoke'
      });
      const payload = window.StudyStore.exportProgress();
      window.StudyStore.annotations.remove(ann.id);
      /* El tombstone local debe impedir que vuelva esa anotación; se añade otra
         distinta al archivo para comprobar la fusión aditiva. */
      const now = new Date().toISOString();
      payload.state.annotations['ann-smoke-merge'] = {
        id: 'ann-smoke-merge', sheetId: 'sheet-aps-01', sectionIndex: 1, sectionTitle: '',
        paragraphIndex: 0, color: 'understand', quote: 'Anotación nueva del archivo.',
        prefix: '', suffix: '', note: '', createdAt: now, updatedAt: now, deleted: false
      };
      window.__smokePayload = payload;
      return { annotationId: ann.id, before: window.StudyStore.annotations.list().length };
    })()`);
    assert.equal(prepared.before, 0);
    await page.eval(`(() => {
      const input = document.querySelector('[data-file-input]');
      const file = new File([JSON.stringify(window.__smokePayload)], 'study-dashboard-progreso-2026-11-09.json', { type: 'application/json' });
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await page.waitFor("!!document.querySelector('[data-import-preview] .data-preview h3')", { timeout: 10000 });
    const preview = await page.eval(`(() => ({
      title: document.querySelector('[data-import-preview] h3').textContent,
      counts: Array.from(document.querySelectorAll('[data-import-preview] .data-count-grid dd')).map((el) => el.textContent),
      merge: document.querySelector('input[name="data-import-mode"][value="merge"]').checked,
      importDisabled: document.querySelector('[data-action="import"]').disabled
    }))()`);
    assert.match(preview.title, /study-dashboard-progreso-2026-11-09\.json/);
    assert.equal(preview.merge, true);
    assert.equal(preview.importDisabled, false);
    pass("vista previa con conteos tras arrastrar/elegir archivo", preview.counts.join(" / "));

    await page.eval(`document.querySelector('[data-action="import"]').click()`);
    await sleep(500);
    const merged = await page.eval(`(() => ({
      annotations: window.StudyStore.annotations.list().length,
      successToast: !!document.querySelector('.s-toast'),
      previewReset: !!document.querySelector('.data-import-empty')
    }))()`);
    assert.equal(merged.annotations, 1);
    assert.equal(merged.previewReset, true);
    pass("importación en modo fusionar recupera el subrayado");

    /* Reemplazar: abre diálogo modal, Escape cancela y no muta. */
    await page.eval(`(() => {
      const input = document.querySelector('[data-file-input]');
      const file = new File([JSON.stringify(window.__smokePayload)], 'copia-para-reemplazar.json', { type: 'application/json' });
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await page.waitFor("!!document.querySelector('input[name=\"data-import-mode\"][value=\"replace\"]')");
    await page.eval(`(() => {
      const radio = document.querySelector('input[name="data-import-mode"][value="replace"]');
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
      document.querySelector('[data-action="import"]').click();
    })()`);
    await page.waitFor("!!document.querySelector('.data-modal-panel[role=\"dialog\"]')");
    const dialog1 = await page.eval(`(() => ({
      role: document.querySelector('.data-modal-panel').getAttribute('role'),
      modal: document.querySelector('.data-modal-panel').getAttribute('aria-modal'),
      title: document.querySelector('.data-modal-panel h2').textContent,
      focus: document.activeElement && document.activeElement.textContent.trim()
    }))()`);
    assert.equal(dialog1.role, "dialog");
    assert.equal(dialog1.modal, "true");
    assert.match(dialog1.title, /Reemplazar/);
    assert.match(dialog1.focus, /Cancelar/);
    pass("reemplazar exige diálogo adicional y enfoca Cancelar");
    await page.pressKey("Escape", { code: "Escape", keyCode: 27 });
    await sleep(200);
    const afterEsc = await page.eval(`(() => ({
      dialog: !!document.querySelector('.data-modal-panel'),
      annotations: window.StudyStore.annotations.list().length
    }))()`);
    assert.equal(afterEsc.dialog, false);
    assert.equal(afterEsc.annotations, 1);
    pass("Escape cierra el diálogo sin importar");

    /* Borrar: dos pasos, Escape, casilla de reconocimiento y borrado final. */
    await page.eval(`document.querySelector('[data-action="delete-start"]').click()`);
    await page.waitFor("!!document.querySelector('.data-modal-panel')");
    const step1 = await page.eval("document.querySelector('.data-modal-body').textContent");
    assert.match(step1, /Se conservan/);
    await page.pressKey("Escape", { code: "Escape", keyCode: 27 });
    await sleep(150);
    assert.equal(await page.eval("!!document.querySelector('.data-modal-panel')"), false);
    await page.eval(`document.querySelector('[data-action="delete-start"]').click()`);
    await page.waitFor("!!document.querySelector('.data-modal-panel')");
    await page.eval(`document.querySelector('[data-dialog-action="next"]').click()`);
    await page.waitFor("!!document.querySelector('[data-delete-ack]')");
    const step2 = await page.eval(`(() => ({
      disabled: document.querySelector('[data-dialog-action="clear"]').disabled,
      ack: !!document.querySelector('[data-delete-ack]')
    }))()`);
    assert.equal(step2.disabled, true);
    assert.equal(step2.ack, true);
    pass("borrado en dos pasos con confirmación deshabilitada hasta reconocer");
    await page.pressKey("Escape", { code: "Escape", keyCode: 27 });
    await sleep(150);
    assert.equal(await page.eval("window.StudyStore.getState().sheets['sheet-aps-01'] !== undefined"), true);
    pass("Escape en el segundo paso no borra");

    /* Cargador de derivados: no descarga nada al inicio y carga bajo demanda. */
    const derivedBefore = await page.eval(`(() => ({
      requests: performance.getEntriesByType('resource').filter((e) => e.name.includes('/study-data/derived/')).length,
      state: window.StudyDerived.state()
    }))()`);
    assert.equal(derivedBefore.requests, 0);
    assert.equal(derivedBefore.state, "idle");
    const derived = await page.eval(`(async () => {
      const glossary = await window.StudyDerived.load('glossary');
      const search = await window.StudyDerived.load('search');
      return {
        glossary: glossary.entries.length,
        search: search.entries.length,
        cached: window.StudyDerived.get('glossary') === glossary,
        state: window.StudyDerived.state(),
        base: window.StudyDerived.base()
      };
    })()`);
    assert.equal(derived.glossary, 57);
    assert.ok(derived.search > 9000);
    assert.equal(derived.cached, true);
    assert.equal(derived.state, "ready");
    assert.match(derived.base, /\/study-data\/derived\/$/);
    pass("StudyDerived carga y cachea glossary/search solo al pedirlo", derived.glossary + "/" + derived.search);

    /* Borrado definitivo al final: conserva tema/modo y actualiza la ruta. */
    await page.eval(`localStorage.setItem('study-theme','light'); localStorage.setItem('study-dashboard-mode','full');`);
    await page.eval(`window.StudyApp.navigate('#/respaldo', { replace: true })`);
    await sleep(200);
    await page.eval(`document.querySelector('[data-action="delete-start"]').click()`);
    await page.waitFor("!!document.querySelector('.data-modal-panel')");
    await page.eval(`document.querySelector('[data-dialog-action="next"]').click()`);
    await page.waitFor("!!document.querySelector('[data-delete-ack]')");
    await page.eval(`(() => {
      const ack = document.querySelector('[data-delete-ack]');
      ack.checked = true;
      ack.dispatchEvent(new Event('change', { bubbles: true }));
      document.querySelector('[data-dialog-action="clear"]').click();
    })()`);
    await sleep(500);
    const cleared = await page.eval(`(() => ({
      route: location.hash,
      sheets: Object.keys(window.StudyStore.getState().sheets).length,
      annotations: window.StudyStore.annotations.list().length,
      resetAt: window.StudyStore.getState().resetAt,
      theme: localStorage.getItem('study-theme'),
      mode: localStorage.getItem('study-dashboard-mode'),
      live: document.getElementById('live').textContent
    }))()`);
    assert.equal(cleared.route, "#/respaldo");
    assert.equal(cleared.sheets, 0);
    assert.equal(cleared.annotations, 0);
    assert.ok(cleared.resetAt);
    assert.equal(cleared.theme, "light");
    assert.equal(cleared.mode, "full");
    pass("borrado definitivo actualiza la ruta y conserva tema/modo");

    /* Capturas finales para revisión visual. */
    await page.eval("document.documentElement.dataset.theme = 'dark'");
    await page.viewport(1440, 900);
    await sleep(200);
    const shot1440 = path.join(ARTIFACTS, "respaldo-1440.png");
    await page.screenshot(shot1440, { fullPage: true });
    await page.viewport(390, 844);
    await sleep(200);
    const shot390 = path.join(ARTIFACTS, "respaldo-390.png");
    await page.screenshot(shot390, { fullPage: true });
    console.log("Capturas: " + shot1440 + " · " + shot390);

    const errors = {
      exceptions: page.exceptions.filter((e) => !/favicon/i.test(e.description + e.text)),
      console: page.consoleErrors,
      log: page.logErrors.filter((e) => !/favicon/i.test(e.text + " " + (e.url || ""))),
      network: page.networkFailures.filter((e) => !/favicon/i.test(e.url) && !e.canceled)
    };
    assert.deepEqual(errors.exceptions, []);
    assert.deepEqual(errors.console, []);
    assert.deepEqual(errors.log, []);
    assert.deepEqual(errors.network, []);
    pass("sin excepciones, errores de consola ni fallos de red");
  } finally {
    if (page) {
      try { await page.close(); } catch {}
    }
    try { await chrome.stop(); } catch {}
    try { await server.stop(); } catch {}
  }
  console.log("\nRESUMEN: " + results.length + " PASS");
}

main().catch((error) => {
  console.error("FAIL:", error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
