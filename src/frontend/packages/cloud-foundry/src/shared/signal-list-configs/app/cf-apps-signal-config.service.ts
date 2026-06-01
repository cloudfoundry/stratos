import { DestroyRef, EffectRef, Injectable, Injector, Signal, WritableSignal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { EndpointModel } from '@stratosui/store';
import { CnsiAppsSource } from '../../../services/data-sources/cnsi-apps-source';
import { CnsiRoutesSource } from '../../../services/data-sources/cnsi-routes-source';
import { CnsiServiceBindingsSource } from '../../../services/data-sources/cnsi-service-bindings-source';
import { MergeOrchestrator } from '../../../services/data-sources/merge-orchestrator';
import { EndpointDataRegistry } from '../../../services/endpoint-data/endpoint-data.registry';
import { ViewPipeline, SortSpec } from '../../../services/data-sources/view-pipeline';
import type { StApp, StAppRoutesResponse, StOrg, StOrgsResponse, StRoute, StServiceCredentialBinding, StServiceCredentialBindingsResponse, StSpace, StSpacesResponse } from '../../../services/endpoint-data/stratos-types';
import { CloudFoundryService } from '../../data-services/cloud-foundry.service';
import { writeWithJob } from '../../../services/async-jobs/write-with-job';
import type { StratosJob } from '../../../services/async-jobs/async-job.types';
import type { SignalListDropdownOption } from '@stratosui/core';
import { ListStateStore, naturalCompare } from '@stratosui/core';

@Injectable({ providedIn: 'root' })
export class CfAppsSignalConfigService {
  orchestrator!: MergeOrchestrator<StApp>;
  view!: ViewPipeline<StApp>;

  private readonly state = inject(ListStateStore).bind('cf-apps', {
    viewMode: 'table',
    pageSize: [24, 25],
    pageIndex: [0, 0],
    sort: [{ field: 'name', direction: 'asc' }, { field: 'name', direction: 'asc' }],
  });

  // User-controlled filter / sort / pagination state.
  readonly filter: WritableSignal<(app: StApp) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SortSpec<StApp>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
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
  // Tracks `${cnsiGuid}:${appGuid}` keys with an in-flight stats request so
  // burst signal updates during initial render don't issue 4× duplicate
  // calls per app — the original symptom on multi-CNSI walls with slow CFs.
  private readonly statsInFlight = new Set<string>();
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  // Lazy org/space catalog loading. loadNames() runs an org+per-org-spaces
  // fanout that on multi-CNSI walls saturates the network for many seconds,
  // preventing `waitForLoadState('networkidle')` and (more importantly)
  // making the page feel slow on re-entry. We now defer loadNames until a
  // filter dropdown is first opened. This promise is the dedupe guard so
  // multiple dropdown opens during the in-flight window collapse to one
  // fanout. Cleared on each initialize() so a new mount can re-fetch.
  private _namesLoadingPromise: Promise<void> | null = null;

  // View mode (table / card). Default mirrors the legacy Stratos app wall.
  readonly viewMode = this.state.viewMode;

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
  // Loading flags for the Org / Space toolbar dropdowns — set true while
  // loadNames() is fetching and cleared once the relevant map is populated.
  // Drives the SignalListDropdown spinner so users see "loading" rather
  // than an empty list.
  private readonly _isLoadingOrgs = signal(false);
  private readonly _isLoadingSpaces = signal(false);
  readonly isLoadingOrgs: Signal<boolean> = this._isLoadingOrgs.asReadonly();
  readonly isLoadingSpaces: Signal<boolean> = this._isLoadingSpaces.asReadonly();
  // Visible-row resolver overlay: space names looked up by guid for rows
  // currently visible in the view but whose guid wasn't in the bounded
  // /pp/v1/cf/spaces catalog page (which caps at ~500 resources to avoid
  // 30s gorouter timeouts on large CFs). Populated by an effect over
  // view.pagedItems(); merged into spaceNames so the cell renderer reads
  // a single map. Catalog wins on duplicates (no real conflict expected
  // — same backend, same V3 resource). Keyed cnsiGuid → guid → name to
  // mirror the catalog shape.
  //
  // Orgs no longer need a resolver overlay — every StApp row now carries
  // OrgName from the server-side space→org join in
  // getNativeApps/getNativeAppsSummary, so the cell renderer reads
  // app.orgName directly with the catalog as a dropdown-only fallback.
  private readonly _resolvedSpacesByCnsi = signal<Map<string, Map<string, string>>>(new Map());
  // In-flight + already-attempted guid sets keyed `${cnsiGuid}:${guid}`.
  // Dedup concurrent triggers from rapid pagedItems changes (page nav,
  // filter, sort). Once a guid resolves (or its batch fails) the key
  // stays in the set so we don't retry every effect tick — a fresh
  // initialize() resets these via clearResolverState().
  private readonly resolverInFlight = new Set<string>();
  private readonly resolverAttempted = new Set<string>();
  // Flattened guid → name lookups derived from the per-CNSI catalogs
  // unioned with the resolver overlay. Consumers like the app-wall
  // CF/Org/Space column read these directly and don't need to know
  // which CF a particular guid came from.
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

  // Locked space scope for the per-space apps tab. Empty = no narrowing
  // (the multi-CNSI app wall path); non-empty = filter to apps whose
  // spaceGuid matches. Set via initializeForSpace() and re-applied on
  // every initialize() call. Distinct from `selectedSpace` (the user's
  // toolbar selection) so the per-space tab can pin scope without the
  // dropdown — and so clearFilters() doesn't drop scope.
  private _lockedSpaceGuid = '';

  private readonly endpointRegistry = inject(EndpointDataRegistry);

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
    // Merge in the resolver overlay so guids that fell outside the
    // bounded catalog page (the original "—" bug) still resolve once
    // the visible-row resolver fills them in. Catalog values win on
    // duplicates — both come from the same backend so they should
    // agree, but the catalog is the dropdown's source of truth.
    //
    // orgNames is catalog-only — the row-side resolver hop is gone
    // (every StApp now carries OrgName from the server-side join).
    this.orgNames = computed(() => {
      const m = new Map<string, string>();
      for (const orgs of this._orgsByCnsi().values()) {
        for (const o of orgs) m.set(o.guid, o.name);
      }
      return m;
    });
    this.spaceNames = computed(() => {
      const m = new Map<string, string>();
      for (const byGuid of this._resolvedSpacesByCnsi().values()) {
        for (const [guid, name] of byGuid) m.set(guid, name);
      }
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
      const sorted = Array.from(seen.entries()).sort(([, a], [, b]) => naturalCompare(a, b));
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
      const sorted = Array.from(seen.entries()).sort(([, a], [, b]) => naturalCompare(a, b));
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
      const lockedSpace = this._lockedSpaceGuid;
      this.filter.set((app: StApp) => {
        // Locked-space scope (per-space tab) takes precedence over the
        // toolbar selectedSpace dropdown, which the per-space page doesn't
        // expose at all.
        if (lockedSpace && app.spaceGuid !== lockedSpace) return false;
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
    // Reset the visible-row resolver state so a fresh navigation re-
    // resolves any guid (the underlying space/org might have been renamed
    // or replaced since the previous mount). The overlay maps are dropped
    // alongside the dedup sets so previously-resolved names don't bleed
    // across initialize() calls.
    this.clearResolverState();
    const sources = cnsiGuids.map(guid => {
      const eds = this.endpointRegistry.acquire(guid);
      const source = new CnsiAppsSource(guid, this.http, eds);
      // If a prior page (home card / detail view / earlier tab mount) has
      // already drained this CF's apps into the shared EndpointDataService,
      // seed the new source from that cache so the user lands on populated
      // rows instead of staring at a spinner while we re-fetch the same
      // data. The base class's preSeed flag short-circuits the next load()
      // exactly once; an explicit refresh() falls through to the normal
      // HTTP drain.
      if (eds.appsLastFetched() !== null) {
        source.preSeed(eds.apps());
      }
      return source;
    });
    this.orchestrator = new MergeOrchestrator<StApp>(sources);
    this.view = new ViewPipeline<StApp>(
      this.orchestrator.allItems,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );
    // Re-derive the filter predicate so any change to _lockedSpaceGuid (set
    // immediately before this call by initializeForSpace) takes effect even
    // when no other filter signal moved. The constructor effect only re-fires
    // when one of its tracked signals changes, and lockedSpaceGuid isn't a
    // signal — so we nudge a benign one (filterField → its current value).
    this.filterField.set(this.filterField());
    // Lazy org/space name resolution. Previously fired here eagerly; now
    // deferred to `ensureNamesLoaded()`, called from the filter-dropdown
    // onOpen hook. The page paints fast and `networkidle` settles within
    // a few hundred ms, instead of being held busy for many seconds by
    // the per-org spaces fanout. Visible row cells still resolve names
    // on demand via startVisibleRowResolver below.
    //
    // EXCEPTION: if a previous mount left a CF/org/space selected, the
    // stale-selection effect (`if (org != null && !orgValues.has(org))`)
    // would clear the user's filter as soon as `_hasLoadedOnce` becomes
    // true — because orgOptions/spaceOptions are derived from the maps
    // loadNames populates, and they're empty until then. Eager-load in
    // that case so the dropdown values that back the selection are
    // present when the effect fires.
    this._namesLoadingPromise = null;
    if (this.selectedCnsi() != null || this.selectedOrg() != null || this.selectedSpace() != null) {
      void this.ensureNamesLoaded(cnsiGuids);
    }
    // Wire the visible-row resolver: every time view.pagedItems changes
    // (page navigation, sort, filter), collect the (cnsi, orgGuid) and
    // (cnsi, spaceGuid) pairs that aren't already resolved (catalog or
    // overlay) and aren't already in flight, then guid-batch fetch them.
    this.startVisibleRowResolver();
  }

  // Per-space tab variant. Pins the scope to one CF + one space; the
  // existing initialize() multi-CNSI plumbing does the rest. The toolbar
  // dropdowns (CF/Org/Space) are intentionally NOT exposed by the per-space
  // page — there's exactly one of each in scope.
  initializeForSpace(cnsiGuid: string, spaceGuid: string): void {
    this._lockedSpaceGuid = spaceGuid;
    this.initialize([cnsiGuid]);
  }

  // Clear the per-space scope. Call from the app-wall path before the
  // first initialize() so a stale lock from a previously-mounted space
  // page doesn't bleed into wall results.
  clearLockedSpace(): void {
    this._lockedSpaceGuid = '';
  }

  // Bumped on every initialize() so any in-flight name-resolution chunk
  // belonging to a previous mount can detect it's stale (its captured
  // generation no longer matches) and skip the merge step. Without this,
  // a navigate-away-then-back during a slow CF's drain would let the
  // stale chunk's spaces leak into the new mount's overlay.
  private _initGen = 0;

  // Org chunk size: 20 keeps URL length comfortably under common 4-8K
  // limits (20 × 36-char UUID + commas ≈ 740 chars), each chunk's
  // failure scope small, and the total request count tractable on CFs
  // with hundreds of orgs.
  private static readonly ORGS_PER_SPACES_CHUNK = 20;
  // Per-CNSI concurrency cap: 3 chunks in flight × 2 CFs = 6 max in
  // flight, well under browser per-host connection limits and the gorouter
  // budget. Higher concurrency wouldn't help — CAPI is the bottleneck —
  // and risks compounding 504s under load.
  private static readonly SPACES_CHUNK_CONCURRENCY = 3;

  // Idempotent wrapper around loadNames. Called from the filter-dropdown
  // onOpen hook so the org+space catalog is fetched only on the first user
  // interaction with the toolbar dropdowns. Repeated calls during the
  // in-flight window collapse to the same promise; subsequent calls after
  // completion are no-ops because the cached promise resolves immediately.
  // Reset by initialize() so a fresh mount re-fetches.
  ensureNamesLoaded(cnsiGuids: readonly string[] = []): Promise<void> {
    if (this._namesLoadingPromise) return this._namesLoadingPromise;
    // Caller may omit cnsiGuids when the service already knows the scope —
    // derive from connected endpoints in that case so the dropdown
    // onOpen handler doesn't have to forward the guids list.
    const guids = cnsiGuids.length > 0
      ? cnsiGuids
      : this.connectedEndpoints().map(ep => ep.guid);
    if (!guids.length) return Promise.resolve();
    this._namesLoadingPromise = this.loadNames(guids);
    return this._namesLoadingPromise;
  }

  private async loadNames(cnsiGuids: readonly string[]): Promise<void> {
    const gen = ++this._initGen;
    // Orgs are <500 in practice so a single bounded page is enough. Spaces
    // are the problem (CFs with thousands → page 1 misses anything past
    // #500 → "—" in the CF/Org/Space cell), so spaces are fetched per-org-
    // batch below once orgs are known.
    const namePerPage = 500;
    const fetchOrgs = (guid: string) =>
      firstValueFrom(this.http.get<StOrgsResponse>(
        `/pp/v1/cf/orgs/${guid}?per_page=${namePerPage}&page=1`,
      ))
        .then(r => ({ guid, orgs: r.resources as StOrg[] }))
        .catch(() => ({ guid, orgs: [] as StOrg[] }));

    this._isLoadingOrgs.set(true);
    this._isLoadingSpaces.set(true);
    const orgResults = await Promise.all(cnsiGuids.map(fetchOrgs));
    if (gen !== this._initGen) { this._isLoadingOrgs.set(false); this._isLoadingSpaces.set(false); return; }

    const orgMap = new Map<string, StOrg[]>();
    for (const { guid, orgs } of orgResults) orgMap.set(guid, orgs);
    this._orgsByCnsi.set(orgMap);
    this._isLoadingOrgs.set(false);

    // Reset the spaces map up-front so a re-initialize() doesn't render
    // last mount's stale list while the new drain is still in flight.
    this._spacesByCnsi.set(new Map());

    // Per CNSI: order orgs priority-first (orgs holding apps on the first
    // ~2 pages of the wall come first so visible "—"s flip immediately),
    // then chunk into ORGS_PER_SPACES_CHUNK groups, then drain with the
    // priority chunk awaited and the rest fired-and-forget. The priority
    // chunk's RTT is bounded (≤20 orgs of spaces) so awaiting it yields
    // a brief, predictable initial-mount delay in exchange for visible
    // names on first paint.
    const drainPromises = cnsiGuids.map(cnsi => {
      const orgs = orgMap.get(cnsi) ?? [];
      const orderedOrgGuids = this.orderOrgsForCnsi(cnsi, orgs);
      return this.drainSpacesByOrgChunks(cnsi, orderedOrgGuids, gen);
    });
    // Each drain awaits its own priority chunk internally before
    // returning. A failure of one CF's drain shouldn't block the others,
    // hence allSettled.
    await Promise.allSettled(drainPromises);
    this._isLoadingSpaces.set(false);
  }

  // Returns the cnsi's orgs ordered with "priority" orgs first (those
  // whose guids appear in the first pageSize() * 2 entries of allItems
  // for this cnsi) followed by the rest. Priority orgs only matter while
  // the apps catalog has loaded enough rows to peek at — if allItems is
  // still empty (initial mount race), the natural orderMap order falls
  // back gracefully.
  private orderOrgsForCnsi(cnsi: string, orgs: readonly StOrg[]): string[] {
    if (!orgs.length) return [];
    const priority = new Set<string>();
    if (this.orchestrator) {
      const all = this.orchestrator.allItems();
      const peekCount = Math.max(this.pageSize() * 2, 0);
      let seen = 0;
      for (const app of all) {
        if (seen >= peekCount) break;
        if (app.cnsiGuid !== cnsi) continue;
        if (app.orgGuid) priority.add(app.orgGuid);
        seen++;
      }
    }
    const head: string[] = [];
    const tail: string[] = [];
    for (const o of orgs) {
      if (priority.has(o.guid)) head.push(o.guid);
      else tail.push(o.guid);
    }
    return [...head, ...tail];
  }

  // Drains `/pp/v1/cf/spaces/{cnsi}?organization_guids=g1,g2,...` for
  // the given priority-ordered orgs in chunks of ORGS_PER_SPACES_CHUNK,
  // bounded to SPACES_CHUNK_CONCURRENCY in flight. Awaits the FIRST
  // chunk so callers (loadNames → initialize) can synchronise the
  // initial render against priority results landing; the remaining
  // chunks are fire-and-forget. Pagination per chunk is handled inline
  // (most chunks will fit one page since 20 orgs × ≤500 spaces is rare).
  private async drainSpacesByOrgChunks(cnsi: string, orderedOrgGuids: readonly string[], gen: number): Promise<void> {
    if (!orderedOrgGuids.length) return;
    const chunkSize = CfAppsSignalConfigService.ORGS_PER_SPACES_CHUNK;
    const chunks: string[][] = [];
    for (let i = 0; i < orderedOrgGuids.length; i += chunkSize) {
      chunks.push(orderedOrgGuids.slice(i, i + chunkSize));
    }

    const runChunk = async (chunk: string[]): Promise<void> => {
      let page = 1;
      const perPage = 500;
      // Per-chunk pagination loop: break when no `next` link. Most chunks
      // exit after one iteration on real CFs.
      while (true) {
        const url = `/pp/v1/cf/spaces/${cnsi}?organization_guids=${chunk.join(',')}&per_page=${perPage}&page=${page}`;
        const resp = await firstValueFrom(this.http.get<StSpacesResponse>(url))
          .catch((): StSpacesResponse | null => null);
        if (gen !== this._initGen) return;
        const resources = (resp?.resources ?? []) as StSpace[];
        if (resources.length) {
          this._spacesByCnsi.update(curr => {
            const next = new Map(curr);
            const existing = next.get(cnsi) ?? [];
            // Dedup by guid in case pagination overlaps with a previous
            // chunk's result for the same org (shouldn't happen with
            // disjoint org chunks, but cheap insurance).
            const seen = new Set(existing.map(s => s.guid));
            const merged = existing.slice();
            for (const s of resources) {
              if (s.guid && !seen.has(s.guid)) {
                merged.push(s);
                seen.add(s.guid);
              }
            }
            next.set(cnsi, merged);
            return next;
          });
        }
        const nextLink = (resp as unknown as { pagination?: { next?: unknown } } | null)?.pagination?.next;
        if (!nextLink) return;
        page++;
      }
    };

    // Await the first (priority) chunk before returning so the caller
    // can rely on priority orgs being in _spacesByCnsi when initialize
    // resolves. Remaining chunks queue with a concurrency cap and run
    // in the background.
    await runChunk(chunks[0]);

    const remaining = chunks.slice(1);
    if (!remaining.length) return;
    const cap = CfAppsSignalConfigService.SPACES_CHUNK_CONCURRENCY;
    // Simple worker-pool drain. `cursor` is the shared index into
    // `remaining`; up to `cap` workers each pull-and-run sequentially.
    let cursor = 0;
    const worker = async (): Promise<void> => {
      while (cursor < remaining.length) {
        if (gen !== this._initGen) return;
        const idx = cursor++;
        await runChunk(remaining[idx]);
      }
    };
    const workerCount = Math.min(cap, remaining.length);
    // Don't await — let the wall paint immediately; chunks merge into
    // _spacesByCnsi as they land and the spaceNames computed signal
    // pushes through to the cell renderer.
    const workers: Promise<void>[] = [];
    for (let i = 0; i < workerCount; i++) workers.push(worker());
    void Promise.allSettled(workers);
  }

  // Resets the visible-row resolver overlay + dedup state. Called from
  // initialize() so a navigation re-fetches any guid that needs resolving
  // (catches the rename / replace case — see resolverInFlight comment for
  // the staleness window inside one mount).
  private clearResolverState(): void {
    this._resolvedSpacesByCnsi.set(new Map());
    this.resolverInFlight.clear();
    this.resolverAttempted.clear();
  }

  // Watches view.pagedItems for (cnsi, spaceGuid) pairs whose name
  // isn't already resolved. Fetches missing names via
  // /pp/v1/cf/spaces/{cnsi}?guids=... batched per CNSI, capped at
  // GUIDS_PER_BATCH per request to keep URLs under reasonable
  // browser/server limits. Bounded by visible row count per page
  // (~25-100), so it can't time out on large CFs the way the original
  // bulk-drain fetch did.
  //
  // Orgs no longer flow through here — every StApp row carries OrgName
  // from the server-side space→org join (see native_apps_summary.go
  // composeStAppSummary).
  //
  // Idempotent: in-flight + already-attempted guid keys (cnsi:guid) are
  // tracked to dedupe rapid pagedItems changes (page navigation, filter,
  // sort). `attempted` retains keys after success/failure so we don't
  // refetch every effect tick — the next initialize() resets the set.
  private resolverEffect?: EffectRef;
  private startVisibleRowResolver(): void {
    // Tear down any previous mount's effect so re-initialize() (e.g. on
    // route re-entry) doesn't stack one resolver per visit.
    this.resolverEffect?.destroy();
    runInInjectionContext(this.injector, () => {
      this.resolverEffect = effect(() => {
        const visible = this.view.pagedItems();
        if (!visible.length) return;
        // Build a per-CNSI set of space guids referenced by visible rows
        // whose name isn't already known (catalog / overlay / in-flight
        // / previously-attempted this initialize() cycle).
        //
        // Orgs no longer need the resolver leg — every visible row
        // already carries OrgName from the server-side space→org join.
        const knownSpaces = this.spaceNames();
        const spacesToFetch = new Map<string, Set<string>>();
        for (const row of visible) {
          const cnsi = row.cnsiGuid;
          if (!cnsi) continue;
          const spaceGuid = row.spaceGuid;
          if (spaceGuid && !knownSpaces.has(spaceGuid)) {
            const key = `${cnsi}:${spaceGuid}`;
            if (!this.resolverInFlight.has(key) && !this.resolverAttempted.has(key)) {
              const set = spacesToFetch.get(cnsi) ?? new Set<string>();
              set.add(spaceGuid);
              spacesToFetch.set(cnsi, set);
            }
          }
        }
        for (const [cnsi, guids] of spacesToFetch) {
          void this.resolveSpaces(cnsi, Array.from(guids));
        }
      });
    });
  }

  // URL length safety: 100 guids × 36-char UUID + commas ≈ 3700 chars.
  // Most servers accept 4-8K URLs, so 100 is a comfortable cap that also
  // keeps a single failure scope small. Larger sets paginate.
  private static readonly GUIDS_PER_BATCH = 100;

  private async resolveSpaces(cnsi: string, guids: string[]): Promise<void> {
    if (!guids.length) return;
    for (const g of guids) this.resolverInFlight.add(`${cnsi}:${g}`);
    try {
      for (let i = 0; i < guids.length; i += CfAppsSignalConfigService.GUIDS_PER_BATCH) {
        const batch = guids.slice(i, i + CfAppsSignalConfigService.GUIDS_PER_BATCH);
        const url = `/pp/v1/cf/spaces/${cnsi}?guids=${batch.join(',')}&per_page=${batch.length}`;
        const resp = await firstValueFrom(this.http.get<StSpacesResponse>(url))
          .catch((): StSpacesResponse | null => null);
        if (resp?.resources?.length) {
          this._resolvedSpacesByCnsi.update(curr => {
            const next = new Map(curr);
            const byGuid = new Map(next.get(cnsi) ?? []);
            for (const s of resp.resources as StSpace[]) {
              if (s.guid && s.name) byGuid.set(s.guid, s.name);
            }
            next.set(cnsi, byGuid);
            return next;
          });
        }
      }
    } finally {
      for (const g of guids) {
        const key = `${cnsi}:${g}`;
        this.resolverInFlight.delete(key);
        this.resolverAttempted.add(key);
      }
    }
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
    // Group keys by CNSI so each CNSI is one batched request instead of
    // one request per visible app. On a 24-app page across 4 CFs, this
    // drops the polling cycle from 24 HTTP requests to 4. The backend's
    // /pp/v1/cf/app-stats/{cnsi}?app_guids=g1,g2,... handler resolves
    // process GUIDs in one shot and fans out the stats calls server-side
    // under a bounded errgroup.
    const byCnsi = new Map<string, string[]>();
    for (const key of rowKeys) {
      if (this.statsInFlight.has(key)) continue;
      const sep = key.indexOf(':');
      if (sep <= 0) continue;
      const cnsiGuid = key.slice(0, sep);
      const appGuid = key.slice(sep + 1);
      this.statsInFlight.add(key);
      const list = byCnsi.get(cnsiGuid);
      if (list) {
        list.push(appGuid);
      } else {
        byCnsi.set(cnsiGuid, [appGuid]);
      }
    }
    for (const [cnsiGuid, appGuids] of byCnsi) {
      const params = new HttpParams().set('app_guids', appGuids.join(','));
      this.http
        .get<{ apps?: Record<string, { instances?: Array<{ state?: string }> }> }>(
          `/pp/v1/cf/app-stats/${cnsiGuid}`,
          { params },
        )
        .subscribe({
          next: (resp) => {
            const apps = resp?.apps ?? {};
            this._appStats.update((curr) => {
              const next = new Map(curr);
              for (const appGuid of appGuids) {
                const entry = apps[appGuid];
                const instances = Array.isArray(entry?.instances) ? entry.instances : [];
                const running = instances.filter((i) => (i?.state ?? '').toUpperCase() === 'RUNNING').length;
                const total = instances.length;
                next.set(`${cnsiGuid}:${appGuid}`, { running, total });
                this.statsInFlight.delete(`${cnsiGuid}:${appGuid}`);
              }
              return next;
            });
          },
          error: () => {
            // Leave any previously cached value in place — a transient
            // 502/504 shouldn't clear the numbers the user was just looking
            // at. Clear in-flight markers so the next poll cycle re-tries.
            for (const appGuid of appGuids) {
              this.statsInFlight.delete(`${cnsiGuid}:${appGuid}`);
            }
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
  // Asks the backend for ?return=summary so serviceInstance.name/type +
  // app.name come back inline via v3's `included` block. Returns an empty
  // array on 404 / error rather than throwing — a broken service-binding
  // list shouldn't block the user from deleting the app.
  async fetchAppServiceBindings(cnsiGuid: string, appGuid: string): Promise<StServiceCredentialBinding[]> {
    const resp = await firstValueFrom(
      this.http.get<StServiceCredentialBindingsResponse | null>(
        `/pp/v1/cf/apps/${cnsiGuid}/${appGuid}/service_bindings?return=summary`,
      ),
    ).catch((): StServiceCredentialBindingsResponse | null => null);
    return resp?.resources ?? [];
  }

  // Deletes a service credential binding through the async-job contract.
  // Managed bindings produce a 202 + polls; user-provided bindings resolve
  // synchronously via the backend's 200+COMPLETE synthesis. Routed through
  // CnsiServiceBindingsSource so the binding row is dropped from
  // EndpointDataService._serviceCredentialBindings on success and the
  // serviceBinding.delete cascade fires (marks apps + SI stale).
  async deleteServiceBinding(cnsiGuid: string, bindingGuid: string): Promise<void> {
    const eds = this.endpointRegistry.acquire(cnsiGuid);
    const source = new CnsiServiceBindingsSource(cnsiGuid, this.http, eds);
    await source.delete(bindingGuid);
  }

  // Deletes a CF route through CnsiRoutesSource. The source handles
  // writeWithJob, patches its own _items, and fires the route.delete
  // cascade (marks apps stale so app-detail route lists refetch).
  //
  // Used by the signal-native delete stepper when the user opts to delete
  // attached routes alongside the app. Throws StratosJobError on FAILED
  // terminal state — callers should either surface the error or swallow it
  // (the route may fail to delete because the app delete already cascaded
  // through CF's reference checks).
  async deleteRoute(cnsiGuid: string, routeGuid: string): Promise<void> {
    const eds = this.endpointRegistry.acquire(cnsiGuid);
    const source = new CnsiRoutesSource(cnsiGuid, this.http, eds);
    await source.delete(routeGuid);
  }

  // Lifecycle actions. The CF v3 /v3/apps/{guid}/actions/{action} endpoints
  // are synchronous at the HTTP layer (they return the updated app, or a
  // Build for restage). The Stratos-native backend wraps the response in
  // the async-job terminal envelope ({state: COMPLETE, result}) so the
  // 200 path resolves immediately through writeWithJob — giving every
  // write callsite a uniform client shape regardless of whether CF itself
  // was sync or async. Thrown StratosJobError surfaces CF errors; callers
  // should catch and surface via snackbar.
  async startApp(cnsiGuid: string, appGuid: string, opts?: { onProgress?: (job: StratosJob) => void }): Promise<void> {
    await this.appAction(cnsiGuid, appGuid, 'start', opts);
  }
  async stopApp(cnsiGuid: string, appGuid: string, opts?: { onProgress?: (job: StratosJob) => void }): Promise<void> {
    await this.appAction(cnsiGuid, appGuid, 'stop', opts);
  }
  async restartApp(cnsiGuid: string, appGuid: string, opts?: { onProgress?: (job: StratosJob) => void }): Promise<void> {
    await this.appAction(cnsiGuid, appGuid, 'restart', opts);
  }
  async restageApp(cnsiGuid: string, appGuid: string, opts?: { onProgress?: (job: StratosJob) => void }): Promise<void> {
    await this.appAction(cnsiGuid, appGuid, 'restage', opts);
  }

  private async appAction(
    cnsiGuid: string,
    appGuid: string,
    action: 'start' | 'stop' | 'restart' | 'restage',
    opts?: { onProgress?: (job: StratosJob) => void },
  ): Promise<void> {
    const call = this.http.post(
      `/pp/v1/cf/apps/${cnsiGuid}/${appGuid}/actions/${action}`,
      null,
      { observe: 'response' },
    );
    await writeWithJob(this.http, call, { onProgress: opts?.onProgress });
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
