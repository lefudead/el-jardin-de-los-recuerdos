// Test funcional del ciclo completo de Nilo (GDD §10-40) vía CDP.
// Flujo: intro narrativa -> tap -> anomalía -> encuentro Nilo -> detenerlo (3 taps)
// -> investigación -> comprar jaula -> capturar -> comprar alimento -> domesticar -> compañero.
// Requiere: servidor en puerto 80 y Chrome headless con CDP en el puerto indicado.
const CDP_PORT = process.argv[2] || "9333";
const APP = "http://127.0.0.1/index.html";

let pass = 0, fail = 0;
const check = (name, cond, extra) => {
  if (cond) { pass++; console.log("PASS: " + name); }
  else { fail++; console.log("FAIL: " + name + (extra ? "  [" + extra + "]" : "")); }
};
const sl = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(ws, expr, timeout = 15000, interval = 200) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const v = await E(ws, expr);
    if (v) return v;
    await sl(interval);
  }
  return null;
}

async function getPageWs() {
  const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
  const list = await res.json();
  const page = list.find((t) => t.type === "page" && t.url === "about:blank") || list.find((t) => t.type === "page");
  return page.webSocketDebuggerUrl;
}
function connect(url) { return new Promise((res, rej) => { const ws = new WebSocket(url); ws.onopen = () => res(ws); ws.onerror = (e) => rej(e); }); }
let mid = 0; const pend = new Map();
function send(ws, m, p = {}) { return new Promise((res, rej) => { const id = ++mid; pend.set(id, { res, rej }); ws.send(JSON.stringify({ id, method: m, params: p })); }); }
function attach(ws) { ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } }; }
async function E(ws, x) { const r = await send(ws, "Runtime.evaluate", { expression: x, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error("eval: " + JSON.stringify(r.exceptionDetails)); return r.result?.value; }

/** Avanza todos los diálogos visibles. */
async function advanceDialogs(ws, max = 30) {
  let guard = 0;
  while (guard++ < max) {
    const visible = await E(ws, `document.querySelector('.dialog-box')?.offsetParent !== null`);
    if (!visible) break;
    await E(ws, `document.querySelector('.dialog-box')?.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))`);
    await sl(120);
  }
}

async function main() {
  const ws = await connect(await getPageWs()); attach(ws); await send(ws, "Runtime.enable");

  // Partida nueva limpia determinista (borra estado persistido Y en memoria)
  await E(ws, `location.href=${JSON.stringify(APP)}`);
  await waitFor(ws, `typeof window.__garden === 'object'`, 20000);
  await E(ws, `window.__garden.reset()`);
  const ready = await waitFor(ws, `typeof window.__garden === 'object'`, 20000);
  check("la app cargó (API de depuración)", ready === true);
  await sl(300);

  // Entrar al jardín -> intro cinematográfico (lo omitimos al instante)
  await E(ws, `document.getElementById('btn-continue').click()`); await sl(400);
  await E(ws, `(() => { const el = document.getElementById('cinematic-intro'); if (el) { el.click(); return true; } return false; })()`);
  await waitFor(ws, `document.getElementById('screen-garden').classList.contains('active')`, 15000);
  check("jardín activo", await E(ws, `document.getElementById('screen-garden').classList.contains('active')`) === true);
  const introShown = await E(ws, `document.querySelector('.dialog-box')?.offsetParent !== null && document.getElementById('screen-garden').classList.contains('active')`);
  check("intro narrativa se muestra", introShown === true);

  // Avanzar diálogos de la intro
  await advanceDialogs(ws);
  check("intro quedó registrada (storyProgress >= 10)", await E(ws, `window.__garden.state.progression.storyProgress >= 10`) === true);

  // Tocar flores hasta 15 taps (anomalía a 5, encuentro narrativo a 15)
  let tapped = 0;
  const targetTaps = 16;
  while (tapped < targetTaps) {
    const nFlowers = await E(ws, `document.querySelectorAll('#garden-area .flower:not(.faded)').length`);
    if (nFlowers === 0) { await sl(1500); continue; }
    await sl(80);
    await E(ws, `document.querySelector('#garden-area .flower:not(.faded)').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))`);
    tapped++;
    // avanzar diálogos que puedan aparecer (anomalía/encuentro)
    await advanceDialogs(ws);
  }

  // Encender encuentro forzado de Nilo
  await E(ws, `window.__garden.spawnNiloForce()`); await sl(200);
  const niloVisible = await E(ws, `document.querySelector('.nilo') !== null`);
  check("Nilo aparece en el jardín (robando)", niloVisible === true);

  // detener: 3 taps el jugador (via debug + directo a la UI)
  // Simulamos los taps del jugador llamando onPlayerTap directamente igual que la UI
  const stopState = await E(ws, `(() => { let r; r = window.__garden.creatureSystem.onPlayerTap('nilo'); r = window.__garden.creatureSystem.onPlayerTap('nilo'); r = window.__garden.creatureSystem.onPlayerTap('nilo'); return { status: r, active: window.__garden.creatureSystem.hasActiveEncounter() }; })()`);
  check("Nilo detenido tras 3 taps (sin encuentro activo)", stopState.active === false, JSON.stringify(stopState));

  const researchAfterStop = await E(ws, `window.__garden.state.creatures.research['nilo'] ?? -1`);
  console.log("   [research tras detener a Nilo]", researchAfterStop);
  check("investigación avanzó tras la intervención", typeof researchAfterStop === "number" && researchAfterStop > 0);

  check("Nilo está descubierto", await E(ws, `window.__garden.state.creatures.discovered.includes('nilo')`) === true);

  // Financiar y comprar jaula + capturar
  await E(ws, `window.__garden.grantBouquets(200)`); await sl(150);
  const cageRes = await E(ws, `window.__garden.buyCage('nilo')`);
  check("jaula comprada", cageRes === "ok", String(cageRes));
  const capRes = await E(ws, `window.__garden.capture('nilo')`);
  check("Nilo capturado", capRes && capRes.ok === true, JSON.stringify(capRes));
  check("stats criaturasCapturadas == 1", await E(ws, `window.__garden.state.stats.creaturesCaptured === 1`) === true);

  // Comprar alimento (varias raciones) y domesticar (10 taps dentro del tiempo)
  const foodRes = await E(ws, `(() => { let last="nope"; for(let i=0;i<6;i++){ last = window.__garden.buyFood('nilo'); } return last; })()`);
  check("alimento comprado", foodRes === "ok", String(foodRes));
  const tameRes = await E(ws, `window.__garden.feedAndTame('nilo', 10, true)`);
  check("Nilo domesticado → compañero", tameRes && tameRes.tamed === true, JSON.stringify(tameRes));
  check("stats criaturasTamed == 1", await E(ws, `window.__garden.state.stats.creaturesTamed === 1`) === true);

  // Memoria restaurada (la cinta) tras domesticar
  await sl(1200); // esperar a que el diálogo de memoria se dispare
  const memRestored = await E(ws, `window.__garden.state.memories.found.includes('memory_nilo_ribbon') || window.__garden.state.memories.restored.includes('memory_nilo_ribbon')`);
  check("memoria 'La cinta de Nilo' encontrada", memRestored === true);

  // Persistencia tras recargar
  await E(ws, `location.reload()`);
  await waitFor(ws, `typeof window.__garden === 'object'`, 20000);
  await sl(400);
  check("persistencia: Nilo sigue capturado y domesticado tras recargar",
    await E(ws, `window.__garden.state.creatures.captured.includes('nilo') && window.__garden.state.creatures.tamed.includes('nilo')`) === true);

  console.log(`\nRESULTADO: ${pass} pasados, ${fail} fallados`);
  ws.close(); process.exit(fail > 0 ? 1 : 0);
}
main().catch((e) => { console.error("TEST ERROR:", e); process.exit(2); });
