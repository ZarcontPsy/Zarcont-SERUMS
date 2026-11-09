import io
p = r'.work/src/part11-v23-anchors.js'
s = io.open(p, encoding='utf-8', newline='').read()

s = s.replace("      get ready() { return V23A.ready; },\n      fitting: true,", "      ready: false,\n      reason: '',\n      fitting: true,")

s = s.replace("""        var prevFitting0 = V23A.fitting;
        if (opts.raw) V23A.fitting = false;
        var avT;
        try { avT = v23aPrepAvatar(heroId, (function () { var o = {}; o.titulo = cosmeticId; return o; })()); }
        finally { V23A.fitting = opts.raw ? prevFitting0 : prevFitting0; }""",
"""        var prevFitting0 = V23A.fitting;
        if (opts.raw) V23A.fitting = false;
        var avT;
        try { avT = v23aPrepAvatar(heroId, (function () { var o = {}; o.titulo = cosmeticId; return o; })()); }
        finally { V23A.fitting = prevFitting0; }""")

s = s.replace("""      errors: function () { return V23A.errors.slice(); },
      clear: function () { V23A.errors.length = 0; }""",
"""      errors: function () { return V23A.errors.slice(); },
      setFitting: function (on) { V23A.fitting = !!on; api.fitting = !!on; return V23A.fitting; },
      clear: function () { V23A.errors.length = 0; }""")

old_boot = """      var api = v23aApi();
      window.__v23Anchors = window.__v23Anchors || {};
      Object.keys(api).forEach(function (k) { window.__v23Anchors[k] = api[k]; });
      window.__v23Anchors.__part = 'part11-v23-anchors';
      if (typeof V23 !== 'undefined' && V23 && V23.flags) V23.flags.anchorsReady = true;
      V23A.ready = v23aInstall();
      window.__v23Anchors.fitting = true;"""
new_boot = """      var api = v23aApi();
      if (typeof V23 !== 'undefined' && V23 && V23.flags) V23.flags.anchorsReady = true;
      V23A.ready = v23aInstall();
      api.ready = V23A.ready;
      api.reason = V23A.ready ? '' : V23A.reason;
      window.__v23Anchors = api;
      window.__v23Anchors.fitting = V23A.fitting;"""
assert old_boot in s
s = s.replace(old_boot, new_boot)

s = s.replace("""            if (spec && typeof spec.baseX === 'number') {
            var oldX = spec.baseX;
            spec.baseX = wantX2;
            move(wantX2 - oldX, 0, 0);
          } else {
            move(wantX2 - box.min.x - 0.2, 0, 0);
          }
          t.note = 'mascota fuera del cuerpo';""",
"""            if (spec && typeof spec.baseX === 'number') {
            var oldX = spec.baseX;
            spec.baseX = wantX2;
            move(wantX2 - oldX, 0, 0);
          } else {
            move(wantX2 - box.min.x - 0.2, 0, 0);
          }
          t.mask = {};
          t.note = 'mascota fuera del cuerpo';""")

# remove dead line
s = s.replace("            if (anim0) { anim0.v23dx = (anim0.v23dx || 0) + 0; }\n", "")
# remove dead var in anchors
s = s.replace("    var headPivot = b.worldToLocal ? null : null;\n", "")
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
