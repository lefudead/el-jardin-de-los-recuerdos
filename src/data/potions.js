/**
 * Pociones (base preparada para la tienda del siguiente mapa).
 * Cada poción otorga una mejora temporal sobre los mismos campos de efecto que
 * las mejoras de la tienda (GDD técnico §11), por lo que el BuffSystem las
 * suma igual que `upgradeSystem.bonusFor`. Se compran con hongos 🍄.
 */
export const POTIONS = {
  potion_energy: {
    id: "potion_energy",
    name: "Poción de Energía",
    emoji: "⚡",
    description: "Cada hoja/pétalo que recojas rinde +1 durante 60 s.",
    mushroomCost: 2,
    durationMs: 60000,
    effect: { flatTapBonus: 1 }
  },
  potion_growth: {
    id: "potion_growth",
    name: "Poción de Crecimiento",
    emoji: "🌱",
    description: "Las plantas reaparecen el doble de rápido durante 60 s.",
    mushroomCost: 2,
    durationMs: 60000,
    effect: { respawnSpeed: 1 }
  },
  potion_luck: {
    id: "potion_luck",
    name: "Poción de Suerte",
    emoji: "🍀",
    description: "Sube la rareza de las flores durante 60 s.",
    mushroomCost: 3,
    durationMs: 60000,
    effect: { rarityBoost: 0.3 }
  },
  potion_bounty: {
    id: "potion_bounty",
    name: "Poción de Abundancia",
    emoji: "✨",
    description: "+30% producción global y un 10% de recurso extra durante 60 s.",
    mushroomCost: 3,
    durationMs: 60000,
    effect: { globalProduction: 0.3, extraTapResource: 0.1 }
  }
};
