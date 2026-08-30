/**
 * JournalScene (GDD técnico §19, §50): pantalla del diario.
 * Delega el renderizado en JournalPanel.
 */
import { journalPanel } from "../ui/JournalPanel.js";

export function openJournal() {
  journalPanel.render();
}
