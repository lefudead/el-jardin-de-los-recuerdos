/**
 * SkinSystem (GDD técnico §35): skins cosméticos. Esqueleto para hitos futuros.
 */
import { gameState } from "./GameState.js";

export const SKINS = {
  spring: { id: "spring", name: "Primavera", unlockType: "start", cost: 0, emoji: "🌷" },
  moon: { id: "moon", name: "Luz Lunar", unlockType: "shop", cost: 100, emoji: "🌙" }
};

export class SkinSystem {
  getAll() { return Object.values(SKINS); }
  isUnlocked(id) { return gameState.state.unlocks.skins.includes(id); }
}

export const skinSystem = new SkinSystem();
