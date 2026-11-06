import JSZip from 'jszip';
import type { Bundle } from '@/export/bundle-builder';

export async function bundleToZip(bundle: Bundle): Promise<Blob> {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(bundle.files)) zip.file(path, content);
  for (const [path, blob] of bundle.assetBlobs) zip.file(path, blob);
  return zip.generateAsync({ type: 'blob' });
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
