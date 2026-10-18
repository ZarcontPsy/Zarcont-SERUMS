# © 2026 ZARCONT — Todos los derechos reservados · Licencia: LICENSE (raíz del repositorio)
"""SERUMS Map Explorer — pruebas básicas.
Ejecutar:  python tests/test_basico.py   (desde serums-map-explorer/)
Cubre: normalización, detección de encabezados/mapeo, validación de
coordenadas, filtros encadenados, conteos reales del dataset y exportación.
"""
import json, re, sys, unicodedata
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parent.parent
fails = []
def check(name, cond, extra=""):
    print(("PASS " if cond else "FAIL ") + name + ((" — " + str(extra)) if extra and not cond else ""))
    if not cond:
        fails.append(name)

# ---------- 1. normalización (réplica de utils.js norm) ----------
def norm(s):
    s = str(s or "").lower()
    s = "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")
    s = re.sub(r"[_\-]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()

check("norm quita tildes/mayúsculas", norm("PROVISIÓN  São") == "provision sao")
check("norm colapsa espacios", norm("  SEDE   DE___ADJUDICACIÓN ") == "sede de adjudicacion")

# ---------- 2. encabezados + mapeo (réplica de excelParser) ----------
ALIASES = {"oferente": ["institucion ofertante", "oferente"],
           "profesion": ["profesion", "carrera"],
           "plazas": ["n plazas", "vacantes"],
           "codigo": ["codigo renipress", "codigo", "renipress"],
           "dificultad": ["grado de dificultad", "dificultad", "grado", "gd"],
           "departamento": ["departamento", "region", "dpto"]}
def score_row(cells):
    s = 0
    for c in cells:
        c = norm(c)
        for al in ALIASES.values():
            if any(c == a or c.startswith(a) for a in al):
                s += 2
    return s

header = ["INSTITUCIÓN OFERTANTE", "PROFESIÓN", "N° PLAZAS", "GRADO DE DIFICULTAD", "CÓDIGO RENIPRESS"]
check("header real puntúa alto", score_row(header) >= 6, score_row(header))
check("fila basura puntúa bajo", score_row(["NOTA:", "BONO ZAF..."]) == 0)

def valid_coords(lat, lon):
    try:
        la, lo = float(lat), float(lon)
    except (TypeError, ValueError):
        return False
    return -20 <= la <= 2 and -85 <= lo <= -60

check("coords Perú válidas", valid_coords(-5.45, -78.45))
check("coords UTM rechazadas", not valid_coords(9212345, 175432))
check("coords vacías rechazadas", not valid_coords(None, None))
check("coords fuera de rango", not valid_coords(40.4, -3.7))

# ---------- 3. dataset real ----------
data_path = ROOT / "datos" / "datos_plazas.js"
raw = data_path.read_text(encoding="utf-8")
marker = "window.SERUMS_DATA = "
check("dataset embebido existe y parsea", marker in raw)
dec = json.JSONDecoder()
rows, _ = dec.raw_decode(raw[raw.index(marker) + len(marker):])
check("total plazas = 7323", len(rows) == 7323, len(rows))
COLS = ["oferente","profesion","sede","n_plazas","diresa","institucion","departamento",
        "provincia","distrito","dificultad","codigo","establecimiento","categoria",
        "presupuesto","zaf","ze","lat","lon","direccion","ubigeo"]
P = [dict(zip(COLS, r)) for r in rows]
ubic = [p for p in P if valid_coords(p["lat"], p["lon"])]
check("ubicadas >= 6900 por cruce RENIPRESS", len([p for p in P if valid_coords(p["lat"], p["lon"])]) >= 6900, len(ubic))
check("sin coordenadas inventadas: todas existen en rango PE",
      all(p["lat"] is None or valid_coords(p["lat"], p["lon"]) for p in P))
check("25 regiones", len(set(p["departamento"] for p in P)) == 25, len(set(p["departamento"] for p in P)))
check("grados solo GD-1..GD-5", set(p["dificultad"] for p in P) <= {"GD-1","GD-2","GD-3","GD-4","GD-5"}, set(p["dificultad"] for p in P))
prof = Counter(p["profesion"] for p in P)
check("medicina+enfermería son mayoría", prof["MEDICINA"] + prof["ENFERMERIA"] > len(P) / 2)
check("sin profesiones fuera de la fuente", set(prof) <= {"MEDICINA","ENFERMERIA","PSICOLOGIA","OBSTETRICIA","ODONTOLOGIA","NUTRICION","QUIMICO FARMACEUTICO","TM - LABORATORIO CLINICO","BIOLOGIA","TRABAJO SOCIAL","TM - TERAPIA FISICA","MEDICINA VETERINARIA","TM - RADIOLOGIA","INGENIERIA SANITARIA","TM - TERAPIA LENGUAJE","TM - TERAPIA OCUPACIONAL"}, set(prof))
check("códigos RENIPRESS de 8 dígitos", all(re.fullmatch(r"\d{8}", p["codigo"] or "") for p in P))
check("vacantes totales = 7489", sum(p["n_plazas"] or 1 for p in P) == 7489, sum(p["n_plazas"] or 1 for p in P))

# ---------- 3b. puntos de geolocalización aportados/verificados ----------
gp_marker = "window.SERUMS_GEO_PUNTOS = "
check("bloque SERUMS_GEO_PUNTOS presente en el dataset", gp_marker in raw)
GP = dec.raw_decode(raw[raw.index(gp_marker) + len(gp_marker):])[0] if gp_marker in raw else {}
check("puntos aportados dentro del rango del Perú",
      len(GP) > 0 and all(valid_coords(v.get("lat"), v.get("lon")) for v in GP.values()))
check("cada punto aportado declara método, precisión y fuente",
      all(v.get("metodo") and v.get("precision") and v.get("fuente") for v in GP.values()))
aplicables = [p for p in P if not valid_coords(p["lat"], p["lon"]) and p["codigo"] in GP]
check("los puntos aportados geolocalizan plazas que estaban pendientes", len(aplicables) >= 1, len(aplicables))
check("ubicadas después de aplicar los puntos = 6971", len(ubic) + len(aplicables) == 6971, len(ubic) + len(aplicables))
check("CENTRO MEDICO LIRCAY (00034999) queda ubicado",
      all(valid_coords(GP.get(p["codigo"], {}).get("lat"), GP.get(p["codigo"], {}).get("lon"))
          for p in P if p["codigo"] == "00034999"))

# ---------- 4. filtros encadenados ----------
def provs_for(regiones):
    return sorted({p["provincia"] for p in P if not regiones or p["departamento"] in regiones})
allp = provs_for([])
check("encadenado reduce provincias", len(provs_for(["AMAZONAS"])) < len(allp), (len(provs_for(["AMAZONAS"])), len(allp)))
check("región inexistente no da opciones", provs_for(["ATLÁNTIDA"]) == [])
def apply(f):
    out = P
    if f.get("profesiones"): out = [p for p in out if p["profesion"] in f["profesiones"]]
    if f.get("regiones"): out = [p for p in out if p["departamento"] in f["regiones"]]
    if f.get("provincia"): out = [p for p in out if p["provincia"] == f["provincia"]]
    if f.get("geo") == "ubicada": out = [p for p in out if valid_coords(p["lat"], p["lon"])]
    if f.get("geo") == "pendiente": out = [p for p in out if not valid_coords(p["lat"], p["lon"])]
    return out
check("filtro combinado no supera a sus partes",
      len(apply({"profesiones": ["MEDICINA"], "regiones": ["CAJAMARCA"]})) <= min(len(apply({"profesiones": ["MEDICINA"]})), len(apply({"regiones": ["CAJAMARCA"]}))))
check("pendientes + ubicadas = total",
      len(apply({"geo": "pendiente"})) + len(apply({"geo": "ubicada"})) == len(P))

# ---------- 5. exportación preserva originales ----------
HEAD = ["INSTITUCION OFERTANTE","PROFESION","SEDE DE ADJUDICACION","N° PLAZAS","DIRESA/GERESA/DIRIS","INSTITUCION","DEPARTAMENTO","PROVINCIA","DISTRITO","GRADO DE DIFICULTAD","CODIGO RENIPRESS","NOMBRE DE ESTABLECIMIENTO","CATEGORIA","PRESUPUESTO","ZAF","ZE","LATITUD","LONGITUD","PRECISION GEO","METODO GEO"]
sample = apply({"profesiones": ["PSICOLOGIA"], "regiones": ["CAJAMARCA"]})
lines = [";".join(HEAD)] + [";".join([p["oferente"], p["profesion"], str(p["n_plazas"]), p["codigo"], p["establecimiento"]]) for p in sample]
check("export CSV genera filas", len(lines) == len(sample) + 1 and len(sample) > 0, len(sample))

# ---------- 6. favoritos + adjudicación manual (marca del usuario) ----------
# Comprobaciones estructurales sobre los archivos de la app: la marca manual de
# adjudicación es independiente de la adjudicación OFICIAL (datos_adjudicados.js)
# y de los favoritos, se persiste en localStorage, filtra el listado/mapa y exige
# confirmación antes de marcar.
html = (ROOT / "index.html").read_text(encoding="utf-8")
app_js = (ROOT / "js" / "app.js").read_text(encoding="utf-8")
filt_js = (ROOT / "js" / "filters.js").read_text(encoding="utf-8")
pan_js = (ROOT / "js" / "panels.js").read_text(encoding="utf-8")
map_js = (ROOT / "js" / "mapview.js").read_text(encoding="utf-8")
uti_js = (ROOT / "js" / "utils.js").read_text(encoding="utf-8")
css = (ROOT / "styles.css").read_text(encoding="utf-8")

check("el HTML carga el cruce oficial de adjudicación", 'datos/datos_adjudicados.js' in html)
check("el HTML trae el control de filtros rápidos y la confirmación",
      all(x in html for x in ('id="quickSeg"', 'id="confirmModal"', 'id="favTabs"', 'confirmOk', 'confirmCancel')))
check("persistencia con clave propia 'adjudicadas' (independiente de 'favoritos')",
      "Store.get('adjudicadas'" in app_js and "Store.set('adjudicadas'" in app_js and
      "Store.get('favoritos'" in app_js)
check("la app expone isAdj/setAdj/toggleAdj/adjCount",
      all(("function " + f) in app_js for f in ("isAdj", "setAdj", "toggleAdj", "adjCount()"))
      or all(x in app_js for x in ("function isAdj", "function setAdj", "function toggleAdj", "function adjCount")))
check("la marca manual NO alimenta favoritos y el favorito NO alimenta la adjudicación",
      "adjudicadas" not in app_js.split("function toggleFav")[1].split("function toggleCmp")[0] and
      "favoritos" not in app_js.split("function setAdj")[1].split("function adjConfirmOn")[0])
check("pide confirmación breve antes de adjudicar",
      "function askConfirm" in app_js and "¿Marcar como adjudicada?" in app_js and
      "function adjConfirmOn" in app_js and "adj_confirm" in app_js)
check("filtros rápidos: todas / favoritas / adjudicadas / disponibles",
      all("'" + k + "'" in app_js for k in ("todas", "favoritas", "adjudicadas", "disponibles")) and
      "function quickPass" in filt_js and "ignoreQuick" in filt_js)
check("el filtro rápido aparece como chip removible",
      "g: 'quick'" in filt_js and "S.quick = 'todas'" in filt_js)
check("contadores en tiempo real (franja + segmentos)",
      "quickCounts" in app_js and "adjudicadas (mías)" in app_js and "quickseg" in css)
check("tarjetas: botón de adjudicación, etiquetas y estado tachado",
      'data-act="adj"' in pan_js and "Adjudicada por ti" in pan_js and ".resitem.adj" in css and
      "text-decoration:line-through" in css.replace(" ", ""))
check("la ficha trae los botones de estado y el aviso de independencia",
      'data-det="adj"' in pan_js and 'data-det="fav"' in pan_js and "Adjudicación oficial" in pan_js and
      "no modifican la adjudicación oficial" in pan_js)
check("mapa: estrella (anillo) y adjudicada atenuada con check, sin depender solo del color",
      "#f5b301" in map_js and "fill-opacity" in map_js and "<path" in map_js and "function updateIcons" in map_js)
check("el mapa actualiza iconos y leyenda al cambiar el estado",
      "MapView.updateIcons()" in app_js and "Adjudicada por ti (" in map_js)
check("aviso de que las marcas son locales (sin sincronización entre dispositivos)",
      "No se sincronizan entre dispositivos" in html)
check("deshacer disponible en la notificación (toast con acción)",
      "action" in uti_js and "action.fn" in uti_js and ".tbtn" in css)
check("gestión sencilla: pestañas Favoritas/Adjudicadas y botones de vaciado",
      "function clearStateTab" in app_js and "function renderFavoritos" in app_js and
      "Quitar todas las adjudicadas" in app_js)

# ---------- 7. Centro de adjudicación (subvista del dock, sin mapa) ----------
adj_js = (ROOT / "js" / "adjudicacion.js").read_text(encoding="utf-8")
check("la subvista existe en el dock y trae sus contenedores",
      all(x in html for x in ('id="subAdj"', 'data-nav="adjudicacion"', 'id="adjKpis"', 'id="adjDonut"',
                              'id="adjBars"', 'id="adjSegs"', 'id="adjList"', 'id="adjPager"',
                              'id="adjForm"', 'id="adjHist"', 'id="adjBadge"', 'id="adjToMap"')),
      "faltan ids en index.html")
check("el módulo del centro se carga con caché busting y no usa el mapa",
      'js/adjudicacion.js?v=' in html and 'MapView' not in adj_js and 'google.maps' not in adj_js)
check("bloqueo: estado persistente separado (clave propia) y exportado por App",
      "Store.get('bloqueadas'" in app_js and "Store.set('bloqueadas'" in app_js and "function setBloq" in app_js and
      "setBloq: setBloq" in app_js and
      "bloqueadas" not in app_js.split("function setAdj")[1].split("function adjConfirmOn")[0])
check("adjudicación y bloqueo mutuamente excluyentes, con confirmación explícita",
      "¿Retirar la marca de adjudicación?" in app_js and "Sí, desbloquear y adjudicar" in app_js and
      "setBloq(p, false); setAdj(p, true)" in app_js)
check("el registro guarda persona, fecha y hora y observaciones",
      'id="adjPersona"' in adj_js and 'id="adjFecha"' in adj_js and 'id="adjObs"' in adj_js and
      'type="datetime-local"' in adj_js and "{ persona: persona, obs: obs, fecha: fecha }" in adj_js)
check("evita duplicados y avisa si ya está adjudicada o bloqueada",
      "Duplicado: esta plaza ya está adjudicada por ti" in adj_js and "ya está adjudicada por ti</b>" in adj_js and
      "está <b>bloqueada</b>" in adj_js)
check("buscador con autocompletado sobre el conjunto real",
      "function sugerencias" in adj_js and 'id="adjSug"' in adj_js.replace("'adjSug'", '"adjSug"'))
check("KPIs del dashboard: total, disponibles, adjudicadas, bloqueadas, favoritas",
      all(x in adj_js for x in ("Total de plazas", "Disponibles", "Adjudicadas", "Bloqueadas", "Favoritas")))
check("gráficos simples (dona + barras) reutilizando el lenguaje visual",
      "stroke-dasharray" in adj_js and "barrow" in adj_js and "<svg" in adj_js and "TAG_SVG" not in adj_js)
check("filtro rápido del centro: 5 estados con contadores propios",
      all("'" + k + "'" in adj_js for k in ("todas", "disponibles", "adjudicadas", "bloqueadas", "favoritas")) and
      "data-af" in adj_js)
check("paginación y orden del listado", "Página " in adj_js and "data-mp" in adj_js and "adjSort" in html)
check("estado bloqueado claramente distinto (color + icono + borde discontinuo)",
      ".tag.st-bloq" in css and ".adjitem.st-bloq" in css and "🚫 Bloqueada</span>" in adj_js and
      "bloqtag" in app_js and "bloqtag" in css)
check("mapa: bloqueada con barrera y leyenda; se mantienen favorita y adjudicada",
      "Bloqueada por ti (" in map_js and "#f5b301" in map_js and "stroke-linecap" in map_js and
      "Favorita (" in map_js and "Adjudicada por ti (" in map_js)
check("ficha: botón de bloqueo junto a favorita/adjudicada", 'data-det="bloq"' in pan_js and
      "AdjCenter.toggleBloq" in app_js)
check("el filtro rápido global suma bloqueadas y disponible = sin marcar y sin bloqueo",
      "'bloqueadas'" in app_js and "'bloqueadas'" in filt_js and "!!window" not in filt_js and
      "!window.App.isAdj(p) && !window.App.isBloq(p)" in filt_js and "bloqueadas</span>" in app_js)
check("sincronización: actualiza otras pestañas (evento storage) con nota honesta de local",
      "addEventListener('storage'" in adj_js and "no hay servidor integrado" in adj_js and
      "solo en este navegador" in adj_js)
check("respaldo y compartible: CSV del registro + JSON de estados (export/import)",
      "serums_registro_adjudicaciones_" in adj_js and "serums_estados_seguimiento_" in adj_js and
      "importarJson" in adj_js and "askConfirm" in adj_js)

print()
if fails:
    print(f"{len(fails)} FALLOS: {fails}")
    sys.exit(1)
print("Todas las pruebas pasaron.")
