import type { Facets, FacetValue, BackgroundFacet, Gradient, ColorStop, Layer } from '@/metadata/types';
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

export function facetLiteralCss(spec: FacetPropSpec, v: FacetValue): string | null {
  if ('token' in v) return null;
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
    if (l.kind === 'image') {
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

function stopCss(s: ColorStop): string {
  const color = facetValueCss(s.color, true);
  return s.position ? `${color} ${s.position}` : color;
}

export function gradientCss(g: Gradient): string {
  const stops = g.stops.map(stopCss).join(', ');
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
 *  undefined if no layers. Shared by backgroundCss and backgroundPatch so the two
 *  emission paths (scoped-block CSS vs. live-preview inline style) can't drift apart. */
function composeLayerImage(bg: BackgroundFacet): string | undefined {
  if (!bg.layers || !bg.layers.length) return undefined;
  return [...bg.layers].reverse().map(layerCss).join(', ');
}

/** 0-2 CSS declarations for a background composite. Layers reversed: CSS wants topmost first.
 *  Only a literal color is emitted here — a {token} color is routed separately via
 *  facetDeclarations/projectColorTokens to avoid emitting it twice. */
export function backgroundCss(bg: BackgroundFacet): string[] {
  const out: string[] = [];
  if (bg.color && 'literal' in bg.color) out.push(`background-color: ${facetValueCss(bg.color, true)};`);
  const images = composeLayerImage(bg);
  if (images !== undefined) out.push(`background-image: ${images};`);
  return out;
}

/** Raw-value counterpart to backgroundCss for the live-preview LeverPatch pipeline (Task 7):
 *  no decl-string parsing, and (unlike backgroundCss) a {token} color IS included here —
 *  this patch is inline-style-only, so there's no separate token-routed emission to collide with. */
export function backgroundPatch(bg: BackgroundFacet): { backgroundColor?: string; backgroundImage?: string } {
  const out: { backgroundColor?: string; backgroundImage?: string } = {};
  if (bg.color) out.backgroundColor = facetValueCss(bg.color, true);
  const images = composeLayerImage(bg);
  if (images !== undefined) out.backgroundImage = images;
  return out;
}
