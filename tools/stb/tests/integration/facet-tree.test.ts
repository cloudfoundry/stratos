// tests/integration/facet-tree.test.ts
import { it, expect } from 'vitest';
import { mountFacetTree } from '@/ui/facet-tree';

it('renders a branch per present group and a leaf per property', () => {
  const host = document.createElement('div');
  const previewHost = document.createElement('div');
  mountFacetTree(host, { facets: { text: { fontSize: { literal: '18px' } } }, previewHost, onEdit: () => {} });
  const groups = host.querySelectorAll('.stb-facet-group');
  expect([...groups].some((g) => g.textContent?.includes('text'))).toBe(true);
  const leaves = host.querySelectorAll('.stb-facet-leaf');
  expect([...leaves].some((l) => l.textContent?.includes('font-size'))).toBe(true);
});

it('edits a string property through its input control', () => {
  const host = document.createElement('div');
  const previewHost = document.createElement('div');
  const edits: [string, unknown][] = [];
  mountFacetTree(host, {
    facets: { text: {} },
    previewHost,
    onEdit: (k, v) => edits.push([k, v]),
  });
  const input = host.querySelector('.stb-facet-leaf[data-key="text.fontSize"] input') as HTMLInputElement;
  expect(input).toBeTruthy();
  input.value = '20px';
  input.dispatchEvent(new Event('input'));
  expect(edits).toContainEqual(['text.fontSize', { literal: '20px' }]);
});

it('fires onEdit with the selected value when a select control changes', () => {
  const host = document.createElement('div');
  const previewHost = document.createElement('div');
  const edits: [string, unknown][] = [];
  mountFacetTree(host, {
    facets: { text: {} },
    previewHost,
    onEdit: (k, v) => edits.push([k, v]),
  });
  const sel = host.querySelector('.stb-facet-leaf[data-key="text.fontWeight"] select') as HTMLSelectElement;
  expect(sel).toBeTruthy();
  sel.value = 'bold';
  sel.dispatchEvent(new Event('change'));
  expect(edits).toContainEqual(['text.fontWeight', { literal: 'bold' }]);
});

it('reflects an existing fontWeight literal as the select current value', () => {
  const host = document.createElement('div');
  const previewHost = document.createElement('div');
  mountFacetTree(host, {
    facets: { text: { fontWeight: { literal: '700' } } },
    previewHost,
    onEdit: () => {},
  });
  const sel = host.querySelector('.stb-facet-leaf[data-key="text.fontWeight"] select') as HTMLSelectElement;
  expect(sel).toBeTruthy();
  expect(sel.value).toBe('700');
});
