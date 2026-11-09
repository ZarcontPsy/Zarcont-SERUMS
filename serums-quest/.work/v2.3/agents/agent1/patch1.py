import io, re
p = r'.work/src/part11-v23-anchors.js'
s = io.open(p, encoding='utf-8', newline='').read()
start = s.index('  function v23aConfig(slot, id) {')
end = s.index('  function v23aFit(av, parent, group, c, slot) {')
new = '''  function v23aConfig(slot, id) {
    var cfg = {
      cabeza: { test: ['headSupport', 'neck', 'torso', 'armL', 'armR', 'legL', 'legR'], support: ['headSupport', 'neck'], tol: 0.10, penAllow: 0.12, penForeign: 0.04 },
      peinado: { test: ['headSupport', 'neck', 'torso', 'armL', 'armR', 'legL', 'legR'], support: ['headSupport', 'neck'], tol: 0.10, penAllow: 0.12, penForeign: 0.04 },
      torso: { test: ['torso', 'neck', 'armL', 'armR', 'legL', 'legR'], support: ['torso', 'neck', 'legL', 'legR'], tol: 0.10, penAllow: 0.10, penForeign: 0.04 },
      piernas: { test: ['legL', 'legR', 'torso', 'armL', 'armR'], support: ['legL', 'legR'], tol: 0.14, penAllow: 0.09, penForeign: 0.04 },
      accesorios: { test: ['body', 'headSupport', 'armL', 'armR', 'torso'], support: ['body'], tol: 0.35, penAllow: 0.13, penForeign: 0.05 },
      extras: { test: ['body', 'torso', 'armL', 'armR', 'headSupport', 'legL', 'legR'], support: ['body'], tol: 0.75, penAllow: 0.12, penForeign: 0.04 },
      amuletos: { test: ['torso', 'neck', 'armL', 'armR', 'headSupport'], support: ['torso', 'neck'], tol: 0.12, penAllow: 0.14, penForeign: 0.04 },
      efectos: { test: ['body'], support: ['body'], tol: 0.95, penAllow: 0.6, penForeign: 0.10 },
      marcos: { test: ['body'], support: ['body'], tol: 1.10, penAllow: 0.04, penForeign: 0.03 },
      mascota: { test: ['body', 'armL', 'armR', 'headSupport', 'legL', 'legR', 'torso'], support: ['body'], tol: 1.30, penAllow: 0.03, penForeign: 0.025 },
      estela: { test: ['feet', 'legL', 'legR'], support: ['feet'], tol: 0.55, penAllow: 0.10, penForeign: 0.04 },
      titulo: { test: [], support: [], tol: 999, penAllow: 0, penForeign: 0 }
    };
    var src = cfg[slot] || cfg.extras;
    var out = {
      test: (src.test || []).slice(),
      support: (src.support || []).slice(),
      tol: src.tol,
      penAllow: src.penAllow,
      penForeign: src.penForeign
    };
    if (slot === 'accesorios') {
      if (id === 'c-accesorios-gafas') { out.test = ['headSupport', 'torso', 'armL', 'armR']; out.support = ['headSupport']; out.tol = 0.08; out.penAllow = 0.08; out.penForeign = 0.04; }
      else if (id === 'c-accesorios-brujula') { out.test = ['armL', 'torso', 'headSupport']; out.support = ['armL']; out.tol = 0.08; out.penAllow = 0.06; out.penForeign = 0.04; }
    } else if (slot === 'extras') {
      if (id === 'c-accesorios-bolso' || id === 'c-accesorios-pluma') {
        out.test = ['body', 'torso', 'armL', 'armR', 'headSupport']; out.support = ['body']; out.tol = 0.35; out.penAllow = 0.13; out.penForeign = 0.05;
      } else {
        out.test = ['body', 'armL', 'armR', 'headSupport', 'legL', 'legR', 'torso']; out.support = ['body']; out.tol = 0.8; out.penAllow = 0.04; out.penForeign = 0.03;
      }
    } else if (slot === 'efectos') {
      if (id && id.indexOf('x-arma-') === 0) {
        out.test = ['weapon', 'armR', 'armL', 'torso', 'headSupport']; out.support = ['weapon']; out.tol = 0.45; out.penAllow = 0.10; out.penForeign = 0.05;
      } else {
        out.test = ['body']; out.support = ['body']; out.penAllow = 0.6;
      }
    }
    return out;
  }

'''
s = s[:start] + new + s[end:]
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok', len(s))
