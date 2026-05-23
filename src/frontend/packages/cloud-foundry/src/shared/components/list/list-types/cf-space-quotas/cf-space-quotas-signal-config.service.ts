import { Injectable, Injector, Signal, WritableSignal, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { ListStateStore } from '@stratosui/core';

import { CnsiSpaceQuotasSource } from '../../../../../services/data-sources/cnsi-space-quotas-source';
import { ViewPipeline, SortSpec } from '../../../../../services/data-sources/view-pipeline';
import type { StSpaceQuota } from '../../../../../services/endpoint-data/stratos-types';

// CF Space Quotas list config — single-CNSI, read-only. Drives the
// per-CF Space Quotas tab on the foundation overview. Each space quota
// is owned by exactly one organization and may be applied to spaces in
// that org. No writes — quota CRUD and apply-to-spaces are platform-
// admin operations not surfaced.
@Injectable({ providedIn: 'root' })
export class CfSpaceQuotasSignalConfigService {
  private readonly http = inject(HttpClient);
  private readonly injector = inject(Injector);

  private cnsiGuid = '';
  private source?: CnsiSpaceQuotasSource;

  private readonly state = inject(ListStateStore).bind('cf-space-quotas', {
    viewMode: 'card',
    pageSize: [24, 25],
    pageIndex: [0, 0],
    sort: [{ field: 'name', direction: 'asc' }, { field: 'name', direction: 'asc' }],
  });

  readonly filter: WritableSignal<(q: StSpaceQuota) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SortSpec<StSpaceQuota>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode = this.state.viewMode;
  // basePredicate is ANDed with the nameFilter inside the predicate
  // built by initialize(). The org-page tab uses this to restrict the
  // foundation-wide quota list to the active org.
  readonly basePredicate: WritableSignal<(q: StSpaceQuota) => boolean> = signal(() => true);

  private readonly _spaceQuotas: WritableSignal<StSpaceQuota[]> = signal([]);
  readonly spaceQuotas: Signal<StSpaceQuota[]> = this._spaceQuotas.asReadonly();

  private readonly _hasLoadedOnce: WritableSignal<boolean> = signal(false);
  readonly hasLoadedOnce: Signal<boolean> = this._hasLoadedOnce.asReadonly();

  // True while a load / refresh request is in flight. The toolbar's
  // refresh button reads this to drive its spinner — wiring straight to
  // hasLoadedOnce gave a one-shot spinner on initial load only.
  private readonly _loading: WritableSignal<boolean> = signal(false);
  readonly loading: Signal<boolean> = this._loading.asReadonly();

  private readonly _sortExtractors: WritableSignal<Map<string, (row: StSpaceQuota) => unknown>> = signal(new Map());

  view!: ViewPipeline<StSpaceQuota>;

  initialize(cnsiGuid: string): void {
    this.cnsiGuid = cnsiGuid;
    this.source = new CnsiSpaceQuotasSource(cnsiGuid, this.http);
    this.view = new ViewPipeline<StSpaceQuota>(
      this.spaceQuotas,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );

    runInInjectionContext(this.injector, () => {
      effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        const base = this.basePredicate();
        this.filter.set((quota: StSpaceQuota) => {
          if (!base(quota)) return false;
          if (!q) return true;
          return (quota.name ?? '').toLowerCase().includes(q);
        });
      });
    });
  }

  async loadAll(): Promise<void> {
    if (!this.source) return;
    this._loading.set(true);
    try {
      await this.source.load();
      this._spaceQuotas.set([...this.source.items()]);
      this._hasLoadedOnce.set(true);
    } finally {
      this._loading.set(false);
    }
  }

  async refresh(): Promise<void> {
    if (!this.source) return;
    this._loading.set(true);
    try {
      await this.source.refresh();
      this._spaceQuotas.set([...this.source.items()]);
      this._hasLoadedOnce.set(true);
    } finally {
      this._loading.set(false);
    }
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.sort.set({ field: 'name', direction: 'asc' });
    this.pageIndex.set(0);
  }

  registerSortExtractor(fieldKey: string, extractor: (row: StSpaceQuota) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }
}
