import io
p = r'.work/src/part11-v23-anchors.js'
s = io.open(p, encoding='utf-8', newline='').read()
# torso/piernas foreign skull instead of headSupport
s = s.replace("torso: { support: ['torso', 'neck', 'armL', 'armR', 'legL', 'legR'], foreign: ['headSupport'], tol: 0.10, penAllow: 0.35, penForeign: 0.10 }",
              "torso: { support: ['torso', 'neck', 'armL', 'armR', 'legL', 'legR'], foreign: ['skull'], tol: 0.10, penAllow: 0.35, penForeign: 0.10 }")
s = s.replace("piernas: { support: ['legL', 'legR', 'torso'], foreign: ['headSupport', 'armL', 'armR'], tol: 0.14, penAllow: 0.30, penForeign: 0.06 }",
              "piernas: { support: ['legL', 'legR', 'torso'], foreign: ['skull', 'armL', 'armR'], tol: 0.14, penAllow: 0.30, penForeign: 0.06 }")
# brujula: torso support
s = s.replace("out.support = ['armL']; out.gapRef = ['armL']; out.foreign = ['torso', 'headSupport']; out.tol = 0.08; out.penAllow = 0.20; out.penForeign = 0.06;",
              "out.support = ['armL', 'torso']; out.gapRef = ['armL']; out.foreign = ['headSupport']; out.tol = 0.08; out.penAllow = 0.25; out.penForeign = 0.06;")
# x-arma: larger min scale + push in front of the weapon
s = s.replace("var want2 = v23aClamp(wh / 1.55, 0.82, 1.25);", "var want2 = v23aClamp(wh / 1.55, 0.90, 1.25);")
s = s.replace("""            var wc = v23aBoxCenter(wv), pc = v23aBoxCenter(box);
            move(wc.x - pc.x, wc.y - pc.y, wc.z - pc.z + 0.02);
            t.note = 'efecto centrado en el arma';""",
"""            var wc = v23aBoxCenter(wv), pc = v23aBoxCenter(box);
            move(wc.x - pc.x, wc.y - pc.y, 0);
            box = v23aBoxOf(group, parent, null, true);
            /* El brillo no debe quedar enterrado dentro de la malla del arma. */
            var fwd = (wv.max.z + 0.07) - box.min.z;
            if (fwd > 0) move(0, 0, fwd);
            t.note = 'efecto centrado y delante del arma';""")
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
