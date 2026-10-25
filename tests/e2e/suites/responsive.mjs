/* © 2026 ZARCONT — Suite responsive y targets (Agente 8). */
import { assert, assertEq } from "../lib/harness.mjs";
import { APPS, gotoApp, waitApp, explainErrors, appURL } from "../lib/apps.mjs";
import { sleep } from "../lib/cdp.mjs";

const VIEWPORTS = [
  [360, 640, false, "360x640"],
  [390, 844, false, "390x844"],
  [768, 1024, false, "768x1024"],
  [1024, 768, false, "1024x768"],
  [1440, 900, false, "1440x900"],
  [844, 390, true, "844x390-landscape"],
];

const TARGET_AUDIT = `(() => {
  const nodes = Array.from(document.querySelectorAll('button, a[href], [role="button"], input, select'));
  const visible = nodes.filter(el => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0' && r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  });
  const small = visible
    .filter(el => { const r = el.getBoundingClientRect(); return r.width < 24 || r.height < 24; })
    .map(el => { const r = el.getBoundingClientRect(); return { tag: el.tagName, cls: (el.className || '').toString().slice(0, 60), text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) }; });
  const chrome = Array.from(document.querySelectorAll('[data-serums-chrome]')).map(el => {
    const r = el.getBoundingClientRect();
    return { action: el.getAttribute('data-serums-chrome'), w: Math.round(r.width), h: Math.round(r.height) };
  });
  return { visible: visible.length, smallCount: small.length, small: small.slice(0, 8), chrome };
})()`;

export async function runResponsive({ h, page, baseURL }) {
  h.suite("Responsive");
  h.state.app = "Transversal";

  const apps = ["dashboard", "flashcards", "quest", "plazas", "banqueo"];
  for (const app of apps) {
    await h.test(
      `RESP-${app.toUpperCase()}`,
      `${APPS[app].name}: 6 viewports sin overflow horizontal ni errores, targets críticos ≥24 px`,
      async () => {
        page.resetErrors();
        await gotoApp(page, baseURL, app, { settle: app === "plazas" ? 1600 : 900 });
        const out = [];
        for (const [w, hgt, mobile, label] of VIEWPORTS) {
          await page.viewport(w, hgt, { mobile, isLandscape: label.includes("landscape") });
          await sleep(450);
          const m = await page.eval(`(() => ({
            innerWidth, innerHeight,
            scrollWidth: document.documentElement.scrollWidth,
            overflowX: document.documentElement.scrollWidth - innerWidth,
            bodyOverflowX: document.body.scrollWidth - innerWidth,
            target: ${TARGET_AUDIT}
          }))()`);
          out.push({ label, ...m });
          assert(m.overflowX <= 1, `${APPS[app].name} desborda horizontalmente en ${label}: ${m.overflowX}px (scrollWidth=${m.scrollWidth})`);
          assert(m.scrollWidth >= w - 1, `${APPS[app].name} ancho inesperado en ${label}`);
          assertEq(m.target.chrome.filter((c) => c.w < 24 || c.h < 24).length, 0, `controles chrome pequeños en ${label}`);
          if (label === "390x844") await h.shot(page, `resp-${app}-390`);
          if (label === "768x1024") await h.shot(page, `resp-${app}-768`);
        }
        const errors = explainErrors(await page.errorsSummary());
        assertEq(errors.productErrorCount, 0, `errores responsive: ${JSON.stringify(errors)}`);
        await page.viewport(1440, 900);
        return { viewports: out, errors };
      },
      { severity: "alta", page, timeout: 90000 },
    );
  }

  await h.test(
    "RESP-INTERNAS",
    "Vistas internas clave a 390×844: biblioteca/ficha, mazo, personajes, resultados y banco",
    async () => {
      const results = [];
      const views = [
        ["dashboard", "/study-dashboard/index.html#/biblioteca", "biblioteca", 900],
        ["dashboard", "/study-dashboard/index.html#/ficha/sheet-aps-01", "ficha", 900],
        ["flashcards", "/study-flashcards/index.html#/mazo/sheet-aps-01", "mazo", 900],
        ["quest", "/serums-quest/index.html#/personajes", "personajes", 900],
        ["plazas", "/serums map/serums-map-explorer/index.html", "mapa", 1600],
        ["banqueo", "/EXAMEN STUDIO/Examen Studio.html#bank/medicina", "banco", 1200],
      ];
      await page.viewport(390, 844, { mobile: true });
      for (const [app, route, label, settle] of views) {
        page.resetErrors();
        await page.goto(new URL(route, baseURL).href, { settle });
        await waitApp(page, app, 25000).catch(() => {});
        await sleep(350);
        const m = await page.eval(`(() => ({
          overflowX: document.documentElement.scrollWidth - innerWidth,
          text: (document.body.innerText || '').trim().slice(0, 160),
          target: ${TARGET_AUDIT}
        }))()`);
        const shot = await h.shot(page, `resp-interna-${label}-390`);
        results.push({ app, label, ...m, shot });
        assert(m.overflowX <= 1, `${label} desborda a 390px: ${m.overflowX}`);
        assert(m.text.length > 20, `${label} sin contenido visible`);
      }
      return results;
    },
    { severity: "alta", page, timeout: 90000 },
  );
}
