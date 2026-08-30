/**
 * Datos de recuerdos / contenido personal (GDD §57, §72-80, §96-98).
 * Son los recuerdos materializados que se restauran al domesticar criaturas.
 */
export const MEMORIES = {
  memory_01: {
    id: "memory_01",
    name: "El Primer Día",
    type: "text",
    requirement: "story_10",
    text: "El jardín estaba en silencio y, aun así, parecía esperarte.",
    emoji: "🌿"
  },
  memory_house: {
    id: "memory_house",
    name: "La Casa",
    type: "text",
    requirement: "story_10",
    text: "Habían pasado seis años desde la última vez que estuviste aquí. Todos decían que debías vender esta casa. Tal vez tenían razón.",
    emoji: "🏠"
  },
  memory_nilo_ribbon: {
    id: "memory_nilo_ribbon",
    name: "La Cinta de Nilo",
    type: "creature",
    creatureId: "nilo",
    requirement: "tamed_nilo",
    text: "Nilo encontró una cinta de pelo olvidada en el jardín. La reconociste. Era de él — de tu esposo — de cuando jugaba a decorar las flores con las coletas deshechas de los dos.",
    emoji: "🎀"
  },
  memory_sunday: {
    id: "memory_sunday",
    name: "Los Domingos",
    type: "text",
    requirement: "story_20",
    text: "Aquí cocinábamos los domingos. El olor a pan llenaba la casa y tú lo esperabas en la puerta.",
    emoji: "🥖"
  },
  our_garden: {
    id: "our_garden",
    name: "Nuestro Jardín",
    type: "special_memory",
    requirement: "story_final",
    emoji: "❤️"
  }
};

export function memoryForCreature(creatureId) {
  return Object.values(MEMORIES).find((m) => m.creatureId === creatureId) || null;
}
