/**
 * SettingsScene (GDD técnico §51): ajustes y depuración.
 */
import { gameState } from "../systems/GameState.js";
import { audio } from "../systems/AudioSystem.js";
import { saveManager } from "../systems/SaveInstance.js";
import { debugTools } from "../systems/DebugTools.js";
import { youtubeMusic } from "../systems/YoutubeMusicSystem.js";
import { CONFIG } from "../config.js";

const Q = (id) => document.getElementById(id);

export class SettingsScene {
  init() {
    this.bindVolumes();
    this.bindExternalMusic();
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

  bindExternalMusic() {
    const toggle = Q("external-music-toggle");
    const urlInput = Q("external-music-url");
    const play = Q("btn-external-music-play");
    const stop = Q("btn-external-music-stop");
    const s = gameState.settings.externalMusic;
    if (!toggle || !s) return;

    toggle.checked = !!s.enabled;
    if (urlInput) urlInput.value = s.url || "";
    if (Q("external-music-status")) {
      Q("external-music-status").textContent = youtubeMusic.statusText;
    }

    toggle.addEventListener("change", async () => {
      if (toggle.checked) await youtubeMusic.enable();
      else youtubeMusic.disable();
    });

    if (play) play.addEventListener("click", async () => {
      const url = (urlInput?.value || "").trim();
      if (!url) {
        youtubeMusic.setStatus("Pega antes un enlace de YouTube (video o playlist).");
        return;
      }
      await youtubeMusic.loadUrl(url);
    });

    if (stop) stop.addEventListener("click", () => {
      if (toggle) toggle.checked = false;
      youtubeMusic.disable();
    });
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
