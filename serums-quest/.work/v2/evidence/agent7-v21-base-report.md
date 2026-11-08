# SERUMS QUEST · V2.1 · Informe QA Agente 7 · pasada base (V2.0)

- **Modo:** base · build esperado base `b32f14899538`
- **Inicio/fin:** 2026-11-06T17:09:12.216Z → 2026-11-06T17:14:37.617Z · 325 s
- **bundle evaluado:** `C:\Users\USARIO\Documents\ZARCONT SERUMS\serums-quest\export\serums-quest.html` · `b32f14899538c979b8a3317bb94feb91704f80b338115289a4dabe94567ca048` · 3173871 B · mtime 2026-11-06T15:13:28.289Z
- **dist/index.html:** `2ada70f60658aef47afbad0b83c1dcce38ba4e4e6d17ce2c7a1dad825f3defed` · 3365008 B
- **export/serums-quest.html:** `b32f14899538c979b8a3317bb94feb91704f80b338115289a4dabe94567ca048` · 3173871 B · igual al dist: NO · dist ya no es el build base (V2.1 en integración); se usa export/serums-quest.html, que conserva V2.0 b32f14899538
- **Entorno:** Chrome/156.0.8078.80 (@fb096c0011f9d50f0a264a9376420cdea9c421e3) · GPU: ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 (0x00002882) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1280×720 · DPR 1
- **Resultado:** 42 PASS · 0 FAIL · 0 BLOCKED · 0 SKIP · 11 NOTE (de 53 casos)
- **Red principal:** 0 no locales de 134 · **Errores:** 0 · **V2._errors:** 0

## Casos

| Caso | Resultado | Evidencia |
| --- | --- | --- |
| ART01 · Artefacto base/final: tamaño, hash y buildId | **PASS** | bundle=serums-quest.html 3173871 B/b32f14899538c979b8a3 · dist=3365008 B/2ada70f60658 · export=3173871 B/b32f14899538 · dist ya no es el build base (V2.1 en integración); se usa export/serums-quest.html, que conserva V2.0 b32f14899538 |
| ART03 · dist fue reconstruido a V2.1 durante la ventana de QA base | **NOTE** | dist actual=2ada70f60658 · base evaluada=b32f14899538 (serums-quest.html) |
| ART02 · Enlace del HUB (serums-quest/index.html → dist/index.html) | **PASS** | target dist/index.html presente |
| ENV01 · Chrome headless, perfil limpio y GPU | **PASS** | Chrome/156.0.8078.80 (@fb096c0011f9d50f0a264a9376420cdea9c421e3) · ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 (0x00002882) Direct3D11 vs_5_0 ps_5_0, D3D11) · DPR 1 · 1280×720 |
| V01 · Título y versión visible | **PASS** | titleVersion="V2 · Final" · document.title="SERUMS QUEST" · V2.version=2.0.0-checkpoint1 |
| R01 · Menú de título completo | **PASS** | ["open-map","enter-arena","open-modes","open-wardrobe","open-shop","open-journal","open-settings","open-import"] |
| R02 · Mapa con 5 islas | **PASS** | ["area-psi-salud-publica","area-psi-cuidado-integral","area-psi-etica","area-psi-investigacion","area-psi-gestion"] |
| B08a · Capturas base de parpadeo (10 héroes × 3 ángulos + ranura de cabeza) | **PASS** | [agent7-v21-base-parpadeo-ilan-a.png](agent7-v21-base-parpadeo-ilan-a.png) · [agent7-v21-base-parpadeo-ilan-b.png](agent7-v21-base-parpadeo-ilan-b.png) · [agent7-v21-base-parpadeo-ilan-c.png](agent7-v21-base-parpadeo-ilan-c.png) · [agent7-v21-base-parpadeo-mara-a.png](agent7-v21-base-parpadeo-mara-a.png) · [agent7-v21-base-parpadeo-mara-b.png](agent7-v21-base-parpadeo-mara-b.png) · [agent7-v21-base-parpadeo-mara-c.png](agent7-v21-base-parpadeo-mara-c.png) |
| B03a · Ajustes exponen «al final / tras cada pregunta» y «solo banco original» | **NOTE** | acciones=["open-pause","open-heroes","open-review","open-map","open-journal","open-wardrobe","open-shop","toggle-sound","open-mission","close-settings","toggle-ambient","toggle-muted","export-save","open-import","toggle-reduced-motion","toggle-extra-time","set-effects-quality","set-text-scale","toggle-contrast","toggle-backup-reminder","toggle-3d-frames","v2-weights-reset","save-local-backup","reset-progress","open-help","open-tutorial","open-credits","v2-world-close"] · textos: each=false end=false bancoOriginal=false hasFeedbackSettings=true hasPerf=false buttons=[] |
| R03a · Pantalla de modos | **PASS** | ["Desafío diario","Supervivencia","Contrarreloj","Simulacro"] |
| R03b · Práctica libre: sesión, respuesta y cierre | **PASS** | mode=practice total=10 |
| B01 · Comportamiento base del feedback por defecto | **NOTE** | feedback={"v2Open":true,"legacy":true,"feedbackOpen":true,"kind":"correct"} · auto={"idx0":0,"idx1":0,"advanced":false,"overlayStillOpen":true,"screen":"duel"} · settings.feedbackMode="end" |
| R03c · Los 4 modos abren una sesión y se cierran sin error | **PASS** | [{"mode":"daily","ok":true,"state":"daily","total":6,"shot":"agent7-v21-base-modo-daily.png"},{"mode":"survival","ok":true,"state":"survival","total":10,"shot":"agent7-v21-base-modo-survival.png"},{"mode":"timed","ok":true,"state":"timed","total":8,"shot":"agent7-v21-base-modo-timed.png"},{"mode":"simulacro","ok":true,"state":"simulacro","total":20,"shot":"agent7-v21-base-modo-simulacro.png"}] |
| R05 · Pausa en duelo y reanudación | **PASS** | pausa=true reanuda=true índice=0 |
| B01b · Comportamiento base del feedback en campaña | **NOTE** | feedback={"v2Open":true,"legacy":true,"kind":"correct"} · auto={"idx0":0,"idx1":0,"advanced":false,"overlayAfter":true,"screen":"duel"} |
| B02 · Resumen base del nivel (sin filtros V2.1) | **NOTE** | api=false · items=0 · first=null · filtros=[] · difficult=null · flashcard=null · filter=null |
| R04 · Campaña: misión de 5 preguntas, feedback y resultado | **PASS** | questionTotal=5 · feedback=correct · pass=true · score=400 · mission={"id":"mission-sp-1","kind":"mission","areaId":"area-psi-salud-publica","attempts":1,"completedAt":"2026-11-06T17:11:15.677Z","bestScore":400,"bestAccuracy":0.8,"lastAt":"2026-11-06T17:11:15.677Z","lastScore":400,"lastAccuracy":0.8,"passedAt":"2026-11-06T17:11:15.677Z"} |
| R06 · Misión de campaña persiste tras recargar | **PASS** | missions=1 xp=190 |
| B03b · Opción «tras cada pregunta» | **NOTE** | Función V2.1 no integrada en el build base |
| B04 · «Solo banco original» filtra las preguntas de la sesión | **NOTE** | Función V2.1 no integrada en el build base |
| B05 · Las preguntas generadas llevan etiqueta visible | **NOTE** | {"id":"v2-dash-sheet-ambiental-politica-02","source":"dashboard","generated":true,"chip":null,"chips":[],"screenHasGenerada":false,"text":"✦\nPRÁCTICA LIBRE · 1/10\nPráctica libre · Salud pública\n999\nNoa Iturbe\nNv\n1\n· 0 XP\nPrecisión del duelo\n—\n999\nObservatorio de las Cinco Rutas · Práctica libre · Pregunta 1 de 10\nPRÁCTICA LIBRE · SALUD PÚBLICA\nDifícil\nFavorita\nStudy Dashboard · fichas 2.5.0\n\nSegún la ficha «Seis políticas para actuar sobre el entorno», ¿cuál de estas ideas clave le corresponde?\n\nA\nInocuidad: condición del alimento que no causa daño por peligros biológicos,  |
| B06 · La restauración no retrocede al importar un guardado anterior | **NOTE** | [agent7-v21-base-restauracion-alta.png](agent7-v21-base-restauracion-alta.png) · [agent7-v21-base-restauracion-tras-importar-guardado-bajo.png](agent7-v21-base-restauracion-tras-importar-guardado-bajo.png) |
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
| R12 · Importar partida 1.2 y añadir v2.world vacío | **PASS** | preview=Offline QA · xp=1640 coins=2510 errors=3 |
| R12b · Importación 1.2 persiste tras recargar | **PASS** | xp=1640 coins=2510 |
| R13a · Exportar partida nueva (JSON) conserva progreso | **PASS** | vía=download · xp=1640 coins=2510 · perfil=Offline QA |
| R13b · Reimportar el guardado nuevo conserva progreso | **PASS** | preview=Offline QA · xp=1640 coins=2510 |
| B07 · Duelo en 8 vistas (390×844 … 1920×1080) sin desbordamiento ni opciones cortadas | **PASS** | vistas=8 · overflow=[] · opciones=[] · 390x844:ok 844x390:ok 768x1024:ok 1024x768:ok 820x1180:ok 960x540:ok 1280x720:ok 1920x1080:ok |
| B08b · Captura de banderín/estandarte en las 5 arenas | **PASS** | [{"areaId":"area-psi-salud-publica","shot":"agent7-v21-base-estandarte-salud-publica.png"},{"areaId":"area-psi-cuidado-integral","shot":"agent7-v21-base-estandarte-cuidado-integral.png"},{"areaId":"area-psi-etica","shot":"agent7-v21-base-estandarte-etica.png"},{"areaId":"area-psi-investigacion","shot":"agent7-v21-base-estandarte-investigacion.png"},{"areaId":"area-psi-gestion","shot":"agent7-v21-base-estandarte-gestion.png"}] |
| F01 · FPS · Atrio en reposo | **PASS** | min=75 avg=75 muestras=20 <45=0 |
| F02 · FPS · Atrio con panel | **PASS** | min=75 avg=75 muestras=20 <45=0 |
| F03 · FPS · Mapa | **PASS** | min=75 avg=75 muestras=19 <45=0 |
| F04 · FPS · Duelo | **PASS** | min=75 avg=75 muestras=19 <45=0 |
| N01 · Cero peticiones de red no locales | **PASS** | 0 no locales de 134 · {"file":25,"data":109,"blob":0,"about":0,"chrome":0,"other":0} |
| N02 · Cero errores de consola/excepción | **PASS** | 0 errores ·  |
| N03 · V2._errors vacío | **PASS** | 0 errores V2 [] |
| B09 · Sin warnings de PCF en consola | **NOTE** | PCF=26 · otras=10 · THREE.WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead. |
| N02b · Otras advertencias de consola (no bloqueantes) | **NOTE** | 10 · Canvas2D: Multiple readback operations using getImageData are faster with the willReadFrequently attribute set to true. See: https://html.spec.whatwg.org/multipage/canvas.html#concept-canvas-will-read-frequently |
| X01 · export/serums-quest.html por file://: mundo + cofre + 0 red/errores | **PASS** | stats={"built":true,"ready":true,"chests":0} · coins 999→1004 · noLocales=0 · errores=0 · warnings=2 |
| X02 · index.html redirige a dist/index.html | **PASS** | {"href":"file:///C:/Users/USARIO/Documents/ZARCONT%20SERUMS/serums-quest/dist/index.html","path":"/C:/Users/USARIO/Documents/ZARCONT%20SERUMS/serums-quest/dist/index.html","title":"SERUMS QUEST","game":true} · errores=0 · noLocales=0 |
| N04 · Artefacto base estable durante la pasada | **PASS** | bundle=b32f14899538 · dist=8c4b53b16616 · export=b32f14899538 |
| B10 · No se pierde progreso ni guardado en la pasada (export/import/reload) | **PASS** | roundtrip={"exportMethod":"download","before":{"xp":1640,"coins":2510,"errors":3},"after":{"xp":1640,"coins":2510,"missions":0}} · integridad={"initialSeeded":{"xp":6200,"coins":999,"missions":18},"finalReimport":{"xp":1640,"coins":2510,"missions":0},"worldAfterReload":{"chests":{"total":5,"opened":1,"list":[{"id":"v2w-chest-salud-publica","areaId":"area-psi-salud-publica","x":-7.557,"z":-3.053,"opened":true,"openedAt":"2026-11-06T17:12:19.253Z","fragmentId":"v2w-frag-salud-publica-c","coins":5},{"id":"v2w-chest-cuidado-integral","areaId":"area-psi-cuidado-integral","x":0.569,"z":-8.13,"opened |

## Rendimiento

| Escena | Calidad | Mínimo | Medio | Muestras | <45 | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| hubIdle | alto | 75 | 75 | 20 | 0 | agent7-v21-qa.json → fps.hubIdle |
| hubPanel | alto | 75 | 75 | 20 | 0 | agent7-v21-qa.json → fps.hubPanel |
| map | alto | 75 | 75 | 19 | 0 | agent7-v21-qa.json → fps.map |
| duel | alto | 75 | 75 | 19 | 0 | agent7-v21-qa.json → fps.duel |

Muestras (`window.__gameState().fps` cada ~120 ms): hubIdle = [75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75] · hubPanel = [75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75] · map = [75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75] · duel = [75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75].

Objetivo: medio ≥ 55 y mínimo ≥ 45. GPU real del host (ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 (0x00002882) Direct3D11 vs_5_0 ps_5_0, D3D11)), 1280×720 y DPR 1.

## V2.1 · estado de las funciones pedidas

```json
{
  "summaryApi": false,
  "duelApi": false,
  "perfApi": false,
  "feedbackApi": {
    "onAnswer": true,
    "hide": true,
    "isOpen": true,
    "update": true,
    "settingsHTML": true,
    "mountSettings": true,
    "inlineEnabled": false,
    "autoAdvanceDelay": false,
    "isEndMode": false,
    "feedbackMode": false,
    "mixMissionQuestions": true
  },
  "settingsFeedbackMode": "end",
  "settingsOnlyOriginalBank": false,
  "titleVersion": "V2 · Final",
  "version": "2.0.0-checkpoint1",
  "settingsControls": {
    "text": "AJUSTES DEL OBSERVATORIO\nQue la ruta se adapte a ti.\n\nAudio, efectos y accesibilidad. Nada de esto altera preguntas, claves ni recompensas.\n\nAUDIO\nSonido y ambiente\nEfectos de sonido\nRespuestas, impactos y transiciones.\nAmbiente del observatorio\nPad sintetizado de baja intensidad.\nSilencio total\nSilencia efectos y ambiente sin perder tus preferencias.\n\nEl audio empieza apagado. Actívalo aquí o con el icono de sonido; el volumen se guarda para la próxima sesión.\n\nVolumen\nSe aplica a efectos y ambiente.\n70%\nExportar partida\nImportar\nACCESIBILIDAD\nMovimiento y lectura\nReducir movimiento\nDesactiva animaciones y transiciones decorativas.\nTiempo extra en Contrarreloj\nAmplía un 25 % el límite de la sesión. No cambia las preguntas ni el porcentaje de aprobación.\nCalidad de efectos\nMenos partículas = más fluidez en equipos modestos.\nBaja\nMedia\nAlta\n\nBaja 1×, sin sombras y menos partículas. Media 1,5×, sombras suaves y equilibrio. Alta 2×, sombras y efectos completos.\n\nTamaño del texto\nAmplía la lectura de preguntas, paneles y ayudas.\nNormal\nGrande\nAlto contraste\nRefuerza texto secundario, bordes y separación de paneles.\nRecordatorio semanal de respaldo\nUn aviso neutral si llevas días sin exportar. Puedes silenciarlo.\nMarcos holográficos 3D\nOculta los aros flotantes; el marco del retrato se conserva.\n\nContraste alto, foco visible y controles por teclado. En móvil, arrastra y usa los botones táctiles. Los colores de rareza no son la única señal: cada estado lleva texto.\n\nMEZCLA DE FUENTES\nDe dónde salen tus preguntas\n\nLas misiones, los modos y la práctica reparten sus preguntas entre las tres fuentes con estos pesos. Al iniciar la sesión se normalizan a 100 %; si una fuente no tiene preguntas, su parte se reparte entre las demás. El Desafío diario conserva su pregunta de repaso.\n\nCampaña\nMisiones y duelos de la ruta original.\n111 PREGUNTAS\n60 %\nFichas del dashboard\nPreguntas del panel de estudio.\n210 PREGUNTAS\n15 %\nFlashcards\nTarjetas del mazo de repaso.\n630 PREGUNTAS\n25 %\nMezcla normalizada\n100 %\nRestablecer 60 / 15 / 25\n\nSolo cambia la procedencia de las preguntas. XP, monedas, repaso espaciado y el tope diario de 120 monedas no se tocan. El cambio se aplica a la próxima sesión; una sesión en curso mantiene sus preguntas.\n\nDATOS\nProgreso local\n\nTu partida vive solo en este navegador. Exporta un respaldo nuevo (JSON con vista previa al importar) o importa la partida antigua. También puedes guardar una copia local para recuperación.\n\nExportar partida\nImportar partida\nGuardar copia local\nReiniciar progreso\nAyuda\nRepetir tutorial\nCréditos y licencias\nV2 · Final · compilado el 2026-11-06 · sin conexión y sin cuentas\nVolver",
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
    "hasPerfSettings": false,
    "lowText": false,
    "eachText": false,
    "endText": false,
    "feedbackMode": "end",
    "settingsFeedbackMode": "end",
    "onlyOriginalBank": false
  }
}
```

## Capturas y medidas

- blink: 33 · banners: 5

| Vista | Captura | scrollW | screenW | overflow | opciones visibles | HUD | tapado | rotatePrompt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 390x844 | [agent7-v21-base-duelo-390x844.png](agent7-v21-base-duelo-390x844.png) | 390 | 390 | 0 | 4/4 | — | — | false |
| 844x390 | [agent7-v21-base-duelo-844x390.png](agent7-v21-base-duelo-844x390.png) | 844 | 844 | 0 | 4/4 | — | — | false |
| 768x1024 | [agent7-v21-base-duelo-768x1024.png](agent7-v21-base-duelo-768x1024.png) | 768 | 768 | 0 | 4/4 | — | — | false |
| 1024x768 | [agent7-v21-base-duelo-1024x768.png](agent7-v21-base-duelo-1024x768.png) | 1024 | 1024 | 0 | 4/4 | — | — | false |
| 820x1180 | [agent7-v21-base-duelo-820x1180.png](agent7-v21-base-duelo-820x1180.png) | 820 | 820 | 0 | 4/4 | — | — | false |
| 960x540 | [agent7-v21-base-duelo-960x540.png](agent7-v21-base-duelo-960x540.png) | 960 | 960 | 0 | 4/4 | — | — | false |
| 1280x720 | [agent7-v21-base-duelo-1280x720.png](agent7-v21-base-duelo-1280x720.png) | 1280 | 1280 | 0 | 4/4 | — | — | false |
| 1920x1080 | [agent7-v21-base-duelo-1920x1080.png](agent7-v21-base-duelo-1920x1080.png) | 1920 | 1920 | 0 | 4/4 | — | — | false |

## Red y errores

- Peticiones totales: 134; no locales (http/https/ws): 0.
- Esquemas: {"file":25,"data":109,"blob":0,"about":0,"chrome":0,"other":0}
- Errores de consola/excepción: 0.
- Export HTML (file://): mundo=construido · no locales=0 · errores=0 · warnings=2.
- HUB index → dist/index.html: redirect=sí · juego=true · no locales=0 · errores=0.
- Advertencias de consola: 36 · `THREE.WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead.` · `Canvas2D: Multiple readback operations using getImageData are faster with the willReadFrequently attribute set to true. See: https://html.spec.whatwg.org/multipage/canvas.html#concept-canvas-will-read-frequently`

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
            "openedAt": "2026-11-06T17:12:19.253Z",
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
            "collectedAt": "2026-11-06T17:12:20.970Z",
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
            "collectedAt": "2026-11-06T17:12:19.254Z",
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

- **[medium · v21]** No se encontró la etiqueta de pregunta generada — {"generatedEvidence":{"id":"v2-dash-sheet-ambiental-politica-02","source":"dashboard","generated":true,"chip":null,"chips":[],"screenHasGenerada":false,"text":"✦\nPRÁCTICA LIBRE · 1/10\nPráctica libre · Salud pública\n999\nNoa Iturbe\nNv\n1\n· 0 XP\nPrecisión del duelo\n—\n999\nObservatorio de las Cinco Rutas · Práctica libre · Pregunta 1 de 10\nPRÁCTICA LIBRE · SALUD PÚBLICA\nDifícil\nFavorita\nStudy Dashboard · fichas 2.5.0\n\nSegún la ficha «Seis políticas para actuar sobre el entorno», ¿cuál de estas ideas clave le corresponde?\n\nA\nInocuidad: condición del alimento que no causa daño por peligros biológicos, químicos o físicos.\nB\nResiduo especial: químicos, fármacos peligrosos y otros residuos con riesgo específico distinto del biológico.\nC\nLa cuarta vigila peligros y alertas ambientales, incluidos residuos, químicos, vectores y zoonosis.\nD\nLos riesgos prioritarios incluyen agua, aire, alimentos, residuos, vectores, zoonosis y sustancias peligrosas.\nABCD responder · Esc pau

## Capturas

- [agent7-v21-base-titulo-version.png](agent7-v21-base-titulo-version.png)
- [agent7-v21-base-mapa.png](agent7-v21-base-mapa.png)
- [agent7-v21-base-selector-heroes.png](agent7-v21-base-selector-heroes.png)
- [agent7-v21-base-parpadeo-ilan-a.png](agent7-v21-base-parpadeo-ilan-a.png)
- [agent7-v21-base-parpadeo-ilan-b.png](agent7-v21-base-parpadeo-ilan-b.png)
- [agent7-v21-base-parpadeo-ilan-c.png](agent7-v21-base-parpadeo-ilan-c.png)
- [agent7-v21-base-parpadeo-mara-a.png](agent7-v21-base-parpadeo-mara-a.png)
- [agent7-v21-base-parpadeo-mara-b.png](agent7-v21-base-parpadeo-mara-b.png)
- [agent7-v21-base-parpadeo-mara-c.png](agent7-v21-base-parpadeo-mara-c.png)
- [agent7-v21-base-parpadeo-noa-a.png](agent7-v21-base-parpadeo-noa-a.png)
- [agent7-v21-base-parpadeo-noa-b.png](agent7-v21-base-parpadeo-noa-b.png)
- [agent7-v21-base-parpadeo-noa-c.png](agent7-v21-base-parpadeo-noa-c.png)
- [agent7-v21-base-parpadeo-teo-a.png](agent7-v21-base-parpadeo-teo-a.png)
- [agent7-v21-base-parpadeo-teo-b.png](agent7-v21-base-parpadeo-teo-b.png)
- [agent7-v21-base-parpadeo-teo-c.png](agent7-v21-base-parpadeo-teo-c.png)
- [agent7-v21-base-parpadeo-lia-a.png](agent7-v21-base-parpadeo-lia-a.png)
- [agent7-v21-base-parpadeo-lia-b.png](agent7-v21-base-parpadeo-lia-b.png)
- [agent7-v21-base-parpadeo-lia-c.png](agent7-v21-base-parpadeo-lia-c.png)
- [agent7-v21-base-parpadeo-kian-a.png](agent7-v21-base-parpadeo-kian-a.png)
- [agent7-v21-base-parpadeo-kian-b.png](agent7-v21-base-parpadeo-kian-b.png)
- [agent7-v21-base-parpadeo-kian-c.png](agent7-v21-base-parpadeo-kian-c.png)
- [agent7-v21-base-parpadeo-amaru-a.png](agent7-v21-base-parpadeo-amaru-a.png)
- [agent7-v21-base-parpadeo-amaru-b.png](agent7-v21-base-parpadeo-amaru-b.png)
- [agent7-v21-base-parpadeo-amaru-c.png](agent7-v21-base-parpadeo-amaru-c.png)
- [agent7-v21-base-parpadeo-ona-a.png](agent7-v21-base-parpadeo-ona-a.png)
- [agent7-v21-base-parpadeo-ona-b.png](agent7-v21-base-parpadeo-ona-b.png)
- [agent7-v21-base-parpadeo-ona-c.png](agent7-v21-base-parpadeo-ona-c.png)
- [agent7-v21-base-parpadeo-iris-a.png](agent7-v21-base-parpadeo-iris-a.png)
- [agent7-v21-base-parpadeo-iris-b.png](agent7-v21-base-parpadeo-iris-b.png)
- [agent7-v21-base-parpadeo-iris-c.png](agent7-v21-base-parpadeo-iris-c.png)
- [agent7-v21-base-parpadeo-zenon-a.png](agent7-v21-base-parpadeo-zenon-a.png)
- [agent7-v21-base-parpadeo-zenon-b.png](agent7-v21-base-parpadeo-zenon-b.png)
- [agent7-v21-base-parpadeo-zenon-c.png](agent7-v21-base-parpadeo-zenon-c.png)
- [agent7-v21-base-parpadeo-ranura-ilan.png](agent7-v21-base-parpadeo-ranura-ilan.png)
- [agent7-v21-base-parpadeo-ranura-teo.png](agent7-v21-base-parpadeo-ranura-teo.png)
- [agent7-v21-base-parpadeo-ranura-zenon.png](agent7-v21-base-parpadeo-ranura-zenon.png)
- [agent7-v21-base-ajustes.png](agent7-v21-base-ajustes.png)
- [agent7-v21-base-modos.png](agent7-v21-base-modos.png)
- [agent7-v21-base-practica-pregunta.png](agent7-v21-base-practica-pregunta.png)
- [agent7-v21-base-practica-resultado.png](agent7-v21-base-practica-resultado.png)
- [agent7-v21-base-modo-daily.png](agent7-v21-base-modo-daily.png)
- [agent7-v21-base-modo-survival.png](agent7-v21-base-modo-survival.png)
- [agent7-v21-base-modo-timed.png](agent7-v21-base-modo-timed.png)
- [agent7-v21-base-modo-simulacro.png](agent7-v21-base-modo-simulacro.png)
- [agent7-v21-base-resumen-mision.png](agent7-v21-base-resumen-mision.png)
- [agent7-v21-base-etiqueta-generada.png](agent7-v21-base-etiqueta-generada.png)
- [agent7-v21-base-restauracion-alta.png](agent7-v21-base-restauracion-alta.png)
- [agent7-v21-base-restauracion-tras-importar-guardado-bajo.png](agent7-v21-base-restauracion-tras-importar-guardado-bajo.png)
- [agent7-v21-base-repaso.png](agent7-v21-base-repaso.png)
- [agent7-v21-base-repaso-resultado.png](agent7-v21-base-repaso-resultado.png)
- [agent7-v21-base-tienda.png](agent7-v21-base-tienda.png)
- [agent7-v21-base-inventario.png](agent7-v21-base-inventario.png)
- [agent7-v21-base-selector-elegido.png](agent7-v21-base-selector-elegido.png)
- [agent7-v21-base-atrio-mundo.png](agent7-v21-base-atrio-mundo.png)
- [agent7-v21-base-mundo-cofre-cerrado.png](agent7-v21-base-mundo-cofre-cerrado.png)
- [agent7-v21-base-mundo-cofre-abierto.png](agent7-v21-base-mundo-cofre-abierto.png)
- [agent7-v21-base-mundo-fragmento.png](agent7-v21-base-mundo-fragmento.png)
- [agent7-v21-base-mundo-guia.png](agent7-v21-base-mundo-guia.png)
- [agent7-v21-base-mundo-telescopio.png](agent7-v21-base-mundo-telescopio.png)
- [agent7-v21-base-mundo-biblioteca.png](agent7-v21-base-mundo-biblioteca.png)
- [agent7-v21-base-importar-1-2.png](agent7-v21-base-importar-1-2.png)
- [agent7-v21-base-importar-nuevo.png](agent7-v21-base-importar-nuevo.png)
- [agent7-v21-base-duelo-390x844.png](agent7-v21-base-duelo-390x844.png)
- [agent7-v21-base-duelo-844x390.png](agent7-v21-base-duelo-844x390.png)
- [agent7-v21-base-duelo-768x1024.png](agent7-v21-base-duelo-768x1024.png)
- [agent7-v21-base-duelo-1024x768.png](agent7-v21-base-duelo-1024x768.png)
- [agent7-v21-base-duelo-820x1180.png](agent7-v21-base-duelo-820x1180.png)
- [agent7-v21-base-duelo-960x540.png](agent7-v21-base-duelo-960x540.png)
- [agent7-v21-base-duelo-1280x720.png](agent7-v21-base-duelo-1280x720.png)
- [agent7-v21-base-duelo-1920x1080.png](agent7-v21-base-duelo-1920x1080.png)
- [agent7-v21-base-estandarte-salud-publica.png](agent7-v21-base-estandarte-salud-publica.png)
- [agent7-v21-base-estandarte-cuidado-integral.png](agent7-v21-base-estandarte-cuidado-integral.png)
- [agent7-v21-base-estandarte-etica.png](agent7-v21-base-estandarte-etica.png)
- [agent7-v21-base-estandarte-investigacion.png](agent7-v21-base-estandarte-investigacion.png)
- [agent7-v21-base-estandarte-gestion.png](agent7-v21-base-estandarte-gestion.png)
- [agent7-v21-base-export-html.png](agent7-v21-base-export-html.png)
- [agent7-v21-base-hub-link.png](agent7-v21-base-hub-link.png)
- [agent7-v21-base-contacto-parpadeo.png](agent7-v21-base-contacto-parpadeo.png)
- [agent7-v21-base-contacto-estandartes.png](agent7-v21-base-contacto-estandartes.png)
- [agent7-v21-base-contacto-parpadeo-cosmeticos.png](agent7-v21-base-contacto-parpadeo-cosmeticos.png)
- [agent7-v21-base-contacto-estandartes-close.png](agent7-v21-base-contacto-estandartes-close.png)

## Cierre

Pasada base completada. Las funciones V2.1 ausentes quedan como NOTE/BLOCKED hasta integrar el nuevo build.

_Informe generado por `agent7-v21-qa.js`. No se modificó el juego._