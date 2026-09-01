/**
 * DayNightSystem (GDD técnico §14): ciclo día/noche vinculado al Tiempo Real.
 * El estado del juego ("day" | "sunset" | "night") se deriva de la hora local
 * del jugador: si donde está es de noche, el juego está de noche.
 *
 * Base preparada: el ciclo se computa y sincroniza solo (startRealTimeSync).
 * Aún no se implementan las mecánicas/progresión nocturnas (p. ej. Lumi como
 * evento o la tienda de noche); eso llega después.
 */
import { gameState } from "./GameState.js";
import { eventBus } from "./EventBus.js";
import { CONFIG } from "../config.js";

export class DayNightSystem {
  constructor() {
    this.tickTimer = null;
    this._lastRealTime = null;
  }

  get timeOfDay() {
    return gameState.state.progression.timeOfDay;
  }

  /** Estado derivado de la hora real local del jugador. */
  computeFromRealTime(date = new Date()) {
    const h = date.getHours();
    const cfg = CONFIG.dayNight || {};
    const dayStart = cfg.dayStartHour ?? 7;
    const sunsetStart = cfg.sunsetStartHour ?? 18;
    const nightStart = cfg.nightStartHour ?? 20;
    if (h < dayStart || h >= nightStart) return "night";   // 0‑6 y 20‑23
    if (h >= sunsetStart) return "sunset";                 // 18‑19
    return "day";                                          // 7‑17
  }

  /** Computa la hora real y, si cambió de estado, lo aplica y emite el evento. */
  applyRealTime() {
    const next = this.computeFromRealTime();
    const changed = next !== this._lastRealTime;
    this._lastRealTime = next;
    if (gameState.state.progression.timeOfDay !== next) {
      gameState.state.progression.timeOfDay = next;
      eventBus.emit(eventBus.constructor.EVENTS.TIME_CHANGED, { timeOfDay: next, source: "realtime" });
    }
    return { state: next, changed };
  }

  /** Inicia la sincronización automática con el tiempo real. */
  startRealTimeSync(intervalMs) {
    this.stopCycle();
    this.applyRealTime();
    this.tickTimer = setInterval(
      () => this.applyRealTime(),
      intervalMs || (CONFIG.dayNight?.realTimeSyncMs ?? 30000)
    );
  }

  /** Detiene la sincronización automática. */
  stopCycle() {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  /** (Legado) Avanza manualmente al siguiente estado — útil para debug/tests. */
  advance() {
    const next = this.computeFromRealTime();
    return next;
  }

  /** Fuerza un estado (debug/tests). */
  setTime(state) {
    gameState.state.progression.timeOfDay = state;
    eventBus.emit(eventBus.constructor.EVENTS.TIME_CHANGED, { timeOfDay: state, source: "manual" });
  }

  /** Aplica el estilo visual del cuerpo según el momento. */
  applyBodyClass() {
    const n = this.timeOfDay === "night" || this.timeOfDay === "full_moon";
    document.body.classList.toggle("night", n);
  }
}

export const dayNight = new DayNightSystem();
