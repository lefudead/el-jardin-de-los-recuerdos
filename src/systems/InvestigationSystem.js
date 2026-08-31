/**
 * InvestigationSystem (GDD técnico §18, GDD §31-33): observaciones,
 * investigación y elegibilidad para captura.
 *
 * Descubrimiento (GDD §33): el 100% de descubrimiento de una criatura se
 * alcanza encontrándola 5 veces. Cada encuentro cuenta como un 20%.
 */
import { CREATURES } from "../data/creatures.js";
import { gameState } from "./GameState.js";
import { percent } from "../utils/math.js";

export const FINDS_FOR_DISCOVERY = 5;

export class InvestigationSystem {
  /** Nº de veces que se ha encontrado a la criatura (GDD §33). */
  getFinds(creatureId) {
    return gameState.state.creatures.finds?.[creatureId] || 0;
  }

  /** Registra un encuentro: sube la investigación proporcional (5 → 100%). */
  addFind(creatureId) {
    const finds = gameState.state.creatures.finds || (gameState.state.creatures.finds = {});
    finds[creatureId] = (finds[creatureId] || 0) + 1;
    const pct = Math.min(100, Math.round((finds[creatureId] / FINDS_FOR_DISCOVERY) * 100));
    const research = gameState.state.creatures.research || (gameState.state.creatures.research = {});
    research[creatureId] = Math.max(research[creatureId] || 0, pct);
    return finds[creatureId];
  }

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
   * Porcentaje de descubrimiento 0-100.
   * Si la criatura se ha encontrado alguna vez, el descubrimiento crece con
   * los encuentros (100% = 5 veces). Si todavía no hay encuentros, deriva del
   * `research` explícito o de las observaciones (compatibilidad v1/v3).
   */
  getProgress(creatureId) {
    const finds = this.getFinds(creatureId);
    if (finds > 0) return Math.min(100, Math.round((finds / FINDS_FOR_DISCOVERY) * 100));
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
