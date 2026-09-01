/**
 * ShopScene (GDD técnico §12, §106-108).
 * Tienda por ZONA activa:
 *  - El jardín paga con pétalos/ramos (🌸💐); el bosque con hojas/bultos (🍂).
 *  - Cada objeto declara su moneda y su categoría (ver data/upgrades.js).
 *  - Stock NOCTURNO: algunos objetos solo aparecen de noche (nightOnly).
 *  - Objetos tras eventos: aparecen solo si el flag de evento está hecho (unlock).
 *  - Jaulas y alimentos (criaturas del jardín) se muestran solo en el jardín.
 */
import { gameState } from "../systems/GameState.js";
import { upgradeSystem } from "../systems/UpgradeSystem.js";
import { economy } from "../systems/EconomyInstance.js";
import { eventBus } from "../systems/EventBus.js";
import { audio } from "../systems/AudioSystem.js";
import { rewardSystem } from "../systems/RewardSystem.js";
import { inventorySystem } from "../systems/InventorySystem.js";
import { investigationSystem } from "../systems/InvestigationSystem.js";
import { captureSystem } from "../systems/CaptureSystem.js";
import { tamingSystem } from "../systems/TamingSystem.js";
import { companionSystem } from "../systems/CompanionSystem.js";
import { CAGES, cageCost } from "../data/cages.js";
import { FOODS } from "../data/foods.js";
import { CREATURES } from "../data/creatures.js";
import { ZONES } from "../data/zones.js";
import { UPGRADES } from "../data/upgrades.js";

const Q = (id) => document.getElementById(id);

/** Secciones mostradas por zona (orden de render). */
const CATEGORY_LABELS = {
  upgrades: "🌱 Mejoras",
  zones: "🌎 Todas las zonas",
  creatures: "🐾 Criaturas",
  mysteries: "🔐 Misterios",
  cosmetics: "🎨 Cosméticos",
  investigation: "📓 Investigación",
  night: "🌙 Objetos nocturnos",
  event: "✨ Tras eventos",
  unknown: "❓ Objetos desconocidos"
};

export class ShopScene {
  constructor() {
    this.el = Q("shop-list");
    this.zoneTitleEl = Q("shop-zone-title");
    this.balanceEl = Q("shop-balance");
    // Re-render si el balance cambia mientras la tienda está abierta
    // (habilita/deshabilita botones al ganar o gastar recursos).
    eventBus.on(eventBus.constructor.EVENTS.RESOURCE_CHANGED, () => {
      if (this.el && document.getElementById("screen-shop")?.classList.contains("active")) {
        this.render();
      }
    });
    // Re-render al cambiar de día/noche (stock nocturno).
    eventBus.on(eventBus.constructor.EVENTS.TIME_CHANGED, () => {
      if (this.el && document.getElementById("screen-shop")?.classList.contains("active")) {
        this.render();
      }
    });
  }

  activeZone() {
    return gameState.state.progression.currentZone || "spring_garden";
  }

  isNight() {
    const t = gameState.state.progression.timeOfDay;
    return t === "night" || t === "full_moon";
  }

  /** Moneda principal de la zona activa (excluye los bultos/forma mayor). */
  _zoneCurrency(zone) {
    if (!zone) return "petals";
    if (zone.economy === "garden") return "petals";
    return zone.currency; // p. ej. "leaves"
  }

  /** ¿Está hecho el flag de evento que desbloquea este objeto? */
  _unlocked(up) {
    if (!up.unlock) return true;
    return !!gameState.state.storyFlags[up.unlock] || !!gameState.state.events?.completed?.includes(up.unlock);
  }

  /** Objetos de catálogo visibles para la zona activa, con filtros. */
  _visibleUpgrades() {
    const zoneId = this.activeZone();
    const zone = ZONES[zoneId];
    return Object.values(UPGRADES).filter((u) => {
      // Orden: los objetos de zona solo en su zona (las legacy son del jardín).
      const zoneMatch = !u.zone || u.zone === zoneId;
      // Los misterios del jardín son de zona; los globales de "todas las zonas" se muestran igual.
      if (!zoneMatch) return false;
      // Stock nocturno.
      if (u.nightOnly && !this.isNight()) return false;
      // Objetos tras evento.
      if (u.unlock && !this._unlocked(u)) return false;
      // En el jardín no se venden items de bosque ni al revés.
      return true;
    }).sort((a, b) => (a.tier || 0) - (b.tier || 0));
  }

  render() {
    if (!this.el) return;
    const zoneId = this.activeZone();
    const zone = ZONES[zoneId];
    const isGarden = zone && zone.economy === "garden";

    // Título y balance
    const zoneName = (zone && zone.name) || "Jardín de Primavera";
    this.zoneTitleEl.textContent = `${zone ? zoneId === "spring_garden" ? "🌸" : "🌲" : ""} ${zoneName}`;
    this.balanceEl.textContent = this._balanceText(zoneId);

    let html = "";

    // Agrupar por categoría en el orden deseado
    const order = ["upgrades", "zones", "creatures", "mysteries", "cosmetics", "investigation", "night", "event", "unknown"];
    const upgrades = this._visibleUpgrades();
    for (const cat of order) {
      const items = upgrades.filter((u) => u.category === cat);
      if (items.length === 0) continue;
      html += `<div class="shop-section-title">${CATEGORY_LABELS[cat] || cat}</div>`;
      for (const up of items) {
        html += this._upgradeCard(up);
      }
    }

    // Sección de Apoyos (solo tiene sentido con compañeros; se muestra en el jardín).
    if (isGarden) {
      html += this._companionsSection();

      // Jaulas (jardín: criaturas investigadas)
      const cages = this._visibleCages();
      if (cages.length) {
        html += `<div class="shop-section-title">🪤 Jaulas</div>`;
        for (const cage of cages) {
          const cost = cageCost(cage);
          const afford = economy.canAfford(cost);
          const ownedCount = inventorySystem.count("cages", cage.id);
          html += this._card(cage.emoji, cage.name, cage.description,
            `<button class="btn buy-btn" data-buy-cage="${cage.id}" ${afford ? "" : "disabled"}>${cost} 💐</button>` +
            (ownedCount ? `<div class="shop-owned-label">En inventario: ${ownedCount}</div>` : ""));
        }
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
    }

    // Si no hay nada que mostrar
    if (!html) {
      html = `<div class="shop-card"><p>No hay nada a la venta aquí ahora mismo. Vuelve más tarde.</p></div>`;
    }

    this.el.innerHTML = html;

    // Wire upgrades (pagan su moneda declarada)
    this.el.querySelectorAll("[data-upgrade]").forEach((btn) => btn.addEventListener("click", () => {
      const res = upgradeSystem.buy(btn.dataset.upgrade);
      if (res.ok) {
        audio.playBuy();
        const u = res.upgrade;
        eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, {
          text: u.mystery ? `❓ Has comprado algo... "${u.name}"` : `✅ ¡${u.name} comprado!`
        });
      } else {
        audio.playError();
        eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, { text: "No se pudo comprar." });
      }
      this.render();
    }));

    // Wire cage slot extra de apoyos
    this.el.querySelectorAll("[data-buy-slot]").forEach((btn) => btn.addEventListener("click", () => {
      const res = companionSystem.buySlot();
      if (res.ok) audio.playBuy();
      else { audio.playError(); eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, { text: "No se pudo comprar el slot." }); }
      this.render();
    }));

    // Wire cages
    this.el.querySelectorAll("[data-buy-cage]").forEach((btn) => btn.addEventListener("click", () => {
      const cage = CAGES[btn.dataset.buyCage];
      if (!cage) return;
      if (economy.purchase(cageCost(cage))) {
        rewardSystem.give({ type: "cage", id: cage.id, creatureId: cage.creatureId });
        audio.playBuy();
        eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, { text: `${cage.emoji} ${cage.name} añadida` });
      } else {
        audio.playError();
        eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, { text: "No tienes suficientes ramos." });
      }
      this.render();
    }));

    // Wire foods
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

  _balanceText(zoneId) {
    const zone = ZONES[zoneId];
    if (zone && zone.economy === "zone") {
      const minor = economy.getResource(`${zoneId}.${zone.currency}`);
      const major = economy.getResource(`${zoneId}.${zone.currency === "leaves" ? "bundles" : "bundles"}`);
      const minorEmoji = zone.currency === "leaves" ? "🍂" : "✨";
      const majorEmoji = minorEmoji;
      return `${minorEmoji} Hoja${minor !== 1 ? "s" : ""}: ${minor} &nbsp;·&nbsp; ${majorEmoji} Bulto${major !== 1 ? "s" : ""}: ${major}`;
    }
    return `🌸 Petalos: ${economy.getResource("petals")} &nbsp;·&nbsp; 💐 Ramos: ${economy.getResource("bouquets")}`;
  }

  _currencyIcon(up) {
    const zone = ZONES[up.zone];
    if (up.currency === "bouquets") return "💐";
    if (up.currency === "petals") return "🌸";
    if (up.currency?.startsWith("whispering_forest")) return "🍂";
    return "✨";
  }

  _upgradeCard(up) {
    const owned = upgradeSystem.isOwned(up.id);
    const icon = this._currencyIcon(up);
    const priceText = up.cost === null ? "???" : `${up.cost} ${icon}`;
    const displayName = up.mystery ? "?????????" : up.name;
    const displayDesc = up.mystery ? "No sabes qué es. El objeto se revelará al comprarlo." : up.description;

    const affordRes = up.cost === null ? false : economy.canAffordResource(up.currency, up.cost);
    const disabled = owned || up.cost === null || !affordRes;

    return `<div class="shop-card ${owned ? "owned" : ""}">
      <div>
        <h4>${up.mystery ? "❓" : ""} ${displayName}</h4>
        <p>${displayDesc || ""}</p>
        <button class="btn buy-btn" data-upgrade="${up.id}" ${disabled ? "disabled" : ""}>
          ${owned ? "✓" : priceText}
        </button>
      </div>
    </div>`;
  }

  _companionsSection() {
    let html = `<div class="shop-section-title">🤝 Apoyos</div>`;
    const nComp = companionSystem.getCompanions().length;
    if (nComp === 0) {
      html += `<div class="shop-card"><p>Domestica a una criatura para desbloquear la sección de apoyos.</p></div>`;
      return html;
    }
    html += `<div class="shop-card">
      <div>
        <h4>🐾 Apoyos activos</h4>
        <p>${companionSystem.getActiveCompanions().length}/${companionSystem.maxActive()} criaturas apoyando ahora mismo.</p>
      </div>
    </div>`;
    const next = companionSystem.nextSlotCost();
    if (next !== null) {
      const affordSlot = economy.canAfford(next);
      html += `<div class="shop-card">
        <div>
          <h4>👜 Slot de apoyo extra</h4>
          <p>Sube el máximo de apoyos activos a ${companionSystem.maxActive() + 1}.</p>
        </div>
        <button class="btn buy-btn" data-buy-slot ${affordSlot ? "" : "disabled"}>${next} 💐</button>
      </div>`;
    }
    return html;
  }

  _visibleCages() {
    return Object.values(CAGES).filter((cage) => {
      const creature = CREATURES[cage.creatureId];
      if (!creature) return false;
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
