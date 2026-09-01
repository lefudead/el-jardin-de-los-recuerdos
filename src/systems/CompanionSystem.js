/**
 * CompanionSystem (GDD técnico §141, GDD §27-29, §35, §96-102).
 * Criaturas domesticadas: habilidades y producción pasiva.
 *
 * Apoyos (GDD §35): en el jardín se eligen qué compañeros están activos.
 * - Máximo base: 2 compañeros apoyando a la vez.
 * - La tienda permite comprar hasta 2 slots extra (total máx 4).
 * - Solo los apoyos activos aportan su habilidad pasiva.
 */
import { CREATURES } from "../data/creatures.js";
import { COMPANIONS, companionForCreature } from "../data/companions.js";
import { ZONES } from "../data/zones.js";
import { MAPS } from "../data/maps.js";
import { CONFIG } from "../config.js";
import { gameState } from "./GameState.js";
import { economy } from "./EconomyInstance.js";
import { eventBus } from "./EventBus.js";
import { chance } from "../utils/random.js";
import { saveManager } from "./SaveInstance.js";

export const BASE_COMPANION_SLOTS = 2;
export const MAX_COMPANION_SLOTS = 4;
export const SLOT_UPGRADE_COST = 60; // ramos por cada slot extra

export class CompanionSystem {
  constructor() {
    this._farmTimer = null;
  }

  getCompanions() {
    return gameState.state.creatures.tamed.map((id) => CREATURES[id]).filter(Boolean);
  }

  isCompanion(creatureId) {
    return gameState.state.creatures.tamed.includes(creatureId);
  }

  // ================= Apoyos activos =================

  /** Nº máximo de apoyos simultáneos (base 2 + slots comprados, máx 4). */
  maxActive() {
    const bought = gameState.state.companions?.slotsBought || 0;
    return Math.min(MAX_COMPANION_SLOTS, BASE_COMPANION_SLOTS + bought);
  }

  /** Compañeros domesticados que están apoyando ahora mismo. */
  getActiveCompanions() {
    const active = gameState.state.companions?.active || [];
    return this.getCompanions().filter((c) => active.includes(c.id));
  }

  isActive(creatureId) {
    return (gameState.state.companions?.active || []).includes(creatureId);
  }

  /** Slots extra comprados en la tienda (0-2). */
  slotsBought() {
    return gameState.state.companions?.slotsBought || 0;
  }

  /** Coste del siguiente slot extra (null si ya hay 2 comprados). */
  nextSlotCost() {
    const bought = this.slotsBought();
    if (bought >= MAX_COMPANION_SLOTS - BASE_COMPANION_SLOTS) return null;
    return SLOT_UPGRADE_COST;
  }

  /** Compra un slot extra de apoyo en la tienda. */
  buySlot() {
    if (this.nextSlotCost() === null) return { ok: false, reason: "max" };
    if (!economy.purchase(this.nextSlotCost())) return { ok: false, reason: "afford" };
    const comp = gameState.state.companions;
    comp.slotsBought = Math.min(MAX_COMPANION_SLOTS - BASE_COMPANION_SLOTS, (comp.slotsBought || 0) + 1);
    saveManager.saveGame();
    eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, {
      text: `🎒 Slot de apoyo extra: ahora puedes tener ${this.maxActive()} apoyos a la vez.`
    });
    return { ok: true, max: this.maxActive() };
  }

  /** Activa/desactiva a un compañero como apoyo (respeta el máximo). */
  toggleActive(creatureId) {
    const comp = gameState.state.companions;
    if (!this.isCompanion(creatureId)) return { ok: false, reason: "not_companion" };
    const active = comp.active || (comp.active = []);
    const idx = active.indexOf(creatureId);
    if (idx >= 0) {
      active.splice(idx, 1);
    } else {
      if (active.length >= this.maxActive()) {
        return { ok: false, reason: "max", max: this.maxActive() };
      }
      active.push(creatureId);
    }
    saveManager.saveGame();
    eventBus.emit(eventBus.constructor.EVENTS.CREATURE_HELPED, { active: active.slice() });
    return { ok: true, active: active.slice() };
  }

  /** Tras domesticar, activa la criatura si hay hueco libre. */
  autoActivate(creatureId) {
    const active = gameState.state.companions?.active || (gameState.state.companions.active = []);
    if (active.includes(creatureId)) return;
    if (active.length < this.maxActive()) {
      active.push(creatureId);
      saveManager.saveGame();
      eventBus.emit(eventBus.constructor.EVENTS.CREATURE_HELPED, { active: active.slice() });
    }
  }

  skillFor(creatureId) {
    const c = CREATURES[creatureId];
    if (!c || !this.isCompanion(creatureId)) return null;
    if (c.companionSkill?.id) return COMPANIONS[c.companionSkill.id] || null;
    return companionForCreature(creatureId);
  }

  hasSkill(skillId) {
    return this.getActiveCompanions().some((c) => {
      const skill = this.skillFor(c.id);
      return skill && skill.id === skillId;
    });
  }

  /**
   * Invocado en cada tap de flor. Aplica la producción pasiva de los apoyos
   * ACTIVOS (p. ej. Nilo recolector devuelve pétalo extra con probabilidad).
   * Devuelve el pétalo extra concedido (0 si ninguno).
   */
  applyTapBonus() {
    let extra = 0;
    for (const companion of this.getActiveCompanions()) {
      const skill = this.skillFor(companion.id);
      if (!skill?.effect) continue;
      const pChance = skill.effect.bonusPetalChance;
      if (typeof pChance === "number" && pChance > 0 && chance(pChance)) {
        extra += 1;
        if (!companion._biasIncrement) companion._biasIncrement = 0;
        companion._biasIncrement++;
      }
    }
    if (extra > 0) {
      economy.addPetals(extra);
      eventBus.emit(eventBus.constructor.EVENTS.CREATURE_HELPED, { amount: extra });
    }
    return extra;
  }

  // ================= Farmeo pasivo por zona (Actualización 3.1) =================

  /** Zonas desbloqueadas en las que un apoyo puede farmear (sin mantenimiento). */
  farmableZones() {
    const ids = gameState.state.unlocks.maps || [];
    const out = [];
    for (const id of ids) {
      const map = MAPS[id];
      const zone = ZONES[id];
      if (!map || map.maintenance || !zone) continue;
      out.push({ id, name: zone.name, emoji: map.emoji || "✧" });
    }
    return out;
  }

  /** Zona de farmeo elegida para un apoyo (null si no hay ninguna). */
  getFarmZone(creatureId) {
    const zones = gameState.state.companions.farmZone;
    return (zones && zones[creatureId]) || null;
  }

  /** Elige la zona donde un apoyo farmeará monedas automáticamente. */
  setFarmZone(creatureId, zoneId) {
    if (!this.isCompanion(creatureId)) return { ok: false, reason: "not_companion" };
    const farmable = this.farmableZones().map((z) => z.id);
    if (zoneId && !farmable.includes(zoneId)) return { ok: false, reason: "locked_zone" };
    const comp = gameState.state.companions;
    if (!comp.farmZone) comp.farmZone = {};
    if (!zoneId) delete comp.farmZone[creatureId];
    else comp.farmZone[creatureId] = zoneId;
    saveManager.saveGame();
    return { ok: true, zone: zoneId };
  }

  /** Moneda que produce una zona (clave de economy: "petals" o "zona.moneda"). */
  _farmCurrencyFor(zoneId) {
    const zone = ZONES[zoneId];
    if (!zone) return null;
    return zone.economy === "zone" ? `${zoneId}.${zone.currency}` : "petals";
  }

  /** Un tick de recolección: cada apoyo activo con zona produce monedas. */
  tickFarm() {
    const amount = (CONFIG.companionFarm && CONFIG.companionFarm.amount) || 5;
    const gained = [];
    for (const companion of this.getActiveCompanions()) {
      const zoneId = this.getFarmZone(companion.id) || gameState.state.progression.currentZone;
      const currency = this._farmCurrencyFor(zoneId);
      if (!currency) continue;
      economy.addResource(currency, amount);
      gained.push({ id: companion.id, zone: zoneId, channel: currency, amount });
    }
    return gained;
  }

  /** Inicia el ciclo de farmeo pasivo (un tick por intervalo configurado). */
  startFarming() {
    this.stopFarming();
    const intervalMs = (CONFIG.companionFarm && CONFIG.companionFarm.intervalMs) || 30000;
    this._farmTimer = setInterval(() => this.tickFarm(), intervalMs);
  }

  /** Detiene el ciclo de farmeo pasivo. */
  stopFarming() {
    if (this._farmTimer) {
      clearInterval(this._farmTimer);
      this._farmTimer = null;
    }
  }
}

export const companionSystem = new CompanionSystem();