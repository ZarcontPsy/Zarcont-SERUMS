/* © 2026 ZARCONT — Definiciones de aplicaciones y esperas de arranque (Agente 8). */
import { assert } from "./harness.mjs";

export const APPS = {
  hub: {
    id: "hub",
    name: "Hub",
    path: "/index.html",
    title: /SERUMS HUB/,
    ready: "!!document.querySelector('.app-card[data-app]') && !document.getElementById('overlay').classList.contains('open')",
  },
  dashboard: {
    id: "dashboard",
    name: "Study Dashboard",
    path: "/study-dashboard/index.html",
    title: /Study Dashboard/,
    ready: "!document.getElementById('view-root').hidden && document.getElementById('view-root').innerText.trim().length > 20",
  },
  flashcards: {
    id: "flashcards",
    name: "Study Flashcards",
    path: "/study-flashcards/index.html",
    title: /Study Flashcards/,
    ready: "!document.getElementById('view-root').hidden && document.getElementById('view-root').innerText.trim().length > 20",
  },
  quest: {
    id: "quest",
    name: "SERUMS QUEST",
    path: "/serums-quest/index.html",
    title: /SERUMS QUEST/,
    ready: "!document.getElementById('view').hidden && document.getElementById('view').innerText.trim().length > 20",
  },
  plazas: {
    id: "plazas",
    name: "Plaza SERUMS",
    path: "/serums map/serums-map-explorer/index.html",
    title: /SERUMS Map Explorer/,
    ready:
      "!!window.SERUMS_DATA && document.querySelector('#datasetBadge') && !/Cargando/.test(document.querySelector('#datasetBadge').textContent)",
  },
  banqueo: {
    id: "banqueo",
    name: "Banqueo · Examen Studio",
    path: "/EXAMEN STUDIO/Examen Studio.html",
    title: /Banqueo/,
    ready: "!!window.BANCO_OFICIAL && !!document.querySelector('#app .hub-hero, #app .page, #app .practice-shell')",
  },
};

export function appURL(baseURL, app) {
  return new URL(APPS[app].path, baseURL).href;
}

export function jsReady(app) {
  return `(() => { try { return !!(${APPS[app].ready}); } catch (e) { return false; } })()`;
}

export async function waitApp(page, app, timeout = 25000) {
  await page.waitFor(jsReady(app), { timeout, message: `arranque de ${APPS[app].name}` });
  return true;
}

export async function gotoApp(page, baseURL, app, { settle = 600 } = {}) {
  const before = page.navCount();
  await page.goto(appURL(baseURL, app), { settle });
  await waitApp(page, app);
  const title = await page.eval("document.title");
  assert(APPS[app].title.test(title), `título inesperado en ${APPS[app].name}: ${title}`);
  return { url: await page.eval("location.href"), title, navigations: page.navCount() - before };
}

export async function currentUrl(page) {
  return page.eval("location.href");
}

export async function pathOf(page) {
  return page.eval("location.pathname + location.hash + location.search");
}

/** Busca el primer selector visible de una lista y devuelve el selector usado. */
export async function firstVisible(page, selectors) {
  for (const selector of selectors) {
    const found = await page.eval(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return false;
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== "none" && s.visibility !== "hidden" && r.width > 1 && r.height > 1;
    })()`);
    if (found) return selector;
  }
  return null;
}

export async function clickFirst(page, selectors, { index = 0, timeout = 8000 } = {}) {
  const selector = await firstVisible(page, selectors);
  if (!selector) throw new Error(`Ninguno de los selectores está visible: ${selectors.join(" | ")}`);
  const rect = await page.click(selector, { index, timeout });
  return { selector, rect };
}

export async function clickIfPresent(page, selector, index = 0) {
  const found = await page.eval(`!!document.querySelector(${JSON.stringify(selector)})`);
  if (!found) return null;
  try {
    return await page.click(selector, { index });
  } catch {
    return null;
  }
}

export async function text(page, selector) {
  return page
    .eval(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); return el ? (el.innerText || "").trim() : null; })()`)
    .catch(() => null);
}

export async function count(page, selector) {
  return page.eval(`document.querySelectorAll(${JSON.stringify(selector)}).length`);
}

export async function hash(page) {
  return page.eval("location.hash");
}

export function storageGet(page, key) {
  return page.eval(`localStorage.getItem(${JSON.stringify(key)})`);
}

export function storageSet(page, key, value) {
  return page.eval(`localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)}), true`);
}

/** Errores propios del producto (excluye fallos de red externos y favicon). */
export function productErrors(errors, { ignoreExternal = true } = {}) {
  const externalHosts = [
    "maps.googleapis.com",
    "maps.gstatic.com",
    "fonts.googleapis.com",
    "fonts.gstatic.com",
    "cdnjs.cloudflare.com",
    "cdn.jsdelivr.net",
    "unpkg.com",
    "cdn.sheetjs.com",
  ];
  const isExternal = (url) => {
    if (!url) return false;
    try {
      const u = new URL(url);
      return externalHosts.some((h) => u.hostname === h || u.hostname.endsWith("." + h));
    } catch {
      return false;
    }
  };
  const exceptions = errors.exceptions.map((e) => `${e.text} ${e.description} @ ${e.url}:${e.line}`.trim());
  const externalMessage = /Maps Demo Key|Google Maps|quota|maps\.googleapis|maps\.gstatic/i;
  const consoleErrors = errors.consoleErrors
    .map((e) => e.text)
    .filter((t) => !/favicon\.ico/.test(t))
    .filter((t) => !(ignoreExternal && externalMessage.test(t)));
  const logErrors = errors.logErrors
    .filter((e) => !/favicon\.ico/.test(e.url || "") && !/favicon\.ico/.test(e.text || ""))
    .filter((e) => !(ignoreExternal && (isExternal(e.url) || externalMessage.test(e.text || ""))));
  const networkFailures = errors.networkFailures.filter((e) => !(ignoreExternal && isExternal(e.url)) && !e.canceled);
  return { exceptions, consoleErrors, logErrors, networkFailures };
}

export function explainErrors(errors) {
  const p = productErrors(errors);
  const total = p.exceptions.length + p.consoleErrors.length + p.logErrors.length + p.networkFailures.length;
  return { productErrorCount: total, ...p };
}
