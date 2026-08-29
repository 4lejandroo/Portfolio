// Punto de entrada. Orquesta los módulos: reloj global, escena 3D con la
// pantalla del notebook, interfaz y ciclo de vida de la pantalla de carga.

import { createClock } from './clock.js';
import { createLaptopScene } from './laptop.js';
import { createUI } from './ui.js';
import { runLoader } from './loader.js';

const clock = createClock();
const canvas = document.getElementById('gl');
const sections = [...document.querySelectorAll('main section')];

const laptop = createLaptopScene(canvas, clock, sections);
const ui = createUI(clock, sections, laptop.recomputeStops);

runLoader(clock, ui.startReveals);