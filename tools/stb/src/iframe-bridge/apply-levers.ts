export interface LeverPatch {
  snapshotId: string;
  kind: 'content' | 'asset' | 'visibility';
  text?: string;
  ref?: string;
  shown?: boolean;
}

export function applyLevers(doc: Document, levers: LeverPatch[]): void {
  for (const p of levers) {
    if (p.kind === 'visibility') {
      // a show-<x> lever toggles the element whose snapshotId is the parent area + <x>
      const targetId = p.snapshotId.replace(/\.show-/, '.');
      const el = doc.querySelector<HTMLElement>(`[data-stratos-snapshot-id="${targetId}"]`);
      if (el) el.style.display = p.shown ? '' : 'none';
      continue;
    }
    const el = doc.querySelector<HTMLElement>(`[data-stratos-snapshot-id="${p.snapshotId}"]`);
    if (!el) continue;
    if (p.kind === 'content' && p.text !== undefined) el.textContent = p.text;
    if (p.kind === 'asset' && p.ref !== undefined) {
      if (el instanceof HTMLImageElement) el.setAttribute('src', p.ref);
      else el.style.backgroundImage = `url(${p.ref})`;
    }
  }
}
