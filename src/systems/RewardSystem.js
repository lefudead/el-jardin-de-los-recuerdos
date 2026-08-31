/**
 * RewardSystem (GDD técnico §120): recompensas unificadas.
 * Todos los sistemas entregan recompensas mediante RewardSystem.give(reward).
 * Tipos: petals, bouquets, item, cage, food, flower, creature_observation,
 * creature_capture, creature_tame, skin, map, decoration, memory, memory_restore,
 * story, story_flag, secret.
 */
import { gameState } from "./GameState.js";
import { economy } from "./EconomyInstance.js";
import { eventBus } from "./EventBus.js";
import { inventorySystem } from "./InventorySystem.js";
import { companionSystem } from "./CompanionSystem.js";

export class RewardSystem {
  give(reward) {
    if (!reward || typeof reward !== "object") return false;

    switch (reward.type) {
      case "petals":
        economy.addPetals(reward.amount || 0);
        return true;

      case "bouquets":
        economy.addBouquets(reward.amount || 0);
        return true;

      case "item":
        inventorySystem.add("items", reward.id, reward.quantity || 1, reward.extra || {});
        return true;

      case "cage":
        inventorySystem.add("cages", reward.id, reward.quantity || 1, { creatureId: reward.creatureId });
        eventBus.emit(eventBus.constructor.EVENTS.CAGE_PURCHASED, { id: reward.id, creatureId: reward.creatureId });
        return true;

      case "food":
        inventorySystem.add("foods", reward.id, reward.quantity || 1, { creatureId: reward.creatureId });
        eventBus.emit(eventBus.constructor.EVENTS.FOOD_PURCHASED, { id: reward.id, creatureId: reward.creatureId });
        return true;

      case "flower":
        if (!gameState.state.unlocks.flowers.includes(reward.id)) {
          gameState.state.unlocks.flowers.push(reward.id);
          eventBus.emit(eventBus.constructor.EVENTS.FLOWER_DISCOVERED, { id: reward.id });
          return true;
        }
        return false;

      case "creature_observation": {
        const creatureId = reward.creatureId;
        const obsId = reward.observationId;
        if (!gameState.state.creatures.discovered.includes(creatureId)) {
          gameState.state.creatures.discovered.push(creatureId);
          gameState.state.stats.creaturesFound++;
          eventBus.emit(eventBus.constructor.EVENTS.CREATURE_FOUND, { id: creatureId });
        }
        const obs = gameState.state.creatures.observations;
        if (!obs[creatureId]) obs[creatureId] = [];
        if (!obs[creatureId].includes(obsId)) {
          obs[creatureId].push(obsId);
          gameState.state.stats.observationsFound++;
          eventBus.emit(eventBus.constructor.EVENTS.OBSERVATION_FOUND, { creatureId, observationId: obsId });
        }
        return true;
      }

      case "creature_capture": {
        const cid = reward.creatureId;
        if (!gameState.state.creatures.captured.includes(cid)) {
          gameState.state.creatures.captured.push(cid);
          gameState.state.stats.creaturesCaptured++;
          eventBus.emit(eventBus.constructor.EVENTS.CREATURE_CAPTURED, { id: cid });
          return true;
        }
        return false;
      }

      case "creature_tame": {
        const cid = reward.creatureId;
        if (!gameState.state.creatures.tamed.includes(cid)) {
          gameState.state.creatures.tamed.push(cid);
          gameState.state.stats.creaturesTamed++;
          eventBus.emit(eventBus.constructor.EVENTS.CREATURE_TAMED, { id: cid });
          // Nueva compañera: se activa como apoyo si hay hueco libre.
          companionSystem.autoActivate(cid);
          return true;
        }
        return false;
      }

      case "skin":
        if (!gameState.state.unlocks.skins.includes(reward.id)) {
          gameState.state.unlocks.skins.push(reward.id);
          return true;
        }
        return false;

      case "map": {
        if (!gameState.state.unlocks.maps.includes(reward.id)) {
          gameState.state.unlocks.maps.push(reward.id);
          eventBus.emit(eventBus.constructor.EVENTS.MAP_UNLOCKED, { id: reward.id });
          return true;
        }
        return false;
      }

      case "memory":
        if (!gameState.state.memories.found.includes(reward.id)) {
          gameState.state.memories.found.push(reward.id);
          gameState.state.stats.memoriesFound++;
          eventBus.emit(eventBus.constructor.EVENTS.MEMORY_FOUND, { id: reward.id });
          return true;
        }
        return false;

      case "memory_restore":
        if (!gameState.state.memories.restored.includes(reward.id)) {
          gameState.state.memories.restored.push(reward.id);
          if (!gameState.state.memories.found.includes(reward.id)) {
            gameState.state.memories.found.push(reward.id);
          }
          gameState.state.stats.memoriesFound++;
          eventBus.emit(eventBus.constructor.EVENTS.MEMORY_RESTORED, { id: reward.id });
          return true;
        }
        return false;

      case "story":
        gameState.state.progression.storyProgress = Math.max(
          gameState.state.progression.storyProgress,
          reward.amount || 0
        );
        eventBus.emit(eventBus.constructor.EVENTS.STORY_PROGRESS, { amount: reward.amount });
        return true;

      case "story_flag":
        if (reward.key) {
          const changed = !gameState.state.storyFlags[reward.key];
          gameState.state.storyFlags[reward.key] = true;
          return changed;
        }
        return false;

      case "secret":
        if (!gameState.state.journal.secrets.includes(reward.id)) {
          gameState.state.journal.secrets.push(reward.id);
          gameState.state.stats.secretsFound++;
          eventBus.emit(eventBus.constructor.EVENTS.SECRET_FOUND, { id: reward.id });
          return true;
        }
        return false;

      default:
        return false;
    }
  }
}

export const rewardSystem = new RewardSystem();
