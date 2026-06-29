import type { Oklch } from '@/color/oklch';

export type LeverKind = 'color' | 'content' | 'asset';

export type LeverValue =
  | { kind: 'color'; oklch: Oklch }
  | { kind: 'content'; text: string }
  | { kind: 'asset'; ref: string };

// Raw element-scoped CSS declaration body — the R1 facet escape hatch.
// Emitted as `[stb-snapshot-id="…"] { <ScopedBlock> }`.
export type ScopedBlock = string;

export interface ElementNode {
  snapshotId: string;
  role: string;            // ARIA role (DOM stba-role) — projects to `role`
  roledescription?: string; // ARIA aria-roledescription (DOM stba-roledescription); the navigator "kind" (page/dialog/stepper/…)
  name: string | null;
  description: string;     // DOM stba-description → ARIA aria-description
  value: LeverValue;
  visibility?: boolean;    // optional show/hide on THIS element; undefined = shown
  scopedBlock?: ScopedBlock; // optional raw element-scoped CSS (R1 facet escape hatch)
}

export interface BrandingModel {
  scene: string;
  nodes: ElementNode[];
}

export function isColorNode(
  n: ElementNode,
): n is ElementNode & { value: { kind: 'color'; oklch: Oklch } } {
  return n.value.kind === 'color';
}
