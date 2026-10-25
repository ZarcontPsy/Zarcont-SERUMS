// © 2026 ZARCONT — arnés CDP interno del Agente 7 (no es código de producción).
// Node 24 (WebSocket global). Uso: node cdp.mjs <tarea>
import fs from "node:fs";
import path from "node:path";

const CDP_HOST = "http://127.0.0.1:9337";
const BASE = "http://127.0.0.1:8777";
const OUT = path.resolve("AUDIT/evidencias");

async function getPageTarget() {
  const list = await (await fetch(`${CDP_HOST}/json/list`)).json();
  const page = list.find((t) => t.type === "page");
  if (!page) throw new Error("No hay página CDP");
  return page;
}

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      } else if (msg.method) {
        const arr = this.listeners.get(msg.method) || [];
        for (const fn of arr) fn(msg.params);
      }
    };
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  on(method, fn) {
    if (!this.listeners.has(method)) this.listeners.set(method, []);
    this.listeners.get(method).push(fn);
  }
  waitEvent(method, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`Timeout ${method}`)), timeout);
      this.on(method, (params) => { clearTimeout(t); resolve(params); });
    });
  }
  async eval(expression) {
    const r = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: false,
    });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  }
  async shot(name) {
    fs.mkdirSync(OUT, { recursive: true });
    const r = await this.send("Page.captureScreenshot", { format: "png", fromSurface: true });
    fs.writeFileSync(path.join(OUT, name), Buffer.from(r.data, "base64"));
    return path.join(OUT, name);
  }
}

async function connect() {
  const target = await getPageTarget();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  const cdp = new CDP(ws);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("DOM.enable");
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  return cdp;
}

async function navigate(cdp, url, wait = 2200) {
  const loaded = cdp.waitEvent("Page.loadEventFired", 20000).catch(() => null);
  await cdp.send("Page.navigate", { url });
  await loaded;
  await new Promise((r) => setTimeout(r, wait));
}

async function setViewport(cdp, width, height) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width, height, deviceScaleFactor: 1, mobile: false,
  });
  await new Promise((r) => setTimeout(r, 350));
}

const APPS = [
  { id: "dashboard", name: "Study Dashboard", url: `${BASE}/study-dashboard/index.html` },
  { id: "flashcards", name: "Study Flashcards", url: `${BASE}/study-flashcards/index.html` },
  { id: "quest", name: "SERUMS QUEST", url: `${BASE}/serums-quest/index.html` },
  { id: "plazas", name: "Plazas SERUMS", url: `${BASE}/serums%20map/serums-map-explorer/index.html` },
  { id: "banqueo", name: "Banqueo", url: `${BASE}/EXAMEN%20STUDIO/Examen%20Studio.html` },
];

const VIEWPORTS = [
  { w: 390, h: 844, tag: "390x844" },
  { w: 768, h: 1024, tag: "768x1024" },
  { w: 1440, h: 900, tag: "1440x900" },
];

const auditExpr = `(() => {
  const q = (s) => document.querySelector(s);
  const qa = (s) => Array.from(document.querySelectorAll(s));
  const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x:+r.x.toFixed(1), y:+r.y.toFixed(1), w:+r.width.toFixed(1), h:+r.height.toFixed(1), right:+r.right.toFixed(1), bottom:+r.bottom.toFixed(1) }; };
  const topbar = q('.s-appbar') || q('#q-appbar') || q('#topbar') || q('.topbar');
  const buttons = qa('[data-serums-chrome]').map((b) => {
    const cs = getComputedStyle(b);
    const r = b.getBoundingClientRect();
    const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
    const at = document.elementFromPoint(cx, cy);
    return {
      kind: b.getAttribute('data-serums-chrome'),
      tag: b.tagName,
      href: b.getAttribute('href'),
      label: b.getAttribute('aria-label'),
      title: b.getAttribute('title'),
      pressed: b.getAttribute('aria-pressed'),
      cls: b.className,
      rect: rect(b),
      color: cs.color,
      bg: cs.backgroundColor,
      fontSize: cs.fontSize,
      touch: r.width >= 40 && r.height >= 40,
      hitSelf: !!at && (at === b || b.contains(at)),
      visible: r.width > 0 && r.height > 0 && r.right > 0 && r.left < innerWidth && cs.visibility !== 'hidden' && cs.display !== 'none',
    };
  });
  const focusables = qa('a[href],button:not([disabled]):not([hidden]),[tabindex]:not([tabindex="-1"])').filter((el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0;
  });
  const chromeOrder = [];
  focusables.forEach((el, i) => { const k = el.getAttribute('data-serums-chrome'); if (k) chromeOrder.push({ k, i }); });
  return {
    title: document.title,
    hasApi: !!window.SerumsChrome,
    apiVersion: window.SerumsChrome && window.SerumsChrome.version,
    fullscreenEnabled: document.fullscreenEnabled,
    fullscreenElement: document.fullscreenElement ? document.fullscreenElement.tagName : null,
    inner: { w: innerWidth, h: innerHeight },
    docScrollW: document.documentElement.scrollWidth,
    bodyScrollW: document.body.scrollWidth,
    pageOverflowX: document.documentElement.scrollWidth > innerWidth + 1,
    topbar: rect(topbar),
    topbarScroll: topbar ? { scrollW: topbar.scrollWidth, clientW: topbar.clientWidth, overflow: topbar.scrollWidth > topbar.clientWidth + 1 } : null,
    buttons,
    chromeCount: buttons.length,
    chromeOrder,
    labels: buttons.map((b) => b.kind + ':' + b.label),
    themeIndex: focusables.findIndex((el) => el.hasAttribute('data-theme-toggle')),
    homeIndex: focusables.findIndex((el) => el.getAttribute('data-serums-chrome') === 'home'),
    hubIndex: focusables.findIndex((el) => el.getAttribute('data-serums-chrome') === 'hub'),
    fsIndex: focusables.findIndex((el) => el.getAttribute('data-serums-chrome') === 'fullscreen'),
    mountPresents: qa('[data-chrome-mount]').length,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    ready: document.readyState,
  };
})()`;

function luminance(rgb) {
  const m = rgb.match(/[\d.]+/g);
  if (!m) return null;
  const [r, g, b] = m.slice(0, 3).map(Number);
  const f = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(a, b) {
  if (a == null || b == null) return null;
  const hi = Math.max(a, b), lo = Math.min(a, b);
  return +((hi + 0.05) / (lo + 0.05)).toFixed(2);
}
function contrastOf(color, bg) {
  return ratio(luminance(color), luminance(bg));
}

async function runAudit() {
  const cdp = await connect();
  const report = [];
  for (const vp of VIEWPORTS) {
    await setViewport(cdp, vp.w, vp.h);
    for (const app of APPS) {
      await navigate(cdp, app.url, app.id === "banqueo" ? 3200 : 2000);
      const data = await cdp.eval(auditExpr);
      const colors = data.buttons.map((b) => contrastOf(b.color, b.bg === "rgba(0, 0, 0, 0)" ? "rgb(10,10,10)" : b.bg));
      data.contrast = colors;
      data.app = app.id;
      data.viewport = vp.tag;
      report.push(data);
      await cdp.shot(`agent7-${app.id}-${vp.tag}.png`);
      console.log(vp.tag, app.id, JSON.stringify({
        chrome: data.chromeCount,
        buttons: data.buttons.map((b) => [b.kind, b.rect.w, b.rect.h, b.label, b.pressed, b.hitSelf, b.visible]),
        overflowX: data.pageOverflowX,
        topbar: data.topbar,
        topbarScroll: data.topbarScroll,
        order: data.chromeOrder,
        fullscreenEnabled: data.fullscreenEnabled,
      }));
    }
  }
  fs.writeFileSync(path.join(OUT, "agent7-layout.json"), JSON.stringify(report, null, 2));
  cdp.ws.close();
}

async function findCenter(cdp, selector) {
  return cdp.eval(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height/2, w: r.width, h: r.height }; })()`);
}

async function realClick(cdp, x, y) {
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y, button: "none" });
  await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", buttons: 1, clickCount: 1 });
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", buttons: 0, clickCount: 1 });
}

async function state(cdp) {
  return cdp.eval(`(() => {
    const b = document.querySelector('[data-serums-chrome="fullscreen"]');
    return {
      fsElement: document.fullscreenElement ? document.fullscreenElement.tagName + '#' + (document.fullscreenElement.id || '') : null,
      enabled: document.fullscreenEnabled,
      inner: { w: innerWidth, h: innerHeight },
      screen: { w: screen.width, h: screen.height },
      pressed: b ? b.getAttribute('aria-pressed') : null,
      label: b ? b.getAttribute('aria-label') : null,
      title: b ? b.getAttribute('title') : null,
      iconState: b ? b.getAttribute('data-icon-state') : null,
      displayMode: matchMedia('(display-mode: fullscreen)').matches,
      bodyClass: document.documentElement.className,
    };
  })()`);
}

async function runFullscreen(appId = "dashboard", width = 1440, height = 900, native = false) {
  const cdp = await connect();
  const app = APPS.find((a) => a.id === appId);
  if (native) {
    await cdp.send("Emulation.clearDeviceMetricsOverride");
  } else {
    await setViewport(cdp, width, height);
  }
  await navigate(cdp, app.url, 2400);
  const out = { app: appId, viewport: native ? "nativo" : `${width}x${height}`, steps: [] };

  const before = await state(cdp);
  out.steps.push({ step: "inicial", state: before });

  const center = await findCenter(cdp, '[data-serums-chrome="fullscreen"]');
  if (!center) { out.error = "No se encontró el botón de pantalla completa"; console.log(JSON.stringify(out, null, 2)); return out; }

  await realClick(cdp, center.x, center.y);
  await new Promise((r) => setTimeout(r, 900));
  out.steps.push({ step: "click_entrar", state: await state(cdp), clicked: center });
  await cdp.shot(`agent7-fullscreen-${appId}-entered.png`);

  // Esc gestionado por el navegador (no hay listener de teclado propio).
  await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
  await new Promise((r) => setTimeout(r, 900));
  out.steps.push({ step: "esc", state: await state(cdp) });
  await cdp.shot(`agent7-fullscreen-${appId}-after-esc.png`);

  // Volver a entrar y salir con el botón (API nativa).
  const c2 = await findCenter(cdp, '[data-serums-chrome="fullscreen"]');
  await realClick(cdp, c2.x, c2.y);
  await new Promise((r) => setTimeout(r, 900));
  out.steps.push({ step: "click_entrar_2", state: await state(cdp) });

  const c3 = await findCenter(cdp, '[data-serums-chrome="fullscreen"]');
  await realClick(cdp, c3.x, c3.y);
  await new Promise((r) => setTimeout(r, 900));
  out.steps.push({ step: "click_salir", state: await state(cdp) });
  await cdp.shot(`agent7-fullscreen-${appId}-exited.png`);

  // Estado tras recarga / navegación interna
  out.api = await cdp.eval(`({ hub: window.SerumsChrome && window.SerumsChrome.hubHref(), fs: window.SerumsChrome && window.SerumsChrome.fullscreenEnabled, home: !!window.SerumsChrome.homeButton() })`);
  console.log(JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(OUT, `agent7-fullscreen-${appId}${native ? "-native" : ""}.json`), JSON.stringify(out, null, 2));
  cdp.ws.close();
  return out;
}

async function runNav(appId, width = 1440, height = 900) {
  const cdp = await connect();
  const app = APPS.find((a) => a.id === appId);
  await setViewport(cdp, width, height);
  await navigate(cdp, app.url, 2600);
  const route = { dashboard: "#/biblioteca", flashcards: "#/historial", quest: "#/personajes", banqueo: "#review", plazas: "" }[appId];
  if (route) {
    await cdp.eval(`location.hash = ${JSON.stringify(route)}; location.hash`);
    await new Promise((r) => setTimeout(r, 900));
  }
  let navs = [];
  cdp.on("Page.frameNavigated", (p) => { if (!p.frame.parentId) navs.push(p.frame.url); });
  const before = await cdp.eval(`({ hash: location.hash, url: location.href, heading: (document.querySelector('h1')||{}).textContent || '' })`);

  const center = await findCenter(cdp, '[data-serums-chrome="home"]');
  if (center) {
    await realClick(cdp, center.x, center.y);
    await new Promise((r) => setTimeout(r, 1000));
  }
  const afterHome = await cdp.eval(`({ hash: location.hash, url: location.href, heading: (document.querySelector('h1')||{}).textContent || '', active: document.activeElement && (document.activeElement.getAttribute('aria-label') || document.activeElement.tagName) })`);
  const navsAfterHome = navs.slice();

  const hub = await cdp.eval(`(() => { const a = document.querySelector('[data-serums-chrome="hub"]'); return a ? { attr: a.getAttribute('href'), resolved: a.href } : null; })()`);

  if (hub) {
    const loaded = cdp.waitEvent("Page.loadEventFired", 12000).catch(() => null);
    const c2 = await findCenter(cdp, '[data-serums-chrome="hub"]');
    await realClick(cdp, c2.x, c2.y);
    await loaded;
    await new Promise((r) => setTimeout(r, 600));
  }
  const afterHub = await cdp.eval(`({ url: location.href, title: document.title, hasHubCards: !!document.querySelector('[data-app], .card, .slide') })`);
  const out = { app: appId, route, before, homeClick: center ? { clicked: center, after: afterHome, frameNavigationsDuringHome: navsAfterHome } : { skipped: "sin botón Inicio" }, hub, afterHub };
  console.log(JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(OUT, `agent7-nav-${appId}.json`), JSON.stringify(out, null, 2));
  cdp.ws.close();
}

async function runA11y(appId, width = 390, height = 844) {
  const cdp = await connect();
  const app = APPS.find((a) => a.id === appId);
  await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await setViewport(cdp, width, height);
  await navigate(cdp, app.url, 2400);

  const base = await cdp.eval(`(() => {
    const qa = (s) => Array.from(document.querySelectorAll(s));
    const group = document.querySelector('[data-chrome-mount]');
    const before = qa('.serums-chrome').length;
    let after = before;
    if (group && window.SerumsChrome) {
      const opts = ${JSON.stringify({
        dashboard: { homeHref: "#/", appName: "Study Dashboard", buttonClass: "s-iconbtn", order: ["home", "hub", "fullscreen"] },
        flashcards: { homeHref: "#/", appName: "Study Flashcards", buttonClass: "s-iconbtn", order: ["home", "hub", "fullscreen"] },
        quest: { homeHref: "#/", appName: "SERUMS QUEST", buttonClass: "q-iconbtn", order: ["home", "hub", "fullscreen"] },
        plazas: { appName: "Plazas SERUMS", buttonClass: "btn sm icon", order: ["hub", "fullscreen"] },
        banqueo: { hubHref: "../index.html", homeHref: "#hub", appName: "Banqueo", buttonClass: "icon-btn", order: ["home", "hub", "fullscreen"] },
      })}[${JSON.stringify(appId)}];
      try { SerumsChrome.mount(group, opts); SerumsChrome.mount(group, opts); } catch (e) {}
      after = qa('.serums-chrome').length;
    }
    const buttons = qa('[data-serums-chrome]');
    const labels = qa('[aria-label]').map((el) => el.getAttribute('aria-label'));
    const dup = labels.filter((v, i) => labels.indexOf(v) !== i && /HUB|inicio|Pantalla/i.test(v));
    const bg = (el) => { let n = el; while (n && n.nodeType === 1) { const c = getComputedStyle(n).backgroundColor; const m = c.match(/rgba?\\(([\\d.]+),\\s*([\\d.]+),\\s*([\\d.]+)(?:,\\s*([\\d.]+))?\\)/); if (m && (m[4] === undefined || +m[4] > 0.9)) return c; n = n.parentElement; } return 'rgb(0,0,0)'; };
    const lum = (rgb) => { const m = rgb.match(/[\\d.]+/g); if (!m) return null; const f = (v) => { const c = +v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
    const ratio = (a, b) => { const hi = Math.max(a, b), lo = Math.min(a, b); return +((hi + 0.05) / (lo + 0.05)).toFixed(2); };
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    return {
      groupsBefore: before, groupsAfterDoubleMount: after,
      reducedMotion: reduced,
      buttons: buttons.map((b) => {
        const cs = getComputedStyle(b);
        return { kind: b.getAttribute('data-serums-chrome'), tag: b.tagName, type: b.getAttribute('type'), form: !!b.closest('form'), label: b.getAttribute('aria-label'), title: b.getAttribute('title'), pressed: b.getAttribute('aria-pressed'), minW: cs.minWidth, minH: cs.minHeight, transition: cs.transitionDuration, anim: cs.animationName, color: cs.color, bg: bg(b), contrast: ratio(lum(cs.color), lum(bg(b))), outlineWidth: cs.outlineWidth, outlineStyle: cs.outlineStyle };
      }),
      duplicateChromeLabels: dup,
      iconCount: qa('[data-serums-chrome] svg').length,
      forms: qa('form').length,
    };
  })()`);

  // Tabulación real: partir del primer elemento enfocable y registrar 20 pasos.
  const order = [];
  const prev = await cdp.eval(`(() => {
    const first = document.querySelector('a[href],button:not([disabled]):not([hidden]),[tabindex]:not([tabindex="-1"])');
    if (first) first.focus();
    return first ? (first.getAttribute('aria-label') || (first.textContent || '').trim().slice(0, 30)) : null;
  })()`);
  for (let i = 0; i < 20; i++) {
    await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
    await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
    await new Promise((r) => setTimeout(r, 120));
    const active = await cdp.eval(`(() => { const el = document.activeElement; if (!el) return null; const cs = getComputedStyle(el); return { tag: el.tagName, kind: el.getAttribute('data-serums-chrome'), label: el.getAttribute('aria-label') || (el.textContent||'').trim().slice(0,40), outline: cs.outlineWidth + ' ' + cs.outlineStyle + ' ' + cs.outlineColor, bg: cs.backgroundColor }; })()`);
    order.push(active);
  }
  base.tabOrder = order;
  base.startFocus = prev;
  console.log(JSON.stringify(base, null, 2));
  fs.writeFileSync(path.join(OUT, `agent7-a11y-${appId}.json`), JSON.stringify(base, null, 2));
  // Captura con el foco en el botón HUB (se enfoca por teclado).
  await cdp.eval(`document.querySelector('[data-serums-chrome="hub"]').focus()`);
  await cdp.shot(`agent7-focus-${appId}.png`);
  await cdp.send("Emulation.setEmulatedMedia", { features: [] });
  cdp.ws.close();
}

async function runNoFullscreen(appId) {
  const cdp = await connect();
  const app = APPS.find((a) => a.id === appId);
  const { identifier } = await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `Object.defineProperty(Document.prototype, 'fullscreenEnabled', { configurable: true, get: () => false });`,
  });
  await setViewport(cdp, 1440, 900);
  await navigate(cdp, app.url, 2400);
  const out = await cdp.eval(`(() => ({
    enabled: document.fullscreenEnabled,
    chromeCount: document.querySelectorAll('[data-serums-chrome]').length,
    kinds: Array.from(document.querySelectorAll('[data-serums-chrome]')).map((b) => b.getAttribute('data-serums-chrome')),
    status: (document.querySelector('.serums-chrome-status') || {}).textContent || '',
  }))()`);
  await cdp.shot(`agent7-nofullscreen-${appId}.png`);
  await cdp.send("Page.removeScriptToEvaluateOnNewDocument", { identifier });
  console.log(JSON.stringify({ app: appId, ...out }, null, 2));
  cdp.ws.close();
}

async function runFsError(appId) {
  const cdp = await connect();
  const app = APPS.find((a) => a.id === appId);
  await setViewport(cdp, 1440, 900);
  await navigate(cdp, app.url, 2400);
  const out = await cdp.eval(`(async () => {
    let err = null, rejection = null;
    document.addEventListener('fullscreenerror', () => { err = 'fullscreenerror'; }, { once: true });
    try { await window.SerumsChrome.requestFullscreen(); } catch (e) { rejection = e && e.name || String(e); }
    await new Promise((r) => setTimeout(r, 400));
    const b = document.querySelector('[data-serums-chrome="fullscreen"]');
    return { event: err, rejection, pressed: b && b.getAttribute('aria-pressed'), label: b && b.getAttribute('aria-label'), status: (document.querySelector('.serums-chrome-status') || {}).textContent || '', fsElement: document.fullscreenElement ? document.fullscreenElement.tagName : null };
  })()`);
  console.log(JSON.stringify({ app: appId, ...out }, null, 2));
  fs.writeFileSync(path.join(OUT, `agent7-fserror-${appId}.json`), JSON.stringify(out, null, 2));
  cdp.ws.close();
}

async function runLight(appId) {
  const cdp = await connect();
  const app = APPS.find((a) => a.id === appId);
  await setViewport(cdp, 1440, 900);
  await navigate(cdp, app.url, 2400);
  const out = await cdp.eval(`(async () => {
    document.documentElement.setAttribute('data-theme', 'light');
    await new Promise((r) => setTimeout(r, 500));
    const bg = (el) => { let n = el; while (n && n.nodeType === 1) { const c = getComputedStyle(n).backgroundColor; const m = c.match(/rgba?\\(([\\d.]+),\\s*([\\d.]+),\\s*([\\d.]+)(?:,\\s*([\\d.]+))?\\)/); if (m && (m[4] === undefined || +m[4] > 0.9)) return c; n = n.parentElement; } return 'rgb(255,255,255)'; };
    const lum = (rgb) => { const m = rgb.match(/[\\d.]+/g); if (!m) return null; const f = (v) => { const c = +v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
    const ratio = (a, b) => { const hi = Math.max(a, b), lo = Math.min(a, b); return +((hi + 0.05) / (lo + 0.05)).toFixed(2); };
    const theme = document.documentElement.getAttribute('data-theme');
    return { theme, bodyBg: getComputedStyle(document.body).backgroundColor, buttons: Array.from(document.querySelectorAll('[data-serums-chrome]')).map((b) => { const cs = getComputedStyle(b); return { kind: b.getAttribute('data-serums-chrome'), color: cs.color, bg: bg(b), contrast: ratio(lum(cs.color), lum(bg(b))), label: b.getAttribute('aria-label') }; }) };
  })()`);
  console.log(JSON.stringify({ app: appId, ...out }, null, 2));
  fs.writeFileSync(path.join(OUT, `agent7-light-${appId}.json`), JSON.stringify(out, null, 2));
  cdp.shot(`agent7-light-${appId}.png`);
  cdp.ws.close();
}

const task = process.argv[2] || "audit";
if (task === "audit") await runAudit();
else if (task === "probe") {
  const cdp = await connect();
  const widths = (process.argv[3] || "390").split(",").map(Number);
  const apps = (process.argv[4] || "dashboard").split(",");
  for (const appId of apps) {
    const app = APPS.find((a) => a.id === appId);
    for (const width of widths) {
      const height = Number(process.argv[5] || 844);
      await setViewport(cdp, width, height);
      await navigate(cdp, app.url, appId === "banqueo" ? 3200 : 2000);
      const info = await cdp.eval(`(() => {
        const r = (el) => { const b = el.getBoundingClientRect(); return { cls: String(el.className || el.getAttribute('data-serums-chrome') || '').slice(0,60), kind: el.getAttribute('data-serums-chrome'), tag: el.tagName, x:+b.x.toFixed(1), y:+b.y.toFixed(1), w:+b.width.toFixed(1), h:+b.height.toFixed(1), right:+b.right.toFixed(1), bottom:+b.bottom.toFixed(1), text: (el.textContent||'').trim().slice(0,30), display: getComputedStyle(el).display, vis: getComputedStyle(el).visibility }; };
        const bar = document.querySelector('.s-appbar') || document.querySelector('#q-appbar') || document.querySelector('#topbar') || document.querySelector('.topbar');
        const inner = bar ? (bar.querySelector('.s-appbar-inner, .q-appbar-inner') || bar) : null;
        const groups = inner ? Array.from(inner.children) : [];
        const named = {};
        const map = { '.s-brand':'brand', '.s-nav':'nav', '.s-appbar-actions':'actions', '.q-brand':'brand', '.q-nav':'nav', '.q-appbar-actions':'actions' };
        for (const [sel, key] of Object.entries(map)) { const el = inner && inner.querySelector(':scope > ' + sel); if (el) named[key] = r(el); }
        const children = inner ? Array.from(inner.querySelectorAll(':scope > *')).map(r) : [];
        const actions = inner && (inner.querySelector('.s-appbar-actions') || inner.querySelector('.q-appbar-actions') || inner);
        const actionKids = actions ? Array.from(actions.children).map(r) : [];
        const tb = bar ? r(bar) : null;
        return {
          width: innerWidth, bar: tb, inner: inner ? r(inner) : null, named, children, actionKids,
          navLinks: Array.from(document.querySelectorAll('.s-navlink')).map((el) => ({ ...r(el), svg: !!el.querySelector('svg'), label: el.getAttribute('aria-label'), textHidden: getComputedStyle(el.querySelector('span:last-child')).display === 'none' })),
          pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
          docScrollW: document.documentElement.scrollWidth,
          topbarScroll: bar ? { sw: bar.scrollWidth, cw: bar.clientWidth } : null,
          fsEnabled: document.fullscreenEnabled,
          offenders: Array.from(document.querySelectorAll('body *')).filter((el) => {
            const b = el.getBoundingClientRect();
            return b.width > 0 && b.right > innerWidth + 1 && getComputedStyle(el).position !== 'fixed' && !el.closest('.topbar') && !el.closest('.s-appbar') && !el.closest('.q-appbar');
          }).slice(0, 8).map((el) => ({ tag: el.tagName, cls: String(el.className || '').slice(0, 50), right: +el.getBoundingClientRect().right.toFixed(1), w: +el.getBoundingClientRect().width.toFixed(1) })),
        };
      })()`);
      const overlaps = [];
      const groups = info.children || [];
      for (let i = 0; i < groups.length; i++) for (let j = i + 1; j < groups.length; j++) {
        const a = groups[i], b = groups[j];
        if (a.w && b.w && a.x < b.right - 0.5 && b.x < a.right - 0.5 && a.y < b.bottom - 0.5 && b.y < a.bottom - 0.5) {
          overlaps.push([a.cls || a.kind || a.tag, b.cls || b.kind || b.tag, +(Math.min(a.right, b.right) - Math.max(a.x, b.x)).toFixed(1)]);
        }
      }
      const ak = info.actionKids || [];
      for (let i = 0; i < ak.length; i++) for (let j = i + 1; j < ak.length; j++) {
        const a = ak[i], b = ak[j];
        if (a.w && b.w && a.x < b.right - 0.5 && b.x < a.right - 0.5) overlaps.push(["action:" + (a.kind || a.cls), "action:" + (b.kind || b.cls), 0]);
      }
      info.overlaps = overlaps;
      info.app = appId;
      console.log(width, appId, JSON.stringify({ named: info.named, navLinks: info.navLinks, children: info.children, actionKids: info.actionKids.map((k) => [k.kind || k.cls, k.x, k.w, k.right, k.display, k.vis]), overlaps, pageOverflow: info.pageOverflow, docScrollW: info.docScrollW, offenders: info.offenders, topbar: info.bar, topbarScroll: info.topbarScroll }));
      const shot = await cdp.send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width, height: 84, scale: 2 }, fromSurface: true });
      fs.mkdirSync(OUT, { recursive: true });
      fs.writeFileSync(path.join(OUT, `agent7-topbar-${appId}-${width}.png`), Buffer.from(shot.data, "base64"));
    }
  }
  cdp.ws.close();
} else if (task === "fullscreen") await runFullscreen(process.argv[3] || "dashboard", Number(process.argv[4] || 1440), Number(process.argv[5] || 900));
else if (task === "fullscreen-native") await runFullscreen(process.argv[3] || "dashboard", 0, 0, true);
else if (task === "fullscreen-all") {
  for (const app of ["dashboard", "flashcards", "quest", "plazas", "banqueo"]) {
    await runFullscreen(app, 1440, 900);
  }
} else if (task === "nav") {
  for (const app of (process.argv[3] || "dashboard,flashcards,quest,plazas,banqueo").split(",")) await runNav(app);
} else if (task === "a11y") {
  for (const app of (process.argv[3] || "dashboard,flashcards,quest,plazas,banqueo").split(",")) await runA11y(app, Number(process.argv[4] || 390), Number(process.argv[5] || 844));
} else if (task === "nofs") {
  await runNoFullscreen(process.argv[3] || "dashboard");
} else if (task === "fserror") {
  await runFsError(process.argv[3] || "dashboard");
} else if (task === "light") {
  for (const app of (process.argv[3] || "dashboard,flashcards,quest,plazas,banqueo").split(",")) await runLight(app);
} else {
  console.error("Tarea desconocida:", task);
  process.exit(1);
}
