/**
 * GameState (GDD técnico §115): fuente central del estado actual.
 * Toda la información persistente pertenece aquí. No se duplica en escenas.
 */
import { sanitizeSave } from "../utils/validation.js";
import { ZONES } from "../data/zones.js";

export const SAVE_VERSION = 2;

/** Estado por defecto de un juego nuevo (GDD técnico §115). */
export function defaultState() {
  return {
    resources: {
      petals: 0,
      bouquets: 0,
      // economías por zona (Actualización 3.1): { zoneId: { currencyId: amount } }
      zones: defaultZoneResources()
    },
    progression: {
      currentZone: "spring_garden",
      timeOfDay: "day",
      storyProgress: 0
    },
    unlocks: {
      flowers: ["daisy", "tulip", "sunflower"],
      maps: ["spring_garden"],
      skins: [],
      upgrades: []
    },
    creatures: {
      discovered: [],
      observations: {},
      // investigación 0-100 por criatura (GDD §31, §33)
      research: {},
      // jaulas vinculadas: { creatureId: cageId }
      cages: {},
      // criaturas capturadas (id)
      captured: [],
      // criaturas domesticadas (id)
      tamed: [],
      // confianza por criatura 0-100 (GDD §22, §26)
      trust: {}
    },
    inventory: {
      items: [],   // { id, quantity }
      foods: [],   // { id, quantity }
      cages: []    // { id, creatureId, used }
    },
    journal: {
      entries: [],
      secrets: []
    },
    puzzles: { solved: [] },
    events: { completed: [] },
    memories: {
      // recuerdos "encontrados" (id) — separado de restaurados
      found: [],
      restored: []
    },
    taming: {
      // estado del minijuego de domesticación (no persiste entre sesiones,
      // se limpia; aquí se guarda solo al completar)
      active: null
    },
    storyFlags: {},
    stats: {
      totalTaps: 0,
      totalPetals: 0,
      totalBouquets: 0,
      creaturesFound: 0,
      observationsFound: 0,
      creaturesCaptured: 0,
      creaturesTamed: 0,
      cagesUsed: 0,
      puzzlesSolved: 0,
      secretsFound: 0,
      memoriesFound: 0,
      playTime: 0
    }
  };
}

/** Semilla cada moneda de zona con 0 (Actualización 3.1). */
function defaultZoneResources() {
  const zones = {};
  for (const z of Object.values(ZONES)) {
    zones[z.id] = { [z.currency]: 0 };
  }
  return zones;
}

class GameStateStore {
  constructor() {
    this.state = defaultState();
    this.settings = {
      musicVolume: 1,
      sfxVolume: 1,
      vibration: true
    };
  }

  /** Restaura el estado a partir de un guardado. */
  hydrate(save) {
    this.state = sanitizeSave(save, defaultState());
    if (save?.settings) {
      this.settings = { ...this.settings, ...save.settings };
    }
  }

  reset() {
    this.state = defaultState();
  }

  /** Devuelve el snapshot actual para guardar. */
  toSave() {
    return {
      version: SAVE_VERSION,
      resources: this.state.resources,
      progression: this.state.progression,
      unlocks: this.state.unlocks,
      creatures: this.state.creatures,
      inventory: this.state.inventory,
      journal: this.state.journal,
      puzzles: this.state.puzzles,
      events: this.state.events,
      memories: this.state.memories,
      storyFlags: this.state.storyFlags,
      stats: this.state.stats,
      settings: this.settings
    };
  }
}

export const gameState = new GameStateStore();
