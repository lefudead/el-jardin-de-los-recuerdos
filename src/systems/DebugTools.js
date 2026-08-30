/**
 * DebugTools (GDD técnico §57): comandos de prueba para desarrollo.
 * Solo disponibles si CONFIG.debug es true o se activan manualmente.
 */
import { economy } from "./EconomyInstance.js";
import { gameState } from "./GameState.js";
import { saveManager } from "./SaveInstance.js";
import { dayNight } from "./DayNightSystem.js";
import { rewardSystem } from "./RewardSystem.js";
import { CONFIG } from "../config.js";
import { eventBus } from "./EventBus.js";

export class DebugTools {
  constructor() {
    this.enabled = CONFIG.debug;
  }

  setEnabled(v) {
    this.enabled = v;
  }

  /** Ejecuta un comando por nombre. */
  run(command) {
    if (!this.enabled) return;
    switch (command) {
      case "petals": economy.addPetals(1000); break;
      case "bouquets": economy.addBouquets(10); break;
      case "time": dayNight.advance(); dayNight.applyBodyClass(); break;
      case "moon": dayNight.setTime("night"); dayNight.applyBodyClass(); break;
      case "unlock_all":
        rewardSystem.give({ type: "map", id: "whispering_forest" });
        rewardSystem.give({ type: "map", id: "moon_lake" });
        rewardSystem.give({ type: "secret", id: "debug_secret" });
        break;
      case "reset": saveManager.resetGame(); break;
      default: break;
    }
    eventBus.emit(eventBus.constructor.EVENTS.RESOURCE_CHANGED, economy.snapshot());
  }

  static get socket() { return window.__gardenDebug; }
}

export const debugTools = new DebugTools();

window.__gardenDebug = {
  addPetals: (n) => economy.addPetals(n),
  addBouquets: (n) => economy.addBouquets(n),
  setTime: (t) => { dayNight.setTime(t); dayNight.applyBodyClass(); },
  resetProgress: () => saveManager.resetGame(),
  gameState: () => gameState.toSave()
};
