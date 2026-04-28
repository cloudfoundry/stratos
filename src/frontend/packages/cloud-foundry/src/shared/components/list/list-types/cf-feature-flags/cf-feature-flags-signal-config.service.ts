import { Injectable, Injector, Signal, WritableSignal, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { CnsiFeatureFlagsSource } from '../../../../../services/data-sources/cnsi-feature-flags-source';
import { ViewPipeline, SortSpec } from '../../../../../services/data-sources/view-pipeline';
import type { StFeatureFlag } from '../../../../../services/endpoint-data/stratos-types';

// CF Feature Flags list config — single-CNSI, read-only. Drives the
// per-CF /cloud-foundry/:cnsi/feature-flags tab. Foundations expose
// ~15 flags so this service stays simple: own the fetch, expose a
// featureFlags() signal, run it through ViewPipeline. No writes —
// flag toggle is a platform-admin operation not surfaced here.
@Injectable({ providedIn: 'root' })
export class CfFeatureFlagsSignalConfigService {
  private readonly http = inject(HttpClient);
  private readonly injector = inject(Injector);

  private cnsiGuid = '';
  private source?: CnsiFeatureFlagsSource;

  readonly filter: WritableSignal<(f: StFeatureFlag) => boolean> = signal(() => true);
  readonly sort: WritableSignal<SortSpec<StFeatureFlag>> = signal({ field: 'name', direction: 'asc' });
  readonly pageSize: WritableSignal<number> = signal(24);
  readonly pageIndex: WritableSignal<number> = signal(0);
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode: WritableSignal<'table' | 'card'> = signal('card');

  private readonly _featureFlags: WritableSignal<StFeatureFlag[]> = signal([]);
  readonly featureFlags: Signal<StFeatureFlag[]> = this._featureFlags.asReadonly();

  private readonly _sortExtractors: WritableSignal<Map<string, (row: StFeatureFlag) => unknown>> = signal(new Map());

  view!: ViewPipeline<StFeatureFlag>;

  initialize(cnsiGuid: string): void {
    this.cnsiGuid = cnsiGuid;
    this.source = new CnsiFeatureFlagsSource(cnsiGuid, this.http);
    this.view = new ViewPipeline<StFeatureFlag>(
      this.featureFlags,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );

    runInInjectionContext(this.injector, () => {
      effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        this.filter.set((f: StFeatureFlag) => {
          if (!q) return true;
          return (f.name ?? '').toLowerCase().includes(q);
        });
      });
    });
  }

  async loadAll(): Promise<void> {
    if (!this.source) return;
    await this.source.load();
    this._featureFlags.set([...this.source.items()]);
  }

  async refresh(): Promise<void> {
    if (!this.source) return;
    await this.source.refresh();
    this._featureFlags.set([...this.source.items()]);
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.sort.set({ field: 'name', direction: 'asc' });
    this.pageIndex.set(0);
  }

  registerSortExtractor(fieldKey: string, extractor: (row: StFeatureFlag) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }
}
