/**
 * Datos de mejoras (GDD §12, GDD técnico §11).
 * `effect` es un mapa de bonificaciones interpretado por FarmingSystem/FlowerSystem.
 */
export const UPGRADES = {
  careful_fingers: {
    id: "careful_fingers",
    name: "Dedos Cuidadosos",
    description: "5% de probabilidad de obtener un pétalo adicional.",
    cost: 5,
    tier: 1,
    effect: { extraPetalChance: 0.05 }
  },
  old_watering_can: {
    id: "old_watering_can",
    name: "Regadera Antigua",
    description: "Las flores reaparecen ligeramente más rápido.",
    cost: 15,
    tier: 1,
    effect: { respawnSpeed: 1.2 }
  },
  fertile_soil: {
    id: "fertile_soil",
    name: "Tierra Fértil",
    description: "Aumenta la aparición de flores raras.",
    cost: 30,
    tier: 2,
    effect: { rarityBoost: 0.15 }
  },
  garden_bell: {
    id: "garden_bell",
    name: "Campanilla del Jardín",
    description: "Aumenta la posibilidad de aparición de criaturas.",
    cost: 50,
    tier: 2,
    effect: { creatureSpawnBoost: 0.2 }
  },
  moonlight: {
    id: "moonlight",
    name: "Luz de Luna",
    description: "Desbloquea determinadas interacciones nocturnas.",
    cost: 75,
    tier: 3,
    effect: { nightInteractions: true }
  }
};
