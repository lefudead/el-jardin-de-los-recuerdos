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
  respawnMaxMs: 15000
};
