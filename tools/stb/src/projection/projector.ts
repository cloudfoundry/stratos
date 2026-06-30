import type { BrandingModel, Facets } from '@/metadata/types';
import { oklchToHex, scaleFromOklch, type Oklch } from '@/color/oklch';

export interface RoutingEntry {
  config?: string;
  token?: string;
  oklchRole?: 'primary' | 'scale';
  visibilityConfig?: string;
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

/** Read an Oklch color from facets (text.color > surface.background). */
function colorOf(node: { facets: Facets }): Oklch | null {
  const c = node.facets.text?.color ?? node.facets.surface?.background;
  if (c && 'literal' in c && typeof c.literal === 'object') return c.literal as Oklch;
  return null;
}

/** Derive the leaf projection value from facets: color → hex, content → text, asset → ref. */
function leafValueOf(node: { facets: Facets }): unknown {
  const color = colorOf(node);
  if (color) return oklchToHex(color);
  if (node.facets.content) return node.facets.content.text;
  if (node.facets.asset) return node.facets.asset.ref;
  return null;
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
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i]!;
    if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {};
    cur = cur[k] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]!] = value;
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
  }
  return { tokens, companyConfig, unmapped };
}
