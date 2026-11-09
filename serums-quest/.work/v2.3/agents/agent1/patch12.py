import io
p = r'.work/src/part11-v23-anchors.js'
s = io.open(p, encoding='utf-8', newline='').read()
s = s.replace("var want2 = v23aClamp(wh / 1.55, 0.55, 1.25);", "var want2 = v23aClamp(wh / 1.55, 0.82, 1.25);")
old = """        if (id === 'c-accesorios-pluma') {
          var tb2 = vol.torso;
          if (v23aBoxValid(tb2) && box.min.x > tb2.min.x - 0.02 && box.max.x < tb2.max.x + 0.02 && Math.abs(box.max.y - tb2.max.y) < 0.4) {
            move(-(tb2.max.x - box.min.x) - 0.03, 0, 0);
            t.note = 'pluma fuera del torso';
          }
        }"""
new = """        if (id === 'c-accesorios-pluma') {
          var tb2 = vol.torso;
          if (v23aBoxValid(tb2) && box.max.x < 0 && box.max.x > tb2.min.x - 0.02 && box.min.x < tb2.max.x && box.max.y > tb2.min.y && box.min.y < tb2.max.y) {
            move((tb2.min.x - 0.03) - box.max.x, 0, 0);
            t.note = 'pluma fuera del torso';
          }
        }"""
assert old in s
s = s.replace(old, new)
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
