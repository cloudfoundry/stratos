import { DestroyRef, Injectable, Injector, Signal, WritableSignal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { SignalListDropdownOption } from '@stratosui/core';
import { ListStateStore, naturalCompare } from '@stratosui/core';
import { EndpointDataRegistry } from '../../../../../services/endpoint-data/endpoint-data.registry';
import type { EndpointDataService } from '../../../../../services/endpoint-data/endpoint-data.service';
import { ViewPipeline, SortSpec } from '../../../../../services/data-sources/view-pipeline';
import { CnsiRoutesSource } from '../../../../../services/data-sources/cnsi-routes-source';
import type { StRoute, StRoutesResponse } from '../../../../../services/endpoint-data/stratos-types';

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
  // Empty string = show all routes for the CNSI (the CF-level Routes tab).
  // Non-empty = narrow to that space only (the per-space Routes tab).
  private spaceGuid = '';

  private readonly state = inject(ListStateStore).bind('cf-routes', {
    viewMode: 'card',
    pageSize: [6, 25],
    pageIndex: [0, 0],
    sort: [{ field: 'url', direction: 'asc' }, { field: 'url', direction: 'asc' }],
  });

  readonly filter: WritableSignal<(route: StRoute) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SortSpec<StRoute>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly nameFilter: WritableSignal<string> = signal('');
  // Org / Space filters — used by the CF-level routes page where routes
  // across every org show up; null = no constraint. The per-space page
  // doesn't populate either (it's already scoped via spaceGuid).
  // Selecting an org constrains the Space dropdown to spaces in that org.
  readonly selectedOrg: WritableSignal<string | null> = signal(null);
  readonly selectedSpace: WritableSignal<string | null> = signal(null);
  readonly viewMode = this.state.viewMode;

  // Raw route list as returned by the backend for this CNSI. We keep the
  // unfiltered list in the writable signal and project the space-filtered
  // view via a computed — symmetric with how CfSpacesSignalConfigService
  // narrows per-CNSI spaces down to one org.
  private readonly _allRoutes: WritableSignal<StRoute[]> = signal([]);

  readonly routes: Signal<StRoute[]> = computed(() => {
    const all = this._allRoutes();
    // CF-level page passes no space — show every route in the CNSI.
    if (!this.spaceGuid) return all;
    return all.filter(r => r.spaceGuid === this.spaceGuid);
  });

  view!: ViewPipeline<StRoute>;

  private readonly _sortExtractors: WritableSignal<Map<string, (row: StRoute) => unknown>> = signal(new Map());

  private readonly _hasLoadedOnce = signal(false);
  readonly hasLoadedOnce: Signal<boolean> = this._hasLoadedOnce.asReadonly();

  initialize(cnsiGuid: string, spaceGuid?: string): void {
    this.cnsiGuid = cnsiGuid;
    this.spaceGuid = spaceGuid ?? '';
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
        const org = this.selectedOrg();
        const space = this.selectedSpace();
        // orgGuidBySpaceGuid is a computed reading spaces(); accessing it
        // inside the effect re-registers the dependency so the filter
        // re-derives when spaces load or the user switches orgs.
        const orgGuidBySpaceGuid = this.orgGuidBySpaceGuid();
        this.filter.set((r: StRoute) => {
          if (org && orgGuidBySpaceGuid.get(r.spaceGuid) !== org) return false;
          if (space && r.spaceGuid !== space) return false;
          if (q && !((r.url ?? '').toLowerCase().includes(q))) return false;
          return true;
        });
      });
      // Reset Space when Org changes — the cascade rule. Stale space
      // selections in a now-hidden org would silently filter to empty.
      effect(() => {
        const org = this.selectedOrg();
        const space = this.selectedSpace();
        if (!space) return;
        if (org === null) return;
        const orgGuidBySpaceGuid = this.orgGuidBySpaceGuid();
        if (orgGuidBySpaceGuid.get(space) !== org) {
          this.selectedSpace.set(null);
        }
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

  // spaceGuid → space-name lookup, used by the CF-level routes page to
  // show which space each route lives in without the per-row having to
  // repeat the lookup. Built from EndpointDataService.spaces() so the
  // mapping updates as the home-page parallelization work populates
  // the per-CNSI spaces list.
  readonly spaceNameByGuid: Signal<Map<string, string>> = computed(() => {
    const map = new Map<string, string>();
    const spaces = this.endpointDataService?.spaces() ?? [];
    for (const s of spaces) {
      map.set(s.guid, s.name);
    }
    return map;
  });

  // orgGuid → orgName, keyed off the same spaces signal (each space
  // knows its org and the endpoint-data service tracks the org list
  // independently). The CF-level routes page can render CF/Space/Org
  // context per row via this + spaceNameByGuid.
  readonly orgNameByGuid: Signal<Map<string, string>> = computed(() => {
    const map = new Map<string, string>();
    const orgs = this.endpointDataService?.orgs() ?? [];
    for (const o of orgs) {
      map.set(o.guid, o.name);
    }
    return map;
  });

  // spaceGuid → orgGuid, for composing the space → org link without a
  // second Map lookup at the row level.
  readonly orgGuidBySpaceGuid: Signal<Map<string, string>> = computed(() => {
    const map = new Map<string, string>();
    const spaces = this.endpointDataService?.spaces() ?? [];
    for (const s of spaces) {
      map.set(s.guid, s.orgGuid);
    }
    return map;
  });

  // Org options for the CF-level page's Organization filter dropdown.
  // "All" is prepended as the null-value option. Sorted natural-order
  // (numeric-aware) so "org-2" comes before "org-10".
  readonly orgOptions: Signal<SignalListDropdownOption[]> = computed(() => {
    const orgs = this.endpointDataService?.orgs() ?? [];
    const opts: SignalListDropdownOption[] = [{ label: 'All', value: null }];
    const sorted = [...orgs].sort((a, b) => naturalCompare(a.name, b.name));
    for (const o of sorted) {
      opts.push({ label: o.name, value: o.guid });
    }
    return opts;
  });

  // Space options — cascade-aware.
  // - Org selected: list spaces in that org, label = space name, natural sort.
  // - Org = All: list every space, label = "<space> - <org>", sorted by
  //   space name then org name (both natural-sort). Lets the user pick a
  //   space directly without first narrowing to an org.
  readonly spaceOptions: Signal<SignalListDropdownOption[]> = computed(() => {
    const opts: SignalListDropdownOption[] = [{ label: 'All', value: null }];
    const spaces = this.endpointDataService?.spaces() ?? [];
    const org = this.selectedOrg();
    if (org) {
      const sorted = spaces
        .filter(s => s.orgGuid === org)
        .sort((a, b) => naturalCompare(a.name, b.name));
      for (const s of sorted) opts.push({ label: s.name, value: s.guid });
      return opts;
    }
    const orgNameByGuid = new Map((this.endpointDataService?.orgs() ?? []).map(o => [o.guid, o.name]));
    const augmented = spaces.map(s => ({
      guid: s.guid,
      spaceName: s.name,
      orgName: orgNameByGuid.get(s.orgGuid) ?? '',
    }));
    augmented.sort((a, b) => {
      const bySpace = naturalCompare(a.spaceName, b.spaceName);
      if (bySpace !== 0) return bySpace;
      return naturalCompare(a.orgName, b.orgName);
    });
    for (const s of augmented) opts.push({ label: `${s.spaceName} - ${s.orgName}`, value: s.guid });
    return opts;
  });

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
    this.selectedOrg.set(null);
    this.selectedSpace.set(null);
    this.sort.set({ field: 'url', direction: 'asc' });
    this.pageIndex.set(0);
  }

  async refresh(): Promise<void> {
    await this.fetchRoutes();
    // Also refresh apps so recently-mapped routes pick up new names.
    // refreshApps() bypasses the cache guard — user-driven refresh always
    // re-fetches.
    if (this.endpointDataService) {
      try {
        await firstValueFrom(this.endpointDataService.refreshApps());
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
    const eds = this.registry.acquire(cnsiGuid);
    const source = new CnsiRoutesSource(cnsiGuid, this.http, eds);
    await source.delete(routeGuid);
    // The local _routes list lives on this config service (via fetchRoutes),
    // not the source — the source's _items is discarded. Re-fetch the list
    // so the just-deleted row leaves the view. The applyCascade in delete()
    // also marks apps stale for the cross-tab UX.
    await this.fetchRoutes();
  }
}
