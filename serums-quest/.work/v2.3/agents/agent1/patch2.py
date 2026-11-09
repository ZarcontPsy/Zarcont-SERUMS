import io
p = r'.work/src/part11-v23-anchors.js'
s = io.open(p, encoding='utf-8', newline='').read()
old = """      var pen = { count: 0, worst: 0 };
      for (var pi = 0; pi < samplesB.length; pi++) {
        var p = samplesB[pi];
        var worst = 0;
        for (var key in vol) {
          if (key === 'full' || key === 'body' || key === 'weapon' || key === 'cape' || key === 'skull' || key === 'hair') {
            if (key !== 'body' || cfg.support.indexOf('body') < 0) {
              if (key !== 'skull' && key !== 'hair') continue;
            }
          }
          if (key === 'body' && cfg.support.indexOf('body') < 0) continue;
          var box = vol[key];
          if (!v23aBoxValid(box)) continue;
          var depth = v23aPointBoxDepth(p, box);
          if (depth <= 0) continue;
          var isSupport = cfg.support.indexOf(key) >= 0;
          var allow = isSupport ? cfg.penAllow : cfg.penForeign;
          if (depth > allow) worst = Math.max(worst, depth - allow);
        }
        if (worst > 0) { pen.count++; if (worst > pen.worst) pen.worst = worst; }
      }"""
new = """      var pen = { count: 0, worst: 0 };
      for (var pi = 0; pi < samplesB.length; pi++) {
        var p = samplesB[pi];
        var worst = 0;
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
        if (worst > 0) { pen.count++; if (worst > pen.worst) pen.worst = worst; }
      }"""
assert old in s
s = s.replace(old, new)
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
