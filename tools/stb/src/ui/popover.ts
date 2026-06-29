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
