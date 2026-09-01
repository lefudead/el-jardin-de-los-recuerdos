/**
 * BuffSystem (base de pociones): aplica mejoras temporales (buffs) que se suman
 * igual que las mejoras permanentes. Los usuarios de `bonusFor` (FarmingSystem,
 * FlowerSystem) leen la suma a través de UpgradeSystem, por lo que un buff activo
 * aparece como una bonificación adicional mientras dura.
 */
import { eventBus } from "./EventBus.js";
import { saveManager } from "./SaveInstance.js";
import { gameState } from "./GameState.js";

export class BuffSystem {
  constructor() {
    // buffs activos: { effect: {...}, untilMs: number, timer }
    this.active = [];
  }

  /** ¿Hay un buff activo del tipo dado? */
  hasPotions() {
    return this.active.length > 0;
  }

  /** Aplica un efecto temporal y programa su caducidad. */
  apply(effect, durationMs) {
    const untilMs = Date.now() + durationMs;
    const buff = { effect: effect || {}, untilMs };
    this.active.push(buff);
    buff.timer = setTimeout(() => {
      this.active = this.active.filter((b) => b !== buff);
      eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, { text: "⌛ Se acabó el efecto de la poción." });
      saveManager.saveGame();
    }, durationMs);
    eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, { text: "🧪 ¡Poción activada! Bonificación durante " + Math.round(durationMs / 1000) + " s." });
    saveManager.saveGame();
    return buff;
  }

  /** Suma las bonificaciones de todos los buffs activos para un campo. */
  bonusFor(field) {
    let acc = 0;
    for (const b of this.active) {
      if (typeof b.effect?.[field] === "number") acc += b.effect[field];
    }
    return acc;
  }

  /** Descarta todos los buffs (p. ej. al reiniciar partida). */
  clear() {
    for (const b of this.active) clearTimeout(b.timer);
    this.active = [];
  }
}

export const buffSystem = new BuffSystem();
