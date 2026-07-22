import { EffectRef, Injectable, Injector, Signal, WritableSignal, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { ListStateStore } from '@stratosui/core';

import { CnsiFeatureFlagsSource } from '../../../services/data-sources/cnsi-feature-flags-source';
import { ViewPipeline, SortSpec } from '../../../services/data-sources/view-pipeline';
import type { StFeatureFlag } from '../../../services/endpoint-data/stratos-types';

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

  private readonly state = inject(ListStateStore).bind('cf-feature-flags', {
    viewMode: 'card',
    pageSize: [24, 25],
    pageIndex: [0, 0],
    sort: [{ field: 'name', direction: 'asc' }, { field: 'name', direction: 'asc' }],
  });

  readonly filter: WritableSignal<(f: StFeatureFlag) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SortSpec<StFeatureFlag>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode = this.state.viewMode;

  private readonly _featureFlags: WritableSignal<StFeatureFlag[]> = signal([]);
  readonly featureFlags: Signal<StFeatureFlag[]> = this._featureFlags.asReadonly();

  private readonly _hasLoadedOnce: WritableSignal<boolean> = signal(false);
  readonly hasLoadedOnce: Signal<boolean> = this._hasLoadedOnce.asReadonly();

  private readonly _sortExtractors: WritableSignal<Map<string, (row: StFeatureFlag) => unknown>> = signal(new Map());

  view!: ViewPipeline<StFeatureFlag>;

  // Captured so a re-entry (root singleton, but initialize() runs per mount)
  // destroys the prior filter effect instead of stacking one per navigation.
  private filterEffect?: EffectRef;

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

    this.filterEffect?.destroy();
    runInInjectionContext(this.injector, () => {
      this.filterEffect = effect(() => {
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
    this._hasLoadedOnce.set(true);
  }

  async refresh(): Promise<void> {
    if (!this.source) return;
    await this.source.refresh();
    this._featureFlags.set([...this.source.items()]);
    this._hasLoadedOnce.set(true);
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
