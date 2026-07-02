import { describe, it, expect } from 'vitest';
import {
  setFacetProp, addGroup, removeGroup,
  setBackstop, addLayer, removeLayer, reorderLayer, setLayer,
  addFont, removeFont, reorderFont, setFont,
} from '@/state/facets-edit';

describe('facets-edit', () => {
  it('sets a nested property immutably', () => {
    const a = setFacetProp({}, 'text.fontSize', { literal: '18px' });
    expect(a.text!.fontSize).toEqual({ literal: '18px' });
  });
  it('adds and removes a group', () => {
    expect(addGroup({}, 'surface').surface).toEqual({});
    expect(removeGroup({ surface: { border: { literal: '1px' } } }, 'surface').surface).toBeUndefined();
  });

  it('adds layers on top (append) and reorders', () => {
    let f = setBackstop({}, { literal: '#000' });
    f = addLayer(f, { kind: 'image', ref: 'a' });
    f = addLayer(f, { kind: 'image', ref: 'b' });   // b is now topmost
    expect(f.background!.layers!.map((l) => (l as { ref: string }).ref)).toEqual(['a', 'b']);
    f = reorderLayer(f, 1, 0);
    expect(f.background!.layers!.map((l) => (l as { ref: string }).ref)).toEqual(['b', 'a']);
    f = removeLayer(f, 0);
    expect(f.background!.layers!.map((l) => (l as { ref: string }).ref)).toEqual(['a']);
    expect(f.background!.color).toEqual({ literal: '#000' });
  });

  it('replaces a layer at an index in place, preserving order', () => {
    let f = addLayer({}, { kind: 'image', ref: 'a' });
    f = addLayer(f, { kind: 'image', ref: 'b' });
    const gradientLayer = { kind: 'gradient' as const, gradient: { type: 'linear' as const, stops: [{ color: { literal: '#fff' } }] } };
    f = setLayer(f, 0, gradientLayer);
    expect(f.background!.layers![0]).toEqual(gradientLayer);
    expect((f.background!.layers![1] as { ref: string }).ref).toBe('b');
  });

  it('adds font-family fallbacks in order and reorders them', () => {
    let f = addFont({}, { literal: 'Inter' });
    f = addFont(f, { literal: 'system-ui' });
    expect(f.text!.fontFamily).toEqual([{ literal: 'Inter' }, { literal: 'system-ui' }]);
    f = reorderFont(f, 1, 0);
    expect(f.text!.fontFamily).toEqual([{ literal: 'system-ui' }, { literal: 'Inter' }]);
  });

  it('sets a font-family entry at an index in place, preserving order', () => {
    let f = addFont({}, { literal: 'Inter' });
    f = addFont(f, { literal: 'system-ui' });
    f = setFont(f, 0, { literal: 'Roboto' });
    expect(f.text!.fontFamily).toEqual([{ literal: 'Roboto' }, { literal: 'system-ui' }]);
  });

  it('removes a font-family entry at an index', () => {
    let f = addFont({}, { literal: 'Inter' });
    f = addFont(f, { literal: 'system-ui' });
    f = removeFont(f, 0);
    expect(f.text!.fontFamily).toEqual([{ literal: 'system-ui' }]);
  });
});
