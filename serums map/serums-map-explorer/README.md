# SERUMS Map Explorer 🗺🇵🇪

Plataforma interactiva para **explorar, filtrar, comparar y analizar las plazas SERUMS del Perú** sobre **Google Maps**.

- **Dataset oficial incluido:** 7 323 plazas del **Anexo 2 — Oferta de plazas remuneradas SERUMS 2026-I** (MINSA), con **6 971 ubicadas (95,2 %)** gracias al cruce por **código RENIPRESS** con el listado nacional de establecimientos más los puntos verificados aportados.
- **Adjudicación cruzada:** el *listado de adjudicados* 2026-I se cruza con el *PDF de resultados finales* y con las plazas: al abrir una plaza se ve **quién la obtuvo y con qué nota** (7 301 con nota, 5 «no se presentó», 183 sin registro en el PDF — siempre indicado, nunca estimado). Además puedes marcar tus propias plazas **favoritas (★)** y **adjudicadas (✅)** para tu seguimiento.
- **Sin build:** abre `index.html` y funciona (solo necesitas internet para Google Maps y las librerías CDN).
- **Diseño:** sistema de diseño propio **Premium Glass UI 2.0** (documentado en `DESIGN-SYSTEM.md`): **Zen Dots** (marca) + **Inter** (interfaz), paleta negro/blanco/rojo `#df2531`, superficies translúcidas con desenfoque selectivo, radios y espaciado unificados, **tema oscuro predeterminado y tema claro**, barra lateral de navegación y controles flotantes. El mapa de Google usa un estilo nocturno a juego.

## Contenido

| Ruta | Qué es |
|---|---|
| `index.html` | Aplicación ejecutable (abre este archivo) |
| `styles.css` | Sistema de diseño (tokens, glass, tema claro/oscuro, responsive) |
| `js/utils.js` | Normalización, colores, validación de coordenadas |
| `js/services.js` | Store (IndexedDB), parser Excel, geocoding, exportación |
| `js/filters.js` | Filtros combinados + geográficos encadenados + orden |
| `js/mapview.js` | Google Maps: marcadores, clustering, leyenda, ficha |
| `js/panels.js` | Resultados, estadísticas, importador, control de geolocalización |
| `js/app.js` | Estado global, navegación, tema, favoritos, marcas de adjudicación propias, filtros rápidos, confirmación, comparador, notificaciones y arranque |
| `datos/datos_plazas.js` | 7 323 plazas reales + coordenadas (generado por script, no inventado) |
| `datos/datos_adjudicados.js` | Cruce oficial adjudicados × notas (`window.SERUMS_ADJUDICADOS` + `_META`), generado, no editar a mano |
| `fonts/README.txt` | Nota histórica sobre MOKOTO (la interfaz ya usa Zen Dots + Inter; no se requieren fuentes locales) |
| `.env.example` | Variables `VITE_GOOGLE_MAPS_API_KEY` / servidor |
| `tests/test_basico.py` | Pruebas básicas (ejecutar con `python`) |
| `tests/check_adjudicados.py` | Verifica el cruce de adjudicación (conteos, claves, notas 0-20, 0 descuadres) |
| `tests/check_coords.py` | Comprueba que ninguna coordenada esté sin fuente declarada |
| `tests/check_ids.py` | Comprueba que no haya referencias de `id` rotas (incluye dinámicos) |
| `tests/check_js.py` | Comprueba que los JS de la app parsean (sintaxis) |
| `tests/build_adjudicados.py` / `tests/pdf_notas.py` | Generador del cruce de adjudicación y parser del PDF de resultados |
| `tests/verify_direccion.py` / `tests/apply_geo_puntos.py` | Verificación de direcciones/coordenadas y puntos aportados |

Arquitectura ↔ especificación: `js/mapview.js` = `components/MapView`, `js/filters.js` = `hooks/useFilters` + `components/FilterPanel`, `js/panels.js` = `ResultsPanel` + `StatisticsDashboard` + `ImportWizard` + `GeocodingManager`, `js/services.js` = `services/*`, `js/app.js` = estado compartido + `components/AppShell`, `datos/` = semilla verificada.

## Interfaz (v2)

- **Barra lateral de navegación** con 9 secciones: Explorar mapa, Resultados, Estadísticas, Datos importados, Geolocalización, Favoritos, **Adjudicación**, Comparador y Configuración (tooltips; en móvil pasa a barra inferior).
- **Barra superior** con identidad, indicador de registros, plazas ubicadas/pendientes, estado de Google Maps, exportación, importación, **tema claro/oscuro**, **centro de notificaciones** y configuración de API.
- **Panel lateral contextual** con pestañas *Explorar plazas* (filtros) y *Resultados*, contraíble, con chips de filtros activos, contadores y paginación.
- **Controles flotantes del mapa:** estilo cartográfico (mapa/satélite/híbrido), encuadrar, volver a Perú, atributo de color (institución / dificultad / geolocalización), agrupar marcadores, auto-encuadre y mostrar u ocultar plazas sin coordenadas. Leyenda dinámica según el atributo elegido.
- **Franja de estado del mapa** (borde inferior del lienzo, una sola línea): plazas encontradas, ubicadas en el mapa, pendientes de geolocalización y vacantes. No flota sobre el centro del mapa; si no cabe, se desplaza horizontalmente.
- **Tarjetas de resultados** de dos niveles (información inmediata + detalle expandible) con acciones para centrar en el mapa, marcar **favorito (★)**, marcar como **adjudicada por ti (✅)**, añadir al **comparador** y abrir la ficha completa.
- **Estado de la plaza (filtros rápidos):** *Todas · ★ Favoritas · ✅ Adjudicadas · 🚫 Bloqueadas · 🟢 Disponibles* con **contadores en tiempo real** (respetan el resto de filtros) y su chip removible. Las adjudicadas propias se ven **atenuadas y tachadas**; la franja del mapa añade «★ N favoritas · ✅ N adjudicadas (mías) · 🚫 N bloqueadas · 🟢 N disponibles» (disponible = sin tu adjudicación y sin bloqueo).
- **Confirmación breve** antes de adjudicar (evita marcas accidentales), con opción «no volver a pedir confirmación» y deshacer desde la notificación.
- **Panorama SERUMS:** KPIs (plazas, establecimientos, vacantes, geolocalizadas, pendientes, con nota de adjudicación), gráficos por región/profesión/institución/dificultad/calidad de geolocalización y tablas; al hacer clic en una categoría se aplica el filtro y se vuelve al mapa.
- **Favoritos y adjudicadas** persistidos en el navegador (localStorage, pestañas *Favoritas* / *Adjudicadas (mías)*, vaciado por pestaña, ver en el mapa); **independientes entre sí** y de la adjudicación oficial. El comparador admite hasta 6 plazas y solo muestra campos disponibles.
- **Centro de adjudicación (dock, sin mapa):** dashboard con KPIs (total, disponibles, adjudicadas, bloqueadas, favoritas), dona de estados + barras por profesión, listado con búsqueda/filtro/orden/paginación, **registro de adjudicaciones** (buscador con autocompletado del conjunto real, persona que adjudica, fecha y hora, observaciones y aviso anti-duplicados o de bloqueo), **bloqueos** (🚫 no elegibles, desbloquear pide confirmación), historial con revertir, y **respaldo**: CSV del registro + JSON de estados para compartir. Ver «Centro de adjudicación» más abajo.
- **Diseño responsivo:** escritorio (mapa amplio + panel), tablet y móvil (mapa protagonista, filtros/resultados en hoja deslizable, objetivos táctiles). Respeta `prefers-reduced-motion`.

Capturas incluidas: `docs/vista-general-oscuro.png` · `docs/estado-filtros-rapidos.png` (estado de la plaza + tarjeta adjudicada) · `docs/estado-favoritos-adjudicadas.png` (subvista con pestañas) · `docs/estado-confirmacion.png` (confirmación breve) · `docs/verificacion-lircay.png` (verificación de coordenadas) · `docs/adj-centro-dashboard.png` (dashboard del centro) · `docs/adj-listado-marcas.png` (listado con la fila adjudicada tachada) · `docs/adj-registro-duplicado.png` (formulario con aviso anti-duplicados) · `docs/adj-mapa-estados.png` (leyenda del mapa con favorita/adjudicada/bloqueada).

## Uso rápido (3 opciones)

**A. Doble clic (más fácil):** abre `serums-map-explorer/index.html` en Chrome/Edge. Todo funciona salvo que algunos navegadores restringen `fetch` local — por eso los datos van en `<script src="datos/...">`, que sí funciona con `file://`.

**B. Servidor local (recomendado):**
```bash
cd serums-map-explorer
python -m http.server 8080
# abre http://localhost:8080
```

**C. Versión Vite/React (opcional):** `npm install && npm run dev` usando `VITE_GOOGLE_MAPS_API_KEY` (ver `package.json`; la UI standalone ya implementa toda la lógica y puede portarse 1:1 a componentes React).

## Configurar Google Maps

Clave de demostración preinstalada (cuota limitada): `AIzaSyC7lmgW183evYiAW-pFNai1DKDSPeYt-Gc`.
Para uso serio pon la tuya con el botón **🔑 API** (queda en tu navegador) o `VITE_GOOGLE_MAPS_API_KEY`.

1. [Google Cloud Console](https://console.cloud.google.com/) → crea proyecto → **Facturación** (obligatoria para Geocoding).
2. **APIs y servicios → Biblioteca** → habilita:
   - **Maps JavaScript API** (mapa; obligatoria)
   - **Geocoding API** (solo si geocodificarás pendientes)
   - **Places API** (solo si agregas búsqueda de establecimientos)
3. **Credenciales → Crear clave de API → Restringir clave**: por **sitios web (HTTP referrers)** con tu dominio + por **API** (las 2 de arriba).
4. Si el mapa falla, la app muestra el motivo exacto y **filtros, listado, estadísticas y exportación siguen funcionando**. Nunca se finge un mapa.

## Guía de importación del Excel

1. **📥 Importar** → arrastra el `.xlsx/.xls/.csv`.
2. Elige la hoja (o **combinar hojas compatibles**).
3. Revisa la **fila de encabezados** detectada y la **correspondencia columnas → campos** (corrige con los desplegables si algo falló).
4. Mira la **vista previa** y el **informe**: procesados / aceptados / incompletos / duplicados / errores.
5. **Confirmar**: las coordenadas se toman en este orden — 1) columnas del Excel si son válidas, 2) cruce RENIPRESS por código, 3) pendientes → lote de geocodificación (una sola vez, con caché). Todo lo pendiente queda marcado **⏳ Pendiente**, nunca como exacto.

Campos detectados: institución ofertante, profesión, sede, N° plazas, DIRESA, institución, departamento, provincia, distrito, dificultad (GD-1…GD-5), código RENIPRESS, establecimiento, categoría, presupuesto, ZAF, ZE (+ lat/lon si existen). **Modalidad, tipo de plaza y remuneración no existen en el Excel oficial** y la app lo indica en vez de inventarlos.

## Geolocalización: qué significa cada estado

| Estado | Origen |
|---|---|
| **Exacta verificada** | Cruce RENIPRESS (código oficial) o coordenadas válidas del Excel |
| **Geolocalización de establecimiento** | Geocoding con `ROOFTOP` del nombre, o punto verificado aportado (`SERUMS_GEO_PUNTOS`) |
| **Aproximada** | Centro de distrito/provincia — solo como alternativa identificada |
| **Pendiente** | Sin información suficiente; jamás se coloca en un punto falso |

### Puntos aportados/verificados (`window.SERUMS_GEO_PUNTOS`)

Al final de `datos/datos_plazas.js` hay un bloque con coordenadas que **no** provienen del cruce RENIPRESS y que se aplican al cargar, por código de establecimiento. Cada punto declara `metodo`, `precision`, `fuente` y `fecha`, y la app los muestra en la ficha («Fuente del punto») para que nunca se confundan con el cruce oficial.

Ejemplo incluido: **CENTRO MEDICO LIRCAY** (`00034999`, 7 plazas de Lircay, Angaraes, Huancavelica) — `-12.988503667936614, -74.72037679188186`, verificado sobre *Av. Ricardo Fernández N° S/N, Mz. F Lote 1* (el punto cae en el Jirón Lima del casco urbano de Lircay, junto a la Plaza de Armas). Para añadir más, usa `python tests/apply_geo_puntos.py` (edita el diccionario del script).

La sección **🧭 Geolocalización** (barra lateral) muestra los conteos, geocodifica por lotes (pausa anti-cuota, reintentos, caché) y permite **revisar/corregir** cada punto con interacción explícita sobre el mapa.

## Adjudicación: oficial y marcas propias

La app distingue **tres capas de estado** que nunca se mezclan:

| Capa | Qué es | Dónde se ve | Dónde vive |
|---|---|---|---|
| **Adjudicación oficial** | Quién obtuvo la plaza y con qué nota, según el *listado de adjudicados* × el *PDF de resultados finales* (MINSA 2026-I) | Ficha («Adjudicación oficial SERUMS 2026-I»), línea `📋` en tarjetas y en el emergente del mapa, y KPI en Estadísticas | `datos/datos_adjudicados.js` (dato de la fuente; no editable) |
| **✅ Adjudicada por ti** | Marca **manual** para tu seguimiento (opcionalmente con registro: persona, fecha/hora y observaciones) | Plaza atenuada y **tachada**, etiqueta «✅ Adjudicada por ti», marcador atenuado con ✓ | `serums_adjudicadas` (localStorage) |
| **★ Favorita** | Selección personal | Etiqueta «★ Favorita», marcador con anillo dorado | `serums_favoritos` (localStorage) |
| **🚫 Bloqueada** | No puede ser seleccionada mientras siga bloqueada | Etiqueta «🚫 Bloqueada», borde discontinuo, marcador atenuado con barrera | `serums_bloqueadas` (localStorage) |

- Los estados son **independientes entre sí**: marcar favorita no adjudica nada y adjudicar no la vuelve favorita. Ninguno modifica el dato oficial. Adjudicada y bloqueada son **mutuamente excluyentes**: adjudicar una bloqueada pide confirmación y retira el bloqueo (y viceversa).
- Antes de adjudicar se pide **confirmación breve** (con «no volver a pedir confirmación»; se puede reactivar en Configuración). **Revertir una adjudicación o desbloquear piden siempre confirmación explícita.** Deshacer: botón ✅ de la tarjeta/ficha/emergente, «Deshacer» en la notificación, o *Favoritos y adjudicadas → Adjudicadas (mías) → Quitar todas*.
- En el mapa los estados **nunca dependen solo del color**: anillo dorado (★), atenuado + check (✅), atenuado + barrera (🚫) y filas propias en la leyenda.
- Todo el seguimiento vive **solo en este navegador**. Las **demás pestañas del mismo navegador se actualizan al instante** (evento `storage`); la sincronización en tiempo real **entre equipos no está disponible** (no hay servidor integrado) — se puede compartir por archivo (⬇/⬆ JSON en el centro de adjudicación).

### Cruce oficial: de dónde sale y cómo se regenera

1. `8089875-listado-de-adjudicados-de-la-modalidad-remunerada-serums-2026-i.xlsx` → persona adjudicada por vacante (7 489).
2. `8066389-resultados-finales-de-la-evaluacia-n-para-el-serums-2026-i.pdf` → región de evaluación y **nota** (39 760 personas; parser tolerante a celdas partidas, filas sin número de orden y estados en la columna nota: `tests/pdf_notas.py`).
3. Unión por **apellidos y nombres + profesión** (coincidencia única verificada; **sin emparejamientos difusos**) y clave final `"<código RENIPRESS>|<PROFESIÓN>"`, idéntica a la que calcula la app.

Resultado: **7 489 adjudicados = 7 489 vacantes declaradas**, 7 297 claves, **0 plazas sin adjudicatario, 0 descuadres, 0 ambiguos**. Estados: **7 301 con nota · 5 «no se presentó y/o no rindió evaluación» · 183 sin registro en el PDF**. Cada estado se muestra tal cual: **nunca se estima una nota ni se inventa un adjudicatario**.

Son datos públicos de MINSA (nombres y notas oficiales): la app solo los muestra.

Regenerar: `python tests/build_adjudicados.py` · Verificar: `python tests/check_adjudicados.py`.

### Centro de adjudicación (dock, sin mapa)

La sección **✅ Adjudicación** del dock es un **centro de control** del seguimiento propio que nunca muestra el mapa:

- **Dashboard:** 5 tarjetas KPI (total de plazas, disponibles, adjudicadas, bloqueadas, favoritas) sobre **todo el conjunto activo**, dona de distribución de estados y barras «adjudicadas por profesión», con la referencia del cruce oficial (7 489 vacantes · 7 301 con nota).
- **Filtros rápidos propios:** *Todas · Disponibles · Adjudicadas · Bloqueadas · Favoritas*, con búsqueda (establecimiento, código, profesión, ubicación), filtro por profesión, 3 órdenes y **paginación** (50 por página).
- **Registro de adjudicaciones:** formulario con **buscador con autocompletado** sobre el conjunto real (distingue las profesiones del mismo establecimiento), *persona que adjudica*, *fecha y hora* del registro (editable) y *observaciones* opcionales. Si la plaza ya está adjudicada **advierte y bloquea el duplicado**; si está bloqueada, advierte que el registro retirará el bloqueo (con confirmación). Todo se refleja al instante en KPIs, gráficos, listado, tarjetas, franja del mapa y ficha.
- **Bloqueos:** bloquear es inmediato (con «Deshacer»); **desbloquear pide confirmación**. Bloquear una plaza ya adjudicada revierte antes la adjudicación, con confirmación explícita.
- **Historial y control:** tabla de adjudicaciones registradas (fecha, plaza, persona, observaciones) con botón de revertir, tabla de bloqueos con desbloqueo, y **respaldo**: ⬇ CSV del registro, ⬇ JSON de estados (favoritas + adjudicadas + bloqueadas) y ⬆ importar/fusionar el JSON (prevalece la marca más reciente). «Vaciar adjudicadas y bloqueadas» también pide confirmación; las favoritas no se tocan.
- La sincronización **entre pestañas del mismo navegador** es automática; no hay backend para compartirla en tiempo real entre equipos (la nota del dashboard lo explica; el JSON sirve para pasar estados entre sesiones).

## Exportación

Botón **📤 Exportar** (respeta filtros + orden): Excel `.xlsx`, CSV completo o CSV de coordenadas. El resumen indica N° de registros y filtros aplicados. Valores originales preservados.

## Datos: de dónde salen (nada inventado)

- Plazas: `8040039-oferta-de-plazas-remuneradas-serums-2026-i.pdf` (Anexo 2, 423 págs.) → parseo tabular (7 323 filas, 4 276 establecimientos únicos).
- Coordenadas: `USLRC20261016180919_xp.xls` (listado RENIPRESS, 27 001 locales, 19 983 con coordenadas válidas) unido por **código RENIPRESS**.
- Adjudicación: `8089875-listado-de-adjudicados...xlsx` (7 489 vacantes adjudicadas) × `8066389-resultados-finales...pdf` (39 760 personas con nota) → `datos/datos_adjudicados.js`.
- Resultado: **6 964/7 323 con coordenadas (95,1 %)** por cruce oficial + **7 plazas** con punto aportado/verificado = **6 971 ubicadas (95,2 %)**; **352 pendientes** en la app (359 filas sin coordenadas en el archivo).
- 16 profesiones (Medicina 2 089, Enfermería 1 769, Psicología 1 206, …), 8 instituciones, 25 regiones, GD-1…GD-5, 7 489 vacantes totales. Verificado por `tests/test_basico.py`, `tests/check_coords.py` y `tests/check_adjudicados.py`.

## Pruebas

```bash
cd serums-map-explorer
python tests/test_basico.py        # 62 comprobaciones (datos, filtros, export, puntos aportados, favoritos/adjudicación, centro de adjudicación)
python tests/check_adjudicados.py  # cruce oficial: conteos, claves, notas 0-20, 0 descuadres, casos concretos
python tests/check_coords.py       # ninguna coordenada sin fuente declarada (RENIPRESS o SERUMS_GEO_PUNTOS)
python tests/check_ids.py          # ninguna referencia de id rota (incluye elementos creados por JS)
python tests/check_js.py           # todos los JS de la app parsean
python tests/verify_direccion.py   # verificación de una dirección/coordenada concreta
python tests/build_adjudicados.py  # regenera datos/datos_adjudicados.js desde XLSX + PDF
```
Cubre: normalización (tildes/mayúsculas), detección de encabezados y mapeo de columnas, validación de coordenadas y rangos, filtros combinados + encadenamiento región→provincia→distrito, conteos reales del dataset, exportación, **independencia entre favoritos / adjudicación manual / bloqueo / adjudicación oficial**, confirmaciones previas, persistencia con claves propias y estructura del centro de adjudicación (KPIs, registro con persona/fecha/observaciones, anti-duplicados, bloqueos, sincronización local y respaldo JSON/CSV). Criterios de aceptación (§14 de la especificación) verificables en la app: importar Excel real, revisar antes de cargar, marcadores sincronizados, stats = filtro actual, exportaciones válidas, escritorio + móvil, error de Maps comunicado, cero coordenadas inventadas.

## Autoría y licencia

- **Autoría:** ZARCONT. Este proyecto forma parte del repositorio `LAUNCHER SERUMS`.
- **Licencia propietaria:** © 2026 ZARCONT — Todos los derechos reservados. El uso, la copia
  y la distribución se rigen por el archivo `LICENSE` (incluido en esta carpeta y en la raíz
  del repositorio). Ver también `NOTICE.md` (terceros) y `AUTORIA.md` (versiones y registro).
- **Integridad:** los archivos propios figuran en `INTEGRITY.sha256`; se pueden verificar con
  `python verificar_integridad.py` desde la raíz del repositorio.

## Despliegue

Estático, sin backend: GitHub Pages / Netlify / Vercel / cualquier hosting. Sube la carpeta, configura la clave con restricción HTTP referrer a tu dominio y listo. Para geocodificación en servidor (proteger la clave): endpoint propio con `GOOGLE_MAPS_API_KEY` como variable de entorno.

## Limitaciones conocidas

- La clave demo tiene **usos limitados** (errores `OVER_QUERY_LIMIT`/`REQUEST_DENIED` posibles con uso intensivo).
- 4,8 % de plazas sin coordenadas (no figuran o sin coordenadas válidas en RENIPRESS): quedan pendientes y se listan/exportan igual.
- **183 adjudicados no figuran en el PDF de resultados finales** (la nota se muestra como «Sin registro…»; no se estima) y 5 figuran con «no se presentó y/o no rindió evaluación».
- `file://` + Chrome puede bloquear algunas CDN si no hay internet; con internet funciona todo.
- Clustering requiere la CDN de MarkerClusterer; sin ella se muestran hasta 2 500 marcadores con aviso.
- Sin remuneraciones ni modalidad en la fuente oficial: esos filtros aparecen como no disponibles.
- **El seguimiento (★/✅/🚫) es local a este navegador**: se sincroniza entre pestañas automáticamente, pero **no entre equipos** — la adjudicación compartida en tiempo real necesitaría un backend, no incluido; para compartir estados se exporta/importa un JSON.
- **Tipografía:** **Zen Dots** (marca y títulos de identidad) + **Inter** (interfaz y datos), ambas desde Google Fonts; no se distribuye ninguna fuente comercial.
