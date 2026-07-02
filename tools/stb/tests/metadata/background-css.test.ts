import { describe, it, expect } from 'vitest';
import { gradientCss, backgroundCss, fontFamilyCss } from '@/metadata/facets';

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
});

describe('fontFamilyCss', () => {
  it('joins the font-family fallback list', () => {
    expect(fontFamilyCss([{ literal: 'Inter' }, { literal: 'system-ui' }, { literal: 'sans-serif' }]))
      .toBe('font-family: Inter, system-ui, sans-serif;');
  });
});
