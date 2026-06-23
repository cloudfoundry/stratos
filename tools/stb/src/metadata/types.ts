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
  snapshotId: string;          // primary anchor (data-stratos-snapshot-id value)
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

export type CuratedDescriptions = Record<string, string>;  // snapshotId -> text
