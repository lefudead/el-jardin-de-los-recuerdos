/**
 * FarmingSystem (GDD técnico §8): registra taps, otorga recompensas y aplica mejoras.
 * Cada zona puede tener su propia moneda (§7): en el jardín los pétalos se
 * convierten en ramos; en el bosque las flores otorgan hojas sueltas (leaves).
 */
import { gameState } from "./GameState.js";
import { economy } from "./EconomyInstance.js";
import { flowerSystem } from "./FlowerInstance.js";
import { upgradeSystem } from "./UpgradeSystem.js";
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

    const zoneId = flower.zone;
    let reward = flower.petalValue;

    // Mejora: recompensa extra
    if (chance(flowerSystem.extraPetalChance())) {
      reward += 1;
    }

    // Guantes del bosque: +1 hoja fija por recolección.
    reward += upgradeSystem.bonusFor("flatTapBonus", zoneId);

    // Brújula (+% producción global) — redunda sobre la recompensa base.
    const prod = upgradeSystem.bonusFor("globalProduction", zoneId);
    reward = Math.round(reward * (1 + prod));

    // Cesta de explorador: 10% de +1 recurso adicional.
    let extraTap = 0;
    if (chance(upgradeSystem.bonusFor("extraTapResource", zoneId))) {
      extraTap = 1;
    }
    reward += extraTap;

    const currency = rewardCurrencyForZone(zoneId);
    let convertedBouquets = 0;
    if (currency) {
      // Moneda local de la zona (p. ej. hojas del bosque), se convierte a bultos.
      economy.addResource(`${currency.zone}.${currency.currency}`, reward);
    } else {
      // Zona jardín: pétalos que se convierten a ramos.
      convertedBouquets = economy.addPetals(reward);
    }

    return {
      flowerId,
      reward,
      extraTap,
      convertedBouquets,
      zone: zoneId,
      currency: currency ? currency.currency : "petals"
    };
  }
}

export const farming = new FarmingSystem();
