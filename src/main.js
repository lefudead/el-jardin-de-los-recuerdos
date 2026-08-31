/**
 * main.js — punto de entrada (GDD técnico §3, §50-51).
 * Orquestación: Boot → Preload → Menu → Garden, y cambio entre pantallas.
 */
import { boot } from "./scenes/BootScene.js";
import { preload } from "./scenes/PreloadScene.js";
import { initMenu } from "./scenes/MenuScene.js";
import { gardenScene } from "./scenes/GardenScene.js";
import { mapScene } from "./scenes/MapScene.js";
import { openJournal } from "./scenes/JournalScene.js";
import { shopScene } from "./scenes/ShopScene.js";
import { settingsScene } from "./scenes/SettingsScene.js";
import { saveManager } from "./systems/SaveInstance.js";
import { playCinematicIntro } from "./ui/CinematicIntro.js";
import { gameState } from "./systems/GameState.js";
import { dayNight } from "./systems/DayNightSystem.js";
import { eventBus } from "./systems/EventBus.js";
import { narrativeSystem } from "./systems/NarrativeSystem.js";
import { creatureSystem } from "./systems/CreatureSystem.js";
import { captureSystem } from "./systems/CaptureSystem.js";
import { tamingSystem } from "./systems/TamingSystem.js";
import { rewardSystem } from "./systems/RewardSystem.js";
import { economy } from "./systems/EconomyInstance.js";
import { audio } from "./systems/AudioSystem.js";
import { cageForCreature } from "./data/cages.js";
import { foodForCreature } from "./data/foods.js";
import { CONFIG } from "./config.js";
import "./ui/Notification.js";
import "./ui/TopBar.js";
import "./ui/JournalPanel.js";

const Q = (id) => document.getElementById(id);

// Mapeo de pantallas DOM
const SCREENS = ["garden", "map", "journal", "shop", "settings"];

function showScreen(name) {
  SCREENS.forEach((s) => {
    const el = Q("screen-" + s);
    if (el) el.classList.toggle("active", s === name);
  });
  document.querySelectorAll(".nav-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.screen === name);
  });

  // repintar paneles dinámicos
  if (name === "map") mapScene.render();
  if (name === "journal") openJournal();
  if (name === "shop") shopScene.render();

  if (name === "garden") {
    gardenScene.refresh();
  }
}

/** Combina función de cambio de pantalla con la actualización del jardín. */
function switchScreen(name) {
  showScreen(name);
  if (name === "garden") {
    gardenScene.refresh();
  }
}

/** Enlaza los nodos narrativos que dependen de eventos de criatura. */
function wireStory() {
  // Al capturar a Nilo: dialogo de captura + descubrir su alimento favorito
  eventBus.on(eventBus.constructor.EVENTS.CREATURE_CAPTURED, ({ id }) => {
    if (id === "nilo") {
      narrativeSystem.playNode("nilo_captured");
      setTimeout(() => narrativeSystem.playNode("nilo_food"), 400);
    }
  });
  // Al domesticar a Nilo: dialogo de confianza + memoria de la cinta
  eventBus.on(eventBus.constructor.EVENTS.CREATURE_TAMED, ({ id }) => {
    if (id === "nilo") {
      narrativeSystem.playNode("nilo_tamed");
      setTimeout(() => narrativeSystem.playNode("nilo_memory"), 500);
    }
  });
}

async function start() {  await preload();

  const { hadSave } = boot();

  // Escenas de fondo: configurar jardín una vez (se refresca al entrar)
  gardenScene.init(() => {
    // Se podría guardar al cambiar de sesión; aquí solo se registra actividad.
  });
  dayNight.applyBodyClass();

  settingsScene.init();

  // Menú
  initMenu({
    onEnter() {
      playCinematicIntro(() => {
        audio.stopMusic();
        showScreen("garden");
        gardenScene.refresh();
      });
    },
    onReset() {
      audio.stopMusic();
      showScreen("menu");
    }
  });

  // Navegación inferior
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchScreen(btn.dataset.screen));
  });

  wireStory();

  // Guardado automático
  saveManager.startAutosave(CONFIG.autosaveInterval);

  // Guardar al cerrar la pestaña
  window.addEventListener("beforeunload", () => saveManager.saveGame());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") saveManager.saveGame();
  });

  // Si ya hay progreso, mostrar el menú por defecto
  showScreen("menu");
}

// Global de depuración
window.__gardenDebugActive = CONFIG.debug;

// Hooks de depuración (usados por tests CDP y para desarrollo)
window.__garden = {
  get state() { return gameState.state; },
  gardenScene,
  creatureSystem,
  economy,
  grantBouquets: (n) => economy.addBouquets(n),
  addPetals: (n) => economy.addPetals(n),
  spawnNilo() {
    gardenScene._trySpawnNilo();
  },
  spawnNiloForce() {
    if (!creatureSystem.hasActiveEncounter()) {
      creatureSystem.startEncounter("nilo", gameState.state.progression.currentZone, {
        onSteal: () => gardenScene._niloStealsFlower()
      });
    }
    gardenScene._renderNilo();
  },
  setNiloAutoSpawn(v) {
    gardenScene.autoSpawnNilo = !!v;
    return gardenScene.autoSpawnNilo;
  },
  buyCage(creatureId) {
    const cage = cageForCreature(creatureId);
    if (!cage) return "no_cage";
    if (!economy.purchase(cage.cost)) return "afford";
    rewardSystem.give({ type: "cage", id: cage.id, creatureId });
    return "ok";
  },
  buyFood(creatureId) {
    const food = foodForCreature(creatureId);
    if (!food) return "no_food";
    if (!economy.purchase(food.cost)) return "afford";
    rewardSystem.give({ type: "food", id: food.id, creatureId });
    return "ok";
  },
  capture(creatureId) {
    return captureSystem.capture(creatureId);
  },
  feedAndTame(creatureId, taps, withinTime) {
    // Bucle de alimentación: repite la sesión hasta domesticar (máx 8).
    // Representa varias sesiones del minijuego (cada una consume alimento y +20).
    let last = null;
    for (let i = 0; i < 8; i++) {
      if (!tamingSystem.consumeFood(creatureId)) return last || { ok: false, reason: "food", tamed: false };
      last = tamingSystem.runTaming(creatureId, taps == null ? 10 : taps, withinTime !== false, tamingSystem.getConfig(creatureId));
      if (last.tamed) break;
    }
    return last;
  },
  reset() {
    saveManager.resetGame();
    location.reload();
  }
};

start();
