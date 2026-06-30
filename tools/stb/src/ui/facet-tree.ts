// src/ui/facet-tree.ts  (render-only; controls added in Task 3)
import type { Facets, FacetValue } from '@/metadata/types';
import { FACET_PROPS } from '@/metadata/facets';
import { mountCssEditor } from '@/ui/css-editor';

const GROUPS = ['text', 'surface', 'spacing'] as const;
const propsOf = (g: string) => Object.entries(FACET_PROPS).filter(([k]) => k.startsWith(g + '.'));

export interface FacetTreeOptions {
  facets: Facets;
  onEdit: (key: string, value: FacetValue) => void;
  scopedBlock?: string;
  onScopedBlockChange?: (css: string) => void;
}

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
      // Task 3 appends the control here.
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
