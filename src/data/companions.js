/**
 * Datos de habilidades de compañeros (GDD §22, §35, §99-102).
 * Cada criatura domesticada otorga una habilidad.
 */
export const COMPANIONS = {
  flower_collector: {
    id: "flower_collector",
    name: "Recolector",
    creatureId: "nilo",
    type: "passive",
    description: "Nilo recoge flores por ti y a veces trae un pétalo extra.",
    effect: { bonusPetalChance: 0.15, maxTimeSec: 90 }
  },
  illuminator: {
    id: "illuminator",
    name: "Iluminador",
    creatureId: "lumi",
    type: "passive",
    description: "Lumi revela objetos y símbolos invisibles.",
    effect: { revealHidden: true }
  },
  digger: {
    id: "digger",
    name: "Excavador",
    creatureId: "moss",
    type: "passive",
    description: "Moss encuentra objetos enterrados.",
    effect: { findBuried: true }
  },
  observer: {
    id: "observer",
    name: "Observador",
    creatureId: "vesper",
    type: "passive",
    description: "Vesper detecta criaturas ocultas a tiempo.",
    effect: { predictCreatures: true }
  },
  restful: {
    id: "restful",
    name: "Dormilón",
    creatureId: "mallow",
    type: "passive",
    description: "Mallow acelera el crecimiento de las flores.",
    effect: { respawnBonus: 0.2 }
  }
};

export function companionForCreature(creatureId) {
  return Object.values(COMPANIONS).find((c) => c.creatureId === creatureId) || null;
}
