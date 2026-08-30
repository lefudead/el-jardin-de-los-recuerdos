/**
 * EventSystem (GDD técnico §28-29): eventos temporales.
 */
import { EVENTS } from "../data/events.js";
import { gameState } from "./GameState.js";

export class EventSystem {
  getAll() {
    return Object.values(EVENTS);
  }

  isComplete(eventId) {
    return gameState.state.events.completed.includes(eventId);
  }

  complete(eventId) {
    if (!this.isComplete(eventId)) {
      gameState.state.events.completed.push(eventId);
      return true;
    }
    return false;
  }
}

export const eventSystem = new EventSystem();
