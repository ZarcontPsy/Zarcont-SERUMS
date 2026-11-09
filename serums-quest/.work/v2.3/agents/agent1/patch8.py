import io
p = r'.work/src/part11-v23-anchors.js'
s = io.open(p, encoding='utf-8', newline='').read()
# front camera helper
s = s.replace("""  function v23aRenderPixels() {""",
"""  function v23aFrameFront(cam, boxWorld, pad) {
    var c = v23aBoxCenter(boxWorld);
    var s = v23aBoxSize(boxWorld);
    var r = 0.5 * Math.max(s.x, s.y) * (pad || 1.16) + 0.04;
    var dist = r / Math.sin((cam.fov * Math.PI / 180) * 0.5);
    cam.position.set(c.x, c.y + s.y * 0.05, c.z + dist);
    cam.lookAt(c.x, c.y, c.z);
    cam.updateProjectionMatrix();
  }

  function v23aRenderPixels() {""")
# add areaFront after bust diff
s = s.replace("""      var diffBust = v23aPixelDiff(bustWith, bustWithout);
      res.areaBust = diffBust.count;""",
"""      var diffBust = v23aPixelDiff(bustWith, bustWithout);
      res.areaBust = diffBust.count;
      /* Vista frontal: las piezas laterales (muñeca izquierda, bolso) pueden
         quedar tapadas por el cuerpo en la vista de tres cuartos. */
      v23aFrameFront(qa.camera, fullWorld, 1.16);
      var frontWith = v23aRenderPixels();
      v23aSetVisible(groups, false);
      var frontWithout = v23aRenderPixels();
      v23aSetVisible(groups, true);
      var diffFront = v23aPixelDiff(frontWith, frontWithout);
      res.areaFront = diffFront.count;""")
s = s.replace("      res.visible = res.areaFull >= (opts.minArea || 14) || res.areaBust >= (opts.minArea || 14);",
              "      res.visible = res.areaFull >= (opts.minArea || 14) || res.areaBust >= (opts.minArea || 14) || res.areaFront >= (opts.minArea || 14);")
s = s.replace("      huecoFlotante: false, parpadeo: false, bbox: null, areaFull: 0, areaBust: 0,",
              "      huecoFlotante: false, parpadeo: false, bbox: null, areaFull: 0, areaBust: 0, areaFront: 0,")
# x-arma: head as support too
s = s.replace("out.test = ['weapon', 'armR', 'armL', 'torso', 'headSupport']; out.support = ['weapon', 'armR', 'torso']; out.tol = 0.45; out.penAllow = 0.30; out.penForeign = 0.05;",
              "out.test = ['weapon', 'armR', 'armL', 'torso', 'headSupport']; out.support = ['weapon', 'armR', 'torso', 'headSupport']; out.tol = 0.45; out.penAllow = 0.30; out.penForeign = 0.05;")
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
