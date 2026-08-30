/**
 * UI: Modal genérico. Overlay DOM para diálogos/opciones.
 * También actúa como bloqueador de interacción durante narrativa/menús.
 */
export class Modal {
  constructor() {
    this.lockEl = null;
  }

  /** Muestra un modal con título y cuerpo HTML. Devuelve un elemento para enlazar acciones. */
  show(title, bodyHtml) {
    this._ensureLock();
    const panel = this.lockEl.querySelector(".modal-panel");
    panel.innerHTML = `
      <div class="modal-title">${title}</div>
      <div class="modal-body">${bodyHtml || ""}</div>
    `;
    this.lockEl.classList.add("show");
    return panel.querySelector(".modal-body");
  }

  /** Muestra un modal con un cuerpo ya construido (elemento). */
  showElement(title, el) {
    this._ensureLock();
    const panel = this.lockEl.querySelector(".modal-panel");
    const titleEl = document.createElement("div");
    titleEl.className = "modal-title";
    titleEl.textContent = title;
    panel.innerHTML = "";
    panel.appendChild(titleEl);
    panel.appendChild(el);
    this.lockEl.classList.add("show");
    return panel;
  }

  hide() {
    if (this.lockEl) this.lockEl.classList.remove("show");
  }

  /** Bloquea/libera la interacción con el juego (usado por la narrativa). */
  lock(block) {
    this._ensureLock();
    this.lockEl.classList.toggle("block", !!block);
  }

  _ensureLock() {
    if (this.lockEl) return;
    this.lockEl = document.createElement("div");
    this.lockEl.className = "modal-root";
    this.lockEl.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-panel"></div>`;
    this.lockEl.querySelector(".modal-backdrop").addEventListener("pointerdown", () => this.hide());
    document.body.appendChild(this.lockEl);
  }
}

export const modal = new Modal();
