/**
 * Datos de criaturas (GDD v3.0 §15, §30-38).
 * Cada criatura es un recuerdo materializado. Sistema de comportamiento,
 * investigación, captura y domesticación.
 */
export const CREATURES = {
  nilo: {
    id: "nilo",
    name: "Nilo",
    type: "memory_creature",
    personality: ["curious", "greedy", "playful"],
    zone: "spring_garden",
    schedule: { start: 8, end: 18 },
    behaviors: [
      "steal_flowers",
      "hide_seed",
      "visit_shop"
    ],
    interference: "steal_flowers",
    interferenceConfig: {
      tapsToStop: 3,
      stealFlowers: 3,
      windowMs: 3000
    },
    observations: [
      "steals_flowers",
      "appears_morning",
      "reacts_to_cages",
      "leaves_after_fed",
      "favorite_sweet"
    ],
    capture: {
      cage: "cage_nilo",
      requiredObservations: 5
    },
    favoriteFood: "sweet_berries",
    taming: {
      taps: 10,
      timeLimit: 5000
    },
    companionSkill: {
      id: "flower_collector"
    },
    emoji: "🐆",
    notes: "Nilo es curioso, juguetón y un poco codicioso. Roba flores, pero no es malvado: solo quiere cosas.",
    bio: "En vida, Nilo guardaba cada pétalo que le regalaban. Ahora no puede evitarlo: si lo ve, lo toma."
  },
  lumi: {
    id: "lumi",
    name: "Lumi",
    type: "memory_creature",
    typeLabel: "Espíritu de luz",
    personality: ["curious", "shy", "playful"],
    zone: "whispering_forest",
    schedule: { start: 20, end: 23 },
    behaviors: ["appears_at_night", "likes_blue_flowers", "avoids_bright_light"],
    interference: "dim_flowers",
    observations: ["night_appearance", "blue_flowers", "player_still", "bright_light"],
    capture: { cage: "cage_lumi", requiredObservations: 4 },
    favoriteFood: "moon_flowers",
    taming: { taps: 10, timeLimit: 5000 },
    companionSkill: { id: "illuminator" },
    emoji: "✨",
    notes: "Un pequeño destello luminoso que a veces se deja ver de noche.",
    bio: "Lumi era la luz que él encendía para no tener miedo. Ahora teme la luz intensa."
  },
  mallow: {
    id: "mallow",
    name: "Mallow",
    type: "memory_creature",
    typeLabel: "Criatura floral",
    personality: ["sleepy", "gentle"],
    zone: "spring_garden",
    schedule: { start: 6, end: 18 },
    behaviors: ["sleeps", "grows_flowers"],
    interference: "none",
    observations: ["sleeps_in_sun", "helps_flowers"],
    capture: { cage: "cage_mallow", requiredObservations: 4 },
    favoriteFood: "mint_leaf",
    taming: { taps: 10, timeLimit: 5000 },
    companionSkill: { id: "restful" },
    emoji: "🌱",
    notes: "Mallow es dormilón y tranquilo. Acelera el crecimiento de las flores.",
    bio: "Mallow era la siesta compartida bajo el sol de los domingos."
  },
  vesper: {
    id: "vesper",
    name: "Vesper",
    type: "memory_creature",
    typeLabel: "Criatura nocturna",
    personality: ["mysterious", "wise"],
    zone: "moon_lake",
    schedule: { start: 19, end: 5 },
    behaviors: ["speaks", "hides_truth"],
    interference: "misleads",
    observations: ["speaks_in_riddles", "appears_at_lake"],
    capture: { cage: "cage_vesper", requiredObservations: 4 },
    favoriteFood: "honey_drop",
    taming: { taps: 10, timeLimit: 5000 },
    companionSkill: { id: "observer" },
    emoji: "🦋",
    notes: "Vesper habla, pero nunca entrega toda la verdad.",
    bio: "Vesper era la voz de la duda en las noches en vela."
  },
  moss: {
    id: "moss",
    name: "Moss",
    type: "memory_creature",
    typeLabel: "Criatura del bosque",
    personality: ["shy", "protective"],
    zone: "whispering_forest",
    schedule: { start: 16, end: 20 },
    behaviors: ["buries_plants"],
    interference: "bury_plants",
    interferenceConfig: {
      eventMs: 60000,          // el evento dura 60 s
      visibleAfterTouchMs: 2000, // al tocarlo, las plantas se ven 2 s
      researchPerTap: 10
    },
    observations: ["appears_near_trees", "buries_objects"],
    capture: { cage: "cage_moss", requiredObservations: 4 },
    favoriteFood: "glowing_mushroom",
    taming: { taps: 10, timeLimit: 5000 },
    companionSkill: { id: "digger" },
    emoji: "🦔",
    notes: "Moss no roba: entierra. Cree que así protege lo que ama.",
    bio: "Moss escondía los regalos para que nadie los rompiera. Ahora entierra flores por lo mismo."
  }
};
