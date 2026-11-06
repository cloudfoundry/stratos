// WCAG 2.x relative luminance + contrast ratio. hex in #rgb or #rrggbb form.
// Self-contained (distinct from oklch.ts's transforms): luminance uses the
// WCAG sRGB linearization and the 0.2126/0.7152/0.0722 coefficients.

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n =
    h.length === 3
      ? h.split('').map((x) => parseInt(x + x, 16))
      : [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return [n[0]! / 255, n[1]! / 255, n[2]! / 255];
}

function channelLinear(c: number): number {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(channelLinear) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Symmetric contrast ratio in [1, 21]. white/black = 21.
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
