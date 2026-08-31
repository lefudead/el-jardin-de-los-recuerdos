/**
 * Catálogo de mejoras y objetos de tienda (GDD §12, técnico §11, §106-108).
 * `effect` es un mapa de bonificaciones interpretado por los sistemas.
 *
 * Campos extendidos para la tienda por zonas:
 *  - scope:  global | local | cross   (aplicación de la bonificación)
 *  - zone:   zona a la que pertenece el objeto (identidad/desbloqueo)
 *  - currency: moneda con la que se paga ("bouquets", "petals", o "zona.moneda").
 *  - category: sección de la tienda (upgrades | zones | creatures | mysteries | cosmetics | investigation | event)
 *  - unlock:  id de evento/flag que debe estar hecho para que APAREZCA (null = siempre visible)
 *  - nightOnly: true = solo aparece de noche (stock nocturno)
 *  - mystery:  true = objeto "desconocido" (muestra ??? y revela un fragmento de recuerdo)
 *  - interactive: campo al que da acceso (ej "woods.axes" para hachas sobre troncos)
 *
 * Afectos existentes interpretados por Farming/Flower/Economy:
 *  - extraPetalChance, respawnSpeed, rarityBoost, creatureSpawnBoost,
 *  - extraTapResource    -> probabilidad de recurso adicional por tap (cesta)
 *  - flatTapBonus        -> recurso adicional fijo por tap (guantes)
 *  - globalProduction    -> +% producción en todas las zonas (brújula)
 *  - autoGenerate        -> genera recurso de la zona pasivamente (reloj)
 */
export const UPGRADES = {

  // ===================== 🌱 JARDÍN — MEJORAS =====================
  garden_seeds: {
    id: "garden_seeds",
    name: "🌱 Semillas mejoradas",
    description: "Las flores tardan menos en reaparecer. -5% tiempo de regeneración.",
    cost: 10, tier: 1, scope: "global", zone: "spring_garden", currency: "bouquets",
    category: "upgrades",
    effect: { respawnSpeed: 0.05 }
  },
  garden_extra_pot: {
    id: "garden_extra_pot",
    name: "🪴 Maceta adicional",
    description: "Añade una nueva flor al jardín. +1 flor disponible para tocar.",
    cost: 25, tier: 1, scope: "local", zone: "spring_garden", currency: "bouquets",
    category: "upgrades",
    effect: { gardenCapacity: 1 }
  },
  garden_watering_can: {
    id: "garden_watering_can",
    name: "💧 Regadera pequeña",
    description: "10% de probabilidad de +1 🌸 extra por cada recolección.",
    cost: 50, tier: 1, scope: "global", zone: "spring_garden", currency: "bouquets",
    category: "upgrades",
    effect: { extraPetalChance: 0.10 }
  },
  garden_flower_basket: {
    id: "garden_flower_basket",
    name: "🧺 Cesta de flores",
    description: "Aumenta la cantidad máxima de flores recogibles.",
    cost: 100, tier: 2, scope: "local", zone: "spring_garden", currency: "bouquets",
    category: "upgrades",
    effect: { gardenCapacity: 1 }
  },
  garden_fertilizer: {
    id: "garden_fertilizer",
    name: "🌷 Fertilizante especial",
    description: "A veces aparecen flores brillantes que dan +3/+5 🌸.",
    cost: 250, tier: 2, scope: "local", zone: "spring_garden", currency: "bouquets",
    category: "upgrades",
    effect: { extraPetalChance: 0.15, shinyFlowers: true }
  },

  // ===================== 🌎 JARDÍN — TODAS LAS ZONAS =====================
  compass: {
    id: "compass",
    name: "🧭 Brújula de los recuerdos",
    description: "+5% de producción en todas las zonas.",
    cost: 500, tier: 3, scope: "global", zone: "spring_garden", currency: "bouquets",
    category: "zones",
    effect: { globalProduction: 0.05 }
  },
  pocket_watch: {
    id: "pocket_watch",
    name: "⏳ Reloj de bolsillo",
    description: "Genera una pequeña cantidad del recurso de la zona cada 30 s.",
    cost: 1000, tier: 3, scope: "global", zone: "spring_garden", currency: "bouquets",
    category: "zones",
    effect: { autoGenerate: 2 }
  },
  old_backpack: {
    id: "old_backpack",
    name: "🎒 Mochila vieja",
    description: "Aumenta la capacidad de almacenamiento de todas las monedas.",
    cost: 1500, tier: 3, scope: "global", zone: "spring_garden", currency: "bouquets",
    category: "zones",
    effect: { storageCapacity: 50 }
  },

  // ===================== 🐾 JARDÍN — CRIATURAS =====================
  garden_nest: {
    id: "garden_nest",
    name: "🍎 Comedero del jardín",
    description: "Aumenta la frecuencia con la que aparecen criaturas.",
    cost: 400, tier: 2, scope: "global", zone: "spring_garden", currency: "bouquets",
    category: "creatures",
    effect: { creatureSpawnBoost: 0.25 }
  },
  garden_bed: {
    id: "garden_bed",
    name: "🧸 Pequeña cama",
    description: "Aumenta la comodidad de las criaturas domesticadas.",
    cost: 750, tier: 3, scope: "global", zone: "spring_garden", currency: "bouquets",
    category: "creatures",
    effect: { creatureComfort: 1 }
  },
  garden_toybox: {
    id: "garden_toybox",
    name: "💕 Caja de juguetes",
    description: "Desbloquea interacciones especiales con determinadas criaturas.",
    cost: 1200, tier: 3, scope: "global", zone: "spring_garden", currency: "bouquets",
    category: "creatures",
    effect: { creatureSpecialInteractions: true }
  },

  // ===================== 🔐 JARDÍN — MISTERIOS =====================
  garden_diary: {
    id: "garden_diary",
    name: "📓 Diario de recuerdos",
    description: "Desbloquea el sistema de investigación y registro de criaturas.",
    cost: 50, tier: 1, scope: "global", zone: "spring_garden", currency: "bouquets",
    category: "mysteries",
    effect: { journalSystem: true }
  },
  garden_magnifier: {
    id: "garden_magnifier",
    name: "🔍 Lupa antigua",
    description: "Permite detectar pequeñas anomalías en determinadas zonas.",
    cost: 600, tier: 2, scope: "global", zone: "spring_garden", currency: "bouquets",
    category: "mysteries",
    effect: { anomalyDetection: true }
  },
  garden_key: {
    id: "garden_key",
    name: "🗝️ Llave pequeña",
    description: "No tiene explicación. Desbloquea una interacción en la casa.",
    cost: 1000, tier: 3, scope: "global", zone: "spring_garden", currency: "bouquets",
    category: "mysteries",
    unlock: "event_garden_flower", mystery: true
  },
  garden_letter: {
    id: "garden_letter",
    name: "📜 Carta sin abrir",
    description: "\"...si algún día vuelves...\" (La tinta se ha borrado casi por completo.)",
    cost: 1500, tier: 3, scope: "global", zone: "spring_garden", currency: "bouquets",
    category: "mysteries", mystery: true
  },

  // ===================== 🎨 JARDÍN — COSMÉTICOS =====================
  cosmetic_rose_pot: {
    id: "cosmetic_rose_pot",
    name: "🌸 Maceta rosa",
    description: "Cosmético: embellece el jardín.",
    cost: 100, tier: 1, scope: "global", zone: "spring_garden", currency: "bouquets",
    category: "cosmetics",
    effect: { cosmetic: "rose_pot" }
  },
  cosmetic_butterflies: {
    id: "cosmetic_butterflies",
    name: "🦋 Mariposas decorativas",
    description: "Cosmético: mariposas que revolotean.",
    cost: 250, tier: 1, scope: "global", zone: "spring_garden", currency: "bouquets",
    category: "cosmetics",
    effect: { cosmetic: "butterflies" }
  },
  cosmetic_color_flowers: {
    id: "cosmetic_color_flowers",
    name: "🌈 Flores de colores",
    description: "Cosmético: flores de colores vivos.",
    cost: 500, tier: 2, scope: "global", zone: "spring_garden", currency: "bouquets",
    category: "cosmetics",
    effect: { cosmetic: "color_flowers" }
  },
  cosmetic_night_garden: {
    id: "cosmetic_night_garden",
    name: "🌙 Jardín nocturno",
    description: "Cosmético: cambia visualmente el jardín por la noche.",
    cost: 1000, tier: 2, scope: "global", zone: "spring_garden", currency: "bouquets",
    category: "cosmetics",
    effect: { cosmetic: "night_garden" }
  },
  cosmetic_memory_garden: {
    id: "cosmetic_memory_garden",
    name: "✨ Jardín de recuerdos",
    description: "Se desbloquea tras descubrir un secreto. Precio oculto.",
    cost: null, tier: 3, scope: "global", zone: "spring_garden", currency: "bouquets",
    category: "cosmetics", mystery: true,
    effect: { cosmetic: "memory_garden" }
  },

  // ===================== 🌲 BOSQUE — MEJORAS DEL BOSQUE =====================
  forest_gloves: {
    id: "forest_gloves",
    name: "🍃 Guantes de jardinero",
    description: "Aumenta la cantidad de hojas obtenidas por tap. +1 hoja por recolección.",
    cost: 25, tier: 1, scope: "local", zone: "whispering_forest", currency: "whispering_forest.bundles",
    category: "upgrades",
    effect: { flatTapBonus: 1 }
  },
  forest_basket: {
    id: "forest_basket",
    name: "🧺 Cesta de explorador",
    description: "10% de probabilidad de +1 recurso por recolección.",
    cost: 75, tier: 1, scope: "local", zone: "whispering_forest", currency: "whispering_forest.bundles",
    category: "upgrades",
    effect: { extraTapResource: 0.10 }
  },
  forest_axe: {
    id: "forest_axe",
    name: "🪵 Hacha vieja",
    description: "Desbloquea objetos interactivos del bosque (troncos).",
    cost: 150, tier: 2, scope: "local", zone: "whispering_forest", currency: "whispering_forest.bundles",
    category: "upgrades",
    effect: { woodsAxes: true }
  },
  forest_magnifier: {
    id: "forest_magnifier",
    name: "🔍 Lupa de explorador",
    description: "Aumenta la posibilidad de encontrar secretos.",
    cost: 300, tier: 2, scope: "local", zone: "whispering_forest", currency: "whispering_forest.bundles",
    category: "upgrades",
    effect: { secretBoost: 0.15 }
  },

  // ===================== 🌎 BOSQUE — TODAS LAS ZONAS =====================
  forest_compass: {
    id: "forest_compass",
    name: "🧭 Brújula del bosque",
    description: "+5% de producción en todas las zonas.",
    cost: 500, tier: 3, scope: "global", zone: "whispering_forest", currency: "whispering_forest.bundles",
    category: "zones",
    effect: { globalProduction: 0.05 }
  },
  forest_clock: {
    id: "forest_clock",
    name: "🕰️ Reloj antiguo",
    description: "Cada 30 s genera una pequeña cantidad del recurso de la zona actual.",
    cost: 1000, tier: 3, scope: "global", zone: "whispering_forest", currency: "whispering_forest.bundles",
    category: "zones",
    effect: { autoGenerate: 2 }
  },
  forest_key: {
    id: "forest_key",
    name: "🗝️ Llave oxidada",
    description: "No da dinero. Desbloquea una habitación secreta del bosque.",
    cost: 1500, tier: 3, scope: "global", zone: "whispering_forest", currency: "whispering_forest.bundles",
    category: "zones", mystery: true
  },

  // ===================== 🐾 BOSQUE — CRIATURAS =====================
  forest_feeder: {
    id: "forest_feeder",
    name: "🥜 Comedero de madera",
    description: "Aumenta la frecuencia con la que aparecen criaturas.",
    cost: 100, tier: 1, scope: "global", zone: "whispering_forest", currency: "whispering_forest.bundles",
    category: "creatures",
    effect: { creatureSpawnBoost: 0.25 }
  },
  forest_house: {
    id: "forest_house",
    name: "🪵 Casita de criaturas",
    description: "Permite que una criatura domesticada visite el bosque aunque no esté activa.",
    cost: 350, tier: 2, scope: "global", zone: "whispering_forest", currency: "whispering_forest.bundles",
    category: "creatures",
    effect: { creatureVisitForest: true }
  },
  forest_herbs: {
    id: "forest_herbs",
    name: "🌿 Hierbas aromáticas",
    description: "Reduce el tiempo necesario para domesticar criaturas.",
    cost: 200, tier: 2, scope: "global", zone: "whispering_forest", currency: "whispering_forest.bundles",
    category: "creatures",
    effect: { tamingTimeReduction: 0.15 }
  },
  forest_special_basket: {
    id: "forest_special_basket",
    name: "🧺 Cesta especial",
    description: "Posibilidad de obtener un objeto adicional cuando una criatura usa su habilidad.",
    cost: 750, tier: 3, scope: "global", zone: "whispering_forest", currency: "whispering_forest.bundles",
    category: "creatures",
    effect: { creatureExtraDrop: 0.10 }
  },

  // ===================== 📓 BOSQUE — INVESTIGACIÓN =====================
  forest_diary: {
    id: "forest_diary",
    name: "📓 Diario del bosque",
    description: "Desbloquea la sección CRIATURAS DEL BOSQUE. Cada criatura encontrada queda registrada.",
    cost: 50, tier: 1, scope: "global", zone: "whispering_forest", currency: "whispering_forest.bundles",
    category: "investigation",
    effect: { journalSystem: true }
  },
  forest_lens: {
    id: "forest_lens",
    name: "🔎 Lente de observación",
    description: "Puede revelar una nueva pista sobre cada criatura que aparece.",
    cost: 600, tier: 2, scope: "global", zone: "whispering_forest", currency: "whispering_forest.bundles",
    category: "investigation",
    effect: { observationLens: true }
  },
  forest_camera: {
    id: "forest_camera",
    name: "📸 Cámara antigua",
    description: "Permite guardar una \"fotografía\" de cada criatura encontrada.",
    cost: 1200, tier: 3, scope: "global", zone: "whispering_forest", currency: "whispering_forest.bundles",
    category: "investigation",
    effect: { creaturePhotos: true }
  },

  // ===================== 🌙 STOCK NOCTURNO (bosque) =====================
  night_lantern: {
    id: "night_lantern",
    name: "🕯️ Linterna vieja",
    description: "Ilumina rincones oscuros del bosque. \"No sé para qué sirve.\"",
    cost: 120, tier: 2, scope: "local", zone: "whispering_forest", currency: "whispering_forest.bundles",
    category: "night", nightOnly: true, mystery: true
  },
  night_mirror: {
    id: "night_mirror",
    name: "🪞 Espejo pequeño",
    description: "Refleja algo que no está... \"No sé para qué sirve.\"",
    cost: 180, tier: 2, scope: "local", zone: "whispering_forest", currency: "whispering_forest.bundles",
    category: "night", nightOnly: true, mystery: true
  },
  night_page: {
    id: "night_page",
    name: "📓 Página arrancada",
    description: "Un escrito a medias. \"No sé para qué sirve.\"",
    cost: 90, tier: 2, scope: "local", zone: "whispering_forest", currency: "whispering_forest.bundles",
    category: "night", nightOnly: true, mystery: true
  },
  night_amulet: {
    id: "night_amulet",
    name: "🧿 Amuleto extraño",
    description: "Un objeto desconocido. \"No sé para qué sirve.\"",
    cost: 250, tier: 3, scope: "local", zone: "whispering_forest", currency: "whispering_forest.bundles",
    category: "night", nightOnly: true, mystery: true
  },

  // ===================== ❓ OBJETOS DESCONOCIDOS (misterio) =====================
  memory_fragment_03: {
    id: "memory_fragment_03",
    name: "Fragmento de recuerdo #03",
    description: "Se añade al diario. Perteneció al novio.",
    cost: 2500, tier: 3, scope: "global", zone: "whispering_forest", currency: "whispering_forest.bundles",
    category: "unknown", unlock: "event_seen_creatures_5", mystery: true,
    effect: { memoryFragment: 3 }
  },
  memory_fragment_04: {
    id: "memory_fragment_04",
    name: "Fragmento de recuerdo #04",
    description: "Se añade al diario. Un recuerdo del pasado.",
    cost: 2500, tier: 3, scope: "global", zone: "whispering_forest", currency: "whispering_forest.bundles",
    category: "unknown", unlock: "event_seen_creatures_5", mystery: true,
    effect: { memoryFragment: 4 }
  },

  // ===================== ❓ OBJETOS TRAS EVENTOS (jardín) =====================
  event_garden_seed: {
    id: "event_garden_seed",
    name: "🌱 Semilla desconocida",
    description: "No se explica todavía qué hace.",
    cost: 300, tier: 2, scope: "local", zone: "spring_garden", currency: "bouquets",
    category: "event", unlock: "event_garden_flower", mystery: true
  },
  event_banana_basket: {
    id: "event_banana_basket",
    name: "🍌 Cesta de bananas",
    description: "Nilo tendrá mayor probabilidad de activar su habilidad.",
    cost: 400, tier: 2, scope: "global", zone: "spring_garden", currency: "bouquets",
    category: "event", unlock: "event_nilo_stopped_5",
    effect: { niloAbilityBoost: 0.25 }
  },
  event_crystal_watering: {
    id: "event_crystal_watering",
    name: "💧 Regadera de cristal",
    description: "Recolectar durante la lluvia es más productivo.",
    cost: 500, tier: 2, scope: "local", zone: "spring_garden", currency: "bouquets",
    category: "event", unlock: "event_rain_20",
    effect: { rainBonus: 0.25 }
  },
  event_butterfly_jar: {
    id: "event_butterfly_jar",
    name: "🦋 Frasco de mariposas",
    description: "+5% probabilidad de encontrar eventos secretos en el jardín.",
    cost: 600, tier: 2, scope: "local", zone: "spring_garden", currency: "bouquets",
    category: "event", unlock: "event_butterfly",
    effect: { secretBoost: 0.05 }
  },
  event_garden_candle: {
    id: "event_garden_candle",
    name: "🕯️ Vela de jardín",
    description: "\"Alguien estuvo aquí.\"",
    cost: 700, tier: 2, scope: "local", zone: "spring_garden", currency: "bouquets",
    category: "event", unlock: "event_night_garden", mystery: true
  },

  // ===================== ❓ OBJETOS TRAS EVENTOS (bosque) =====================
  event_leaf_bag: {
    id: "event_leaf_bag",
    name: "🍂 Bolsa de hojas antiguas",
    description: "Contiene hojas de otra época.",
    cost: 150, tier: 2, scope: "local", zone: "whispering_forest", currency: "whispering_forest.bundles",
    category: "event", unlock: "event_walking_leaves", mystery: true
  },
  event_tracking_lens: {
    id: "event_tracking_lens",
    name: "🔎 Lente de rastreo",
    description: "Rastrea a la criatura que te observa.",
    cost: 500, tier: 2, scope: "local", zone: "whispering_forest", currency: "whispering_forest.bundles",
    category: "event", unlock: "event_watching_3", mystery: true
  },
  event_ghost_mushroom: {
    id: "event_ghost_mushroom",
    name: "🍄 Hongo de la memoria",
    description: "+10% probabilidad de encontrar eventos de criaturas.",
    cost: 350, tier: 2, scope: "local", zone: "whispering_forest", currency: "whispering_forest.bundles",
    category: "event", unlock: "event_mushroom_circle",
    effect: { creatureEventBoost: 0.10 }
  },
  event_fog_jar: {
    id: "event_fog_jar",
    name: "🫙 Frasco de niebla",
    description: "Guarda la niebla del bosque. Misterioso.",
    cost: 200, tier: 2, scope: "local", zone: "whispering_forest", currency: "whispering_forest.bundles",
    category: "event", unlock: "event_fog_10", mystery: true
  },
  event_night_feather: {
    id: "event_night_feather",
    name: "🪶 Pluma nocturna",
    description: "+10% probabilidad de encontrar eventos nocturnos.",
    cost: 250, tier: 2, scope: "local", zone: "whispering_forest", currency: "whispering_forest.bundles",
    category: "event", unlock: "event_owl",
    effect: { nightEventBoost: 0.10 }
  },
  event_marked_wood: {
    id: "event_marked_wood",
    name: "🪵 Fragmento de madera marcada",
    description: "\"Alguien hizo esta marca para recordar el camino.\"",
    cost: 450, tier: 3, scope: "local", zone: "whispering_forest", currency: "whispering_forest.bundles",
    category: "event", unlock: "event_marked_tree", mystery: true
  },

  // ===================== ⚠️ LEGADO (mejoras antiguas, se mantienen por compatibilidad) =====
  careful_fingers: {
    id: "careful_fingers",
    name: "Dedos Cuidadosos",
    description: "5% de probabilidad de obtener un pétalo adicional.",
    cost: 5, tier: 1, scope: "global", zone: "spring_garden", currency: "bouquets", category: "upgrades",
    effect: { extraPetalChance: 0.05 }
  },
  old_watering_can: {
    id: "old_watering_can",
    name: "Regadera Antigua",
    description: "Las flores reaparecen ligeramente más rápido.",
    cost: 15, tier: 1, scope: "global", zone: "spring_garden", currency: "bouquets", category: "upgrades",
    effect: { respawnSpeed: 0.15 }
  },
  fertile_soil: {
    id: "fertile_soil",
    name: "Tierra Fértil",
    description: "Aumenta la aparición de flores raras.",
    cost: 30, tier: 2, scope: "global", zone: "spring_garden", currency: "bouquets", category: "upgrades",
    effect: { rarityBoost: 0.15 }
  },
  garden_bell: {
    id: "garden_bell",
    name: "Campanilla del Jardín",
    description: "Aumenta la posibilidad de aparición de criaturas.",
    cost: 50, tier: 2, scope: "global", zone: "spring_garden", currency: "bouquets", category: "upgrades",
    effect: { creatureSpawnBoost: 0.2 }
  },
  moonlight: {
    id: "moonlight",
    name: "Luz de Luna",
    description: "Desbloquea determinadas interacciones nocturnas.",
    cost: 75, tier: 3, scope: "global", zone: "spring_garden", currency: "bouquets", category: "upgrades",
    effect: { nightInteractions: true }
  }
};
