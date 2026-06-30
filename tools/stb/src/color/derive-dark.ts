import type { Oklch } from '@/color/oklch';

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

// Standard perceptual light->dark recipe: invert lightness, halve chroma,
// shift hue slightly so dark variants don't read as a flat negative.
export function deriveDarkOklch(light: Oklch): Oklch {
  return {
    l: 1 - light.l,
    c: light.c * 0.5,
    h: mod(light.h + 15, 360),
  };
}
