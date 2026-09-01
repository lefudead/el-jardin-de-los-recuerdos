/**
 * GardenScene (GDD técnico §50, GDD §51-53, §40).
 * DOM-based para el prototipo web.
 * Responsabilidades:
 *  - colocar flores según la zona y el momento del día
 *  - gestionar el tap (feedback, recompensa, sonido, bonos de compañero)
 *  - reaparecer flores
 *  - detectar secretos por secuencia de taps
 *  - encuentro de criatura (Nilo): aparece, roba, 3 taps para detenerlo
 *  - dispara nodos narrativos (intro, anomalía, tutorial de Nilo)
 */
import { flowerSystem } from "../systems/FlowerInstance.js";
import { farming, rewardCurrencyForZone } from "../systems/FarmingSystem.js";
import { audio } from "../systems/AudioSystem.js";
import { secretSystem } from "../systems/SecretSystem.js";
import { dayNight } from "../systems/DayNightSystem.js";
import { gameState as gs } from "../systems/GameState.js";
import { FLOWERS } from "../data/flowers.js";
import { MAPS } from "../data/maps.js";
import { CREATURES } from "../data/creatures.js";
import { CONFIG } from "../config.js";
import { randomBetween, chance } from "../utils/random.js";
import { topBar } from "../ui/TopBar.js";
import { creatureSystem } from "../systems/CreatureSystem.js";
import { companionSystem } from "../systems/CompanionSystem.js";
import { narrativeSystem } from "../systems/NarrativeSystem.js";
import { eventBus } from "../systems/EventBus.js";
import { dialogBox } from "../ui/DialogBox.js";
import { saveManager } from "../systems/SaveInstance.js";
import { economy } from "../systems/EconomyInstance.js";
import { investigationSystem } from "../systems/InvestigationSystem.js";

const Q = (id) => document.getElementById(id);

export class GardenScene {
  constructor() {
    this.container = null;
    this.flowers = []; // { el, flower, respawnTimer, active }
    this.niloEl = null;
    this.niloTimer = null;
    this._disposed = false;
    this._tapCountSinceCheck = 0;
    this.autoSpawnNilo = true;
    this._niloSpawnTimer = null;
    this._niloTutorialPending = false;
    this._niloTutorialProbe = null;
    // Camaleón del bosque (Moss)
    this.mossEl = null;
    this.mossState = null;
    this._mossRevealTimer = null;
    this._mossMoveTimer = null;
    // Partículas flotantes (recursos que rebotan)
    this._floatingParticles = [];
    this._particleRafId = null;
    // Flores en movimiento: derivan y rebotan por el jardín (dificultan el tap)
    this._flowerRafId = null;
  }

  /** Configura el contenedor y los listeners del área. */
  init(onEachFlowerTap) {
    this.container = Q("garden-area");
    this.onEachFlowerTap = onEachFlowerTap || (() => {});
    if (this._niloSpawnTimer) {
      clearInterval(this._niloSpawnTimer);
      this._niloSpawnTimer = null;
    }
    this._niloSpawnTimer = setInterval(() => this._autoSpawnTick(), CONFIG.nilo.spawnIntervalMs || 30000);
    // Al alimentar/cuidar sube la amistad: reequilibramos el campo por si cambió
    // la capacidad (cada 200 amistad = +1 flor extra que regala Nilo).
    eventBus.on(eventBus.constructor.EVENTS.CREATURE_FED, () => this._rebalanceFlowers());
  }

  dispose() {
    if (this._niloSpawnTimer) {
      clearInterval(this._niloSpawnTimer);
      this._niloSpawnTimer = null;
    }
    if (this._niloTutorialProbe) {
      clearInterval(this._niloTutorialProbe);
      this._niloTutorialProbe = null;
    }
    this._niloTutorialPending = false;
    this._disposed = true;
    this._removeNilo();
    this._removeMoss();
    this.clear();
  }

  /** Rellena el jardín con flores de la zona/momento actuales. */
  populate() {
    this.clear();
    const zone = gs.state.progression.currentZone;
    const time = gs.state.progression.timeOfDay;
    const capacity = flowerSystem.effectiveZoneCapacity(zone);
    const spawned = flowerSystem.spawnFlowers(zone, time, capacity);

    for (const s of spawned) {
      this.addFlower(s.id, s.x, s.y);
    }

    // Narrativa de introducción (solo partida nueva)
    this._maybeIntro();
    this._checkNiloAfterEnter();
  }

  addFlower(flowerId, xPct, yPct) {
    if (!this.container) return;
    const data = FLOWERS[flowerId];
    if (!data) return;

    const el = document.createElement("div");
    el.className = "flower";
    el.textContent = data.emoji;
    el.style.left = xPct + "%";
    el.style.top = yPct + "%";

    const label = document.createElement("div");
    label.className = "flower-label";
    label.textContent = `${data.name} +${data.petalValue}`;
    if (rewardCurrencyForZone(data.zone)) {
      label.textContent = `${data.name} +${data.petalValue} 🍃`;
    }
    el.appendChild(label);

    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this.onFlowerTap(data.id, el);
    });

    this.container.appendChild(el);
    const entry = { el, flower: data, timer: null, active: true };
    this.flowers.push(entry);
    this._registerFlowerMotion(entry);
  }

  /** Lógica de tap: feedback, recompensa y reaparición. */
  onFlowerTap(flowerId, el) {
    const entry = this.flowers.find((f) => f.el === el && f.active);
    if (!entry) return;

    // feedback visual
    el.classList.add("pressed");
    setTimeout(() => el.classList.remove("pressed"), 90);

    // partícula de pétalo / recurso flotante
    this.spawnPetal(entry);

    // El hongo rarísimo se recoge y se va (no respawnea, persiste hasta recogerlo).
    if (entry.flower?.id === "mushroom" && entry.flower?.special?.type === "rare_dropped") {
      economy.addResource("mushrooms", 1);
      eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, {
        text: "🍄 ¡Recogiste un Hongo Mágico! Se guarda para hacer pociones."
      });
      entry.active = false;
      if (entry.el && entry.el.parentNode) entry.el.remove();
      this.flowers = this.flowers.filter((f) => f !== entry);
      audio.playPetal();
      this._regenerateImmediatelyIfEmpty();
      return;
    }

    // recompensa vía FarmingSystem
    const result = farming.tapFlower(flowerId);

    // bonus pasivo de compañeros (Nilo recolector)
    companionSystem.applyTapBonus();

    if (result) {
      audio.playPetal();
      if (result.convertedBouquets > 0) {
        audio.playBouquet();
      }
    }

    // Al recolectar una hoja del bosque, puede asomar un hongo rarísimo (1/1000).
    this._trySpawnRareMushroom(flowerId);

    // secretos por secuencia de taps
    secretSystem.onFlowerTap(flowerId);

    // narrativa por taps: anomalía a los 5, encuentro de Nilo a los 15
    this._tapCountSinceCheck++;
    this._checkNarrativeTaps();

    // spawn rápido de Nilo (0.5%) al recoger una flor
    this._tryTapSpawn();

    this.onEachFlowerTap();

    // desactivar y agendar reaparición
    this.hideThenRespawn(entry);

    // si se recogieron todas las flores, regenerarlas inmediatamente
    this._regenerateImmediatelyIfEmpty();
  }

  /** 1/1000 al recolectar una hoja del bosque: asoma un hongo que persiste. */
  _trySpawnRareMushroom(flowerId) {
    const flower = FLOWERS[flowerId];
    if (!flower) return;
    if (gs.state.progression.currentZone !== "whispering_forest") return;
    if (this.flowers.some((f) => f.flower?.id === "mushroom")) return;
    const special = flower.special;
    // Solo las hojas/vegetación del bosque cuentan como "hoja recogida".
    const isLeaf = flowerId.startsWith("forest_") && flower.zone === "whispering_forest";
    const chanceVal = typeof special?.chance === "number" ? special.chance : 0.001;
    if (isLeaf && chance(chanceVal)) {
      this._spawnRareMushroom();
    }
  }

  /** Coloca un hongo raro en el campo, persistente hasta recogerlo. */
  _spawnRareMushroom() {
    if (!this.container) return;
    if (this.flowers.length >= 60) return;
    const m = FLOWERS.mushroom;
    const el = document.createElement("div");
    el.className = "flower mushroom-raro";
    el.textContent = m.emoji;
    el.style.left = randomBetween(15, 85) + "%";
    el.style.top = randomBetween(18, 70) + "%";
    const label = document.createElement("div");
    label.className = "flower-label";
    label.textContent = `${m.name} +${m.petalValue} 🍄`;
    el.appendChild(label);
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this.onFlowerTap(m.id, el);
    });
    this.container.appendChild(el);
    // Sin timer: el hongo persiste hasta que se recoge.
    this.flowers.push({ el, flower: m, timer: null, active: true, persist: true });
    eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, {
      text: "🍄 ¡Apareció un Hongo Mágico entre las hojas! Recógelo."
    });
    saveManager.saveGame();
  }

  _checkNarrativeTaps() {
    // Anomalía a los 5 taps (aviso de Nilo)
    if (!gs.state.storyFlags.anomaly_shown && gs.state.stats.totalTaps >= 5) {
      gs.state.storyFlags.anomaly_shown = true;
      eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, {
        text: "🌿 Algo corre entre las flores... no llegas a verlo bien."
      });
    }
    // Ruido de Nilo a partir de ciertos taps, si aún no domesticado.
    // Si el tutorial acaba de dispararse, programamos que Nilo aparezca
    // garantizado en cuanto su diálogo se cierre (en vez de dejar que dependa
    // de la aparición aleatoria, que podía no ocurrir nunca de inmediato).
    if (gs.state.stats.totalTaps >= 15) {
      if (narrativeSystem.tryNiloTutorial()) {
        this._scheduleNiloSpawn();
      }
    }
  }

  /**
   * Asegura que Nilo aparezca determinísticamente justo después del primer
   * tutorial (texto: "Tócalo 3 veces"). Sondea cada 500 ms hasta que la escena
   * pueda spawnearlo (diálogo fuera de pantalla, zona y flags correctos) o
   * abandona tras 20 s para que la aparición aleatoria normal tome el relevo.
   */
  _scheduleNiloSpawn() {
    if (this._niloTutorialProbe) {
      clearInterval(this._niloTutorialProbe);
      this._niloTutorialProbe = null;
    }
    this._niloTutorialPending = true;
    this._niloTutorialProbe = setInterval(() => {
      if (this._disposed || !this._niloTutorialPending) {
        if (this._niloTutorialProbe) { clearInterval(this._niloTutorialProbe); this._niloTutorialProbe = null; }
        return;
      }
      if (!this._canSpawnNilo()) return; // aún hay diálogo abierto o zona cambiada
      this._niloTutorialPending = false;
      if (this._niloTutorialProbe) { clearInterval(this._niloTutorialProbe); this._niloTutorialProbe = null; }
      this._trySpawnNilo();
    }, 500);

    // Autolimpieza: si algo impide el spawn, volvemos al comportamiento aleatorio.
    setTimeout(() => {
      if (this._niloTutorialProbe) {
        clearInterval(this._niloTutorialProbe);
        this._niloTutorialProbe = null;
      }
      this._niloTutorialPending = false;
    }, 20000);
  }

  /** Oculta la flor y la agenda para reaparecer. */
  hideThenRespawn(entry) {
    if (!entry.active) return;
    entry.active = false;
    entry.el.classList.add("faded");

    const baseMin = 8000;
    const baseMax = 15000;
    const delay = flowerSystem.respawnTime(baseMin, baseMax);

    entry.timer = setTimeout(() => this.respawn(entry), delay);

    entry.el.addEventListener("pointerdown", (e) => e.preventDefault());
  }

  respawn(entry) {
    if (this._disposed) return;
    const zone = gs.state.progression.currentZone;
    const time = gs.state.progression.timeOfDay;

    const available = flowerSystem.flowersForZone(zone, time);
    if (available.length === 0) {
      entry.active = true;
      entry.el.classList.remove("faded");
      this._registerFlowerMotion(entry);
      return;
    }
    const pick = available[randomBetween(0, available.length - 1)];
    entry.flower = pick;
    entry.el.textContent = pick.emoji;
    const label = entry.el.querySelector(".flower-label");
    if (label) label.textContent = `${pick.name} +${pick.petalValue}`;
    entry.el.classList.remove("faded");
    entry.active = true;

    entry.el.style.left = randomBetween(15, 85) + "%";
    entry.el.style.top = randomBetween(18, 70) + "%";
    this._registerFlowerMotion(entry);
  }

  /** Crea una partícula de pétalo que sube desde la flor. */
  /** Crea partículas de recurso que rebotan por el jardín. */
  spawnPetal(entry) {
    if (!this.container || !entry || !entry.el) return;
    const el = entry.el;
    const flower = entry.flower;
    const rect = el.getBoundingClientRect();
    const areaRect = this.container.getBoundingClientRect();
    const x = rect.left - areaRect.left + rect.width / 2;
    const y = rect.top - areaRect.top + rect.height / 2;

    // Emojis según zona / flor
    const zone = gs.state.progression.currentZone;
    const emojis = [flower?.emoji || "🌸"];
    if (zone === "whispering_forest") {
      emojis.push("🍃", "🍂", "🍄");
    } else {
      emojis.push("🌸", "🌼", "✨");
    }

    // Partículas con movimiento y rebote
    const count = randomBetween(3, 5);
    for (let i = 0; i < count; i++) {
      const emoji = emojis[i % emojis.length];
      const p = document.createElement("div");
      p.className = "floating-particle";
      p.textContent = emoji;
      p.style.left = x + "px";
      p.style.top = y + "px";
      p.style.fontSize = randomBetween(12, 22) + "px";
      this.container.appendChild(p);

      const angle = Math.random() * Math.PI * 2;
      const speed = randomBetween(1.2, 3.5);
      this._floatingParticles.push({
        el: p,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 0,
        maxLife: randomBetween(60, 120),
      });
    }

    if (!this._particleRafId) this._particleLoop();

    // Destello de brillo
    const sp = document.createElement("div");
    sp.className = "sparkle";
    sp.textContent = "✨";
    sp.style.left = x + "px";
    sp.style.top = y - 10 + "px";
    this.container.appendChild(sp);
    setTimeout(() => sp.remove(), 500);
  }

  /** Loop de requestAnimationFrame para mover y rebotar las partículas. */
  _particleLoop() {
    if (!this.container) return;
    const areaRect = this.container.getBoundingClientRect();
    const maxW = areaRect.width;
    const maxH = areaRect.height;

    for (let i = this._floatingParticles.length - 1; i >= 0; i--) {
      const p = this._floatingParticles[i];
      p.life++;
      p.vy += 0.04; // gravedad suave
      p.x += p.vx;
      p.y += p.vy;

      // Rebote en bordes
      if (p.x <= 0) { p.x = 0; p.vx *= -0.75; }
      else if (p.x >= maxW) { p.x = maxW; p.vx *= -0.75; }
      if (p.y <= 0) { p.y = 0; p.vy *= -0.75; }
      else if (p.y >= maxH) { p.y = maxH; p.vy *= -0.75; }

      // Desvanecer al final
      const fadeStart = p.maxLife * 0.65;
      const opacity = p.life > fadeStart ? 1 - (p.life - fadeStart) / (p.maxLife - fadeStart) : 1;

      p.el.style.left = p.x + "px";
      p.el.style.top = p.y + "px";
      p.el.style.opacity = opacity;

      if (p.life >= p.maxLife) {
        p.el.remove();
        this._floatingParticles.splice(i, 1);
      }
    }

    if (this._floatingParticles.length > 0) {
      this._particleRafId = requestAnimationFrame(() => this._particleLoop());
    } else {
      this._particleRafId = null;
    }
  }

  /** Asigna movimiento suave a una flor activa (derivan y rebotan en los bordes
   *  del jardín, lo que hace más difícil acertarles el tap). El hongo raro no
   *  se mueve: es un encuentro puntual. */
  _registerFlowerMotion(entry) {
    if (!entry || !entry.el) return;
    if (entry.flower?.id === "mushroom") return;
    if (!entry.active) return;
    const speed = randomBetween(0.35, 1.1);
    const a = Math.random() * Math.PI * 2;
    entry.motion = {
      x: 0,
      y: 0,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed
    };
    if (!this._flowerRafId) this._flowerLoop();
  }

  /** Loop de requestAnimationFrame: mueve las flores activas y las rebota en
   *  los bordes usando --dx/--dy (offset en px sobre la posición base en %). */
  _flowerLoop() {
    if (!this.container) return;
    const area = this.container.getBoundingClientRect();
    const maxW = area.width;
    const maxH = area.height;
    let any = false;
    for (const f of this.flowers) {
      if (!f.active || !f.el || !f.motion) continue;
      const m = f.motion;
      m.x += m.vx;
      m.y += m.vy;
      if (m.x <= 0) { m.x = 0; m.vx = Math.abs(m.vx); }
      else if (m.x >= maxW) { m.x = maxW; m.vx = -Math.abs(m.vx); }
      if (m.y <= 0) { m.y = 0; m.vy = Math.abs(m.vy); }
      else if (m.y >= maxH) { m.y = maxH; m.vy = -Math.abs(m.vy); }
      f.el.style.setProperty("--dx", m.x + "px");
      f.el.style.setProperty("--dy", m.y + "px");
      any = true;
    }
    if (any) this._flowerRafId = requestAnimationFrame(() => this._flowerLoop());
    else this._flowerRafId = null;
  }

  /** Renderiza el fondo según la zona y el momento. */
  applyZoneVisual() {
    const zone = gs.state.progression.currentZone;
    const map = MAPS[zone];
    topBar.setZone(map ? map.name : zone, zone);
    dayNight.applyBodyClass();
    if (this.container) {
      topBar.setTime(gs.state.progression.timeOfDay);
    }
    // Fondo temático de la zona: clase en <body> que el CSS usa para pintar
    // cada bioma (jardín, bosque, lago...).
    document.body.classList.remove("zone-spring_garden", "zone-whispering_forest", "zone-moon_lake");
    if (zone) document.body.classList.add("zone-" + zone);
  }

  clear() {
    if (this.container) this.container.innerHTML = "";
    this.flowers.forEach((f) => clearTimeout(f.timer));
    this.flowers = [];
    this._removeNilo();
    this._removeMoss();
    if (this._flowerRafId) {
      cancelAnimationFrame(this._flowerRafId);
      this._flowerRafId = null;
    }
    // Limpiar partículas flotantes
    if (this._particleRafId) {
      cancelAnimationFrame(this._particleRafId);
      this._particleRafId = null;
    }
    if (this.container) {
      this.container.querySelectorAll(".floating-particle").forEach((el) => el.remove());
    }
    this._floatingParticles = [];
  }

  /** Se llama cuando el jugador cambia de zona o de día/noche. */
  refresh() {
    this.applyZoneVisual();
    audio.playZoneMusic(gs.state.progression.currentZone);
    this.populate();
  }

  /** ¿Puede Nilo aparecer ahora? Guards compartidos. */
  _canSpawnNilo() {
    if (this._disposed) return false;
    if (gs.state.progression.currentZone !== "spring_garden") return false;
    // Nilo solo deja de aparecer cuando lo capturas (y ya lo tienes).
    if (creatureSystem.isCaptured("nilo")) return false;
    if (creatureSystem.hasActiveEncounter()) return false;
    // Solo bloquea si el diálogo está realmente en pantalla. Un flag residual
    // (p. ej. tras reiniciar con el diálogo abierto) no debe bloquear para siempre.
    if (dialogBox.root && dialogBox.root.classList.contains("show")) return false;
    // Hasta superar el primer encuentro/tutorial, Nilo no debe aparecer por su cuenta.
    if (!narrativeSystem.isDone("nilo_meet")) return false;
    return true;
  }

  /** Tick del temporizador: intenta que la criatura de la zona aparezca (con probabilidad). */
  _autoSpawnTick() {
    if (!this.autoSpawnNilo) return;
    // En el bosque aparece el camaleón (Moss); en el jardín, Nilo.
    if (gs.state.progression.currentZone === "whispering_forest") {
      if (this.mossState) return;
      if (!this._canSpawnMoss()) return;
      if (!chance(CONFIG.moss.spawnChance)) return;
      this._spawnMoss();
      return;
    }
    if (!this._canSpawnNilo()) return;
    if (!chance(CONFIG.nilo.spawnChance)) return;
    this._trySpawnNilo();
  }

  /** Spawn rápido al recoger una flor (probabilidad menor). */
  _tryTapSpawn() {
    if (!this.autoSpawnNilo) return;
    if (gs.state.progression.currentZone === "whispering_forest") {
      if (this.mossState) return;
      if (!this._canSpawnMoss()) return;
      if (!chance(CONFIG.moss.tapSpawnChance)) return;
      this._spawnMoss();
      return;
    }
    if (!this._canSpawnNilo()) return;
    if (!chance(CONFIG.nilo.tapSpawnChance)) return;
    this._trySpawnNilo();
  }

  /** Inicia efectivamente el encuentro de Nilo y renderiza su sprite. */
  _trySpawnNilo() {
    const started = creatureSystem.startEncounter("nilo", gs.state.progression.currentZone, {
      onSteal: () => this._niloStealsFlower()
    });
    if (started) {
      this._renderNilo();
      return true;
    }
    return false;
  }

  /** Maneja el robo de una flor por Nilo: reduce la capacidad máx. 30 s. */
  _niloStealsFlower() {
    const zone = gs.state.progression.currentZone;
    const p = gs.state.penalties.maxFlowers[zone] || { reduced: 0, untilMs: 0 };
    const untilMs = Date.now() + (CONFIG.nilo.stealPenaltyMs || 30 * 1000);
    gs.state.penalties.maxFlowers[zone] = { reduced: p.reduced + 1, untilMs };
    saveManager.saveGame();
    eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, {
      text: "🐆 ¡Nilo se llevó una flor! La generación máxima de flores bajó en 1 (30 s)."
    });
    // reequilibrar el campo: eliminar una flor si quedan más de la capacidad efectiva
    this._trimToEffectiveCapacity();
    return 0;
  }

  /** Fuerza reaparición/equilibrio según la capacidad efectiva. */
  _trimToEffectiveCapacity() {
    const zone = gs.state.progression.currentZone;
    const eff = flowerSystem.effectiveZoneCapacity(zone);
    const active = this.flowers.filter((f) => f.active);
    while (active.length > eff) {
      const f = active.pop();
      this.hideThenRespawn(f);
    }
  }

  /** Ajusta el campo a la capacidad efectiva: trima si sobran, o añade flores si faltan
   *  (p. ej. al crecer la amistad de Nilo y ganar flores extra). */
  _rebalanceFlowers() {
    const zone = gs.state.progression.currentZone;
    const time = gs.state.progression.timeOfDay;
    const eff = flowerSystem.effectiveZoneCapacity(zone);
    const active = this.flowers.filter((f) => f.active);
    if (active.length > eff) {
      this._trimToEffectiveCapacity();
      return;
    }
    // Añadir flores nuevas hasta llegar a la capacidad efectiva.
    let missing = eff - active.length;
    let guard = 0;
    while (missing > 0 && guard++ < 50) {
      const spawned = flowerSystem.spawnFlowers(zone, time, 1);
      if (spawned.length === 0) break;
      const s = spawned[0];
      if (this.flowers.length >= 60) break;
      this.addFlower(s.id, s.x, s.y);
      missing--;
    }
  }

  /** Respawn inmediato si ya no quedan flores activas en el jardín. */
  _regenerateImmediatelyIfEmpty() {
    const active = this.flowers.filter((f) => f.active).length;
    if (active > 0) return;
    const zone = gs.state.progression.currentZone;
    const time = gs.state.progression.timeOfDay;
    const eff = flowerSystem.effectiveZoneCapacity(zone);
    // re-colocar todas las entradas como activas (regeneración instantánea)
    for (const f of this.flowers) {
      this.respawn(f);
    }
  }

  // ================= TOPO DEL BOSQUE (MOSS) =================

  /** ¿Puede el camaleón aparecer ahora? Guards compartidos. */
  _canSpawnMoss() {
    if (this._disposed) return false;
    if (gs.state.progression.currentZone !== "whispering_forest") return false;
    if (creatureSystem.isCaptured("moss")) return false;
    if (this.mossState) return false;
    if (dialogBox.root && dialogBox.root.classList.contains("show")) return false;
    return true;
  }

  /** Inicia el evento del camaleón: esconde las plantas y lo muestra. */
  _spawnMoss() {
    if (!this.container) return;
    this.mossState = { taps: 0, endTimer: null };
    this._buryAllPlants(true);
    this._renderMoss();
    // El camaleón descubre su criatura en el diario al aparecer.
    creatureSystem.markDiscovered("moss");
    // +10% de investigación por APARICIÓN (no por cada toque).
    const cfg = CONFIG.moss;
    investigationSystem.addResearch("moss", cfg.researchPerSpawn);
    const pct = investigationSystem.getProgress("moss");
    eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, {
      text: `🦎 ¡Un camaleón se ha camuflado sobre las plantas! +${cfg.researchPerSpawn}% investigación (total ${pct}%). Tócalo para esconderlo.`
    });
    this.mossState.endTimer = setTimeout(() => this._endMoss(), cfg.eventMs);
    saveManager.saveGame();
  }

  /** Renderiza el sprite del camaleón que se mueve entre los huecos. */
  _renderMoss() {
    if (!this.container) return;
    if (this.mossEl) return;
    const el = document.createElement("div");
    el.className = "moss";
    el.textContent = "🦎";

    const label = document.createElement("div");
    label.className = "moss-label";
    label.textContent = "¡CAMUFLADO!";
    el.appendChild(label);

    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this._onMossTap();
    });

    el.style.left = randomBetween(20, 80) + "%";
    el.style.top = randomBetween(25, 65) + "%";
    this.container.appendChild(el);
    this.mossEl = el;

    // El camaleón se mueve por los huecos cada 2.5 s.
    clearInterval(this._mossMoveTimer);
    this._mossMoveTimer = setInterval(() => this._mossHop(), 2500);
  }

  /** Salta de un hueco a otro (el camaleón siempre está en movimiento). */
  _mossHop() {
    const el = this.mossEl;
    if (!el || !el.parentNode) return;
    if (!this.mossState) return;
    el.style.transition = "left 0.5s ease-in, top 0.5s ease-in";
    el.style.left = randomBetween(18, 82) + "%";
    el.style.top = randomBetween(22, 68) + "%";
  }

  /** Al tocarlo: botín, plantas visibles 1 s y cambia de hueco. */
  _onMossTap() {
    if (!this.mossState || !this.mossEl) return;
    const el = this.mossEl;
    el.classList.add("hit");
    setTimeout(() => el.classList.remove("hit"), 120);

    const cfg = CONFIG.moss;
    const friendship = gs.state.creatures.friendship?.moss || 0;
    const doubled = friendship >= (cfg.dropDoubleFriendship || 200);
    this._mossDrop(doubled);

    this._revealPlantsFor(cfg.visibleAfterTouchMs);
    this._mossHop();

    // El mensaje de "se escondió" solo se muestra en el primer toque,
    // para no repetirse en cada tap.
    this.mossState.taps = (this.mossState.taps || 0) + 1;
    if (this.mossState.taps === 1) {
      eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, {
        text: "🦎 ¡El camaleón se escondió! Las plantas quedan a la vista 1 s."
      });
    }
    saveManager.saveGame();
  }

  /** Botín con probabilidades; con 200 amistad se duplica y da un objeto extra. */
  _mossDrop(doubled) {
    const mult = doubled ? 2 : 1;
    const d = CONFIG.moss.drops;
    const roll = (obj) => (chance(obj.chance) ? randomBetween(obj.min, obj.max) * mult : 0);
    const grants = [];

    let m = roll(d.mushroom);
    if (m) { economy.addResource("mushrooms", m); grants.push(`🍄 +${m} hongo`); }
    let l = roll(d.leaves);
    if (l) { economy.addResource("whispering_forest.leaves", l); grants.push(`🍃 +${l} hojas`); }
    let b = roll(d.bundles);
    if (b) { economy.addResource("whispering_forest.bundles", b); grants.push(`🍂 +${b} bultos`); }
    let f = roll(d.flower);
    if (f) { economy.addPetals(f); grants.push(`🌸 +${f} pétalos`); }
    let r = roll(d.bouquet);
    if (r) { economy.addBouquets(r); grants.push(`💐 +${r} ramos`); }

    if (doubled) {
      const extra = randomBetween(1, 3);
      economy.addResource("whispering_forest.leaves", extra);
      grants.push(`✨ objeto extra +${extra} hojas`);
    }

    if (grants.length) {
      eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, {
        text: "🦎 ¡Botín del camaleón! " + grants.join(", ")
      });
    }
  }

  /** Entierra o desentierra todas las plantas del campo. */
  _buryAllPlants(buried) {
    for (const f of this.flowers) {
      if (!f.el) continue;
      f.el.classList.toggle("buried", !!buried);
    }
  }

  /** Desentierra las plantas durante `ms` y luego vuelve a enterrarlas. */
  _revealPlantsFor(ms) {
    this._buryAllPlants(false);
    clearTimeout(this._mossRevealTimer);
    this._mossRevealTimer = setTimeout(() => {
      if (this.mossState) this._buryAllPlants(true);
    }, ms);
  }

  /** Termina el evento: desentierra las plantas y retira al camaleón. */
  _endMoss() {
    this._buryAllPlants(false);
    this._removeMoss();
    eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, {
      text: "🦎 El camaleón se fue. Las plantas vuelven a la superficie."
    });
    saveManager.saveGame();
  }

  /** Retira el sprite y limpia los temporizadores/movimiento del camaleón. */
  _removeMoss() {
    if (this.mossEl && this.mossEl.parentNode) {
      this.mossEl.remove();
    }
    this.mossEl = null;
    if (this.mossState) {
      clearTimeout(this.mossState.endTimer);
      this.mossState = null;
    }
    if (this._mossRevealTimer) {
      clearTimeout(this._mossRevealTimer);
      this._mossRevealTimer = null;
    }
    if (this._mossMoveTimer) {
      clearInterval(this._mossMoveTimer);
      this._mossMoveTimer = null;
    }
  }

  // ================= NARRATIVA =================

  _maybeIntro() {
    if (gs.state.progression.currentZone !== "spring_garden") return;
    narrativeSystem.tryIntro();
  }

  _checkNiloAfterEnter() {
    if (gs.state.progression.currentZone !== "spring_garden") return;
    if (gs.state.stats.totalTaps >= 15) {
      narrativeSystem.tryNiloTutorial();
    }
  }

  // ================= ENCUENTRO DE NILO =================

  /** Muestra a Nilo (un leopardo) que entra corriendo, salta a las plantas
   *  y, al final, escapa llevándoselas fuera del campo de visión. */
  _renderNilo() {
    if (!this.container) return;
    // Solo se dibuja si hay un encuentro real de Nilo activo (no fantasma).
    if (!creatureSystem.hasActiveEncounter() || !creatureSystem.isEncounterCreature("nilo")) return;
    if (this.niloEl) return;
    const nilo = CREATURES.nilo;
    const el = document.createElement("div");
    el.className = "nilo nilo-running";
    el.textContent = nilo.emoji;

    const label = document.createElement("div");
    label.className = "nilo-label";
    label.textContent = "¡ROBANDO!";
    el.appendChild(label);

    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this._onNiloTap();
    });

    // Aparece desde el borde izquierdo (fuera del campo de visión) y entra corriendo.
    const top = randomBetween(32, 58);
    el.style.left = "-20%";
    el.style.top = top + "%";
    el.style.transition = "none";
    el.classList.add("flip");
    this.container.appendChild(el);
    this.niloEl = el;

    // Corre rápidamente hacia las plantas.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!this.niloEl) return;
      const target = this._pickPlantTarget();
      el.classList.remove("nilo-running");
      el.classList.add("nilo-sneaking");
      this._niloHop(el, target.x, target.y, true, 550);
      // Salta entre las flores (se mueve vivamente mientras roba).
      setTimeout(() => {
        if (!this.niloEl || el !== this.niloEl) return;
        const next = this._pickPlantTarget();
        this._niloHop(el, next.x, next.y, true, 480, true);
      }, 650);
    }));

    // Ventana de tiempo para detenerlo: si se agota, roba y escapa con las flores.
    const cfg = CREATURES.nilo.interferenceConfig || {};
    clearTimeout(this.niloTimer);
    this.niloTimer = setTimeout(() => {
      this._niloFlee(() => creatureSystem.expireEncounter());
    }, cfg.windowMs || 3000);
  }

  /** Elige una flor activa (o un punto del jardín) como objetivo del salto. */
  _pickPlantTarget(avoid) {
    const active = this.flowers.filter((f) => f.active && f.el && f.el.parentNode);
    if (active.length) {
      let f = active[randomBetween(0, active.length - 1)];
      let guard = 0;
      while (avoid && f && f.el && f.el.style.left === avoid.l && guard < 6) {
        f = active[randomBetween(0, active.length - 1)];
        guard++;
      }
      return {
        x: parseFloat(f.el.style.left),
        y: parseFloat(f.el.style.top),
        isFlower: true
      };
    }
    return { x: randomBetween(35, 65), y: randomBetween(30, 55) };
  }

  /** Anima un salto de Nilo hasta (x,y) en % dentro del jardín. */
  _niloHop(el, x, y, flip, ms, soft) {
    if (!el || !el.parentNode) return;
    el.style.transition = `left ${ms}ms ${soft ? "ease-out" : "cubic-bezier(.22,1,.36,1)"}, top ${ms}ms ${soft ? "ease-out" : "cubic-bezier(.22,1,.36,1)"}`;
    el.classList.toggle("flip", !!flip);
    el.style.left = x + "%";
    el.style.top = y + "%";
  }

  /** Anima a Nilo huyendo fuera del campo de visión (derecha) y llama onExit. */
  _niloFlee(onExit) {
    const el = this.niloEl;
    clearTimeout(this.niloTimer);
    if (!el || !el.parentNode) {
      this._removeNilo();
      onExit && onExit();
      return;
    }
    el.classList.remove("nilo-sneaking");
    el.classList.add("nilo-fleeing", "flip");
    el.style.transition = "left 0.6s ease-in, top 0.5s ease-in";
    el.style.top = randomBetween(38, 58) + "%";
    el.style.left = "118%";
    const done = () => {
      this._removeNilo();
      onExit && onExit();
    };
    setTimeout(done, 640);
  }

  _onNiloTap() {
    const state = creatureSystem.onPlayerTap("nilo");
    if (!state) return;
    if (this.niloEl) {
      this.niloEl.classList.add("hit");
      setTimeout(() => this.niloEl.classList.remove("hit"), 120);
    }
    if (state.status === "stopped") {
      // Lo detuviste: Nilo sale corriendo (las flores se salvan).
      clearTimeout(this.niloTimer);
      this._niloFlee(() => {
        eventBus.emit(eventBus.constructor.EVENTS.SHOW_TOAST, {
          text: "🐆 ¡Detuviste a Nilo antes de que robara!"
        });
      });
    }
  }

  _removeNilo() {
    if (this.niloEl && this.niloEl.parentNode) {
      this.niloEl.remove();
    }
    this.niloEl = null;
    if (this.niloTimer) {
      clearTimeout(this.niloTimer);
      this.niloTimer = null;
    }
  }
}

export const gardenScene = new GardenScene();
