import { DestroyRef, Injectable, Injector, Signal, WritableSignal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { EndpointModel } from '@stratosui/store';
import { CnsiAppsSource } from '../../../../../services/data-sources/cnsi-apps-source';
import { MergeOrchestrator } from '../../../../../services/data-sources/merge-orchestrator';
import { ViewPipeline, SortSpec } from '../../../../../services/data-sources/view-pipeline';
import type { StApp, StAppRoutesResponse, StAppServiceBindingsResponse, StOrg, StOrgsResponse, StRoute, StServiceBinding, StSpace, StSpacesResponse } from '../../../../../services/endpoint-data/stratos-types';
import { CloudFoundryService } from '../../../../data-services/cloud-foundry.service';
import { writeWithJob } from '../../../../../services/async-jobs/write-with-job';
import type { SignalListDropdownOption, SignalListViewMode } from '@stratosui/core';

@Injectable({ providedIn: 'root' })
export class CfAppsSignalConfigService {
  orchestrator!: MergeOrchestrator<StApp>;
  view!: ViewPipeline<StApp>;

  // User-controlled filter / sort / pagination state.
  readonly filter: WritableSignal<(app: StApp) => boolean> = signal(() => true);
  readonly sort: WritableSignal<SortSpec<StApp>> = signal({ field: 'name', direction: 'asc' });
  readonly pageSize: WritableSignal<number> = signal(25);
  readonly pageIndex: WritableSignal<number> = signal(0);
  // Map of sort-field key → value-extractor function, for columns whose
  // sort value is derived from multiple entity properties (e.g., the
  // CF/Org/Space column that renders cnsi + org + space together). The
  // component populates this via registerSortExtractor() after building
  // its column config; ViewPipeline reads it through the signal passed
  // into its constructor.
  private readonly _sortExtractors: WritableSignal<Map<string, (row: StApp) => unknown>> = signal(new Map());

  // Toolbar filter inputs. `null` for dropdowns = "All" (no constraint);
  // empty string for nameFilter = no name constraint.
  readonly selectedCnsi:  WritableSignal<string | null> = signal(null);
  readonly selectedOrg:   WritableSignal<string | null> = signal(null);
  readonly selectedSpace: WritableSignal<string | null> = signal(null);
  readonly nameFilter:    WritableSignal<string>        = signal('');
  // Which column the text filter compares against. Starts on 'name' —
  // matches the pre-selector behavior. The app wall registers extractors
  // for each filterable column and populates filterColumns in its
  // SignalListConfig so the UI renders a selector.
  readonly filterField:   WritableSignal<string>        = signal('name');
  // Map of filter-field key → string extractor. Mirrors the sort
  // extractor pattern: the app wall populates this after the column
  // config is built. Missing keys fall back to the app's `name` field
  // so the filter still does SOMETHING sensible if the caller mis-wires.
  private readonly _filterExtractors: WritableSignal<Map<string, (row: StApp) => string>> = signal(new Map());

  // Per-instance stats summary, keyed by rowKey (${cnsiGuid}:${appGuid}).
  // Populated lazily for apps currently on the page by refreshStatsForKeys;
  // the app-wall Instances column reads this signal to render "running /
  // desired" instead of the plain desired count. Apps not yet fetched
  // render as "— / desired" (dash reuses the em-dash convention used for
  // unresolved CF/Org/Space lookups). A short polling interval keeps
  // starting/crashed instances visually fresh without flooding the
  // backend.
  private readonly _appStats: WritableSignal<Map<string, { running: number; total: number }>> =
    signal(new Map());
  readonly appStats: Signal<Map<string, { running: number; total: number }>> =
    computed(() => this._appStats());
  private statsTimer?: ReturnType<typeof setInterval>;
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  // View mode (table / card). Default mirrors the legacy Stratos app wall.
  readonly viewMode: WritableSignal<SignalListViewMode> = signal('table');

  // Bridge connected-CF endpoints (an rxjs Observable) into a signal so
  // computed() can read it. CloudFoundryService is optional purely because
  // tests exist that don't provide it; in the real app it's always present.
  private readonly connectedEndpoints: Signal<EndpointModel[]>;

  // Per-CNSI org/space catalogs. Keyed by cnsi guid, value is the list
  // of orgs/spaces returned by /pp/v1/cf/orgs/{cnsi} and /pp/v1/cf/spaces/{cnsi}
  // from initialize(). Drives the toolbar dropdowns: an org/space is listed
  // because it exists in the CF, not because the loaded apps happen to
  // reference it — so users can still filter by an org they just emptied
  // (e.g. after deleting its last app), and the "no applications" result
  // is the expected visual cue.
  private readonly _orgsByCnsi = signal<Map<string, StOrg[]>>(new Map());
  private readonly _spacesByCnsi = signal<Map<string, StSpace[]>>(new Map());
  // Flattened guid → name lookups derived from the per-CNSI catalogs.
  // Consumers like the app-wall CF/Org/Space column read these directly
  // and don't need to know which CF a particular guid came from.
  readonly orgNames: Signal<Map<string, string>>;
  readonly spaceNames: Signal<Map<string, string>>;
  // endpoint guid → endpoint name, derived from the connected endpoints list.
  readonly endpointNames: Signal<Map<string, string>>;

  // Computed option lists for the toolbar dropdowns.
  readonly cnsiOptions:  Signal<SignalListDropdownOption[]>;
  readonly orgOptions:   Signal<SignalListDropdownOption[]>;
  readonly spaceOptions: Signal<SignalListDropdownOption[]>;

  // Flipped to true once the orchestrator has completed at least one load
  // cycle. Gates the stale-selection clearer below: while apps are still
  // loading the first time, orgOptions/spaceOptions are legitimately empty
  // and don't yet reflect "this selection is gone".
  private readonly _hasLoadedOnce: WritableSignal<boolean> = signal(false);

  constructor(private readonly http: HttpClient) {
    const cfService = inject(CloudFoundryService, { optional: true });
    this.connectedEndpoints = cfService
      ? toSignal(cfService.connectedCFEndpoints$, { initialValue: [] as EndpointModel[] })
      : signal<EndpointModel[]>([]).asReadonly();

    // CF options come from the connected endpoints list directly.
    this.cnsiOptions = computed(() => {
      const opts: SignalListDropdownOption[] = [{ label: 'All', value: null }];
      for (const ep of this.connectedEndpoints() ?? []) {
        opts.push({ label: ep.name ?? ep.guid, value: ep.guid });
      }
      return opts;
    });

    // Endpoint guid → name, for rendering cnsi references as names
    // (e.g., in the app-wall CF/Org/Space column).
    this.endpointNames = computed(() => {
      const m = new Map<string, string>();
      for (const ep of this.connectedEndpoints() ?? []) {
        if (ep.name) m.set(ep.guid, ep.name);
      }
      return m;
    });

    // Flatten the per-CNSI catalog signals into global guid → name maps
    // for downstream consumers (e.g., app-wall CF/Org/Space column).
    this.orgNames = computed(() => {
      const m = new Map<string, string>();
      for (const orgs of this._orgsByCnsi().values()) {
        for (const o of orgs) m.set(o.guid, o.name);
      }
      return m;
    });
    this.spaceNames = computed(() => {
      const m = new Map<string, string>();
      for (const spaces of this._spacesByCnsi().values()) {
        for (const s of spaces) m.set(s.guid, s.name);
      }
      return m;
    });

    // Org options come from the per-CF /pp/v1/cf/orgs catalog, scoped
    // by the selected CF (or union across all CFs when None). Listing
    // from the catalog — not from loaded apps — keeps an org in the
    // dropdown even when it currently holds zero apps. That preserves
    // the user's org filter across navigations that may empty the org
    // (e.g., deleting its last app), and lets them continue filtering
    // to see the "no applications" cue.
    this.orgOptions = computed(() => {
      const cnsi = this.selectedCnsi();
      const byCnsi = this._orgsByCnsi();
      const seen = new Map<string, string>();
      const sources = cnsi ? [byCnsi.get(cnsi) ?? []] : Array.from(byCnsi.values());
      for (const orgs of sources) {
        for (const o of orgs) {
          if (!seen.has(o.guid)) seen.set(o.guid, o.name);
        }
      }
      const opts: SignalListDropdownOption[] = [{ label: 'All', value: null }];
      const sorted = Array.from(seen.entries()).sort(([, a], [, b]) => a.localeCompare(b));
      for (const [guid, label] of sorted) opts.push({ label, value: guid });
      return opts;
    });

    // Space options are scoped to the selected CF and, when set, the
    // selected org. StSpace carries orgGuid so we can filter from the
    // catalog without needing an app to exist in the space.
    this.spaceOptions = computed(() => {
      const cnsi = this.selectedCnsi();
      const org = this.selectedOrg();
      const byCnsi = this._spacesByCnsi();
      const seen = new Map<string, string>();
      const sources = cnsi ? [byCnsi.get(cnsi) ?? []] : Array.from(byCnsi.values());
      for (const spaces of sources) {
        for (const s of spaces) {
          if (org && s.orgGuid !== org) continue;
          if (!seen.has(s.guid)) seen.set(s.guid, s.name);
        }
      }
      const opts: SignalListDropdownOption[] = [{ label: 'All', value: null }];
      const sorted = Array.from(seen.entries()).sort(([, a], [, b]) => a.localeCompare(b));
      for (const [guid, label] of sorted) opts.push({ label, value: guid });
      return opts;
    });

    // After the first orchestrator load, clear any selected cnsi/org/space
    // whose value is no longer in the computed options list. This keeps the
    // toolbar display in sync with the filter predicate: once the user
    // deletes the last app in an org (or disconnects the only CF matching
    // the selection), the dropdown can't render the stale value as selected
    // and would silently show "All" while still filtering — producing the
    // "display says All, list says 0 apps" desync.
    //
    // Skip clearing org/space when the selected CF's apps source failed
    // (e.g. /pp/v1/cf/apps/{cnsi} 504'd on a slow CAPI). Its orgOptions is
    // empty because no apps loaded, not because the org is genuinely empty
    // — clearing would lose a valid selection the user will want back as
    // soon as the refresh succeeds. cnsiOptions itself is always authoritative
    // (derived from the connected endpoints list, not the orchestrator).
    effect(() => {
      if (!this._hasLoadedOnce()) return;
      const errorsByCnsi = this.orchestrator?.errorsByCnsi();
      const cnsiValues = new Set(this.cnsiOptions().map(o => o.value));
      const orgValues = new Set(this.orgOptions().map(o => o.value));
      const spaceValues = new Set(this.spaceOptions().map(o => o.value));
      const cnsi = this.selectedCnsi();
      const org = this.selectedOrg();
      const space = this.selectedSpace();
      if (cnsi != null && !cnsiValues.has(cnsi)) this.selectedCnsi.set(null);
      const selectedCfFailed = cnsi != null && errorsByCnsi?.has(cnsi);
      if (!selectedCfFailed) {
        if (org != null && !orgValues.has(org)) this.selectedOrg.set(null);
        if (space != null && !spaceValues.has(space)) this.selectedSpace.set(null);
      }
    });

    // Re-derive the filter predicate whenever any of the four toolbar
    // signals change. Writing a brand new function to `this.filter`
    // triggers ViewPipeline.filteredItems to recompute. effect() needs an
    // injection context; @Injectable({providedIn:'root'}) supplies one at
    // construction time.
    effect(() => {
      const cnsi = this.selectedCnsi();
      const org = this.selectedOrg();
      const space = this.selectedSpace();
      const q = this.nameFilter().trim().toLowerCase();
      const field = this.filterField();
      const extractors = this._filterExtractors();
      const extractor = extractors.get(field);
      this.filter.set((app: StApp) => {
        if (cnsi && app.cnsiGuid !== cnsi) return false;
        if (org && app.orgGuid !== org) return false;
        if (space && app.spaceGuid !== space) return false;
        if (q) {
          const hay = (extractor ? extractor(app) : (app.name ?? '')).toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
    });
  }

  initialize(cnsiGuids: readonly string[]): void {
    // Reset hasLoadedOnce so the stale-selection effect is gated off while
    // the new orchestrator reloads. Without this, returning from a detail
    // page (e.g. after deleting an app) would see orgOptions momentarily
    // empty, decide the user's still-valid selection is stale, and clear
    // it — losing the filter across navigation. The effect re-fires once
    // loadAll() completes and options are real.
    this._hasLoadedOnce.set(false);
    const sources = cnsiGuids.map(guid => new CnsiAppsSource(guid, this.http));
    this.orchestrator = new MergeOrchestrator<StApp>(sources);
    this.view = new ViewPipeline<StApp>(
      this.orchestrator.allItems,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );
    // Fire-and-forget org/space name resolution. Populates the lookup maps
    // that orgOptions/spaceOptions read for their labels. Failures per CF
    // are swallowed — if an endpoint is unreachable the dropdown falls back
    // to guid for that CF's items, which is preferable to blocking the
    // whole app-wall on a slow or broken CF.
    void this.loadNames(cnsiGuids);
  }

  private async loadNames(cnsiGuids: readonly string[]): Promise<void> {
    const fetchOrgs = (guid: string) =>
      firstValueFrom(this.http.get<StOrgsResponse>(`/pp/v1/cf/orgs/${guid}`))
        .then(r => ({ guid, orgs: r.resources as StOrg[] }))
        .catch(() => ({ guid, orgs: [] as StOrg[] }));
    const fetchSpaces = (guid: string) =>
      firstValueFrom(this.http.get<StSpacesResponse>(`/pp/v1/cf/spaces/${guid}`))
        .then(r => ({ guid, spaces: r.resources as StSpace[] }))
        .catch(() => ({ guid, spaces: [] as StSpace[] }));

    const [orgResults, spaceResults] = await Promise.all([
      Promise.all(cnsiGuids.map(fetchOrgs)),
      Promise.all(cnsiGuids.map(fetchSpaces)),
    ]);

    const orgMap = new Map<string, StOrg[]>();
    for (const { guid, orgs } of orgResults) orgMap.set(guid, orgs);
    this._orgsByCnsi.set(orgMap);

    const spaceMap = new Map<string, StSpace[]>();
    for (const { guid, spaces } of spaceResults) spaceMap.set(guid, spaces);
    this._spacesByCnsi.set(spaceMap);
  }

  async loadAll(): Promise<void> {
    await this.orchestrator.load();
    this._hasLoadedOnce.set(true);
  }

  clearFilters(): void {
    this.selectedCnsi.set(null);
    this.selectedOrg.set(null);
    this.selectedSpace.set(null);
    this.nameFilter.set('');
    this.filterField.set('name');
    this.sort.set({ field: 'name', direction: 'asc' });
    this.pageIndex.set(0);
  }

  async refresh(): Promise<void> {
    // No-op if the orchestrator hasn't been built — the next page that
    // calls initialize() will fetch from scratch anyway.
    if (!this.orchestrator) return;
    await this.orchestrator.refresh();
    this._hasLoadedOnce.set(true);
  }

  // Register a value-extractor for a column whose sort value can't be read
  // as a direct property of StApp (e.g., the CF/Org/Space column which
  // composes cnsi + org + space names). Call this after building the list
  // config; ViewPipeline re-reads extractors on every sort change.
  registerSortExtractor(fieldKey: string, extractor: (row: StApp) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }

  // Register a string extractor for a text-filter field. Used when the
  // user selects a filter column other than 'name': the effect that
  // derives the filter predicate reads from this map and calls the
  // extractor to get the haystack string for each row. Re-registering
  // the same key replaces the previous extractor.
  registerFilterExtractor(fieldKey: string, extractor: (row: StApp) => string): void {
    this._filterExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }

  // Fetch per-instance stats for the given (cnsiGuid, appGuid) pairs in
  // parallel and merge them into the appStats signal. Designed to be
  // called with the keys of rows currently visible on the page — NOT
  // every known app — to keep round-trips bounded even on large walls.
  // Failures are swallowed per-app (the entry is cleared for that key)
  // so one bad endpoint doesn't block the rest of the page.
  private refreshStatsForKeys(rowKeys: readonly string[]): void {
    if (!rowKeys.length) return;
    for (const key of rowKeys) {
      const sep = key.indexOf(':');
      if (sep <= 0) continue;
      const cnsiGuid = key.slice(0, sep);
      const appGuid = key.slice(sep + 1);
      this.http
        .get<{ instances?: Array<{ state?: string }> }>(
          `/pp/v1/cf/app-stats/${cnsiGuid}/${appGuid}`,
        )
        .subscribe({
          next: (resp) => {
            const list = Array.isArray(resp?.instances) ? resp.instances : [];
            const running = list.filter((i) => (i?.state ?? '').toUpperCase() === 'RUNNING').length;
            const total = list.length;
            this._appStats.update((curr) => {
              const next = new Map(curr);
              next.set(key, { running, total });
              return next;
            });
          },
          error: () => {
            // Leave any previously cached value in place — a transient
            // 502/504 shouldn't clear the number the user was just looking
            // at. If we've never seen this key, it stays absent and the
            // column falls back to the "—" placeholder.
          },
        });
    }
  }

  // Kick off an initial stats fetch for the currently visible page, plus
  // an interval-based refresh. Safe to call more than once — the timer
  // is reset each time. Call from the app-wall once the view pipeline is
  // initialized; registerDestroy stops the timer on teardown.
  //
  // Page / sort / filter changes happen more often than the poll tick,
  // so we ALSO re-fetch reactively whenever pagedItems changes — the
  // user navigating to page 2 sees stats fill in within a few hundred
  // ms rather than waiting up to intervalMs.
  startStatsPolling(intervalMs: number = 30000): void {
    if (this.statsTimer) {
      clearInterval(this.statsTimer);
    }
    const runOnce = () => {
      const keys = this.view.pagedItems().map((a) => `${a.cnsiGuid}:${a.guid}`);
      this.refreshStatsForKeys(keys);
    };
    runOnce();
    this.statsTimer = setInterval(runOnce, intervalMs);
    // effect() requires an injection context; startStatsPolling is called
    // from the component's ngOnInit which isn't one. Wrap it explicitly.
    runInInjectionContext(this.injector, () => {
      effect(() => {
        const keys = this.view.pagedItems().map((a) => `${a.cnsiGuid}:${a.guid}`);
        this.refreshStatsForKeys(keys);
      });
    });
    this.destroyRef.onDestroy(() => {
      if (this.statsTimer) {
        clearInterval(this.statsTimer);
        this.statsTimer = undefined;
      }
    });
  }

  // Fetches every route currently mapped to an app, via the Stratos-native
  // backend. Used by the signal-native delete stepper route picker.
  //
  // One HTTP request; the backend drains pagination server-side. Returns
  // an empty array on 404 / error rather than throwing, so the picker can
  // render "no routes" cleanly — a missing routes endpoint shouldn't block
  // the user from deleting the app itself. Callers that need to distinguish
  // "zero routes" from "fetch failed" should add explicit error handling
  // at the call site.
  async fetchAppRoutes(cnsiGuid: string, appGuid: string): Promise<StRoute[]> {
    const resp = await firstValueFrom(
      this.http.get<StAppRoutesResponse>(`/pp/v1/cf/apps/${cnsiGuid}/${appGuid}/routes`),
    ).catch((): StAppRoutesResponse | null => null);
    return resp?.resources ?? [];
  }

  // Fetches every app-type service credential binding attached to an app,
  // joined with the referenced service-instance names and types. Used by
  // the signal-native delete stepper service bindings picker.
  //
  // Returns an empty array on 404 / error rather than throwing — a broken
  // service-binding list shouldn't block the user from deleting the app.
  async fetchAppServiceBindings(cnsiGuid: string, appGuid: string): Promise<StServiceBinding[]> {
    const resp = await firstValueFrom(
      this.http.get<StAppServiceBindingsResponse>(`/pp/v1/cf/apps/${cnsiGuid}/${appGuid}/service_bindings`),
    ).catch((): StAppServiceBindingsResponse | null => null);
    return resp?.resources ?? [];
  }

  // Deletes a service credential binding through the async-job contract.
  // Managed bindings produce a 202 + polls; user-provided bindings resolve
  // synchronously via the backend's 200+COMPLETE synthesis. writeWithJob
  // handles both shapes uniformly.
  async deleteServiceBinding(cnsiGuid: string, bindingGuid: string): Promise<void> {
    const call = this.http.delete(`/pp/v1/cf/service_bindings/${cnsiGuid}/${bindingGuid}`, { observe: 'response' });
    await writeWithJob(this.http, call);
  }

  // Deletes a CF route through the async-job contract. CF v3 returns 202 +
  // Location header for route deletes; writeWithJob handles the resolve /
  // poll / terminal-state dance so callers just await a promise.
  //
  // Used by the signal-native delete stepper when the user opts to delete
  // attached routes alongside the app. Throws StratosJobError on FAILED
  // terminal state — callers should either surface the error or swallow it
  // (the route may fail to delete because the app delete already cascaded
  // through CF's reference checks).
  async deleteRoute(cnsiGuid: string, routeGuid: string): Promise<void> {
    const call = this.http.delete(`/pp/v1/cf/routes/${cnsiGuid}/${routeGuid}`, { observe: 'response' });
    await writeWithJob(this.http, call);
  }

  // Lifecycle actions. The CF v3 /v3/apps/{guid}/actions/{action} endpoints
  // are synchronous at the HTTP layer (they return the updated app, or a
  // Build for restage). The Stratos-native backend wraps the response in
  // the async-job terminal envelope ({state: COMPLETE, result}) so the
  // 200 path resolves immediately through writeWithJob — giving every
  // write callsite a uniform client shape regardless of whether CF itself
  // was sync or async. Thrown StratosJobError surfaces CF errors; callers
  // should catch and surface via snackbar.
  async startApp(cnsiGuid: string, appGuid: string): Promise<void> {
    await this.appAction(cnsiGuid, appGuid, 'start');
  }
  async stopApp(cnsiGuid: string, appGuid: string): Promise<void> {
    await this.appAction(cnsiGuid, appGuid, 'stop');
  }
  async restartApp(cnsiGuid: string, appGuid: string): Promise<void> {
    await this.appAction(cnsiGuid, appGuid, 'restart');
  }
  async restageApp(cnsiGuid: string, appGuid: string): Promise<void> {
    await this.appAction(cnsiGuid, appGuid, 'restage');
  }

  private async appAction(
    cnsiGuid: string,
    appGuid: string,
    action: 'start' | 'stop' | 'restart' | 'restage',
  ): Promise<void> {
    const call = this.http.post(
      `/pp/v1/cf/apps/${cnsiGuid}/${appGuid}/actions/${action}`,
      null,
      { observe: 'response' },
    );
    await writeWithJob(this.http, call);
  }

  // Scales the web process of an app through the async-job contract.
  // Backend hits POST /v3/processes/{guid}/actions/scale which CF v3
  // returns 202 + Location → /v3/jobs/{jobGuid}; writeWithJob resolves
  // via fast-path 200 or handoff polling. Payload takes any subset of
  // {instances, memory, disk_quota}; all three in MB where applicable.
  async scaleApp(
    cnsiGuid: string,
    appGuid: string,
    payload: { instances?: number; memory?: number; disk_quota?: number },
  ): Promise<void> {
    const call = this.http.post(
      `/pp/v1/cf/apps/${cnsiGuid}/${appGuid}/scale`,
      payload,
      { observe: 'response' },
    );
    await writeWithJob(this.http, call);
  }

  async deleteApp(cnsiGuid: string, appGuid: string): Promise<void> {
    // Orchestrator-undefined fallback (cold bookmark / HMR): no source to
    // update, but we still need to issue the delete and wait for CF's
    // async job to terminate before the caller refreshes.
    if (!this.orchestrator) {
      const call = this.http.delete(`/pp/v1/cf/apps/${cnsiGuid}/${appGuid}`, { observe: 'response' });
      await writeWithJob(this.http, call);
      return;
    }
    const src = this.orchestrator.sourceFor(cnsiGuid) as CnsiAppsSource | undefined;
    if (!src) {
      const call = this.http.delete(`/pp/v1/cf/apps/${cnsiGuid}/${appGuid}`, { observe: 'response' });
      await writeWithJob(this.http, call);
      return;
    }
    // Source-aware path: waits for terminal state and updates local cache.
    await src.delete(appGuid);
  }
}
