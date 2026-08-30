/**
 * MapScene (GDD técnico §13, §50): selección de zonas.
 */
import { MAPS } from "../data/maps.js";
import { gameState } from "../systems/GameState.js";
import { economy } from "../systems/EconomyInstance.js";
import { rewardSystem } from "../systems/RewardSystem.js";
import { saveManager } from "../systems/SaveInstance.js";
import { eventBus } from "../systems/EventBus.js";
import { audio } from "../systems/AudioSystem.js";

const Q = (id) => document.getElementById(id);

export class MapScene {
  constructor() {
    this.el = Q("map-list");
  }

  /** Renderiza la lista de mapas y gestiona viaje/compra. */
  render() {
    if (!this.el) return;
    const s = gameState.state;
    const current = s.progression.currentZone;

    let html = "";
    for (const m of Object.values(MAPS)) {
      const unlocked = s.unlocks.maps.includes(m.id);
      const isCurrent = m.id === current;
      const lockedByStory = m.unlockRequirement && !unlocked;

      let status = "";
      if (isCurrent) status = "Aquí";
      else if (unlocked) status = `Desbloqueado · Coste: ${m.unlockCost} 💐`;
      else if (lockedByStory) status = "🔒 Requiere avanzar la historia";
      else status = `🔒 Bloqueado · Coste: ${m.unlockCost} 💐`;

      html += `<div class="map-card ${unlocked ? "" : "locked"} ${isCurrent ? "current" : ""}" data-map="${m.id}">
        <div>
          <div class="map-name">${m.emoji} ${m.name}</div>
          <div class="map-status">${status}</div>
        </div>
        ${!unlocked && !lockedByStory ? `<button class="btn buy-btn buy-map" data-map="${m.id}">${m.unlockCost} 💐</button>` : ""}
      </div>`;
    }
    this.el.innerHTML = html;

    const attached = this.el.querySelectorAll(".buy-map");
    attached.forEach((btn) => btn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.tryUnlock(btn.dataset.map);
    }));

    this.el.querySelectorAll(".map-card").forEach((card) => card.addEventListener("click", () => {
      if (card.dataset.map !== current) this.travel(card.dataset.map);
    }));
  }

  tryUnlock(mapId) {
    const m = MAPS[mapId];
    if (!m) return;
    if (economy.canAfford(m.unlockCost)) {
      if (economy.purchase(m.unlockCost)) {
        rewardSystem.give({ type: "map", id: mapId });
        audio.playBuy();
        eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, { text: `🗺️ ¡${m.name} desbloqueado!` });
        saveManager.saveGame();
        this.render();
      }
    } else {
      audio.playError();
      eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, { text: "No tienes suficientes ramos." });
    }
  }

  travel(mapId) {
    if (!gameState.state.unlocks.maps.includes(mapId)) return;
    gameState.state.progression.currentZone = mapId;
    saveManager.saveGame();
    eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, { text: `🌿 Has llegado a ${MAPS[mapId].name}.` });
  }
}

export const mapScene = new MapScene();
