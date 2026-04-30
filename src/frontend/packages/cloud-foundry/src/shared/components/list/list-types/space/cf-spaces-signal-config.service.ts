import { DestroyRef, Injectable, Injector, Signal, WritableSignal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { ListStateStore } from '@stratosui/core';

import { EndpointDataRegistry } from '../../../../../services/endpoint-data/endpoint-data.registry';
import type { EndpointDataService } from '../../../../../services/endpoint-data/endpoint-data.service';
import { ViewPipeline, SortSpec } from '../../../../../services/data-sources/view-pipeline';
import type { StApp, StSpace } from '../../../../../services/endpoint-data/stratos-types';
import { writeWithJob } from '../../../../../services/async-jobs/write-with-job';

// Spaces list config service — single-CNSI, single-org. Analog of
// CfOrgsSignalConfigService; reuses the same EndpointDataService bridge
// and the same ViewPipeline machinery. Filters the full per-CNSI space
// list down to one org at the source level so the ViewPipeline doesn't
// have to carry the whole org's worth of rows.
@Injectable({ providedIn: 'root' })
export class CfSpacesSignalConfigService {
  private readonly http = inject(HttpClient);
  private readonly registry = inject(EndpointDataRegistry);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  // Wrapped in a signal so the spaces / appCountBySpaceGuid computeds re-run
  // when the active CNSI changes — see cf-orgs-signal-config.service.ts for
  // the full leak explanation (cross-endpoint stale orgs/spaces showing on
  // the wrong page).
  private endpointDataService: WritableSignal<EndpointDataService | undefined> = signal(undefined);
  private cnsiGuid = '';
  private orgGuid = '';

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

  // Narrow the per-CNSI spaces list to this org. Computed so it re-runs
  // automatically when the endpoint-data service's spaces() signal
  // refreshes (after a loadDetails() pass or a delete-then-refresh).
  readonly spaces: Signal<StSpace[]> = computed(() => {
    const all = this.endpointDataService()?.spaces() ?? [];
    return all.filter(s => s.orgGuid === this.orgGuid);
  });

  // App count per space (for the Apps column). Reuses the EndpointDataService's
  // apps signal — the same bridge that the app-wall leans on.
  readonly appCountBySpaceGuid: Signal<Map<string, number>> = computed(() => {
    const all: StApp[] = this.endpointDataService()?.apps() ?? [];
    const map = new Map<string, number>();
    for (const a of all) {
      if (!a.spaceGuid) continue;
      map.set(a.spaceGuid, (map.get(a.spaceGuid) ?? 0) + 1);
    }
    return map;
  });

  view!: ViewPipeline<StSpace>;

  private readonly _sortExtractors: WritableSignal<Map<string, (row: StSpace) => unknown>> = signal(new Map());

  private readonly _hasLoadedOnce = signal(false);
  readonly hasLoadedOnce: Signal<boolean> = this._hasLoadedOnce.asReadonly();

  initialize(cnsiGuid: string, orgGuid: string): void {
    this.cnsiGuid = cnsiGuid;
    this.orgGuid = orgGuid;
    const ds = this.registry.acquire(cnsiGuid);
    this.endpointDataService.set(ds);
    this.view = new ViewPipeline<StSpace>(
      this.spaces,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );
    void firstValueFrom(ds.loadDetails()).catch((): void => undefined);
    runInInjectionContext(this.injector, () => {
      effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        this.filter.set((s: StSpace) => {
          if (!q) return true;
          return (s.name ?? '').toLowerCase().includes(q);
        });
      });
      effect(() => {
        const cur = this.endpointDataService();
        if (!cur) return;
        if (cur.spaces().length > 0) this._hasLoadedOnce.set(true);
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
      // Errors surface via StError; swallow to keep the Refresh button's
      // promise clean.
    }
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
}
