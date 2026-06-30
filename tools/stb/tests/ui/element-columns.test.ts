import { describe, it, expect } from 'vitest';
import { swatchFor } from '@/ui/element-columns';
import type { PathNode } from '@/navigator/column-model';

const colorValue = { kind: 'color' as const, oklch: { l: 0.5, c: 0.1, h: 250 } };

function makePathNode(facets: Record<string, unknown>, value = colorValue): PathNode {
  return {
    segment: 'test',
    fullPath: 'test',
    children: new Map(),
    node: { snapshotId: 'test', scene: 's', name: 'Test', description: '', facets, value } as any,
  };
}

describe('swatchFor', () => {
  it('returns image glyph for a node with facets.asset (facets-only, value is color)', () => {
    const sw = swatchFor(makePathNode({ asset: { ref: 'logo.svg' } }));
    expect(sw.glyph).toBe('🖼');
    expect(sw.color).toBeUndefined();
  });

  it('returns text glyph for a node with facets.content (facets-only, value is color)', () => {
    const sw = swatchFor(makePathNode({ content: { text: 'Hi' } }));
    expect(sw.glyph).toBe('T');
    expect(sw.color).toBeUndefined();
  });

  it('returns color for a node with no content/asset facets', () => {
    const sw = swatchFor(makePathNode({}));
    expect(sw.color).toBeDefined();
    expect(sw.glyph).toBeUndefined();
  });

  it('returns drill glyph for a container node with no leaf node', () => {
    const p: PathNode = { segment: 'grp', fullPath: 'grp', children: new Map() };
    const sw = swatchFor(p);
    expect(sw.glyph).toBe('▸');
  });
});
