import { EffectRef, Injectable, Injector, Signal, WritableSignal, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { ListStateStore } from '@stratosui/core';

import { CnsiOrgQuotasSource } from '../../../services/data-sources/cnsi-org-quotas-source';
import { writeWithJob } from '../../../services/async-jobs/write-with-job';
import { ViewPipeline, SortSpec } from '../../../services/data-sources/view-pipeline';
import { QuotaDataService } from '../../../services/endpoint-data/quota-data.service';
import type { StOrgQuota } from '../../../services/endpoint-data/stratos-types';

// CF Org Quotas list config — single-CNSI, read-only. Drives the
// per-CF /cloud-foundry/:cnsi/quotas-definitions tab (Org Quotas tab on
// the foundation overview). Quotas are foundation-level and few in
// number; this service stays simple: own the fetch, expose an
// orgQuotas() signal, run it through ViewPipeline. No writes — quota
// CRUD and apply-to-org are platform-admin operations not surfaced.
@Injectable({ providedIn: 'root' })
export class CfOrgQuotasSignalConfigService {
  private readonly http = inject(HttpClient);
  private readonly injector = inject(Injector);
  private readonly quotaData = inject(QuotaDataService);

  private cnsiGuid = '';
  private source?: CnsiOrgQuotasSource;

  private readonly state = inject(ListStateStore).bind('cf-org-quotas', {
    viewMode: 'card',
    pageSize: [24, 25],
    pageIndex: [0, 0],
    sort: [{ field: 'name', direction: 'asc' }, { field: 'name', direction: 'asc' }],
  });

  readonly filter: WritableSignal<(q: StOrgQuota) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SortSpec<StOrgQuota>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode = this.state.viewMode;

  private readonly _orgQuotas: WritableSignal<StOrgQuota[]> = signal([]);
  readonly orgQuotas: Signal<StOrgQuota[]> = this._orgQuotas.asReadonly();

  private readonly _hasLoadedOnce: WritableSignal<boolean> = signal(false);
  readonly hasLoadedOnce: Signal<boolean> = this._hasLoadedOnce.asReadonly();

  // True while a load / refresh request is in flight. The toolbar's
  // refresh button reads this to drive its spinner — wiring straight to
  // hasLoadedOnce gave a one-shot spinner on initial load only.
  private readonly _loading: WritableSignal<boolean> = signal(false);
  readonly loading: Signal<boolean> = this._loading.asReadonly();

  private readonly _sortExtractors: WritableSignal<Map<string, (row: StOrgQuota) => unknown>> = signal(new Map());

  view!: ViewPipeline<StOrgQuota>;

  // Captured so a re-entry (root singleton, but initialize() runs per mount)
  // destroys the prior filter effect instead of stacking one per navigation.
  private filterEffect?: EffectRef;

  initialize(cnsiGuid: string): void {
    this.cnsiGuid = cnsiGuid;
    this.source = new CnsiOrgQuotasSource(cnsiGuid, this.http);
    this.view = new ViewPipeline<StOrgQuota>(
      this.orgQuotas,
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
        this.filter.set((quota: StOrgQuota) => {
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
      this._orgQuotas.set([...this.source.items()]);
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
      this._orgQuotas.set([...this.source.items()]);
      this._hasLoadedOnce.set(true);
    } finally {
      this._loading.set(false);
    }
  }

  // Per-row delete from the CF Quotas tab kebab. CF returns 422 if any
  // orgs still reference the quota — the consumer side surfaces the
  // error to the snackbar without doing a pre-check here. CF v3 quota
  // deletes are async (202 + job): writeWithJob rides the backend's
  // fast-path 200 or polls the handed-off job to terminal, so the
  // refresh below never races a still-running delete.
  async deleteQuota(cnsiGuid: string, quotaGuid: string): Promise<void> {
    await writeWithJob(this.http, this.quotaData.deleteOrgQuota(cnsiGuid, quotaGuid));
    await this.refresh();
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.sort.set({ field: 'name', direction: 'asc' });
    this.pageIndex.set(0);
  }

  registerSortExtractor(fieldKey: string, extractor: (row: StOrgQuota) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }
}
