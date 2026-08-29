// La pantalla del notebook: un canvas 2D redibujado cada frame.
// Se dibujan 6 "modos" (terminal, perfil, proyectos, skills, formación, mail)
// y las transiciones entre ellos. Se instancia desde laptop.js, que lo usa
// como textura del panel y le pasa el renderer para el anisótropo.

import { CanvasTexture, SRGBColorSpace } from 'three';
import { REDUCED } from './config.js';
import { easeOutCubic } from './math.js';
import {
  BIOS, TERM_LINES, JSON_LINES, PROJECTS, SKILLS, TIMELINE, MODE_LABELS,
} from './data.js';

const SW = 1024;
const SH = 640;

export function createScreen(renderer, clock) {
  const src = document.createElement('canvas');
  src.width = SW;
  src.height = SH;
  const g = src.getContext('2d');

  const texture = new CanvasTexture(src);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  // polyfill por si el navegador no soporta roundRect
  if (!g.roundRect) g.roundRect = function (x, y, w, h) { this.rect(x, y, w, h); };

  const C = { green: '#57ff9a', cream: '#e9ece3', dim: '#7c887e', amber: '#e8b34b', bg: '#081109' };
  const font = (px, w = 500) => `${w} ${px}px "IBM Plex Mono", monospace`;

  // Reloj de cada modo: cuando se entra a un modo, se marca su instante de inicio.
  const modeStarts = [0, 0, 0, 0, 0, 0];

  /* ---------- Marco base de la pantalla ---------- */
  function drawFrame(mode) {
    g.fillStyle = '#050705';
    g.fillRect(0, 0, SW, SH);
    g.fillStyle = C.bg;
    g.fillRect(36, 36, SW - 72, SH - 72);
    g.fillStyle = '#1d2a20';
    g.beginPath(); g.arc(SW / 2, 19, 5, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.016)';
    for (let y = 36; y < SH - 36; y += 4) g.fillRect(36, y, SW - 72, 1);
    g.font = font(19); g.textAlign = 'right'; g.fillStyle = 'rgba(120,255,170,.45)';
    g.fillText(`${MODE_LABELS[mode]} · ${String(mode + 1).padStart(2, '0')}/06`, SW - 56, 68);
    g.textAlign = 'left';
  }

  /* ---------- Terminal: BIOS + $ whoami ---------- */
  function drawTerminal(x, lh) {
    const bt = clock.bootAt === null ? -1 : clock.elapsed - clock.bootAt;
    const STEP = .3;
    const TYPE = 55;
    const biosDur = (BIOS.length - 1) * STEP + .45;

    if (bt < 0) {
      // aún cargando: solo un cursor parpadeando en pantalla oscura
      if ((clock.elapsed * 2) % 2 < 1) { g.fillStyle = C.dim; g.fillRect(x, 78, 13, 26); }
      return;
    }

    // BIOS: aparece línea a línea desde el instante exacto del arranque
    for (let i = 0; i < BIOS.length; i++) {
      if (bt > i * STEP) { g.font = font(24); g.fillStyle = C.dim; g.fillText(BIOS[i], x, 92 + i * lh); }
    }

    // terminal escribiéndose
    const delay = clock.skipBios ? .1 : biosDur;
    const budget = clock.termDone ? 1e9 : Math.floor(Math.max(0, bt - delay) * TYPE);
    let y = 92 + BIOS.length * lh + 14;
    let used = 0;
    let all = true;
    let lastX = x;
    let lastY = y;
    for (const ln of TERM_LINES) {
      const show = Math.max(0, Math.min(ln.t.length, budget - used));
      used += ln.t.length + 4;
      if (show < ln.t.length) all = false;
      if (show <= 0) break;
      g.font = ln.c === 'cmd' ? font(26, 600) : font(26);
      g.fillStyle = ln.c === 'cmd' ? C.cream : ln.c === 'ok' ? C.green : C.dim;
      const part = ln.t.slice(0, show);
      g.fillText(part, x, y);
      lastX = x + g.measureText(part).width;
      lastY = y;
      y += lh + 4;
    }
    if (all) clock.termDone = true;
    if ((clock.elapsed * 2) % 2 < 1) { g.fillStyle = C.green; g.fillRect(lastX + 10, lastY - 21, 13, 26); }
  }

  /* ---------- perfil.json ---------- */
  function drawProfile(x, lh, alpha, tm) {
    const jsonColor = (k) => k === 'key' ? C.green : k === 'str' ? C.cream : k === 'num' ? C.amber : C.dim;
    let col = null;
    let y = 96 - lh;
    for (let i = 0; i < JSON_LINES.length; i++) {
      const [txt, cls] = JSON_LINES[i];
      const a = REDUCED ? 1 : easeOutCubic(tm * 5 - i * .45);
      if (cls === 'key') { if (a > 0) col = txt; continue; }
      y += lh;
      if (a <= 0) { col = null; continue; }
      g.globalAlpha = alpha * a;
      g.font = font(26);
      if (col) { g.fillStyle = jsonColor('key'); g.fillText(col, x, y); }
      g.fillStyle = jsonColor(cls);
      g.fillText(txt, x + (col ? g.measureText(col).width : 0), y);
      col = null;
      g.globalAlpha = alpha;
    }
  }

  /* ---------- Lista de proyectos ---------- */
  function drawProjects(x) {
    g.font = font(24, 600); g.fillStyle = C.dim;
    g.fillText('~/proyectos', x, 84);
    g.fillStyle = C.green; g.fillText(`(${PROJECTS.length})`, x + 190, 84);
    const active = Math.floor(clock.elapsed * .8) % PROJECTS.length;
    for (let i = 0; i < PROJECTS.length; i++) {
      const y = 128 + i * 80;
      const on = i === active;
      if (on) {
        g.fillStyle = 'rgba(87,255,154,.12)'; g.fillRect(48, y - 30, SW - 96 - 60, 62);
        g.fillStyle = C.green; g.fillRect(48, y - 30, 5, 62);
      }
      g.font = font(21); g.fillStyle = on ? C.green : C.dim;
      g.fillText(PROJECTS[i][0], x, y - 4);
      g.font = font(25, 600); g.fillStyle = on ? C.cream : 'rgba(233,236,227,.75)';
      g.fillText(PROJECTS[i][1], x + 70, y - 4);
      g.font = font(19); g.fillStyle = C.dim;
      g.fillText(PROJECTS[i][2], x + 70, y + 22);
    }
  }

  /* ---------- Monitor de skills ---------- */
  function drawSkills(x, alpha, tm) {
    g.font = font(24, 600); g.fillStyle = C.dim;
    g.fillText('$ skills --monitor', x, 84);
    SKILLS.forEach(([name, pct], i) => {
      const y = 132 + i * 78;
      const a = REDUCED ? 1 : easeOutCubic(tm * 4 - i * .3);
      g.globalAlpha = alpha * a;
      g.font = font(24); g.fillStyle = C.cream;
      g.fillText(name.padEnd(16, ' '), x, y);
      const bx = x + 280;
      const bw = 520;
      const bh = 24;
      g.fillStyle = 'rgba(233,236,227,.08)';
      g.fillRect(bx, y - 19, bw, bh);
      const fill = bw * (pct / 100) * easeOutCubic(tm * 1.2 - i * .12);
      g.fillStyle = C.green; g.fillRect(bx, y - 19, Math.max(0, fill), bh);
      const sh = ((clock.elapsed * .45 + i * .17) % 1) * Math.max(0, fill);
      g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(bx + sh, y - 19, 26, bh);
      g.font = font(22); g.fillStyle = C.dim;
      g.fillText(`${Math.round(pct * easeOutCubic(tm * 1.2 - i * .12))}%`, bx + bw + 20, y);
      g.globalAlpha = alpha;
    });
  }

  /* ---------- Línea de tiempo ---------- */
  function drawTimeline(x, lh, alpha, tm) {
    g.font = font(24, 600); g.fillStyle = C.dim;
    g.fillText('formacion.log', x, 84);
    const lx = 120;
    g.strokeStyle = 'rgba(87,255,154,.3)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(lx, 110); g.lineTo(lx, 560); g.stroke();
    TIMELINE.forEach(([year, title, sub], i) => {
      const y = 130 + i * 92;
      const a = REDUCED ? 1 : easeOutCubic(tm * 4 - i * .55);
      if (a <= 0) return;
      g.globalAlpha = alpha * a;
      g.fillStyle = C.green; g.beginPath(); g.arc(lx, y - 8, 8, 0, 7); g.fill();
      g.fillStyle = C.bg; g.beginPath(); g.arc(lx, y - 8, 3.4, 0, 7); g.fill();
      g.font = font(19); g.fillStyle = C.green;
      g.fillText(year, lx + 34, y - 22);
      g.font = font(25, 600); g.fillStyle = C.cream;
      g.fillText(title, lx + 34, y + 4);
      g.font = font(19); g.fillStyle = C.dim;
      g.fillText(sub, lx + 34, y + 28);
      g.globalAlpha = alpha;
    });
  }

  /* ---------- Correo ---------- */
  function drawMail(alpha) {
    const win = { x: 60, y: 78, w: SW - 120, h: 470 };
    g.fillStyle = '#0a130d'; g.strokeStyle = 'rgba(233,236,227,.14)'; g.lineWidth = 2;
    g.beginPath(); g.roundRect(win.x, win.y, win.w, win.h, 14); g.fill(); g.stroke();
    g.fillStyle = 'rgba(233,236,227,.06)'; g.fillRect(win.x + 2, win.y + 2, win.w - 4, 46);
    ['#3a443c', '#3a443c', C.green].forEach((col, i) => {
      g.fillStyle = col; g.beginPath(); g.arc(win.x + 34 + i * 26, win.y + 25, 6, 0, 7); g.fill();
    });
    g.font = font(20); g.fillStyle = C.dim;
    g.fillText('nuevo mensaje', win.x + 130, win.y + 32);
    let y = win.y + 96;
    const field = (k, v) => {
      g.font = font(23); g.fillStyle = C.green; g.fillText(k, win.x + 32, y);
      g.fillStyle = C.cream; g.fillText(v, win.x + 130, y); y += 42;
      g.strokeStyle = 'rgba(233,236,227,.09)';
      g.beginPath(); g.moveTo(win.x + 30, y - 20); g.lineTo(win.x + win.w - 30, y - 20); g.stroke();
    };
    field('para:', 'muena.rojas.alejandro@gmail.com');
    field('asunto:', 'hola alejandro — proyecto');
    g.font = font(23); g.fillStyle = C.dim;
    g.fillText('vi tu portafolio y me gustaría conversar', win.x + 32, y + 12);
    g.fillText('sobre un desarrollo web / móvil.', win.x + 32, y + 46);
    const pulse = REDUCED ? 1 : .72 + .28 * Math.sin(clock.elapsed * 3.2);
    const bw2 = 210;
    const bx = win.x + win.w - bw2 - 30;
    const by = win.y + win.h - 78;
    g.globalAlpha = alpha * pulse;
    g.fillStyle = C.green;
    g.beginPath(); g.roundRect(bx, by, bw2, 52, 8); g.fill();
    g.font = font(23, 700); g.fillStyle = '#06120a';
    g.fillText('ENVIAR  ▸', bx + 54, by + 33);
    g.globalAlpha = alpha;
  }

  /* ---------- Dibujo de un modo (con clip) ---------- */
  function drawMode(mode, alpha, dy) {
    const tm = clock.elapsed - modeStarts[mode]; // reloj del modo: transcurrido, nunca absoluto
    const x = 64;
    const lh = 36;
    g.save();
    g.globalAlpha = alpha;
    g.translate(0, dy);
    g.beginPath(); g.rect(36, 36, SW - 72, SH - 72); g.clip();
    switch (mode) {
      case 0: drawTerminal(x, lh); break;
      case 1: drawProfile(x, lh, alpha, tm); break;
      case 2: drawProjects(x); break;
      case 3: drawSkills(x, alpha, tm); break;
      case 4: drawTimeline(x, lh, alpha, tm); break;
      case 5: drawMail(alpha); break;
    }
    g.restore();
  }

  /* ---------- Composición final del frame ---------- */
  function draw() {
    drawFrame(clock.screenMode);
    if (clock.trans) {
      const t = easeOutCubic(Math.min(1, clock.trans.t));
      drawMode(clock.trans.from, 1 - t, -t * 40);
      drawMode(clock.trans.to, t, (1 - t) * 40);
      const sy = 36 + Math.min(1, clock.trans.t) * (SH - 72);
      g.fillStyle = 'rgba(120,255,170,.07)'; g.fillRect(36, sy - 26, SW - 72, 52);
      g.fillStyle = 'rgba(120,255,170,.35)'; g.fillRect(36, sy - 1, SW - 72, 2);
    } else {
      drawMode(clock.screenMode, 1, 0);
    }
    texture.needsUpdate = true;
  }

  /* ---------- Cambio de modo ---------- */
  function setMode(m) {
    if (m === clock.screenMode || m < 0 || m >= MODE_LABELS.length) return;
    if (m === 0) clock.skipBios = true;
    clock.trans = { from: clock.screenMode, to: m, t: 0 };
    clock.screenMode = m;
    modeStarts[m] = clock.elapsed;
  }

  return { draw, setMode, texture };
}