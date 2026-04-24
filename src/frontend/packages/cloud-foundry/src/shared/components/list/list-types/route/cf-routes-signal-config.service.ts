import { DestroyRef, Injectable, Injector, Signal, WritableSignal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { EndpointDataRegistry } from '../../../../../services/endpoint-data/endpoint-data.registry';
import type { EndpointDataService } from '../../../../../services/endpoint-data/endpoint-data.service';
import { ViewPipeline, SortSpec } from '../../../../../services/data-sources/view-pipeline';
import type { StRoute, StRoutesResponse } from '../../../../../services/endpoint-data/stratos-types';
import { writeWithJob } from '../../../../../services/async-jobs/write-with-job';

// Routes list config service — single-CNSI, single-space. Analog of
// CfSpacesSignalConfigService, but routes are not carried on
// EndpointDataService (home-page only caches route COUNT, not the full
// list), so this service owns its own fetch against
// GET /pp/v1/cf/routes/:cnsi and filters down to one space client-side.
//
// Paying to drain every route + every destination on home-page load would
// balloon the route-count card's cost, so the full-drain path is triggered
// lazily, only when a user navigates into a space's Routes tab. Routes in
// other spaces get materialised too (cheap at CAPI scale), then filtered
// before handing to the ViewPipeline.
@Injectable({ providedIn: 'root' })
export class CfRoutesSignalConfigService {
  private readonly http = inject(HttpClient);
  private readonly registry = inject(EndpointDataRegistry);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  private endpointDataService?: EndpointDataService;
  private cnsiGuid = '';
  private spaceGuid = '';

  readonly filter: WritableSignal<(route: StRoute) => boolean> = signal(() => true);
  readonly sort: WritableSignal<SortSpec<StRoute>> = signal({ field: 'url', direction: 'asc' });
  readonly pageSize: WritableSignal<number> = signal(25);
  readonly pageIndex: WritableSignal<number> = signal(0);
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode: WritableSignal<'table' | 'card'> = signal('card');

  // Raw route list as returned by the backend for this CNSI. We keep the
  // unfiltered list in the writable signal and project the space-filtered
  // view via a computed — symmetric with how CfSpacesSignalConfigService
  // narrows per-CNSI spaces down to one org.
  private readonly _allRoutes: WritableSignal<StRoute[]> = signal([]);

  readonly routes: Signal<StRoute[]> = computed(() => {
    return this._allRoutes().filter(r => r.spaceGuid === this.spaceGuid);
  });

  view!: ViewPipeline<StRoute>;

  private readonly _sortExtractors: WritableSignal<Map<string, (row: StRoute) => unknown>> = signal(new Map());

  private readonly _hasLoadedOnce = signal(false);
  readonly hasLoadedOnce: Signal<boolean> = this._hasLoadedOnce.asReadonly();

  initialize(cnsiGuid: string, spaceGuid: string): void {
    this.cnsiGuid = cnsiGuid;
    this.spaceGuid = spaceGuid;
    // Acquire the endpoint-data service so its apps() signal is live —
    // the Route cell's per-app-guid segments lean on apps() to resolve
    // app names.
    this.endpointDataService = this.registry.acquire(cnsiGuid);
    this.view = new ViewPipeline<StRoute>(
      this.routes,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );
    // Kick off the endpoint-data load so apps() populates; swallow errors
    // since a route list without app name lookups still renders (GUIDs
    // resolve to '—').
    void firstValueFrom(this.endpointDataService.loadDetails()).catch((): void => undefined);
    // Fetch the route list itself; errors here do surface because without
    // them the page has nothing to show.
    void this.fetchRoutes();
    runInInjectionContext(this.injector, () => {
      effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        this.filter.set((r: StRoute) => {
          if (!q) return true;
          return (r.url ?? '').toLowerCase().includes(q);
        });
      });
    });
    this.destroyRef.onDestroy(() => {
      this.registry.release(cnsiGuid);
    });
  }

  // Access to the endpoint-data service's apps signal so the component can
  // resolve app-guid → app-name for the Route cell segments.
  get endpointData(): EndpointDataService | undefined {
    return this.endpointDataService;
  }

  private async fetchRoutes(): Promise<void> {
    try {
      const resp = await firstValueFrom(
        this.http.get<StRoutesResponse>(`/pp/v1/cf/routes/${this.cnsiGuid}`),
      );
      this._allRoutes.set(resp?.resources ?? []);
      this._hasLoadedOnce.set(true);
    } catch {
      // Swallow — errors surface via the list's generic error UI if wired;
      // we still flip hasLoadedOnce so the empty state renders instead of
      // a forever-loading spinner.
      this._hasLoadedOnce.set(true);
    }
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.sort.set({ field: 'url', direction: 'asc' });
    this.pageIndex.set(0);
  }

  async refresh(): Promise<void> {
    await this.fetchRoutes();
    // Also refresh apps so recently-mapped routes pick up new names.
    if (this.endpointDataService) {
      try {
        await firstValueFrom(this.endpointDataService.loadDetails());
      } catch {
        // As above — StError surfacing owns user-visible messaging.
      }
    }
  }

  registerSortExtractor(fieldKey: string, extractor: (row: StRoute) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }

  async deleteRoute(cnsiGuid: string, routeGuid: string): Promise<void> {
    const call = this.http.delete(`/pp/v1/cf/routes/${cnsiGuid}/${routeGuid}`, { observe: 'response' });
    await writeWithJob(this.http, call);
    await this.refresh();
  }
}
