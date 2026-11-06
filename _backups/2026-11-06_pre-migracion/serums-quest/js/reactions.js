/* SERUMS QUEST - voz de los personajes
   © 2026 ZARCONT. Cada personalidad tiene su propio repertorio por evento.
   El motor de juego no elige frases: la interfaz pide un mensaje con un índice
   de rotación para no repetir siempre la misma línea. */
(function () {
  "use strict";

  var C = window.QUEST_CONFIG;
  var U = window.QuestUtil;
  var Chars = window.QuestCharacters;

  var EVENTS = ["idle", "correct", "streak", "wrong", "defeat", "victory", "levelup"];

  var MESSAGES = {
    estratega: {
      idle: [
        "Elige la siguiente ruta cuando estés listo.",
        "Reviso el mapa mientras decides.",
        "Una misión corta también mueve la ruta."
      ],
      correct: [
        "Precisión. La ruta se sostiene en decisiones pequeñas.",
        "Ese razonamiento tiene estructura. Sigue así.",
        "Bien elegido. Descartaste lo que no sostenía el caso.",
        "Coherente. La clave estaba donde la lógica la dejaba."
      ],
      streak: [
        "Tres aciertos seguidos: el patrón empieza a ser tuyo.",
        "La racha confirma el criterio, no la suerte.",
        "Mantén el ritmo. Sin prisa y sin ruido."
      ],
      wrong: [
        "Ese desvío enseña más que el acierto. Revisa el enunciado.",
        "Ajusta el plan: ¿qué palabra del caso cambió la decisión?",
        "Anotado. El error también es un dato."
      ],
      defeat: [
        "El plan necesita otra vuelta. Conserva lo que ya sabes.",
        "No es un fracaso: es información para la próxima ruta.",
        "Revisemos juntos dónde se torció la decisión."
      ],
      victory: [
        "Misión cerrada. El método funcionó de principio a fin.",
        "Objetivo alcanzado. Ahora conviene consolidar lo aprendido.",
        "Buen cierre. La ruta continúa en la próxima sesión."
      ],
      levelup: [
        "Nuevo nivel. La experiencia ya no es solo cantidad: es criterio.",
        "Ascenso registrado. Sostén el mismo rigor.",
        "Nivel alcanzado. El siguiente tramo pide la misma precisión."
      ]
    },
    exploradora: {
      idle: [
        "¿Qué ruta exploramos ahora?",
        "Hay un tramo del mapa que todavía no conocés.",
        "Traigo el mapa listo. Falta el primer paso."
      ],
      correct: [
        "¡Ese territorio ya es tuyo!",
        "Buen hallazgo. Ese concepto se queda en el mapa.",
        "¡Exacto! Seguimos avanzando.",
        "Se abrió una calle nueva. Vamos."
      ],
      streak: [
        "¡Racha a la vista! El camino se está despejando.",
        "Tres seguidas. Esto ya parece un sendero.",
        "¡Vamos! El mapa se dibuja sola con estos aciertos."
      ],
      wrong: [
        "Desvío encontrado. Marquémoslo para no repetirlo.",
        "Casi. Mira el caso desde otro ángulo.",
        "Los errores también son brújulas."
      ],
      defeat: [
        "La ruta se complicó, pero no se perdió. Volvemos con más mapa.",
        "Respira. Mañana el camino se ve distinto.",
        "Ningún explorador aprende sin perderse una vez."
      ],
      victory: [
        "¡Ruta completada! Mira todo lo que quedó marcado.",
        "Llegamos. Y el mapa quedó mejor que antes.",
        "¡Victoria! El siguiente destino ya está a la vista."
      ],
      levelup: [
        "¡Subimos un tramo del mapa! Nivel nuevo.",
        "Ese ascenso se ganó caminando, no saltando.",
        "¡Nivel nuevo! Se abre más territorio."
      ]
    },
    mentor: {
      idle: [
        "Cuando quieras, retomamos donde lo dejamos.",
        "El ritmo lo marcas tú.",
        "Hay tiempo para una pregunta más, si te sirve."
      ],
      correct: [
        "Bien. Pensaste antes de responder, y se nota.",
        "Correcto. Guarda ese razonamiento: te va a servir.",
        "Ese acierto tiene fundamento. Confía en él.",
        "Muy bien. La calma también es parte del método."
      ],
      streak: [
        "Una racha sostenida dice más de tu proceso que de tu prisa.",
        "Tres aciertos seguidos. Disfrutalo, pero sigue mirando.",
        "La constancia está trabajando a tu favor."
      ],
      wrong: [
        "Está bien fallar aquí. Revisemos qué te llevó a esa opción.",
        "El error no te define; la revisión sí.",
        "Volvamos al enunciado juntos. Hay una pista que se pasó."
      ],
      defeat: [
        "Hoy no salió. El aprendizaje sigue intacto.",
        "No pasa nada. Mañana lo miramos con otros ojos.",
        "Nadie sostiene una comprensión sin intentos."
      ],
      victory: [
        "Lo lograste. Y lo hiciste entendiendo, no adivinando.",
        "Objetivo cumplido. Tómate un momento para reconocerlo.",
        "Buen trabajo. Llévate una idea, no solo el resultado."
      ],
      levelup: [
        "Nuevo nivel. Es un buen momento para mirar atrás.",
        "Has crecido en experiencia. Cuida también la paciencia.",
        "Nivel nuevo. Sigue preguntando, incluso cuando aciertes."
      ]
    },
    prodigio: {
      idle: [
        "¿Empezamos? Te estoy esperando.",
        "El siguiente reto no se gana solo.",
        "Dale, que se enfría la racha."
      ],
      correct: [
        "¡Así! Eso es criterio, no suerte.",
        "Bien. Siguiente.",
        "Acierto limpio. No te relajes.",
        "Eso es. El caso pedía exactamente esa lectura."
      ],
      streak: [
        "¡Racha! Ahora quiero ver cuánto la sostenés.",
        "Tres seguidas. Eso empieza a parecer dominio.",
        "Estás imparable. No aflojes el criterio por la velocidad."
      ],
      wrong: [
        "Fallaste. Anotá la diferencia y volvemos.",
        "No era esa. Revisá sin excusas.",
        "Un error a tiempo vale más que diez dudas."
      ],
      defeat: [
        "Perdiste esta. La próxima se gana con la misma cabeza.",
        "Respirá. Esto no se termina acá.",
        "Baja el ritmo, no el nivel."
      ],
      victory: [
        "¡Objetivo! Ese es el estándar que quiero ver.",
        "Ganado. Ahora subamos la vara.",
        "¡Dale! Una más para la racha de misiones."
      ],
      levelup: [
        "¡Nivel nuevo! Se nota el trabajo.",
        "Ascenso. Pero no te acostumbres al podio.",
        "Nivel arriba. Ahora a defenderlo."
      ]
    },
    guardian: {
      idle: [
        "Cuando estés listo, seguimos con el plan.",
        "El método espera.",
        "Rutina corta, paso firme."
      ],
      correct: [
        "Correcto. El procedimiento se respetó.",
        "Bien. Constancia y criterio en la misma línea.",
        "Ese acierto está registrado. Sigue.",
        "Sólido. Sin atajos."
      ],
      streak: [
        "Tres aciertos. La disciplina empieza a rendir.",
        "Racha en curso. Mantené el mismo paso.",
        "La constancia no hace ruido, pero se nota."
      ],
      wrong: [
        "Error registrado. Revisalo y repetí el procedimiento.",
        "No es un problema fallar: es un problema no revisar.",
        "Volvé a la fuente. La clave está en el detalle."
      ],
      defeat: [
        "No se alcanzó el objetivo hoy. La rutina sigue mañana.",
        "El resultado no borra lo practicado.",
        "Revisemos, ajustemos y volvamos."
      ],
      victory: [
        "Objetivo asegurado. El método respondió.",
        "Misión cumplida. Registro cerrado.",
        "Bien hecho. Sin excesos, sin atajos."
      ],
      levelup: [
        "Nivel nuevo. El siguiente exige lo mismo: constancia.",
        "Ascenso. Mantené el procedimiento.",
        "Nivel alcanzado. No cambia el método, cambia la responsabilidad."
      ]
    },
    investigadora: {
      idle: [
        "Hay datos listos para revisar cuando quieras.",
        "¿Seguimos con la siguiente observación?",
        "La evidencia se acumula sesión a sesión."
      ],
      correct: [
        "Acierto consistente con la evidencia disponible.",
        "Correcto. La fuente respalda esa lectura.",
        "Bien. Ese detalle era el que distinguía el caso.",
        "Exacto. La clave estaba en el diseño, no en la intuición."
      ],
      streak: [
        "Tres aciertos: la señal es consistente.",
        "La racha sugiere un patrón. Conviene verificar una vez más.",
        "Datos repetidos. Eso fortalece la hipótesis."
      ],
      wrong: [
        "Interesante error. ¿Qué evidencia faltó considerar?",
        "Revisá el enunciado y la clave. Hay un matiz decisivo.",
        "No coincide. Guardemos la diferencia para el repaso."
      ],
      defeat: [
        "Los datos no alcanzaron. Volvamos con una lectura más fina.",
        "Un resultado negativo también informa.",
        "Revisemos el método antes de concluir."
      ],
      victory: [
        "Resultado concluyente. La evidencia acompañó la decisión.",
        "Objetivo cumplido con evidencia registrada.",
        "Bien. Ahora conviene sostener la muestra."
      ],
      levelup: [
        "Nivel nuevo. Más evidencia acumulada.",
        "Ascenso con datos suficientes.",
        "Nivel alcanzado. La muestra sigue creciendo."
      ]
    }
  };

  var CHARACTER_HOME = {
    ilan: "Hoy conviene una ruta corta y precisa. Elegí una misión y ajustamos el plan sobre la marcha.",
    mara: "Hay una ruta que todavía no caminaste. ¿Vamos a ver qué hay?",
    noa: "Antes de elegir, mirá qué área tiene menos evidencia registrada.",
    teo: "Empezá por el caso que más dudas te dejó. No hace falta correr.",
    lia: "Elegí una misión y tratá de superarte. Yo llevo el tiempo.",
    kian: "Un bloque corto, sin distracciones. El método se sostiene en la rutina.",
    amaru: "La linterna está cargada. Marquemos el tramo que falta.",
    ona: "Revisemos el conjunto: una misión, un objetivo y un cierre.",
    iris: "Antes de decidir, mirá a quién afecta. Después elegimos la ruta.",
    zenon: "Hay preguntas que ya entrelazaste. Busquemos la siguiente conexión."
  };

  var CHARACTER_UNLOCK = {
    ilan: "Soy Ilan. Empecemos por una ruta pequeña: el mapa se abre caminando.",
    mara: "¡Llegué! Traje el mapa del territorio. ¿Por dónde arrancamos?",
    noa: "Noa. Si vas a aceptar una conclusión, primero mirá de dónde viene.",
    teo: "Teo. Vamos despacio: escuchar también es parte de aprender.",
    lia: "Lía. Espero que estés listo, porque yo ya empecé a contar.",
    kian: "Kian. El procedimiento primero; el resto se ordena solo.",
    amaru: "Amaru. Marqué los desvíos del camino para que no te pierdas.",
    ona: "Ona. Traje el plano completo: ahora hay que sostener el sistema.",
    iris: "Iris. La confianza se cuida en cada decisión. Empecemos.",
    zenon: "Zenón. He visto muchas rutas. Esta empieza con tu próxima pregunta."
  };

  var STATE_BY_EVENT = {
    idle: "idle",
    correct: "correct",
    streak: "streak",
    wrong: "wrong",
    defeat: "defeat",
    victory: "victory",
    levelup: "levelup",
    unlock: "unlock"
  };

  function personalityPool(characterId) {
    var character = Chars.byId(characterId) || Chars.byId(Chars.starterId);
    return MESSAGES[character.personality] || MESSAGES.estratega;
  }

  function message(characterId, event, nonce) {
    var character = Chars.byId(characterId) || Chars.byId(Chars.starterId);
    var pool = personalityPool(characterId);
    var key = pool[event] ? event : "correct";
    var lines = pool[key];
    var index = Math.abs(U.safeInt(nonce, 0)) % lines.length;
    return {
      text: lines[index],
      event: event,
      animation: STATE_BY_EVENT[event] || "idle",
      personality: character.personalityMeta.label,
      characterId: character.id
    };
  }

  function homeMessage(characterId) {
    var character = Chars.byId(characterId) || Chars.byId(Chars.starterId);
    return {
      text: CHARACTER_HOME[character.id] || message(character.id, "idle", 0).text,
      animation: "idle",
      characterId: character.id
    };
  }

  function unlockMessage(characterId) {
    var character = Chars.byId(characterId);
    if (!character) return "Nuevo personaje en tu colección.";
    return CHARACTER_UNLOCK[character.id] || (character.name + " se une a tu colección.");
  }

  function allMessagesFor(characterId) {
    var pool = personalityPool(characterId);
    var out = {};
    EVENTS.forEach(function (event) { out[event] = pool[event].slice(); });
    return out;
  }

  window.QuestReactions = {
    EVENTS: EVENTS,
    MESSAGES: MESSAGES,
    CHARACTER_HOME: CHARACTER_HOME,
    CHARACTER_UNLOCK: CHARACTER_UNLOCK,
    message: message,
    homeMessage: homeMessage,
    unlockMessage: unlockMessage,
    allMessagesFor: allMessagesFor,
    animationFor: function (event) { return STATE_BY_EVENT[event] || "idle"; },
    holdMs: C.rpg.reactionHoldMs
  };
})();
