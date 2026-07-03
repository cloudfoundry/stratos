import { describe, it, expect } from 'vitest';
import {
  setFacetProp, clearFacetProp, addGroup, removeGroup,
  setBackstop, addLayer, removeLayer, reorderLayer, setLayer,
  addFont, removeFont, reorderFont, setFont,
  setSide, setGap,
} from '@/state/facets-edit';

describe('facets-edit', () => {
  it('sets a nested property immutably', () => {
    const a = setFacetProp({}, 'text.fontSize', { literal: '18px' });
    expect(a.text!.fontSize).toEqual({ literal: '18px' });
  });

  it('clears a property back to unset, keeping the group and siblings', () => {
    let f = setFacetProp({}, 'text.color', { literal: '#333' });
    f = setFacetProp(f, 'text.fontSize', { literal: '18px' });
    f = clearFacetProp(f, 'text.color');
    expect(f.text!.color).toBeUndefined();
    expect(f.text!.fontSize).toEqual({ literal: '18px' });
  });

  it('clears the background backstop via key background.color, keeping layers', () => {
    let f = setBackstop({}, { literal: '#000' });
    f = addLayer(f, { kind: 'image', ref: 'bg.svg' });
    f = clearFacetProp(f, 'background.color');
    expect(f.background!.color).toBeUndefined();
    expect(f.background!.layers).toHaveLength(1);
  });

  it('clearFacetProp is a no-op on an absent group', () => {
    const f = { text: { color: { literal: '#333' } } };
    expect(clearFacetProp(f, 'surface.border')).toBe(f);
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

  it('sets a spacing side into an absent group, creating it', () => {
    const f = setSide({}, 'padding', 'top', { literal: '8px' });
    expect(f.spacing!.padding).toEqual({ top: { literal: '8px' } });
  });

  it('sets a spacing side alongside an existing sibling side', () => {
    let f = setSide({}, 'padding', 'top', { literal: '8px' });
    f = setSide(f, 'padding', 'left', { literal: '4px' });
    expect(f.spacing!.padding).toEqual({ top: { literal: '8px' }, left: { literal: '4px' } });
  });

  it('sets padding and margin sides independently', () => {
    let f = setSide({}, 'padding', 'top', { literal: '8px' });
    f = setSide(f, 'margin', 'bottom', { literal: '2px' });
    expect(f.spacing!.padding).toEqual({ top: { literal: '8px' } });
    expect(f.spacing!.margin).toEqual({ bottom: { literal: '2px' } });
  });

  it('sets a gap slot into an absent group, creating it', () => {
    const f = setGap({}, 'row', { literal: '2px' });
    expect(f.spacing!.gap).toEqual({ row: { literal: '2px' } });
  });

  it('sets a gap slot alongside an existing sibling slot', () => {
    let f = setGap({}, 'row', { literal: '2px' });
    f = setGap(f, 'column', { literal: '6px' });
    expect(f.spacing!.gap).toEqual({ row: { literal: '2px' }, column: { literal: '6px' } });
  });
});
