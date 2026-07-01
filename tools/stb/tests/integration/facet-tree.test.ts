// tests/integration/facet-tree.test.ts
import { it, expect } from 'vitest';
import { mountFacetTree } from '@/ui/facet-tree';
import { deriveDarkOklch } from '@/color/derive-dark';

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

it('collapse-all hides leaves; expand-all shows them', () => {
  const host = document.createElement('div');
  const previewHost = document.createElement('div');
  mountFacetTree(host, { facets: { text: {}, surface: {} }, previewHost, onEdit: () => {} });
  (host.querySelector('.stb-facet-collapse-all') as HTMLButtonElement).click();
  expect(host.querySelectorAll('.stb-facet-group.stb-facet-collapsed').length).toBe(2);
  expect([...host.querySelectorAll('.stb-facet-leaves')].every((el) => (el as HTMLElement).hidden)).toBe(true);
  (host.querySelector('.stb-facet-expand-all') as HTMLButtonElement).click();
  expect(host.querySelectorAll('.stb-facet-group.stb-facet-collapsed').length).toBe(0);
  expect([...host.querySelectorAll('.stb-facet-leaves')].every((el) => !(el as HTMLElement).hidden)).toBe(true);
});

it('isolate with no prior focus collapses nothing', () => {
  const host = document.createElement('div');
  const previewHost = document.createElement('div');
  mountFacetTree(host, { facets: { text: {}, surface: {} }, previewHost, onEdit: () => {} });
  (host.querySelector('.stb-facet-isolate') as HTMLButtonElement).click();
  expect(host.querySelectorAll('.stb-facet-group.stb-facet-collapsed').length).toBe(0);
});

it('clicking a group branch toggles its own collapse state', () => {
  const host = document.createElement('div');
  const previewHost = document.createElement('div');
  mountFacetTree(host, { facets: { text: {} }, previewHost, onEdit: () => {} });
  const branch = host.querySelector('.stb-facet-group') as HTMLElement;
  branch.click();
  expect(branch.classList.contains('stb-facet-collapsed')).toBe(true);
  branch.click();
  expect(branch.classList.contains('stb-facet-collapsed')).toBe(false);
});

it('isolate collapses all groups except the one with focused leaf', () => {
  const host = document.createElement('div');
  const previewHost = document.createElement('div');
  mountFacetTree(host, { facets: { text: {}, surface: {} }, previewHost, onEdit: () => {} });
  // Focus a leaf control in the text group
  const textLeafControl = host.querySelector('.stb-facet-leaf[data-key="text.fontSize"] input') as HTMLInputElement;
  textLeafControl.dispatchEvent(new Event('focusin', { bubbles: true }));
  (host.querySelector('.stb-facet-isolate') as HTMLButtonElement).click();
  const collapsed = [...host.querySelectorAll('.stb-facet-group.stb-facet-collapsed')];
  expect(collapsed.length).toBe(1);
  expect(collapsed[0]!.textContent).toContain('surface');
});

it('offers absent groups and adds one on select', () => {
  const host = document.createElement('div');
  const previewHost = document.createElement('div');
  const added: string[] = [];
  mountFacetTree(host, { facets: { text: {} }, previewHost, onEdit: () => {}, onAddGroup: (g) => added.push(g) });
  const add = host.querySelector('.stb-facet-add') as HTMLSelectElement;
  expect(add).toBeTruthy();
  expect([...add.options].map((o) => o.value)).toEqual(expect.arrayContaining(['surface', 'spacing']));
  add.value = 'surface';
  add.dispatchEvent(new Event('change'));
  expect(added).toContain('surface');
  // select resets to placeholder after selection
  expect(add.value).toBe('');
});

it('remove button calls onRemoveGroup and does not trigger collapse', () => {
  const host = document.createElement('div');
  const previewHost = document.createElement('div');
  const removed: string[] = [];
  mountFacetTree(host, {
    facets: { text: {}, surface: {} },
    previewHost,
    onEdit: () => {},
    onRemoveGroup: (g) => removed.push(g),
  });
  // Find the remove button on the text branch
  const branches = [...host.querySelectorAll('.stb-facet-group')] as HTMLElement[];
  const textBranch = branches.find((b) => b.textContent?.includes('text'))!;
  const removeBtn = textBranch.querySelector('.stb-facet-remove') as HTMLButtonElement;
  expect(removeBtn).toBeTruthy();
  removeBtn.click();
  expect(removed).toContain('text');
  // stopPropagation must have prevented the branch click from toggling collapse
  expect(textBranch.classList.contains('stb-facet-collapsed')).toBe(false);
});

it('marks a token-backed property as shared and offers detach', () => {
  const host = document.createElement('div');
  const edits: [string, unknown][] = [];
  mountFacetTree(host, {
    facets: { text: { color: { token: 'fg' } } },
    onEdit: (k, v) => edits.push([k, v]),
    previewHost: document.createElement('div'),
  });
  const leaf = host.querySelector('.stb-facet-leaf[data-key="text.color"]')!;
  expect(leaf.querySelector('.stb-facet-shared')).not.toBeNull();
  (leaf.querySelector('.stb-facet-detach') as HTMLButtonElement).click();
  expect(edits[0]![1]).toHaveProperty('literal');
});

it('renders a content leaf with a textarea initialized to the content text', () => {
  const host = document.createElement('div');
  const collected: string[] = [];
  mountFacetTree(host, {
    facets: { content: { text: 'A' } },
    onEdit: () => {},
    previewHost: document.createElement('div'),
    onContentEdit: (t) => collected.push(t),
  });
  const ta = host.querySelector('.stb-facet-leaf[data-key="content"] textarea') as HTMLTextAreaElement;
  expect(ta).not.toBeNull();
  expect(ta.value).toBe('A');
  ta.value = 'B';
  ta.dispatchEvent(new Event('input'));
  expect(collected).toContain('B');
});

it('renders an asset leaf with a file input', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: { asset: { ref: 'logo.svg' } },
    onEdit: () => {},
    previewHost: document.createElement('div'),
  });
  const fileInput = host.querySelector('.stb-facet-leaf[data-key="asset"] input[type="file"]');
  expect(fileInput).not.toBeNull();
});

it('renders a light swatch, a dark swatch and a derive button for a color leaf', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: { text: { color: { literal: { l: 0.5, c: 0.1, h: 250 } } } },
    darkFacets: {},
    onEdit: () => {},
    onDarkEdit: () => {},
    previewHost: document.createElement('div'),
  });
  const leaf = host.querySelector('.stb-facet-leaf[data-key="text.color"]')!;
  expect(leaf.querySelectorAll('.stb-facet-swatch').length).toBe(1);
  expect(leaf.querySelector('.stb-facet-swatch-dark')).not.toBeNull();
  expect(leaf.querySelector('.stb-facet-derive-dark')).not.toBeNull();
});

it('renders a non-color leaf once, with no dark field or derive button', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: { text: { fontSize: { literal: '18px' } } },
    darkFacets: {},
    onEdit: () => {},
    onDarkEdit: () => {},
    previewHost: document.createElement('div'),
  });
  const leaf = host.querySelector('.stb-facet-leaf[data-key="text.fontSize"]')!;
  expect(leaf.querySelectorAll('input').length).toBe(1);
  expect(leaf.querySelector('.stb-facet-swatch-dark')).toBeNull();
  expect(leaf.querySelector('.stb-facet-derive-dark')).toBeNull();
});

it('shows the light/dark header once per group that has a color leaf', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: { text: { color: { literal: { l: 0.5, c: 0.1, h: 250 } }, fontSize: { literal: '12px' } } },
    darkFacets: {},
    onEdit: () => {},
    onDarkEdit: () => {},
    previewHost: document.createElement('div'),
  });
  expect(host.querySelectorAll('.stb-facet-dual-header').length).toBe(1);
});

it('omits the light/dark header for a group with no color leaves', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: { spacing: { padding: { top: { literal: '4px' } } } },
    onEdit: () => {},
    previewHost: document.createElement('div'),
  });
  expect(host.querySelector('.stb-facet-dual-header')).toBeNull();
});

it('dark swatch is neutral/empty when no dark value is set (inherits built-in dark)', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: { text: { color: { literal: { l: 0.5, c: 0.1, h: 250 } } } },
    darkFacets: {},
    onEdit: () => {},
    onDarkEdit: () => {},
    previewHost: document.createElement('div'),
  });
  const leaf = host.querySelector('.stb-facet-leaf[data-key="text.color"]')!;
  const darkBtn = leaf.querySelector('.stb-facet-swatch-dark') as HTMLButtonElement;
  expect(darkBtn.classList.contains('stb-facet-swatch-empty')).toBe(true);
  expect(darkBtn.style.backgroundColor).toBe('');
});

it('dark swatch reflects an existing dark literal', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: { text: { color: { literal: { l: 0.5, c: 0.1, h: 250 } } } },
    darkFacets: { text: { color: { literal: { l: 0.2, c: 0.05, h: 100 } } } },
    onEdit: () => {},
    onDarkEdit: () => {},
    previewHost: document.createElement('div'),
  });
  const leaf = host.querySelector('.stb-facet-leaf[data-key="text.color"]')!;
  const darkBtn = leaf.querySelector('.stb-facet-swatch-dark') as HTMLButtonElement;
  expect(darkBtn.classList.contains('stb-facet-swatch-empty')).toBe(false);
  expect(darkBtn.style.backgroundColor).not.toBe('');
});

it('editing the dark swatch invokes onDarkEdit with the picked color', () => {
  const host = document.createElement('div');
  const darkEdits: [string, unknown][] = [];
  mountFacetTree(host, {
    facets: { text: { color: { literal: { l: 0.5, c: 0.1, h: 250 } } } },
    darkFacets: {},
    onEdit: () => {},
    onDarkEdit: (k, v) => darkEdits.push([k, v]),
    previewHost: document.createElement('div'),
  });
  const leaf = host.querySelector('.stb-facet-leaf[data-key="text.color"]')!;
  (leaf.querySelector('.stb-facet-swatch-dark') as HTMLButtonElement).click();
  const textInput = document.querySelector('.stb-color-text') as HTMLInputElement;
  expect(textInput).toBeTruthy();
  textInput.value = '#112233';
  textInput.dispatchEvent(new Event('input'));
  expect(darkEdits.length).toBe(1);
  expect(darkEdits[0]![0]).toBe('text.color');
  expect(darkEdits[0]![1]).toHaveProperty('literal');
});

it('clicking the derive button calls deriveDark with the leaf key', () => {
  const host = document.createElement('div');
  const derived: string[] = [];
  mountFacetTree(host, {
    facets: { text: { color: { literal: { l: 0.5, c: 0.1, h: 250 } } } },
    darkFacets: {},
    onEdit: () => {},
    onDarkEdit: () => {},
    deriveDark: (k) => derived.push(k),
    previewHost: document.createElement('div'),
  });
  const leaf = host.querySelector('.stb-facet-leaf[data-key="text.color"]')!;
  (leaf.querySelector('.stb-facet-derive-dark') as HTMLButtonElement).click();
  expect(derived).toEqual(['text.color']);
});

it('derive button is disabled (no-op) when the light value has no literal Oklch', () => {
  const host = document.createElement('div');
  const derived: string[] = [];
  mountFacetTree(host, {
    facets: { text: { color: { token: 'fg' } } },
    darkFacets: {},
    onEdit: () => {},
    onDarkEdit: () => {},
    deriveDark: (k) => derived.push(k),
    previewHost: document.createElement('div'),
  });
  const leaf = host.querySelector('.stb-facet-leaf[data-key="text.color"]')!;
  const deriveBtn = leaf.querySelector('.stb-facet-derive-dark') as HTMLButtonElement;
  expect(deriveBtn.disabled).toBe(true);
  deriveBtn.click();
  expect(derived).toEqual([]);
});

it('an integration-style wiring of deriveDark routes deriveDarkOklch(light) into onDarkEdit', () => {
  const host = document.createElement('div');
  const lightOklch = { l: 0.5, c: 0.1, h: 250 };
  const darkEdits: [string, unknown][] = [];
  mountFacetTree(host, {
    facets: { text: { color: { literal: lightOklch } } },
    darkFacets: {},
    onEdit: () => {},
    onDarkEdit: (k, v) => darkEdits.push([k, v]),
    deriveDark: (k) => darkEdits.push([k, { literal: deriveDarkOklch(lightOklch) }]),
    previewHost: document.createElement('div'),
  });
  const leaf = host.querySelector('.stb-facet-leaf[data-key="text.color"]')!;
  (leaf.querySelector('.stb-facet-derive-dark') as HTMLButtonElement).click();
  expect(darkEdits).toEqual([['text.color', { literal: deriveDarkOklch(lightOklch) }]]);
});

it('shows promote for a literal property with a token mapping, none without', () => {
  const host = document.createElement('div');
  const edits: [string, unknown][] = [];
  mountFacetTree(host, {
    facets: { text: { color: { literal: { l: 0.5, c: 0.1, h: 250 } } } },
    onEdit: (k, v) => edits.push([k, v]),
    previewHost: document.createElement('div'),
    tokenForKey: (k) => k === 'text.color' ? 'fg' : null,
  });
  const colorLeaf = host.querySelector('.stb-facet-leaf[data-key="text.color"]')!;
  expect(colorLeaf.querySelector('.stb-facet-promote')).not.toBeNull();
  (colorLeaf.querySelector('.stb-facet-promote') as HTMLButtonElement).click();
  expect(edits[0]).toEqual(['text.color', { token: 'fg' }]);
  // A leaf whose key has no token mapping shows no promote button
  const sizeLeaf = host.querySelector('.stb-facet-leaf[data-key="text.fontSize"]')!;
  expect(sizeLeaf.querySelector('.stb-facet-promote')).toBeNull();
});
