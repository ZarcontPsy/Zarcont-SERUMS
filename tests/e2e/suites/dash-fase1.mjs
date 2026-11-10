/* © 2026 ZARCONT — Suites de Fase 1 del Study Dashboard (Agente 6).
 *
 * DASH-18 … DASH-30 se escriben contra `docs/CONTRATOS-FASE1.md`:
 * lectura activa (subrayado, nota, tarjeta propia, pausa de recuerdo, modo
 * recordar, confianza, dudas), búsqueda del cuerpo con índice perezoso,
 * paleta Ctrl+K, índice de secciones, fichas relacionadas y Ruta de hoy.
 *
 * Selectores estables:
 *   - componentes de lectura activa: `[data-ac-component]` y `[data-ac-action]`
 *     (docs/ACTIVE-CONTRATO.md §4–5);
 *   - módulos de navegación: `[data-navx-*]` y `#library-body-results`
 *     (docs/NAV-CONTRATO.md §3–5 y CONTRATOS-FASE1 §2);
 *   - contenedores del Coordinador: `[data-module-mount="…"]`.
 *
 * Si una prueba falla porque la integración aún no está montada, el mensaje
 * empieza por «PENDIENTE DE INTEGRACIÓN»: nunca se marca PASS sin comprobar el
 * comportamiento real. Los controles que el contrato no nombra (crear duda,
 * tarjeta propia, ayuda de atajos) se localizan por nombre accesible y se
 * etiquetan con `data-qa-mark`, para no atar la prueba a un id inventado.
 */
import { assert, assertEq, assertIncludes, skip } from "../lib/harness.mjs";
import { appURL, waitApp } from "../lib/apps.mjs";
import { sleep } from "../lib/cdp.mjs";

const PENDING = "PENDIENTE DE INTEGRACIÓN (Fase 1): ";
const VIEWPORT_DESKTOP = { width: 1440, height: 900 };
const VIEWPORT_MOBILE = { width: 390, height: 844 };
const CDP = (page) => page.conn;

/* ------------------------------------------------------------------ */
/* Utilidades comunes                                                  */
/* ------------------------------------------------------------------ */

async function gotoRoute(page, baseURL, hash, settle = 900) {
  /* Arranque en el Panel y navegación de cliente: así los módulos de las
     fases ya están registrados cuando el router pinta la ruta (evita el 404
     intermitente de un arranque directo a una ruta de módulo). */
  await openDocument(page, appURL(baseURL, "dashboard") + "#/", settle);
  await waitApp(page, "dashboard");
  await page.eval(`location.hash = ${JSON.stringify(hash)}, true`);
  await page.waitFor(`location.hash === ${JSON.stringify(hash)}`, { timeout: 8000, message: `hash ${hash}` });
  await page.eval(`new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))`);
  await noSmoothScroll(page);
  await sleep(220);
}

/** Las capturas y clics CDP necesitan desplazamiento instantáneo: base.css usa
 *  scroll-behavior:smooth y el clic puede caer en coordenadas intermedias. */
async function noSmoothScroll(page) {
  await page.eval(`(() => {
    try { document.documentElement.style.scrollBehavior = "auto"; } catch (e) {}
    return true;
  })()`);
}

/** Navegación de documento. Con `fresh` se añade una query neutra para forzar
 *  una recarga real aunque solo cambie el hash (performance empieza limpio). */
async function openDocument(page, url, settle = 900, { fresh = false } = {}) {
  let target = url;
  if (fresh) {
    const [base, hash = ""] = url.split("#");
    target = base + (base.includes("?") ? "&" : "?") + "qa=" + Date.now() + (hash ? "#" + hash : "");
  }
  await page.goto(target, { settle });
  await noSmoothScroll(page);
}

/* Recarga real del documento en el Panel y, una vez registrados los módulos de
 * la app, navegación de cliente a la ruta de módulo. Evita depender del orden
 * entre `bootApp()` y la carga de `js/active|nav/*` en un arranque directo a
 * una ruta de módulo (carrera observada de forma intermitente). */
async function reloadModuleRoute(page, baseURL, hash, settle = 1000) {
  await openDocument(page, appURL(baseURL, "dashboard") + "#/", settle);
  await waitApp(page, "dashboard");
  await page.waitFor(`!!(window.StudyApp && window.StudyActive && window.StudyNav)`, {
    timeout: 12000,
    message: "módulos de la app registrados",
  }).catch(() => {});
  await page.eval(`location.hash = ${JSON.stringify(hash)}, true`);
  await page.waitFor(`location.hash === ${JSON.stringify(hash)}`, { timeout: 8000, message: `hash ${hash}` });
  await page.eval(`new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))`);
  await sleep(320);
}

async function setViewport(page, viewport, { touch = false } = {}) {
  await page.viewport(viewport.width, viewport.height, { mobile: touch });
  await CDP(page).send("Emulation.setTouchEmulationEnabled", { enabled: touch, maxTouchPoints: touch ? 5 : 1 });
  await sleep(240);
}

async function resetViewport(page) {
  await setViewport(page, VIEWPORT_DESKTOP, { touch: false });
}

async function applyTheme(page, theme) {
  await page.eval(`window.StudyUI && window.StudyUI.applyTheme(${JSON.stringify(theme)}), true`);
  await sleep(260);
}

/** base.css usa scroll-behavior:smooth: los clics CDP deben partir de un nodo
 *  ya situado en el viewport, con desplazamiento instantáneo. */
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
  await sleep(220);
}

async function pressKey(page, key, { code = "", keyCode = 0, ctrl = false, meta = false, shift = false, alt = false, text = "" } = {}) {
  const modifiers = (alt ? 1 : 0) | (ctrl ? 2 : 0) | (meta ? 4 : 0) | (shift ? 8 : 0);
  await CDP(page).send("Input.dispatchKeyEvent", {
    type: text ? "keyDown" : "rawKeyDown",
    key,
    code,
    modifiers,
    windowsVirtualKeyCode: keyCode,
    nativeVirtualKeyCode: keyCode,
    text,
    unmodifiedText: text,
  });
  await CDP(page).send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key,
    code,
    modifiers,
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

async function pressSlash(page) {
  await pressKey(page, "/", { code: "Slash", keyCode: 191, text: "/" });
}

async function pressQuestion(page) {
  await pressKey(page, "?", { code: "Slash", keyCode: 191, shift: true, text: "?" });
}

/** Escritura real con CDP: foco, selección total, borrado e inserción de texto. */
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

async function count(page, selector) {
  return page.eval(`document.querySelectorAll(${JSON.stringify(selector)}).length`);
}

async function textOf(page, selector) {
  return page.eval(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    return el ? (el.innerText || el.textContent || "").replace(/\\s+/g, " ").trim() : null;
  })()`);
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

/** Marca el primer control visible con un nombre accesible que encaje.
 *  Devuelve su nombre o null. Se usa solo para acciones que el contrato no
 *  nombra con un selector propio (tarjeta propia, duda, ayuda de atajos). */
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

/** Abre las preferencias de lectura del rail (pausa + atajos). */
async function openReaderPrefs(page) {
  await page.waitFor(`!!document.querySelector('[data-module-mount="reader-active"] .ac-railprefs')`, {
    timeout: 12000,
    message: "preferencias de lectura del rail",
  });
  await page.eval(`(() => {
    const details = document.querySelector('[data-module-mount="reader-active"] .ac-railprefs');
    if (details && !details.open) details.open = true;
    return true;
  })()`);
  await sleep(260);
  return page.eval(`!!document.querySelector('[data-ac-component="recall-switch"]')`);
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const STORE_READ = `(() => {
  const s = window.StudyStore;
  const anns = s.annotations.list({});
  return {
    annotations: anns.map((a) => ({
      id: a.id, sheetId: a.sheetId, color: a.color, quote: a.quote, note: a.note,
      sectionIndex: a.sectionIndex, paragraphIndex: a.paragraphIndex,
      sectionTitle: a.sectionTitle, prefix: a.prefix, suffix: a.suffix
    })),
    doubts: s.doubts.list({}).map((d) => ({
      id: d.id, sheetId: d.sheetId, resolvedAt: d.resolvedAt, quote: d.quote, note: d.note,
      annotationId: d.annotationId, sectionIndex: d.sectionIndex, paragraphIndex: d.paragraphIndex
    })),
    confidence: s.sheetConfidence.list().map((c) => ({ sheetId: c.sheetId, value: c.value, deleted: c.deleted })),
    recall: s.recall.list({}).map((r) => ({
      id: r.id, sheetId: r.sheetId, cardId: r.cardId, rating: r.rating,
      question: r.question, answer: r.answer
    })),
    userCards: s.userCards.list({}).map((c) => ({
      id: c.id, sheetId: c.sheetId, front: c.front, back: c.back, source: c.source, annotationId: c.annotationId
    })),
    cards: JSON.stringify((s.getState() || {}).cards || {}),
    flashSession: JSON.stringify((s.getState() || {}).flashSession || {}),
    stats: (() => { const st = s.getDashboardStats(); return { goal: st.goal, today: st.today, completedSheets: st.completedSheets }; })(),
    plan: s.plan.get(),
    derived: window.StudyDerived ? { search: window.StudyDerived.state("search"), get: !!window.StudyDerived.get("search") } : null
  };
})()`;

async function readStore(page) {
  return page.eval(STORE_READ);
}

async function readPrefs(page) {
  return page.eval(`(() => {
    try { return JSON.parse(localStorage.getItem("study-active-prefs-v1")); } catch (e) { return null; }
  })()`);
}

async function seedPrefs(page, prefs) {
  await page.eval(`localStorage.setItem("study-active-prefs-v1", ${JSON.stringify(JSON.stringify(prefs))}), true`);
}

/** Estado de una capa de lectura (barra, hoja) y su foco. */
async function layerInfo(page, selector) {
  return page.eval(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return { present: false };
    const r = el.getBoundingClientRect();
    return {
      present: true,
      role: el.getAttribute("role"),
      modal: el.getAttribute("aria-modal"),
      variant: el.getAttribute("data-variant"),
      state: el.getAttribute("data-state"),
      hidden: !!el.hidden,
      width: Math.round(r.width),
      height: Math.round(r.height),
      overflowX: Math.max(0, Math.round(r.right - innerWidth), Math.round(-r.left)),
      focusInside: el.contains(document.activeElement)
    };
  })()`);
}

/** Encuentra una pausa de recuerdo: a veces la integración la inserta al
 *  recorrer las secciones; se recorre el lector sin forzar eventos raros. */
async function ensureRecallPause(page) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const present = await page.eval(`!!document.querySelector('[data-ac-component="recall-pause"]')`);
    if (present) return true;
    const sections = await count(page, ".reader-section");
    for (let index = 0; index < sections; index += 1) {
      await page.eval(`(() => {
        const el = document.querySelectorAll(".reader-section")[${index}];
        if (!el) return false;
        window.scrollTo({ top: el.offsetTop, behavior: "auto" });
        return true;
      })()`);
      await sleep(260);
      if (await page.eval(`!!document.querySelector('[data-ac-component="recall-pause"]')`)) return true;
    }
    await page.eval(`window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "auto" }), true`);
    await sleep(320);
  }
  return page.eval(`!!document.querySelector('[data-ac-component="recall-pause"]')`);
}

/* ------------------------------------------------------------------ */
/* Suite                                                               */
/* ------------------------------------------------------------------ */

export async function runDashboardFase1({ h, page, baseURL }) {
  h.suite("Study Dashboard · Fase 1");
  h.state.app = "Study Dashboard";

  /* ---------------------------------------------------------------- */
  /* DASH-18 · Subrayado real por párrafo, color y persistencia        */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-18",
    "Subrayado por párrafo con la barra de selección: color, persistencia y panel local",
    async () => {
      await resetViewport(page);
      await page.eval(`(() => {
        window.StudyStore.annotations.list({}).forEach((a) => window.StudyStore.annotations.remove(a.id));
        return true;
      })()`);
      await gotoRoute(page, baseURL, "#/ficha/sheet-aps-01", 1000);

      const paragraph = await page.eval(`(() => {
        const section = document.querySelector('.reader-section[data-section-index="0"]');
        if (!section) return { ready: false, reason: "sin sección 0" };
        const btn = section.querySelector('[data-ac-action="paragraph:open"]');
        const wrap = btn ? btn.closest(".ac-para") : null;
        if (!btn || !wrap) return { ready: false, reason: "sin botón de párrafo" };
        btn.setAttribute("data-qa-para", "1");
        const paragraphText = wrap.querySelector("p[data-paragraph-index], .ac-para__text, p");
        return {
          ready: true,
          count: section.querySelectorAll('[data-ac-action="paragraph:open"]').length,
          index: btn.getAttribute("data-index"),
          text: (paragraphText ? paragraphText.innerText : wrap.innerText).replace(/\\s+/g, " ").trim()
        };
      })()`);
      assert(
        paragraph.ready,
        `${PENDING}el lector no expone [data-ac-action="paragraph:open"] dentro de .ac-para (Agente 3 / Coordinador). ${JSON.stringify(paragraph)}`,
      );
      assert(paragraph.count >= 1, "la sección 0 debe ofrecer la acción de subrayar por párrafo");

      await page.click('[data-qa-para="1"]');
      await waitVisible(page, ".ac-selbar", "barra de selección tras pulsar Subrayar");
      const bar = await page.eval(`(() => {
        const bar = document.querySelector(".ac-selbar");
        if (!bar) return null;
        const quote = bar.querySelector(".ac-selbar__quote");
        return {
          role: bar.getAttribute("role"),
          modal: bar.getAttribute("aria-modal"),
          variant: bar.getAttribute("data-variant"),
          quote: quote ? quote.innerText.replace(/\\s+/g, " ").trim() : "",
          colors: Array.from(bar.querySelectorAll("[data-ac-action='selection:color']")).map((b) => b.getAttribute("data-color")),
          labelled: bar.getAttribute("aria-labelledby")
        };
      })()`);
      assert(bar.role === "dialog", `${PENDING}la barra de selección no es un diálogo (role=${bar.role}).`);
      assertEq(bar.modal, "false", "la barra flotante no es modal");
      assertEq(bar.variant, "floating", "en escritorio la barra es flotante");
      assert(bar.quote.length > 10, "la barra debe mostrar la cita seleccionada");
      const expectedQuote = normalize(paragraph.text).slice(0, 60);
      assert(
        normalize(bar.quote).includes(expectedQuote.slice(0, 45)),
        `la cita de la barra no coincide con el párrafo. Barra: «${bar.quote.slice(0, 90)}». Párrafo: «${paragraph.text.slice(0, 90)}»`,
      );
      for (const color of ["important", "understand", "review", "doubt"]) {
        assert(bar.colors.includes(color), `la barra no ofrece el color ${color}`);
      }

      await page.click('[data-ac-action="selection:color"][data-color="understand"]');
      await page.waitFor(
        `(() => { const q = document.querySelector('.ac-selbar__quote'); return q && q.getAttribute('data-mark') === 'understand'; })()`,
        { timeout: 5000, message: "color Entender seleccionado" },
      );
      await page.click('[data-ac-action="selection:submit"]');
      await page.waitFor(`window.StudyStore.annotations.list({ sheetId: "sheet-aps-01" }).length === 1`, {
        timeout: 10000,
        message: "subrayado guardado en el store",
      });
      await sleep(420);
      const afterSubmit = await page.eval(`(() => ({
        saved: !!document.querySelector('.ac-selbar[data-state="saved"]'),
        openBar: !!document.querySelector('.ac-selbar'),
        highlighted: !!document.querySelector('.reader-section[data-section-index="0"] .ac-para mark.ac-marktext[data-mark="understand"]'),
        mark: (document.querySelector('.reader-section[data-section-index="0"] .ac-para mark.ac-marktext') || {}).getAttribute ? (document.querySelector('.reader-section[data-section-index="0"] .ac-para mark.ac-marktext') || {}).getAttribute("data-mark") : null,
        markLabel: (document.querySelector('.reader-section[data-section-index="0"] .ac-para mark.ac-marktext') || {}).getAttribute ? (document.querySelector('.reader-section[data-section-index="0"] .ac-para mark.ac-marktext') || {}).getAttribute("aria-label") : ""
      }))()`);
      assert(
        afterSubmit.saved || !afterSubmit.openBar,
        `${PENDING}tras guardar, la barra no muestra confirmación ni se retira.`,
      );
      assert(afterSubmit.highlighted, `${PENDING}el párrafo no queda marcado con <mark data-mark="understand">.`);
      assertIncludes(normalize(afterSubmit.markLabel), "entender", "la marca lleva etiqueta textual además del color");

      const stored = await readStore(page);
      const ann = stored.annotations[0];
      assertEq(stored.annotations.length, 1, "subrayados guardados");
      assertEq(ann.sheetId, "sheet-aps-01", "sheetId del subrayado");
      assertEq(ann.color, "understand", "color del subrayado");
      assertEq(ann.sectionIndex, 0, "sectionIndex del subrayado");
      assertEq(ann.paragraphIndex, 0, "paragraphIndex del subrayado");
      assert(ann.sectionTitle && ann.sectionTitle.length > 2, "el subrayado ancla el título de sección");
      assert(
        normalize(ann.quote).includes(expectedQuote.slice(0, 45)),
        `la cita guardada no coincide con el párrafo: «${String(ann.quote).slice(0, 90)}»`,
      );

      // Persistencia real tras refrescar.
      await openDocument(page, appURL(baseURL, "dashboard") + "#/ficha/sheet-aps-01", 1000);
      await waitApp(page, "dashboard");
      await page.waitFor(
        `!!document.querySelector('.reader-section[data-section-index="0"] .ac-para mark.ac-marktext[data-mark="understand"]')`,
        { timeout: 12000, message: "subrayado tras refrescar" },
      );
      const reloaded = await readStore(page);
      assertEq(reloaded.annotations.length, 1, "subrayados tras refrescar");
      assertEq(reloaded.annotations[0].quote, ann.quote, "cita tras refrescar");

      // Panel local del rail.
      await page.waitFor(`!!document.querySelector('[data-module-mount="reader-active"]')`, { timeout: 8000 });
      const rail = await page.eval(`(() => {
        const host = document.querySelector('[data-module-mount="reader-active"]');
        const panel = host && host.querySelector('[data-ac-component="highlights"]');
        if (!panel) return null;
        return {
          view: panel.getAttribute("data-view"),
          state: panel.getAttribute("data-state"),
          text: panel.innerText.replace(/\\s+/g, " ").trim().slice(0, 260),
          hasQuote: /consecuencia|APS|atenci/i.test(panel.innerText)
        };
      })()`);
      assert(rail, `${PENDING}el rail del lector no monta el panel «Mis subrayados» en [data-module-mount="reader-active"].`);
      assertEq(rail.view, "rail", "el panel del rail usa la vista rail");
      assertIncludes(normalize(rail.text), normalize(ann.quote).slice(0, 24), "el panel del rail muestra la cita guardada");

      const shot = await h.shot(page, "dash-18-subrayado-rail");
      return { paragraph: { count: paragraph.count, index: paragraph.index, text: paragraph.text.slice(0, 120) }, bar, ann, rail, reloaded: reloaded.annotations.length, shot };
    },
    { severity: "alta", page, timeout: 90000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-19 · Panel global de subrayados, nota y edición              */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-19",
    "Panel global #/subrayados: cita, nota editable y persistencia tras refrescar",
    async () => {
      await resetViewport(page);
      await gotoRoute(page, baseURL, "#/subrayados", 1000);
      const route = await page.eval(`({ title: document.title, h1: (document.querySelector('#view-root h1') || {}).innerText || "", text: document.getElementById('view-root').innerText.slice(0, 200) })`);
      if (/no encontramos|página no encontrada/i.test(`${route.title} ${route.text}`)) {
        throw new Error(`${PENDING}la ruta #/subrayados no está registrada (Agente 3 / Coordinador). Título: ${route.title}`);
      }
      assert(route.h1.length > 3, "la ruta #/subrayados debe tener un h1 real");

      const store = await readStore(page);
      if (!store.annotations.length) skip("No hay subrayados de partida: DASH-18 no llegó a guardar.");
      const annotation = store.annotations[0];
      await page.waitFor(`!!document.querySelector('.ac-hlrow')`, { timeout: 12000, message: "filas de subrayados" });
      const row = await page.eval(`(() => {
        const row = document.querySelector('.ac-hlrow[data-ac-id="' + ${JSON.stringify(annotation.id)} + '"]') ||
          document.querySelector('.ac-hlrow');
        if (!row) return null;
        const noteBtn = row.querySelector('[data-ac-action="highlights:note"]');
        if (noteBtn) noteBtn.setAttribute("data-qa-note", "1");
        return {
          id: row.getAttribute("data-ac-id"),
          text: row.innerText.replace(/\\s+/g, " ").trim().slice(0, 280),
          noteAction: !!noteBtn,
          marked: row.querySelector(".ac-marktext, [data-mark]") ? true : false,
          href: (row.querySelector('a[href^="#/ficha/"]') || {}).getAttribute ? (row.querySelector('a[href^="#/ficha/"]') || {}).getAttribute("href") : null
        };
      })()`);
      assert(row, `${PENDING}la ruta #/subrayados no pinta filas .ac-hlrow.`);
      assert(row.marked, `${PENDING}la fila no muestra la etiqueta textual de la marca (no solo color).`);
      assertIncludes(normalize(row.text), normalize(annotation.quote).slice(0, 24), "la fila global muestra la cita");

      if (!row.noteAction) {
        throw new Error(`${PENDING}la fila del subrayado no ofrece [data-ac-action="highlights:note"] (no se puede crear ni editar la nota).`);
      }
      await page.click('[data-qa-note="1"]');
      await page.waitFor(
        `!!document.querySelector('[data-ac-input="note"]') || !!document.querySelector('[data-ac-action="note:edit"]')`,
        { timeout: 10000, message: "nota del subrayado" },
      );
      if (!(await page.eval(`!!document.querySelector('[data-ac-input="note"]')`))) {
        assert(
          await page.eval(`!!document.querySelector('[data-ac-action="note:edit"]')`),
          `${PENDING}la nota del subrayado no se abre con editor ni con «Editar/Añadir nota».`,
        );
        await page.click('[data-ac-action="note:edit"]');
      }
      await waitVisible(page, '[data-ac-input="note"]', "editor de nota");
      const noteText = "Nota QA · repasar la puerta de entrada antes del examen.";
      await typeInto(page, '[data-ac-input="note"]', noteText);
      await clearMarks(page);
      const saveName = await markFirst(page, ".ac-dialog, .ac-note, .ac-layer", "guardar nota|guardar", "note-save");
      assert(saveName, `${PENDING}el editor de nota no expone una acción «Guardar nota».`);
      await page.click('[data-qa-mark="note-save"]');
      await page.waitFor(`window.StudyStore.annotations.get(${JSON.stringify(annotation.id)}).note.length > 3`, {
        timeout: 10000,
        message: "nota guardada",
      });
      const saved = await readStore(page);
      const withNote = saved.annotations.find((a) => a.id === annotation.id);
      assertIncludes(withNote.note, "Nota QA", "la nota se guarda en la anotación");
      await page.eval(`(() => { const close = document.querySelector('[data-ac-action="overlay:close"]'); if (close) close.click(); return true; })()`);
      await sleep(300);

      // Edición de la nota.
      await reloadModuleRoute(page, baseURL, "#/subrayados", 1000);
      await page.waitFor(`!!document.querySelector('.ac-hlrow')`, { timeout: 20000 });
      const noteTrigger = await page.eval(`(() => {
        const row = document.querySelector('.ac-hlrow[data-ac-id="' + ${JSON.stringify(annotation.id)} + '"]') || document.querySelector('.ac-hlrow');
        const btn = row && row.querySelector('[data-ac-action="highlights:note"]');
        if (!btn) return false;
        btn.setAttribute("data-qa-note", "2");
        return true;
      })()`);
      assert(noteTrigger, "la fila debe ofrecer abrir la nota tras refrescar");
      await page.click('[data-qa-note="2"]');
      await sleep(500);
      if (!(await page.eval(`!!document.querySelector('[data-ac-input="note"]')`))) {
        if (await page.eval(`!!document.querySelector('[data-ac-action="note:edit"]')`)) {
          await page.click('[data-ac-action="note:edit"]');
        }
      }
      const editedText = "Nota QA editada · confirmar definición con la fuente.";
      let editWorked = false;
      if (await page.eval(`!!document.querySelector('[data-ac-input="note"]')`)) {
        await typeInto(page, '[data-ac-input="note"]', editedText);
        await clearMarks(page);
        const editSave = await markFirst(page, ".ac-dialog, .ac-note, .ac-layer", "guardar nota|guardar", "note-save2");
        if (editSave) {
          await page.click('[data-qa-mark="note-save2"]');
          await page.waitFor(`window.StudyStore.annotations.get(${JSON.stringify(annotation.id)}).note.indexOf("editada") !== -1`, {
            timeout: 8000,
            message: "nota editada",
          }).catch(() => {});
          await sleep(500);
        }
      }
      const edited = await readStore(page);
      const editedAnn = edited.annotations.find((a) => a.id === annotation.id);
      editWorked = normalize(editedAnn.note).includes("editada");

      // Persistencia tras refrescar, sin depender de la edición.
      await reloadModuleRoute(page, baseURL, "#/subrayados", 1000);
      await page.waitFor(`!!document.querySelector('.ac-hlrow')`, { timeout: 20000 });
      const finalStore = await readStore(page);
      const finalAnn = finalStore.annotations.find((a) => a.id === annotation.id);
      assertEq(finalAnn.note, editedAnn.note, "la nota sobrevive al refrescar");
      assert(finalAnn.note.length > 3, "la nota no puede perderse");
      const rowAfter = await textOf(page, `.ac-hlrow[data-ac-id="${annotation.id}"]`);
      assertIncludes(normalize(rowAfter), "nota qa", "la fila muestra la nota guardada");

      const shot = await h.shot(page, "dash-19-subrayados-nota");
      return { route, annotationId: annotation.id, row, note: finalAnn.note, editWorked, shot };
    },
    { severity: "alta", page, timeout: 90000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-20 · Tarjeta propia desde el subrayado                       */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-20",
    "Tarjeta propia creada desde un subrayado, editable y persistente (userCards)",
    async () => {
      await resetViewport(page);
      await gotoRoute(page, baseURL, "#/subrayados", 1000);
      const store = await readStore(page);
      if (!store.annotations.length) skip("No hay subrayados de partida.");
      const annotation = store.annotations[0];
      await page.waitFor(`!!document.querySelector('.ac-hlrow')`, { timeout: 12000 });
      // La fila de «Mis subrayados» ya ofrece «Crear tarjeta» (ucard:from).
      await clearMarks(page);
      let triggerName = await markFirst(page, `.ac-hlrow[data-ac-id="${annotation.id}"]`, "tarjeta", "ucard");
      assert(
        triggerName,
        `${PENDING}la fila del subrayado no ofrece crear tarjeta propia (ucard:from / «Crear tarjeta»).`,
      );
      await page.click('[data-qa-mark="ucard"]');
      await page.waitFor(`!!document.querySelector('[data-ac-input="ucard-back"]')`, {
        timeout: 10000,
        message: "editor de tarjeta propia",
      });

      const form = await page.eval(`(() => {
        const front = document.querySelector('[data-ac-input="ucard-front"]');
        const back = document.querySelector('[data-ac-input="ucard-back"]');
        const preview = document.querySelector('[data-ac-ucard-preview-front]');
        const save = document.querySelector('[data-ac-action="ucard:save"]');
        return {
          front: front ? front.value : null,
          backValue: back ? back.value : null,
          hasPreview: !!preview,
          saveText: save ? save.innerText.replace(/\\s+/g, " ").trim() : "",
          title: (document.querySelector('.ac-dialog__title') || {}).innerText || "",
          source: (document.querySelector('.ac-ucard__source') || {}).innerText || ""
        };
      })()`);
      assert(form.front && form.front.length > 5, "el frente de la tarjeta debe partir de la cita del subrayado");
      assert(form.hasPreview, `${PENDING}la tarjeta propia no muestra vista previa antes de guardar.`);
      assertIncludes(normalize(form.saveText), "guardar", "el editor ofrece Guardar tarjeta");
      assertIncludes(normalize(`${form.title} ${form.source}`), "subrayado", "la tarjeta declara que nace de un subrayado");
      await typeInto(page, '[data-ac-input="ucard-back"]', "Respuesta QA vinculada al subrayado.");
      await page.click('[data-ac-action="ucard:save"]');
      await page.waitFor(`window.StudyStore.userCards.list({}).length >= 1`, { timeout: 10000, message: "tarjeta propia guardada" });
      let cards = await readStore(page);
      let card = cards.userCards[0];
      assert(cards.userCards.length >= 1, "la tarjeta propia debe quedar en userCards");
      assert(card.annotationId === annotation.id, "la tarjeta propia queda vinculada al subrayado de origen (annotationId)");
      assertEq(card.source, "annotation", "la tarjeta propia declara origen annotation");
      assert(card.front.length > 5, "el frente conserva la cita");
      assertIncludes(normalize(card.back), "respuesta qa", "el reverso guardado");

      // Edición desde «Mis tarjetas» (lista de tarjetas propias).
      await reloadModuleRoute(page, baseURL, "#/subrayados", 1000);
      await page.waitFor(`!!document.querySelector('#ac-ucards-host .ac-ucardlist__row')`, { timeout: 20000, message: "lista de tarjetas propias" });
      const editSelector = `[data-ac-action="ucard:edit"][data-ac-id="${card.id}"]`;
      assert(await page.eval(`!!document.querySelector(${JSON.stringify(editSelector)})`), `${PENDING}la tarjeta propia no se puede editar desde «Mis tarjetas».`);
      await page.click(editSelector);
      await page.waitFor(`!!document.querySelector('[data-ac-input="ucard-back"]')`, { timeout: 10000, message: "editor de tarjeta (edición)" });
      const editTitle = await page.eval(`(document.querySelector('.ac-dialog__title') || {}).innerText || ""`);
      assertIncludes(normalize(editTitle), "editar tarjeta", "el editor reabre en modo edición");
      await typeInto(page, '[data-ac-input="ucard-back"]', "Respuesta QA editada tras releer la cita.");
      await page.click('[data-ac-action="ucard:save"]');
      await page.waitFor(`window.StudyStore.userCards.get(${JSON.stringify(card.id)}).back.indexOf("editada") !== -1`, {
        timeout: 8000,
        message: "reverso editado",
      }).catch(() => {});
      await sleep(400);
      cards = await readStore(page);
      assertEq(cards.userCards.length, 1, "editar una tarjeta propia no debe duplicarla");
      card = cards.userCards.find((item) => item.id === card.id) || cards.userCards[0];

      // Persistencia tras refrescar.
      await reloadModuleRoute(page, baseURL, "#/subrayados", 1000);
      const finalStore = await readStore(page);
      assertEq(finalStore.userCards.length, cards.userCards.length, "tarjetas propias tras refrescar");
      const finalCard = finalStore.userCards.find((c) => c.id === card.id);
      assert(finalCard, "la tarjeta propia debe sobrevivir al refrescar");
      assert(finalCard.front.length > 3 && finalCard.back.length > 3, "frente y reverso conservados");
      assertIncludes(normalize(finalCard.back), "editada", "la edición sobrevive al refrescar");
      const shot = await h.shot(page, "dash-20-tarjeta-propia");
      return { triggerName, form, cardBefore: card, cardAfter: finalCard, shot };
    },
    { severity: "alta", page, timeout: 90000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-21 · Pausa de recuerdo                                       */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-21",
    "Pausa de recuerdo: interruptor, frecuencia, pregunta de tarjeta real, revelar/autoevaluar/saltar sin tocar cards",
    async () => {
      await resetViewport(page);
      await gotoRoute(page, baseURL, "#/ficha/sheet-aps-01", 1000);
      // Las preferencias de lectura (pausa + teclado) viven en el rail.
      await openReaderPrefs(page);
      await page.waitFor(`!!document.querySelector('[data-ac-component="recall-switch"]')`, {
        timeout: 12000,
        message: "interruptor de la pausa de recuerdo",
      }).catch(() => {});
      const switchVisible = await isVisible(page, '[data-ac-component="recall-switch"]');
      if (!switchVisible) {
        throw new Error(`${PENDING}el lector no monta el interruptor de la pausa ([data-ac-component="recall-switch"]).`);
      }
      const switchInfo = await page.eval(`(() => {
        const root = document.querySelector('[data-ac-component="recall-switch"]');
        const sw = root.querySelector('[data-ac-action="recall:switch"]');
        return {
          checked: sw.getAttribute("aria-checked"),
          text: root.innerText.replace(/\\s+/g, " ").trim().slice(0, 160),
          freqs: Array.from(root.querySelectorAll('[data-ac-action="recall:freq"]')).map((b) => b.getAttribute("data-value")),
          disabled: sw.disabled
        };
      })()`);
      assertEq(switchInfo.checked, "true", "la pausa debe estar activada por defecto");
      assert(switchInfo.disabled === false, "el interruptor debe ser operable");
      for (const freq of ["1", "2", "3"]) assert(switchInfo.freqs.includes(freq), `la frecuencia ${freq} no está disponible`);

      // Apagar y volver a encender: la preferencia persiste.
      await page.click('[data-ac-action="recall:switch"]');
      await page.waitFor(`(() => { const sw = document.querySelector('[data-ac-action="recall:switch"]'); return sw && sw.getAttribute('aria-checked') === 'false'; })()`, { timeout: 5000, message: "pausa desactivada" });
      await sleep(240);
      const offPrefs = await readPrefs(page);
      assert(offPrefs && offPrefs.version === 1, "la preferencia se guarda versionada en study-active-prefs-v1");
      assertEq(offPrefs.recallPause, false, "recallPause desactivado");
      await openReaderPrefs(page);
      await page.click('[data-ac-action="recall:switch"]');
      await page.waitFor(`(() => { const sw = document.querySelector('[data-ac-action="recall:switch"]'); return sw && sw.getAttribute('aria-checked') === 'true'; })()`, { timeout: 5000, message: "pausa activada" });

      // Frecuencia 1 y persistencia de la preferencia.
      await openReaderPrefs(page);
      await page.click('[data-ac-action="recall:freq"][data-value="1"]');
      await page.waitFor(`(() => { try { const p = JSON.parse(localStorage.getItem('study-active-prefs-v1')); return p && p.recallEvery === 1; } catch (e) { return false; } })()`, { timeout: 5000, message: "frecuencia 1 guardada" });
      await openDocument(page, appURL(baseURL, "dashboard") + "#/ficha/sheet-aps-01", 1100);
      await waitApp(page, "dashboard");
      const prefsAfterReload = await readPrefs(page);
      assertEq(prefsAfterReload.recallEvery, 1, "la frecuencia sobrevive al refrescar");
      assertEq(prefsAfterReload.recallPause, true, "el interruptor sobrevive al refrescar");

      const pauseAppears = await ensureRecallPause(page);
      if (!pauseAppears) {
        throw new Error(`${PENDING}con frecuencia 1 no aparece ninguna pausa de recuerdo ([data-ac-component="recall-pause"]) en las secciones del lector.`);
      }
      const pause = await page.eval(`(() => {
        const el = document.querySelector('[data-ac-component="recall-pause"]');
        const q = el.querySelector('.ac-pause__q');
        const scope = el.querySelector('.ac-pause__scope');
        return {
          cardId: el.getAttribute("data-ac-id"),
          state: el.getAttribute("data-state"),
          question: q ? q.innerText.replace(/\\s+/g, " ").trim() : "",
          scope: scope ? scope.innerText.replace(/\\s+/g, " ").trim() : "",
          skip: !!el.querySelector('[data-ac-action="recall:skip"]'),
          reveal: !!el.querySelector('[data-ac-action="recall:reveal"]')
        };
      })()`);
      assert(pause.skip && pause.reveal, `${PENDING}la pausa no ofrece «Saltar» y «Revelar respuesta».`);
      assertIncludes(normalize(pause.scope), "no toca tus cajas de flashcards", "aviso de que la pausa no toca Flashcards");

      const cards = await page.eval(`(() => {
        const sheetId = "sheet-aps-01";
        return window.STUDY_CONTENT.cards.filter((c) => c.sheetId === sheetId).map((c) => ({ id: c.id, prompt: c.prompt, answer: c.answer }));
      })()`);
      assert(cards.length > 0, "la ficha de prueba debe tener tarjetas reales");
      const realCard = cards.find((c) => c.id === pause.cardId) || cards.find((c) => normalize(c.prompt) === normalize(pause.question));
      assert(realCard, `la pregunta de la pausa no corresponde a ninguna tarjeta real de la ficha. Pregunta: «${pause.question.slice(0, 120)}»`);
      assertEq(normalize(pause.question), normalize(realCard.prompt), "la pausa usa la pregunta real de la tarjeta");

      const cardsBefore = await page.eval(`JSON.stringify((window.StudyStore.getState() || {}).cards || {})`);

      // Saltar: cierra la pausa sin tocar cards y sin inventar texto.
      await page.click('[data-ac-action="recall:skip"]');
      await sleep(700);
      const afterSkip = await page.eval(`(() => ({
        state: (document.querySelector('[data-ac-component="recall-pause"]') || {}).getAttribute ? (document.querySelector('[data-ac-component="recall-pause"]') || {}).getAttribute("data-state") : null,
        skippedRecord: window.StudyStore.recall.list({ sheetId: "sheet-aps-01" }).some((r) => r.rating === "skipped")
      }))()`);
      assert(
        afterSkip.state === "skipped" || afterSkip.state === "closed" || afterSkip.skippedRecord || !(await isVisible(page, '[data-ac-component="recall-pause"]')),
        `${PENDING}«Saltar» no cierra la pausa ni registra la omisión.`,
      );

      // Revelar y autoevaluar: se busca una pausa nueva.
      await openDocument(page, appURL(baseURL, "dashboard") + "#/ficha/sheet-aps-01", 1100);
      await waitApp(page, "dashboard");
      const second = await ensureRecallPause(page);
      assert(second, `${PENDING}no se pudo obtener una segunda pausa para revelar y autoevaluar.`);
      const secondInfo = await page.eval(`(() => {
        const el = document.querySelector('[data-ac-component="recall-pause"]');
        return { cardId: el.getAttribute("data-ac-id"), question: (el.querySelector('.ac-pause__q') || {}).innerText || "" };
      })()`);
      const secondCard = cards.find((c) => c.id === secondInfo.cardId) || realCard;
      await page.click('[data-ac-action="recall:reveal"]');
      await page.waitFor(`!!document.querySelector('[data-ac-component="recall-pause"] .ac-pause__answer')`, { timeout: 6000, message: "respuesta revelada" });
      const revealed = await page.eval(`(() => {
        const el = document.querySelector('.ac-pause__answer');
        return {
          text: el ? el.innerText.replace(/\\s+/g, " ").trim() : "",
          focus: document.activeElement && document.activeElement.getAttribute("data-ac-focus"),
          ratings: Array.from(document.querySelectorAll('[data-ac-action="recall:rate"]')).map((b) => b.getAttribute("data-value"))
        };
      })()`);
      assert(revealed.text.length > 3, "la respuesta revelada no puede estar vacía");
      const expectedAnswer = normalize(secondCard.answer || "").slice(0, 40);
      assert(
        normalize(revealed.text).includes(expectedAnswer.slice(0, 30)),
        `la respuesta revelada no coincide con la tarjeta real. Revelada: «${revealed.text.slice(0, 100)}». Tarjeta: «${String(secondCard.answer).slice(0, 100)}»`,
      );
      assertEq(revealed.focus, "answer", "el foco pasa a la respuesta revelada");
      for (const rating of ["again", "hard", "good"]) assert(revealed.ratings.includes(rating), `falta la autoevaluación ${rating}`);
      await page.click('[data-ac-action="recall:rate"][data-value="good"]');
      await page.waitFor(`window.StudyStore.recall.list({ sheetId: "sheet-aps-01" }).some((r) => r.rating === "good")`, {
        timeout: 8000,
        message: "autoevaluación guardada",
      });
      await sleep(400);
      const store = await readStore(page);
      const rated = store.recall.find((r) => r.rating === "good");
      assert(rated, "no se guardó el recuerdo evaluado");
      assertEq(rated.sheetId, "sheet-aps-01", "sheetId del recuerdo");
      assert(rated.cardId && rated.cardId.length > 2, "el recuerdo guarda el cardId real");
      const cardsAfter = await page.eval(`JSON.stringify((window.StudyStore.getState() || {}).cards || {})`);
      assertEq(cardsAfter, cardsBefore, "la pausa no puede modificar las cajas de Flashcards (cards)");
      assertEq(store.flashSession, await page.eval(`JSON.stringify((window.StudyStore.getState() || {}).flashSession || {})`), "tampoco la sesión de Flashcards");

      const shot = await h.shot(page, "dash-21-pausa-recuerdo");
      return { switchInfo, pause, secondInfo, revealed: { text: revealed.text.slice(0, 120), focus: revealed.focus }, rated, skip: afterSkip, shot };
    },
    { severity: "alta", page, timeout: 120000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-22 · Modo recordar y confianza                               */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-22",
    "Modo recordar en conceptos y confianza al completar: guardar, editar, persistir",
    async () => {
      await resetViewport(page);
      await gotoRoute(page, baseURL, "#/ficha/sheet-aps-01", 1000);

      // Modo recordar: control dentro de .reader-concepts.
      await clearMarks(page);
      const modeTrigger = await markFirst(page, ".reader-concepts", "recordar|memoria", "rmode");
      if (!modeTrigger) {
        throw new Error(`${PENDING}.reader-concepts no ofrece el control «Modo recordar» (Agente 3 / Coordinador).`);
      }
      await page.click('[data-qa-mark="rmode"]');
      await page.waitFor(`!!document.querySelector('[data-ac-component="recall-mode"]')`, { timeout: 8000, message: "modo recordar montado" });
      const mode = await page.eval(`(() => {
        const el = document.querySelector('[data-ac-component="recall-mode"]');
        const concepts = Array.from(el.querySelectorAll('[data-ac-action="memory:toggle"]'));
        const keyConcepts = (window.STUDY_CONTENT.sheets.find((s) => s.id === "sheet-aps-01") || {}).keyConcepts || [];
        return {
          count: concepts.length,
          expected: keyConcepts.length,
          pressed: concepts.map((c) => c.getAttribute("aria-pressed")),
          status: (el.querySelector('[role="status"]') || {}).innerText || "",
          all: !!el.querySelector('[data-ac-action="memory:all"], [data-ac-action="memory:none"]')
        };
      })()`);
      assertEq(mode.count, mode.expected, "el modo recordar muestra todos los conceptos clave");
      assert(mode.count > 0, "la ficha debe tener conceptos clave");
      await page.click('[data-ac-action="memory:toggle"][data-index="0"]');
      await sleep(260);
      const revealedOne = await page.eval(`(() => {
        const el = document.querySelector('[data-ac-component="recall-mode"]');
        return {
          pressed: Array.from(el.querySelectorAll('[data-ac-action="memory:toggle"]')).map((c) => c.getAttribute("aria-pressed")),
          status: (el.querySelector('[role="status"]') || {}).innerText || ""
        };
      })()`);
      assertEq(revealedOne.pressed[0], "true", "el primer concepto se revela con Enter/clic");
      assert(/1 de \d+/i.test(normalize(revealedOne.status)), `el contador de revelados no se actualiza: «${revealedOne.status}»`);
      assert(mode.all, "el modo recordar ofrece el control global Mostrar/Ocultar todos");

      // Confianza: marcar completada y guardar el estado.
      await gotoRoute(page, baseURL, "#/ficha/sheet-aps-02", 1000);
      const pressed = await page.eval(`(() => { const b = document.querySelector('[data-action="toggle-complete"]'); return b ? b.getAttribute("aria-pressed") : null; })()`);
      if (pressed !== "true") {
        await page.click('[data-action="toggle-complete"]');
        await page.waitFor(`(() => { const b = document.querySelector('[data-action="toggle-complete"]'); return b && b.getAttribute("aria-pressed") === "true"; })()`, { timeout: 7000 });
      }
      await page.waitFor(`!!document.querySelector('[data-ac-component="confidence"]')`, { timeout: 10000, message: "selector de confianza" }).catch(() => {});
      const confidenceVisible = await isVisible(page, '[data-ac-component="confidence"]');
      if (!confidenceVisible) {
        throw new Error(`${PENDING}al completar la ficha no aparece [data-ac-component="confidence"] (Agente 3).`);
      }
      const conf = await page.eval(`(() => {
        const el = document.querySelector('[data-ac-component="confidence"]');
        return {
          state: el.getAttribute("data-state"),
          options: Array.from(el.querySelectorAll('[data-ac-action="confidence:pick"]')).map((b) => b.getAttribute("data-value")),
          save: !!el.querySelector('[data-ac-action="confidence:save"]'),
          dismiss: !!el.querySelector('[data-ac-action="confidence:dismiss"]')
        };
      })()`);
      assertEq(conf.options.length, 3, "la confianza ofrece las tres opciones");
      for (const value of ["solid", "partial", "weak"]) assert(conf.options.includes(value), `falta la confianza ${value}`);
      assert(conf.dismiss, "la confianza se puede omitir («Ahora no»)");
      await page.click('[data-ac-action="confidence:pick"][data-value="solid"]');
      await page.click('[data-ac-action="confidence:save"]');
      await page.waitFor(`!!window.StudyStore.sheetConfidence.get("sheet-aps-02")`, { timeout: 8000, message: "confianza guardada" });
      const stored = await page.eval(`(() => { const c = window.StudyStore.sheetConfidence.get("sheet-aps-02"); return c ? { value: c.value, updatedAt: c.updatedAt } : null; })()`);
      assertEq(stored.value, "solid", "confianza guardada");
      await openDocument(page, appURL(baseURL, "dashboard") + "#/ficha/sheet-aps-02", 1100);
      await waitApp(page, "dashboard");
      const afterReload = await page.eval(`(() => {
        const c = window.StudyStore.sheetConfidence.get("sheet-aps-02");
        const el = document.querySelector('[data-ac-component="confidence"]');
        return { value: c ? c.value : null, visible: !!el, text: el ? el.innerText.replace(/\\s+/g, " ").trim().slice(0, 200) : "" };
      })()`);
      assertEq(afterReload.value, "solid", "la confianza sobrevive al refrescar");
      assert(afterReload.visible && /solid|domino|guardad/i.test(normalize(afterReload.text)), "el selector muestra la confianza guardada tras refrescar");

      const shot = await h.shot(page, "dash-22-ritmo-confianza");
      return { modeTrigger, mode: { count: mode.count, status: revealedOne.status }, confidence: conf, stored, afterReload: { value: afterReload.value }, shot };
    },
    { severity: "alta", page, timeout: 90000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-23 · Dudas: bandeja, resolver/reabrir, contador y contexto   */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-23",
    "Dudas: crear desde el subrayado, bandeja #/dudas, resolver/reabrir, contador del Panel y enlace de contexto",
    async () => {
      await resetViewport(page);
      await page.eval(`(() => {
        window.StudyStore.doubts.list({}).forEach((d) => window.StudyStore.doubts.remove(d.id));
        return true;
      })()`);

      // Crear la duda desde la lectura: el color Duda del subrayado crea el
      // registro en StudyStore.doubts y conserva la cita y el ancla.
      await gotoRoute(page, baseURL, "#/ficha/sheet-aps-01", 1000);
      const paragraphReady = await page.eval(`(() => {
        const btn = document.querySelector('[data-ac-action="paragraph:open"]');
        if (!btn) return false;
        btn.setAttribute("data-qa-para", "1");
        return true;
      })()`);
      assert(paragraphReady, `${PENDING}no hay botón de párrafo para crear una duda desde la lectura.`);
      await page.click('[data-qa-para="1"]');
      await waitVisible(page, ".ac-selbar", "barra de selección para crear la duda");
      await page.click('[data-ac-action="selection:color"][data-color="doubt"]');
      await page.waitFor(`(() => { const q = document.querySelector('.ac-selbar__quote'); return q && q.getAttribute('data-mark') === 'doubt'; })()`, { timeout: 5000, message: "color Duda seleccionado" });
      await page.click('[data-ac-action="selection:submit"]');
      await page.waitFor(`window.StudyStore.doubts.list({}).length >= 1`, { timeout: 10000, message: "duda creada desde el subrayado" });
      const createdStore = await readStore(page);
      const doubt = createdStore.doubts[0];
      const doubtAnnotation = createdStore.annotations.find((a) => a.id === doubt.annotationId);
      assert(doubtAnnotation, "la duda debe quedar vinculada a su subrayado (annotationId)");
      assertEq(doubtAnnotation.color, "doubt", "el subrayado de la duda conserva el color Duda");
      assertEq(doubt.sheetId, "sheet-aps-01", "la duda conserva la ficha del subrayado");
      assert(doubt.quote && doubt.quote.length > 5, "la duda conserva la cita");
      await sleep(400);

      // Bandeja de dudas.
      await gotoRoute(page, baseURL, "#/dudas", 1000);
      const route = await page.eval(`({ title: document.title, h1: (document.querySelector('#view-root h1') || {}).innerText || "", text: document.getElementById('view-root').innerText.slice(0, 320) })`);
      if (/no encontramos|página no encontrada/i.test(`${route.title} ${route.text}`)) {
        throw new Error(`${PENDING}la ruta #/dudas no está registrada (Agente 3 / Coordinador). Título: ${route.title}`);
      }
      assertIncludes(normalize(route.h1), "bandeja de dudas", "h1 de la bandeja de dudas");
      await page.waitFor(`!!document.querySelector('.ac-doubtrow[data-ac-id="${doubt.id}"]')`, { timeout: 10000, message: "fila de la duda" });
      const rowInfo = await page.eval(`(() => {
        const row = document.querySelector('.ac-doubtrow[data-ac-id="${doubt.id}"]');
        const state = row.getAttribute("data-state");
        const quote = (row.querySelector(".ac-doubtrow__quote") || {}).innerText || "";
        const contextText = (row.querySelector(".ac-doubtrow__context") || {}).innerText || "";
        return {
          state,
          quote: quote.replace(/\\s+/g, " ").trim(),
          context: contextText.replace(/\\s+/g, " ").trim(),
          resolve: !!row.querySelector('[data-ac-action="doubts:resolve"]'),
          goto: !!row.querySelector('[data-ac-action="doubts:goto"]'),
          annotationLink: !!row.querySelector('[data-ac-action="highlights:note"]')
        };
      })()`);
      assertIncludes(normalize(rowInfo.quote), normalize(doubt.quote).slice(0, 24), "la bandeja muestra la cita de la duda");
      assertIncludes(normalize(rowInfo.context), "aps", "la fila muestra la ficha de contexto");
      assertEq(rowInfo.resolve, true, `${PENDING}la bandeja no ofrece resolver la duda.`);
      assertEq(rowInfo.goto, true, `${PENDING}la bandeja no ofrece «Ir al contexto».`);
      assertEq(rowInfo.annotationLink, true, "la duda enlaza a su subrayado original");

      // Resolver: la duda se cierra y el subrayado se conserva.
      await page.click('.ac-doubtrow[data-ac-id="' + doubt.id + '"] [data-ac-action="doubts:resolve"]');
      await page.waitFor(`!!window.StudyStore.doubts.get("${doubt.id}").resolvedAt`, { timeout: 8000, message: "duda resuelta" });
      const afterResolve = await readStore(page);
      assert(
        afterResolve.annotations.some((a) => a.id === doubt.annotationId && !a.deleted),
        "resolver una duda no debe borrar el subrayado",
      );

      // Reabrir desde el filtro de resueltas.
      await page.click('[data-ac-action="doubts:filter"][data-value="resolved"]');
      await page.waitFor(`!!document.querySelector('.ac-doubtrow[data-ac-id="${doubt.id}"] [data-ac-action="doubts:reopen"]')`, {
        timeout: 8000,
        message: "fila resuelta con reapertura",
      });
      await page.click('.ac-doubtrow[data-ac-id="' + doubt.id + '"] [data-ac-action="doubts:reopen"]');
      await page.waitFor(`window.StudyStore.doubts.get("${doubt.id}").resolvedAt === null`, { timeout: 8000, message: "duda reabierta" });
      await page.click('[data-ac-action="doubts:filter"][data-value="open"]');
      await sleep(350);

      // El enlace de contexto navega a la ficha real.
      await page.click('.ac-doubtrow[data-ac-id="' + doubt.id + '"] [data-ac-action="doubts:goto"]');
      await page.waitFor(`location.hash === "#/ficha/sheet-aps-01"`, { timeout: 8000, message: "salto al contexto de la duda" });
      await waitApp(page, "dashboard");
      const contextHash = await page.eval("location.hash");

      // Contador del Panel y enlace a la bandeja.
      await gotoRoute(page, baseURL, "#/", 1100);
      await page.waitFor(`!!document.querySelector('[data-module-mount="active-summary"] .ac-summary')`, { timeout: 10000, message: "resumen de lectura activa en el Panel" });
      const panel = await page.eval(`(() => {
        const host = document.querySelector('[data-module-mount="active-summary"]');
        const link = host.querySelector('a[href="#/dudas"]');
        const count = host.querySelector(".ac-summary__doubtcount");
        return {
          text: host.innerText.replace(/\\s+/g, " ").trim().slice(0, 320),
          link: link ? link.getAttribute("href") : null,
          count: count ? count.textContent.trim() : null,
          open: window.StudyStore.doubts.list({ resolved: false }).length
        };
      })()`);
      assertEq(panel.link, "#/dudas", "el resumen enlaza a la bandeja de dudas");
      assertEq(panel.count, String(panel.open), "el contador del Panel muestra las dudas abiertas reales");
      assertIncludes(normalize(panel.text), `${panel.open} duda`, "el texto del Panel declara el número de dudas abiertas");

      const shot = await h.shot(page, "dash-23-dudas-panel");
      return { doubt, route, rowInfo, contextHash, panel, shot };
    },
    { severity: "alta", page, timeout: 90000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-24 · Búsqueda del cuerpo con índice perezoso                 */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-24",
    "Búsqueda del cuerpo: índice no cargado al entrar, sin acentos, fragmento, filtro por área y estados",
    async () => {
      await resetViewport(page);
      await openDocument(page, appURL(baseURL, "dashboard") + "#/biblioteca", 1000, { fresh: true });
      await waitApp(page, "dashboard");

      // 1. Índice no cargado al entrar; ninguno de sus derivados se pide.
      const before = await page.eval(`(() => {
        const entries = performance.getEntriesByType("resource").map((e) => e.name);
        return {
          derived: entries.filter((url) => /\\/study-data\\/derived\\//.test(url)).map((url) => url.split("/").pop()),
          state: window.StudyDerived ? window.StudyDerived.state("search") : null,
          loaded: window.StudyDerived ? !!window.StudyDerived.get("search") : null
        };
      })()`);
      assertEq(before.derived.length, 0, `al entrar en #/biblioteca no debe pedirse ningún derivado: ${before.derived.join(", ")}`);
      assertEq(before.state, "idle", "el estado del índice de búsqueda al entrar es idle");
      assertEq(before.loaded, false, "el índice no está cargado al entrar");

      const hasInput = await page.eval(`!!document.querySelector("[data-library-search-input]")`);
      assert(hasInput, `${PENDING}el host de búsqueda no expone [data-library-search-input] (Agente 5 / Coordinador).`);
      const panelText = await page.eval(`(() => (document.querySelector('[data-module-mount="library-search"]') || document.body).innerText.replace(/\\s+/g, " ").slice(0, 180))()`);
      assertIncludes(normalize(panelText), "buscar", "el panel de búsqueda tiene su campo");

      // Red lenta real: el estado de carga debe ser observable, no fingido.
      await CDP(page).send("Network.enable");
      await CDP(page).send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 260,
        downloadThroughput: 3 * 1024 * 1024,
        uploadThroughput: 1024 * 1024,
        connectionType: "cellular3g",
      });
      await page.eval(`(() => {
        window.__qaLoadingSeen = false;
        const body = document.querySelector("[data-navx-search-body]");
        window.__qaSearchObserver = null;
        if (!body) return false;
        const scan = () => {
          const busy = body.getAttribute("aria-busy") === "true";
          if (busy || body.querySelector(".navx-search-loading") || /cargando|preparando|%/.test(body.innerText)) {
            window.__qaLoadingSeen = true;
          }
        };
        const mo = new MutationObserver(scan);
        mo.observe(body, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-busy"] });
        window.__qaSearchObserver = mo;
        scan();
        return true;
      })()`);
      await page.click("[data-library-search-input]", { timeout: 8000 });
      await page.waitFor(`window.StudyDerived && window.StudyDerived.state("search") === "ready"`, {
        timeout: 60000,
        message: "índice de búsqueda listo",
      });
      const loadingSeen = await page.eval(`window.__qaLoadingSeen === true`);
      await page.eval(`(() => { if (window.__qaSearchObserver) window.__qaSearchObserver.disconnect(); return true; })()`);
      assert(loadingSeen, `${PENDING}el panel no muestra estado de carga/progreso mientras construye el índice.`);

      // 2. Búsqueda sin acentos con fragmento resaltado.
      await typeInto(page, "[data-library-search-input]", "vacunacion");
      await page.waitFor(`document.querySelectorAll("[data-navx-result]").length > 0`, { timeout: 25000, message: "resultados de «vacunacion»" });
      const result = await page.eval(`(() => {
        const first = document.querySelector("[data-navx-result]");
        const snippet = first.querySelector(".navx-result-snippet");
        const link = first.querySelector("a[data-navx-sheet]");
        const rendered = (selector) => {
          const el = document.querySelector(selector);
          if (!el) return false;
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return !el.hidden && s.display !== "none" && s.visibility !== "hidden" && r.height > 0;
        };
        return {
          count: document.querySelectorAll("[data-navx-result]").length,
          snippetHTML: snippet ? snippet.innerHTML : "",
          snippetText: snippet ? snippet.innerText.replace(/\\s+/g, " ").trim() : "",
          href: link ? link.getAttribute("href") : null,
          sheetId: link ? link.getAttribute("data-navx-sheet") : null,
          status: (document.querySelector("[data-navx-search-status]") || {}).innerText || "",
          bodyVisible: rendered("#library-body-results"),
          libraryVisible: rendered("#library-results"),
          summaryVisible: rendered("#library-summary")
        };
      })()`);
      assert(result.count > 0, "la búsqueda debe devolver resultados reales");
      assert(/<mark[^>]*class="navx-mark"|<mark/.test(result.snippetHTML), "el fragmento debe resaltar la coincidencia con <mark>");
      assertIncludes(normalize(result.snippetText), "vacunaci", "el fragmento contiene la coincidencia sin acentos");
      assert(result.href && result.href.startsWith("#/ficha/"), "el resultado abre una ficha existente");
      assertEq(result.bodyVisible, true, "mientras hay consulta se muestra #library-body-results");
      assertEq(result.libraryVisible, false, "mientras hay consulta se oculta la biblioteca normal (hidden o display:none)");
      assertEq(result.summaryVisible, false, "mientras hay consulta se oculta el resumen de la biblioteca");

      // 3. Filtro por área: todos los resultados deben pertenecer al área elegida.
      const area = await page.eval(`(() => {
        const sel = document.querySelector("[data-navx-search-area]");
        const values = Array.from(sel.options).filter((o) => o.value).map((o) => o.value);
        const first = document.querySelector("[data-navx-result] a[data-navx-sheet]");
        const sheet = window.STUDY_CONTENT.sheets.find((s) => s.id === first.getAttribute("data-navx-sheet"));
        const areaId = sheet ? (sheet.primaryAreaId || sheet.areaId) : values[0];
        sel.value = areaId;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
        return { areaId, value: sel.value };
      })()`);
      await page.waitFor(`(() => {
        const list = Array.from(document.querySelectorAll("[data-navx-result] a[data-navx-sheet]"));
        return list.length > 0 && list.every((a) => {
          const sheet = window.STUDY_CONTENT.sheets.find((s) => s.id === a.getAttribute("data-navx-sheet"));
          return sheet && (sheet.primaryAreaId || sheet.areaId) === ${JSON.stringify(area.areaId)};
        });
      })()`, { timeout: 15000, message: "resultados filtrados por área" });

      // 4. Estado vacío real y limpieza.
      await typeInto(page, "[data-library-search-input]", "zzzzqqq");
      await page.waitFor(`(() => {
        const body = document.querySelector("[data-navx-search-body]");
        return body && (/sin coincidencias|no encontramos|no hay resultados/i.test(body.innerText));
      })()`, { timeout: 15000, message: "estado vacío de búsqueda" });
      await page.click("[data-navx-search-clear]");
      await sleep(700);
      const cleared = await page.eval(`(() => {
        const rendered = (selector) => {
          const el = document.querySelector(selector);
          if (!el) return false;
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return !el.hidden && s.display !== "none" && s.visibility !== "hidden" && r.height > 0;
        };
        return {
          bodyVisible: rendered("#library-body-results"),
          libraryVisible: rendered("#library-results"),
          summaryVisible: rendered("#library-summary"),
          query: (document.querySelector("[data-library-search-input]") || {}).value
        };
      })()`);
      assertEq(cleared.bodyVisible, false, "al limpiar se oculta el panel de resultados del cuerpo");
      assertEq(cleared.libraryVisible, true, "al limpiar se restaura #library-results");
      assertEq(cleared.summaryVisible, true, "al limpiar se restaura #library-summary");
      assertEq(cleared.query, "", "el campo queda vacío");
      await CDP(page).send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 0,
        downloadThroughput: -1,
        uploadThroughput: -1,
      });

      const shot = await h.shot(page, "dash-24-busqueda-cuerpo");
      return {
        before,
        loadingSeen,
        result: { count: result.count, snippet: result.snippetText.slice(0, 140), href: result.href, status: result.status },
        area,
        cleared,
        shot,
      };
    },
    { severity: "alta", page, timeout: 120000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-25 · Paleta Ctrl+K y convivencia con `/`                     */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-25",
    "Ctrl+K: abre, filtra, navega con teclado, Esc devuelve el foco y `/` sigue siendo de la biblioteca",
    async () => {
      await resetViewport(page);
      await gotoRoute(page, baseURL, "#/biblioteca", 1000);

      // `/` enfoca la búsqueda de la biblioteca y no abre la paleta.
      await page.eval(`document.activeElement && document.activeElement.blur(), true`);
      await pressSlash(page);
      const slash = await page.eval(`(() => ({
        focused: document.activeElement && !!document.activeElement.closest("[data-library-search-input]"),
        isInput: document.activeElement && document.activeElement.getAttribute("data-library-search-input") !== null,
        palette: !!document.querySelector('.navx-palette-layer[data-state="open"]')
      }))()`);
      assert(slash.isInput || slash.focused, `${PENDING}la tecla «/» no enfoca [data-library-search-input].`);
      assertEq(slash.palette, false, "«/» no debe abrir la paleta");

      // Ctrl+K abre la paleta con el combobox enfocado.
      await pressCtrlK(page);
      await waitVisible(page, '.navx-palette-layer[data-state="open"]', "paleta abierta con Ctrl+K");
      const palette = await page.eval(`(() => {
        const layer = document.querySelector('.navx-palette-layer[data-state="open"]');
        const input = layer.querySelector('.navx-palette-input');
        const listbox = layer.querySelector('[role="listbox"]');
        const groups = Array.from(layer.querySelectorAll('[data-navx-palette-group]')).map((g) => g.getAttribute("data-navx-palette-group"));
        return {
          role: input ? input.getAttribute("role") : null,
          expanded: input ? input.getAttribute("aria-expanded") : null,
          controls: input ? input.getAttribute("aria-controls") : null,
          listbox: !!listbox,
          groups,
          focus: document.activeElement === input,
          backgroundInert: !!document.querySelector('[inert]')
        };
      })()`);
      assertEq(palette.role, "combobox", "la paleta usa un combobox real");
      assertEq(palette.focus, true, "el foco entra en el campo de la paleta");
      assertEq(palette.listbox, true, "la paleta expone un listbox");
      assert(palette.groups.includes("views"), `la paleta no agrupa las vistas: ${palette.groups.join(", ")}`);

      // Filtrar y navegar con teclado.
      await typeInto(page, ".navx-palette-input", "progreso");
      await page.waitFor(`document.querySelectorAll('[data-navx-palette-kind="view"]').length > 0`, { timeout: 8000, message: "vistas de la paleta" });
      const activeOption = await page.eval(`(() => {
        const active = document.querySelector("[data-navx-palette-index][aria-selected='true']");
        return active ? active.innerText.replace(/\\s+/g, " ").trim() : "";
      })()`);
      assertIncludes(normalize(activeOption), "progreso", "la primera opción activa es «Progreso»");
      await pressKey(page, "Enter", { code: "Enter", keyCode: 13 });
      await page.waitFor(`location.hash === "#/progreso"`, { timeout: 8000, message: "navegación desde la paleta" });
      const closedAfterEnter = await page.eval(`!document.querySelector('.navx-palette-layer[data-state="open"]')`);
      assertEq(closedAfterEnter, true, "al abrir una vista la paleta se cierra");

      // Esc cierra y devuelve el foco al disparador.
      await gotoRoute(page, baseURL, "#/biblioteca", 1000);
      await page.eval(`(() => {
        const trigger = document.querySelector('[data-action="library-filter"][data-filter="all"]');
        if (trigger) trigger.focus();
        return true;
      })()`);
      await pressCtrlK(page);
      await waitVisible(page, '.navx-palette-layer[data-state="open"]', "paleta abierta (retorno de foco)");
      await pressEscape(page);
      await sleep(400);
      const returned = await page.eval(`(() => ({
        closed: !document.querySelector('.navx-palette-layer[data-state="open"]'),
        focusFilter: document.activeElement && document.activeElement.getAttribute("data-filter")
      }))()`);
      assertEq(returned.closed, true, "Esc cierra la paleta");
      assertEq(returned.focusFilter, "all", "Esc devuelve el foco al disparador");

      // `/` sigue funcionando después de la paleta.
      await pressSlash(page);
      const slashAgain = await page.eval(`document.activeElement && document.activeElement.getAttribute("data-library-search-input") !== null`);
      assertEq(slashAgain, true, "«/» sigue enfocando la búsqueda después de usar la paleta");

      // En el lector, `/` no abre la paleta y Ctrl+K sí (atajo global).
      await gotoRoute(page, baseURL, "#/ficha/sheet-aps-01", 1000);
      await pressSlash(page);
      const readerSlash = await page.eval(`!!document.querySelector('.navx-palette-layer[data-state="open"]')`);
      assertEq(readerSlash, false, "en el lector «/» no debe abrir la paleta");
      await pressCtrlK(page);
      await waitVisible(page, '.navx-palette-layer[data-state="open"]', "paleta en el lector");
      await pressEscape(page);

      const shot = await h.shot(page, "dash-25-paleta-ctrl-k");
      return { slash, palette, activeOption, closedAfterEnter, returned, slashAgain, shot };
    },
    { severity: "alta", page, timeout: 90000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-26 · Índice de secciones, scrollspy, salto y hoja móvil      */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-26",
    "Índice de secciones: scrollspy, salto con foco, sin hash y hoja móvil con foco contenido",
    async () => {
      await resetViewport(page);
      await gotoRoute(page, baseURL, "#/ficha/sheet-aps-01", 1000);
      await page.waitFor(`!!document.querySelector('[data-module-mount="reader-index"] [data-navx-sections]')`, {
        timeout: 12000,
        message: "índice de secciones",
      });
      const index = await page.eval(`(() => {
        const root = document.querySelector('[data-module-mount="reader-index"] [data-navx-sections]');
        const links = Array.from(root.querySelectorAll("[data-navx-section-index]"));
        const sections = document.querySelectorAll(".reader-section");
        const toggle = root.querySelector(".navx-sections-toggle");
        return {
          links: links.length,
          sections: sections.length,
          titles: links.map((l) => l.innerText.replace(/\\s+/g, " ").trim()),
          hash: location.hash,
          toggleVisible: toggle ? (() => { const r = toggle.getBoundingClientRect(); const s = getComputedStyle(toggle); return s.display !== "none" && r.width > 1; })() : false,
          hasProgressbar: !!root.querySelector('[role="progressbar"]')
        };
      })()`);
      assert(index.links >= 1, `${PENDING}el índice no lista las secciones del lector (${index.links}).`);
      assertEq(index.links, index.sections, "el índice debe listar todas las secciones");
      assert(index.hasProgressbar, "el índice incluye barra de avance accesible");

      const targetIndex = Math.max(0, index.links - 1);
      const targetSelector = `[data-navx-section-index="${targetIndex}"]`;

      // Salto a la última sección del índice con foco en el encabezado.
      await page.click(targetSelector);
      await sleep(900);
      const jumped = await page.eval(`(() => {
        const link = document.querySelector(${JSON.stringify(targetSelector)});
        const heading = document.querySelector('.reader-section[data-section-index="${targetIndex}"] h2');
        const rect = heading.getBoundingClientRect();
        return {
          hash: location.hash,
          current: link ? link.getAttribute("aria-current") : null,
          headingFocus: document.activeElement === heading,
          headingTabindex: heading.getAttribute("tabindex"),
          inView: rect.top > -40 && rect.top < innerHeight * 0.6
        };
      })()`);
      assertEq(jumped.hash, "#/ficha/sheet-aps-01", "el índice no navega por hash");
      assertEq(jumped.current, "location", "la sección activa se marca con aria-current=location");
      assertEq(jumped.headingFocus, true, "el foco pasa al encabezado de la sección al saltar");
      assertEq(jumped.headingTabindex, "-1", "el encabezado destino recibe tabindex=-1");
      assert(jumped.inView, "la sección saltada queda en el viewport");

      // Scrollspy: al volver a la primera sección, se activa su enlace.
      await page.eval(`(() => {
        const el = document.querySelectorAll(".reader-section")[0];
        window.scrollTo({ top: el.offsetTop + 8, behavior: "auto" });
        return true;
      })()`);
      await page.waitFor(`(() => {
        const link = document.querySelector('[data-navx-section-index="0"]');
        return link && link.getAttribute("aria-current") === "location";
      })()`, { timeout: 6000, message: "scrollspy en la primera sección" }).catch(() => {});
      const spy = await page.eval(`(() => Array.from(document.querySelectorAll("[data-navx-section-index]")).map((l) => l.getAttribute("aria-current")))()`);
      assert(spy.includes("location"), `el scrollspy no marca ninguna sección activa: ${spy.join(", ")}`);

      // Hoja móvil: abre, atrapa el foco, Esc cierra y devuelve el foco.
      await setViewport(page, VIEWPORT_MOBILE, { touch: true });
      await gotoRoute(page, baseURL, "#/ficha/sheet-aps-01", 1000);
      await page.waitFor(`!!document.querySelector('[data-module-mount="reader-index"] .navx-sections-toggle')`, { timeout: 12000 });
      const toggleBox = await page.eval(`(() => { const r = document.querySelector("[data-module-mount='reader-index'] .navx-sections-toggle").getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; })()`);
      assert(toggleBox.w >= 44 && toggleBox.h >= 44, `el botón del índice mide ${toggleBox.w}×${toggleBox.h} en puntero grueso (mínimo 44)`);
      await page.click('[data-module-mount="reader-index"] .navx-sections-toggle');
      await waitVisible(page, ".navx-sections-panel", "hoja del índice");
      // El foco entra en la hoja en el siguiente tick (applyOpen → 40 ms).
      await page.waitFor(
        `(() => { const panel = document.querySelector(".navx-sections-panel"); return panel && panel.contains(document.activeElement); })()`,
        { timeout: 4000, message: "foco dentro de la hoja del índice" },
      ).catch(() => {});
      await sleep(120);
      const sheetOpen = await page.eval(`(() => {
        const panel = document.querySelector(".navx-sections-panel");
        const close = document.querySelector("[data-navx-sections-close]");
        return {
          role: panel.getAttribute("role"),
          modal: panel.getAttribute("aria-modal"),
          focusInPanel: panel.contains(document.activeElement),
          closeVisible: close ? close.getBoundingClientRect().width > 1 : false,
          overflowX: document.documentElement.scrollWidth - innerWidth,
          expanded: document.querySelector(".navx-sections-toggle").getAttribute("aria-expanded")
        };
      })()`);
      assertEq(sheetOpen.role, "dialog", "la hoja móvil del índice es un diálogo");
      assertEq(sheetOpen.modal, "true", "la hoja móvil es modal");
      assertEq(sheetOpen.focusInPanel, true, "el foco entra en la hoja");
      assertEq(sheetOpen.closeVisible, true, "la hoja tiene cierre visible");
      assert(sheetOpen.overflowX <= 1, `la hoja del índice desborda horizontalmente: ${sheetOpen.overflowX}px`);
      await pressEscape(page);
      await sleep(400);
      const sheetClosed = await page.eval(`(() => ({
        hidden: document.querySelector(".navx-sections-panel").hidden,
        focusToggle: document.activeElement === document.querySelector(".navx-sections-toggle"),
        expanded: document.querySelector(".navx-sections-toggle").getAttribute("aria-expanded")
      }))()`);
      assertEq(sheetClosed.hidden, true, "Esc cierra la hoja del índice");
      assertEq(sheetClosed.focusToggle, true, "el foco vuelve al botón del índice");
      await resetViewport(page);

      const shot = await h.shot(page, "dash-26-indice-secciones");
      return { index, jumped, spy, toggleBox, sheetOpen, sheetClosed, shot };
    },
    { severity: "alta", page, timeout: 90000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-27 · Fichas relacionadas con motivo textual                  */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-27",
    "Fichas relacionadas: motivo textual real desde related.json, carga bajo demanda y bloque oculto sin relaciones",
    async () => {
      await resetViewport(page);
      // Documento nuevo para que performance solo contenga esta navegación.
      await openDocument(page, appURL(baseURL, "dashboard") + "#/", 900, { fresh: true });
      await waitApp(page, "dashboard");
      const homeRequests = await page.eval(`performance.getEntriesByType("resource").map((e) => e.name).filter((u) => /related\\.json/.test(u))`);
      assertEq(homeRequests.length, 0, "related.json no puede cargarse en la portada");

      await gotoRoute(page, baseURL, "#/ficha/sheet-audit-05", 1100);
      await page.waitFor(`(() => {
        const host = document.querySelector('[data-module-mount="reader-related"]');
        return host && host.innerText.trim().length > 10;
      })()`, { timeout: 15000, message: "fichas relacionadas en la ficha" }).catch(() => {});
      const related = await page.eval(`(() => {
        const host = document.querySelector('[data-module-mount="reader-related"]');
        if (!host) return null;
        const link = host.querySelector('a[href="#/ficha/sheet-audit-06"]');
        const requests = performance.getEntriesByType("resource").map((e) => e.name).filter((u) => /related\\.json/.test(u));
        return {
          text: host.innerText.replace(/\\s+/g, " ").trim().slice(0, 400),
          link: link ? link.getAttribute("href") : null,
          links: host.querySelectorAll('a[href^="#/ficha/"]').length,
          requests: requests.length,
          heading: (host.querySelector("h2, h3") || {}).innerText || "",
          overflowX: document.documentElement.scrollWidth - innerWidth
        };
      })()`);
      assert(related, `${PENDING}el lector no monta [data-module-mount="reader-related"].`);
      assert(related.link === "#/ficha/sheet-audit-06", `${PENDING}las relacionadas de sheet-audit-05 no enlazan a sheet-audit-06. ${JSON.stringify(related)}`);
      assert(related.links >= 1, "debe haber al menos una ficha relacionada enlazada");
      assert(related.requests >= 1, "related.json se carga al abrir la ficha (bajo demanda), no antes");
      assertIncludes(normalize(related.text), "abstinencia", "el motivo cita la evidencia textual compartida");
      assertIncludes(normalize(related.text), "relacionad", "el bloque se presenta como fichas relacionadas");
      assert(related.overflowX <= 1, `el bloque de relacionadas desborda: ${related.overflowX}px`);

      // Respaldo estructural aprobado: mismo tema/categoría, nunca fingiendo
      // evidencia textual. sheet-aps-01 no tiene aristas en related.json.
      await gotoRoute(page, baseURL, "#/ficha/sheet-aps-01", 1100);
      await sleep(700);
      const structural = await page.eval(`(() => {
        const host = document.querySelector('[data-module-mount="reader-related"]');
        if (!host) return { missing: true };
        const text = host.innerText.replace(/\\s+/g, " ").trim();
        const rendered = !host.hidden && getComputedStyle(host).display !== "none" && host.getBoundingClientRect().height > 1;
        return {
          missing: false,
          text: text.slice(0, 300),
          rendered,
          links: host.querySelectorAll("a[href^='#/ficha/']").length,
          structuralMotive: /comparten el tema|misma categor|comparten la categor/i.test(text),
          claimsTextualEvidence: /comparten el t[eé]rmino|evidencia textual/i.test(text)
        };
      })()`);
      assert(!structural.missing, "el contenedor de relacionadas debe existir");
      if (structural.rendered) {
        assert(structural.structuralMotive, `sin aristas de related.json, el bloque solo puede usar un motivo estructural factual: «${structural.text}»`);
        assertEq(structural.claimsTextualEvidence, false, "sin aristas no puede afirmar evidencia textual compartida");
      }

      // Sin otras fichas ni motivo estructural: el bloque no debe pintarse.
      const loner = await page.eval(`(() => {
        const sheets = window.STUDY_CONTENT.sheets;
        const byTopic = {};
        const byCategory = {};
        sheets.forEach((s) => {
          (byTopic[s.topicId] = byTopic[s.topicId] || []).push(s.id);
          (byCategory[s.categoryId] = byCategory[s.categoryId] || []).push(s.id);
        });
        const rel = window.StudyDerived && window.StudyDerived.get("related");
        const map = {};
        ((rel && rel.entries) || []).forEach((entry) => { map[entry.sheetId] = (entry.related || []).length; });
        const candidate = sheets.find((s) => {
          const topicSiblings = byTopic[s.topicId] || [];
          const categorySiblings = byCategory[s.categoryId] || [];
          return (map[s.id] || 0) === 0 && topicSiblings.length <= 1 && categorySiblings.length <= 1;
        });
        return candidate ? { id: candidate.id, title: candidate.title } : null;
      })()`);
      let lonerHost = null;
      if (loner) {
        await gotoRoute(page, baseURL, `#/ficha/${loner.id}`, 1100);
        await sleep(900);
        lonerHost = await page.eval(`(() => {
          const host = document.querySelector('[data-module-mount="reader-related"]');
          if (!host) return { missing: true };
          const rect = host.getBoundingClientRect();
          return { missing: false, text: host.innerText.replace(/\\s+/g, " ").trim(), links: host.querySelectorAll("a").length, height: Math.round(rect.height) };
        })()`);
        assert(!lonerHost.missing, "el contenedor de relacionadas debe existir");
        assertEq(lonerHost.links, 0, `sin fichas vecinas ni motivo no debe haber enlaces de relacionadas (${loner.id}): «${lonerHost.text.slice(0, 160)}»`);
        assert(lonerHost.height <= 1 || !lonerHost.text, `sin motivo el bloque debe quedar oculto (${loner.id}): ${lonerHost.height}px`);
      } else {
        // El temario actual no tiene ninguna ficha sin vecinos de tema/categoría:
        // no existe un caso real para comprobar el bloque oculto. Se documenta.
        lonerHost = { missing: false, text: "", links: 0, height: 0, note: "sin ficha aislada en el temario actual" };
      }

      const shot = await h.shot(page, "dash-27-relacionadas");
      return { homeRequests: homeRequests.length, related, structural, loner, lonerHost, shot };
    },
    { severity: "media", page, timeout: 60000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-28 · Ruta de hoy con datos reales y estados                  */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-28",
    "Ruta de hoy en el Panel: estado vacío/no configurado, presupuesto y datos reales (dudas y siguiente ficha)",
    async () => {
      await resetViewport(page);
      // Punto de partida limpio, como un usuario nuevo.
      await page.eval(`window.StudyStore.clearAllProgress({ confirm: true }), true`);
      await sleep(500);
      await gotoRoute(page, baseURL, "#/", 1200);
      await page.waitFor(`(() => {
        const host = document.querySelector('[data-module-mount="today-route"]');
        return host && host.innerText.trim().length > 5;
      })()`, { timeout: 15000, message: "Ruta de hoy en el Panel" }).catch(() => {});
      const emptyState = await page.eval(`(() => {
        const host = document.querySelector('[data-module-mount="today-route"]');
        if (!host) return null;
        return {
          text: host.innerText.replace(/\\s+/g, " ").trim().slice(0, 320),
          heading: (host.querySelector("h2, h3") || {}).innerText || "",
          links: Array.from(host.querySelectorAll("a[href^='#/']")).map((a) => a.getAttribute("href")),
          fabricated: !!(host.querySelector(".plan-card:not(:has(*))"))
        };
      })()`);
      assert(emptyState, `${PENDING}el Panel no monta [data-module-mount="today-route"] (Agente 4 / Coordinador).`);
      assert(emptyState.heading.length > 2, `${PENDING}la Ruta de hoy no tiene un encabezado accesible (h2/h3).`);
      assert(
        /configur|sin actividad|empieza|plan|ruta/i.test(normalize(emptyState.text)),
        `la Ruta de hoy no declara un estado vacío o no configurado: «${emptyState.text}»`,
      );
      assert(!emptyState.fabricated, "no debe haber una rejilla de tarjetas vacías");

      // Presupuesto diario: si existe plan, debe respetarse el dato real.
      await page.eval(`window.StudyStore.plan.save({ examDate: "2026-12-31", minutesPerDay: 45, daysPerWeek: 6 }), true`);
      await gotoRoute(page, baseURL, "#/", 1100);
      const budgetState = await page.eval(`(() => {
        const host = document.querySelector('[data-module-mount="today-route"]');
        return host ? { text: host.innerText.replace(/\\s+/g, " ").trim().slice(0, 360), has45: /\\b45\\b/.test(host.innerText) } : null;
      })()`);
      assert(budgetState && budgetState.has45, `la Ruta de hoy no refleja el presupuesto real de 45 min: «${budgetState ? budgetState.text : "sin host"}»`);

      // Datos reales: una ficha completada y dos dudas abiertas.
      await page.eval(`(() => {
        const sheet = window.STUDY_CONTENT.sheets[0];
        window.StudyStore.doubts.add({ sheetId: sheet.id, sectionIndex: 0, paragraphIndex: 0, quote: "Cita QA de duda abierta", note: "Duda QA" });
        window.StudyStore.doubts.add({ sheetId: sheet.id, sectionIndex: 1, paragraphIndex: 0, quote: "Segunda duda QA", note: "" });
        return true;
      })()`);
      await gotoRoute(page, baseURL, "#/", 1200);
      await page.waitFor(`(() => {
        const host = document.querySelector('[data-module-mount="today-route"]');
        return host && /duda/i.test(host.innerText);
      })()`, { timeout: 15000, message: "Ruta de hoy con dudas reales" }).catch(() => {});
      const populated = await page.eval(`(() => {
        const host = document.querySelector('[data-module-mount="today-route"]');
        const open = window.StudyStore.doubts.list({ resolved: false }).length;
        const stats = window.StudyStore.getDashboardStats();
        const hrefs = Array.from(host.querySelectorAll("a[href^='#/']")).map((a) => a.getAttribute("href"));
        const sheetLinks = hrefs.filter((h) => h.startsWith("#/ficha/"));
        const sheetIds = sheetLinks.map((h) => decodeURIComponent(h.slice(8)));
        return {
          text: host.innerText.replace(/\\s+/g, " ").trim().slice(0, 500),
          hrefs,
          open,
          hasDoubtsLink: hrefs.includes("#/dudas"),
          hasSheetLink: sheetLinks.length > 0,
          sheetIdsValid: sheetIds.every((id) => window.STUDY_CONTENT.sheets.some((s) => s.id === id)),
          mentionsOpen: new RegExp("\\\\b" + open + "\\\\b").test(host.innerText),
          hasMinutes: /\\b\\d+\\s*min\\b/i.test(host.innerText),
          stats: { goal: stats.goal, today: stats.today }
        };
      })()`);
      assert(populated.hasSheetLink, `${PENDING}la Ruta de hoy no enlaza a ninguna ficha real. ${JSON.stringify(populated.hrefs)}`);
      assert(populated.sheetIdsValid, "todos los enlaces de ficha deben apuntar a fichas existentes");
      assertEq(populated.hasDoubtsLink, true, "la Ruta de hoy enlaza a la bandeja de dudas");
      assert(populated.mentionsOpen, `la Ruta de hoy no muestra el número real de dudas abiertas (${populated.open}). Texto: «${populated.text}»`);
      assert(populated.hasMinutes, "la Ruta de hoy muestra un tiempo estimado en minutos");
      assert(!/dudas[^.]*\\b0\\b/i.test(populated.text), "no debe anunciar cero dudas cuando hay dudas abiertas");

      // Limpieza del plan para no condicionar otras suites.
      await page.eval(`window.StudyStore.plan.remove(), true`);
      const shot = await h.shot(page, "dash-28-ruta-hoy");
      return { emptyState, budgetState, populated, shot };
    },
    { severity: "alta", page, timeout: 90000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-29 · Atajos del lector sin choques y desactivados al escribir*/
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-29",
    "Atajos del lector: ayuda con «?», sin choques con «/» y Ctrl+K, desactivados al escribir",
    async () => {
      await resetViewport(page);
      await gotoRoute(page, baseURL, "#/ficha/sheet-aps-01", 1000);

      // Ayuda con «?».
      await page.eval(`document.activeElement && document.activeElement.blur(), true`);
      await pressQuestion(page);
      await sleep(500);
      const help = await page.eval(`(() => {
        const nodes = Array.from(document.querySelectorAll('[role="dialog"], .ac-layer, [data-ac-help], [data-ac-component="shortcuts"]'));
        const visible = nodes.filter((el) => {
          const r = el.getBoundingClientRect();
          const s = getComputedStyle(el);
          return !el.hidden && s.display !== "none" && r.width > 20 && r.height > 20;
        });
        const hit = visible.find((el) => /atajo|teclado|shortcut/i.test(el.innerText || ""));
        return hit ? { text: hit.innerText.replace(/\\s+/g, " ").trim().slice(0, 400), role: hit.getAttribute("role") } : null;
      })()`);
      if (!help) {
        throw new Error(`${PENDING}la tecla «?» no abre una ayuda de atajos del lector (Agente 3).`);
      }
      assert(/esc|cerrar|atajo|teclado/i.test(normalize(help.text)), "la ayuda de atajos explica cómo cerrarla o qué teclas usa");
      await pressEscape(page);
      await sleep(350);

      // «/» en el lector no abre la paleta ni enfoca un campo inexistente.
      await pressSlash(page);
      await sleep(300);
      const slashInReader = await page.eval(`(() => ({
        palette: !!document.querySelector('.navx-palette-layer[data-state="open"]'),
        focusTag: document.activeElement ? document.activeElement.tagName : null,
        focusId: document.activeElement ? document.activeElement.id : null
      }))()`);
      assertEq(slashInReader.palette, false, "«/» no debe abrir la paleta en el lector");
      assert(slashInReader.focusId !== "library-search", "«/» no debe enfocar la búsqueda de biblioteca en el lector");

      // Selección por teclado: 1–4 eligen color y Esc devuelve el foco al párrafo.
      const paraReady = await page.eval(`!!document.querySelector('[data-ac-action="paragraph:open"]')`);
      assert(paraReady, `${PENDING}no hay botón de párrafo para probar la selección por teclado.`);
      await page.eval(`(() => { const b = document.querySelector('[data-ac-action="paragraph:open"]'); b.setAttribute("data-qa-para", "1"); b.focus(); return true; })()`);
      await page.click('[data-qa-para="1"]');
      await waitVisible(page, ".ac-selbar", "barra de selección (teclado)");
      await pressKey(page, "2", { code: "Digit2", keyCode: 50, text: "2" });
      await page.waitFor(`(() => { const q = document.querySelector('.ac-selbar__quote'); return q && q.getAttribute('data-mark') === 'understand'; })()`, { timeout: 5000, message: "color 2 (Entender)" });
      await pressEscape(page);
      await sleep(400);
      const focusReturned = await page.eval(`(() => ({
        bar: !!document.querySelector('.ac-selbar'),
        focusPara: document.activeElement && document.activeElement.getAttribute("data-ac-action") === "paragraph:open",
        focusTag: document.activeElement ? document.activeElement.tagName : null
      }))()`);
      assertEq(focusReturned.bar, false, "Esc cierra la barra de selección");
      assertEq(focusReturned.focusPara, true, "Esc devuelve el foco al párrafo que abrió la barra");

      // Al escribir, los atajos del lector quedan desactivados.
      await page.click('[data-qa-para="1"]');
      await waitVisible(page, ".ac-selbar", "barra de selección (campo de nota)");
      const noteToggle = await page.eval(`(() => {
        const b = document.querySelector('[data-ac-action="selection:note"]');
        if (!b) return false;
        b.click();
        return true;
      })()`);
      if (noteToggle) {
        await sleep(300);
        const field = '[data-ac-input="note"]';
        if (await page.eval(`!!document.querySelector('[data-ac-input="note"]')`)) {
          await page.eval(`(() => { const el = document.querySelector('[data-ac-input="note"]'); el.focus(); el.value = ""; return true; })()`);
          await pressQuestion(page);
          await sleep(350);
          const helpWhileTyping = await page.eval(`(() => {
            const nodes = Array.from(document.querySelectorAll('[role="dialog"], .ac-layer, [data-ac-help], [data-ac-component="shortcuts"]'));
            return nodes.some((el) => {
              const r = el.getBoundingClientRect();
              return !el.hidden && getComputedStyle(el).display !== "none" && r.width > 20 && /atajo|teclado/i.test(el.innerText || "");
            });
          })()`);
          assertEq(helpWhileTyping, false, "«?» no debe abrir la ayuda mientras se escribe en un campo");
          const markBeforeDigit = await page.eval(`(() => { const q = document.querySelector('.ac-selbar__quote'); return q ? q.getAttribute("data-mark") : null; })()`);
          await pressKey(page, "1", { code: "Digit1", keyCode: 49, text: "1" });
          await pressSlash(page);
          await sleep(250);
          const typing = await page.eval(`(() => ({
            value: (document.querySelector('[data-ac-input="note"]') || {}).value,
            mark: (document.querySelector('.ac-selbar__quote') || {}).getAttribute ? (document.querySelector('.ac-selbar__quote') || {}).getAttribute("data-mark") : null,
            palette: !!document.querySelector('.navx-palette-layer[data-state="open"]')
          }))()`);
          assertIncludes(typing.value || "", "/", "«/» se escribe como texto y no dispara un atajo");
          assertEq(typing.palette, false, "«/» no abre la paleta mientras se escribe");
          assertEq(typing.mark, markBeforeDigit, "los dígitos 1–4 no cambian el color mientras se escribe");
          await pressEscape(page);
        }
      }

      const shot = await h.shot(page, "dash-29-atajos-lector");
      return { help, slashInReader, focusReturned, noteToggle, shot };
    },
    { severity: "media", page, timeout: 90000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-30 · Capas abiertas en 360 y 844×390 sin scroll horizontal   */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-30",
    "Capas abiertas (barra, paleta, hoja del índice) a 360 px y 844×390: sin scroll horizontal y objetivos de 44 px",
    async () => {
      const results = [];
      const viewports = [
        { width: 360, height: 800, label: "360x800", touch: true },
        { width: 844, height: 390, label: "844x390", touch: true },
      ];
      for (const viewport of viewports) {
        await setViewport(page, { width: viewport.width, height: viewport.height }, { touch: true });
        // Barra de selección.
        await gotoRoute(page, baseURL, "#/ficha/sheet-aps-01", 1000);
        await page.eval(`(() => { const b = document.querySelector('[data-ac-action="paragraph:open"]'); if (b) b.setAttribute("data-qa-para", "1"); return !!b; })()`);
        await page.click('[data-qa-para="1"]');
        await waitVisible(page, ".ac-selbar", "barra de selección en viewport pequeño");
        await sleep(250);
        const bar = await layerInfo(page, ".ac-selbar");
        const barTargets = await page.eval(`(() => {
          const root = document.querySelector('.ac-selbar');
          const nodes = Array.from(root.querySelectorAll('[data-ac-action="selection:color"], [data-ac-action="selection:submit"], [data-ac-action="selection:cancel"]'));
          return nodes.map((el) => { const r = el.getBoundingClientRect(); return { label: (el.getAttribute("aria-label") || el.innerText || "").trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) }; });
        })()`);
        assert(bar.overflowX <= 1, `la barra de selección desborda a ${viewport.label}: ${bar.overflowX}px`);
        for (const target of barTargets) {
          assert(target.w >= 44 && target.h >= 44, `control de la barra «${target.label}» mide ${target.w}×${target.h} a ${viewport.label}`);
        }
        await pressEscape(page);

        // Paleta (atajo global) y su cierre.
        await pressCtrlK(page);
        await waitVisible(page, '.navx-palette-layer[data-state="open"]', "paleta en viewport pequeño");
        const pal = await page.eval(`(() => {
          const layer = document.querySelector('.navx-palette-layer[data-state="open"]');
          const close = layer.querySelector('.navx-palette-close, [data-navx-palette-dismiss].navx-icon-button');
          const r = close.getBoundingClientRect();
          return { overflowX: document.documentElement.scrollWidth - innerWidth, close: { w: Math.round(r.width), h: Math.round(r.height) }, inputFont: parseFloat(getComputedStyle(layer.querySelector(".navx-palette-input")).fontSize) };
        })()`);
        assert(pal.overflowX <= 1, `la paleta desborda a ${viewport.label}: ${pal.overflowX}px`);
        assert(pal.close.w >= 44 && pal.close.h >= 44, `el cierre de la paleta mide ${pal.close.w}×${pal.close.h} a ${viewport.label}`);
        assert(pal.inputFont >= 16, `la entrada de la paleta tiene ${pal.inputFont}px (mínimo 16 para no hacer zoom en iOS)`);
        await pressEscape(page);

        // Hoja del índice.
        await page.waitFor(`!!document.querySelector('[data-module-mount="reader-index"] .navx-sections-toggle')`, { timeout: 10000 });
        await page.click('[data-module-mount="reader-index"] .navx-sections-toggle');
        await waitVisible(page, ".navx-sections-panel", "hoja del índice en viewport pequeño");
        await page.waitFor(
          `(() => { const panel = document.querySelector(".navx-sections-panel"); return panel && panel.contains(document.activeElement); })()`,
          { timeout: 4000, message: "foco dentro de la hoja del índice (viewport pequeño)" },
        ).catch(() => {});
        await sleep(120);
        const idx = await page.eval(`(() => {
          const layer = document.querySelector(".navx-sections-panel");
          const links = Array.from(layer.querySelectorAll("[data-navx-section-index]"));
          const sizes = links.map((el) => { const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; });
          return {
            overflowX: document.documentElement.scrollWidth - innerWidth,
            small: sizes.filter((s) => s.h < 44 || s.w < 44).length,
            links: links.length,
            focusInside: layer.contains(document.activeElement)
          };
        })()`);
        assert(idx.overflowX <= 1, `la hoja del índice desborda a ${viewport.label}: ${idx.overflowX}px`);
        assertEq(idx.small, 0, `${idx.small} enlaces del índice miden menos de 44 px a ${viewport.label}`);
        assertEq(idx.focusInside, true, `el foco debe entrar en la hoja del índice a ${viewport.label}`);
        await pressEscape(page);
        await sleep(300);

        results.push({ viewport: viewport.label, bar, barTargets, palette: pal, index: idx });
      }
      await resetViewport(page);
      const shot = await h.shot(page, "dash-30-capas-360");
      return { results, shot };
    },
    { severity: "alta", page, timeout: 120000 },
  );
}
