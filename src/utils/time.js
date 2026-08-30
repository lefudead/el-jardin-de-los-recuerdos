/**
 * Utilidades de tiempo / ciclo día-noche (GDD técnico §14).
 */

/**
 * Estados del ciclo: day, sunset, night, full_moon.
 * En el prototipo el tiempo avanza por ciclos controlados, no por reloj real.
 */
export const TIME_STATES = ["day", "sunset", "night"];

/** Devuelve el siguiente estado del ciclo. */
export function nextTime(current) {
  if (current === "day") return "sunset";
  if (current === "sunset") return "night";
  return "day";
}

/** Etiqueta en español para un estado. */
export function timeLabel(state) {
  return {
    day: "☀️ Día",
    sunset: "🌇 Atardecer",
    night: "🌙 Noche",
    full_moon: "🌕 Luna Llena"
  }[state] || state;
}

/** Determina si un horario de flor coincide con el estado actual. */
export function timeMatches(flowerTime, currentTime) {
  if (!flowerTime || flowerTime.length === 0) return true;
  if (flowerTime.includes("all")) return true;
  return flowerTime.includes(currentTime);
}

/** Determinación simple de día/noche a partir de hora (para criaturas con schedule). */
export function isNightHour(hour) {
  return hour >= 20 || hour < 6;
}
