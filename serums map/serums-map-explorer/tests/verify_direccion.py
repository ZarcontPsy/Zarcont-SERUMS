# © 2026 ZARCONT — Todos los derechos reservados · Licencia: LICENSE (raíz del repositorio)
# Verificación de una dirección/coordenada aportada por el usuario y del estado del dataset.
# Uso: python tests/verify_direccion.py
import json
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
ROOT = pathlib.Path(__file__).resolve().parent.parent
COLS = ["oferente", "profesion", "sede", "n_plazas", "diresa", "institucion", "departamento",
        "provincia", "distrito", "dificultad", "codigo", "establecimiento", "categoria",
        "presupuesto", "zaf", "ze", "lat", "lon", "direccion", "ubigeo"]

raw = (ROOT / "datos" / "datos_plazas.js").read_text(encoding="utf-8")
marker = "window.SERUMS_DATA = "
dec = json.JSONDecoder()
data, _ = dec.raw_decode(raw[raw.index(marker) + len(marker):])
P = [dict(zip(COLS, r)) for r in data]

OBJ_LAT, OBJ_LON = -12.988503667936614, -74.72037679188186
print("Dataset:", len(P), "plazas")
print("Coordenada aportada:", OBJ_LAT, OBJ_LON)
ok_range = -20 <= OBJ_LAT <= 2 and -85 <= OBJ_LON <= -60
print("  rango Perú:", "OK" if ok_range else "FUERA DE RANGO")

# 1) ¿Existe ya esa coordenada exacta en el dataset?
same = [p for p in P if p["lat"] is not None and abs(p["lat"] - OBJ_LAT) < 1e-9 and abs(p["lon"] - OBJ_LON) < 1e-9]
print("\n1) Plazas con esa coordenada exacta:", len(same))
for p in same[:8]:
    print("   -", p["codigo"], p["establecimiento"], "|", p["distrito"], p["provincia"], "|", p["profesion"])

# 2) Plazas cercanas (<=1.5 km) para ver qué establecimiento corresponde
import math
def dist_km(la, lo):
    R = 6371.0
    dlat = math.radians(la - OBJ_LAT); dlon = math.radians(lo - OBJ_LON)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(OBJ_LAT)) * math.cos(math.radians(la)) * math.sin(dlon / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))
near = sorted([(dist_km(p["lat"], p["lon"]), i, p) for i, p in enumerate(P) if p["lat"] is not None], key=lambda t: t[0])[:8]
print("\n2) Establecimientos más cercanos con coordenadas:")
for d, _i, p in near:
    print("   %.2f km · %s %s | %s %s" % (d, p["codigo"], (p["establecimiento"] or "")[:42], p["distrito"], p["provincia"]))

# 2b) ¿A qué distancia de LIRCAY (capital de Angaraes)?
lir_ubic = [p for p in P if (p["distrito"] or "").upper() == "LIRCAY" and p["lat"] is not None]
print("\n2b) Plazas ubicadas en el distrito de LIRCAY:", len(lir_ubic))
for p in lir_ubic[:8]:
    print("   %.2f km · %s %s (%.5f, %.5f)" % (dist_km(p["lat"], p["lon"]), p["codigo"], (p["establecimiento"] or "")[:40], p["lat"], p["lon"]))

# 3) LIRCAY / ANGARAES: cuántas plazas hay y cuántas pendientes
lir = [p for p in P if (p["distrito"] or "").upper() == "LIRCAY" or (p["provincia"] or "").upper() == "ANGARAES"]
pend = [p for p in lir if p["lat"] is None]
print("\n3) LIRCAY/ANGARAES: %d plazas, %d pendientes" % (len(lir), len(pend)))
for p in sorted(pend, key=lambda x: (x["establecimiento"] or "")):
    print("   PEND", p["codigo"], (p["establecimiento"] or "")[:60], "|", p["distrito"], p["provincia"],
          "| prof:", p["profesion"], "| dir:", (p["direccion"] or "")[:70])

# 4) ¿Algún pendiente menciona la Av. Ricardo Fernández?
hits = [p for p in P if "RICARDO" in (p["direccion"] or "").upper()]
print("\n4) Coincidencias 'RICARDO' en direcciones:", len(hits))
for p in hits[:10]:
    print("   -", p["codigo"], (p["establecimiento"] or "")[:50], "|", p["distrito"], p["provincia"],
          "| lat", p["lat"], "|", (p["direccion"] or "")[:70])

# 5) Conteo global de pendientes por departamento (top)
from collections import Counter
c = Counter(p["departamento"] for p in P if p["lat"] is None)
print("\n5) Pendientes por departamento (top 8):", c.most_common(8))
