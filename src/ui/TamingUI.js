/**
 * UI: TamingUI (GDD §23-25, §56, §110).
 * Minijuego de domesticación: tocar 10 puntos en menos de 5 segundos.
 * Éxito → confianza +20. Fallo → pequeño avance (filosofía relajante).
 */
import { CREATURES } from "../data/creatures.js";
import { tamingSystem } from "../systems/TamingSystem.js";
import { eventBus } from "../systems/EventBus.js";

export class TamingUI {
  constructor() {
    this.root = null;
    this.active = false;
    this.creatureId = null;
  }

  _ensure() {
    if (this.root) return;
    this.root = document.createElement("div");
    this.root.className = "taming-root";
    this.root.innerHTML = `
      <div class="taming-overlay">
        <div class="taming-head">
          <span class="taming-creature"></span>
          <div class="taming-timer"></div>
        </div>
        <div class="taming-targets"></div>
        <div class="taming-progress-bar"><div class="taming-progress-fill"></div></div>
        <div class="taming-message"></div>
      </div>`;
    document.body.appendChild(this.root);
  }

  start(creatureId) {
    const c = CREATURES[creatureId];
    if (!c) return;
    if (!tamingSystem.hasFavoriteFood(creatureId)) {
      eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, { text: "Necesitas su alimento favorito." });
      return;
    }
    const cfg = tamingSystem.getConfig(creatureId);
    this._ensure();
    this.creatureId = creatureId;
    this.active = true;
    this.taps = 0;
    this.required = cfg.taps;
    this.timeLimit = cfg.timeLimit;
    this.startTime = Date.now();
    this.finished = false;

    this.root.querySelector(".taming-creature").textContent = `${c.emoji} ${c.name}`;
    const targets = this.root.querySelector(".taming-targets");
    targets.innerHTML = "";
    for (let i = 0; i < this.required; i++) {
      const dot = document.createElement("button");
      dot.className = "taming-target";
      dot.textContent = "●";
      dot.setAttribute("data-idx", String(i));
      dot.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        this._onDot(dot);
      });
      targets.appendChild(dot);
    }
    this.root.querySelector(".taming-progress-fill").style.width = "0%";
    this.showMsg("");
    this.root.classList.add("show");

    // consumir el alimento
    tamingSystem.consumeFood(creatureId);
    this._tickTimer();
    this._interval = setInterval(() => this._tickTimer(), 60);
  }

  _tickTimer() {
    if (!this.active || this.finished) return;
    const elapsed = Date.now() - this.startTime;
    const remain = Math.max(0, this.timeLimit - elapsed);
    const timerEl = this.root.querySelector(".taming-timer");
    timerEl.textContent = (remain / 1000).toFixed(2);
    if (remain <= 0) {
      this._finish(false);
    }
  }

  _onDot(dot) {
    if (!this.active || this.finished) return;
    if (dot.classList.contains("done")) return;
    dot.classList.add("done");
    this.taps++;
    const pct = Math.round((this.taps / this.required) * 100);
    this.root.querySelector(".taming-progress-fill").style.width = pct + "%";
    if (this.taps >= this.required) {
      this._finish(true);
    }
  }

  _finish(success) {
    if (this.finished) return;
    this.finished = true;
    clearInterval(this._interval);
    const withinTime = Date.now() - this.startTime <= this.timeLimit;
    const config = tamingSystem.getConfig(this.creatureId);
    const res = tamingSystem.runTaming(this.creatureId, this.taps, withinTime, config);
    const c = CREATURES[this.creatureId];
    const msgEl = this.root.querySelector(".taming-message");

    if (res.ok && success && withinTime) {
      msgEl.textContent = `${c.emoji} ¡${c.name} confía un poco más en ti! (+${res.gainedTrust} confianza)`;
      msgEl.classList.add("good");
      if (res.tamed) {
        msgEl.textContent = `✨ ¡${c.name} ahora es tu compañero!`;
      }
    } else {
      msgEl.textContent = "Parece que todavía necesita tiempo. Puedes volver a intentarlo.";
      msgEl.classList.remove("good");
    }

    // Permitir cerrar
    const close = document.createElement("button");
    close.className = "btn btn-primary taming-close";
    close.textContent = "Cerrar";
    close.addEventListener("pointerdown", () => this.close());
    this.root.querySelector(".taming-overlay").appendChild(close);
    this.active = false;
  }

  showMsg(text) {
    const msgEl = this.root.querySelector(".taming-message");
    msgEl.textContent = text;
    msgEl.classList.remove("good");
  }

  close() {
    clearInterval(this._interval);
    this.finished = true;
    this.active = false;
    this.root.classList.remove("show");
    const closeBtn = this.root.querySelector(".taming-close");
    if (closeBtn) closeBtn.remove();
  }
}

export const tamingUI = new TamingUI();
