# © 2026 ZARCONT — Todos los derechos reservados · Licencia: LICENSE (raíz del repositorio)
"""Serums Map Explorer — comprobación de referencias de id en el HTML.
Los elementos que la app crea dinámicamente (innerHTML) no están en index.html;
se recogen también del JS para no dar falsos positivos.
"""
import re, pathlib, sys

base = pathlib.Path(__file__).resolve().parent.parent
html = (base / "index.html").read_text(encoding="utf-8")
ids = set(re.findall(r'id="([^"]+)"', html))
js = "".join((base / f).read_text(encoding="utf-8")
             for f in ["js/utils.js", "js/services.js", "js/filters.js",
                       "js/mapview.js", "js/panels.js", "js/app.js"])
refs = set(re.findall(r"getElementById\('([^']+)'\)", js))
# ids creados por el propio JS con plantillas ("id=\"xxx\"" dentro de cadenas)
dinamicos = set(re.findall(r'id="([A-Za-z][\w-]*)"', js))
concat = set(re.findall(r"id='([A-Za-z][\w-]*)'", js))
asignados = set(re.findall(r"\.id\s*=\s*'([A-Za-z][\w-]*)'", js))
missing = sorted(r for r in refs if r not in ids and r not in dinamicos and r not in concat and r not in asignados)

print("IDs en HTML:", len(ids), "| referenciados:", len(refs), "| dinámicos:", len(dinamicos | concat | asignados))
print("FALTANTES:", missing if missing else "ninguno")
if missing:
    sys.exit(1)
print("OK: ninguna referencia rota.")
