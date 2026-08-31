/**
 * AutoGenerateSystem: genera pasivamente una pequeña cantidad del recurso de
 * la zona activa cada intervalo mientras el jugador tiene un objeto "reloj"
 * (autoGenerate). "Aunque no estés tocando, el mundo sigue vivo."
 *
 * Objetos: 🕰️ Reloj antiguo (bosque) y ⏳ Reloj de bolsillo (jardín). Ambos
 * generan 2 unidades de la moneda de la zona activa cada 30 s.
 */
import { upgradeSystem } from "./UpgradeSystem.js";
import { economy } from "./EconomyInstance.js";
import { gameState } from "./GameState.js";
import { eventBus } from "./EventBus.js";
import { ZONES } from "../data/zones.js";

const DEFAULT_INTERVAL = 30 * 1000;

export class AutoGenerateSystem {
  constructor() {
    this.timer = null;
    this.interval = DEFAULT_INTERVAL;
  }

  /** ¿El jugador posee algún generador pasivo (reloj)? */
  hasAnyGenerator() {
    return upgradeSystem.getAll().some(
      (u) => upgradeSystem.isOwned(u.id) && typeof u.effect?.autoGenerate === "number"
    );
  }

  /** Cantidad que se genera por tick, por poseer generadores pasivos. */
  generateAmount() {
    let n = 0;
    for (const u of upgradeSystem.getAll()) {
      if (upgradeSystem.isOwned(u.id) && typeof u.effect?.autoGenerate === "number") {
        n += u.effect.autoGenerate;
      }
    }
    return n;
  }

  start() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), this.interval);
  }

  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  tick() {
    if (!this.hasAnyGenerator()) return;
    const zoneId = gameState.state.progression.currentZone || "spring_garden";
    const zone = ZONES[zoneId];
    if (!zone) return;
    const amount = this.generateAmount();
    if (amount <= 0) return;

    // El jardín usa la economía legada (pétalos), el resto su moneda de zona.
    if (zone.economy === "garden") {
      economy.addPetals(amount);
      eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, { text: `⏳ El reloj genera +${amount} 🌸` });
    } else {
      economy.addResource(`${zoneId}.${zone.currency}`, amount);
      const emoji = zone.currency === "leaves" ? "🍂" : "✨";
      eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, { text: `🕰️ El reloj genera +${amount} ${emoji}` });
    }
  }
}

export const autoGenerateSystem = new AutoGenerateSystem();
