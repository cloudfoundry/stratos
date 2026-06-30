import { effect } from '@preact/signals-core';
import { globalModel } from '@/state/global-branding';
import { buildPathTree, kindGlyph, type NavNode, type PathNode } from '@/navigator/column-model';
import { oklchToHex, type Oklch } from '@/color/oklch';

export interface ElementTreeOptions {
  onHover?: (snapshotId: string | null, scene: string | null) => void;
  onSelect?: (snapshotId: string, scene: string) => void;
}

// Label for a tree row: area name, else the node's human name, else the segment.
function label(p: PathNode): string {
  if (p.displayName) return p.displayName;
  if (p.node?.name) return p.node.name;
  return p.segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// A short value preview + optional colour swatch for a node row.
export function valuePreview(node: NavNode): { swatch?: string; text: string; kind: string } {
  const f = node.facets;
  if (f?.content) return { text: `”${f.content.text}”`, kind: 'text' };
  if (f?.asset) return { text: f.asset.ref, kind: 'image' };
  const colorFacet = f?.text?.color ?? f?.surface?.background;
  if (colorFacet && 'literal' in colorFacet && typeof colorFacet.literal === 'object') {
    const hex = oklchToHex(colorFacet.literal as Oklch);
    return { swatch: hex, text: hex, kind: 'color' };
  }
  return { text: '', kind: '' };
}

export function mountElementTree(host: HTMLElement, opts: ElementTreeOptions = {}): void {
  host.classList.add('stb-tree');

  function renderNode(parent: HTMLElement, p: PathNode, depth: number): void {
    const row = document.createElement('div');
    row.className = 'stb-tree-row';
    row.style.paddingLeft = `${0.25 + depth * 0.9}rem`;
    const n = p.node;
    if (n) {
      row.dataset.snapshotId = n.snapshotId;
      if (n.description) row.title = n.description;
    }

    const vp = n ? valuePreview(n) : { text: '', kind: '' };
    const swatch = document.createElement('span');
    swatch.className = 'stb-tree-swatch';
    if (vp.swatch) swatch.style.backgroundColor = vp.swatch;
    else { swatch.classList.add('stb-tree-swatch-kind'); swatch.textContent = vp.kind === 'image' ? '🖼' : vp.kind === 'text' ? 'T' : p.children.size ? '▸' : '·'; }

    const name = document.createElement('span');
    name.className = 'stb-tree-name';
    name.textContent = label(p);

    const value = document.createElement('span');
    value.className = 'stb-tree-val';
    value.textContent = vp.text;

    row.append(swatch, name, value);
    const kg = kindGlyph(n?.roledescription);
    if (kg) {
      const kindEl = document.createElement('span');
      kindEl.className = 'stb-col-kind';
      kindEl.textContent = kg;
      kindEl.title = n!.roledescription!;
      row.appendChild(kindEl);
    }

    if (n) {
      row.addEventListener('mouseenter', () => opts.onHover?.(n.snapshotId, n.scene));
      row.addEventListener('mouseleave', () => opts.onHover?.(null, null));
      row.addEventListener('click', () => opts.onSelect?.(n.snapshotId, n.scene));
    }
    parent.appendChild(row);

    for (const child of p.children.values()) renderNode(parent, child, depth + 1);
  }

  function render(): void {
    const model = globalModel.value;
    host.innerHTML = '';
    if (!model || model.nodes.length === 0) {
      host.innerHTML = '<p class="stb-tree-empty">No elements modelled yet</p>';
      return;
    }

    // Reuse the columns' scene-rooted path tree so nesting matches the navigator.
    const root = buildPathTree(model.nodes, model.sceneNames);
    for (const area of root.children.values()) {
      const section = document.createElement('section');
      section.className = 'stb-tree-area';
      const areaName = document.createElement('h2');
      areaName.className = 'stb-tree-area-name';
      areaName.textContent = label(area);
      section.appendChild(areaName);
      for (const child of area.children.values()) renderNode(section, child, 0);
      host.appendChild(section);
    }
  }

  effect(() => { void globalModel.value; render(); });
}
