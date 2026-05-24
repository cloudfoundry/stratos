import { emitCss } from '@/parse/css-emitter';

export interface AssetInput {
  path: string;
  blob: Blob;
}

export interface BuildBundleInput {
  name: string;
  id: string;
  description: string;
  root: Map<string, string>;
  dark: Map<string, string>;
  assets: AssetInput[];
}

export interface Bundle {
  files: Record<string, string>;
  assetBlobs: Map<string, Blob>;
}

export function buildBundle(input: BuildBundleInput): Bundle {
  const files: Record<string, string> = {};
  files['preset.json'] = JSON.stringify(
    {
      name: input.name,
      id: input.id,
      description: input.description,
      thumbnail: null,
    },
    null,
    2,
  );
  files['theme.css'] = emitCss(input.root, input.dark);
  const assetBlobs = new Map<string, Blob>();
  for (const a of input.assets) assetBlobs.set(a.path, a.blob);
  return { files, assetBlobs };
}
