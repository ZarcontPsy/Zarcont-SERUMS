# © 2026 ZARCONT — Todos los derechos reservados · Licencia: LICENSE (raíz del repositorio)
# Añade a datos_plazas.js los puntos de geolocalización aportados/verificados manualmente.
# Formato: window.SERUMS_GEO_PUNTOS = { "<codigo RENIPRESS>": { lat, lon, metodo, precision, fuente, fecha } }
# Uso: python tests/apply_geo_puntos.py
import json
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "datos" / "datos_plazas.js"

GEO_PUNTOS = {
    # CENTRO MEDICO LIRCAY — Av. Ricardo Fernández N° S/N, Mz. F Lote 1, Lircay, Angaraes, Huancavelica.
    # Coordenada aportada y verificada por la usuaria; RENIPRESS no registra coordenadas para este código.
    "00034999": {
        "lat": -12.988503667936614,
        "lon": -74.72037679188186,
        "metodo": "Coordenada aportada por el usuario (dirección verificada)",
        "precision": "Geolocalización de establecimiento",
        "fuente": "Av. Ricardo Fernández N° S/N, Mz. F Lote 1, Lircay, Angaraes, Huancavelica",
        "fecha": "2026-10-16",
    },
}

raw = DATA.read_text(encoding="utf-8")
marker = "window.SERUMS_GEO_PUNTOS = "
if marker in raw:
    raw = raw[: raw.index("\n/* Puntos de geolocalización")] if "\n/* Puntos de geolocalización" in raw else raw
    raw = raw.split(marker)[0].rstrip() + "\n"

block = ("\n/* Puntos de geolocalización verificados/aportados fuera del cruce RENIPRESS.\n"
         "   Se aplican por código de establecimiento. No sustituyen al cruce: lo complementan\n"
         "   y quedan identificados con su método y fuente. */\n"
         + marker + json.dumps(GEO_PUNTOS, ensure_ascii=False, indent=1) + ";\n")

DATA.write_text(raw.rstrip() + "\n" + block, encoding="utf-8")

# Verificación
raw = DATA.read_text(encoding="utf-8")
dec = json.JSONDecoder()
data, _ = dec.raw_decode(raw[raw.index("window.SERUMS_DATA = ") + len("window.SERUMS_DATA = "):])
pts, _ = dec.raw_decode(raw[raw.index(marker) + len(marker):])
COLS = ["oferente", "profesion", "sede", "n_plazas", "diresa", "institucion", "departamento",
        "provincia", "distrito", "dificultad", "codigo", "establecimiento", "categoria",
        "presupuesto", "zaf", "ze", "lat", "lon", "direccion", "ubigeo"]
P = [dict(zip(COLS, r)) for r in data]
aplicables = [p for p in P if p["lat"] is None and p["codigo"] in pts]
ubic_antes = sum(1 for p in P if p["lat"] is not None)
print("Puntos definidos:", list(pts.keys()))
print("Plazas que se geolocalizarán:", len(aplicables))
for p in aplicables:
    print("   -", p["codigo"], (p["establecimiento"] or "")[:45], "|", p["distrito"], p["provincia"], "|", p["profesion"])
print("Ubicadas antes: %d  ->  después: %d (de %d)" % (ubic_antes, ubic_antes + len(aplicables), len(P)))
print("Pendientes: %d -> %d" % (len(P) - ubic_antes, len(P) - ubic_antes - len(aplicables)))
