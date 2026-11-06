import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BareGuidLookupGuard } from './bare-guid-lookup-guard';
import { StratosDiagnostics } from './stratos-diagnostics.service';

describe('BareGuidLookupGuard', () => {
  let guard: BareGuidLookupGuard;
  let diagnostics: StratosDiagnostics;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(BareGuidLookupGuard);
    diagnostics = TestBed.inject(StratosDiagnostics);
    diagnostics.reset();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
    diagnostics.reset();
  });

  it('passes composite keys through unchanged and emits no warning', () => {
    const out = guard.checkKey('cf-1:org-a', 'organization');
    expect(out).toBe('cf-1:org-a');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('emits console.warn + StratosDiagnostics counter for bare GUIDs', async () => {
    guard.checkKey('org-a', 'organization');
    await diagnostics.waitForFlush();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('bare-guid-entity-lookup'));
    const snap = diagnostics.snapshot();
    const c = snap.counters['bare-guid-entity-lookup']?.find(x => x.dimensions.entityType === 'organization');
    expect(c?.count).toBe(1);
  });

  it('fallback scan returns first composite key ending with :bareGuid', () => {
    const dict = { 'cf-1:org-a': { x: 1 }, 'cf-2:org-a': { x: 2 }, 'cf-1:org-b': { x: 3 } };
    const found = guard.fallbackScan(dict, 'org-b');
    expect(found).toEqual({ x: 3 });
  });

  it('fallback scan returns null on no match', () => {
    const dict = { 'cf-1:org-a': { x: 1 } };
    expect(guard.fallbackScan(dict, 'missing')).toBeNull();
  });
});
