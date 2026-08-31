/**
 * TamingSystem (GDD técnico §101, GDD §22-26, §55-56, §110).
 * Domesticación: minijuego de 10 taps en menos de 5 segundos.
 * La confianza aumenta por acción exitosa; al llegar al máximo, la criatura
 * pasa a ser compañera.
 */
import { CREATURES } from "../data/creatures.js";
import { FOODS, foodForCreature } from "../data/foods.js";
import { gameState } from "./GameState.js";
import { inventorySystem } from "./InventorySystem.js";
import { rewardSystem } from "./RewardSystem.js";
import { eventBus } from "./EventBus.js";
import { saveManager } from "./SaveInstance.js";

const TRUST_MAX = 100;

export class TamingSystem {
  getConfig(creatureId) {
    const c = CREATURES[creatureId];
    return (c && c.taming) || { taps: 10, timeLimit: 5000 };
  }

  getTrust(creatureId) {
    return gameState.state.creatures.trust?.[creatureId] || 0;
  }

  /** Amistad (SIN LÍMITE). Sube al alimentar/cuidar; cada 200 de Nilo da +1 flor. */
  getFriendship(creatureId) {
    return gameState.state.creatures.friendship?.[creatureId] || 0;
  }

  isCaptured(creatureId) {
    return gameState.state.creatures.captured.includes(creatureId);
  }

  isTamed(creatureId) {
    return gameState.state.creatures.tamed.includes(creatureId);
  }

  canBeTamed(creatureId) {
    return this.isCaptured(creatureId) && !this.isTamed(creatureId);
  }

  /** ¿Tiene el jugador el alimento favorito de la criatura? */
  hasFavoriteFood(creatureId) {
    const food = foodForCreature(creatureId);
    if (!food) return false;
    return inventorySystem.has("foods", food.id);
  }

  favoriteFood(creatureId) {
    return foodForCreature(creatureId);
  }

  /** Consume una ración del alimento favorito. */
  consumeFood(creatureId) {
    const food = this.favoriteFood(creatureId);
    if (!food) return false;
    return inventorySystem.remove("foods", food.id, 1);
  }

  /**
   * Ejecuta una sesión de domesticación. `attempts` debe provenir del minijuego:
   * el número de taps correctos conseguidos dentro del tiempo límite.
   * Devuelve { ok, success, gainedTrust, tamed }.
   */
  runTaming(creatureId, attempts, withinTime, config) {
    if (!this.canBeTamed(creatureId)) {
      return { ok: false, reason: "not_captured_or_tamed" };
    }
    const cfg = config || this.getConfig(creatureId);
    const required = cfg.taps;

    let gainedTrust = 0;
    if (attempts >= required && withinTime) {
      gainedTrust = 20;
    } else if (attempts > 0) {
      // Pequeño avance aunque no se complete a tiempo (filosofía relajante).
      gainedTrust = Math.round((attempts / required) * 10);
    }

    const trust = gameState.state.creatures.trust || (gameState.state.creatures.trust = {});
    trust[creatureId] = Math.min(TRUST_MAX, (trust[creatureId] || 0) + gainedTrust);
    // Amistad: sin límite, sube con cada alimentación exitosa (misma cantidad).
    const friendship = gameState.state.creatures.friendship || (gameState.state.creatures.friendship = {});
    friendship[creatureId] = (friendship[creatureId] || 0) + gainedTrust;
    eventBus.emit(eventBus.constructor.EVENTS.CREATURE_FED, { id: creatureId, gainedTrust, friendship: friendship[creatureId] });

    let tamed = false;
    if (trust[creatureId] >= TRUST_MAX && !this.isTamed(creatureId)) {
      tamed = true;
      rewardSystem.give({ type: "creature_tame", creatureId });
      eventBus.emit(eventBus.constructor.EVENTS.CREATURE_HELPED, { id: creatureId });
    }

    saveManager.saveGame();
    return { ok: true, success: gainedTrust > 0, gainedTrust, tamed, trust: trust[creatureId] };
  }

  getTrustLabel(creatureId) {
    const t = this.getTrust(creatureId);
    if (this.isTamed(creatureId)) return "Compañera";
    if (t <= 0) return "Extraña";
    if (t < 40) return "Familiar";
    if (t < 80) return "Amiga";
    return "Casi compañera";
  }
}

export const tamingSystem = new TamingSystem();
