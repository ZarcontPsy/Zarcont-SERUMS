# SERUMS QUEST · V2 · Informe QA Agente 7

- **Pasada:** Pasada final (Checkpoint 1)
- **Inicio/fin:** 2026-11-06T13:32:53.374Z → 2026-11-06T13:36:19.410Z
- **Build:** `dist/index.html` · buildId `850400a8e762` · 3036252 bytes · SHA-256 `850400a8e762534abdd66588538326d0462f221f49c4676da14cf618c2e13a6e` · mtime 2026-11-06T13:28:26.476Z
- **Entorno:** Chrome/156.0.8078.80 (@fb096c0011f9d50f0a264a9376420cdea9c421e3) · GPU: ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 (0x00002882) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1280×720 · DPR 1
- **Resultado:** 50 PASS · 0 FAIL · 0 BLOCKED · 0 SKIP · 1 NOTE (de 51 casos)
- **Red:** 0 peticiones no locales · **Errores de consola/excepción:** 0 · **V2._errors:** 0

## Casos

| Caso | Resultado | Evidencia |
| --- | --- | --- |
| E00 · Chrome headless y perfil limpio | **PASS** | Chrome/156.0.8078.80 (@fb096c0011f9d50f0a264a9376420cdea9c421e3) · ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 (0x00002882) Direct3D11 vs_5_0 ps_5_0, D3D11) · DPR 1 · 1280×720 |
| E01 · Namespace y módulos registrados | **PASS** | {"call":true,"assetsHub":true,"assetsMap":true,"assetsArena":true,"assetsStats":true,"heroesMount":true,"heroesUpdate":true,"combatHero":true,"combatGuardian":true,"combatDuel":true,"feedbackAnswer":true,"feedbackSettings":true,"feedbackMix":true} |
| T01 · Versión «V2 · Checkpoint 1» visible | **PASS** | titleVersion="V2 · Checkpoint 1" · document.title="SERUMS QUEST" |
| T02 · Banco combinado de 951 preguntas y fuentes | **PASS** | runtime=951 meta=951 sources={"campaign":111,"flashcards":630,"dashboard":210} meta={"campaign":111,"dashboard":210,"flashcards":630} |
| T03 · Muestra de claves y estructura (≥30) | **PASS** | 42 preguntas verificadas · 0 con problemas |
| H01 · Entrada al observatorio y render 3D | **PASS** | screen=hub renderer=webgl heroOnScreen=true fps=75 |
| AS01 · Atrio decorado por V2.assets | **PASS** | {"quality":"alto","budget":{"props":12,"particles":80,"decor":26,"maxDrawCalls":150,"glow":1},"hubProps":60,"hubVeg":90,"minions":5,"hubDust":80,"skyBuilt":true,"arenaActive":false,"arenaArea":null,"mapIslands":0,"mapProps":0} |
| T04 · Primer recorrido de 5 pasos y cierre | **PASS** | inicio={"eyebrow":"Paso 1 de 5","dots":5,"active":0,"button":"Siguiente"} · fin={"eyebrow":"Paso 5 de 5","dots":5,"active":4,"button":"Terminar"} · tutorialSeen=true |
| T05 · Menú de título completo | **PASS** | ["open-map","enter-arena","open-modes","open-wardrobe","open-shop","open-journal","open-settings","open-import"] |
| S01 · Selector V2 con carrusel 3D y 10 héroes | **PASS** | cards=10 pos 3→4 center=teo selected=teo canvas=true fallback=false |
| H02 · Pausa y accesos | **PASS** | actions=["close-pause","close-pause","open-modes","open-stats","open-map","open-journal","open-heroes","open-wardrobe","open-shop","open-review","open-settings","open-import","exit-title","toggle-sound","toggle-ambient","toggle-muted","toggle-reduced-motion","toggle-extra-time","set-effects-quality","set-effects-quality"] |
| ST01 · Ajustes completos y versión compilada | **PASS** | quality=["bajo","medio","alto"] · foot="V2 · Checkpoint 1 · compilado el 2026-11-06 · sin conexión y sin cuentas Volver" |
| ST02 · Pesos de fuentes (60/15/25 → 80/15/25) persisten | **PASS** | inicial={"campaign":0.6,"dashboard":0.15,"flashcards":0.25} trasUI={"campaign":0.8,"dashboard":0.15,"flashcards":0.25} trasRecarga={"campaign":0.8,"dashboard":0.15,"flashcards":0.25} sliders={"campaign":0.8,"dashboard":0.15,"flashcards":0.25} total="100 %" |
| ST03 · Calidad baja/media/alta persiste y activa la UI | **PASS** | [{"q":"bajo","state":"bajo","active":"bajo","v2":"bajo","particles":18},{"q":"medio","state":"medio","active":"medio","v2":"medio","particles":45},{"q":"alto","state":"alto","active":"alto","v2":"alto","particles":80}] |
| ST04 · Pesos persisten tras cambiar antes la calidad (escenario real) | **PASS** | antes={"campaign":0.7,"dashboard":0.15,"flashcards":0.25} localStorage={"campaign":0.7,"dashboard":0.15,"flashcards":0.25} slidersEfectivos={"campaign":0.7,"dashboard":0.15,"flashcards":0.25} settingsKey={"campaign":0.7,"dashboard":0.15,"flashcards":0.25} |
| ST05 · Reducir movimiento persiste y se desactiva | **PASS** | on=true/true/true · reload=true/true/true · off=false/false |
| PF01 · FPS en el atrio (mín/medio, ≥2 s) | **PASS** | min=75 avg=75 muestras=18 · <45=0 · calidad=alto |
| M01 · Mapa 3D con cinco islas | **PASS** | screen=map areas=["area-psi-salud-publica","area-psi-cuidado-integral","area-psi-etica","area-psi-investigacion","area-psi-gestion"] |
| AS02 · Islas del mapa decoradas por V2.assets | **PASS** | {"quality":"alto","budget":{"props":12,"particles":80,"decor":26,"maxDrawCalls":150,"glow":1},"hubProps":60,"hubVeg":90,"minions":5,"hubDust":80,"skyBuilt":true,"arenaActive":false,"arenaArea":null,"mapIslands":5,"mapProps":60} |
| PF02 · FPS en el mapa (mín/medio, ≥2 s) | **PASS** | min=75 avg=75 muestras=18 · <45=0 · islas=5 |
| PF03 · FPS en duelo (mín/medio, ≥2 s) | **PASS** | min=75 avg=75 muestras=18 · <45=0 · preguntas=5 |
| AS03 · Variante de arena por área | **PASS** | {"quality":"alto","budget":{"props":12,"particles":80,"decor":26,"maxDrawCalls":150,"glow":1},"hubProps":60,"hubVeg":90,"minions":5,"hubDust":80,"skyBuilt":true,"arenaActive":true,"arenaArea":"area-psi-salud-publica","mapIslands":5,"mapProps":60} |
| H03 · Pausa en duelo y reanudación en la misma pregunta | **PASS** | pausa=true reanuda=true índice 0→0 |
| C01 · Misión de campaña con 5 preguntas | **PASS** | questionTotal=5 mission=mission-sp-1 |
| L01 · Marca «difícil» en una pregunta | **PASS** | qid=2026-i-psicologia-q056 tags={"2026-i-psicologia-q056":{"difficult":true,"favorite":false,"updatedAt":"2026-11-06T13:34:04.351Z"}} |
| F01 · Feedback de error con clave y explicación | **PASS** | kind=wrong clave=B/B explicacion=true why=true flash=true tipo DOM=wrong · captura=960×540 |
| C02 · Ataque visual del guardián (territorio) | **PASS** | eventos=["guardianTelegraph","guardianImpact"] · cola=["duelStart","guardianTelegraph","phase","guardianImpact"] · captura agent7-cp1-ataque-1-territorio.png |
| F02 · Flashcard local desde el feedback | **PASS** | open=true text=FLASHCARD LOCAL Ficha de estudio  ¿Cuál es un factor cuya presencia excesiva o su ausencia relativa es esencial para la  |
| F03 · Feedback de acierto con clave | **PASS** | kind=correct clave=A/A explicacion=true · captura=960×540 |
| C03 · Cierre de misión con resultado y premios | **PASS** | screen=result pass=true score=400 mission={"id":"mission-sp-1","kind":"mission","areaId":"area-psi-salud-publica","attempts":1,"completedAt":"2026-11-06T13:34:14.916Z","bestScore":400,"bestAccuracy":0.8,"lastAt":"2026-11-06T13:34:14.916Z","lastScore":400,"lastAccuracy":0.8,"passedAt":"2026-11-06T13:34:14.916Z"} |
| P01 · Misión completada sobrevive a la recarga | **PASS** | missions=1 xp=150 coins=147 |
| G01 · Pantalla de modos con diario, supervivencia, contrarreloj y simulacro | **PASS** | ["Desafío diario","Supervivencia","Contrarreloj","Simulacro"] |
| G02 · Práctica libre por área | **PASS** | ["area-psi-salud-publica","area-psi-cuidado-integral","area-psi-etica","area-psi-investigacion","area-psi-gestion"] |
| G03 · Sesión de práctica libre sin corazones de campaña | **PASS** | mode=practice total=10 |
| SH01 · Compra de cosmético con confirmación y saldo | **PASS** | monedas 500→410 · gorro=true · confirm=true |
| W01 · Equipar y guardar atuendo | **PASS** | equipped={"cabeza":"c-cabeza-gorro"} hero=noa |
| P02 · Compra y atuendo sobreviven a la recarga | **PASS** | coins=410 ownedGorro=true equipped={"noa":{"cabeza":"c-cabeza-gorro"}} |
| IM01 · Partida antigua offline-fixture importada por la UI | **PASS** | name=Offline QA xp=1640 coins=2510 stage=3 errors=3 · preview=Offline QA {"Nivel":"7","Rango":"Bachiller","XP":"1.640","Monedas":"2.510","Héroes":"2","Cosméticos":"2","Logros":"0","Nodos":"0","Errores":"3","Etapa":"3/4"} |
| P03 · Partida antigua importada sobrevive a la recarga | **PASS** | name=Offline QA xp=1640 coins=2510 |
| R01 · Pantalla de repaso y sesión con errores vencidos | **PASS** | due={"disabled":false,"text":"Repasar lo que toca (3)"} · text=REPETICIÓN ESPACIADA Volver a mirar también es avanzar.  Cada fallo entra en un calendario de repaso. La primera cita es a los 20 minutos; después, 1, 3, 7, 14  |
| R02 · Sesión de repaso con las preguntas falladas | **PASS** | mode=review total=3 |
| IM02 · Exportar respaldo JSON desde Ajustes | **PASS** | vía=download app=SERUMS QUEST VOXEL schema=2 xp=6200 coins=999 nodos=18 cosméticos=69 |
| IM03 · Reimportar el guardado nuevo y comparar XP/monedas/marcas | **PASS** | xp 6200→6200 · coins 999→999 · nodos 18→18 · cosméticos 69→69 · héroe noa→noa · pesos={"campaign":0.6,"dashboard":0.15,"flashcards":0.25} |
| P04 · Reimportación sobrevive a la recarga | **PASS** | xp=6200 coins=999 nodos=18 |
| S02 · Estados del selector: En ruta, Comprar y Bloqueado | **PASS** | {"enRuta":{"id":"ilan","ctaClass":"v2-hero-cta is-current","ctaText":"En ruta","pos":"1"},"comprar":{"id":"mara","ctaClass":"v2-hero-cta is-buy","ctaText":"Comprar ◇ 480","pos":"2"},"bloqueado":{"id":"noa","ctaClass":"v2-hero-cta is-blocked","ctaText":"Bloqueado","pos":"3"}} |
| CP-ATTACKS · Ataque de los 5 guardianes | **PASS** | [{"area":"territorio","shot":"C:\\Users\\USARIO\\Documents\\ZARCONT SERUMS\\serums-quest\\.work\\v2\\evidence\\agent7-cp1-ataque-1-territorio.png","events":2},{"area":"cuidado","shot":"C:\\Users\\USARIO\\Documents\\ZARCONT SERUMS\\serums-quest\\.work\\v2\\evidence\\agent7-cp1-ataque-2-cuidado.png","events":2},{"area":"confianza","shot":"C:\\Users\\USARIO\\Documents\\ZARCONT SERUMS\\serums-quest\\.work\\v2\\evidence\\agent7-cp1-ataque-3-confianza.png","events":2},{"area":"evidencia","shot":"C:\\U |
| N01 · Cero peticiones de red | **PASS** | 0 no locales de 119 totales · esquemas={"file":27,"data":92,"blob":0,"about":0,"chrome":0,"other":0} |
| N02 · Cero errores de consola y excepciones | **PASS** | 0 errores ·  |
| N02b · Advertencias de consola (no bloqueantes) | **NOTE** | 28 advertencias · THREE.WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead. |
| N03 · V2._errors vacío | **PASS** | 0 errores V2 |
| N04 · Build estable durante la pasada | **PASS** | 850400a8e762534abdd66588538326d0462f221f49c4676da14cf618c2e13a6e |

## Rendimiento

| Escena | Calidad | Mínimo | Medio | Muestras | < 45 | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| hub | alto | 75 | 75 | 18 | 0 | agent7-qa.json → fps.hub |
| map | alto | 75 | 75 | 18 | 0 | agent7-qa.json → fps.map |
| duel | alto | 75 | 75 | 18 | 0 | agent7-qa.json → fps.duel |

Objetivo del contrato: medio ≥ 55 y mínimo ≥ 45. El entorno headless usa la GPU del host (ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 (0x00002882) Direct3D11 vs_5_0 ps_5_0, D3D11)).

Muestras (`window.__gameState().fps` cada ~120 ms): hub = [75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75] · map = [75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75] · duel = [75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75].

**Nota de entorno:** el navegador headless de esta pasada usa la GPU del host (no SwiftShader); las cifras son del render real a 1280×720 con DPR 1. No se ejecutó el playtest de Game Studio: esta tarea lo prohíbe.

## Red y errores

- Peticiones totales capturadas: 119; no locales (http/https/ws): 0.
- Esquemas permitidos: {"file":27,"data":92,"blob":0,"about":0,"chrome":0,"other":0}
- Errores de consola/excepción: 0.
- Advertencias de consola: 28 · `THREE.WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead.`

## V2 · módulos y contenido

```json
{
  "modules": {
    "call": true,
    "assetsHub": true,
    "assetsMap": true,
    "assetsArena": true,
    "assetsStats": true,
    "heroesMount": true,
    "heroesUpdate": true,
    "combatHero": true,
    "combatGuardian": true,
    "combatDuel": true,
    "feedbackAnswer": true,
    "feedbackSettings": true,
    "feedbackMix": true
  },
  "catalog": {
    "areas": {
      "area-psi-salud-publica": 12,
      "area-psi-cuidado-integral": 12,
      "area-psi-etica": 12,
      "area-psi-investigacion": 12,
      "area-psi-gestion": 12
    },
    "minions": 5,
    "arena": 5,
    "sky": 5
  },
  "ids": {
    "areas": {
      "area-psi-salud-publica": 12,
      "area-psi-cuidado-integral": 12,
      "area-psi-etica": 12,
      "area-psi-investigacion": 12,
      "area-psi-gestion": 12
    },
    "minions": 5,
    "arena": 5,
    "sky": 5
  },
  "counts": {
    "total": 951,
    "bySource": {
      "campaign": 111,
      "flashcards": 630,
      "dashboard": 210
    },
    "byArea": {
      "area-psi-salud-publica": 197,
      "area-psi-cuidado-integral": 565,
      "area-psi-etica": 54,
      "area-psi-investigacion": 46,
      "area-psi-gestion": 89
    },
    "metaQuestionCount": 951,
    "metaSourceCounts": {
      "campaign": 111,
      "dashboard": 210,
      "flashcards": 630
    },
    "metaV2": {
      "added": 840,
      "skipped": 0,
      "contentVersion": "2.0.0",
      "generatedExplanations": 321
    },
    "keyAudit": {
      "checked": 42,
      "failures": [],
      "sample": [
        {
          "id": "2026-i-psicologia-q056",
          "answer": "B",
          "source": "campaign",
          "areaId": "area-psi-salud-publica"
        },
        {
          "id": "2026-ii-psicologia-q069",
          "answer": "D",
          "source": "campaign",
          "areaId": "area-psi-salud-publica"
        },
        {
          "id": "2026-i-psicologia-q011",
          "answer": "D",
          "source": "campaign",
          "areaId": "area-psi-cuidado-integral"
        },
        {
          "id": "2026-ii-psicologia-q099",
          "answer": "D",
          "source": "campaign",
          "areaId": "area-psi-etica"
        },
        {
          "id": "2026-i-psicologia-q094",
          "answer": "D",
          "source": "campaign",
          "areaId": "area-psi-gestion"
        },
        {
          "id": "2026-ii-psicologia-q036",
          "answer": "C",
          "source": "campaign",
          "areaId": "area-psi-gestion"
        },
        {
          "id": "v2-fc-card-psi-sp-1-5-2",
          "answer": "A",
          "source": "flashcards",
          "areaId": "area-psi-salud-publica"
        },
        {
          "id": "v2-fc-card-agente-01-3",
          "answer": "B",
          "source": "flashcards",
          "areaId": "area-psi-salud-publica"
        },
        {
          "id": "v2-fc-card-psi-sp-1-6-3",
          "answer": "D",
          "source": "flashcards",
          "areaId": "area-psi-salud-publica"
        },
        {
          "id": "v2-fc-card-agua-01-1",
          "answer": "B",
          "source": "flashcards",
          "areaId": "area-psi-salud-publica"
        },
        {
          "id": "v2-fc-card-psi-sp-1-7-1",
          "answer": "B",
          "source": "flashcards",
          "areaId": "area-psi-salud-publica"
        },
        {
          "id": "v2-dash-sheet-agua-02",
          "answer": "B",
          "source": "dashboard",
          "areaId": "area-psi-salud-publica"
        }
      ]
    }
  },
  "events": []
}
```

## Importar / exportar

```json
{
  "legacy": {
    "preview": {
      "name": "Offline QA",
      "grid": {
        "Nivel": "7",
        "Rango": "Bachiller",
        "XP": "1.640",
        "Monedas": "2.510",
        "Héroes": "2",
        "Cosméticos": "2",
        "Logros": "0",
        "Nodos": "0",
        "Errores": "3",
        "Etapa": "3/4"
      },
      "text": " Partida reconocida\nOffline QA\nNivel\n7\nRango\nBachiller\nXP\n1.640\nMonedas\n2.510\nHéroes\n2\nCosméticos\n2\nLogros\n0\nNodos\n0\nErrores\n3\nEtapa\n3/4\nImportar esta partida\nCancelar vista previa"
    },
    "expected": {
      "name": "Offline QA",
      "xp": 1640,
      "coins": 2510,
      "stage": 3,
      "errors": 3
    },
    "actual": {
      "name": "Offline QA",
      "xp": 1640,
      "coins": 2510,
      "stage": 3,
      "errors": 3,
      "importedFrom": "SERUMS QUEST 1.2.x",
      "importedAt": "2026-11-06T13:34:36.522Z",
      "heroes": 2,
      "cosmetics": 5
    }
  },
  "exportRoundTrip": {
    "exported": {
      "xp": 6200,
      "coins": 999,
      "missions": 18,
      "cosmetics": 69,
      "heroes": 10,
      "selectedCharacterId": "noa",
      "profileName": "QA V2",
      "weights": {
        "campaign": 0.6,
        "dashboard": 0.15,
        "flashcards": 0.25
      },
      "quality": "alto"
    },
    "reimported": {
      "xp": 6200,
      "coins": 999,
      "missions": 18,
      "cosmetics": 69,
      "heroes": 10,
      "selectedCharacterId": "noa",
      "profileName": "QA V2",
      "weights": {
        "campaign": 0.6,
        "dashboard": 0.15,
        "flashcards": 0.25
      },
      "quality": "alto"
    },
    "preview": {
      "name": "QA V2",
      "grid": {
        "Nivel": "11",
        "Rango": "Bachiller",
        "XP": "6.200",
        "Monedas": "999",
        "Héroes": "10",
        "Cosméticos": "69",
        "Logros": "0",
        "Nodos": "18",
        "Errores": "0",
        "Etapa": "4/4"
      },
      "text": " Partida reconocida\nQA V2\nNivel\n11\nRango\nBachiller\nXP\n6.200\nMonedas\n999\nHéroes\n10\nCosméticos\n69\nLogros\n0\nNodos\n18\nErrores\n0\nEtapa\n4/4\nImportar esta partida\nCancelar vista previa"
    }
  }
}
```

## Problemas

Sin problemas registrados.

## Capturas de esta pasada

- [agent7-cp1-titulo.png](agent7-cp1-titulo.png)
- [agent7-cp1-atrio.png](agent7-cp1-atrio.png)
- [agent7-cp1-tutorial.png](agent7-cp1-tutorial.png)
- [agent7-cp1-selector-heroes.png](agent7-cp1-selector-heroes.png)
- [agent7-cp1-ajustes.png](agent7-cp1-ajustes.png)
- [agent7-cp1-ajustes-accesibilidad.png](agent7-cp1-ajustes-accesibilidad.png)
- [agent7-cp1-mapa.png](agent7-cp1-mapa.png)
- [agent7-cp1-isla-1-salud-publica.png](agent7-cp1-isla-1-salud-publica.png)
- [agent7-cp1-isla-2-cuidado-integral.png](agent7-cp1-isla-2-cuidado-integral.png)
- [agent7-cp1-isla-3-etica.png](agent7-cp1-isla-3-etica.png)
- [agent7-cp1-isla-4-investigacion.png](agent7-cp1-isla-4-investigacion.png)
- [agent7-cp1-isla-5-gestion.png](agent7-cp1-isla-5-gestion.png)
- [agent7-cp1-ataque-1-territorio.png](agent7-cp1-ataque-1-territorio.png)
- [agent7-cp1-feedback-error.png](agent7-cp1-feedback-error.png)
- [agent7-cp1-flashcard.png](agent7-cp1-flashcard.png)
- [agent7-cp1-feedback-acierto.png](agent7-cp1-feedback-acierto.png)
- [agent7-cp1-resultado-mision.png](agent7-cp1-resultado-mision.png)
- [agent7-cp1-modos.png](agent7-cp1-modos.png)
- [agent7-cp1-tienda.png](agent7-cp1-tienda.png)
- [agent7-cp1-inventario.png](agent7-cp1-inventario.png)
- [agent7-cp1-importar-antigua.png](agent7-cp1-importar-antigua.png)
- [agent7-cp1-ajustes-pesos.png](agent7-cp1-ajustes-pesos.png)
- [agent7-cp1-titulo-version.png](agent7-cp1-titulo-version.png)
- [agent7-cp1-selector-en-ruta.png](agent7-cp1-selector-en-ruta.png)
- [agent7-cp1-selector-comprar.png](agent7-cp1-selector-comprar.png)
- [agent7-cp1-selector-bloqueado.png](agent7-cp1-selector-bloqueado.png)
- [agent7-cp1-ataque-2-cuidado.png](agent7-cp1-ataque-2-cuidado.png)
- [agent7-cp1-ataque-3-confianza.png](agent7-cp1-ataque-3-confianza.png)
- [agent7-cp1-ataque-4-evidencia.png](agent7-cp1-ataque-4-evidencia.png)
- [agent7-cp1-ataque-5-sistema.png](agent7-cp1-ataque-5-sistema.png)
- [agent7-cp1-mapa-completo.png](agent7-cp1-mapa-completo.png)

## Cierre

Nada bloqueado; revisar capturas y confirmar el veredicto.

_Informe generado automáticamente por `agent7-qa.js`. No se modificó el juego._