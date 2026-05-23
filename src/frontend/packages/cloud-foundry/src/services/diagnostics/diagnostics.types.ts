export const DIAGNOSTIC_CODE_FAMILIES = [
  'bare-guid-entity-lookup',
  'entity-key-collision-avoided',
  'entity-size-sample',
  'store-snapshot',
  'api-call-count',
  'api-call-timing',
  'service-call-count',
  'cache-hit',
  'cache-miss',
  'in-flight-hit',
  'buffer-overflow',
  'cascade-apply',
] as const;

export type DiagnosticCode = typeof DIAGNOSTIC_CODE_FAMILIES[number];

export function isDiagnosticCode(value: string): value is DiagnosticCode {
  return (DIAGNOSTIC_CODE_FAMILIES as readonly string[]).includes(value);
}

export interface DiagnosticSample {
  code: DiagnosticCode;
  at: number;
  dimensions: Record<string, string | number>;
  value?: number;
}

export interface DiagnosticCounter {
  code: DiagnosticCode;
  dimensions: Record<string, string | number>;
  count: number;
  firstAt: number;
  lastAt: number;
}

export interface DiagnosticsSnapshotEnvelope {
  version: 1;
  capturedAt: number;
  counters: Record<string, DiagnosticCounter[]>;
  samples: Record<string, DiagnosticSample[]>;
  snapshots: Array<{
    at: number;
    totalBytes: number;
    perEntityType: Record<string, number>;
    perCnsi: Record<string, number>;
  }>;
}

export interface DiagnosticsQueryOptions {
  codes?: DiagnosticCode[];
  sinceMs?: number;
}
