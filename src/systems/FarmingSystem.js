/**
 * FarmingSystem (GDD técnico §8): registra taps, otorga recompensas y aplica mejoras.
 * Cada zona puede tener su propia moneda (§7): en el jardín los pétalos se
 * convierten en ramos; en el bosque las flores otorgan hojas sueltas (leaves).
 */
import { gameState } from "./GameState.js";
import { economy } from "./EconomyInstance.js";
import { flowerSystem } from "./FlowerInstance.js";
import { eventBus } from "./EventBus.js";
import { chance } from "../utils/random.js";
import { ZONES } from "../data/zones.js";

/** Moneda de recompensa para una flor según su zona (null = pétalos/ramos). */
export function rewardCurrencyForZone(zoneId) {
  const z = zoneId && ZONES[zoneId];
  if (z && z.economy === "zone") return { zone: zoneId, currency: z.currency };
  return null;
}

export class FarmingSystem {
  /** Flujo principal de un tap. Devuelve el resultado. */
  tapFlower(flowerId) {
    const flower = flowerSystem.getFlower(flowerId);
    if (!flower) return null;

    gameState.state.stats.totalTaps++;

    let reward = flower.petalValue;

    // Mejora: recompensa extra
    if (chance(flowerSystem.extraPetalChance())) {
      reward += 1;
    }

    const currency = rewardCurrencyForZone(flower.zone);
    let convertedBouquets = 0;
    if (currency) {
      // Moneda local de la zona (p. ej. hojas del bosque).
      economy.addResource(`${currency.zone}.${currency.currency}`, reward);
    } else {
      // Zona jardín: pétalos que se convierten a ramos.
      convertedBouquets = economy.addPetals(reward);
    }

    return {
      flowerId,
      reward,
      convertedBouquets,
      zone: flower.zone,
      currency: currency ? currency.currency : "petals"
    };
  }
}

export const farming = new FarmingSystem();
