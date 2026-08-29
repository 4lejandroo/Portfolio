import { REDUCED } from './config.js';

// Estado global compartido entre módulos (pantalla, escena, loader, UI).
// Un solo "reloj" acumula los segundos y los módulos avanzan/leen desde aquí.
export function createClock() {
  return {
    elapsed: 0,          // acumulador de segundos, lo avanza el bucle de render
    screenMode: 0,       // modo actual de la pantalla del notebook
    targetMode: 0,       // modo solicitado por la sección activa (lo lee el tick)
    trans: null,         // transición entre modos: { from, to, t }
    bootAt: null,        // instante en que el sistema "enciende" (al cerrar el loader)
    lidReleased: false,  // la tapa no se abre hasta terminar la carga
    termDone: REDUCED,   // la terminal ya escribió todo (se da por hecho sin animación)
    skipBios: false,     // salta la secuencia BIOS al volver al modo terminal
  };
}