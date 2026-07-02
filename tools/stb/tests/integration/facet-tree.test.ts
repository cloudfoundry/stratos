// tests/integration/facet-tree.test.ts
import { it, expect } from 'vitest';
import { mountFacetTree } from '@/ui/facet-tree';
import { deriveDarkOklch } from '@/color/derive-dark';
import { toOklch } from '@/color/oklch';

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

it('offers background in the add-group select for a node without one, and fires onAddGroup', () => {
  const host = document.createElement('div');
  const previewHost = document.createElement('div');
  const added: string[] = [];
  mountFacetTree(host, { facets: { text: {} }, previewHost, onEdit: () => {}, onAddGroup: (g) => added.push(g) });
  const add = host.querySelector('.stb-facet-add') as HTMLSelectElement;
  expect([...add.options].map((o) => o.value)).toContain('background');
  add.value = 'background';
  add.dispatchEvent(new Event('change'));
  expect(added).toContain('background');
});

it('does not offer background in the add-group select when one is already present', () => {
  const host = document.createElement('div');
  const previewHost = document.createElement('div');
  mountFacetTree(host, { facets: { background: {}, text: {} }, previewHost, onEdit: () => {} });
  const add = host.querySelector('.stb-facet-add') as HTMLSelectElement;
  expect([...add.options].map((o) => o.value)).not.toContain('background');
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

it('does not render the standalone asset slot when a background facet is present', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: { asset: { ref: 'logo.svg' }, background: { color: { literal: '#000' } } },
    onEdit: () => {},
    previewHost: document.createElement('div'),
  });
  expect(host.querySelector('.stb-facet-leaf[data-key="asset"]')).toBeNull();
});

it('renders the backstop color first, then layers, for a background facet', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: { background: {
      color: { literal: { l: 0.4, c: 0.1, h: 250 } },
      layers: [{ kind: 'image', ref: 'assets/hero.jpg' }],
    } },
    previewHost: document.createElement('div'),
    onEdit: () => {},
  });
  const rows = [...host.querySelectorAll('[data-stb-bg-row]')];
  expect(rows[0]!.getAttribute('data-stb-bg-row')).toBe('color');
  expect(rows[1]!.getAttribute('data-stb-bg-row')).toBe('layer');
});

it('renders a gradient layer with a type select and stop swatches, plus remove/move controls', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: { background: {
      layers: [{ kind: 'gradient', gradient: {
        type: 'linear', angle: '90deg',
        stops: [{ color: { literal: '#fff' } }, { color: { literal: '#000' } }],
      } }],
    } },
    previewHost: document.createElement('div'),
    onEdit: () => {},
  });
  const row = host.querySelector('[data-stb-bg-row="layer"]')!;
  const typeSel = row.querySelector('select') as HTMLSelectElement;
  expect(typeSel).not.toBeNull();
  expect(typeSel.value).toBe('linear');
  expect(row.querySelectorAll('.stb-facet-swatch').length).toBe(2);
  expect(row.querySelector('.stb-facet-bg-remove')).not.toBeNull();
  expect(row.querySelector('.stb-facet-bg-move-up')).not.toBeNull();
  expect(row.querySelector('.stb-facet-bg-move-down')).not.toBeNull();
});

it('gives the gradient type and angle fields visible inline labels and CSS-value tooltips', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: { background: {
      layers: [{ kind: 'gradient', gradient: {
        type: 'linear', angle: '90deg',
        stops: [{ color: { literal: '#fff' } }, { color: { literal: '#000' } }],
      } }],
    } },
    previewHost: document.createElement('div'),
    onEdit: () => {},
  });
  const row = host.querySelector('[data-stb-bg-row="layer"]')!;
  const labels = [...row.querySelectorAll('.stb-facet-bg-gradient-field-label')].map((l) => l.textContent);
  expect(labels).toContain('type');
  expect(labels).toContain('angle');
  const angleInput = row.querySelector('.stb-facet-bg-gradient-pos') as HTMLInputElement;
  expect(angleInput.title).toMatch(/angle/i);
  expect(angleInput.title).toMatch(/45deg/);
});

it('relabels the angle field as position for radial/conic gradients, with a length-percentage-free position hint', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: { background: {
      layers: [{ kind: 'gradient', gradient: {
        type: 'radial', position: 'center',
        stops: [{ color: { literal: '#fff' } }, { color: { literal: '#000' } }],
      } }],
    } },
    previewHost: document.createElement('div'),
    onEdit: () => {},
  });
  const row = host.querySelector('[data-stb-bg-row="layer"]')!;
  const labels = [...row.querySelectorAll('.stb-facet-bg-gradient-field-label')].map((l) => l.textContent);
  expect(labels).toContain('position');
  expect(labels).not.toContain('angle');
});

it('carries a position tooltip and a labeled column header for the gradient stop list', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: { background: {
      layers: [{ kind: 'gradient', gradient: {
        type: 'linear', angle: '90deg',
        stops: [{ color: { literal: '#fff' } }, { color: { literal: '#000' }, position: '25%' }],
      } }],
    } },
    previewHost: document.createElement('div'),
    onEdit: () => {},
  });
  const row = host.querySelector('[data-stb-bg-row="layer"]')!;
  const header = row.querySelector('.stb-facet-bg-gradient-stops-header-pos');
  expect(header?.textContent).toBe('position');
  const stopPosInput = row.querySelector('.stb-facet-bg-gradient-stop-pos') as HTMLInputElement;
  expect(stopPosInput.title).toMatch(/length-percentage/i);
  expect(stopPosInput.title).toMatch(/25%/);
});

it('renders one MDN gradient help link per gradient layer, targeting the current type', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: { background: {
      layers: [{ kind: 'gradient', gradient: {
        type: 'radial', position: 'center',
        stops: [{ color: { literal: '#fff' } }, { color: { literal: '#000' } }],
      } }],
    } },
    previewHost: document.createElement('div'),
    onEdit: () => {},
  });
  const row = host.querySelector('[data-stb-bg-row="layer"]')!;
  const help = row.querySelector('.stb-facet-bg-gradient-help') as HTMLAnchorElement;
  expect(help).not.toBeNull();
  expect(help.href).toBe('https://developer.mozilla.org/en-US/docs/Web/CSS/gradient/radial-gradient');
  expect(help.target).toBe('_blank');
  expect(help.rel).toBe('noopener');
});

it('updates the MDN help link href when the gradient type select changes', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: { background: {
      layers: [{ kind: 'gradient', gradient: {
        type: 'linear', angle: '90deg',
        stops: [{ color: { literal: '#fff' } }, { color: { literal: '#000' } }],
      } }],
    } },
    previewHost: document.createElement('div'),
    onEdit: () => {},
  });
  const row = host.querySelector('[data-stb-bg-row="layer"]')!;
  const typeSel = row.querySelector('select') as HTMLSelectElement;
  const help = row.querySelector('.stb-facet-bg-gradient-help') as HTMLAnchorElement;
  expect(help.href).toBe('https://developer.mozilla.org/en-US/docs/Web/CSS/gradient/linear-gradient');
  typeSel.value = 'conic';
  typeSel.dispatchEvent(new Event('change'));
  expect(help.href).toBe('https://developer.mozilla.org/en-US/docs/Web/CSS/gradient/conic-gradient');
});

it('fires onSetLayer with an updated type when the gradient type select changes', () => {
  const host = document.createElement('div');
  const setLayers: [number, unknown][] = [];
  mountFacetTree(host, {
    facets: { background: {
      layers: [{ kind: 'gradient', gradient: {
        type: 'linear', angle: '90deg',
        stops: [{ color: { literal: '#fff' } }, { color: { literal: '#000' } }],
      } }],
    } },
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onSetLayer: (i, l) => setLayers.push([i, l]),
  });
  const row = host.querySelector('[data-stb-bg-row="layer"]')!;
  const typeSel = row.querySelector('select') as HTMLSelectElement;
  typeSel.value = 'radial';
  typeSel.dispatchEvent(new Event('change'));
  expect(setLayers.length).toBe(1);
  const [index, layer] = setLayers[0] as [number, { kind: string; gradient: { type: string; angle?: string; stops: unknown[] } }];
  expect(index).toBe(0);
  expect(layer.kind).toBe('gradient');
  expect(layer.gradient.type).toBe('radial');
  // Arm-specific fields must not leak across the union: linear's angle is
  // not a valid radial field and would make the persisted shape schema-invalid.
  expect('angle' in layer.gradient).toBe(false);
  expect(layer.gradient.stops.length).toBe(2);
});

it('carries position and repeating (but drops shape/size) when switching radial to conic', () => {
  const host = document.createElement('div');
  const setLayers: [number, unknown][] = [];
  mountFacetTree(host, {
    facets: { background: {
      layers: [{ kind: 'gradient', gradient: {
        type: 'radial', repeating: true, shape: 'circle', size: '40px', position: 'top left',
        stops: [{ color: { literal: '#fff' } }],
      } }],
    } },
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onSetLayer: (i, l) => setLayers.push([i, l]),
  });
  const typeSel = host.querySelector('[data-stb-bg-row="layer"] select') as HTMLSelectElement;
  typeSel.value = 'conic';
  typeSel.dispatchEvent(new Event('change'));
  const [, layer] = setLayers[0] as [number, { gradient: Record<string, unknown> }];
  expect(layer.gradient.type).toBe('conic');
  expect(layer.gradient.repeating).toBe(true);
  expect(layer.gradient.position).toBe('top left');
  expect('shape' in layer.gradient).toBe(false);
  expect('size' in layer.gradient).toBe(false);
});

it('fires onSetLayer with an updated angle when the linear angle/position input changes', () => {
  const host = document.createElement('div');
  const setLayers: [number, unknown][] = [];
  mountFacetTree(host, {
    facets: { background: {
      layers: [{ kind: 'gradient', gradient: {
        type: 'linear', angle: '90deg',
        stops: [{ color: { literal: '#fff' } }, { color: { literal: '#000' } }],
      } }],
    } },
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onSetLayer: (i, l) => setLayers.push([i, l]),
  });
  const row = host.querySelector('[data-stb-bg-row="layer"]')!;
  const angleInput = row.querySelector('.stb-facet-bg-gradient-pos') as HTMLInputElement;
  angleInput.value = '45deg';
  angleInput.dispatchEvent(new Event('input'));
  expect(setLayers.length).toBe(1);
  const [, layer] = setLayers[0] as [number, { gradient: { angle?: string } }];
  expect(layer.gradient.angle).toBe('45deg');
});

it('fires onSetLayer with an updated stop color when a stop swatch changes', () => {
  const host = document.createElement('div');
  const setLayers: [number, unknown][] = [];
  mountFacetTree(host, {
    facets: { background: {
      layers: [{ kind: 'gradient', gradient: {
        type: 'linear', angle: '90deg',
        stops: [{ color: { literal: '#fff' } }, { color: { literal: '#000' } }],
      } }],
    } },
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onSetLayer: (i, l) => setLayers.push([i, l]),
  });
  const row = host.querySelector('[data-stb-bg-row="layer"]')!;
  const swatch = row.querySelectorAll('.stb-facet-swatch')[0] as HTMLButtonElement;
  swatch.click();
  const textInput = document.querySelector('.stb-color-text') as HTMLInputElement;
  expect(textInput).toBeTruthy();
  textInput.value = '#123456';
  textInput.dispatchEvent(new Event('input'));
  expect(setLayers.length).toBe(1);
  const [, layer] = setLayers[0] as [number, { gradient: { stops: Array<{ color: { literal: unknown } }> } }];
  expect(layer.gradient.stops[0]!.color.literal).toBeTruthy();
  expect(layer.gradient.stops[1]!.color.literal).toEqual('#000');
});

it('preserves exotic radial gradient fields (shape, size) when editing the position or a stop color', () => {
  const host = document.createElement('div');
  const setLayers: [number, unknown][] = [];
  mountFacetTree(host, {
    facets: { background: {
      layers: [{ kind: 'gradient', gradient: {
        type: 'radial', shape: 'circle', size: '40px', position: 'center',
        stops: [{ color: { literal: '#fff' } }, { color: { literal: '#000' } }],
      } }],
    } },
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onSetLayer: (i, l) => setLayers.push([i, l]),
  });
  const row = host.querySelector('[data-stb-bg-row="layer"]')!;
  const posInput = row.querySelector('.stb-facet-bg-gradient-pos') as HTMLInputElement;
  posInput.value = 'top left';
  posInput.dispatchEvent(new Event('input'));
  const [, layer1] = setLayers[0] as [number, { gradient: { shape?: string; size?: string; position?: string } }];
  expect(layer1.gradient.shape).toBe('circle');
  expect(layer1.gradient.size).toBe('40px');
  expect(layer1.gradient.position).toBe('top left');

  const swatch = row.querySelectorAll('.stb-facet-swatch')[1] as HTMLButtonElement;
  swatch.click();
  const textInput = document.querySelector('.stb-color-text') as HTMLInputElement;
  textInput.value = '#abcdef';
  textInput.dispatchEvent(new Event('input'));
  const [, layer2] = setLayers[1] as [number, { gradient: { shape?: string; size?: string } }];
  expect(layer2.gradient.shape).toBe('circle');
  expect(layer2.gradient.size).toBe('40px');
});

it('appends a stop when + stop is clicked and removes one via the stop remove button', () => {
  const host = document.createElement('div');
  const setLayers: [number, unknown][] = [];
  mountFacetTree(host, {
    facets: { background: {
      layers: [{ kind: 'gradient', gradient: {
        type: 'linear', angle: '90deg',
        stops: [{ color: { literal: '#fff' } }, { color: { literal: '#000' } }],
      } }],
    } },
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onSetLayer: (i, l) => setLayers.push([i, l]),
  });
  const row = host.querySelector('[data-stb-bg-row="layer"]')!;
  (row.querySelector('.stb-facet-bg-gradient-add-stop') as HTMLButtonElement).click();
  const [, added] = setLayers[0] as [number, { gradient: { stops: Array<{ color: unknown }> } }];
  expect(added.gradient.stops.length).toBe(3);

  const removeBtns = row.querySelectorAll('.stb-facet-bg-gradient-stop-remove');
  (removeBtns[0] as HTMLButtonElement).click();
  // sequential edits compose: remove acts on the 3-stop result of the add
  // (current gradient state), not on the mount-time 2-stop snapshot
  const [, removed] = setLayers[1] as [number, { gradient: { stops: Array<{ color: { literal: unknown } }> } }];
  expect(removed.gradient.stops.length).toBe(2);
  expect(removed.gradient.stops[0]!.color.literal).toBe('#000');
  // A fresh stop carries an Oklch object literal, not a raw hex string — matching
  // the shape produced by every other stop edit — so per-stop dark derive is
  // enabled immediately rather than disabled until the user first edits the color.
  expect(removed.gradient.stops[1]!.color.literal).toEqual(toOklch('#000000'));
});

it('disables the stop remove button when only one stop remains', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: { background: {
      layers: [{ kind: 'gradient', gradient: {
        type: 'linear', stops: [{ color: { literal: '#fff' } }],
      } }],
    } },
    previewHost: document.createElement('div'),
    onEdit: () => {},
  });
  const removeBtn = host.querySelector('.stb-facet-bg-gradient-stop-remove') as HTMLButtonElement;
  expect(removeBtn.disabled).toBe(true);
});

it('sets and clears a stop position via the stop position input', () => {
  const host = document.createElement('div');
  const setLayers: [number, unknown][] = [];
  mountFacetTree(host, {
    facets: { background: {
      layers: [{ kind: 'gradient', gradient: {
        type: 'linear',
        stops: [{ color: { literal: '#fff' }, position: '10%' }, { color: { literal: '#000' } }],
      } }],
    } },
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onSetLayer: (i, l) => setLayers.push([i, l]),
  });
  const row = host.querySelector('[data-stb-bg-row="layer"]')!;
  const posInputs = row.querySelectorAll('.stb-facet-bg-gradient-stop-pos');
  const second = posInputs[1] as HTMLInputElement;
  second.value = '80%';
  second.dispatchEvent(new Event('input'));
  const [, withPos] = setLayers[0] as [number, { gradient: { stops: Array<{ position?: string }> } }];
  expect(withPos.gradient.stops[1]!.position).toBe('80%');

  const first = posInputs[0] as HTMLInputElement;
  first.value = '';
  first.dispatchEvent(new Event('input'));
  const [, cleared] = setLayers[1] as [number, { gradient: { stops: Array<Record<string, unknown>> } }];
  // Clearing removes the key entirely (exactOptionalPropertyTypes: no position: undefined).
  expect('position' in cleared.gradient.stops[0]!).toBe(false);
});

it('edits the position field of a conic gradient', () => {
  const host = document.createElement('div');
  const setLayers: [number, unknown][] = [];
  mountFacetTree(host, {
    facets: { background: {
      layers: [{ kind: 'gradient', gradient: {
        type: 'conic', fromAngle: '45deg', position: 'center',
        stops: [{ color: { literal: '#fff' } }, { color: { literal: '#000' } }],
      } }],
    } },
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onSetLayer: (i, l) => setLayers.push([i, l]),
  });
  const row = host.querySelector('[data-stb-bg-row="layer"]')!;
  const posInput = row.querySelector('.stb-facet-bg-gradient-pos') as HTMLInputElement;
  expect(posInput.value).toBe('center');
  posInput.value = 'top';
  posInput.dispatchEvent(new Event('input'));
  const [, layer] = setLayers[0] as [number, { gradient: { type: string; fromAngle?: string; position?: string } }];
  expect(layer.gradient.type).toBe('conic');
  expect(layer.gradient.position).toBe('top');
  // Exotic conic field preserved by the same-arm spread.
  expect(layer.gradient.fromAngle).toBe('45deg');
});

it('fires onAddLayer with a default linear gradient when + gradient is clicked', () => {
  const host = document.createElement('div');
  const added: unknown[] = [];
  mountFacetTree(host, {
    facets: { background: {} },
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onAddLayer: (l) => added.push(l),
  });
  const addGradientBtn = host.querySelector('.stb-facet-bg-add-gradient') as HTMLButtonElement;
  expect(addGradientBtn).not.toBeNull();
  addGradientBtn.click();
  // Oklch object literals, not raw hex strings — same normalization as + stop,
  // so a freshly added gradient's stops support dark derive immediately.
  expect(added).toEqual([{
    kind: 'gradient',
    gradient: {
      type: 'linear',
      stops: [{ color: { literal: toOklch('#000000') } }, { color: { literal: toOklch('#ffffff') } }],
    },
  }]);
});

it('fires onBackstop when the backstop swatch color changes', () => {
  const host = document.createElement('div');
  const backstops: unknown[] = [];
  mountFacetTree(host, {
    facets: { background: { color: { literal: { l: 0.4, c: 0.1, h: 250 } } } },
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onBackstop: (v) => backstops.push(v),
  });
  const btn = host.querySelector('[data-stb-bg-row="color"] .stb-facet-swatch') as HTMLButtonElement;
  expect(btn).toBeTruthy();
  btn.click();
  const textInput = document.querySelector('.stb-color-text') as HTMLInputElement;
  expect(textInput).toBeTruthy();
  textInput.value = '#112233';
  textInput.dispatchEvent(new Event('input'));
  expect(backstops.length).toBe(1);
  expect(backstops[0]).toHaveProperty('literal');
});

it('fires onAddLayer, onRemoveLayer and onReorderLayer for layer row controls', () => {
  const host = document.createElement('div');
  const added: unknown[] = [];
  const removed: number[] = [];
  const reordered: [number, number][] = [];
  mountFacetTree(host, {
    facets: { background: { layers: [
      { kind: 'image', ref: 'a' },
      { kind: 'image', ref: 'b' },
    ] } },
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onAddLayer: (l) => added.push(l),
    onRemoveLayer: (i) => removed.push(i),
    onReorderLayer: (from, to) => reordered.push([from, to]),
  });
  const rows = [...host.querySelectorAll('[data-stb-bg-row="layer"]')];
  expect(rows.length).toBe(2);
  // first row (index 0) has no move-up (already bottom); second has no move-down (already top)
  expect((rows[0]!.querySelector('.stb-facet-bg-move-up') as HTMLButtonElement).disabled).toBe(true);
  expect((rows[1]!.querySelector('.stb-facet-bg-move-down') as HTMLButtonElement).disabled).toBe(true);
  (rows[0]!.querySelector('.stb-facet-bg-move-down') as HTMLButtonElement).click();
  expect(reordered).toContainEqual([0, 1]);
  (rows[1]!.querySelector('.stb-facet-bg-remove') as HTMLButtonElement).click();
  expect(removed).toContain(1);
  (host.querySelector('.stb-facet-bg-add-image') as HTMLButtonElement).click();
  expect(added).toContainEqual({ kind: 'image', ref: '' });
  expect(host.querySelector('.stb-facet-bg-add-gradient')).not.toBeNull();
});

// --- background as a collapsible group ---

it('renders background as a collapsible group branch, like text/surface/spacing', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: { background: { color: { literal: { l: 0.4, c: 0.1, h: 250 } } }, text: {} },
    previewHost: document.createElement('div'),
    onEdit: () => {},
  });
  const branches = [...host.querySelectorAll('.stb-facet-group')] as HTMLElement[];
  const bgBranch = branches.find((b) => b.textContent?.includes('background'))!;
  expect(bgBranch).toBeTruthy();
  // No remove affordance: background isn't addable/removable via onRemoveGroup.
  expect(bgBranch.querySelector('.stb-facet-remove')).toBeNull();
  bgBranch.click();
  expect(bgBranch.classList.contains('stb-facet-collapsed')).toBe(true);
  const bgRow = host.querySelector('[data-stb-bg-row="color"]') as HTMLElement;
  expect(bgRow.closest('.stb-facet-leaves')?.hasAttribute('hidden')).toBe(true);
  bgBranch.click();
  expect(bgBranch.classList.contains('stb-facet-collapsed')).toBe(false);
});

it('collapse-all/expand-all fold and unfold the background group alongside style groups', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: { background: { color: { literal: { l: 0.4, c: 0.1, h: 250 } } }, text: {} },
    previewHost: document.createElement('div'),
    onEdit: () => {},
  });
  (host.querySelector('.stb-facet-collapse-all') as HTMLButtonElement).click();
  expect(host.querySelectorAll('.stb-facet-group.stb-facet-collapsed').length).toBe(2);
  (host.querySelector('.stb-facet-expand-all') as HTMLButtonElement).click();
  expect(host.querySelectorAll('.stb-facet-group.stb-facet-collapsed').length).toBe(0);
});

it('isolate collapses text but not background when a background control is focused', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: { background: { color: { literal: { l: 0.4, c: 0.1, h: 250 } } }, text: {} },
    previewHost: document.createElement('div'),
    onEdit: () => {},
  });
  const bgSwatch = host.querySelector('[data-stb-bg-row="color"] .stb-facet-swatch') as HTMLElement;
  bgSwatch.dispatchEvent(new Event('focusin', { bubbles: true }));
  (host.querySelector('.stb-facet-isolate') as HTMLButtonElement).click();
  const collapsed = [...host.querySelectorAll('.stb-facet-group.stb-facet-collapsed')];
  expect(collapsed.length).toBe(1);
  expect(collapsed[0]!.textContent).toContain('text');
});

// --- background row subtitles ---

it('labels the color row "color"', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: { background: { color: { literal: { l: 0.4, c: 0.1, h: 250 } } } },
    previewHost: document.createElement('div'),
    onEdit: () => {},
  });
  const row = host.querySelector('[data-stb-bg-row="color"]')!;
  const subtitle = row.querySelector('.stb-facet-bg-subtitle') as HTMLElement;
  expect(subtitle.textContent).toBe('color');
});

it('labels an image layer row with its ref, or "(no image)" when empty', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: { background: { layers: [{ kind: 'image', ref: 'assets/hero.jpg' }, { kind: 'image', ref: '' }] } },
    previewHost: document.createElement('div'),
    onEdit: () => {},
  });
  const rows = [...host.querySelectorAll('[data-stb-bg-row="layer"]')];
  expect((rows[0]!.querySelector('.stb-facet-bg-subtitle') as HTMLElement).textContent)
    .toBe('image — assets/hero.jpg');
  expect((rows[1]!.querySelector('.stb-facet-bg-subtitle') as HTMLElement).textContent)
    .toBe('image — (no image)');
});

it('labels a gradient layer row with its type', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: { background: { layers: [{ kind: 'gradient', gradient: {
      type: 'radial', stops: [{ color: { literal: '#fff' } }, { color: { literal: '#000' } }],
    } }] } },
    previewHost: document.createElement('div'),
    onEdit: () => {},
  });
  const row = host.querySelector('[data-stb-bg-row="layer"]')!;
  const subtitle = row.querySelector('.stb-facet-bg-subtitle') as HTMLElement;
  expect(subtitle.textContent).toBe('gradient — radial');
});

it('fires onSetLayer with a stored asset ref when a file is chosen for an image layer row', () => {
  const host = document.createElement('div');
  const setLayers: [number, unknown][] = [];
  mountFacetTree(host, {
    facets: { background: { layers: [{ kind: 'image', ref: '' }] } },
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onSetLayer: (i, l) => setLayers.push([i, l]),
  });
  const row = host.querySelector('[data-stb-bg-row="layer"]')!;
  const input = row.querySelector('input[type="file"]') as HTMLInputElement;
  expect(input).toBeTruthy();
  const file = new File(['x'], 'hero.jpg', { type: 'image/jpeg' });
  Object.defineProperty(input, 'files', { value: [file] });
  input.dispatchEvent(new Event('change'));
  expect(setLayers).toEqual([[0, { kind: 'image', ref: 'assets/hero.jpg' }]]);
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

it('renders a font-family row per fallback entry, in order', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: { text: { fontFamily: [{ literal: 'Inter' }, { literal: 'system-ui' }] } },
    previewHost: document.createElement('div'),
    onEdit: () => {},
  });
  const rows = [...host.querySelectorAll('[data-stb-fontfamily-row]')];
  expect(rows.length).toBe(2);
  const inputs = rows.map((r) => (r.querySelector('input') as HTMLInputElement).value);
  expect(inputs).toEqual(['Inter', 'system-ui']);
});

it('fires onAddFont from the footer add button', () => {
  const host = document.createElement('div');
  const added: unknown[] = [];
  mountFacetTree(host, {
    facets: { text: {} },
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onAddFont: (v) => added.push(v),
  });
  (host.querySelector('.stb-facet-fontfamily-add') as HTMLButtonElement).click();
  expect(added).toEqual([{ literal: '' }]);
});

it('fires onSetFont when a row input changes', () => {
  const host = document.createElement('div');
  const sets: [number, unknown][] = [];
  mountFacetTree(host, {
    facets: { text: { fontFamily: [{ literal: 'Inter' }] } },
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onSetFont: (i, v) => sets.push([i, v]),
  });
  const input = host.querySelector('[data-stb-fontfamily-row] input') as HTMLInputElement;
  input.value = 'Roboto';
  input.dispatchEvent(new Event('input'));
  expect(sets).toEqual([[0, { literal: 'Roboto' }]]);
});

it('fires onRemoveFont from a row remove button', () => {
  const host = document.createElement('div');
  const removed: number[] = [];
  mountFacetTree(host, {
    facets: { text: { fontFamily: [{ literal: 'Inter' }] } },
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onRemoveFont: (i) => removed.push(i),
  });
  (host.querySelector('[data-stb-fontfamily-row] .stb-facet-fontfamily-remove') as HTMLButtonElement).click();
  expect(removed).toEqual([0]);
});

it('fires onReorderFont from a row move button, disabling at the ends', () => {
  const host = document.createElement('div');
  const reorders: [number, number][] = [];
  mountFacetTree(host, {
    facets: { text: { fontFamily: [{ literal: 'Inter' }, { literal: 'system-ui' }] } },
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onReorderFont: (from, to) => reorders.push([from, to]),
  });
  const rows = [...host.querySelectorAll('[data-stb-fontfamily-row]')];
  const firstUp = rows[0]!.querySelector('.stb-facet-fontfamily-move-up') as HTMLButtonElement;
  const firstDown = rows[0]!.querySelector('.stb-facet-fontfamily-move-down') as HTMLButtonElement;
  const lastDown = rows[1]!.querySelector('.stb-facet-fontfamily-move-down') as HTMLButtonElement;
  expect(firstUp.disabled).toBe(true);
  expect(lastDown.disabled).toBe(true);
  firstDown.click();
  expect(reorders).toEqual([[0, 1]]);
});

it('renders T/R/B/L inputs for padding and margin, and row/column inputs for gap, populated from existing values', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: {
      spacing: {
        padding: { top: { literal: '8px' }, left: { literal: '4px' } },
        gap: { row: { literal: '2px' } },
      },
    },
    previewHost: document.createElement('div'),
    onEdit: () => {},
  });
  const paddingRow = host.querySelector('[data-stb-spacing-group="padding"]')!;
  const paddingInputs = [...paddingRow.querySelectorAll('.stb-facet-spacing-side')] as HTMLInputElement[];
  expect(paddingInputs.length).toBe(4);
  expect(paddingInputs.map((i) => i.value)).toEqual(['8px', '', '', '4px']);

  const marginRow = host.querySelector('[data-stb-spacing-group="margin"]')!;
  expect(marginRow.querySelectorAll('.stb-facet-spacing-side').length).toBe(4);

  const gapRow = host.querySelector('[data-stb-spacing-group="gap"]')!;
  const gapInputs = [...gapRow.querySelectorAll('.stb-facet-spacing-gap')] as HTMLInputElement[];
  expect(gapInputs.length).toBe(2);
  expect(gapInputs.map((i) => i.value)).toEqual(['2px', '']);
});

it('fires onSetSide with (group, side, value) when a padding/margin input changes', () => {
  const host = document.createElement('div');
  const sets: [string, string, unknown][] = [];
  mountFacetTree(host, {
    facets: { spacing: {} },
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onSetSide: (group, side, value) => sets.push([group, side, value]),
  });
  const paddingRow = host.querySelector('[data-stb-spacing-group="padding"]')!;
  const topInput = paddingRow.querySelector('[data-stb-side="top"]') as HTMLInputElement;
  topInput.value = '10px';
  topInput.dispatchEvent(new Event('input'));
  expect(sets).toEqual([['padding', 'top', { literal: '10px' }]]);

  const marginRow = host.querySelector('[data-stb-spacing-group="margin"]')!;
  const bottomInput = marginRow.querySelector('[data-stb-side="bottom"]') as HTMLInputElement;
  bottomInput.value = '5px';
  bottomInput.dispatchEvent(new Event('input'));
  expect(sets).toEqual([['padding', 'top', { literal: '10px' }], ['margin', 'bottom', { literal: '5px' }]]);
});

it('fires onSetGap with (slot, value) when a gap input changes', () => {
  const host = document.createElement('div');
  const sets: [string, unknown][] = [];
  mountFacetTree(host, {
    facets: { spacing: {} },
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onSetGap: (slot, value) => sets.push([slot, value]),
  });
  const gapRow = host.querySelector('[data-stb-spacing-group="gap"]')!;
  const colInput = gapRow.querySelector('[data-stb-slot="column"]') as HTMLInputElement;
  colInput.value = '6px';
  colInput.dispatchEvent(new Event('input'));
  expect(sets).toEqual([['column', { literal: '6px' }]]);
});

it('consecutive edits to two gradient fields both survive without a re-mount (no stale-closure clobber)', () => {
  const host = document.createElement('div');
  const setLayers: [number, unknown][] = [];
  mountFacetTree(host, {
    facets: { background: {
      layers: [{ kind: 'gradient', gradient: {
        type: 'linear',
        stops: [{ color: { literal: '#fff' } }, { color: { literal: '#000' } }],
      } }],
    } },
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onSetLayer: (i, l) => setLayers.push([i, l]),
  });
  const row = host.querySelector('[data-stb-bg-row="layer"]')!;
  // Re-render is suppressed while an input is focused, so the tree stays
  // mounted across BOTH edits — the second must build on the first, not on
  // the mount-time gradient snapshot.
  const angleInput = row.querySelector('.stb-facet-bg-gradient-pos') as HTMLInputElement;
  angleInput.value = '45deg';
  angleInput.dispatchEvent(new Event('input'));
  const stopPos = row.querySelector('.stb-facet-bg-gradient-stop-pos') as HTMLInputElement;
  stopPos.value = '10%';
  stopPos.dispatchEvent(new Event('input'));
  const [, last] = setLayers[setLayers.length - 1] as
    [number, { gradient: { angle?: string; stops: { position?: string }[] } }];
  expect(last.gradient.angle).toBe('45deg');       // first edit survives
  expect(last.gradient.stops[0]!.position).toBe('10%'); // second edit applied
});

// --- background backstop dark axis ---

it('renders a dark swatch and derive button beside the backstop light swatch', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: { background: { color: { literal: { l: 0.4, c: 0.1, h: 250 } } } },
    darkFacets: {},
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onDarkEdit: () => {},
  });
  const row = host.querySelector('[data-stb-bg-row="color"]')!;
  expect(row.querySelectorAll('.stb-facet-swatch').length).toBe(1);
  expect(row.querySelector('.stb-facet-swatch-dark')).not.toBeNull();
  expect(row.querySelector('.stb-facet-derive-dark')).not.toBeNull();
});

it('backstop dark swatch is neutral/empty when no dark backstop is set', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: { background: { color: { literal: { l: 0.4, c: 0.1, h: 250 } } } },
    darkFacets: {},
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onDarkEdit: () => {},
  });
  const row = host.querySelector('[data-stb-bg-row="color"]')!;
  const darkBtn = row.querySelector('.stb-facet-swatch-dark') as HTMLButtonElement;
  expect(darkBtn.classList.contains('stb-facet-swatch-empty')).toBe(true);
  expect(darkBtn.style.backgroundColor).toBe('');
});

it('backstop dark swatch reflects an existing dark literal', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: { background: { color: { literal: { l: 0.4, c: 0.1, h: 250 } } } },
    darkFacets: { background: { color: { literal: { l: 0.2, c: 0.05, h: 100 } } } },
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onDarkEdit: () => {},
  });
  const row = host.querySelector('[data-stb-bg-row="color"]')!;
  const darkBtn = row.querySelector('.stb-facet-swatch-dark') as HTMLButtonElement;
  expect(darkBtn.classList.contains('stb-facet-swatch-empty')).toBe(false);
  expect(darkBtn.style.backgroundColor).not.toBe('');
});

it('editing the backstop dark swatch invokes onDarkEdit with background.color', () => {
  const host = document.createElement('div');
  const darkEdits: [string, unknown][] = [];
  mountFacetTree(host, {
    facets: { background: { color: { literal: { l: 0.4, c: 0.1, h: 250 } } } },
    darkFacets: {},
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onDarkEdit: (k, v) => darkEdits.push([k, v]),
  });
  const row = host.querySelector('[data-stb-bg-row="color"]')!;
  (row.querySelector('.stb-facet-swatch-dark') as HTMLButtonElement).click();
  const textInput = document.querySelector('.stb-color-text') as HTMLInputElement;
  expect(textInput).toBeTruthy();
  textInput.value = '#112233';
  textInput.dispatchEvent(new Event('input'));
  expect(darkEdits.length).toBe(1);
  expect(darkEdits[0]![0]).toBe('background.color');
  expect(darkEdits[0]![1]).toHaveProperty('literal');
});

it('clicking the backstop derive button calls deriveDark with background.color', () => {
  const host = document.createElement('div');
  const derived: string[] = [];
  mountFacetTree(host, {
    facets: { background: { color: { literal: { l: 0.4, c: 0.1, h: 250 } } } },
    darkFacets: {},
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onDarkEdit: () => {},
    deriveDark: (k) => derived.push(k),
  });
  const row = host.querySelector('[data-stb-bg-row="color"]')!;
  (row.querySelector('.stb-facet-derive-dark') as HTMLButtonElement).click();
  expect(derived).toEqual(['background.color']);
});

it('backstop derive button is disabled when the light backstop has no literal Oklch', () => {
  const host = document.createElement('div');
  const derived: string[] = [];
  mountFacetTree(host, {
    facets: { background: {} },
    darkFacets: {},
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onDarkEdit: () => {},
    deriveDark: (k) => derived.push(k),
  });
  const row = host.querySelector('[data-stb-bg-row="color"]')!;
  const deriveBtn = row.querySelector('.stb-facet-derive-dark') as HTMLButtonElement;
  expect(deriveBtn.disabled).toBe(true);
  deriveBtn.click();
  expect(derived).toEqual([]);
});

// --- gradient stop dark axis ---

function gradientLayerFacets() {
  return {
    background: {
      layers: [{ kind: 'gradient' as const, gradient: {
        type: 'linear' as const, angle: '90deg',
        stops: [{ color: { literal: '#fff' } }, { color: { literal: '#000' } }],
      } }],
    },
  };
}

it('renders a dark swatch and per-stop derive button for each gradient stop', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: gradientLayerFacets(),
    darkFacets: {},
    previewHost: document.createElement('div'),
    onEdit: () => {},
  });
  const stopRows = host.querySelectorAll('.stb-facet-bg-gradient-stop');
  expect(stopRows.length).toBe(2);
  for (const row of stopRows) {
    expect(row.querySelectorAll('.stb-facet-swatch').length).toBe(1);
    expect(row.querySelector('.stb-facet-swatch-dark')).not.toBeNull();
    expect(row.querySelector('.stb-facet-derive-dark')).not.toBeNull();
  }
});

it('gradient stop dark swatch is empty when no dark gradient layer exists yet', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: gradientLayerFacets(),
    darkFacets: {},
    previewHost: document.createElement('div'),
    onEdit: () => {},
  });
  const stopRow = host.querySelectorAll('.stb-facet-bg-gradient-stop')[0]!;
  const darkSwatch = stopRow.querySelector('.stb-facet-swatch-dark') as HTMLButtonElement;
  expect(darkSwatch.classList.contains('stb-facet-swatch-empty')).toBe(true);
});

it('editing a gradient stop dark swatch seeds the dark gradient from the light structure (copy-on-first-edit)', () => {
  const host = document.createElement('div');
  const setLayersDark: [number, unknown][] = [];
  mountFacetTree(host, {
    facets: gradientLayerFacets(),
    darkFacets: {},
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onSetLayerDark: (i, l) => setLayersDark.push([i, l]),
  });
  const stopRow = host.querySelectorAll('.stb-facet-bg-gradient-stop')[0]!;
  const darkSwatch = stopRow.querySelector('.stb-facet-swatch-dark') as HTMLButtonElement;
  darkSwatch.click();
  const textInput = document.querySelector('.stb-color-text') as HTMLInputElement;
  expect(textInput).toBeTruthy();
  textInput.value = '#101010';
  textInput.dispatchEvent(new Event('input'));
  expect(setLayersDark.length).toBe(1);
  const [index, layer] = setLayersDark[0] as [number, { kind: string; gradient: { angle?: string; stops: Array<{ color: { literal?: unknown } }> } }];
  expect(index).toBe(0);
  // Copy-on-first-edit: the seeded gradient carries the light gradient's
  // structure (angle, stop count) with only stop 0's color replaced.
  expect(layer.gradient.angle).toBe('90deg');
  expect(layer.gradient.stops.length).toBe(2);
  expect(layer.gradient.stops[0]!.color.literal).toBeTruthy();
  expect(layer.gradient.stops[1]!.color).toEqual({ literal: '#000' });
});

it('a second dark stop edit builds on the existing dark layers, not a fresh seed from light', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: gradientLayerFacets(),
    darkFacets: { background: { layers: [{ kind: 'gradient', gradient: {
      type: 'linear', angle: '180deg',
      stops: [{ color: { literal: '#111111' } }, { color: { literal: '#222222' } }],
    } }] } },
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onSetLayerDark: () => {},
  });
  const stopRow = host.querySelectorAll('.stb-facet-bg-gradient-stop')[1]!;
  const darkSwatch = stopRow.querySelector('.stb-facet-swatch-dark') as HTMLButtonElement;
  // The existing dark stop 1 color (#222222) is reflected, not empty — proving
  // the render read from darkFacets rather than re-seeding from light.
  expect(darkSwatch.classList.contains('stb-facet-swatch-empty')).toBe(false);
});

it('a dark gradient edit builds on the pre-existing dark layer angle, not the light angle', () => {
  const host = document.createElement('div');
  const setLayersDark: [number, unknown][] = [];
  mountFacetTree(host, {
    facets: gradientLayerFacets(),
    darkFacets: { background: { layers: [{ kind: 'gradient', gradient: {
      type: 'linear', angle: '180deg',
      stops: [{ color: { literal: '#111111' } }, { color: { literal: '#222222' } }],
    } }] } },
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onSetLayerDark: (i, l) => setLayersDark.push([i, l]),
  });
  const stopRow = host.querySelectorAll('.stb-facet-bg-gradient-stop')[1]!;
  const darkSwatch = stopRow.querySelector('.stb-facet-swatch-dark') as HTMLButtonElement;
  darkSwatch.click();
  const textInput = document.querySelector('.stb-color-text') as HTMLInputElement;
  textInput.value = '#303030';
  textInput.dispatchEvent(new Event('input'));
  const [, layer] = setLayersDark[0] as [number, { gradient: { angle?: string; stops: Array<{ color: { literal?: unknown } }> } }];
  // Fork pinned: the pre-existing dark angle (180deg) survives, not the light one (90deg).
  expect(layer.gradient.angle).toBe('180deg');
  expect(layer.gradient.stops[0]!.color).toEqual({ literal: '#111111' });
});

it('per-stop derive produces a dark literal distinct from the light stop and calls onSetLayerDark', () => {
  const host = document.createElement('div');
  const setLayersDark: [number, unknown][] = [];
  mountFacetTree(host, {
    facets: { background: { layers: [{ kind: 'gradient', gradient: {
      type: 'linear', angle: '90deg',
      stops: [{ color: { literal: { l: 0.3, c: 0.1, h: 250 } } }, { color: { literal: '#000' } }],
    } }] } },
    darkFacets: {},
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onSetLayerDark: (i, l) => setLayersDark.push([i, l]),
  });
  const stopRow = host.querySelectorAll('.stb-facet-bg-gradient-stop')[0]!;
  const deriveBtn = stopRow.querySelector('.stb-facet-derive-dark') as HTMLButtonElement;
  expect(deriveBtn.disabled).toBe(false);
  deriveBtn.click();
  expect(setLayersDark.length).toBe(1);
  const [, layer] = setLayersDark[0] as [number, { gradient: { stops: Array<{ color: { literal?: unknown } }> } }];
  expect(layer.gradient.stops[0]!.color.literal).not.toEqual({ l: 0.3, c: 0.1, h: 250 });
});

it('per-stop derive is disabled for a token stop', () => {
  const host = document.createElement('div');
  mountFacetTree(host, {
    facets: { background: { layers: [{ kind: 'gradient', gradient: {
      type: 'linear', angle: '90deg',
      stops: [{ color: { token: 'brand' } }, { color: { literal: '#000' } }],
    } }] } },
    darkFacets: {},
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onSetLayerDark: () => {},
  });
  const stopRow = host.querySelectorAll('.stb-facet-bg-gradient-stop')[0]!;
  const deriveBtn = stopRow.querySelector('.stb-facet-derive-dark') as HTMLButtonElement;
  expect(deriveBtn.disabled).toBe(true);
});

it('forked dark layers are authoritative: a light reorder that breaks index correspondence disables that row instead of re-seeding from light', () => {
  // Reviewed regression (#5517): dark was forked as [gradientA, imageB]. A light
  // structural edit (add/remove/reorder) — which only ever touches light — then
  // left light index 1 as a gradient while dark index 1 is still the image layer.
  // Per-index correspondence is broken at that row: it must render empty/disabled,
  // never silently re-seed from the current light gradient and clobber the real
  // dark fork sitting at that index once main.ts's array-level onSetLayerDark
  // writes the whole array back.
  const host = document.createElement('div');
  const setLayersDark: [number, unknown][] = [];
  mountFacetTree(host, {
    facets: {
      background: {
        layers: [
          { kind: 'gradient', gradient: {
            type: 'linear', angle: '90deg',
            stops: [{ color: { literal: '#fff' } }, { color: { literal: '#000' } }],
          } },
          // Post-reorder: light index 1 is now a gradient (used to be at index 0,
          // or a fresh gradient) while dark index 1 (below) is still the image
          // layer that was forked before the reorder happened.
          { kind: 'gradient', gradient: {
            type: 'linear', angle: '45deg',
            stops: [{ color: { literal: '#abcabc' } }, { color: { literal: '#defdef' } }],
          } },
        ],
      },
    },
    darkFacets: {
      background: {
        layers: [
          { kind: 'gradient', gradient: {
            type: 'linear', angle: '90deg',
            stops: [{ color: { literal: '#111111' } }, { color: { literal: '#222222' } }],
          } },
          { kind: 'image', ref: 'assets/dark-hero.jpg' },
        ],
      },
    },
    previewHost: document.createElement('div'),
    onEdit: () => {},
    onSetLayerDark: (i, l) => setLayersDark.push([i, l]),
  });

  const gradientRows = host.querySelectorAll('.stb-facet-bg-gradient');
  expect(gradientRows.length).toBe(2);
  const mismatchedStopRows = gradientRows[1]!.querySelectorAll('.stb-facet-bg-gradient-stop');
  expect(mismatchedStopRows.length).toBe(2);

  for (const stopRow of mismatchedStopRows) {
    const darkSwatch = stopRow.querySelector('.stb-facet-swatch-dark') as HTMLButtonElement;
    const deriveBtn = stopRow.querySelector('.stb-facet-derive-dark') as HTMLButtonElement;

    // Empty, not a re-seeded light color.
    expect(darkSwatch.classList.contains('stb-facet-swatch-empty')).toBe(true);
    // Disabled: no picker, no derive.
    expect(darkSwatch.disabled).toBe(true);
    expect(deriveBtn.disabled).toBe(true);

    // Clicking either control must not fire onSetLayerDark with a light-seeded
    // clobber of the real dark image layer sitting at this index.
    darkSwatch.click();
    deriveBtn.click();
  }
  expect(setLayersDark.length).toBe(0);

  // The row that DOES still correspond (index 0) is unaffected and still works.
  const okStopRow = gradientRows[0]!.querySelectorAll('.stb-facet-bg-gradient-stop')[0]!;
  const okDarkSwatch = okStopRow.querySelector('.stb-facet-swatch-dark') as HTMLButtonElement;
  expect(okDarkSwatch.disabled).toBe(false);
  expect(okDarkSwatch.classList.contains('stb-facet-swatch-empty')).toBe(false);
});
