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
const shortUrl = (url) => { try { const u = new URL(url); const p = u.pathname; return (u.hostname.replace("www.", "") + (p.length > 28 ? p.slice(0, 25) + "…" : p)).slice(0, 42); } catch (e) { return String(url).slice(0, 42); } };

export class SettingsScene {
  render() {
    const toggle = Q("external-music-toggle");
    const urlInput = Q("external-music-url");
    const s = gameState.settings.externalMusic;
    if (toggle) toggle.checked = !!s.enabled;
    if (urlInput) urlInput.value = s.url || "";
    if (Q("external-music-status")) {
      Q("external-music-status").textContent = youtubeMusic.statusText;
    }
    if (typeof this.renderSaved === "function") this.renderSaved();
  }

  init() {
    this.bindVolumes();
    this.bindExternalMusic();
    this.bindDebug();
    this.bindTransfer();
    this.bindFullscreen();
  }

  bindFullscreen() {
    const fs = Q("btn-fullscreen");
    if (!fs) return;
    const label = () => {
      fs.textContent = document.fullscreenElement ? "⛶ Salir de pantalla completa" : "⛶ Pantalla completa";
    };
    document.addEventListener("fullscreenchange", label);
    document.addEventListener("webkitfullscreenchange", label);
    fs.addEventListener("click", () => {
      if (document.fullscreenElement) {
        (document.exitFullscreen && document.exitFullscreen().catch(() => {}));
      } else {
        const root = document.documentElement;
        const fn = root.requestFullscreen || root.webkitRequestFullscreen;
        if (typeof fn === "function") {
          fn.call(root).then(label).catch(() => alert("No se pudo activar la pantalla completa."));
        } else {
          alert("Tu navegador no permite pantalla completa.");
        }
      }
    });
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
    const saveBtn = Q("btn-external-music-save");
    const listEl = Q("external-music-saved");
    const s = gameState.settings.externalMusic;
    if (!toggle || !s) return;

    toggle.checked = !!s.enabled;
    if (urlInput) urlInput.value = s.url || "";
    if (Q("external-music-status")) {
      Q("external-music-status").textContent = youtubeMusic.statusText;
    }

    const renderSaved = () => {
      if (!listEl) return;
      const tracks = youtubeMusic.listSaved();
      listEl.innerHTML = "";
      if (tracks.length === 0) return;
      const activeUrl = s.url || "";
      for (const t of tracks) {
        const row = document.createElement("div");
        row.className = "saved-track" + (t.url === activeUrl ? " is-active" : "");

        const info = document.createElement("div");
        info.className = "saved-track-info";
        const label = document.createElement("span");
        label.className = "saved-track-title";
        label.textContent = t.title || shortUrl(t.url);
        label.title = t.url;
        info.appendChild(label);

        const controls = document.createElement("div");
        controls.className = "saved-track-actions";

        const playBtn = document.createElement("button");
        playBtn.className = "btn btn-ghost btn-mini";
        playBtn.textContent = "▶";
        playBtn.setAttribute("aria-label", "Reproducir");
        playBtn.addEventListener("click", async () => {
          if (urlInput) urlInput.value = t.url;
          await youtubeMusic.loadUrl(t.url);
          renderSaved();
        });
        controls.appendChild(playBtn);

        const vol = document.createElement("input");
        vol.type = "range";
        vol.min = "0";
        vol.max = "100";
        vol.step = "1";
        vol.value = typeof t.volume === "number" ? t.volume : 100;
        vol.setAttribute("aria-label", "Volumen");
        vol.addEventListener("input", () => {
          const v = youtubeMusic.setVolume(parseInt(vol.value, 10) || 0);
          vol.value = String(v);
        });
        controls.appendChild(vol);

        const del = document.createElement("button");
        del.className = "btn btn-ghost btn-mini";
        del.textContent = "🗑️";
        del.setAttribute("aria-label", "Borrar");
        del.addEventListener("click", () => {
          youtubeMusic.removeTrack(t.url);
          renderSaved();
        });
        controls.appendChild(del);

        row.appendChild(info);
        row.appendChild(controls);
        listEl.appendChild(row);
      }
    };

    toggle.addEventListener("change", async () => {
      if (toggle.checked) await youtubeMusic.enable();
      else youtubeMusic.disable();
      renderSaved();
    });

    if (play) play.addEventListener("click", async () => {
      const url = (urlInput?.value || "").trim();
      if (!url) {
        youtubeMusic.setStatus("Pega antes un enlace de YouTube (video o playlist).");
        return;
      }
      await youtubeMusic.loadUrl(url);
      renderSaved();
    });

    if (saveBtn) saveBtn.addEventListener("click", async () => {
      const url = (urlInput?.value || "").trim();
      if (!url) {
        youtubeMusic.setStatus("Pega antes un enlace de YouTube para guardarlo.");
        return;
      }
      const res = youtubeMusic.saveTrack(url);
      if (res && res.ok) {
        youtubeMusic.setStatus("Guardada en Mis canciones 💾. Si suena, la verás aquí con su volumen.");
        renderSaved();
      } else {
        youtubeMusic.setStatus("Ese enlace no parece de YouTube.");
      }
    });

    if (stop) stop.addEventListener("click", () => {
      if (toggle) toggle.checked = false;
      youtubeMusic.disable();
      renderSaved();
    });

    this.renderSaved = renderSaved;
    this.render();
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
