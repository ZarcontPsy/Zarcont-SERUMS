import io
p = r'.work/src/part11-v23-anchors.js'
s = io.open(p, encoding='utf-8', newline='').read()
s = s.replace("""        var worst = 0;
        for (var ti = 0; ti < cfg.test.length; ti++) {
          var key = cfg.test[ti];
          var box = vol[key];
          if (!v23aBoxValid(box)) continue;
          var depth = v23aPointBoxDepth(p, box);
          if (depth <= 0) continue;
          var isSupport = cfg.support.indexOf(key) >= 0;
          var allow = isSupport ? cfg.penAllow : cfg.penForeign;
          if (depth > allow) worst = Math.max(worst, depth - allow);
        }
        if (worst > 0) { pen.count++; if (worst > pen.worst) pen.worst = worst; }""",
"""        var worst = 0, worstKey = '';
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
        if (worst > 0) { pen.count++; if (worst > pen.worst) { pen.worst = worst; pen.key = worstKey; } }""")
s = s.replace("      res.penDepth = v23aPad(pen.worst);", "      res.penDepth = v23aPad(pen.worst);\n      res.penZone = pen.key || '';")
# x-arma config: torso support too
s = s.replace("out.test = ['weapon', 'armR', 'armL', 'torso', 'headSupport']; out.support = ['weapon', 'armR']; out.tol = 0.45; out.penAllow = 0.18; out.penForeign = 0.05;",
              "out.test = ['weapon', 'armR', 'armL', 'torso', 'headSupport']; out.support = ['weapon', 'armR', 'torso']; out.tol = 0.45; out.penAllow = 0.30; out.penForeign = 0.05;")
# bag/pluma allowance
s = s.replace("out.support = ['body', 'armL', 'armR', 'legL', 'legR']; out.tol = 0.35; out.penAllow = 0.22; out.penForeign = 0.05;",
              "out.support = ['body', 'armL', 'armR', 'legL', 'legR']; out.tol = 0.35; out.penAllow = 0.30; out.penForeign = 0.05;")
# platinum frame moves back
s = s.replace("    'x-cuaderno-orbital': { orbitCenter: [0, 1.52, 0.32], note: 'órbita delante del torso' }",
              "    'x-cuaderno-orbital': { orbitCenter: [0, 1.52, 0.32], note: 'órbita delante del torso' },\n    /* El marco de platino lleva barras interiores en z=0 (dentro del cuerpo):\n       se retrasa el conjunto para que queden detrás de la silueta. */\n    'c-marco-platino': { dz: -0.62, note: 'barras interiores detrás del cuerpo' }")
# apply generic rule dz for marcos
s = s.replace("""      } else if (slot === 'marcos') {
        t.anchor = 'cuerpo (detrás)';
        var sil = vol.body;""",
"""      } else if (slot === 'marcos') {
        t.anchor = 'cuerpo (detrás)';
        if (rule && rule.dz) move(0, 0, rule.dz);
        var sil = vol.body;""")
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
