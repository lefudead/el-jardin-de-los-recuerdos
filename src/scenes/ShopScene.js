/**
 * ShopScene (GDD técnico §12, GDD §106-108).
 * Tienda de mejoras, jaulas y alimentos.
 * Las jaulas solo aparecen cuando la criatura está suficientemente investigada.
 */
import { upgradeSystem } from "../systems/UpgradeSystem.js";
import { economy } from "../systems/EconomyInstance.js";
import { eventBus } from "../systems/EventBus.js";
import { audio } from "../systems/AudioSystem.js";
import { rewardSystem } from "../systems/RewardSystem.js";
import { inventorySystem } from "../systems/InventorySystem.js";
import { investigationSystem } from "../systems/InvestigationSystem.js";
import { captureSystem } from "../systems/CaptureSystem.js";
import { tamingSystem } from "../systems/TamingSystem.js";
import { CAGES } from "../data/cages.js";
import { FOODS } from "../data/foods.js";
import { CREATURES } from "../data/creatures.js";

const Q = (id) => document.getElementById(id);

export class ShopScene {
  constructor() {
    this.el = Q("shop-list");
  }

  render() {
    if (!this.el) return;
    let html = "";

    // Mejoras
    html += `<div class="shop-section-title">🌱 Mejoras</div>`;
    for (const up of upgradeSystem.getAll()) {
      const owned = upgradeSystem.isOwned(up.id);
      const affordable = economy.canAfford(up.cost);
      html += `<div class="shop-card ${owned ? "owned" : ""}">
        <div>
          <h4>${up.name}</h4>
          <p>${up.description}</p>
        </div>
        <button class="btn buy-btn" data-upgrade="${up.id}" ${owned ? "disabled" : affordable ? "" : "disabled"}>
          ${owned ? "✓" : `${up.cost} 💐`}
        </button>
      </div>`;
    }

    // Jaulas
    const cages = this._visibleCages();
    if (cages.length) {
      html += `<div class="shop-section-title">🪤 Jaulas</div>`;
      for (const cage of cages) {
        const afford = economy.canAfford(cage.cost);
        const ownedCount = inventorySystem.count("cages", cage.id);
        html += this._card(cage.emoji, cage.name, cage.description,
          `<button class="btn buy-btn" data-buy-cage="${cage.id}" ${afford ? "" : "disabled"}>${cage.cost} 💐</button>` +
          (ownedCount ? `<div class="shop-owned-label">En inventario: ${ownedCount}</div>` : ""));
      }
    } else {
      html += `<div class="shop-section-title">🪤 Jaulas</div>
        <div class="shop-card"><p>Investiga criaturas para desbloquear sus jaulas.</p></div>`;
    }

    // Alimentos
    const foods = this._visibleFoods();
    if (foods.length) {
      html += `<div class="shop-section-title">🍎 Alimentos para criaturas</div>`;
      for (const food of foods) {
        const afford = economy.canAfford(food.cost);
        const ownedCount = inventorySystem.count("foods", food.id);
        html += this._card(food.emoji, food.name, food.description,
          `<button class="btn buy-btn" data-buy-food="${food.id}" ${afford ? "" : "disabled"}>${food.cost} 💐</button>` +
          (ownedCount ? `<div class="shop-owned-label">En inventario: ${ownedCount}</div>` : ""));
      }
    }

    this.el.innerHTML = html;

    // wire upgrades
    this.el.querySelectorAll("[data-upgrade]").forEach((btn) => btn.addEventListener("click", () => {
      const res = upgradeSystem.buy(btn.dataset.upgrade);
      if (res.ok) {
        audio.playBuy();
        eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, { text: `🌱 ¡${res.upgrade.name} comprada!` });
      } else {
        audio.playError();
        eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, { text: "No se pudo comprar." });
      }
      this.render();
    }));

    // wire cages
    this.el.querySelectorAll("[data-buy-cage]").forEach((btn) => btn.addEventListener("click", () => {
      const cage = CAGES[btn.dataset.buyCage];
      if (!cage) return;
      if (economy.purchase(cage.cost)) {
        rewardSystem.give({ type: "cage", id: cage.id, creatureId: cage.creatureId });
        audio.playBuy();
        eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, { text: `${cage.emoji} ${cage.name} añadida` });
      } else {
        audio.playError();
        eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, { text: "No tienes suficientes ramos." });
      }
      this.render();
    }));

    // wire foods
    this.el.querySelectorAll("[data-buy-food]").forEach((btn) => btn.addEventListener("click", () => {
      const food = FOODS[btn.dataset.buyFood];
      if (!food) return;
      if (economy.purchase(food.cost)) {
        rewardSystem.give({ type: "food", id: food.id, creatureId: food.creatureId });
        audio.playBuy();
        eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, { text: `${food.emoji} ${food.name} comprado` });
      } else {
        audio.playError();
        eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, { text: "No tienes suficientes ramos." });
      }
      this.render();
    }));
  }

  _visibleCages() {
    return Object.values(CAGES).filter((cage) => {
      const creature = CREATURES[cage.creatureId];
      if (!creature) return false;
      // solo mostramos jaula si la criatura está investigada lo suficiente
      return captureSystem.canAttempt(cage.creatureId);
    });
  }

  _visibleFoods() {
    return Object.values(FOODS).filter((food) => {
      return captureSystem.isCaptured(food.creatureId) && !tamingSystem.isTamed(food.creatureId);
    });
  }

  _card(emoji, title, desc, actionHtml) {
    return `<div class="shop-card">
      <div>
        <h4>${emoji} ${title}</h4>
        <p>${desc || ""}</p>
        ${actionHtml}
      </div>
    </div>`;
  }
}

export const shopScene = new ShopScene();
