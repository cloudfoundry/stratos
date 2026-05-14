import { DestroyRef, Injectable, Injector, Signal, WritableSignal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';

import {
  ListStateStore,
  SignalListColumn,
  SignalListConfig,
} from '@stratosui/core';
import { EndpointsSignalService } from '@stratosui/core';
import type { EndpointModel } from '@stratosui/store';
import { stratosEntityCatalog } from '@stratosui/store';

// Wave-3 endpoints-list config service for the K8s landing page.
//
// Replaces the previous legacy-adapter shim (which wrapped a ngrx
// `BaseEndpointsDataSource` via `adaptLegacyListConfig`). This file is
// now a true signal-native consumer: rows are sourced from
// `EndpointsSignalService` (a `toSignal` projection of the endpoints
// store), filtered to k8s/connected entries, and paged through the
// shared local `ViewPipeline`. No `Store` import; no IListConfig; no
// pagination monitor.
//
// The legacy ngrx surface that previously lived in
// `kubernetes-endpoints-data-source.ts` and
// `kubernetes-endpoints-legacy-config.factory.ts` has been deleted —
// `BaseEndpointsDataSource` was overkill for a list that is just
// "filter the endpoints projection by cnsi_type=k8s + connected".
//
// The host page (`KubernetesComponent`) consumes `this.config` via
// `<app-signal-list>` and renders rows via the standard
// `<app-endpoint-card>` projected through the `cardTemplate` slot. The
// card's `dataSource` input is omitted; the card's gates on
// `dataSource.dsEndpointType` and `dataSource.getRowState` collapse
// gracefully (kebab menu suppressed — same effect as the legacy
// `dsEndpointType: 'k8s'` flag — and row error state stays clean).

// Sort spec mirrors the local copy in `endpoints-signal-config.service.ts`.
// We DON'T import that one because it lives under
// `core/src/features/endpoints/endpoints-page` (a feature-internal
// module); copying the 3-line shape avoids a cross-feature import for
// what is effectively a primitive type.
export interface SortSpec<T = unknown> {
  field: string;
  direction: 'asc' | 'desc';
  _phantom?: T;
}

const KUBERNETES_ENDPOINT_TYPE = 'k8s';

@Injectable({ providedIn: 'root' })
export class KubernetesEndpointsSignalConfigService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly endpointsSignals = inject(EndpointsSignalService);

  // Filter / sort / paging state. Card-only on the legacy K8s landing
  // page; pageSize 24 (a 2x12 / 3x8 / 4x6 friendly default for card
  // grids). Persistence keyed `kubernetes-endpoints` so toggling
  // viewMode / pageSize survives navigation away from the page.
  private readonly state = inject(ListStateStore).bind('kubernetes-endpoints', {
    viewMode: 'card',
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

  // Connected k8s endpoints, derived from the signal projection.
  // Filtering down here (rather than at the page) keeps the orchestrator
  // self-contained and makes the spec's mock surface as small as one
  // input signal.
  readonly endpoints: Signal<EndpointModel[]> = computed(() => {
    const all = Object.values(this.endpointsSignals.endpoints() ?? {});
    return all.filter(ep =>
      ep.cnsi_type === KUBERNETES_ENDPOINT_TYPE &&
      ep.connectionStatus === 'connected'
    );
  });

  // View pipeline: filter → sort → page. Built lazily by `initialize()`
  // (same shape as `endpoints-signal-config.service.ts`) so the host
  // can construct the service in tests without immediately wiring an
  // effect that observes signals during `TestBed.createComponent`.
  view!: ViewPipeline<EndpointModel>;

  private _initialized = false;
  private _config?: SignalListConfig<EndpointModel>;

  // Built once on first `config` read. `runInInjectionContext` is needed
  // because `effect()` inside `initialize()` requires an injection
  // context, and field-initializer reads of `config` may originate from
  // a component constructor that already provides one — but tests don't.
  get config(): SignalListConfig<EndpointModel> {
    if (!this._config) {
      runInInjectionContext(this.injector, () => this.initialize());
      this._config = this.buildConfig();
    }
    return this._config;
  }

  private initialize(): void {
    if (this._initialized) return;
    this._initialized = true;
    this.view = new ViewPipeline<EndpointModel>(
      this.endpoints,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
    );
    // Re-derive the filter predicate whenever the text input changes.
    // Predicate is recreated (not mutated) so `filteredItems` recomputes.
    effect(() => {
      const q = this.nameFilter().trim().toLowerCase();
      this.filter.set((ep: EndpointModel) => {
        if (!q) return true;
        return (ep.name ?? '').toLowerCase().includes(q);
      });
    });
    // Tidy attach point for future listeners (e.g. health-check pulse).
    // The signal projection is store-backed and has nothing to release.
    this.destroyRef.onDestroy(() => undefined);
  }

  private buildConfig(): SignalListConfig<EndpointModel> {
    const columns: SignalListColumn<EndpointModel>[] = [
      // Name column — sortable on the underlying field. The card
      // template renders names directly via the EndpointCardComponent;
      // this column drives table-mode rendering (for users who flip the
      // view toggle) and provides the sort field.
      {
        header: 'Name',
        key: 'name',
        sortField: 'name',
        kind: 'text',
        render: (ep: EndpointModel) => ep.name ?? '',
        widthHint: '24rem',
      },
      // Address column — useful as a secondary table-mode signal and as
      // a sortable axis. Card mode shows it inside the endpoint card so
      // there's no duplication.
      {
        header: 'Address',
        key: 'address',
        sortField: (ep: EndpointModel) => ep.api_endpoint?.Host ?? '',
        kind: 'text',
        render: (ep: EndpointModel) => ep.api_endpoint?.Host ?? '',
        widthHint: '32rem',
      },
    ];

    return {
      pagedItems: this.view.pagedItems,
      totalFilteredResults: this.view.totalFilteredResults,
      totalPages: this.view.totalPages,
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      // Endpoints projection is synchronous off the store — no async
      // load to track. `false` keeps the toolbar's loading affordance
      // off (matches the legacy behaviour, which had no spinner here).
      isAnyLoading: signal(false),
      errorsByCnsi: signal(new Map()),
      columns,
      getRowKey: (ep: EndpointModel) => ep.guid,
      emptyMessage: 'There are no endpoints',
      emptyFilterMessage: 'No endpoints match the current filters',
      pageSizeOptions: {
        table: [10, 25, 50, 100],
        card: [6, 12, 24, 48, 96],
      },
      nameFilter: this.nameFilter,
      onRefresh: () => this.refresh(),
      onClear: () => this.clearFilters(),
      viewMode: this.viewMode,
      sort: this.sort,
      hidePagerWhenSingle: true,
    };
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.sort.set({ field: 'name', direction: 'asc' });
    this.pageIndex.set(0);
  }

  refresh(): void {
    // Mirror the legacy data source's refresh, which dispatched
    // `GetAllEndpoints`. The api-side `getAll()` performs the dispatch
    // internally — keeps this service Store-free at the type level.
    if (stratosEntityCatalog?.endpoint?.api?.getAll) {
      stratosEntityCatalog.endpoint.api.getAll();
    }
  }

  // Releases any state held by the service. Currently a no-op (the
  // signal-backed projection has no subscriptions to tear down) but
  // preserved as the host page's hook so future state — e.g. an effect
  // watching for endpoint disconnects — can be released here without
  // touching the consumer.
  destroy(): void {
    this._config = undefined;
    this._initialized = false;
  }
}

// Local view pipeline. Same shape as the copies in
// `endpoints-signal-config.service.ts` and the cf-* signal configs;
// inlined here because hoisting it into core/store would touch
// unrelated packages and isn't part of this wave's scope.
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
  ) {
    this.filteredItems = computed(() => this.items().filter(this.filter()));
    this.sortedItems = computed(() => {
      const spec = this.sort();
      const sign = spec.direction === 'asc' ? 1 : -1;
      const getValue: (row: T) => unknown =
        (row: T) => (row as Record<string, unknown>)[spec.field];
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
