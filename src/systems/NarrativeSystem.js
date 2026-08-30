/**
 * NarrativeSystem: dispara nodos de historia (GDD §50-57, §123-124).
 * Evalúa requisitos, reproduce nodos y sus cadenas `next` usando DialogBox
 * y registra flags para no repetir.
 */
import { STORY, storyById } from "../data/story.js";
import { gameState } from "./GameState.js";
import { eventBus } from "./EventBus.js";
import { rewardSystem } from "./RewardSystem.js";
import { journalSystem } from "./JournalSystem.js";
import { memoOf } from "./NarrativeHelpers.js";
import { dialogBox } from "../ui/DialogBox.js";

export class NarrativeSystem {
  constructor() {
    this.onDialogsComplete = null;
  }

  isDone(id) {
    return !!gameState.state.storyFlags["story_done_" + id];
  }

  markDone(id) {
    gameState.state.storyFlags["story_done_" + id] = true;
  }

  /** Evalúa un nombre de requisito (p. ej. taps_5, research_nilo, captured_nilo). */
  meetsRequirement(req) {
    if (typeof req !== "string") return true;
    if (req.startsWith("taps_")) {
      const n = parseInt(req.slice(5), 10);
      return gameState.state.stats.totalTaps >= n;
    }
    if (req === "story_anomaly") return !!gameState.state.storyFlags.anomaly_shown;
    if (req.startsWith("research_")) {
      const cid = req.slice(9);
      return memoOf(cid).researchReady;
    }
    if (req.startsWith("captured_")) {
      return memoOf(req.slice(9)).captured;
    }
    if (req.startsWith("tamed_")) {
      return memoOf(req.slice(6)).tamed;
    }
    if (req === "story_10") return gameState.state.progression.storyProgress >= 10;
    if (req === "story_20") return gameState.state.progression.storyProgress >= 20;
    if (req === "story_final") return gameState.state.progression.storyProgress >= 100;
    return false;
  }

  /** Comprueba si algún nodo pendiente puede dispararse. */
  checkAutoNodes() {
    // Intenta reproducir cualquier nodo "next" pendiente en orden
    for (const node of Object.values(STORY)) {
      if (this.isDone(node.id)) continue;
      if (!node.auto) continue; // solo nodos marcados como automáticos
      if (!node.requirements.every((r) => this.meetsRequirement(r))) continue;
      this.playNode(node.id);
      return;
    }
    return false;
  }

  /** Reproduce un nodo y su cadena next. oneShot evita repetir. */
  playNode(id) {
    const startNode = storyById(id);
    if (!startNode) return false;
    if (startNode.oneShot && this.isDone(id)) return false;

    // Construir la cadena a partir de `next`
    let node = startNode;
    const lines = [];
    let timerCursor = null;
    while (node) {
      lines.push({
        speaker: node.speaker || "Narradora",
        text: node.text,
        emoji: this._emojiFor(node)
      });
      if (node.tutorial) timerCursor = node.tutorial;
      const nextId = node.next;
      // aplicar efectos del nodo
      if (node.effect) this._applyEffect(node.effect);
      if (node.memory) rewardSystem.give({ type: "memory", id: node.memory });
      if (typeof node.progress === "number") {
        rewardSystem.give({ type: "story", amount: node.progress });
      }
      // marcar como hecho (uno por cada nodo de la cadena)
      this.markDone(node.id);
      const singleDone = node;
      node = nextId ? storyById(nextId) : null;
      if (node) {
        if (node.oneShot && this.isDone(node.id)) node = null;
      }
      void singleDone;
    }

    dialogBox.show(lines, {
      onDone: () => {
        if (timerCursor) eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, { text: this._tutorialText(timerCursor) });
        this._postProgress();
        if (this.onDialogsComplete) this.onDialogsComplete();
      }
    });
    return true;
  }

  _tutorialText(tutorial) {
    if (tutorial === "tap") return "🌷 Toca las flores para recoger pétalos. Cada 10 forman un ramo.";
    if (tutorial === "nilo_tap") return "⚠️ ¡Toca a Nilo 3 veces para detenerlo!";
    return "";
  }

  _emojiFor(node) {
    if (!node) return "";
    if (node.id?.startsWith("nilo")) return "🐆";
    if (node.id?.startsWith("intro")) return "🏠";
    return "📖";
  }

  /** Aplica un efecto textual del nodo (p. ej. hint_nilo). */
  _applyEffect(effect) {
    if (!effect) return;
    if (effect === "hint_nilo") {
      gameState.state.storyFlags.anomaly_shown = true;
    }
  }

  _postProgress() {
    // registrar la entrada en el diario del capítulo actual
    const ch = this._currentChapterId();
    if (ch && !journalSystem.isEntry(ch)) {
      journalSystem.addEntry({ id: ch, text: "Capítulo registrado en el diario." });
    }
  }

  _currentChapterId() {
    const p = gameState.state.progression.storyProgress;
    if (p >= 60) return "chapter_4";
    if (p >= 40) return "chapter_3";
    if (p >= 20) return "chapter_2";
    if (p >= 10) return "chapter_1";
    return "intro";
  }

  /** Reproduce la introducción si es una partida nueva. */
  tryIntro() {
    if (gameState.state.storyFlags.intro_started) return false;
    gameState.state.storyFlags.intro_started = true;
    this.playNode("intro_house");
    return true;
  }

  /** Intenta el tutorial de Nilo cuando aparece. */
  tryNiloTutorial() {
    const inMeet = gameState.state.storyFlags.nilo_meet_done;
    const wantMeet =
      gameState.state.stats.totalTaps >= 15 &&
      !!gameState.state.storyFlags.anomaly_shown &&
      !inMeet &&
      !this.isDone("nilo_meet");
    if (wantMeet) {
      this.playNode("nilo_meet");
      return true;
    }
    return false;
  }
}

export const narrativeSystem = new NarrativeSystem();
