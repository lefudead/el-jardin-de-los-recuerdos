/**
 * CinematicIntro — intro cinematográfico de narración.
 * Texto en fondo negro que aparece FRASE A FRASE (cada frase completa,
 * con pausa y fundido entre ellas), y al terminar un destello da paso al juego.
 */

// Texto narrativo del inicio (usa el lore del GDD).
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

// Tiempos (ms): muestra de frase, pausa entre frases, y respiro final antes del destello.
const SHOW_MS = 1800;
const GAP_MS = 900;
const LAST_HOLD_MS = 1600;
const START_DELAY_MS = 600;

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

  let finished = false;
  let timer = null;

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

  const endNarration = () => {
    // Concertir todas las frases visibles y dar respiro antes del destello.
    setTimeout(finish, LAST_HOLD_MS);
  };

  // Muestra una frase COMPLETA con fundido; espera; pasa a la siguiente.
  const playLine = (idx) => {
    if (idx >= LINES.length) {
      endNarration();
      return;
    }

    const raw = LINES[idx];
    const p = document.createElement("p");
    if (idx === LINES.length - 1) p.className = "cinematic-title";
    if (!raw) p.className = "cinematic-spacer";
    p.textContent = raw;
    p.style.opacity = "0";
    textEl.appendChild(p);

    // Fundido de entrada de la frase (completa).
    requestAnimationFrame(() => { p.style.transition = "opacity 0.8s ease"; p.style.opacity = "1"; });

    // Después del tiempo de lectura, fundir a negro y pasar a la siguiente.
    timer = setTimeout(() => {
      p.style.opacity = "0";
      // Mantener el párrafo (para dar continuidad) pero pausar.
      timer = setTimeout(() => playLine(idx + 1), GAP_MS);
    }, SHOW_MS);
  };

  // Al omitir, mostrar todas las frases de golpe y terminar.
  const skipAndFinish = () => {
    if (finished) return;
    clearTimeout(timer);
    textEl.innerHTML = "";
    LINES.forEach((l, i) => {
      const p = document.createElement("p");
      if (!l) p.className = "cinematic-spacer";
      if (i === LINES.length - 1) p.className = "cinematic-title";
      p.textContent = l;
      p.style.opacity = "1";
      textEl.appendChild(p);
    });
    endNarration();
  };

  timer = setTimeout(() => playLine(0), START_DELAY_MS);

  const onClick = () => skipAndFinish();
  overlay.addEventListener("click", onClick);
  overlay.addEventListener("touchend", (e) => { e.preventDefault(); onClick(); }, { passive: false });
}
