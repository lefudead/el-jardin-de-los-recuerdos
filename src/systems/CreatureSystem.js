/**
 * CreatureSystem (GDD técnico §99-104, GDD §8-16, §38-40).
 * Aparición, comportamiento de interferencia (molestia) y observaciones.
 *
 * Ciclo de Nilo (GDD §11, §40, milestone "NILO ESTÁ ROBANDO"):
 *  - aparece en el jardín
 *  - elige una flor y empieza a robarla
 *  - se alerta al jugador (NILO_WARNING)
 *  - el jugador tiene una ventana de tiempo para tocar a Nilo `tapsToStop` veces
 *  - éxito: Nilo suelta la flor (CREATURE_STOPPED)
 *  - fallo (se agota el tiempo): Nilo roba `stealFlowers` flores (CREATURE_INTERFERENCE)
 */
import { CREATURES } from "../data/creatures.js";
import { gameState } from "./GameState.js";
import { eventBus } from "./EventBus.js";
import { rewardSystem } from "./RewardSystem.js";
import { investigationSystem } from "./InvestigationSystem.js";
import { saveManager } from "./SaveInstance.js";
const DEFAULT_TAPS_TO_STOP = 3;
const DEFAULT_WINDOW_MS = 3000;
const DEFAULT_STEAL = 3;

export class CreatureSystem {
  constructor() {
    // Estado del encuentro actual (no se persiste).
    this.active = null;
  }

  getAll() {
    return Object.values(CREATURES);
  }

  getCreature(id) {
    return CREATURES[id] || null;
  }

  isDiscovered(id) {
    return gameState.state.creatures.discovered.includes(id);
  }

  isCaptured(id) {
    return gameState.state.creatures.captured.includes(id);
  }

  isTamed(id) {
    return gameState.state.creatures.tamed.includes(id);
  }

  /** ¿Una criatura puede interferir (no está capturada)? */
  canInterfere(id) {
    return !this.isCaptured(id);
  }

  availableIn(zoneId, timeOfDay) {
    return this.getAll().filter((c) => c.zone === zoneId && this._timeMatches(c.schedule, timeOfDay));
  }

  _timeMatches(schedule, timeOfDay) {
    if (!schedule) return true;
    const h = this._hourOf(timeOfDay);
    if (h === null) return true;
    const { start, end } = schedule;
    if (start <= end) return h >= start && h < end;
    return h >= start || h < end;
  }

  _hourOf(timeOfDay) {
    // tiempo conceptual: day=12, sunset=18, night=22, full_moon=23
    return { day: 12, sunset: 18, night: 22, full_moon: 23 }[timeOfDay] ?? null;
  }

  /** ¿Hay un encuentro activo en este momento? */
  hasActiveEncounter() {
    return !!this.active;
  }

  /**
   * Inicia un encuentro de robo para una criatura en una zona.
   * handlers.onSteal(): función opcional invocada al consumar el robo;
   * si se proporciona, decide la recompensa/perjuicio (p. ej. Nilo se lleva
   * una flor y baja la capacidad máxima) y devuelve cuántas unidades robó.
   * Sin handlers, el comportamiento por defecto roba pétalos (`stealFlowers`).
   */
  startEncounter(creatureId, zoneId, handlers = {}) {
    if (this.active) return null;
    const c = CREATURES[creatureId];
    if (!c) return null;
    if (!this.canInterfere(creatureId)) return null;

    const cfg = c.interferenceConfig || {};
    this.active = {
      creatureId,
      zone: zoneId,
      tapCount: 0,
      tapsToStop: cfg.tapsToStop || DEFAULT_TAPS_TO_STOP,
      stealFlowers: cfg.stealFlowers || DEFAULT_STEAL,
      windowMs: cfg.windowMs || DEFAULT_WINDOW_MS,
      startedAt: Date.now(),
      timer: null,
      status: "stealing",
      onSteal: handlers.onSteal || null
    };

    this._discover(creatureId);
    // Encontrar a la criatura cuenta hacia el 100% de descubrimiento (5 veces).
    investigationSystem.addFind(creatureId);
    eventBus.emit(eventBus.constructor.EVENTS.NILO_WARNING, { creatureId, name: c.name, emoji: c.emoji });
    eventBus.emit(eventBus.constructor.EVENTS.CREATURE_INTERFERENCE, {
      creatureId,
      type: c.interference || "steal_flowers",
      status: "started"
    });
    return c;
  }

  /** ¿La criatura del encuentro es la indicada? */
  isEncounterCreature(creatureId) {
    return !!this.active && this.active.creatureId === creatureId && this.active.status === "stealing";
  }

  /**
   * El jugador toca a la criatura durante el robo. Devuelve el estado del encuentro.
   */
  onPlayerTap(creatureId) {
    if (!this.isEncounterCreature(creatureId)) return null;
    this.active.tapCount++;
    if (this.active.tapCount >= this.active.tapsToStop) {
      this._resolveSuccess();
    }
    return { ...this.active };
  }

  _resolveSuccess() {
    const ev = this.active;
    if (!ev) return;
    this._clearTimer();
    ev.status = "stopped";
    eventBus.emit(eventBus.constructor.EVENTS.CREATURE_STOPPED, { creatureId: ev.creatureId });
    // Observaciones (GDD §16, §33). El descubrimiento avanza con los encuentros.
    this._observe(ev.creatureId, "steals_flowers");
    this._observe(ev.creatureId, "appears_morning");
    this._observe(ev.creatureId, "reacts_to_cages");
    saveManager.saveGame();
    this.active = null;
    return true;
  }

  _resolveSteal() {
    const ev = this.active;
    if (!ev) return;
    this._clearTimer();
    ev.status = "escaped";
    const game = gameState;

    // Si el encuentro define un manejador de robo (ej. Nilo se lleva una flor),
    // devuelve cuántas unidades robó; si no, roba pétalos por defecto.
    let stolen = Math.min(ev.stealFlowers, game.state.resources.petals);
    if (typeof ev.onSteal === "function") {
      stolen = ev.onSteal() || 0;
    } else {
      game.state.resources.petals -= stolen;
    }

    eventBus.emit(eventBus.constructor.EVENTS.RESOURCE_CHANGED, {
      petals: game.state.resources.petals,
      bouquets: game.state.resources.bouquets
    });
    eventBus.emit(eventBus.constructor.EVENTS.CREATURE_INTERFERENCE, {
      creatureId: ev.creatureId,
      type: "steal_flowers",
      status: "escaped",
      stolen
    });
    this._observe(ev.creatureId, "steals_flowers");
    saveManager.saveGame();
    this.active = null;
  }

  _observe(creatureId, obsId) {
    if (!obsId) return;
    rewardSystem.give({ type: "creature_observation", creatureId, observationId: obsId });
  }

  _discover(creatureId) {
    if (!this.isDiscovered(creatureId)) {
      rewardSystem.give({ type: "creature_observation", creatureId, observationId: "__discovered__" });
    }
  }

  /** Marca una criatura como descubierta (verla una vez la añade al diario). */
  markDiscovered(creatureId) {
    this._discover(creatureId);
    return this.isDiscovered(creatureId);
  }

  /** Resuelve el encuentro cuando expira la ventana (lo llama la UI/GardenScene). */
  expireEncounter() {
    if (this.active && this.active.status === "stealing") {
      this._resolveSteal();
    }
  }

  _clearTimer() {
    if (this.active?.timer) {
      clearTimeout(this.active.timer);
      this.active.timer = null;
    }
  }

  /** Detiene y limpia cualquier encuentro activo (al salir del jardín). */
  cancelEncounter() {
    if (this.active) {
      this._clearTimer();
      this.active = null;
    }
  }
}

export const creatureSystem = new CreatureSystem();
