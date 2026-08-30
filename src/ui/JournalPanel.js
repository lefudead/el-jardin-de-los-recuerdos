/**
 * UI: JournalPanel (GDD §19-20, §30-33, §96-98).
 * DOM-based: renderiza el contenido del diario en el contenedor #journal-content.
 * Incluye flores, criaturas (con botón de ficha), recuerdos, secretos y capítulo.
 */
import { gameState } from "../systems/GameState.js";
import { investigationSystem } from "../systems/InvestigationSystem.js";
import { captureSystem } from "../systems/CaptureSystem.js";
import { tamingSystem } from "../systems/TamingSystem.js";
import { creatureUI } from "./CreatureUI.js";
import { FLOWERS } from "../data/flowers.js";
import { CREATURES } from "../data/creatures.js";
import { MEMORIES } from "../data/memories.js";

export class JournalPanel {
  constructor() {
    this.el = document.getElementById("journal-content");
  }

  render() {
    if (!this.el) return;
    const s = gameState.state;

    this.el.innerHTML =
      this._flowers(s) +
      this._creatures(s) +
      this._memories(s) +
      this._secrets(s);
  }

  _flowers(s) {
    let html = `<div class="journal-section"><h3>🌸 Flores</h3>`;
    for (const id of s.unlocks.flowers) {
      const f = FLOWERS[id];
      if (!f) continue;
      html += `<div class="journal-entry"><span class="entry-title">${f.emoji} ${f.name}</span>
        <div class="entry-status">${f.rarity} · +${f.petalValue} pétalo</div></div>`;
    }
    return html + `</div>`;
  }

  _creatures(s) {
    let html = `<div class="journal-section"><h3>🐾 Criaturas</h3>`;
    const discovered = s.creatures.discovered;
    if (discovered.length === 0) {
      html += `<div class="journal-entry"><span class="entry-status">Aún no has encontrado criaturas.</span></div>`;
      return html + `</div>`;
    }
    for (const id of discovered) {
      const c = CREATURES[id];
      if (!c) continue;
      const pct = investigationSystem.getProgress(id);
      const isTamed = tamingSystem.isTamed(id);
      const captured = captureSystem.isCaptured(id);
      const state = isTamed ? "❤️" : captured ? "🪤" : "🐾";
      const trust = tamingSystem.getTrust(id);
      html += `<div class="journal-entry">
        <div class="journal-entry-row">
          <span class="entry-title">${c.emoji} ${c.name} ${state}</span>
          <button class="btn btn-small" data-creature="${id}">Ficha</button>
        </div>
        <div class="entry-status">${captured ? `Confianza: ${trust}% · ` : ""}Investigación: ${pct}%</div>
      </div>`;
    }
    return html + `</div>`;
  }

  _memories(s) {
    let html = `<div class="journal-section"><h3>❤️ Recuerdos</h3>`;
    const found = s.memories.found || [];
    if (found.length === 0) {
      html += `<div class="journal-entry"><span class="entry-status">Los recuerdos se restauran al domesticar criaturas.</span></div>`;
    } else {
      for (const id of found) {
        const m = MEMORIES[id];
        if (!m) continue;
        const restored = (s.memories.restored || []).includes(id);
        html += `<div class="journal-entry">
          <span class="entry-title">${m.emoji} ${m.name} ${restored ? "✓" : ""}</span>
          ${m.text ? `<div class="entry-status">${m.text}</div>` : ""}
        </div>`;
      }
    }
    return html + `</div>`;
  }

  _secrets(s) {
    let html = `<div class="journal-section"><h3>🔐 Secretos</h3>`;
    if (s.journal.secrets.length === 0) {
      html += `<div class="journal-entry"><span class="entry-status">Ninguno descubierto todavía.</span></div>`;
    } else {
      s.journal.secrets.forEach((id) => {
        html += `<div class="journal-entry"><span class="entry-title">Secreto: ${id}</span></div>`;
      });
    }
    return html + `</div>`;
  }
}

export const journalPanel = new JournalPanel();

// Delegación de clics para abrir fichas de criatura.
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-creature]");
  if (btn) {
    creatureUI.open(btn.dataset.creature);
  }
});
