/**
 * Entidad Player (GDD técnico §32). Estado del jugador en tiempo de ejecución.
 */
export class Player {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.lastInputTime = 0;
  }

  /** Tiempo que el jugador lleva sin interactuar (ms). */
  idleDuration(now) {
    return now - this.lastInputTime;
  }

  /** Registra actividad del jugador. */
  registerInput(now = Date.now()) {
    this.lastInputTime = now;
  }
}
