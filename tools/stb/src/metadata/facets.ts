import type { Facets, FacetValue, LeverValue } from '@/metadata/types';
import { oklchToHex, type Oklch } from '@/color/oklch';

export interface FacetPropSpec { cssProp: string; isColor: boolean; }

export const FACET_PROPS: Record<string, FacetPropSpec> = {
  'text.color':           { cssProp: 'color',         isColor: true  },
  'text.fontFamily':      { cssProp: 'font-family',   isColor: false },
  'text.fontSize':        { cssProp: 'font-size',     isColor: false },
  'text.fontWeight':      { cssProp: 'font-weight',   isColor: false },
  'text.lineHeight':      { cssProp: 'line-height',   isColor: false },
  'surface.background':   { cssProp: 'background',     isColor: true  },
  'surface.border':       { cssProp: 'border',         isColor: false },
  'surface.borderRadius': { cssProp: 'border-radius',  isColor: false },
  'spacing.padding':      { cssProp: 'padding',        isColor: false },
  'spacing.margin':       { cssProp: 'margin',         isColor: false },
  'spacing.gap':          { cssProp: 'gap',            isColor: false },
};

const STYLE_GROUPS = ['text', 'surface', 'spacing'] as const;

export function* facetDeclarations(
  facets: Facets,
): Generator<{ key: string; spec: FacetPropSpec; value: FacetValue }> {
  for (const group of STYLE_GROUPS) {
    const g = facets[group];
    if (!g) continue;
    for (const [prop, value] of Object.entries(g)) {
      if (value === undefined) continue;
      const key = `${group}.${prop}`;
      const spec = FACET_PROPS[key];
      if (spec) yield { key, spec, value: value as FacetValue };
    }
  }
}

export function facetLiteralCss(spec: FacetPropSpec, v: FacetValue): string | null {
  if ('token' in v) return null;
  return spec.isColor ? oklchToHex(v.literal as Oklch) : String(v.literal);
}

export interface ContentAssetDeclaration { key: 'content' | 'asset'; value: string; }

/** Yield content/asset facet declarations for property-level routing. */
export function* contentAssetDeclarations(
  facets: Facets,
): Generator<ContentAssetDeclaration> {
  if (facets.content) yield { key: 'content', value: facets.content.text };
  if (facets.asset) yield { key: 'asset', value: facets.asset.ref };
}

/** Derive the Phase-1 single LeverValue from a Facets bundle.
 *  Priority: content > asset > text.color > surface.background > fallback black. */
export function primaryValue(f: Facets): LeverValue {
  if (f.content) return { kind: 'content', text: f.content.text };
  if (f.asset) return { kind: 'asset', ref: f.asset.ref };
  const color = f.text?.color ?? f.surface?.background;
  if (color && 'literal' in color && typeof color.literal === 'object') {
    return { kind: 'color', oklch: color.literal as Oklch };
  }
  return { kind: 'color', oklch: { l: 0, c: 0, h: 0 } };
}
