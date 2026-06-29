import type { Oklch } from '@/color/oklch';

export interface Locator {
  role: string;
  name: string | null;
}

export interface TokenRole {
  name: string;        // CSS custom property, e.g. '--color-brand-500'
  property?: string;   // 'background-color', 'border-color:hover', etc. (optional in Tranche 0)
}

export type CuratedRef = { ref: string };

export interface ElementMapping {
  selector: string;            // fallback anchor
  snapshotId: string;          // primary anchor (stb-snapshot-id value)
  tokens: TokenRole[];
  locator?: Locator;           // harvested live (Component 1); may be absent
  description?: string | CuratedRef;  // curated: inline text or pointer
}

export interface SceneMetadata {
  version: 2;
  id: string;
  name: string;
  mappings: ElementMapping[];
}

export type CuratedDescriptions = Record<string, string>;  // ref key (a shared snapshotId) -> description text

export type LeverKind = 'color' | 'content' | 'asset';

export type LeverValue =
  | { kind: 'color'; oklch: Oklch }
  | { kind: 'content'; text: string }
  | { kind: 'asset'; ref: string };

export interface ElementNode {
  snapshotId: string;
  role: string;
  name: string | null;
  description: string;
  value: LeverValue;
  visibility?: boolean; // optional show/hide on THIS element; undefined = shown
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
