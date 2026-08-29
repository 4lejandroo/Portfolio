// Interfaz de navegación: dots laterales, nav activo, reveals con anime.js,
// acordeón de proyectos e iconos de lucide.

import { REDUCED } from './config.js';
import { LABELS } from './data.js';

export function createUI(clock, sections, recomputeStops) {
  const dotsEl = document.getElementById('dots');
  const navLinks = [...document.querySelectorAll('.nav-links a')];

  /* ---------- Dots laterales ---------- */
  LABELS.forEach((lb, i) => {
    const b = document.createElement('button');
    b.innerHTML = `<span class="tip">${lb}</span>`;
    b.setAttribute('aria-label', lb);
    b.addEventListener('click', () => sections[i].scrollIntoView({ behavior: 'smooth' }));
    dotsEl.appendChild(b);
  });
  const dotBtns = [...dotsEl.children];

  /* ---------- Sección activa (nav + dots + modo de pantalla) ---------- */
  function updateActive() {
    let idx = 0;
    sections.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      if (r.top < innerHeight * .45) idx = i;
    });
    clock.targetMode = idx;
    dotBtns.forEach((b, i) => b.classList.toggle('active', i === idx));
    navLinks.forEach((a) => a.classList.toggle('active', a.dataset.sec === sections[idx].id));
    document.getElementById('nav').classList.toggle('scrolled', scrollY > 40);
  }
  addEventListener('scroll', updateActive, { passive: true });
  updateActive();

  /* ---------- Reveals (se activan al cerrar el loader) ---------- */
  let revealsStarted = false;
  function startReveals() {
    if (revealsStarted) return;
    revealsStarted = true;
    const hasAnime = typeof anime !== 'undefined';
    const rvs = [...document.querySelectorAll('.rv')];
    if (hasAnime && !REDUCED) rvs.forEach((el) => el.style.opacity = 0);
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      io.unobserve(el);
      if (hasAnime && !REDUCED) {
        const d = parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0;
        anime({
          targets: el,
          opacity: [0, 1],
          translateY: [26, 0],
          duration: 700,
          delay: d * 1000,
          easing: 'easeOutCubic',
        });
      } else el.classList.add('in');
    }), { threshold: .12 });
    rvs.forEach((el) => io.observe(el));
  }

  /* ---------- Acordeón de proyectos ---------- */
  document.querySelectorAll('.proj-head').forEach((h) => h.addEventListener('click', () => {
    const item = h.parentElement;
    const body = item.querySelector('.proj-body');
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.proj.open').forEach((o) => {
      o.classList.remove('open');
      o.querySelector('.proj-body').style.maxHeight = 0;
    });
    if (!wasOpen) {
      item.classList.add('open');
      body.style.maxHeight = body.scrollHeight + 'px';
    }
    // el acordeón cambia la altura de la página → recalc de los stops
    setTimeout(recomputeStops, 550);
  }));
  addEventListener('resize', () => {
    document.querySelectorAll('.proj.open .proj-body').forEach((b) => b.style.maxHeight = b.scrollHeight + 'px');
    recomputeStops();
  });

  /* ---------- Iconos ---------- */
  if (window.lucide) lucide.createIcons();

  return { startReveals };
}