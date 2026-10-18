# © 2026 ZARCONT — Todos los derechos reservados · Licencia: LICENSE (raíz del repositorio)
"""Verifica que cada coordenada del dataset proceda de una fuente declarada:
   · cruce con RENIPRESS (idéntica al listado oficial), o
   · un punto de SERUMS_GEO_PUNTOS (aportado/verificado, con método y fuente).
Cualquier coordenada sin fuente declarada hace fallar la prueba: no se inventa nada."""
import json, unicodedata
from pathlib import Path
import xlrd

BASE = Path(__file__).resolve().parent.parent
raw = (BASE / "datos" / "datos_plazas.js").read_text(encoding="utf-8")
dec = json.JSONDecoder()
rows, _ = dec.raw_decode(raw[raw.index("window.SERUMS_DATA = ") + len("window.SERUMS_DATA = "):])
GP = dec.raw_decode(raw[raw.index("window.SERUMS_GEO_PUNTOS = ") + len("window.SERUMS_GEO_PUNTOS = "):])[0]

wb = xlrd.open_workbook(r"C:\Users\USARIO\Downloads\USLRC20261016180919_xp.xls", on_demand=True)
sh = wb.sheet_by_name("Listado de Establecimientos")
reni = {}
for r in range(1, sh.nrows):
    code = str(sh.cell_value(r, 1)).strip().zfill(8)
    try:
        la, lo = float(sh.cell_value(r, 26)), float(sh.cell_value(r, 27))
    except (TypeError, ValueError):
        continue
    reni.setdefault(code, set()).add((round(la, 6), round(lo, 6)))

ok, bad, pend, aport = 0, [], 0, 0
for row in rows:
    lat, lon, code = row[16], row[17], row[10]
    if lat is None:
        pend += 1
        continue
    if (round(lat, 6), round(lon, 6)) in reni.get(code, set()):
        ok += 1
    elif code in GP and abs(GP[code]["lat"] - lat) < 1e-9 and abs(GP[code]["lon"] - lon) < 1e-9:
        aport += 1
    else:
        bad.append((code, lat, lon))

aplican = [r for r in rows if r[16] is None and r[10] in GP]
print(f"plazas={len(rows)} verificadas_RENIPRESS={ok} aportadas={aport} pendientes_archivo={pend} NO_JUSTIFICADAS={len(bad)}")
print(f"puntos de SERUMS_GEO_PUNTOS que se aplican al cargar: {len(aplican)} (pendientes en la app: {pend - len(aplican)})")
print("malas (muestra):", bad[:5] if bad else "—")
assert not bad, "Hay coordenadas sin fuente declarada"
print("OK: cero coordenadas inventadas.")
