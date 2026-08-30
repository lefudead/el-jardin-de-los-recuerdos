/**
 * InvestigationSystem (GDD técnico §18, GDD §31-33): observaciones,
 * investigación y elegibilidad para captura.
 */
import { CREATURES } from "../data/creatures.js";
import { gameState } from "./GameState.js";
import { percent } from "../utils/math.js";

export class InvestigationSystem {
  getObservations(creatureId) {
    return gameState.state.creatures.observations[creatureId] || [];
  }

  getTotalObservations(creatureId) {
    const c = CREATURES[creatureId];
    return c ? c.observations.length : 0;
  }

  isObservationFound(creatureId, obsId) {
    return this.getObservations(creatureId).includes(obsId);
  }

  setObservationFound(creatureId, obsId) {
    this.addObservation(creatureId, obsId);
  }

  /** Añade una observación y reduce la barrera de investigación. */
  addObservation(creatureId, observationId) {
    const obs = gameState.state.creatures.observations;
    if (!obs[creatureId]) obs[creatureId] = [];
    if (!obs[creatureId].includes(observationId)) {
      obs[creatureId].push(observationId);
      this.applyResearchFactor(creatureId);
    }
  }

  /**
   * Porcentaje de investigación 0-100.
   * Usa `research[creatureId]` explícito si existe; si no, lo deriva de las
   * observaciones encontradas sobre el total (compatibilidad con guardados v1).
   */
  getProgress(creatureId) {
    const explicit = gameState.state.creatures.research?.[creatureId];
    if (typeof explicit === "number" && explicit >= 0) return Math.min(100, Math.round(explicit));
    const found = this.getObservations(creatureId).filter((o) => o !== "__discovered__").length;
    const total = this.getTotalObservations(creatureId);
    return percent(found, total);
  }

  /** Suma puntos de investigación manuales (p. ej. al intervenir con Nilo). */
  addResearch(creatureId, amount) {
    const research = gameState.state.creatures.research || (gameState.state.creatures.research = {});
    const cur = typeof research[creatureId] === "number" ? research[creatureId] : this.getProgress(creatureId);
    research[creatureId] = Math.min(100, cur + amount);
  }

  /** Reduce la barrera según cuántas observaciones se han encontrado. */
  applyResearchFactor(creatureId) {
    const found = this.getObservations(creatureId).filter((o) => o !== "__discovered__").length;
    // Cada observación completa aporta investigación base.
    const research = gameState.state.creatures.research || (gameState.state.creatures.research = {});
    const total = this.getTotalObservations(creatureId);
    if (total > 0) {
      const base = Math.round((found / total) * 100);
      research[creatureId] = Math.min(100, Math.max(0, Math.round((research[creatureId] || 0) + (base - (research[creatureId] || 0)))));
    }
  }

  isComplete(creatureId) {
    return this.getProgress(creatureId) >= 100;
  }
}

export const investigationSystem = new InvestigationSystem();
