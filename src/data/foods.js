/**
 * Datos de alimentos favoritos (GDD §21, §61).
 * Se desbloquean al investigar a la criatura y sirven para domesticarla.
 */
export const FOODS = {
  sweet_berries: {
    id: "sweet_berries",
    name: "Bayas dulces",
    emoji: "🍓",
    cost: 5,
    creatureId: "nilo",
    description: "Bayas dulces. A Nilo le encantan."
  },
  moon_flowers: {
    id: "moon_flowers",
    name: "Flores lunares",
    emoji: "🌸",
    cost: 8,
    creatureId: "lumi",
    description: "Flores que solo brillan de noche. El alimento de Lumi."
  },
  glowing_mushroom: {
    id: "glowing_mushroom",
    name: "Hongo luminoso",
    emoji: "🍄",
    cost: 8,
    creatureId: "moss",
    description: "Un hongo que brilla entre la hojarasca del bosque. A Moss, el camaleón, le encanta."
  },
  honey_drop: {
    id: "honey_drop",
    name: "Gota de miel",
    emoji: "🍯",
    cost: 8,
    creatureId: "vesper",
    description: "Una gota de miel clara. Vesper la encuentra irresistible."
  },
  mint_leaf: {
    id: "mint_leaf",
    name: "Hoja de menta",
    emoji: "🌿",
    cost: 8,
    creatureId: "mallow",
    description: "Una hoja fresca para la criatura más dormilona."
  }
};

export function foodForCreature(creatureId) {
  return Object.values(FOODS).find((f) => f.creatureId === creatureId) || null;
}
