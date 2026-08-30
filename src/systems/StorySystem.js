/**
 * StorySystem (GDD técnico §30-31): progreso de historia.
 */
import { STORY } from "../data/story.js";
import { gameState } from "./GameState.js";
import { eventBus } from "./EventBus.js";

export class StorySystem {
  getProgress() {
    return gameState.state.progression.storyProgress;
  }

  setProgress(amount) {
    const prev = this.getProgress();
    if (amount > prev) {
      gameState.state.progression.storyProgress = amount;
      eventBus.emit(eventBus.constructor.EVENTS.STORY_PROGRESS, { amount, previous: prev });
    }
  }

  getCurrentChapter() {
    const p = this.getProgress();
    const chapters = Object.values(STORY).filter((n) => n.progress <= p);
    return chapters.length ? chapters[chapters.length - 1] : null;
  }
}

export const storySystem = new StorySystem();
