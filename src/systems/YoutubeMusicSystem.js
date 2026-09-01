/**
 * YoutubeMusicSystem — música propia del jugador (GDD §37, extensión).
 * Permite reproducir un video de YouTube en bucle o una playlist completa
 * (también en bucle) dentro del juego, pegando su enlace.
 * Nota: la búsqueda por nombre NO es posible en el reproductor embebido
 * (deprecada en 2020); por eso se usa el enlace del video/playlist.
 */
import { gameState } from "./GameState.js";
import { audio } from "./AudioSystem.js";
import { saveManager } from "./SaveInstance.js";

const Q = (id) => document.getElementById(id);

function extractVideoId(url) {
  const m = String(url).match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

function extractPlaylistId(url) {
  const m = String(url).match(/[?&#]list=([A-Za-z0-9_-]+)/);
  if (!m) return null;
  // Los ids de lista de reproducción miden ≥ 8 caracteres (PL, RD, OLAK5uy_,
  // UU, LL, FL, PU, etc.). Sin exigir prefijo para no descartar ids válidos.
  return m[1].length >= 8 ? m[1] : null;
}

function parseUrl(url) {
  const playlist = extractPlaylistId(url);
  const video = extractVideoId(url);
  // watch?v=VIDEO&list=PLAYLIST: el usuario quiere ese video, no el 1º de la lista.
  if (video && playlist) return { type: "video_playlist", id: video, playlist };
  if (playlist) return { type: "playlist", id: playlist };
  if (video) return { type: "video", id: video };
  return null;
}

export { parseUrl };

class YoutubeMusicSystem {
  constructor() {
    this.player = null;
    this.apiReady = false;
    this._ready = false;
    this._initPromise = null;
    this.statusText = "";
  }

  /** Prepara la API y el reproductor; si había música activa, la reanuda. */
  init() {
    this._ensureApi().then(() => {
      const s = gameState.settings.externalMusic || {};
      if (s.enabled && s.url) {
        this.setStatus("Cargando tu música…");
        this.loadUrl(s.url);
      }
    });
  }

  /** Inyecta el script del reproductor IFrame de YouTube (si falta). */
  _ensureApi() {
    if (this._initPromise) return this._initPromise;
    this._initPromise = new Promise((resolve) => {
      const create = () => {
        this.apiReady = true;
        resolve();
      };
      if (window.YT && window.YT.Player) { create(); return; }
      window.onYouTubeIframeAPIReady = create;
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    });
    return this._initPromise;
  }

  /**
   * Crea el reproductor oculto (1px, sin controles) con el objetivo ya puesto
   * en `playerVars` (autoplay:1, loop:1). Re-crear en cada carga evita quedarse
   * atascado en un estado roto del reproductor anterior y deja que el propio
   * iframe de YouTube gestione el arranque dentro del gesto del usuario.
   */
  _createPlayer(videoId, vars) {
    const host = Q("external-music-host");
    if (!host) return;
    host.innerHTML = "";
    this._ready = false;
    if (this._unlockRemover) { this._unlockRemover(); this._unlockRemover = null; }
    const div = document.createElement("div");
    div.id = "external-music-player";
    host.appendChild(div);
    this.player = new YT.Player("external-music-player", {
      height: "1",
      width: "1",
      videoId,
      playerVars: {
        controls: 0,
        disablekb: 1,
        fs: 0,
        playsinline: 1,
        rel: 0,
        loop: 1,
        autoplay: 1,
        // Chrome bloquea el autoplay CON sonido en iframes de terceros. Arrancar
        // en silencio (siempre permitido) y desmutear tras un toque del usuario.
        mute: 1,
        ...vars
      },
      events: {
        onReady: () => {
          this._ready = true;
          const ifr = Q("external-music-player")?.querySelector("iframe");
          if (ifr) ifr.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
          try { this.player.setLoop(true); } catch (err) { /* noop */ }
          const turnOnSound = () => {
            try { if (typeof this.player.unMute === "function") this.player.unMute(); } catch (err) { /* noop */ }
            try { this.player.playVideo(); } catch (err) { /* noop */ }
            this.setStatus(this._okStatus || "");
            if (this._unlockRemover) { this._unlockRemover(); this._unlockRemover = null; }
          };
          // El ▶ ya fue un gesto del usuario; a veces llega a desmutear solo.
          turnOnSound();
          try {
            if (typeof this.player.isMuted === "function" && this.player.isMuted()) {
              this.setStatus("🔇 Toca el jardín para activar el sonido 🔊");
              const listener = () => turnOnSound();
              this._unlockRemover = () => {
                document.removeEventListener("pointerdown", listener);
                document.removeEventListener("keydown", listener);
                this._unlockRemover = null;
              };
              document.addEventListener("pointerdown", listener);
              document.addEventListener("keydown", listener);
            }
          } catch (err) { /* noop */ }
        },
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.ENDED) {
            try { this.player.playVideo(); } catch (err) { /* noop */ }
          }
        },
        onError: (e) => {
          this.setStatus("No se pudo reproducir el enlace (código " + e.data + "). Revisa que el video permita reproducirse fuera de YouTube.");
        }
      }
    });
  }

  /**
   * Reproduce un enlace de YouTube en bucle. `force` permite re-cargar
   * aunque sea el mismo enlace (p. ej. tras volver a entrar al juego).
   */
  async loadUrl(url, force = false) {
    await this._ensureApi();
    const parsed = parseUrl(url);
    if (!parsed) {
      this.setStatus("Ese enlace no parece de YouTube.");
      return { ok: false, reason: "bad_url" };
    }
    // La música propia sustituye a la del juego: cortamos las pistas del juego
    // (también al reactivar, que disable() había reanudado).
    audio.stopMusic();
    gameState.settings.externalMusic.url = url;
    gameState.settings.externalMusic.enabled = true;
    // Objetivo del reproductor según el tipo de enlace.
    let videoId = "";
    const vars = {};
    if (parsed.type === "video_playlist") {
      videoId = parsed.id;
      vars.listType = "playlist";
      vars.list = parsed.playlist;
    } else if (parsed.type === "playlist") {
      vars.listType = "playlist";
      vars.list = parsed.id;
    } else {
      videoId = parsed.id;
    }
    try {
      this._okStatus = parsed.type === "video"
        ? "Tu video sonando en bucle 🔊"
        : "Tu música sonando en bucle 🔊";
      this._createPlayer(videoId, vars);
      this.setStatus(this._okStatus);
      saveManager.saveGame();
      return { ok: true, type: parsed.type };
    } catch (err) {
      this.setStatus("Error al reproducir el enlace.");
      return { ok: false, reason: "play_error" };
    }
  }

  /** Enciende la música propia (sin cambiar el enlace guardado). */
  async enable() {
    const s = gameState.settings.externalMusic;
    if (s.url) {
      await this.loadUrl(s.url);
    } else {
      s.enabled = true;
      audio.stopMusic();
      this.setStatus("Música propia activa. Pega un enlace de YouTube.");
      saveManager.saveGame();
    }
  }

  /** Apaga la música propia y devuelve la música del juego. */
  disable() {
    const s = gameState.settings.externalMusic;
    s.enabled = false;
    if (this._unlockRemover) { this._unlockRemover(); this._unlockRemover = null; }
    try { if (this.player) this.player.pauseVideo(); } catch (err) { /* noop */ }
    this.setStatus("");
    audio.playZoneMusic(gameState.state.progression.currentZone);
    saveManager.saveGame();
  }

  isActive() {
    return !!gameState.settings.externalMusic?.enabled;
  }

  setStatus(text) {
    this.statusText = text || "";
    const el = Q("external-music-status");
    if (el) el.textContent = this.statusText;
  }
}

export const youtubeMusic = new YoutubeMusicSystem();