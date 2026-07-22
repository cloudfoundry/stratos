import { toOklch, oklchToHex } from '@/color/oklch';

export type ColorFormat = 'hex' | 'rgb' | 'oklch';

export interface ColorValue {
  format: ColorFormat;
  raw: string;          // the original string the user typed, preserved for oklch round-trip
  r: number;            // 0-255, only valid for hex/rgb
  g: number;
  b: number;
  a: number;            // 0-1
}

const HEX6 = /^#([0-9a-f]{6})$/i;
const HEX3 = /^#([0-9a-f]{3})$/i;
const RGB_SPACE = /^rgb\(\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s*\)$/i;
const RGB_COMMA = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;
const OKLCH = /^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)\s*)?\)$/i;

export function parseColor(input: string): ColorValue | null {
  const s = input.trim();
  if (!s) return null;

  const m6 = HEX6.exec(s);
  if (m6) {
    const hex = m6[1]!;
    return {
      format: 'hex', raw: s,
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: 1,
    };
  }

  const m3 = HEX3.exec(s);
  if (m3) {
    const hex = m3[1]!;
    return {
      format: 'hex', raw: s,
      r: parseInt(hex[0]! + hex[0]!, 16),
      g: parseInt(hex[1]! + hex[1]!, 16),
      b: parseInt(hex[2]! + hex[2]!, 16),
      a: 1,
    };
  }

  const rgbMatch = RGB_SPACE.exec(s) ?? RGB_COMMA.exec(s);
  if (rgbMatch) {
    return {
      format: 'rgb', raw: s,
      r: clampByte(rgbMatch[1]!),
      g: clampByte(rgbMatch[2]!),
      b: clampByte(rgbMatch[3]!),
      a: 1,
    };
  }

  const ok = OKLCH.exec(s);
  if (ok) {
    const l = ok[1]!.endsWith('%') ? parseFloat(ok[1]!) / 100 : parseFloat(ok[1]!);
    const hex = oklchToHex({ l, c: parseFloat(ok[2]!), h: parseFloat(ok[3]!) });
    return {
      format: 'oklch', raw: s,
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
      a: ok[4] != null ? parseFloat(ok[4]) : 1,
    };
  }

  return null;
}

export function formatColor(c: ColorValue, target: ColorFormat): string {
  const h = (n: number) => n.toString(16).padStart(2, '0');
  const hex = `#${h(c.r)}${h(c.g)}${h(c.b)}`;
  if (target === 'hex') return hex;
  if (target === 'rgb') return `rgb(${c.r} ${c.g} ${c.b})`;
  // oklch — preserve what the user typed, else derive from rgb
  if (c.format === 'oklch') return c.raw;
  const o = toOklch(hex);
  const round = (n: number, p: number) => Number(n.toFixed(p));
  return `oklch(${round(o.l, 4)} ${round(o.c, 4)} ${round(o.h, 2)})`;
}

function clampByte(s: string): number {
  const n = parseInt(s, 10);
  return Math.max(0, Math.min(255, n));
}
