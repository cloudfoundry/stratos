import type { Facets, FacetValue, BackgroundFacet, Gradient, ColorStop, Layer, SpacingFacet } from '@/metadata/types';
import { oklchToHex, type Oklch } from '@/color/oklch';

export interface FacetPropSpec { cssProp: string; isColor: boolean; }

export const FACET_PROPS: Record<string, FacetPropSpec> = {
  'text.color':           { cssProp: 'color',         isColor: true  },
  'text.fontSize':        { cssProp: 'font-size',     isColor: false },
  'text.fontWeight':      { cssProp: 'font-weight',   isColor: false },
  'text.lineHeight':      { cssProp: 'line-height',   isColor: false },
  'surface.border':       { cssProp: 'border',         isColor: false },
  'surface.borderRadius': { cssProp: 'border-radius',  isColor: false },
  'background.color':     { cssProp: 'background-color', isColor: true },
};

const STYLE_GROUPS = ['text', 'surface', 'spacing', 'background'] as const;

/** Yield typed style groups (text/surface/spacing/background) as FacetValue + CSS spec for property-level routing.
 *  Structurally distinct from contentAssetDeclarations (plain string payloads, no FacetValue/isColor);
 *  the two generators are intentionally separate, not duplicated. */
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

// Systemic blank-value guard: a blank literal (empty/whitespace-only string) means
// "unset, emit nothing" at every emit site below. Only literal strings are ever
// "blank" — a {token} entry, or a literal Oklch color object, never is.
const isBlankLiteral = (v: FacetValue): boolean =>
  'literal' in v && typeof v.literal === 'string' && v.literal.trim() === '';

const isBlankRef = (ref: string): boolean => ref.trim() === '';

export function facetLiteralCss(spec: FacetPropSpec, v: FacetValue): string | null {
  if ('token' in v) return null;
  if (isBlankLiteral(v)) return null;
  return spec.isColor ? oklchToHex(v.literal as Oklch) : String(v.literal);
}

export interface ContentAssetDeclaration { key: 'content' | 'asset'; value: string; }

/** Yield content/asset facet declarations for property-level routing.
 *  Plain string payloads only — no FacetValue wrapper or isColor flag.
 *  Kept separate from facetDeclarations (style groups) intentionally: the two are structurally different.
 *  Topmost image from background.layers takes precedence over explicit asset.ref. */
export function* contentAssetDeclarations(
  facets: Facets,
): Generator<ContentAssetDeclaration> {
  if (facets.content) yield { key: 'content', value: facets.content.text };
  // Topmost image from background.layers takes precedence over asset (iterate backwards for topmost)
  let topmost: string | null = null;
  const layers = facets.background?.layers ?? [];
  for (let i = layers.length - 1; i >= 0; i--) {
    const l = layers[i]!;
    // A blank ref (mid-edit transient) doesn't count as "topmost" — keep
    // scanning downward instead of masking a real lower image.
    if (l.kind === 'image' && !isBlankRef(l.ref)) {
      topmost = l.ref;
      break;
    }
  }
  if (topmost) {
    yield { key: 'asset', value: topmost };
  } else if (facets.asset) {
    yield { key: 'asset', value: facets.asset.ref };
  }
}

// Tokens come in two shapes: a full custom-property name already carrying the
// `--` prefix (e.g. `--color-brand-900`), or a dotted logical name
// (e.g. `brand.500`). Emit `var(--…)` without doubling the prefix.
const tokenVar = (t: string) => `var(${t.startsWith('--') ? t : '--' + t.replace(/\./g, '-')})`;

const normalizeHex = (h: string): string => {
  const m = h.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
  return m ? `#${m[1]}${m[1]}${m[2]}${m[2]}${m[3]}${m[3]}` : h;
};

/** Leaf formatter that also handles {token} (→ var(--…)); facetLiteralCss returns null for tokens. */
export function facetValueCss(v: FacetValue, isColor: boolean): string {
  if ('token' in v) return tokenVar(v.token);
  if (isColor && typeof v.literal === 'object') {
    return oklchToHex(v.literal as Oklch);
  }
  const lit = String(v.literal);
  return isColor ? normalizeHex(lit) : lit;
}

/** Font-family fallback list (composite kind 1: ordered comma-list, non-color leaves).
 *  Blank literal entries are skipped (no dangling commas); null if nothing is left to emit. */
export function fontFamilyCss(list: FacetValue[]): string | null {
  const parts = list.filter((v) => !isBlankLiteral(v)).map((v) => facetValueCss(v, false));
  return parts.length ? `font-family: ${parts.join(', ')};` : null;
}

const SIDE_ORDER = ['top', 'right', 'bottom', 'left'] as const;

/** Spacing composite (kind 2: positional tuple): per-side padding/margin longhands
 *  plus row/column-gap, for whichever slots are set. Non-color leaves, so
 *  facetValueCss is always called with isColor=false, same as fontFamilyCss. */
export function spacingDeclarations(sp: SpacingFacet): string[] {
  const out: string[] = [];
  for (const group of ['padding', 'margin'] as const) {
    const t = sp[group];
    if (!t) continue;
    for (const side of SIDE_ORDER) {
      const v = t[side];
      if (v && !isBlankLiteral(v)) out.push(`${group}-${side}: ${facetValueCss(v, false)};`);
    }
  }
  if (sp.gap?.row && !isBlankLiteral(sp.gap.row)) out.push(`row-gap: ${facetValueCss(sp.gap.row, false)};`);
  if (sp.gap?.column && !isBlankLiteral(sp.gap.column)) out.push(`column-gap: ${facetValueCss(sp.gap.column, false)};`);
  return out;
}

function stopCss(s: ColorStop): string {
  const color = facetValueCss(s.color, true);
  return s.position ? `${color} ${s.position}` : color;
}

// Same isBlankLiteral rule as every emit site above: a blank stop literal is a
// mid-edit transient — skip it rather than emit a dangling empty stop
// (`linear-gradient(, #fff)`). A gradient with no real stop emits nothing.
const hasRealStops = (g: Gradient): boolean => g.stops.some((s) => !isBlankLiteral(s.color));

export function gradientCss(g: Gradient): string {
  const stops = g.stops.filter((s) => !isBlankLiteral(s.color)).map(stopCss).join(', ');
  const pre = g.repeating ? 'repeating-' : '';
  if (g.type === 'linear') {
    const head = g.angle ? `${g.angle}, ` : '';
    return `${pre}linear-gradient(${head}${stops})`;
  }
  if (g.type === 'radial') {
    const shape = [g.shape, g.size].filter(Boolean).join(' ');
    const at = g.position ? `at ${g.position}` : '';
    const head = [shape, at].filter(Boolean).join(' ');
    return `${pre}radial-gradient(${head ? head + ', ' : ''}${stops})`;
  }
  const from = g.fromAngle ? `from ${g.fromAngle}` : '';
  const at = g.position ? `at ${g.position}` : '';
  const head = [from, at].filter(Boolean).join(' ');
  return `${pre}conic-gradient(${head ? head + ', ' : ''}${stops})`;
}

function layerCss(l: Layer): string {
  return l.kind === 'image' ? `url(${l.ref})` : gradientCss(l.gradient);
}

/** Composed CSS background-image value: layers reversed to CSS topmost-first order.
 *  undefined if no layers. Used by backgroundCss (scoped-block CSS emission). */
function composeLayerImage(bg: BackgroundFacet): string | undefined {
  if (!bg.layers || !bg.layers.length) return undefined;
  // Blank layers are mid-edit transients — skip an image layer with a blank
  // ref rather than emit `url()`, and skip a gradient layer whose stops are
  // ALL blank rather than emit an empty gradient.
  const layers = bg.layers.filter((l) =>
    l.kind === 'image' ? !isBlankRef(l.ref) : hasRealStops(l.gradient));
  if (!layers.length) return undefined;
  return [...layers].reverse().map(layerCss).join(', ');
}

/** 0-2 CSS declarations for a background composite. Layers reversed: CSS wants topmost first.
 *  Only a literal color is emitted here — a {token} color is routed separately via
 *  facetDeclarations/projectColorTokens to avoid emitting it twice. */
export function backgroundCss(bg: BackgroundFacet): string[] {
  const out: string[] = [];
  if (bg.color && 'literal' in bg.color && !isBlankLiteral(bg.color)) out.push(`background-color: ${facetValueCss(bg.color, true)};`);
  const images = composeLayerImage(bg);
  if (images !== undefined) out.push(`background-image: ${images};`);
  return out;
}
