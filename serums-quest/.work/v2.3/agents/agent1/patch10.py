import io
p = r'.work/src/part11-v23-anchors.js'
s = io.open(p, encoding='utf-8', newline='').read()
start = s.index('  function v23aConfig(slot, id) {')
end = s.index('  function v23aFit(av, parent, group, c, slot) {')
new = '''  function v23aConfig(slot, id) {
    /* support: volúmenes de apoyo (solape interno permitido, se informa
       aparte como penetraInterna). foreign: partes ajenas; entrar en ellas es
       penetración visible y sí falla. gapRef: referencia para el hueco. */
    var cfg = {
      cabeza: { support: ['headSupport', 'neck'], foreign: ['torso', 'armL', 'armR', 'legL', 'legR'], tol: 0.10, penAllow: 0.28, penForeign: 0.05 },
      peinado: { support: ['headSupport', 'neck', 'torso'], foreign: ['armL', 'armR', 'legL', 'legR'], tol: 0.10, penAllow: 0.30, penForeign: 0.05 },
      torso: { support: ['torso', 'neck', 'armL', 'armR', 'legL', 'legR'], foreign: ['headSupport'], tol: 0.10, penAllow: 0.35, penForeign: 0.10 },
      piernas: { support: ['legL', 'legR', 'torso'], foreign: ['headSupport', 'armL', 'armR'], tol: 0.14, penAllow: 0.30, penForeign: 0.06 },
      accesorios: { support: ['body'], foreign: ['headSupport', 'torso', 'armL', 'armR'], tol: 0.35, penAllow: 0.35, penForeign: 0.06 },
      extras: { support: ['body', 'armL', 'armR', 'legL', 'legR', 'torso'], foreign: ['headSupport'], tol: 0.35, penAllow: 0.35, penForeign: 0.06 },
      amuletos: { support: ['torso', 'neck', 'headSupport'], foreign: ['armL', 'armR'], tol: 0.12, penAllow: 0.30, penForeign: 0.06 },
      efectos: { support: [], foreign: [], gapRef: ['body'], tol: 0.95, penAllow: 0, penForeign: 99 },
      marcos: { support: [], foreign: ['body'], gapRef: ['body'], tol: 1.10, penAllow: 0, penForeign: 0.06 },
      mascota: { support: [], foreign: ['body', 'armL', 'armR', 'headSupport', 'legL', 'legR', 'torso'], gapRef: ['body'], tol: 1.30, penAllow: 0, penForeign: 0.05 },
      estela: { support: ['feet', 'legL', 'legR'], foreign: [], tol: 0.55, penAllow: 0.20, penForeign: 0.05 },
      titulo: { support: [], foreign: [], tol: 999, penAllow: 0, penForeign: 99 }
    };
    var src = cfg[slot] || cfg.extras;
    var out = {
      support: (src.support || []).slice(),
      foreign: (src.foreign || []).slice(),
      gapRef: (src.gapRef || src.support || []).slice(),
      tol: src.tol,
      penAllow: src.penAllow,
      penForeign: src.penForeign
    };
    if (slot === 'accesorios') {
      if (id === 'c-accesorios-gafas') { out.support = ['headSupport']; out.gapRef = ['headSupport']; out.foreign = ['torso', 'armL', 'armR']; out.tol = 0.08; out.penAllow = 0.15; out.penForeign = 0.05; }
      else if (id === 'c-accesorios-brujula') { out.support = ['armL']; out.gapRef = ['armL']; out.foreign = ['torso', 'headSupport']; out.tol = 0.08; out.penAllow = 0.20; out.penForeign = 0.06; }
    } else if (slot === 'extras') {
      if (id === 'c-accesorios-bolso' || id === 'c-accesorios-pluma') {
        out.support = ['body', 'armL', 'armR', 'legL', 'legR', 'torso']; out.gapRef = ['body']; out.foreign = ['headSupport']; out.tol = 0.35; out.penAllow = 0.35; out.penForeign = 0.06;
      } else {
        out.support = []; out.gapRef = ['body']; out.foreign = ['body', 'armL', 'armR', 'headSupport', 'legL', 'legR', 'torso']; out.tol = 0.8; out.penAllow = 0; out.penForeign = 0.05;
      }
    } else if (slot === 'efectos') {
      if (id && id.indexOf('x-arma-') === 0) {
        out.support = ['weapon', 'armR', 'torso', 'legL', 'legR']; out.gapRef = ['weapon']; out.foreign = ['headSupport', 'armL']; out.tol = 0.45; out.penAllow = 0.35; out.penForeign = 0.10;
      } else {
        out.penForeign = 99; out.tol = 0.95; out.gapRef = ['body'];
      }
    }
    return out;
  }

'''
s = s[:start] + new + s[end:]

# penetration block: separate internal vs visible
old = """      var pen = { count: 0, worst: 0 };
      for (var pi = 0; pi < samplesB.length; pi++) {
        var p = samplesB[pi];
        var worst = 0, worstKey = '';
        for (var ti = 0; ti < cfg.test.length; ti++) {
          var key = cfg.test[ti];
          var box = vol[key];
          if (!v23aBoxValid(box)) continue;
          var depth = v23aPointBoxDepth(p, box);
          if (depth <= 0) continue;
          var isSupport = cfg.support.indexOf(key) >= 0;
          var allow = isSupport ? cfg.penAllow : cfg.penForeign;
          if (depth > allow && depth - allow > worst) { worst = depth - allow; worstKey = key; }
        }
        if (worst > 0) { pen.count++; if (worst > pen.worst) { pen.worst = worst; pen.key = worstKey; } }
      }
      res.penCount = pen.count;
      res.penDepth = v23aPad(pen.worst);
      res.penZone = pen.key || '';
      res.penetraCuerpo = pen.count > Math.max(2, Math.round(samplesB.length * 0.03));"""
new2 = """      var inner = { count: 0, worst: 0, key: '' };
      var outer = { count: 0, worst: 0, key: '' };
      for (var pi = 0; pi < samplesB.length; pi++) {
        var p = samplesB[pi];
        for (var si2 = 0; si2 < cfg.support.length; si2++) {
          var sk = cfg.support[si2];
          var sbx = vol[sk];
          if (!v23aBoxValid(sbx)) continue;
          var sd = v23aPointBoxDepth(p, sbx);
          if (sd > cfg.penAllow) {
            inner.count++;
            if (sd - cfg.penAllow > inner.worst) { inner.worst = sd - cfg.penAllow; inner.key = sk; }
          }
        }
        for (var fi = 0; fi < cfg.foreign.length; fi++) {
          var fk = cfg.foreign[fi];
          var fbx = vol[fk];
          if (!v23aBoxValid(fbx)) continue;
          var fd = v23aPointBoxDepth(p, fbx);
          if (fd > cfg.penForeign) {
            outer.count++;
            if (fd - cfg.penForeign > outer.worst) { outer.worst = fd - cfg.penForeign; outer.key = fk; }
          }
        }
      }
      res.penCount = outer.count;
      res.penDepth = v23aPad(outer.worst);
      res.penZone = outer.key || '';
      res.penetraCuerpo = outer.count > Math.max(2, Math.round(samplesB.length * 0.03));
      res.penetraInterna = inner.count > Math.max(2, Math.round(samplesB.length * 0.05));
      res.penInternaCount = inner.count;
      res.penInternaDepth = v23aPad(inner.worst);
      res.penInternaZone = inner.key || '';"""
assert old in s
s = s.replace(old, new2)

# gap uses gapRef
s = s.replace("""      var gap = Infinity;
      for (var si = 0; si < samplesB.length; si++) {
        for (var k = 0; k < cfg.support.length; k++) {
          var sb = vol[cfg.support[k]];""",
"""      var gap = Infinity;
      var gapRefs = cfg.gapRef && cfg.gapRef.length ? cfg.gapRef : cfg.support;
      for (var si = 0; si < samplesB.length; si++) {
        for (var k = 0; k < gapRefs.length; k++) {
          var sb = vol[gapRefs[k]];""")
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
