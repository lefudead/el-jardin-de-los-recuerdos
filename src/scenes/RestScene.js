/**
 * RestScene (GDD §42, GDD técnico §50): Rincón de descanso.
 * Esqueleto para relajación (sin farmeo, sin objetivos).
 */
import { relaxation } from "../systems/RelaxationSystem.js";

export function openRest() {
  relaxation.startBreathing((phase) => {
    console.log(`[rest] fase: ${phase}`);
  });
  return true;
}

export const restScene = { open: openRest };
