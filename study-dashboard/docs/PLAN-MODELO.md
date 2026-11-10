# PLAN-MODELO · Modelo matemático de planificación

**Estado:** Fase 0 completa, **Fase 1 integrada**, **Fase 2 integrada** y **Fase 3 integrada** con las herramientas de última hora. El motor solo se carga bajo demanda desde `plan.runtime.js`; `#/relampago` y `#/ultimo-dia` usan datos derivados, no el motor.
**Ámbito:** `study-dashboard/js/plan/plan-model.js` (motor), `study-dashboard/js/plan/plan.runtime.js` (puente), `study-dashboard/js/plan/plan.ruta.js`, `plan.editor.js`, `plan.mastery.js`, `plan.review.js`, `today.integration.js`, CSS y pruebas.
**Dueño:** Agente 4 · Planificación y repaso; integración de vistas repartida según `CONTRATOS-FASE2.md`.
**Versiones:** motor `1.0.0` · runtime `1.0.0` · producto Study Dashboard 2.3.0 · contenido 2.5.0.

Este documento es el contrato del motor: qué recibe, qué devuelve, con qué fórmula y qué **no** promete. La Fase 2 construye las rutas `#/ruta`, `#/plan`, `#/dominio` y `#/repaso` sobre esta API; la Fase 1 (§13) integra solo el bloque del Panel con una agregación ligera propia, sin cargar el motor completo al arrancar.

---

## 1. Datos reales verificados

Verificado con `node --test study-dashboard/tests/unit/plan` leyendo `study-data/temario.js` y `study-shared/taxonomy.js` (no se transcribe a mano: se cuenta desde los datos).

| Hecho | Valor | Comprobación |
|---|---:|---|
| Fichas | 210 | `content.sheets.length` |
| Áreas primarias / categorías | 5 / 20 | `content.primaryAreas` / `content.categories` |
| Tarjetas | 630 | `content.cards.length` |
| Minutos declarados | **2.524** (≈ 42 h) | suma de `sheet.minutes` |
| Mínimo / máximo por ficha | 5 / 22 min | distribución real |
| Fichas sin `minutes` | 0 | ninguna ficha lo omite |
| Área II · Cuidado integral | **135 fichas (64,29 %)** | 135 / 210 |
| Área II · minutos | **1.330 min (52,69 %)** | 1330 / 2524 |
| Área I · Salud pública | 43 fichas · 627 min | 24,84 % de los minutos |
| Área III · Ética | 9 fichas · 172 min | 6,81 % |
| Área IV · Investigación | 7 fichas · 118 min | 4,68 % |
| Área V · Gestión | 16 fichas · 277 min | 10,97 % |

Consecuencia de diseño: **el Área II no pesa lo mismo por fichas (64 %) que por minutos (53 %)**. El plan reparte por minutos, no por número de fichas, y el test `plan-model.data.test.mjs` fija ambas proporciones. A 60 min/día el temario completo son ~42 sesiones de lectura; a 45 min/día, ~56.

---

## 2. Reglas del motor

1. **Puro.** Sin DOM, sin `StudyStore`, sin red, sin `localStorage`, sin dependencias externas. Todo entra por parámetro.
2. **Determinista.** Mismo input + mismo `now` ⇒ mismo output. No hay `Date.now()` ni `new Date()` con reloj: el único `new Date(ms)` convierte un entero fijo a ISO para `dueAt`.
3. **`now` es obligatorio.** Sin una fecha de referencia válida las funciones devuelven `status: "sinDatos"` con mensaje. No se usa el reloj del sistema: si lo usara, el resultado no sería reproducible ni comprobable.
4. **No inventa señales.** Si una colección de estado no viene, la señal queda `present: false`, `value: null` y se lista en `missing`. Si viene **vacía**, es una señal real (nada leído = lectura 0) y se distingue de «sin datos» (`sheetCoverage: 0`).
5. **No inventa cifras.** Cuando no hay actividad, los totales del resumen semanal son `null`, no `0`. Los ceros solo aparecen cuando hay una fila de actividad que dice cero.
6. **Zona horaria.** Todo se calcula con días civiles enteros (días desde 1970-01-01) con aritmética propia, sin `Date`. Una fecha `YYYY-MM-DD` es un día civil literal. Un instante ISO con `Z` o desfase se convierte a **America/Lima (UTC−05:00, sin horario de verano)**. Se puede sobreescribir por llamada con `zoneOffsetMinutes`. Así `2026-11-10T02:33Z` y `2026-11-09T21:33-05:00` son el mismo día de estudio.
7. **Redondeo.** Cada ficha se redondea a minutos enteros **una sola vez**, al entrar; los totales son sumas de enteros (sin error acumulado). Los porcentajes y puntajes se redondean al final con `Math.round`. Un bloque nunca tiene 0 minutos: el mínimo es 1.
8. **No muta el input.** Se copia todo lo que se publica.

### Utilidades de fecha (`StudyPlanModel.dates`)

La Fase 2 debe usar estas utilidades y no `new Date(...).toISOString().slice(0,10)`, que devuelve el día UTC y en Lima se adelanta por la noche.

| Función | Devuelve |
|---|---|
| `dates.parse("YYYY-MM-DD")` | número de día o `null` si la fecha no existe |
| `dates.key(día)` | `"YYYY-MM-DD"` |
| `dates.addDays("YYYY-MM-DD", n)` | `"YYYY-MM-DD"` |
| `dates.diffDays(desde, hasta)` | `hasta − desde` en días (puede ser negativo) |
| `dates.weekday("YYYY-MM-DD")` | 0 lunes … 6 domingo |
| `dates.weekdayLabel(...)` | `"lunes"` … |
| `dates.startOfWeek(...)` | lunes de esa semana |
| `dates.today(now, zoneOffsetMinutes?)` | día civil de un instante, en la zona de plan |
| `dates.label(...)` | `"9 nov 2026"` |
| `dates.isoWeek(...)` | `"2026-W46"` |


---

## 3. Entradas comunes

```js
{
  now: "2026-11-09T08:00:00-05:00",   // obligatorio (ISO, "YYYY-MM-DD", Date o epoch)
  zoneOffsetMinutes: -300,            // opcional; por defecto America/Lima
  sheets: [{                          // fichas; para el plan pueden venir todas
    id: "sheet-aps-01",
    title: "Una APS fuerte no es un consultorio de segunda",
    minutes: 6,                       // si falta o es <= 0: 6 y minutesEstimated
    areaId: "area-psi-cuidado-integral",   // o primaryAreaId
    categoryId: "cat-ci-aps",
    priority: 1,                      // prioridad de la ficha: si el área no está
                                      // en areaPriority, se usa la mayor de sus fichas
    done: false                       // o completed / completedAt
  }],
  areaPriority: { "area-psi-cuidado-integral": 1 },
  categoryArea: { "cat-ci-aps": "area-psi-cuidado-integral" }, // si solo hay categoryId
  holidays: ["2026-12-25"],
  defaultMinutes: 6,
  minutesPerDay: 45,                  // plan
  budgetMinutes: 45,                  // ruta (tiene prioridad sobre minutesPerDay)
  daysPerWeek: 6,                     // 1..7 entero
  studyDays: [0, 1, 2, 3, 4],         // alternativa explícita: 0 lunes … 6 domingo
  examDate: "2027-02-15"              // "YYYY-MM-DD" o null
}
```

Reglas de validación:

| Entrada | Válido | Si falta o es inválido |
|---|---|---|
| `minutesPerDay` / `budgetMinutes` | 0..1440 | **No declarado** ⇒ `sinPresupuesto`. Negativo o no numérico ⇒ no declarado + `PRESUPUESTO_INVALIDO`. > 1440 ⇒ 1440 + `PRESUPUESTO_AJUSTADO`. |
| `0` minutos | valor explícito | `sinTiempo`: no hay plan ni ruta, y se dice. |
| `daysPerWeek` | entero 1..7 | 7 días + `DIAS_SEMANA_INVALIDO` / `DIAS_SEMANA_AUSENTE` (no se descarta ningún día; el presupuesto sigue siendo el declarado). Decimal ⇒ 7. |
| `studyDays` | enteros 0..6 | Se usa `daysPerWeek`. |
| `examDate` | `YYYY-MM-DD` real | `null` ⇒ `sinFecha` + `FECHA_INVALIDA` si venía con forma de fecha. Pasada ⇒ `fechaPasada`. |
| `holidays` | fechas válidas | Se ignoran las inválidas + `FERIADO_INVALIDO`. |
| `sheets` | arreglo | Ausente ⇒ `sinDatos`. Vacío ⇒ `sinFichas`. Sin `id` o duplicada ⇒ se descarta + `FICHAS_DESCARTADAS` / `FICHAS_DUPLICADAS`. |

**Adaptador esperado (Fase 2).** El modelo no lee el store: recibe la lista ya unida. Cada ficha debe traer `areaId` (desde `sheet.primaryAreaId` de `StudyTaxonomy.apply`) y `categoryId`; `done` se deriva de `state.sheets[id].completedAt`. Una ficha sin área se agrupa en `"sin-area"` y se advierte: nunca se adivina el área.

---

## 4. `buildPlan(input)`

### 4.1 Qué devuelve

```js
{
  ok, version, status,            // ok | sinFecha | fechaPasada | sinTiempo |
                                  // sinPresupuesto | completado | sinFichas | sinDatos
  balance,                        // "ahead" | "onTrack" | "behind" | null
  fits,                           // boolean | null (null cuando no hay plazo vivo)
  now: { date, dayNumber, zoneOffsetMinutes },
  today, examDate, examDayNumber,
  minutesPerDay, daysPerWeek, studyWeekdays,   // 0 = lunes … 6 = domingo
  totals: { sheets, completedSheets, pendingSheets, pendingMinutes, minutesEstimated },
  capacity: { studyDays, minutes, lastStudyDay, gapMinutes },
  estimatedEndDate, estimatedEndDayNumber,
  lateDays, shortfallMinutes, minutesAfterDeadline, sheetsAfterDeadline,
  spareMinutes, slackStudyDays, truncated,
  calendar: [{
    date, dayNumber, weekday, weekdayLabel,
    studyDay, examDay, afterExam, holiday,
    minutes, overBudget, empty,
    sheets: [{ id, title, minutes, minutesEstimated, areaId, categoryId, priority }]
  }],
  days,
  session: { date, dayNumber, isToday, minutes, sheets } | null,
  nextSheet: { id, title, minutes, … } | null,
  unscheduled: [{ id, minutes, reason }],
  areas: [{ id, priority, pendingSheets, pendingMinutes, pendingShare,
            scheduledSheets, scheduledMinutes, scheduledShare }],
  areaMinutes, areaShare,
  coverage: { sheetsProvided, sheetsValid, sheetsSkipped, duplicates,
              sheetsWithDeclaredMinutes, sheetsWithFallbackMinutes,
              sheetsWithoutArea, minutesComplete },
  message, warnings: [{ code, message, … }], assumptions: [{ code, message }]
}
```

### 4.2 Orden de reparto: proporcional por minutos

1. Se separan las fichas pendientes (`done !== true`).
2. Cada área tiene peso real `Wᵢ = minutos_pendientes(área)ᵢ × prioridad(área)ᵢ`.
3. Se elige siempre el área con **mayor déficit** `Dᵢ = (Wᵢ / ΣW) × minutos_ya_ordenados − minutos_ya_puestos(área)ᵢ` y se toma su siguiente ficha (respetando el orden de entrada dentro del área). Desempate: mayor prioridad → más minutos restantes → `areaId` ascendente.
4. Resultado: en cualquier prefijo del plan, cada área lleva la fracción de minutos que le corresponde al temario. Con prioridades 1, el Área II ocupa ~52,7 % de los minutos aunque tenga ~64 % de las fichas.

La **prioridad de área no cambia el total de minutos de un área**: cambia *cuándo* aparecen sus fichas (ritmo). Si el plan no cabe, la prioridad es la que decide qué queda después del examen, porque lo prioritario va delante.

### 4.3 Empaquetado en días

```
días_de_estudio = días hábiles (studyWeekdays) desde hoy,
                  sin feriados y sin el día del examen.
por cada ficha en el orden anterior:
  primer día de estudio cuyo usado + minutos(ficha) ≤ minutesPerDay
  (una ficha más larga que el día ocupa un día vacío y queda overBudget)
```

El día del examen **no** es día de estudio; la capacidad se cuenta en `[hoy, víspera del examen]`. Hoy siempre cuenta como disponible (el modelo no conoce la hora de la sesión).

Después hay una **pasada de consolidación**: las fichas de los últimos días se mueven al hueco más temprano donde quepan. Sin ella, una ficha de 22 min «desperdicia» media jornada en cada corte y el calendario termina días después de lo posible.

### 4.4 Fórmulas de cierre

```
capacidad.dias      = días de estudio en [hoy, examen − 1]
capacidad.minutos   = capacidad.dias × minutesPerDay
capacidad.gapMinutes= capacidad.minutos − minutos pendientes
fits                = (estimadoFin ≤ examen − 1)          // calendario real
shortfallMinutes    = minutos asignados a días > examen − 1
minutesAfterDeadline= esos mismos minutos (0 si fits)
lateDays            = max(0, estimadoFin − (examen − 1))  // días de calendario
slackStudyDays      = días de estudio entre estimadoFin + 1 y examen − 1
spareMinutes        = fits ? max(0, capacidad.minutos − pendientes) : 0
```

`fits` se mide sobre el **calendario real**, no sobre la aritmética de capacidad. Las fichas tienen tamaños de 5 a 22 min y no se parten: dos días de 45 min no siempre alojan 90 min de contenido. Decir «cabe» con aritmética cuando la última ficha no entra sería una promesa falsa. `capacity.gapMinutes` queda visible para explicar el caso (capacidad positiva pero fragmentación).

Si el llamador acota el horizonte con `maxDays` (por defecto se calcula solo, nunca inferior a 40 días ni superior a 2.000), las fichas que no caben salen en `unscheduled`, `truncated` pasa a `true` y el mensaje avisa de que la fecha de fin es parcial.

### 4.5 Bandas

| `balance` | Cuándo | Mensaje |
|---|---|---|
| `ahead` | cabe y sobran ≥ 1 día de estudio | «Llegas con margen: terminas el … y te quedan N días…» |
| `onTrack` | cabe sin días de estudio de sobra | «Llegas justo: terminas el …» |
| `behind` | no cabe | «No alcanza: … quedan N minutos (M fichas) para después del examen… No prometo que llegues…» |
| `behind` (examen hoy) | no queda ningún día de estudio | «El examen es hoy (…) y no quedan días de estudio: las N fichas pendientes quedan para después. No prometo que llegues.» |
| `null` | sin fecha, fecha pasada o sin presupuesto | nunca se promete nada |

### 4.6 Ejemplo real (210 fichas)

Entrada: `now = 2026-11-09T08:00-05:00`, `examDate = 2027-02-15`, `minutesPerDay = 60`, `daysPerWeek = 6`.

```json
{
  "status": "ok", "balance": "ahead", "fits": true, "days": 52,
  "totals": { "pendingSheets": 210, "pendingMinutes": 2524, "minutesEstimated": 0 },
  "capacity": { "studyDays": 84, "minutes": 5040, "gapMinutes": 2516 },
  "estimatedEndDate": "2026-12-30", "lateDays": 0, "shortfallMinutes": 0,
  "spareMinutes": 2516, "slackStudyDays": 39,
  "session": { "date": "2026-11-09", "isToday": true, "minutes": 60 },
  "areas": [
    { "id": "area-psi-cuidado-integral", "pendingSheets": 135, "pendingMinutes": 1330, "pendingShare": 0.5269 },
    { "id": "area-psi-salud-publica", "pendingSheets": 43, "pendingMinutes": 627, "pendingShare": 0.2484 }
  ],
  "message": "Llegas con margen: terminas el 30 dic 2026 y te quedan 39 días de estudio antes del examen (2516 minutos de capacidad sin usar)."
}
```

Contraejemplo: mismo temario con `minutesPerDay = 45` y examen el 2027-01-15 (58 días de estudio, capacidad 2.610) ⇒ `balance: "behind"`, `minutesAfterDeadline: 211`, `sheetsAfterDeadline: 12`, `lateDays: 8`. «Caben 2.610 contra 2.524» pero la fragmentación deja 12 fichas fuera: el modelo lo dice.

---

## 5. `buildTodayRoute(input)`

### 5.1 Qué combina

| Tipo (`type`) | Fuente inyectada | Minutos | Prioridad base |
|---|---|---|---|
| `repaso` | `reviews: [{ sheetId, dueDate|dueAt, intervalDays }]` vencidos | `max(3, round(minutos × 0,5))` | 100 |
| `tarjetas` | `cardsDue: número` (o `dueCards`, o un arreglo) | `max(1, round(n × 0,5))` (30 s/tarjeta) | 88 |
| `duda` | `doubts: [{ id, sheetId, note|quote, createdAt }]` sin resolver | 3 | 82 |
| `ficha` | `plan` en curso, `todaySheets` explícito, `nextSheetId` o el orden del temario | `sheet.minutes` | 70 |

Bonificaciones documentadas: repaso `+2/día de atraso` (tope 20); tarjetas `+⌊n/4⌋` (tope 10); ficha siguiente `+8`; cualquier ítem con área `+round(prioridad_área × 5)`. Desempate: tipo (`repaso` → `tarjetas` → `duda` → `ficha`), orden de entrada, `id`.

Topes por día (`ROUTE_CAPS`): 3 repasos, 1 bloque de tarjetas, 2 dudas, 3 fichas. Un atraso de 40 repasos no debe ocupar la jornada: el resto se declara en `deferred` y en el texto de apoyo.

### 5.2 Presupuesto

```
candidatos ordenados por prioridad
seleccionar en orden mientras usado + minutos ≤ presupuesto
si no cabe ninguno y presupuesto > 0:
    bloque mínimo = el ítem más corto; se marca minimumBlock y overBudgetMinutes
```

`plannedMinutes` = suma de lo seleccionado; `remainingMinutes = presupuesto − plannedMinutes` (puede ser negativo solo en el bloque mínimo, con `overload: true`). Si sobran ≥ 3 min y el siguiente bloque no entra, `support` lo dice y `nextBlockMinutes` da su duración; no se rellena con nada.

### 5.3 Salida

```js
{
  ok, status,                    // lista | vacia | sinTiempo | sinPresupuesto |
                                 // todoCompletado | sinDatos
  date, budgetMinutes, budgetDeclared,
  plannedMinutes, remainingMinutes, overload, minimumBlock, nextBlockMinutes,
  items: [{
    id: "repaso:sheet-x" | "tarjetas:hoy" | "duda:<id>" | "ficha:<id>",
    type: "repaso" | "tarjetas" | "duda" | "ficha",
    title, sheetId, areaId, categoryId,
    minutes, minutesSource,      // declarada | estimada | porDefecto
    priority, order, reason,     // el «por qué hoy», en una frase
    dueDate, dueDayNumber, overdueDays, count, isNext,
    action: { kind: "abrir-ficha" | "repasar-ficha" | "repasar-tarjetas" | "abrir-dudas",
              label, href },     // #/ficha/:id · #/repaso · #/dudas · null
    minimumBlock?, overBudgetMinutes?
  }],
  counts:    { repaso, tarjetas, duda, ficha },   // señales detectadas
  deferred:  { repaso, tarjetas, duda, ficha },   // candidatos que no entraron hoy
  excluded:  { repaso, ficha },                   // datos que no se pudieron ubicar
  allCompleted, empty,
  plan: { status, balance, examDate, estimatedEndDate, shortfallMinutes, lateDays } | null,
  session: { date, isToday, minutes, sheets } | null,   // sesión del plan: minutos e ids de ficha
  nextSheetId, support, coverage,
  message, warnings, assumptions
}
```

Decisiones:

- **Una ficha con repaso vencido no se repite como ficha nueva** en la misma ruta. Aparece una vez, como `repaso`.
- Un repaso repetido de la misma ficha se cuenta una vez (se queda el vencimiento más antiguo) y se advierte (`REPASO_DUPLICADO`).
- Un repaso sin fecha válida o con una `sheetId` que no está en la lista **se excluye** (`excluded.repaso`) y se advierte; no se le inventan minutos.
- Si `input.plan` trae `examDate|minutesPerDay|daysPerWeek`, la ruta usa la **sesión de hoy del plan**; si hoy es descanso, usa la próxima sesión y lo dice. El plan se recalcula internamente con las mismas fichas.
- La ruta incluye tarjetas y dudas aunque no haya lista de fichas (`FICHAS_AUSENTES`), pero entonces los repasos de ficha no se pueden ubicar.
- `support` es texto sin culpa: atraso del plan, repasos que quedan para otros días, bloque mínimo, minutos sobrantes. Nunca reprocha.

### 5.4 Ejemplo

```json
{
  "status": "lista", "budgetMinutes": 45, "plannedMinutes": 40, "remainingMinutes": 5,
  "counts": { "repaso": 1, "tarjetas": 12, "duda": 1, "ficha": 210 },
  "deferred": { "repaso": 0, "tarjetas": 0, "duda": 0, "ficha": 4 },
  "items": [
    { "type": "repaso", "minutes": 3, "priority": 111,
      "reason": "Repaso vencido el 6 nov 2026 (hace 3 días). Releerla ahora cuesta poco y evita que se olvide." },
    { "type": "tarjetas", "minutes": 6, "priority": 91,
      "reason": "Hay 12 tarjetas vencidas en Study Flashcards: recuperación activa corta, 6 min." },
    { "type": "duda", "minutes": 3, "priority": 88,
      "reason": "Duda abierta el 7 nov 2026 (hace 2 días). Resolverla desbloquea la lectura de esa ficha." }
  ],
  "message": "Ruta de hoy: 40 de 45 minutos en 5 bloques.",
  "support": "Sobran 5 minutos: el siguiente bloque dura 7 y no entra completo. Puedes usarlos en repaso libre o dejarlos."
}
```

---

## 6. `masteryFor(input)`

### 6.1 Señales y pesos

| Señal | Peso | Cómo se calcula | Cuándo falta |
|---|---:|---|---|
| `lectura` | 0,30 | media por ficha: `1` si `completedAt`; `0,4` si solo `viewedAt`/`readSeconds`; `0` si no | `states.sheets` ausente |
| `confianza` | 0,30 | media sobre fichas **con** confianza declarada: `solid 1` · `partial 0,55` · `weak 0,15` | ninguna ficha de la categoría declara confianza |
| `tarjetas` | 0,25 | `0,6 × acierto + 0,4 × volumen`; acierto = `correct/(correct+wrong)`; volumen = fichas repasadas / fichas de la categoría | ninguna ficha tiene repasos de tarjeta |
| `errores` | 0,15 | media sobre fichas **practicadas** de `max(0, 1 − errores/3)`; errores = `recall` con `rating:"again"` en los últimos 14 días | sin colección de errores/recall o sin fichas practicadas |

```
puntaje = round(100 × Σ(pesoᵢ × señalᵢ) / Σ(pesoᵢ))     // solo señales presentes
cobertura = Σ(pesoᵢ presentes)                           // 0 … 1
```

- Un fallo reciente en 3 intentos deja la señal de errores en `0,667`; tres fallos, en `0`.
- «Errores recientes» solo cuenta donde hubo práctica de tarjetas: un cero sin práctica no es evidencia de dominio.
- Un error **sin fecha** no cuenta y se advierte (`ERRORES_SIN_FECHA`); no se supone que sea reciente.
- La confianza borrada (tombstone) no cuenta.
- Las tarjetas pueden venir indexadas por tarjeta (`state.cards` del store) si se inyecta `cardSheet: {cardId: sheetId}`, o como arreglo de registros con `sheetId`; las que no se pueden asociar se ignoran y se cuentan (`TARJETAS_SIN_FICHA`).
- El puntaje **no se castiga** por falta de señales: se renormaliza y la cobertura dice cuánto pesa. Pero ninguna categoría con `cobertura < 0,5` se declara `solido`.

### 6.2 Bandas

| Banda | Regla |
|---|---|
| `sinDatos` | ninguna señal presente (puntaje `null`) |
| `fragil` | puntaje < 45 |
| `enProgreso` | 45 ≤ puntaje < 75, **o** puntaje ≥ 75 con cobertura < 0,5 |
| `solido` | puntaje ≥ 75 y cobertura ≥ 0,5 |

### 6.3 Salida

```js
{
  ok, status,                    // ok | sinDatos
  now,
  categories: [{
    id, label, areaId, minutes,
    sheets: { total, withAnySignal, withReading, withConfidence, withCards, reviewed },
    accuracy,                    // % de acierto de tarjetas | null
    score, band, coverage, sheetCoverage,
    signals: { lectura|confianza|tarjetas|errores: { present, value, weight, sheetsUsed } },
    missing: ["confianza", …]
  }],
  areas: [{ id, categories, minutes, sheets, sheetsWithSignal,
            score, band, coverage, sheetCoverage, missing }],
  global: { score, band, coverage, sheetCoverage,
            signals: { lectura: 0.53, … },   // fracción de minutos con esa señal
            minutes, sheets, missing },
  weakest: { scope, id, label, score, band, coverage } | null,
  weakestArea: { … } | null,
  coverage, sheetCoverage, missing
}
```

- `coverage` es la fracción de **señales** disponibles; `sheetCoverage`, la fracción de **fichas** con algún dato. Las dos se informan porque responden preguntas distintas.
- Agregación por área y global: media de puntajes ponderada por **minutos** de cada categoría (peso del contenido real).
- `weakest` exige cobertura ≥ 0,5 para no elegir una categoría con un solo dato. Si ninguna llega, devuelve `null`.
- `label` es `null` si el llamador no inyecta `categories: [{id, title, areaId}]`; el modelo no conoce los títulos del temario.
- `missing` en una categoría = señales ausentes ahí; en un área o en el global = señales ausentes en **todo** ese alcance (por eso puede ser `[]` con cobertura baja: existen en alguna categoría). `global.signals` da la presencia real por minutos.

---

## 7. `nextSheetReview(input)`

Intervalos de repaso **de ficha**. No toca las cajas de Study Flashcards: no lee ni escribe `cards`, no devuelve `box`.

```
ESCALERA = [1, 2, 4, 7, 15, 30, 60] días
inicio  = weak → 0 (1 día) · partial → 1 (2 días) · solid → 2 (4 días)
índice  = min(6, inicio + min(reviewCount, 7));  si lapses > 0 → 0
dueDate = (max(lastReviewedAt, hoy)) + ESCALERA[índice]
dueAt   = medianoche local de dueDate en ISO UTC  →  "2026-11-13T05:00:00.000Z"
```

- `reviewCount` = repasos **previos** de esa ficha; el intervalo devuelto se aplica después de este repaso.
- Sin confianza declarada: si hay `previousIntervalDays`, se **mantiene** sin crecer; si no, 1 día conservador. En ambos casos se marca `confidenceSource: "ausente"` y un supuesto explícito (`CONFIANZA_AUSENTE`). No se finge un `weak`.
- Un repaso atrasado se reprograma **desde hoy** (contar desde la última lectura daría un vencimiento ya pasado) y se informa `overdueDays`.
- `status`: `primeraVez` | `programado` | `atrasado`.
- `intervalDays` máximo: 60 (escalera); el intervalo previo sin confianza se acota a 90.

Salida: `{ ok, status, sheetId, dueDate, dueAt, intervalDays, ladderIndex, confidence, confidenceSource, lastReviewedAt, isFirst, overdue, overdueDays, previousDueDate, source: "confidence", reason, warnings, assumptions }`.

Ejemplo: `confidence: "partial"`, `reviewCount: 1`, `lastReviewedAt: "2026-11-02"`, `now: 2026-11-09` ⇒ `intervalDays: 4`, `dueDate: "2026-11-13"`, `reason: "Confianza «partial» con 1 repaso previo: 4 días."`

---

## 8. `buildWeeklySummary(input)`

- Semana **ISO** con inicio en lunes; por defecto la semana que contiene `now`, o `weekStart` explícito.
- Se cuenta desde `weekStart` hasta `min(domingo, now)`: si la semana está en curso, `partial: true`.
- **Solo actividad real**: `activity: { "YYYY-MM-DD": { sheetViews, sheetCompletions, cardReviews, correct, wrong, seconds } }`. Los días fuera del rango se ignoran. `minutesRead = round(Σseconds/60)` solo si alguna fila declara `seconds`; si no, `null` y `missing: ["minutos de lectura"]`. Si no hay ninguna fila, los totales son `null`.
- `completedFromStates`: fichas con `completedAt` dentro del rango (dato independiente del contador de actividad).
- `mastery`: resumen de `masteryFor` con las mismas fichas/estado (`global`, `weakest`, `weakestArea`) o `null`.
- `priority`: hasta 3 acciones, en orden: **dominio** (área más floja con cobertura suficiente), **repaso** (fichas vencidas), **duda** (abiertas), **ficha** (pendientes y minutos). Cada una con `reason` basada en cifras reales. Si no hay dominio fiable, esa entrada no aparece.
- `pending`: `{ sheets, minutes, minutesEstimated, reviewsDue, doubtsOpen, cardsDue }`; cada señal que no se inyectó queda `null` (no `0`).
- `empty: true` y `status: "sinDatos"` sin filas; `status: "sinActividad"` con filas en cero; `status: "ok"` con movimiento.
- `weekId`: `"YYYY-Www"` y `weekStart` sirven para `StudyStore.weekly.save({id, weekStart})`.

Ejemplo (semana 2026-W46 completa): `sheetViews: 6`, `sheetsCompleted: 5`, `cardsReviewed: 30`, `accuracy: 87`, `minutesRead: 45`, `daysWithActivity: 2`, mensaje «Esta semana: 6 lecturas de ficha, 5 fichas completadas, 30 tarjetas repasadas (87 % de acierto), 45 minutos de lectura.»

---

## 9. Estados, advertencias y supuestos

### Estados por función

`ok` es `true` cuando la salida es utilizable: en `buildPlan`, `ok` (calendario con fecha), `sinFecha` y `fechaPasada` (calendario sin promesa) y `completado`; en `buildTodayRoute`, `lista` y `todoCompletado`. Los estados de datos ausentes (`sinDatos`, `sinPresupuesto`, `sinTiempo`, `sinFichas`) devuelven `ok: false` y mensaje, nunca una cifra inventada.

| Función | `status` |
|---|---|
| `buildPlan` | `ok` · `sinFecha` · `fechaPasada` · `sinTiempo` · `sinPresupuesto` · `completado` · `sinFichas` · `sinDatos` |
| `buildTodayRoute` | `lista` · `vacia` · `sinTiempo` · `sinPresupuesto` · `todoCompletado` · `sinDatos` |
| `masteryFor` | `ok` · `sinDatos` (y por categoría `fragil` · `enProgreso` · `solido` · `sinDatos`) |
| `nextSheetReview` | `primeraVez` · `programado` · `atrasado` · `sinDatos` |
| `buildWeeklySummary` | `ok` · `sinActividad` · `sinDatos` |

### Códigos de advertencia (`warnings[].code`)

`PRESUPUESTO_INVALIDO` · `PRESUPUESTO_AJUSTADO` · `DIAS_SEMANA_AUSENTE` · `DIAS_SEMANA_INVALIDO` · `FECHA_INVALIDA` · `FERIADO_INVALIDO` · `ZONA_INVALIDA` · `FICHAS_DESCARTADAS` · `FICHAS_DUPLICADAS` · `FICHAS_SIN_AREA` · `FICHAS_SIN_CATEGORIA` · `FICHAS_AUSENTES` · `MINUTOS_POR_DEFECTO` · `FICHA_MAS_LARGA_QUE_EL_DIA` · `HORIZONTE_INSUFICIENTE` · `PRIORIDAD_AREA_INVALIDA` · `REPASO_SIN_FECHA` · `REPASO_SIN_FICHA` · `REPASO_DUPLICADO` · `ULTIMO_REPASO_INVALIDO` · `CONFIANZA_INVALIDA` · `TARJETAS_SIN_FICHA` · `ERRORES_SIN_FECHA` · `ERRORES_SIN_FICHA` · `LECTURA_INVALIDA` · `FICHA_DESCONOCIDA` · `FICHA_COMPLETADA` · `SEMANA_INVALIDA`

### Códigos de supuesto (`assumptions[].code`)

`MINUTOS_POR_DEFECTO` · `DIAS_SEMANA_AUSENTE` · `DIAS_SEMANA_INVALIDO` · `PRESUPUESTO_REDONDEADO` · `CONFIANZA_AUSENTE`

Las advertencias describen lo que no se pudo usar; los supuestos, lo que se asumió para poder calcular. Ambos se publican con `message` y nunca se silencian.

---

## 10. Contrato con la Fase 2

### 10.1 Colecciones del estado v2 que consumirá (sección 5 de `CONTRATOS.md`)

| Colección | Uso |
|---|---|
| `sheets` (legado) | `done` de cada ficha (`completedAt`) |
| `sheetConfidence` | señal `confianza` |
| `sheetReview` | repasos vencidos de la ruta; `dueAt`/`intervalDays` se guardan con `sheetReview.save({sheetId, dueAt, intervalDays, source:"confidence"})` |
| `recall` | señal `errores` (`rating:"again"` dentro de 14 días) |
| `cards` (legado) | señal `tarjetas` (se une tarjeta → ficha con `cardSheet`; no se modifican las cajas) |
| `doubts` | dudas abiertas de la ruta (`resolved:false`) |
| `plan` | `examDate`, `minutesPerDay`, `daysPerWeek` |
| `activity` | resumen semanal y minutos de lectura |
| `weekly` | la salida incluye `weekId` y `weekStart` para guardar el resumen |

El adaptador de la Fase 2 (boceto, no forma parte de la Fase 0):

```js
function planInput(store, taxonomy, nowIso) {
  var state = store.getState();
  var plan = store.plan.get();
  return {
    now: nowIso,                              // el llamador sí puede leer el reloj
    examDate: plan ? plan.examDate : null,
    minutesPerDay: plan ? plan.minutesPerDay : null,
    daysPerWeek: plan ? plan.daysPerWeek : 6,
    sheets: taxonomy.sheets().map(function (sheet) {
      return {
        id: sheet.id, title: sheet.title, minutes: sheet.minutes,
        areaId: sheet.primaryAreaId, categoryId: sheet.categoryId,
        done: !!(state.sheets[sheet.id] && state.sheets[sheet.id].completedAt)
      };
    }),
    reviews: store.sheetReview.list(),
    doubts: store.doubts.list({ resolved: false }),
    cardsDue: 0,                              // lo inyecta el puente con Study Flashcards
    states: {
      sheets: state.sheets,
      confidence: Object.fromEntries(store.sheetConfidence.list().map(function (c) { return [c.sheetId, c.value]; })),
      cards: state.cards,
      recall: store.recall.list()
    },
    cardSheet: cardIdToSheetId(state, taxonomy)
  };
}
```

### 10.2 Lo que el modelo **no** hace

- No renderiza HTML, no registra rutas ni módulos, no toca el DOM ni `StudyApp`.
- No lee ni escribe `localStorage`/IndexedDB, no exporta/importa, no migra el estado.
- No modifica las cajas de repaso de tarjetas; `nextSheetReview` es solo para fichas.
- No pondera áreas por el peso oficial del examen: usa los minutos reales del contenido y la prioridad que declare el usuario o el coordinador.
- No conoce el contenido: títulos, categorías y minutos se inyectan.
- No decide la interfaz de la fecha de examen: solo la consume (`examDate`) y distingue `null` de `0` minutos.
- No calcula repaso relámpago, hoja de último día ni glosario (Fase 3).

---

## 11. Límites conocidos y riesgos

1. **Fragmentación del calendario.** Con fichas de 5–22 min y un presupuesto fijo, el plan puede necesitar más días que `⌈minutos/presupuesto⌉`. Por eso `fits` se mide sobre el calendario; el mensaje explica los minutos y fichas que caen después del examen. Riesgo asumido y probado.
2. **`daysPerWeek` inválido ⇒ 7 días.** Se prefiere no descartar días antes que inventar una disponibilidad menor; se advierte. El presupuesto de minutos no cambia.
3. **Confianza ausente ⇒ 1 día.** Es una decisión conservadora declarada (`CONFIANZA_AUSENTE`), no una señal inventada. La UI debe ofrecer declarar la confianza para ajustar el intervalo.
4. **Cobertura baja y banda.** Un temario leído entero pero sin confianza ni tarjetas no se declara `solido`: la cobertura (0,30) lo impide. Es una regla de producto, no un error de cálculo.
5. **Zona fija UTC−05:00.** Perú no aplica horario de verano; si se usara en otra zona hay que inyectar `zoneOffsetMinutes`. Las fechas `YYYY-MM-DD` no dependen de la zona del navegador.
6. **Hoy siempre cuenta.** El modelo no conoce la hora real de la sesión; abrir la app a las 23:50 no descarta el día.
7. **`weakest` con cobertura ≥ 0,5.** Una categoría con muy pocos datos puede ser la más floja y quedar fuera del «más flojo»; se informa `coverage` para que la UI lo explique.
8. **Rendimiento.** 210 fichas, horizonte de hasta 2.000 días y ~5 áreas: el empaquetado con consolidación es O(fichas × días) y en el contenido real tarda milisegundos (la suite completa, incluida la lectura del temario de 2,5 MB, corre en < 1 s).

---

## 12. Verificación

```powershell
cd "C:\Users\USARIO\Documents\ZARCONT SERUMS"
node --check study-dashboard/js/plan/plan-model.js
node --check study-dashboard/js/plan/today.integration.js
node --test "study-dashboard/tests/unit/plan/**/*.test.mjs"
```

> Con Node 24, `node --test study-dashboard/tests/unit/plan` (sin glob) trata la carpeta como un archivo y falla. Usa el patrón con `**/*.test.mjs`; el pedido de actualizar el comando de referencia de `CONTRATOS.md` §8 está en `PEDIDOS.md`.

Estado: **118 pruebas, 118 PASS, 0 FAIL** — 84 de Fase 0 (`plan-model.test.mjs` + `plan-model.data.test.mjs`), 16 del bloque del Panel (`today-route.test.mjs`) y 18 de `#/ruta` (`plan-ruta.test.mjs`, §14). Las 84 pruebas del modelo cubren, entre otras cosas:

- fechas civiles, año bisiesto, cambio de mes y conversión UTC↔Lima;
- `now` obligatorio y determinismo (incluido «no muta el input»);
- plan holgado (`ahead`), justo (`onTrack`), corto (`behind`), sin fecha, fecha pasada, todo completado, 0 minutos, presupuesto ausente, fecha inválida, días/semana inválidos, feriados, ficha más larga que el día, ficha sin minutos, duplicadas y sin área;
- reparto por minutos vs número de fichas y mezcla proporcional desde el primer día;
- ruta con 0 minutos, sin presupuesto, todo completado, sin señales, repasos atrasados/futuros/desconocidos/repetidos, tarjetas, dudas (tope y orden), bloque mínimo, `nextSheetId`, plan atrasado, examen hoy y minutos sobrantes;
- dominio sin estado, con colección vacía, lectura sola, confianza, tarjetas, errores dentro/fuera de ventana, error sin fecha, confianza borrada, tarjetas por `cardId`, agregación por área y `weakest`;
- repaso: primera vez por confianza, escalera, lapso, intervalo máximo, confianza ausente, atraso, y que no toca cajas;
- resumen semanal: sin actividad (`null`), actividad en cero, semana completa, semana en curso, sin segundos, prioridades y determinismo;
- contenido real: 210 fichas, 2.524 min, Área II 135 fichas / 1.330 min (64,29 % / 52,69 %), calendario que coloca exactamente 2.524 min y `areaShare` igual a los minutos reales;
- el módulo carga en un contexto de navegador sin `module` y expone `window.StudyPlanModel`.

---

## 13. Fase 1 · Bloque «Ruta de hoy» inicial (módulo `today`)

### 13.1 Alcance

La Fase 1 pide **solo** el bloque inicial del Panel. No hay rutas nuevas, no se crea ni se edita el plan y no se carga `plan-model.js` al arrancar. Todo lo que se muestra sale del temario real (`STUDY_CONTENT`) y del estado v2 (`StudyStore`): fichas pendientes, dudas abiertas, repasos vencidos, tarjetas vencidas y presupuesto de minutos si ya existe.

Queda fuera de esta fase: `#/ruta`, `#/plan`, `#/dominio`, `#/repaso`, el editor de fecha de examen, la prioridad de área, el resumen semanal y la reprogramación de repasos.

### 13.2 Archivos y montaje

| Archivo | Papel |
|---|---|
| `js/plan/today.integration.js` | Agregador ligero + render + registro del módulo `today`. Autosuficiente (UMD: `window.StudyPlanToday` o `require()` en Node). |
| `css/plan.css` | Estilos bajo `.plan-*`, con tokens y ambos temas. |
| `tests/unit/plan/today-route.test.mjs` | 15 pruebas Node del agregador, del adaptador y del coste. |
| `tests/unit/plan/today-smoke.mjs` | Smoke de navegador reproducible (manual, no entra en `node --test`). |
| `docs/PLAN-MODELO.md`, `docs/PEDIDOS.md` | Contrato y pedidos. |

- El Coordinador añade `[data-module-mount="today-route"]` después de `.dash-resume-grid` y carga `<script src="js/plan/today.integration.js?v=2.3.0">` al final de `index.html`.
- El módulo se registra como `today`, con `routes: []`. `init` se suscribe a `store:change` y `plan:changed`; `onRoute` rellena el mount **solo** en `route.name === "home"` y lo limpia en cualquier otra ruta.
- Idempotente: si `StudyApp` aún no existe, reintenta 40 veces cada 50 ms; nunca dos registros, nunca dos suscripciones.
- Las re-renderizaciones por `store:change` se agrupan con `requestAnimationFrame` y se saltan fuera de `home`.
- El bloque no escribe en el store: no puede provocar bucles de `store:change`.

### 13.3 API pública

```js
window.StudyPlanToday = {
  version: "1.0.0",
  states: ["lista", "sinActividad", "alDia", "sinTiempo", "error"],
  constants: { ZONE_OFFSET_MINUTES, MAX_MINUTES_PER_DAY, ROUTE_CAPS,
               ROUTE_WEIGHTS, MINUTES_PER_CARD, REVIEW_MINUTES_FACTOR,
               REVIEW_MINUTES_MIN, DOUBT_MINUTES, MOUNT_SELECTOR },

  build(input),                  // puro y síncrono: no toca DOM, store ni reloj
  buildInput({ store, content, now }), // adaptador real StudyStore + STUDY_CONTENT
  render(container, context),    // rellena el contenedor; devuelve false si el estado es error
  clear(container),              // vacía y quita data-plan-state
  register(scope),               // interno; lo llama el script al cargarse
};
```

`render(container, context)` recibe un contenedor con `innerHTML` y un contexto con `{ store, content, now }` (o el `ctx` del router, que ya trae `store` y `content`). Es la pieza reutilizable: la Fase 2 puede llamarlo desde `#/ruta` con un contenedor distinto y un `titleId` propio (por defecto `plan-today-title`, para no duplicar el `id` del `h2`), o sustituir `build()` por el modelo completo manteniendo el mismo HTML.

En Node (`require`) se obtiene el mismo objeto sin registrar nada en `globalThis`.

### 13.4 Entrada de `build(input)`

| Campo | Forma | Regla |
|---|---|---|
| `now` | ISO, `"YYYY-MM-DD"`, epoch o `Date` | Obligatorio; sin fecha válida ⇒ `error`. El render lo toma del reloj (`new Date().toISOString()`), no del modelo. |
| `sheets` | `[{ id, title, minutes, areaId, categoryId, done }]` | Orden del temario. `minutes` no positivo o ausente ⇒ `null` (no se inventa 6). |
| `reviews` | `[{ sheetId, dueAt }]` | Vencidos si su día civil ≤ hoy. Desconocidos, sin fecha o duplicados se excluyen y se advierten. |
| `doubts` | `[{ id, sheetId, note, quote, createdAt }]` | Solo abiertas; las más antiguas primero. |
| `cardsDue` | número | Tarjetas vencidas ya contadas por el adaptador. |
| `plan` | `{ minutesPerDay, daysPerWeek, examDate }` o `null` | Solo lectura; el presupuesto es `minutesPerDay`. |
| `budgetMinutes` | número | Opcional; tiene prioridad sobre el plan (útil para pruebas). |
| `hasActivity` | booleano | Distingue «nuevo sin actividad» de «con trabajo». |
| `lastSheetId` | string o `null` | Última ficha abierta; si sigue pendiente, encabeza el recorrido. |
| `flashcardsHref` | string | Enlace absoluto a Study Flashcards; si falta, ruta relativa estándar. |
| `signalsMissing` | `["duda", "repaso", "tarjetas", "plan"]` | Señales que el adaptador no pudo leer; sus conteos quedan `null`. |
| `warnings` | `[{ code, message }]` | Advertencias del adaptador que se publican con las del agregador. |
| `fatal` | string | Error de datos bloqueante (sin temario o sin store) ⇒ `error`. |

### 13.5 Salida

`ok` (`status !== "error"`), `version`, `status`, `date`, `budgetMinutes`, `budgetDeclared`, `plannedMinutes`, `remainingMinutes`, `minutesComplete`, `overload`, `minimumBlock`, `items[]`, `counts`, `deferred`, `pendingSheets`, `signals`, `missing`, `hasActivity`, `flashcardsHref`, `plan`, `message`, `support[]`, `warnings[]`.

Cada ítem: `{ id, type, title, sheetId, areaId, categoryId, minutes, minutesSource, priority, order, dueDate, overdueDays, count, isNext, kind, reason, action: { kind, label, href, external } }`.

`counts` y `deferred` usan `null` para una señal que no se pudo leer; `0` solo cuando la señal existe y está vacía. `minutesSource` es `declarada`, `estimada` o `desconocida`.

### 13.6 Selección, topes y presupuesto

| Tipo | Fuente | Tope/día | Peso base |
|---|---|---:|---:|
| `repaso` | `sheetReview` vencido | 3 | 100 + 2/día de atraso (máx. 20) |
| `tarjetas` | tarjetas vencidas | 1 bloque | 88 + ⌊n/4⌋ (máx. 10) |
| `duda` | dudas abiertas | 2 | 82 + ⌊días/2⌋ (máx. 20) |
| `ficha` | fichas pendientes del recorrido | 3 (1 si es nuevo) | 70 (+8 si es la siguiente) |

Orden: prioridad desc → tipo (repaso, tarjetas, duda, ficha) → orden de entrada → `id`. La misma ficha no entra dos veces: si tiene repaso vencido, ya no se repite como ficha nueva.

Presupuesto:

1. `budgetMinutes` explícito; si no, `plan.minutesPerDay`; si no hay plan, **no hay presupuesto**.
2. `null` ⇒ se muestran los bloques disponibles sin repartir una jornada inexistente; el total es la suma real.
3. `0` ⇒ estado `sinTiempo`, sin ítems: el día queda vacío a propósito.
4. Inválido o negativo ⇒ no declarado + `PRESUPUESTO_INVALIDO`; > 1440 ⇒ 1440 + `PRESUPUESTO_AJUSTADO`.
5. Se seleccionan los ítems en orden mientras `usado + minutos ≤ presupuesto`. Si no cabe ninguno y el presupuesto es > 0, se propone el **bloque mínimo** (el más corto), con `minimumBlock`, `overBudgetMinutes` y `overload: true`.
6. Los ítems sin minutos se muestran pero no se suman ni se usan para decidir si caben (`minutesComplete: false`).

### 13.7 Fórmulas de minutos (Fase 1)

| Ítem | Fórmula | Motivo |
|---|---|---|
| `ficha` | `sheet.minutes` declarada | el temario declara los minutos de las 210 fichas |
| `repaso` | `max(3, round(minutos × 0,5))` | releer cuesta la mitad, con mínimo de 3 |
| `tarjetas` | `max(1, round(n × 0,5))` | 30 s por tarjeta |
| `duda` | `3` | resolver una duda abierta |

**Diferencia deliberada con el modelo:** la Fase 1 **no** aplica el 6 por defecto de `plan-model.js`. Una ficha sin minutos se muestra como «min sin dato» y el total se anuncia como «sin minutos conocidos» o «al menos N min»; no se inventa una cifra que el contenido no declara. En Fase 2, cuando el modelo completo esté cargado, ese 6 se mantendrá como `minutesEstimated` y la UI lo declarará igual.

El total `plannedMinutes` es la suma de los minutos conocidos. Si `minutesComplete` es `false`, la UI dice «al menos N min» y nunca presenta el dato como exacto.

### 13.8 Señales reales y sus límites

| Señal | Lectura real | Decisión de Fase 1 |
|---|---|---|
| fichas pendientes | `content.sheets` + `state.sheets[id].completedAt` | Recorrido en orden del temario; si la última ficha abierta sigue pendiente, se empieza por ella. |
| repasos vencidos | `StudyStore.sheetReview.list()` (`dueAt` ≤ hoy civil) | Se estima su duración con la ficha; una ficha con repaso no se repite como ficha nueva. |
| dudas abiertas | `StudyStore.doubts.list({ resolved: false })` | Se ordenan de más antigua a más reciente; tope de 2. |
| tarjetas vencidas | `state.cards` con `reviews > 0` y `dueAt` ≤ ahora | **Una tarjeta nueva no está «vencida»**: no se cuenta. El bloque se llama «Práctica con tarjetas», no «tarjetas pendientes». |
| presupuesto | `StudyStore.plan.get()` | Solo se lee. No se crea, no se edita, no se guarda nada. |
| actividad | `StudyStore.getDashboardStats()` | Decide entre «nuevo sin actividad» y «con trabajo». |
| días | días civiles en America/Lima (UTC−05:00), aritmética propia | Una fecha `YYYY-MM-DD` es literal; un ISO con desfase se convierte. No se usa la zona del navegador. |

Si una API del store no existe o falla, la señal se marca `present: false` y `count: null`, se emite `DATOS_INCOMPLETOS` y el texto dice qué no se pudo leer. Nunca se convierte una ausencia en `0`.

### 13.9 Estados y copy

| `status` | Cuándo | Título del bloque | Cuerpo |
|---|---|---|---|
| `lista` | hay actividad (o señales abiertas) y al menos un bloque | «Lo que toca hoy.» | Lista de bloques + composición + minutos. |
| `sinActividad` | sin actividad, sin señales abiertas y sin presupuesto | «Empieza por una ficha.» | Solo la primera ficha pendiente; «el recorrido tiene N fichas: hoy basta con una». |
| `alDia` | no queda ningún bloque (fichas completadas, sin dudas/repasos/tarjetas) | «Nada pendiente por hoy.» | Estado vacío honesto con enlaces a biblioteca/flashcards. |
| `sinTiempo` | plan con `minutesPerDay: 0` | «Hoy no hay ruta.» | «La ruta queda vacía a propósito». |
| `error` | sin fecha, sin temario, sin store o fallo del adaptador | «No pude leer tu ruta.» | Mensaje sin cifras + «Volver a intentar» (recarga la app) + biblioteca. |

El atributo `data-plan-state` del `<section class="plan-today">` repite el estado para QA y estilos (`sinActividad` y `alDia` conservan camelCase).

### 13.10 Enlaces operativos

| Ítem | `href` | Nota |
|---|---|---|
| `repaso` | `#/ficha/:id` | `#/repaso` es de Fase 2; releer la ficha sí existe hoy. |
| `tarjetas` | `StudyStore.urls.appUrl("study-flashcards", { mode:"quick", from:"dashboard" })` | Enlace externo (`target="_blank" rel="noopener"`); si falla, ruta relativa estándar. |
| `duda` | `#/dudas` | Ruta pública de Fase 1 (Agente 3). |
| `ficha` | `#/ficha/:id` | Ruta existente con `data-nav`. |

Todos los enlaces internos llevan `data-nav` para que el router cierre el panel y conserve su comportamiento; el texto visible y el `aria-label` incluyen el título del ítem.

### 13.11 Diseño y accesibilidad

- Solo `.plan-*`; sin selectores globales. Tokens de `base.css`: superficies, líneas, `--accent-*`, `--mark-review-*`, `--mark-doubt-*`, `--green-*`, radios, `--t-fast`, `--target-min`.
- Composición editorial: cabecera + medidor de minutos + composición + lista de bloques + notas al pie. A partir de 980 px, cabecera y notas a la izquierda y ruta a la derecha; los estados sin lista vuelven a una columna. No es una tabla ni una rejilla de tarjetas vacías.
- Estados de datos: `[data-plan-state="..."]` ajusta la composición, nunca las cifras.
- 360, 390, 768, 1024 y 1440 px probados sin desbordamiento del documento ni del bloque; tema claro y oscuro.
- En puntero grueso, los enlaces y botones del bloque miden ≥44 px (`--target-min`), verificado con emulación táctil real (44 px exactos).
- Foco visible con `outline: 2px solid var(--accent)` y `:focus-visible`; `h2` con `id` y `aria-labelledby`; lista `ol` con `aria-label`; ordinales `aria-hidden`; iconos decorativos. Verificado en el smoke con teclado (Tab): `outline` sólido de 2 px en el color de acento.
- `prefers-reduced-motion: reduce` anula las transiciones del bloque. No se añaden animaciones de entrada.
- Sin imágenes, fuentes nuevas, dependencias ni iconos nuevos: se usan los de `study-shared/icons.js` (`rotate`, `cards`, `flag`, `book`, `timer`, `checkCircle`, `alert`, `arrow`).

### 13.12 Coste de carga y no bloqueo de la portada

| Recurso | Bytes | Gzip | ¿Se carga al arrancar en Fase 1? |
|---|---:|---:|---|
| `js/plan/today.integration.js` | 50.908 | 13.085 | Sí (una vez, script clásico). |
| `css/plan.css` | 11.309 | 3.116 | Sí (ya estaba en `index.html`). |
| `js/plan/plan-model.js` | 109.246 | 26.145 | **No**. Se cargará bajo demanda en Fase 2. |
| `study-data/derived/*.json` | — | — | No. El bloque no usa índices derivados. |

- El adaptador recorre 210 fichas y las colecciones v2 una sola vez. Medido en Node 24 sobre el contenido real (210 fichas, 20 repasos, 6 dudas, 210 tarjetas vencidas): **0,227 ms por `buildInput + build`** de media en 200 iteraciones. La agregación sola: **0,103 ms**.
- No hay `fetch`, `await` ni temporizadores en el camino de render: el Panel se pinta primero con `app.js` y el bloque se rellena de forma síncrona en `onRoute`, después del HTML de la portada. Si `StudyApp` todavía no existe, el reintento es un `setTimeout` no bloqueante.
- El smoke de navegador confirmó 0 excepciones y 0 errores de consola atribuibles al bloque en los cinco viewports.

### 13.13 Pruebas

```powershell
cd "C:\Users\USARIO\Documents\ZARCONT SERUMS"
node --check study-dashboard/js/plan/plan-model.js
node --check study-dashboard/js/plan/today.integration.js
node --test "study-dashboard/tests/unit/plan/**/*.test.mjs"
```

Resultado en la entrega de Fase 1: **99/99 PASS** (84 del modelo + 15 de la integración). La Fase 2 añade 1 caso del bloque (enlace a `#/ruta` y repasos a `#/repaso`) y 18 de `#/ruta` (§14): **118/118**. `today-route.test.mjs` cubre:

1. **sin actividad** → `sinActividad`, una ficha, minutos declarados, sin presupuesto;
2. **con fichas pendientes** → `lista`, continúa desde la última abierta, presupuesto 20, 18 min planificados;
3. **solo dudas** → 2 dudas, 3 min cada una, enlace `#/dudas`, razón con fecha real;
4. **solo tarjetas vencidas** → un bloque, 30 s/tarjeta, enlace externo operativo;
5. **todo al día** → `alDia`, cero ítems, cero minutos, sin cifras inventadas;
6. **minutos insuficientes** → bloque mínimo de 6 min con presupuesto 2, exceso 4, `overload`;
7. **datos incompletos** → conteos `null`, señales `present:false`, aviso; sin fecha/sin temario/sin store → `error` sin cifras y con reintento;
8. **no inventar tiempos** → ficha sin `minutes` queda «min sin dato», `minutesComplete:false`, «sin minutos conocidos»;
9. **no inventar razones** → repaso «6 nov 2026, hace 3 días», duda «7 nov 2026, hace 2 días», tarjetas con su conteo;
10. **adaptador real** → `buildInput` + `build` con store simulado, tarjetas nuevas excluidas;
11. **señal ausente del store** → `signalsMissing` y `DATOS_INCOMPLETOS`, sin ceros falsos;
12. **sin duplicar ficha** → una ficha con repaso vencido no se repite como ficha;
13. **pureza y coste** → no requiere `plan-model.js`, no se registra en `globalThis` de Node, <60 KB y 100 agregaciones <1 s.

Además, un caso propio cubre el **presupuesto 0**: `sinTiempo`, sin bloques, con copy propio y sin cifras.

Smoke de navegador (manual, evidencia en `%TEMP%\today-route-smoke\`):

```powershell
& 'C:\Users\USARIO\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe' study-dashboard/tests/unit/plan/today-smoke.mjs
```

| Vista | Estado | Desbordamiento | Enlaces en puntero grueso |
|---|---|---:|---:|
| 1440×900 oscuro | `lista`, 6 bloques, 32 de 45 min | 0 px | n/a |
| 1024×768 claro | `lista` | 0 px | n/a |
| 768×1024 claro | `lista` | 0 px | n/a |
| 390×844 oscuro/claro | `lista` | 0 px | 44 px |
| 360×640 oscuro | `lista` | 0 px | 44 px |
| 1440×900 claro | `sinActividad` (estado vacío) | 0 px | n/a |
| 1440×900 claro | `alDia` (todo completado) | 0 px | n/a |

El estado `error` no se fuerza en la app real (requiere un store roto); su render se verifica en `today-route.test.mjs` con un contenedor falso.

El smoke también comprueba el ciclo `#/` → `#/biblioteca` → `#/`: el mount desaparece al salir (0 bloques) y vuelve al entrar con **un** bloque y **un** mount. Una escritura de store (`StudyStore.setDailyGoal(3)`, que emite `store:change`) refresca el bloque en el sitio sin duplicarlo (`blocks: 1`, `mounts: 1`, `goal: 3`). `window.StudyPlanToday.build` está disponible en la app y la consola no registra excepciones ni errores del bloque.

### 13.14 Lo que queda para la Fase 2

1. Cargar `js/plan/plan-model.js` **bajo demanda** (al abrir `#/ruta`/`#/plan`, nunca en el arranque) y sustituir `StudyPlanToday.build()` por un adaptador a `StudyPlanModel.buildTodayRoute()` con el mismo contrato de salida. El bloque del Panel puede seguir usando el render actual con el resultado del modelo.
2. Crear las rutas `#/ruta` (ruta completa con bloques diferidos y soporte), `#/plan` (fecha de examen, minutos/día, días/semana y editor con `StudyStore.plan.save`), `#/dominio` (`masteryFor`) y `#/repaso` (`nextSheetReview` + `sheetReview.save`).
3. Enlazar los repasos a `#/repaso` en cuanto exista (hoy van a la ficha).
4. Añadir prioridad de área y sesión del plan, que el agregador ligero no implementa.
5. Reaccionar a `plan:changed` con la ruta completa y al cambio de fecha de examen; hoy la suscripción ya existe y solo refresca el bloque.
6. Integrar el resumen semanal (`buildWeeklySummary` + `StudyStore.weekly.save`).
7. Reescribir o retirar el agregador ligero cuando el modelo completo esté integrado; hasta entonces es la única fuente de la Ruta de hoy y está probado.

### 13.15 Supuestos y decisiones de la Fase 1

- `#/dudas` es pública en Fase 1 (Agente 3). Si aún no estuviera registrada, el ítem de duda seguiría apareciendo y el enlace mostraría el 404 editorial; no se oculta la señal.
- Study Flashcards se enlaza por `StudyStore.urls.appUrl`, que resuelve la ruta desde el origen actual; si el store no expone `urls`, se usa `../study-flashcards/index.html?mode=quick&from=dashboard`.
- El plan solo puede existir por importación o por una versión anterior; la Fase 1 no ofrece editor. Si no hay plan, no se inventa una jornada.
- `daysPerWeek` y `examDate` se muestran como contexto del plan guardado, pero no alteran la selección en Fase 1.
- Las tarjetas «vencidas» son las ya repasadas con `dueAt` cumplido; una tarjeta nunca vista no se presenta como deuda.
- El bloque no promete que la ruta quepa en el plan: eso llega con `buildTodayRoute`.

---

## 14. Fase 2 · Ruta de hoy completa (`#/ruta`, módulo `plan-ruta`)

Primera vista operativa de la Fase 2. Reemplaza al 404 editorial de `#/ruta` y es la que reparte la jornada, explica el plan y guarda la semana.

### 14.1 Archivos

| Archivo | Papel |
|---|---|
| `study-dashboard/js/plan/plan.ruta.js` | Módulo `plan-ruta`: registra `ruta` (#/ruta), renderiza, monta, desmonta y guarda la semana. |
| `study-dashboard/css/plan-ruta.css` | Hoja de la vista. Solo `.plan-*`. |
| `study-dashboard/js/plan/today.integration.js` | Ajuste acotado: «Ver ruta completa» → `#/ruta` y repasos del Panel → `#/repaso`. |
| `study-dashboard/tests/unit/plan/plan-ruta.test.mjs` | 18 pruebas de render puro y persistencia. |
| `study-dashboard/tests/unit/plan/ruta-smoke.mjs` | Smoke de navegador (inyecta runtime + vista mientras `index.html` no los cargue). |

`plan.runtime.js` y `plan-model.js` no se modifican en esta vista salvo el enriquecimiento de `session` (§14.8).

### 14.2 Ciclo de vida

```js
render(ctx) -> HTML del armazón (h1, cabecera, nav, esqueleto, error y contenedor)
mount(ctx)  -> listeners + suscripciones + carga del modelo + primera pintura
unmount()   -> off de eventos, cancela frame, token inválido, limpia referencias
```

- El modelo **no** se carga al evaluar el archivo ni en el Panel: `mount` llama a `StudyPlanRuntime.ensureModel()` la primera vez. Si `StudyPlanRuntime.model()` ya lo tiene (vuelta a la ruta), pinta de inmediato sin esqueleto.
- Mientras carga: `[data-plan-loading]` visible y `aria-busy="true"` en el cuerpo. Si falla: `[data-plan-error]` con el mensaje del runtime, botón **Volver a intentar** (`data-plan-action="retry-model"`) y enlace al Panel. El fallo no rompe el resto de la app.
- `refresh()` se programa con `requestAnimationFrame` desde `plan:changed`, `store:change`, `review:changed` y `doubt:changed`. Se ignora el `store:change` con `change === "weekly"`: esa escritura la produce la propia vista.
- Un contador `token` invalida respuestas asíncronas antiguas; `unmount` lo incrementa y retira todo. Sin `DOMContentLoaded` ni temporizadores en el render.

### 14.3 Datos que consume

`StudyPlanRuntime.input({})` + `input.plan = {examDate, minutesPerDay, daysPerWeek}` (desde `input.planRecord`). Con eso:

```js
var route  = StudyPlanModel.buildTodayRoute(input);   // ruta + plan.plan + session
var weekly = StudyPlanModel.buildWeeklySummary(input); // semana ISO
```

La vista no calcula minutos, prioridades ni vencimientos: solo presenta lo que el modelo devuelve y lo que el runtime formatea (`format.date`, `format.minutes`, `plural`, `escape`, `icon`).

### 14.4 Selectores QA (CONTRATOS-FASE2 §4.1)

| Selector | Contenido |
|---|---|
| `section[data-plan-view="ruta"]` | Raíz de la vista; `data-plan-state` = `loading` / estado de la ruta / `error`. |
| `#plan-ruta-title` | Único `h1`. |
| `[data-plan-loading]` | Esqueleto; se retira al pintar (vuelve si se reintenta). |
| `[data-plan-error]` | Error con reintento; oculto con `hidden` hasta que falla. |
| `[data-plan-route-status]` | Estado de la ruta: `data-status` (`lista`, `sinPresupuesto`, …) y **`data-balance`** (`ahead`/`onTrack`/`behind`/vacío). |
| `.plan-route-item[data-type]` | Ítem de la ruta (`repaso`, `tarjetas`, `duda`, `ficha`) con `data-sheet-id` cuando aplica. |
| `[data-plan-link="plan"]` | Enlace/cabecera «Editar plan» y CTA del estado sin plan. |
| `[data-plan-weekly]` | Resumen semanal, con `data-weekly-status` (`ok`, `sinActividad`, `sinDatos`). |

Extras: `[data-plan-summary]`, `[data-plan-signals]`, `[data-plan-notes]`.

### 14.5 Contenido

- **Cabecera editorial**: enlace «Panel», kicker «Planificación», `h1` «Ruta de hoy», subtítulo y tres enlaces: «Editar plan» (`#/plan`), «Mapa de dominio» (`#/dominio`) y «Repaso» (`#/repaso`). Todos con `data-nav`.
- **Estado**: etiqueta corta (p. ej. «Lista para hoy») y el mensaje del modelo sin el prefijo «Ruta de hoy:», para no repetir el `h1`. El estado del plan va en `data-balance`.
- **Presupuesto**: `plannedMinutes` / `budgetMinutes` con barra `role="progressbar"`; sin presupuesto se dice «sin presupuesto de minutos»; 0 minutos se explica como valor explícito.
- **Ítems**: tipo, título, minutos (`≈` si son estimados), motivo (`reason`), acción:
  - `repaso` → `#/repaso`;
  - `ficha` → `#/ficha/:id`;
  - `duda` → `#/dudas`;
  - `tarjetas` → Study Flashcards (`target="_blank"`, URL resuelta con `../study-flashcards/index.html` desde la ubicación actual).
- **Notas**: `support` (sin culpa), `deferred` («quedan N repasos/fichas para los próximos días»), `warnings` (máx. 4) y `assumptions` dentro de un `<details>`.
- **Plan**: banda `ahead`/`onTrack`/`behind`, examen, ritmo, fin estimado y «cabe/no cabe» con minutos y días de atraso. Sin plan: explicación y CTA «Crear plan». Con plan guardado: **«Sesión planificada para hoy: 43 min en 4 fichas»** y, si la ruta incluye menos fichas que la sesión, la explicación: «comparte el presupuesto con repasos y dudas y respeta el tope diario de fichas: incluye 3 de esas 4 y deja 1 para los próximos días». Son dos cifras distintas a propósito: la sesión es la referencia del plan y la ruta es lo que cabe hoy.
- **Sin plan**: se muestran las **señales abiertas** (repasos vencidos, dudas, tarjetas, fichas pendientes y minutos) con enlaces, declarando que no hay presupuesto; nunca se inventa una jornada.
- **Estados vacíos**: `todoCompletado`, `sinTiempo`, `vacia`, `sinDatos` con el mensaje del modelo y acciones reales (biblioteca, repaso, plan).
- **Resumen semanal**: 5 cifras (lecturas, fichas completadas, tarjetas, acierto, minutos), punto más flojo solo si hay cobertura, hasta 3 prioridades con motivo, datos que faltan y pie con la semana guardada.

### 14.6 Persistencia del resumen semanal

`StudyStore.weekly.save({weekStart, ...resumen})` escribe **una sola vez por semana ISO** (el store indexa por `YYYY-Www`). La vista añade dos guardas para no reescribir en cada render:

1. `weeklyPayload()` normaliza el resumen (números redondeados, sin `warnings`) y se compara con la firma del último guardado de la sesión;
2. si la firma no coincide, se lee `StudyStore.weekly.get(weekStart)` y se compara con el registro existente antes de escribir.

La semana **también se registra sin actividad** (`status: "sinDatos"`, actividad `null`): QA puede comprobar que `weekly.list()` tiene la semana tras abrir `#/ruta` con un estado vacío, y el registro no finge cifras. La única escritura que la vista provoca se ignora en su propio handler (`change === "weekly"`), así que no hay bucles.

### 14.7 Comprobación en navegador

`index.html` **todavía no carga** `plan.runtime.js`, `plan.ruta.js` ni `css/plan-ruta.css` (lo pide `docs/PEDIDOS.md`). Mientras tanto, el smoke los inyecta como haría la página y prueba la ruta real:

```powershell
cd "C:\Users\USARIO\Documents\ZARCONT SERUMS"
& 'C:\Users\USARIO\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe' study-dashboard/tests/unit/plan/ruta-smoke.mjs
```

Resultado con el estado semilla (plan 45 min/día, 6 días, examen 2027-02-15, 1 repaso, 1 duda, 8 tarjetas, actividad de 2 días):

| Comprobación | Resultado |
|---|---|
| `plan-model.js` antes de abrir `#/ruta` / después | 0 peticiones / 1 petición |
| `#/ruta` con plan | `lista`, `balance="ahead"`, 6 bloques (1 repaso, 1 tarjetas, 1 duda, 3 fichas), 45/45 min |
| Semana guardada y no duplicada | `weekly.list()` = 1 tras abrir, volver y cambiar el plan |
| `plan:changed` (30 min/día, 5 días) | `behind`, ritmo actualizado, 5 bloques, 1 semana |
| Sin plan | `sinPresupuesto`, 0 ítems, señales abiertas, CTA al plan, semana sigue en 1 |
| Al salir de `#/ruta` | vista y listeners fuera; `#/` intacto |
| 390×844 y 360×640 (puntero grueso) | 0 px de desbordamiento, controles de 44 px |
| Foco con teclado | `:focus-visible` con contorno sólido de 2 px; `aria-labelledby` correcto |
| Consola | 0 excepciones, 0 errores, 0 fallos de red |

Capturas en `%TEMP%\plan-ruta-smoke\`: `ruta-1440-oscuro.png`, `ruta-1440-claro.png`, `ruta-1440-plan-cambiado.png`, `ruta-1440-sin-plan.png`, `ruta-390-oscuro.png`, `ruta-360-oscuro.png`, `ruta-390-claro.png`.

### 14.8 Cambio en el modelo: `session` con minutos y fichas

`buildTodayRoute()` devolvía `session: {date, isToday}`. La vista necesita decir **cuánto** asigna el plan para explicar por qué la ruta incluye menos fichas, así que la sesión ahora incluye `minutes` y `sheets` (ids), tomados de `buildPlan().session`. Es un cambio **aditivo** (mismas claves existentes), cubierto por `plan-model.test.mjs`; no altera ninguna decisión de reparto ni los 99 casos previos.

### 14.9 Decisiones y límites

- **Dos cifras de sesión**: la del plan (`session`, minutos/fichas del día) y la de la ruta (lo que cabe con el presupuesto y los topes). Se nombran distinto («Sesión planificada» / «Ruta de hoy») y se explica la diferencia; no se presenta una como la otra.
- **Etiqueta de estado** sin «Ruta de hoy» para no duplicar el `h1`; el mensaje del modelo se muestra sin ese prefijo.
- **Flashcards**: el enlace se resuelve desde `location.href` con `../study-flashcards/index.html`; `StudyStore.urls.appUrl` (Agente 2) añade la carpeta al path actual y desde `/study-dashboard/` produce `/study-dashboard/study-flashcards/…`. Queda pedido en `PEDIDOS.md`; el bloque del Panel aún usa esa API.
- **Sin plan no hay ruta repartida**: el modelo devuelve `sinPresupuesto` sin ítems; la vista muestra señales reales y CTA, nunca un presupuesto inventado.
- **La semana se guarda aunque esté vacía** (decisión revisada con el Coordinador): una fila por semana ISO, sin cifras, y el registro se actualiza cuando cambia el resumen.
- **Carga perezosa verificada**: el modelo solo se pide al montar una vista de planificación; la portada sigue sin él.

---

© 2026 ZARCONT — Documento interno del proyecto.

