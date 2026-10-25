/* © 2026 ZARCONT — Auditoría Agente 3 (hub): arnés CDP de medición.
   Uso: node agent3-measure.mjs --mode=before|after --out=archivo.json [--screens]
   Requiere servidor 127.0.0.1:8773 y Chrome headless con CDP en 9333. */
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, "").split("=");
    return [k, v.length ? v.join("=") : true];
  })
);
const MODE = args.mode || "before";
const OUT = args.out || path.join(import.meta.dirname, `agent3-${MODE}-metrics.json`);
const SHOTS = !!args.screens;
const PORT = 9333;
const URL = `http://127.0.0.1:8773/index.html?a3=${Date.now()}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const VIEWPORTS = [
  { name: "320x568", width: 320, height: 568, mobile: false },
  { name: "360x640", width: 360, height: 640, mobile: false },
  { name: "390x844", width: 390, height: 844, mobile: false },
  { name: "414x896", width: 414, height: 896, mobile: false },
  { name: "768x1024", width: 768, height: 1024, mobile: false },
  { name: "1024x768", width: 1024, height: 768, mobile: false },
  { name: "1280x800", width: 1280, height: 800, mobile: false },
  { name: "1440x900", width: 1440, height: 900, mobile: false },
  { name: "568x320-landscape", width: 568, height: 320, mobile: false },
  { name: "844x390-landscape", width: 844, height: 390, mobile: false },
  { name: "1280x720", width: 1280, height: 720, mobile: false }
];

class CDP {
  constructor(wsUrl) {
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
    this.ws = new WebSocket(wsUrl);
    this.ready = new Promise((res, rej) => {
      this.ws.addEventListener("open", res, { once: true });
      this.ws.addEventListener("error", rej, { once: true });
    });
    this.ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      } else if (msg.method) {
        for (const fn of this.listeners.get(msg.method) || []) fn(msg.params);
      }
    });
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
  close() { try { this.ws.close(); } catch {} }
}

async function newTarget() {
  const res = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(URL)}`, { method: "PUT" });
  return res.json();
}

const MEASURE = String.raw`(() => {
  const vw = window.innerWidth, vh = window.innerHeight;
  const de = document.documentElement, body = document.body;
  const r = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1),
             top: +b.top.toFixed(1), right: +b.right.toFixed(1), bottom: +b.bottom.toFixed(1), left: +b.left.toFixed(1) };
  };
  const visible = (el) => {
    const cs = getComputedStyle(el);
    const b = el.getBoundingClientRect();
    return cs.display !== "none" && cs.visibility !== "hidden" && +cs.opacity > .01 && b.width > 0 && b.height > 0;
  };
  const q = (s) => document.querySelector(s);
  const qa = (s) => Array.from(document.querySelectorAll(s));
  const card = q(".app-card.is-active");
  const topbar = q(".topbar");
  const carousel = q(".carousel");
  const stage = q("main#stage");
  const bar = q(".carousel-bar");
  const dots = q(".dots");
  const shell = q(".carousel-shell");
  const ccs = carousel ? getComputedStyle(carousel) : null;

  const cardBody = card && card.querySelector(".app-body");
  const bodyRect = cardBody && cardBody.getBoundingClientRect();
  const bodyOverflow = cardBody ? {
    clientHeight: cardBody.clientHeight, scrollHeight: cardBody.scrollHeight,
    clipped: cardBody.scrollHeight > cardBody.clientHeight + 1,
    children: Array.from(cardBody.children).map((el) => {
      const b = el.getBoundingClientRect();
      return { cls: el.className || el.tagName, bottom: +b.bottom.toFixed(1),
               overflows: bodyRect ? b.bottom > bodyRect.bottom + 1 : false };
    })
  } : null;

  const cardArt = card && card.querySelector(".app-art");
  const artRect = cardArt && cardArt.getBoundingClientRect();

  const selectors = [".topbar", ".topbar *", ".carousel-shell", ".carousel",
    ".carousel-bar", ".carousel-bar *", ".dots", ".dots *",
    ".app-card.is-active", ".app-card.is-active *", ".app-card.is-left", ".app-card.is-right"];
  const violations = [];
  for (const sel of selectors) {
    for (const el of qa(sel)) {
      if (!visible(el)) continue;
      if (el.closest(".app-art")) continue; // arte decorativo recortado por overflow:hidden
      const b = el.getBoundingClientRect();
      if (b.left < -1 || b.right > vw + 1) {
        violations.push({ sel, cls: (el.className && String(el.className).slice(0, 42)) || el.tagName,
          left: +b.left.toFixed(1), right: +b.right.toFixed(1), width: +b.width.toFixed(1) });
      }
    }
  }

  const belowFold = [];
  for (const [name, el] of [["topbar", topbar], ["card", card], ["bar", bar], ["dots", dots]]) {
    if (!el) continue;
    const b = el.getBoundingClientRect();
    if (b.bottom > vh + 1 || b.top < -1) belowFold.push({ name, top: +b.top.toFixed(1), bottom: +b.bottom.toFixed(1), vh });
  }

  const targets = {};
  for (const [name, sel] of Object.entries({ prevTop: "#prevTop", nextTop: "#nextTop", btnFs: "#btnFs",
    btnHelp: "#btnHelp", btnAbout: "#btnAbout", prevBtn: "#prevBtn", nextBtn: "#nextBtn", openCurrent: "#openCurrent" })) {
    const el = q(sel);
    if (!el) { targets[name] = null; continue; }
    const b = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    targets[name] = { w: +b.width.toFixed(1), h: +b.height.toFixed(1), display: cs.display, visible: visible(el) };
  }
  const dotEls = qa(".dots .dot");
  targets.dot = dotEls.length ? { w: +dotEls[0].getBoundingClientRect().width.toFixed(1),
    h: +dotEls[0].getBoundingClientRect().height.toFixed(1), count: dotEls.length, visible: visible(dotEls[0]) } : null;
  const fs = q("#btnFs");
  const btnFs = fs ? {
    visible: visible(fs), hidden: fs.hidden, display: getComputedStyle(fs).display,
    rect: r(fs), ariaLabel: fs.getAttribute("aria-label"), ariaPressed: fs.getAttribute("aria-pressed"),
    title: fs.getAttribute("title"), dataTip: fs.getAttribute("data-tip"),
    fullscreenEnabled: !!document.fullscreenEnabled, fullscreenElement: !!document.fullscreenElement
  } : null;

  const tbChildren = topbar ? Array.from(topbar.children).map((el) => ({ cls: el.className, rect: r(el) })) : [];
  return {
    mode: null,
    viewport: { width: vw, height: vh, dpr: window.devicePixelRatio },
    doc: { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth, scrollHeight: de.scrollHeight,
           clientHeight: de.clientHeight, bodyScrollWidth: body.scrollWidth, innerWidth: vw, innerHeight: vh,
           horizontalOverflow: de.scrollWidth > de.clientWidth, verticalOverflow: de.scrollHeight > de.clientHeight },
    cardVars: ccs ? { cardW: ccs.getPropertyValue("--card-w").trim(), cardH: ccs.getPropertyValue("--card-h").trim(),
                      grid: ccs.getPropertyValue("--card-w").trim() } : null,
    stage: stage ? { rect: r(stage), clientHeight: stage.clientHeight, scrollHeight: stage.scrollHeight,
                     paddingTop: getComputedStyle(stage).paddingTop, paddingBottom: getComputedStyle(stage).paddingBottom } : null,
    topbar: topbar ? { rect: r(topbar), scrollWidth: topbar.scrollWidth, clientWidth: topbar.clientWidth,
                       overflowInside: topbar.scrollWidth > topbar.clientWidth + 1, children: tbChildren,
                       contentOverflow: (() => {
                         const cs = getComputedStyle(topbar), tr = topbar.getBoundingClientRect();
                         const left = tr.left + parseFloat(cs.paddingLeft), right = tr.right - parseFloat(cs.paddingRight);
                         return Array.from(topbar.children).filter((el) => {
                           const s = getComputedStyle(el), b = el.getBoundingClientRect();
                           return s.display !== "none" && b.width > 0 && (b.right > right + 1 || b.left < left - 1);
                         }).map((el) => ({ cls: el.className, left: +el.getBoundingClientRect().left.toFixed(1), right: +el.getBoundingClientRect().right.toFixed(1) }));
                       })() } : null,
    carousel: carousel ? { rect: r(carousel), cardW: r(card) } : null,
    active: card ? { rect: r(card), index: card.getAttribute("data-index"), app: card.getAttribute("data-app"),
                     href: card.getAttribute("href"), ariaCurrent: card.getAttribute("aria-current"),
                     tabIndex: card.tabIndex, art: artRect ? r(cardArt) : null } : null,
    bar: bar ? { rect: r(bar), scrollWidth: bar.scrollWidth, clientWidth: bar.clientWidth } : null,
    dots: dots ? { rect: r(dots), scrollWidth: dots.scrollWidth, clientWidth: dots.clientWidth } : null,
    shell: shell ? r(shell) : null,
    bodyContent: bodyOverflow,
    violations, belowFold, targets, btnFs,
    dockPresent: !!q(".dock, #dock"),
    selection: {
      dotsActive: qa(".dot.is-active").length,
      cardsActive: qa(".app-card.is-active").length,
      right: qa(".app-card.is-right").length, left: qa(".app-card.is-left").length,
      hidden: qa(".app-card.is-hidden").length,
      barTitle: (q("#barTitle") || {}).textContent, tbNow: (q("#tbNow") || {}).textContent,
      tbPos: (q("#tbPos") || {}).textContent, openLabel: (q("#openCurrent") || {}).getAttribute && q("#openCurrent").getAttribute("aria-label"),
      live: (q("#carouselLive") || {}).textContent
    },
    fonts: { status: document.fonts ? document.fonts.status : "n/a", zenDots: document.fonts ? document.fonts.check("10px 'Zen Dots'") : "n/a",
             inter: document.fonts ? document.fonts.check("12px Inter") : "n/a" },
    bottomInsetEnv: (() => { const d = document.createElement("div"); d.style.cssText = "position:fixed;bottom:0;height:env(safe-area-inset-bottom,0px);"; document.body.appendChild(d);
      const h = d.getBoundingClientRect().height; d.remove(); return h; })(),
    scrollbar: { innerWidth: vw, clientWidth: de.clientWidth }
  };
})()`;

async function run() {
  const target = await newTarget();
  const cdp = new CDP(target.webSocketDebuggerUrl);
  await cdp.ready;
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Log.enable");
  const errors = [];
  cdp.on("Runtime.exceptionThrown", (p) => errors.push({ kind: "exception", text: p.exceptionDetails?.text, url: p.exceptionDetails?.url, line: p.exceptionDetails?.lineNumber }));
  cdp.on("Runtime.consoleAPICalled", (p) => { if (p.type === "error" || p.type === "warning") errors.push({ kind: p.type, text: (p.args || []).map((a) => a.value ?? a.description).join(" ") }); });
  cdp.on("Log.entryAdded", (p) => { if (p.entry?.level === "error") errors.push({ kind: "log", text: p.entry.text, url: p.entry.url }); });

  await sleep(600);
  await cdp.send("Runtime.evaluate", { expression: `(() => { const s = document.createElement('style'); s.id = 'a3-nomotion'; s.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}'; document.head.appendChild(s); })()` });
  const navs = [];
  cdp.on("Page.frameNavigated", (p) => { if (!p.frame.parentId) navs.push({ url: p.frame.url, t: Date.now() }); });

  const out = { mode: MODE, url: URL, timestamp: new Date().toISOString(), viewports: [], navTest: null, errors: [] };
  for (const vp of VIEWPORTS) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: vp.width, height: vp.height, deviceScaleFactor: 1, mobile: vp.mobile,
      screenOrientation: { type: vp.width > vp.height ? "landscapePrimary" : "portraitPrimary", angle: vp.width > vp.height ? 90 : 0 }
    });
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: vp.mobile ? 5 : 1 });
    await cdp.send("Runtime.evaluate", { expression: "window.scrollTo(0,0)", returnByValue: true });
    await sleep(950);
    const res = await cdp.send("Runtime.evaluate", { expression: MEASURE, returnByValue: true });
    const data = res.result.value;
    data.name = vp.name;
    data.cssWidth = vp.width;
    data.cssHeight = vp.height;
    // Contenido de las cinco cartillas: recorte real de .app-body por altura.
    const cardsContent = [];
    for (let i = 0; i < 5; i++) {
      await cdp.send("Runtime.evaluate", { expression: `document.querySelectorAll('#dots .dot')[${i}].click()`, returnByValue: true });
      await sleep(140);
      const cc = (await cdp.send("Runtime.evaluate", { expression: `(() => {
        const c = document.querySelector('.app-card.is-active');
        const b = c.querySelector('.app-body');
        const r = b.getBoundingClientRect();
        const over = Array.from(b.children).filter((el) => {
          const q = el.getBoundingClientRect();
          return q.bottom > r.bottom + 1 || q.right > r.right + 1;
        }).map((el) => ({ cls: el.className || el.tagName, bottom: +el.getBoundingClientRect().bottom.toFixed(1) }));
        return { app: c.dataset.app, h: +r.height.toFixed(1), client: b.clientHeight, scroll: b.scrollHeight,
                 clipped: b.scrollHeight > b.clientHeight + 1, overflowChildren: over,
                 art: +c.querySelector('.app-art').getBoundingClientRect().height.toFixed(1) };
      })()`, returnByValue: true })).result.value;
      cc.index = i;
      cardsContent.push(cc);
    }
    data.cardsContent = cardsContent;
    await cdp.send("Runtime.evaluate", { expression: `document.querySelectorAll('#dots .dot')[0].click()`, returnByValue: true });
    await sleep(120);
    out.viewports.push(data);
    if (SHOTS && ["320x568", "390x844", "844x390-landscape", "1440x900"].includes(vp.name)) {
      const shot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      fs.writeFileSync(path.join(import.meta.dirname, `agent3-${MODE}-${vp.name}.png`), Buffer.from(shot.data, "base64"));
    }
  }

  // Prueba de navegación continua: seleccionar no debe recargar.
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false, screenOrientation: { type: "landscapePrimary", angle: 90 } });
  await cdp.send("Runtime.evaluate", { expression: "window.scrollTo(0,0)", returnByValue: true });
  await sleep(900);
  const navStart = navs.length;
  const beforeState = (await cdp.send("Runtime.evaluate", { expression: `({href: location.href, active: document.querySelector('.app-card.is-active').dataset.app, idx: document.querySelector('.app-card.is-active').dataset.index, title: document.getElementById('barTitle').textContent, perf: performance.now(), nav: performance.getEntriesByType('navigation').length})`, returnByValue: true })).result.value;
  const steps = [];
  for (const step of [
    { name: "click-next", expr: "document.getElementById('nextBtn').click()" },
    { name: "click-prev", expr: "document.getElementById('prevBtn').click()" },
    { name: "click-dot-3", expr: "document.querySelectorAll('#dots .dot')[2].click()" },
    { name: "click-lateral", expr: "document.querySelector('.app-card.is-right').click()" },
    { name: "click-top-next", expr: "document.getElementById('nextTop').click()" }
  ]) {
    const s = (await cdp.send("Runtime.evaluate", { expression: `(() => { ${step.expr}; return {href: location.href, active: document.querySelector('.app-card.is-active').dataset.app, idx: document.querySelector('.app-card.is-active').dataset.index, title: document.getElementById('barTitle').textContent, pos: document.getElementById('tbPos').textContent, live: document.getElementById('carouselLive').textContent, pointer: document.querySelector('.app-card.is-active').style.pointerEvents}; })()`, returnByValue: true })).result.value;
    await sleep(350);
    steps.push({ step: step.name, state: s, navsSoFar: navs.length - navStart });
  }
  // Teclado: flecha derecha (Input real) y tecla "1" no se prueban aquí porque "1" abre.
  await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39, nativeVirtualKeyCode: 39 });
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39, nativeVirtualKeyCode: 39 });
  await sleep(350);
  const afterKey = (await cdp.send("Runtime.evaluate", { expression: `({href: location.href, active: document.querySelector('.app-card.is-active').dataset.app, idx: document.querySelector('.app-card.is-active').dataset.index, pos: document.getElementById('tbPos').textContent, live: document.getElementById('carouselLive').textContent})`, returnByValue: true })).result.value;
  await sleep(500);
  const afterState = (await cdp.send("Runtime.evaluate", { expression: `({href: location.href, active: document.querySelector('.app-card.is-active').dataset.app, idx: document.querySelector('.app-card.is-active').dataset.index, nav: performance.getEntriesByType('navigation').length})`, returnByValue: true })).result.value;
  out.navTest = { navStart, navCount: navs.length - navStart, beforeState, steps, keyboardArrowRight: afterKey, afterState, navigations: navs.slice(navStart) };

  // Arrastre horizontal (swipe) simulado con Pointer, y arrastre vertical que no debe cambiar tarjeta.
  const swipe = async (name, dx, dy) => {
    await cdp.send("Runtime.evaluate", { expression: `window.__a3swipe = {n: document.querySelector('.app-card.is-active').dataset.app};`, returnByValue: true });
    const evalExpr = `(() => {
      const c = document.getElementById('carousel');
      const mk = (type, x, y) => new PointerEvent(type, {bubbles:true, cancelable:true, pointerId: 7, pointerType:'touch', isPrimary:true, clientX:x, clientY:y, buttons: type==='pointerup'?0:1});
      c.dispatchEvent(mk('pointerdown', 500, 400));
      c.dispatchEvent(mk('pointerup', 500 + ${dx}, 400 + ${dy}));
      return {active: document.querySelector('.app-card.is-active').dataset.app};
    })()`;
    const r = (await cdp.send("Runtime.evaluate", { expression: evalExpr, returnByValue: true })).result.value;
    await sleep(400);
    return { name, dx, dy, ...r };
  };
  out.swipeTest = [await swipe("horizontal", -120, 10), await swipe("vertical", 5, 150)];

  out.navTest.navCountAfterSwipe = navs.length - navStart;
  out.errors = errors;
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`OK ${MODE}: ${out.viewports.length} viewports -> ${OUT}`);
  console.log(`navs during selection/swipes: ${out.navTest.navCount} (filter main frame), console errors: ${errors.length}`);
  cdp.close();
  await fetch(`http://127.0.0.1:${PORT}/json/close/${target.id}`).catch(() => {});
}

run().catch((e) => { console.error("FAIL", e); process.exit(1); });
