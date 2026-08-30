/**
 * FarmingSystem (GDD técnico §8): registra taps, otorga pétalos, aplica mejoras.
 */
import { gameState } from "./GameState.js";
import { economy } from "./EconomyInstance.js";
import { flowerSystem } from "./FlowerInstance.js";
import { eventBus } from "./EventBus.js";
import { chance } from "../utils/random.js";

export class FarmingSystem {
  /** Flujo principal de un tap. Devuelve el resultado. */
  tapFlower(flowerId) {
    const flower = flowerSystem.getFlower(flowerId);
    if (!flower) return null;

    gameState.state.stats.totalTaps++;

    let reward = flower.petalValue;

    // Mejora: pétalo extra
    if (chance(flowerSystem.extraPetalChance())) {
      reward += 1;
    }

    const convertedBouquets = economy.addPetals(reward);

    return {
      flowerId,
      reward,
      convertedBouquets
    };
  }
}

export const farming = new FarmingSystem();
