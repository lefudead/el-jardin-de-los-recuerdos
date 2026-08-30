/**
 * Datos de flores (GDD §9). Cada flor: id, nombre, rareza, valor, zona, horario, emoji, condiciones.
 * `emoji` es un asset provisional para el prototipo (después se usará sprite).
 */
export const FLOWERS = {
  daisy: {
    id: "daisy",
    name: "Margarita",
    rarity: "common",
    petalValue: 1,
    zone: "spring_garden",
    time: ["day", "sunset"],
    emoji: "🌼",
    spawnChance: 0.6,
    notes: "La flor más común del jardín. Crece en cualquier rincón soleado.",
    special: null
  },
  tulip: {
    id: "tulip",
    name: "Tulipán",
    rarity: "common",
    petalValue: 1,
    zone: "spring_garden",
    time: ["day", "sunset"],
    emoji: "🌷",
    spawnChance: 0.5,
    notes: "Un tulipán de colores suaves.",
    special: null
  },
  sunflower: {
    id: "sunflower",
    name: "Girasol",
    rarity: "uncommon",
    petalValue: 2,
    zone: "spring_garden",
    time: ["day"],
    emoji: "🌻",
    spawnChance: 0.28,
    notes: "Siempre mira hacia la luz del día.",
    special: null
  },
  bluebell: {
    id: "bluebell",
    name: "Campanilla Azul",
    rarity: "uncommon",
    petalValue: 2,
    zone: "whispering_forest",
    time: ["day", "sunset"],
    emoji: "🔔",
    spawnChance: 0.3,
    notes: "Las criaturas azules parecen sentirse atraídas por estas flores.",
    special: { type: "creature_affinity", creature: "lumi" }
  },
  rose: {
    id: "rose",
    name: "Rosa",
    rarity: "rare",
    petalValue: 3,
    zone: "whispering_forest",
    time: ["day", "sunset"],
    emoji: "🌹",
    spawnChance: 0.12,
    notes: "Puede aparecer después de completar determinados eventos.",
    special: { type: "after_event", event: "any" }
  },
  moonflower: {
    id: "moonflower",
    name: "Flor Lunar",
    rarity: "special",
    petalValue: 5,
    zone: "moon_lake",
    time: ["night"],
    emoji: "🌙",
    spawnChance: 0.05,
    notes: "Solo abre durante la noche, junto al agua.",
    special: { type: "time", time: "night" }
  }
};
