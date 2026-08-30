/**
 * Datos de zonas y sus economías (Actualización 3.1, aún como base técnica).
 * Cada zona tiene una moneda temática propia que se guarda en
 * `resources.zones[zoneId][currencyId]`. El jardín (zona inicial) conserva
 * su economía legada de pétalos/ramos sobre la que se apoya el resto.
 *
 * Esto documenta el alcance (local / cruzada / global) de las mejoras y las
 * monedas de cada zona planeada, sin activar aún zonas completas.
 */

export const ZONES = {
  spring_garden: {
    id: "spring_garden",
    name: "Jardín de Primavera",
    currency: "petals",        // moneda primaria de la zona (aquí: pétalos)
    economy: "garden",         // usa la economía legada de pétalos/ramos
    scope: "local"             // alcance por defecto de sus mejoras
  },
  whispering_forest: {
    id: "whispering_forest",
    name: "Bosque Susurrante",
    currency: "leaves",        // hojas
    economy: "zone",
    scope: "local"
  },
  moon_lake: {
    id: "moon_lake",
    name: "Lago de la Luna",
    currency: "moonlight",     // luz de luna
    economy: "zone",
    scope: "local"
  },
  abandoned_house: {
    id: "abandoned_house",
    name: "Casa Abandonada",
    currency: "dust",          // polvo
    economy: "zone",
    scope: "local"
  },
  memory_garden: {
    id: "memory_garden",
    name: "Jardín de la Memoria",
    currency: "memories",      // fragmentos de recuerdo
    economy: "zone",
    scope: "cross"             // mejoras que afectan de forma cruzada a zonas
  },
  forraje_del_rio: {
    id: "forraje_del_rio",
    name: "Forraje del Río",
    currency: "river_pebbles", // guijarros del río
    economy: "zone",
    scope: "local"
  },
  clima_variable: {
    id: "clima_variable",
    name: "Clima Variable",
    currency: "weather_drops", // gotas de clima
    economy: "zone",
    scope: "global"            // alcance global: afecta a todo el juego
  },
  base_de_la_colina: {
    id: "base_de_la_colina",
    name: "Base de la Colina",
    currency: "hill_stones",   // piedras de la colina
    economy: "zone",
    scope: "global"
  }
};

/** Prefijos de zona → alcance por defecto. Usado por el sistema de mejoras. */
export const DEFAULT_SCOPE = "local";
export const GLOBAL_SCOPE = "global";
export const CROSS_SCOPE = "cross";
