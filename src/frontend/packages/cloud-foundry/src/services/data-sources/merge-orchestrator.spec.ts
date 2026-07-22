import { describe, it, expect, vi } from 'vitest';
import { signal } from '@angular/core';
import { MergeOrchestrator } from './merge-orchestrator';
import type { CnsiSourceView } from './merge-orchestrator';

function fakeSource(
  cnsiGuid: string,
  items: unknown[],
  loading = false,
  error: unknown = null,
  totalResults = items.length,
  removeItem?: (guid: string) => void,
): CnsiSourceView<unknown> {
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
    ...(removeItem ? { removeItem } : {}),
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

  describe('sourceFor', () => {
    it('returns the matching source by cnsiGuid', () => {
      const s1 = fakeSource('cnsi-1', []);
      const s2 = fakeSource('cnsi-2', []);
      const orch = new MergeOrchestrator([s1, s2]);
      expect(orch.sourceFor('cnsi-2')).toBe(s2);
    });

    it('returns undefined for an unknown cnsiGuid', () => {
      const orch = new MergeOrchestrator([fakeSource('cnsi-1', [])]);
      expect(orch.sourceFor('nope')).toBeUndefined();
    });
  });

  describe('removeRow', () => {
    it('delegates to the matching source.removeItem', () => {
      const remove1 = vi.fn();
      const remove2 = vi.fn();
      const s1 = fakeSource('cnsi-1', [], false, null, 0, remove1);
      const s2 = fakeSource('cnsi-2', [], false, null, 0, remove2);
      const orch = new MergeOrchestrator([s1, s2]);
      orch.removeRow('cnsi-2', 'guid-x');
      expect(remove1).not.toHaveBeenCalled();
      expect(remove2).toHaveBeenCalledWith('guid-x');
    });

    it('is a no-op when the cnsiGuid is unknown', () => {
      const remove1 = vi.fn();
      const orch = new MergeOrchestrator([fakeSource('cnsi-1', [], false, null, 0, remove1)]);
      orch.removeRow('cnsi-zzz', 'guid-x');
      expect(remove1).not.toHaveBeenCalled();
    });

    it('is a no-op when the source omits removeItem (test fakes pre-API)', () => {
      // No removeItem on fake; orchestrator must silently skip rather than throw.
      const orch = new MergeOrchestrator([fakeSource('cnsi-1', [])]);
      expect(() => orch.removeRow('cnsi-1', 'guid-x')).not.toThrow();
    });
  });
});
