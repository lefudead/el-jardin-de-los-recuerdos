// Test funcional determinista del MVP vía CDP.
// Valida: carga de módulos, entrar al jardín, flores, tap->pétalo, conversión->ramo,
// compra de mejora, guardado y persistencia tras recargar.
// Usa la API de depuración (window.__gardenDebug) para la parte económica.
const CDP_PORT = process.argv[2] || "9333";
const APP = "http://127.0.0.1:8123/index.html";

let pass = 0, fail = 0;
const check = (name, cond, extra) => {
  if (cond) { pass++; console.log("PASS: " + name); }
  else { fail++; console.log("FAIL: " + name + (extra ? "  [" + extra + "]" : "")); }
};
const sl = (ms) => new Promise((r) => setTimeout(r, ms));

/** Espera hasta que una expresión devuelva un valor (o timeout). */
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
let onPageLoad = null;
function send(ws, m, p = {}) { return new Promise((res, rej) => { const id = ++mid; pend.set(id, { res, rej }); ws.send(JSON.stringify({ id, method: m, params: p })); }); }
function attach(ws) { ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.method === "Page.loadEventFired" && onPageLoad) { onPageLoad(); onPageLoad = null; } if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } }; }
async function E(ws, x) { const r = await send(ws, "Runtime.evaluate", { expression: x, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error("eval: " + JSON.stringify(r.exceptionDetails)); return r.result?.value; }

async function main() {
  const ws = await connect(await getPageWs()); attach(ws); await send(ws, "Runtime.enable");
  await send(ws, "Log.enable");
  await send(ws, "Page.enable");
  // Navegación robusta: espera al evento load de la página NUEVA (evita que el
  // sondeo evalúe en la instancia vieja aún viva durante la transición).
  const nav = (url) => new Promise((resolve) => {
    onPageLoad = () => resolve();
    send(ws, "Page.navigate", { url });
  });

  // Empezar de cero (partida nueva) de forma determinista
  await nav(APP);
  await waitFor(ws, `typeof window.__garden === 'object'`, 20000);
  await E(ws, `window.__garden.reset()`);
  await new Promise((resolve) => { onPageLoad = () => resolve(); });
  await waitFor(ws, `typeof window.__garden === 'object'`, 20000);
  await E(ws, `window.__garden.setNiloAutoSpawn(false)`);
  await sl(300);
  const fresh = await E(ws, `({p: document.getElementById('petal-counter').textContent, b: document.getElementById('bouquet-counter').textContent})`);
  check("partida nueva en ceros", fresh.p === "0" && fresh.b === "0", JSON.stringify(fresh));

  check("menú activo al cargar", await E(ws, `document.getElementById('screen-menu').classList.contains('active')`) === true);

  // Entrar al jardín (se muestra el intro cinematográfico; lo omitimos al instante)
  await E(ws, `document.getElementById('btn-continue').click()`); await sl(400);
  await E(ws, `(() => { const el = document.getElementById('cinematic-intro'); if (el) { el.click(); return true; } return false; })()`);
  await waitFor(ws, `document.getElementById('screen-garden').classList.contains('active')`, 15000);
  check("jardín activo", await E(ws, `document.getElementById('screen-garden').classList.contains('active')`) === true);
  const n = await E(ws, `document.querySelectorAll('#garden-area .flower').length`);
  check("se generaron flores (>=3)", n >= 3, "n=" + n);

  // Tap en una flor -> pétalos aumentan
  const p0 = await E(ws, `document.getElementById('petal-counter').textContent`);
  await E(ws, `document.querySelector('#garden-area .flower').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))`); await sl(120);
  const p1 = await E(ws, `document.getElementById('petal-counter').textContent`);
  check("tap incrementó los pétalos", parseInt(p1) > parseInt(p0), `${p0}->${p1}`);

  // Conversión: añadir pétalos vía debug hasta formar ramos y financiar la tienda
  const b0 = await E(ws, `document.getElementById('bouquet-counter').textContent`);
  await E(ws, `window.__garden.addPetals(61)`); await sl(200);
  const b1 = await E(ws, `document.getElementById('bouquet-counter').textContent`);
  check("10 pétalos se convirtieron a ramo", parseInt(b1) >= parseInt(b0) + 1, `${b0}->${b1}`);
  check("hay ramos suficientes para la primera mejora (5)", parseInt(b1) >= 5, "b=" + b1);

  // Tienda: comprar con ramos reales
  await E(ws, `document.querySelector('[data-screen="shop"]').click()`); await sl(250);
  check("tienda activa", await E(ws, `document.getElementById('screen-shop').classList.contains('active')`) === true);
  const diag = await E(ws, `({b: document.getElementById('bouquet-counter').textContent, p: document.getElementById('petal-counter').textContent, btns: [...document.querySelectorAll('#shop-list .buy-btn')].map(x=>({u:x.dataset.upgrade,dis:x.hasAttribute('disabled')}))})`);
  console.log("   [shop diag]", JSON.stringify(diag));
  const canBuy = await E(ws, `(() => { const b = document.querySelector('#shop-list .buy-btn:not([disabled])'); return b ? b.dataset.upgrade : null; })()`);
  check("existe una mejora comprable (cuesta 5)", canBuy === "careful_fingers", "btn=" + canBuy);
  await E(ws, `document.querySelector('#shop-list .buy-btn:not([disabled])').click()`); await sl(250);
  const owned = await E(ws, `(() => { const c = [...document.querySelectorAll('#shop-list .shop-card')].find(x => x.textContent.includes('Dedos Cuidadosos')); return c ? c.classList.contains('owned') : false; })()`);
  check("mejora quedó 'comprada'", owned === true);

  // Guardado en localStorage
  check("guardado en localStorage", await E(ws, `!!localStorage.getItem('jardin_recuerdos:save')`) === true);

  // Recargar: progreso conservado
  await nav(await E(ws, `location.href`));
  await waitFor(ws, `typeof window.__garden === 'object'`, 20000);
  await sl(300);
  const after = await E(ws, `({b: parseInt(document.getElementById('bouquet-counter').textContent), owned: localStorage.getItem('jardin_recuerdos:save').includes('careful_fingers')})`);
  check("progreso conservado tras recargar (ramos>0)", after.b >= 1, "b=" + after.b);
  check("mejora persistida en el guardado", after.owned === true);

  console.log(`\nRESULTADO: ${pass} pasados, ${fail} fallados`);
  ws.close(); process.exit(fail > 0 ? 1 : 0);
}
main().catch((e) => { console.error("TEST ERROR:", e); process.exit(2); });
