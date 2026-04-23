import { Injectable, Signal, WritableSignal, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { EndpointModel } from '@stratosui/store';
import { CnsiAppsSource } from '../../../../../services/data-sources/cnsi-apps-source';
import { MergeOrchestrator } from '../../../../../services/data-sources/merge-orchestrator';
import { ViewPipeline, SortSpec } from '../../../../../services/data-sources/view-pipeline';
import type { StApp, StAppRoutesResponse, StAppServiceBindingsResponse, StOrgsResponse, StRoute, StServiceBinding, StSpacesResponse } from '../../../../../services/endpoint-data/stratos-types';
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
  readonly pageSize: WritableSignal<number> = signal(20);
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

  // View mode (table / card). Default mirrors the legacy Stratos app wall.
  readonly viewMode: WritableSignal<SignalListViewMode> = signal('table');

  // Bridge connected-CF endpoints (an rxjs Observable) into a signal so
  // computed() can read it. CloudFoundryService is optional purely because
  // tests exist that don't provide it; in the real app it's always present.
  private readonly connectedEndpoints: Signal<EndpointModel[]>;

  // guid → name lookups for orgs and spaces. Populated from the per-CF
  // /pp/v1/cf/orgs and /pp/v1/cf/spaces fetches fired from initialize().
  // Merged across all connected CFs because guids are globally unique.
  // Used by the org/space dropdowns to render names instead of guids,
  // and by the app-wall CF/Org/Space column.
  private readonly _orgNames = signal<Map<string, string>>(new Map());
  private readonly _spaceNames = signal<Map<string, string>>(new Map());
  readonly orgNames: Signal<Map<string, string>> = this._orgNames.asReadonly();
  readonly spaceNames: Signal<Map<string, string>> = this._spaceNames.asReadonly();
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

    // Org options come from the currently loaded app list, labelled from
    // the orgNames map populated by initialize(). Shows orgs that *have*
    // apps in the current CF scope; empty orgs are not surfaced here. Falls
    // back to guid only if the name fetch hasn't landed yet — which, in
    // normal use, resolves within a couple of seconds.
    this.orgOptions = computed(() => {
      const cnsi = this.selectedCnsi();
      const names = this._orgNames();
      const seen = new Map<string, string>();
      const items = this.orchestrator?.allItems() ?? [];
      for (const app of items) {
        if (cnsi && app.cnsiGuid !== cnsi) continue;
        if (!app.orgGuid) continue;
        if (!seen.has(app.orgGuid)) seen.set(app.orgGuid, names.get(app.orgGuid) ?? app.orgGuid);
      }
      const opts: SignalListDropdownOption[] = [{ label: 'All', value: null }];
      const sorted = Array.from(seen.entries()).sort(([, a], [, b]) => a.localeCompare(b));
      for (const [guid, label] of sorted) opts.push({ label, value: guid });
      return opts;
    });

    // Space options are scoped to the currently selected org (and CF).
    this.spaceOptions = computed(() => {
      const cnsi = this.selectedCnsi();
      const org = this.selectedOrg();
      const names = this._spaceNames();
      const seen = new Map<string, string>();
      const items = this.orchestrator?.allItems() ?? [];
      for (const app of items) {
        if (cnsi && app.cnsiGuid !== cnsi) continue;
        if (org && app.orgGuid !== org) continue;
        if (!app.spaceGuid) continue;
        if (!seen.has(app.spaceGuid)) seen.set(app.spaceGuid, names.get(app.spaceGuid) ?? app.spaceGuid);
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
    effect(() => {
      if (!this._hasLoadedOnce()) return;
      const cnsiValues = new Set(this.cnsiOptions().map(o => o.value));
      const orgValues = new Set(this.orgOptions().map(o => o.value));
      const spaceValues = new Set(this.spaceOptions().map(o => o.value));
      const cnsi = this.selectedCnsi();
      const org = this.selectedOrg();
      const space = this.selectedSpace();
      if (cnsi != null && !cnsiValues.has(cnsi)) this.selectedCnsi.set(null);
      if (org != null && !orgValues.has(org)) this.selectedOrg.set(null);
      if (space != null && !spaceValues.has(space)) this.selectedSpace.set(null);
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
      this.filter.set((app: StApp) => {
        if (cnsi && app.cnsiGuid !== cnsi) return false;
        if (org && app.orgGuid !== org) return false;
        if (space && app.spaceGuid !== space) return false;
        if (q && !(app.name || '').toLowerCase().includes(q)) return false;
        return true;
      });
    });
  }

  initialize(cnsiGuids: readonly string[]): void {
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
    const fetchOrgs = (guid: string): Promise<StOrgsResponse | null> =>
      firstValueFrom(this.http.get<StOrgsResponse>(`/pp/v1/cf/orgs/${guid}`)).catch((): StOrgsResponse | null => null);
    const fetchSpaces = (guid: string): Promise<StSpacesResponse | null> =>
      firstValueFrom(this.http.get<StSpacesResponse>(`/pp/v1/cf/spaces/${guid}`)).catch((): StSpacesResponse | null => null);

    const [orgResults, spaceResults] = await Promise.all([
      Promise.all(cnsiGuids.map(fetchOrgs)),
      Promise.all(cnsiGuids.map(fetchSpaces)),
    ]);

    const orgMap = new Map<string, string>();
    for (const resp of orgResults) {
      if (!resp) continue;
      for (const org of resp.resources) orgMap.set(org.guid, org.name);
    }
    this._orgNames.set(orgMap);

    const spaceMap = new Map<string, string>();
    for (const resp of spaceResults) {
      if (!resp) continue;
      for (const space of resp.resources) spaceMap.set(space.guid, space.name);
    }
    this._spaceNames.set(spaceMap);
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
