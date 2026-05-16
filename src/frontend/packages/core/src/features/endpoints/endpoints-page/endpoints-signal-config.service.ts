import { DestroyRef, Injectable, Injector, Signal, WritableSignal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';
import {
  ActionState,
  AppState,
  EndpointModel,
  EndpointsDataService,
  EndpointType,
  Store,
} from '@stratosui/store';

import { EndpointsSignalService } from '../../../core/signals/endpoints-signal.service';
import { ListStateStore } from '../../../shared/components/signal-list/list-state-store.service';

// ViewPipeline lives in the cloud-foundry package today (used by the
// app/orgs/spaces/routes signal-list configs). Endpoints sits under @stratosui/core
// and core can't depend on cloud-foundry, so we re-implement the same shape locally.
// Identical semantics: filter → sort → page, with an optional sort-extractor map
// for fields that don't read directly off T. If/when ViewPipeline is hoisted into
// core (or @stratosui/store) this local copy collapses back to a single import.
export interface SortSpec<T = unknown> {
  field: string;
  direction: 'asc' | 'desc';
  _phantom?: T;
}

// Options bag for EndpointsSignalConfigService.register(). Mirrors the
// legacy `RegisterEndpoint` action's constructor argument shape (see
// store/src/actions/endpoint.actions.ts) but exposes it as named keys so
// callers don't have to remember the positional ordering of three booleans
// and three adjacent string credentials. Defaults applied inside register():
// `clientID = ''`, `clientSecret = ''`, `ssoAllowed = false`,
// `createSystemEndpoint = true`, `caCert = ''`.
export interface RegisterEndpointOptions {
  endpointType: EndpointType;
  endpointSubType: string | null;
  name: string;
  endpoint: string;
  skipSslValidation: boolean;
  clientID?: string;
  clientSecret?: string;
  ssoAllowed?: boolean;
  createSystemEndpoint?: boolean;
  caCert?: string;
}

export class ViewPipeline<T> {
  readonly filteredItems: Signal<T[]>;
  readonly sortedItems: Signal<T[]>;
  readonly pagedItems: Signal<T[]>;
  readonly totalFilteredResults: Signal<number>;
  readonly totalPages: Signal<number>;

  constructor(
    private readonly items: Signal<T[]>,
    private readonly filter: Signal<(row: T) => boolean>,
    private readonly sort: Signal<SortSpec<T>>,
    private readonly pageSize: Signal<number>,
    private readonly pageIndex: Signal<number>,
    private readonly keyExtractors?: Signal<Map<string, (row: T) => unknown>>,
  ) {
    this.filteredItems = computed(() => this.items().filter(this.filter()));
    this.sortedItems = computed(() => {
      const spec = this.sort();
      const sign = spec.direction === 'asc' ? 1 : -1;
      const extractor = this.keyExtractors?.().get(spec.field);
      const getValue: (row: T) => unknown = extractor
        ? extractor
        : (row: T) => (row as Record<string, unknown>)[spec.field];
      return [...this.filteredItems()].sort((a, b) => {
        const av = getValue(a);
        const bv = getValue(b);
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === 'number' && typeof bv === 'number') {
          return (av - bv) * sign;
        }
        return av < bv ? -1 * sign : av > bv ? 1 * sign : 0;
      });
    });
    this.pagedItems = computed(() => {
      const size = this.pageSize();
      const start = this.pageIndex() * size;
      return this.sortedItems().slice(start, start + size);
    });
    this.totalFilteredResults = computed(() => this.filteredItems().length);
    this.totalPages = computed(() => Math.ceil(this.totalFilteredResults() / this.pageSize()));
  }
}

// Endpoints list config service — provides the signal-native list pattern
// over `EndpointsDataService` (the W36-B replacement for the legacy
// `stratosEntityCatalog.endpoint.store` slice). Unlike the per-CNSI
// services in cloud-foundry (CfApps/Orgs/Spaces/Routes), endpoints have
// no parent CNSI: they're top-level records owned by `EndpointsDataService`.
// Filter / sort / paging machinery is identical to the CF analogs, so the
// visual / interaction language stays consistent across signal-list pages.
@Injectable({ providedIn: 'root' })
export class EndpointsSignalConfigService {
  private readonly store = inject<Store<AppState>>(Store);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly endpointsSignals = inject(EndpointsSignalService);
  private readonly endpointsData = inject(EndpointsDataService);

  // Filter / sort / paging state. Endpoints list has historically rendered as a
  // table by default (legacy ListConfig defaultView = 'cards' but the practical
  // information density on endpoints favours the table layout — short rows, lots
  // of metadata columns), and the spec calls for table-primary, pageSize 25.
  // pageSize/pageIndex/sort/viewMode persistence is delegated to ListStateStore
  // (keyed `stratos.list-state.v1.endpoints`).
  private readonly state = inject(ListStateStore).bind('endpoints', {
    viewMode: 'table',
    pageSize: [24, 25],
    pageIndex: [0, 0],
    sort: [{ field: 'name', direction: 'asc' }, { field: 'name', direction: 'asc' }],
  });

  readonly filter: WritableSignal<(ep: EndpointModel) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SortSpec<EndpointModel>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode = this.state.viewMode;

  // Endpoint entries sourced from EndpointsSignalService so the
  // toSignal(store.select(endpointEntitiesSelector)) bridge lives in
  // exactly one place. Project the Record to an array via Object.values()
  // so re-renders fire only when the underlying signal emits.
  readonly endpoints: Signal<EndpointModel[]> = computed(
    () => Object.values(this.endpointsSignals.endpoints() ?? {})
  );

  view!: ViewPipeline<EndpointModel>;

  private readonly _sortExtractors: WritableSignal<Map<string, (row: EndpointModel) => unknown>> = signal(new Map());

  initialize(): void {
    this.view = new ViewPipeline<EndpointModel>(
      this.endpoints,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );
    runInInjectionContext(this.injector, () => {
      effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        this.filter.set((ep: EndpointModel) => {
          if (!q) return true;
          return (ep.name ?? '').toLowerCase().includes(q);
        });
      });
    });
    // No registry release pattern here — endpointEntitiesSelector is a pure
    // store projection. The DestroyRef hook stays as a placeholder so future
    // listeners (e.g. health-check pulse subscription) have a tidy attach
    // point without restructuring the service.
    this.destroyRef.onDestroy(() => undefined);
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.sort.set({ field: 'name', direction: 'asc' });
    this.pageIndex.set(0);
  }

  refresh(): void {
    // W36-B Wave 3: refresh via signal-native EndpointsDataService.
    // System info refresh is owned by the surrounding page (it also
    // drives the haveRegistered / haveConnected snackbar logic), so we
    // leave it alone here.
    void this.endpointsData.getAll(false).catch(() => {/* surfaced via service.error */});
  }

  registerSortExtractor(fieldKey: string, extractor: (row: EndpointModel) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }

  // W36-B Wave 3: thin wrapper over EndpointsDataService.disconnect.
  // The service returns Promise<ActionState>; callers that previously
  // pair-watched the legacy Observable<ActionState> for the busy→idle
  // transition now just await the single resolved final state.
  disconnectEndpoint(guid: string, _type: string): Promise<ActionState> {
    return this.endpointsData.disconnect(guid);
  }

  // Same shape as disconnect — service-managed lifecycle, single
  // resolved ActionState (with .error / .message) returned.
  unregisterEndpoint(guid: string, _type: string): Promise<ActionState> {
    return this.endpointsData.unregister(guid);
  }

  // Promise-returning register wrapper used by the signal-native registration
  // wizards (git, create-endpoint, helm-hub, kube-config-import). Wraps the
  // ActionState observable in the same pairwise+filter-on-busy-edge pattern
  // the legacy callsites used so the caller sees a single resolved
  // ActionState (with .error / .message) rather than driving the lifecycle
  // itself. On success, ActionState.message holds the new endpoint guid.
  //
  // Takes a single options object rather than positional args: the legacy
  // RegisterEndpoint action has 10 parameters, several of them booleans
  // (`skipSslValidation`, `ssoAllowed`, `createSystemEndpoint`) and several
  // of them adjacent strings (`clientID`, `clientSecret`, `caCert`) — a
  // shape begging for silent transposition errors at call sites that pass
  // real UAA credentials. Named-key destructuring at every wrapper kills
  // that whole class of bug, and keeps wrapper-vs-action-builder defaults
  // honest (drift here is invisible until production).
  //
  // Fields:
  //   endpointType         — entity-catalog endpoint type id (e.g. 'cf', 'git')
  //   endpointSubType      — sub-type discriminator, or null if N/A
  //   name                 — user-supplied display name
  //   endpoint             — endpoint URL
  //   skipSslValidation    — disable TLS verification on Jetstream→endpoint calls
  //   clientID             — optional OAuth client id (UAA / GitHub apps); '' when unused
  //   clientSecret         — optional OAuth client secret; '' when unused
  //   ssoAllowed           — opt this endpoint into SSO redirect flows
  //   createSystemEndpoint — admin: register as system-wide vs per-user endpoint
  //   caCert               — optional PEM-encoded CA cert override
  async register(opts: RegisterEndpointOptions): Promise<ActionState> {
    const {
      endpointType,
      endpointSubType,
      name,
      endpoint,
      skipSslValidation,
      clientID = '',
      clientSecret = '',
      ssoAllowed = false,
      createSystemEndpoint = true,
      caCert = '',
    } = opts;
    // W36-B Wave 3: delegate to EndpointsDataService.register, which
    // owns the HTTP call + lifecycle signals and returns the resolved
    // final ActionState directly. The previous pairwise+filter shape
    // existed to flatten the legacy ngrx busy→idle Observable into a
    // single Promise; the new service already exposes that semantics.
    return this.endpointsData.register({
      endpointType,
      endpointSubType,
      name,
      endpoint,
      skipSslValidation,
      clientID,
      clientSecret,
      ssoAllowed,
      createSystemEndpoint,
      caCert,
    });
  }

  // W36-B Wave 3: promise-returning unregister wrapper now backed by
  // EndpointsDataService.unregister (Promise<ActionState>). Type is
  // accepted for caller compatibility but not forwarded — the new
  // service derives endpoint type from the local map.
  async unregister(guid: string, _type: EndpointType): Promise<ActionState> {
    return this.endpointsData.unregister(guid);
  }
}
