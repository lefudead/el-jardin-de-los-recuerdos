/**
 * UpgradeSystem (GDD técnico §11): compra de mejoras.
 */
import { UPGRADES } from "../data/upgrades.js";
import { gameState } from "./GameState.js";
import { economy } from "./EconomyInstance.js";
import { eventBus } from "./EventBus.js";
import { saveManager } from "./SaveInstance.js";

export class UpgradeSystem {
  getAll() {
    return Object.values(UPGRADES);
  }

  isOwned(upgradeId) {
    return gameState.state.unlocks.upgrades.includes(upgradeId);
  }

  canBuy(upgradeId) {
    const up = UPGRADES[upgradeId];
    if (!up) return false;
    return !this.isOwned(upgradeId) && economy.canAfford(up.cost);
  }

  buy(upgradeId) {
    const up = UPGRADES[upgradeId];
    if (!up) return { ok: false, reason: "not_found" };
    if (this.isOwned(upgradeId)) return { ok: false, reason: "owned" };
    if (!economy.purchase(up.cost)) return { ok: false, reason: "afford" };

    gameState.state.unlocks.upgrades.push(upgradeId);
    eventBus.emit(eventBus.constructor.EVENTS.UPGRADE_PURCHASED, { id: upgradeId });
    saveManager.saveGame();
    return { ok: true, upgrade: up };
  }
}

export const upgradeSystem = new UpgradeSystem();
