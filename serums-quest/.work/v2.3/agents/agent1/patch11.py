import io
p = r'.work/v2.3/agents/agent1/qa.js'
s = io.open(p, encoding='utf-8', newline='').read()
s = s.replace("pen: r.penCount, penDepth: r.penDepth, penZone: r.penZone,", "pen: r.penCount, penDepth: r.penDepth, penZone: r.penZone, penInterna: r.penetraInterna, penInternaDepth: r.penInternaDepth,")
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok2')
