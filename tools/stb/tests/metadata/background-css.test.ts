import { describe, it, expect } from 'vitest';
import { gradientCss, backgroundCss, fontFamilyCss, spacingDeclarations } from '@/metadata/facets';

describe('gradientCss', () => {
  it('reconstructs a linear gradient with angle and stops', () => {
    expect(gradientCss({ type: 'linear', angle: '45deg', stops: [
      { color: { token: 'brand.500' }, position: '0%' },
      { color: { literal: 'transparent' } },
    ] })).toBe('linear-gradient(45deg, var(--brand-500) 0%, transparent)');
  });
  it('supports repeating + radial', () => {
    expect(gradientCss({ type: 'radial', repeating: true, shape: 'circle', stops: [
      { color: { literal: '#fff' } }, { color: { literal: '#000' } },
    ] })).toBe('repeating-radial-gradient(circle, #ffffff, #000000)');
  });
  it('reconstructs a conic gradient with from-angle and position', () => {
    expect(gradientCss({ type: 'conic', fromAngle: '90deg', position: 'center', stops: [
      { color: { literal: '#fff' } }, { color: { literal: '#000' } },
    ] })).toBe('conic-gradient(from 90deg at center, #ffffff, #000000)');
  });
  it('skips blank stop literals — no dangling comma or empty stop', () => {
    expect(gradientCss({ type: 'linear', stops: [
      { color: { literal: '  ' } }, { color: { literal: '#fff' } },
    ] })).toBe('linear-gradient(#ffffff)');
    expect(gradientCss({ type: 'linear', angle: '45deg', stops: [
      { color: { literal: '#fff' } }, { color: { literal: '' }, position: '50%' }, { color: { literal: '#000' } },
    ] })).toBe('linear-gradient(45deg, #ffffff, #000000)');
  });
  it('emits a var() for a fully-prefixed token stop without doubling the dashes', () => {
    expect(gradientCss({ type: 'linear', stops: [
      { color: { token: '--color-brand-900' } }, { color: { literal: 'transparent' } },
    ] })).toBe('linear-gradient(var(--color-brand-900), transparent)');
  });
});

describe('backgroundCss', () => {
  it('emits color backstop + layers reversed to CSS order (topmost first)', () => {
    const decls = backgroundCss({
      color: { literal: '#0b3d91' },
      layers: [
        { kind: 'image', ref: 'assets/hero.jpg' },                 // authoring[0] = bottom
        { kind: 'gradient', gradient: { type: 'linear', stops: [   // authoring[1] = top
          { color: { literal: 'rgba(0,0,0,.6)' } }, { color: { literal: 'transparent' } } ] } },
      ],
    });
    expect(decls).toEqual([
      'background-color: #0b3d91;',
      'background-image: linear-gradient(rgba(0,0,0,.6), transparent), url(assets/hero.jpg);',
    ]);
  });
  it('emits only color when no layers, only image when no color, nothing when empty', () => {
    expect(backgroundCss({ color: { literal: '#fff' } })).toEqual(['background-color: #ffffff;']);
    expect(backgroundCss({ layers: [{ kind: 'image', ref: 'a.png' }] })).toEqual(['background-image: url(a.png);']);
    expect(backgroundCss({})).toEqual([]);
  });
  it('skips a blank/whitespace literal color (no dangling background-color:;)', () => {
    expect(backgroundCss({ color: { literal: '' } })).toEqual([]);
    expect(backgroundCss({ color: { literal: '   ' } })).toEqual([]);
  });
  it('skips an empty-ref image layer, keeping other layers', () => {
    expect(backgroundCss({ layers: [{ kind: 'image', ref: '' }] })).toEqual([]);
    expect(backgroundCss({
      layers: [
        { kind: 'image', ref: 'a.png' },
        { kind: 'image', ref: '   ' },
      ],
    })).toEqual(['background-image: url(a.png);']);
  });
  it('skips a gradient layer whose stops are ALL blank (mid-edit transient)', () => {
    const allBlank = { type: 'linear' as const, stops: [{ color: { literal: '' } }, { color: { literal: '  ' } }] };
    expect(backgroundCss({ layers: [{ kind: 'gradient', gradient: allBlank }] })).toEqual([]);
    expect(backgroundCss({
      layers: [
        { kind: 'image', ref: 'a.png' },
        { kind: 'gradient', gradient: allBlank },
      ],
    })).toEqual(['background-image: url(a.png);']);
  });
  it('keeps a gradient layer with at least one real stop, dropping only the blank stops', () => {
    expect(backgroundCss({
      layers: [{ kind: 'gradient', gradient: { type: 'linear', stops: [
        { color: { literal: '' } }, { color: { literal: '#fff' } },
      ] } }],
    })).toEqual(['background-image: linear-gradient(#ffffff);']);
  });
});

describe('fontFamilyCss', () => {
  it('joins the font-family fallback list', () => {
    expect(fontFamilyCss([{ literal: 'Inter' }, { literal: 'system-ui' }, { literal: 'sans-serif' }]))
      .toBe('font-family: Inter, system-ui, sans-serif;');
  });
  it('returns null when every entry is a blank/whitespace-only literal', () => {
    expect(fontFamilyCss([{ literal: '' }, { literal: '   ' }])).toBeNull();
  });
  it('skips blank entries but keeps real ones, with clean commas', () => {
    expect(fontFamilyCss([{ literal: '' }, { literal: 'Inter' }, { literal: '  ' }, { literal: 'sans-serif' }]))
      .toBe('font-family: Inter, sans-serif;');
  });
  it('never treats a token entry as blank', () => {
    expect(fontFamilyCss([{ token: 'font.brand' }, { literal: '' }]))
      .toBe('font-family: var(--font-brand);');
  });
});

describe('spacingDeclarations', () => {
  it('emits per-side longhands for set spacing slots', () => {
    expect(spacingDeclarations({
      padding: { top: { literal: '8px' }, left: { literal: '4px' } },
      gap: { row: { literal: '2px' } },
    })).toEqual(['padding-top: 8px;', 'padding-left: 4px;', 'row-gap: 2px;']);
  });
  it('emits margin longhands in T/R/B/L order and column-gap', () => {
    expect(spacingDeclarations({
      margin: { top: { literal: '1px' }, right: { literal: '2px' }, bottom: { literal: '3px' }, left: { literal: '4px' } },
      gap: { column: { literal: '6px' } },
    })).toEqual([
      'margin-top: 1px;', 'margin-right: 2px;', 'margin-bottom: 3px;', 'margin-left: 4px;',
      'column-gap: 6px;',
    ]);
  });
  it('emits nothing for an empty spacing facet', () => {
    expect(spacingDeclarations({})).toEqual([]);
  });
  it('resolves a token slot via facetValueCss', () => {
    expect(spacingDeclarations({ padding: { top: { token: 'space.md' } } }))
      .toEqual(['padding-top: var(--space-md);']);
  });
  it('skips a blank literal side while emitting set siblings (no dangling padding-top:;)', () => {
    expect(spacingDeclarations({
      padding: { top: { literal: '' }, left: { literal: '4px' } },
      gap: { row: { literal: '   ' } },
    })).toEqual(['padding-left: 4px;']);
  });
  it('never treats a token slot as blank', () => {
    expect(spacingDeclarations({ padding: { top: { token: 'space.md' } } }))
      .toEqual(['padding-top: var(--space-md);']);
  });
});
