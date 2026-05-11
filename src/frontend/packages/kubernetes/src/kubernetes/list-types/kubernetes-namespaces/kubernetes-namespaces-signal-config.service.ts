import { Injectable, Injector, Signal, WritableSignal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';

import { ListStateStore, SignalListSort } from '@stratosui/core';

import { KubeEndpointDataRegistry } from '../../../services/endpoint-data/kube-endpoint-data.registry';
import { KubeNamespace, StratosError } from '../../../services/endpoint-data/kube-types';
import { KubeNamespaceDataService } from '../../../services/domain-data/kube-namespace-data.service';

// Sort spec used inside the signal-config. Mirrors CF's ViewPipeline
// SortSpec but kept local so the kubernetes package doesn't depend on a
// CF-internal type.
interface KubeSortSpec<T> {
  field: string;
  direction: 'asc' | 'desc';
  _phantom?: T;
}

// Tiny view pipeline — filter → sort → page. Lives here rather than in
// a shared location because the kubernetes signal-list slice only needs
// this one shape for now; if a second consumer arrives we'll lift it
// into a kubernetes-internal `services/data-sources/` module.
class KubeViewPipeline<T> {
  readonly filteredItems: Signal<T[]>;
  readonly sortedItems: Signal<T[]>;
  readonly pagedItems: Signal<T[]>;
  readonly totalFilteredResults: Signal<number>;
  readonly totalPages: Signal<number>;

  constructor(
    items: Signal<T[]>,
    filter: Signal<(row: T) => boolean>,
    sort: Signal<KubeSortSpec<T>>,
    pageSize: Signal<number>,
    pageIndex: Signal<number>,
    keyExtractors: Signal<Map<string, (row: T) => unknown>>,
  ) {
    this.filteredItems = computed(() => items().filter(filter()));
    this.sortedItems = computed(() => {
      const spec = sort();
      const sign = spec.direction === 'asc' ? 1 : -1;
      const extractor = keyExtractors().get(spec.field);
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
      const size = pageSize();
      const idx = pageIndex();
      return this.sortedItems().slice(idx * size, idx * size + size);
    });
    this.totalFilteredResults = computed(() => this.filteredItems().length);
    this.totalPages = computed(() => {
      const n = this.totalFilteredResults();
      const size = pageSize();
      return size > 0 ? Math.max(1, Math.ceil(n / size)) : 1;
    });
  }
}

// Signal-native list config for the kubernetes-namespaces page. Drives a
// single-cluster namespace list via the registry-backed namespace cache.
//
// Usage from the host component:
//   svc.initialize(kubeGuid);
//   void svc.loadAll();
//   // ...bind svc.view.pagedItems / svc.sort / svc.pageSize / etc. to
//   //    a SignalListConfig and pass it to <app-signal-list>.

@Injectable({ providedIn: 'root' })
export class KubernetesNamespacesSignalConfigService {
  private readonly namespaceData = inject(KubeNamespaceDataService);
  private readonly registry = inject(KubeEndpointDataRegistry);
  private readonly injector = inject(Injector);

  private kubeGuid = '';

  private readonly state = inject(ListStateStore).bind('kube-namespaces', {
    viewMode: 'table',
    pageSize: [25, 25],
    pageIndex: [0, 0],
    sort: [
      { field: 'name', direction: 'asc' },
      { field: 'name', direction: 'asc' },
    ],
  });

  readonly filter: WritableSignal<(n: KubeNamespace) => boolean> = signal(() => true);
  // The state store hands back a SignalListSort; cast to our local
  // KubeSortSpec so the pipeline reads the correct shape (same field
  // names — direction discriminator is identical).
  readonly sort = this.state.sort as WritableSignal<SignalListSort> as WritableSignal<KubeSortSpec<KubeNamespace>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode = this.state.viewMode;

  // The underlying namespaces signal — projected from the registry-
  // backed endpoint cache so multiple consumers on the same cluster
  // share one fetch.
  private _namespaces!: Signal<KubeNamespace[]>;
  get namespaces(): Signal<KubeNamespace[]> {
    return this._namespaces;
  }

  private readonly _sortExtractors: WritableSignal<Map<string, (row: KubeNamespace) => unknown>> = signal(new Map([
    ['name', (n: KubeNamespace) => (n.metadata?.name ?? '').toLowerCase()],
    ['status', (n: KubeNamespace) => n.status?.phase ?? ''],
    ['createdAt', (n: KubeNamespace) => n.metadata?.creationTimestamp ?? ''],
  ]));

  view!: KubeViewPipeline<KubeNamespace>;

  // Tristate visibility — when the kube version / namespace fetch is
  // listed in the endpoint service's `unavailable`, we surface that to
  // the consumer so the page can render "Not Available" rather than a
  // spinner.
  errors(): Signal<StratosError[]> {
    const svc = this.kubeGuid ? this.registry.getService(this.kubeGuid) : null;
    return computed(() => svc?.errors() ?? []);
  }

  isLoading(): Signal<boolean> {
    const svc = this.kubeGuid ? this.registry.getService(this.kubeGuid) : null;
    return computed(() => svc?.isLoading() ?? false);
  }

  initialize(kubeGuid: string): void {
    this.kubeGuid = kubeGuid;
    this._namespaces = this.namespaceData.namespacesForEndpoint(kubeGuid);

    this.view = new KubeViewPipeline<KubeNamespace>(
      this._namespaces,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );

    runInInjectionContext(this.injector, () => {
      effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        this.filter.set((ns: KubeNamespace) => {
          if (!q) return true;
          return (ns.metadata?.name ?? '').toLowerCase().includes(q);
        });
      });
    });
  }

  async loadAll(): Promise<void> {
    if (!this.kubeGuid) return;
    const svc = this.registry.getService(this.kubeGuid);
    if (svc.lastFetched() === null) {
      // Fire the full endpoint load on a cold cache so version + nodes
      // populate alongside namespaces; the page only displays
      // namespaces but the cluster summary in surrounding chrome wants
      // the rest. Subscribe via the loaded$ replay so awaiting works.
      await new Promise<void>((resolve) => {
        const sub = svc.load().subscribe({
          next: () => { sub.unsubscribe(); resolve(); },
          error: () => { sub.unsubscribe(); resolve(); },
        });
      });
    }
  }

  async refresh(): Promise<void> {
    if (!this.kubeGuid) return;
    await this.namespaceData.refresh({ kubeGuid: this.kubeGuid });
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.sort.set({ field: 'name', direction: 'asc' });
    this.pageIndex.set(0);
  }

  registerSortExtractor(fieldKey: string, extractor: (row: KubeNamespace) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }
}
