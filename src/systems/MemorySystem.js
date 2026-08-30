/**
 * MemorySystem (GDD técnico §143, GDD §57, §72-80).
 * Recuerdos: encontrados y restaurados. Restaurar un recuerdo avanza la
 * historia y a veces devuelve una parte del pasado del esposo.
 */
import { MEMORIES, memoryForCreature } from "../data/memories.js";
import { gameState } from "./GameState.js";
import { rewardSystem } from "./RewardSystem.js";

export class MemorySystem {
  getFound() {
    return gameState.state.memories.found || [];
  }

  getRestored() {
    return gameState.state.memories.restored || [];
  }

  isFound(id) {
    return this.getFound().includes(id);
  }

  isRestored(id) {
    return this.getRestored().includes(id);
  }

  /** Marca un recuerdo como encontrado. */
  find(id) {
    return rewardSystem.give({ type: "memory", id });
  }

  /** Restaura un recuerdo (avanza hacia el final y conecta narrativa). */
  restore(id) {
    const changed = rewardSystem.give({ type: "memory_restore", id });
    const mem = MEMORIES[id];
    if (changed && mem?.creatureId) {
      // Al restaurar un recuerdo vinculado a una criatura, sumamos confianza extra.
      const taming = gameState.state.creatures.trust;
      if (taming) {
        const key = mem.creatureId;
        taming[key] = Math.min(100, (taming[key] || 0) + 10);
      }
    }
    return changed;
  }

  /** Recuerdo vinculado a una criatura domesticada (p. ej. la cinta de Nilo). */
  memoryForCreature(creatureId) {
    return memoryForCreature(creatureId);
  }
}

export const memorySystem = new MemorySystem();
