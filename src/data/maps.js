/**
 * Datos de mapas / zonas (GDD §13, GDD técnico §13).
 */
export const MAPS = {
  spring_garden: {
    id: "spring_garden",
    name: "Jardín de Primavera",
    description: "Donde despiertas. Flores sencillas y los primeros secretos.",
    unlockCost: 0,
    unlockRequirement: null,
    emoji: "🌷"
  },
  whispering_forest: {
    id: "whispering_forest",
    name: "Bosque Susurrante",
    description: "Sonidos extraños, huellas y criaturas tímidas.",
    unlockCost: 50,
    unlockRequirement: null,
    emoji: "🌲"
  },
  moon_lake: {
    id: "moon_lake",
    name: "Lago Lunar",
    description: "El ciclo día/noche importa aquí. Flores lunares y reflejos.",
    unlockCost: 100,
    unlockRequirement: null,
    emoji: "🌙"
  },
  abandoned_house: {
    id: "abandoned_house",
    name: "Casa Abandonada",
    description: "Escape rooms, documentos y códigos.",
    unlockCost: 150,
    unlockRequirement: null,
    emoji: "🏚️"
  },
  memory_garden: {
    id: "memory_garden",
    name: "Jardín de los Recuerdos",
    description: "El recuerdo final.",
    unlockCost: 0,
    unlockRequirement: "story_final",
    emoji: "❤️"
  }
};
