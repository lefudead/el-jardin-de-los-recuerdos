/**
 * Datos de historia (GDD §50, §53, §57, §124).
 * Nodos de historia progresivos. La narrativa vive aquí, no en las escenas.
 */
export const STORY = {
  // ---- INTRODUCCIÓN (GDD §50) ----
  intro_house: {
    id: "intro_house",
    chapter: 1,
    text: "\u201CHabían pasado seis años. Seis años desde la última vez que estuve aquí.\u201D",
    speaker: "Protagonista",
    requirements: [],
    next: "intro_house_2",
    progress: 5
  },
  intro_house_2: {
    id: "intro_house_2",
    chapter: 1,
    text: "\u201CTodos decían que debía vender esta casa. Que no quedaba nada para mí. Tal vez tenían razón.\u201D",
    speaker: "Protagonista",
    requirements: [],
    next: "intro_house_3",
    progress: 5
  },
  intro_house_3: {
    id: "intro_house_3",
    chapter: 1,
    text: "\u201CEl y yo vivimos aquí. Antes de que desapareciera. Antes de que todos decidieran que estaba muerto.\u201D",
    speaker: "Protagonista",
    requirements: [],
    next: "intro_house_4",
    progress: 10
  },
  intro_house_4: {
    id: "intro_house_4",
    chapter: 1,
    text: "\u201CPero regresé. Y nadie me dijo que volver aquí podría darme la oportunidad de...\u201D",
    speaker: "Protagonista",
    requirements: [],
    next: "intro_garden",
    progress: 10
  },
  intro_garden: {
    id: "intro_garden",
    chapter: 1,
    text: "Entras al jardín. La lluvia ha dejado el aire nuevo. En el centro, una flor se abre lentamente, como si llevara años esperándote.",
    speaker: "Narradora",
    requirements: [],
    next: "tutorial_tap",
    progress: 12
  },

  // ---- TUTORIAL DE TAP (GDD §51) ----
  tutorial_tap: {
    id: "tutorial_tap",
    chapter: 1,
    text: "Toca las flores para recoger pétalos. Cada 10 pétalos se convierten en un ramo.",
    speaker: "Narradora",
    requirements: [],
    next: null,
    progress: 12,
    tutorial: "tap"
  },

  // ---- PRIMERA ANOMALÍA (GDD §52) ----
  anomaly_hint: {
    id: "anomaly_hint",
    chapter: 2,
    text: "Entre las flores, algo corre. No llegas a verlo bien.",
    speaker: "Narradora",
    requirements: ["taps_5"],
    next: null,
    progress: 15,
    oneShot: true,
    effect: "hint_nilo"
  },

  // ---- PRIMER ENCUENTRO CON NILO (GDD §53) ----
  nilo_meet: {
    id: "nilo_meet",
    chapter: 2,
    text: "\u201C¿Qué demonios eres?\u201D",
    speaker: "Protagonista",
    requirements: ["taps_15", "story_anomaly"],
    next: "nilo_tutorial",
    progress: 20,
    oneShot: true
  },
  nilo_tutorial: {
    id: "nilo_tutorial",
    chapter: 2,
    text: "¡Nilo está robando tus flores! Tócalo 3 veces para detenerlo antes de que huya.",
    speaker: "Narradora",
    requirements: [],
    next: null,
    progress: 20,
    tutorial: "nilo_tap"
  },

  // ---- INVESTIGACIÓN Y CAPTURA (GDD §54-56) ----
  nilo_researched: {
    id: "nilo_researched",
    chapter: 3,
    text: "\u201CCrees que ya sabes cómo atraparlo. Nilo no puede resistirse a las flores: si colocas una jaula, entrará.\u201D",
    speaker: "Diario",
    requirements: ["research_nilo"],
    next: null,
    progress: 30,
    oneShot: true
  },
  nilo_captured: {
    id: "nilo_captured",
    chapter: 3,
    text: "✨ ¡Nilo capturado! Ahora que está a salvo, puedes ganarte su confianza.",
    speaker: "Narradora",
    requirements: ["captured_nilo"],
    next: null,
    progress: 40,
    oneShot: true
  },
  nilo_food: {
    id: "nilo_food",
    chapter: 3,
    text: "El diario se desbloquea: \u201CALIMENTO FAVORITO DESCONOCIDO\u201D. Quizá puedas descubrirlo: Nilo adora las bayas dulces.",
    speaker: "Diario",
    requirements: ["captured_nilo"],
    next: null,
    progress: 45,
    oneShot: true
  },
  nilo_tamed: {
    id: "nilo_tamed",
    chapter: 4,
    text: "✨ ¡Nilo confía en ti! Ya no roba flores: ahora las recoge para ti.",
    speaker: "Narradora",
    requirements: ["tamed_nilo"],
    next: "nilo_memory",
    progress: 55,
    oneShot: true
  },
  nilo_memory: {
    id: "nilo_memory",
    chapter: 4,
    text: "Nilo te trae algo brillante. Es una cinta de pelo. La reconoces. Era de él. Empiezas a entenderlo: estas criaturas son los recuerdos de tu esposo.",
    speaker: "Protagonista",
    requirements: ["tamed_nilo"],
    next: null,
    progress: 60,
    oneShot: true,
    memory: "memory_nilo_ribbon"
  },

  // ---- EL BOSQUE SUSURRANTE (GDD §58-60, §7) ----
  forest_entry: {
    id: "forest_entry",
    chapter: 4,
    text: "El bosque crece donde hace años no había nada. Los árboles parecen recordar tu nombre. En el aire crepitan hojas que brillan como añicos de cristal.",
    speaker: "Narradora",
    requirements: [],
    next: "forest_tutorial",
    progress: 62,
    oneShot: true
  },
  forest_tutorial: {
    id: "forest_tutorial",
    chapter: 4,
    text: "Aquí las flores no dan ramos: guardan hojas de luz 🍃. Recolecta las campanillas azules y las rosas para juntar hojas propias del bosque.",
    speaker: "Narradora",
    requirements: [],
    next: null,
    progress: 62,
    oneShot: true
  }
};

export function storyById(id) {
  return STORY[id] || null;
}
