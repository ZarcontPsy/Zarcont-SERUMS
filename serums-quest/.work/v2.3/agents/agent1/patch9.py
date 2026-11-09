import io
p = r'.work/v2.3/agents/agent1/qa.js'
s = io.open(p, encoding='utf-8', newline='').read()
s = s.replace("failures: fails.map((r) => ({ hero: r.hero, cosmetic: r.cosmetic, slot: r.slot, status: r.status, reason: r.failReason, visible: r.visible, areaFull: r.areaFull, areaBust: r.areaBust, gap: r.gap, pen: r.penCount, penDepth: r.penDepth, jitter: r.jitter, error: r.error }))",
              "failures: fails.map((r) => ({ hero: r.hero, cosmetic: r.cosmetic, slot: r.slot, status: r.status, reason: r.failReason, visible: r.visible, areaFull: r.areaFull, areaBust: r.areaBust, areaFront: r.areaFront, gap: r.gap, pen: r.penCount, penDepth: r.penDepth, penZone: r.penZone, jitter: r.jitter, transform: r.transform, note: r.note, error: r.error }))")
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok2')
