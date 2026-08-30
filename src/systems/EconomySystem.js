/**
 * EconomySystem (GDD técnico §7): pétalos, ramos, conversión y compras.
 * Conversión preferida: conservar excedentes (ej: 27 pétalos → 2 ramos + 7 pétalos).
 */
import { gameState } from "./GameState.js";
import { eventBus } from "./EventBus.js";
import { CONFIG } from "../config.js";
import { clamp } from "../utils/math.js";

export class EconomySystem {
  constructor() {
    this.petalsPerBouquet = CONFIG.petalsPerBouquet;
  }

  get petals() { return gameState.state.resources.petals; }
  get bouquets() { return gameState.state.resources.bouquets; }

  addPetals(amount) {
    if (amount <= 0) return 0;
    gameState.state.resources.petals += amount;
    gameState.state.stats.totalPetals += amount;
    eventBus.emit(eventBus.constructor.EVENTS.PETAL_GAINED, { amount });
    eventBus.emit(eventBus.constructor.EVENTS.RESOURCE_CHANGED, this.snapshot());
    const converted = this.tryConvert();
    return converted;
  }

  removePetals(amount) {
    if (amount <= 0) return false;
    if (gameState.state.resources.petals < amount) return false;
    gameState.state.resources.petals -= amount;
    eventBus.emit(eventBus.constructor.EVENTS.RESOURCE_CHANGED, this.snapshot());
    return true;
  }

  addBouquets(amount) {
    if (amount <= 0) return;
    gameState.state.resources.bouquets += amount;
    gameState.state.stats.totalBouquets += amount;
    eventBus.emit(eventBus.constructor.EVENTS.BOUQUET_GAINED, { amount });
    eventBus.emit(eventBus.constructor.EVENTS.RESOURCE_CHANGED, this.snapshot());
  }

  removeBouquets(amount) {
    if (amount <= 0) return false;
    if (gameState.state.resources.bouquets < amount) return false;
    gameState.state.resources.bouquets -= amount;
    eventBus.emit(eventBus.constructor.EVENTS.RESOURCE_CHANGED, this.snapshot());
    return true;
  }

  /** Convierte pétalos sueltos en ramos, conservando excedentes. */
  tryConvert() {
    const rate = this.petalsPerBouquet;
    const total = gameState.state.resources.petals;
    const bouquets = Math.floor(total / rate);
    const remainder = total % rate;
    let gained = 0;
    if (bouquets > 0) {
      gained = bouquets;
      gameState.state.resources.bouquets += bouquets;
      gameState.state.resources.petals = remainder;
      gameState.state.stats.totalBouquets += bouquets;
      eventBus.emit(eventBus.constructor.EVENTS.BOUQUET_GAINED, { amount: bouquets });
      eventBus.emit(eventBus.constructor.EVENTS.RESOURCE_CHANGED, this.snapshot());
      eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, { text: `💐 ¡${bouquets} ramo${bouquets > 1 ? "s" : ""}!` });
    }
    return gained;
  }

  canAfford(cost) {
    return gameState.state.resources.bouquets >= cost;
  }

  /** Descuenta un coste en ramos y devuelve true si fue posible. */
  purchase(cost) {
    if (!this.canAfford(cost)) return false;
    gameState.state.resources.bouquets -= cost;
    eventBus.emit(eventBus.constructor.EVENTS.RESOURCE_CHANGED, this.snapshot());
    return true;
  }

  snapshot() {
    return {
      petals: this.petals,
      bouquets: this.bouquets
    };
  }
}
