/**
 * EventScene (GDD técnico §28, §50). Esqueleto para eventos estacionales.
 */
import { eventSystem } from "../systems/EventSystem.js";

export function openEvent(eventId) {
  const ev = eventSystem.getAll().find((e) => e.id === eventId) || null;
  console.log(`[event] abrir: ${eventId}`, ev ? ev.name : "(no encontrado)");
  return ev;
}

export const eventScene = { open: openEvent };
