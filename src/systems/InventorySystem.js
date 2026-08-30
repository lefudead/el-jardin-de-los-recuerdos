/**
 * InventorySystem (GDD técnico §33): objetos del inventario.
 * Estructura v3.0: inventory = { items, foods, cages }.
 */
import { gameState } from "./GameState.js";

export class InventorySystem {
  getInventory() {
    const inv = gameState.state.inventory;
    return {
      items: inv?.items || [],
      foods: inv?.foods || [],
      cages: inv?.cages || []
    };
  }

  _bucket(kind) {
    const inv = gameState.state.inventory;
    if (!inv[kind]) inv[kind] = [];
    return inv[kind];
  }

  has(kind, id) {
    return this._bucket(kind).some((i) => i.id === id && (i.quantity || 1) > 0);
  }

  count(kind, id) {
    const item = this._bucket(kind).find((i) => i.id === id);
    return item ? (item.quantity || 1) : 0;
  }

  add(kind, id, quantity = 1, extra = {}) {
    const bucket = this._bucket(kind);
    const existing = bucket.find((i) => i.id === id);
    if (existing) existing.quantity = (existing.quantity || 1) + quantity;
    else bucket.push({ id, quantity, ...extra });
    return true;
  }

  remove(kind, id, quantity = 1) {
    const bucket = this._bucket(kind);
    const existing = bucket.find((i) => i.id === id);
    if (!existing) return false;
    existing.quantity = (existing.quantity || 1) - quantity;
    if (existing.quantity <= 0) {
      const idx = bucket.indexOf(existing);
      bucket.splice(idx, 1);
    }
    return true;
  }

  /** Devuelve una jaula del inventario por id. */
  findCage(cageId) {
    return this._bucket("cages").find((c) => c.id === cageId) || null;
  }

  /** Jaula vinculada a una criatura (id de jaula). */
  cageForCreature(creatureId) {
    return this._bucket("cages").find((c) => c.creatureId === creatureId) || null;
  }
}

export const inventorySystem = new InventorySystem();
