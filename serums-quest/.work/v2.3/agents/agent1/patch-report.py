import io
p = r'.work/v2.3/agents/agent1/REPORTE.md'
s = io.open(p, encoding='utf-8', newline='').read()
old = """- La muestra antes/después (42 casos, 14 piezas × 3 héroes) pasa de 34/42 a
  42/42; las capturas muestran las correcciones reales (diadema, perneras,
  efectos de arma, cuaderno, marco de platino, trofeo, bolso, bata)."""
new = """- La muestra antes/después (42 casos, 14 piezas × 3 héroes) pasa de 34/42 a
  42/42; las capturas muestran las correcciones reales (diadema, perneras,
  efectos de arma, cuaderno, marco de platino, trofeo, bolso, bata).
- Línea base sin encaje (`matrix-before-slice.json`, Ilan+Noa, 138 casos):
  127/138 PASS con este criterio (11 fallos: mascota 6, marcos 2, extras 3).
  El número no refleja todos los defectos porque la pieza enterrada o mal
  anclada sigue siendo visible y el solape con su propio soporte está permitido;
  los defectos de aspecto se documentan con las capturas antes/después y con la
  inspección de encaje (perneras sobre el pecho, diadema enterrada, efectos de
  arma flotando, patas de gafas, etc.)."""
assert old in s
s = s.replace(old, new)
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
