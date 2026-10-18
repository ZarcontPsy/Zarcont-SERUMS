# © 2026 ZARCONT — Todos los derechos reservados · Licencia: LICENSE (raíz del repositorio)
"""SERUMS Map Explorer — verificación del cruce de adjudicación oficial.
Ejecutar:  python tests/check_adjudicados.py   (desde serums-map-explorer/)
Comprueba datos/datos_adjudicados.js (listado de adjudicados XLSX × notas PDF)
contra el dataset de plazas, con la MISMA normalización de clave que usa la app:
    clave = "<codigo RENIPRESS>|<PROFESION>"  (sin tildes, guiones/bajos -> espacio,
            mayúsculas, espacios colapsados)
Regenerar el cruce: python tests/build_adjudicados.py
"""
import json, re, sys, unicodedata
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
fails = []
def check(name, cond, extra=""):
    print(("PASS " if cond else "FAIL ") + name + ((" — " + str(extra)) if extra and not cond else ""))
    if not cond:
        fails.append(name)

def norm_prof(s):
    """Réplica de adjKeyOf() de js/app.js (y de norm_prof() del generador)."""
    s = str(s or "")
    s = "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", re.sub(r"[_\-]+", " ", s.upper())).strip()

dec = json.JSONDecoder()

# ---------- 1. archivos ----------
adj_path = ROOT / "datos" / "datos_adjudicados.js"
plazas_path = ROOT / "datos" / "datos_plazas.js"
check("existe datos_adjudicados.js", adj_path.exists())
raw_adj = adj_path.read_text(encoding="utf-8")
raw = plazas_path.read_text(encoding="utf-8")

m_meta = "window.SERUMS_ADJUDICADOS_META = "
m_data = "window.SERUMS_ADJUDICADOS = "
check("declara META y datos", m_meta in raw_adj and m_data in raw_adj)
META = dec.raw_decode(raw_adj[raw_adj.index(m_meta) + len(m_meta):])[0]
ADJ = dec.raw_decode(raw_adj[raw_adj.index(m_data) + len(m_data):])[0]

# ---------- 2. dataset de plazas ----------
COLS = ["oferente", "profesion", "sede", "n_plazas", "diresa", "institucion", "departamento",
        "provincia", "distrito", "dificultad", "codigo", "establecimiento", "categoria",
        "presupuesto", "zaf", "ze", "lat", "lon", "direccion", "ubigeo"]
rows = dec.raw_decode(raw[raw.index("window.SERUMS_DATA = ") + len("window.SERUMS_DATA = "):])[0]
P = [dict(zip(COLS, r)) for r in rows]
vacantes = defaultdict(int)
for p in P:
    vacantes[f"{str(p['codigo']).zfill(8)}|{norm_prof(p['profesion'])}"] += int(p["n_plazas"] or 1)

# ---------- 3. conteos de cabecera ----------
entradas = [e for arr in ADJ.values() for e in arr]
estados = Counter(e[3] for e in entradas)
con_nota = sum(1 for e in entradas if e[1] is not None)
check("META.total_adjudicados = 7489 y coincide con los datos",
      META.get("total_adjudicados") == 7489 == len(entradas), (META.get("total_adjudicados"), len(entradas)))
check("META.plazas_con_adjudicatario = 7297 y coincide con las claves",
      META.get("plazas_con_adjudicatario") == 7297 == len(ADJ), (META.get("plazas_con_adjudicatario"), len(ADJ)))
check("con nota = 7301", META.get("con_nota") == 7301 == con_nota, (META.get("con_nota"), con_nota))
check("sin registro en el PDF = 183", META.get("sin_registro") == 183 == estados["sin_registro"], estados["sin_registro"])
check("no se presentó = 5", META.get("no_se_presento") == 5 == estados["no_se_presento"], estados["no_se_presento"])
check("sin ficha óptica inválida ni ambiguos",
      META.get("ficha_invalida") == 0 and META.get("ambigua") == 0 and not estados["ficha_invalida"] and not estados["ambigua"])
check("estados suman el total", sum(estados.values()) == len(entradas), dict(estados))
check("META declara fuentes XLSX y PDF", "xlsx" in META.get("fuente_adjudicados", "") and "pdf" in META.get("fuente_notas", ""))

# ---------- 4. integridad del cruce con el dataset ----------
faltan = [k for k in vacantes if k not in ADJ]
sobran = [k for k in ADJ if k not in vacantes]
check("toda plaza del dataset tiene adjudicatario", not faltan, f"{len(faltan)} p.ej. {faltan[:3]}")
check("todo adjudicado corresponde a una plaza del dataset", not sobran, f"{len(sobran)} p.ej. {sobran[:3]}")
descuadres = [(k, vacantes[k], len(ADJ[k])) for k in vacantes if k in ADJ and vacantes[k] != len(ADJ[k])]
check("adjudicados por clave = vacantes declaradas (0 descuadres)", not descuadres,
      f"{len(descuadres)} p.ej. {descuadres[:3]}")
check("suma de vacantes declaradas = 7489 = adjudicados", sum(vacantes.values()) == 7489 == len(entradas),
      (sum(vacantes.values()), len(entradas)))

# ---------- 5. calidad de los registros ----------
check("ninguna nota fuera de 0-20",
      all(e[1] is None or 0 <= e[1] <= 20 for e in entradas))
check("todo estado es conocido", set(estados) <= {"ok", "no_se_presento", "ficha_invalida", "sin_nota", "ambigua", "sin_registro"}, set(estados))
check("estado 'ok' <=> hay nota", all((e[3] == "ok") == (e[1] is not None) for e in entradas))
check("los 5 sin nota declaran su estado del PDF",
      all(e[3] in ("no_se_presento", "ficha_invalida", "sin_nota") for e in entradas if e[1] is None and e[3] != "sin_registro"))
check("cada clave trae adjudicados con nombre",
      all(arr and all(str(e[0]).strip() for e in arr) for arr in ADJ.values()))
check("sin duplicados de persona dentro de una clave",
      all(len({e[0] for e in arr}) == len(arr) for arr in ADJ.values()))
check("regiones de evaluación razonables", 25 <= len({e[2] for e in entradas if e[2]}) <= 35,
      len({e[2] for e in entradas if e[2]}))

# ---------- 6. casos concretos ----------
ej = ADJ.get("00005055|ENFERMERIA", [])
check("00005055|ENFERMERIA = ALTAMIRANO CARBAJAL MERY JOANA, 13.6, LAMBAYEQUE",
      len(ej) == 1 and ej[0][0] == "ALTAMIRANO CARBAJAL MERY JOANA" and abs(ej[0][1] - 13.6) < 1e-9
      and ej[0][2] == "LAMBAYEQUE" and ej[0][3] == "ok", ej)
sin_reg = [(k, e[0]) for k, arr in ADJ.items() for e in arr if e[3] == "sin_registro"]
check("el ejemplo CUBAS CORONEL RUSBI LISET figura como sin_registro",
      any("CUBAS CORONEL RUSBI LISET" in n for _, n in sin_reg), sin_reg[:2])
multi = [(k, v) for k, v in ADJ.items() if len(v) > 1]
check("hay claves con más de un adjudicado (varias vacantes)", len(multi) >= 150, len(multi))
check("las claves con varios adjudicados no repiten nombre",
      all(len({e[0] for e in v}) == len(v) for _, v in multi))

print()
if fails:
    print(f"{len(fails)} FALLOS: {fails}")
    sys.exit(1)
print("Todas las comprobaciones del cruce de adjudicación pasaron.")
