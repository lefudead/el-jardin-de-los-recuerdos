/**
 * UI: TopBar (GDD técnico §41) y BottomNav (§42).
 * DOM-based para el prototipo web.
 */
import { eventBus } from "../systems/EventBus.js";
import { timeLabel } from "../utils/time.js";

const Q = (id) => document.getElementById(id);

export class TopBar {
  constructor() {
    this.petalEl = Q("petal-counter");
    this.bouquetEl = Q("bouquet-counter");
    this.zoneEl = Q("zone-label");
    this.timeEl = Q("time-label");
  }

  update({ petals, bouquets }) {
    if (this.petalEl) this.petalEl.textContent = String(petals);
    if (this.bouquetEl) this.bouquetEl.textContent = String(bouquets);
  }

  setZone(name) {
    if (this.zoneEl) this.zoneEl.textContent = name;
  }

  setTime(state) {
    if (this.timeEl) this.timeEl.textContent = timeLabel(state);
  }
}

export class BottomNav {
  constructor(screenSwitcher) {
    this.switcher = screenSwitcher;
    this.buttons = document.querySelectorAll(".nav-btn");
    this.buttons.forEach((btn) => {
      btn.addEventListener("click", () => this.switcher(btn.dataset.screen));
    });
  }

  setActive(screen) {
    this.buttons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.screen === screen);
    });
  }
}

export const topBar = new TopBar();

eventBus.on(eventBus.constructor.EVENTS.RESOURCE_CHANGED, (snap) => topBar.update(snap));
eventBus.on(eventBus.constructor.EVENTS.TIME_CHANGED, (p) => topBar.setTime(p.timeOfDay));
