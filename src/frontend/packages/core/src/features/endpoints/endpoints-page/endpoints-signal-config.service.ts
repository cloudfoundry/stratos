import { DestroyRef, Injectable, Injector, Signal, WritableSignal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import {
  ActionState,
  AppState,
  EndpointModel,
  endpointEntitiesSelector,
  stratosEntityCatalog,
} from '@stratosui/store';

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

// Endpoints list config service — bridges the legacy ngrx endpoints store to the
// signal-native list pattern. Unlike the per-CNSI services in cloud-foundry
// (CfApps/Orgs/Spaces/Routes), endpoints have no parent CNSI: they're top-level
// records under stratosEntityCatalog.endpoint.store. The data source is therefore
// a direct toSignal() over endpointEntitiesSelector — no EndpointDataService /
// registry indirection involved. Filter / sort / paging machinery is identical to
// the CF analogs, so the visual / interaction language stays consistent across
// signal-list pages.
@Injectable({ providedIn: 'root' })
export class EndpointsSignalConfigService {
  private readonly store = inject<Store<AppState>>(Store);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  // Filter / sort / paging state. Endpoints list has historically rendered as a
  // table by default (legacy ListConfig defaultView = 'cards' but the practical
  // information density on endpoints favours the table layout — short rows, lots
  // of metadata columns), and the spec calls for table-primary, pageSize 25.
  readonly filter: WritableSignal<(ep: EndpointModel) => boolean> = signal(() => true);
  readonly sort: WritableSignal<SortSpec<EndpointModel>> = signal({ field: 'name', direction: 'asc' });
  readonly pageSize: WritableSignal<number> = signal(25);
  readonly pageIndex: WritableSignal<number> = signal(0);
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode: WritableSignal<'table' | 'card'> = signal('table');

  // Endpoint store holds Record<guid, EndpointModel>. Project to an array via
  // Object.values() in a computed so re-renders fire only when the underlying
  // selector emits, not on every interaction. Use empty-record initial value
  // so the first synchronous read before ngrx hydrates returns [] not undefined.
  private readonly endpointsRecord: Signal<Record<string, EndpointModel>> = toSignal(
    this.store.select(endpointEntitiesSelector),
    { initialValue: {} as Record<string, EndpointModel> },
  );

  readonly endpoints: Signal<EndpointModel[]> = computed(() => Object.values(this.endpointsRecord() ?? {}));

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
    // The legacy endpoint card / list both dispatch endpoint.actions.getAll();
    // mirror that. System info refresh is owned by the surrounding page (it
    // also drives the haveRegistered / haveConnected snackbar logic), so we
    // leave it alone here.
    if (stratosEntityCatalog?.endpoint?.actions?.getAll) {
      this.store.dispatch(stratosEntityCatalog.endpoint.actions.getAll());
    }
  }

  registerSortExtractor(fieldKey: string, extractor: (row: EndpointModel) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }

  // Thin wrapper over the entity-catalog disconnect API — same call the legacy
  // EndpointListHelper makes. Returns an Observable<ActionState> the caller can
  // pair-watch to surface success / failure into the snackbar.
  disconnectEndpoint(guid: string, type: string) {
    return stratosEntityCatalog.endpoint.api.disconnect<ActionState>(guid, type);
  }

  // Same shape as disconnect — entity-catalog dispatches the unregister action
  // and returns an ActionState observable.
  unregisterEndpoint(guid: string, type: string) {
    return stratosEntityCatalog.endpoint.api.unregister<ActionState>(guid, type);
  }
}
