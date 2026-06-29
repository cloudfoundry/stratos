import { effect } from '@preact/signals-core';
import { globalModel } from '@/state/global-branding';
import { commonPrefixLen, kindGlyph, type NavNode } from '@/navigator/column-model';
import { oklchToHex } from '@/color/oklch';

export interface ElementTreeOptions {
  onHover?: (snapshotId: string | null, scene: string | null) => void;
  onSelect?: (snapshotId: string, scene: string) => void;
}

// Friendly label for a node: its human name, else the last id segment.
function leafLabel(node: NavNode): string {
  if (node.name) return node.name;
  return node.snapshotId.split('.').pop() || node.snapshotId;
}

// A short value preview + optional colour swatch for the row.
function valuePreview(node: NavNode): { swatch?: string; text: string; kind: string } {
  const v = node.value;
  if (v.kind === 'color') { const hex = oklchToHex(v.oklch); return { swatch: hex, text: hex, kind: 'color' }; }
  if (v.kind === 'content') return { text: `“${v.text}”`, kind: 'text' };
  if (v.kind === 'asset') return { text: v.ref, kind: 'image' };
  return { text: '', kind: '' };
}

export function mountElementTree(host: HTMLElement, opts: ElementTreeOptions = {}): void {
  host.classList.add('stb-tree');

  function render(): void {
    const model = globalModel.value;
    host.innerHTML = '';
    if (!model || model.nodes.length === 0) {
      host.innerHTML = '<p class="stb-tree-empty">No elements modelled yet</p>';
      return;
    }

    // Group by scene (area), like the columns navigator, so every scene shows.
    const byScene = new Map<string, NavNode[]>();
    for (const n of model.nodes) {
      (byScene.get(n.scene) ?? byScene.set(n.scene, []).get(n.scene)!).push(n);
    }

    for (const [scene, sceneNodes] of byScene) {
      const area = document.createElement('section');
      area.className = 'stb-tree-area';
      const areaName = document.createElement('h2');
      areaName.className = 'stb-tree-area-name';
      areaName.textContent = model.sceneNames[scene] ?? scene;
      area.appendChild(areaName);

      // Strip the scene's shared prefix so container labels read cleanly.
      const prefixLen = commonPrefixLen(sceneNodes.map((n) => n.snapshotId));
      const groups = new Map<string, NavNode[]>();
      for (const n of sceneNodes) {
        const container = n.snapshotId.split('.').slice(prefixLen, -1).join(' › ');
        (groups.get(container) ?? groups.set(container, []).get(container)!).push(n);
      }

      for (const [container, nodes] of groups) {
        if (container) {
          const heading = document.createElement('h3');
          heading.className = 'stb-tree-group-name';
          heading.textContent = container;
          area.appendChild(heading);
        }
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
          const kg = kindGlyph(n.containerKind);
          if (kg) {
            const kindEl = document.createElement('span');
            kindEl.className = 'stb-col-kind';
            kindEl.textContent = kg;
            kindEl.title = n.containerKind!;
            row.appendChild(kindEl);
          }

          row.addEventListener('mouseenter', () => opts.onHover?.(n.snapshotId, n.scene));
          row.addEventListener('mouseleave', () => opts.onHover?.(null, null));
          row.addEventListener('click', () => opts.onSelect?.(n.snapshotId, n.scene));
          area.appendChild(row);
        }
      }
      host.appendChild(area);
    }
  }

  effect(() => { void globalModel.value; render(); });
}
