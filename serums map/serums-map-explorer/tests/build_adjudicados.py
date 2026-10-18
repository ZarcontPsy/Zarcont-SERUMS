# © 2026 ZARCONT — Todos los derechos reservados · Licencia: LICENSE (raíz del repositorio)
# Cruza el listado de adjudicados (XLSX) con los resultados finales (PDF) y con el dataset de
# plazas, y genera  datos/datos_adjudicados.js  ->  window.SERUMS_ADJUDICADOS
#
# Uso: python tests/build_adjudicados.py
#
# Clave: "<codigo RENIPRESS>|<PROFESION NORMALIZADA>"  (igual que la que calcula la app)
# Valor: lista de adjudicados  [apellidos y nombres, nota|null, region de evaluacion, estado]
#   estado: "ok"             -> nota tomada del PDF de resultados finales
#           "no_se_presento" -> el PDF registra que no rindió evaluación
#           "ficha_invalida" -> el PDF marca ficha óptica inválida
#           "sin_nota"       -> el PDF trae otro texto sin calificación
#           "ambigua"        -> misma persona con notas distintas en el PDF
#           "sin_registro"   -> la persona no figura en el PDF de resultados finales
import json
import pathlib
import re
import sys
from collections import Counter, defaultdict

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from pdf_notas import parse_pdf, norm, norm_prof

ROOT = pathlib.Path(__file__).resolve().parent.parent
XLSX = pathlib.Path(r"C:\Users\USARIO\Downloads\8089875-listado-de-adjudicados-de-la-modalidad-remunerada-serums-2026-i.xlsx")
PDF = pathlib.Path(r"C:\Users\USARIO\Downloads\8066389-resultados-finales-de-la-evaluacia-n-para-el-serums-2026-i.pdf")
OUT = ROOT / "datos" / "datos_adjudicados.js"

# ---------- 1. Notas del PDF: (nombre, profesión) -> [(región, nota, estado)] ----------
regs, leidas = parse_pdf(PDF)
print(f"PDF: filas reconocidas={leidas} | personas únicas={len(regs)}")

# ---------- 2. Listado de adjudicados (XLSX) ----------
import openpyxl

wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
filas = [r for r in wb["LISTADO DE ADJUDICADOS"].iter_rows(min_row=3, values_only=True)
         if any(c not in (None, "") for c in r)]
wb.close()

# Claves sin tildes porque se comparan con norm() del PDF.
ESTADO_TXT = {"no se presento y/o no rindio evaluacion": "no_se_presento", "ficha optica invalida": "ficha_invalida"}

plazas = defaultdict(list)
diag = Counter()
sin_registro = []
for r in filas:
    nombre = re.sub(r"\s+", " ", str(r[15] or "")).strip()
    if not nombre:
        diag["sin_nombre"] += 1
        continue
    codigo = str(r[9] or "").strip().zfill(8)
    prof_pdf = norm_prof(r[1])
    depto = norm(r[5])
    v = regs.get((norm(nombre), norm(r[1])), [])
    nota = region = None
    estado = "sin_registro"
    if v:
        con_nota = [x for x in v if x[1] is not None]
        if con_nota:
            if len({x[1] for x in con_nota}) > 1:
                propias = [x for x in con_nota if norm(x[0]) == depto]
                elegido = propias[0] if len({x[1] for x in propias}) == 1 else None
            else:
                elegido = con_nota[0]
            if elegido:
                nota, region, estado = elegido[1], elegido[0], "ok"
            else:
                nota, region, estado = None, None, "ambigua"
        else:
            estado = ESTADO_TXT.get(norm(v[0][2]), "sin_nota")
            region = v[0][0]
        if estado != "ok" and estado != "ambigua":
            pass
    diag[estado] += 1
    if estado == "sin_registro":
        sin_registro.append((nombre, prof_pdf, depto, codigo))
    plazas[f"{codigo}|{prof_pdf}"].append([nombre, nota, region, estado])

plazas = {k: v for k, v in sorted(plazas.items())}
print("Cruce:", dict(diag), "| total adjudicados:", sum(len(v) for v in plazas.values()))
print("plazas con adjudicatario:", len(plazas))
print("sin registro en el PDF (muestra):", [x[0] for x in sin_registro[:6]])

# ---------- 3. Verificación contra el dataset de plazas ----------
raw = (ROOT / "datos" / "datos_plazas.js").read_text(encoding="utf-8")
data = json.JSONDecoder().raw_decode(raw[raw.index("window.SERUMS_DATA = ") + len("window.SERUMS_DATA = "):])[0]
COLS = ["oferente", "profesion", "sede", "n_plazas", "diresa", "institucion", "departamento", "provincia",
        "distrito", "dificultad", "codigo", "establecimiento", "categoria", "presupuesto", "zaf", "ze",
        "lat", "lon", "direccion", "ubigeo"]
P = [dict(zip(COLS, r)) for r in data]
vac = Counter()
for p in P:
    vac[f"{str(p['codigo']).zfill(8)}|{norm_prof(p['profesion'])}"] += int(p["n_plazas"] or 1)

solo_plaza = [k for k in vac if k not in plazas]
solo_adj = [k for k in plazas if k not in vac]
descuadre = [(k, vac[k], len(plazas[k])) for k in vac if k in plazas and vac[k] != len(plazas[k])]
print(f"\nClaves: dataset={len(vac)} adjudicados={len(plazas)}")
print(f"  plazas sin adjudicatario: {len(solo_plaza)} | adjudicados sin plaza en el dataset: {len(solo_adj)}")
print(f"  claves con número de adjudicados distinto a las vacantes declaradas: {len(descuadre)} ({descuadre[:4]})")
print(f"  suma de vacantes declaradas: {sum(vac.values())} | adjudicados: {sum(len(v) for v in plazas.values())}")

# ---------- 4. Escribir ----------
meta = {
    "fuente_adjudicados": "8089875-listado-de-adjudicados-de-la-modalidad-remunerada-serums-2026-i.xlsx",
    "fuente_notas": "8066389-resultados-finales-de-la-evaluacia-n-para-el-serums-2026-i.pdf",
    "descripcion": "Una fila por vacante adjudicada. La nota proviene del PDF de resultados finales; "
                   "el cruce es por apellidos y nombres + profesión (los nombres coinciden de forma única).",
    "total_adjudicados": sum(len(v) for v in plazas.values()),
    "con_nota": diag["ok"],
    "sin_registro": diag["sin_registro"],
    "no_se_presento": diag["no_se_presento"],
    "ficha_invalida": diag["ficha_invalida"],
    "sin_nota": diag["sin_nota"],
    "ambigua": diag["ambigua"],
    "plazas_con_adjudicatario": len(plazas),
    "filas_pdf": leidas,
    "generado": "2026-10-16",
}
js = ("/* Cruce del listado de adjudicados (XLSX) con los resultados finales (PDF).\n"
      "   Generado por tests/build_adjudicados.py — no editar a mano.\n"
      "   Clave: \"<codigo RENIPRESS>|<PROFESION>\"  ·  Valor: [nombres, nota, region de evaluacion, estado]\n"
      "   estado: ok | no_se_presento | ficha_invalida | sin_nota | sin_registro (no figura en el PDF) */\n"
      "window.SERUMS_ADJUDICADOS_META = " + json.dumps(meta, ensure_ascii=False, indent=1) + ";\n"
      "window.SERUMS_ADJUDICADOS = " + json.dumps(plazas, ensure_ascii=False, separators=(",", ":")) + ";\n")
OUT.write_text(js, encoding="utf-8")
print("\nEscrito:", OUT, f"({OUT.stat().st_size/1024:.0f} KB)")
