/**
 * RelaxationSystem (GDD §42-43, GDD técnico §38): experiencias de descanso.
 * Esqueleto para hitos futuros (Rincón de descanso, respiración).
 */
export class RelaxationSystem {
  constructor() {
    this.breathing = false;
    this.timer = null;
  }

  /** Secuencia de respiración opcional (nunca obligatoria). */
  startBreathing(onPhase) {
    this.stopBreathing();
    this.breathing = true;
    const phases = [
      { label: "Inhala", ms: 4000 },
      { label: "Mantén", ms: 2000 },
      { label: "Exhala", ms: 6000 }
    ];
    let i = 0;
    const step = () => {
      if (!this.breathing) return;
      const phase = phases[i % phases.length];
      onPhase?.(phase.label);
      this.timer = setTimeout(() => { i++; step(); }, phase.ms);
    };
    step();
  }

  stopBreathing() {
    this.breathing = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

export const relaxation = new RelaxationSystem();
