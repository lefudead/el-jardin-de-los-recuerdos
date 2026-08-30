/**
 * Event Bus central (GDD técnico §82-83).
 * Desacopla los sistemas: emiten eventos y otros sistemas reaccionan.
 */
class EventBus {
  constructor() {
    this.listeners = new Map();
    this.onceListeners = new Map();
  }

  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(fn);
    return () => this.off(event, fn);
  }

  once(event, fn) {
    if (!this.onceListeners.has(event)) this.onceListeners.set(event, new Set());
    this.onceListeners.get(event).add(fn);
    return () => this.off(event, fn);
  }

  off(event, fn) {
    this.listeners.get(event)?.delete(fn);
    this.onceListeners.get(event)?.delete(fn);
  }

  emit(event, payload) {
    this.listeners.get(event)?.forEach((fn) => {
      try { fn(payload); } catch (e) { console.error(`[eventbus] error en ${event}`, e); }
    });
    const once = this.onceListeners.get(event);
    if (once) {
      once.forEach((fn) => {
        try { fn(payload); } catch (e) { console.error(`[eventbus] error once ${event}`, e); }
      });
      once.clear();
    }
  }

  clear() {
    this.listeners.clear();
    this.onceListeners.clear();
  }

  /** Nombres de eventos estándar (GDD §82). */
  static EVENTS = Object.freeze({
    PETAL_GAINED: "PETAL_GAINED",
    BOUQUET_GAINED: "BOUQUET_GAINED",
    RESOURCE_CHANGED: "RESOURCE_CHANGED",
    FLOWER_DISCOVERED: "FLOWER_DISCOVERED",
    CREATURE_FOUND: "CREATURE_FOUND",
    CREATURE_INTERFERENCE: "CREATURE_INTERFERENCE",
    CREATURE_STOPPED: "CREATURE_STOPPED",
    OBSERVATION_FOUND: "OBSERVATION_FOUND",
    CREATURE_CAPTURED: "CREATURE_CAPTURED",
    CREATURE_FED: "CREATURE_FED",
    CREATURE_TAMING: "CREATURE_TAMING",
    CREATURE_TAMED: "CREATURE_TAMED",
    CREATURE_HELPED: "CREATURE_HELPED",
    CAGE_PURCHASED: "CAGE_PURCHASED",
    FOOD_PURCHASED: "FOOD_PURCHASED",
    MEMORY_FOUND: "MEMORY_FOUND",
    MEMORY_RESTORED: "MEMORY_RESTORED",
    PUZZLE_SOLVED: "PUZZLE_SOLVED",
    SECRET_FOUND: "SECRET_FOUND",
    MAP_UNLOCKED: "MAP_UNLOCKED",
    UPGRADE_PURCHASED: "UPGRADE_PURCHASED",
    STORY_PROGRESS: "STORY_PROGRESS",
    TIME_CHANGED: "TIME_CHANGED",
    SAVE_REQUESTED: "SAVE_REQUESTED",
    GAME_RESET: "GAME_RESET",
    SHOW_TOAST: "SHOW_TOAST",
    NILO_WARNING: "NILO_WARNING"
  });
}

export const eventBus = new EventBus();
