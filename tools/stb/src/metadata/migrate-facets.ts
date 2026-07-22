// One-shot fixture/migration tooling. Models load pre-migrated committed JSON,
// so this module has no production callers by design — do NOT wire it into any
// runtime loader; it exists to convert legacy fixtures once, by hand, offline.
import type { Facets, FacetValue, Sides, GapTuple, BackgroundFacet } from '@/metadata/types';

const isFacetValue = (v: unknown): v is FacetValue =>
  !!v && typeof v === 'object' && ('token' in (v as object) || 'literal' in (v as object));

const allSides = (v: FacetValue): Sides => ({ top: v, right: v, bottom: v, left: v });

/** Migrate a legacy flat facet bundle to the composite shapes. Idempotent:
 *  already-composite values pass through untouched. */
export function migrateFacets(legacy: unknown, isImageElement: boolean): Facets {
  const src = (legacy ?? {}) as Record<string, any>;
  const out: Facets = {};

  if (src.content) out.content = src.content;

  // background composite starts from any existing composite, then absorbs legacy sources
  const bg: { color?: FacetValue; layers?: any[] } = { ...(src.background ?? {}) };

  // legacy surface.background color → background.color
  const surface = { ...(src.surface ?? {}) };
  if (isFacetValue(surface.background)) { bg.color ??= surface.background; delete surface.background; }
  if (Object.keys(surface).length) out.surface = surface;

  // asset: <img> src stays; background-use becomes an image layer
  if (src.asset?.ref) {
    if (isImageElement) out.asset = src.asset;
    else bg.layers = [...(bg.layers ?? []), { kind: 'image', ref: src.asset.ref }];
  }
  if (bg.color !== undefined || bg.layers !== undefined) out.background = bg as BackgroundFacet;

  // text.fontFamily single → one-entry list
  if (src.text) {
    const text = { ...src.text };
    if (isFacetValue(text.fontFamily)) text.fontFamily = [text.fontFamily];
    out.text = text;
  }

  // spacing single values → tuples
  if (src.spacing) {
    const sp = { ...src.spacing };
    if (isFacetValue(sp.padding)) sp.padding = allSides(sp.padding);
    if (isFacetValue(sp.margin))  sp.margin  = allSides(sp.margin);
    if (isFacetValue(sp.gap))     sp.gap     = { row: sp.gap, column: sp.gap } as GapTuple;
    out.spacing = sp;
  }
  return out;
}
