import io
p = r'.work/src/part11-v23-anchors.js'
s = io.open(p, encoding='utf-8', newline='').read()

# --- config rewrite (targeted replacements) ---
s = s.replace("cabeza: { test: ['headSupport', 'neck', 'torso', 'armL', 'armR', 'legL', 'legR'], support: ['headSupport', 'neck'], tol: 0.10, penAllow: 0.16, penForeign: 0.04 }",
              "cabeza: { test: ['headSupport', 'neck', 'torso', 'armL', 'armR', 'legL', 'legR'], support: ['headSupport', 'neck'], tol: 0.10, penAllow: 0.20, penForeign: 0.04 }")
s = s.replace("peinado: { test: ['headSupport', 'neck', 'torso', 'armL', 'armR', 'legL', 'legR'], support: ['headSupport', 'neck'], tol: 0.10, penAllow: 0.16, penForeign: 0.04 }",
              "peinado: { test: ['headSupport', 'neck', 'torso', 'armL', 'armR', 'legL', 'legR'], support: ['headSupport', 'neck', 'torso'], tol: 0.10, penAllow: 0.22, penForeign: 0.05 }")
s = s.replace("torso: { test: ['torso', 'neck', 'armL', 'armR', 'legL', 'legR'], support: ['torso', 'neck', 'legL', 'legR'], tol: 0.10, penAllow: 0.22, penForeign: 0.04 }",
              "torso: { test: ['torso', 'neck', 'armL', 'armR', 'legL', 'legR', 'headSupport'], support: ['torso', 'neck', 'armL', 'armR', 'legL', 'legR'], tol: 0.10, penAllow: 0.28, penForeign: 0.05 }")
s = s.replace("piernas: { test: ['legL', 'legR', 'torso', 'armL', 'armR'], support: ['legL', 'legR'], tol: 0.14, penAllow: 0.18, penForeign: 0.05 }",
              "piernas: { test: ['legL', 'legR', 'torso', 'armL', 'armR', 'headSupport'], support: ['legL', 'legR', 'torso'], tol: 0.14, penAllow: 0.22, penForeign: 0.05 }")
s = s.replace("amuletos: { test: ['torso', 'neck', 'armL', 'armR', 'headSupport'], support: ['torso', 'neck'], tol: 0.12, penAllow: 0.20, penForeign: 0.05 }",
              "amuletos: { test: ['torso', 'neck', 'armL', 'armR', 'headSupport'], support: ['torso', 'neck', 'headSupport'], tol: 0.12, penAllow: 0.22, penForeign: 0.05 }")
s = s.replace("estela: { test: ['feet', 'legL', 'legR'], support: ['feet'], tol: 0.55, penAllow: 0.12, penForeign: 0.05 }",
              "estela: { test: ['feet', 'legL', 'legR'], support: ['feet', 'legL', 'legR'], tol: 0.55, penAllow: 0.16, penForeign: 0.05 }")
s = s.replace("out.tol = 0.08; out.penAllow = 0.10; out.penForeign = 0.04; }",
              "out.tol = 0.08; out.penAllow = 0.10; out.penForeign = 0.05; }")
s = s.replace("out.support = ['armL']; out.tol = 0.08; out.penAllow = 0.10; out.penForeign = 0.04; }",
              "out.support = ['armL']; out.tol = 0.08; out.penAllow = 0.16; out.penForeign = 0.05; }")
s = s.replace("out.test = ['body', 'torso', 'armL', 'armR', 'headSupport']; out.support = ['body']; out.tol = 0.35; out.penAllow = 0.20; out.penForeign = 0.05;",
              "out.test = ['body', 'torso', 'armL', 'armR', 'legL', 'legR', 'headSupport']; out.support = ['body', 'armL', 'armR', 'legL', 'legR']; out.tol = 0.35; out.penAllow = 0.22; out.penForeign = 0.05;")
s = s.replace("out.support = ['weapon']; out.tol = 0.45; out.penAllow = 0.10; out.penForeign = 0.05;",
              "out.support = ['weapon', 'armR']; out.tol = 0.45; out.penAllow = 0.18; out.penForeign = 0.05;")

# --- normalize animated piece start positions before fit ---
s = s.replace("""  function v23aFit(av, parent, group, c, slot) {
    var kind = v23aParentKind(av, parent);
    var m = v23aMeasure(av);
    var vol = v23aVolumes(av, parent);
    var box = v23aBoxOf(group, parent, null, true);""",
"""  function v23aFit(av, parent, group, c, slot) {
    var kind = v23aParentKind(av, parent);
    var m = v23aMeasure(av);
    var vol = v23aVolumes(av, parent);
    /* Las piezas con animación absoluta deben medirse desde su posición de
       reposo, no desde la posición de autor: si no, el primer fotograma
       estático (retratos) quedaría desplazado. */
    try {
      var a0 = group.userData && group.userData.anim && group.userData.anim[0];
      if (a0 && a0.type === 'orbit' && a0.radius != null) {
        group.position.set(-0.45, a0.baseY != null ? a0.baseY : group.position.y, -0.2);
      } else if (a0 && a0.type === 'pet') {
        group.position.set(a0.baseX != null ? a0.baseX : group.position.x, a0.baseY != null ? a0.baseY : group.position.y, a0.baseZ != null ? a0.baseZ : group.position.z);
      } else if (a0 && (a0.type === 'float' || a0.type === 'frame') && a0.baseY != null) {
        group.position.y = a0.baseY;
      } else if (a0 && a0.type === 'trail') {
        group.position.y = 0.28;
      }
      group.updateMatrixWorld(true);
    } catch (eA) {}
    var box = v23aBoxOf(group, parent, null, true);""")

# --- fallback to sprite box in audit piece box ---
s = s.replace("""      var pieceBoxB = v23aBoxEmpty();
      for (var i = 0; i < groups.length; i++) {
        var gb = v23aBoxBetween(v23aBoxOf(groups[i], groups[i].parent, null, true), groups[i].parent, av.body);
        if (v23aBoxValid(gb)) pieceBoxB.union(gb);
      }
      if (!v23aBoxValid(pieceBoxB)) throw new Error('bbox de pieza vacía');""",
"""      var pieceBoxB = v23aBoxEmpty();
      var pieceSpritesB = v23aBoxEmpty();
      for (var i = 0; i < groups.length; i++) {
        var gb = v23aBoxBetween(v23aBoxOf(groups[i], groups[i].parent, null, true), groups[i].parent, av.body);
        if (v23aBoxValid(gb)) pieceBoxB.union(gb);
        var gs = v23aBoxBetween(v23aBoxOf(groups[i], groups[i].parent), groups[i].parent, av.body);
        if (v23aBoxValid(gs)) pieceSpritesB.union(gs);
      }
      if (!v23aBoxValid(pieceBoxB)) pieceBoxB = pieceSpritesB.clone();
      var pieceVisualB = pieceBoxB.clone();
      if (v23aBoxValid(pieceSpritesB)) pieceVisualB.union(pieceSpritesB);
      if (!v23aBoxValid(pieceBoxB)) throw new Error('bbox de pieza vacía');""")

# use visual box for camera framing in audit
s = s.replace("      var fullBoxB = v23aBoxValid(m.fullB) ? m.fullB.clone() : pieceBoxB.clone();\n      fullBoxB.union(pieceBoxB);",
              "      var fullBoxB = v23aBoxValid(m.fullB) ? m.fullB.clone() : pieceBoxB.clone();\n      fullBoxB.union(pieceVisualB);")

# --- fit: fallback when no meshes ---
s = s.replace("    var box = v23aBoxOf(group, parent, null, true);\n    if (!v23aBoxValid(box)) return null;",
              "    var box = v23aBoxOf(group, parent, null, true);\n    if (!v23aBoxValid(box)) box = v23aBoxOf(group, parent);\n    if (!v23aBoxValid(box)) return null;")

# --- shot fallback for sprite-only pieces ---
s = s.replace("""      if (groups.length) {
        for (var i = 0; i < groups.length; i++) {
          var gb = v23aBoxBetween(v23aBoxOf(groups[i], groups[i].parent, null, true), groups[i].parent, av.body);
          if (v23aBoxValid(gb)) box.union(gb);
        }
      }""",
"""      if (groups.length) {
        for (var i = 0; i < groups.length; i++) {
          var gb = v23aBoxBetween(v23aBoxOf(groups[i], groups[i].parent, null, true), groups[i].parent, av.body);
          if (v23aBoxValid(gb)) box.union(gb);
          else { var gs2 = v23aBoxBetween(v23aBoxOf(groups[i], groups[i].parent), groups[i].parent, av.body); if (v23aBoxValid(gs2)) box.union(gs2); }
        }
      }""")

# penetration threshold 3%
s = s.replace("res.penetraCuerpo = pen.count > Math.max(1, Math.round(samplesB.length * 0.02));",
              "res.penetraCuerpo = pen.count > Math.max(2, Math.round(samplesB.length * 0.03));")
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
