/**
 * CinematicIntro — intro cinematográfico de narración.
 * Texto en fondo negro que aparece lentamente (palabra a palabra),
 * y al terminar un destello de luz da paso al juego.
 */

const Q = (id) => document.getElementById(id);

// Texto narrativo del inicio (usa el lore del GDD).
const LINES = [
  "Habían pasado seis años desde la última vez que estuve aquí.",
  "Todos decían que debía vender esta casa. Que no quedaba nada para mí.",
  "Tal vez tenían razón.",
  "Pero el y yo vivimos aquí. Antes de que desapareciera.",
  "Antes de que todos decidieran que estaba muerto.",
  "Y sin embargo regresé.",
  "Porque volver aquí podría darme la oportunidad de... encontrarlo.",
  "",
  "El Jardín de los Recuerdos"
];

// Duración base por palabra (ms) y pausa entre líneas.
const WORD_MS = 230;
const LINE_GAP_MS = 700;
const LAST_HOLD_MS = 1400;

export function playCinematicIntro(onComplete) {
  // Si ya existe un intro en curso, no duplicar.
  if (document.getElementById("cinematic-intro")) return;

  const overlay = document.createElement("div");
  overlay.id = "cinematic-intro";
  overlay.className = "cinematic-intro";

  const textEl = document.createElement("div");
  textEl.className = "cinematic-text";
  overlay.appendChild(textEl);

  const hintEl = document.createElement("div");
  hintEl.className = "cinematic-hint";
  hintEl.textContent = "toca para omitir";
  overlay.appendChild(hintEl);

  document.body.appendChild(overlay);

  let skip = false;
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    // Destello de luz -> transición al juego.
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

  const endWord = () => {
    // Mostrar la última palabra / el título y dejar respiro antes del destello.
    setTimeout(finish, LAST_HOLD_MS);
  };

  // Muestra una línea palabra por palabra (efecto narración).
  const playLine = (idx) => {
    if (skip) {
      // Saltar: mostrar todo el texto y finalizar.
      textEl.innerHTML = "";
      LINES.forEach((l, i) => {
        const p = document.createElement("p");
        if (!l) p.className = "cinematic-spacer";
        p.innerHTML = l;
        p.style.opacity = "1";
        textEl.appendChild(p);
      });
      endWord();
      return;
    }
    if (idx >= LINES.length) {
      endWord();
      return;
    }

    const raw = LINES[idx];
    const p = document.createElement("p");
    if (idx === LINES.length - 1) p.className = "cinematic-title";
    if (!raw) {
      p.className = "cinematic-spacer";
    }
    textEl.appendChild(p);
    p.style.opacity = "1";

    const words = raw.split(" ");
    let wi = 0;
    const step = () => {
      if (skip) return;
      if (wi >= words.length) {
        timer = setTimeout(() => playLine(idx + 1), LINE_GAP_MS);
        return;
      }
      // Añadir la palabra con un espacio.
      const w = document.createElement("span");
      w.className = "cinematic-word";
      w.textContent = words[wi] + " ";
      p.appendChild(w);
      wi++;
      timer = setTimeout(step, WORD_MS);
    };
    step();
  };

  let timer = setTimeout(() => playLine(0), 600);

  // Tocar para omitir (acelera / termina).
  const onClick = () => {
    if (finished) return;
    skip = true;
    playLine(0);
  };
  overlay.addEventListener("click", onClick);
  overlay.addEventListener("touchend", (e) => { e.preventDefault(); onClick(); }, { passive: false });
}
