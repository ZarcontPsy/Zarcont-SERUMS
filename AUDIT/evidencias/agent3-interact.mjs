/* © 2026 ZARCONT — Interacciones Agente 3: pantalla completa, safe-area,
   foco, apertura por teclado y diagnóstico de elementos en pantalla. */
import fs from "node:fs";
import path from "node:path";
const PORT = 9333;
const URL = `http://127.0.0.1:8773/index.html?a3i=${Date.now()}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = path.join(import.meta.dirname, "agent3-interactions.json");

class CDP {
  constructor(ws) {
    this.id = 0; this.pending = new Map(); this.l = new Map();
    this.ws = new WebSocket(ws);
    this.ready = new Promise((res, rej) => { this.ws.addEventListener("open", res, { once: true }); this.ws.addEventListener("error", rej, { once: true }); });
    this.ws.addEventListener("message", (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) { const p = this.pending.get(m.id); this.pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); }
      else if (m.method) (this.l.get(m.method) || []).forEach((f) => f(m.params));
    });
  }
  send(method, params = {}) { const id = ++this.id; return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params })); }); }
  on(m, f) { if (!this.l.has(m)) this.l.set(m, []); this.l.get(m).push(f); }
  close() { try { this.ws.close(); } catch {} }
}
const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(URL)}`, { method: "PUT" })).json();
const cdp = new CDP(target.webSocketDebuggerUrl);
await cdp.ready;
await cdp.send("Page.enable"); await cdp.send("Runtime.enable"); await cdp.send("Log.enable");
const errors = [];
cdp.on("Runtime.exceptionThrown", (p) => errors.push(p.exceptionDetails?.text));
cdp.on("Log.entryAdded", (p) => { if (p.entry?.level === "error") errors.push(p.entry.text); });
await sleep(900);
await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false, screenOrientation: { type: "portraitPrimary", angle: 0 } });
await sleep(900);
const evalv = async (expr, opts = {}) => (await cdp.send("Runtime.evaluate", { expression: expr, returnByValue: true, ...opts })).result.value;
const out = { url: URL, errors };

// 1. Elementos visibles en la zona del punto blanco (315,82) y capas apiladas.
out.probeDot = await evalv(`(() => {
  const pts = [[315,82],[314,81],[318,84]];
  return pts.map(([x,y]) => ({ x, y, els: document.elementsFromPoint(x,y).slice(0,5).map((el) => ({ tag: el.tagName, id: el.id, cls: String(el.className).slice(0,40), rect: (() => { const b = el.getBoundingClientRect(); return [b.left,b.top,b.width,b.height].map((n)=>+n.toFixed(1)); })() })) }));
})()`);

// 2. Topbar y botones visibles a 390 (nombres/etiquetas).
out.controls = await evalv(`(() => ({
  topbar: (() => { const b = document.querySelector('.topbar').getBoundingClientRect(); return {left:+b.left.toFixed(1), right:+b.right.toFixed(1), w:+b.width.toFixed(1)}; })(),
  buttons: Array.from(document.querySelectorAll('.topbar button, .carousel-bar button, #dots button')).map((el) => ({ id: el.id, cls: el.className, label: el.getAttribute('aria-label'), tip: el.getAttribute('data-tip'), title: el.getAttribute('title'), pressed: el.getAttribute('aria-pressed'), current: el.getAttribute('aria-current'), rect: (() => { const b = el.getBoundingClientRect(); return [b.width,b.height].map((n)=>+n.toFixed(1)); })() })),
  fullscreenEnabled: document.fullscreenEnabled
}))()`);

// 3. Pantalla completa con gesto de usuario simulado (CDP userGesture).
const fsBefore = await evalv(`({ pressed: document.getElementById('btnFs').getAttribute('aria-pressed'), label: document.getElementById('btnFs').getAttribute('aria-label'), isFs: document.documentElement.classList.contains('is-fs'), fsEl: !!document.fullscreenElement, display: getComputedStyle(document.getElementById('btnFs')).display })`);
await evalv(`document.getElementById('btnFs').click()`, { userGesture: true });
await sleep(900);
const fsAfter = await evalv(`({ pressed: document.getElementById('btnFs').getAttribute('aria-pressed'), label: document.getElementById('btnFs').getAttribute('aria-label'), title: document.getElementById('btnFs').getAttribute('title'), tip: document.getElementById('btnFs').getAttribute('data-tip'), isFs: document.documentElement.classList.contains('is-fs'), fsEl: !!document.fullscreenElement, fsTag: document.fullscreenElement ? document.fullscreenElement.tagName : null, live: document.getElementById('fsLive').textContent })`);
await evalv(`document.getElementById('btnFs').click()`, { userGesture: true });
await sleep(900);
const fsExit = await evalv(`({ pressed: document.getElementById('btnFs').getAttribute('aria-pressed'), label: document.getElementById('btnFs').getAttribute('aria-label'), isFs: document.documentElement.classList.contains('is-fs'), fsEl: !!document.fullscreenElement, live: document.getElementById('fsLive').textContent })`);
out.fullscreen = { fsBefore, fsAfter, fsExit };

// 4. fullscreenerror sintético: el estado debe resetearse, no simularse.
await evalv(`document.dispatchEvent(new Event('fullscreenerror'))`);
await sleep(120);
out.fullscreenError = await evalv(`({ pressed: document.getElementById('btnFs').getAttribute('aria-pressed'), label: document.getElementById('btnFs').getAttribute('aria-label'), isFs: document.documentElement.classList.contains('is-fs'), live: document.getElementById('fsLive').textContent })`);

// 5. Safe-area simulada (Chrome CDP). Si no está soportada, se registra el error.
let safeArea = { supported: false };
try {
  await cdp.send("Emulation.setSafeAreaInsetsOverride", { insets: { top: 47, left: 0, bottom: 34, right: 0 } });
  await sleep(500);
  safeArea = await evalv(`(() => {
    const tb = document.querySelector('.topbar').getBoundingClientRect();
    const stage = document.getElementById('stage');
    const card = document.querySelector('.app-card.is-active').getBoundingClientRect();
    const dots = document.querySelector('.dots').getBoundingClientRect();
    const bar = document.querySelector('.carousel-bar').getBoundingClientRect();
    return { supported: true, topbar: {top:+tb.top.toFixed(1), bottom:+tb.bottom.toFixed(1)}, card: {top:+card.top.toFixed(1), bottom:+card.bottom.toFixed(1)},
      bar: {top:+bar.top.toFixed(1), bottom:+bar.bottom.toFixed(1)}, dots: {top:+dots.top.toFixed(1), bottom:+dots.bottom.toFixed(1)},
      doc: { sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, sh: document.documentElement.scrollHeight, ch: document.documentElement.clientHeight, ih: innerHeight },
      stagePadTop: getComputedStyle(stage).paddingTop, stagePadBottom: getComputedStyle(stage).paddingBottom,
      cardH: getComputedStyle(document.querySelector('.carousel')).getPropertyValue('--card-h').trim() };
  })()`);
  await cdp.send("Emulation.setSafeAreaInsetsOverride", { insets: { top: 0, left: 0, bottom: 0, right: 0 } });
} catch (e) {
  safeArea = { supported: false, error: String(e).slice(0, 300) };
}
out.safeArea = safeArea;

// 5b. Safe-area horizontal en móvil apaisado (muesca izquierda/derecha).
let safeAreaLandscape = { supported: false };
try {
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 844, height: 390, deviceScaleFactor: 1, mobile: false, screenOrientation: { type: "landscapePrimary", angle: 90 } });
  await cdp.send("Emulation.setSafeAreaInsetsOverride", { insets: { top: 0, left: 47, right: 47, bottom: 21 } });
  await sleep(500);
  safeAreaLandscape = await evalv(`(() => {
    const tb = document.querySelector('.topbar').getBoundingClientRect();
    const card = document.querySelector('.app-card.is-active').getBoundingClientRect();
    const bar = document.querySelector('.carousel-bar').getBoundingClientRect();
    return { supported: true, tb: [+tb.left.toFixed(1), +tb.right.toFixed(1)], card: [+card.left.toFixed(1), +card.right.toFixed(1)],
      bar: [+bar.left.toFixed(1), +bar.right.toFixed(1)], doc: { sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, sh: document.documentElement.scrollHeight, ch: document.documentElement.clientHeight },
      safeLeft: 47, safeRight: 47, viewport: innerWidth };
  })()`);
  await cdp.send("Emulation.setSafeAreaInsetsOverride", { insets: { top: 0, left: 0, bottom: 0, right: 0 } });
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false, screenOrientation: { type: "portraitPrimary", angle: 0 } });
  await sleep(300);
} catch (e) {
  safeAreaLandscape = { supported: false, error: String(e).slice(0, 300) };
}
out.safeAreaLandscape = safeAreaLandscape;

// 6. Modal de atajos: texto actualizado y sin referencias al dock.
await evalv(`document.getElementById('btnHelp').click()`, { userGesture: true });
await sleep(250);
out.helpModal = await evalv(`({ open: document.getElementById('helpModal').classList.contains('open'), text: document.getElementById('helpModal').querySelector('.modal-note').textContent.trim(), focus: document.activeElement.id, inert: document.getElementById('stage').inert })`);
await evalv(`document.getElementById('helpClose').click()`, { userGesture: true });
await sleep(250);
out.helpClosed = await evalv(`({ open: document.getElementById('helpModal').classList.contains('open'), focus: document.activeElement.id, inert: document.getElementById('stage').inert })`);

// 7. About: texto sin dock.
await evalv(`document.getElementById('btnAbout').click()`, { userGesture: true });
await sleep(250);
out.aboutModal = await evalv(`({ text: document.getElementById('aboutModal').querySelector('.modal-note').textContent.trim() })`);
await evalv(`document.getElementById('aboutClose').click()`, { userGesture: true });
await sleep(200);

// 8. Puntos: clic en cada índice y comprobación de áreas no solapadas.
out.dotsTest = [];
for (let i = 0; i < 5; i++) {
  const r = await evalv(`(() => {
    const ds = Array.from(document.querySelectorAll('#dots .dot'));
    ds[${i}].click();
    const c = document.querySelector('.app-card.is-active');
    const rects = ds.map((d) => { const b = d.getBoundingClientRect(); return { left: +b.left.toFixed(1), right: +b.right.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1), current: d.getAttribute('aria-current'), label: d.getAttribute('aria-label') }; });
    const overlaps = rects.slice(1).map((x, k) => +(rects[k].right - x.left).toFixed(1)).filter((n) => n > 0.5);
    return { clicked: ${i}, active: c.dataset.app, index: c.dataset.index, ariaCurrent: c.getAttribute('aria-current'), dotsActive: ds.filter((d) => d.classList.contains('is-active')).length, rects, overlaps };
  })()`);
  await sleep(150);
  out.dotsTest.push(r);
}
await evalv(`document.querySelectorAll('#dots .dot')[0].click()`);
await sleep(150);

// 9. Ventana redimensionada: sin overflow ni recortes al cambiar alto/ancho.
out.resizeTest = [];
for (const [w, h] of [[390, 844], [390, 760], [390, 700], [360, 640], [320, 568], [844, 390], [568, 320], [390, 844]]) {
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false, screenOrientation: { type: w > h ? "landscapePrimary" : "portraitPrimary", angle: w > h ? 90 : 0 } });
  await sleep(450);
  const r = await evalv(`(() => {
    const de = document.documentElement;
    const card = document.querySelector('.app-card.is-active').getBoundingClientRect();
    const bar = document.querySelector('.carousel-bar').getBoundingClientRect();
    const dots = document.querySelector('.dots').getBoundingClientRect();
    const tb = document.querySelector('.topbar').getBoundingClientRect();
    const vh = innerHeight, vw = innerWidth;
    return { vw, vh, sw: de.scrollWidth, cw: de.clientWidth, sh: de.scrollHeight,
      fits: card.top >= 0 && dots.bottom <= vh + 1 && bar.bottom <= vh + 1 && de.scrollWidth <= de.clientWidth,
      card: [+card.width.toFixed(1), +card.height.toFixed(1), +card.top.toFixed(1), +card.bottom.toFixed(1)],
      bar: [+bar.top.toFixed(1), +bar.bottom.toFixed(1)], dots: [+dots.top.toFixed(1), +dots.bottom.toFixed(1)],
      topbar: [+tb.top.toFixed(1), +tb.bottom.toFixed(1)] };
  })()`);
  r.requested = `${w}x${h}`;
  out.resizeTest.push(r);
}

// 10. Emulación móvil real (meta viewport + dvh) con recarga.
await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true, screenOrientation: { type: "portraitPrimary", angle: 0 } });
await cdp.send("Page.reload", { ignoreCache: true });
await sleep(1400);
out.mobileEmulation = await evalv(`(() => {
  const de = document.documentElement;
  const card = document.querySelector('.app-card.is-active').getBoundingClientRect();
  const bar = document.querySelector('.carousel-bar').getBoundingClientRect();
  const dots = document.querySelector('.dots').getBoundingClientRect();
  return { vw: innerWidth, vh: innerHeight, sw: de.scrollWidth, cw: de.clientWidth, sh: de.scrollHeight,
    hOver: de.scrollWidth > de.clientWidth, vOver: de.scrollHeight > de.clientHeight,
    card: [+card.width.toFixed(1), +card.height.toFixed(1), +card.top.toFixed(1), +card.bottom.toFixed(1)],
    bar: [+bar.top.toFixed(1), +bar.bottom.toFixed(1)], dots: [+dots.top.toFixed(1), +dots.bottom.toFixed(1)],
    fsVisible: getComputedStyle(document.getElementById('btnFs')).display !== 'none' };
})()`);
{
  const shot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  fs.writeFileSync(path.join(import.meta.dirname, "agent3-after-mobile-390x844.png"), Buffer.from(shot.data, "base64"));
}
await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false, screenOrientation: { type: "portraitPrimary", angle: 0 } });
await cdp.send("Page.reload", { ignoreCache: true });
await sleep(1200);

// 11. Apertura por teclado "2": debe navegar a PLAZAS (una sola navegación).
const navs = [];
cdp.on("Page.frameNavigated", (p) => { if (!p.frame.parentId) navs.push(p.frame.url); });
await evalv(`document.querySelectorAll('#dots .dot')[1].click()`);
await sleep(300);
await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "2", code: "Digit2", windowsVirtualKeyCode: 50, nativeVirtualKeyCode: 50 });
await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "2", code: "Digit2", windowsVirtualKeyCode: 50, nativeVirtualKeyCode: 50 });
await sleep(1800);
out.keyboardOpen = { navigations: navs, href: await evalv(`location.href`) };
out.errors = errors;
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(JSON.stringify({ probeDot: out.probeDot, fullscreen: out.fullscreen, safeArea: out.safeArea, keyboardOpen: out.keyboardOpen, errors }, null, 2));
cdp.close();
await fetch(`http://127.0.0.1:${PORT}/json/close/${target.id}`).catch(() => {});
