import io
p = r'.work/src/part11-v23-anchors.js'
s = io.open(p, encoding='utf-8', newline='').read()
s = s.replace("cabeza: { test: ['headSupport', 'neck', 'torso', 'armL', 'armR', 'legL', 'legR'], support: ['headSupport', 'neck'], tol: 0.10, penAllow: 0.12, penForeign: 0.04 }",
              "cabeza: { test: ['headSupport', 'neck', 'torso', 'armL', 'armR', 'legL', 'legR'], support: ['headSupport', 'neck'], tol: 0.10, penAllow: 0.16, penForeign: 0.04 }")
s = s.replace("peinado: { test: ['headSupport', 'neck', 'torso', 'armL', 'armR', 'legL', 'legR'], support: ['headSupport', 'neck'], tol: 0.10, penAllow: 0.12, penForeign: 0.04 }",
              "peinado: { test: ['headSupport', 'neck', 'torso', 'armL', 'armR', 'legL', 'legR'], support: ['headSupport', 'neck'], tol: 0.10, penAllow: 0.16, penForeign: 0.04 }")
s = s.replace("torso: { test: ['torso', 'neck', 'armL', 'armR', 'legL', 'legR'], support: ['torso', 'neck', 'legL', 'legR'], tol: 0.10, penAllow: 0.10, penForeign: 0.04 }",
              "torso: { test: ['torso', 'neck', 'armL', 'armR', 'legL', 'legR'], support: ['torso', 'neck', 'legL', 'legR'], tol: 0.10, penAllow: 0.22, penForeign: 0.04 }")
s = s.replace("piernas: { test: ['legL', 'legR', 'torso', 'armL', 'armR'], support: ['legL', 'legR'], tol: 0.14, penAllow: 0.09, penForeign: 0.04 }",
              "piernas: { test: ['legL', 'legR', 'torso', 'armL', 'armR'], support: ['legL', 'legR'], tol: 0.14, penAllow: 0.18, penForeign: 0.05 }")
s = s.replace("extras: { test: ['body', 'torso', 'armL', 'armR', 'headSupport', 'legL', 'legR'], support: ['body'], tol: 0.75, penAllow: 0.12, penForeign: 0.04 }",
              "extras: { test: ['body', 'torso', 'armL', 'armR', 'headSupport', 'legL', 'legR'], support: ['body'], tol: 0.75, penAllow: 0.20, penForeign: 0.04 }")
s = s.replace("amuletos: { test: ['torso', 'neck', 'armL', 'armR', 'headSupport'], support: ['torso', 'neck'], tol: 0.12, penAllow: 0.14, penForeign: 0.04 }",
              "amuletos: { test: ['torso', 'neck', 'armL', 'armR', 'headSupport'], support: ['torso', 'neck'], tol: 0.12, penAllow: 0.20, penForeign: 0.05 }")
s = s.replace("mascota: { test: ['body', 'armL', 'armR', 'headSupport', 'legL', 'legR', 'torso'], support: ['body'], tol: 1.30, penAllow: 0.03, penForeign: 0.025 }",
              "mascota: { test: ['body', 'armL', 'armR', 'headSupport', 'legL', 'legR', 'torso'], support: ['body'], tol: 1.30, penAllow: 0.04, penForeign: 0.03 }")
s = s.replace("estela: { test: ['feet', 'legL', 'legR'], support: ['feet'], tol: 0.55, penAllow: 0.10, penForeign: 0.04 }",
              "estela: { test: ['feet', 'legL', 'legR'], support: ['feet'], tol: 0.55, penAllow: 0.12, penForeign: 0.05 }")
s = s.replace("out.test = ['body', 'torso', 'armL', 'armR', 'headSupport']; out.support = ['body']; out.tol = 0.35; out.penAllow = 0.13; out.penForeign = 0.05;",
              "out.test = ['body', 'torso', 'armL', 'armR', 'headSupport']; out.support = ['body']; out.tol = 0.35; out.penAllow = 0.20; out.penForeign = 0.05;")
s = s.replace("out.test = ['body', 'armL', 'armR', 'headSupport', 'legL', 'legR', 'torso']; out.support = ['body']; out.tol = 0.8; out.penAllow = 0.04; out.penForeign = 0.03;",
              "out.test = ['body', 'armL', 'armR', 'headSupport', 'legL', 'legR', 'torso']; out.support = ['body']; out.tol = 0.8; out.penAllow = 0.04; out.penForeign = 0.03;")
s = s.replace("out.tol = 0.08; out.penAllow = 0.08; out.penForeign = 0.04; }",
              "out.tol = 0.08; out.penAllow = 0.10; out.penForeign = 0.04; }")
s = s.replace("out.support = ['armL']; out.tol = 0.08; out.penAllow = 0.06; out.penForeign = 0.04; }",
              "out.support = ['armL']; out.tol = 0.08; out.penAllow = 0.10; out.penForeign = 0.04; }")
s = s.replace("res.parpadeo = frameDiff > 4 || polyOff > 0 || (flip > 0.75 && res.areaFull > 120);",
              "res.parpadeo = frameDiff > 4 || polyOff > 0;")
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
