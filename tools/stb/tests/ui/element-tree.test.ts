import { describe, it, expect } from 'vitest';
import { valuePreview } from '@/ui/element-tree';
import type { NavNode } from '@/navigator/column-model';

describe('valuePreview', () => {
  it('returns text kind for a node with facets.content', () => {
    const node: NavNode = {
      snapshotId: 'x', scene: 's', name: 'X', description: '',
      facets: { content: { text: 'Hello' } },
    };
    const vp = valuePreview(node);
    expect(vp.kind).toBe('text');
    expect(vp.text).toContain('Hello');
    expect(vp.swatch).toBeUndefined();
  });

  it('returns image kind for a node with facets.asset', () => {
    const node: NavNode = {
      snapshotId: 'y', scene: 's', name: 'Y', description: '',
      facets: { asset: { ref: 'logo.svg' } },
    };
    const vp = valuePreview(node);
    expect(vp.kind).toBe('image');
    expect(vp.text).toBe('logo.svg');
    expect(vp.swatch).toBeUndefined();
  });

  it('returns a hex swatch for a node with a color facet', () => {
    const node: NavNode = {
      snapshotId: 'z', scene: 's', name: 'Z', description: '',
      facets: { background: { color: { literal: { l: 0.5, c: 0.1, h: 250 } } } },
    };
    const vp = valuePreview(node);
    expect(vp.kind).toBe('color');
    expect(vp.swatch).toBeDefined();
  });
});
