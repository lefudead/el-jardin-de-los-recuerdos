/**
 * Configuración central del juego.
 * Los valores principales se cambian desde aquí (GDD técnico §58).
 */
export const CONFIG = {
  // Economía
  petalsPerBouquet: 10,

  // Taps / animaciones
  tapAnimationDuration: 100,

  // Guardado
  autosaveInterval: 30000,

  // Debug (desactivar en versión final)
  debug: false,

  // Ciclo día/noche vinculado al tiempo real del jugador (horas locales).
  dayNight: {
    realTimeSyncMs: 30000,  // re‑evalúa la hora real cada 30 s
    dayStartHour: 7,        // a las 7 empieza el día
    sunsetStartHour: 18,    // a las 18 el atardecer
    nightStartHour: 20      // a las 20 la noche
  },

  // Resolución lógica orientativa (9:16)
  logicalWidth: 360,
  logicalHeight: 640,

  // Raridad de flores: probabilidades de aparición
  rarityChance: {
    common: 0.6,
    uncommon: 0.25,
    rare: 0.1,
    special: 0.04,
    secret: 0.01
  },

  // Respawning
  respawnMinMs: 8000,
  respawnMaxMs: 15000,

  // Nilo (GDD §40): aparición y robo de flores
  nilo: {
    spawnIntervalMs: 30000,   // intento de aparición cada 30 s
    spawnChance: 0.30,        // 30% de probabilidad en cada intento
    tapSpawnChance: 0.005,    // 0.5% al recoger una flor
    stealPenaltyMs: 30 * 1000,  // Nilo solo quita flores 30 segundos
    stealFlowers: 1           // cuántas flores se lleva por robo
  },

  // Topo del bosque (GDD §41): entierra las plantas y huye por los huecos.
  moss: {
    spawnIntervalMs: 25000,   // intento de aparición (lo gestiona el tick compartido)
    spawnChance: 0.22,        // 22% en cada intento (bosque)
    tapSpawnChance: 0.004,    // 0.4% al recoger una flor del bosque
    eventMs: 60 * 1000,       // el evento dura 60 s
    visibleAfterTouchMs: 2000, // al tocarlo, las plantas se ven 2 s
    researchPerTap: 10,       // +10% de investigación por toque
    dropDoubleFriendship: 200, // al llegar a 200 de amistad, botín doble + objeto extra
    drops: {
      mushroom: { chance: 0.05, min: 1, max: 5 },   // hongo
      leaves:   { chance: 0.60, min: 10, max: 20 },  // hojas sueltas
      bundles:  { chance: 0.40, min: 5, max: 10 },   // bultos de hojas
      flower:   { chance: 0.50, min: 10, max: 20 },  // pétalos
      bouquet:  { chance: 0.40, min: 5, max: 10 }    // ramos
    }
  }
};
