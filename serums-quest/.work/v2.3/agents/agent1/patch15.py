import io
p = r'.work/src/part11-v23-anchors.js'
s = io.open(p, encoding='utf-8', newline='').read()
old = """  function v23aPrepAvatar(heroId, outfit) {
    var qa = v23aQA();
    var av = Q.avatars[heroId];
    if (!av) {
      av = buildHeroAvatar(heroId);
      Q.avatars[heroId] = av;
      qa.scene.add(av.root);
    }"""
new = """  function v23aPrepAvatar(heroId, outfit) {
    var qa = v23aQA();
    var av = Q.avatars[heroId];
    if (!av) {
      av = buildHeroAvatar(heroId);
      Q.avatars[heroId] = av;
      qa.scene.add(av.root);
    }
    /* Sólo el avatar en uso está visible: los demás quedan en la escena para
       reutilizar geometría, pero no deben ocultar la pieza que se mide. */
    Object.keys(Q.avatars).forEach(function (otherId) {
      var other = Q.avatars[otherId];
      if (other && other.root) other.root.visible = (otherId === heroId);
    });"""
assert old in s
s = s.replace(old, new)
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
