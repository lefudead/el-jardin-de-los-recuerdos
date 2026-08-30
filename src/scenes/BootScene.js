/**
 * BootScene (GDD técnico §50).
 * MVP: inicialización de sistemas y carga de guardado.
 * En un futuro Phaser, aquí se configuraría el motor; hoy es puro arranque.
 */
import { saveManager } from "../systems/SaveInstance.js";
import { gameState } from "../systems/GameState.js";
import { economy } from "../systems/EconomyInstance.js";
import { eventBus } from "../systems/EventBus.js";

export function boot() {
  // Cargar guardado (o crear uno nuevo)
  const hadSave = saveManager.loadGame();
  if (!hadSave) {
    saveManager.saveGame();
  }

  // Refrescar la interfaz con el estado cargado (top bar, hora)
  eventBus.emit(eventBus.constructor.EVENTS.RESOURCE_CHANGED, economy.snapshot());
  eventBus.emit(eventBus.constructor.EVENTS.TIME_CHANGED, {
    timeOfDay: gameState.state.progression.timeOfDay
  });

  console.log(`[boot] partida ${hadSave ? "cargada" : "nueva"}. Zona: ${gameState.state.progression.currentZone}`);
  return { hadSave };
}
