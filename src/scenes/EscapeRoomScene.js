/**
 * EscapeRoomScene (GDD técnico §24, §50). Esqueleto para hitos futuros (Hito 03).
 */
import { puzzleSystem } from "../systems/PuzzleSystem.js";

export function openEscapeRoom(puzzleId) {
  const p = puzzleSystem.getPuzzle ? puzzleSystem.getPuzzle(puzzleId) : null;
  console.log(`[escape] abrir: ${puzzleId}`, p ? p.name : "(no encontrado)");
  return p;
}

export const escapeRoomScene = { open: openEscapeRoom };
