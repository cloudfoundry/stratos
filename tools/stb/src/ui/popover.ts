// Place a floating editor popover consistently, independent of which view
// (Tree / Columns / Tokens) opened it. Centred vertically + horizontally in the
// empty gutter to the LEFT of the centred preview. When that gutter is too
// narrow — a small window now, or multiple comparison tiles filling the width
// later — it falls back to overlaying the preview, horizontally centred. One
// rule, two triggers. See design §2.4a (A) Location.
export function positionInPreviewGutter(panel: HTMLElement, previewHost: HTMLElement): void {
  const host = previewHost.getBoundingClientRect();
  const pw = panel.offsetWidth;
  const ph = panel.offsetHeight;
  // The preview card sits centred in the host; approximate its width so we can
  // find the left gutter. (Approximation per the plan — tighten against the real
  // card rect if it ever looks off.)
  const cardW = Math.min(480, host.width * 0.5);
  const gutter = (host.width - cardW) / 2;
  const overlay = gutter < pw + 24; // gutter too tight → overlay, h-centred
  const left = overlay ? host.left + (host.width - pw) / 2 : host.left + (gutter - pw) / 2;
  const top = host.top + (host.height - ph) / 2;
  panel.style.position = 'absolute';
  panel.style.left = `${Math.max(8, left) + window.scrollX}px`;
  panel.style.top = `${Math.max(8, top) + window.scrollY}px`;
}

// Compare-mode placement, shared by every popover that opens over the preview
// (lever editor, color picker, …). With two panes splitting the full preview
// width there is NO left gutter at typical widths — positionInPreviewGutter
// would fall back to overlaying the light pane dead-centre. So the popover
// opens ABOVE the panes (over the nav band, left-aligned) instead: "left of
// the panes" (the primary choice) degenerates to covering a pane, so the
// fallback position won. Still draggable, as always.
export function positionAbovePanes(panel: HTMLElement, previewHost: HTMLElement): void {
  const host = previewHost.getBoundingClientRect();
  const top = Math.max(8, host.top - panel.offsetHeight - 8);
  panel.style.position = 'absolute';
  panel.style.left = `${8 + window.scrollX}px`;
  panel.style.top = `${top + window.scrollY}px`;
}

// Let the user drag the popover by a handle, overriding the auto-placement.
// Position stays clamped to the viewport so it can't be dragged off-screen.
export function makeDraggable(panel: HTMLElement, handle: HTMLElement): void {
  handle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const rect = panel.getBoundingClientRect();
    const dx = e.clientX - rect.left;
    const dy = e.clientY - rect.top;
    const onMove = (ev: MouseEvent) => {
      const left = Math.min(Math.max(0, ev.clientX - dx), window.innerWidth - panel.offsetWidth);
      const top = Math.min(Math.max(0, ev.clientY - dy), window.innerHeight - panel.offsetHeight);
      panel.style.left = `${left + window.scrollX}px`;
      panel.style.top = `${top + window.scrollY}px`;
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  });
}
