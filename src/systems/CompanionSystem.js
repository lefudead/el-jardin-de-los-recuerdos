/**
 * CompanionSystem (GDD técnico §141, GDD §27-29, §35, §96-102).
 * Criaturas domesticadas: habilidades y producción pasiva.
 */
import { CREATURES } from "../data/creatures.js";
import { COMPANIONS, companionForCreature } from "../data/companions.js";
import { gameState } from "./GameState.js";
import { economy } from "./EconomyInstance.js";
import { eventBus } from "./EventBus.js";
import { chance } from "../utils/random.js";

export class CompanionSystem {
  getCompanions() {
    return gameState.state.creatures.tamed.map((id) => CREATURES[id]).filter(Boolean);
  }

  isCompanion(creatureId) {
    return gameState.state.creatures.tamed.includes(creatureId);
  }

  skillFor(creatureId) {
    const c = CREATURES[creatureId];
    if (!c || !this.isCompanion(creatureId)) return null;
    if (c.companionSkill?.id) return COMPANIONS[c.companionSkill.id] || null;
    return companionForCreature(creatureId);
  }

  hasSkill(skillId) {
    return this.getCompanions().some((c) => {
      const skill = this.skillFor(c.id);
      return skill && skill.id === skillId;
    });
  }

  /**
   * Invocado en cada tap de flor. Aplica la producción pasiva de compañeros
   * (p. ej. Nilo recolector devuelve pétalo extra con cierta probabilidad).
   * Devuelve el pétalo extra concedido (0 si ninguno).
   */
  applyTapBonus() {
    let extra = 0;
    for (const companion of this.getCompanions()) {
      const skill = this.skillFor(companion.id);
      if (!skill?.effect) continue;
      const pChance = skill.effect.bonusPetalChance;
      if (typeof pChance === "number" && pChance > 0 && chance(pChance)) {
        extra += 1;
        if (!companion._biasIncrement) companion._biasIncrement = 0;
        companion._biasIncrement++;
      }
    }
    if (extra > 0) {
      economy.addPetals(extra);
      eventBus.emit(eventBus.constructor.EVENTS.CREATURE_HELPED, { amount: extra });
    }
    return extra;
  }
}

export const companionSystem = new CompanionSystem();
