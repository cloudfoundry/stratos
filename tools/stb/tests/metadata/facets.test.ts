import { describe, it, expect } from 'vitest';
import { FACET_PROPS, facetDeclarations, facetLiteralCss, backgroundPatch } from '@/metadata/facets';
import type { Facets } from '@/metadata/types';

describe('FACET_PROPS', () => {
  it('maps every group property to a CSS property + color flag', () => {
    expect(FACET_PROPS['text.color']!).toEqual({ cssProp: 'color', isColor: true });
    expect(FACET_PROPS['text.fontSize']!).toEqual({ cssProp: 'font-size', isColor: false });
    expect(FACET_PROPS['surface.borderRadius']!).toEqual({ cssProp: 'border-radius', isColor: false });
    expect(FACET_PROPS['background.color']!).toEqual({ cssProp: 'background-color', isColor: true });
    expect(Object.keys(FACET_PROPS)).toHaveLength(7);
  });
});

describe('facetDeclarations', () => {
  it('yields one entry per set group property, skipping undefined', () => {
    const f: Facets = { text: { fontSize: { literal: '18px' } }, surface: { borderRadius: { literal: '8px' } } };
    const out = [...facetDeclarations(f)].map((d) => d.key);
    expect(out).toEqual(['text.fontSize', 'surface.borderRadius']);
  });
});

describe('facetLiteralCss', () => {
  it('formats a string literal verbatim and a color literal to hex; returns null for tokens', () => {
    expect(facetLiteralCss(FACET_PROPS['text.fontSize']!, { literal: '18px' })).toBe('18px');
    expect(facetLiteralCss(FACET_PROPS['text.color']!, { literal: { l: 0, c: 0, h: 0 } })).toMatch(/^#/);
    expect(facetLiteralCss(FACET_PROPS['text.color']!, { token: 'x' })).toBeNull();
  });
});

describe('backgroundPatch', () => {
  it('returns raw color + reversed-layer image values (unlike backgroundCss, a {token} color is included)', () => {
    expect(backgroundPatch({
      color: { literal: '#0b3d91' },
      layers: [
        { kind: 'image', ref: 'assets/hero.jpg' },
        { kind: 'gradient', gradient: { type: 'linear', stops: [
          { color: { literal: 'rgba(0,0,0,.6)' } }, { color: { literal: 'transparent' } } ] } },
      ],
    })).toEqual({
      backgroundColor: '#0b3d91',
      backgroundImage: 'linear-gradient(rgba(0,0,0,.6), transparent), url(assets/hero.jpg)',
    });
    expect(backgroundPatch({ color: { token: 'brand.500' } })).toEqual({ backgroundColor: 'var(--brand-500)' });
    expect(backgroundPatch({})).toEqual({});
  });
});
