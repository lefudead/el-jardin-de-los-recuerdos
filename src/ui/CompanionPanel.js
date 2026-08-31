/**
 * UI: Panel lateral de apoyos (GDD §35, §96-102).
 * Botón flotante + drawer lateral para elegir qué compañeros domesticados
 * están activos (máx base 2, ampliable a 4 en la tienda).
 */
import { eventBus } from "../systems/EventBus.js";
import { gameState } from "../systems/GameState.js";
import { companionSystem } from "../systems/CompanionSystem.js";

const Q = (id) => document.getElementById(id);

export class CompanionPanel {
  constructor() {
    this.toggleBtn = Q("companion-toggle");
    this.panel = Q("companion-panel");
    this.closeBtn = Q("companion-close");
    this.countEl = Q("companion-count");
    this.listEl = Q("companion-list");

    if (this.toggleBtn) this.toggleBtn.addEventListener("click", () => this.open());
    if (this.closeBtn) this.closeBtn.addEventListener("click", () => this.close());

    eventBus.on(eventBus.constructor.EVENTS.CREATURE_TAMED, () => this.refresh());
    eventBus.on(eventBus.constructor.EVENTS.CREATURE_HELPED, () => this.refresh());
    eventBus.on(eventBus.constructor.EVENTS.RESOURCE_CHANGED, () => this.refresh());

    this.refresh();
  }

  get hasCompanions() {
    return companionSystem.getCompanions().length > 0;
  }

  open() {
    this.refresh();
    if (this.panel) this.panel.hidden = false;
  }

  close() {
    if (this.panel) this.panel.hidden = true;
  }

  refresh() {
    const count = companionSystem.getCompanions().length;
    if (this.toggleBtn) this.toggleBtn.hidden = count === 0;
    if (!this.hasCompanions) {
      if (this.countEl) this.countEl.textContent = "";
      if (this.listEl) this.listEl.innerHTML = "";
      return;
    }

    const active = this.activeIds();
    const max = companionSystem.maxActive();
    if (this.countEl) {
      this.countEl.textContent = `Activos: ${active.length}/${max}`;
    }
    if (this.listEl) {
      this.listEl.innerHTML = this.renderList(active, max);
      this.listEl.querySelectorAll("[data-toggle-companion]").forEach((btn) => {
        btn.addEventListener("click", () => {
          companionSystem.toggleActive(btn.dataset.toggleCompanion);
          this.refresh();
        });
      });
    }
  }

  activeIds() {
    return (gameState.state.companions?.active || []).filter(
      (id) => companionSystem.isCompanion(id)
    );
  }

  renderList(active, max) {
    const companions = companionSystem.getCompanions();
    if (companions.length === 0) {
      return `<p class="companion-empty">Aún no tienes compañeros domesticados.</p>`;
    }
    return companions
      .map((c) => {
        const isActive = active.includes(c.id);
        const canActivate = !isActive && active.length >= max;
        const skill = companionSystem.skillFor(c.id);
        const skillLabel = skill ? skill.name || skill.id : null;
        return `<div class="companion-card">
          <span class="companion-emoji">${c.emoji || "🌸"}</span>
          <div class="companion-name">
            ${c.name}
            ${skillLabel ? `<div class="companion-skill">${skillLabel}</div>` : ""}
          </div>
          <button class="companion-companion-btn${isActive ? " active" : ""}" data-toggle-companion="${c.id}"${canActivate ? " disabled" : ""}>
            ${isActive ? "Activo" : "Apoyar"}
          </button>
        </div>`;
      })
      .join("");
  }
}

export const companionPanel = new CompanionPanel();