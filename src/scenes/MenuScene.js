/**
 * MenuScene (GDD técnico §50).
 * MVP: controla los botones del menú inicial y la frase central.
 */
import { audio } from "../systems/AudioSystem.js";
import { saveManager } from "../systems/SaveInstance.js";

const Q = (id) => document.getElementById(id);

export function initMenu({ onEnter, onReset }) {
  const btnContinue = Q("btn-continue");
  const btnReset = Q("btn-reset");

  btnContinue.addEventListener("click", () => {
    audio.unlock();
    audio.playAmbient();
    onEnter?.();
  });

  btnReset.addEventListener("click", () => {
    if (confirm("¿Seguro que quieres reiniciar el jardín?")) {
      saveManager.resetGame();
      onReset?.();
    }
  });
}
