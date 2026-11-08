# SERUMS QUEST · V2 · Informe QA Agente 7 · Checkpoint 2

- **Pasada:** final Checkpoint 2 · mundo interactivo
- **Inicio/fin:** 2026-11-06T15:30:02.814Z → 2026-11-06T15:32:46.012Z
- **dist/index.html:** `b32f14899538c979b8a3317bb94feb91704f80b338115289a4dabe94567ca048` · 3173871 B · mtime 2026-11-06T15:13:28.289Z
- **export/serums-quest.html:** `b32f14899538c979b8a3317bb94feb91704f80b338115289a4dabe94567ca048` · 3173871 B · igual al dist: sí
- **Entorno:** Chrome/156.0.8078.80 (@fb096c0011f9d50f0a264a9376420cdea9c421e3) · GPU: ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 (0x00002882) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1280×720 · DPR 1
- **Resultado:** 53 PASS · 0 FAIL · 0 BLOCKED · 0 SKIP · 1 NOTE (de 54 casos)
- **Red principal:** 0 no locales de 62 · **Errores:** 0 · **V2._errors:** 0

## Casos

| Caso | Resultado | Evidencia |
| --- | --- | --- |
| ART01 · dist/index.html y export/serums-quest.html: tamaño, hash y buildId | **PASS** | dist=3173871 B/b32f14899538c979b8a3317bb94feb91704f80b338115289a4dabe94567ca048 · export=3173871 B/b32f14899538c979b8a3317bb94feb91704f80b338115289a4dabe94567ca048 |
| ART02 · Enlace del HUB (serums-quest/index.html → dist/index.html) | **PASS** | target dist/index.html presente |
| E00 · Chrome headless, perfil limpio y GPU | **PASS** | Chrome/156.0.8078.80 (@fb096c0011f9d50f0a264a9376420cdea9c421e3) · ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 (0x00002882) Direct3D11 vs_5_0 ps_5_0, D3D11) · DPR 1 · 1280×720 |
| T01 · Versión visible V2 · Final | **PASS** | titleVersion="V2 · Final" · document.title="SERUMS QUEST" |
| T02 · V2.world expone interact/stats/ids/close/isOpen | **PASS** | {"interact":true,"stats":true,"ids":true,"close":true,"isOpen":true} |
| W01 · Censo del mundo interactivo y API lista | **PASS** | ids={"chest":5,"fragment":15,"guide":5,"telescope":1,"library":1,"shadow":5} · stats={"interactives":27,"markers":22,"chests":5,"fragments":15,"guides":5,"stations":2,"shadowSlots":5} |
| W02 · Culling de marcadores por distancia (configuración + atrio) | **PASS** | total=22 rango=6.5 banda=1.2 · ocultos por distancia en spawn=8/22 · captura atrio-mundo |
| W03 · Biblioteca vacía | **PASS** | title="Biblioteca de fichas" · text=Las flashcard se desbloquean al guardar fragmentos. Este lector es local: no usa red ni servicios externos.  0 de 15 fichas 10 fragmentos en el atrio + 5 en cof |
| W04 · Cofre cerrado: panel y botón Abrir | **PASS** | title="Cofre de Salud pública" · acciones=["v2-world-close","v2-world-chest-open","v2-world-close"] |
| W05 · Cofre abierto: recompensa única + fragmento | **PASS** | xp 6200→6210 · coins 999→1004 · abiertos=1 · fragmentosCofre=1 · log=[{"id":"v2w-chest-salud-publica","kind":"chest","xp":5,"coins":5,"capReached":false,"applied":true,"at":"2026-11-06T15:30:12.562Z"},{"id":"v2w-frag-salud-publica-c","kind":"fragment","xp":5,"coins":0,"capReached":false,"applied":true,"at":"2026-11-06T15:30:12.563Z"}] |
| W06 · Cofre repetido no da recompensa (anti-farmeo) | **PASS** | xp=6210 coins=1004 acciones=["v2-world-close","v2-world-library-read","v2-world-close"] |
| W07 · Fragmento gratuito: guardar +5 XP y desbloquear flashcard | **PASS** | xp 6210→6215 · fragmentos=2 (libres=1, cofre=1) |
| W08 · Fragmento repetido no da XP (anti-farmeo) | **PASS** | xp=6215 acciones=["v2-world-close","v2-world-library-back","v2-world-close"] |
| W09 · Guía de 3 pantallas y recompensa +5 XP | **PASS** | eyebrows=["Guía de Salud pública · 1 de 3","Guía de Salud pública · 2 de 3","Guía de Salud pública · 3 de 3"] · xp 6215→6220 · completadas=1 |
| W10 · Guía repetida no da XP (anti-farmeo) | **PASS** | xp=6220 · título="La ruta de Salud pública" · body=Completada el 06-nov. · repetir no da XP  Soy Killa, vigía comunitaria de esta ruta. Métodos, comunidad, promoción y determinantes.  3 misiones 1 jefe de ruta R |
| W11 · Las 5 guías abren su panel | **PASS** | [{"id":"v2w-guide-salud-publica","opened":true,"title":"La ruta de Salud pública","eyebrow":"Guía de Salud pública · 1 de 3"},{"id":"v2w-guide-cuidado-integral","opened":true,"title":"La ruta de Cuidado integral","eyebrow":"Guía de Cuidado integral · 1 de 3"},{"id":"v2w-guide-etica","opened":true,"title":"La ruta de Ética e interculturalidad","eyebrow":"Guía de Ética e interculturalidad · 1 de 3"},{"id":"v2w-guide-investigacion","opened":true,"title":"La ruta de Investigación","eyebrow":"Guía de |
| W12a · Biblioteca con fichas desbloqueadas | **PASS** | filas=2 · body=Las flashcard se desbloquean al guardar fragmentos. Este lector es local: no usa red ni servicios externos.  2 de 15 fichas 10 fragmentos en el atrio + 5 en cofres Las cinco estrategias de Ottawa Salud pública · Study Fl |
| W12b · Lector local de flashcard | **PASS** | eyebrow="Flashcard · Salud pública" · body=Salud pública ficha card-ottawa-01-2 pregunta v2-fc-card-ottawa-01-2  ¿Cuál de las siguientes NO es una de las cinco estrategias de la Carta de Ottawa?  CLAVE Aumentar la prescripción de medicamentos en la consulta. Ottawa propone política pública sana, ambien |
| W13 · v2.world persiste tras recargar | **PASS** | chests 1→1 · fragments 2→2 · guides 1→1 · xp 6220→6220 · coins 1004→1004 |
| W14a · El JSON exportado incluye v2.world | **PASS** | vía=download · chests=1 · fragments=2 · guides=5 |
| W14b · Reimportar el guardado nuevo conserva v2.world y recompensas | **PASS** | preview=QA V2 · chests=1 fragments=2 guides=1 · xp=6220 coins=1004 |
| W15 · Telescopio sin errores vencidos | **PASS** | botón={"disabled":true,"text":"Abrir repaso"} · body=0 sin errores vencidos  No hay errores vencidos. El telescopio no inventa repasos: espera a que alguna pregunta cumpla su fecha.  Abrir el repaso no marca nada  |
| W16 · Telescopio con 3 errores vencidos | **PASS** | sombras={"active":1,"dueTotal":3,"byArea":{"area-psi-salud-publica":3},"list":[{"id":"v2w-shadow-salud-publica","areaId":"area-psi-salud-publica","count":3,"active":true,"x":-6.356,"z":-1.582},{"id":"v2w-shadow-cuidado-integral","areaId":"area-psi-cuidado-integral","count":0,"active":false,"x":-0.459,"z":-6.534},{"id":"v2w-shadow-etica","areaId":"area-psi-etica","count":0,"active":false,"x":6.072,"z":-2.456},{"id":"v2w-shadow-investigacion","areaId":"area-psi-investigacion","count":0,"active":fa |
| W17 · Sombra del error activa con 3 errores vencidos | **PASS** | title="Sombra del error" · body=3 errores vencidos en esta ruta  La sombra se forma con los errores vencidos de Salud pública. No se derrota respondiendo lo mismo: se disipa cuando el repaso deja el área sin errores vencidos.  Métodos, comunidad, promo |
| W18 · La sombra se disipa al completar el repaso | **PASS** | review={"mode":"review","total":3,"dueBtn":{"disabled":false,"text":"Repasar lo que toca (3)"},"screenText":"REPETICIÓN ESPACIADA\nVolver a mirar también es avanzar.\n\nCada fallo entra en un calendario de repaso"} · sombras tras repaso={"active":0,"dueTotal":0,"byArea":{},"list":[{"id":"v2w-shadow-salud-publica","areaId":"area-psi-salud-publica","count":0,"active":false,"x":-6.356,"z":-1.582},{"id":"v2w-shadow-cuidado-integral","areaId":"area-psi-cuidado-integral","count":0,"active":false,"x":- |
| W19 · Restauración nivel 0 (misma puerta de Ética) | **PASS** | {"levels":{"area-psi-salud-publica":0,"area-psi-cuidado-integral":0,"area-psi-etica":0,"area-psi-investigacion":0,"area-psi-gestion":0},"total":0,"maxLevels":15,"visuals":{"vegetation":0,"runes":0,"crystals":0,"columns":0,"halos":0}} · captura restauracion-0 |
| W20 · Restauración nivel 3 en Ética (misma puerta) | **PASS** | {"levels":{"area-psi-salud-publica":0,"area-psi-cuidado-integral":0,"area-psi-etica":3,"area-psi-investigacion":0,"area-psi-gestion":0},"total":3,"maxLevels":15,"visuals":{"vegetation":6,"runes":2,"crystals":3,"columns":2,"halos":2}} · captura restauracion-3-etica |
| W21 · Tope diario: XP sí, monedas no; sin farmeo | **PASS** | coins 999→999 · xp 6200→6210 · chest={"id":"v2w-chest-cuidado-integral","areaId":"area-psi-cuidado-integral","x":0.569,"z":-8.13,"opened":true,"openedAt":"2026-11-06T15:31:08.454Z","fragmentId":"v2w-frag-cuidado-integral-c","coins":0} · counters={"date":"2026-11-06","coins":120,"xp":10,"sessions":0} |
| W22 · Panel de mundo a 960×540 | **PASS** | panel={"w":738,"h":322,"scrollW":738,"scrollH":322} body={"w":738,"h":197,"scrollW":738,"scrollH":197} shot=960×540 |
| W23 · Panel de mundo a 390×844 | **PASS** | panel={"w":376,"h":292,"scrollW":376,"scrollH":292} body={"w":376,"h":156,"scrollW":376,"scrollH":156} rotatePrompt=false shot=390×844 |
| R01 · Menú de título completo | **PASS** | ["open-map","enter-arena","open-modes","open-wardrobe","open-shop","open-journal","open-settings","open-import"] |
| R02 · Mapa con 5 islas | **PASS** | ["area-psi-salud-publica","area-psi-cuidado-integral","area-psi-etica","area-psi-investigacion","area-psi-gestion"] |
| R03a · Pantalla de modos | **PASS** | ["Desafío diario","Supervivencia","Contrarreloj","Simulacro"] |
| R03b · Práctica libre: sesión, respuesta y cierre | **PASS** | mode=practice total=10 |
| R05 · Pausa en duelo y reanudación | **PASS** | pausa=true reanuda=true índice=0 |
| R04 · Campaña: misión de 5 preguntas, feedback y resultado | **PASS** | questionTotal=5 · feedback=wrong · pass=true · score=400 · mission={"id":"mission-sp-1","kind":"mission","areaId":"area-psi-salud-publica","attempts":1,"completedAt":"2026-11-06T15:31:40.547Z","bestScore":400,"bestAccuracy":0.8,"lastAt":"2026-11-06T15:31:40.547Z","lastScore":400,"lastAccuracy":0.8,"passedAt":"2026-11-06T15:31:40.547Z"} |
| R06 · Misión de campaña persiste tras recargar | **PASS** | missions=1 xp=190 |
| R07 · Tienda: compra de cosmético con confirmación | **PASS** | coins 500→410 · gorro=true |
| R08 · Inventario: equipar y guardar atuendo | **PASS** | equipped={"cabeza":"c-cabeza-gorro"} |
| R09 · Compra y atuendo persisten tras recargar | **PASS** | coins=410 equipped={"noa":{"cabeza":"c-cabeza-gorro"}} |
| R10 · Ajustes: versión V2 Final, calidad y reducir movimiento | **PASS** | foot="V2 · Final · compilado el 2026-11-06 · sin conexión y sin cuentas Volver" · qualities=["bajo","medio","alto"] · pesos=true · low=bajo/bajo · high=alto/alto · reduced=true/true |
| R11 · Importar partida 1.2 y añadir v2.world vacío | **PASS** | preview=Offline QA · xp=1640 coins=2510 errors=3 · mundo={"chests":0,"fragments":0,"guides":0} |
| R12 · Importación 1.2 persiste tras recargar | **PASS** | xp=1640 coins=2510 |
| F01 · FPS · Atrio en reposo (sin panel) | **PASS** | min=75 avg=75 muestras=18 <45=0 |
| F02 · FPS · Atrio con mundo activo (panel de telescopio) | **PASS** | min=75 avg=75 muestras=18 <45=0 |
| F03 · FPS · Mapa | **PASS** | min=75 avg=75 muestras=18 <45=0 |
| F04 · FPS · Duelo | **PASS** | min=75 avg=75 muestras=18 <45=0 |
| N01 · Cero peticiones de red no locales | **PASS** | 0 no locales de 62 · {"file":20,"data":42,"blob":0,"about":0,"chrome":0,"other":0} |
| N02 · Cero errores de consola/excepción | **PASS** | 0 errores ·  |
| N03 · V2._errors vacío | **PASS** | 0 errores V2 [] |
| N02b · Advertencias de consola (no bloqueantes) | **NOTE** | 21 advertencias · THREE.WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead. |
| X01 · export/serums-quest.html por file://: mundo + cofre + 0 red/errores | **PASS** | stats={"built":true,"ready":true,"chests":0} · coins 999→1004 · noLocales=0 · errores=0 · warnings=2 |
| X02 · index.html redirige a dist/index.html | **PASS** | {"href":"file:///C:/Users/USARIO/Documents/ZARCONT%20SERUMS/serums-quest/dist/index.html","path":"/C:/Users/USARIO/Documents/ZARCONT%20SERUMS/serums-quest/dist/index.html","title":"SERUMS QUEST","game":true} · errores=0 · noLocales=0 |
| N04 · dist y export estables durante la pasada | **PASS** | dist=b32f14899538 export=b32f14899538 |

## Rendimiento

| Escena | Calidad | Mínimo | Medio | Muestras | <45 | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| hubIdle | alto | 75 | 75 | 18 | 0 | agent7-cp2-qa.json → fps.hubIdle |
| hubPanel | alto | 75 | 75 | 18 | 0 | agent7-cp2-qa.json → fps.hubPanel |
| map | alto | 75 | 75 | 18 | 0 | agent7-cp2-qa.json → fps.map |
| duel | alto | 75 | 75 | 18 | 0 | agent7-cp2-qa.json → fps.duel |

Muestras (`window.__gameState().fps` cada ~120 ms): hubIdle = [75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75] · hubPanel = [75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75] · map = [75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75] · duel = [75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75].

Objetivo: medio ≥ 55 y mínimo ≥ 45. GPU real del host (ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 (0x00002882) Direct3D11 vs_5_0 ps_5_0, D3D11)), 1280×720 y DPR 1.

## Red y errores

- Peticiones totales: 62; no locales (http/https/ws): 0.
- Esquemas: {"file":20,"data":42,"blob":0,"about":0,"chrome":0,"other":0}
- Errores de consola/excepción: 0.
- Export HTML (file://): mundo=construido · cofre=abierto · no locales=0 · errores=0 · warnings=2.
- HUB index → dist/index.html: redirect=sí · juego=true · no locales=0 · errores=0.
- Advertencias de consola: 21 · `THREE.WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead.`

## Mundo interactivo

- IDs: {"chest":5,"fragment":15,"guide":5,"telescope":1,"library":1,"shadow":5} · 32 entradas.
- Censo inicial: {"interactives":27,"catalogEntries":32,"chests":5,"fragments":15,"freeFragments":10,"chestFragments":5,"guides":5,"stations":2,"shadows":0,"shadowSlots":5,"markers":22} · marcadores={"total":22,"distanceCulling":true,"range":6.5,"fadeBand":1.2,"sizes":{"chest":0.21,"guide":0.21,"fragment":0.105,"station":0.18}}
- Culling: rango 6.5 / banda 1.2 · ocultos en spawn=8/22 · captura `agent7-cp2-atrio-culling.png`.
- Persistencia tras recarga: {"chests":1,"fragments":2,"guides":1} → {"chests":1,"fragments":2,"guides":1} · xp/coins iguales.
- Sombra/repaso: antes={"active":1,"dueTotal":3} · después={"active":0,"dueTotal":0} · errores guardados=3 · botón de repaso antes={"disabled":false,"text":"Repasar lo que toca (3)"} · telescopio tras repaso={"disabled":true,"text":"Abrir repaso"}
- Restauración: nivel 0 = {"area-psi-salud-publica":0,"area-psi-cuidado-integral":0,"area-psi-etica":0,"area-psi-investigacion":0,"area-psi-gestion":0} · nivel 3 Ética = {"area-psi-salud-publica":0,"area-psi-cuidado-integral":0,"area-psi-etica":3,"area-psi-investigacion":0,"area-psi-gestion":0} · visuals={"vegetation":6,"runes":2,"crystals":3,"columns":2,"halos":2}
- Tope diario: {"before":{"coins":999,"xp":6200,"counters":{"date":"2026-11-06","coins":120,"xp":0,"sessions":0}},"after":{"coins":999,"xp":6210,"counters":{"date":"2026-11-06","coins":120,"xp":10,"sessions":0}},"chest":{"id":"v2w-chest-cuidado-integral","areaId":"area-psi-cuidado-integral","x":0.569,"z":-8.13,"opened":true,"openedAt":"2026-11-06T15:31:08.454Z","fragmentId":"v2w-frag-cuidado-integral-c","coins":0}}
- Export/import: entradas por bucket={"chests":1,"fragments":2,"guides":5,"stations":1,"visited":8} · reimportado={"chests":1,"fragments":2,"guides":1} (guias completadas) · preview=QA V2

Datos completos: `agent7-cp2-qa.json` (mundo, capturas y muestras FPS).

## Problemas

Sin problemas registrados.

## Capturas

- [agent7-cp2-titulo-version.png](agent7-cp2-titulo-version.png)
- [agent7-cp2-atrio-mundo.png](agent7-cp2-atrio-mundo.png)
- [agent7-cp2-atrio-culling.png](agent7-cp2-atrio-culling.png)
- [agent7-cp2-biblioteca-vacia.png](agent7-cp2-biblioteca-vacia.png)
- [agent7-cp2-cofre-cerrado.png](agent7-cp2-cofre-cerrado.png)
- [agent7-cp2-cofre-abierto.png](agent7-cp2-cofre-abierto.png)
- [agent7-cp2-cofre-reabierto.png](agent7-cp2-cofre-reabierto.png)
- [agent7-cp2-fragmento-bloqueado.png](agent7-cp2-fragmento-bloqueado.png)
- [agent7-cp2-fragmento-guardado.png](agent7-cp2-fragmento-guardado.png)
- [agent7-cp2-guia-1.png](agent7-cp2-guia-1.png)
- [agent7-cp2-guia-2.png](agent7-cp2-guia-2.png)
- [agent7-cp2-guia-3.png](agent7-cp2-guia-3.png)
- [agent7-cp2-guia-completada.png](agent7-cp2-guia-completada.png)
- [agent7-cp2-biblioteca-ficha.png](agent7-cp2-biblioteca-ficha.png)
- [agent7-cp2-lector.png](agent7-cp2-lector.png)
- [agent7-cp2-importar-nuevo.png](agent7-cp2-importar-nuevo.png)
- [agent7-cp2-telescopio-vacio.png](agent7-cp2-telescopio-vacio.png)
- [agent7-cp2-telescopio-3.png](agent7-cp2-telescopio-3.png)
- [agent7-cp2-atrio-sombra.png](agent7-cp2-atrio-sombra.png)
- [agent7-cp2-sombra-errores.png](agent7-cp2-sombra-errores.png)
- [agent7-cp2-repaso-desde-sombra.png](agent7-cp2-repaso-desde-sombra.png)
- [agent7-cp2-repaso-resultado.png](agent7-cp2-repaso-resultado.png)
- [agent7-cp2-atrio-sombra-disipada.png](agent7-cp2-atrio-sombra-disipada.png)
- [agent7-cp2-telescopio-sin-errores.png](agent7-cp2-telescopio-sin-errores.png)
- [agent7-cp2-restauracion-0.png](agent7-cp2-restauracion-0.png)
- [agent7-cp2-restauracion-3-etica.png](agent7-cp2-restauracion-3-etica.png)
- [agent7-cp2-tope-diario.png](agent7-cp2-tope-diario.png)
- [agent7-cp2-panel-960.png](agent7-cp2-panel-960.png)
- [agent7-cp2-panel-390.png](agent7-cp2-panel-390.png)
- [agent7-cp2-mapa.png](agent7-cp2-mapa.png)
- [agent7-cp2-modos.png](agent7-cp2-modos.png)
- [agent7-cp2-mision-resultado.png](agent7-cp2-mision-resultado.png)
- [agent7-cp2-tienda.png](agent7-cp2-tienda.png)
- [agent7-cp2-inventario.png](agent7-cp2-inventario.png)
- [agent7-cp2-ajustes.png](agent7-cp2-ajustes.png)
- [agent7-cp2-importar-1-2.png](agent7-cp2-importar-1-2.png)
- [agent7-cp2-export-html.png](agent7-cp2-export-html.png)
- [agent7-cp2-hub-link.png](agent7-cp2-hub-link.png)

## Cierre

Sin FAIL/BLOCKED. Revisar las capturas y confirmar el veredicto del Checkpoint 2.

_Informe generado por `agent7-cp2-qa.js`. No se modificó el juego._