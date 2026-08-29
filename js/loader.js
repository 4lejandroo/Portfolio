// Ciclo de vida de la pantalla de carga (Pac-Man): 3s de animación mínima,
// fade out, desbloqueo del scroll, arranque del BIOS y reveals.

import { REDUCED } from './config.js';

export function runLoader(clock, onComplete) {
  const MIN_LOAD = REDUCED ? 800 : 3000;
  const loadStart = performance.now();
  const pctEl = document.getElementById('loadPct');

  const pctTimer = setInterval(() => {
    if (pctEl) pctEl.textContent = Math.min(99, Math.round((performance.now() - loadStart) / MIN_LOAD * 100)) + '%';
  }, 60);

  let done = false;
  function finishLoading() {
    if (done) return;
    done = true;
    clearInterval(pctTimer);
    if (pctEl) pctEl.textContent = '100%';
    const loader = document.getElementById('loader');
    if (loader) {
      loader.classList.add('done');
      setTimeout(() => loader.remove(), 700);
    }
    document.body.classList.remove('locked');
    clock.bootAt = clock.elapsed;   // el BIOS y el $ whoami arrancan AQUÍ, siempre
    clock.lidReleased = true;       // la tapa se abre ahora
    onComplete();
  }

  Promise.all([
    new Promise((r) => (document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true }))),
    (document.fonts?.ready ?? Promise.resolve()),
    new Promise((r) => setTimeout(r, MIN_LOAD)),
  ]).then(finishLoading);
}