/* © 2026 ZARCONT — Sonda Agente 3: alto natural del contenido de cada cartilla
   al forzar --card-h. Uso: node agent3-probe.mjs [width] [height] [cardH...] */
import fs from "node:fs";
import path from "node:path";
const PORT = 9333, URL = `http://127.0.0.1:8773/index.html?a3p=${Date.now()}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const W = Number(process.argv[2] || 320), H = Number(process.argv[3] || 568);
const HEIGHTS = (process.argv[4] || "520,460,420,402,390").split(",").map(Number);

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
await cdp.send("Page.enable"); await cdp.send("Runtime.enable");
await cdp.send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false, screenOrientation: { type: W > H ? "landscapePrimary" : "portraitPrimary", angle: W > H ? 90 : 0 } });
await sleep(1200);
await cdp.send("Runtime.evaluate", { expression: `(() => { const s = document.createElement('style'); s.id = 'a3-nomotion'; s.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}'; document.head.appendChild(s); })()` });
await sleep(150);

const out = { viewport: `${W}x${H}`, cases: [] };
for (const cardH of HEIGHTS) {
  await cdp.send("Runtime.evaluate", { expression: `document.querySelector('.carousel').style.setProperty('--card-h','${cardH}px')` });
  await sleep(120);
  const cards = [];
  for (let i = 0; i < 5; i++) {
    await cdp.send("Runtime.evaluate", { expression: `document.querySelectorAll('#dots .dot')[${i}].click()` });
    await sleep(90);
    const r = (await cdp.send("Runtime.evaluate", { expression: `(() => {
      const card = document.querySelector('.app-card.is-active');
      const b = card.querySelector('.app-body');
      const cs = getComputedStyle(b);
      const padT = parseFloat(cs.paddingTop), padB = parseFloat(cs.paddingBottom);
      const kids = Array.from(b.children).filter((el) => getComputedStyle(el).display !== 'none');
      let sum = padT + padB;
      const detail = [];
      for (const el of kids) {
        const s = getComputedStyle(el);
        const h = el.getBoundingClientRect().height;
        const mt = parseFloat(s.marginTop) || 0, mb = parseFloat(s.marginBottom) || 0;
        sum += h + mt + mb;
        detail.push({ cls: el.className || el.tagName, h: +h.toFixed(1), mt, mb, top: +el.getBoundingClientRect().top.toFixed(1), bottom: +el.getBoundingClientRect().bottom.toFixed(1) });
      }
      const r = b.getBoundingClientRect();
      return { app: card.dataset.app, cardH: +card.getBoundingClientRect().height.toFixed(1), bodyH: +r.height.toFixed(1), inner: +(b.clientHeight - padT - padB).toFixed(1), natural: +sum.toFixed(1), free: +(b.clientHeight - sum).toFixed(1), padT, padB, kids: detail };
    })()`, returnByValue: true })).result.value;
    cards.push(r);
  }
  out.cases.push({ cardH, cards });
}
fs.writeFileSync(path.join(import.meta.dirname, `agent3-probe-${W}x${H}.json`), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out.cases.map((c) => ({ cardH: c.cardH, cards: c.cards.map((x) => `${x.app}: body=${x.bodyH} natural=${x.natural} free=${x.free}`) })), null, 1));
cdp.close();
await fetch(`http://127.0.0.1:${PORT}/json/close/${target.id}`).catch(() => {});
