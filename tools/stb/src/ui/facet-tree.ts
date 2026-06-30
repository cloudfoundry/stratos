// src/ui/facet-tree.ts
import type { Facets, FacetValue } from '@/metadata/types';
import type { Oklch } from '@/color/oklch';
import { toOklch, oklchToHex } from '@/color/oklch';
import { FACET_PROPS } from '@/metadata/facets';
import { openColorPicker } from '@/ui/color-picker';
import { mountCssEditor } from '@/ui/css-editor';

const GROUPS = ['text', 'surface', 'spacing'] as const;
const propsOf = (g: string) => Object.entries(FACET_PROPS).filter(([k]) => k.startsWith(g + '.'));

export interface FacetTreeOptions {
  facets: Facets;
  previewHost: HTMLElement;
  onEdit: (key: string, value: FacetValue) => void;
  scopedBlock?: string;
  onScopedBlockChange?: (css: string) => void;
}

const FONT_FAMILIES = [
  'inherit',
  'system-ui',
  'Arial, sans-serif',
  'Georgia, serif',
  '"Courier New", monospace',
];
const FONT_WEIGHTS = ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

export function mountFacetTree(host: HTMLElement, opts: FacetTreeOptions): { destroy(): void } {
  host.classList.add('stb-facet-tree');
  host.innerHTML = '';
  let scoped: ReturnType<typeof mountCssEditor> | null = null;

  for (const g of GROUPS) {
    if (!opts.facets[g]) continue;
    const branch = document.createElement('div');
    branch.className = 'stb-facet-group';
    branch.textContent = g;
    host.appendChild(branch);
    for (const [key, spec] of propsOf(g)) {
      const leaf = document.createElement('div');
      leaf.className = 'stb-facet-leaf';
      leaf.dataset.key = key;
      const lab = document.createElement('span');
      lab.className = 'stb-facet-leaf-label';
      lab.textContent = spec.cssProp;
      leaf.appendChild(lab);

      const propName = key.split('.')[1]!;
      const current = (opts.facets[g] as Record<string, FacetValue | undefined>)?.[propName];

      if (spec.isColor) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'stb-facet-swatch';
        const lit = current && 'literal' in current && typeof current.literal === 'object'
          ? current.literal as Oklch
          : null;
        if (lit) btn.style.backgroundColor = oklchToHex(lit);
        btn.addEventListener('click', () => openColorPicker({
          previewHost: opts.previewHost,
          initial: lit ? oklchToHex(lit) : '#000000',
          // NOTE: hex is deliberate — value is stored as Oklch regardless of picker display format,
          // so threading the live color-format signal buys nothing here.
          format: 'hex',
          onChange: (value) => opts.onEdit(key, { literal: toOklch(value) }),
        }));
        leaf.appendChild(btn);
      } else if (key === 'text.fontFamily' || key === 'text.fontWeight') {
        const sel = document.createElement('select');
        const options = key === 'text.fontWeight' ? FONT_WEIGHTS : FONT_FAMILIES;
        for (const o of options) {
          const opt = document.createElement('option');
          opt.value = o;
          opt.textContent = o;
          sel.appendChild(opt);
        }
        if (current && 'literal' in current) sel.value = String(current.literal);
        sel.addEventListener('change', () => opts.onEdit(key, { literal: sel.value }));
        leaf.appendChild(sel);
      } else {
        const input = document.createElement('input');
        input.type = 'text';
        if (current && 'literal' in current && typeof current.literal === 'string') {
          input.value = current.literal;
        }
        input.addEventListener('input', () => opts.onEdit(key, { literal: input.value }));
        leaf.appendChild(input);
      }

      host.appendChild(leaf);
    }
  }

  if (opts.onScopedBlockChange) {
    const branch = document.createElement('div');
    branch.className = 'stb-facet-group';
    branch.textContent = 'Scoped CSS';
    host.appendChild(branch);
    const editorHost = document.createElement('div');
    host.appendChild(editorHost);
    scoped = mountCssEditor(editorHost, opts.scopedBlock ?? '', opts.onScopedBlockChange);
  }

  return { destroy() { scoped?.destroy(); host.innerHTML = ''; } };
}
