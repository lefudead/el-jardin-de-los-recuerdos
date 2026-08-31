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

/**
 * Conversión de la moneda menor de cada zona a su forma "fuerte".
 * En el bosque: cada 10 hojas → 1 bulto de hojas (🍂).
 * `minor` debe coincidir con la moneda suelta; `major` es la forma mayor
 * que cobra la tienda de la zona. `zoneCurrencies` registra ambas claves
 * para sembrarlas desde 0 en el estado.
 */
export const ZONE_CONVERSIONS = {
  whispering_forest: { minor: "leaves", major: "bundles", rate: 10 }
};

/** Todas las claves de moneda que se siembran por zona (incluye mayor+menor). */
export const ZONE_CURRENCIES = {
  spring_garden: { petals: 0, bouquets: 0 },
  whispering_forest: { leaves: 0, bundles: 0 },
  moon_lake: { moonlight: 0 },
  abandoned_house: { dust: 0 },
  memory_garden: { memories: 0 },
  forraje_del_rio: { river_pebbles: 0 },
  clima_variable: { weather_drops: 0 },
  base_de_la_colina: { hill_stones: 0 }
};
