/* © 2026 ZARCONT — Suites de Fase 2 del Study Dashboard (Agente 6).
 *
 * DASH-31 … DASH-38 se escriben contra `docs/CONTRATOS-FASE2.md` (§4 selectores,
 * §7 criterios): carga perezosa de `plan-model.js`, Ruta de hoy completa,
 * editor del plan con prioridad de área, mapa de dominio, repaso espaciado,
 * resumen semanal y descubrimiento desde Más/paleta en móvil.
 *
 * Los selectores estables son los del contrato:
 *   section[data-plan-view="ruta|plan|dominio|repaso"], #plan-*-title,
 *   [data-plan-loading], [data-plan-error], [data-plan-route-status],
 *   .plan-route-item[data-type], [data-plan-link], [data-plan-weekly],
 *   form[data-plan-form], [data-plan-field], [data-plan-area-priority],
 *   [data-plan-action], [data-plan-preview], [data-plan-form-status],
 *   [data-mastery-global|area|category|band],
 *   .plan-review-item[data-sheet-id], [data-plan-action="review"], 
 *   [data-plan-review-status].
 *
 * No se marca PASS sin comprobar el comportamiento real. Si una vista aún no
 * está integrada, la prueba falla con «PENDIENTE DE INTEGRACIÓN» y el selector
 * concreto; nunca se convierte en SKIP.
 */
import { assert, assertEq, assertIncludes, skip } from "../lib/harness.mjs";
import { appURL, waitApp } from "../lib/apps.mjs";
import { sleep } from "../lib/cdp.mjs";

const PENDING = "PENDIENTE DE INTEGRACIÓN (Fase 2): ";
const VIEWPORT_DESKTOP = { width: 1440, height: 900 };
const VIEWPORT_MOBILE = { width: 390, height: 844 };
const CDP = (page) => page.conn;
const PLAN_MODEL_RE = /\/study-dashboard\/js\/plan\/plan-model\.js/;

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

async function noSmoothScroll(page) {
  await page.eval(`(() => {
    try { document.documentElement.style.scrollBehavior = "auto"; } catch (e) {}
    return true;
  })()`);
}

async function openDocument(page, url, settle = 900, { fresh = false } = {}) {
  let target = url;
  if (fresh) {
    const [base, hash = ""] = url.split("#");
    target = base + (base.includes("?") ? "&" : "?") + "qa=" + Date.now() + (hash ? "#" + hash : "");
  }
  await page.goto(target, { settle });
  await noSmoothScroll(page);
}

async function gotoRoute(page, baseURL, hash, settle = 900) {
  /* Arranque en el Panel y navegación de cliente: evita el 404 intermitente
     cuando el router pinta #/dominio u otra ruta antes de que su script de
     módulo termine de registrarse en un arranque directo. */
  await openDocument(page, appURL(baseURL, "dashboard") + "#/", settle);
  await waitApp(page, "dashboard");
  await page.eval(`location.hash = ${JSON.stringify(hash)}, true`);
  await page.waitFor(`location.hash === ${JSON.stringify(hash)}`, { timeout: 8000, message: `hash ${hash}` });
  await page.eval(`new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))`);
  await sleep(240);
}

/* Entrada directa a una ruta de módulo (la que probamos en DASH-33/34):
   si el arranque pintó el 404 antes de registrar el módulo, se vuelve a
   entrar por el Panel una vez, sin tocar producto. Si el módulo no existe,
   la vista sigue siendo 404 y la prueba falla. */
async function recoverModuleRoute(page, hash) {
  await sleep(250);
  const notFound = await page.eval(`/página no encontrada|page not found/i.test(document.title + " " + ((document.getElementById("view-root") || {}).innerText || ""))`);
  if (!notFound) return false;
  await page.eval(`location.hash = "#/", true`);
  await sleep(250);
  await page.eval(`location.hash = ${JSON.stringify(hash)}, true`);
  await page.waitFor(`location.hash === ${JSON.stringify(hash)}`, { timeout: 8000, message: `reentrada a ${hash}` });
  await sleep(350);
  return true;
}

async function setViewport(page, viewport, { touch = false, landscape = false } = {}) {
  await page.viewport(viewport.width, viewport.height, { mobile: touch, isLandscape: landscape });
  await CDP(page).send("Emulation.setTouchEmulationEnabled", { enabled: touch, maxTouchPoints: touch ? 5 : 1 });
  await sleep(220);
}

async function resetViewport(page) {
  await setViewport(page, VIEWPORT_DESKTOP, { touch: false });
}

async function pressKey(page, key, { code = "", keyCode = 0, ctrl = false, text = "" } = {}) {
  const modifiers = ctrl ? 2 : 0;
  await CDP(page).send("Input.dispatchKeyEvent", {
    type: text ? "keyDown" : "rawKeyDown",
    key, code, modifiers,
    windowsVirtualKeyCode: keyCode,
    nativeVirtualKeyCode: keyCode,
    text, unmodifiedText: text,
  });
  await CDP(page).send("Input.dispatchKeyEvent", {
    type: "keyUp", key, code, modifiers,
    windowsVirtualKeyCode: keyCode,
    nativeVirtualKeyCode: keyCode,
  });
  await sleep(180);
}

async function pressEscape(page) {
  await pressKey(page, "Escape", { code: "Escape", keyCode: 27 });
}

async function pressCtrlK(page) {
  await pressKey(page, "k", { code: "KeyK", keyCode: 75, ctrl: true });
}

async function typeInto(page, selector, value) {
  const focused = await page.eval(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return false;
    el.focus();
    if (typeof el.select === "function") el.select();
    return document.activeElement === el;
  })()`);
  assert(focused, `no se pudo enfocar ${selector} para escribir`);
  await pressKey(page, "a", { code: "KeyA", keyCode: 65, ctrl: true });
  await pressKey(page, "Backspace", { code: "Backspace", keyCode: 8 });
  await CDP(page).send("Input.insertText", { text: value });
  await sleep(260);
}

/** Rellena un campo de formulario con eventos reales (date/number no aceptan
 *  bien insertText en headless). */
async function setFieldValue(page, selector, value) {
  const ok = await page.eval(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return false;
    el.value = ${JSON.stringify(value)};
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return el.value === ${JSON.stringify(value)};
  })()`);
  assert(ok, `no se pudo fijar ${selector} = ${value}`);
  await sleep(160);
}

async function waitVisible(page, selector, message, timeout = 15000) {
  await page.waitFor(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return false;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== "none" && s.visibility !== "hidden" && !el.hidden && r.width > 1 && r.height > 1;
  })()`, { timeout, message });
}

async function isVisible(page, selector) {
  return page.eval(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return false;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== "none" && s.visibility !== "hidden" && !el.hidden && r.width > 1 && r.height > 1;
  })()`);
}

async function markFirst(page, scopeSelector, regexSource, mark) {
  return page.eval(`(() => {
    const scope = document.querySelector(${JSON.stringify(scopeSelector)});
    if (!scope) return null;
    const re = new RegExp(${JSON.stringify(regexSource)}, "i");
    const nodes = Array.from(scope.querySelectorAll("button, a[href], [role='button']"));
    for (const el of nodes) {
      const name = ((el.getAttribute("aria-label") || "") + " " + (el.innerText || el.textContent || ""))
        .replace(/\\s+/g, " ").trim();
      if (!name || !re.test(name) || el.disabled) continue;
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (s.display === "none" || s.visibility === "hidden" || r.width < 1 || r.height < 1) continue;
      el.setAttribute("data-qa-mark", ${JSON.stringify(mark)});
      return name;
    }
    return null;
  })()`);
}

async function clearMarks(page) {
  await page.eval(`document.querySelectorAll("[data-qa-mark]").forEach((el) => el.removeAttribute("data-qa-mark")), true`);
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isoWeekStart(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

function isoWeekId(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((d - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return d.getUTCFullYear() + "-W" + String(week).padStart(2, "0");
}

const STORE_READ = `(() => {
  const s = window.StudyStore;
  const plan = s.plan.get();
  const cards = JSON.stringify((s.getState() || {}).cards || {});
  const flashSession = JSON.stringify((s.getState() || {}).flashSession || {});
  return {
    plan: plan ? {
      examDate: plan.examDate, minutesPerDay: plan.minutesPerDay,
      daysPerWeek: plan.daysPerWeek, areaPriority: plan.areaPriority || null,
      updatedAt: plan.updatedAt, deleted: plan.deleted
    } : null,
    reviews: s.sheetReview.list().map((r) => ({
      sheetId: r.sheetId, dueAt: r.dueAt, intervalDays: r.intervalDays,
      lastReviewedAt: r.lastReviewedAt, source: r.source, updatedAt: r.updatedAt
    })),
    weekly: s.weekly.list(12).map((w) => ({ id: w.id, weekStart: w.weekStart, totals: w.totals || null, status: w.status || null, updatedAt: w.updatedAt })),
    confidence: s.sheetConfidence.list().map((c) => ({ sheetId: c.sheetId, value: c.value })),
    doubts: s.doubts.list({ resolved: false }).length,
    completed: Object.keys((s.getState() || {}).sheets || {}).filter((id) => {
      const st = s.getState().sheets[id];
      return st && st.completedAt;
    }).length,
    cards, flashSession,
    derived: window.StudyDerived ? { search: window.StudyDerived.state("search"), related: window.StudyDerived.state("related") } : null,
    model: !!window.StudyPlanModel,
    runtime: !!(window.StudyPlanRuntime && window.StudyPlanRuntime.model())
  };
})()`;

async function readStore(page) {
  return page.eval(STORE_READ);
}

async function clearPlan(page) {
  await page.eval(`(() => { try { window.StudyStore.plan.remove(); } catch (e) {} return true; })()`);
  await sleep(250);
}

async function seedPlan(page, plan = {}) {
  const payload = Object.assign({
    examDate: futureDate(60),
    minutesPerDay: 45,
    daysPerWeek: 6,
    areaPriority: {},
  }, plan);
  return page.eval(`(() => {
    const saved = window.StudyStore.plan.save(${JSON.stringify(payload)});
    return saved ? { ok: true } : { ok: false };
  })()`);
}

function futureDate(days) {
  const d = new Date(Date.now() + days * 86400000);
  return d.toISOString().slice(0, 10);
}

async function seedActivity(page) {
  await page.eval(`(() => {
    const s = window.StudyStore;
    const content = window.STUDY_CONTENT;
    const sheets = content.sheets;
    for (let i = 0; i < 3; i += 1) {
      const sheet = sheets[i];
      if (!sheet) continue;
      const st = s.getSheetState(sheet.id);
      if (st && st.completedAt) continue;
      s.toggleSheetComplete(sheet.id);
    }
    return true;
  })()`);
  await sleep(400);
}

async function seedReview(page, sheetId, { daysAgo = 3, intervalDays = 1 } = {}) {
  return page.eval(`(() => {
    const due = new Date(Date.now() - ${daysAgo} * 86400000).toISOString();
    const last = new Date(Date.now() - (${daysAgo} + ${intervalDays}) * 86400000).toISOString();
    const saved = window.StudyStore.sheetReview.save({
      sheetId: ${JSON.stringify(sheetId)},
      dueAt: due,
      intervalDays: ${intervalDays},
      lastReviewedAt: last,
      source: "confidence"
    });
    return saved ? { ok: true, dueAt: saved.dueAt } : { ok: false };
  })()`);
}

async function seedConfidence(page, map) {
  await page.eval(`(() => {
    const s = window.StudyStore;
    const entries = ${JSON.stringify(map)};
    Object.keys(entries).forEach((sheetId) => s.sheetConfidence.set(sheetId, entries[sheetId]));
    return true;
  })()`);
  await sleep(350);
}

async function seedDoubt(page, sheetId) {
  await page.eval(`(() => {
    try {
      window.StudyStore.doubts.add({
        sheetId: ${JSON.stringify(sheetId)},
        sectionIndex: 0,
        paragraphIndex: 0,
        quote: "Cita de QA para la ruta de hoy",
        note: "Duda de QA"
      });
    } catch (e) {}
    return true;
  })()`);
}

async function waitPlanView(page, view, timeout = 20000) {
  try {
    await page.waitFor(`!!document.querySelector('section[data-plan-view="${view}"]')`, {
      timeout,
      message: `vista ${view}`,
    });
  } catch (error) {
    const state = await page.eval(`(() => ({
      hash: location.hash,
      title: document.title,
      text: (document.getElementById("view-root") || {}).innerText ? document.getElementById("view-root").innerText.replace(/\\s+/g, " ").slice(0, 240) : "",
      routes: Array.from(document.querySelectorAll("[data-plan-view]")).map((el) => el.getAttribute("data-plan-view"))
    }))()`).catch(() => null);
    throw new Error(`${error.message} — estado: ${JSON.stringify(state)}`);
  }
  await page.waitFor(`(() => {
    const root = document.querySelector('section[data-plan-view="${view}"]');
    if (!root) return false;
    return !root.querySelector('[data-plan-loading]');
  })()`, { timeout: timeout + 15000, message: `carga de ${view}` });
}

/* ------------------------------------------------------------------ */
/* Suite                                                               */
/* ------------------------------------------------------------------ */

export async function runDashboardFase2({ h, page, baseURL }) {
  h.suite("Study Dashboard · Fase 2");
  h.state.app = "Study Dashboard";

  /* ---------------------------------------------------------------- */
  /* DASH-31 · plan-model.js NO se carga al arrancar; sí al abrir ruta */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-31",
    "plan-model.js no se descarga al arrancar; se carga solo al abrir #/ruta, con error y reintento",
    async () => {
      await resetViewport(page);
      await openDocument(page, appURL(baseURL, "dashboard") + "#/", 1100, { fresh: true });
      await waitApp(page, "dashboard");
      const startup = await page.eval(`(() => ({
        model: !!window.StudyPlanModel,
        runtime: !!(window.StudyPlanRuntime && window.StudyPlanRuntime.model()),
        runtimeLoaded: !!window.StudyPlanRuntime,
        requests: performance.getEntriesByType("resource").map((e) => e.name).filter((url) => ${PLAN_MODEL_RE}.test(url))
      }))()`);
      assert(startup.runtimeLoaded, `${PENDING}index.html no carga js/plan/plan.runtime.js.`);
      assertEq(startup.model, false, "plan-model.js no debe estar cargado al arrancar");
      assertEq(startup.requests.length, 0, `plan-model.js no debe pedirse al arrancar: ${startup.requests.join(", ")}`);

      await gotoRoute(page, baseURL, "#/biblioteca", 900);
      await gotoRoute(page, baseURL, "#/ficha/sheet-aps-01", 900);
      const beforePlan = await page.eval(`performance.getEntriesByType("resource").map((e) => e.name).filter((url) => ${PLAN_MODEL_RE}.test(url)).length`);
      assertEq(beforePlan, 0, "plan-model.js tampoco se pide en la biblioteca ni en la ficha");

      // Error de carga controlado: se bloquea el script y se abre #/ruta.
      await CDP(page).send("Network.enable");
      await CDP(page).send("Network.setBlockedURLs", { urls: ["*study-dashboard/js/plan/plan-model.js*"] });
      await gotoRoute(page, baseURL, "#/ruta", 900);
      await page.waitFor(`(() => {
        const error = document.querySelector('[data-plan-error]');
        if (!error || error.hidden) return false;
        const r = error.getBoundingClientRect();
        return r.width > 1 && r.height > 1;
      })()`, { timeout: 20000, message: "estado de error visible de la ruta" }).catch(() => {});
      const errorState = await page.eval(`(() => {
        const error = document.querySelector("[data-plan-error]");
        const view = document.querySelector('section[data-plan-view="ruta"]');
        const visible = !!error && !error.hidden && error.getBoundingClientRect().height > 1;
        return {
          error: visible,
          text: visible ? error.innerText.replace(/\\s+/g, " ").trim().slice(0, 240) : "",
          retry: !!(visible && error.querySelector('[data-plan-action="retry-model"], button, a[href]')),
          loadingGone: view ? !view.querySelector("[data-plan-loading]") : false
        };
      })()`);
      assert(errorState.error, `${PENDING}#/ruta no muestra visible [data-plan-error] cuando plan-model.js no carga.`);
      assert(errorState.retry, "el error de la ruta debe ofrecer reintento");
      assert(/volver a intentar|reintent|intentar/i.test(normalize(errorState.text)), `el error explica cómo reintentar: «${errorState.text}»`);

      await CDP(page).send("Network.setBlockedURLs", { urls: [] });
      await page.waitFor(`(() => {
        const retry = document.querySelector('[data-plan-error] [data-plan-action="retry-model"]');
        return !!retry && !retry.closest("[data-plan-error]").hidden;
      })()`, { timeout: 5000, message: "botón de reintento de la ruta" });
      await page.click('[data-plan-error] [data-plan-action="retry-model"]');
      await waitPlanView(page, "ruta");
      const loaded = await page.eval(`(() => ({
        model: !!window.StudyPlanModel,
        runtime: !!(window.StudyPlanRuntime && window.StudyPlanRuntime.model()),
        requests: performance.getEntriesByType("resource")
          .filter((e) => ${PLAN_MODEL_RE}.test(e.name))
          .map((e) => ({ size: e.transferSize, duration: Math.round(e.duration) })),
        h1: (document.querySelector("#plan-ruta-title") || {}).innerText || ""
      }))()`);
      assertEq(loaded.model, true, "tras reintentar, plan-model.js debe estar cargado");
      assertEq(loaded.runtime, true, "el runtime debe exponer el modelo");
      assert(loaded.requests.length >= 1, "debe existir la petición de plan-model.js al abrir #/ruta");
      assert(loaded.h1.length > 3, "la ruta debe tener su h1 (#plan-ruta-title)");
      return { startup, beforePlan, errorState, retry: true, loaded };
    },
    { severity: "alta", page, timeout: 120000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-32 · #/ruta sin plan, con plan, repasos y enlaces            */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-32",
    "#/ruta sin plan y con plan: resumen real, ítems, repaso enlazado y CTA al editor",
    async () => {
      await resetViewport(page);
      await page.eval(`(() => { window.StudyStore.plan.remove(); return true; })()`);
      await seedActivity(page);
      await seedDoubt(page, "sheet-aps-01");
      await seedReview(page, "sheet-aps-01", { daysAgo: 2, intervalDays: 1 });
      await gotoRoute(page, baseURL, "#/ruta", 1100);
      await waitPlanView(page, "ruta");

      const withoutPlan = await page.eval(`(() => {
        const view = document.querySelector('section[data-plan-view="ruta"]');
        const status = document.querySelector("[data-plan-route-status]");
        const items = Array.from(document.querySelectorAll(".plan-route-item[data-type]"));
        const links = Array.from(view.querySelectorAll("[data-plan-link]")).map((a) => ({ rel: a.getAttribute("data-plan-link"), href: a.getAttribute("href") }));
        const signals = Array.from(view.querySelectorAll("[data-plan-signals] a[href]")).map((a) => a.getAttribute("href"));
        const repaso = items.find((el) => el.getAttribute("data-type") === "repaso");
        const repasoLink = repaso ? Array.from(repaso.querySelectorAll("a[href]")).map((a) => a.getAttribute("href")) : [];
        return {
          title: (document.querySelector("#plan-ruta-title") || {}).innerText || "",
          text: view.innerText.replace(/\\s+/g, " ").trim().slice(0, 700),
          status: status ? status.innerText.replace(/\\s+/g, " ").trim() : "",
          items: items.map((el) => el.getAttribute("data-type")),
          signals,
          links,
          repasoLink,
          hasPlanCta: links.some((l) => l.rel === "plan" && l.href === "#/plan"),
          declaresNoPlan: /sin plan|no hay plan|sin presupuesto|configura/i.test(view.innerText),
          actionable: signals.length > 0 || items.length > 0
        };
      })()`);
      assert(withoutPlan.title.length > 3, "la ruta debe tener h1 (#plan-ruta-title)");
      assert(withoutPlan.status.length > 3, "la ruta debe declarar su estado en [data-plan-route-status]");
      assert(withoutPlan.actionable, `${PENDING}#/ruta sin plan no pinta ítems ni señales accionables (.plan-route-item[data-type] / [data-plan-signals]).`);
      assert(withoutPlan.hasPlanCta, "sin plan, la ruta debe ofrecer el CTA [data-plan-link=plan] a #/plan");
      assert(withoutPlan.declaresNoPlan, `sin plan, la ruta debe declarar que no hay presupuesto: «${withoutPlan.text}»`);
      assert(
        withoutPlan.signals.includes("#/repaso") || withoutPlan.repasoLink.includes("#/repaso"),
        `la ruta sin plan debe enlazar el repaso vencido a #/repaso. Señales: ${withoutPlan.signals.join(", ")} · ítems: ${withoutPlan.repasoLink.join(", ")}`,
      );

      const saved = await seedPlan(page);
      assert(saved.ok, "el plan de prueba debe guardarse");
      await gotoRoute(page, baseURL, "#/ruta", 1200);
      await waitPlanView(page, "ruta");
      const withPlan = await page.eval(`(() => {
        const view = document.querySelector('section[data-plan-view="ruta"]');
        const links = Array.from(view.querySelectorAll("[data-plan-link]")).map((a) => ({ rel: a.getAttribute("data-plan-link"), href: a.getAttribute("href") }));
        return {
          text: view.innerText.replace(/\\s+/g, " ").trim().slice(0, 900),
          status: (document.querySelector("[data-plan-route-status]") || {}).innerText || "",
          hasWeekly: !!document.querySelector("[data-plan-weekly]"),
          links,
          hasDate: /\\d{1,2}\\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\\s+\\d{4}/i.test(view.innerText),
          hasBudget: /45/.test(view.innerText)
        };
      })()`);
      assert(withPlan.hasDate, `con plan y fecha de examen, la ruta debe mostrar la fecha real: «${withPlan.text.slice(0, 300)}»`);
      assert(withPlan.hasBudget, "la ruta debe mostrar el presupuesto real de 45 min/día");
      assert(withPlan.hasWeekly, `${PENDING}la ruta no monta el resumen semanal [data-plan-weekly].`);
      for (const rel of ["plan", "dominio", "repaso"]) {
        assert(withPlan.links.some((l) => l.rel === rel), `la ruta debe enlazar ${rel} con [data-plan-link="${rel}"]`);
      }
      assert(withPlan.links.some((l) => l.rel === "dominio" && l.href === "#/dominio"), "el enlace de dominio apunta a #/dominio");
      assert(withPlan.links.some((l) => l.rel === "repaso" && l.href === "#/repaso"), "el enlace de repaso apunta a #/repaso");

      return { withoutPlan, withPlan };
    },
    { severity: "alta", page, timeout: 90000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-33 · #/plan: guardar, persistir, prioridad de área y borrar  */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-33",
    "#/plan: formulario accesible, guardar con prioridad de área, persistir, previsualizar y quitar",
    async () => {
      await resetViewport(page);
      await gotoRoute(page, baseURL, "#/plan", 1100);
      await waitPlanView(page, "plan");
      const form = await page.eval(`(() => {
        const view = document.querySelector('section[data-plan-view="plan"]');
        const fields = ["examDate", "minutesPerDay", "daysPerWeek"].map((name) => {
          const el = document.querySelector('[data-plan-field="' + name + '"]');
          return el ? { name, tag: el.tagName, type: el.getAttribute("type"), value: el.value } : { name, missing: true };
        });
        return {
          title: (document.querySelector("#plan-editor-title") || {}).innerText || "",
          fields,
          form: !!document.querySelector("form[data-plan-form]"),
          preview: !!document.querySelector("[data-plan-preview]"),
          save: !!document.querySelector('[data-plan-action="save"]'),
          remove: !!document.querySelector('[data-plan-action="remove"]'),
          areas: new Set(Array.from(document.querySelectorAll("[data-plan-area-priority]")).map((el) => el.getAttribute("data-plan-area-priority"))).size
        };
      })()`);
      assert(form.title.length > 3, "el editor debe tener h1 (#plan-editor-title)");
      assert(form.form, `${PENDING}#/plan no expone form[data-plan-form].`);
      for (const field of form.fields) {
        assert(!field.missing, `${PENDING}#/plan no expone [data-plan-field="${field.name}"].`);
      }
      assertEq(form.preview, true, "el editor debe mostrar previsualización ([data-plan-preview])");
      assertEq(form.save, true, "el editor debe ofrecer Guardar ([data-plan-action=save])");
      assertEq(form.remove, true, "el editor debe ofrecer Quitar plan ([data-plan-action=remove])");
      assertEq(form.areas, 5, `el editor debe ofrecer prioridad para las 5 áreas oficiales (hay ${form.areas})`);

      const examDate = futureDate(60);
      await setFieldValue(page, '[data-plan-field="examDate"]', examDate);
      await setFieldValue(page, '[data-plan-field="minutesPerDay"]', "45");
      await setFieldValue(page, '[data-plan-field="daysPerWeek"]', "5");

      const priority = await page.eval(`(() => {
        const controls = Array.from(document.querySelectorAll("[data-plan-area-priority]"));
        return controls.map((el) => ({
          tag: el.tagName,
          type: el.getAttribute("type"),
          value: el.value != null ? el.value : null,
          area: el.getAttribute("data-plan-area-priority") || "",
          checked: !!el.checked
        }));
      })()`);
      // Se fija la primera área oficial a 2 y la segunda a 1,5 con sus radios reales.
      const setPriority = await page.eval(`(() => {
        let areas = [];
        try {
          if (window.StudyTaxonomy && typeof window.StudyTaxonomy.primaryAreas === "function") {
            areas = window.StudyTaxonomy.primaryAreas().map((area) => area.id);
          }
        } catch (e) { areas = []; }
        if (!areas.length && window.StudyPlanRuntime && typeof window.StudyPlanRuntime.categories === "function") {
          const seen = {};
          (window.StudyPlanRuntime.categories() || []).forEach((category) => {
            if (category && category.areaId && !seen[category.areaId]) { seen[category.areaId] = true; areas.push(category.areaId); }
          });
        }
        const wanted = [
          { areaId: areas[0] || null, value: 2 },
          { areaId: areas[1] || null, value: 1.5 }
        ];
        const result = wanted.map((entry) => {
          if (!entry.areaId) return false;
          const input = Array.from(document.querySelectorAll('[data-plan-area-priority="' + entry.areaId + '"]'))
            .find((el) => String(el.value) === String(entry.value));
          if (!input) return false;
          input.checked = true;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
          return true;
        });
        return { values: result, officialAreas: areas.length, sample: areas.slice(0, 2) };
      })()`);
      assert(setPriority.values[0] && setPriority.values[1], `no se pudo fijar la prioridad en las áreas oficiales: ${JSON.stringify(setPriority)}`);
      assertEq(setPriority.officialAreas, 5, `deben existir 5 áreas oficiales; hay ${setPriority.officialAreas}`);

      await page.click('[data-plan-action="save"]');
      await page.waitFor(`!!window.StudyStore.plan.get()`, { timeout: 8000, message: "plan guardado" });
      const saved = await readStore(page);
      assert(saved.plan, "el plan debe quedar en el store");
      assertEq(saved.plan.examDate, examDate, "examDate guardado");
      assertEq(Number(saved.plan.minutesPerDay), 45, "minutesPerDay guardado");
      assertEq(Number(saved.plan.daysPerWeek), 5, "daysPerWeek guardado");
      assert(saved.plan.areaPriority && typeof saved.plan.areaPriority === "object", "el plan debe conservar areaPriority");
      assert(
        Object.keys(saved.plan.areaPriority).length >= 2,
        `areaPriority debe conservar al menos dos áreas: ${JSON.stringify(saved.plan.areaPriority)}`,
      );
      const status = await page.eval(`(() => {
        const el = document.querySelector("[data-plan-form-status]");
        const preview = document.querySelector("[data-plan-preview]");
        return { status: el ? el.innerText.replace(/\\s+/g, " ").trim() : "", preview: preview ? preview.innerText.replace(/\\s+/g, " ").trim().slice(0, 300) : "" };
      })()`);
      assert(status.status.length > 0, "el formulario debe anunciar el resultado en [data-plan-form-status]");
      assert(status.preview.length > 10, "la previsualización debe refrescarse tras guardar");

      // Persistencia tras refrescar.
      await openDocument(page, appURL(baseURL, "dashboard") + "#/plan", 1100);
      await waitApp(page, "dashboard");
      await recoverModuleRoute(page, "#/plan");
      await waitPlanView(page, "plan");
      const afterReload = await page.eval(`(() => ({
        plan: window.StudyStore.plan.get(),
        exam: (document.querySelector('[data-plan-field="examDate"]') || {}).value,
        minutes: (document.querySelector('[data-plan-field="minutesPerDay"]') || {}).value,
        days: (document.querySelector('[data-plan-field="daysPerWeek"]') || {}).value
      }))()`);
      assertEq(afterReload.exam, examDate, "la fecha persiste tras refrescar");
      assertEq(String(afterReload.minutes), "45", "los minutos persisten");
      assertEq(String(afterReload.days), "5", "los días persisten");

      // Quitar plan con confirmación; no borra el progreso.
      const beforeRemove = await readStore(page);
      await page.click('[data-plan-action="remove"]');
      await sleep(500);
      const confirm = await page.eval(`(() => {
        const dialog = document.querySelector('[role="dialog"], .plan-confirm, [data-plan-confirm]');
        return dialog ? { text: dialog.innerText.replace(/\\s+/g, " ").trim().slice(0, 240) } : null;
      })()`);
      if (confirm) {
        await clearMarks(page);
        const confirmName = await markFirst(page, '[role="dialog"], .plan-confirm, [data-plan-confirm]', "quitar|borrar|confirmar|eliminar", "confirm-remove");
        assert(confirmName, "la confirmación de Quitar plan no ofrece una acción de confirmación");
        await page.click('[data-qa-mark="confirm-remove"]');
      }
      await page.waitFor(`window.StudyStore.plan.get() === null`, { timeout: 8000, message: "plan borrado" });
      const afterRemove = await readStore(page);
      assertEq(afterRemove.plan, null, "el plan queda eliminado");
      assertEq(afterRemove.completed, beforeRemove.completed, "quitar el plan no borra el progreso de fichas");

      return { form, priority, saved: saved.plan, status, afterReload: { exam: afterReload.exam }, confirm: !!confirm };
    },
    { severity: "alta", page, timeout: 120000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-34 · #/dominio: estado vacío real y mapa con señales         */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-34",
    "#/dominio: estado vacío sin señales y mapa real con banda textual, áreas y categorías",
    async () => {
      await resetViewport(page);
      await page.eval(`window.StudyStore.clearAllProgress({ confirm: true }), true`);
      await sleep(500);
      // Documento nuevo tras borrar el progreso: evita arrastrar el estado de la
      // vista anterior y comprueba la ruta también como entrada directa.
      await openDocument(page, appURL(baseURL, "dashboard") + "#/dominio", 1100, { fresh: true });
      await waitApp(page, "dashboard");
      await recoverModuleRoute(page, "#/dominio");
      await waitPlanView(page, "dominio");
      const emptyState = await page.eval(`(() => {
        const view = document.querySelector('section[data-plan-view="dominio"]');
        const global = document.querySelector("[data-mastery-global]");
        const areas = document.querySelectorAll("[data-mastery-area]");
        const categories = document.querySelectorAll("[data-mastery-category]");
        return {
          title: (document.querySelector("#plan-mastery-title") || {}).innerText || "",
          text: view.innerText.replace(/\\s+/g, " ").trim().slice(0, 500),
          global: global ? global.innerText.replace(/\\s+/g, " ").trim() : "",
          areas: areas.length,
          categories: categories.length,
          empty: /sin datos|sin señales|todavía no|aún no/i.test(view.innerText),
          fakeZero: /\\b0\\s*%\\b/.test((global || {}).innerText || "")
        };
      })()`);
      assert(emptyState.title.length > 3, "el mapa de dominio debe tener h1 (#plan-mastery-title)");
      assert(emptyState.empty, `sin señales, el dominio debe declarar el estado vacío: «${emptyState.text}»`);
      assertEq(emptyState.fakeZero, false, "sin señales no debe mostrarse 0 como si fuera una medición");

      // Señales reales: confianza, fichas completadas y recuerdos.
      const signalSheets = await page.eval(`(() => window.STUDY_CONTENT.sheets.slice(0, 8).map((s) => s.id))()`);
      await seedConfidence(page, {
        [signalSheets[0]]: "weak",
        [signalSheets[1]]: "partial",
        [signalSheets[2]]: "solid",
        [signalSheets[3]]: "partial",
      });
      await page.eval(`(() => {
        const s = window.StudyStore;
        const ids = ${JSON.stringify(signalSheets)};
        ids.slice(0, 3).forEach((id) => {
          const st = s.getSheetState(id);
          if (!(st && st.completedAt)) s.toggleSheetComplete(id);
        });
        return true;
      })()`);
      await sleep(500);
      await openDocument(page, appURL(baseURL, "dashboard") + "#/dominio", 1100, { fresh: true });
      await waitApp(page, "dashboard");
      await recoverModuleRoute(page, "#/dominio");
      await waitPlanView(page, "dominio");
      const measured = await page.eval(`(() => {
        const view = document.querySelector('section[data-plan-view="dominio"]');
        const global = document.querySelector("[data-mastery-global]");
        const areas = Array.from(document.querySelectorAll("[data-mastery-area]"));
        const categories = Array.from(document.querySelectorAll("[data-mastery-category]"));
        return {
          text: view.innerText.replace(/\\s+/g, " ").trim().slice(0, 700),
          global: global ? global.innerText.replace(/\\s+/g, " ").trim() : "",
          areas: areas.length,
          categories: categories.length,
          bands: Array.from(document.querySelectorAll("[data-mastery-band]")).map((el) => el.getAttribute("data-band") || el.innerText.trim()).slice(0, 8),
          hasScore: /\\d/.test(global ? global.innerText : ""),
          weakest: /más floj|punto floj|débil|refuerz/i.test(view.innerText)
        };
      })()`);
      assertEq(measured.areas, 5, "el mapa debe cubrir las 5 áreas oficiales");
      assert(measured.categories >= 5, "el mapa debe incluir categorías reales");
      assert(measured.hasScore, `con señales, [data-mastery-global] debe mostrar un puntaje real: «${measured.global}»`);
      assert(measured.bands.length > 0, "cada área/categoría debe declarar su banda textual ([data-mastery-band])");
      assert(measured.weakest, "el mapa debe señalar el punto más flojo cuando la cobertura lo permite");
      return { emptyState, measured };
    },
    { severity: "alta", page, timeout: 120000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-35 · #/repaso: autoevaluación reprograma y no toca Flashcards*/
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-35",
    "#/repaso: lista por vencimiento, autoevaluación que guarda nuevo dueAt y cards intactas",
    async () => {
      await resetViewport(page);
      const sheetA = await page.eval(`window.STUDY_CONTENT.sheets[4].id`);
      const sheetB = await page.eval(`window.STUDY_CONTENT.sheets[5].id`);
      await page.eval(`(() => {
        const s = window.StudyStore;
        s.sheetConfidence.set(${JSON.stringify(sheetA)}, "partial");
        s.sheetConfidence.set(${JSON.stringify(sheetB)}, "weak");
        return true;
      })()`);
      await seedReview(page, sheetA, { daysAgo: 4, intervalDays: 2 });
      await seedReview(page, sheetB, { daysAgo: 1, intervalDays: 1 });
      const before = await readStore(page);
      await gotoRoute(page, baseURL, "#/repaso", 1100);
      await waitPlanView(page, "repaso");
      const list = await page.eval(`(() => {
        const view = document.querySelector('section[data-plan-view="repaso"]');
        const items = Array.from(document.querySelectorAll(".plan-review-item[data-sheet-id]"));
        const first = items[0];
        return {
          title: (document.querySelector("#plan-review-title") || {}).innerText || "",
          items: items.map((el) => ({
            sheetId: el.getAttribute("data-sheet-id"),
            text: el.innerText.replace(/\\s+/g, " ").trim().slice(0, 160),
            open: (el.querySelector('[data-plan-action="open"]') || {}).getAttribute ? (el.querySelector('[data-plan-action="open"]') || {}).getAttribute("href") : null,
            values: Array.from(el.querySelectorAll('[data-plan-action="review"]')).map((b) => b.getAttribute("data-value"))
          })),
          status: (document.querySelector("[data-plan-review-status]") || {}).innerText || ""
        };
      })()`);
      assert(list.title.length > 3, "la vista de repaso debe tener h1 (#plan-review-title)");
      assert(list.items.length >= 2, `${PENDING}#/repaso no lista .plan-review-item[data-sheet-id] (${list.items.length}).`);
      assertEq(list.items[0].sheetId, sheetA, "la lista debe ordenarse por vencimiento (primero la más atrasada)");
      assertEq(list.items[0].open, "#/ficha/" + sheetA, "cada fila enlaza a su ficha con [data-plan-action=open]");
      for (const value of ["weak", "partial", "solid"]) {
        assert(list.items[0].values.includes(value), `la fila debe ofrecer la autoevaluación ${value}`);
      }

      await page.click(`.plan-review-item[data-sheet-id="${sheetA}"] [data-plan-action="review"][data-value="solid"]`);
      await page.waitFor(`(() => {
        const r = window.StudyStore.sheetReview.get(${JSON.stringify(sheetA)});
        return r && r.lastReviewedAt && r.intervalDays >= 1;
      })()`, { timeout: 10000, message: "repaso guardado" });
      await sleep(500);
      const after = await readStore(page);
      const beforeReview = before.reviews.find((r) => r.sheetId === sheetA);
      const afterReview = after.reviews.find((r) => r.sheetId === sheetA);
      assert(afterReview, "el repaso debe seguir en sheetReview");
      assert(
        Date.parse(afterReview.dueAt) > Date.parse(beforeReview.dueAt),
        `el nuevo dueAt debe ser posterior: antes ${beforeReview.dueAt}, después ${afterReview.dueAt}`,
      );
      assert(afterReview.lastReviewedAt, "el repaso debe guardar lastReviewedAt");
      assert(afterReview.intervalDays >= 1, "el repaso debe guardar intervalDays");
      assertEq(afterReview.source, "confidence", "el repaso mantiene source confidence");
      assertEq(after.cards, before.cards, "el repaso no puede modificar las cajas de Flashcards (cards)");
      assertEq(after.flashSession, before.flashSession, "el repaso no puede modificar flashSession");
      const status = await page.eval(`(() => {
        const el = document.querySelector("[data-plan-review-status]");
        return el ? el.innerText.replace(/\\s+/g, " ").trim() : "";
      })()`);
      assert(status.length > 0, "la vista debe anunciar el nuevo vencimiento en [data-plan-review-status]");
      return { sheetA, sheetB, list, before: beforeReview, after: afterReview, status };
    },
    { severity: "alta", page, timeout: 120000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-36 · Resumen semanal real, guardado y sin duplicados         */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-36",
    "Resumen semanal en #/ruta: datos reales, guardado en StudyStore.weekly y sin duplicar la semana",
    async () => {
      await resetViewport(page);
      await seedActivity(page);
      const weekStart = isoWeekStart();
      const weekId = isoWeekId();
      for (let i = 0; i < 3; i += 1) {
        await gotoRoute(page, baseURL, "#/ruta", 1100);
        await waitPlanView(page, "ruta");
        await sleep(700);
      }
      const weekly = await page.eval(`(() => {
        const view = document.querySelector('section[data-plan-view="ruta"]');
        const block = document.querySelector("[data-plan-weekly]");
        return {
          block: !!block,
          text: block ? block.innerText.replace(/\\s+/g, " ").trim().slice(0, 600) : "",
          records: window.StudyStore.weekly.list(12).map((w) => ({ id: w.id, weekStart: w.weekStart })),
          currentWeek: window.StudyStore.weekly.get(${JSON.stringify(weekStart)})
        };
      })()`);
      assert(weekly.block, `${PENDING}la ruta no monta [data-plan-weekly].`);
      assert(weekly.text.length > 20, "el resumen semanal debe mostrar datos reales");
      const matches = weekly.records.filter((r) => r.id === weekId || r.weekStart === weekStart);
      assertEq(matches.length, 1, `la semana ${weekId} debe guardarse una sola vez; hay ${matches.length}`);
      assert(weekly.currentWeek, `StudyStore.weekly.get(${weekStart}) debe devolver la semana guardada`);
      return { weekStart, weekId, weekly };
    },
    { severity: "media", page, timeout: 90000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-37 · Descubrimiento en Más/paleta y enlace del Panel         */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-37",
    "Planificación descubrible: Más móvil (4 enlaces), paleta Ctrl+K y «Ver ruta completa» en el Panel",
    async () => {
      await setViewport(page, VIEWPORT_MOBILE, { touch: true });
      await gotoRoute(page, baseURL, "#/", 1100);
      const more = await page.eval(`(() => {
        const trigger = document.querySelector('[data-action="more-open"]');
        if (!trigger) return null;
        trigger.click();
        return true;
      })()`);
      assert(more, "la appbar móvil debe ofrecer el botón Más");
      await sleep(450);
      const moreLinks = await page.eval(`(() => {
        const panel = document.getElementById("dash-more-panel");
        const links = Array.from(panel.querySelectorAll('a[href^="#/"]')).map((a) => ({ href: a.getAttribute("href"), text: a.innerText.replace(/\\s+/g, " ").trim() }));
        return {
          open: !panel.hidden,
          links,
          hasRuta: links.some((l) => l.href === "#/ruta"),
          hasPlan: links.some((l) => l.href === "#/plan"),
          hasDominio: links.some((l) => l.href === "#/dominio"),
          hasRepaso: links.some((l) => l.href === "#/repaso"),
          appbar: Array.from(document.querySelectorAll(".s-appbar a, .s-appbar button"))
            .filter((el) => !el.closest(".dash-more-panel"))
            .filter((el) => {
              const s = getComputedStyle(el); const r = el.getBoundingClientRect();
              return s.display !== "none" && s.visibility !== "hidden" && r.width > 1;
            }).length
        };
      })()`);
      assertEq(moreLinks.open, true, "el panel Más debe abrirse");
      for (const route of ["ruta", "plan", "dominio", "repaso"]) {
        assert(moreLinks["has" + route.charAt(0).toUpperCase() + route.slice(1)], `Más debe ofrecer #/${route}`);
      }
      assertEq(moreLinks.appbar, 5, "la appbar móvil sigue en 5 controles");
      await pressEscape(page);
      await sleep(300);

      // Paleta: las cuatro vistas.
      await pressCtrlK(page);
      await waitVisible(page, '.navx-palette-layer[data-state="open"]', "paleta para Fase 2");
      const palette = await page.eval(`(() => {
        const layer = document.querySelector('.navx-palette-layer[data-state="open"]');
        const options = Array.from(layer.querySelectorAll('[data-navx-palette-kind="view"]')).map((el) => (el.innerText || "").replace(/\\s+/g, " ").trim());
        return { options };
      })()`);
      const joined = normalize(palette.options.join(" "));
      for (const label of ["ruta de hoy", "plan de estudio", "mapa de dominio", "repaso"]) {
        assertIncludes(joined, label, `la paleta debe incluir «${label}»`);
      }
      await pressEscape(page);

      // Panel: la Ruta de hoy enlaza a #/ruta.
      await gotoRoute(page, baseURL, "#/", 1100);
      const panelLink = await page.eval(`(() => {
        const host = document.querySelector('[data-module-mount="today-route"]');
        const link = host ? host.querySelector('a[href="#/ruta"]') : null;
        return link ? { href: link.getAttribute("href"), text: link.innerText.replace(/\\s+/g, " ").trim() } : null;
      })()`);
      assert(panelLink, `${PENDING}la Ruta de hoy del Panel no enlaza a #/ruta («Ver ruta completa»).`);
      assertIncludes(normalize(panelLink.text), "ruta", "el enlace del Panel se llama «Ver ruta completa»");
      await resetViewport(page);
      return { moreLinks, palette, panelLink };
    },
    { severity: "alta", page, timeout: 90000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-38 · Layout de las rutas nuevas en 6 viewports               */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-38",
    "Rutas #/ruta, #/plan, #/dominio y #/repaso sin scroll horizontal en 6 viewports y 44 px en puntero grueso",
    async () => {
      const viewports = [
        { width: 1440, height: 900, touch: false, label: "1440x900" },
        { width: 390, height: 844, touch: true, label: "390x844" },
        { width: 360, height: 800, touch: true, label: "360x800" },
        { width: 768, height: 1024, touch: false, label: "768x1024" },
        { width: 1024, height: 768, touch: false, label: "1024x768" },
        { width: 844, height: 390, touch: true, landscape: true, label: "844x390" },
      ];
      const results = [];
      for (const viewport of viewports) {
        await setViewport(page, viewport, { touch: viewport.touch, landscape: !!viewport.landscape });
        for (const route of ["ruta", "plan", "dominio", "repaso"]) {
          await gotoRoute(page, baseURL, `#/${route}`, 1000);
          await waitPlanView(page, route);
          const metrics = await page.eval(`(() => {
            const selectors = [
              "section[data-plan-view] button",
              "section[data-plan-view] a[href]",
              "section[data-plan-view] input",
              "section[data-plan-view] select",
              "[data-plan-area-priority] button",
              ".plan-route-item a[href]",
              ".plan-review-item button"
            ];
            const visible = (el) => {
              const s = getComputedStyle(el); const r = el.getBoundingClientRect();
              return s.display !== "none" && s.visibility !== "hidden" && !el.hidden && r.width > 1 && r.height > 1;
            };
            const small = [];
            selectors.forEach((selector) => {
              document.querySelectorAll(selector).forEach((el) => {
                if (!visible(el)) return;
                const r = el.getBoundingClientRect();
                if (r.width < 44 || r.height < 44) {
                  small.push({ selector, label: (el.getAttribute("aria-label") || el.innerText || "").trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) });
                }
              });
            });
            return {
              overflowX: document.documentElement.scrollWidth - innerWidth,
              small: small.slice(0, 10),
              coarse: matchMedia("(pointer: coarse)").matches
            };
          })()`);
          assert(metrics.overflowX <= 1, `#/${route} desborda a ${viewport.label}: ${metrics.overflowX}px`);
          if (viewport.touch) {
            assertEq(metrics.coarse, true, `el viewport ${viewport.label} debe emular puntero grueso`);
            assertEq(metrics.small.length, 0, `#/${route} tiene controles <44 px a ${viewport.label}: ${JSON.stringify(metrics.small)}`);
          }
          results.push({ viewport: viewport.label, route, overflowX: metrics.overflowX, small: metrics.small.length });
        }
      }
      await resetViewport(page);
      return { results };
    },
    { severity: "alta", page, timeout: 180000 },
  );
}
