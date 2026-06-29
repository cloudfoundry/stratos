import { effect, signal } from '@preact/signals-core';
import { globalModel } from '@/state/global-branding';
import { oklchToHex } from '@/color/oklch';
import {
  buildPathTree,
  computeColumns,
  push,
  truncate,
  jumpTo as jumpToPath,
  type PathNode,
} from '@/navigator/column-model';

// Miller columns (Finder-style left→right drilldown) over the GLOBAL branding
// aggregate (all scenes merged by snapshotId prefix), with collapse-to-rail.
// Tree/column logic is now delegated to the pure tested model in
// @/navigator/column-model; this module handles only DOM rendering.

export interface ElementColumnsOptions {
  onHover?: (snapshotId: string | null, scene: string | null) => void;
  onSelect?: (snapshotId: string, scene: string) => void;
}

function label(p: PathNode): string {
  if (p.node?.name) return p.node.name;
  // intermediate segment → Title Case the raw segment
  return p.segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function swatchFor(p: PathNode): { color?: string; glyph?: string } {
  const v = p.node?.value;
  if (!v) return { glyph: '▸' };
  if (v.kind === 'color') return { color: oklchToHex(v.oklch) };
  if (v.kind === 'asset') return { glyph: '🖼' };
  if (v.kind === 'content') return { glyph: 'T' };
  return { glyph: '·' };
}

export interface ElementColumnsApi {
  // jump the navigator to a node's full path (bidirectional select / who-uses-me /
  // chip click). R1: this sets a *real* walk-back-able path, not an out-of-band jump.
  jumpTo(snapshotId: string): void;
}

export function mountElementColumns(host: HTMLElement, opts: ElementColumnsOptions = {}): ElementColumnsApi {
  host.classList.add('stb-cols');
  // selected path = the chain of segments the user has drilled into
  const path = signal<string[]>([]);

  function render(): void {
    const model = globalModel.value;
    host.innerHTML = '';
    if (!model || model.nodes.length === 0) {
      host.innerHTML = '<p class="stb-tree-empty">No elements modelled yet</p>';
      return;
    }

    const root = buildPathTree(model.nodes);
    const sel = path.value;
    const columns = computeColumns(root, sel);

    columns.forEach((col, i) => {
      if (col.collapsed) {
        // rail: a thin strip showing the chosen child, click to re-expand here
        const rail = document.createElement('div');
        rail.className = 'stb-col-rail';
        const chosen = col.activeSeg ? col.parent.children.get(col.activeSeg) : undefined;
        rail.textContent = chosen ? label(chosen) : col.parent.segment || 'root';
        rail.title = 'Back to this level';
        rail.addEventListener('click', () => { path.value = truncate(sel, i); });
        host.appendChild(rail);
        return;
      }

      const colEl = document.createElement('div');
      colEl.className = 'stb-col';
      for (const child of col.parent.children.values()) {
        const sw = swatchFor(child);
        const row = document.createElement('div');
        row.className = 'stb-col-row';
        if (child.segment === col.activeSeg) row.classList.add('active');
        if (child.node?.description) row.title = child.node.description;

        const swEl = document.createElement('span');
        swEl.className = 'stb-col-swatch';
        if (sw.color) swEl.style.backgroundColor = sw.color;
        else { swEl.classList.add('stb-col-swatch-glyph'); swEl.textContent = sw.glyph ?? '·'; }

        const nameEl = document.createElement('span');
        nameEl.className = 'stb-col-name';
        nameEl.textContent = label(child);

        row.append(swEl, nameEl);
        if (child.children.size > 0) {
          const caret = document.createElement('span');
          caret.className = 'stb-col-caret';
          caret.textContent = '›';
          row.appendChild(caret);
        }

        row.addEventListener('mouseenter', () => opts.onHover?.(child.node?.snapshotId ?? null, child.node?.scene ?? null));
        row.addEventListener('mouseleave', () => opts.onHover?.(null, null));
        row.addEventListener('click', () => {
          path.value = push(sel.slice(0, i), child.segment);
          if (child.node) opts.onSelect?.(child.node.snapshotId, child.node.scene);
        });
        colEl.appendChild(row);
      }
      host.appendChild(colEl);
    });

    // breadcrumb under the columns (R1 readout aid; also the count for R3)
    const crumb = document.createElement('div');
    crumb.className = 'stb-col-crumb';
    crumb.textContent = `${columns.length} column(s)` + (sel.length ? `  ·  ${sel.join(' › ')}` : '');
    host.appendChild(crumb);
  }

  effect(() => { void globalModel.value; void path.value; render(); });

  return { jumpTo(snapshotId) { path.value = jumpToPath(snapshotId); } };
}
