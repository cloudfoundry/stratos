import { Injectable, Injector, Signal, WritableSignal, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { ListStateStore } from '@stratosui/core';

import { ViewPipeline, SortSpec } from '../../../../../services/data-sources/view-pipeline';
import type { StSpace } from '../../../../../services/endpoint-data/stratos-types';
import { writeWithJob } from '../../../../../services/async-jobs/write-with-job';

/**
 * Wire shape of /pp/v1/cf/org/{cnsi}/{org}/spaces. Mirrors
 * StratosPagedResponse<StSpace> from native_handlers.go.
 */
interface PagedSpaces {
  resources: StSpace[];
  pagination: {
    totalResults: number;
    totalPages: number;
  };
}

// Spaces list config service — single-CNSI, single-org. Fetches directly
// from the org-scoped Jetstream endpoint
// `/pp/v1/cf/org/{cnsi}/{org}/spaces` instead of reading the per-CNSI
// `endpointDataService.spaces()` cache.
//
// The per-CNSI cache is populated by `loadDetails()` with a single
// `?per_page=500&page=1` request — fine for small foundations, but on
// adepttech (~2500 spaces across 6 pages) any space on page 2..N is
// silently dropped, making this list show "0 of 0" for orgs whose
// spaces happen to fall later in alphabetical order. The per-org
// endpoint sidesteps the issue: the filter `organization_guids={org}`
// runs on CAPI, so we only retrieve the spaces that actually belong to
// this org. For most orgs that's a single page of <50 rows; the page-2+
// drain handles the unusual case where a single org has 200+ spaces.
@Injectable({ providedIn: 'root' })
export class CfSpacesSignalConfigService {
  private readonly http = inject(HttpClient);
  private readonly injector = inject(Injector);

  private cnsiGuid = '';
  private orgGuid = '';
  /** Concurrent fetch token; ignore late page-2+ responses if a newer
   *  fetch (e.g. after navigating between orgs) has started. */
  private fetchEpoch = 0;

  private readonly state = inject(ListStateStore).bind('cf-spaces', {
    viewMode: 'card',
    pageSize: [24, 25],
    pageIndex: [0, 0],
    sort: [{ field: 'name', direction: 'asc' }, { field: 'name', direction: 'asc' }],
  });

  readonly filter: WritableSignal<(space: StSpace) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SortSpec<StSpace>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode = this.state.viewMode;

  /** All spaces for the active org. Populated by fetchOrgSpaces(); the
   *  ViewPipeline reads this signal as its source. */
  private readonly _orgSpaces: WritableSignal<StSpace[]> = signal([]);
  readonly spaces: Signal<StSpace[]> = this._orgSpaces.asReadonly();

  view!: ViewPipeline<StSpace>;

  private readonly _sortExtractors: WritableSignal<Map<string, (row: StSpace) => unknown>> = signal(new Map());

  private readonly _hasLoadedOnce = signal(false);
  readonly hasLoadedOnce: Signal<boolean> = this._hasLoadedOnce.asReadonly();

  initialize(cnsiGuid: string, orgGuid: string): void {
    // If the active scope is changing (revisiting the page for a different
    // org under the same singleton), drop the previous payload so the
    // table doesn't flash stale rows for the wrong org while the fetch
    // is in flight.
    if (cnsiGuid !== this.cnsiGuid || orgGuid !== this.orgGuid) {
      this._orgSpaces.set([]);
      this._hasLoadedOnce.set(false);
    }
    this.cnsiGuid = cnsiGuid;
    this.orgGuid = orgGuid;
    this.view = new ViewPipeline<StSpace>(
      this.spaces,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );
    void this.fetchOrgSpaces();
    runInInjectionContext(this.injector, () => {
      effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        this.filter.set((s: StSpace) => {
          if (!q) return true;
          return (s.name ?? '').toLowerCase().includes(q);
        });
      });
    });
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.sort.set({ field: 'name', direction: 'asc' });
    this.pageIndex.set(0);
  }

  async refresh(): Promise<void> {
    await this.fetchOrgSpaces();
  }

  registerSortExtractor(fieldKey: string, extractor: (row: StSpace) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }

  async deleteSpace(cnsiGuid: string, spaceGuid: string): Promise<void> {
    const call = this.http.delete(`/pp/v1/cf/spaces/${cnsiGuid}/${spaceGuid}`, { observe: 'response' });
    await writeWithJob(this.http, call);
    await this.refresh();
  }

  /**
   * Drain `/pp/v1/cf/org/{cnsi}/{org}/spaces` into `_orgSpaces`. Page 1
   * runs first to learn `totalPages`; pages 2..N fan out in parallel.
   *
   * Per-page cap is 500 (the limit applyPagingParams accepts on the
   * Jetstream side). For typical orgs, the totalPages is 1 — the
   * page-2 fan-out only runs in unusual cases.
   */
  private async fetchOrgSpaces(): Promise<void> {
    if (!this.cnsiGuid || !this.orgGuid) return;
    const epoch = ++this.fetchEpoch;
    const perPage = 500;
    const url = (page: number) =>
      `/pp/v1/cf/org/${this.cnsiGuid}/${this.orgGuid}/spaces?per_page=${perPage}&page=${page}`;
    try {
      const first = await firstValueFrom(this.http.get<PagedSpaces>(url(1)));
      if (epoch !== this.fetchEpoch) return; // superseded; drop result
      const out = [...(first.resources ?? [])];
      const totalPages = first.pagination?.totalPages ?? 1;
      if (totalPages > 1) {
        const reqs: Promise<PagedSpaces>[] = [];
        for (let p = 2; p <= totalPages; p++) {
          reqs.push(firstValueFrom(this.http.get<PagedSpaces>(url(p))));
        }
        const rest = await Promise.all(reqs);
        if (epoch !== this.fetchEpoch) return;
        for (const r of rest) {
          if (r?.resources) out.push(...r.resources);
        }
      }
      // cnsiGuid is needed by SignalListColumn.favorite (key uses
      // `${cnsiGuid}:${guid}`). Backend now echoes it on every StSpace
      // row, so the wire payload is self-describing — no stamping needed.
      this._orgSpaces.set(out);
      this._hasLoadedOnce.set(true);
    } catch {
      // Swallow — the empty list and "no spaces" message communicate the
      // failure. A future enhancement could surface a StError; for now
      // the symptom is identical to a legitimately empty org and the
      // Refresh button retries.
      if (epoch === this.fetchEpoch) {
        this._hasLoadedOnce.set(true);
      }
    }
  }
}
