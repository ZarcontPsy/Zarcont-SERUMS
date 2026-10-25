/* © 2026 ZARCONT — Arnés CDP mínimo para la auditoría de persistencia (Agente 2).
   Node 24 (WebSocket global). No dependencias externas. */
import fs from "node:fs";
import path from "node:path";

export const ORIGIN = "http://127.0.0.1:8772";

export async function connect({ port = 9332 } = {}) {
  const res = await fetch(`http://127.0.0.1:${port}/json/version`);
  const info = await res.json();
  const browser = new CDP(info.webSocketDebuggerUrl);
  await browser.open();
  return browser;
}

class CDP {
  constructor(url) {
    this.url = url;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    this.handlers = [];
    this.sessionId = null;
  }
  open() {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.url);
      this.ws = ws;
      ws.onopen = () => resolve();
      ws.onerror = (e) => reject(new Error("ws error"));
      ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id != null && this.pending.has(data.id)) {
          const { resolve: r, reject: j } = this.pending.get(data.id);
          this.pending.delete(data.id);
          if (data.error) j(new Error(data.error.message + " " + JSON.stringify(data.error.data || "")));
          else r(data.result);
          return;
        }
        if (data.method) {
          this.events.push({ t: Date.now(), method: data.method, params: data.params });
          for (const h of this.handlers) {
            try { h(data.method, data.params, data.sessionId); } catch (e) {}
          }
        }
      };
    });
  }
  send(method, params = {}, sessionId = this.sessionId) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(payload));
    });
  }
  on(fn) { this.handlers.push(fn); }
  close() { try { this.ws.close(); } catch (e) {} }
}

export async function newPage(browser, url) {
  const { targetId } = await browser.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await browser.send("Target.attachToTarget", { targetId, flatten: true });
  const page = {
    targetId,
    sessionId,
    name: url,
    send: (m, p) => browser.send(m, p, sessionId),
    navs: 0,
    navUrls: [],
    console: [],
    errors: [],
    dialogs: [],
  };
  browser.on((method, params, sid) => {
    if (sid !== sessionId) return;
    if (method === "Page.frameNavigated" && params.frame && !params.frame.parentId) {
      page.navs += 1;
      page.navUrls.push(params.frame.url);
    }
    if (method === "Runtime.consoleAPICalled") {
      page.console.push({
        type: params.type,
        text: (params.args || []).map((a) => a.value ?? a.description ?? a.type).join(" "),
      });
    }
    if (method === "Runtime.exceptionThrown") {
      page.errors.push(params.exceptionDetails?.exception?.description || params.exceptionDetails?.text || "exception");
    }
    if (method === "Log.entryAdded" && params.entry.level === "error") {
      page.errors.push(params.entry.text);
    }
    if (method === "Page.javascriptDialogOpening") {
      page.dialogs.push({ type: params.type, message: params.message });
      browser.send("Page.handleJavaScriptDialog", { accept: true }, sid).catch(() => {});
    }
  });
  await page.send("Page.enable");
  await page.send("Runtime.enable");
  await page.send("Log.enable");
  await page.send("Network.enable");
  await page.send("Network.setCacheDisabled", { cacheDisabled: true });
  page.lastLoad = null;
  browser.on((method, params, sid) => {
    if (method === "Page.loadEventFired" && sid === sessionId) page.lastLoad = Date.now();
  });
  if (url) await navigate(page, url);
  return page;
}

export async function navigate(page, url) {
  page.lastLoad = null;
  await page.send("Page.navigate", { url });
  await waitFor(page, () => page.lastLoad, 20000, "load " + url);
}

export async function waitFor(page, fn, timeout = 10000, label = "condition") {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await fn()) return true;
    await sleep(80);
  }
  throw new Error("Timeout esperando " + label);
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function evalJS(page, expression, { awaitPromise = true } = {}) {
  const res = await page.send("Runtime.evaluate", {
    expression: `(() => { try { return JSON.stringify((${expression})); } catch (e) { return JSON.stringify({ __err: String(e && e.message || e) }); } })()`,
    awaitPromise,
    returnByValue: true,
    userGesture: true,
  });
  if (res.exceptionDetails) {
    return { __err: res.exceptionDetails.exception?.description || res.exceptionDetails.text };
  }
  const raw = res.result?.value;
  if (typeof raw !== "string") return raw;
  try { return JSON.parse(raw); } catch (e) { return raw; }
}

export async function evalAsync(page, expression) {
  const res = await page.send("Runtime.evaluate", {
    expression: `(async () => { try { return JSON.stringify(await (${expression})); } catch (e) { return JSON.stringify({ __err: String(e && e.message || e) }); } })()`,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  });
  if (res.exceptionDetails) return { __err: res.exceptionDetails.exception?.description || res.exceptionDetails.text };
  const raw = res.result?.value;
  try { return JSON.parse(raw); } catch (e) { return raw; }
}

export async function click(page, selector) {
  return evalJS(page, `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return { ok: false, reason: "no existe" }; el.scrollIntoView({block:"center"}); el.click(); return { ok: true, tag: el.tagName }; })()`);
}

export async function setVisibility(page, hidden) {
  await evalJS(page, `(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => ${hidden} });
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => ${hidden} ? "hidden" : "visible" });
    document.dispatchEvent(new Event("visibilitychange", { bubbles: true }));
    return true;
  })()`);
  await sleep(160);
}

export async function realLifecycle(page, state) {
  // Page.setWebLifecycleState: 'frozen' dispara visibilitychange real + freeze
  await page.send("Page.setWebLifecycleState", { state });
  await sleep(250);
}

export async function setViewport(page, width, height, mobile = false) {
  await page.send("Emulation.setDeviceMetricsOverride", {
    width, height, deviceScaleFactor: 1, mobile,
    screenOrientation: { type: width > height ? "landscapePrimary" : "portraitPrimary", angle: width > height ? 90 : 0 },
  });
  await sleep(250);
}

export async function screenshot(page, file) {
  const { data } = await page.send("Page.captureScreenshot", { format: "png" });
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(data, "base64"));
  return file;
}

export function log(...args) { console.log(...args); }

export function report(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj, null, 2));
  return file;
}
