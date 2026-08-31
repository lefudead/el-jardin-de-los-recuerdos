/**
 * UI: TopBar (GDD técnico §41) y BottomNav (§42).
 * DOM-based para el prototipo web.
 * Muestra la moneda global (ramos) y la moneda local activa de la zona
 * (pétalos en el jardín, hojas en el bosque, etc.). §7.
 */
import { eventBus } from "../systems/EventBus.js";
import { gameState } from "../systems/GameState.js";
import { ZONES } from "../data/zones.js";
import { timeLabel } from "../utils/time.js";

const Q = (id) => document.getElementById(id);

export class TopBar {
  constructor() {
    this.petalEl = Q("petal-counter");
    this.bouquetEl = Q("bouquet-counter");
    this.zoneEl = Q("zone-label");
    this.timeEl = Q("time-label");
    this.zoneId = "spring_garden";
    this.currencyEmoji = "🌸";
  }

  /** Al cambiar de zona, recordamos qué moneda local mostrar. */
  setZone(name, zoneId) {
    this.zoneId = zoneId || "spring_garden";
    if (this.zoneEl) this.zoneEl.textContent = name;
    this.render();
  }

  setTime(state) {
    if (this.timeEl) this.timeEl.textContent = timeLabel(state);
  }

  /** Muestra la moneda local activa de la zona + los ramos globales. */
  render() {
    const s = gameState.state;
    const z = ZONES[this.zoneId];
    const zoneResource = s.resources?.zones?.[this.zoneId];
    // Jardín (economía "garden"): los pétalos viven en resources.petals.
    // Resto de zonas: moneda propia en resources.zones[zone].<currency>.
    let localVal, currency;
    if (z && z.economy === "zone" && zoneResource) {
      currency = z.currency;
      localVal = zoneResource[currency] || 0;
    } else {
      currency = "petals";
      localVal = s.resources?.petals || 0;
    }
    this.currencyEmoji = currency === "leaves" ? "🍃" : currency === "moonlight" ? "🌙" : "🌸";
    if (this.petalEl) {
      this.petalEl.textContent = String(localVal);
      const icon = this.petalEl.previousElementSibling;
      if (icon && icon.classList.contains("resource-icon")) icon.textContent = this.currencyEmoji;
    }
    if (this.bouquetEl) this.bouquetEl.textContent = String(s.resources?.bouquets || 0);
  }

  /** Callback de RESOURCE_CHANGED (ignora el snap legado y relee el estado). */
  update() {
    this.render();
  }
}

export const topBar = new TopBar();

eventBus.on(eventBus.constructor.EVENTS.RESOURCE_CHANGED, () => topBar.update());
eventBus.on(eventBus.constructor.EVENTS.TIME_CHANGED, (p) => topBar.setTime(p.timeOfDay));