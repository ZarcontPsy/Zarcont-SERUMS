/* Sonda de clic en enlaces de ficha (Agente 8). */
import path from "node:path";
import os from "node:os";
import { mkdtemp } from "node:fs/promises";
import { StaticServer } from "./lib/server.mjs";
import { Chrome, Page, sleep } from "./lib/cdp.mjs";
const ROOT = path.resolve(import.meta.dirname, "..", "..");
const server = new StaticServer({ root: ROOT, port: 8790, python: "C:\\Python313\\python.exe" });
const chrome = new Chrome({ chromePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", userDataDir: path.join(await mkdtemp(path.join(os.tmpdir(), "qa-click-")), "p"), port: 9390 });
try {
  await server.start();
  await chrome.start();
  const conn = await chrome.newTarget("about:blank");
  const page = new Page(conn, { browser: chrome, port: 9390 });
  await page.init();
  await page.viewport(1440, 900);
  await page.goto(`${server.baseURL}/study-dashboard/index.html#/biblioteca`, { settle: 1000 });
  const area = await page.eval(`document.querySelector('a[href^="#/biblioteca/area-"]')?.getAttribute('href')`);
  await page.goto(`${server.baseURL}/study-dashboard/index.html${area}`, { settle: 1000 });
  console.log("area", area, "hash", await page.eval("location.hash"));
  const info = await page.eval(`(() => {
    const links = Array.from(document.querySelectorAll('a[href^="#/ficha/"]'));
    return { count: links.length, hash: location.hash, body: document.body.innerText.slice(0,400), links: links.slice(0,5).map(a => ({ href:a.getAttribute('href'), dataNav:a.hasAttribute('data-nav'), text:a.innerText.slice(0,40), rect:(() => { const r=a.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}; })(), html:a.outerHTML.slice(0,300) })) };
  })()`);
  console.log(JSON.stringify(info, null, 1).slice(0, 4000));
  const probe = await page.eval(`(() => {
    const a = document.querySelector('a[href="#/ficha/sheet-psi-sp-1-1"]');
    const r = a.getBoundingClientRect();
    const x = r.left + r.width/2, y = r.top + r.height/2;
    const top = document.elementFromPoint(x, y);
    const chain = [];
    let n = top;
    while (n && chain.length < 5) { chain.push(n.tagName + '.' + (n.className||'').toString().slice(0,80)); n = n.parentElement; }
    let fired = 0;
    a.addEventListener('click', () => { fired++; });
    const styles = [];
    let m = a;
    while (m && styles.length < 12) {
      const s = getComputedStyle(m);
      styles.push({ tag: m.tagName, cls: (m.className||'').toString().slice(0,60), display: s.display, visibility: s.visibility, pointerEvents: s.pointerEvents, opacity: s.opacity, position: s.position, zIndex: s.zIndex, transform: s.transform, overflow: s.overflow });
      m = m.parentElement;
    }
    return { x, y, top: top ? top.outerHTML.slice(0,120) : null, chain, fired, scrollY, innerHeight, styles };
  })()`);
  console.log("point", probe);
  console.log(
    "hit",
    await page.eval(`(() => {
    const a = document.querySelector('a[href="#/ficha/sheet-psi-sp-1-1"]');
    const r = a.getBoundingClientRect();
    const x = r.left + r.width/2, y = r.top + r.height/2;
    const els = document.elementsFromPoint(x, y).map(e => e.tagName + '.' + (e.className||'').toString().slice(0,50));
    const chain = [];
    let n = a;
    while (n && chain.length < 8) { const s=getComputedStyle(n); chain.push({tag:n.tagName, cls:(n.className||'').toString().slice(0,40), contain:s.contain, contentVisibility:s.contentVisibility, clipPath:s.clipPath, transform:s.transform, willChange:s.willChange, filter:s.filter, overflow:s.overflow}); n = n.parentElement; }
    const appbar = document.querySelector('.s-appbar').getBoundingClientRect();
    const theme = document.querySelector('[data-theme-toggle]').getBoundingClientRect();
    const inert = Array.from(document.querySelectorAll('[inert]')).map(e => e.tagName + '#' + e.id + '.' + (e.className||'').toString().slice(0,40));
    const mainAttrs = Array.from(document.querySelector('main').attributes).map(a => a.name + '=' + a.value);
    const viewAttrs = Array.from(document.getElementById('view-root').attributes).map(a => a.name + '=' + a.value);
    return { els, chain, inert, mainAttrs, viewAttrs, appbar:{x:appbar.x,y:appbar.y,w:appbar.width,h:appbar.height}, theme:{x:theme.x,y:theme.y,w:theme.width,h:theme.height}, appbarHit: document.elementFromPoint(theme.left+theme.width/2, theme.top+theme.height/2)?.tagName, rect:{x:r.x,y:r.y,w:r.width,h:r.height} };
  })()`),
  );
  const sel = `a[href="${info.links[0].href}"]`;
  const rect = await page.click(sel);
  await sleep(800);
  console.log("after click", rect, await page.eval(`({ hash: location.hash, active: document.activeElement?.tagName + "." + document.activeElement?.className, text: document.querySelector('#view-root h1')?.innerText })`));
  console.log("errors", JSON.stringify(await page.errorsSummary()));
  await page.close();
} finally {
  await chrome.stop();
  await server.stop();
}
