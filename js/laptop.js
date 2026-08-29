// Escena 3D: el notebook estilizado en la mitad vacía de la pantalla.
// Construye el modelo, la iluminación, el scrollytelling de poses,
// la interacción de arrastre y el bucle de render que avanza el reloj
// y redibuja la pantalla del notebook.

import * as THREE from 'three';
import { REDUCED } from './config.js';
import { smoothstep } from './math.js';
import { createScreen } from './screen.js';

// Poses del notebook por sección. La sección activa de texto determina
// en qué mitad de la pantalla se posiciona el modelo.
const POSES = [
  { x:  1.85, y: 0,   ry: -.32, rx: -.02, s: 1,   lid: 1.08, ly: 1.15 }, // hero (texto izq)
  { x: -1.85, y: 0,   ry:  .34, rx: -.02, s: 1,   lid: 1.14, ly: 1.15 }, // sobre mí (texto der)
  { x:  1.80, y: 0,   ry: -.22, rx:  0,   s: .96, lid: 1.20, ly: 1.05 }, // proyectos (texto izq)
  { x: -1.80, y: 0,   ry:  .30, rx: -.04, s: 1,   lid: 1.05, ly: 1.15 }, // habilidades (texto der)
  { x:  1.80, y: .05, ry: -.38, rx: -.03, s: .98, lid: 1.12, ly: 1.15 }, // educación (texto izq)
  { x:  0,    y: .08, ry:  .12, rx:  .05, s: .78, lid:  .92, ly: 2.20 }, // contacto (texto arriba)
];

// Distribución del teclado: anchos por tecla, una fila por entrada.
const KEY_ROWS = [
  { z: -.70, keys: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
  { z: -.51, keys: [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5] },
  { z: -.32, keys: [1.8, 1, 1, 1, 1, 1, 1, 1, 1, 1.8] },
  { z: -.13, keys: [2.3, 1, 1, 1, 1, 1, 1, 1, 2.3] },
  { z: .08,  keys: [1.3, 1.2, 1.2, 1.2, 6.6, 1.2, 1.2, 1.3] },
];

export function createLaptopScene(canvas, clock, sections) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0d0b);

  const camera = new THREE.PerspectiveCamera(40, 1, .1, 100);

  // ---- Pantalla 2D del notebook (instancia propia, depende del renderer) ----
  const screen = createScreen(renderer, clock);

  /* ============================================================
     Luces
     ============================================================ */
  scene.add(new THREE.HemisphereLight(0x4a5a4e, 0x0c0e0c, .55));

  const key = new THREE.DirectionalLight(0xfff1e0, 1.5);
  key.position.set(4.5, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = key.shadow.camera.bottom = -6;
  key.shadow.camera.right = key.shadow.camera.top = 6;
  key.shadow.camera.far = 30;
  key.shadow.bias = -.0005;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x6fffab, .55);
  rim.position.set(-6, 3.5, -6);
  scene.add(rim);

  /* ============================================================
     Suelo (solo sombra) + halo suave
     ============================================================ */
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.ShadowMaterial({ opacity: .35 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const cg = c.getContext('2d');
    const gr = cg.createRadialGradient(128, 128, 10, 128, 128, 128);
    gr.addColorStop(0, 'rgba(70,220,140,.16)');
    gr.addColorStop(.55, 'rgba(50,180,110,.05)');
    gr.addColorStop(1, 'rgba(50,180,110,0)');
    cg.fillStyle = gr;
    cg.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  })();

  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, toneMapped: false }),
  );
  glow.position.set(0, 1, -2.6);
  scene.add(glow);

  /* ============================================================
     EL NOTEBOOK — base, teclado instanciado, tapa con bisagra
     ============================================================ */
  const laptop = new THREE.Group();
  scene.add(laptop);

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1d1a, roughness: .42, metalness: .6 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x101210, roughness: .55, metalness: .35 });
  const keyMat = new THREE.MeshStandardMaterial({ color: 0x232823, roughness: .5, metalness: .25 });

  // base
  const base = new THREE.Mesh(new THREE.BoxGeometry(3.2, .12, 2.1), bodyMat);
  base.position.y = .06;
  base.castShadow = true;
  base.receiveShadow = true;
  laptop.add(base);

  // teclado: teclas instanciadas con anchos reales por fila
  const U = .18;
  const keyCount = KEY_ROWS.reduce((s, r) => s + r.keys.length, 0);
  const keys = new THREE.InstancedMesh(new THREE.BoxGeometry(.16, .035, .15), keyMat, keyCount);
  keys.castShadow = true;
  const d = new THREE.Object3D();
  let ki = 0;
  for (const row of KEY_ROWS) {
    const total = row.keys.reduce((s, w) => s + w, 0) * U;
    let kx = -total / 2;
    for (const w of row.keys) {
      d.position.set(kx + U * w / 2, .146, row.z);
      d.scale.set((U * w - .02) / .16, 1, 1);
      d.rotation.set(0, 0, 0);
      d.updateMatrix();
      keys.setMatrixAt(ki++, d.matrix);
      kx += U * w;
    }
  }
  laptop.add(keys);

  const kbGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 1.34),
    new THREE.MeshBasicMaterial({
      color: 0x123f26, transparent: true, opacity: .8,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  );
  kbGlow.rotation.x = -Math.PI / 2;
  kbGlow.position.set(0, .1245, -.32);
  laptop.add(kbGlow);

  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(1.12, .014, .5),
    new THREE.MeshStandardMaterial({ color: 0x2a2f2a, roughness: .3, metalness: .5 }),
  );
  pad.position.set(0, .128, .62);
  laptop.add(pad);

  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, 3.05, 12), darkMat);
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(0, .12, -1.03);
  hinge.castShadow = true;
  laptop.add(hinge);

  // ---- Tapa ----
  const lid = new THREE.Group();
  lid.position.set(0, .12, -1.02);
  laptop.add(lid);

  const lidBody = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.05, .07), bodyMat);
  lidBody.position.set(0, 1.02, 0);
  lidBody.castShadow = true;
  lid.add(lidBody);

  const scrMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.98, 1.86),
    new THREE.MeshBasicMaterial({ map: screen.texture, toneMapped: false }),
  );
  scrMesh.position.set(0, 1.02, .041);
  lid.add(scrMesh);

  // logo en la parte trasera de la tapa
  const logoTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const cg = c.getContext('2d');
    cg.strokeStyle = 'rgba(87,255,154,.9)'; cg.lineWidth = 7;
    cg.beginPath(); cg.arc(128, 128, 84, 0, 7); cg.stroke();
    cg.font = '700 64px "IBM Plex Mono", monospace';
    cg.textAlign = 'center'; cg.textBaseline = 'middle';
    cg.fillStyle = 'rgba(87,255,154,.95)';
    cg.fillText('AR', 128, 132);
    return new THREE.CanvasTexture(c);
  })();
  const logo = new THREE.Mesh(
    new THREE.PlaneGeometry(.72, .72),
    new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, toneMapped: false }),
  );
  logo.position.set(0, 1.02, -.041);
  logo.rotation.y = Math.PI;
  lid.add(logo);

  const screenLight = new THREE.PointLight(0x57ff9a, 2.4, 5, 2);
  screenLight.position.set(0, 1, .55);
  lid.add(screenLight);

  /* ============================================================
     SCROLLYTELLING — poses del notebook por sección
     ============================================================ */
  let stops = [];
  function computeStops() {
    const maxScroll = document.documentElement.scrollHeight - innerHeight;
    stops = sections.map((s) => {
      const r = s.getBoundingClientRect();
      return Math.min(r.top + scrollY + r.height / 2 - innerHeight / 2, maxScroll);
    });
    stops[0] = 0;
  }

  function evalPose(sy) {
    let i = 0;
    while (i < stops.length - 1 && sy > stops[i + 1]) i++;
    const a = POSES[i];
    const b = POSES[Math.min(i + 1, POSES.length - 1)];
    const span = (stops[i + 1] ?? stops[i] + 1) - stops[i] || 1;
    const u = smoothstep((sy - stops[i]) / span);
    const out = {};
    for (const k in a) out[k] = a[k] + (b[k] - a[k]) * u;
    return out;
  }

  /* ============================================================
     Interacción: arrastrar para girar el notebook
     ============================================================ */
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let userRot = 0;
  let userVel = 0;
  let userTilt = 0;
  let mx = 0;
  let my = 0;
  let smx = 0;
  let smy = 0;

  addEventListener('pointerdown', (e) => {
    if (e.target.closest('a,button,nav,#dots,#loader,p,h1,h2,h3,li')) return;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    userVel = 0;
  });
  addEventListener('pointermove', (e) => {
    mx = e.clientX / innerWidth * 2 - 1;
    my = e.clientY / innerHeight * 2 - 1;
    if (dragging) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      userRot += dx * .006;
      userVel = dx * .006;
      userTilt = Math.max(-.3, Math.min(.3, userTilt + dy * .002));
    }
  });
  addEventListener('pointerup', () => dragging = false);

  /* ============================================================
     Bucle de render
     ============================================================ */
  let smScroll = 0;
  let lastT = 0;
  let lidVel = 0;
  const cur = { x: 1.85, y: 0, ry: -.32, rx: -.02, s: 1, lid: .02, ly: 1.15 };
  const lookAt = new THREE.Vector3();

  function tick(t) {
    if (!lastT) lastT = t;
    const dt = Math.min((t - lastT) / 1000 || .016, .05);
    lastT = t;
    clock.elapsed += dt;
    const mobile = innerWidth < 860;

    smScroll += (scrollY - smScroll) * .08;
    const k = evalPose(smScroll);

    // muelles de pose
    const L = 1 - Math.exp(-dt * 5);
    cur.x += ((mobile ? k.x * .3 : k.x) - cur.x) * L;
    cur.y += (k.y - cur.y) * L;
    cur.ry += (k.ry - cur.ry) * L;
    cur.rx += (k.rx - cur.rx) * L;
    cur.s += ((mobile ? k.s * .84 : k.s) - cur.s) * L;
    cur.ly += (k.ly - cur.ly) * L;

    // la tapa se abre recién al terminar la pantalla de carga
    const lidTarget = clock.lidReleased ? k.lid : .02;
    lidVel += (lidTarget - cur.lid) * 42 * dt;
    lidVel *= Math.exp(-dt * 7.5);
    cur.lid = Math.max(0, Math.min(1.4, cur.lid + lidVel * dt));
    lid.rotation.x = Math.PI / 2 - cur.lid;

    // rotación libre + paralaje del mouse
    smx += (mx - smx) * .06;
    smy += (my - smy) * .06;
    if (!dragging) {
      userVel *= Math.exp(-dt * 4);
      userRot += userVel * dt * 60;
      userRot *= Math.exp(-dt * 1.6);
      userTilt *= Math.exp(-dt * 1.6);
    }

    const bob = REDUCED ? 0 : Math.sin(clock.elapsed * 1.15) * .04;
    const sway = REDUCED ? 0 : Math.sin(clock.elapsed * .55) * .035;
    laptop.position.set(cur.x, cur.y + bob, 0);
    laptop.rotation.set(cur.rx + userTilt + smy * .03, cur.ry + userRot + sway + smx * .05, 0);
    laptop.scale.setScalar(cur.s);

    glow.position.x = laptop.position.x;
    glow.position.y = laptop.position.y + .95;
    glow.scale.setScalar(cur.s);

    camera.position.set(
      (mobile ? 0 : -k.x * .15) + smx * .12,
      1.9 + smy * .1,
      mobile ? 10.8 : 7.4,
    );
    lookAt.set(k.x * .12, cur.ly, 0);
    camera.lookAt(lookAt);

    // pantalla: cambio de modo según sección visible + transición
    if (clock.targetMode >= 0 && clock.targetMode !== clock.screenMode) screen.setMode(clock.targetMode);
    if (clock.trans) {
      clock.trans.t += dt / (REDUCED ? .1 : .38);
      if (clock.trans.t >= 1) clock.trans = null;
    }
    screen.draw();

    screenLight.intensity = 2.2 + Math.sin(clock.elapsed * 1.7) * .3 + (clock.trans ? 1.2 : 0);

    renderer.render(scene, camera);
    if (!canvas.classList.contains('ready')) canvas.classList.add('ready');
  }
  renderer.setAnimationLoop(tick);

  /* ============================================================
     Resize + recálculo de stops
     ============================================================ */
  function resize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    computeStops();
  }
  addEventListener('resize', resize);
  resize();
  addEventListener('load', () => setTimeout(computeStops, 200));
  if (document.fonts?.ready) document.fonts.ready.then(() => {
    logoTex.needsUpdate = true;
    computeStops();
  });

  return { recomputeStops: computeStops };
}