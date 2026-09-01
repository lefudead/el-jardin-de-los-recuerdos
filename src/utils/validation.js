/**
 * Validación de guardado (GDD técnico §117).
 * Nunca confiar completamente en los datos cargados.
 */
import { clamp } from "./math.js";

/** Devuelve true si el valor es un número finito ≥ 0. */
function isNonNegativeNumber(v) {
  return typeof v === "number" && Number.isFinite(v) && v >= 0;
}

/**
 * Sanitiza un objeto de guardado bruto y devuelve un estado seguro.
 * Combinación del esquema v1 (MVP) y v3.0 garantizando compatibilidad hacia atrás.
 */
export function sanitizeSave(raw, defaults) {
  const out = {};
  try {
    out.resources = {
      petals: isNonNegativeNumber(raw?.resources?.petals) ? raw.resources.petals : defaults.resources.petals,
      bouquets: isNonNegativeNumber(raw?.resources?.bouquets) ? raw.resources.bouquets : defaults.resources.bouquets,
      mushrooms: isNonNegativeNumber(raw?.resources?.mushrooms) ? raw.resources.mushrooms : defaults.resources.mushrooms,
      zones: sanitizeZoneResources(raw?.resources?.zones, defaults.resources.zones)
    };
    out.progression = {
      currentZone: typeof raw?.progression?.currentZone === "string" ? raw.progression.currentZone : defaults.progression.currentZone,
      timeOfDay: typeof raw?.progression?.timeOfDay === "string" ? raw.progression.timeOfDay : defaults.progression.timeOfDay,
      storyProgress: isNonNegativeNumber(raw?.progression?.storyProgress) ? raw.progression.storyProgress : defaults.progression.storyProgress
    };
    out.penalties = sanitizePenalties(raw?.penalties, defaults.penalties);
    out.unlocks = {
      flowers: toArray(raw?.unlocks?.flowers),
      maps: toArray(raw?.unlocks?.maps),
      skins: toArray(raw?.unlocks?.skins),
      upgrades: toArray(raw?.unlocks?.upgrades)
    };
    out.creatures = {
      discovered: toArray(raw?.creatures?.discovered),
      observations: sanitizeObservations(raw?.creatures?.observations),
      research: toMapNumbers(raw?.creatures?.research),
      finds: toMapNumbers(raw?.creatures?.finds),
      cages: toMapStrings(raw?.creatures?.cages),
      captured: toArray(raw?.creatures?.captured),
      tamed: toArray(raw?.creatures?.tamed),
      trust: toMapNumbers(raw?.creatures?.trust),
      friendship: toMapNumbers(raw?.creatures?.friendship)
    };
    out.companions = sanitizeCompanions(raw?.companions, defaults.companions);
    out.inventory = sanitizeInventory(raw?.inventory);
    out.journal = {
      entries: toArray(raw?.journal?.entries),
      secrets: toArray(raw?.journal?.secrets)
    };
    out.puzzles = { solved: toArray(raw?.puzzles?.solved) };
    out.events = { completed: toArray(raw?.events?.completed) };

    // memories: en v1 era un array plano; en v3.0 es {found, restored}. Normalizar ambos.
    out.memories = sanitizeMemories(raw?.memories);

    out.storyFlags = sanitizeFlags(raw?.storyFlags);
    out.stats = sanitizeStats(raw?.stats);
  } catch (e) {
    return structuredClone(defaults);
  }
  return out;
}

/** Sanitiza las economías por zona: mantiene claves conocidas y números válidos. */
function sanitizeZoneResources(zones, defaults) {
  const out = {};
  if (!zones || typeof zones !== "object") {
    return defaults ? structuredClone(defaults) : {};
  }
  for (const [zoneId, res] of Object.entries(zones)) {
    if (!defaults || !(zoneId in defaults)) continue; // descartar zonas desconocidas
    out[zoneId] = {};
    // Conserva las claves conocidas de la zona (puede haber varias: leaves+bundles).
    for (const currency of Object.keys(defaults[zoneId])) {
      const amount = isNonNegativeNumber(res?.[currency]) ? res[currency] : 0;
      out[zoneId][currency] = amount;
    }
  }
  return out;
}

function toArray(v) {
  return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
}

function sanitizeObservations(obs) {
  if (!obs || typeof obs !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(obs)) {
    out[k] = toArray(v);
  }
  return out;
}

function toMapNumbers(obj) {
  if (!obj || typeof obj !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (isNonNegativeNumber(v)) out[k] = maskNaN(v);
  }
  return out;
}

function toMapStrings(obj) {
  if (!obj || typeof obj !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

/** Sanitiza las penalizaciones de capacidad máx de flores por zona (GDD §40). */
function sanitizePenalties(pen, defaults) {
  const out = { maxFlowers: {} };
  if (!pen || typeof pen !== "object") {
    return { maxFlowers: defaults?.maxFlowers ? structuredClone(defaults.maxFlowers) : {} };
  }
  const raw = pen.maxFlowers;
  if (raw && typeof raw === "object") {
    for (const [zoneId, p] of Object.entries(raw)) {
      if (!p || typeof p !== "object") continue;
      const reduced = isNonNegativeNumber(p.reduced) ? p.reduced : 0;
      const untilMs = isNonNegativeNumber(p.untilMs) ? p.untilMs : 0;
      if (reduced > 0 && untilMs > 0) {
        out.maxFlowers[zoneId] = { reduced, untilMs };
      }
    }
  }
  return out;
}

/** Sanitiza los compañeros activos (ids de criaturas domesticadas) y slots comprados. */
function sanitizeCompanions(comp, defaults) {
  const out = { active: [], slotsBought: 0 };
  const base = defaults?.slotsBought || 0;
  if (comp && typeof comp === "object") {
    out.active = toArray(comp.active);
    out.slotsBought = isNonNegativeNumber(comp.slotsBought) ? Math.min(2, Math.floor(comp.slotsBought)) : base;
  } else {
    out.slotsBought = base;
  }
  return out;
}

function sanitizeInventory(inv) {
  const out = { items: [], foods: [], cages: [] };
  if (!inv || typeof inv !== "object") return out;
  // Compatibilidad: v1 tenía inventory como array plano de {id, quantity}
  if (Array.isArray(inv)) {
    out.items = inv.filter((i) => i && typeof i.id === "string");
    return out;
  }
  out.items = (inv.items || []).filter((i) => i && typeof i.id === "string");
  out.foods = (inv.foods || []).filter((i) => i && typeof i.id === "string");
  out.cages = (inv.cages || []).filter((i) => i && typeof i.id === "string");
  return out;
}

function sanitizeMemories(mems) {
  const out = { found: [], restored: [] };
  // v1: array plano de ids
  if (Array.isArray(mems)) {
    out.found = mems.filter((x) => typeof x === "string");
    return out;
  }
  if (mems && typeof mems === "object") {
    out.found = toArray(mems.found);
    out.restored = toArray(mems.restored);
  }
  return out;
}

function sanitizeFlags(flags) {
  if (!flags || typeof flags !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(flags)) {
    out[k] = !!v;
  }
  return out;
}

function maskNaN(v) {
  return clamp(v, 0, Number.MAX_SAFE_INTEGER);
}

function sanitizeStats(stats) {
  const base = {
    totalTaps: 0,
    totalPetals: 0,
    totalBouquets: 0,
    creaturesFound: 0,
    observationsFound: 0,
    creaturesCaptured: 0,
    creaturesTamed: 0,
    cagesUsed: 0,
    puzzlesSolved: 0,
    secretsFound: 0,
    memoriesFound: 0,
    playTime: 0
  };
  if (!stats || typeof stats !== "object") return base;
  for (const [k, v] of Object.entries(stats)) {
    if (k in base && isNonNegativeNumber(v)) base[k] = clamp(v, 0, Number.MAX_SAFE_INTEGER);
  }
  return base;
}
