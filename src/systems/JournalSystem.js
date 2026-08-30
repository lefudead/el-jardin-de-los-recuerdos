/**
 * JournalSystem (GDD técnico §19-21): categorías, entradas y observaciones.
 */
import { gameState } from "./GameState.js";
import { rewardSystem } from "./RewardSystem.js";

export class JournalSystem {
  constructor() {
    this.categories = [
      { id: "flowers", label: "🌸 Flores" },
      { id: "creatures", label: "🐾 Criaturas" },
      { id: "entities", label: "👻 Entidades" },
      { id: "characters", label: "🧑 Personajes" },
      { id: "locations", label: "🗺️ Lugares" },
      { id: "mysteries", label: "🧩 Misterios" },
      { id: "events", label: "📅 Eventos" },
      { id: "memories", label: "❤️ Recuerdos" }
    ];
  }

  addEntry(entry) {
    const entries = gameState.state.journal.entries;
    if (!entries.some((e) => e.id === entry.id)) {
      entries.push(entry);
    }
  }

  isEntry(id) {
    return gameState.state.journal.entries.some((e) => e.id === id);
  }

  getEntry(id) {
    return gameState.state.journal.entries.find((e) => e.id === id) || null;
  }

  /** Añade una observación (nuevo descubrimiento). */
  addObservation(creatureId, observationId, note) {
    rewardSystem.give({ type: "creature_observation", creatureId, observationId });
    const entry = this.getEntry("creature_" + creatureId);
    if (entry && note && !entry.notes?.includes(note)) {
      entry.notes = [...(entry.notes || []), note];
    }
  }

  getCompletion() {
    return gameState.state.journal.entries.length;
  }
}

export const journalSystem = new JournalSystem();
