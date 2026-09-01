/**
 * GameState (GDD técnico §115): fuente central del estado actual.
 * Toda la información persistente pertenece aquí. No se duplica en escenas.
 */
import { sanitizeSave } from "../utils/validation.js";
import { ZONES, ZONE_CURRENCIES } from "../data/zones.js";

export const SAVE_VERSION = 2;

/** Estado por defecto de un juego nuevo (GDD técnico §115). */
export function defaultState() {
  return {
    resources: {
      petals: 0,
      bouquets: 0,
      mushrooms: 0,
      // economías por zona (Actualización 3.1): { zoneId: { currencyId: amount } }
      zones: defaultZoneResources()
    },
    progression: {
      currentZone: "spring_garden",
      timeOfDay: "day",
      storyProgress: 0
    },
    penalties: {
      // reducción de la capacidad máx de flores por robo de Nilo (GDD §40):
      // { [zoneId]: { reduced, untilMs } } — untilMs = timestamp real de expiración
      maxFlowers: {}
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
      // nº de veces que se ha encontrado a la criatura (GDD §33):
      // 100% de descubrimiento = 5 encuentros
      finds: {},
      // jaulas vinculadas: { creatureId: cageId }
      cages: {},
      // criaturas capturadas (id)
      captured: [],
      // criaturas domesticadas (id)
      tamed: [],
      // confianza por criatura 0-100 (GDD §22, §26)
      trust: {},
      // amistad por criatura (SIN LÍMITE): Nilo aporta +1 flor extra por cada 200
      friendship: {}
    },
    // compañeros "apoyos" activos: criaturas domesticadas que ayudan ahora mismo.
    // En el jardín se elige cuáles están activos (máx base 2, ampliable a 4 en tienda).
    companions: {
      active: [],
      // máximo simultáneo elevado por mejoras compradas (0 = base 2)
      slotsBought: 0,
      // zona de farmeo por apoyo activo: { creatureId: zoneId }
      farmZone: {}
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

/** Semilla todas las monedas de cada zona con 0 (Actualización 3.1). */
function defaultZoneResources() {
  const zones = {};
  for (const [zoneId, currencies] of Object.entries(ZONE_CURRENCIES)) {
    zones[zoneId] = { ...currencies };
  }
  // Compatibilidad: si una zona existe pero no está en ZONE_CURRENCIES, usa su moneda.
  for (const z of Object.values(ZONES)) {
    if (!zones[z.id]) zones[z.id] = { [z.currency]: 0 };
    else if (!(z.currency in zones[z.id])) zones[z.id][z.currency] = 0;
  }
  return zones;
}

class GameStateStore {
  constructor() {
    this.state = defaultState();
    this.settings = {
      musicVersion: 2,
      musicVolume: 0.4,
      sfxVolume: 1,
      vibration: true,
      // Música propia del jugador (YouTube): enlace, si está activa, volumen
      // y la lista de canciones que el usuario ha guardado (las que sí suenan).
      externalMusic: {
        enabled: false,
        url: "",
        volume: 100,
        savedTracks: []
      }
    };
  }

  /** Restaura el estado a partir de un guardado. */
  hydrate(save) {
    this.state = sanitizeSave(save, defaultState());
    if (save?.settings) {
      this.settings = { ...this.settings, ...save.settings };
      // Migración de ajustes: el volumen de música por defecto bajó a 40%
      // (la música alta tapaba los taps). Ajusta guardados antiguos (~100%).
      if ((save.settings.musicVersion ?? 1) < 2) {
        if (typeof save.settings.musicVolume === "number" && save.settings.musicVolume > 0.4) {
          this.settings.musicVolume = 0.4;
        }
        this.settings.musicVersion = 2;
      }
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
      penalties: this.state.penalties,
      unlocks: this.state.unlocks,
      creatures: this.state.creatures,
      companions: this.state.companions,
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
