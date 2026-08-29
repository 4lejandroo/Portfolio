// Funciones de utilidad matemática reutilizables.

export const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

// Ease-out cúbico, usado en las animaciones de entrada de la pantalla.
export const easeOutCubic = (v) => 1 - Math.pow(1 - clamp(v), 3);

// Smoothstep, usado para interpolar las poses del scrollytelling.
export const smoothstep = (v) => {
  const u = clamp(v);
  return u * u * (3 - 2 * u);
};