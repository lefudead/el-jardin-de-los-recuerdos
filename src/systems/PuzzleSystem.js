/**
 * PuzzleSystem (GDD técnico §22-24): acertijos y Escape Rooms.
 */
import { PUZZLES } from "../data/puzzles.js";
import { gameState } from "./GameState.js";
import { rewardSystem } from "./RewardSystem.js";
import { eventBus } from "./EventBus.js";
import { saveManager } from "./SaveInstance.js";

export class PuzzleSystem {
  getAll() {
    return Object.values(PUZZLES);
  }

  getPuzzle(id) {
    return PUZZLES[id] || null;
  }

  isSolved(puzzleId) {
    return gameState.state.puzzles.solved.includes(puzzleId);
  }

  solve(puzzleId) {
    if (this.isSolved(puzzleId)) return { ok: false, reason: "solved" };
    const p = PUZZLES[puzzleId];
    if (!p) return { ok: false, reason: "not_found" };

    if (p.reward) rewardSystem.give(p.reward);
    gameState.state.puzzles.solved.push(puzzleId);
    gameState.state.stats.puzzlesSolved++;
    eventBus.emit(eventBus.constructor.EVENTS.PUZZLE_SOLVED, { id: puzzleId });
    saveManager.saveGame();
    return { ok: true, puzzle: p };
  }
}

export const puzzleSystem = new PuzzleSystem();
