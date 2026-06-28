import { effect } from '@preact/signals-core';
import { brandingModel } from '@/state/branding';
import { oklchToHex } from '@/color/oklch';
import type { ElementNode } from '@/metadata/types';

export interface ElementTreeOptions {
  onHover?: (snapshotId: string | null) => void;
  onSelect?: (snapshotId: string) => void;
}

// Friendly label for a node: its human name, else the last id segment.
function leafLabel(node: ElementNode): string {
  if (node.name) return node.name;
  return node.snapshotId.split('.').pop() || node.snapshotId;
}

// A short value preview + optional colour swatch for the row.
function valuePreview(node: ElementNode): { swatch?: string; text: string; kind: string } {
  const v = node.value;
  if (v.kind === 'color') { const hex = oklchToHex(v.oklch); return { swatch: hex, text: hex, kind: 'color' }; }
  if (v.kind === 'content') return { text: `“${v.text}”`, kind: 'text' };
  if (v.kind === 'asset') return { text: v.ref, kind: 'image' };
  return { text: '', kind: '' };
}

export function mountElementTree(host: HTMLElement, opts: ElementTreeOptions = {}): void {
  host.classList.add('stb-tree');

  function render(): void {
    const model = brandingModel.value;
    host.innerHTML = '';
    if (!model || model.nodes.length === 0) {
      host.innerHTML = '<p class="stb-tree-empty">No elements in this scene</p>';
      return;
    }

    // Group nodes by their container path (all id segments but the last).
    const groups = new Map<string, ElementNode[]>();
    for (const n of model.nodes) {
      const container = n.snapshotId.split('.').slice(0, -1).join(' › ');
      (groups.get(container) ?? groups.set(container, []).get(container)!).push(n);
    }

    for (const [container, nodes] of groups) {
      const group = document.createElement('section');
      group.className = 'stb-tree-group';
      const heading = document.createElement('h3');
      heading.className = 'stb-tree-group-name';
      heading.textContent = container;
      group.appendChild(heading);

      for (const n of nodes) {
        const vp = valuePreview(n);
        const row = document.createElement('div');
        row.className = 'stb-tree-row';
        row.dataset.snapshotId = n.snapshotId;
        if (n.description) row.title = n.description;

        const swatch = document.createElement('span');
        swatch.className = 'stb-tree-swatch';
        if (vp.swatch) swatch.style.backgroundColor = vp.swatch;
        else { swatch.classList.add('stb-tree-swatch-kind'); swatch.textContent = vp.kind === 'image' ? '🖼' : vp.kind === 'text' ? 'T' : '·'; }

        const name = document.createElement('span');
        name.className = 'stb-tree-name';
        name.textContent = leafLabel(n);

        const value = document.createElement('span');
        value.className = 'stb-tree-val';
        value.textContent = vp.text;

        row.append(swatch, name, value);
        row.addEventListener('mouseenter', () => opts.onHover?.(n.snapshotId));
        row.addEventListener('mouseleave', () => opts.onHover?.(null));
        row.addEventListener('click', () => opts.onSelect?.(n.snapshotId));
        group.appendChild(row);
      }
      host.appendChild(group);
    }
  }

  effect(() => { void brandingModel.value; render(); });
}
