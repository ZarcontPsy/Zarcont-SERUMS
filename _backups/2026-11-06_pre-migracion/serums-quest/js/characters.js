/* SERUMS QUEST - catálogo original de personajes y cosméticos
   © 2026 ZARCONT. Datos puros: no leen ni escriben el estado del jugador.
   Los precios NO se declaran aquí: se resuelven desde QUEST_CONFIG.rpg.prices,
   que es la única fuente de la economía. */
(function () {
  "use strict";

  var C = window.QUEST_CONFIG;

  /* ------------------------------------------------------------------ */
  /* Personalidades                                                     */
  /* ------------------------------------------------------------------ */
  var PERSONALITY_META = {
    estratega: {
      id: "estratega",
      label: "Estratega",
      short: "Analítica y serena",
      description: "Lee el conjunto, elige una ruta y sostiene la decisión. Celebra la precisión, no el volumen."
    },
    exploradora: {
      id: "exploradora",
      label: "Exploradora",
      short: "Curiosa y dinámica",
      description: "Se mueve hacia lo desconocido y convierte cada error en un tramo nuevo del mapa."
    },
    mentor: {
      id: "mentor",
      label: "Mentor",
      short: "Paciente y reflexiva",
      description: "Escucha antes de corregir. Devuelve preguntas que ordenan el pensamiento y sostiene el proceso."
    },
    prodigio: {
      id: "prodigio",
      label: "Prodigio",
      short: "Competitiva y enérgica",
      description: "Compite contra su propio último intento. Exige ritmo, pero no acepta un atajo sin criterio."
    },
    guardian: {
      id: "guardián",
      label: "Guardián",
      short: "Disciplinada y perseverante",
      description: "Protege el método y la constancia. Prefiere un paso verificable a diez pasos apresurados."
    },
    investigadora: {
      id: "investigadora",
      label: "Investigadora",
      short: "Observadora y metódica",
      description: "Mira el diseño, la fuente y el límite de la evidencia antes de aceptar una conclusión."
    }
  };

  var ALL_SLOTS = ["cabeza", "peinado", "torso", "piernas", "accesorios", "extras", "amuletos", "efectos", "marcos"];

  function slotsWithout() {
    var removed = Array.prototype.slice.call(arguments);
    return ALL_SLOTS.filter(function (slot) { return removed.indexOf(slot) === -1; });
  }

  function animations(variant) {
    var base = ["idle", "correct", "streak", "wrong", "defeat", "victory", "levelup", "unlock"];
    if (variant) base.push(variant);
    return base;
  }

  /* ------------------------------------------------------------------ */
  /* Personajes                                                         */
  /* ------------------------------------------------------------------ */
  var CHARACTER_DATA = [
    {
      id: "ilan",
      name: "Ilan Vega",
      title: "Brújula del Alba",
      personality: "estratega",
      rarity: "inicial",
      description: "Antes de responder, Ilan dibuja el problema. Su cuaderno es un tablero: rutas, descartes y una sola decisión por línea.",
      quote: "Una buena respuesta empieza por saber qué se está preguntando.",
      areaAffinity: "area-psi-salud-publica",
      attributes: { enfoque: 74, perseverancia: 66, curiosidad: 71, estrategia: 88, adaptabilidad: 76 },
      signaturePerk: "Página de estrategia: su presentación incluye un consejo de planificación. No modifica XP, monedas ni puntuación.",
      slots: ALL_SLOTS.slice(),
      availableAnimations: animations("victory-plan"),
      access: { kind: "starter", label: "Personaje inicial", description: "Disponible desde el primer arranque." },
      assetReferences: {
        renderer: "quest-char-art",
        artKey: "ilan",
        source: "SVG vectorial original generado por js/character-art.js",
        upgradePath: "assets/characters/ilan.svg"
      },
      signature: { prop: "Cuaderno de rutas", gesture: "Traza una línea en el aire antes de decidir." }
    },
    {
      id: "mara",
      name: "Mara Solís",
      title: "Exploradora de Territorio",
      personality: "exploradora",
      rarity: "comun",
      description: "Mara llega primero al barrio, pregunta antes de suponer y vuelve con el mapa corregido. Para ella, cada error es una calle nueva.",
      quote: "Si no conocés el territorio, el dato te queda corto.",
      areaAffinity: "area-psi-salud-publica",
      attributes: { enfoque: 62, perseverancia: 70, curiosidad: 92, estrategia: 68, adaptabilidad: 85 },
      signaturePerk: "Mapa de campo: muestra el rumbo del área en su ficha. Sin efecto sobre la puntuación.",
      slots: ALL_SLOTS.slice(),
      availableAnimations: animations("victory-map"),
      access: { kind: "purchase", label: "En la tienda", description: "Se compra con las monedas ganadas en sesiones." },
      assetReferences: {
        renderer: "quest-char-art",
        artKey: "mara",
        source: "SVG vectorial original generado por js/character-art.js",
        upgradePath: "assets/characters/mara.svg"
      },
      signature: { prop: "Mapa de campo", gesture: "Despliega el mapa y señala una ruta nueva." }
    },
    {
      id: "noa",
      name: "Noa Iturbe",
      title: "Ojo de la Evidencia",
      personality: "investigadora",
      rarity: "poco_comun",
      description: "Noa no discute una conclusión sin mirar el diseño que la sostiene. Anota fuentes, fechas y, sobre todo, lo que falta.",
      quote: "La evidencia también se lee por sus ausencias.",
      areaAffinity: "area-psi-investigacion",
      attributes: { enfoque: 90, perseverancia: 74, curiosidad: 84, estrategia: 76, adaptabilidad: 60 },
      signaturePerk: "Lupa metodológica: resalta el área temática de la ficha. No altera preguntas ni claves.",
      slots: ALL_SLOTS.slice(),
      availableAnimations: animations("victory-lens"),
      access: { kind: "purchase", label: "En la tienda", description: "Se compra con las monedas ganadas en sesiones." },
      assetReferences: {
        renderer: "quest-char-art",
        artKey: "noa",
        source: "SVG vectorial original generado por js/character-art.js",
        upgradePath: "assets/characters/noa.svg"
      },
      signature: { prop: "Tableta de evidencia", gesture: "Amplía un dato y lo subraya con el lápiz." }
    },
    {
      id: "teo",
      name: "Teo Alcázar",
      title: "Mentor de la Escucha",
      personality: "mentor",
      rarity: "poco_comun",
      description: "Teo escucha el caso completo antes de hablar. No regala respuestas: devuelve preguntas que ordenan el pensamiento.",
      quote: "Escuchar bien ya es parte del tratamiento.",
      areaAffinity: "area-psi-cuidado-integral",
      attributes: { enfoque: 82, perseverancia: 80, curiosidad: 72, estrategia: 70, adaptabilidad: 78 },
      signaturePerk: "Cuaderno de escucha: incluye una pregunta de repaso al cerrar la sesión. Sin efecto en la nota.",
      slots: ALL_SLOTS.slice(),
      availableAnimations: animations("victory-note"),
      access: { kind: "purchase", label: "En la tienda", description: "Se compra con las monedas ganadas en sesiones." },
      assetReferences: {
        renderer: "quest-char-art",
        artKey: "teo",
        source: "SVG vectorial original generado por js/character-art.js",
        upgradePath: "assets/characters/teo.svg"
      },
      signature: { prop: "Libro de escucha", gesture: "Cierra el libro y asiente despacio." }
    },
    {
      id: "lia",
      name: "Lía Márquez",
      title: "Chispa del Criterio",
      personality: "prodigio",
      rarity: "raro",
      description: "Lía compite contra su último intento. Lee rápido, elige rápido y revisa dos veces cuando la apuesta es alta.",
      quote: "Rápido no sirve si el criterio va detrás.",
      areaAffinity: "area-psi-etica",
      attributes: { enfoque: 88, perseverancia: 68, curiosidad: 70, estrategia: 80, adaptabilidad: 88 },
      signaturePerk: "Cronómetro personal: muestra el tiempo de su última sesión. No premia responder rápido.",
      slots: ALL_SLOTS.slice(),
      availableAnimations: animations("victory-timer"),
      access: { kind: "purchase", label: "En la tienda", description: "Se compra con las monedas ganadas en sesiones." },
      assetReferences: {
        renderer: "quest-char-art",
        artKey: "lia",
        source: "SVG vectorial original generado por js/character-art.js",
        upgradePath: "assets/characters/lia.svg"
      },
      signature: { prop: "Cronómetro", gesture: "Detiene el cronómetro y levanta el pulgar." }
    },
    {
      id: "kian",
      name: "Kian Ferro",
      title: "Guardián del Método",
      personality: "guardian",
      rarity: "raro",
      description: "Kian sostiene el procedimiento cuando el atajo tienta. Su rutina es simple: registrar, verificar y repetir sin ruido.",
      quote: "El método aguanta lo que el entusiasmo olvida.",
      areaAffinity: "area-psi-investigacion",
      attributes: { enfoque: 92, perseverancia: 94, curiosidad: 58, estrategia: 80, adaptabilidad: 55 },
      signaturePerk: "Sello de verificación: marca el PDF de origen en su ficha. Sin ventaja académica.",
      slots: slotsWithout("peinado"),
      availableAnimations: animations("victory-seal"),
      access: { kind: "purchase", label: "En la tienda", description: "Se compra con las monedas ganadas en sesiones." },
      assetReferences: {
        renderer: "quest-char-art",
        artKey: "kian",
        source: "SVG vectorial original generado por js/character-art.js",
        upgradePath: "assets/characters/kian.svg"
      },
      signature: { prop: "Sello de método", gesture: "Estampa el sello y cruza los brazos." }
    },
    {
      id: "amaru",
      name: "Amaru Cielo",
      title: "Vigía de la Ruta",
      personality: "exploradora",
      rarity: "raro",
      description: "Amaru camina con una linterna y un mapa cosido al poncho. Marca los desvíos para que nadie vuelva a perderse.",
      quote: "El camino se comparte o no se aprende.",
      areaAffinity: "area-psi-salud-publica",
      attributes: { enfoque: 70, perseverancia: 84, curiosidad: 88, estrategia: 72, adaptabilidad: 90 },
      signaturePerk: "Linterna de ruta: su ficha ilumina el área de menor evidencia. No cambia la dificultad.",
      slots: slotsWithout("cabeza"),
      availableAnimations: animations("victory-lantern"),
      access: {
        kind: "reward",
        label: "Recompensa de recorrido",
        missions: 5,
        description: "Se desbloquea al completar 5 misiones. No se compra con monedas."
      },
      assetReferences: {
        renderer: "quest-char-art",
        artKey: "amaru",
        source: "SVG vectorial original generado por js/character-art.js",
        upgradePath: "assets/characters/amaru.svg"
      },
      signature: { prop: "Linterna de ruta", gesture: "Levanta la linterna y barre el horizonte." }
    },
    {
      id: "ona",
      name: "Ona Beltrán",
      title: "Arquitecta del Sistema",
      personality: "estratega",
      rarity: "epico",
      description: "Ona piensa en redes, turnos y recursos. Su mesa de trabajo parece una ciudad vista desde arriba y siempre tiene un plano abierto.",
      quote: "Un sistema bien pensado cuida a quien lo usa.",
      areaAffinity: "area-psi-gestion",
      attributes: { enfoque: 86, perseverancia: 82, curiosidad: 68, estrategia: 96, adaptabilidad: 74 },
      signaturePerk: "Plano de red: muestra el avance por área como una red. Sin modificar la puntuación.",
      slots: ALL_SLOTS.slice(),
      availableAnimations: animations("victory-blueprint"),
      access: { kind: "purchase", label: "En la tienda", description: "Se compra con las monedas ganadas en sesiones." },
      assetReferences: {
        renderer: "quest-char-art",
        artKey: "ona",
        source: "SVG vectorial original generado por js/character-art.js",
        upgradePath: "assets/characters/ona.svg"
      },
      signature: { prop: "Plano de sistemas", gesture: "Extiende el plano y traza una línea de conexión." }
    },
    {
      id: "iris",
      name: "Iris Calderón",
      title: "Custodia de la Confianza",
      personality: "guardian",
      rarity: "epico",
      description: "Iris camina despacio y escucha de pie. Allí donde una decisión puede romper la confianza, ella levanta la luz antes de hablar.",
      quote: "La confianza no se negocia: se protege.",
      areaAffinity: "area-psi-etica",
      attributes: { enfoque: 84, perseverancia: 90, curiosidad: 70, estrategia: 82, adaptabilidad: 66 },
      signaturePerk: "Luz de cuidado: añade un recordatorio de confidencialidad en su ficha. No afecta a las respuestas.",
      slots: ALL_SLOTS.slice(),
      availableAnimations: animations("victory-light"),
      access: { kind: "purchase", label: "En la tienda", description: "Se compra con las monedas ganadas en sesiones." },
      assetReferences: {
        renderer: "quest-char-art",
        artKey: "iris",
        source: "SVG vectorial original generado por js/character-art.js",
        upgradePath: "assets/characters/iris.svg"
      },
      signature: { prop: "Farol de cuidado", gesture: "Eleva el farol y lo cubre con la mano libre." }
    },
    {
      id: "zenon",
      name: "Zenón Atlas",
      title: "Cronista del Dominio",
      personality: "mentor",
      rarity: "legendario",
      description: "Zenón ha visto pasar generaciones de exámenes. No memoriza: conecta un caso con cien preguntas anteriores y recuerda por qué importaba.",
      quote: "El dominio es recordar por qué, no solo cuál.",
      areaAffinity: "area-psi-investigacion",
      attributes: { enfoque: 94, perseverancia: 88, curiosidad: 86, estrategia: 94, adaptabilidad: 80 },
      signaturePerk: "Archivo vivo: su presentación muestra el tema conectado con mayor dominio. Sin bonificación de XP.",
      slots: slotsWithout("peinado"),
      availableAnimations: animations("victory-archive"),
      access: {
        kind: "purchase",
        label: "Colección legendaria",
        level: 8,
        description: "Requiere nivel 8 y 5.400 monedas. Se compra una sola vez."
      },
      assetReferences: {
        renderer: "quest-char-art",
        artKey: "zenon",
        source: "SVG vectorial original generado por js/character-art.js",
        upgradePath: "assets/characters/zenon.svg"
      },
      signature: { prop: "Bastón de archivo", gesture: "Golpea el suelo y abre los anillos del archivo." }
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Cosméticos                                                         */
  /* ------------------------------------------------------------------ */
  function allBut() {
    var removed = Array.prototype.slice.call(arguments);
    return CHARACTER_DATA.map(function (c) { return c.id; }).filter(function (id) { return removed.indexOf(id) === -1; });
  }

  var COSMETIC_DATA = [
    {
      id: "c-cabeza-diadema",
      name: "Diadema de circuitos",
      description: "Una cinta conductora con tres nodos que se encienden al ritmo del pensamiento.",
      category: "cabeza",
      rarity: "raro",
      compatibleCharacterIds: allBut("amaru"),
      unlockRequirements: null,
      assetReferences: { renderer: "quest-char-art", layer: "head", artKey: "cabeza-diadema" }
    },
    {
      id: "c-cabeza-casco",
      name: "Casco de vigía",
      description: "Media armadura de campaña con visera corta. Protege la atención de las distracciones.",
      category: "cabeza",
      rarity: "epico",
      compatibleCharacterIds: ["kian", "ona", "iris", "mara"],
      unlockRequirements: null,
      assetReferences: { renderer: "quest-char-art", layer: "head", artKey: "cabeza-casco" }
    },
    {
      id: "c-cabeza-gorro",
      name: "Gorro de campaña",
      description: "Tela gastada en el borde y una pequeña insignia de ruta en el centro.",
      category: "cabeza",
      rarity: "comun",
      compatibleCharacterIds: ["mara", "noa", "amaru", "teo"],
      unlockRequirements: null,
      assetReferences: { renderer: "quest-char-art", layer: "head", artKey: "cabeza-gorro" }
    },
    {
      id: "c-cabeza-corona",
      name: "Corona de constelaciones",
      description: "Cinco puntas y una órbita mínima. Reservada a quien ya recorrió el mapa completo.",
      category: "cabeza",
      rarity: "legendario",
      compatibleCharacterIds: ["zenon", "iris", "ona", "ilan"],
      unlockRequirements: { kind: "level", level: 10, label: "Alcanza el nivel 10" },
      assetReferences: { renderer: "quest-char-art", layer: "head", artKey: "cabeza-corona" }
    },
    {
      id: "c-cabeza-auriculares",
      name: "Auriculares de foco",
      description: "Cancelan el ruido del pasillo y dejan pasar solo la voz del caso.",
      category: "cabeza",
      rarity: "poco_comun",
      compatibleCharacterIds: ["lia", "noa", "ilan", "teo"],
      unlockRequirements: null,
      assetReferences: { renderer: "quest-char-art", layer: "head", artKey: "cabeza-auriculares" }
    },
    {
      id: "c-peinado-coleta",
      name: "Coleta de cometa",
      description: "Un mechón alto que se mueve como estela cuando el personaje celebra.",
      category: "peinado",
      rarity: "comun",
      compatibleCharacterIds: allBut("kian", "zenon"),
      unlockRequirements: null,
      assetReferences: { renderer: "quest-char-art", layer: "hair", artKey: "peinado-coleta" }
    },
    {
      id: "c-peinado-rizos",
      name: "Rizos de tinta",
      description: "Volumen irregular y una sombra azulada que recuerda a las notas manuscritas.",
      category: "peinado",
      rarity: "poco_comun",
      compatibleCharacterIds: allBut("kian", "zenon"),
      unlockRequirements: null,
      assetReferences: { renderer: "quest-char-art", layer: "hair", artKey: "peinado-rizos" }
    },
    {
      id: "c-peinado-mecha",
      name: "Mecha violeta",
      description: "Una franja de color reservada para los hitos que no se repiten.",
      category: "peinado",
      rarity: "raro",
      compatibleCharacterIds: allBut("kian", "zenon"),
      unlockRequirements: null,
      assetReferences: { renderer: "quest-char-art", layer: "hair", artKey: "peinado-mecha" }
    },
    {
      id: "c-peinado-mono",
      name: "Moño de archivo",
      description: "Recogido y firme. Nada que se interponga entre la mirada y el dato.",
      category: "peinado",
      rarity: "comun",
      compatibleCharacterIds: allBut("kian", "zenon"),
      unlockRequirements: null,
      assetReferences: { renderer: "quest-char-art", layer: "hair", artKey: "peinado-mono" }
    },
    {
      id: "c-torso-abrigo",
      name: "Abrigo de guardia",
      description: "Solapas anchas y forro azul. Un uniforme para las sesiones que exigen aguante.",
      category: "torso",
      rarity: "raro",
      compatibleCharacterIds: allBut(),
      unlockRequirements: null,
      assetReferences: { renderer: "quest-char-art", layer: "torso", artKey: "torso-abrigo" }
    },
    {
      id: "c-torso-bata",
      name: "Bata de evidencia",
      description: "Bolsillos para fichas, un lápiz siempre a mano y el cuello impecable.",
      category: "torso",
      rarity: "poco_comun",
      compatibleCharacterIds: ["noa", "teo", "zenon", "ilan", "iris"],
      unlockRequirements: null,
      assetReferences: { renderer: "quest-char-art", layer: "torso", artKey: "torso-bata" }
    },
    {
      id: "c-torso-manto",
      name: "Manto de constelaciones",
      description: "Tela profunda con puntos de luz bordados a mano. Se mueve como si tuviera su propio cielo.",
      category: "torso",
      rarity: "epico",
      compatibleCharacterIds: ["iris", "zenon", "ona", "amaru"],
      unlockRequirements: null,
      assetReferences: { renderer: "quest-char-art", layer: "torso", artKey: "torso-manto" }
    },
    {
      id: "c-torso-chaleco",
      name: "Chaleco de misiones",
      description: "Ligero, con bolsillos medidos y una cinta reflectante que no molesta al leer.",
      category: "torso",
      rarity: "comun",
      compatibleCharacterIds: allBut(),
      unlockRequirements: null,
      assetReferences: { renderer: "quest-char-art", layer: "torso", artKey: "torso-chaleco" }
    },
    {
      id: "c-torso-poncho",
      name: "Poncho de viaje",
      description: "Tejido denso con guardas geométricas originales y un borde que aguanta el polvo del camino.",
      category: "torso",
      rarity: "raro",
      compatibleCharacterIds: ["amaru", "mara", "teo", "noa"],
      unlockRequirements: null,
      assetReferences: { renderer: "quest-char-art", layer: "torso", artKey: "torso-poncho" }
    },
    {
      id: "c-piernas-ruta",
      name: "Perneras de ruta",
      description: "Correas cruzadas y una placa que registra cada tramo recorrido.",
      category: "piernas",
      rarity: "comun",
      compatibleCharacterIds: allBut(),
      unlockRequirements: null,
      assetReferences: { renderer: "quest-char-art", layer: "legs", artKey: "piernas-ruta" }
    },
    {
      id: "c-piernas-falda",
      name: "Falda de mapas",
      description: "Pliegues que esconden trazos de rutas antiguas. Elegante, práctica y un poco rebelde.",
      category: "piernas",
      rarity: "poco_comun",
      compatibleCharacterIds: ["mara", "noa", "lia", "iris", "ona"],
      unlockRequirements: null,
      assetReferences: { renderer: "quest-char-art", layer: "legs", artKey: "piernas-falda" }
    },
    {
      id: "c-piernas-grebas",
      name: "Grebas de método",
      description: "Placas ligeras para quien no piensa moverse del procedimiento.",
      category: "piernas",
      rarity: "raro",
      compatibleCharacterIds: ["kian", "ona", "zenon", "iris"],
      unlockRequirements: null,
      assetReferences: { renderer: "quest-char-art", layer: "legs", artKey: "piernas-grebas" }
    },
    {
      id: "c-accesorios-gafas",
      name: "Gafas de precisión",
      description: "Dos lentes finas que convierten una página densa en una línea legible.",
      category: "accesorios",
      rarity: "poco_comun",
      compatibleCharacterIds: ["noa", "teo", "zenon", "ilan", "ona"],
      unlockRequirements: null,
      assetReferences: { renderer: "quest-char-art", layer: "accessory", artKey: "accesorios-gafas" }
    },
    {
      id: "c-accesorios-brujula",
      name: "Brújula de muñeca",
      description: "Un pequeño instrumento de latón que siempre apunta hacia la siguiente decisión.",
      category: "accesorios",
      rarity: "comun",
      compatibleCharacterIds: allBut(),
      unlockRequirements: null,
      assetReferences: { renderer: "quest-char-art", layer: "accessory", artKey: "accesorios-brujula" }
    },
    {
      id: "c-accesorios-bolso",
      name: "Bolso de campo",
      description: "Cuero gastado, dos compartimentos y una libreta que asoma por la solapa.",
      category: "extras",
      rarity: "comun",
      compatibleCharacterIds: allBut("iris", "zenon"),
      unlockRequirements: null,
      assetReferences: { renderer: "quest-char-art", layer: "accessory", artKey: "accesorios-bolso" }
    },
    {
      id: "c-accesorios-pluma",
      name: "Pluma de archivo",
      description: "Una pluma de metal que no escribe tinta: escribe marcas en el margen de la memoria.",
      category: "extras",
      rarity: "raro",
      compatibleCharacterIds: ["zenon", "iris", "ona", "teo", "noa"],
      unlockRequirements: null,
      assetReferences: { renderer: "quest-char-art", layer: "accessory", artKey: "accesorios-pluma" }
    },
    {
      id: "c-amuleto-enfoque",
      name: "Amuleto de enfoque",
      description: "Un prisma que concentra la luz sobre una sola idea. No hace la pregunta más fácil.",
      category: "amuletos",
      rarity: "raro",
      compatibleCharacterIds: allBut(),
      unlockRequirements: null,
      assetReferences: { renderer: "quest-char-art", layer: "amulet", artKey: "amuleto-enfoque" }
    },
    {
      id: "c-amuleto-sello",
      name: "Sello del método",
      description: "Un sello de bronce con la marca del procedimiento verificado.",
      category: "amuletos",
      rarity: "epico",
      compatibleCharacterIds: ["kian", "noa", "zenon", "ona"],
      unlockRequirements: null,
      assetReferences: { renderer: "quest-char-art", layer: "amulet", artKey: "amuleto-sello" }
    },
    {
      id: "c-amuleto-nudo",
      name: "Nudo de la memoria",
      description: "Un nudo de cordón que se aprieta cada vez que algo vuelve a aparecer en el repaso.",
      category: "amuletos",
      rarity: "poco_comun",
      compatibleCharacterIds: allBut(),
      unlockRequirements: null,
      assetReferences: { renderer: "quest-char-art", layer: "amulet", artKey: "amuleto-nudo" }
    },
    {
      id: "c-amuleto-criterio",
      name: "Reliquia del criterio",
      description: "Una pieza reservada para quien sostiene 80% de precisión con evidencia suficiente.",
      category: "amuletos",
      rarity: "epico",
      compatibleCharacterIds: ["iris", "lia", "ona", "teo"],
      unlockRequirements: { kind: "achievement", achievementId: "precision-80", label: "Desbloquea el logro «Criterio»" },
      assetReferences: { renderer: "quest-char-art", layer: "amulet", artKey: "amuleto-criterio" }
    },
    {
      id: "c-efecto-aura",
      name: "Aura de alba",
      description: "Un halo cálido que aparece detrás del personaje y se apaga cuando la sesión termina.",
      category: "efectos",
      rarity: "raro",
      compatibleCharacterIds: allBut(),
      unlockRequirements: null,
      assetReferences: { renderer: "quest-char-art", layer: "effect", artKey: "efecto-aura" }
    },
    {
      id: "c-efecto-chispas",
      name: "Chispas de racha",
      description: "Pequeñas chispas que solo se encienden cuando la racha avanza.",
      category: "efectos",
      rarity: "poco_comun",
      compatibleCharacterIds: allBut(),
      unlockRequirements: null,
      assetReferences: { renderer: "quest-char-art", layer: "effect", artKey: "efecto-chispas" }
    },
    {
      id: "c-efecto-bruma",
      name: "Bruma de estudio",
      description: "Una neblina baja y silenciosa que da profundidad al retrato sin tapar la lectura.",
      category: "efectos",
      rarity: "comun",
      compatibleCharacterIds: allBut(),
      unlockRequirements: null,
      assetReferences: { renderer: "quest-char-art", layer: "effect", artKey: "efecto-bruma" }
    },
    {
      id: "c-efecto-constelacion",
      name: "Constelación de logros",
      description: "Cuatro estrellas unidas por una línea tenue. Aparece al completar una semana de racha.",
      category: "efectos",
      rarity: "legendario",
      compatibleCharacterIds: allBut(),
      unlockRequirements: { kind: "achievement", achievementId: "racha-7", label: "Desbloquea el logro «Semana completa»" },
      assetReferences: { renderer: "quest-char-art", layer: "effect", artKey: "efecto-constelacion" }
    },
    {
      id: "c-marco-bronce",
      name: "Marco de bronce",
      description: "Esquinas reforzadas y una línea simple. El primer marco de una colección.",
      category: "marcos",
      rarity: "comun",
      compatibleCharacterIds: allBut(),
      unlockRequirements: null,
      assetReferences: { renderer: "quest-char-art", layer: "frame", artKey: "marco-bronce" }
    },
    {
      id: "c-marco-platino",
      name: "Marco de platino",
      description: "Filo frío y geometría precisa para una vitrina que ya tiene historia.",
      category: "marcos",
      rarity: "raro",
      compatibleCharacterIds: allBut(),
      unlockRequirements: null,
      assetReferences: { renderer: "quest-char-art", layer: "frame", artKey: "marco-platino" }
    },
    {
      id: "c-marco-vacio",
      name: "Marco del vacío",
      description: "Un borde que parece recortado en la oscuridad y deja escapar un filo violeta.",
      category: "marcos",
      rarity: "epico",
      compatibleCharacterIds: allBut(),
      unlockRequirements: null,
      assetReferences: { renderer: "quest-char-art", layer: "frame", artKey: "marco-vacio" }
    },
    {
      id: "c-marco-constelacion",
      name: "Marco de constelación",
      description: "Un marco de vitrina mayor: se obtiene al completar cinco misiones.",
      category: "marcos",
      rarity: "legendario",
      compatibleCharacterIds: allBut(),
      unlockRequirements: { kind: "achievement", achievementId: "cinco-misiones", label: "Desbloquea el logro «Cartógrafo»" },
      assetReferences: { renderer: "quest-char-art", layer: "frame", artKey: "marco-constelacion" }
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Resolución del catálogo                                            */
  /* ------------------------------------------------------------------ */
  var RARITIES = C.rpg.rarities;

  function priceFor(kind, id) {
    var table = kind === "character" ? C.rpg.prices.characters : C.rpg.prices.cosmetics;
    return Math.max(0, Number(table[id]) || 0);
  }

  function resolveCharacter(raw) {
    var character = Object.assign({}, raw);
    character.price = priceFor("character", raw.id);
    character.rarityMeta = RARITIES[raw.rarity] || RARITIES.comun;
    character.rarityLabel = character.rarityMeta.label;
    character.personalityMeta = PERSONALITY_META[raw.personality] || PERSONALITY_META.estratega;
    character.slotIds = (raw.slots || ALL_SLOTS).slice();
    character.unlockRequirements = raw.access || null;
    character.supportedCosmetics = COSMETIC_DATA.filter(function (cosmetic) {
      return cosmetic.compatibleCharacterIds.indexOf(raw.id) !== -1 &&
        character.slotIds.indexOf(cosmetic.category) !== -1;
    }).map(function (cosmetic) { return cosmetic.id; });
    character.forSale = raw.access.kind === "purchase";
    return character;
  }

  function resolveCosmetic(raw) {
    var cosmetic = Object.assign({}, raw);
    cosmetic.price = priceFor("cosmetic", raw.id);
    cosmetic.rarityMeta = RARITIES[raw.rarity] || RARITIES.comun;
    cosmetic.rarityLabel = cosmetic.rarityMeta.label;
    cosmetic.slot = raw.category;
    cosmetic.unlockRequirements = raw.unlockRequirements || null;
    cosmetic.forSale = !raw.unlockRequirements;
    cosmetic.compatibleCharacterIds = raw.compatibleCharacterIds.slice();
    return cosmetic;
  }

  var characters = CHARACTER_DATA.map(resolveCharacter);
  var cosmetics = COSMETIC_DATA.map(resolveCosmetic);
  var charactersById = {};
  var cosmeticsById = {};
  characters.forEach(function (c) { charactersById[c.id] = c; });
  cosmetics.forEach(function (c) { cosmeticsById[c.id] = c; });

  var cosmByCategory = {};
  C.rpg.slots.forEach(function (slot) { cosmByCategory[slot.id] = []; });
  cosmetics.forEach(function (cosmetic) {
    if (!cosmByCategory[cosmetic.category]) cosmByCategory[cosmetic.category] = [];
    cosmByCategory[cosmetic.category].push(cosmetic);
  });

  function characterById(id) { return charactersById[id] || null; }
  function cosmeticById(id) { return cosmeticsById[id] || null; }
  function cosmeticsForCategory(category) { return (cosmByCategory[category] || []).slice(); }
  function compatibleWith(characterId, category) {
    return cosmetics.filter(function (cosmetic) {
      if (category && cosmetic.category !== category) return false;
      return cosmetic.compatibleCharacterIds.indexOf(characterId) !== -1;
    });
  }
  function isCompatible(characterId, cosmeticId) {
    var character = characterById(characterId);
    var cosmetic = cosmeticById(cosmeticId);
    if (!character || !cosmetic) return false;
    if (character.slotIds.indexOf(cosmetic.category) === -1) return false;
    return cosmetic.compatibleCharacterIds.indexOf(characterId) !== -1;
  }
  function personalityOf(characterId) {
    var character = characterById(characterId);
    return character ? character.personality : "estratega";
  }
  function rarityList() {
    return Object.keys(RARITIES).map(function (key) { return RARITIES[key]; }).sort(function (a, b) { return a.order - b.order; });
  }
  function rarityMeta(key) { return RARITIES[key] || RARITIES.comun; }
  function slotMeta(slotId) {
    return C.rpg.slots.filter(function (slot) { return slot.id === slotId; })[0] || null;
  }

  window.QuestCharacters = {
    ALL_SLOTS: ALL_SLOTS,
    PERSONALITY_META: PERSONALITY_META,
    characters: characters,
    cosmetics: cosmetics,
    byId: characterById,
    cosmeticById: cosmeticById,
    cosmeticsForCategory: cosmeticsForCategory,
    compatibleWith: compatibleWith,
    isCompatible: isCompatible,
    personalityOf: personalityOf,
    rarityList: rarityList,
    rarityMeta: rarityMeta,
    slotMeta: slotMeta,
    starterId: "ilan",
    priceFor: priceFor
  };
})();
