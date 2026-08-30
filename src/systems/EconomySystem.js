/**
 * EconomySystem (GDD técnico §7): pétalos, ramos, conversión y compras.
 * Conversión preferida: conservar excedentes (ej: 27 pétalos → 2 ramos + 7 pétalos).
 *
 * Actualización 3.1: capa de recursos genérica. Todo ingreso/gasto pasa por
 * `addResource`/`spendResource`/`getResource`, indiferente de si el recurso es
 * la economía legada del jardín (petals/bouquets) o una moneda de zona
 * (`zoneId.currency`). Los métodos legados se mantienen como envoltorios.
 */
import { gameState } from "./GameState.js";
import { eventBus } from "./EventBus.js";
import { CONFIG } from "../config.js";

export class EconomySystem {
  constructor() {
    this.petalsPerBouquet = CONFIG.petalsPerBouquet;
  }

  get petals() { return this.getResource("petals"); }
  get bouquets() { return this.getResource("bouquets"); }

  /**
   * Resuelve un identificador de recurso a su ubicación en el estado.
   * Soporta: "petals", "bouquets", y "zona.moneda" (ej: "whispering_forest.leaves").
   * Devuelve el contenedor y la clave, creando la clave si no existe.
   */
  _resolve(type) {
    const zones = gameState.state.resources.zones || {};
    if (/^[a-z0-9_]+\.[a-z0-9_]+$/.test(type)) {
      const [zoneId, currency] = type.split(".");
      if (!zones[zoneId]) zones[zoneId] = {};
      if (!(currency in zones[zoneId])) zones[zoneId][currency] = 0;
      return { zone: true, zoneId, currency };
    }
    return { zone: false, type };
  }

  getResource(type) {
    const r = this._resolve(type);
    if (r.zone) return gameState.state.resources.zones[r.zoneId][r.currency] || 0;
    const v = gameState.state.resources[r.type];
    return typeof v === "number" ? v : 0;
  }

  _setResource(type, amount) {
    const r = this._resolve(type);
    if (r.zone) gameState.state.resources.zones[r.zoneId][r.currency] = amount;
    else gameState.state.resources[r.type] = amount;
  }

  /** Suma una cantidad a un recurso (petals/bouquets o zona.moneda). Emite RESOURCE_CHANGED. */
  addResource(type, amount) {
    if (amount <= 0) return;
    this._setResource(type, this.getResource(type) + amount);
    if (type === "bouquets") {
      gameState.state.stats.totalBouquets += amount;
      eventBus.emit(eventBus.constructor.EVENTS.BOUQUET_GAINED, { amount });
    }
    if (type === "petals") {
      gameState.state.stats.totalPetals += amount;
      eventBus.emit(eventBus.constructor.EVENTS.PETAL_GAINED, { amount });
    }
    eventBus.emit(eventBus.constructor.EVENTS.RESOURCE_CHANGED, this.snapshot());
  }

  /** Resta una cantidad; devuelve false si no hay suficiente. */
  removeResource(type, amount) {
    if (amount <= 0) return false;
    if (this.getResource(type) < amount) return false;
    this._setResource(type, this.getResource(type) - amount);
    eventBus.emit(eventBus.constructor.EVENTS.RESOURCE_CHANGED, this.snapshot());
    return true;
  }

  /** ¿Bastan `amount` del recurso dado? */
  canAffordResource(type, amount) {
    return this.getResource(type) >= amount;
  }

  /** Descuenta `cost` del recurso dado; devuelve true si fue posible. */
  spendResource(type, cost) {
    return this.removeResource(type, cost);
  }

  addPetals(amount) {
    if (amount <= 0) return 0;
    this.addResource("petals", amount);
    const converted = this.tryConvert();
    return converted;
  }

  removePetals(amount) {
    return this.removeResource("petals", amount);
  }

  addBouquets(amount) {
    if (amount <= 0) return;
    this.addResource("bouquets", amount);
  }

  removeBouquets(amount) {
    return this.removeResource("bouquets", amount);
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
      gameState.state.resources.petals = remainder;
      this.addResource("bouquets", bouquets);
      eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, { text: `💐 ¡${bouquets} ramo${bouquets > 1 ? "s" : ""}!` });
    }
    return gained;
  }

  canAfford(cost) {
    return this.canAffordResource("bouquets", cost);
  }

  /** Descuenta un coste en ramos y devuelve true si fue posible. */
  purchase(cost) {
    return this.spendResource("bouquets", cost);
  }

  snapshot() {
    return {
      petals: this.petals,
      bouquets: this.bouquets
    };
  }
}
