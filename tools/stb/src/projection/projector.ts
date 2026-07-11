import type { BrandingModel, Facets } from '@/metadata/types';
import { oklchToHex, scaleFromOklch, type Oklch } from '@/color/oklch';
import { facetDeclarations, facetLiteralCss, contentAssetDeclarations } from '@/metadata/facets';

export interface PropertyRoute { config?: string; token?: string; oklchRole?: 'primary' | 'scale'; }
export interface RoutingEntry {
  config?: string;
  token?: string;
  oklchRole?: 'primary' | 'scale';
  visibilityConfig?: string;
  /** Per-facet routing — current preferred form; supersedes legacy top-level config/token/oklchRole.
   *  Do not mix both for the same element: if both are present both run (last-write-wins on company-config). */
  properties?: Record<string, PropertyRoute>;
}
export interface RoutingMap {
  containers?: Record<string, string>;
  elements: Record<string, RoutingEntry>;
}
export interface ProjectionResult {
  tokens: Map<string, string>;
  companyConfig: Record<string, unknown>;
  unmapped: string[];
}

/** Read an Oklch color from facets (text.color > background.color). */
function colorOf(node: { facets: Facets }): Oklch | null {
  const c = node.facets.text?.color ?? node.facets.background?.color;
  if (c && 'literal' in c && typeof c.literal === 'object') return c.literal as Oklch;
  return null;
}

/** Read the topmost (last) image layer ref from background.layers. */
function topmostImageRef(node: { facets: Facets }): string | null {
  const layers = node.facets.background?.layers ?? [];
  for (let i = layers.length - 1; i >= 0; i--) {           // last = topmost
    const l = layers[i]!;
    if (l.kind === 'image') return l.ref;
  }
  return null;
}

/** Derive the leaf projection value from facets: content → text, topmost image → ref, backstop color → hex, asset → ref.
 *  This precedence IS the CSS cascade/paint order (content over topmost image over backstop color) — deliberate,
 *  per the resolved leafValueOf precedence decision. Color deliberately sits below the image: background color is
 *  also token-routed (projectColorTokens), so letting it win here would emit the same color twice. */
function leafValueOf(node: { facets: Facets }): unknown {
  if (node.facets.content) return node.facets.content.text;
  const topmost = topmostImageRef(node);
  if (topmost) return topmost;
  const color = colorOf(node);
  if (color) return oklchToHex(color);
  return node.facets.asset?.ref ?? null;
}

function namespaceFor(snapshotId: string, containers: Record<string, string>): string | null {
  let best: string | null = null;
  let bestLen = -1;
  for (const [prefix, ns] of Object.entries(containers)) {
    if (snapshotId.startsWith(prefix + '.') && prefix.length > bestLen) {
      best = ns;
      bestLen = prefix.length;
    }
  }
  return best;
}

function setPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  // Guard against prototype pollution via crafted path segments
  if (parts.some((p) => p === '__proto__' || p === 'constructor' || p === 'prototype')) return;
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i]!;
    if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {};
    cur = cur[k] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]!] = value;
}

/** Project per-property `{token}`-routed color facets into the token map.
 *  Shared by project() (light, node.facets) and projectDark() (dark, node.facetsDark) —
 *  same routing rules, different facet source. */
function projectColorTokens(
  facets: Facets,
  properties: Record<string, PropertyRoute>,
  tokens: Map<string, string>,
): void {
  for (const d of facetDeclarations(facets)) {
    const pr = properties[d.key];
    if (!pr) continue;
    if (pr.token && d.spec.isColor && 'literal' in d.value && typeof d.value.literal === 'object') {
      const color = d.value.literal as Oklch;
      if (pr.oklchRole === 'scale') {
        const scale = scaleFromOklch(color);
        for (const [step, hex] of Object.entries(scale)) {
          tokens.set(pr.token.replace(/\d+$/, step), hex);
        }
      } else {
        tokens.set(pr.token, oklchToHex(color));
      }
    }
  }
}

export function project(model: BrandingModel, routing: RoutingMap): ProjectionResult {
  const tokens = new Map<string, string>();
  const companyConfig: Record<string, unknown> = {};
  const unmapped: string[] = [];
  const containers = routing.containers ?? {};

  for (const node of model.nodes) {
    const entry = routing.elements[node.snapshotId];
    if (!entry) {
      unmapped.push(node.snapshotId);
      continue;
    }
    const color = colorOf(node);
    if (entry.token && color) {
      if (entry.oklchRole === 'scale') {
        const scale = scaleFromOklch(color);
        for (const [step, hex] of Object.entries(scale)) {
          tokens.set(entry.token.replace(/\d+$/, step), hex);
        }
      } else {
        tokens.set(entry.token, oklchToHex(color));
      }
    }
    if (entry.config) {
      const ns = entry.config.includes('.') ? null : namespaceFor(node.snapshotId, containers);
      const path = ns ? `${ns}.${entry.config}` : entry.config;
      setPath(companyConfig, path, leafValueOf(node));
    }
    if (entry.visibilityConfig && node.visibility !== undefined) {
      const ns = entry.visibilityConfig.includes('.') ? null : namespaceFor(node.snapshotId, containers);
      const path = ns ? `${ns}.${entry.visibilityConfig}` : entry.visibilityConfig;
      setPath(companyConfig, path, node.visibility);
    }

    // Property-level routing via nested properties map (back-compat: legacy path above still runs first)
    if (entry.properties) {
      projectColorTokens(node.facets, entry.properties, tokens);
      for (const d of facetDeclarations(node.facets)) {
        const pr = entry.properties[d.key];
        if (!pr) continue;
        const cssVal = facetLiteralCss(d.spec, d.value);
        if (pr.config && cssVal !== null) {
          const ns = pr.config.includes('.') ? null : namespaceFor(node.snapshotId, containers);
          const path = ns ? `${ns}.${pr.config}` : pr.config;
          setPath(companyConfig, path, cssVal);
        }
      }
      for (const d of contentAssetDeclarations(node.facets)) {
        const pr = entry.properties[d.key];
        if (!pr?.config) continue;
        const ns = pr.config.includes('.') ? null : namespaceFor(node.snapshotId, containers);
        const path = ns ? `${ns}.${pr.config}` : pr.config;
        setPath(companyConfig, path, d.value);
      }
    }
  }
  return { tokens, companyConfig, unmapped };
}

/** Project dark-mode facet overrides (node.facetsDark) into a dark token map only —
 *  same per-property {token} color routing as project(), no companyConfig/unmapped
 *  (dark is values-only). A node with no facetsDark contributes nothing. */
export function projectDark(model: BrandingModel, routing: RoutingMap): Map<string, string> {
  const tokens = new Map<string, string>();
  for (const node of model.nodes) {
    const entry = routing.elements[node.snapshotId];
    if (!entry?.properties || !node.facetsDark) continue;
    projectColorTokens(node.facetsDark, entry.properties, tokens);
  }
  return tokens;
}
