import { describe, it, expect } from 'vitest';
import { signal } from '@angular/core';
import { MergeOrchestrator } from './merge-orchestrator';
import type { CnsiSourceView } from './merge-orchestrator';

function fakeSource(cnsiGuid: string, items: unknown[], loading = false, error: unknown = null, totalResults = items.length): CnsiSourceView<unknown> {
  return {
    cnsiGuid,
    items: signal(items).asReadonly(),
    loading: signal(loading).asReadonly(),
    error: signal(error).asReadonly(),
    done: signal(!loading).asReadonly(),
    fetchedPages: signal(1).asReadonly(),
    totalResults: signal(totalResults).asReadonly(),
    load: async () => {},
    refresh: async () => {},
  };
}

describe('MergeOrchestrator', () => {
  it('allItems is the concatenation of every source.items()', () => {
    const s1 = fakeSource('cnsi-1', ['a', 'b']);
    const s2 = fakeSource('cnsi-2', ['c']);
    const orch = new MergeOrchestrator([s1, s2]);
    expect(orch.allItems()).toEqual(['a', 'b', 'c']);
  });

  it('isAnyLoading is true when any source is loading', () => {
    const s1 = fakeSource('cnsi-1', [], true);
    const s2 = fakeSource('cnsi-2', []);
    const orch = new MergeOrchestrator([s1, s2]);
    expect(orch.isAnyLoading()).toBe(true);
  });

  it('errorsByCnsi is a map of cnsi -> error, excluding null errors', () => {
    const e = new Error('net');
    const s1 = fakeSource('cnsi-1', [], false, e);
    const s2 = fakeSource('cnsi-2', []);
    const orch = new MergeOrchestrator([s1, s2]);
    const errs = orch.errorsByCnsi();
    expect(errs.size).toBe(1);
    expect(errs.get('cnsi-1')).toBe(e);
  });

  it('totalAcrossCnsis sums source totalResults', () => {
    const s1 = fakeSource('cnsi-1', [], false, null, 10);
    const s2 = fakeSource('cnsi-2', [], false, null, 5);
    const orch = new MergeOrchestrator([s1, s2]);
    expect(orch.totalAcrossCnsis()).toBe(15);
  });
});
