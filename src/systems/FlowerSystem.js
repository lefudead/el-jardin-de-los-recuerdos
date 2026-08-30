/**
 * FlowerSystem (GDD técnico §9): aparición, rareza, disponibilidad y respawn.
 */
import { FLOWERS } from "../data/flowers.js";
import { gameState } from "./GameState.js";
import { CONFIG } from "../config.js";
import { weightedPick, randomBetween, chance } from "../utils/random.js";
import { timeMatches } from "../utils/time.js";

export class FlowerSystem {
  constructor() {
    this.rarityChance = { ...CONFIG.rarityChance };
  }

  /** Devuelve las flores disponibles en una zona y momento dado. */
  flowersForZone(zoneId, timeOfDay) {
    return Object.values(FLOWERS).filter((f) =>
      f.zone === zoneId &&
      timeMatches(f.time, timeOfDay)
    );
  }

  /** Tamaño de una zona: cuántas flores se colocan a la vez. */
  zoneCapacity(zoneId) {
    return { spring_garden: 6, whispering_forest: 8, moon_lake: 8, abandoned_house: 4, memory_garden: 3 }[zoneId] || 6;
  }

  /** Aplica la bonificación de rareza de las mejoras compradas en la zona. */
  rarityBoost(zoneId) {
    return upgradeSystem.bonusFor("rarityBoost", zoneId || this.currentZone());
  }

  /** Zona activa actual. */
  currentZone() {
    return gameState.state.progression.currentZone || "spring_garden";
  }

  /**
   * Genera una lista concreta de flores para una zona/tiempo.
   * Devuelve elementos con id + posición.
   */
  spawnFlowers(zoneId, timeOfDay, count) {
    const available = this.flowersForZone(zoneId, timeOfDay);
    if (available.length === 0) return [];

    const pool = [];
    for (const f of available) {
      const weight = f.spawnChance * (1 + this.rarityBonusFor(f.rarity, zoneId));
      pool.push({ id: f.id, weight });
    }

    const result = [];
    for (let i = 0; i < count && pool.length > 0; i++) {
      const weights = Object.fromEntries(pool.map((p) => [p.id, p.weight]));
      const chosen = weightedPick(weights);
      result.push({
        id: chosen,
        x: randomBetween(15, 85),
        y: randomBetween(18, 70)
      });
    }
    return result;
  }

  /** Bonus según la rareza (liga el sistema de mejoras con la aparición). */
  rarityBonusFor(rarity, zoneId) {
    const weights = {
      common: 1,
      uncommon: 1,
      rare: 1,
      special: 1,
      secret: 1
    };
    return (weights[rarity] - 1) + this.rarityBoost(zoneId);
  }

  /** Tiempo de reaparecer (afectado por mejoras de la zona). */
  respawnTime(baseMin, baseMax) {
    const speed = 1 + upgradeSystem.bonusFor("respawnSpeed", this.currentZone());
    const min = baseMin / speed;
    const max = baseMax / speed;
    return randomBetween(Math.round(min), Math.round(max));
  }

  /** Probabilidad de pétalo extra por mejores de la zona. */
  extraPetalChance() {
    return upgradeSystem.bonusFor("extraPetalChance", this.currentZone());
  }

  /** ¿Ha sido descubierta / está disponible esta flor? */
  isUnlocked(flowerId) {
    return true; // MVP: todas las flores de la zona activa están disponibles
  }

  getFlower(id) {
    return FLOWERS[id] || null;
  }
}

import { upgradeSystem } from "./UpgradeSystem.js";
