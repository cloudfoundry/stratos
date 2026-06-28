import { effect, signal } from '@preact/signals-core';
import { globalModel, type GlobalModel, type GlobalNode } from '@/state/global-branding';
import { oklchToHex } from '@/color/oklch';

// R3 PROTOTYPE — Miller columns (Finder-style left→right drilldown) over the
// GLOBAL branding aggregate (all scenes merged by their snapshotId prefix), with
// collapse-to-rail. Purpose: measure how many columns fit a normal window before
// horizontal-scroll pain, and prove the rail/breadcrumb mechanic. Throwaway: no
// tests, lives beside element-tree.

export interface ElementColumnsOptions {
  onHover?: (snapshotId: string | null, scene: string | null) => void;
  onSelect?: (snapshotId: string, scene: string) => void;
}

// A node in the path tree built from dot-delimited snapshotIds.
interface PathNode {
  segment: string;
  fullPath: string;            // dot path from root to here
  node?: GlobalNode;           // set when this path is an actual leaf element
  children: Map<string, PathNode>;
}

function buildTree(model: GlobalModel): PathNode {
  const root: PathNode = { segment: '', fullPath: '', children: new Map() };
  for (const n of model.nodes) {
    const segs = n.snapshotId.split('.');
    let cur = root;
    let path = '';
    for (const seg of segs) {
      path = path ? `${path}.${seg}` : seg;
      let child = cur.children.get(seg);
      if (!child) { child = { segment: seg, fullPath: path, children: new Map() }; cur.children.set(seg, child); }
      cur = child;
    }
    cur.node = n; // attach the element at its leaf path
  }
  return root;
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

export function mountElementColumns(host: HTMLElement, opts: ElementColumnsOptions = {}): void {
  host.classList.add('stb-cols');
  // selected path = the chain of segments the user has drilled into
  const path = signal<string[]>([]);

  function nodeAt(root: PathNode, segs: string[]): PathNode | null {
    let cur: PathNode | undefined = root;
    for (const s of segs) { cur = cur?.children.get(s); if (!cur) return null; }
    return cur ?? null;
  }

  function render(): void {
    const model = globalModel.value;
    host.innerHTML = '';
    if (!model || model.nodes.length === 0) {
      host.innerHTML = '<p class="stb-tree-empty">No elements in this scene</p>';
      return;
    }
    const root = buildTree(model);
    const sel = path.value;

    // Columns: column 0 = roots; column k = children of sel[0..k-1].
    // Render one column per drilled level, plus one more showing the children
    // of the deepest selection (if it has any).
    const columns: { parent: PathNode; activeSeg: string | null }[] = [];
    columns.push({ parent: root, activeSeg: sel[0] ?? null });
    for (let k = 0; k < sel.length; k++) {
      const parent = nodeAt(root, sel.slice(0, k + 1));
      if (!parent || parent.children.size === 0) break; // leaf — no further column
      columns.push({ parent, activeSeg: sel[k + 1] ?? null });
    }

    // Collapse rule: keep the last two columns full-width; everything left = rail.
    const fullFrom = Math.max(0, columns.length - 2);

    columns.forEach((col, i) => {
      if (i < fullFrom) {
        // rail: a thin strip showing the chosen child, click to re-expand here
        const rail = document.createElement('div');
        rail.className = 'stb-col-rail';
        const chosen = col.activeSeg ? col.parent.children.get(col.activeSeg) : undefined;
        rail.textContent = chosen ? label(chosen) : col.parent.segment || 'root';
        rail.title = 'Back to this level';
        rail.addEventListener('click', () => { path.value = sel.slice(0, i); });
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

        const childSegs = [...sel.slice(0, i), child.segment];
        row.addEventListener('mouseenter', () => opts.onHover?.(child.node?.snapshotId ?? null, child.node?.scene ?? null));
        row.addEventListener('mouseleave', () => opts.onHover?.(null, null));
        row.addEventListener('click', () => {
          path.value = childSegs;               // drill (opens next column or marks leaf)
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
}
