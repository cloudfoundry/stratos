import { describe, it, expect } from 'vitest';
import type { Facets, Layer, Gradient } from '@/metadata/types';

describe('composite facet types', () => {
  it('models a background as backstop color + ordered layers (image|gradient)', () => {
    const grad: Gradient = { type: 'linear', angle: '45deg', stops: [
      { color: { literal: '#000' }, position: '0%' },
      { color: { token: 'brand.500' } },
    ] };
    const layers: Layer[] = [
      { kind: 'image', ref: 'assets/hero.jpg' },
      { kind: 'gradient', gradient: grad },
    ];
    const f: Facets = {
      background: { color: { literal: '#0b3d91' }, layers },
      text: { fontFamily: [{ literal: 'Inter' }, { literal: 'sans-serif' }] },
      spacing: { padding: { top: { literal: '8px' } }, gap: { row: { literal: '4px' } } },
    };
    expect(f.background!.layers).toHaveLength(2);
    expect(f.background!.layers![0]!.kind).toBe('image');
    expect(f.text!.fontFamily).toHaveLength(2);
    expect(f.spacing!.padding!.top).toEqual({ literal: '8px' });
  });
});
