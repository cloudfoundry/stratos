import type { Oklch } from '@/color/oklch';

export type LeverKind = 'color' | 'content' | 'asset';

// Content text format: 'plain' (default, absent = plain, rendered via textContent)
// or 'subset' (closed-grammar formatting — see src/content/subset-format.ts).
export type ContentFormat = 'plain' | 'subset';

export type LeverValue =
  | { kind: 'color'; oklch: Oklch }
  | { kind: 'content'; text: string; format?: ContentFormat }
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
  facets: Facets;
  facetsDark?: Facets;     // optional parallel dark-mode overrides (emitter writes a .dark-theme block)
  visibility?: boolean;    // optional show/hide on THIS element; undefined = shown
  scopedBlock?: ScopedBlock; // optional raw element-scoped CSS (R1 facet escape hatch)
}

export interface BrandingModel {
  scene: string;
  nodes: ElementNode[];
}

export type FacetValue = { token: string } | { literal: Oklch | string };

// --- kind 1: ordered comma-list ---
export type ColorStop = { color: FacetValue; position?: string };
export type Gradient =
  | { type: 'linear'; repeating?: boolean; angle?: string; stops: ColorStop[] }
  | { type: 'radial'; repeating?: boolean; shape?: 'circle' | 'ellipse'; size?: string; position?: string; stops: ColorStop[] }
  | { type: 'conic';  repeating?: boolean; fromAngle?: string; position?: string; stops: ColorStop[] };
export type Layer =
  | { kind: 'image';    ref: string }
  | { kind: 'gradient'; gradient: Gradient };
export interface BackgroundFacet { color?: FacetValue; layers?: Layer[]; }

// --- kind 2: positional tuple ---
export interface Sides { top?: FacetValue; right?: FacetValue; bottom?: FacetValue; left?: FacetValue; }
export interface GapTuple { row?: FacetValue; column?: FacetValue; }

// --- groups ---
export interface TextFacet { color?: FacetValue; fontFamily?: FacetValue[]; fontSize?: FacetValue; fontWeight?: FacetValue; lineHeight?: FacetValue; }
export interface SurfaceFacet { border?: FacetValue; borderRadius?: FacetValue; }
export interface SpacingFacet { padding?: Sides; margin?: Sides; gap?: GapTuple; }

export interface Facets {
  content?: { text: string; format?: ContentFormat };
  asset?: { ref: string };
  background?: BackgroundFacet;
  text?: TextFacet;
  surface?: SurfaceFacet;
  spacing?: SpacingFacet;
}
