import { DestroyRef, Injectable, Injector, Signal, WritableSignal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import type { EndpointModel } from '@stratosui/store';
import { CnsiServiceInstancesSource } from '../../../../../services/data-sources/cnsi-service-instances-source';
import { MergeOrchestrator } from '../../../../../services/data-sources/merge-orchestrator';
import { ViewPipeline, SortSpec } from '../../../../../services/data-sources/view-pipeline';
import { EndpointDataRegistry } from '../../../../../services/endpoint-data/endpoint-data.registry';
import type { EndpointDataService } from '../../../../../services/endpoint-data/endpoint-data.service';
import type { StServiceInstance } from '../../../../../services/endpoint-data/stratos-types';
import { CloudFoundryService } from '../../../../data-services/cloud-foundry.service';
import type { SignalListDropdownOption } from '@stratosui/core';
import { ListStateStore, naturalCompare } from '@stratosui/core';

// Service instances list config — multi-CNSI by default (services-wall),
// with optional space + type narrowing for the per-space tabs.
//
// Mirrors CfServiceOfferingsSignalConfigService's MergeOrchestrator +
// ViewPipeline pattern: instances from every connected CF rendered
// together, with a CF dropdown to narrow.
//
// Scope filters:
// - `cnsiGuids` (initialize): which CFs to drain. The wall passes every
//   connected CF; per-space callers pass a single guid via
//   `initializeForSpace`.
// - `spaceGuid`: empty = no space constraint (wall behaviour); non-empty =
//   client-side filter to that space only. Mirrors the routes signal
//   config's per-space narrowing.
// - `typeFilter`: undefined = both managed and user-provided (wall);
//   'managed' or 'user-provided' = the per-space tabs that are already
//   pre-filtered to one kind.
//
// nameFilter searches across Name and ServiceOfferingName so users can
// find "the redis I named primary-cache" by typing either.
//
// Delete is the only write surface this config OWNS (deleteServiceInstance).
// Edit / Detach are per-row navigations to the /services edit|detach routes
// and Add is an L5 sub-nav action — both wired at the consuming components.
@Injectable({ providedIn: 'root' })
export class CfServiceInstancesSignalConfigService {
  orchestrator!: MergeOrchestrator<StServiceInstance>;
  view!: ViewPipeline<StServiceInstance>;

  // Empty string = wall behaviour (no space constraint). Non-empty =
  // narrow to that space only. Set via initializeForSpace. Stored as a
  // signal so the filter effect re-runs when a per-space caller switches
  // scope mid-session.
  private readonly _spaceGuid: WritableSignal<string> = signal('');
  // undefined = no type constraint (wall). 'managed' / 'user-provided' =
  // per-space tab pre-filter.
  private readonly _typeFilter: WritableSignal<'managed' | 'user-provided' | undefined> = signal(undefined);
  // Empty string = no offering constraint (wall + per-space). Non-empty =
  // narrow to instances whose serviceOffering.guid matches. Set via
  // initializeForOffering — drives the service-offering Instances tab.
  private readonly _offeringGuid: WritableSignal<string> = signal('');

  private readonly state = inject(ListStateStore).bind('cf-service-instances', {
    viewMode: 'card',
    pageSize: [6, 25],
    pageIndex: [0, 0],
    sort: [{ field: 'name', direction: 'asc' }, { field: 'name', direction: 'asc' }],
  });

  readonly filter: WritableSignal<(si: StServiceInstance) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SortSpec<StServiceInstance>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;

  // Toolbar filter inputs. `null` for the dropdown = "All" (no constraint);
  // empty string for nameFilter = no name constraint.
  readonly selectedCnsi: WritableSignal<string | null> = signal(null);
  readonly selectedOrg: WritableSignal<string | null> = signal(null);
  readonly selectedSpace: WritableSignal<string | null> = signal(null);
  readonly nameFilter: WritableSignal<string> = signal('');
  // Active filter column. Mirrors the marketplace pattern: when the
  // consumer registers a filter extractor for each filterable column, the
  // toolbar renders a dropdown that swaps WHICH column the text filter
  // compares against.
  readonly filterField: WritableSignal<string> = signal('name');

  // Sort extractors for columns whose sort key isn't a direct property
  // (e.g., joined Tags or the operation pill label).
  private readonly _sortExtractors: WritableSignal<Map<string, (row: StServiceInstance) => unknown>> = signal(new Map());
  private readonly _filterExtractors: WritableSignal<Map<string, (row: StServiceInstance) => string>> = signal(new Map());

  readonly viewMode = this.state.viewMode;

  // Bridge connected-CF endpoints into a signal so computed() can read it.
  // CloudFoundryService is optional purely so unit tests don't need to
  // provide it; the real app always supplies one.
  private readonly connectedEndpoints: Signal<EndpointModel[]>;

  // CF filter dropdown options; "All" prepended as the null-value option.
  readonly cnsiOptions: Signal<SignalListDropdownOption[]>;
  // Org / Space options. The wall page joins service-instance rows with
  // the per-CNSI orgs() / spaces() signals from EndpointDataService. The
  // per-space and per-offering callers don't render these dropdowns
  // (scope is already pinned).
  readonly orgOptions: Signal<SignalListDropdownOption[]>;
  readonly spaceOptions: Signal<SignalListDropdownOption[]>;
  // Loading flags for the Org / Space filter dropdowns. True while any
  // in-scope EndpointDataService is draining orgs / spaces.
  readonly isLoadingOrgs!: Signal<boolean>;
  readonly isLoadingSpaces!: Signal<boolean>;
  // endpoint guid → endpoint name, for rendering the CF column without
  // forcing each row to look it up.
  readonly endpointNames: Signal<Map<string, string>>;
  // Per-CNSI EndpointDataService handles acquired in initialize* — keys
  // are guid, values are the EDS reference. Held in a writable signal so
  // orgOptions / spaceOptions / orgGuidBySpaceGuid recompute whenever a
  // new initialize() swaps the set. Acquisitions are refcount-aware:
  // each initialize() releases the previous set before acquiring the
  // new one, and the host-component destroyRef releases on teardown.
  // Reading EDS.orgs() / EDS.spaces() inside a computed off this signal
  // is safe — those are signals themselves, no extra acquire.
  private readonly _edsByCnsi: WritableSignal<Map<string, EndpointDataService>> = signal(new Map());
  // spaceGuid → orgGuid lookup unioned across the orchestrator's CNSIs.
  // Drives the selectedOrg filter predicate (every SI carries space.guid;
  // we don't get space.organization.guid on the wall payload).
  private readonly _orgGuidBySpaceGuid: Signal<Map<string, string>>;
  private readonly destroyRef = inject(DestroyRef, { optional: true });

  // Flipped to true once the orchestrator's first load completes. Gates the
  // stale-selection clearer that keeps the toolbar display in sync with the
  // filter when an endpoint disconnects mid-session.
  private readonly _hasLoadedOnce: WritableSignal<boolean> = signal(false);
  private readonly injector = inject(Injector);
  private readonly http = inject(HttpClient);
  // Optional so unit tests don't have to provide it; the real app always
  // does (providedIn: 'root'). When present, used to short-circuit the
  // orchestrator's HTTP drain on revisit by pre-seeding each per-CNSI
  // source from the registry's pre-warmed services-details cache.
  private readonly registry = inject(EndpointDataRegistry, { optional: true });

  constructor() {
    const cfService = inject(CloudFoundryService, { optional: true });
    this.connectedEndpoints = cfService
      ? toSignal(cfService.connectedCFEndpoints$, { initialValue: [] as EndpointModel[] })
      : signal<EndpointModel[]>([]).asReadonly();

    this.cnsiOptions = computed(() => {
      const opts: SignalListDropdownOption[] = [{ label: 'All', value: null }];
      for (const ep of this.connectedEndpoints() ?? []) {
        opts.push({ label: ep.name ?? ep.guid, value: ep.guid });
      }
      return opts;
    });

    this.endpointNames = computed(() => {
      const m = new Map<string, string>();
      for (const ep of this.connectedEndpoints() ?? []) {
        if (ep.name) m.set(ep.guid, ep.name);
      }
      return m;
    });

    // Org options come from each CNSI's EDS orgs() signal. When the user
    // selects a CF, the dropdown narrows to that CF's orgs; otherwise it
    // unions across every CF the orchestrator is currently draining.
    // Natural-sort by name.
    this.orgOptions = computed(() => {
      const opts: SignalListDropdownOption[] = [{ label: 'All', value: null }];
      const byCnsi = this._edsByCnsi();
      const selected = this.selectedCnsi();
      const edsList: EndpointDataService[] = selected
        ? (byCnsi.get(selected) ? [byCnsi.get(selected) as EndpointDataService] : [])
        : Array.from(byCnsi.values());
      const seen = new Map<string, string>();
      for (const eds of edsList) {
        for (const o of eds.orgs()) {
          if (!seen.has(o.guid)) seen.set(o.guid, o.name);
        }
      }
      const sorted = Array.from(seen.entries()).sort(([, a], [, b]) => naturalCompare(a, b));
      for (const [guid, label] of sorted) opts.push({ label, value: guid });
      return opts;
    });

    // Space options — cascade-aware.
    // - Org selected: list spaces in that org across the in-scope CNSIs,
    //   label = space name, natural sort.
    // - Org = All: list every space, label = "<space> - <org>", sorted
    //   by space name then org name. Lets the user jump directly to a
    //   space without picking the org first.
    this.spaceOptions = computed(() => {
      const opts: SignalListDropdownOption[] = [{ label: 'All', value: null }];
      const byCnsi = this._edsByCnsi();
      const selected = this.selectedCnsi();
      const edsList: EndpointDataService[] = selected
        ? (byCnsi.get(selected) ? [byCnsi.get(selected) as EndpointDataService] : [])
        : Array.from(byCnsi.values());
      const org = this.selectedOrg();
      if (org) {
        const seen = new Map<string, string>();
        for (const eds of edsList) {
          for (const s of eds.spaces()) {
            if (s.orgGuid !== org) continue;
            if (!seen.has(s.guid)) seen.set(s.guid, s.name);
          }
        }
        const sorted = Array.from(seen.entries()).sort(([, a], [, b]) => naturalCompare(a, b));
        for (const [guid, label] of sorted) opts.push({ label, value: guid });
        return opts;
      }
      // Org = All. Build a guid → { spaceName, orgName } augmentation
      // unioned across in-scope CNSIs. Org name lookup uses each EDS's
      // orgs() signal (cheap to read here — it's a Signal already).
      const augmented = new Map<string, { spaceName: string; orgName: string }>();
      for (const eds of edsList) {
        const orgNameByGuid = new Map(eds.orgs().map(o => [o.guid, o.name]));
        for (const s of eds.spaces()) {
          if (augmented.has(s.guid)) continue;
          augmented.set(s.guid, { spaceName: s.name, orgName: orgNameByGuid.get(s.orgGuid) ?? '' });
        }
      }
      const entries = Array.from(augmented.entries());
      entries.sort(([, a], [, b]) => {
        const bySpace = naturalCompare(a.spaceName, b.spaceName);
        if (bySpace !== 0) return bySpace;
        return naturalCompare(a.orgName, b.orgName);
      });
      for (const [guid, { spaceName, orgName }] of entries) {
        opts.push({ label: `${spaceName} - ${orgName}`, value: guid });
      }
      return opts;
    });

    // Org / Space dropdown loading flags — unioned across the in-scope
    // EndpointDataServices. Lets the SignalListDropdown surface a spinner
    // while the per-CNSI orgs/spaces drain is in flight, so a momentarily
    // empty list reads as "loading" rather than "no items available."
    this.isLoadingOrgs = computed(() => {
      const byCnsi = this._edsByCnsi();
      const selected = this.selectedCnsi();
      const edsList: EndpointDataService[] = selected
        ? (byCnsi.get(selected) ? [byCnsi.get(selected) as EndpointDataService] : [])
        : Array.from(byCnsi.values());
      return edsList.some(eds => eds.isLoadingOrgs());
    });
    this.isLoadingSpaces = computed(() => {
      const byCnsi = this._edsByCnsi();
      const selected = this.selectedCnsi();
      const edsList: EndpointDataService[] = selected
        ? (byCnsi.get(selected) ? [byCnsi.get(selected) as EndpointDataService] : [])
        : Array.from(byCnsi.values());
      return edsList.some(eds => eds.isLoadingSpaces());
    });

    // Flattened space → org map for the filter predicate. StServiceInstance
    // only carries space.guid; we don't get space.organization.guid on the
    // wall payload, so resolving an SI's org requires the spaces() signal
    // from EDS.
    this._orgGuidBySpaceGuid = computed(() => {
      const m = new Map<string, string>();
      for (const eds of this._edsByCnsi().values()) {
        for (const s of eds.spaces()) {
          m.set(s.guid, s.orgGuid);
        }
      }
      return m;
    });

    // After the first load, drop any selected CF whose value no longer
    // appears in the options (e.g. user disconnected it mid-session).
    // Keeps the dropdown text consistent with what the predicate is
    // actually doing.
    effect(() => {
      if (!this._hasLoadedOnce()) return;
      const cnsiValues = new Set(this.cnsiOptions().map(o => o.value));
      const cnsi = this.selectedCnsi();
      if (cnsi != null && !cnsiValues.has(cnsi)) this.selectedCnsi.set(null);
    });

    // Re-derive the filter predicate whenever a toolbar input changes. The
    // CF filter is a direct guid match; the text filter falls back to the
    // current row's name when the registered extractor is missing. The
    // scope filters (spaceGuid, typeFilter) come from initializeForSpace
    // and are read here so per-space tabs narrow without touching the
    // toolbar shape.
    effect(() => {
      const cnsi = this.selectedCnsi();
      const org = this.selectedOrg();
      const space = this.selectedSpace();
      const q = this.nameFilter().trim().toLowerCase();
      const field = this.filterField();
      const extractor = this._filterExtractors().get(field);
      const spaceGuid = this._spaceGuid();
      const typeFilter = this._typeFilter();
      const offeringGuid = this._offeringGuid();
      const orgGuidBySpaceGuid = this._orgGuidBySpaceGuid();
      this.filter.set((si: StServiceInstance) => {
        if (cnsi && si.cnsiGuid !== cnsi) return false;
        if (spaceGuid && si.space.guid !== spaceGuid) return false;
        // Toolbar org/space selections — only effective on the wall page;
        // per-space/per-offering callers don't render the dropdowns.
        if (space && si.space.guid !== space) return false;
        if (org && orgGuidBySpaceGuid.get(si.space.guid) !== org) return false;
        if (typeFilter) {
          const isUps = si.type === 'user-provided';
          if (typeFilter === 'user-provided' && !isUps) return false;
          if (typeFilter === 'managed' && isUps) return false;
        }
        if (offeringGuid) {
          // service-offering Instances tab — only instances whose
          // managed offering ref matches. UPS instances have no offering
          // ref so they are filtered out by definition (correct: the tab
          // is "instances of THIS offering"; UPS doesn't have an offering).
          if (si.servicePlan?.serviceOffering?.guid !== offeringGuid) return false;
        }
        if (q) {
          const hay = (extractor ? extractor(si) : (si.name ?? '')).toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
    });

    // Cascade rule: clear stale Space only when Org switches to a
    // different specific org. When Org returns to All, the Space
    // dropdown lists every space (labelled "<space> - <org>"), so the
    // current selection stays valid and must be preserved.
    effect(() => {
      const org = this.selectedOrg();
      const space = this.selectedSpace();
      if (!space) return;
      if (org === null) return;
      const orgGuidBySpaceGuid = this._orgGuidBySpaceGuid();
      if (orgGuidBySpaceGuid.get(space) !== org) {
        this.selectedSpace.set(null);
      }
    });
  }

  initialize(cnsiGuids: readonly string[]): void {
    this._hasLoadedOnce.set(false);
    // Resetting on every initialize keeps the wall caller's behaviour
    // intact regardless of whether a per-space / per-offering caller
    // previously narrowed the singleton in this session.
    this._spaceGuid.set('');
    this._typeFilter.set(undefined);
    this._offeringGuid.set('');
    this.swapAcquiredEds(cnsiGuids);
    const sources = cnsiGuids.map(guid => this.makeSource(guid));
    this.orchestrator = new MergeOrchestrator<StServiceInstance>(sources);
    this.view = new ViewPipeline<StServiceInstance>(
      this.orchestrator.allItems,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );
  }

  // Per-space variant — single CNSI, narrowed to one space and (usually)
  // one instance type. The toolbar still has the same shape but the CF
  // dropdown is pointless in this context (the per-space components elect
  // not to render it). The filter effect re-runs whenever _spaceGuid or
  // _typeFilter changes so no extra wiring is needed at the call site.
  initializeForSpace(cnsiGuid: string, spaceGuid: string, typeFilter?: 'managed' | 'user-provided'): void {
    this._hasLoadedOnce.set(false);
    this._spaceGuid.set(spaceGuid);
    this._typeFilter.set(typeFilter);
    this._offeringGuid.set('');
    this.swapAcquiredEds([cnsiGuid]);
    const sources = [this.makeSource(cnsiGuid)];
    this.orchestrator = new MergeOrchestrator<StServiceInstance>(sources);
    this.view = new ViewPipeline<StServiceInstance>(
      this.orchestrator.allItems,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );
  }

  // Per-offering variant — single CNSI, narrowed to instances of one
  // service offering (the service-catalog "Instances" tab on a service
  // offering detail page). UPS instances have no offering ref so they are
  // excluded by the filter regardless of typeFilter. The toolbar's CF
  // dropdown is pointless in this context (the consumer elects not to
  // render it).
  initializeForOffering(cnsiGuid: string, serviceOfferingGuid: string): void {
    this._hasLoadedOnce.set(false);
    this._spaceGuid.set('');
    this._typeFilter.set(undefined);
    this._offeringGuid.set(serviceOfferingGuid);
    this.swapAcquiredEds([cnsiGuid]);
    const sources = [this.makeSource(cnsiGuid)];
    this.orchestrator = new MergeOrchestrator<StServiceInstance>(sources);
    this.view = new ViewPipeline<StServiceInstance>(
      this.orchestrator.allItems,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );
  }

  // Swap the set of EDS handles tracked for toolbar dropdowns. Releases
  // refcount on any guid no longer in scope, acquires for new guids, and
  // updates _edsByCnsi atomically so dependent computeds see one
  // consistent transition. Wires destroyRef on first call so teardown
  // releases everything.
  private _destroyHookRegistered = false;
  private swapAcquiredEds(cnsiGuids: readonly string[]): void {
    if (!this.registry) {
      this._edsByCnsi.set(new Map());
      return;
    }
    const next = new Map<string, EndpointDataService>();
    const previous = this._edsByCnsi();
    const incoming = new Set(cnsiGuids);
    for (const guid of cnsiGuids) {
      const existing = previous.get(guid);
      next.set(guid, existing ?? this.registry.acquire(guid));
    }
    for (const [guid] of previous) {
      if (!incoming.has(guid)) this.registry.release(guid);
    }
    this._edsByCnsi.set(next);
    if (!this._destroyHookRegistered && this.destroyRef) {
      this._destroyHookRegistered = true;
      this.destroyRef.onDestroy(() => {
        for (const [guid] of this._edsByCnsi()) {
          this.registry?.release(guid);
        }
        this._edsByCnsi.set(new Map());
      });
    }
  }

  async loadAll(): Promise<void> {
    await this.orchestrator.load();
    this._hasLoadedOnce.set(true);
    this.writeBackToRegistry();
  }

  async refresh(): Promise<void> {
    if (!this.orchestrator) return;
    await this.orchestrator.refresh();
    this._hasLoadedOnce.set(true);
    this.writeBackToRegistry();
  }

  // Build a per-CNSI source, optionally pre-seeded from the registry's
  // services-details cache. Skip the seed when a fresh load is in-flight
  // — the in-flight will write the cache itself, and the orchestrator's
  // load() will fall through to its normal HTTP drain rather than risk
  // seeding mid-flight stale data.
  private makeSource(guid: string): CnsiServiceInstancesSource {
    const ds = this.registry?.acquire(guid);
    const source = new CnsiServiceInstancesSource(guid, this.http, ds);
    if (ds && !ds.isLoadingServicesDetails()) {
      const bundle = ds.serviceInstancesAndBrokers();
      if (bundle) source.preSeed(bundle.instances);
    }
    return source;
  }

  // Push the per-CNSI instances array back into the registry's
  // services-details cache so the next visit to Services finds a hot
  // bundle. Brokers are out of scope for this orchestrator; preserve any
  // brokers the registry already has from loadServicesDetails().
  private writeBackToRegistry(): void {
    if (!this.registry || !this.orchestrator) return;
    for (const source of this.orchestrator.sources) {
      const ds = this.registry.acquire(source.cnsiGuid);
      const existing = ds.serviceInstancesAndBrokers();
      const brokers = existing?.brokers ?? [];
      ds.setServiceInstancesAndBrokers(source.items() as StServiceInstance[], brokers);
    }
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

  // Same registration pattern as the offerings/orgs services. Components
  // call this after building their column config; ViewPipeline reads sort
  // extractors via the signal passed at construction time, and the filter
  // effect reads filter extractors directly from this map.
  registerSortExtractor(fieldKey: string, extractor: (row: StServiceInstance) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }

  registerFilterExtractor(fieldKey: string, extractor: (row: StServiceInstance) => string): void {
    this._filterExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }

  // Use runInInjectionContext if a future caller needs to register
  // extractors from outside an injection context. Today's component
  // signatures are already inside an injection context.
  runWithInjector<T>(fn: () => T): T {
    return runInInjectionContext(this.injector, fn);
  }

  // Delete a service instance through CnsiServiceInstancesSource. The
  // source handles writeWithJob (which waits for CF's async job to
  // terminate), patches its own _items, patches EndpointDataService's
  // serviceInstances signal, and fires the serviceInstance.delete cascade
  // (marks apps + bindings stale). Replaces the previous
  // optimistic-remove + refresh hybrid, which could leave server + local
  // state out of sync if the trailing refresh's page-2 refetch failed.
  async deleteServiceInstance(cnsiGuid: string, siGuid: string): Promise<void> {
    const src = this.orchestrator?.sourceFor(cnsiGuid) as CnsiServiceInstancesSource | undefined;
    if (src) {
      await src.delete(siGuid);
      // Mirror the orchestrator's aggregated view: even though the source
      // patches its own _items, the orchestrator-level removeRow keeps
      // the aggregated allItems Signal in sync for the merged-CNSI case.
      this.orchestrator.removeRow(cnsiGuid, siGuid);
      return;
    }
    // Orchestrator-undefined fallback (cold bookmark / HMR): instantiate
    // a one-shot source for the delete. EDS is still threaded so the
    // cascade fires.
    const eds = this.registry.acquire(cnsiGuid);
    const oneShot = new CnsiServiceInstancesSource(cnsiGuid, this.http, eds);
    await oneShot.delete(siGuid);
  }
}
