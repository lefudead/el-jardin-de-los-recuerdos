/**
 * Entidad Creature (GDD técnico §15). Representación en tiempo de ejecución.
 */
export class Creature {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.personality = data.personality || [];
    this.zone = data.zone;
    this.schedule = data.schedule;
    this.behaviors = data.behaviors || [];
    this.observations = data.observations || [];
    this.emoji = data.emoji;
    this.active = false;
  }

  /** ¿Está activo en una hora determinada? */
  isActiveAt(hour) {
    const s = this.schedule;
    if (!s) return true;
    if (s.end > s.start) return hour >= s.start && hour < s.end;
    // cruza la medianoche
    return hour >= s.start || hour < s.end;
  }
}
