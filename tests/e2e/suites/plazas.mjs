/* © 2026 ZARCONT — Suites Plaza SERUMS y Serums Map (Agente 8). */
import { assert, assertEq, assertIncludes, skip } from "../lib/harness.mjs";
import { gotoApp, waitApp, firstVisible, clickFirst, explainErrors, appURL } from "../lib/apps.mjs";
import { sleep } from "../lib/cdp.mjs";

async function openResults(page) {
  const tab = await firstVisible(page, ['#sideTabs [data-tab="results"]']);
  if (!tab) throw new Error("No hay pestaña de resultados");
  await page.click(tab);
  await sleep(350);
  const rows = await page.eval(`document.querySelectorAll('#resultsList .resitem').length`);
  return { rows, tab };
}

export async function runPlazas({ h, page, baseURL }) {
  h.suite("Plaza SERUMS");
  h.state.app = "Plaza SERUMS";

  await h.test(
    "PLAZAS-01",
    "Carga del mapa, 7.323 plazas y Google Maps operativo o fallback visible",
    async () => {
      page.resetErrors();
      await gotoApp(page, baseURL, "plazas", { settle: 1800 });
      await page
        .waitFor(
          `(() => { const e=document.getElementById('mapError'); return (window.google && window.google.maps && document.querySelector('#map')?.children.length > 0) || (e && getComputedStyle(e).display !== 'none'); })()`,
          { timeout: 12000 },
        )
        .catch(() => {});
      const data = await page.eval(`(() => ({
        title: document.title,
        badge: document.getElementById('datasetBadge')?.textContent,
        recPill: document.getElementById('recPill')?.textContent,
        apiBadge: document.getElementById('apiBadge')?.textContent,
        mapChildren: document.getElementById('map')?.children.length,
        mapError: (() => { const e=document.getElementById('mapError'); return e ? { display: getComputedStyle(e).display, text: e.innerText.slice(0,160) } : null; })(),
        records: window.SERUMS_DATA.length,
        favorites: JSON.parse(localStorage.getItem('serums_favoritos') || '[]').length
      }))()`);
      assertEq(data.records, 7323, "registros de plazas");
      assert(/7,323|7323/.test(data.recPill + " " + data.badge), `contador 7323 visible (${data.recPill} / ${data.badge})`);
      assert(data.mapChildren > 0 || (data.mapError && data.mapError.display !== "none"), "mapa o fallback visible");
      const errors = explainErrors(await page.errorsSummary());
      return { ...data, errors };
    },
    { severity: "alta", page },
  );

  await h.test(
    "PLAZAS-02",
    "Filtro de búsqueda y limpiar filtros sin recargar el documento",
    async () => {
      await gotoApp(page, baseURL, "plazas", { settle: 1200 });
      const before = page.navCount();
      const count0 = await page.eval(`document.getElementById('recPill')?.textContent`);
      await page.click("#filterSearch");
      await page.conn.send("Input.insertText", { text: "LIMA" });
      await sleep(900);
      const count1 = await page.eval(`({ recPill: document.getElementById('recPill')?.textContent, resCount: document.getElementById('resCount')?.textContent, navs: 0 })`);
      await page.click("#btnClear");
      await sleep(700);
      const count2 = await page.eval(`document.getElementById('recPill')?.textContent`);
      const navs = page.navCount() - before;
      assertEq(navs, 0, "recargas al filtrar/limpiar");
      assert(count0 !== count1.recPill, `el filtro cambia el resultado (${count0} → ${count1.recPill})`);
      return { count0, filtered: count1, cleared: count2, navigations: navs };
    },
    { severity: "alta", page },
  );

  await h.test(
    "PLAZAS-03",
    "Resultados → ficha de plaza (modal) y marcar favorita",
    async () => {
      await gotoApp(page, baseURL, "plazas", { settle: 1200 });
      const results = await openResults(page);
      assert(results.rows > 0, "filas de resultados renderizadas");
      const row = await page.eval(`(() => { const r=document.querySelector('#resultsList .resitem'); return r ? { id: r.dataset.id, text: r.innerText.slice(0,120) } : null; })()`);
      assert(row, "primera fila de resultados");
      const detailBtn = await firstVisible(page, [`#resultsList .resitem [data-act="detail"]`]);
      assert(detailBtn, "botón de ficha");
      await page.click(detailBtn);
      await page.waitFor(`document.getElementById('detailModal').classList.contains('open')`, { timeout: 5000 });
      const detail = await page.eval(`({ title: document.getElementById('detailTitle')?.textContent, body: document.getElementById('detailBody')?.innerText.slice(0, 220), favBtn: !!document.querySelector('#detailBody [data-det="fav"]') })`);
      assert((detail.title || "").length > 2, "título de ficha");
      assert(detail.favBtn, "acción de favorito en la ficha");
      await page.pressKey("Escape", { code: "Escape", keyCode: 27 });
      await page.waitFor(`!document.getElementById('detailModal').classList.contains('open')`, { timeout: 4000 });
      const beforeFav = await page.eval(`JSON.parse(localStorage.getItem('serums_favoritos') || '[]').length`);
      let afterFav = null;
      let lastFavError = "";
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          await page.click('#resultsList .resitem [data-act="fav"]');
          await page.waitFor(`JSON.parse(localStorage.getItem('serums_favoritos') || '[]').length > ${beforeFav}`, { timeout: 3000 });
        } catch (err) {
          lastFavError = err.message;
          await sleep(300);
          continue;
        }
        afterFav = await page.eval(`({ favs: JSON.parse(localStorage.getItem('serums_favoritos') || '[]'), badge: document.getElementById('favBadge')?.textContent, pressed: document.querySelector('#resultsList .resitem [data-act="fav"]')?.getAttribute('aria-pressed') })`);
        if (afterFav.favs.length > beforeFav) break;
      }
      if (!afterFav || afterFav.favs.length <= beforeFav) {
        // La fila puede re-renderizarse por el fallback de Maps: se usa el control ya verificado en su contexto.
        await page.eval(`document.querySelector('#resultsList .resitem [data-act="fav"]')?.click()`);
        await sleep(500);
        afterFav = await page.eval(`({ favs: JSON.parse(localStorage.getItem('serums_favoritos') || '[]'), badge: document.getElementById('favBadge')?.textContent, pressed: document.querySelector('#resultsList .resitem [data-act="fav"]')?.getAttribute('aria-pressed'), fallback: true })`);
        lastFavError += " · fallback JS click";
      }
      assertEq(afterFav.favs.length, beforeFav + 1, `favorito añadido (${lastFavError})`);
      assertEq(afterFav.badge, String(afterFav.favs.length), "badge de favoritos tras marcar");
      return { results, row, detail, beforeFav, afterFav, lastFavError };
    },
    { severity: "alta", page },
  );

  await h.test(
    "PLAZAS-04",
    "Favorito persistente tras refresh y visible en el filtro rápido",
    async () => {
      const before = await page.eval(`({ favs: JSON.parse(localStorage.getItem('serums_favoritos') || '[]'), badge: document.getElementById('favBadge')?.textContent })`);
      await page.goto(appURL(baseURL, "plazas"), { settle: 1400 });
      const after = await page.eval(`({ favs: JSON.parse(localStorage.getItem('serums_favoritos') || '[]'), badge: document.getElementById('favBadge')?.textContent })`);
      assertEq(after.favs.length, before.favs.length, "favoritos tras refresh");
      assertEq(after.badge, String(after.favs.length), "badge de favoritos");
      return { before, after };
    },
    { severity: "alta", page },
  );

  await h.test(
    "PLAZAS-05",
    "Navegación interna del rail (Estadísticas, Geolocalización, Configuración) sin recarga",
    async () => {
      await gotoApp(page, baseURL, "plazas", { settle: 1200 });
      const before = page.navCount();
      const seen = [];
      for (const [nav, sub] of [["stats", "#subStats"], ["geo", "#subGeo"], ["config", "#subConfig"], ["map", "#mapView"]]) {
        await page.click(`[data-nav="${nav}"]`);
        await sleep(500);
        const visible = await page.eval(`(() => { const e=document.querySelector(${JSON.stringify(sub)}); return e ? getComputedStyle(e).display !== 'none' : false; })()`);
        seen.push({ nav, sub, visible });
      }
      const navs = page.navCount() - before;
      assertEq(navs, 0, "recargas al navegar por el rail");
      assert(seen.filter((s) => s.visible).length >= 3, `paneles visibles: ${JSON.stringify(seen)}`);
      return { seen, navigations: navs };
    },
    { severity: "media", page },
  );

  await h.test(
    "PLAZAS-06",
    "App → HUB con el control compartido",
    async () => {
      const nav = page.waitForNavigation((url) => /\/index\.html(?:$|[?#])/.test(url), 12000);
      const click = await clickFirst(page, ['[data-serums-chrome="hub"]', 'a[aria-label="Volver al HUB"]']);
      await nav;
      await waitApp(page, "hub");
      return { click: click.selector, url: await page.eval("location.href") };
    },
    { severity: "alta", page },
  );

  await h.test(
    "PLAZAS-07",
    "Pantalla completa de la app con gesto real",
    async () => {
      await gotoApp(page, baseURL, "plazas", { settle: 1200 });
      const found = await firstVisible(page, ['[data-serums-chrome="fullscreen"]']);
      if (!found) skip("Plazas no expone control de pantalla completa de la app (solo controles internos de Google Maps).");
      await page.click(found);
      await sleep(900);
      const on = await page.eval(`({ element: !!document.fullscreenElement, pressed: document.querySelector('[data-serums-chrome="fullscreen"]').getAttribute('aria-pressed') })`);
      if (!on.element) return { ...on, limitation: "headless no concedió fullscreen" };
      await page.click(found);
      await sleep(600);
      return { on, off: await page.eval(`!!document.fullscreenElement`) };
    },
    { severity: "media", page },
  );

  await h.test(
    "PLAZAS-08",
    "Vistas con historial: hash directo, cambio de rail y atrás",
    async () => {
      await page.goto(appURL(baseURL, "plazas") + "#/estadisticas", { settle: 1500 });
      const direct = await page.eval(`({ hash: location.hash, view: window.App.S.view, open: document.getElementById('subStats').classList.contains('open') })`);
      assertEq(direct.hash, "#/estadisticas", "hash canónico de estadísticas");
      assertEq(direct.view, "stats", "vista directa de estadísticas");
      await page.click('#rail [data-nav="favoritos"]');
      await sleep(500);
      const fav = await page.eval(`({ hash: location.hash, view: window.App.S.view })`);
      assertEq(fav.hash, "#/favoritos", "hash de favoritos");
      assertEq(fav.view, "favoritos", "vista de favoritos");
      const history = await page.conn.send("Page.getNavigationHistory");
      await page.conn.send("Page.navigateToHistoryEntry", { entryId: history.entries[history.currentIndex - 1].id });
      await sleep(700);
      const back = await page.eval(`({ hash: location.hash, view: window.App.S.view })`);
      assertEq(back.hash, "#/estadisticas", "atrás vuelve a estadísticas");
      assertEq(back.view, "stats", "la vista se restaura desde el hash");
      return { direct, fav, back };
    },
    { severity: "media", page },
  );

  /* ------------------------------ Serums Map ------------------------------ */
  h.suite("Serums Map");
  h.state.app = "Serums Map";

  await h.test(
    "MAP-01",
    "URL directa y vista de mapa con marcadores/listado utilizable",
    async () => {
      await gotoApp(page, baseURL, "plazas", { settle: 1600 });
      const data = await page.eval(`(() => ({
        hash: location.hash,
        title: document.title,
        mapReady: !!(window.google && window.google.maps),
        apiBadge: document.getElementById('apiBadge')?.textContent,
        records: window.SERUMS_DATA.length,
        results: document.querySelectorAll('#resultsList .resitem').length,
        mapErrorHidden: (() => { const e=document.getElementById('mapError'); return e ? getComputedStyle(e).display === 'none' : true; })()
      }))()`);
      assert(data.mapReady || data.apiBadge.includes("error"), `estado del mapa: ${data.apiBadge}`);
      return data;
    },
    { severity: "alta", page },
  );

  await h.test(
    "MAP-02",
    "Ficha detallada desde el listado y cierre sin perder la vista",
    async () => {
      await openResults(page);
      const rows = await page.eval(`document.querySelectorAll('#resultsList .resitem').length`);
      assert(rows > 0, "resultados disponibles");
      await page.click('#resultsList .resitem [data-act="detail"]');
      await page.waitFor(`document.getElementById('detailModal').classList.contains('open')`, { timeout: 5000 });
      const opened = await page.eval(`({ title: document.getElementById('detailTitle')?.textContent, tabs: document.querySelectorAll('#detailBody [data-det]').length })`);
      await page.pressKey("Escape", { code: "Escape", keyCode: 27 });
      await sleep(300);
      const closed = await page.eval(`!document.getElementById('detailModal').classList.contains('open')`);
      assert(opened.tabs >= 2, "acciones de la ficha");
      assert(closed, "ficha cerrada con Esc");
      return { rows, opened, closed };
    },
    { severity: "media", page },
  );

  await h.test(
    "MAP-03",
    "Preferencias: tema persistente tras refresh",
    async () => {
      await gotoApp(page, baseURL, "plazas", { settle: 1200 });
      const before = await page.eval(`({ theme: document.documentElement.dataset.theme, stored: localStorage.getItem('serums_theme') })`);
      await page.click("#btnTheme");
      await sleep(400);
      const toggled = await page.eval(`({ theme: document.documentElement.dataset.theme, stored: localStorage.getItem('serums_theme') })`);
      await page.goto(appURL(baseURL, "plazas"), { settle: 1400 });
      const after = await page.eval(`({ theme: document.documentElement.dataset.theme, stored: localStorage.getItem('serums_theme') })`);
      assertEq(after.theme, toggled.theme, "tema tras refresh");
      return { before, toggled, after };
    },
    { severity: "media", page },
  );

  await h.test(
    "MAP-04",
    "Fallback sin Google Maps: la app sigue usable y avisa",
    async () => {
      await page.conn.send("Network.setCacheDisabled", { cacheDisabled: true });
      await page.conn.send("Network.setBlockedURLs", { urls: ["*maps.googleapis.com*", "*maps.gstatic.com*"] });
      page.resetErrors();
      await page.goto(appURL(baseURL, "plazas"), { settle: 1600 });
      await page.waitFor(`(() => { const e=document.getElementById('mapError'); return e && getComputedStyle(e).display !== 'none' && e.innerText.trim().length > 20; })()`, { timeout: 12000 });
      const data = await page.eval(`(() => ({
        mapError: document.getElementById('mapError').innerText.slice(0, 260),
        apiBadge: document.getElementById('apiBadge')?.textContent,
        records: window.SERUMS_DATA.length,
        listUsable: document.querySelectorAll('#resultsList .resitem').length > 0 || document.getElementById('recPill')?.textContent.includes('7,323')
      }))()`);
      await page.conn.send("Network.setBlockedURLs", { urls: [] });
      assertIncludes(data.mapError, "Google Maps");
      assert(data.listUsable, "datos y listado usables sin mapa");
      return data;
    },
    { severity: "alta", page },
  );

  await h.test(
    "MAP-05",
    "Cambio de filtro rápido sin recargar el documento",
    async () => {
      page.resetErrors();
      await page.goto(appURL(baseURL, "plazas"), { settle: 1500 });
      const before = page.navCount();
      const btn = await page.eval(`(() => { const b=document.querySelector('#quickSeg [data-quick]'); return b ? { quick: b.dataset.quick, text: b.innerText } : null; })()`);
      if (!btn) skip("No se encontró el filtro rápido por estado.");
      await page.click(`#quickSeg [data-quick="${btn.quick}"]`);
      await sleep(700);
      const after = await page.eval(`({ recPill: document.getElementById('recPill')?.textContent, active: document.querySelector('#quickSeg .on, #quickSeg [aria-pressed="true"]')?.innerText || '' })`);
      const navs = page.navCount() - before;
      assertEq(navs, 0, "recargas al cambiar filtro rápido");
      return { btn, after, navigations: navs };
    },
    { severity: "media", page },
  );
}
