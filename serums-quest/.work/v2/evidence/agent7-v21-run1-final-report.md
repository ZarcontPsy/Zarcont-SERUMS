# SERUMS QUEST · V2.1 · Informe QA Agente 7 · pasada final (V2.1)

- **Modo:** final · build esperado base `b32f14899538`
- **Inicio/fin:** 2026-11-06T17:56:34.264Z → 2026-11-06T18:04:53.322Z · 499 s
- **bundle evaluado:** `C:\Users\USARIO\Documents\ZARCONT SERUMS\serums-quest\dist\index.html` · `c08f590d7972b7518f324fae29c08118dc5ed51750aa6b8d8dc5f0407c21ae2d` · 3369150 B · mtime 2026-11-06T17:30:23.846Z
- **dist/index.html:** `c08f590d7972b7518f324fae29c08118dc5ed51750aa6b8d8dc5f0407c21ae2d` · 3369150 B
- **export/serums-quest.html:** `c08f590d7972b7518f324fae29c08118dc5ed51750aa6b8d8dc5f0407c21ae2d` · 3369150 B · igual al dist: sí
- **Entorno:** Chrome/156.0.8078.80 (@fb096c0011f9d50f0a264a9376420cdea9c421e3) · GPU: ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 (0x00002882) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1280×720 · DPR 1
- **Resultado:** 56 PASS · 1 FAIL · 0 BLOCKED · 0 SKIP · 2 NOTE (de 59 casos)
- **Red principal:** 0 no locales de 170 · **Errores:** 0 · **V2._errors:** 0

## Casos

| Caso | Resultado | Evidencia |
| --- | --- | --- |
| ART01 · Artefacto base/final: tamaño, hash y buildId | **PASS** | bundle=index.html 3369150 B/c08f590d7972b7518f32 · dist=3369150 B/c08f590d7972 · export=3369150 B/c08f590d7972 |
| ART02 · Enlace del HUB (serums-quest/index.html → dist/index.html) | **PASS** | target dist/index.html presente |
| ENV01 · Chrome headless, perfil limpio y GPU | **PASS** | Chrome/156.0.8078.80 (@fb096c0011f9d50f0a264a9376420cdea9c421e3) · ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 (0x00002882) Direct3D11 vs_5_0 ps_5_0, D3D11) · DPR 1 · 1280×720 |
| V01 · Título y versión visible | **PASS** | titleVersion="V2.1 · Correcciones" · document.title="SERUMS QUEST" · V2.version=2.0.0-checkpoint1 |
| R01 · Menú de título completo | **PASS** | ["open-map","enter-arena","open-modes","open-wardrobe","open-shop","open-journal","open-settings","open-import"] |
| R02 · Mapa con 5 islas | **PASS** | ["area-psi-salud-publica","area-psi-cuidado-integral","area-psi-etica","area-psi-investigacion","area-psi-gestion"] |
| B08a · Capturas de los 10 héroes sin/con cosmético y 3 ángulos | **PASS** | [agent7-v21-final-parpadeo-ilan-a.png](agent7-v21-final-parpadeo-ilan-a.png) · [agent7-v21-final-parpadeo-ilan-b.png](agent7-v21-final-parpadeo-ilan-b.png) · [agent7-v21-final-parpadeo-ilan-c.png](agent7-v21-final-parpadeo-ilan-c.png) · [agent7-v21-final-parpadeo-mara-a.png](agent7-v21-final-parpadeo-mara-a.png) |
| B08c · Señal auxiliar de parpadeo en el canvas | **NOTE** | héroes con caída de píxeles oscuros: ["mara","teo","lia","kian","amaru","ona","iris","zenon"] |
| B03a · Ajustes exponen «al final / tras cada pregunta» y «solo banco original» | **PASS** | acciones=["open-pause","open-heroes","open-review","open-map","open-journal","open-wardrobe","open-shop","toggle-sound","open-mission","close-settings","toggle-ambient","toggle-muted","export-save","open-import","toggle-reduced-motion","toggle-extra-time","set-effects-quality","set-text-scale","toggle-contrast","toggle-backup-reminder","toggle-3d-frames","v2-weights-reset","v2-feedback-mode","v2-perf-original-bank","v2-perf-bank-audit","save-local-backup","reset-progress","open-help","open-tutorial","open-credits"] · textos: each=true end=true bancoOriginal=true hasFeedbackSettings=true hasPer |
| R03a · Pantalla de modos | **PASS** | ["Desafío diario","Supervivencia","Contrarreloj","Simulacro"] |
| R03b · Práctica libre: sesión, respuesta y cierre | **PASS** | mode=practice total=10 |
| B01 · Feedback por defecto al final: sin overlay entre preguntas y auto-avance ~900 ms | **PASS** | feedback={"v2Open":false,"legacy":false,"feedbackOpen":true} · auto={"idx0":0,"idx1":1,"advanceMs":960,"advanced":true,"overlayStillOpen":false,"screen":"duel"} · settings.feedbackMode="end" |
| R03c · Los 4 modos abren una sesión y se cierran sin error | **PASS** | [{"mode":"daily","ok":true,"state":"daily","total":6,"shot":"agent7-v21-final-modo-daily.png"},{"mode":"survival","ok":true,"state":"survival","total":10,"shot":"agent7-v21-final-modo-survival.png"},{"mode":"timed","ok":true,"state":"timed","total":8,"shot":"agent7-v21-final-modo-timed.png"},{"mode":"simulacro","ok":true,"state":"simulacro","total":20,"shot":"agent7-v21-final-modo-simulacro.png"}] |
| R05 · Pausa en duelo y reanudación | **PASS** | pausa=true reanuda=true índice=0 |
| B01b · Campaña: feedback al final sin overlay y con auto-avance | **PASS** | feedback={"v2Open":false,"legacy":false} · auto={"idx0":0,"idx1":1,"advanceMs":990,"advanced":true,"overlayAfter":false,"screen":"duel"} |
| B02 · Resumen de nivel con errores primero, filtros, difícil, flashcard y vistas 960/390 | **PASS** | api=true · items=5 · first={"id":"2026-ii-psicologia-q059","cls":"v2-summary__item is-wrong","text":"FALLADA"} · filtros=[{"filter":"wrong","text":"Solo errores\n1","pressed":"false"},{"filter":"all","text":"Todas\n5","pressed":"true"}] · difficult={"before":"Marcar como difícil","after":"Marcada como difícil","toggled":true} · flashcard={"open":true,"text":"FLASHCARD LOCAL · SALUD PÚBLICA\nFicha de estudio\n\nLa ...... es el estudio de la distribución y determinantes de la enfermedad en la población humana. Es la ciencia básica y práctica fundamental de la salud pública.\n\nCORR","closeAction |
| B05b · Etiqueta de generadas dentro de la misión de campaña | **PASS** | preguntas=[{"id":"v2-dash-sheet-modelo-sujetos-01","source":"dashboard","generated":true,"chip":"Generada · ficha"},{"id":"2026-ii-psicologia-q059","source":"campaign","generated":false,"chip":null},{"id":"v2-fc-card-psi-sp-2-9-1","source":"flashcards","generated":true,"chip":"Generada · tarjeta"},{"id":"v2-dash-sheet-agua-01","source":"dashboard","generated":true,"chip":"Generada · ficha"},{"id":"2026-i-psicologia-q065","source":"campaign","generated":false,"chip":null}] |
| R04 · Campaña: misión de 5 preguntas, feedback y resultado | **PASS** | questionTotal=5 · feedback=undefined · pass=true · score=400 · mission={"id":"mission-sp-1","kind":"mission","areaId":"area-psi-salud-publica","attempts":1,"completedAt":"2026-11-06T18:00:15.294Z","bestScore":400,"bestAccuracy":0.8,"lastAt":"2026-11-06T18:00:15.294Z","lastScore":400,"lastAccuracy":0.8,"passedAt":"2026-11-06T18:00:15.294Z"} |
| R06 · Misión de campaña persiste tras recargar | **PASS** | missions=1 xp=190 |
| B03b · Opción «tras cada pregunta»: persiste, abre overlay y desactiva el auto-avance | **PASS** | click={"clicked":true,"action":"v2-feedback-mode","mode":"each"} · mode=each · tras recarga=each · flow={"fb":{"v2Open":true,"legacy":true,"kind":"correct","text":"RETROALIMENTACIÓN · PRÁCTICA LIBRE · 1/10\nVEREDICTO\nCorrecto\n\nLa clave coincide con tu respuesta. Puedes seguir cuando quieras.\n\nEl terremoto de Rusia de 8.2, generó una alerta de tsunami en todo el litoral peruano; ante ello, las autoridades tomaron medidas preventivas de alerta. ¿Qué tipo de amenaza es dicho suceso?\n\nRESPUESTA CORRECTA\nD\nNatural\nEXPLICACIÓN\nEXPLICACIÓN BREVE\n\nUn terremoto con alerta de tsunami es un  |
| B04 · «Solo banco original» persiste y filtra la sesión | **PASS** | click={"clicked":true,"action":"v2-perf-original-bank"} · setting=true · tras recarga=true · preguntas=[{"id":"2025-i-psicologia-q009","source":"campaign","generated":false},{"id":"2025-i-psicologia-q013","source":"campaign","generated":false},{"id":"2025-i-psicologia-q018","source":"campaign","generated":false},{"id":"2025-i-psicologia-q025","source":"campaign","generated":false},{"id":"2025-i-psicologia-q037","source":"campaign","generated":false},{"id":"2025-i-psicologia-q042","source":"campaign","generated":false}] |
| B05 · Las preguntas generadas llevan etiqueta visible | **PASS** | {"id":"v2-dash-sheet-ambiental-politica-02","source":"dashboard","generated":true,"chip":"Generada · ficha","chips":["Generada · ficha"],"screenHasGenerada":true,"text":"✦\nPRÁCTICA LIBRE · 1/10\nPráctica libre · Salud pública\n999\nNoa Iturbe\nNv\n1\n· 0 XP\nPrecisión del duelo\n—\n999\nPRÁCTICA LIBRE · SALUD PÚBLICA\nGenerada · ficha\nDifícil\nFavorita\n\nSegún la ficha «Seis políticas para actuar sobre el entorno», ¿cuál de estas ideas clave le corresponde?\n\nA\nInocuidad: condición del alimento que no causa daño por peligros biológicos, químicos o físicos.\nB\nResiduo especial: químicos,  |
| B06a · Fixture low: restauración en cero | **PASS** | levels={"area-psi-salud-publica":0,"area-psi-cuidado-integral":0,"area-psi-etica":0,"area-psi-investigacion":0,"area-psi-gestion":0} · captura=agent7-v21-final-restauracion-fixture-low.png |
| B06 · La restauración no retrocede al degradarse el cálculo (se conserva el máximo) | **PASS** | [agent7-v21-final-restauracion-alta.png](agent7-v21-final-restauracion-alta.png) · [agent7-v21-final-restauracion-tras-degradar-calculo.png](agent7-v21-final-restauracion-tras-degradar-calculo.png) |
| R06 · Repaso: sesión de errores vencidos y resultado | **PASS** | review=true · due 3→0 · text=REPETICIÓN ESPACIADA Volver a mirar también es avanzar.  Cada fallo entra en un calendario de repaso. La primera cita es a los 20 minutos; después, 1, 3, 7, 14 y 30 días. Recuperar |
| R07 · Tienda: compra de cosmético con confirmación | **PASS** | coins 500→410 · gorro=true |
| R08 · Inventario: equipar y guardar atuendo | **PASS** | equipped={"cabeza":"c-cabeza-gorro"} |
| R09 · Compra y atuendo persisten tras recargar | **PASS** | coins=410 equipped={"noa":{"cabeza":"c-cabeza-gorro"}} |
| R10 · Selector: 10 héroes, navegación y elección | **PASS** | {"cards":10,"dots":10,"hasCanvas":true} · elegido=ilan |
| R11a · Mundo interactivo listo y censo | **PASS** | ids={"chest":5,"fragment":15,"guide":5,"telescope":1,"library":1,"shadow":5} · counts={"interactives":27,"catalogEntries":32,"chests":5,"fragments":15,"freeFragments":10,"chestFragments":5,"guides":5,"stations":2,"shadows":0,"shadowSlots":5,"markers":22} |
| R11b · Mundo: cofre con recompensa única | **PASS** | xp 6200→6210 · title="Cofre abierto" |
| R11c · Mundo: fragmento guardado | **PASS** | xp 6210→6215 |
| R11d · Mundo: guía completada | **PASS** | xp 6215→6220 |
| R11f · Mundo: telescopio y biblioteca abren su panel | **PASS** | telescopio="Telescopio del repaso" · acciones=["v2-world-close","v2-world-review-open","v2-world-close"] |
| R11g · Mundo: biblioteca de fichas abre su panel | **PASS** | biblioteca="Biblioteca de fichas" · body=Las flashcard se desbloquean al guardar fragmentos. Este lector es local: no usa red ni servicios externos.  2 de 15 fichas 10 fragmentos en |
| R11e · Mundo interactivo persiste tras recargar | **PASS** | chests=1 fragments=2 guides=1 |
| R11h · Culling del atrio con todas las misiones completas | **PASS** | misiones={"done":18,"total":18,"areas":5} · all=true · targets=16 · visibles=7 · ocultos=9 · drawsSaved=22 (71%) · vegetación={"total":90,"drawn":28} · polvo={"total":80,"drawn":44} |
| R12 · Importar partida 1.2 y añadir v2.world vacío | **PASS** | preview=Offline QA · xp=1640 coins=2510 errors=3 |
| R12b · Importación 1.2 persiste tras recargar | **PASS** | xp=1640 coins=2510 |
| R13a · Exportar partida nueva (JSON) conserva progreso | **PASS** | vía=download · xp=1640 coins=2510 · perfil=Offline QA |
| R13b · Reimportar el guardado nuevo conserva progreso | **PASS** | preview=Offline QA · xp=1640 coins=2510 |
| B07b · Contracción al atacar: empieza con el ataque, no en la pregunta siguiente | **FAIL** | [agent7-v21-final-duelo-contraccion-antes.png](agent7-v21-final-duelo-contraccion-antes.png) · [agent7-v21-final-duelo-contraccion-durante.png](agent7-v21-final-duelo-contraccion-durante.png) |
| B07 · Duelo en 8 vistas (390×844 … 1920×1080): 4 alternativas, HUD sin tapar, sin desbordes | **PASS** | vistas=8 · overflow=[] · opciones=[] · HUD=[] · 390x844:opts=4,hud=390x59,tap=0 844x390:opts=4,hud=844x59,tap=0 768x1024:opts=4,hud=768x73,tap=0 1024x768:opts=4,hud=1024x73,tap=0 820x1180:opts=4,hud=820x73,tap=0 960x540:opts=4,hud=960x59,tap=0 1280x720:opts=4,hud=1280x73,tap=0 1920x1080:opts=4,hud=1920x73,tap=0 |
| B08b · Arena + close-up de banderín/estandarte en las 5 arenas, con tela sobre el palo | **PASS** | [agent7-v21-final-estandarte-salud-publica.png](agent7-v21-final-estandarte-salud-publica.png) · [agent7-v21-final-estandarte-salud-publica-close.png](agent7-v21-final-estandarte-salud-publica-close.png) · [agent7-v21-final-estandarte-cuidado-integral.png](agent7-v21-final-estandarte-cuidado-integral.png) · [agent7-v21-final-estandarte-cuidado-integral-close.png](agent7-v21-final-estandarte-cuidado-integral-close.png) · [agent7-v21-final-estandarte-etica.png](agent7-v21-final-estandarte-etica.png) · [agent7-v21-final-estandarte-etica-close.png](agent7-v21-final-estandarte-etica-close.png) |
| F01 · FPS · Atrio en reposo | **PASS** | min=75 avg=75 muestras=19 <45=0 |
| F02 · FPS · Atrio con panel | **PASS** | min=75 avg=75 muestras=19 <45=0 |
| F03 · FPS · Mapa | **PASS** | min=75 avg=75 muestras=19 <45=0 |
| F04 · FPS · Duelo | **PASS** | min=75 avg=75 muestras=19 <45=0 |
| N01 · Cero peticiones de red no locales | **PASS** | 0 no locales de 170 · {"file":32,"data":138,"blob":0,"about":0,"chrome":0,"other":0} |
| N02 · Cero errores de consola/excepción | **PASS** | 0 errores ·  |
| N03 · V2._errors vacío | **PASS** | 0 errores V2 [] |
| B09 · Sin warnings de PCF en consola | **PASS** | PCF=0 · otras=10 ·  |
| N02b · Otras advertencias de consola (no bloqueantes) | **NOTE** | 10 advertencias Canvas2D getImageData inducidas por el muestreo de píxeles del propio arnés QA; el juego no emite warnings (PCF=0, export HTML warnings=0). |
| X01 · export/serums-quest.html por file://: mundo + cofre + 0 red/errores | **PASS** | stats={"built":true,"ready":true,"chests":0} · coins 999→1004 · noLocales=0 · errores=0 · warnings=0 |
| X02 · index.html redirige a dist/index.html | **PASS** | {"href":"file:///C:/Users/USARIO/Documents/ZARCONT%20SERUMS/serums-quest/dist/index.html","path":"/C:/Users/USARIO/Documents/ZARCONT%20SERUMS/serums-quest/dist/index.html","title":"SERUMS QUEST","game":true} · errores=0 · noLocales=0 |
| N04 · dist y export estables durante la pasada | **PASS** | bundle=c08f590d7972 · dist=c08f590d7972 · export=c08f590d7972 |
| B10 · No se pierde progreso ni guardado en la pasada (export/import/reload) | **PASS** | roundtrip={"exportMethod":"download","before":{"xp":1640,"coins":2510,"errors":3},"after":{"xp":1640,"coins":2510,"missions":0}} · integridad={"initialSeeded":{"xp":6200,"coins":999,"missions":18},"finalReimport":{"xp":1640,"coins":2510,"missions":0},"worldAfterReload":{"chests":{"total":5,"opened":1,"list":[{"id":"v2w-chest-salud-publica","areaId":"area-psi-salud-publica","x":-7.557,"z":-3.053,"opened":true,"openedAt":"2026-11-06T18:02:27.249Z","fragmentId":"v2w-frag-salud-publica-c","coins":5},{"id":"v2w-chest-cuidado-integral","areaId":"area-psi-cuidado-integral","x":0.569,"z":-8.13,"opened |
| B08d · Revisión visual antes/después · 10 héroes frontal, sin/con cosmético | **PASS** | [agent7-v21-compare-fronts.png](agent7-v21-compare-fronts.png) · [agent7-v21-compare-fronts-cosmeticos.png](agent7-v21-compare-fronts-cosmeticos.png) |
| B08e · Revisión visual del close-up: la tela nace en el palo (5/5 arenas) | **PASS** | [agent7-v21-final-contacto-estandartes-close.png](agent7-v21-final-contacto-estandartes-close.png) · [agent7-v21-final-estandarte-salud-publica-close.png](agent7-v21-final-estandarte-salud-publica-close.png) · [agent7-v21-final-estandarte-cuidado-integral-close.png](agent7-v21-final-estandarte-cuidado-integral-close.png) · [agent7-v21-final-estandarte-etica-close.png](agent7-v21-final-estandarte-etica-close.png) · [agent7-v21-final-estandarte-investigacion-close.png](agent7-v21-final-estandarte-investigacion-close.png) · [agent7-v21-final-estandarte-gestion-close.png](agent7-v21-final-estandar |

## Rendimiento

| Escena | Calidad | Mínimo | Medio | Muestras | <45 | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| hubIdle | alto | 75 | 75 | 19 | 0 | agent7-v21-qa.json → fps.hubIdle |
| hubPanel | alto | 75 | 75 | 19 | 0 | agent7-v21-qa.json → fps.hubPanel |
| map | alto | 75 | 75 | 19 | 0 | agent7-v21-qa.json → fps.map |
| duel | alto | 75 | 75 | 19 | 0 | agent7-v21-qa.json → fps.duel |

Muestras (`window.__gameState().fps` cada ~120 ms): hubIdle = [75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75] · hubPanel = [75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75] · map = [75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75] · duel = [75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75].

Objetivo: medio ≥ 55 y mínimo ≥ 45. GPU real del host (ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 (0x00002882) Direct3D11 vs_5_0 ps_5_0, D3D11)), 1280×720 y DPR 1.

## V2.1 · estado de las funciones pedidas

```json
{
  "summaryApi": true,
  "duelApi": true,
  "perfApi": true,
  "feedbackApi": {
    "onAnswer": true,
    "hide": true,
    "isOpen": true,
    "update": true,
    "settingsHTML": true,
    "mountSettings": true,
    "inlineEnabled": true,
    "autoAdvanceDelay": true,
    "isEndMode": true,
    "feedbackMode": true,
    "mixMissionQuestions": true
  },
  "settingsFeedbackMode": "end",
  "settingsOnlyOriginalBank": false,
  "titleVersion": "V2.1 · Correcciones",
  "version": "2.0.0-checkpoint1",
  "settingsControls": {
    "text": "AJUSTES DEL OBSERVATORIO\nQue la ruta se adapte a ti.\n\nAudio, efectos y accesibilidad. Nada de esto altera preguntas, claves ni recompensas.\n\nAUDIO\nSonido y ambiente\nEfectos de sonido\nRespuestas, impactos y transiciones.\nAmbiente del observatorio\nPad sintetizado de baja intensidad.\nSilencio total\nSilencia efectos y ambiente sin perder tus preferencias.\n\nEl audio empieza apagado. Actívalo aquí o con el icono de sonido; el volumen se guarda para la próxima sesión.\n\nVolumen\nSe aplica a efectos y ambiente.\n70%\nExportar partida\nImportar\nACCESIBILIDAD\nMovimiento y lectura\nReducir movimiento\nDesactiva animaciones y transiciones decorativas.\nTiempo extra en Contrarreloj\nAmplía un 25 % el límite de la sesión. No cambia las preguntas ni el porcentaje de aprobación.\nCalidad de efectos\nMenos partículas = más fluidez en equipos modestos.\nBaja\nMedia\nAlta\n\nBaja 1×, sin sombras y menos partículas. Media 1,5×, sombras suaves y equilibrio. Alta 2×, sombras y efectos completos.\n\nTamaño del texto\nAmplía la lectura de preguntas, paneles y ayudas.\nNormal\nGrande\nAlto contraste\nRefuerza texto secundario, bordes y separación de paneles.\nRecordatorio semanal de respaldo\nUn aviso neutral si llevas días sin exportar. Puedes silenciarlo.\nMarcos holográficos 3D\nOculta los aros flotantes; el marco del retrato se conserva.\n\nContraste alto, foco visible y controles por teclado. En móvil, arrastra y usa los botones táctiles. Los colores de rareza no son la única señal: cada estado lleva texto.\n\nMEZCLA DE FUENTES\nDe dónde salen tus preguntas\n\nLas misiones, los modos y la práctica reparten sus preguntas entre las tres fuentes con estos pesos. Al iniciar la sesión se normalizan a 100 %; si una fuente no tiene preguntas, su parte se reparte entre las demás. El Desafío diario conserva su pregunta de repaso.\n\nCampaña\nMisiones y duelos de la ruta original.\n111 PREGUNTAS\n60 %\nFichas del dashboard\nPreguntas del panel de estudio.\n210 PREGUNTAS\n15 %\nFlashcards\nTarjetas del mazo de repaso.\n630 PREGUNTAS\n25 %\nMezcla normalizada\n100 %\nRestablecer 60 / 15 / 25\n\nSolo cambia la procedencia de las preguntas. XP, monedas, repaso espaciado y el tope diario de 120 monedas no se tocan. El cambio se aplica a la próxima sesión; una sesión en curso mantiene sus preguntas.\n\nFEEDBACK DE RESPUESTA\nCuándo quieres ver la corrección\n\nDespués de cada respuesta la clave se aprende mejor en el resumen final. Elige si quieres la explicación completa entre preguntas o solo al cerrar el nivel. En los dos modos se conserva el ataque del héroe o del guardián, el sonido y la clave al final del Simulacro.\n\nAl final del nivel (por defecto)\nEntre preguntas no se abre ninguna pantalla: ves el combate y un destello breve, y sigues en menos de un segundo.\nTras cada pregunta\nAbre la ficha de corrección después de cada respuesta y espera a que pulses Continuar. El reloj de la sesión se detiene mientras está abierta.\n\nEn el resumen final, los fallos aparecen primero con tu respuesta, la clave y la explicación. Los errores siguen entrando al repaso espaciado con las mismas reglas; este ajuste no cambia recompensas, monedas ni el tope diario.\n\nRENDIMIENTO Y BANCO\nAtrio ligero, banco original\n\nLa decoración del atrio se recorta por distancia y calidad; con todas las misiones completadas se vuelve más discreta. Cofres, guías, fragmentos, estaciones y sombras del error se conservan siempre.\n\nUsar solo preguntas del banco original\nExcluye las fichas de Study Dashboard y las tarjetas de Study Flashcards. Se aplica a la próxima sesión; una sesión en curso conserva sus preguntas.\nCAMPAÑA\n111\nDASHBOARD\n210\nFLASHCARDS\n630\nACTIVAS\n951\nPREGUNTAS ACTIVAS\n951\nSOMBRAS\nPCFShadowMap\nATRIO\n16 props · en pausa\nDIBUJOS AHORRADOS\n0\nRevisar banco\n\nEl filtro y el recorte no alteran XP, monedas, recompensas ni el contenido de las preguntas.\n\nDATOS\nProgreso local\n\nTu partida vive solo en este navegador. Exporta un respaldo nuevo (JSON con vista previa al importar) o importa la partida antigua. También puedes guardar una copia local para recuperación.\n\nExportar partida\nImportar partida\nGuardar copia local\nReiniciar progreso\nAyuda\nRepetir tutorial\nCréditos y licencias\nV2.1 · Correcciones · compilado el 2026-11-06 · sin conexión y sin cuentas\nVolver",
    "actions": [
      "open-pause",
      "open-heroes",
      "open-review",
      "open-map",
      "open-journal",
      "open-wardrobe",
      "open-shop",
      "toggle-sound",
      "open-mission",
      "close-settings",
      "toggle-ambient",
      "toggle-muted",
      "export-save",
      "open-import",
      "toggle-reduced-motion",
      "toggle-extra-time",
      "set-effects-quality",
      "set-text-scale",
      "toggle-contrast",
      "toggle-backup-reminder",
      "toggle-3d-frames",
      "v2-weights-reset",
      "v2-feedback-mode",
      "v2-perf-original-bank",
      "v2-perf-bank-audit",
      "save-local-backup",
      "reset-progress",
      "open-help",
      "open-tutorial",
      "open-credits",
      "v2-world-close"
    ],
    "buttons": [
      "◈SERUMSObservatorio",
      "Noa IturbeNv 11Bachiller6.200 XP",
      "0",
      "Mapa",
      "Abrir la misión",
      "Volumen\nSe aplica a efectos y ambiente.\n70%",
      "Exportar partida",
      "Importar",
      "Baja",
      "Media",
      "Alta",
      "Normal",
      "Grande",
      "Restablecer 60 / 15 / 25",
      "Al final del nivel (por defecto)\nEntre preguntas no se abre ninguna pantalla: ves el combate y un destello breve, y sigues en menos de un segundo.",
      "Tras cada pregunta\nAbre la ficha de corrección después de cada respuesta y espera a que pulses Continuar. El reloj de la sesión se detiene mientras está abierta.",
      "Revisar banco",
      "Exportar partida",
      "Importar partida",
      "Guardar copia local",
      "Reiniciar progreso",
      "Ayuda",
      "Repetir tutorial",
      "Créditos y licencias",
      "Volver",
      "Mapa",
      "Pausa",
      "E",
      "×"
    ],
    "hasFeedbackSettings": true,
    "hasPerfSettings": true,
    "lowText": true,
    "eachText": true,
    "endText": true,
    "feedbackMode": "end",
    "settingsFeedbackMode": "end",
    "onlyOriginalBank": false
  }
}
```

## Capturas y medidas

- blink: 63 · banners: 5

| Vista | Captura | scrollW | screenW | overflow | opciones visibles | HUD | tapado | rotatePrompt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 390x844 | [agent7-v21-final-duelo-390x844.png](agent7-v21-final-duelo-390x844.png) | 390 | 390 | 0 | 4/4 | 390×59 | 0 | false |
| 844x390 | [agent7-v21-final-duelo-844x390.png](agent7-v21-final-duelo-844x390.png) | 844 | 844 | 0 | 4/4 | 844×59 | 0 | false |
| 768x1024 | [agent7-v21-final-duelo-768x1024.png](agent7-v21-final-duelo-768x1024.png) | 768 | 768 | 0 | 4/4 | 768×73 | 0 | false |
| 1024x768 | [agent7-v21-final-duelo-1024x768.png](agent7-v21-final-duelo-1024x768.png) | 1024 | 1024 | 0 | 4/4 | 1024×73 | 0 | false |
| 820x1180 | [agent7-v21-final-duelo-820x1180.png](agent7-v21-final-duelo-820x1180.png) | 820 | 820 | 0 | 4/4 | 820×73 | 0 | false |
| 960x540 | [agent7-v21-final-duelo-960x540.png](agent7-v21-final-duelo-960x540.png) | 960 | 960 | 0 | 4/4 | 960×59 | 0 | false |
| 1280x720 | [agent7-v21-final-duelo-1280x720.png](agent7-v21-final-duelo-1280x720.png) | 1280 | 1280 | 0 | 4/4 | 1280×73 | 0 | false |
| 1920x1080 | [agent7-v21-final-duelo-1920x1080.png](agent7-v21-final-duelo-1920x1080.png) | 1920 | 1920 | 0 | 4/4 | 1920×73 | 0 | false |

## Red y errores

- Peticiones totales: 170; no locales (http/https/ws): 0.
- Esquemas: {"file":32,"data":138,"blob":0,"about":0,"chrome":0,"other":0}
- Errores de consola/excepción: 0.
- Export HTML (file://): mundo=construido · no locales=0 · errores=0 · warnings=0.
- HUB index → dist/index.html: redirect=sí · juego=true · no locales=0 · errores=0.
- Advertencias de consola: 10 · `Canvas2D: Multiple readback operations using getImageData are faster with the willReadFrequently attribute set to true. See: https://html.spec.whatwg.org/multipage/canvas.html#concept-canvas-will-read-frequently`

## Guardado y progreso

```json
{
  "roundTrip": {
    "exportMethod": "download",
    "before": {
      "xp": 1640,
      "coins": 2510,
      "errors": 3
    },
    "after": {
      "xp": 1640,
      "coins": 2510,
      "missions": 0
    }
  },
  "integrity": {
    "initialSeeded": {
      "xp": 6200,
      "coins": 999,
      "missions": 18
    },
    "finalReimport": {
      "xp": 1640,
      "coins": 2510,
      "missions": 0
    },
    "worldAfterReload": {
      "chests": {
        "total": 5,
        "opened": 1,
        "list": [
          {
            "id": "v2w-chest-salud-publica",
            "areaId": "area-psi-salud-publica",
            "x": -7.557,
            "z": -3.053,
            "opened": true,
            "openedAt": "2026-11-06T18:02:27.249Z",
            "fragmentId": "v2w-frag-salud-publica-c",
            "coins": 5
          },
          {
            "id": "v2w-chest-cuidado-integral",
            "areaId": "area-psi-cuidado-integral",
            "x": 0.569,
            "z": -8.13,
            "opened": false,
            "openedAt": null,
            "fragmentId": "v2w-frag-cuidado-integral-c",
            "coins": null
          },
          {
            "id": "v2w-chest-etica",
            "areaId": "area-psi-etica",
            "x": 7.908,
            "z": -1.972,
            "opened": false,
            "openedAt": null,
            "fragmentId": "v2w-frag-etica-c",
            "coins": null
          },
          {
            "id": "v2w-chest-investigacion",
            "areaId": "area-psi-investigacion",
            "x": 4.319,
            "z": 6.912,
            "opened": false,
            "openedAt": null,
            "fragmentId": "v2w-frag-investigacion-c",
            "coins": null
          },
          {
            "id": "v2w-chest-gestion",
            "areaId": "area-psi-gestion",
            "x": -5.239,
            "z": 6.243,
            "opened": false,
            "openedAt": null,
            "fragmentId": "v2w-frag-gestion-c",
            "coins": null
          }
        ]
      },
      "fragments": {
        "total": 15,
        "collected": 2,
        "freeTotal": 10,
        "freeCollected": 1,
        "chestTotal": 5,
        "chestCollected": 1,
        "list": [
          {
            "id": "v2w-frag-salud-publica-1",
            "areaId": "area-psi-salud-publica",
            "slot": "free",
            "title": "Las cinco estrategias de Ottawa",
            "questionId": "v2-fc-card-ottawa-01-2",
            "collected": true,
            "collectedAt": "2026-11-06T18:02:28.972Z",
            "flashcardId": "card-ottawa-01-2",
            "x": -3.392,
            "z": -2.12
          },
          {
            "id": "v2w-frag-salud-publica-2",
            "areaId": "area-psi-salud-publica",
            "slot": "free",
            "title": "Escenarios de promoción",
            "questionId": "v2-fc-card-modelo-sujetos-01-2",
            "collected": false,
            "collectedAt": null,
            "flashcardId": "card-modelo-sujetos-01-2",
            "x": -5.147,
            "z": -0.18
          },
          {
            "id": "v2w-frag-salud-publica-c",
            "areaId": "area-psi-salud-publica",
            "slot": "chest",
            "title": "Agua segura y coliformes",
            "questionId": "v2-fc-card-agua-01-2",
            "collected": true,
            "collectedAt": "2026-11-06T18:02:27.250Z",
            "flashcardId": "card-agua-01-2",
            "x": null,
            "z": null
          },
          {
            "id": "v2w-frag-cuidado-integral-1",
            "areaId": "area-psi-cuidado-integral",
            "slot": "free",
            "title": "Longitudinalidad en APS",
            "questionId": "v2-fc-card-aps-01-2",
            "collected": false,
            "collectedAt": null,
            "flashcardId": "card-aps-01-2",
            "x": 0.968,
            "z": -3.881
          },
          {
            "id": "v2w-frag-cuidado-integral-2",
            "areaId": "area-psi-cuidado-integral",
            "slot": "free",
            "title": "Captación en cualquier contacto",
            "questionId": "v2-fc-card-adulto-01-2",
            "collected": false,
            "collectedAt": null,
            "flashcardId": "card-adulto-01-2",
            "x": -1.42,
            "z": -4.95
          },
          {
            "id": "v2w-frag-cuidado-integral-c",
            "areaId": "area-psi-cuidado-integral",
            "slot": "chest",
            "title": "Adolescente que acude solo",
            "questionId": "v2-fc-card-adolescente-01-2",
            "collected": false,
            "collectedAt": null,
            "flashcardId": "card-adolescente-01-2",
            "x": null,
            "z": null
          },
          {
            "id": "v2w-frag-etica-1",
            "areaId": "area-psi-etica",
            "slot": "free",
            "title": "Consentimiento informado, no solo una firma",
            "questionId": "v2-fc-card-psi-et-1-3-2",
            "collected": false,
            "collectedAt": null,
            "flashcardId": "card-psi-et-1-3-2",
            "x": 3.99,
            "z": -0.279
          },
          {
            "id": "v2w-frag-etica-2",
            "areaId": "area-psi-etica",
            "slot": "free",
            "title": "Intérprete competente y privacidad",
            "questionId": "v2-fc-card-psi-et-2-1-2",
            "collected": false,
            "collectedAt": null,
            "flashcardId": "card-psi-et-2-1-2",
            "x": 4.269,
            "z": -2.88
          },
          {
            "id": "v2w-frag-etica-c",
            "areaId": "area-psi-etica",
            "slot": "chest",
            "title": "Confidencialidad frente a terceros",
            "questionId": "v2-fc-card-psi-et-1-1-2",
            "collected": false,
            "collectedAt": null,
            "flashcardId": "card-psi-et-1-1-2",
            "x": null,
            "z": null
          },
          {
            "id": "v2w-frag-investigacion-1",
            "areaId": "area-psi-investigacion",
            "slot": "free",
            "title": "Escalas: ordinal, intervalo y razón",
            "questionId": "v2-fc-card-psi-in-1-1-2",
            "collected": false,
            "collectedAt": null,
            "flashcardId": "card-psi-in-1-1-2",
            "x": 1.499,
            "z": 3.709
          },
          {
            "id": "v2w-frag-investigacion-2",
            "areaId": "area-psi-investigacion",
            "slot": "free",
            "title": "Alfa de Cronbach y validez de contenido",
            "questionId": "v2-fc-card-psi-in-2-1-2",
            "collected": false,
            "collectedAt": null,
            "flashcardId": "card-psi-in-2-1-2",
            "x": 4.058,
            "z": 3.171
          },
          {
            "id": "v2w-frag-investigacion-c",
            "areaId": "area-psi-investigacion",
            "slot": "chest",
            "title": "Criterios de autoría",
            "questionId": "v2-fc-card-psi-in-3-2-2",
            "collected": false,
            "collectedAt": null,
            "flashcardId": "card-psi-in-3-2-2",
            "x": null,
            "z": null
          },
          {
            "id": "v2w-frag-gestion-1",
            "areaId": "area-psi-gestion",
            "slot": "free",
            "title": "Amenazas del entorno en el FODA",
            "questionId": "v2-fc-card-psi-ge-1-2-2",
            "collected": false,
            "collectedAt": null,
            "flashcardId": "card-psi-ge-1-2-2",
            "x": -3.064,
            "z": 2.571
          },
          {
            "id": "v2w-frag-gestion-2",
            "areaId": "area-psi-gestion",
            "slot": "free",
            "title": "Redes integradas de salud",
            "questionId": "v2-fc-card-psi-ge-2-6-2",
            "collected": false,
            "collectedAt": null,
            "flashcardId": "card-psi-ge-2-6-2",
            "x": -1.76
```

## Problemas

- **[high · v21]** La contracción del duelo no empieza al atacar (se difiere al siguiente render/pregunta) — {"startMs":948,"idxDuring":1,"endMs":1631,"shrunk":true,"beforePanel":{"w":472,"h":338,"y":372},"during":{"w":472,"h":52,"y":659}}

## Capturas

- [agent7-v21-final-titulo-version.png](agent7-v21-final-titulo-version.png)
- [agent7-v21-final-mapa.png](agent7-v21-final-mapa.png)
- [agent7-v21-final-selector-heroes.png](agent7-v21-final-selector-heroes.png)
- [agent7-v21-final-parpadeo-ilan-a.png](agent7-v21-final-parpadeo-ilan-a.png)
- [agent7-v21-final-parpadeo-ilan-b.png](agent7-v21-final-parpadeo-ilan-b.png)
- [agent7-v21-final-parpadeo-ilan-c.png](agent7-v21-final-parpadeo-ilan-c.png)
- [agent7-v21-final-parpadeo-mara-a.png](agent7-v21-final-parpadeo-mara-a.png)
- [agent7-v21-final-parpadeo-mara-b.png](agent7-v21-final-parpadeo-mara-b.png)
- [agent7-v21-final-parpadeo-mara-c.png](agent7-v21-final-parpadeo-mara-c.png)
- [agent7-v21-final-parpadeo-noa-a.png](agent7-v21-final-parpadeo-noa-a.png)
- [agent7-v21-final-parpadeo-noa-b.png](agent7-v21-final-parpadeo-noa-b.png)
- [agent7-v21-final-parpadeo-noa-c.png](agent7-v21-final-parpadeo-noa-c.png)
- [agent7-v21-final-parpadeo-teo-a.png](agent7-v21-final-parpadeo-teo-a.png)
- [agent7-v21-final-parpadeo-teo-b.png](agent7-v21-final-parpadeo-teo-b.png)
- [agent7-v21-final-parpadeo-teo-c.png](agent7-v21-final-parpadeo-teo-c.png)
- [agent7-v21-final-parpadeo-lia-a.png](agent7-v21-final-parpadeo-lia-a.png)
- [agent7-v21-final-parpadeo-lia-b.png](agent7-v21-final-parpadeo-lia-b.png)
- [agent7-v21-final-parpadeo-lia-c.png](agent7-v21-final-parpadeo-lia-c.png)
- [agent7-v21-final-parpadeo-kian-a.png](agent7-v21-final-parpadeo-kian-a.png)
- [agent7-v21-final-parpadeo-kian-b.png](agent7-v21-final-parpadeo-kian-b.png)
- [agent7-v21-final-parpadeo-kian-c.png](agent7-v21-final-parpadeo-kian-c.png)
- [agent7-v21-final-parpadeo-amaru-a.png](agent7-v21-final-parpadeo-amaru-a.png)
- [agent7-v21-final-parpadeo-amaru-b.png](agent7-v21-final-parpadeo-amaru-b.png)
- [agent7-v21-final-parpadeo-amaru-c.png](agent7-v21-final-parpadeo-amaru-c.png)
- [agent7-v21-final-parpadeo-ona-a.png](agent7-v21-final-parpadeo-ona-a.png)
- [agent7-v21-final-parpadeo-ona-b.png](agent7-v21-final-parpadeo-ona-b.png)
- [agent7-v21-final-parpadeo-ona-c.png](agent7-v21-final-parpadeo-ona-c.png)
- [agent7-v21-final-parpadeo-iris-a.png](agent7-v21-final-parpadeo-iris-a.png)
- [agent7-v21-final-parpadeo-iris-b.png](agent7-v21-final-parpadeo-iris-b.png)
- [agent7-v21-final-parpadeo-iris-c.png](agent7-v21-final-parpadeo-iris-c.png)
- [agent7-v21-final-parpadeo-zenon-a.png](agent7-v21-final-parpadeo-zenon-a.png)
- [agent7-v21-final-parpadeo-zenon-b.png](agent7-v21-final-parpadeo-zenon-b.png)
- [agent7-v21-final-parpadeo-zenon-c.png](agent7-v21-final-parpadeo-zenon-c.png)
- [agent7-v21-final-parpadeo-cosmetico-ilan-a.png](agent7-v21-final-parpadeo-cosmetico-ilan-a.png)
- [agent7-v21-final-parpadeo-cosmetico-ilan-b.png](agent7-v21-final-parpadeo-cosmetico-ilan-b.png)
- [agent7-v21-final-parpadeo-cosmetico-ilan-c.png](agent7-v21-final-parpadeo-cosmetico-ilan-c.png)
- [agent7-v21-final-parpadeo-cosmetico-mara-a.png](agent7-v21-final-parpadeo-cosmetico-mara-a.png)
- [agent7-v21-final-parpadeo-cosmetico-mara-b.png](agent7-v21-final-parpadeo-cosmetico-mara-b.png)
- [agent7-v21-final-parpadeo-cosmetico-mara-c.png](agent7-v21-final-parpadeo-cosmetico-mara-c.png)
- [agent7-v21-final-parpadeo-cosmetico-noa-a.png](agent7-v21-final-parpadeo-cosmetico-noa-a.png)
- [agent7-v21-final-parpadeo-cosmetico-noa-b.png](agent7-v21-final-parpadeo-cosmetico-noa-b.png)
- [agent7-v21-final-parpadeo-cosmetico-noa-c.png](agent7-v21-final-parpadeo-cosmetico-noa-c.png)
- [agent7-v21-final-parpadeo-cosmetico-teo-a.png](agent7-v21-final-parpadeo-cosmetico-teo-a.png)
- [agent7-v21-final-parpadeo-cosmetico-teo-b.png](agent7-v21-final-parpadeo-cosmetico-teo-b.png)
- [agent7-v21-final-parpadeo-cosmetico-teo-c.png](agent7-v21-final-parpadeo-cosmetico-teo-c.png)
- [agent7-v21-final-parpadeo-cosmetico-lia-a.png](agent7-v21-final-parpadeo-cosmetico-lia-a.png)
- [agent7-v21-final-parpadeo-cosmetico-lia-b.png](agent7-v21-final-parpadeo-cosmetico-lia-b.png)
- [agent7-v21-final-parpadeo-cosmetico-lia-c.png](agent7-v21-final-parpadeo-cosmetico-lia-c.png)
- [agent7-v21-final-parpadeo-cosmetico-kian-a.png](agent7-v21-final-parpadeo-cosmetico-kian-a.png)
- [agent7-v21-final-parpadeo-cosmetico-kian-b.png](agent7-v21-final-parpadeo-cosmetico-kian-b.png)
- [agent7-v21-final-parpadeo-cosmetico-kian-c.png](agent7-v21-final-parpadeo-cosmetico-kian-c.png)
- [agent7-v21-final-parpadeo-cosmetico-amaru-a.png](agent7-v21-final-parpadeo-cosmetico-amaru-a.png)
- [agent7-v21-final-parpadeo-cosmetico-amaru-b.png](agent7-v21-final-parpadeo-cosmetico-amaru-b.png)
- [agent7-v21-final-parpadeo-cosmetico-amaru-c.png](agent7-v21-final-parpadeo-cosmetico-amaru-c.png)
- [agent7-v21-final-parpadeo-cosmetico-ona-a.png](agent7-v21-final-parpadeo-cosmetico-ona-a.png)
- [agent7-v21-final-parpadeo-cosmetico-ona-b.png](agent7-v21-final-parpadeo-cosmetico-ona-b.png)
- [agent7-v21-final-parpadeo-cosmetico-ona-c.png](agent7-v21-final-parpadeo-cosmetico-ona-c.png)
- [agent7-v21-final-parpadeo-cosmetico-iris-a.png](agent7-v21-final-parpadeo-cosmetico-iris-a.png)
- [agent7-v21-final-parpadeo-cosmetico-iris-b.png](agent7-v21-final-parpadeo-cosmetico-iris-b.png)
- [agent7-v21-final-parpadeo-cosmetico-iris-c.png](agent7-v21-final-parpadeo-cosmetico-iris-c.png)
- [agent7-v21-final-parpadeo-cosmetico-zenon-a.png](agent7-v21-final-parpadeo-cosmetico-zenon-a.png)
- [agent7-v21-final-parpadeo-cosmetico-zenon-b.png](agent7-v21-final-parpadeo-cosmetico-zenon-b.png)
- [agent7-v21-final-parpadeo-cosmetico-zenon-c.png](agent7-v21-final-parpadeo-cosmetico-zenon-c.png)
- [agent7-v21-final-parpadeo-ranura-ilan.png](agent7-v21-final-parpadeo-ranura-ilan.png)
- [agent7-v21-final-parpadeo-ranura-teo.png](agent7-v21-final-parpadeo-ranura-teo.png)
- [agent7-v21-final-parpadeo-ranura-zenon.png](agent7-v21-final-parpadeo-ranura-zenon.png)
- [agent7-v21-final-ajustes.png](agent7-v21-final-ajustes.png)
- [agent7-v21-final-modos.png](agent7-v21-final-modos.png)
- [agent7-v21-final-practica-pregunta.png](agent7-v21-final-practica-pregunta.png)
- [agent7-v21-final-practica-resultado.png](agent7-v21-final-practica-resultado.png)
- [agent7-v21-final-modo-daily.png](agent7-v21-final-modo-daily.png)
- [agent7-v21-final-modo-survival.png](agent7-v21-final-modo-survival.png)
- [agent7-v21-final-modo-timed.png](agent7-v21-final-modo-timed.png)
- [agent7-v21-final-modo-simulacro.png](agent7-v21-final-modo-simulacro.png)
- [agent7-v21-final-resumen-mision.png](agent7-v21-final-resumen-mision.png)
- [agent7-v21-final-resumen-filtro-errores.png](agent7-v21-final-resumen-filtro-errores.png)
- [agent7-v21-final-resumen-dificil.png](agent7-v21-final-resumen-dificil.png)
- [agent7-v21-final-resumen-flashcard.png](agent7-v21-final-resumen-flashcard.png)
- [agent7-v21-final-resumen-960x540.png](agent7-v21-final-resumen-960x540.png)
- [agent7-v21-final-resumen-390x844.png](agent7-v21-final-resumen-390x844.png)
- [agent7-v21-final-etiqueta-generada.png](agent7-v21-final-etiqueta-generada.png)
- [agent7-v21-final-restauracion-fixture-low.png](agent7-v21-final-restauracion-fixture-low.png)
- [agent7-v21-final-restauracion-alta.png](agent7-v21-final-restauracion-alta.png)
- [agent7-v21-final-restauracion-tras-degradar-calculo.png](agent7-v21-final-restauracion-tras-degradar-calculo.png)
- [agent7-v21-final-repaso.png](agent7-v21-final-repaso.png)
- [agent7-v21-final-repaso-resultado.png](agent7-v21-final-repaso-resultado.png)
- [agent7-v21-final-tienda.png](agent7-v21-final-tienda.png)
- [agent7-v21-final-inventario.png](agent7-v21-final-inventario.png)
- [agent7-v21-final-selector-elegido.png](agent7-v21-final-selector-elegido.png)
- [agent7-v21-final-atrio-mundo.png](agent7-v21-final-atrio-mundo.png)
- [agent7-v21-final-mundo-cofre-cerrado.png](agent7-v21-final-mundo-cofre-cerrado.png)
- [agent7-v21-final-mundo-cofre-abierto.png](agent7-v21-final-mundo-cofre-abierto.png)
- [agent7-v21-final-mundo-fragmento.png](agent7-v21-final-mundo-fragmento.png)
- [agent7-v21-final-mundo-guia.png](agent7-v21-final-mundo-guia.png)
- [agent7-v21-final-mundo-telescopio.png](agent7-v21-final-mundo-telescopio.png)
- [agent7-v21-final-mundo-biblioteca.png](agent7-v21-final-mundo-biblioteca.png)
- [agent7-v21-final-atrio-culling-todas-misiones.png](agent7-v21-final-atrio-culling-todas-misiones.png)
- [agent7-v21-final-importar-1-2.png](agent7-v21-final-importar-1-2.png)
- [agent7-v21-final-importar-nuevo.png](agent7-v21-final-importar-nuevo.png)
- [agent7-v21-final-duelo-390x844.png](agent7-v21-final-duelo-390x844.png)
- [agent7-v21-final-duelo-844x390.png](agent7-v21-final-duelo-844x390.png)
- [agent7-v21-final-duelo-768x1024.png](agent7-v21-final-duelo-768x1024.png)
- [agent7-v21-final-duelo-1024x768.png](agent7-v21-final-duelo-1024x768.png)
- [agent7-v21-final-duelo-820x1180.png](agent7-v21-final-duelo-820x1180.png)
- [agent7-v21-final-duelo-960x540.png](agent7-v21-final-duelo-960x540.png)
- [agent7-v21-final-duelo-1280x720.png](agent7-v21-final-duelo-1280x720.png)
- [agent7-v21-final-duelo-1920x1080.png](agent7-v21-final-duelo-1920x1080.png)
- [agent7-v21-final-duelo-contraccion-antes.png](agent7-v21-final-duelo-contraccion-antes.png)
- [agent7-v21-final-duelo-contraccion-durante.png](agent7-v21-final-duelo-contraccion-durante.png)
- [agent7-v21-final-estandarte-salud-publica.png](agent7-v21-final-estandarte-salud-publica.png)
- [agent7-v21-final-estandarte-salud-publica-close.png](agent7-v21-final-estandarte-salud-publica-close.png)
- [agent7-v21-final-estandarte-cuidado-integral.png](agent7-v21-final-estandarte-cuidado-integral.png)
- [agent7-v21-final-estandarte-cuidado-integral-close.png](agent7-v21-final-estandarte-cuidado-integral-close.png)
- [agent7-v21-final-estandarte-etica.png](agent7-v21-final-estandarte-etica.png)
- [agent7-v21-final-estandarte-etica-close.png](agent7-v21-final-estandarte-etica-close.png)
- [agent7-v21-final-estandarte-investigacion.png](agent7-v21-final-estandarte-investigacion.png)
- [agent7-v21-final-estandarte-investigacion-close.png](agent7-v21-final-estandarte-investigacion-close.png)
- [agent7-v21-final-estandarte-gestion.png](agent7-v21-final-estandarte-gestion.png)
- [agent7-v21-final-estandarte-gestion-close.png](agent7-v21-final-estandarte-gestion-close.png)
- [agent7-v21-final-export-html.png](agent7-v21-final-export-html.png)
- [agent7-v21-final-hub-link.png](agent7-v21-final-hub-link.png)
- [agent7-v21-final-contacto-parpadeo.png](agent7-v21-final-contacto-parpadeo.png)
- [agent7-v21-final-contacto-parpadeo-cosmeticos.png](agent7-v21-final-contacto-parpadeo-cosmeticos.png)
- [agent7-v21-final-contacto-estandartes.png](agent7-v21-final-contacto-estandartes.png)
- [agent7-v21-final-contacto-estandartes-close.png](agent7-v21-final-contacto-estandartes-close.png)
- [agent7-v21-compare-fronts.png](agent7-v21-compare-fronts.png)
- [agent7-v21-compare-fronts-cosmeticos.png](agent7-v21-compare-fronts-cosmeticos.png)

## Cierre

Hay casos FAIL/BLOCKED: revisar arriba; no se presentan como PASS.

_Informe generado por `agent7-v21-qa.js`. No se modificó el juego._