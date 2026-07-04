/**
 * Client-memory footprint estimation for CF entity collections.
 *
 * Byte estimates are derived from the St* projections stored client-side
 * (cloud-foundry/src/services/endpoint-data/stratos-types.ts): for each
 * projection, the JSON payload size of a typical populated instance was
 * measured and rounded up to allow for V8 object/string overhead.
 */

/**
 * Approximate bytes retained per stored entity.
 * - organization: StOrg (guid, name, timestamps, relationships)
 * - space:        StSpace (slightly leaner than an org)
 * - route:        StRoute (url pieces plus destinations)
 * - application:  StApp (lifecycle, relationships, metadata)
 * - user:         user row with role buckets — HIGH VARIANCE, the per-org/
 *                 per-space role buckets are unbounded so 1800 is a mid guess
 * - serviceInstance: StServiceInstanceRef (last operation, maintenance info,
 *                 plan/broker relationships)
 */
export const ENTITY_BYTES: Record<string, number> = {
  organization: 600,
  space: 560,
  route: 800,
  application: 1300,
  user: 1800,
  serviceInstance: 1600,
};

/** Safety factor covering store bookkeeping, request-info maps, and V8 slack. */
const SAFETY_FACTOR = 1.5;

/**
 * Estimated retained bytes for the given entity counts.
 * Unknown entity types contribute 0.
 */
export function estimateFootprint(counts: Record<string, number>): number {
  let total = 0;
  for (const [type, count] of Object.entries(counts)) {
    const perEntity = ENTITY_BYTES[type];
    if (perEntity) {
      total += count * perEntity;
    }
  }
  return total * SAFETY_FACTOR;
}

export type RiskLevel = 'low' | 'medium' | 'high';

export interface HeapInfo {
  usedBytes: number | null;
  limitBytes: number;
  source: 'performance.memory' | 'fixed-budget';
}

const FIXED_BUDGET_BYTES = 2 * 1024 ** 3; // 2 GiB when the heap API is unavailable

/**
 * Read the JS heap via the non-standard performance.memory API (Chromium),
 * falling back to a fixed 2 GiB budget elsewhere.
 */
export function readHeap(): HeapInfo {
  const memory = (performance as any).memory;
  if (memory?.jsHeapSizeLimit) {
    return {
      usedBytes: memory.usedJSHeapSize ?? null,
      limitBytes: memory.jsHeapSizeLimit,
      source: 'performance.memory',
    };
  }
  return {
    usedBytes: null,
    limitBytes: FIXED_BUDGET_BYTES,
    source: 'fixed-budget',
  };
}

/**
 * Rate the risk of loading an estimated payload into the current heap.
 *
 * With a real heap reading: ratio = (used + estimate) / (0.8 * limit),
 * i.e. how close the combined footprint gets to 80% of the heap limit.
 * With the fixed budget (used unknown): ratio = estimate / limit, with
 * tighter thresholds since actual usage is unknown.
 */
export function rateRisk(estimatedBytes: number, heap: HeapInfo): RiskLevel {
  if (heap.usedBytes !== null) {
    const ratio = (heap.usedBytes + estimatedBytes) / (0.8 * heap.limitBytes);
    if (ratio < 0.5) { return 'low'; }
    if (ratio < 0.75) { return 'medium'; }
    return 'high';
  }
  const ratio = estimatedBytes / heap.limitBytes;
  if (ratio < 0.25) { return 'low'; }
  if (ratio < 0.5) { return 'medium'; }
  return 'high';
}

/** Human-readable byte count: 512 B, 1.5 kB, 5.0 MB, 2.0 GB. */
export function formatBytes(n: number): string {
  if (n < 1024) {
    return `${n} B`;
  }
  const units = ['kB', 'MB', 'GB'];
  let value = n;
  let unit = 'B';
  for (const u of units) {
    if (value < 1024) { break; }
    value = value / 1024;
    unit = u;
  }
  return `${value.toFixed(1)} ${unit}`;
}
