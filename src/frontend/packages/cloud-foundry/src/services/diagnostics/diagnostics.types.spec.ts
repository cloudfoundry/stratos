import { describe, expect, it } from 'vitest';
import {
  DIAGNOSTIC_CODE_FAMILIES,
  DiagnosticsSnapshotEnvelope,
  isDiagnosticCode,
} from './diagnostics.types';

describe('diagnostics types', () => {
  it('exposes the full code-family set', () => {
    expect(DIAGNOSTIC_CODE_FAMILIES).toContain('bare-guid-entity-lookup');
    expect(DIAGNOSTIC_CODE_FAMILIES).toContain('entity-key-collision-avoided');
    expect(DIAGNOSTIC_CODE_FAMILIES).toContain('entity-size-sample');
    expect(DIAGNOSTIC_CODE_FAMILIES).toContain('store-snapshot');
    expect(DIAGNOSTIC_CODE_FAMILIES).toContain('api-call-count');
    expect(DIAGNOSTIC_CODE_FAMILIES).toContain('api-call-timing');
    expect(DIAGNOSTIC_CODE_FAMILIES).toContain('service-call-count');
    expect(DIAGNOSTIC_CODE_FAMILIES).toContain('cache-hit');
    expect(DIAGNOSTIC_CODE_FAMILIES).toContain('cache-miss');
  });

  it('isDiagnosticCode rejects unknown codes', () => {
    expect(isDiagnosticCode('entity-size-sample')).toBe(true);
    expect(isDiagnosticCode('not-a-real-code')).toBe(false);
  });

  it('DiagnosticsSnapshotEnvelope is versioned', () => {
    const envelope: DiagnosticsSnapshotEnvelope = {
      version: 1,
      capturedAt: 0,
      counters: {},
      samples: {},
      snapshots: [],
    };
    expect(envelope.version).toBe(1);
  });
});
