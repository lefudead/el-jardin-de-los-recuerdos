/**
 * Capa de almacenamiento (localStorage). GDD técnico §1.3 / §6.
 */
const PREFIX = "jardin_recuerdos:";

export function saveToStorage(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn("[storage] no se pudo guardar", e);
    return false;
  }
}

export function loadFromStorage(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("[storage] no se pudo cargar", e);
    return null;
  }
}

export function removeFromStorage(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch (e) {
    console.warn("[storage] no se pudo eliminar", e);
  }
}
