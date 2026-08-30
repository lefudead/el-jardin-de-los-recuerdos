/**
 * SaveSystem (GDD técnico §6): guardado automático y persistente.
 * saveGame / loadGame / resetGame / hasSave / exportSave / importSave
 */
import { gameState } from "./GameState.js";
import { eventBus } from "./EventBus.js";
import * as storage from "../utils/storage.js";

const SAVE_KEY = "save";

export class SaveSystem {
  constructor() {
    this.saveTimer = null;
  }

  saveGame() {
    return storage.saveToStorage(SAVE_KEY, gameState.toSave());
  }

  loadGame() {
    const raw = storage.loadFromStorage(SAVE_KEY);
    if (raw) {
      gameState.hydrate(raw);
      return true;
    }
    return false;
  }

  hasSave() {
    return storage.loadFromStorage(SAVE_KEY) !== null;
  }

  resetGame() {
    storage.removeFromStorage(SAVE_KEY);
    gameState.reset();
    eventBus.emit(eventBus.constructor.EVENTS.GAME_RESET, {});
  }

  exportSave() {
    const json = JSON.stringify(gameState.toSave(), null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "jardin_recuerdos_save.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  importSave(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          gameState.hydrate(parsed);
          this.saveGame();
          resolve(true);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  /** Inicia el guardado automático periódico (GDD §6.2). */
  startAutosave(intervalMs) {
    this.stopAutosave();
    this.saveTimer = setInterval(() => this.saveGame(), intervalMs);
  }

  stopAutosave() {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
  }
}
