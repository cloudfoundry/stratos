import type { BrandingModel, LeverValue } from '@/metadata/types';
import { oklchToHex, scaleFromOklch } from '@/color/oklch';

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

function leafValue(v: LeverValue): unknown {
  switch (v.kind) {
    case 'color': return oklchToHex(v.oklch);
    case 'content': return v.text;
    case 'asset': return v.ref;
    default: {
      const _exhaustive: never = v;
      return _exhaustive;
    }
  }
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
    if (entry.token && node.value.kind === 'color') {
      if (entry.oklchRole === 'scale') {
        const scale = scaleFromOklch(node.value.oklch);
        for (const [step, hex] of Object.entries(scale)) {
          tokens.set(entry.token.replace(/\d+$/, step), hex);
        }
      } else {
        tokens.set(entry.token, oklchToHex(node.value.oklch));
      }
    }
    if (entry.config) {
      const ns = entry.config.includes('.') ? null : namespaceFor(node.snapshotId, containers);
      const path = ns ? `${ns}.${entry.config}` : entry.config;
      setPath(companyConfig, path, leafValue(node.value));
    }
    if (entry.visibilityConfig && node.visibility !== undefined) {
      const ns = entry.visibilityConfig.includes('.') ? null : namespaceFor(node.snapshotId, containers);
      const path = ns ? `${ns}.${entry.visibilityConfig}` : entry.visibilityConfig;
      setPath(companyConfig, path, node.visibility);
    }
  }
  return { tokens, companyConfig, unmapped };
}
