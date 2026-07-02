export interface LeverPatch {
  snapshotId: string;
  kind: 'content' | 'asset' | 'visibility' | 'background';
  text?: string;
  ref?: string;
  shown?: boolean;
  blob?: Blob;
  backgroundColor?: string;
  backgroundImage?: string;
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
    if (p.kind === 'background') {
      // A background patch owns BOTH inline props: an absent component clears the
      // previous inline value (removing the last layer must drop the stale image).
      // When no background patch is sent at all (e.g. dark preview with no dark
      // override), this branch never runs — scoped blocks / dark CSS keep owning it.
      el.style.backgroundColor = p.backgroundColor ?? '';
      el.style.backgroundImage = p.backgroundImage ?? '';
    }
  }
}
