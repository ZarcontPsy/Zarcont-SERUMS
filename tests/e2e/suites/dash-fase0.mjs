/* © 2026 ZARCONT — Suites de Fase 0 del Study Dashboard (Agente 6).
 *
 * DASH-10 … DASH-17 se escriben contra el contrato `docs/CONTRATOS.md`:
 * respaldo con ida y vuelta, scroll de biblioteca, objetivo superado,
 * selector de lectura solo con ampliación, historial sin duplicados,
 * appbar móvil de 5 controles (Más), accesibilidad del lector y contraste
 * al conmutar tema.
 *
 * Un fallo aquí después de DASH-09 puede significar «pendiente de integración»:
 * el mensaje de la aserción indica qué contrato no se cumple todavía.
 */
import { assert, assertEq, assertIncludes, skip } from "../lib/harness.mjs";
import { appURL, waitApp } from "../lib/apps.mjs";
import { sleep } from "../lib/cdp.mjs";

const DASH = "/study-dashboard/index.html";
const PENDING = "PENDIENTE DE INTEGRACIÓN (Coordinador/Agente 2): ";
const VIEWPORT_DESKTOP = { width: 1440, height: 900 };
const VIEWPORT_MOBILE = { width: 390, height: 844 };
const CDP = (page) => page.conn;

async function gotoRoute(page, baseURL, hash, settle = 900) {
  await page.goto(appURL(baseURL, "dashboard") + hash, { settle });
  await waitApp(page, "dashboard");
  await page.waitFor(`location.hash === ${JSON.stringify(hash)}`, { timeout: 8000, message: `hash ${hash}` });
}

async function setViewport(page, viewport, { touch = false } = {}) {
  await page.viewport(viewport.width, viewport.height, { mobile: touch });
  await CDP(page).send("Emulation.setTouchEmulationEnabled", { enabled: touch, maxTouchPoints: touch ? 5 : 1 });
  await sleep(220);
}

async function resetViewport(page) {
  await setViewport(page, VIEWPORT_DESKTOP, { touch: false });
}

/* H4: las secciones llegan por área bajo demanda. Espera a que el lector de
   una ficha concreta esté montado antes de medir su contenido. */
async function waitReader(page, sheetId, timeout = 25000) {
  await page.waitFor(`(() => {
    const reader = document.querySelector('article.reader[data-sheet-id=${JSON.stringify(sheetId)}]');
    return !!reader && !!reader.querySelector(".reader-main") && reader.querySelectorAll(".reader-section").length > 0;
  })()`, { timeout, message: `lector de ${sheetId}` });
  await sleep(180);
}

/* Carga el área real de una ficha antes de inspeccionar `sections` en el
   contenido del core (H4). Es una sola petición de chunk por área. */
async function ensureArea(page, areaId) {
  return page.eval(`(async () => {
    const L = window.StudyContent;
    if (!L) return false;
    if (L.loaded && L.loaded(${JSON.stringify(areaId)})) return true;
    await L.loadArea(${JSON.stringify(areaId)});
    return true;
  })()`);
}

async function applyTheme(page, theme) {
  await page.eval(`window.StudyUI && window.StudyUI.applyTheme(${JSON.stringify(theme)}), true`);
  await sleep(260);
}

/** base.css usa scroll-behavior:smooth: un clic CDP sobre algo fuera de vista
 *  puede caer en coordenadas intermedias. Se acerca el control de forma
 *  instantánea antes de pulsarlo. */
async function revealInstant(page, selector) {
  await page.eval(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return false;
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    el.scrollIntoView({ block: "center", inline: "center" });
    if (previous) root.style.scrollBehavior = previous; else root.style.removeProperty("scroll-behavior");
    return true;
  })()`);
  await sleep(260);
}

/** Nombre accesible aproximado: aria-label / aria-labelledby / texto visible. */
const ACCESSIBLE_NAME_JS = `(el) => {
  if (!el) return "";
  const labelledby = el.getAttribute("aria-labelledby");
  if (labelledby) {
    const text = labelledby.split(/\\s+/).map((id) => (document.getElementById(id) || {}).textContent || "").join(" ");
    if (text.trim()) return text.trim();
  }
  const label = el.getAttribute("aria-label");
  if (label && label.trim()) return label.trim();
  return (el.innerText || el.textContent || "").replace(/\\s+/g, " ").trim();
}`;

export async function runDashboardFase0({ h, page, baseURL }) {
  h.suite("Study Dashboard · Fase 0");
  h.state.app = "Study Dashboard";

  /* ---------------------------------------------------------------- */
  /* DASH-10 · Respaldo: exportar, importar y volver al mismo estado   */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-10",
    "Respaldo desde #/respaldo: exportar, importar el mismo archivo y conservar el progreso",
    async () => {
      await resetViewport(page);
      await gotoRoute(page, baseURL, "#/respaldo", 1100);
      const routeInfo = await page.eval(`(() => {
        const root = document.getElementById("view-root");
        return {
          title: document.title,
          h1: (root.querySelector("h1") || {}).innerText || "",
          text: root.innerText.slice(0, 240),
          exportButton: !!document.querySelector('[data-action="export"]'),
          fileInput: !!document.querySelector("[data-file-input]"),
          page: !!document.querySelector("[data-data-page]")
        };
      })()`);
      if (/no encontramos|página no encontrada/i.test(`${routeInfo.title} ${routeInfo.text}`) || !routeInfo.page) {
        throw new Error(`${PENDING}la ruta #/respaldo no está montada todavía. ${JSON.stringify(routeInfo)}`);
      }
      assert(routeInfo.exportButton, `${PENDING}la vista de respaldo no expone [data-action="export"].`);
      assert(routeInfo.fileInput, `${PENDING}la vista de respaldo no expone el selector de archivo [data-file-input].`);

      // Instrumenta la descarga: el módulo crea un Blob y un <a download>.
      await page.eval(`(() => {
        window.__qaBlobs = [];
        if (!window.__qaCreateObjectURLOriginal) {
          window.__qaCreateObjectURLOriginal = URL.createObjectURL;
          URL.createObjectURL = function (blob) {
            window.__qaBlobs.push(blob);
            return window.__qaCreateObjectURLOriginal.call(URL, blob);
          };
        }
        return true;
      })()`);

      // Asegura actividad para que la exportación no esté deshabilitada.
      const canExport = await page.eval(`(() => {
        const btn = document.querySelector('[data-action="export"]');
        return btn ? !btn.disabled : false;
      })()`);
      if (!canExport) {
        await gotoRoute(page, baseURL, "#/ficha/sheet-aps-01", 900);
        const pressed = await page.eval(`(() => { const b = document.querySelector('[data-action="toggle-complete"]'); return b ? b.getAttribute("aria-pressed") : null; })()`);
        if (pressed !== "true") {
          await page.click('[data-action="toggle-complete"]');
          await sleep(450);
        }
        await gotoRoute(page, baseURL, "#/respaldo", 1100);
      }

      await revealInstant(page, '[data-action="export"]');
      await page.click('[data-action="export"]');
      await page.waitFor(`window.__qaBlobs && window.__qaBlobs.length > 0`, { timeout: 10000, message: "Blob de exportación" });
      const exportedText = await page.eval(`window.__qaBlobs[window.__qaBlobs.length - 1].text()`);
      let exported;
      try {
        exported = JSON.parse(exportedText);
      } catch (err) {
        throw new Error(`El archivo exportado no es JSON válido: ${err.message}`);
      }
      assertEq(exported.format, "serums-study-progress", "formato del archivo exportado");
      assertEq(exported.schema, 2, "esquema del archivo exportado");
      assert(exported.state && typeof exported.state === "object", "el archivo exportado incluye state");
      assertEq(exported.app, "study-dashboard", "app del archivo exportado");

      const before = await page.eval(`(() => {
        const stats = window.StudyStore.getDashboardStats();
        return { completed: stats.completedSheets, reviewed: stats.reviewedCards };
      })()`);

      // Importa ese mismo archivo por el input real, con un File construido en la página.
      const fed = await page.eval(`(async () => {
        const input = document.querySelector("[data-file-input]");
        if (!input) return { ok: false, error: "sin input" };
        const blob = window.__qaBlobs[window.__qaBlobs.length - 1];
        const file = new File([blob], "respaldo-qa.json", { type: "application/json" });
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
        return { ok: true, name: file.name, size: file.size };
      })()`);
      assert(fed.ok, `No se pudo alimentar el archivo de importación: ${JSON.stringify(fed)}`);
      await page.waitFor(`!!document.querySelector('[data-import-preview] [data-action="import"]')`, {
        timeout: 10000,
        message: "vista previa de importación",
      });
      const preview = await page.eval(`(() => {
        const host = document.querySelector("[data-import-preview]");
        const button = host && host.querySelector('[data-action="import"]');
        return {
          buttonText: button ? button.innerText.trim() : "",
          valid: !!host && !!host.querySelector(".data-preview") && !host.querySelector(".data-preview--error"),
          merge: !!host && !!host.querySelector('input[name="data-import-mode"][value="merge"]')
        };
      })()`);
      assertEq(preview.valid, true, "la vista previa debe reconocer el archivo exportado como válido");
      assert(preview.buttonText.length > 0, `${PENDING}la vista previa no ofrece un botón de importación con nombre.`);
      assert(preview.merge, `${PENDING}la vista previa no ofrece el modo fusionar.`);

      await revealInstant(page, '[data-import-preview] [data-action="import"]');
      await page.click('[data-import-preview] [data-action="import"]');
      await page.waitFor(`!!localStorage.getItem("study-backup-preimport-v1")`, { timeout: 12000, message: "copia de seguridad previa a importar" });
      await sleep(500);
      const after = await page.eval(`(() => {
        const stats = window.StudyStore.getDashboardStats();
        let safety = null;
        try { safety = JSON.parse(localStorage.getItem("study-backup-preimport-v1")); } catch (e) {}
        return {
          completed: stats.completedSheets,
          reviewed: stats.reviewedCards,
          safe: !!safety,
          text: document.getElementById("view-root").innerText.slice(0, 200)
        };
      })()`);
      assertEq(after.completed, before.completed, "fichas completadas tras la ida y vuelta");
      assertEq(after.reviewed, before.reviewed, "tarjetas revisadas tras la ida y vuelta");
      assertEq(after.safe, true, "copia de seguridad previa a la importación");
      const shot = await h.shot(page, "dash-10-respaldo-importado");
      return {
        route: routeInfo.h1,
        file: fed,
        format: exported.format,
        schema: exported.schema,
        appVersion: exported.appVersion,
        exportedStateVersion: exported.state.version,
        before,
        after: { completed: after.completed, reviewed: after.reviewed },
        safetyCopy: after.safe,
        shot,
      };
    },
    { severity: "alta", page, timeout: 90000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-11 · La biblioteca conserva el scroll al entrar y salir      */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-11",
    "La biblioteca conserva su posición al entrar en una ficha y volver",
    async () => {
      await resetViewport(page);
      await gotoRoute(page, baseURL, "#/biblioteca", 1000);
      // Scroll inmediato: base.css define scroll-behavior:smooth y falsearía la medida.
      const before = await page.eval(`(() => {
        const el = document.documentElement;
        const previous = el.style.scrollBehavior;
        el.style.scrollBehavior = "auto";
        window.scrollTo(0, 1200);
        if (previous) el.style.scrollBehavior = previous; else el.style.removeProperty("scroll-behavior");
        return window.scrollY;
      })()`);
      await sleep(350);
      const maxBefore = await page.eval("Math.max(0, document.documentElement.scrollHeight - innerHeight)");
      if (maxBefore < 600) skip(`La biblioteca no tiene altura suficiente para medir scroll (máx ${maxBefore}px).`);
      const target = await page.eval(`(() => {
        const sheet = window.STUDY_CONTENT.sheets[60];
        return sheet ? "#/ficha/" + sheet.id : null;
      })()`);
      assert(target, "no se pudo elegir una ficha para entrar desde la biblioteca");
      await page.eval(`location.hash = ${JSON.stringify(target)}, true`);
      await page.waitFor(`location.hash === ${JSON.stringify(target)}`, { timeout: 8000 });
      await page.waitFor(`!!document.querySelector("#view-root h1")`, { timeout: 8000 });
      await sleep(400);
      await page.eval(`history.back(), true`);
      await page.waitFor(`location.hash === '#/biblioteca'`, { timeout: 8000 });
      await sleep(1100);
      const after = await page.eval("window.scrollY");
      assert(
        Math.abs(after - before) <= 60,
        `${PENDING}la biblioteca volvió a ${after}px; se habían leído ${before}px (tolerancia 60px).`,
      );
      return { target, before, after, delta: Math.round(after - before) };
    },
    { severity: "media", page, timeout: 60000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-12 · Objetivo superado no se muestra como «3 de 2»           */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-12",
    "Objetivo superado: el texto no muestra «N de M» y anuncia «Objetivo superado»",
    async () => {
      await resetViewport(page);
      const setup = await page.eval(`(async () => {
        const store = window.StudyStore;
        store.setDailyGoal(1);
        const stats = store.getDashboardStats();
        if (stats.today.sheetsCompleted < 2) {
          return { needs: 2 - stats.today.sheetsCompleted };
        }
        return { needs: 0 };
      })()`);
      for (let i = 0; i < (setup.needs || 0) + 2; i += 1) {
        const candidate = await page.eval(`(() => {
          const store = window.StudyStore;
          const sheet = window.STUDY_CONTENT.sheets.find((s) => {
            const st = store.getSheetState(s.id);
            return !(st && st.completedAt);
          });
          return sheet ? sheet.id : null;
        })()`);
        if (!candidate) break;
        await gotoRoute(page, baseURL, `#/ficha/${candidate}`, 850);
        const pressed = await page.eval(`(() => { const b = document.querySelector('[data-action="toggle-complete"]'); return b ? b.getAttribute("aria-pressed") : null; })()`);
        if (pressed !== "true") {
          await page.click('[data-action="toggle-complete"]');
          await page.waitFor(`(() => { const b = document.querySelector('[data-action="toggle-complete"]'); return b && b.getAttribute("aria-pressed") === "true"; })()`, { timeout: 6000 });
          await sleep(250);
        }
        const done = await page.eval(`window.StudyStore.getDashboardStats().today.sheetsCompleted`);
        if (done >= 2) break;
      }
      const goalState = await page.eval(`(() => {
        const stats = window.StudyStore.getDashboardStats();
        return { goal: stats.goal, done: stats.today.sheetsCompleted };
      })()`);
      assert(goalState.done > goalState.goal, `para probar el exceso hacen falta más fichas que el objetivo (${JSON.stringify(goalState)})`);

      await gotoRoute(page, baseURL, "#/progreso", 1000);
      const progress = await page.eval(`(() => {
        const line = document.querySelector(".goal-line");
        return { line: line ? line.innerText.replace(/\\s+/g, " ").trim() : "", root: document.getElementById("view-root").innerText };
      })()`);
      const bad = /\b(\d+)\s+de\s+(\d+)\b/.exec(progress.line);
      if (bad && Number(bad[1]) > Number(bad[2])) {
        throw new Error(`${PENDING}Progreso muestra «${bad[0]}» con el objetivo superado. Texto: ${progress.line}`);
      }
      // En Progreso el aviso es «objetivo de N superado»; lo importante es que
      // anuncie el exceso y no lo disfrace de «N de M».
      assert(/objetivo(?:\s+de\s+\d+)?\s+superado/i.test(progress.root), `${PENDING}Progreso no anuncia el objetivo superado. Texto: ${progress.line}`);

      await gotoRoute(page, baseURL, "#/", 1000);
      const home = await page.eval(`(() => {
        const title = document.querySelector(".dash-goal h2");
        const card = document.querySelector(".dash-goal");
        return { title: title ? title.innerText.trim() : "", text: card ? card.innerText : "" };
      })()`);
      const homeBad = /\b(\d+)\s+de\s+(\d+)\b/.exec(home.title);
      if (homeBad && Number(homeBad[1]) > Number(homeBad[2])) {
        throw new Error(`${PENDING}El panel muestra «${homeBad[0]}» con el objetivo superado.`);
      }
      assert(/objetivo superado/i.test(home.title), `${PENDING}El panel no titula «Objetivo superado»: «${home.title}».`);
      return { goalState, progressLine: progress.line, homeTitle: home.title };
    },
    { severity: "media", page, timeout: 90000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-13 · Selector Rápido/Completo solo si hay ampliación         */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-13",
    "Las fichas sin secciones de ampliación no muestran el selector Rápido/Completo",
    async () => {
      await resetViewport(page);
      await gotoRoute(page, baseURL, "#/", 900);
      const areaId = "area-psi-cuidado-integral";
      await ensureArea(page, areaId);
      const inventory = await page.eval(`(() => {
        const loaded = window.STUDY_CONTENT.sheets.filter((s) => Array.isArray(s.sections));
        const without = loaded.filter((s) => !s.sections.some((section) => section.depth === "full"));
        const withFull = loaded.filter((s) => s.sections.some((section) => section.depth === "full"));
        return {
          total: window.STUDY_CONTENT.sheets.length,
          loaded: loaded.length,
          areaId: ${JSON.stringify("area-psi-cuidado-integral")},
          without: without.length,
          withFull: withFull.length,
          plain: without[0] ? without[0].id : null,
          full: withFull[0] ? withFull[0].id : null
        };
      })()`);
      assertEq(inventory.total, 210, "el temario conserva 210 fichas");
      assert(inventory.loaded > 0, "el área de prueba carga sus secciones");
      assert(inventory.plain, "debe existir al menos una ficha sin ampliación");
      await gotoRoute(page, baseURL, `#/ficha/${inventory.plain}`, 600);
      await waitReader(page, inventory.plain);
      const plain = await page.eval(`({ selector: document.querySelectorAll('[data-action="reader-mode"]').length, seg: document.querySelectorAll('.reader-tools .s-seg').length })`);
      assertEq(plain.selector, 0, `${PENDING}la ficha ${inventory.plain} no tiene ampliación y muestra el selector Rápido/Completo.`);
      assertEq(plain.seg, 0, `${PENDING}la ficha ${inventory.plain} muestra el grupo de modo de lectura.`);
      if (inventory.full) {
        await gotoRoute(page, baseURL, `#/ficha/${inventory.full}`, 600);
        await waitReader(page, inventory.full);
        const full = await page.eval(`({ selector: document.querySelectorAll('[data-action="reader-mode"]').length })`);
        assert(full.selector >= 2, "una ficha con ampliación debe conservar Rápido/Completo");
      }
      return { ...inventory, plainSelector: plain.selector, fullSelector: inventory.full ? 2 : 0 };
    },
    { severity: "media", page, timeout: 60000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-14 · Historial sin duplicados; la ficha repetida sube        */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-14",
    "El historial no duplica una ficha: al volver a abrirla se mueve arriba",
    async () => {
      await resetViewport(page);
      const pair = await page.eval(`(() => {
        const sheets = window.STUDY_CONTENT.sheets;
        const a = sheets[37];
        const b = sheets[38];
        return a && b ? { a: { id: a.id, title: a.title }, b: { id: b.id, title: b.title } } : null;
      })()`);
      assert(pair, "no se pudieron elegir dos fichas para el historial");
      for (const sheet of [pair.a, pair.b, pair.a]) {
        await gotoRoute(page, baseURL, `#/ficha/${sheet.id}`, 800);
        await sleep(260);
      }
      assert(pair.a.id !== pair.b.id, "las fichas de prueba deben ser distintas");
      await gotoRoute(page, baseURL, "#/progreso", 1000);
      const history = await page.eval(`(() => {
        return Array.from(document.querySelectorAll(".history-row")).map((row) => ({
          text: (row.querySelector("b") || {}).innerText || "",
          href: row.getAttribute("href") || ""
        }));
      })()`);
      const matches = history.filter((row) => row.href === "#/ficha/" + encodeURIComponent(pair.a.id) || row.href === "#/ficha/" + pair.a.id || row.text === pair.a.title);
      assertEq(matches.length, 1, `${PENDING}la ficha «${pair.a.title}» aparece ${matches.length} veces en el historial.`);
      assert(history.length > 0, "historial vacío");
      assert(
        history[0].href === "#/ficha/" + encodeURIComponent(pair.a.id) || history[0].href === "#/ficha/" + pair.a.id || history[0].text === pair.a.title,
        `${PENDING}la ficha reabierta no subió al primer puesto del historial (primera: «${history[0].text}»).`,
      );
      return { sheetA: pair.a, sheetB: pair.b, first: history[0], occurrences: matches.length };
    },
    { severity: "media", page, timeout: 60000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-15 · «Más»: apertura, cierre, foco y appbar de 5 controles   */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-15",
    "Más abre y cierra, gestiona el foco y deja la appbar móvil en 5 controles",
    async () => {
      await setViewport(page, VIEWPORT_MOBILE, { touch: true });
      await gotoRoute(page, baseURL, "#/", 1000);
      const compact = await page.eval(`(() => {
        const visible = (el) => {
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return s.display !== "none" && s.visibility !== "hidden" && r.width > 1 && r.height > 1;
        };
        const controls = Array.from(document.querySelectorAll(".s-appbar a[href], .s-appbar button")).filter(visible);
        return {
          count: controls.length,
          labels: controls.map((el) => (el.getAttribute("aria-label") || el.innerText || "").trim()),
          moreVisible: visible(document.querySelector(".dash-more")),
          triggerVisible: visible(document.querySelector('[data-action="more-open"]')),
          crossVisible: visible(document.querySelector(".dash-cross")),
          chromeVisible: visible(document.querySelector(".s-appbar-actions > [data-chrome-mount]")),
          themeVisible: visible(document.querySelector(".s-appbar-actions > [data-theme-toggle]")),
          overflowX: document.documentElement.scrollWidth - innerWidth
        };
      })()`);
      assert(compact.moreVisible, `${PENDING}.dash-more no es visible a 390 px.`);
      assert(compact.triggerVisible, `${PENDING}el botón Más no es visible a 390 px.`);
      assertEq(compact.crossVisible, false, `${PENDING}.dash-cross sigue visible en la appbar móvil.`);
      assertEq(compact.chromeVisible, false, `${PENDING}[data-chrome-mount] sigue visible en la appbar móvil.`);
      assertEq(compact.themeVisible, false, `${PENDING}el botón de tema directo sigue visible en la appbar móvil.`);
      assertEq(compact.count, 5, `${PENDING}la appbar móvil muestra ${compact.count} controles (${compact.labels.join(" · ")}); el contrato fija 5.`);
      assert(compact.overflowX <= 1, `desborde horizontal de la appbar móvil: ${compact.overflowX}px`);

      // El aside del panel suma dos notas y un enlace: no debe desbordar en móvil
      // y el enlace debe ser un enlace real, sin subrayado permanente.
      const aside = await page.eval(`(() => {
        const box = document.querySelector(".hero-aside");
        const link = document.querySelector(".hero-aside-link");
        if (!box) return null;
        const rect = box.getBoundingClientRect();
        const linkRect = link ? link.getBoundingClientRect() : null;
        return {
          overflowX: box.scrollWidth - box.clientWidth,
          right: Math.round(rect.right),
          innerWidth,
          link: link ? {
            text: (link.innerText || "").replace(/\\s+/g, " ").trim(),
            href: link.getAttribute("href"),
            underline: getComputedStyle(link).textDecorationLine,
            w: Math.round(linkRect.width),
            h: Math.round(linkRect.height)
          } : null
        };
      })()`);
      assert(aside, "el panel debe tener un aside con enlace a respaldo");
      assert(aside.overflowX <= 1, `el aside del panel desborda ${aside.overflowX}px a 390px`);
      assert(aside.right <= aside.innerWidth + 1, `el aside termina en ${aside.right}px con viewport ${aside.innerWidth}px`);
      assert(aside.link, "falta .hero-aside-link en el aside del panel");
      assertEq(aside.link.href, "#/respaldo", "el enlace del aside apunta a #/respaldo");
      assertIncludes(aside.link.text.toLowerCase(), "respaldo", "el enlace del aside se llama Respaldo y datos");
      assertEq(aside.link.underline, "none", `${PENDING}el enlace del aside no debe tener subrayado permanente.`);
      assert(aside.link.h >= 44, `el enlace del aside mide ${aside.link.h}px de alto en puntero grueso (mínimo 44).`);

      const targets = await page.eval(`(() => {
        const trigger = document.querySelector('[data-action="more-open"]');
        const panel = document.getElementById("dash-more-panel");
        return {
          controls: trigger ? trigger.getAttribute("aria-controls") : null,
          panelExists: !!panel,
          panelHidden: panel ? panel.hidden : null,
          expanded: trigger ? trigger.getAttribute("aria-expanded") : null,
          modal: panel ? panel.getAttribute("role") : null,
          labelled: panel ? panel.getAttribute("aria-labelledby") : null
        };
      })()`);
      assertEq(targets.controls, "dash-more-panel", "aria-controls del botón Más");
      assertEq(targets.panelExists, true, "el panel #dash-more-panel existe");
      assertEq(targets.panelHidden, true, "el panel empieza oculto");
      assertEq(targets.expanded, "false", "aria-expanded inicial");
      assertEq(targets.modal, "dialog", "el panel es un diálogo");
      assert(targets.labelled, "el panel está etiquetado");

      await page.click('[data-action="more-open"]');
      await page.waitFor(`!document.getElementById("dash-more-panel").hidden`, { timeout: 5000, message: "panel Más abierto" });
      await sleep(300);
      const open = await page.eval(`(() => {
        const panel = document.getElementById("dash-more-panel");
        const scrim = document.querySelector(".dash-more-scrim");
        const active = document.activeElement;
        const items = Array.from(panel.querySelectorAll(".dash-more-item"));
        return {
          expanded: document.querySelector('[data-action="more-open"]').getAttribute("aria-expanded"),
          htmlClass: document.documentElement.classList.contains("is-more-open"),
          scrim: scrim ? !scrim.hidden : false,
          focusInside: panel.contains(active),
          closeVisible: !!panel.querySelector('[data-action="more-close"]'),
          labels: items.map((el) => (el.innerText || "").replace(/\\s+/g, " ").trim()),
          overflowX: document.documentElement.scrollWidth - innerWidth
        };
      })()`);
      assertEq(open.expanded, "true", "aria-expanded al abrir");
      assertEq(open.htmlClass, true, "html.is-more-open al abrir");
      assertEq(open.scrim, true, "el velo se muestra");
      assertEq(open.focusInside, true, "el foco entra en el panel");
      assertEq(open.closeVisible, true, "el cierre es visible");
      const joined = open.labels.join(" | ").toLowerCase();
      for (const expected of ["flashcards", "respaldo", "inicio", "hub", "pantalla completa", "tema"]) {
        assertIncludes(joined, expected, `el panel contiene «${expected}»`);
      }
      assert(open.overflowX <= 1, `el panel abierto desborda horizontalmente: ${open.overflowX}px`);

      await page.pressKey("Escape", { code: "Escape", keyCode: 27 });
      await page.waitFor(`document.getElementById("dash-more-panel").hidden`, { timeout: 5000, message: "panel cerrado con Esc" });
      const closed = await page.eval(`(() => ({
        expanded: document.querySelector('[data-action="more-open"]').getAttribute("aria-expanded"),
        focusOnTrigger: document.activeElement === document.querySelector('[data-action="more-open"]'),
        htmlClass: document.documentElement.classList.contains("is-more-open")
      }))()`);
      assertEq(closed.expanded, "false", "aria-expanded al cerrar");
      assertEq(closed.focusOnTrigger, true, "el foco vuelve al disparador");
      assertEq(closed.htmlClass, false, "se retira html.is-more-open");

      // Cierre por velo: se pulsa en la esquina superior, fuera de la hoja inferior.
      await page.click('[data-action="more-open"]');
      await page.waitFor(`!document.getElementById("dash-more-panel").hidden`, { timeout: 5000 });
      await sleep(260);
      await CDP(page).send("Input.dispatchMouseEvent", { type: "mousePressed", x: 18, y: 18, button: "left", buttons: 1, clickCount: 1 });
      await CDP(page).send("Input.dispatchMouseEvent", { type: "mouseReleased", x: 18, y: 18, button: "left", buttons: 0, clickCount: 1 });
      await page.waitFor(`document.getElementById("dash-more-panel").hidden`, { timeout: 5000, message: "cierre por velo" });

      await resetViewport(page);
      return { compact, aside, open: { labels: open.labels }, targets };
    },
    { severity: "alta", page, timeout: 90000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-16 · Marca, tabla desplazable y botones del lector           */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-16",
    "Marca con nombre accesible, tabla enfocable y botones del lector con nombre en móvil",
    async () => {
      await resetViewport(page);
      await gotoRoute(page, baseURL, "#/", 900);
      await page.eval(`window.__qaAccessibleName = ${ACCESSIBLE_NAME_JS}; true`);
      const brand = await page.eval(`(() => {
        const el = document.querySelector(".s-brand");
        const visibleText = (el.innerText || "").replace(/\\s+/g, " ").trim();
        const aria = el.getAttribute("aria-label") || "";
        return { visibleText, aria, name: window.__qaAccessibleName(el) };
      })()`);
      assert(brand.visibleText.length > 3, "la marca debe tener texto visible en escritorio");
      // H9 / WCAG 2.5.3: el nombre accesible contiene el texto visible.
      const normalize = (value) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
      const nameN = normalize(brand.name);
      const visibleN = normalize(brand.visibleText);
      assert(visibleN.includes("serums study") && visibleN.includes("dashboard de estudio"), `texto visible de marca inesperado: «${brand.visibleText}»`);
      for (const part of ["serums study", "dashboard de estudio", "inicio"]) {
        assert(nameN.includes(part), `${PENDING}el nombre accesible de la marca no incluye «${part}». aria-label=«${brand.aria}».`);
      }

      // Tabla desplazable: elige una ficha que realmente tenga tabla (H4: carga el área).
      await ensureArea(page, "area-psi-cuidado-integral");
      const withTable = await page.eval(`(() => {
        const sheet = window.STUDY_CONTENT.sheets.find((s) => Array.isArray(s.sections) && s.sections.some((section) => section.table));
        return sheet ? sheet.id : null;
      })()`);
      assert(withTable, "no se encontró una ficha con tabla");
      await setViewport(page, VIEWPORT_MOBILE, { touch: true });
      await gotoRoute(page, baseURL, `#/ficha/${withTable}`, 600);
      await waitReader(page, withTable);
      await page.waitFor(`!!document.querySelector(".reader-table-wrap")`, { timeout: 10000, message: "tabla del lector" });
      await page.eval(`window.__qaAccessibleName = ${ACCESSIBLE_NAME_JS}; true`);
      const table = await page.eval(`(() => {
        const wrap = document.querySelector(".reader-table-wrap");
        if (!wrap) return { missing: true };
        wrap.focus();
        return {
          tabindex: wrap.getAttribute("tabindex"),
          role: wrap.getAttribute("role"),
          label: wrap.getAttribute("aria-label") || "",
          focused: document.activeElement === wrap,
          scrollable: wrap.scrollWidth > wrap.clientWidth
        };
      })()`);
      assert(!table.missing, "la ficha con tabla no renderiza .reader-table-wrap");
      assertEq(table.tabindex, "0", `${PENDING}la tabla desplazable no tiene tabindex="0".`);
      assertEq(table.role, "region", `${PENDING}la tabla desplazable no tiene role="region".`);
      assert(table.label.length > 5, `${PENDING}la región de la tabla no tiene aria-label descriptivo.`);
      assertEq(table.focused, true, "la región de la tabla recibe el foco");
      assertEq(table.scrollable, true, "la tabla debe ser desplazable a 390 px para comprobar la región");

      // Botones del lector con nombre accesible y objetivo de 44 px en puntero grueso.
      const buttons = await page.eval(`(() => {
        return ["toggle-favorite", "toggle-complete"].map((action) => {
          const el = document.querySelector('[data-action="' + action + '"]');
          if (!el) return { action, missing: true };
          const rect = el.getBoundingClientRect();
          const svg = el.querySelector("svg");
          const svgRect = svg ? svg.getBoundingClientRect() : null;
          return {
            action,
            name: window.__qaAccessibleName(el),
            ariaLabel: el.getAttribute("aria-label") || "",
            pressed: el.getAttribute("aria-pressed"),
            srText: (el.querySelector(".reader-tool-text") || {}).textContent || "",
            w: Math.round(rect.width),
            h: Math.round(rect.height),
            iconCentered: svgRect ? Math.abs((svgRect.left + svgRect.width / 2) - (rect.left + rect.width / 2)) <= 2 : null,
            coarse: matchMedia("(pointer: coarse)").matches
          };
        });
      })()`);
      for (const button of buttons) {
        assert(!button.missing, `falta el botón ${button.action}`);
        assert(button.name.length > 0, `${PENDING}el botón ${button.action} no tiene nombre accesible en móvil.`);
        assertEq(button.pressed === "true" || button.pressed === "false", true, `${button.action} expone aria-pressed`);
        assertEq(button.coarse, true, "el viewport móvil debe emular puntero grueso");
        assert(button.w >= 44 && button.h >= 44, `${PENDING}el botón ${button.action} mide ${button.w}×${button.h} en puntero grueso (mínimo 44).`);
        assertEq(button.iconCentered, true, `el icono de ${button.action} debe quedar centrado`);
      }
      await resetViewport(page);
      return { brand, table, buttons };
    },
    { severity: "alta", page, timeout: 90000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-17 · Cambiar de tema no rompe el contraste                   */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-17",
    "La conmutación de tema conserva los ratios de contraste (texto 4,5 · iconos 3)",
    async () => {
      await resetViewport(page);
      await gotoRoute(page, baseURL, "#/ficha/sheet-aps-01", 950);
      const probe = `(async (theme) => {
        const host = document.createElement("div");
        host.id = "qa-contrast-probe";
        host.setAttribute("aria-hidden", "true");
        host.style.cssText = "position:fixed;left:-9999px;top:0;width:420px;padding:8px;background:var(--bg);";
        const marks = ["important", "understand", "review", "doubt"];
        host.innerHTML = [
          '<p id="qa-soft" class="reader-summary">texto de prueba</p>',
          '<span id="qa-chip-green" class="s-chip s-chip--green">Completada</span>',
          '<span id="qa-chip-danger" class="s-chip s-chip--danger">Aviso</span>',
          '<a id="qa-btn" class="s-btn" href="#/">Acción</a>',
          '<a id="qa-btn-soft" class="s-btn s-btn--soft" href="#/">Suave</a>',
          '<span id="qa-badge" class="section-depth is-full">Ampliación</span>',
          '<div id="qa-alert" class="s-alert s-alert--danger"><span id="qa-alert-icon" style="color:var(--danger)">!</span><span>aviso</span></div>',
          marks.map((name) => '<span id="qa-mark-' + name + '" style="display:inline-block;padding:4px 8px;background:var(--mark-' + name + '-bg);color:var(--mark-' + name + '-ink);border:1px solid var(--mark-' + name + '-line)">' + name + '</span>').join(""),
          marks.map((name) => '<span id="qa-dot-' + name + '" style="display:inline-block;color:var(--mark-' + name + ')">●</span>').join("")
        ].join("");
        document.body.appendChild(host);
        const parse = (value) => {
          const m = String(value).match(/rgba?\\(([^)]+)\\)/);
          if (!m) return null;
          const parts = m[1].split(/[,\\s\\/]+/).filter(Boolean).map(Number);
          return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] == null ? 1 : parts[3] };
        };
        const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: fg.a + bg.a * (1 - fg.a) });
        const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
        const ratio = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
        const measure = (id, property) => {
          const el = document.getElementById(id);
          if (!el) return null;
          const fg = parse(getComputedStyle(el)[property || "color"]);
          let bg = { r: 0, g: 0, b: 0, a: 0 };
          const chain = [];
          let node = el;
          while (node) { chain.unshift(node); node = node.parentElement; }
          for (const layer of chain) {
            const c = parse(getComputedStyle(layer).backgroundColor);
            if (c && c.a > 0) bg = over(c, bg);
          }
          if (bg.a < 0.999) bg = over(bg, { r: 255, g: 255, b: 255, a: 1 });
          const fgFinal = fg.a < 1 ? over(fg, bg) : fg;
          return { ratio: Math.round(ratio(fgFinal, bg) * 100) / 100, fg: getComputedStyle(el).color, bg: getComputedStyle(el).backgroundColor };
        };
        const markRows = {};
        for (const name of marks) {
          markRows[name] = measure("qa-mark-" + name);
          markRows[name + "-dot"] = measure("qa-dot-" + name);
        }
        const out = {
          theme: document.documentElement.dataset.theme,
          colorScheme: getComputedStyle(document.documentElement).colorScheme,
          text: measure("qa-soft"),
          chipGreen: measure("qa-chip-green"),
          chipDanger: measure("qa-chip-danger"),
          button: measure("qa-btn"),
          buttonSoft: measure("qa-btn-soft"),
          badge: measure("qa-badge"),
          alertIcon: measure("qa-alert-icon"),
          marks: markRows
        };
        host.remove();
        return out;
      })`;

      const dark = await page.eval(`(${probe})("dark")`);
      await applyTheme(page, "light");
      const light = await page.eval(`(${probe})("light")`);
      await applyTheme(page, "dark");

      const failures = [];
      const check = (theme, key, ratio, min) => {
        if (ratio == null) failures.push(`${theme}/${key}: sin medición`);
        else if (ratio < min) failures.push(`${theme}/${key}: ${ratio}:1 < ${min}:1`);
      };
      for (const [theme, data] of [["oscuro", dark], ["claro", light]]) {
        assertEq(data.theme, theme === "oscuro" ? "dark" : "light", `tema aplicado (${theme})`);
        check(theme, "texto del lector", data.text.ratio, 4.5);
        check(theme, "chip verde", data.chipGreen.ratio, 4.5);
        check(theme, "chip de peligro", data.chipDanger.ratio, 4.5);
        check(theme, "botón principal", data.button.ratio, 4.5);
        check(theme, "botón suave", data.buttonSoft.ratio, 4.5);
        check(theme, "badge Ampliación", data.badge.ratio, 4.5);
        check(theme, "icono de aviso", data.alertIcon.ratio, 3);
        for (const [mark, row] of Object.entries(data.marks)) {
          check(theme, `subrayado ${mark}`, row.ratio, mark.endsWith("-dot") ? 3 : 4.5);
        }
      }
      assertEq(failures.length, 0, `${PENDING}${failures.join(" · ")}`);
      return { dark, light };
    },
    { severity: "alta", page, timeout: 60000 },
  );
}
