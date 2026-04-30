import { DestroyRef, Injectable, Injector, Signal, WritableSignal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ListStateStore } from '@stratosui/core';
import { EndpointDataRegistry } from '../../../../../services/endpoint-data/endpoint-data.registry';
import type { EndpointDataService } from '../../../../../services/endpoint-data/endpoint-data.service';
import { ViewPipeline, SortSpec } from '../../../../../services/data-sources/view-pipeline';
import type { StOrg, StSpace } from '../../../../../services/endpoint-data/stratos-types';
import { writeWithJob } from '../../../../../services/async-jobs/write-with-job';

// Orgs list config service — single-CNSI analog to CfAppsSignalConfigService.
// Unlike apps, the orgs view always lives under an explicit /cloud-foundry/:cnsi
// route, so there's no multi-endpoint merge: one EndpointDataService acts as
// the source, and ViewPipeline provides the same filter / sort / paging
// machinery the app-wall relies on.
@Injectable({ providedIn: 'root' })
export class CfOrgsSignalConfigService {
  private readonly http = inject(HttpClient);
  private readonly registry = inject(EndpointDataRegistry);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  // Wrapped in a signal so the `orgs` / `spaces` computeds re-run when the
  // active CNSI swaps. With a plain field the computeds tracked only the
  // *first* endpoint's `orgs()` signal as a dependency, so navigating from
  // claudesim → cf left the orgs list (and the row keys derived from
  // `o.cnsiGuid`) pointing at the previous endpoint — making favorite-star
  // matching fall through with the wrong page-context guid.
  private endpointDataService: WritableSignal<EndpointDataService | undefined> = signal(undefined);
  private cnsiGuid = '';

  private readonly state = inject(ListStateStore).bind('cf-orgs', {
    viewMode: 'card',
    pageSize: [24, 25],
    pageIndex: [0, 0],
    sort: [{ field: 'name', direction: 'asc' }, { field: 'name', direction: 'asc' }],
  });

  // Filter / sort / paging state, mirroring the app-wall service. Sort
  // defaults to name ascending; filter starts empty (shows everything).
  readonly filter: WritableSignal<(org: StOrg) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SortSpec<StOrg>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode = this.state.viewMode;

  // Lazy per-CNSI space list; used to count spaces per org for the Spaces column.
  // The endpoint-data service loads spaces in the background; before that
  // finishes we show an em-dash placeholder to avoid an inaccurate "0".
  readonly spaces: Signal<StSpace[]> = computed(() => this.endpointDataService()?.spaces() ?? []);
  readonly spaceCountByOrgGuid: Signal<Map<string, number>> = computed(() => {
    const map = new Map<string, number>();
    for (const s of this.spaces()) {
      map.set(s.orgGuid, (map.get(s.orgGuid) ?? 0) + 1);
    }
    return map;
  });

  // Raw org list driving the view pipeline. Empty when initialize() hasn't
  // been called yet or the endpoint-data service hasn't finished the
  // counts + details cascade.
  readonly orgs: Signal<StOrg[]> = computed(() => this.endpointDataService()?.orgs() ?? []);

  // Default view pipeline. Populated by initialize(); before that the
  // signal-list config reads this.view directly, so it must exist even
  // in the zero-endpoint state — a no-op pipeline is cheaper than guards
  // at every call site.
  view!: ViewPipeline<StOrg>;

  // Sort-extractor map for columns whose sort key doesn't map to a direct
  // property on StOrg (e.g. the Spaces column, which composes over the
  // space lookup). Populated via registerSortExtractor from the component.
  private readonly _sortExtractors: WritableSignal<Map<string, (row: StOrg) => unknown>> = signal(new Map());

  // Flipped once the per-CNSI endpoint-data service has completed at least
  // one details load — lets the UI tell "still loading" apart from
  // "loaded, truly empty" the same way the app-wall does.
  private readonly _hasLoadedOnce = signal(false);
  readonly hasLoadedOnce: Signal<boolean> = this._hasLoadedOnce.asReadonly();

  initialize(cnsiGuid: string): void {
    this.cnsiGuid = cnsiGuid;
    const ds = this.registry.acquire(cnsiGuid);
    this.endpointDataService.set(ds);
    // Build the view pipeline over the orgs signal; re-filter on filter
    // / sort changes, re-paginate on page changes. ViewPipeline already
    // handles the memoization layers.
    this.view = new ViewPipeline<StOrg>(
      this.orgs,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );
    // Kick off the detail load if it hasn't happened yet. The service
    // guards against duplicate requests internally.
    void firstValueFrom(ds.loadDetails()).catch(() => {
      // Errors surface through the StError stream; the list falls back
      // to whatever counts the card-fast path already populated.
    });
    // Effects need an injection context; initialize() is called from a
    // component's ngOnInit which isn't one. Wrap via the injector
    // captured at service construction.
    runInInjectionContext(this.injector, () => {
      effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        this.filter.set((o: StOrg) => {
          if (!q) return true;
          return (o.name ?? '').toLowerCase().includes(q);
        });
      });
      effect(() => {
        const cur = this.endpointDataService();
        if (!cur) return;
        if (cur.orgs().length > 0) this._hasLoadedOnce.set(true);
      });
    });
    this.destroyRef.onDestroy(() => {
      this.registry.release(cnsiGuid);
    });
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.sort.set({ field: 'name', direction: 'asc' });
    this.pageIndex.set(0);
  }

  async refresh(): Promise<void> {
    const ds = this.endpointDataService();
    if (!ds) return;
    try {
      await firstValueFrom(ds.loadDetails());
    } catch {
      // loadDetails() surfaces errors via its own StError stream; swallowing
      // here keeps the Refresh button's promise from rejecting the caller.
    }
  }

  registerSortExtractor(fieldKey: string, extractor: (row: StOrg) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }

  // Delete an org via the CF V3 async-job contract. The backend handler
  // (DELETE /pp/v1/cf/orgs/:cnsi/:orgGuid) mirrors the app-delete shape —
  // 202 + Location from CF, fast-path 200 from Stratos, or job handoff
  // with polling via writeWithJob.
  async deleteOrg(cnsiGuid: string, orgGuid: string): Promise<void> {
    const call = this.http.delete(`/pp/v1/cf/orgs/${cnsiGuid}/${orgGuid}`, { observe: 'response' });
    await writeWithJob(this.http, call);
    await this.refresh();
  }
}
