/**
 * SecretSystem (GDD técnico §26-27): detección de secretos.
 * MVP: admite tap_sequence (tocar una flor N veces).
 */
import { gameState } from "./GameState.js";
import { rewardSystem } from "./RewardSystem.js";
import { eventBus } from "./EventBus.js";
import { CONFIG } from "../config.js";

// Registro de taps por flor para detectar secuencias ocultas.
const tapCounters = {};

/** Configuración de secretos por tap_sequence. */
const TAP_SECRETS = [
  {
    id: "hidden_flower_room",
    flower: "daisy",
    taps: 11,
    reward: { type: "secret", id: "hidden_flower_room" },
    message: "✨ ... La tierra se aparta y descubres una pequeña habitación escondida."
  }
];

export class SecretSystem {
  /** NOTA: deben limpiarse los contadores al cambiar de sesión/escena. */
  static resetCounters() {
    for (const k in tapCounters) delete tapCounters[k];
  }

  /** Registra un tap en una flor y comprueba secretos por secuencia. */
  onFlowerTap(flowerId) {
    if (gameState.state.journal.secrets.includes("hidden_flower_room")) return;

    const secret = TAP_SECRETS.find(
      (s) => s.flower === flowerId && !gameState.state.journal.secrets.includes(s.id)
    );
    if (!secret) return;

    tapCounters[flowerId] = (tapCounters[flowerId] || 0) + 1;
    if (tapCounters[flowerId] >= secret.taps) {
      rewardSystem.give(secret.reward);
      eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, { text: secret.message });
    }
  }
}

export const secretSystem = new SecretSystem();
