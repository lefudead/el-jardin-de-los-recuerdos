/**
 * Datos de eventos (GDD §33, GDD técnico §28/29).
 */
export const EVENTS = {
  full_moon: {
    id: "full_moon",
    name: "Luna Llena",
    type: "moon",
    conditions: { timeOfDay: "night" },
    effects: { creatureSpawnMultiplier: 2 },
    duration: 300,
    emoji: "🌕"
  },
  rain: {
    id: "rain",
    name: "Lluvia",
    type: "weather",
    conditions: {},
    effects: { aquaticFlowers: true },
    duration: 600,
    emoji: "🌧️"
  }
};
