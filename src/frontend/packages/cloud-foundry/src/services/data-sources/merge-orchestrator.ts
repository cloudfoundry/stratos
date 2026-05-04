import { Signal, computed } from '@angular/core';

export interface CnsiSourceView<T> {
  readonly cnsiGuid: string;
  readonly items: Signal<T[]>;
  readonly loading: Signal<boolean>;
  readonly error: Signal<unknown | null>;
  readonly done: Signal<boolean>;
  readonly fetchedPages: Signal<number>;
  readonly totalResults: Signal<number>;
  load(): Promise<void>;
  refresh(): Promise<void>;
  /**
   * Drop a single item by guid from local state without re-fetching.
   * Idempotent. See `CnsiEntitySource.removeItem` for semantics. Optional
   * on the view interface so plain test fakes don't have to stub it; the
   * orchestrator's `removeRow` no-ops when the source doesn't expose it.
   */
  removeItem?(guid: string): void;
}

export class MergeOrchestrator<T> {
  readonly allItems: Signal<T[]>;
  readonly isAnyLoading: Signal<boolean>;
  readonly errorsByCnsi: Signal<Map<string, unknown>>;
  readonly totalAcrossCnsis: Signal<number>;

  constructor(readonly sources: readonly CnsiSourceView<T>[]) {
    this.allItems = computed(() => sources.flatMap(s => s.items()));
    this.isAnyLoading = computed(() => sources.some(s => s.loading()));
    this.errorsByCnsi = computed(() => {
      const m = new Map<string, unknown>();
      for (const s of sources) {
        const e = s.error();
        if (e != null) m.set(s.cnsiGuid, e);
      }
      return m;
    });
    this.totalAcrossCnsis = computed(() => sources.reduce((n, s) => n + s.totalResults(), 0));
  }

  async refresh(): Promise<void> {
    await Promise.all(this.sources.map(s => s.refresh()));
  }

  async load(): Promise<void> {
    await Promise.all(this.sources.map(s => s.load()));
  }

  sourceFor(cnsiGuid: string): CnsiSourceView<T> | undefined {
    return this.sources.find(s => s.cnsiGuid === cnsiGuid);
  }

  /**
   * Remove a single row from a specific CNSI's source without re-fetching.
   * Idempotent: unknown cnsi or absent guid is a no-op. Source must expose
   * `removeItem` (the standard `CnsiEntitySource` does); test fakes that
   * omit it are silently skipped.
   *
   * Use after a successful destructive write (delete, unmap) to drop the
   * row from local state immediately, instead of waiting for the next
   * refresh cycle. Closes the post-delete poller-noise gap on app wall
   * (pre-slice-2 sweep #3) and is the symmetric hook for visible-row
   * guid-batch sweeps (#4).
   */
  removeRow(cnsiGuid: string, guid: string): void {
    const src = this.sourceFor(cnsiGuid);
    src?.removeItem?.(guid);
  }
}
