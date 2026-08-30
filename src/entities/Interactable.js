/**
 * Entidad Interactable (GDD técnico §17): objetos/puertas/criaturas interactivas.
 */
export class Interactable {
  constructor(data) {
    this.id = data.id;
    this.type = data.type || "object";
    this.actions = data.actions || ["inspect"];
    this.sprite = null;
    this.enabled = true;
  }
}
