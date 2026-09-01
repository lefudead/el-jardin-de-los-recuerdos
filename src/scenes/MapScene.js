/**
 * MapScene (GDD técnico §13, §50): selección de zonas.
 * También muestra los Apoyos (GDD §35): al abrir el mapa, 2 cuadros de apoyo
 * desbloqueados (base) y 2 bloqueados (slots extra, se compran en la tienda).
 * Un clic en un cuadro desbloqueado permite elegir qué criatura domesticada
 * apoya ahí.
 */
import { MAPS } from "../data/maps.js";
import { CREATURES } from "../data/creatures.js";
import { gameState } from "../systems/GameState.js";
import { economy } from "../systems/EconomyInstance.js";
import { rewardSystem } from "../systems/RewardSystem.js";
import { saveManager } from "../systems/SaveInstance.js";
import { eventBus } from "../systems/EventBus.js";
import { audio } from "../systems/AudioSystem.js";
import { narrativeSystem } from "../systems/NarrativeSystem.js";
import { companionSystem } from "../systems/CompanionSystem.js";

const Q = (id) => document.getElementById(id);

export class MapScene {
  constructor() {
    this.el = Q("map-list");
    this.supportEl = Q("map-support");
  }

  /** Renderiza la lista de mapas y gestiona viaje/compra. */
  render() {
    this._renderMaps();
    this._renderSupport();
  }

  _renderMaps() {
    if (!this.el) return;
    const s = gameState.state;
    const current = s.progression.currentZone;

    let html = "";
    for (const m of Object.values(MAPS)) {
      const unlocked = s.unlocks.maps.includes(m.id);
      const isCurrent = m.id === current;
      const lockedByStory = m.unlockRequirement && !unlocked;

      let status = "";
      if (m.maintenance) status = "🔧 En mantenimiento";
      else if (isCurrent) status = "Aquí";
      else if (unlocked) status = `Desbloqueado · Coste: ${m.unlockCost} 💐`;
      else if (lockedByStory) status = "🔒 Requiere avanzar la historia";
      else status = `🔒 Bloqueado · Coste: ${m.unlockCost} 💐`;

      html += `<div class="map-card ${unlocked && !m.maintenance ? "" : "locked"} ${m.maintenance ? "maintenance" : ""} ${isCurrent ? "current" : ""}" data-map="${m.id}">
        <div>
          <div class="map-name">${m.emoji} ${m.name}</div>
          <div class="map-status">${status}</div>
        </div>
        ${!unlocked && !lockedByStory && !m.maintenance ? `<button class="btn buy-btn buy-map" data-map="${m.id}">${m.unlockCost} 💐</button>` : ""}
      </div>`;
    }
    this.el.innerHTML = html;

    const attached = this.el.querySelectorAll(".buy-map");
    attached.forEach((btn) => btn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.tryUnlock(btn.dataset.map);
    }));

    this.el.querySelectorAll(".map-card").forEach((card) => card.addEventListener("click", () => {
      const m = MAPS[card.dataset.map];
      if (m && m.maintenance) {
        audio.playError();
        eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, { text: "🔧 Este mapa está en mantenimiento." });
        return;
      }
      if (card.dataset.map !== current) this.travel(card.dataset.map);
    }));
  }

  /** Renderiza la sección de Apoyos: 2 cuadros base + 2 extras. */
  _renderSupport() {
    const el = this.supportEl;
    if (!el) return;

    const companions = companionSystem.getCompanions();
    const active = (gameState.state.companions?.active || []).filter((id) => companionSystem.isCompanion(id));
    const slotsActive = companionSystem.maxActive(); // 2 + slots comprados (máx 4)
    const choosing = this._choosingIdx;

    let html = `<div class="support-section-title">🐾 Apoyos</div>
      <div class="support-grid">`;

    for (let i = 0; i < 4; i++) {
      const isUnlocked = i < slotsActive;
      const creatureId = active[i];
      const creature = creatureId ? CREATURES[creatureId] : null;

      if (!isUnlocked) {
        // Slot extra bloqueado: se desbloquea comprando el slot en la tienda.
        html += `<div class="support-slot locked">
          <div class="support-slot-emoji">🔒</div>
          <div class="support-slot-name">Bloqueado</div>
          <div class="support-slot-sub">Compra el slot en la tienda</div>
        </div>`;
        continue;
      }

      const isChoosing = choosing === i;
      html += `<div class="support-slot ${isChoosing ? "choosing" : ""}" data-support-slot="${i}">`;

      if (creature) {
        const skill = companionSystem.skillFor(creatureId);
        const skillLabel = skill ? (skill.name || skill.id) : null;
        html += `<div class="support-slot-emoji">${creature.emoji || "🌸"}</div>
          <div class="support-slot-name">${creature.name}</div>
          ${skillLabel ? `<div class="support-slot-sub">${skillLabel}</div>` : ""}
          <div class="support-slot-sub">Apoyando</div>`;
      } else if (isChoosing) {
        // Selector de criaturas domesticadas para asignar a este hueco.
        const available = companions.filter((c) => !active.includes(c.id));
        let opts = "";
        if (available.length === 0) {
          opts = `<button class="support-opt" data-support-none>Sin criaturas disponibles</button>`;
        } else {
          for (const c of available) {
            opts += `<button class="support-opt" data-support-pick="${c.id}">${c.emoji || "🌸"} ${c.name}</button>`;
          }
        }
        html += `<div class="support-slot-emoji">＋</div>
          <div class="support-slot-name">Elegir apoyo</div>
          <div class="support-picker">${opts}</div>`;
      } else {
        html += `<div class="support-slot-emoji">＋</div>
          <div class="support-slot-name">Hueco libre</div>
          <div class="support-slot-sub">Toca para elegir apoyo</div>`;
      }
      html += `</div>`;
    }
    html += `</div>`;

    if (companions.length === 0) {
      html += `<p class="support-empty">Domestica a una criatura para poder asignar apoyos.</p>`;
    }

    el.innerHTML = html;
    this._wireSupport(el);
  }

  _wireSupport(el) {
    el.querySelectorAll("[data-support-slot]").forEach((slot) => {
      slot.addEventListener("click", (e) => {
        const idx = parseInt(slot.dataset.supportSlot, 10);
        // No abrir si ya está mostrando el selector.
        if (this._choosingIdx === idx) {
          this._choosingIdx = null;
          this.render();
          return;
        }
        // Si el slot tiene una criatura activa, tap = desasignar.
        const active = gameState.state.companions?.active || [];
        if (active[idx]) {
          active.splice(idx, 1);
          saveManager.saveGame();
          eventBus.emit(eventBus.constructor.EVENTS.CREATURE_HELPED, { active: active.slice() });
          this.render();
          return;
        }
        // Hueco libre: abrir selector.
        this._choosingIdx = idx;
        this.render();
      });
    });

    el.querySelectorAll("[data-support-pick]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.supportPick;
        const idx = this._choosingIdx;
        const res = companionSystem.toggleActive(id);
        // Puede que ya estuviese activo en otro hueco; ensure en este índice.
        if (res.ok) {
          const a = gameState.state.companions.active;
          const existing = a.indexOf(id);
          if (existing >= 0 && existing !== idx) a.splice(existing, 1);
          while (a.length <= idx) a.length = idx + 1;
          a[idx] = id;
          saveManager.saveGame();
        }
        this._choosingIdx = null;
        this.render();
      });
    });

    el.querySelectorAll("[data-support-none]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this._choosingIdx = null;
        this.render();
      });
    });
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
    if (MAPS[mapId] && MAPS[mapId].maintenance) return;
    gameState.state.progression.currentZone = mapId;
    saveManager.saveGame();
    // La música refleja la zona a la que viajamos (jardín/bosque) de inmediato.
    audio.playZoneMusic(mapId);
    eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, { text: `🌿 Has llegado a ${MAPS[mapId].name}.` });
    // Narrativa de entrada del bosque: la primera vez que se viaja allí.
    setTimeout(() => {
      if (mapId === "whispering_forest") narrativeSystem.playNode("forest_entry");
    }, 350);
  }
}

export const mapScene = new MapScene();
