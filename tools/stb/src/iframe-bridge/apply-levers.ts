export interface LeverPatch {
  snapshotId: string;
  kind: 'content' | 'asset' | 'visibility';
  text?: string;
  ref?: string;
  shown?: boolean;
  blob?: Blob;
}

export function applyLevers(doc: Document, levers: LeverPatch[]): void {
  for (const p of levers) {
    if (p.kind === 'visibility') {
      // a show-<x> lever toggles the element whose snapshotId is the parent area + <x>
      const targetId = p.snapshotId.replace(/\.show-/, '.');
      const el = doc.querySelector<HTMLElement>(`[stb-snapshot-id="${targetId}"]`);
      if (el) el.style.display = p.shown ? '' : 'none';
      continue;
    }
    const el = doc.querySelector<HTMLElement>(`[stb-snapshot-id="${p.snapshotId}"]`);
    if (!el) continue;
    if (p.kind === 'content' && p.text !== undefined) el.textContent = p.text;
    if (p.kind === 'asset') {
      const src = p.blob ? URL.createObjectURL(p.blob) : p.ref; // NOTE: object URL not revoked; revoke-prev if preview leaks
      if (src === undefined) continue;
      if (el instanceof HTMLImageElement) el.setAttribute('src', src);
      else el.style.backgroundImage = `url(${src})`;
    }
  }
}
