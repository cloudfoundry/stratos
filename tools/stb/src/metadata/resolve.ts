import type { ElementMapping, CuratedDescriptions, CuratedRef } from './types';

function isRef(d: ElementMapping['description']): d is CuratedRef {
  return typeof d === 'object' && d !== null && 'ref' in d;
}

/**
 * Description precedence (spec §6):
 *   1. harvested locator.name
 *   2. curated: inline string, or {ref} resolved through `curated` by snapshotId
 *   3. selector fallback
 */
export function resolveDescription(mapping: ElementMapping, curated: CuratedDescriptions): string {
  const harvested = mapping.locator?.name;
  if (harvested) return harvested;

  const d = mapping.description;
  if (typeof d === 'string' && d) return d;
  if (isRef(d)) {
    const text = curated[d.ref];
    if (text) return text;
  }
  return mapping.selector;
}

export function tokenNames(mapping: ElementMapping): string[] {
  return mapping.tokens.map((t) => t.name);
}
