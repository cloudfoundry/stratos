import { describe, it, expect } from 'vitest';
import { migrateFacets } from '@/metadata/migrate-facets';

describe('migrateFacets', () => {
  it('moves surface.background color to background.color', () => {
    const out = migrateFacets({ surface: { background: { literal: '#fff' }, border: { literal: '1px' } } }, false);
    expect(out.background).toEqual({ color: { literal: '#fff' } });
    expect(out.surface).toEqual({ border: { literal: '1px' } });
  });
  it('wraps a single fontFamily into a one-entry list', () => {
    const out = migrateFacets({ text: { fontFamily: { literal: 'Inter' } } }, false);
    expect(out.text!.fontFamily).toEqual([{ literal: 'Inter' }]);
  });
  it('expands single padding/margin to all four sides and gap to row+column', () => {
    const out = migrateFacets({ spacing: { padding: { literal: '8px' }, gap: { literal: '4px' } } }, false);
    expect(out.spacing!.padding).toEqual({ top: { literal: '8px' }, right: { literal: '8px' }, bottom: { literal: '8px' }, left: { literal: '8px' } });
    expect(out.spacing!.gap).toEqual({ row: { literal: '4px' }, column: { literal: '4px' } });
  });
  it('turns a background-use asset into an image layer, keeps <img> asset as-is', () => {
    const bg = migrateFacets({ asset: { ref: 'assets/hero.jpg' } }, false);
    expect(bg.background).toEqual({ layers: [{ kind: 'image', ref: 'assets/hero.jpg' }] });
    expect(bg.asset).toBeUndefined();
    const img = migrateFacets({ asset: { ref: 'assets/logo.svg' } }, true);
    expect(img.asset).toEqual({ ref: 'assets/logo.svg' });
    expect(img.background).toBeUndefined();
  });
  it('passes already-composite facets through unchanged', () => {
    const composite = { background: { color: { literal: '#000' }, layers: [] }, text: { fontFamily: [{ literal: 'Inter' }] } };
    expect(migrateFacets(composite, false)).toEqual(composite);
  });
});
