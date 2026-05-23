import { describe, it, expect } from 'vitest';
import { parseColor, formatColor, type ColorValue } from '@/color/format';

describe('parseColor', () => {
  it('parses 6-digit hex', () => {
    expect(parseColor('#1e88e5')).toEqual({
      format: 'hex',
      raw: '#1e88e5',
      r: 30, g: 136, b: 229, a: 1,
    });
  });

  it('parses 3-digit hex', () => {
    expect(parseColor('#f0a')).toEqual({
      format: 'hex',
      raw: '#f0a',
      r: 255, g: 0, b: 170, a: 1,
    });
  });

  it('parses rgb() with space syntax', () => {
    const c = parseColor('rgb(30 136 229)');
    expect(c?.format).toBe('rgb');
    expect(c?.r).toBe(30);
    expect(c?.g).toBe(136);
    expect(c?.b).toBe(229);
  });

  it('parses oklch()', () => {
    const c = parseColor('oklch(0.633 0.149 256.94)');
    expect(c?.format).toBe('oklch');
    expect(c?.raw).toBe('oklch(0.633 0.149 256.94)');
  });

  it('returns null for invalid input', () => {
    expect(parseColor('not-a-color')).toBeNull();
    expect(parseColor('')).toBeNull();
  });
});

describe('formatColor', () => {
  it('formats as hex', () => {
    const c: ColorValue = { format: 'hex', raw: '#1e88e5', r: 30, g: 136, b: 229, a: 1 };
    expect(formatColor(c, 'hex')).toBe('#1e88e5');
  });

  it('formats as rgb', () => {
    const c: ColorValue = { format: 'hex', raw: '#1e88e5', r: 30, g: 136, b: 229, a: 1 };
    expect(formatColor(c, 'rgb')).toBe('rgb(30 136 229)');
  });

  it('preserves oklch raw on round-trip', () => {
    const input = 'oklch(0.633 0.149 256.94)';
    const c = parseColor(input);
    expect(c).not.toBeNull();
    expect(formatColor(c!, 'oklch')).toBe(input);
  });
});
