import { Injectable, Injector, Signal, WritableSignal, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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

  readonly filter: WritableSignal<(q: StSpaceQuota) => boolean> = signal(() => true);
  readonly sort: WritableSignal<SortSpec<StSpaceQuota>> = signal({ field: 'name', direction: 'asc' });
  readonly pageSize: WritableSignal<number> = signal(24);
  readonly pageIndex: WritableSignal<number> = signal(0);
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode: WritableSignal<'table' | 'card'> = signal('card');
  // basePredicate is ANDed with the nameFilter inside the predicate
  // built by initialize(). The org-page tab uses this to restrict the
  // foundation-wide quota list to the active org.
  readonly basePredicate: WritableSignal<(q: StSpaceQuota) => boolean> = signal(() => true);

  private readonly _spaceQuotas: WritableSignal<StSpaceQuota[]> = signal([]);
  readonly spaceQuotas: Signal<StSpaceQuota[]> = this._spaceQuotas.asReadonly();

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
    await this.source.load();
    this._spaceQuotas.set([...this.source.items()]);
  }

  async refresh(): Promise<void> {
    if (!this.source) return;
    await this.source.refresh();
    this._spaceQuotas.set([...this.source.items()]);
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
