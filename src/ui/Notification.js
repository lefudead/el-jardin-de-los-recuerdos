/**
 * UI: Notification (GDD §43) y toast de progreso.
 * DOM-based para el prototipo web.
 */
const Q = (id) => document.getElementById(id);

export class Notification {
  constructor() {
    this.el = Q("notification");
    this.toastEl = Q("toast");
    this.toastTimer = null;
  }

  /** Notificación de descubrimiento breve en la parte superior. */
  show(text, duration = 2200) {
    if (!this.el) return;
    this.el.textContent = text;
    this.el.classList.add("show");
    clearTimeout(this._t);
    this._t = setTimeout(() => this.el.classList.remove("show"), duration);
  }

  /** Toast con estado (ej: "💐 ¡1 ramo!"). */
  toast(text, duration = 1800) {
    if (!this.toastEl) return;
    this.toastEl.textContent = text;
    this.toastEl.classList.add("show");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastEl.classList.remove("show"), duration);
  }
}

export const notification = new Notification();

// Centro de notificaciones escuchando el event bus.
import { eventBus } from "../systems/EventBus.js";
import { gameState } from "../systems/GameState.js";

eventBus.on(eventBus.constructor.EVENTS.FLOWER_DISCOVERED, (p) => {
  notification.show("🌸 ¡Nueva flor descubierta!");
});

eventBus.on(eventBus.constructor.EVENTS.CREATURE_FOUND, (p) => {
  notification.show("🐾 ¡Nueva criatura encontrada!");
});

eventBus.on(eventBus.constructor.EVENTS.OBSERVATION_FOUND, (p) => {
  notification.show("✨ Nueva observación");
});

eventBus.on(eventBus.constructor.EVENTS.SECRET_FOUND, (p) => {
  notification.show("🔐 Nuevo misterio");
});

eventBus.on(eventBus.constructor.EVENTS.MAP_UNLOCKED, (p) => {
  notification.show("🗺️ Nuevo lugar desbloqueado");
});

eventBus.on(eventBus.constructor.EVENTS.SHOW_TOAST, (p) => {
  notification.toast(p.text);
});

// ---- Criaturas: interferencia y alertas (GDD §13, §40, §104) ----
eventBus.on(eventBus.constructor.EVENTS.NILO_WARNING, (p) => {
  notification.show(`🐾 ¡${p.name} está robando tus flores! Tócalo para detenerlo.`, 2600);
});

eventBus.on(eventBus.constructor.EVENTS.CREATURE_INTERFERENCE, (p) => {
  // Nilo robando una FLOR no roba pétalos: se gestiona con su propio toast de
  // penalización de capacidad máxima (emitido por GardenScene).
  if (p.status === "escaped" && p.type !== "steal_flowers") {
    notification.show(`🐆 Nilo robó ${p.stolen} pétalos y escapó.`, 2200);
  }
});

eventBus.on(eventBus.constructor.EVENTS.CREATURE_STOPPED, (p) => {
  notification.show("🎉 ¡Lo detuviste a tiempo!", 2000);
});

eventBus.on(eventBus.constructor.EVENTS.CREATURE_CAPTURED, (p) => {
  notification.show("🪤 ¡Criatura capturada!", 2600);
});

eventBus.on(eventBus.constructor.EVENTS.CREATURE_TAMED, (p) => {
  notification.show("❤️ ¡Ahora es tu compañera!", 2600);
});

eventBus.on(eventBus.constructor.EVENTS.CREATURE_HELPED, (p) => {
  if (p.amount) notification.show("🧺 Un compañero recogió pétalos por ti", 1800);
});
