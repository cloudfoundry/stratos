import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DiagnosticsSnapshotEnvelope } from './diagnostics.types';
import { StratosDiagnostics } from './stratos-diagnostics.service';

describe('StratosDiagnostics', () => {
  let svc: StratosDiagnostics;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(StratosDiagnostics);
    svc.reset();
  });

  afterEach(() => {
    svc.reset();
  });

  it('emitCounter increments counts, snapshot exposes them', async () => {
    svc.emitCounter('entity-key-collision-avoided', { cnsiGuid: 'cf-1', entityType: 'organization' });
    svc.emitCounter('entity-key-collision-avoided', { cnsiGuid: 'cf-1', entityType: 'organization' });
    svc.emitCounter('entity-key-collision-avoided', { cnsiGuid: 'cf-2', entityType: 'organization' });
    await svc.waitForFlush();
    const snap = svc.snapshot();
    expect(snap.version).toBe(1);
    expect(snap.counters['entity-key-collision-avoided']).toHaveLength(2);
    const cf1 = snap.counters['entity-key-collision-avoided'].find(c => c.dimensions.cnsiGuid === 'cf-1');
    expect(cf1?.count).toBe(2);
  });

  it('emitSample stores sample with value', async () => {
    svc.emitSample('entity-size-sample', { entityType: 'organization', cnsiGuid: 'cf-1' }, 512);
    await svc.waitForFlush();
    const snap = svc.snapshot();
    expect(snap.samples['entity-size-sample']).toHaveLength(1);
    expect(snap.samples['entity-size-sample'][0].value).toBe(512);
  });

  it('reset clears counters and samples', async () => {
    svc.emitCounter('api-call-count', { method: 'GET' });
    svc.emitSample('api-call-timing', { method: 'GET' }, 100);
    await svc.waitForFlush();
    svc.reset();
    const snap = svc.snapshot();
    expect(snap.counters).toEqual({});
    expect(snap.samples).toEqual({});
  });

  it('query filters by code family', async () => {
    svc.emitCounter('cache-hit', { service: 'EndpointDataService' });
    svc.emitCounter('cache-miss', { service: 'EndpointDataService' });
    await svc.waitForFlush();
    const filtered = svc.query({ codes: ['cache-hit'] });
    expect(filtered.counters['cache-hit']).toBeDefined();
    expect(filtered.counters['cache-miss']).toBeUndefined();
  });

  it('state signal reflects current aggregated snapshot', async () => {
    svc.emitCounter('service-call-count', { service: 'Foo', method: 'bar' });
    await svc.waitForFlush();
    const snap: DiagnosticsSnapshotEnvelope = svc.state();
    expect(snap.counters['service-call-count']?.[0]?.count).toBe(1);
  });
});
