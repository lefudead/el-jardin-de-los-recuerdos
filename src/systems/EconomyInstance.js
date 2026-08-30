/**
 * Instancia compartida de EconomySystem (evita dependencias circulares entre
 * EconomySystem y RewardSystem).
 */
import { EconomySystem } from "./EconomySystem.js";

export const economy = new EconomySystem();
