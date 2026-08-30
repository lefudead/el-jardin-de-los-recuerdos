/**
 * Utilidades matemáticas (GDD técnico §30).
 */

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function clamp01(value) {
  return clamp(value, 0, 1);
}

export function percent(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}
