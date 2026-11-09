'use strict';
/* Caso 4 · Matriz completa 69 cosméticos × 10 héroes en tandas de 30 casos,
   con comprobación de cambio de héroe y de guardado intacto. */
const C = require('./common');

(async () => {
  const report = { startedAt: new Date().toISOString(), matrix: null, switchCheck: null, saveCheck: null, anchors: null, nav: null, errors: {}, fatal: null };
  let s;
  try {
    s = await C.launch({ width: 1280, height: 720, preload: C.NAV_COUNTER_PRELOAD });
    await s.seed(C.readSave('all'));
    await C.sleep(900);
    const navs = C.trackNavigations(s);
    const before = await s.ev(`(() => ({
      nav: window.__v23.navigationCount(), docGen: window.__qaDocGen,
      renderCount: window.__v23.renderCount(),
      snapshot: window.__v23Anchors.stateSnapshot(),
      save: (() => { try { return localStorage.getItem('serumsquest:voxel:state:v1'); } catch (e) { return null; } })(),
      anchors: window.__v23Anchors.stats(),
      total: window.__v23Anchors.heroIds().length * window.__v23Anchors.cosmeticIds().length,
      heroes: window.__v23Anchors.heroIds().length,
      cosmetics: window.__v23Anchors.cosmeticIds().length
    }))()`);
    report.before = { nav: before.nav, docGen: before.docGen, renderCount: before.renderCount, totalCases: before.total, heroes: before.heroes, cosmetics: before.cosmetics, anchors: before.anchors };

    const t0 = Date.now();
    await s.ev(`(() => {
      window.__qaMatrix = { result: null, error: null, startedAt: Date.now(), ms: 0 };
      window.__v23Anchors.matrixAsync({ chunk: 30 }).then(function (r) {
        window.__qaMatrix.result = r;
        window.__qaMatrix.ms = Date.now() - window.__qaMatrix.startedAt;
      }).catch(function (e) {
        window.__qaMatrix.error = String(e && (e.stack || e.message) || e);
      });
      return true;
    })()`);
    let poll = null;
    for (let i = 0; i < 100; i += 1) {
      await C.sleep(3000);
      poll = await s.ev('({ done: !!window.__qaMatrix.result, error: window.__qaMatrix.error, ms: window.__qaMatrix.ms, elapsed: Date.now() - window.__qaMatrix.startedAt })');
      if (poll.done || poll.error) break;
      if (i % 5 === 0) console.log('matrix poll', i, JSON.stringify(poll));
    }
    const wallMs = Date.now() - t0;
    const result = await s.ev('window.__qaMatrix.result');
    report.matrix = {
      wallMs,
      inPageMs: poll && poll.ms,
      error: poll && poll.error,
      total: result ? result.total : null,
      pass: result ? result.pass : null,
      fail: result ? result.fail : null,
      rate: result && result.total ? Math.round((result.pass / result.total) * 10000) / 100 : null,
      bySlot: {},
      failures: [],
      minArea: null,
      medianArea: null,
      flags: { penetraCuerpo: 0, huecoFlotante: 0, parpadeo: 0, invisible: 0, title: 0 }
    };
    if (result && result.cases) {
      const areas = [];
      const slots = {};
      result.cases.forEach((c) => {
        const slot = c.slot || '?';
        slots[slot] = slots[slot] || { total: 0, pass: 0, fail: 0, minArea: null };
        slots[slot].total += 1;
        if (c.status === 'PASS') slots[slot].pass += 1; else slots[slot].fail += 1;
        const area = Number(c.areaFull) || 0;
        if (area > 0) areas.push(area);
        if (slots[slot].minArea == null || area < slots[slot].minArea) slots[slot].minArea = area;
        if (c.penetraCuerpo) report.matrix.flags.penetraCuerpo += 1;
        if (c.huecoFlotante) report.matrix.flags.huecoFlotante += 1;
        if (c.parpadeo) report.matrix.flags.parpadeo += 1;
        if (c.visible === false) report.matrix.flags.invisible += 1;
        if (c.status !== 'PASS') {
          report.matrix.failures.push({
            hero: c.hero, cosmetic: c.cosmetic, slot: c.slot, status: c.status, note: c.note || null,
            visible: c.visible, penetraCuerpo: c.penetraCuerpo, huecoFlotante: c.huecoFlotante, parpadeo: c.parpadeo,
            areaFull: c.areaFull, gap: c.gap
          });
        }
      });
      areas.sort((a, b) => a - b);
      report.matrix.minArea = areas.length ? areas[0] : null;
      report.matrix.medianArea = areas.length ? areas[Math.floor(areas.length / 2)] : null;
      report.matrix.bySlot = slots;
      report.matrix.sample = result.cases.slice(0, 2);
      report.matrix.sampleLast = result.cases.slice(-2);
    }

    const switchRes = await s.ev('window.__v23Anchors.heroSwitchCheck()');
    report.switchCheck = {
      ok: switchRes.ok, savedUnchanged: switchRes.savedUnchanged,
      rows: (switchRes.rows || []).map((r) => ({ hero: r.hero, groups: r.groups, slots: r.slots, title: r.title })),
      before: switchRes.before, after: switchRes.after,
      error: switchRes.error || null
    };
    const after = await s.ev(`(() => ({
      nav: window.__v23.navigationCount(), docGen: window.__qaDocGen,
      renderCount: window.__v23.renderCount(),
      snapshot: window.__v23Anchors.stateSnapshot(),
      save: (() => { try { return localStorage.getItem('serumsquest:voxel:state:v1'); } catch (e) { return null; } })(),
      anchors: window.__v23Anchors.stats()
    }))()`);
    report.saveCheck = {
      saveEqual: before.save === after.save,
      snapshotEqual: JSON.stringify(before.snapshot) === JSON.stringify(after.snapshot),
      equippedBefore: before.snapshot && before.snapshot.equipped,
      equippedAfter: after.snapshot && after.snapshot.equipped,
      selectedBefore: before.snapshot && before.snapshot.selected,
      selectedAfter: after.snapshot && after.snapshot.selected,
      renderCountDelta: after.renderCount - before.renderCount
    };
    report.anchors = { before: before.anchors, after: after.anchors };
    report.nav = { count: navs.length, urls: navs.map((n) => n.url), navBefore: before.nav, navAfter: after.nav, docGenBefore: before.docGen, docGenAfter: after.docGen };
    report.errors = C.summarizeErrors(s);
  } catch (e) {
    report.fatal = String(e && e.stack || e);
  } finally {
    if (s) { report.sessionErrors = C.summarizeErrors(s); await s.close(); }
  }
  C.writeJSON('matrix.json', report);
  console.log(JSON.stringify({ matrix: { total: report.matrix && report.matrix.total, pass: report.matrix && report.matrix.pass, fail: report.matrix && report.matrix.fail, rate: report.matrix && report.matrix.rate, wallMs: report.matrix && report.matrix.wallMs, bySlot: report.matrix && report.matrix.bySlot, flags: report.matrix && report.matrix.flags, minArea: report.matrix && report.matrix.minArea }, switchCheck: report.switchCheck && { ok: report.switchCheck.ok, rows: report.switchCheck.rows }, saveCheck: report.saveCheck, nav: report.nav, fatal: report.fatal }, null, 1));
})();
