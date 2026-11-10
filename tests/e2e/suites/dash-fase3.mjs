/* © 2026 ZARCONT — Suites de Fase 3 del Study Dashboard (Agente 6).
 *
 * DASH-39 … DASH-44 se escriben contra `study-dashboard/docs/CONTRATOS-FASE3.md`
 * (§4 selectores, §6 criterios): glosario, datos para memorizar, trampas,
 * repaso relámpago y hoja de último día, más descubrimiento en Más/paleta/ruta
 * y layout en los seis viewports con controles de 44 px.
 *
 * Los selectores estables son los del contrato:
 *   section[data-ref-view="glosario|datos|trampas"],
 *   #ref-glosario-title / #ref-datos-title / #ref-trampas-title,
 *   [data-ref-loading], [data-ref-error], [data-ref-search], [data-ref-area],
 *   [data-ref-count], [data-ref-filter="pending"], [data-ref-progress],
 *   [data-ref-known-count], [data-ref-source], [data-ref-action="goto|known|more"],
 *   .ref-glossary-item[data-term-id], .ref-fact-item[data-fact-id],
 *   .ref-trap-item[data-warning-id],
 *   section[data-plan-view="relampago"], #plan-relampago-title,
 *   [data-quick-area], [data-quick-start], [data-quick-card], [data-quick-prompt],
 *   [data-quick-answer], [data-quick-reveal], [data-quick-rate],
 *   [data-quick-progress], [data-quick-score], [data-quick-restart],
 *   [data-quick-loading], [data-quick-error],
 *   section[data-plan-view="ultimo-dia"], #plan-lastday-title,
 *   [data-lastday-area], [data-lastday-print], [data-lastday-facts],
 *   [data-lastday-glossary], [data-lastday-traps],
 *   [data-lastday-loading], [data-lastday-error].
 *
 * No se marca PASS sin comprobar el comportamiento real. Si una vista aún no
 * está integrada, la prueba falla con «PENDIENTE DE INTEGRACIÓN (Fase 3)» y el
 * selector concreto; nunca se convierte en SKIP.
 */
import { assert, assertEq, assertIncludes } from "../lib/harness.mjs";
import { appURL, waitApp } from "../lib/apps.mjs";
import { sleep } from "../lib/cdp.mjs";

const PENDING = "PENDIENTE DE INTEGRACIÓN (Fase 3): ";
const VIEWPORT_DESKTOP = { width: 1440, height: 900 };
const VIEWPORT_MOBILE = { width: 390, height: 844 };
const CDP = (page) => page.conn;

const DERIVED = {
  glossary: /\/study-data\/derived\/glossary\.json/,
  facts: /\/study-data\/derived\/facts\.json/,
  warnings: /\/study-data\/derived\/warnings\.json/,
};

const REF_VIEWS = {
  glosario: {
    selector: 'section[data-ref-view="glosario"]',
    title: "#ref-glosario-title",
    label: "Glosario",
  },
  datos: {
    selector: 'section[data-ref-view="datos"]',
    title: "#ref-datos-title",
    label: "Datos para memorizar",
  },
  trampas: {
    selector: 'section[data-ref-view="trampas"]',
    title: "#ref-trampas-title",
    label: "Trampas frecuentes",
  },
};

const QUICK_VIEW = {
  selector: 'section[data-plan-view="relampago"]',
  title: "#plan-relampago-title",
  label: "Repaso relámpago",
};

const LASTDAY_VIEW = {
  selector: 'section[data-plan-view="ultimo-dia"]',
  title: "#plan-lastday-title",
  label: "Hoja de último día",
};

const PHASE3_ROUTES = [
  { hash: "#/glosario", ...REF_VIEWS.glosario },
  { hash: "#/datos", ...REF_VIEWS.datos },
  { hash: "#/trampas", ...REF_VIEWS.trampas },
  { hash: "#/relampago", ...QUICK_VIEW },
  { hash: "#/ultimo-dia", ...LASTDAY_VIEW },
];

const TOUCH_TARGETS = [
  "section[data-ref-view] button",
  "section[data-ref-view] input",
  "section[data-ref-view] select",
  "section[data-ref-view] [data-ref-action]",
  "section[data-plan-view='relampago'] button",
  "section[data-plan-view='relampago'] select",
  "section[data-plan-view='ultimo-dia'] button",
  "section[data-plan-view='ultimo-dia'] select",
];

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

async function gotoRoute(page, baseURL, hash, settle = 1000) {
  // Arranque en el panel y navegación de cliente: el router monta la ruta una
  // vez registrados todos los módulos. Se mide que el cambio de hash no recarga.
  await openDocument(page, appURL(baseURL, "dashboard") + "#/", 1100, { fresh: true });
  await waitApp(page, "dashboard");
  await sleep(220);
  const navigations = page.navCount();
  await page.eval(`location.hash = ${JSON.stringify(hash)}, true`);
  await page.waitFor(`location.hash === ${JSON.stringify(hash)}`, { timeout: 8000, message: `hash ${hash}` }).catch(() => {});
  await page.eval(`new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))`);
  await sleep(Math.max(320, settle - 700));
  assertEq(page.navCount(), navigations, `la navegación a ${hash} no debe recargar el documento`);
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
  await sleep(200);
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
  await sleep(320);
}

async function setSelectValue(page, selector, value) {
  const ok = await page.eval(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return false;
    el.value = ${JSON.stringify(value)};
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return el.value === ${JSON.stringify(value)};
  })()`);
  assert(ok, `no se pudo fijar ${selector} = ${value}`);
  await sleep(360);
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

async function waitVisible(page, selector, message, timeout = 12000) {
  await page.waitFor(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return false;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== "none" && s.visibility !== "hidden" && !el.hidden && r.width > 1 && r.height > 1;
  })()`, { timeout, message });
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function describe(page) {
  try {
    return await page.eval(`(() => {
      const root = document.getElementById("view-root");
      const ref = window.StudyReference;
      return JSON.stringify({
        hash: location.hash,
        title: document.title,
        ref: !!ref,
        states: ref ? { glossary: ref.state("glossary"), facts: ref.state("facts"), warnings: ref.state("warnings") } : null,
        views: Array.from(document.querySelectorAll("[data-ref-view], [data-plan-view]")).map((el) => el.getAttribute("data-ref-view") || ("plan:" + el.getAttribute("data-plan-view"))),
        text: root ? root.innerText.replace(/\\s+/g, " ").slice(0, 260) : ""
      });
    })()`);
  } catch {
    return "(sin estado)";
  }
}

async function waitPhase3View(page, view, timeout = 25000) {
  try {
    await page.waitFor(`!!document.querySelector(${JSON.stringify(view.selector)})`, {
      timeout,
      message: `vista ${view.label}`,
    });
  } catch (error) {
    throw new Error(`${PENDING}${view.label} no monta ${view.selector}. Estado: ${await describe(page)}`);
  }
  await page.waitFor(`(() => {
    const root = document.querySelector(${JSON.stringify(view.selector)});
    if (!root) return false;
    const title = root.querySelector(${JSON.stringify(view.title)});
    const loading = root.querySelector("[data-ref-loading], [data-quick-loading], [data-lastday-loading]");
    const visible = (el) => {
      if (!el) return false;
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== "none" && s.visibility !== "hidden" && !el.hidden && r.height > 1;
    };
    return !!title && !visible(loading);
  })()`, { timeout: timeout + 10000, message: `carga de ${view.label}` }).catch(async (error) => {
    throw new Error(`${PENDING}${view.label} montó pero no terminó de cargar (${error.message}). Estado: ${await describe(page)}`);
  });
  await sleep(200);
}

async function readDerivedRequests(page) {
  return page.eval(`(() => {
    const origin = location.origin;
    const entries = performance.getEntriesByType("resource")
      .filter((entry) => entry.name.indexOf(origin) === 0)
      .map((entry) => entry.name);
    const count = (re) => entries.filter((url) => re.test(url)).length;
    return {
      total: entries.filter((url) => /\\/study-data\\/derived\\/.*\\.json/.test(url)).length,
      glossary: count(${DERIVED.glossary}),
      facts: count(${DERIVED.facts}),
      warnings: count(${DERIVED.warnings})
    };
  })()`);
}

async function refState(page, kind) {
  return page.eval(`window.StudyReference ? window.StudyReference.state(${JSON.stringify(kind)}) : null`);
}

async function refEntries(page, kind) {
  return page.eval(`window.StudyReference ? window.StudyReference.entries(${JSON.stringify(kind)}).length : null`);
}

const STORE_SNAPSHOT = `(() => {
  const s = window.StudyStore;
  const state = (s && s.getState) ? (s.getState() || {}) : {};
  return {
    cards: JSON.stringify(state.cards || {}),
    flashSession: JSON.stringify(state.flashSession || {}),
    factsKnown: s && s.factsKnown ? s.factsKnown.listKnown() : [],
    plan: s && s.plan ? s.plan.get() : null
  };
})()`;

async function storeSnapshot(page) {
  return page.eval(STORE_SNAPSHOT);
}

async function clearFactsKnown(page) {
  await page.eval(`(() => {
    const s = window.StudyStore;
    if (!s || !s.factsKnown) return 0;
    const ids = s.factsKnown.listKnown();
    ids.forEach((id) => s.factsKnown.set(id, false));
    return ids.length;
  })()`);
  await sleep(220);
}

async function readBoot(page) {
  return page.eval(`(() => {
    const entries = performance.getEntriesByType("resource")
      .filter((entry) => entry.name.indexOf(location.origin) === 0)
      .map((entry) => entry.name);
    return {
      reference: !!window.StudyReference,
      derivedLoader: !!window.StudyDerived,
      derived: entries.filter((url) => /\\/study-data\\/derived\\/.*\\.json/.test(url)),
      refScript: entries.filter((url) => /\\/js\\/nav\\/reference\\.js/.test(url)).length
    };
  })()`);
}

/* ------------------------------------------------------------------ */
/* Suite                                                               */
/* ------------------------------------------------------------------ */

export async function runDashboardFase3({ h, page, baseURL }) {
  h.suite("Study Dashboard · Fase 3");
  h.state.app = "Study Dashboard";

  /* ---------------------------------------------------------------- */
  /* DASH-39 · Glosario: carga perezosa, búsqueda sin acentos y área  */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-39",
    "glosario: glossary.json solo en #/glosario, búsqueda sin acentos, filtro de área y enlace a ficha",
    async () => {
      await resetViewport(page);
      await openDocument(page, appURL(baseURL, "dashboard") + "#/", 1100, { fresh: true });
      await waitApp(page, "dashboard");
      const boot = await readBoot(page);
      assert(boot.reference, `${PENDING}index.html no carga js/nav/reference.js (window.StudyReference ausente).`);
      assertEq(boot.derived.length, 0, `ningún derivado debe pedirse al arrancar; se pidieron: ${boot.derived.join(", ")}`);

      await gotoRoute(page, baseURL, "#/glosario", 1200);
      await waitPhase3View(page, REF_VIEWS.glosario);
      assertEq(await refState(page, "glossary"), "ready", "StudyReference/glosario debe quedar en ready");

      const view = await page.eval(`(() => {
        const root = document.querySelector('section[data-ref-view="glosario"]');
        return {
          title: (document.querySelector("#ref-glosario-title") || {}).innerText || "",
          count: (document.querySelector("[data-ref-count]") || {}).innerText || "",
          items: document.querySelectorAll(".ref-glossary-item").length,
          areas: Array.from(document.querySelectorAll("[data-ref-area] option")).map((o) => ({ value: o.value, label: (o.textContent || "").trim() })),
          search: !!document.querySelector("[data-ref-search]"),
          firstLink: (document.querySelector('.ref-glossary-item [data-ref-action="goto"]') || {}).getAttribute ? document.querySelector('.ref-glossary-item [data-ref-action="goto"]').getAttribute("href") : null,
          terms: Array.from(document.querySelectorAll(".ref-glossary-item")).map((el) => el.innerText.replace(/\\s+/g, " ").trim())
        };
      })()`);
      const entries = await refEntries(page, "glossary");
      assertEquals(entries, 57, "el glosario debe tener las 57 entradas del derivado");
      assert(view.title.length > 3, "la vista debe tener h1 (#ref-glosario-title)");
      assert(view.items >= 50, `la vista debe listar el glosario (${view.items} visibles)`);
      assertIncludes(view.count, "57", "el contador [data-ref-count] debe reflejar 57");
      assert(view.search, "debe existir el buscador [data-ref-search]");
      assert(view.areas.filter((a) => a.value).length >= 2, "el filtro [data-ref-area] debe ofrecer las áreas del glosario");
      assert(view.firstLink && /^#\/ficha\//.test(view.firstLink), `el primer resultado debe enlazar su ficha: ${view.firstLink}`);

      const requests = await readDerivedRequests(page);
      assertEq(requests.glossary, 1, `glossary.json debe pedirse una vez en #/glosario: ${JSON.stringify(requests)}`);
      assertEq(requests.facts, 0, "facts.json no debe pedirse en el glosario");
      assertEq(requests.warnings, 0, "warnings.json no debe pedirse en el glosario");

      // Orden alfabético estable.
      const order = await page.eval(`(() => {
        const norm = (value) => String(value || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/\\s+/g, " ").trim();
        const terms = Array.from(document.querySelectorAll(".ref-glossary-item")).map((el) => {
          const term = el.querySelector(".ref-glossary-item-term, dt, strong, b");
          return norm(term ? term.innerText : el.innerText.split("\\n")[0]);
        });
        return { sorted: terms.every((value, i) => i === 0 || terms[i - 1] <= value), first: terms.slice(0, 4) };
      })()`);
      assert(order.sorted, `el glosario debe estar en orden alfabético estable: ${order.first.join(" · ")}`);

      // Búsqueda sin acentos: se busca el término sin tildes y debe aparecer.
      const target = await page.eval(`(() => {
        const list = window.StudyReference.entries("glossary");
        const item = list.find((entry) => /[\\u00c0-\\u017f]/.test(entry.term) && entry.term.length > 4) || list[0];
        return { term: item.term, plain: window.StudyReference.normalize(item.term) };
      })()`);
      await typeInto(page, "[data-ref-search]", target.plain);
      await page.waitFor(`(() => {
        const n = document.querySelectorAll(".ref-glossary-item").length;
        return n > 0 && n < ${view.items};
      })()`, { timeout: 8000, message: "resultados del glosario tras buscar sin acentos" });
      const filtered = await page.eval(`(() => ({
        items: document.querySelectorAll(".ref-glossary-item").length,
        count: (document.querySelector("[data-ref-count]") || {}).innerText || "",
        text: Array.from(document.querySelectorAll(".ref-glossary-item")).map((el) => el.innerText).join(" ")
      }))()`);
      assert(filtered.items > 0, `la búsqueda «${target.plain}» debe devolver resultados`);
      assert(filtered.items < view.items, "la búsqueda debe filtrar la lista");
      assertIncludes(normalize(filtered.text), normalize(target.plain), `los resultados de «${target.plain}» deben contener el término`);
      assertIncludes(filtered.count, String(filtered.items), "el contador debe actualizarse con el filtro");

      // Estado vacío con el término buscado.
      await typeInto(page, "[data-ref-search]", "zzzzqx");
      await page.waitFor(`document.querySelectorAll(".ref-glossary-item").length === 0`, { timeout: 8000, message: "estado vacío del glosario" });
      const empty = await page.eval(`(() => ({
        text: (document.querySelector('section[data-ref-view="glosario"]') || {}).innerText || "",
        count: (document.querySelector("[data-ref-count]") || {}).innerText || ""
      }))()`);
      assert(/zzzzqx|no hay|sin resultados|ning[uú]n/i.test(normalize(empty.text)), `el vacío debe explicar el término buscado: «${empty.text.slice(0, 200)}»`);
      assert(/^0|\b0\b/.test(empty.count) || /0/.test(empty.count), "el contador debe quedar en 0");
      await typeInto(page, "[data-ref-search]", "");

      // Filtro por área: el número pintado debe coincidir con StudyReference.filter.
      const areaBefore = await page.eval(`document.querySelectorAll(".ref-glossary-item").length`);
      const area = await page.eval(`(() => {
        const select = document.querySelector("[data-ref-area]");
        const option = Array.from(select.options).find((o) => o.value);
        select.value = option.value;
        select.dispatchEvent(new Event("input", { bubbles: true }));
        select.dispatchEvent(new Event("change", { bubbles: true }));
        return { value: option.value, label: (option.textContent || "").trim() };
      })()`);
      await sleep(400);
      const areaCheck = await page.eval(`(() => {
        const select = document.querySelector("[data-ref-area]");
        const entries = window.StudyReference.entries("glossary");
        return {
          rendered: document.querySelectorAll(".ref-glossary-item").length,
          expected: window.StudyReference.filter(entries, { areaId: select.value }).length,
          count: (document.querySelector("[data-ref-count]") || {}).innerText || ""
        };
      })()`);
      assert(areaCheck.expected > 0, `el área «${area.label}» debe tener entradas`);
      assertEq(areaCheck.rendered, areaCheck.expected, `el filtro de área debe pintar exactamente las entradas del área (${area.label})`);
      assertIncludes(areaCheck.count, String(areaCheck.expected), "el contador debe reflejar el filtro de área");
      assert(areaCheck.rendered <= areaBefore, "filtrar por área no debe aumentar la lista");

      // Enlace real a la ficha.
      await page.click('.ref-glossary-item [data-ref-action="goto"]', { index: 0 });
      await page.waitFor(`/^#\\/ficha\\//.test(location.hash)`, { timeout: 10000, message: "navegación del glosario a la ficha" });
      await page.waitFor(`!!document.querySelector("article.reader, [data-sheet-id]")`, { timeout: 10000, message: "ficha renderizada" }).catch(() => {});
      const landed = await page.eval(`({ hash: location.hash, title: document.title, reader: !!document.querySelector("article.reader, [data-sheet-id]") })`);
      assert(landed.hash.startsWith("#/ficha/"), `el enlace debe abrir la ficha: ${landed.hash}`);
      assert(landed.reader, "la ficha abierta debe tener lector");

      return {
        boot: { reference: boot.reference, derivedAtStartup: boot.derived, refScript: boot.refScript },
        entries,
        initialItems: view.items,
        areas: view.areas.filter((a) => a.value).length,
        search: { term: target.term, plain: target.plain, items: filtered.items },
        empty: empty.count,
        area: { ...area, ...areaCheck },
        landed: landed.hash,
      };
    },
    { severity: "alta", page, timeout: 150000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-40 · Datos: pendientes, marcar persistente, sin Flashcards  */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-40",
    "datos: facts.json solo en #/datos, pendientes, marcar/desmarcar persistente, progreso global y Flashcards intactas",
    async () => {
      await resetViewport(page);
      await openDocument(page, appURL(baseURL, "dashboard") + "#/", 1100, { fresh: true });
      await waitApp(page, "dashboard");
      const boot = await readBoot(page);
      assert(boot.reference, `${PENDING}index.html no carga js/nav/reference.js (window.StudyReference ausente).`);
      assertEq(boot.derived.length, 0, `ningún derivado debe pedirse al arrancar; se pidieron: ${boot.derived.join(", ")}`);
      await clearFactsKnown(page);

      await gotoRoute(page, baseURL, "#/datos", 1200);
      await waitPhase3View(page, REF_VIEWS.datos);
      assertEq(await refState(page, "facts"), "ready", "StudyReference/datos debe quedar en ready");
      assertEq(await refEntries(page, "facts"), 261, "facts.json debe aportar 261 datos");

      const requests = await readDerivedRequests(page);
      assertEq(requests.facts, 1, `facts.json debe pedirse una vez en #/datos: ${JSON.stringify(requests)}`);
      assertEq(requests.glossary, 0, "glossary.json no debe pedirse en datos");
      assertEq(requests.warnings, 0, "warnings.json no debe pedirse en datos");

      const initial = await page.eval(`(() => {
        const progress = document.querySelector("[data-ref-progress]");
        const known = document.querySelector("[data-ref-known-count]");
        return {
          title: (document.querySelector("#ref-datos-title") || {}).innerText || "",
          total: document.querySelectorAll(".ref-fact-item").length,
          progress: progress ? (progress.innerText || "").replace(/\\s+/g, " ").trim() : "",
          progressValue: progress ? [progress.getAttribute("aria-valuenow"), progress.getAttribute("aria-valuemax"), progress.getAttribute("aria-valuetext"), progress.value, progress.max].filter((v) => v != null).join(" ") : "",
          known: known ? known.innerText.replace(/\\s+/g, " ").trim() : "",
          filter: !!document.querySelector('[data-ref-filter="pending"]'),
          area: !!document.querySelector("[data-ref-area]"),
          knownCount: window.StudyStore.factsKnown.listKnown().length
        };
      })()`);
      assert(initial.title.length > 3, "la vista debe tener h1 (#ref-datos-title)");
      assertEq(initial.total, 261, "la vista debe listar los 261 datos");
      assert(initial.filter, "debe existir el filtro [data-ref-filter=\"pending\"]");
      assert(initial.area, "debe existir el filtro de área [data-ref-area]");
      assertIncludes(initial.progress + " " + initial.progressValue + " " + initial.known, "261", "el progreso debe declarar el total de 261 datos");
      assertEq(initial.knownCount, 0, "el progreso de QA debe empezar sin datos conocidos");

      const snapshotBefore = await storeSnapshot(page);

      // Filtro Solo pendientes con 0 conocidos: siguen los 261.
      await page.click('[data-ref-filter="pending"]');
      await sleep(450);
      const pendingAll = await page.eval(`(() => ({
        items: document.querySelectorAll(".ref-fact-item").length,
        pressed: document.querySelector('[data-ref-filter="pending"]').getAttribute("aria-pressed"),
        text: (document.querySelector('section[data-ref-view="datos"]') || {}).innerText.replace(/\\s+/g, " ").slice(0, 220)
      }))()`);
      assertEq(pendingAll.items, 261, "con 0 conocidos, el filtro pendientes debe mostrar los 261");

      // Marcar el primer dato: persiste, anuncia y actualiza el progreso global.
      const firstFact = await page.eval(`(() => {
        const item = document.querySelector(".ref-fact-item");
        if (!item) return null;
        return { id: item.getAttribute("data-fact-id"), term: (item.querySelector(".ref-fact-item-term, strong, b") || item).innerText.replace(/\\s+/g, " ").trim().slice(0, 60) };
      })()`);
      assert(firstFact && firstFact.id, "el primer .ref-fact-item debe declarar data-fact-id");
      await page.click('.ref-fact-item [data-ref-action="known"]', { index: 0 });
      await page.waitFor(`window.StudyStore.factsKnown.listKnown().length === 1`, { timeout: 6000, message: "marcar el primer dato" });
      await sleep(350);
      const marked = await page.eval(`(() => {
        const rec = window.StudyStore.factsKnown.get(${JSON.stringify(firstFact.id)});
        const progress = document.querySelector("[data-ref-progress]");
        const known = document.querySelector("[data-ref-known-count]");
        return {
          stored: !!rec && rec.known === true,
          items: document.querySelectorAll(".ref-fact-item").length,
          progressText: [progress ? progress.innerText : "", progress ? [progress.getAttribute("aria-valuenow"), progress.getAttribute("aria-valuemax"), progress.value, progress.max].filter((v) => v != null).join(" ") : "", known ? known.innerText : ""].join(" "),
          status: (document.querySelector("[role='status'], [data-ref-status]") || {}).innerText || ""
        };
      })()`);
      assert(marked.stored, "el dato marcado debe guardarse en StudyStore.factsKnown");
      assertEq(marked.items, 260, "con el filtro pendientes activo, el dato marcado debe salir de la lista");
      assertIncludes(marked.progressText, "1", "el progreso global debe subir a 1 conocido");
      assertIncludes(marked.progressText, "261", "el progreso debe seguir declarando el total de 261");

      // Desactivar pendientes y desmarcar por la UI.
      await page.click('[data-ref-filter="pending"]');
      await sleep(400);
      const allBack = await page.eval(`(() => ({
        items: document.querySelectorAll(".ref-fact-item").length,
        pressed: (document.querySelector('.ref-fact-item[data-fact-id="' + ${JSON.stringify(firstFact.id)} + '"] [data-ref-action="known"]') || {}).getAttribute ? document.querySelector('.ref-fact-item[data-fact-id="' + ${JSON.stringify(firstFact.id)} + '"] [data-ref-action="known"]').getAttribute("aria-pressed") : null
      }))()`);
      assertEq(allBack.items, 261, "al desactivar pendientes debe volver la lista completa");
      assertEq(allBack.pressed, "true", "al volver a la lista completa, el dato marcado debe conservar aria-pressed=true");
      await page.click(`.ref-fact-item[data-fact-id="${firstFact.id}"] [data-ref-action="known"]`);
      await page.waitFor(`window.StudyStore.factsKnown.listKnown().length === 0`, { timeout: 6000, message: "desmarcar el dato" });
      await sleep(300);
      const unmarked = await page.eval(`(() => {
        const progress = document.querySelector("[data-ref-progress]");
        return {
          pressed: document.querySelector('.ref-fact-item[data-fact-id="' + ${JSON.stringify(firstFact.id)} + '"] [data-ref-action="known"]').getAttribute("aria-pressed"),
          items: document.querySelectorAll(".ref-fact-item").length,
          progress: [progress ? progress.innerText : "", progress ? [progress.getAttribute("aria-valuenow"), progress.value, progress.max].filter((v) => v != null).join(" ") : "", ((document.querySelector("[data-ref-known-count]") || {}).innerText || "")].join(" ")
        };
      })()`);
      assertEq(unmarked.pressed, "false", "el botón desmarcado debe volver a aria-pressed=false");
      assertEq(unmarked.items, 261, "la lista completa debe seguir en 261");
      assert(/\b0\b/.test(unmarked.progress), `el progreso debe volver a 0 conocidos: «${unmarked.progress}»`);
      const snapshotAfter = await storeSnapshot(page);
      assertEq(snapshotAfter.cards, snapshotBefore.cards, "datos no debe tocar las tarjetas de Flashcards");
      assertEq(snapshotAfter.flashSession, snapshotBefore.flashSession, "datos no debe tocar la sesión de Flashcards");

      // Marcar de nuevo y comprobar persistencia tras recargar.
      await page.click('.ref-fact-item [data-ref-action="known"]', { index: 0 });
      await page.waitFor(`window.StudyStore.factsKnown.listKnown().length === 1`, { timeout: 6000, message: "marcar de nuevo" });
      await sleep(250);
      await gotoRoute(page, baseURL, "#/datos", 1200);
      await waitPhase3View(page, REF_VIEWS.datos);
      const persisted = await page.eval(`(() => {
        const rec = window.StudyStore.factsKnown.get(${JSON.stringify(firstFact.id)});
        const button = document.querySelector('.ref-fact-item[data-fact-id="' + ${JSON.stringify(firstFact.id)} + '"] [data-ref-action="known"]');
        const progress = document.querySelector("[data-ref-progress]");
        return {
          known: window.StudyStore.factsKnown.listKnown(),
          stored: !!rec && rec.known === true,
          pressed: button ? button.getAttribute("aria-pressed") : null,
          progress: [progress ? progress.innerText : "", progress ? [progress.getAttribute("aria-valuenow"), progress.value, progress.max].filter((v) => v != null).join(" ") : "", ((document.querySelector("[data-ref-known-count]") || {}).innerText || "")].join(" ")
        };
      })()`);
      assert(persisted.stored && persisted.known.includes(firstFact.id), "el dato marcado debe persistir tras recargar");
      assertEq(persisted.pressed, "true", "tras recargar, el botón debe recordar el estado marcado");
      assertIncludes(persisted.progress, "1", "tras recargar, el progreso debe seguir en 1");

      // Filtro por área: pintado exacto.
      const area = await page.eval(`(() => {
        const select = document.querySelector("[data-ref-area]");
        const option = Array.from(select.options).find((o) => o.value);
        select.value = option.value;
        select.dispatchEvent(new Event("input", { bubbles: true }));
        select.dispatchEvent(new Event("change", { bubbles: true }));
        return { value: option.value, label: (option.textContent || "").trim() };
      })()`);
      await sleep(450);
      const areaCheck = await page.eval(`(() => {
        const select = document.querySelector("[data-ref-area]");
        return {
          rendered: document.querySelectorAll(".ref-fact-item").length,
          expected: window.StudyReference.filter(window.StudyReference.entries("facts"), { areaId: select.value }).length
        };
      })()`);
      assert(areaCheck.expected > 0, `el área «${area.label}» debe tener datos`);
      assertEq(areaCheck.rendered, areaCheck.expected, "el filtro de área debe pintar exactamente los datos del área");

      // Limpieza: no dejar datos marcados para las pruebas siguientes.
      await page.eval(`window.StudyStore.factsKnown.listKnown().forEach((id) => window.StudyStore.factsKnown.set(id, false)), true`);
      await sleep(200);

      return {
        boot: { reference: boot.reference, derivedAtStartup: boot.derived },
        total: initial.total,
        known: { marked: marked.stored, pressed: marked.pressed, pendingItems: marked.items },
        unmarked: { pressed: unmarked.pressed, items: unmarked.items },
        persisted: { known: persisted.known.length, pressed: persisted.pressed },
        area: { ...area, ...areaCheck },
        flashcardsIntact: snapshotAfter.cards === snapshotBefore.cards && snapshotAfter.flashSession === snapshotBefore.flashSession,
      };
    },
    { severity: "alta", page, timeout: 180000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-41 · Trampas: fuentes, área, paginación y conteo            */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-41",
    "trampas: warnings.json solo en #/trampas, fuentes Aviso/Distinción, área, paginación de 40 y contador",
    async () => {
      await resetViewport(page);
      await openDocument(page, appURL(baseURL, "dashboard") + "#/", 1100, { fresh: true });
      await waitApp(page, "dashboard");
      const boot = await readBoot(page);
      assert(boot.reference, `${PENDING}index.html no carga js/nav/reference.js (window.StudyReference ausente).`);
      assertEq(boot.derived.length, 0, `ningún derivado debe pedirse al arrancar; se pidieron: ${boot.derived.join(", ")}`);

      await gotoRoute(page, baseURL, "#/trampas", 1200);
      await waitPhase3View(page, REF_VIEWS.trampas);
      assertEq(await refState(page, "warnings"), "ready", "StudyReference/trampas debe quedar en ready");
      assertEq(await refEntries(page, "warnings"), 451, "warnings.json debe aportar 451 avisos");

      const requests = await readDerivedRequests(page);
      assertEq(requests.warnings, 1, `warnings.json debe pedirse una vez en #/trampas: ${JSON.stringify(requests)}`);
      assertEq(requests.glossary, 0, "glossary.json no debe pedirse en trampas");
      assertEq(requests.facts, 0, "facts.json no debe pedirse en trampas");

      const initial = await page.eval(`(() => ({
        title: (document.querySelector("#ref-trampas-title") || {}).innerText || "",
        items: document.querySelectorAll(".ref-trap-item").length,
        count: (document.querySelector("[data-ref-count]") || {}).innerText || "",
        more: !!document.querySelector('[data-ref-action="more"]'),
        source: !!document.querySelector("[data-ref-source]"),
        sourceOptions: Array.from(document.querySelectorAll("[data-ref-source] option")).map((o) => ({ value: o.value, label: (o.textContent || "").trim() })),
        firstLink: (document.querySelector('.ref-trap-item a[href^="#/ficha/"]') || {}).getAttribute ? document.querySelector('.ref-trap-item a[href^="#/ficha/"]').getAttribute("href") : null,
        text: (document.querySelector('section[data-ref-view="trampas"]') || {}).innerText.replace(/\\s+/g, " ").slice(0, 260)
      }))()`);
      assert(initial.title.length > 3, "la vista debe tener h1 (#ref-trampas-title)");
      assertEq(initial.items, 40, "la primera página debe mostrar 40 trampas");
      assertIncludes(initial.count, "40", "el contador debe reflejar 40 visibles");
      assertIncludes(initial.count, "451", "el contador debe declarar el total de 451");
      assert(initial.more, "debe existir [data-ref-action=\"more\"]");
      assert(initial.source, "debe existir el filtro de fuente [data-ref-source]");
      const sourceLabels = initial.sourceOptions.map((o) => normalize(o.label)).join(" ");
      assertIncludes(sourceLabels, "aviso", "las fuentes deben etiquetar «Aviso»");
      assertIncludes(sourceLabels, "distincion", "las fuentes deben etiquetar «Distinción»");
      assert(initial.firstLink && initial.firstLink.startsWith("#/ficha/"), `cada trampa debe enlazar su ficha: ${initial.firstLink}`);

      // Paginación: +40 por clic.
      await page.click('[data-ref-action="more"]');
      await page.waitFor(`document.querySelectorAll(".ref-trap-item").length === 80`, { timeout: 8000, message: "primera página adicional de trampas" });
      assertIncludes(await page.eval(`(document.querySelector("[data-ref-count]") || {}).innerText || ""`), "80", "el contador debe subir a 80");
      await page.click('[data-ref-action="more"]');
      await page.waitFor(`document.querySelectorAll(".ref-trap-item").length === 120`, { timeout: 8000, message: "segunda página adicional de trampas" });
      const paged = await page.eval(`({ items: document.querySelectorAll(".ref-trap-item").length, count: (document.querySelector("[data-ref-count]") || {}).innerText || "" })`);
      assertEq(paged.items, 120, "la paginación debe mostrar 120 tras dos clics");
      assertIncludes(paged.count, "120", "el contador debe reflejar 120");

      // Filtro por fuente: el pintado coincide con StudyReference.filter (límite 40).
      const callout = await page.eval(`(() => {
        const select = document.querySelector("[data-ref-source]");
        select.value = "callout";
        select.dispatchEvent(new Event("input", { bubbles: true }));
        select.dispatchEvent(new Event("change", { bubbles: true }));
        return "callout";
      })()`);
      await sleep(450);
      const calloutCheck = await page.eval(`(() => {
        const entries = window.StudyReference.entries("warnings");
        const expected = Math.min(40, window.StudyReference.filter(entries, { source: "callout" }).length);
        return {
          rendered: document.querySelectorAll(".ref-trap-item").length,
          expected,
          labels: Array.from(document.querySelectorAll(".ref-trap-item")).slice(0, 5).map((el) => ({
            source: el.getAttribute("data-source") || el.getAttribute("data-ref-source") || "",
            text: el.innerText.replace(/\\s+/g, " ").slice(0, 60)
          }))
        };
      })()`);
      assert(calloutCheck.expected > 0, "debe haber trampas de tipo aviso");
      assertEq(calloutCheck.rendered, calloutCheck.expected, "el filtro Aviso debe pintar exactamente los avisos (máx. 40)");
      assert(calloutCheck.labels.every((item) => item.source === "callout" || /aviso/i.test(normalize(item.text))), `las tarjetas filtradas por Aviso deben etiquetarse como aviso: ${JSON.stringify(calloutCheck.labels)}`);

      // Filtro por área (con fuente «todas»).
      await page.eval(`(() => { const s = document.querySelector("[data-ref-source]"); s.value = ""; s.dispatchEvent(new Event("change", { bubbles: true })); return true; })()`);
      await sleep(350);
      const area = await page.eval(`(() => {
        const select = document.querySelector("[data-ref-area]");
        const option = Array.from(select.options).find((o) => o.value);
        select.value = option.value;
        select.dispatchEvent(new Event("input", { bubbles: true }));
        select.dispatchEvent(new Event("change", { bubbles: true }));
        return { value: option.value, label: (option.textContent || "").trim() };
      })()`);
      await sleep(450);
      const areaCheck = await page.eval(`(() => {
        const select = document.querySelector("[data-ref-area]");
        const expected = Math.min(40, window.StudyReference.filter(window.StudyReference.entries("warnings"), { areaId: select.value }).length);
        return { rendered: document.querySelectorAll(".ref-trap-item").length, expected };
      })()`);
      assert(areaCheck.expected > 0, `el área «${area.label}» debe tener trampas`);
      assertEq(areaCheck.rendered, areaCheck.expected, "el filtro de área debe pintar exactamente las trampas del área (máx. 40)");

      // Estado vacío.
      await typeInto(page, "[data-ref-search]", "zzzzqx");
      await page.waitFor(`document.querySelectorAll(".ref-trap-item").length === 0`, { timeout: 8000, message: "estado vacío de trampas" });
      const empty = await page.eval(`(() => ({
        text: (document.querySelector('section[data-ref-view="trampas"]') || {}).innerText.replace(/\\s+/g, " ").slice(0, 240),
        count: (document.querySelector("[data-ref-count]") || {}).innerText || ""
      }))()`);
      assert(/zzzzqx|no hay|sin resultados|ning[uú]n/i.test(normalize(empty.text)), `el vacío debe explicar la búsqueda: «${empty.text}»`);

      return {
        boot: { reference: boot.reference, derivedAtStartup: boot.derived },
        total: 451,
        firstPage: initial.items,
        paged,
        sources: initial.sourceOptions.map((o) => o.label),
        callout: calloutCheck,
        area: { ...area, ...areaCheck },
        empty: empty.count,
      };
    },
    { severity: "alta", page, timeout: 150000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-42 · Relámpago: carga, ronda de 10, revelar, puntuación     */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-42",
    "relámpago: carga tres derivados, ronda real de 10, revelar/calificar, puntuación, reinicio y sin persistencia",
    async () => {
      await resetViewport(page);
      await openDocument(page, appURL(baseURL, "dashboard") + "#/", 1100, { fresh: true });
      await waitApp(page, "dashboard");
      const boot = await readBoot(page);
      assert(boot.reference, `${PENDING}index.html no carga js/nav/reference.js (window.StudyReference ausente).`);
      assertEq(boot.derived.length, 0, `ningún derivado debe pedirse al arrancar; se pidieron: ${boot.derived.join(", ")}`);
      const before = await storeSnapshot(page);

      await gotoRoute(page, baseURL, "#/relampago", 1400);
      await waitPhase3View(page, QUICK_VIEW);
      for (const kind of ["facts", "glossary", "warnings"]) {
        assertEq(await refState(page, kind), "ready", `relámpago debe cargar "${kind}" desde datos reales`);
      }
      const requests = await readDerivedRequests(page);
      assertEq(requests.facts, 1, "relámpago debe pedir facts.json una vez");
      assertEq(requests.glossary, 1, "relámpago debe pedir glossary.json una vez");
      assertEq(requests.warnings, 1, "relámpago debe pedir warnings.json una vez");

      const start = await page.eval(`(() => ({
        title: (document.querySelector("#plan-relampago-title") || {}).innerText || "",
        start: !!document.querySelector("[data-quick-start]"),
        startText: (document.querySelector("[data-quick-start]") || {}).innerText || "",
        area: !!document.querySelector("[data-quick-area]"),
        card: !!document.querySelector("[data-quick-card]"),
        text: (document.querySelector('section[data-plan-view="relampago"]') || {}).innerText.replace(/\\s+/g, " ").slice(0, 320)
      }))()`);
      assert(start.title.length > 3, "la vista debe tener h1 (#plan-relampago-title)");
      assert(start.start, "debe existir [data-quick-start]");
      assertIncludes(start.startText, "10", "el botón debe anunciar la ronda de 10");
      assert(start.area, "debe existir el filtro de área [data-quick-area]");
      assertEq(start.card, false, "antes de empezar no debe haber tarjeta de ronda");

      await page.click("[data-quick-start]");
      await waitVisible(page, "[data-quick-card]", "tarjeta de la ronda");
      await page.waitFor(`((document.querySelector("[data-quick-prompt]") || {}).textContent || "").trim().length >= 2`, {
        timeout: 10000,
        message: "pregunta de la primera ronda",
      });
      await sleep(180);
      const first = await page.eval(`(() => ({
        prompt: (document.querySelector("[data-quick-prompt]") || {}).textContent || "",
        answerVisible: (() => { const a = document.querySelector("[data-quick-answer]"); if (!a) return false; const r = a.getBoundingClientRect(); return !a.hidden && r.height > 1; })(),
        reveal: !!document.querySelector("[data-quick-reveal]"),
        progress: (document.querySelector("[data-quick-progress]") || {}).textContent || document.querySelector("[data-quick-progress]")?.getAttribute("aria-valuenow") || "",
        focus: document.activeElement ? document.activeElement.getAttribute("data-quick-reveal") !== null || document.activeElement.matches("[data-quick-reveal]") : false
      }))()`);
      assert(first.prompt.trim().length >= 2, `la pregunta debe tener texto real: «${first.prompt}»`);
      assertEq(first.answerVisible, false, "la respuesta debe estar oculta antes de revelar");
      assert(first.reveal, "debe existir [data-quick-reveal]");
      assertIncludes(String(first.progress), "1", "el progreso debe empezar en la pregunta 1");
      assert(first.focus, "el foco debe ir al botón de revelar (contrato §4.4)");

      const promptSet = await page.eval(`(() => {
        const ref = window.StudyReference;
        const terms = ref.entries("facts").map((e) => e.term)
          .concat(ref.entries("glossary").map((e) => e.term))
          .concat(ref.entries("warnings").map((e) => e.title));
        return terms.filter((t) => t && t.length > 3);
      })()`);
      assert(
        promptSet.some((term) => normalize(first.prompt).includes(normalize(term))),
        `la pregunta debe construirse con un término real del temario: «${first.prompt}»`,
      );

      let knownCount = 0;
      let againCount = 0;
      let previousPrompt = first.prompt;
      for (let round = 1; round <= 10; round += 1) {
        await page.click("[data-quick-reveal]");
        await waitVisible(page, "[data-quick-answer]", `respuesta revelada en la ronda ${round}`);
        const revealed = await page.eval(`(() => ({
          answer: (document.querySelector("[data-quick-answer]") || {}).textContent || "",
          known: !!document.querySelector('[data-quick-rate="known"]'),
          again: !!document.querySelector('[data-quick-rate="again"]'),
          focusReveal: document.activeElement && document.activeElement.matches("[data-quick-reveal]")
        }))()`);
        assert(revealed.answer.trim().length > 4, `la respuesta revelada debe tener texto real (ronda ${round}): «${revealed.answer}»`);
        assert(revealed.known && revealed.again, `tras revelar deben existir los dos botones de calificación (ronda ${round})`);
        const rate = round % 2 === 0 ? "known" : "again";
        if (rate === "known") knownCount += 1;
        else againCount += 1;
        await page.click(`[data-quick-rate="${rate}"]`);
        if (round < 10) {
          await page.waitFor(`(() => {
            const progress = document.querySelector("[data-quick-progress]");
            const text = progress ? ((progress.textContent || "") + " " + (progress.getAttribute("aria-valuenow") || "")) : "";
            const prompt = document.querySelector("[data-quick-prompt]");
            return text.indexOf(${JSON.stringify(String(round + 1))}) !== -1 && !!prompt && (prompt.textContent || "").trim().length >= 2;
          })()`, { timeout: 10000, message: `progreso tras la ronda ${round}` }).catch(async (error) => {
            const state = await page.eval(`(() => ({
              progress: (document.querySelector("[data-quick-progress]") || {}).textContent || "",
              progressNow: (document.querySelector("[data-quick-progress]") || {}).getAttribute ? document.querySelector("[data-quick-progress]").getAttribute("aria-valuenow") : null,
              prompt: (document.querySelector("[data-quick-prompt]") || {}).textContent || "",
              stage: (document.querySelector('[data-plan-view="relampago"]') || {}).innerText ? document.querySelector('[data-plan-view="relampago"]').innerText.replace(/\\s+/g, " ").slice(0, 240) : "",
              state: (document.querySelector('[data-plan-view="relampago"]') || {}).getAttribute ? document.querySelector('[data-plan-view="relampago"]').getAttribute("data-plan-state") : null,
              score: !!document.querySelector("[data-quick-score]")
            }))()`);
            throw new Error(`${error.message} — estado: ${JSON.stringify(state)}`);
          });
          const next = await page.eval(`(() => ({
            prompt: (document.querySelector("[data-quick-prompt]") || {}).textContent || "",
            answerVisible: (() => { const a = document.querySelector("[data-quick-answer]"); if (!a) return false; const r = a.getBoundingClientRect(); return !a.hidden && r.height > 1; })(),
            progress: (document.querySelector("[data-quick-progress]") || {}).textContent || document.querySelector("[data-quick-progress]")?.getAttribute("aria-valuenow") || "",
            focus: document.activeElement && document.activeElement.matches("[data-quick-reveal]"),
            stage: ((document.querySelector("[data-quick-card]") || {}).textContent || "").replace(/\\s+/g, " ").slice(0, 160)
          }))()`);
          assert(next.prompt.trim().length >= 2, `debe haber una pregunta tras la ronda ${round}: «${next.stage}»`);
          assertEq(next.answerVisible, false, `la siguiente respuesta debe estar oculta (ronda ${round + 1})`);
          if (round === 1) assert(next.focus, "tras calificar, el foco debe volver al botón de revelar");
          previousPrompt = next.prompt;
        }
      }

      await waitVisible(page, "[data-quick-score]", "puntuación final de la ronda");
      const final = await page.eval(`(() => ({
        score: (document.querySelector("[data-quick-score]") || {}).textContent || "",
        restart: !!document.querySelector("[data-quick-restart]"),
        progress: (document.querySelector("[data-quick-progress]") || {}).textContent || ""
      }))()`);
      assert(final.restart, "al terminar debe existir [data-quick-restart]");
      assertIncludes(final.score, String(knownCount), `la puntuación debe reflejar ${knownCount} aciertos: «${final.score}»`);
      assertIncludes(final.score, "10", `la puntuación debe declarar el total de 10: «${final.score}»`);

      await page.click("[data-quick-restart]");
      await waitVisible(page, "[data-quick-card]", "tarjeta tras reiniciar");
      await page.waitFor(`(() => { const s = document.querySelector("[data-quick-score]"); return !s || s.hidden || s.getBoundingClientRect().height < 2; })()`, { timeout: 6000, message: "puntuación oculta tras reiniciar" });
      const restarted = await page.eval(`(() => ({
        prompt: (document.querySelector("[data-quick-prompt]") || {}).textContent || "",
        progress: (document.querySelector("[data-quick-progress]") || {}).textContent || document.querySelector("[data-quick-progress]")?.getAttribute("aria-valuenow") || "",
        answerVisible: (() => { const a = document.querySelector("[data-quick-answer]"); if (!a) return false; const r = a.getBoundingClientRect(); return !a.hidden && r.height > 1; })()
      }))()`);
      assert(restarted.prompt.trim().length >= 2, "tras reiniciar debe haber una pregunta nueva");
      assertIncludes(String(restarted.progress), "1", "el reinicio debe volver a la pregunta 1");
      assertEq(restarted.answerVisible, false, "el reinicio debe ocultar la respuesta");

      const after = await storeSnapshot(page);
      assertEq(after.cards, before.cards, "la ronda relámpago no debe crear ni modificar tarjetas");
      assertEq(after.flashSession, before.flashSession, "la ronda relámpago no debe tocar la sesión de Flashcards");
      assertEq(after.factsKnown.join(","), before.factsKnown.join(","), "la ronda relámpago no debe marcar datos como conocidos");

      return {
        boot: { reference: boot.reference, derivedAtStartup: boot.derived },
        requests,
        start: { button: start.startText.trim(), cardBefore: start.card },
        first: { prompt: first.prompt.slice(0, 120), answerHidden: !first.answerVisible, focus: first.focus },
        round: { known: knownCount, again: againCount, score: final.score.trim(), restart: final.restart },
        restarted: { prompt: restarted.prompt.slice(0, 90), progress: String(restarted.progress) },
        flashcardsIntact: after.cards === before.cards && after.flashSession === before.flashSession,
      };
    },
    { severity: "alta", page, timeout: 240000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-43 · Último día: tres bloques, área, print y plan           */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-43",
    "último día: tres derivados, tres bloques, área, impresión, enlace a #/plan sin plan y sin crear plan",
    async () => {
      await resetViewport(page);
      await openDocument(page, appURL(baseURL, "dashboard") + "#/", 1100, { fresh: true });
      await waitApp(page, "dashboard");
      const boot = await readBoot(page);
      assert(boot.reference, `${PENDING}index.html no carga js/nav/reference.js (window.StudyReference ausente).`);
      assertEq(boot.derived.length, 0, `ningún derivado debe pedirse al arrancar; se pidieron: ${boot.derived.join(", ")}`);

      const examDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
      const examParts = examDate.split("-");
      const examDayMonth = `${examParts[2]}/${examParts[1]}`;
      const examMonthName = new Date(examDate + "T12:00:00").toLocaleDateString("es-PE", { month: "long" });
      const examMonthShort = new Date(examDate + "T12:00:00").toLocaleDateString("es-PE", { month: "short" }).replace(/\.$/, "");
      const saved = await page.eval(`(() => {
        const plan = window.StudyStore.plan.save({ examDate: ${JSON.stringify(examDate)}, minutesPerDay: 45, daysPerWeek: 6, areaPriority: {} });
        return plan ? { ok: true, examDate: plan.examDate } : { ok: false };
      })()`);
      assert(saved.ok, "el plan de prueba debe guardarse para la hoja de último día");

      await gotoRoute(page, baseURL, "#/ultimo-dia", 1400);
      await waitPhase3View(page, LASTDAY_VIEW);
      for (const kind of ["facts", "glossary", "warnings"]) {
        assertEq(await refState(page, kind), "ready", `último día debe cargar "${kind}" desde datos reales`);
      }
      const requests = await readDerivedRequests(page);
      assertEq(requests.facts, 1, "último día debe pedir facts.json una vez");
      assertEq(requests.glossary, 1, "último día debe pedir glossary.json una vez");
      assertEq(requests.warnings, 1, "último día debe pedir warnings.json una vez");

      const view = await page.eval(`(() => {
        const root = document.querySelector('section[data-plan-view="ultimo-dia"]');
        const blocks = {
          facts: document.querySelector("[data-lastday-facts]"),
          glossary: document.querySelector("[data-lastday-glossary]"),
          traps: document.querySelector("[data-lastday-traps]")
        };
        const read = (el) => el ? {
          text: el.innerText.replace(/\\s+/g, " ").trim(),
          items: el.querySelectorAll("li, dt, .plan-lastday-item, article, [data-lastday-item]").length,
          links: el.querySelectorAll('a[href^="#/ficha/"]').length
        } : null;
        return {
          title: (document.querySelector("#plan-lastday-title") || {}).innerText || "",
          rootText: root.innerText.replace(/\\s+/g, " ").slice(0, 500),
          examText: (document.querySelector("[data-lastday-exam]") || {}).innerText || "",
          print: !!document.querySelector("[data-lastday-print]"),
          area: !!document.querySelector("[data-lastday-area]"),
          planLink: !!document.querySelector('[data-plan-view="ultimo-dia"] a[href="#/plan"]'),
          blocks: { facts: read(blocks.facts), glossary: read(blocks.glossary), traps: read(blocks.traps) }
        };
      })()`);
      assert(view.title.length > 3, "la vista debe tener h1 (#plan-lastday-title)");
      assert(view.print, "debe existir [data-lastday-print]");
      assert(view.area, "debe existir el filtro de área [data-lastday-area]");
      const examText = view.examText || view.rootText;
      assert(/d[ií]as/i.test(normalize(examText)), `con plan, la hoja debe declarar los días restantes: «${examText}»`);
      assert(/(29|30|31)/.test(examText), `con examen a 30 días, la hoja debe mostrar el conteo real: «${examText}»`);
      assert(
        normalize(examText).includes(normalize(examMonthName)) ||
          normalize(examText).includes(normalize(examMonthShort)) ||
          examText.includes(examDayMonth) ||
          examText.includes(examDate),
        `la hoja debe mostrar la fecha real del examen (${examDate}): «${examText}»`,
      );
      for (const [name, block] of Object.entries(view.blocks)) {
        assert(block, `debe existir el bloque [data-lastday-${name}]`);
        assert(block.text.length > 40, `el bloque ${name} debe tener contenido real: «${block.text.slice(0, 120)}»`);
        assert(block.items >= 1, `el bloque ${name} debe listar elementos`);
      }

      // Filtro por área: cambia el contenido sin romper.
      const area = await page.eval(`(() => {
        const select = document.querySelector("[data-lastday-area]");
        const option = Array.from(select.options).find((o) => o.value);
        const before = ["[data-lastday-facts]", "[data-lastday-glossary]", "[data-lastday-traps]"].map((sel) => document.querySelector(sel).innerText);
        select.value = option.value;
        select.dispatchEvent(new Event("input", { bubbles: true }));
        select.dispatchEvent(new Event("change", { bubbles: true }));
        return { value: option.value, label: (option.textContent || "").trim(), before };
      })()`);
      await sleep(500);
      const areaAfter = await page.eval(`(() => ["[data-lastday-facts]", "[data-lastday-glossary]", "[data-lastday-traps]"].map((sel) => document.querySelector(sel).innerText))()`);
      assert(areaAfter.some((text, index) => text !== area.before[index]), "filtrar por área debe cambiar al menos un bloque de la hoja");

      // Impresión: window.print se invoca y @media print oculta el chrome.
      await page.eval(`window.__qaPrint = 0; window.print = () => { window.__qaPrint += 1; }; true`);
      await page.click("[data-lastday-print]");
      await sleep(300);
      const printCalls = await page.eval(`window.__qaPrint`);
      assertEq(printCalls, 1, "el botón de impresión debe llamar a window.print() una vez");
      await CDP(page).send("Emulation.setEmulatedMedia", { media: "print" });
      await sleep(350);
      const printMedia = await page.eval(`(() => {
        const appbar = document.querySelector(".s-appbar");
        const footer = document.querySelector(".s-footer, footer");
        const view = document.querySelector('section[data-plan-view="ultimo-dia"]');
        const vis = (el) => { if (!el) return false; const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== "none" && s.visibility !== "hidden" && r.height > 1; };
        return { appbarVisible: vis(appbar), footerVisible: vis(footer), viewVisible: vis(view) };
      })()`);
      await CDP(page).send("Emulation.setEmulatedMedia", { media: "" });
      await sleep(250);
      assertEq(printMedia.appbarVisible, false, "en impresión debe ocultarse la appbar");
      assertEq(printMedia.viewVisible, true, "en impresión la hoja debe seguir visible");

      // Sin plan: enlace al editor, sin inventar plan y sin crearlo.
      await page.eval(`window.StudyStore.plan.remove(), true`);
      await gotoRoute(page, baseURL, "#/ultimo-dia", 1400);
      await waitPhase3View(page, LASTDAY_VIEW);
      const noPlan = await page.eval(`(() => {
        const view = document.querySelector('section[data-plan-view="ultimo-dia"]');
        const links = Array.from(view.querySelectorAll('a[href="#/plan"]')).filter((a) => a.getBoundingClientRect().height > 1);
        return {
          planLinks: links.length,
          text: view.innerText.replace(/\\s+/g, " ").slice(0, 300),
          plan: window.StudyStore.plan.get(),
          blocksPresent: ["[data-lastday-facts]", "[data-lastday-glossary]", "[data-lastday-traps]"].every((sel) => !!view.querySelector(sel))
        };
      })()`);
      assert(noPlan.planLinks >= 1, "sin plan, la hoja debe enlazar a #/plan");
      assert(/sin plan|no hay plan|configura|crear plan/i.test(normalize(noPlan.text)), `sin plan, debe explicarlo: «${noPlan.text}»`);
      assertEq(noPlan.plan, null, "la hoja no debe crear ni guardar un plan");
      assert(noPlan.blocksPresent, "sin plan, los tres bloques deben seguir presentes");

      return {
        boot: { reference: boot.reference, derivedAtStartup: boot.derived },
        requests,
        blocks: Object.fromEntries(Object.entries(view.blocks).map(([key, block]) => [key, { items: block.items, links: block.links, chars: block.text.length }])),
        area: { value: area.value, label: area.label, changed: true },
        print: { calls: printCalls, ...printMedia },
        noPlan: { links: noPlan.planLinks, plan: noPlan.plan, blocks: noPlan.blocksPresent },
      };
    },
    { severity: "alta", page, timeout: 240000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-44 · Más/paleta/ruta, seis viewports y 44 px                */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-44",
    "descubrimiento (Más, Ctrl+K, franja de #/ruta) y las cinco rutas en 6 viewports sin overflow ni controles <44 px",
    async () => {
      await setViewport(page, VIEWPORT_MOBILE, { touch: true });
      await openDocument(page, appURL(baseURL, "dashboard") + "#/", 1100, { fresh: true });
      await waitApp(page, "dashboard");

      const appbar = await page.eval(`(() => Array.from(document.querySelectorAll(".s-appbar a, .s-appbar button"))
        .filter((el) => !el.closest(".dash-more-panel"))
        .filter((el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== "none" && s.visibility !== "hidden" && r.width > 1; })
        .map((el) => (el.getAttribute("aria-label") || el.innerText || "").trim().slice(0, 40)))()`);
      assertEq(appbar.length, 5, `la appbar móvil debe seguir con 5 controles: ${JSON.stringify(appbar)}`);

      // Más → Última hora (los cinco enlaces).
      await page.click('[data-action="more-open"]');
      await waitVisible(page, "#dash-more-panel .dash-more-item", "panel Más abierto");
      const more = await page.eval(`(() => {
        const panel = document.getElementById("dash-more-panel");
        const links = Array.from(panel.querySelectorAll("a[href]")).map((a) => ({ href: a.getAttribute("href"), text: (a.innerText || "").replace(/\\s+/g, " ").trim().slice(0, 60) }));
        return { links, labels: Array.from(panel.querySelectorAll(".dash-more-label")).map((el) => el.innerText.trim()), open: !panel.hidden };
      })()`);
      assert(more.open, "el panel Más debe abrirse");
      for (const hash of ["#/relampago", "#/ultimo-dia", "#/glosario", "#/datos", "#/trampas"]) {
        assert(more.links.some((link) => link.href === hash), `Más debe enlazar ${hash}: ${JSON.stringify(more.links)}`);
      }
      assert(
        more.labels.some((label) => /última hora|ultima hora/i.test(label)) || more.labels.length >= 2,
        `Más debe agrupar las cinco vistas (o dos grupos equivalentes): ${JSON.stringify(more.labels)}`,
      );

      // Clic real desde Más a una ruta.
      await page.click(`#dash-more-panel a[href="#/trampas"]`);
      await page.waitFor(`location.hash === "#/trampas"`, { timeout: 10000, message: "Más navega sin recargar" });
      await waitPhase3View(page, REF_VIEWS.trampas);

      // Paleta Ctrl+K: cada vista se encuentra escribiendo su nombre.
      await gotoRoute(page, baseURL, "#/", 1000);
      await page.eval(`document.activeElement && document.activeElement.blur(), true`);
      await pressCtrlK(page);
      await waitVisible(page, ".navx-palette-layer[data-state='open']", "paleta abierta");
      const paletteLabels = [];
      for (const label of ["Glosario", "Datos para memorizar", "Trampas frecuentes", "Repaso relámpago", "Hoja de último día"]) {
        await typeInto(page, ".navx-palette-input", label);
        await page.waitFor(`(() => Array.from(document.querySelectorAll(".navx-palette-option-label")).some((el) => ${JSON.stringify(normalize(label))} === (el.innerText || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").trim()))()`, { timeout: 6000, message: `paleta con «${label}»` });
        paletteLabels.push(label);
      }
      await typeInto(page, ".navx-palette-input", "glosario");
      await page.waitFor(`document.querySelectorAll(".navx-palette-option").length > 0`, { timeout: 5000, message: "opción Glosario en la paleta" });
      const paletteMark = await page.eval(`(() => {
        const norm = (value) => String(value || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/\\s+/g, " ").trim();
        const option = Array.from(document.querySelectorAll(".navx-palette-option")).find((el) => {
          const label = el.querySelector(".navx-palette-option-label");
          return label && norm(label.innerText) === "glosario";
        });
        if (!option) return false;
        option.setAttribute("data-qa-mark", "palette-glosario");
        return true;
      })()`);
      assert(paletteMark, "la paleta debe ofrecer la opción Glosario");
      const navBefore = page.navCount();
      await page.click('[data-qa-mark="palette-glosario"]');
      await page.waitFor(`location.hash === "#/glosario"`, { timeout: 10000, message: "la paleta navega a #/glosario" });
      await waitPhase3View(page, REF_VIEWS.glosario);
      assertEq(page.navCount(), navBefore, "la paleta no debe recargar el documento");

      // Franja «Antes del examen» en #/ruta.
      await gotoRoute(page, baseURL, "#/ruta", 1300);
      await waitPhase3View(
        page,
        { selector: 'section[data-plan-view="ruta"]', title: "#plan-ruta-title", label: "Ruta de hoy" },
        30000,
      );
      const strip = await page.eval(`(() => {
        const visible = (el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== "none" && s.visibility !== "hidden" && r.width > 1 && r.height > 1; };
        const before = document.querySelector("[data-plan-before]");
        const links = before ? Array.from(before.querySelectorAll('a[href="#/relampago"], a[href="#/ultimo-dia"]')).filter(visible) : [];
        return {
          links: links.map((a) => a.getAttribute("href")),
          text: before ? before.innerText.replace(/\\s+/g, " ").trim() : "",
          visible: links.length
        };
      })()`);
      assert(strip.links.includes("#/relampago"), `#/ruta debe enlazar #/relampago: ${JSON.stringify(strip.links)}`);
      assert(strip.links.includes("#/ultimo-dia"), `#/ruta debe enlazar #/ultimo-dia: ${JSON.stringify(strip.links)}`);
      assert(/antes del examen/i.test(normalize(strip.text)), `#/ruta debe rotular la franja «Antes del examen»: «${strip.text}»`);
      const stripMark = await page.eval(`(() => {
        const visible = (el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== "none" && s.visibility !== "hidden" && r.width > 1 && r.height > 1; };
        const link = Array.from(document.querySelectorAll("[data-plan-before] a[href='#/relampago']")).find(visible);
        if (!link) return false;
        link.setAttribute("data-qa-mark", "strip-relampago");
        return true;
      })()`);
      assert(stripMark, "debe existir un enlace visible a #/relampago en la ruta");
      await page.click('[data-qa-mark="strip-relampago"]');
      await page.waitFor(`location.hash === "#/relampago"`, { timeout: 10000, message: "la franja navega a #/relampago" });

      // Matriz de layout: 5 rutas × 6 viewports.
      const viewports = [
        { id: "1440x900", width: 1440, height: 900, mobile: false },
        { id: "390x844", width: 390, height: 844, mobile: true },
        { id: "360x800", width: 360, height: 800, mobile: true },
        { id: "768x1024", width: 768, height: 1024, mobile: false },
        { id: "1024x768", width: 1024, height: 768, mobile: false },
        { id: "844x390", width: 844, height: 390, mobile: true, landscape: true },
      ];
      const measured = [];
      for (const viewport of viewports) {
        await setViewport(page, viewport, { touch: viewport.mobile, landscape: !!viewport.landscape });
        for (const route of PHASE3_ROUTES) {
          await gotoRoute(page, baseURL, route.hash, viewport.mobile ? 900 : 750);
          try {
            await waitPhase3View(page, route, 20000);
          } catch (error) {
            const diagnostics = await page.eval(`(() => ({
              hash: location.hash,
              title: document.title,
              scripts: Array.from(document.querySelectorAll("script[src]")).map((s) => s.getAttribute("src")).filter((src) => /relampago|lastday|reference|glossary|facts|traps/.test(src)),
              registered: {
                lastday: !!(window.StudyPlanLastDay && window.StudyPlanLastDay.__registered),
                relampago: !!(window.StudyPlanRelampago && window.StudyPlanRelampago.__registered),
                glossary: !!(window.StudyGlossary && window.StudyGlossary.__registered),
                facts: !!(window.StudyFacts && window.StudyFacts.__registered),
                traps: !!(window.StudyTraps && window.StudyTraps.__registered)
              }
            }))()`);
            throw new Error(`[${viewport.id}] ${route.hash}: ${error.message} — ${JSON.stringify(diagnostics)}`);
          }
          const metrics = await page.eval(`(() => {
            const doc = document.documentElement;
            const visible = (el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== "none" && s.visibility !== "hidden" && !el.hidden && r.width > 1 && r.height > 1; };
            const small = [];
            for (const selector of ${JSON.stringify(TOUCH_TARGETS)}) {
              for (const el of document.querySelectorAll(selector)) {
                if (!visible(el)) continue;
                const r = el.getBoundingClientRect();
                const w = Math.round(r.width), h = Math.round(r.height);
                if (w >= 44 && h >= 44) continue;
                small.push({ selector, label: ((el.getAttribute("aria-label") || el.innerText || "").replace(/\\s+/g, " ").trim()).slice(0, 60), w, h });
              }
            }
            const appbar = Array.from(document.querySelectorAll(".s-appbar a, .s-appbar button"))
              .filter((el) => !el.closest(".dash-more-panel")).filter(visible).length;
            return { overflowX: doc.scrollWidth - innerWidth, small: small.slice(0, 12), appbar, coarse: matchMedia("(pointer: coarse)").matches };
          })()`);
          measured.push({ viewport: viewport.id, hash: route.hash, ...metrics });
          assert(metrics.overflowX <= 1, `${route.hash} en ${viewport.id} desborda ${metrics.overflowX}px`);
          if (viewport.mobile) {
            assertEq(metrics.appbar, 5, `${route.hash} en ${viewport.id} debe mantener 5 controles en la appbar`);
            assertEq(metrics.small.length, 0, `${route.hash} en ${viewport.id} tiene controles <44 px: ${JSON.stringify(metrics.small)}`);
          }
        }
      }
      await resetViewport(page);

      return {
        appbar: appbar.length,
        more: more.links.map((link) => link.href),
        moreLabels: more.labels,
        palette: paletteLabels,
        paletteNav: { hash: "#/glosario", navigations: "sin recarga" },
        strip: strip.links,
        layout: {
          viewports: viewports.length,
          routes: PHASE3_ROUTES.length,
          shots: measured.length,
          overflow: measured.filter((item) => item.overflowX > 1).length,
          smallTargets: measured.reduce((total, item) => total + item.small.length, 0),
        },
      };
    },
    { severity: "alta", page, timeout: 360000 },
  );
}

/* Pequeño alias para mensajes de igualdad numérica con contexto. */
function assertEquals(actual, expected, message) {
  assertEq(actual, expected, message);
}
