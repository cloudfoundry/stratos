import { describe, it, expect } from 'vitest';
import { colorValueFromHex, contentValue, assetValue, initialColorHex } from '@/ui/lever-editor';

describe('lever-editor value helpers', () => {
  it('colorValueFromHex round-trips through OKLCH', () => {
    const v = colorValueFromHex('#2196f3');
    expect(v.kind).toBe('color');
    if (v.kind === 'color') expect(initialColorHex(v)).toBe('#2196f3');
  });
  it('contentValue / assetValue shape the union', () => {
    expect(contentValue('Hi')).toEqual({ kind: 'content', text: 'Hi' });
    expect(assetValue('logo.png')).toEqual({ kind: 'asset', ref: 'logo.png' });
  });
  it('initialColorHex falls back for non-color values', () => {
    expect(initialColorHex({ kind: 'content', text: 'x' })).toBe('#000000');
  });
});
