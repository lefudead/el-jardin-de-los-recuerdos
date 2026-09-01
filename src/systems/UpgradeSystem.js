/**
 * UpgradeSystem (GDD técnico §11): compra de mejoras.
 *
 * Actualización 3.1: cada mejora declara `scope` (global | local | cross) y una
 * `currency` (por defecto "bouquets"). `bonusFor(field, zoneId)` suma los
 * efectos de las mejoras propias, teniendo en cuenta el alcance:
 *  - global  → aplica en cualquier zona
 *  - local   → aplica solo en la zona `up.zone`
 *  - cross   → aplica en la zona dada (mejoras de la Memoria/globales)
 */
import { UPGRADES } from "../data/upgrades.js";
import { gameState } from "./GameState.js";
import { economy } from "./EconomyInstance.js";
import { eventBus } from "./EventBus.js";
import { saveManager } from "./SaveInstance.js";
import { DEFAULT_SCOPE } from "../data/zones.js";
import { buffSystem } from "./BuffSystem.js";

export class UpgradeSystem {
  getAll() {
    return Object.values(UPGRADES);
  }

  getById(id) {
    return UPGRADES[id] || null;
  }

  isOwned(upgradeId) {
    return this.ownedIds().includes(upgradeId);
  }

  /** Todos los ids de mejoras compradas. */
  ownedIds() {
    return gameState.state.unlocks.upgrades.slice();
  }

  /** Mejoras compradas que aplican en `zoneId` (según scope). */
  ownedInZone(zoneId) {
    return this.ownedIds().filter((id) => this.appliesIn(UPGRADES[id], zoneId));
  }

  /** ¿Una mejora aplica en la zona dada según su scope? */
  appliesIn(up, zoneId) {
    if (!up) return false;
    const scope = up.scope || DEFAULT_SCOPE;
    if (scope === "global") return true;
    if (scope === "cross") return true;
    return !up.zone || up.zone === zoneId;
  }

  /**
   * Bonificación total para un campo de efecto en una zona, sumando las
   * mejoras compradas cuyo scope las hace aplicables.
   */
  bonusFor(field, zoneId) {
    let acc = 0;
    for (const id of this.ownedInZone(zoneId)) {
      const v = UPGRADES[id]?.effect?.[field];
      if (typeof v === "number") acc += v;
    }
    // Bonificaciones temporales de las pociones (se suman igual que las mejoras).
    acc += buffSystem.bonusFor(field);
    return acc;
  }

  /** True si alguna mejora activa en la zona aporta el flag de efecto. */
  hasBonusFlag(field, zoneId) {
    return this.ownedInZone(zoneId).some((id) => !!UPGRADES[id]?.effect?.[field]);
  }

  canBuy(upgradeId) {
    const up = UPGRADES[upgradeId];
    if (!up) return false;
    const currency = up.currency || "bouquets";
    return !this.isOwned(upgradeId) && economy.canAffordResource(currency, up.cost);
  }

  buy(upgradeId) {
    const up = UPGRADES[upgradeId];
    if (!up) return { ok: false, reason: "not_found" };
    if (this.isOwned(upgradeId)) return { ok: false, reason: "owned" };
    const currency = up.currency || "bouquets";
    if (!economy.spendResource(currency, up.cost)) return { ok: false, reason: "afford" };

    gameState.state.unlocks.upgrades.push(upgradeId);
    eventBus.emit(eventBus.constructor.EVENTS.UPGRADE_PURCHASED, { id: upgradeId });
    saveManager.saveGame();
    return { ok: true, upgrade: up };
  }
}

export const upgradeSystem = new UpgradeSystem();
