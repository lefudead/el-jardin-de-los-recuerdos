/**
 * CaptureSystem (GDD técnico §100, GDD §17-20, §33, §107-108).
 * Captura de criaturas con jaulas individuales vinculadas.
 * Reglas: se necesita al menos la investigación mínima + jaula correcta.
 */
import { CREATURES } from "../data/creatures.js";
import { CAGES, cageForCreature } from "../data/cages.js";
import { gameState } from "./GameState.js";
import { economy } from "./EconomyInstance.js";
import { inventorySystem } from "./InventorySystem.js";
import { investigationSystem } from "./InvestigationSystem.js";
import { rewardSystem } from "./RewardSystem.js";
import { eventBus } from "./EventBus.js";
import { saveManager } from "./SaveInstance.js";

export class CaptureSystem {
  /** ¿Se ha investigado lo suficiente para intentar la captura? */
  canAttempt(creatureId) {
    const c = CREATURES[creatureId];
    if (!c || !c.capture) return false;
    return investigationSystem.getProgress(creatureId) >= this.minResearch(creatureId);
  }

  /** Investigación mínima requerida (por defecto, todas las observaciones). */
  minResearch(creatureId) {
    const c = CREATURES[creatureId];
    return c?.capture?.requiredObservations != null
      ? Math.round((c.capture.requiredObservations / Math.max(1, c.observations.length)) * 100)
      : 100;
  }

  /** Requisitos de captura en forma de texto para UI. */
  requirementsText(creatureId) {
    const c = CREATURES[creatureId];
    const cage = cageForCreature(creatureId);
    const lines = [];
    if (!c?.capture) return lines;
    lines.push(`Investigación mínima: ${this.minResearch(creatureId)}%`);
    if (cage) lines.push(`Necesitas: ${cage.name} (${cage.cost} 💐)`);
    return lines;
  }

  /** Jaula concreta que necesita una criatura. */
  requiredCage(creatureId) {
    const c = CREATURES[creatureId];
    if (c?.capture?.cage) return CAGES[c.capture.cage] || null;
    return cageForCreature(creatureId);
  }

  hasCage(creatureId) {
    const cage = this.requiredCage(creatureId);
    if (!cage) return false;
    return inventorySystem.has("cages", cage.id);
  }

  /**
   * Intenta capturar una criatura.
   * Requiere: criatura con datos, investigación mínima, jaula correcta en inventario.
   * Al capturarla, la jaula se vincula (marcada usada) a esa criatura.
   */
  capture(creatureId) {
    const c = CREATURES[creatureId];
    if (!c || !c.capture) return { ok: false, reason: "not_found" };
    if (gameState.state.creatures.captured.includes(creatureId)) {
      return { ok: false, reason: "already_captured" };
    }
    if (!this.canAttempt(creatureId)) {
      return { ok: false, reason: "research" };
    }
    const cage = this.requiredCage(creatureId);
    if (!this.hasCage(creatureId)) {
      return { ok: false, reason: "cage" };
    }

    // Consumir la jaula: se vincula a la criatura (no a otra).
    const used = inventorySystem.findCage(cage.id);
    if (!used) return { ok: false, reason: "cage" };
    used.creatureId = creatureId;
    used.used = true;
    inventorySystem.remove("cages", cage.id, 1);
    gameState.state.creatures.cages[creatureId] = cage.id;
    gameState.state.stats.cagesUsed++;

    rewardSystem.give({ type: "creature_capture", creatureId });
    saveManager.saveGame();
    eventBus.emit(eventBus.constructor.EVENTS.CREATURE_CAPTURED, { id: creatureId });
    return { ok: true, creature: c };
  }

  isCaptured(creatureId) {
    return gameState.state.creatures.captured.includes(creatureId);
  }
}

export const captureSystem = new CaptureSystem();
