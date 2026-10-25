# Agente 2 — Persistencia, estado y ciclo de vida

Fecha: 2026-10-25 · Repositorio: `C:\Users\USARIO\Documents\ZARCONT SERUMS`
Detalle completo, inventario por app y matriz de las 10 pruebas: `AUDIT/PERSISTENCIA.md`.
Evidencias crudas: `AUDIT/evidencias/agent2-*` (JSON por escenario, capturas PNG).
Entorno: Chrome headless 155 vía CDP (Node 24), `http://127.0.0.1:8772`, perfil
temporal `%TEMP%\a2-chrome`, caché HTTP desactivada.

## Tabla app | estado | antes | clasificación | corrección | resultado

| App | Estado | Comportamiento anterior (evidencia) | Esperado / clasificación | Corrección | Resultado de prueba |
|---|---|---|---|---|---|
| Dashboard | Ficha abierta (`?sheet=`, `#/ficha/<id>`, `last.dashboard`, snapshot) | URL directa y refresco abren la ficha correcta; `views` sube en cada montaje (1→2→3→4, t1) | Persistente (vista ≠ progreso) | Ninguna | Correcto; t1/t11 |
| Dashboard | Scroll de lectura (`sheets[id].scroll`) | Entrar sin reanudar dejaba scroll 0 y el siguiente guardado borraba la posición: 0,5767 → 0,0909 al salir (t1) | Persistente, nunca degradable a 0 por una apertura | `setSheetScroll()` ignora un 0 que borre una posición > 0,05 (`study-shared/store.js`) | t11: guardado 0,6786, refresco a 1398/1960 px, salir desde arriba conserva 0,7132 y la entrada directa restaura 1398 |
| Dashboard | Scroll en reentrada por hash | El re-render de `visibilitychange` no perdía scroll, pero la reentrada por `#/ficha` empezaba en 0 | Restaurable en sesión/persistente | Store: guarda + `pageshow`→`syncFromStorage()`; app ya restaura (versión 05:09, no es cambio mío) | t11b: reentrada por hash en 1082 px con 0,5737 guardado |
| Dashboard | Área/categoría de biblioteca | Ruta `#/biblioteca/<área>/<cat>` | Persistente (URL) | Ninguna | Correcto |
| Dashboard | Filtros de biblioteca (texto/estado) | `libraryQuery`/`libraryFilter` en memoria: «APS» se pierde al refrescar (t13) | Temporal (sobrevive cambio de pestaña) | Instrucción a Agente 6 (`sessionStorage`), §5.2 de PERSISTENCIA.md | Documentado; no aplicado (app.js ajeno) |
| Dashboard | Acordeones de tema | `<details open>` recalculado: un tema abierto se cierra tras volver de otra pestaña (t13 `secondOpen` true→false) | Restaurable en sesión | Instrucción exacta a Agente 6, §5.1 | Documentado; no aplicado |
| Dashboard | Progreso, favoritas, historial, racha | IndexedDB `study-serums` v1 + `study-state-v1` + `studyhub:snapshot:v1` | Persistente | Ninguna | t8 (reinicio real del navegador): 3 fichas, favoritas, 1 tarjeta y sesión de flashcards intactas |
| Dashboard | Tema y modo lector | `study-theme`, `study-dashboard-mode` | Persistente | Ninguna | Correcto |
| Dashboard | Datos dañados | `study-state-v1` con JSON roto | Recuperar sin perder lo demás | Ya recuperaba desde IndexedDB | t14: `cards 1`, `sheets 6` intactos, clave reescrita |
| Flashcards | Sesión en curso (`flashSession`) | Refresco en `#/sesion` mantiene índice, respuestas y escenario | Persistente | Ninguna | t2 y t8: índice 1, 1 respuesta antes/después |
| Flashcards | Índice y respuestas de la tarjeta | `index`/`answers` persistidos; sin doble conteo (`recordSessionAnswer` ignora repetidas) | Persistente | Ninguna | t2: 1 respuesta ⇒ 1 `card` y 1 revisión; reinicio real reanuda |
| Flashcards | Estado visual (revelada/opción marcada) | Cambiar de pestaña conserva «revelada» y la opción seleccionada | Restaurable en sesión | Ninguna | t2 pasos 3‑4 |
| Flashcards | Último mazo para HUB y `?deck&resume=1` | Al responder, `last.flashcards.deckId` pasaba al **tema** de la tarjeta: el HUB publicaba `?deck=topic-aps-atributos&resume=1` con la sesión en `sheet-aps-01` y abría `#/mazo/topic-…` sin sesión (t6, t10‑antes) | Persistente y coherente con la sesión activa | `rememberDeckContext()` en `applyReview()`: manda el mazo de la sesión y la URL lleva `resume=1`; sin sesión se conserva el formato antiguo (tema) | t10‑2.1 `?deck=sheet-aps-01&resume=1` y snapshot correcto; t10‑2.2 entra en `#/sesion` con `stage:true`; t10‑2.3 fallback idéntico al anterior |
| Flashcards | Biblioteca/filtros/acordeones | `state.library` en memoria; acordeón abierto sobrevive a la pestaña (t13), no al refresco | Restaurable en sesión | Instrucción opcional a Agente 5, §5.3 | Documentado |
| QUEST | Personaje activo / colección / equipamiento | `collection` en `serumsquest:state:v1` (esquema 2) | Persistente | Ninguna | t8 y snapshot del HUB (`selectedCharacterId: "ilan"`) |
| QUEST | XP, monedas, nivel, misiones, logros | Documento versionado + `backup`/`journal`/`snapshot` | Persistente | Ninguna | t8 tras reinicio: `xp 10`, `coins 5`, `revision 4` |
| QUEST | Sesión activa y pantalla | Refresco en `#/jugar` conserva pregunta y respuestas; abrir sin hash vuelve a `#/` con aviso | Persistente (sesión) / reiniciable (pantalla) | Ninguna | t3 pasos 4 y 10; t8 reanuda |
| QUEST | Ajustes, tema y presentación | `settings`/`presentation` + espejo `serumsquest:theme` leído por `index.html` | Persistente | Ninguna | t8 (`theme` aplicado antes del pintado) |
| QUEST | Animaciones, foco, duración elegida | `ui.*` en memoria | Temporal | Ninguna | Correcto |
| QUEST | Diario (`serumsquest:journal:v1`) | Un diario viejo se consolidaba **siempre**, aunque el estado en disco fuera más reciente | Recuperar sin retroceder | `freshness()` (revisión + `updatedAt`): solo consolida diarios más nuevos; los viejos se limpian (`serums-quest/js/store.js`) | t10‑4.1: diario rev 1 no pisa estado rev 6; t10‑4.2: diario rev 11 sí se consolida |
| QUEST | Estado dañado | JSON roto | Archivar y recuperar sin pantalla fatal | Ya archivaba (`serumsquest:archive:corrupt-state-*`) y usaba respaldo | t14: recuperado del respaldo, `recoveredFromCorrupt`, clave de archivo creada |
| QUEST | Cronómetro por pregunta | Marca absoluta `questionEndsAt`: una ausencia larga registra omisión automática al volver (t3‑9: 1 omisión) | Persistente (con efecto) | Ninguna (motor, no persistencia): se documenta para decisión de producto | Medido; no se altera |
| Plazas | Favoritos, adjudicadas, bloqueadas, comparador | `serums_favoritos`, `serums_adjudicadas`, `serums_bloqueadas`, `serums_comparador` | Persistente | Ninguna | t4 (recarga y reentrada), t8 (2 favoritos tras reinicio) |
| Plazas | Tema | `serums_theme` | Persistente | Ninguna | t4 y t8: `light` |
| Plazas | Filtros (texto, provincia, ZAF/ZE, geo, rápidos) | «ABANCAY (47)» desaparece al refrescar (t4‑3); sobreviven al cambio de pestaña | Temporal («filtros localizados») | Ninguna | Documentado |
| Plazas | Plaza seleccionada, ficha, pestaña lateral, vista | `S.selectedId`, `S.view`, `S.sideTab`, `S.stateTab` en memoria; sin routing por hash (t4‑7) | Temporal / reiniciable | Ninguna | Documentado |
| Plazas | `Store.set(k, undefined)` («Restablecer preferencias») | Guardaba la cadena `"undefined"` y dejaba claves basura | Eliminar la clave | `Store.set` elimina cuando el valor es `undefined` (`services.js`) | t10‑5.1: `before:'{"a":1}'` → `after:null` |
| Plazas | Geocaché | `saveCache` escribía el mapa completo leído antes; dos pestañas podían pisarse | Mezclar al guardar | `saveCache()` mezcla con el disco (`services.js`) | Revisado por lectura + t10‑5.1 (`getCache` intacto) |
| Plazas | Favoritos dañados | JSON roto en `serums_favoritos` | Degradar sin excepción | `LS.get` ya devuelve el valor por defecto | t14: arranca, 7323 plazas, favoritos `[]` |
| Banqueo | Profesión/examen | `banqueo-profession-v1` + hash | Persistente | Ninguna | t5 |
| Banqueo | Tema | `banqueo-theme-v1` | Persistente | Ninguna | t5: `light` tras recarga |
| Banqueo | Revisión e incidencias | Dos pestañas se pisaban: q001 marcada en A se perdía al marcar q002 en B (t6: `hasQ1:false`) | Persistente y sin pérdidas entre pestañas | `mergeReview()` antes de escribir + `storage`→`syncReviewFromStorage()` + archivo de JSON dañado (`EXAMEN STUDIO/js/store.js`) | t10‑3.1: 5 marcas, `hasA:true` y `hasB:true`, memoria sincronizada en ambas pestañas; t10‑3.2 desmarcar conserva `{r:0}`; t14b archiva `banqueo-review-v1-corrupt-*` |
| Banqueo | Intento de práctica y cronómetro | Sesión en memoria; al refrescar aparece el setup «No hay una práctica en curso», aunque el intento queda en IndexedDB como «En curso» (t5‑6/7) | Restaurable con un clic (hoy) | Instrucción exacta a Agente 6 para restaurar automáticamente, §5.4 | t5: 2 filas «Continuar»; t8 tras reinicio: 2 intentos `prog`; no se aplicó (app.js ajeno) |
| Banqueo | Exámenes, claves, importaciones, PDFs, historial | IndexedDB `examenstudio` v2, 8 almacenes | Persistente | Ninguna | t5: versión 2 y 8 almacenes, 5.100 preguntas |
| Hub | Snapshots de Study y QUEST | Solo lee `studyhub:snapshot:v1` y `serumsquest:snapshot:v1`; refresca con `storage`, `pageshow` y `visibilitychange` | Persistente (solo lectura) | Ninguna | t3‑5: el HUB leyó `answered:1` y `hasActivity:true` |
| Hub | Tarjeta seleccionada | `activeIndex` en memoria; siempre arranca en la primera | Temporal | Ninguna (no es propiedad del Agente 2) | Código 1650/1933 |

## Ciclo de vida: resultados (detalle en `AUDIT/PERSISTENCIA.md` §3)

1. **Pestaña**: sin navegaciones; Study y QUEST conservan sesión, scroll y cronómetro.
2. **Refresco**: Study restaura ficha/posición; Flashcards y QUEST conservan sesión;
   Plazas vuelve al mapa (filtros temporales); Banqueo pierde la vista de práctica pero
   conserva el intento y la revisión.
3. **Cerrar/reabrir sección**: sin pérdida de datos en las cinco apps.
4. **HUB y reentrada**: datos y snapshots intactos.
5. **Otra app y volver**: el HUB lee el progreso real al volver.
6. **URL directa**: `?sheet=`, `?deck=&mode=`, `?deck=&resume=1`, `#/jugar`, `#practice`.
7. **Atrás/adelante**: hashchange sin recarga en Study/QUEST; Plazas y Banqueo navegan
   documentos completos (pierden vista, no datos).
8. **Orientación**: sin recarga; el scroll se reajusta por reflujo sin pérdida de datos.
9. **Cierre real del navegador** (mismo `--user-data-dir`, probado cerrando y relanzando
   Chrome): las cinco apps conservan su estado, incluidas sesión de Flashcards, sesión de
   QUEST y los dos intentos `prog` de Banqueo.
10. **`file://` vs `http://`**: ambos arrancan y permiten `localStorage` + IndexedDB en
    Chrome, pero son **orígenes distintos**: el progreso no se comparte entre ellos.

## Resumen final

- **Corregido y probado en mis archivos (4):**
  1. Study: la reanudación del HUB ya no apunta a otro mazo (evidencia t6 vs t10‑2).
  2. Study: la posición de lectura deja de borrarse con un 0 de apertura (t1 vs t11).
  3. Study: `pageshow` sincroniza el estado al volver (defensa para bfcache).
  4. QUEST: un diario viejo ya no revierte el estado (t10‑4.1/4.2).
  5. Banqueo: revisión e incidencias ya no se pierden entre pestañas; el JSON dañado se
     archiva antes de continuar (t6 vs t10‑3, t14b).
  6. Plazas: `Store.set(k, undefined)` borra la clave; el geocaché se mezcla al guardar
     (t10‑5.1).
- **Sin cambios de claves, formatos, versiones de IndexedDB ni borrados**; se siguen
  leyendo los formatos antiguos y `study-serums` v1 / `examenstudio` v2 / `serumsdb` v1
  abren sin upgrade.
- **Requiere a otros agentes (instrucciones exactas en `AUDIT/PERSISTENCIA.md` §5):**
  acordeones de biblioteca del Dashboard, filtros de Study en `sessionStorage`,
  restauración automática del intento de práctica de Banqueo y el enlace de reanudación
  del HUB (ya funciona con el dato corregido).
- **No probado / límites honestos:** bfcache real (headless no lo activó), mapa de Google
  en Plazas (sin API en headless), vista de revisión de Banqueo por UI (archivo en edición;
  se probó su API), cierre forzado del navegador (solo cierre ordenado).
- **Contexto:** otros agentes editaban `app.js`/HTML durante la auditoría; las mediciones
  «antes» (05:04) y «después» (05:20–05:22) son de versiones distintas de esos archivos,
  nunca de mis stores (sin cambios ajenos).
