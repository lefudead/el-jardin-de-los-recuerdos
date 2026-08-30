/**
 * AudioSystem (GDD técnico §36-37).
 * MVP: audio sintetizado con Web Audio (sin archivos externos todavía).
 * Volumen separado para música y efectos (GDD §36).
 */
import { gameState } from "./GameState.js";

class AudioSystem {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.masterGain = null;
    this.currentMelody = null;
  }

  /** Se llama tras el primer gesto del usuario (requisito de autoplay). */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();

    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.connect(this.masterGain);

    this.applyVolumes();
  }

  applyVolumes() {
    if (!this.ctx) return;
    const s = gameState.settings;
    this.masterGain.gain.value = 1;
    this.musicGain.gain.value = s.musicVolume ?? 1;
    this.sfxGain.gain.value = s.sfxVolume ?? 1;
  }

  setMusicVolume(v) {
    gameState.settings.musicVolume = v;
    if (this.musicGain) this.musicGain.gain.value = v;
  }

  setSfxVolume(v) {
    gameState.settings.sfxVolume = v;
    if (this.sfxGain) this.sfxGain.gain.value = v;
  }

  /** Toca una nota suave sintetizada. */
  tone(freq, duration = 0.4, volume = 0.15, when = 0, type = "sine") {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  /** Efecto de pétalo (suave y corto). */
  playPetal() {
    const f = 520 + Math.random() * 260;
    this.tone(f, 0.25, 0.12, 0, "sine");
    this.tone(f * 2, 0.15, 0.05, 0.03, "sine");
  }

  playBouquet() {
    this.tone(523, 0.3, 0.14, 0);
    this.tone(659, 0.3, 0.14, 0.12);
    this.tone(784, 0.4, 0.14, 0.24);
  }

  playBuy() {
    this.tone(400, 0.2, 0.12, 0);
    this.tone(600, 0.3, 0.12, 0.08);
  }

  playError() {
    this.tone(200, 0.3, 0.1, 0, "triangle");
  }

  /** Música ambiente: arpegio suave repetido. */
  playAmbient() {
    if (!this.ctx) return;
    this.stopMusic();
    const notes = [261.6, 329.6, 392.0, 523.2];
    let i = 0;
    const playNote = () => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = notes[i % notes.length];
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.06, t + 0.2);
      g.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
      osc.connect(g);
      g.connect(this.musicGain);
      osc.start(t);
      osc.stop(t + 2.6);
      i++;
    };
    playNote();
    this.currentMelody = setInterval(playNote, 2200);
  }

  stopMusic() {
    if (this.currentMelody) {
      clearInterval(this.currentMelody);
      this.currentMelody = null;
    }
  }
}

export const audio = new AudioSystem();
