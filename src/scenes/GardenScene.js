/**
 * GardenScene (GDD técnico §50, GDD §51-53, §40).
 * DOM-based para el prototipo web.
 * Responsabilidades:
 *  - colocar flores según la zona y el momento del día
 *  - gestionar el tap (feedback, recompensa, sonido, bonos de compañero)
 *  - reaparecer flores
 *  - detectar secretos por secuencia de taps
 *  - encuentro de criatura (Nilo): aparece, roba, 3 taps para detenerlo
 *  - dispara nodos narrativos (intro, anomalía, tutorial de Nilo)
 */
import { flowerSystem } from "../systems/FlowerInstance.js";
import { farming } from "../systems/FarmingSystem.js";
import { audio } from "../systems/AudioSystem.js";
import { secretSystem } from "../systems/SecretSystem.js";
import { dayNight } from "../systems/DayNightSystem.js";
import { gameState as gs } from "../systems/GameState.js";
import { FLOWERS } from "../data/flowers.js";
import { MAPS } from "../data/maps.js";
import { CREATURES } from "../data/creatures.js";
import { randomBetween, chance } from "../utils/random.js";
import { topBar } from "../ui/TopBar.js";
import { creatureSystem } from "../systems/CreatureSystem.js";
import { companionSystem } from "../systems/CompanionSystem.js";
import { narrativeSystem } from "../systems/NarrativeSystem.js";
import { eventBus } from "../systems/EventBus.js";

const Q = (id) => document.getElementById(id);

export class GardenScene {
  constructor() {
    this.container = null;
    this.flowers = []; // { el, flower, respawnTimer, active }
    this.niloEl = null;
    this.niloTimer = null;
    this._disposed = false;
    this._tapCountSinceCheck = 0;
  }

  /** Configura el contenedor y los listeners del área. */
  init(onEachFlowerTap) {
    this.container = Q("garden-area");
    this.onEachFlowerTap = onEachFlowerTap || (() => {});
  }

  /** Rellena el jardín con flores de la zona/momento actuales. */
  populate() {
    this.clear();
    const zone = gs.state.progression.currentZone;
    const time = gs.state.progression.timeOfDay;
    const capacity = flowerSystem.zoneCapacity(zone);
    const spawned = flowerSystem.spawnFlowers(zone, time, capacity);

    for (const s of spawned) {
      this.addFlower(s.id, s.x, s.y);
    }

    // Narrativa de introducción (solo partida nueva)
    this._maybeIntro();
    this._checkNiloAfterEnter();
  }

  addFlower(flowerId, xPct, yPct) {
    if (!this.container) return;
    const data = FLOWERS[flowerId];
    if (!data) return;

    const el = document.createElement("div");
    el.className = "flower";
    el.textContent = data.emoji;
    el.style.left = xPct + "%";
    el.style.top = yPct + "%";

    const label = document.createElement("div");
    label.className = "flower-label";
    label.textContent = `${data.name} +${data.petalValue}`;
    el.appendChild(label);

    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this.onFlowerTap(data.id, el);
    });

    this.container.appendChild(el);
    this.flowers.push({ el, flower: data, timer: null, active: true });
  }

  /** Lógica de tap: feedback, recompensa y reaparición. */
  onFlowerTap(flowerId, el) {
    const entry = this.flowers.find((f) => f.el === el && f.active);
    if (!entry) return;

    // feedback visual
    el.classList.add("pressed");
    setTimeout(() => el.classList.remove("pressed"), 90);

    // partícula de pétalo
    this.spawnPetal(el);

    // recompensa vía FarmingSystem
    const result = farming.tapFlower(flowerId);

    // bonus pasivo de compañeros (Nilo recolector)
    companionSystem.applyTapBonus();

    if (result) {
      audio.playPetal();
      if (result.convertedBouquets > 0) {
        audio.playBouquet();
      }
    }

    // secretos por secuencia de taps
    secretSystem.onFlowerTap(flowerId);

    // narrativa por taps: anomalía a los 5, encuentro de Nilo a los 15
    this._tapCountSinceCheck++;
    this._checkNarrativeTaps();

    this.onEachFlowerTap();

    // desactivar y agendar reaparición
    this.hideThenRespawn(entry);
  }

  _checkNarrativeTaps() {
    // Anomalía a los 5 taps (aviso de Nilo)
    if (!gs.state.storyFlags.anomaly_shown && gs.state.stats.totalTaps >= 5) {
      gs.state.storyFlags.anomaly_shown = true;
      eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, {
        text: "🌿 Algo corre entre las flores... no llegas a verlo bien."
      });
    }
    // Ruido de Nilo a partir de ciertos taps, si aún no domesticado
    if (gs.state.stats.totalTaps >= 15) {
      narrativeSystem.tryNiloTutorial();
      if (!narrativeSystem.isDone("nilo_meet")) {
        this._maybeStartEncounter();
      }
    }
  }

  /** Oculta la flor y la agenda para reaparecer. */
  hideThenRespawn(entry) {
    if (!entry.active) return;
    entry.active = false;
    entry.el.classList.add("faded");

    const baseMin = 8000;
    const baseMax = 15000;
    const delay = flowerSystem.respawnTime(baseMin, baseMax);

    entry.timer = setTimeout(() => this.respawn(entry), delay);

    entry.el.addEventListener("pointerdown", (e) => e.preventDefault());
  }

  respawn(entry) {
    if (this._disposed) return;
    const zone = gs.state.progression.currentZone;
    const time = gs.state.progression.timeOfDay;

    const available = flowerSystem.flowersForZone(zone, time);
    if (available.length === 0) {
      entry.active = true;
      entry.el.classList.remove("faded");
      return;
    }
    const pick = available[randomBetween(0, available.length - 1)];
    entry.flower = pick;
    entry.el.textContent = pick.emoji;
    const label = entry.el.querySelector(".flower-label");
    if (label) label.textContent = `${pick.name} +${pick.petalValue}`;
    entry.el.classList.remove("faded");
    entry.active = true;

    entry.el.style.left = randomBetween(15, 85) + "%";
    entry.el.style.top = randomBetween(18, 70) + "%";
  }

  /** Crea una partícula de pétalo que sube desde la flor. */
  spawnPetal(el) {
    if (!this.container) return;
    const rect = el.getBoundingClientRect();
    const areaRect = this.container.getBoundingClientRect();
    const x = rect.left - areaRect.left + rect.width / 2;
    const y = rect.top - areaRect.top;

    const p = document.createElement("div");
    p.className = "petal-float";
    p.textContent = "🌸";
    p.style.left = x + "px";
    p.style.top = y + "px";
    this.container.appendChild(p);
    setTimeout(() => p.remove(), 750);

    const sp = document.createElement("div");
    sp.className = "sparkle";
    sp.textContent = "✨";
    sp.style.left = x + "px";
    sp.style.top = y - 10 + "px";
    this.container.appendChild(sp);
    setTimeout(() => sp.remove(), 500);
  }

  /** Renderiza el fondo según la zona y el momento. */
  applyZoneVisual() {
    const zone = gs.state.progression.currentZone;
    const map = MAPS[zone];
    topBar.setZone(map ? map.name : zone);
    dayNight.applyBodyClass();
    if (this.container) {
      topBar.setTime(gs.state.progression.timeOfDay);
    }
  }

  clear() {
    if (this.container) this.container.innerHTML = "";
    this.flowers.forEach((f) => clearTimeout(f.timer));
    this.flowers = [];
    this._removeNilo();
  }

  /** Se llama cuando el jugador cambia de zona o de día/noche. */
  refresh() {
    this.applyZoneVisual();
    this.populate();
  }

  dispose() {
    this._disposed = true;
    this._removeNilo();
    this.clear();
  }

  // ================= NARRATIVA =================

  _maybeIntro() {
    if (gs.state.progression.currentZone !== "spring_garden") return;
    narrativeSystem.tryIntro();
  }

  _checkNiloAfterEnter() {
    if (gs.state.progression.currentZone !== "spring_garden") return;
    if (gs.state.stats.totalTaps >= 15) {
      narrativeSystem.tryNiloTutorial();
    }
  }

  // ================= ENCUENTRO DE NILO =================

  /** Intenta iniciar un encuentro de Nilo si las condiciones se cumplen. */
  _maybeStartEncounter() {
    if (this._disposed) return;
    if (creatureSystem.hasActiveEncounter()) return;
    if (gs.state.progression.currentZone !== "spring_garden") return;
    const nilo = CREATURES.nilo;
    if (creatureSystem.isTamed("nilo")) return;
    if (gs.state.stats.totalTaps < 15) return;
    // solo después del primer encuentro narrativo con Nilo
    if (!narrativeSystem.isDone("nilo_meet")) return;

    // probabilidad moderada de que aparezca ahora
    if (!chance(0.25)) return;

    const started = creatureSystem.startEncounter("nilo", gs.state.progression.currentZone);
    if (started) {
      this._renderNilo();
    }
  }

  /** Muestra a Nilo robando en el jardín. */
  _renderNilo() {
    if (!this.container) return;
    if (this.niloEl) return;
    const nilo = CREATURES.nilo;
    const el = document.createElement("div");
    el.className = "nilo";
    el.textContent = nilo.emoji;
    el.style.left = randomBetween(25, 75) + "%";
    el.style.top = randomBetween(22, 55) + "%";

    const label = document.createElement("div");
    label.className = "nilo-label";
    label.textContent = "¡ROBANDO!";
    el.appendChild(label);

    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this._onNiloTap();
    });

    this.container.appendChild(el);
    this.niloEl = el;

    // ventana de tiempo para detenerlo
    const cfg = CREATURES.nilo.interferenceConfig || {};
    clearTimeout(this.niloTimer);
    this.niloTimer = setTimeout(() => {
      creatureSystem.expireEncounter();
      this._removeNilo();
    }, cfg.windowMs || 3000);
  }

  _onNiloTap() {
    const state = creatureSystem.onPlayerTap("nilo");
    if (!state) return;
    if (this.niloEl) {
      this.niloEl.classList.add("hit");
      setTimeout(() => this.niloEl.classList.remove("hit"), 120);
    }
    if (state.status === "stopped") {
      // feedback de éxito
      eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, {
        text: "🐿️ ¡Detuviste a Nilo antes de que robara!"
      });
      clearTimeout(this.niloTimer);
      this._removeNilo();
    }
  }

  _removeNilo() {
    if (this.niloEl && this.niloEl.parentNode) {
      this.niloEl.remove();
    }
    this.niloEl = null;
    if (this.niloTimer) {
      clearTimeout(this.niloTimer);
      this.niloTimer = null;
    }
  }
}

export const gardenScene = new GardenScene();
