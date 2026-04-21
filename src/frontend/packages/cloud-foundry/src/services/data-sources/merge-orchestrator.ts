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
}
