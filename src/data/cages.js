/**
 * Datos de jaulas (GDD §17-20).
 * Cada jaula queda vinculada a una criatura concreta tras la captura.
 */
export const CAGES = {
  cage_nilo: {
    id: "cage_nilo",
    name: "Jaula para Nilo",
    creatureId: "nilo",
    cost: 25,
    emoji: "🪤",
    description: "Una jaula pequeña, con un cebo de pétalos. Perfecta para un recolector curioso."
  },
  cage_mallow: {
    id: "cage_mallow",
    name: "Jaula para Mallow",
    creatureId: "mallow",
    cost: 25,
    emoji: "🪤",
    description: "Una jaula con hojas frescas para el habitante dormilón."
  },
  cage_moss: {
    id: "cage_moss",
    name: "Jaula para Moss",
    creatureId: "moss",
    cost: 40,
    emoji: "🪤",
    description: "Una jaula camuflada entre musgo y raíces."
  },
  cage_vesper: {
    id: "cage_vesper",
    name: "Jaula para Vesper",
    creatureId: "vesper",
    cost: 50,
    emoji: "🪤",
    description: "Una jaula de plata pensada para la noche."
  },
  cage_lumi: {
    id: "cage_lumi",
    name: "Jaula para Lumi",
    creatureId: "lumi",
    cost: 50,
    emoji: "🪤",
    description: "Una jaula oscura con pequeños agujeros. Retiene la luz sin asustarla."
  }
};

export function cageForCreature(creatureId) {
  return Object.values(CAGES).find((c) => c.creatureId === creatureId) || null;
}
