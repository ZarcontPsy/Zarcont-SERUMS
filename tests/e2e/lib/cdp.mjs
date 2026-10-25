/* © 2026 ZARCONT — Arnés E2E QA (Agente 8). Cliente CDP mínimo sin dependencias. */
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function waitForPort(port, { timeout = 20000, path: probePath = "/" } = {}) {
  const deadline = Date.now() + timeout;
  let lastError = "";
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}${probePath}`, { method: "GET" });
      if (res.ok) return true;
      lastError = `HTTP ${res.status}`;
    } catch (err) {
      lastError = err && err.message ? err.message : String(err);
    }
    await sleep(150);
  }
  throw new Error(`Puerto ${port} no disponible: ${lastError}`);
}

export async function waitForChrome(port, timeout = 25000) {
  const deadline = Date.now() + timeout;
  let lastError = "";
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        const info = await res.json();
        return info;
      }
      lastError = `HTTP ${res.status}`;
    } catch (err) {
      lastError = err && err.message ? err.message : String(err);
    }
    await sleep(150);
  }
  throw new Error(`Chrome CDP ${port} no disponible: ${lastError}`);
}

export async function httpJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`${options.method || "GET"} ${url} -> HTTP ${res.status}`);
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Conexión WebSocket plana a un target de Chrome DevTools. */
export class CDPConnection {
  constructor(wsUrl, { label = "" } = {}) {
    this.wsUrl = wsUrl;
    this.label = label;
    this.nextId = 0;
    this.pending = new Map();
    this.listeners = new Map();
    this.closed = false;
    this.errors = [];
  }

  connect(timeout = 15000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timeout conectando CDP ${this.label}`)), timeout);
      try {
        this.ws = new WebSocket(this.wsUrl);
      } catch (err) {
        clearTimeout(timer);
        reject(err);
        return;
      }
      this.ws.addEventListener("open", () => {
        clearTimeout(timer);
        resolve(this);
      });
      this.ws.addEventListener("error", (event) => {
        clearTimeout(timer);
        reject(new Error(`Error WebSocket CDP ${this.label}: ${event && event.message ? event.message : "desconocido"}`));
      });
      this.ws.addEventListener("message", (event) => this._onMessage(event));
      this.ws.addEventListener("close", () => {
        this.closed = true;
        for (const [, pending] of this.pending) {
          pending.reject(new Error(`CDP cerrado (${this.label}) antes de responder ${pending.method}`));
        }
        this.pending.clear();
      });
    });
  }

  _onMessage(event) {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }
    if (msg.id) {
      const pending = this.pending.get(msg.id);
      if (!pending) return;
      this.pending.delete(msg.id);
      if (msg.error) pending.reject(new Error(`${pending.method}: ${msg.error.message} (${msg.error.code})`));
      else pending.resolve(msg.result);
      return;
    }
    const handlers = this.listeners.get(msg.method) || [];
    for (const handler of handlers.slice()) {
      try {
        handler(msg.params, msg.sessionId);
      } catch (err) {
        this.errors.push(err);
      }
    }
    const anyHandlers = this.listeners.get("*") || [];
    for (const handler of anyHandlers.slice()) {
      try {
        handler(msg, msg.sessionId);
      } catch (err) {
        this.errors.push(err);
      }
    }
  }

  send(method, params = {}, timeout = 30000) {
    if (this.closed) return Promise.reject(new Error(`CDP cerrado (${this.label})`));
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Timeout CDP ${method} (${timeout} ms)`));
      }, timeout);
      this.pending.set(id, {
        method,
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
      });
      try {
        this.ws.send(JSON.stringify({ id, method, params }));
      } catch (err) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(err);
      }
    });
  }

  on(method, handler) {
    const list = this.listeners.get(method) || [];
    list.push(handler);
    this.listeners.set(method, list);
    return () => {
      const current = this.listeners.get(method) || [];
      this.listeners.set(method, current.filter((h) => h !== handler));
    };
  }

  waitEvent(method, predicate = null, timeout = 15000) {
    return new Promise((resolve, reject) => {
      let done = false;
      const timer = setTimeout(() => {
        if (!done) {
          done = true;
          off();
          reject(new Error(`Timeout esperando evento ${method}`));
        }
      }, timeout);
      const off = this.on(method, (params) => {
        if (done) return;
        let matches = true;
        try {
          matches = predicate ? predicate(params) : true;
        } catch {
          matches = false;
        }
        if (!matches) return;
        done = true;
        clearTimeout(timer);
        off();
        resolve(params);
      });
    });
  }

  close() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
    }
  }
}

/** Chrome controlado por CDP. Perfil persistente: userDataDir reutilizable. */
export class Chrome {
  constructor({ chromePath, userDataDir, port = 9390, headless = true, extraArgs = [], logFile = null }) {
    this.chromePath = chromePath;
    this.userDataDir = userDataDir;
    this.port = port;
    this.headless = headless;
    this.extraArgs = extraArgs;
    this.logFile = logFile;
    this.proc = null;
    this.browserInfo = null;
    this.pages = new Set();
  }

  async start() {
    await mkdir(this.userDataDir, { recursive: true });
    const args = [
      ...(this.headless ? ["--headless=new"] : []),
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-background-networking",
      "--disable-component-update",
      "--disable-sync",
      "--disable-default-apps",
      "--disable-extensions",
      "--mute-audio",
      "--hide-scrollbars",
      "--remote-allow-origins=*",
      `--remote-debugging-port=${this.port}`,
      `--user-data-dir=${this.userDataDir}`,
      "about:blank",
      ...this.extraArgs,
    ];
    this.proc = spawn(this.chromePath, args, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let stderr = "";
    this.proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      if (stderr.length > 20000) stderr = stderr.slice(-20000);
      if (this.logFile) writeFile(this.logFile, stderr).catch(() => {});
    });
    this.proc.stdout.on("data", () => {});
    this.browserInfo = await waitForChrome(this.port);
    return this.browserInfo;
  }

  async newTarget(url = "about:blank", { timeout = 15000 } = {}) {
    const target = await httpJson(`http://127.0.0.1:${this.port}/json/new?${encodeURIComponent(url)}`, {
      method: "PUT",
    });
    if (!target || !target.webSocketDebuggerUrl) throw new Error("Chrome no devolvió webSocketDebuggerUrl");
    const conn = new CDPConnection(target.webSocketDebuggerUrl, { label: target.id || url });
    await conn.connect(timeout);
    this.pages.add(conn);
    conn.targetId = target.id;
    return conn;
  }

  async closeTarget(conn) {
    if (!conn) return;
    try {
      await fetch(`http://127.0.0.1:${this.port}/json/close/${conn.targetId}`, { method: "PUT" });
    } catch {}
    conn.close();
    this.pages.delete(conn);
  }

  async stop() {
    for (const conn of Array.from(this.pages)) {
      try {
        conn.close();
      } catch {}
    }
    this.pages.clear();
    if (!this.proc) return;
    const pid = this.proc.pid;
    this.proc = null;
    if (!pid) return;
    await new Promise((resolve) => {
      const done = () => resolve();
      try {
        const killer = spawn("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
        killer.on("exit", done);
        killer.on("error", done);
      } catch {
        done();
      }
      setTimeout(done, 8000);
    });
    await sleep(300);
  }

  /** Reinicia Chrome conservando --user-data-dir (prueba cerrar/reabrir).
   *  Cierra con Browser.close para que Chrome vuelque localStorage a disco,
   *  como al cerrar la ventana; taskkill /F solo se usa como último recurso. */
  async restart() {
    await this.gracefulClose();
    await sleep(600);
    return this.start();
  }

  async gracefulClose() {
    const info = this.browserInfo;
    if (info && info.webSocketDebuggerUrl) {
      try {
        const conn = new CDPConnection(info.webSocketDebuggerUrl, { label: "browser" });
        await conn.connect(3000);
        await conn.send("Browser.close", {}, 3000).catch(() => {});
        conn.close();
      } catch {}
    }
    const pid = this.proc ? this.proc.pid : null;
    if (pid) {
      const deadline = Date.now() + 5000;
      while (Date.now() < deadline) {
        try {
          process.kill(pid, 0);
        } catch {
          break;
        }
        await sleep(150);
      }
    }
    await this.stop();
  }
}

export class Page {
  constructor(conn, { browser = null, port = 9390 } = {}) {
    this.conn = conn;
    this.browser = browser;
    this.port = port;
    this.navigations = [];
    this.consoleErrors = [];
    this.exceptions = [];
    this.logErrors = [];
    this.networkFailures = [];
    this.requestUrls = new Map();
    this.dialogs = [];
    this._bound = false;
  }

  async init({ enableNetwork = true, enableLog = true } = {}) {
    if (this._bound) return this;
    this._bound = true;
    const conn = this.conn;
    conn.on("Page.frameNavigated", (params) => {
      const frame = params && params.frame ? params.frame : null;
      if (!frame || frame.parentId) return;
      this.navigations.push({
        url: frame.url,
        loaderId: frame.loaderId,
        at: Date.now(),
      });
    });
    conn.on("Runtime.exceptionThrown", (params) => {
      const details = params && params.exceptionDetails ? params.exceptionDetails : {};
      this.exceptions.push({
        text: details.text || "",
        description:
          (details.exception && (details.exception.description || details.exception.value)) || details.text || "",
        url: details.url || "",
        line: details.lineNumber,
        column: details.columnNumber,
        at: Date.now(),
      });
    });
    conn.on("Runtime.consoleAPICalled", (params) => {
      if (!params || (params.type !== "error" && params.type !== "assert")) return;
      const args = (params.args || []).map((arg) => {
        if (arg.value !== undefined) return String(arg.value);
        if (arg.description) return arg.description;
        return arg.type || "";
      });
      this.consoleErrors.push({ type: params.type, text: args.join(" "), at: Date.now() });
    });
    conn.on("Log.entryAdded", (params) => {
      const entry = params && params.entry ? params.entry : {};
      if (entry.level !== "error" && entry.level !== "warning") return;
      this.logErrors.push({
        level: entry.level,
        text: entry.text || "",
        url: entry.url || "",
        source: entry.source || "",
        at: Date.now(),
      });
    });
    conn.on("Network.requestWillBeSent", (params) => {
      if (params && params.requestId && params.request) {
        this.requestUrls.set(params.requestId, params.request.url);
      }
    });
    conn.on("Network.loadingFailed", (params) => {
      this.networkFailures.push({
        url: params && params.requestId ? this.requestUrls.get(params.requestId) || "" : "",
        errorText: params ? params.errorText : "",
        blockedReason: params ? params.blockedReason : "",
        type: params ? params.type : "",
        canceled: params ? params.canceled : false,
        at: Date.now(),
      });
    });
    conn.on("Page.javascriptDialogOpening", async (params) => {
      this.dialogs.push({ type: params.type, message: params.message });
      try {
        await conn.send("Page.handleJavaScriptDialog", { accept: true });
      } catch {}
    });

    await Promise.all([
      conn.send("Page.enable"),
      conn.send("Runtime.enable"),
      enableLog ? conn.send("Log.enable") : Promise.resolve(),
      enableNetwork ? conn.send("Network.enable") : Promise.resolve(),
      conn.send("Page.setLifecycleEventsEnabled", { enabled: true }),
    ]);
    if (enableNetwork) {
      // Evita medir versiones cacheadas: cada corrida lee los archivos actuales.
      await conn.send("Network.setCacheDisabled", { cacheDisabled: true });
    }
    return this;
  }

  async goto(url, { wait = "load", timeout = 30000, settle = 350 } = {}) {
    const before = this.navigations.length;
    let current = null;
    try {
      current = await this.eval("location.href");
    } catch {}
    const target = new URL(url, current && /^https?:/.test(current) ? current : "http://127.0.0.1/").href;
    const stripHash = (value) => String(value || "").split("#")[0];
    const sameDocument = Boolean(current && current !== target && stripHash(current) === stripHash(target));
    if (current === target) {
      // Misma URL: se fuerza una recarga real (prueba de refresh).
      const loaded = this.conn.waitEvent("Page.loadEventFired", null, timeout);
      await this.conn.send("Page.reload", { ignoreCache: false });
      await loaded;
      await this.readyState(timeout);
      await sleep(settle);
      return { navigations: this.navigations.length - before, result: { reloaded: true }, sameDocument: false };
    }
    let loaded = null;
    if (!sameDocument) {
      loaded = wait === "load" ? this.conn.waitEvent("Page.loadEventFired", null, timeout) : null;
    }
    const result = await this.conn.send("Page.navigate", { url: target });
    if (result && result.errorText) throw new Error(`Navegación a ${target}: ${result.errorText}`);
    if (sameDocument) {
      const base = stripHash(target);
      const wantHash = target.includes("#") ? target.slice(target.indexOf("#")) : "";
      const predicate = wantHash
        ? `location.href.split('#')[0] === ${JSON.stringify(base)} && location.hash === ${JSON.stringify(wantHash)}`
        : `location.href.split('#')[0] === ${JSON.stringify(base)}`;
      await this.waitFor(predicate, {
        timeout: Math.min(timeout, 10000),
        message: `navegación same-document a ${target}`,
      });
    } else if (loaded) {
      await loaded;
      await this.readyState(timeout);
    }    // Espera de estabilización (boot de la app, fuentes, render).
    await sleep(settle);
    return { navigations: this.navigations.length - before, result, sameDocument };
  }

  /** Espera una navegación de documento (frame principal). Útil antes de un clic que navega. */
  waitForNavigation(predicate = null, timeout = 20000) {
    return this.conn.waitEvent(
      "Page.frameNavigated",
      (params) => {
        const frame = params && params.frame;
        if (!frame || frame.parentId) return false;
        return predicate ? predicate(frame.url) : true;
      },
      timeout,
    );
  }

  async readyState(timeout = 15000) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      try {
        const state = await this.eval("document.readyState");
        if (state === "complete") return true;
      } catch {}
      await sleep(80);
    }
    return false;
  }

  async eval(expression, { awaitPromise = true, userGesture = false, timeout = 20000 } = {}) {
    const result = await this.conn.send(
      "Runtime.evaluate",
      {
        expression,
        returnByValue: true,
        awaitPromise,
        userGesture,
        allowUnsafeEvalBlockedByCSP: true,
      },
      timeout,
    );
    if (result && result.exceptionDetails) {
      const details = result.exceptionDetails;
      throw new Error(
        `Eval falló: ${
          (details.exception && (details.exception.description || details.exception.value)) || details.text
        }`,
      );
    }
    return result ? result.result && result.result.value : undefined;
  }

  async waitFor(expression, { timeout = 10000, interval = 100, message = "" } = {}) {
    const deadline = Date.now() + timeout;
    let last = null;
    while (Date.now() < deadline) {
      try {
        last = await this.eval(expression);
        if (last) return last;
      } catch (err) {
        last = err.message;
      }
      await sleep(interval);
    }
    throw new Error(`waitFor agotado${message ? " — " + message : ""}: ${expression} (último: ${JSON.stringify(last)})`);
  }

  async viewport(width, height, { mobile = false, deviceScaleFactor = 1, isLandscape = false } = {}) {
    await this.conn.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor,
      mobile,
      screenWidth: width,
      screenHeight: height,
      screenOrientation: isLandscape ? { type: "landscapePrimary", angle: 90 } : { type: "portraitPrimary", angle: 0 },
    });
    await sleep(180);
    return this.metrics();
  }

  async metrics() {
    return this.eval(`(() => ({
      innerWidth: innerWidth, innerHeight: innerHeight,
      dpr: devicePixelRatio,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      clientWidth: document.documentElement.clientWidth,
      clientHeight: document.documentElement.clientHeight
    }))()`);
  }

  /** Clic con gesto real: mousePressed + mouseReleased en el centro del elemento. */
  async click(selector, { timeout = 8000, scroll = true, index = 0 } = {}) {
    const started = Date.now();
    let lastReason = "sin intentos";
    let attempts = 0;
    while (Date.now() - started < timeout) {
      attempts += 1;
      const info = await this.eval(`(() => {
        const nodes = Array.from(document.querySelectorAll(${JSON.stringify(selector)}));
        const el = nodes[${index}];
        if (!el) return { status: "missing" };
        const style = getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden" || el.disabled) return { status: "hidden" };
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return { status: "zero" };
        const x = r.left + r.width/2, y = r.top + r.height/2;
        const inView = x > 0 && y > 0 && x < innerWidth && y < innerHeight;
        const top = document.elementFromPoint(x, y);
        const closed = el.closest("details:not([open])");
        return {
          status: "ok",
          x, y, w: r.width, h: r.height, inView,
          text: (el.innerText||"").trim().slice(0,80),
          hit: !!(top && (top === el || el.contains(top) || top.contains(el))),
          top: top ? top.tagName + "." + String(top.className || "").slice(0, 80) : null,
          closedDetails: closed ? (closed.getAttribute("data-topic") || closed.className || "details") : null
        };
      })()`);
      if (info.status !== "ok") {
        lastReason = `estado ${info.status}`;
        await sleep(120);
        continue;
      }
      if (scroll && !info.inView) {
        await this.eval(`document.querySelectorAll(${JSON.stringify(selector)})[${index}].scrollIntoView({block:"center", inline:"center"})`).catch(() => {});
        await sleep(200);
        continue;
      }
      if (!info.hit) {
        lastReason = `cubierto o plegado (top=${info.top}, details=${info.closedDetails})`;
        await sleep(150);
        continue;
      }
      const x = Math.round(info.x);
      const y = Math.round(info.y);
      await this.conn.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y, button: "none" });
      await this.conn.send("Input.dispatchMouseEvent", {
        type: "mousePressed",
        x,
        y,
        button: "left",
        buttons: 1,
        clickCount: 1,
      });
      await sleep(40);
      await this.conn.send("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        x,
        y,
        button: "left",
        buttons: 0,
        clickCount: 1,
      });
      return { x, y, w: info.w, h: info.h, text: info.text, attempts };
    }
    throw new Error(`No se pudo hacer clic en ${selector}[${index}] en ${timeout} ms (${attempts} intentos): ${lastReason}`);
  }

  async hover(selector) {
    const rect = await this.eval(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width/2, y: r.top + r.height/2 };
    })()`);
    if (!rect) return null;
    await this.conn.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: Math.round(rect.x), y: Math.round(rect.y) });
    return rect;
  }

  async pressKey(key, { code = "", keyCode = 0, text = "" } = {}) {
    await this.conn.send("Input.dispatchKeyEvent", {
      type: text ? "keyDown" : "rawKeyDown",
      key,
      code,
      windowsVirtualKeyCode: keyCode,
      nativeVirtualKeyCode: keyCode,
      text,
      unmodifiedText: text,
    });
    await this.conn.send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key,
      code,
      windowsVirtualKeyCode: keyCode,
      nativeVirtualKeyCode: keyCode,
    });
  }

  async screenshot(file, { fullPage = false, format = "png", quality = undefined } = {}) {
    await mkdir(path.dirname(file), { recursive: true });
    let params = { format, captureBeyondViewport: true, fromSurface: true };
    if (quality != null) params.quality = quality;
    if (fullPage) {
      const layout = await this.conn.send("Page.getLayoutMetrics");
      const size = layout.cssContentSize || layout.contentSize;
      params.clip = { x: 0, y: 0, width: Math.ceil(size.width), height: Math.ceil(size.height), scale: 1 };
    }
    const shot = await this.conn.send("Page.captureScreenshot", params, 30000);
    await writeFile(file, Buffer.from(shot.data, "base64"));
    return file;
  }

  /** localStorage + sessionStorage + metadatos de IndexedDB (sin borrar nada). */
  async getStorage() {
    return this.eval(`(async () => {
      const ls = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        const v = localStorage.getItem(k);
        ls[k] = v && v.length > 500 ? v.slice(0, 500) + "…(" + v.length + ")" : v;
      }
      const ss = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        ss[k] = sessionStorage.getItem(k);
      }
      let dbs = [];
      try {
        dbs = await indexedDB.databases();
      } catch (e) {}
      return { href: location.href, localStorage: ls, sessionStorage: ss, indexedDB: dbs };
    })()`);
  }

  async storageSnapshot() {
    return this.eval(`(async () => {
      const ls = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        ls[k] = localStorage.getItem(k);
      }
      const ss = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        ss[k] = sessionStorage.getItem(k);
      }
      let dbs = [];
      try { dbs = await indexedDB.databases(); } catch (e) {}
      return { href: location.href, localStorage: ls, sessionStorage: ss, indexedDB: dbs };
    })()`);
  }

  async errorsSummary() {
    return {
      exceptions: this.exceptions.slice(),
      consoleErrors: this.consoleErrors.slice(),
      logErrors: this.logErrors.filter((e) => e.level === "error").slice(),
      logWarnings: this.logErrors.filter((e) => e.level === "warning").slice(),
      networkFailures: this.networkFailures.slice(),
      dialogs: this.dialogs.slice(),
    };
  }

  resetErrors() {
    this.exceptions = [];
    this.consoleErrors = [];
    this.logErrors = [];
    this.networkFailures = [];
  }

  navCount() {
    return this.navigations.length;
  }

  async close() {
    if (this.browser) await this.browser.closeTarget(this.conn);
    else this.conn.close();
  }
}

export { sleep };
