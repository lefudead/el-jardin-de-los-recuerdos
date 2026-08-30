/**
 * DecorationSystem (GDD técnico §34): colocación de decoración en el jardín.
 * Esqueleto para hitos futuros (Beta).
 */
import { gameState } from "./GameState.js";

export class DecorationSystem {
  getDecorations(zoneId) {
    const deco = gameState.state.decorations || [];
    return deco.filter((d) => d.zone === zoneId);
  }

  place(decoration) {
    const deco = gameState.state.decorations || (gameState.state.decorations = []);
    deco.push({ ...decoration });
  }

  remove(id) {
    const deco = gameState.state.decorations || [];
    const idx = deco.findIndex((d) => d.id === id && d.instanceId === undefined);
    if (idx >= 0) deco.splice(idx, 1);
  }
}

export const decorationSystem = new DecorationSystem();
