/**
 * SettingsScene (GDD técnico §51): ajustes y depuración.
 */
import { gameState } from "../systems/GameState.js";
import { audio } from "../systems/AudioSystem.js";
import { saveManager } from "../systems/SaveInstance.js";
import { debugTools } from "../systems/DebugTools.js";
import { CONFIG } from "../config.js";

const Q = (id) => document.getElementById(id);

export class SettingsScene {
  init() {
    this.bindVolumes();
    this.bindDebug();
    this.bindTransfer();
  }

  bindVolumes() {
    const music = Q("music-volume");
    const sfx = Q("sfx-volume");
    const vib = Q("vibration-toggle");

    if (music) {
      music.value = gameState.settings.musicVolume;
      music.addEventListener("input", () => {
        audio.setMusicVolume(parseFloat(music.value));
        saveManager.saveGame();
      });
    }
    if (sfx) {
      sfx.value = gameState.settings.sfxVolume;
      sfx.addEventListener("input", () => {
        audio.setSfxVolume(parseFloat(sfx.value));
        saveManager.saveGame();
      });
    }
    if (vib) {
      vib.checked = gameState.settings.vibration;
      vib.addEventListener("change", () => {
        gameState.settings.vibration = vib.checked;
        saveManager.saveGame();
      });
    }
  }

  bindDebug() {
    const panel = Q("debug-panel");
    if (panel) panel.hidden = !debugTools.enabled;
    // también permitir forzar debug
    const d = new URLSearchParams(location.search).get("debug");
    if (d === "1") {
      debugTools.setEnabled(true);
      if (panel) panel.hidden = false;
    }
    panel?.querySelectorAll("[data-debug]").forEach((btn) => {
      btn.addEventListener("click", () => debugTools.run(btn.dataset.debug));
    });
  }

  bindTransfer() {
    const exp = Q("btn-export");
    const imp = Q("btn-import");
    const file = Q("export-file");

    if (exp) exp.addEventListener("click", () => saveManager.exportSave());
    if (imp) imp.addEventListener("click", () => file?.click());
    if (file) file.addEventListener("change", async (e) => {
      if (e.target.files[0]) {
        try {
          await saveManager.importSave(e.target.files[0]);
          location.reload();
        } catch (err) {
          alert("No se pudo importar la partida.");
        }
      }
    });
  }
}

export const settingsScene = new SettingsScene();
