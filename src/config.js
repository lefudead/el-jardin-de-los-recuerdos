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
    stealPenaltyMs: 20 * 60 * 1000, // una flor menos durante 20 minutos
    stealFlowers: 1           // cuántas flores se lleva por robo
  }
};
