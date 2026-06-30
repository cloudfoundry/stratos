// tests/integration/facet-tree.test.ts
import { it, expect } from 'vitest';
import { mountFacetTree } from '@/ui/facet-tree';

it('renders a branch per present group and a leaf per property', () => {
  const host = document.createElement('div');
  mountFacetTree(host, { facets: { text: { fontSize: { literal: '18px' } } }, onEdit: () => {} });
  const groups = host.querySelectorAll('.stb-facet-group');
  expect([...groups].some((g) => g.textContent?.includes('text'))).toBe(true);
  const leaves = host.querySelectorAll('.stb-facet-leaf');
  expect([...leaves].some((l) => l.textContent?.includes('font-size'))).toBe(true);
});
