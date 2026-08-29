// Configuración global: banderas del dispositivo y recursos compartidos.

export const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

export const PALETTE = {
  bg: '#0b0d0b',
  ink: '#e9ece3',
  dim: '#98a29a',
  acc: '#57ff9a',
  line: 'rgba(233,236,227,.13)',
};

export const FONTS = {
  mono: `'IBM Plex Mono', monospace`,
  sans: `'Space Grotesk', sans-serif`,
};