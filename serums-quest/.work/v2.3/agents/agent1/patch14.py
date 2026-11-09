import io
p = r'.work/src/part11-v23-anchors.js'
s = io.open(p, encoding='utf-8', newline='').read()
old = """        if (id === 'c-accesorios-bolso') {
          /* Bolso al costado de la cadera, fuera del torso. */
          var torsoB = vol.torso;
          if (v23aBoxValid(torsoB)) {
            var over = box.min.x - (torsoB.max.x + 0.01);
            if (over < 0) move(-over, 0, 0);
          }
        }"""
new = """        if (id === 'c-accesorios-bolso') {
          /* Bolso al costado de la cadera: fuera del torso y delante del
             brazo que cuelga, para que se lea en la vista frontal. */
          var torsoB = vol.torso;
          if (v23aBoxValid(torsoB)) {
            var want = torsoB.max.x + 0.02;
            if (box.min.x < want) move(want - box.min.x, 0, 0);
          }
          move(0, 0, 0.05);
          t.note = 'bolso al costado, delante del brazo';
        }"""
assert old in s
s = s.replace(old, new)
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
