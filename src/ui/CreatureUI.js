/**
 * UI: CreatureSheet (GDD §32, §109).
 * Ficha de una criatura: personalidad, investigación, estado, jaula, alimento,
 * confianza y acciones (capturar / domesticar).
 */
import { modal } from "./Modal.js";
import { CREATURES } from "../data/creatures.js";
import { cageForCreature } from "../data/cages.js";
import { foodForCreature } from "../data/foods.js";
import { investigationSystem } from "../systems/InvestigationSystem.js";
import { captureSystem } from "../systems/CaptureSystem.js";
import { tamingSystem } from "../systems/TamingSystem.js";
import { inventorySystem } from "../systems/InventorySystem.js";
import { economy } from "../systems/EconomyInstance.js";
import { rewardSystem } from "../systems/RewardSystem.js";
import { eventBus } from "../systems/EventBus.js";
import { companionSystem } from "../systems/CompanionSystem.js";
import { tamingUI } from "./TamingUI.js";

const Q = (id) => document.getElementById(id);

export class CreatureUI {
  constructor() {
    this.openCreatureId = null;
  }

  /** Abre la ficha de una criatura. */
  open(creatureId) {
    const c = CREATURES[creatureId];
    if (!c) return;
    this.openCreatureId = creatureId;

    const sheet = document.createElement("div");
    sheet.className = "creature-sheet";
    sheet.innerHTML = this._render(c);

    modal.showElement(c.emoji + " " + c.name, sheet);
    this._wire(sheet, c);
  }

  _render(c) {
    const pct = investigationSystem.getProgress(c.id);
    const captured = captureSystem.isCaptured(c.id);
    const tameable = tamingSystem.canBeTamed(c.id);
    const isTamed = tamingSystem.isTamed(c.id);
    const trust = tamingSystem.getTrust(c.id);
    const trustLabel = tamingSystem.getTrustLabel(c.id);
    const cage = cageForCreature(c.id);
    const food = foodForCreature(c.id);

    let status = "🔎 Desconocida";
    if (isTamed) status = "❤️ Compañera";
    else if (captured) status = "🪤 Capturada";
    else if (pct >= 100 || captureSystem.canAttempt(c.id)) status = "🎯 Capturable";
    else if (investigationSystem.getProgress(c.id) > 0) status = "📖 Investigada";
    else if (c) status = "🐾 Encontrada";

    let actions = "";
    if (isTamed) {
      const skill = companionSystem.skillFor(c.id);
      actions = `<div class="creature-companion">
        <div class="entry-status">✨ Es tu compañera. Habilidad: <b>${skill ? skill.name : "—"}</b></div>
        <div class="entry-status">${skill ? skill.description : ""}</div>
      </div>`;
    } else {
      // Acciones de captura
      actions += `<div class="creature-actions">`;
      if (!captured) {
        if (!captureSystem.hasCage(c.id)) {
          if (cage) {
            const afford = economy.canAfford(cage.cost);
            actions += `<button class="btn btn-primary" data-act="buy-cage" ${afford ? "" : "disabled"}>
                Comprar ${cage.name} (${cage.cost} 💐)</button>`;
          }
        }
        if (captureSystem.canAttempt(c.id) && cage && captureSystem.hasCage(c.id)) {
          actions += `<button class="btn btn-primary" data-act="capture">Colocar jaula y capturar</button>`;
        } else if (!captureSystem.canAttempt(c.id)) {
          actions += `<div class="entry-status">Investiga más para poder capturarlo: ${pct}/100% investigación.</div>`;
        }
      } else if (tameable) {
        const hasFood = tamingSystem.hasFavoriteFood(c.id);
        actions += `<button class="btn btn-primary" data-act="feed" ${hasFood ? "" : "disabled"}>
            Alimentar (${food ? food.name : "—"} ${tamingSystem.favoriteFood(c.id) ? inventorySystem.count("foods", tamingSystem.favoriteFood(c.id).id) : 0})</button>`;
        if (!hasFood && food) {
          const afford = economy.canAfford(food.cost);
          actions += `<button class="btn" data-act="buy-food" ${afford ? "" : "disabled"}>
              Comprar ${food.name} (${food.cost} 💐)</button>`;
        }
      }
      actions += `</div>`;
    }

    const researchBar = this._bar(pct, 100);
    const trustBar = this._bar(trust, 100);

    return `
      <div class="creature-bio">${c.bio || c.notes || ""}</div>

      <div class="creature-row"><span class="entry-title">Personalidad</span>
        <span class="entry-status">${(c.personality || []).map((p) => p[0].toUpperCase() + p.slice(1)).join(" · ")}</span>
      </div>
      <div class="creature-row"><span class="entry-title">Hábitat</span>
        <span class="entry-status">${c.zone || "—"}</span></div>

      <div class="creature-row"><span class="entry-title">Investigación</span>
        <div class="bar-wrap">${researchBar}<span class="bar-label">${pct}%</span></div></div>

      <div class="creature-row"><span class="entry-title">Estado</span>
        <span class="entry-status">${status}</span></div>

      ${captured && !isTamed ? `<div class="creature-row"><span class="entry-title">Confianza (${trustLabel})</span>
        <div class="bar-wrap">${trustBar}<span class="bar-label">${trust}%</span></div></div>` : ""}

      ${c.notes && !c.bio ? `<div class="creature-notes">${c.notes}</div>` : ""}
      ${actions}
    `;
  }

  _bar(value, max) {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    return `<div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div>`;
  }

  _wire(sheet, c) {
    const buyCage = sheet.querySelector('[data-act="buy-cage"]');
    if (buyCage) buyCage.addEventListener("click", () => {
      const cage = cageForCreature(c.id);
      if (!cage) return;
      if (economy.purchase(cage.cost)) {
        rewardSystem.give({ type: "cage", id: cage.id, creatureId: c.id });
        eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, { text: `${cage.emoji} ${cage.name} añadida` });
      } else {
        eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, { text: "No tienes suficientes ramos." });
      }
      this.open(c.id);
    });

    const capture = sheet.querySelector('[data-act="capture"]');
    if (capture) capture.addEventListener("click", () => {
      const res = captureSystem.capture(c.id);
      if (res.ok) {
        modal.hide();
        eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, { text: `✨ ¡${c.name} capturado!` });
      } else {
        const msg = { research: "Necesitas investigar más.", cage: "Necesitas la jaula." }[res.reason] || "No se pudo capturar.";
        eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, { text: msg });
      }
    });

    const feed = sheet.querySelector('[data-act="feed"]');
    if (feed) feed.addEventListener("click", () => {
      modal.hide();
      tamingUI.start(c.id);
    });

    const buyFood = sheet.querySelector('[data-act="buy-food"]');
    if (buyFood) buyFood.addEventListener("click", () => {
      const food = foodForCreature(c.id);
      if (!food) return;
      if (economy.purchase(food.cost)) {
        rewardSystem.give({ type: "food", id: food.id, creatureId: c.id });
        eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, { text: `${food.emoji} ${food.name} comprado` });
      } else {
        eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, { text: "No tienes suficientes ramos." });
      }
      this.open(c.id);
    });
  }
}

export const creatureUI = new CreatureUI();
