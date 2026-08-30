/**
 * Utilidades de azar (GDD técnico §10).
 */

/** Número aleatorio entre min y max (inclusive). */
export function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Decimal aleatorio entre min y max. */
export function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

/** Elige un elemento aleatorio de un array. */
export function pick(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/** Devuelve true con probabilidad p (0-1). */
export function chance(p) {
  return Math.random() < p;
}

/** Elige un ID de un mapa de probabilidades { id: chancePonderada }. */
export function weightedPick(map) {
  const entries = Object.entries(map);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [key, w] of entries) {
    r -= w;
    if (r <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

/** Mezcla un array (Fisher–Yates), devuelve una copia. */
export function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
