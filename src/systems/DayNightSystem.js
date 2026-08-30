/**
 * DayNightSystem (GDD técnico §14): ciclo día → atardecer → noche.
 * En el prototipo el tiempo avanza por ciclos controlados (no reloj real).
 */
import { gameState } from "./GameState.js";
import { eventBus } from "./EventBus.js";
import { nextTime } from "../utils/time.js";

export class DayNightSystem {
  constructor() {
    this.tickTimer = null;
  }

  get timeOfDay() {
    return gameState.state.progression.timeOfDay;
  }

  advance() {
    const next = nextTime(this.timeOfDay);
    gameState.state.progression.timeOfDay = next;
    eventBus.emit(eventBus.constructor.EVENTS.TIME_CHANGED, { timeOfDay: next });
    return next;
  }

  setTime(state) {
    gameState.state.progression.timeOfDay = state;
    eventBus.emit(eventBus.constructor.EVENTS.TIME_CHANGED, { timeOfDay: state });
  }

  /** Aplica el estilo visual del cuerpo según el momento del día. */
  applyBodyClass() {
    const n = this.timeOfDay === "night" || this.timeOfDay === "full_moon";
    document.body.classList.toggle("night", n);
  }

  /** Inicia un ciclo automático (por ejemplo cada 45 s). */
  startCycle(intervalMs) {
    this.stopCycle();
    this.tickTimer = setInterval(() => this.advance(), intervalMs);
  }

  stopCycle() {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }
}

export const dayNight = new DayNightSystem();
