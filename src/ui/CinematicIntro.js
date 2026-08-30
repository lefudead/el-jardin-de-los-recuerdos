/**
 * CinematicIntro — narración tipo MÁQUINA DE ESCRIBIR.
 * Cada frase se escribe letra a letra, se espera, se borra (retroceso),
 * y pasa a la siguiente. Solo hay una frase en pantalla a la vez.
 * Al final, un destello da paso al juego.
 */

const LINES = [
  "Habían pasado seis años desde la última vez que estuve aquí.",
  "Todos decían que debía vender esta casa. Que no quedaba nada para mí.",
  "Tal vez tenían razón.",
  "Pero él y yo vivimos aquí. Antes de que desapareciera.",
  "Antes de que todos decidieran que estaba muerto.",
  "Y sin embargo regresé.",
  "Porque volver aquí podría darme la oportunidad de... encontrarlo.",
  "",
  "El Jardín de los Recuerdos"
];

// Tiempos (ms).
const TYPE_MS = 42;          // velocidad de escritura (letra a letra)
const BACKSPACE_MS = 22;     // velocidad de borrado
const HOLD_MS = 1300;        // pausa con la frase completa antes de borrar
const CLEAR_GAP_MS = 500;    // pausa de pantalla en negro entre frases
const LAST_HOLD_MS = 1700;   // respiro final con el título antes del destello

export function playCinematicIntro(onComplete) {
  if (document.getElementById("cinematic-intro")) return;

  const overlay = document.createElement("div");
  overlay.id = "cinematic-intro";
  overlay.className = "cinematic-intro";

  const textEl = document.createElement("div");
  textEl.className = "cinematic-text";
  overlay.appendChild(textEl);

  const cursor = document.createElement("span");
  cursor.className = "cinematic-cursor";
  cursor.textContent = "|";
  textEl.appendChild(cursor);

  const hintEl = document.createElement("div");
  hintEl.className = "cinematic-hint";
  hintEl.textContent = "toca para omitir";
  overlay.appendChild(hintEl);

  document.body.appendChild(overlay);

  let finished = false;
  let timer = null;

  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    cursor.style.display = "none";
    overlay.style.transition = "opacity 1s ease, background 1s ease";
    overlay.classList.add("cinematic-flash");
    setTimeout(() => {
      overlay.style.opacity = "0";
      setTimeout(() => {
        overlay.remove();
        onComplete?.();
      }, 900);
    }, 450);
  };

  // Escribe la frase letra a letra con cursor parpadeante.
  const typeLine = (idx) => {
    if (idx >= LINES.length) { setTimeout(finish, LAST_HOLD_MS); return; }

    const raw = LINES[idx];
    const p = document.createElement("p");
    p.className = idx === LINES.length - 1 ? "cinematic-title" : (!raw ? "cinematic-spacer" : "");
    const textNode = document.createTextNode("");
    p.appendChild(textNode);
    // Quitar solo los párrafos anteriores (preservando el cursor parpadeante).
    textEl.querySelectorAll("p").forEach((el) => el.remove());
    textEl.appendChild(p);
    cursor.style.display = "inline";

    let i = 0;
    const tick = () => {
      if (finished) { cursor.style.display = "none"; return; }
      if (i < raw.length) {
        textNode.data = raw.slice(0, ++i);
        timer = setTimeout(tick, TYPE_MS);
        return;
      }
      // Frase completa: esperar; la última se mantiene como título.
      if (idx === LINES.length - 1) {
        setTimeout(finish, LAST_HOLD_MS);
        return;
      }
      timer = setTimeout(() => eraseLine(p, textNode, idx + 1), HOLD_MS);
    };
    tick();
  };

  // Borra la frase letra a letra (retroceso) y pasa a la siguiente.
  const eraseLine = (p, textNode, nextIdx) => {
    const raw = textNode.data;
    let n = raw.length;
    const tick = () => {
      if (finished) { cursor.style.display = "none"; return; }
      if (n > 0) {
        textNode.data = raw.slice(0, --n);
        timer = setTimeout(tick, BACKSPACE_MS);
        return;
      }
      // Frase borrada: pantalla en negro un instante, luego la siguiente.
      cursor.style.display = "none";
      timer = setTimeout(() => typeLine(nextIdx), CLEAR_GAP_MS);
    };
    tick();
  };

  // Omitir: mostrar la frase final (título) y terminar rápido.
  const skipAndFinish = () => {
    if (finished) return;
    clearTimeout(timer);
    cursor.style.display = "none";
    textEl.innerHTML = "";
    const p = document.createElement("p");
    p.className = "cinematic-title";
    p.textContent = LINES[LINES.length - 1];
    p.style.opacity = "1";
    textEl.appendChild(p);
    setTimeout(finish, 400);
  };

  timer = setTimeout(() => typeLine(0), 600);

  const onClick = () => skipAndFinish();
  overlay.addEventListener("click", onClick);
  overlay.addEventListener("touchend", (e) => { e.preventDefault(); onClick(); }, { passive: false });
}
