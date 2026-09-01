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
import { flowerSystem } from "./systems/FlowerInstance.js";
import { autoGenerateSystem } from "./systems/AutoGenerateSystem.js";
import { companionSystem } from "./systems/CompanionSystem.js";
import { investigationSystem } from "./systems/InvestigationSystem.js";
import { playCinematicIntro } from "./ui/CinematicIntro.js";
import { gameState } from "./systems/GameState.js";
import { dayNight } from "./systems/DayNightSystem.js";
import { eventBus } from "./systems/EventBus.js";
import { narrativeSystem } from "./systems/NarrativeSystem.js";
import { dialogBox } from "./ui/DialogBox.js";
import { creatureSystem } from "./systems/CreatureSystem.js";
import { captureSystem } from "./systems/CaptureSystem.js";
import { tamingSystem } from "./systems/TamingSystem.js";
import { rewardSystem } from "./systems/RewardSystem.js";
import { economy } from "./systems/EconomyInstance.js";
import { buffSystem } from "./systems/BuffSystem.js";
import { POTIONS } from "./data/potions.js";
import { FLOWERS } from "./data/flowers.js";
import { audio } from "./systems/AudioSystem.js";
import { youtubeMusic, parseUrl } from "./systems/YoutubeMusicSystem.js";
import { cageForCreature, cageCost } from "./data/cages.js";
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

  // Ciclo día/noche vinculado al tiempo real del jugador.
  dayNight.startRealTimeSync();

  // Apoyos farmean pasivamente monedas de su zona elegida.
  companionSystem.startFarming();

  eventBus.on(eventBus.constructor.EVENTS.TIME_CHANGED, () => {
    // El estilo global del <body> siempre refleja la noche.
    dayNight.applyBodyClass();
    // Si el jardín está visible, repuebla las flores según el nuevo momento
    // (funciona en cualquier zona: jardín o bosque).
    const gardenActive = document.getElementById("screen-garden")?.classList.contains("active");
    if (gardenActive) gardenScene.refresh();
  });

  settingsScene.init();
  youtubeMusic.init();

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

  // Relojes: generación pasiva del recurso de la zona activa
  autoGenerateSystem.start();

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
  mapScene,
  creatureSystem,
  investigation: investigationSystem,
  economy,
  audio,
  dayNight,
  config: CONFIG,
  flowerSystem,
  flowers: () => FLOWERS,
  flowersForZone: (z, t) => flowerSystem.flowersForZone(z, t).map((f) => f.id),
  audioDebug: () => ({ track: audio.currentTrack, melody: !!audio.currentMelody, ctx: audio.ctx ? audio.ctx.state : null, elSrc: audio.musicElement ? audio.musicElement.src : null, elPaused: audio.musicElement ? audio.musicElement.paused : null, sourceConnected: !!audio.musicSource }),
  youtubeMusic: {
    status: () => youtubeMusic.statusText,
    active: () => youtubeMusic.isActive(),
    settings: () => ({ ...(gameState.settings.externalMusic || {}) }),
    enable: () => youtubeMusic.enable(),
    disable: () => youtubeMusic.disable(),
    loadByUrl: (url) => youtubeMusic.loadUrl(url),
    parse: (url) => parseUrl(url)
  },
  grantBouquets: (n) => economy.addBouquets(n),
  addPetals: (n) => economy.addPetals(n),
  // Debug amistad: consultar y forzar (tests)
  friendship: () => ({ ...(gameState.state.creatures.friendship || {}) }),
  setFriendship: (cid, v) => { const f = gameState.state.creatures.friendship || (gameState.state.creatures.friendship = {}); f[cid] = v; saveManager.saveGame(); return f[cid]; },
  friendshipFlowerBonus: () => flowerSystem.friendshipFlowerBonus(),
  effectiveZoneCapacity: (z) => flowerSystem.effectiveZoneCapacity(z || gameState.state.progression.currentZone),
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
  // Camaleón del bosque (Moss): helpers de depuración para tests.
  spawnMossForce() {
    gardenScene._spawnMoss();
    return !!gardenScene.mossState;
  },
  mossActive: () => !!gardenScene.mossState,
  mossTap() {
    gardenScene._onMossTap();
    return !!gardenScene.mossState;
  },
  // Base de pociones (hongos como ingrediente).
  potions: () => POTIONS,
  buff: buffSystem,
  buffActive: () => buffSystem.hasPotions(),
  spawnRareMushroom: () => { gardenScene._spawnRareMushroom(); return gardenScene.flowers.some((f) => f.flower?.id === "mushroom"); },
  usePotion(id) {
    const p = POTIONS[id];
    if (!p) return { ok: false, reason: "no_potion" };
    if (!economy.spendResource("mushrooms", p.mushroomCost)) return { ok: false, reason: "afford" };
    buffSystem.apply(p.effect, p.durationMs);
    return { ok: true, potion: p };
  },
  buyCage(creatureId) {
    const cage = cageForCreature(creatureId);
    if (!cage) return "no_cage";
    if (!economy.purchase(cageCost(cage))) return "afford";
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
  companion: {
    list: () => companionSystem.getCompanions().map((c) => c.id),
    active: () => (gameState.state.companions?.active || []).slice(),
    maxActive: () => companionSystem.maxActive(),
    toggle: (id) => companionSystem.toggleActive(id),
    buySlot: () => companionSystem.buySlot(),
    setFarmZone: (id, zone) => companionSystem.setFarmZone(id, zone),
    getFarmZone: (id) => companionSystem.getFarmZone(id),
    farmableZones: () => companionSystem.farmableZones().map((z) => z.id),
    tickFarm: () => companionSystem.tickFarm()
  },
  reset() {
    saveManager.resetGame();
    location.reload();
  },
  niloSpawnDebug() {
    return {
      autoSpawn: gardenScene.autoSpawnNilo,
      disposed: gardenScene._disposed,
      zone: gameState.state.progression.currentZone,
      captured: creatureSystem.isCaptured("nilo"),
      activeEncounter: creatureSystem.hasActiveEncounter(),
      dialogVisible: dialogBox.visible,
      niloMeetDone: narrativeSystem.isDone("nilo_meet"),
      canSpawn: gardenScene._canSpawnNilo()
    };
  }
};

start();
