/**
 * UI: DialogBox de narrativa (GDD §48-50, §53, §111).
 * Overlay DOM con hablante, emoji, texto y avance al tocar.
 * Soporta colas de líneas y opciones de botón (onDone).
 */
import { modal } from "./Modal.js";

export class DialogBox {
  constructor() {
    this.root = null;
    this.queue = [];
    this.onDone = null;
    this.visible = false;
  }

  _ensure() {
    if (this.root) return;
    this.root = document.createElement("div");
    this.root.className = "dialog-root";
    this.root.innerHTML = `
      <div class="dialog-backdrop"></div>
      <div class="dialog-box">
        <div class="dialog-speaker-row">
          <span class="dialog-emoji"></span>
          <span class="dialog-speaker"></span>
        </div>
        <div class="dialog-text"></div>
        <div class="dialog-options"></div>
        <div class="dialog-hint">▼ tocar</div>
      </div>`;
    this.root.querySelector(".dialog-backdrop").addEventListener("pointerdown", () => this.advance());
    this.root.querySelector(".dialog-box").addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      this.advance();
    });
    this._els = {
      emoji: this.root.querySelector(".dialog-emoji"),
      speaker: this.root.querySelector(".dialog-speaker"),
      text: this.root.querySelector(".dialog-text"),
      options: this.root.querySelector(".dialog-options"),
      hint: this.root.querySelector(".dialog-hint")
    };
    document.body.appendChild(this.root);
  }

  /**
   * Muestra una secuencia de líneas.
   * line: { speaker, text, emoji }
   * Al finalizar todas, llama onDone().
   */
  show(linesSpec, opts = {}) {
    this._ensure();
    this.queue = Array.isArray(linesSpec) ? linesSpec.slice() : [linesSpec];
    this.onDone = opts.onDone || (() => {});
    this.modalMode = !!opts.modal; // no interactuar con el juego mientras dure
    this.visible = true;
    this.root.classList.add("show");
    if (this.modalMode) modal.lock(true);
    this._renderLine();
    return this;
  }

  _renderLine() {
    if (!this.visible) return;
    const line = this.queue[0];
    if (!line) {
      this.hide();
      return;
    }
    if (line.emoji) this._els.emoji.textContent = line.emoji;
    else this._els.emoji.textContent = "";
    this._els.speaker.textContent = line.speaker || "";
    this._els.text.textContent = line.text || "";
    this._els.options.innerHTML = "";
    if (line.options && line.options.length) {
      this._els.hint.style.opacity = "0";
      for (const opt of line.options) {
        const btn = document.createElement("button");
        btn.className = "btn dialog-option";
        btn.textContent = opt.label;
        btn.addEventListener("pointerdown", (e) => {
          e.stopPropagation();
          if (opt.onClick) opt.onClick();
          this.queue = [];
          this.hide();
        });
        this._els.options.appendChild(btn);
      }
    } else {
      this._els.hint.style.opacity = "1";
    }
  }

  advance() {
    if (!this.visible) return;
    if (this.queue.length > 1) {
      this.queue.shift();
      this._renderLine();
    } else {
      this.queue.shift();
      this.hide();
    }
  }

  hide() {
    if (!this.visible) return;
    this.visible = false;
    this.root.classList.remove("show");
    if (this.root.parentNode && this.visible === false && this.root.querySelector(".dialog-options").children.length === 0) {
      // esperar a que termine la transición
    }
    modal.lock(false);
    const done = this.onDone;
    this.onDone = null;
    this.queue = [];
    if (done) setTimeout(done, 0);
  }

  isVisible() {
    return this.visible;
  }
}

export const dialogBox = new DialogBox();
