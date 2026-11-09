import io
p = r'.work/src/part11-v23-anchors.js'
s = io.open(p, encoding='utf-8', newline='').read()

# 1. WalkBox: skip sprites when requested
s = s.replace("""  function v23aWalkBox(node, out, spaceInv, skip) {
    if (!node) return;
    if (skip && skip(node)) return;""",
"""  function v23aWalkBox(node, out, spaceInv, skip, noSprites) {
    if (!node) return;
    if (skip && skip(node)) return;""")
s = s.replace("""    if (node.isSprite) {
      var p = new THREE.Vector3().setFromMatrixPosition(node.matrixWorld).applyMatrix4(spaceInv);
      out.expandByPoint(p);
      var half = 0.5 * (Math.abs(node.scale.x) + Math.abs(node.scale.y)) * 0.5;
      out.expandByPoint(p.clone().addScalar(half));
      out.expandByPoint(p.clone().addScalar(-half));
      return;
    }""",
"""    if (node.isSprite) {
      if (noSprites) return;
      var p = new THREE.Vector3().setFromMatrixPosition(node.matrixWorld).applyMatrix4(spaceInv);
      out.expandByPoint(p);
      var half = 0.5 * (Math.abs(node.scale.x) + Math.abs(node.scale.y)) * 0.5;
      out.expandByPoint(p.clone().addScalar(half));
      out.expandByPoint(p.clone().addScalar(-half));
      return;
    }""")
s = s.replace("""    var kids = node.children || [];
    for (var i = 0; i < kids.length; i++) v23aWalkBox(kids[i], out, spaceInv, skip);
  }

  function v23aBoxOf(node, space, skip) {
    var box = v23aBoxEmpty();
    if (!node || !space || !space.matrixWorld) return box;
    node.updateWorldMatrix(true, true);
    var inv = new THREE.Matrix4().copy(space.matrixWorld).invert();
    v23aWalkBox(node, box, inv, skip || null);
    return box;
  }""",
"""    var kids = node.children || [];
    for (var i = 0; i < kids.length; i++) v23aWalkBox(kids[i], out, spaceInv, skip, noSprites);
  }

  function v23aBoxOf(node, space, skip, noSprites) {
    var box = v23aBoxEmpty();
    if (!node || !space || !space.matrixWorld) return box;
    node.updateWorldMatrix(true, true);
    var inv = new THREE.Matrix4().copy(space.matrixWorld).invert();
    v23aWalkBox(node, box, inv, skip || null, !!noSprites);
    return box;
  }""")

# 2. samples: skip sprites
s = s.replace("""      if (n.isSprite) {
        pts.push(new THREE.Vector3().setFromMatrixPosition(n.matrixWorld).applyMatrix4(inv));
        return;
      }""",
"""      if (n.isSprite) {
        return;
      }""")

# 3. fit box mesh-only
s = s.replace("    var box = v23aBoxOf(group, parent);\n    if (!v23aBoxValid(box)) return null;",
              "    var box = v23aBoxOf(group, parent, null, true);\n    if (!v23aBoxValid(box)) return null;")
s = s.replace("      group.updateMatrixWorld(true);\n      box = v23aBoxOf(group, parent);\n    }",
              "      group.updateMatrixWorld(true);\n      box = v23aBoxOf(group, parent, null, true);\n    }")
s = s.replace("      group.updateMatrixWorld(true);\n      box = v23aBoxOf(group, parent);\n    }\n\n    try {",
              "      group.updateMatrixWorld(true);\n      box = v23aBoxOf(group, parent, null, true);\n    }\n\n    try {")

# 4. audit piece box mesh-only
s = s.replace("        var gb = v23aBoxBetween(v23aBoxOf(groups[i], groups[i].parent), groups[i].parent, av.body);",
              "        var gb = v23aBoxBetween(v23aBoxOf(groups[i], groups[i].parent, null, true), groups[i].parent, av.body);")

# 5. material audit + parpadeo rule
s = s.replace("""      var flip = res.areaFull > 30 ? v23aFlipRatio(fullWith, jitter, mask) : 0;
      res.parpadeo = frameDiff > 4 || (flip > 0.45 && res.areaFull > 60);
      res.jitter = v23aPad(flip);
      res.framesDiffer = frameDiff;""",
"""      var flip = res.areaFull > 30 ? v23aFlipRatio(fullWith, jitter, mask) : 0;
      var polyOff = 0, mats = 0;
      for (var gi2 = 0; gi2 < groups.length; gi2++) {
        groups[gi2].traverse(function (n2) {
          if (!n2.isMesh || !n2.material) return;
          mats++;
          var list2 = Array.isArray(n2.material) ? n2.material : [n2.material];
          for (var mi = 0; mi < list2.length; mi++) {
            var mm = list2[mi];
            if (!mm || mm.isSpriteMaterial) continue;
            if (!mm.polygonOffset || !(Number(mm.polygonOffsetUnits) < 0)) polyOff++;
          }
        });
      }
      res.materials = mats;
      res.depthLayerMissing = polyOff;
      res.parpadeo = frameDiff > 4 || polyOff > 0 || (flip > 0.75 && res.areaFull > 120);
      res.jitter = v23aPad(flip);
      res.framesDiffer = frameDiff;""")

# 6. shot: use mesh-only box in the framing loop
s = s.replace("          var gb = v23aBoxBetween(v23aBoxOf(groups[i], groups[i].parent), groups[i].parent, av.body);",
              "          var gb = v23aBoxBetween(v23aBoxOf(groups[i], groups[i].parent, null, true), groups[i].parent, av.body);")
# 7. shot pad for glows
s = s.replace("      v23aFrameCamera(qa.camera, world, opts.pad || 1.2);", "      v23aFrameCamera(qa.camera, world, opts.pad || 1.32);")
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
