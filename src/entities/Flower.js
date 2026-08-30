/**
 * Entidad Flower (GDD técnico §32, §45-46).
 * En el prototipo web se representa con un elemento DOM; esta clase describe
 * el estado de una flor colocada en el jardín y su reaparición.
 */
export class Flower {
  constructor(data, index) {
    this.id = data.id;
    this.name = data.name;
    this.rarity = data.rarity;
    this.petalValue = data.petalValue;
    this.zone = data.zone;
    this.time = data.time;
    this.emoji = data.emoji;
    this.spawnChance = data.spawnChance;

    this.index = index;
    this.x = 0; // posición en % relativo al área
    this.y = 0;

    this.respawnMs = 8000;
    this.sprite = null; // referencia al elemento DOM (web) o sprite (Phaser)
    this.active = true;
  }

  /** Devuelve el valor de pétalos al ser tocada (antes de mejoras). */
  baseReward() {
    return this.petalValue;
  }
}
