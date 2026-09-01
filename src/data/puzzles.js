/**
 * Datos de acertijos / puzzles (GDD técnico §22).
 */
export const PUZZLES = {
  flower_sequence_01: {
    id: "flower_sequence_01",
    name: "La Habitación de las Flores",
    type: "sequence",
    location: "abandoned_house",
    clues: ["journal:lumi", "flower:leaves"],
    solution: ["moonflower", "daisy", "forest_fallen"],
    hint: "La respuesta florece cuando recuerdas.",
    reward: { type: "item", id: "old_key" }
  }
};
