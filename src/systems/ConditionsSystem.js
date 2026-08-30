/**
 * ConditionsSystem (GDD técnico §53): evaluador reutilizable de condiciones.
 */
import { gameState } from "./GameState.js";
import { economy } from "./EconomyInstance.js";

export class ConditionsSystem {
  /**
   * Evalúa una condición { type, ... } contra el estado actual.
   * Tipos: has_bouquets, has_item, map_unlocked, creature_discovered,
   * observation_found, puzzle_solved, time_is, event_active, story_progress.
   */
  check(condition) {
    if (!condition) return true;
    switch (condition.type) {
      case "has_bouquets":
        return economy.bouquets >= (condition.amount || 0);

      case "has_item":
        return (gameState.state.inventory || []).some((i) => i.id === condition.item && (i.quantity || 1) > 0);

      case "map_unlocked":
        return gameState.state.unlocks.maps.includes(condition.id);

      case "creature_discovered":
        return gameState.state.creatures.discovered.includes(condition.id);

      case "observation_found":
        return (gameState.state.creatures.observations[condition.creatureId] || []).includes(condition.observationId);

      case "puzzle_solved":
        return gameState.state.puzzles.solved.includes(condition.id);

      case "time_is":
        return gameState.state.progression.timeOfDay === condition.time;

      case "event_active":
        return gameState.state.events.completed.includes(condition.id);

      case "story_progress":
        return gameState.state.progression.storyProgress >= (condition.amount || 0);

      default:
        return true;
    }
  }

  /** Evalúa una lista de condiciones (todas deben cumplirse). */
  checkAll(conditions = []) {
    return conditions.every((c) => this.check(c));
  }
}

export const conditions = new ConditionsSystem();
