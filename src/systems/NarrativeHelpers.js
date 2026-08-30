/**
 * NarrativeHelpers: utilidades pequeñas de estado de criaturas usadas por
 * NarrativeSystem y JournalPanel (evita dependencias circulares).
 */
import { gameState } from "./GameState.js";
import { investigationSystem } from "./InvestigationSystem.js";

export function memoOf(creatureId) {
  const s = gameState.state;
  return {
    discovered: s.creatures.discovered.includes(creatureId),
    captured: s.creatures.captured.includes(creatureId),
    tamed: s.creatures.tamed.includes(creatureId),
    trust: s.creatures.trust?.[creatureId] || 0,
    research: investigationSystem.getProgress(creatureId),
    researchReady: investigationSystem.isComplete(creatureId)
  };
}
