import { Injectable, Injector, Signal, WritableSignal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';

import { ListStateStore, SignalListSort } from '@stratosui/core';

import { KubeHelmDataService } from '../../../services/endpoint-data/kube-helm-data.service';
import { HelmRelease, StratosError } from '../../../services/endpoint-data/kube-types';

// Sort spec (mirror of KubernetesNamespacesSignalConfigService — kept
// local to avoid a CF-internal dependency).
interface KubeSortSpec<T> {
  field: string;
  direction: 'asc' | 'desc';
  _phantom?: T;
}

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
        if (av instanceof Date && bv instanceof Date) {
          return (av.getTime() - bv.getTime()) * sign;
        }
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

// Signal-native list config for the helm-releases (workloads) page.
// Cluster-scoped enumeration — `KubeHelmDataService.allReleases()`
// returns every helm release across every connected k8s endpoint, and
// the page presents them as a single list with cluster + namespace
// columns.
//
// Usage:
//   svc.initialize();
//   void svc.loadAll();
//   // bind svc.view.pagedItems / svc.sort / svc.pageSize to a
//   // SignalListConfig and pass it to <app-signal-list>.

@Injectable({ providedIn: 'root' })
export class HelmReleasesSignalConfigService {
  private readonly helmData = inject(KubeHelmDataService);
  private readonly injector = inject(Injector);

  private readonly state = inject(ListStateStore).bind('helm-releases', {
    viewMode: 'card',
    pageSize: [9, 9],
    pageIndex: [0, 0],
    sort: [
      { field: 'name', direction: 'asc' },
      { field: 'name', direction: 'asc' },
    ],
  });

  readonly filter: WritableSignal<(r: HelmRelease) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SignalListSort> as WritableSignal<KubeSortSpec<HelmRelease>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode = this.state.viewMode;

  // Cross-endpoint multi-filter state. These mirror the legacy
  // multi-filter dropdowns ("Kubernetes" + "Namespace") so the page
  // surfaces the same filtering UX. Empty string = "All".
  readonly kubeIdFilter: WritableSignal<string> = signal('');
  readonly namespaceFilter: WritableSignal<string> = signal('');

  private readonly _releases: Signal<HelmRelease[]> = this.helmData.allReleases();
  get releases(): Signal<HelmRelease[]> { return this._releases; }

  private readonly _sortExtractors: WritableSignal<Map<string, (row: HelmRelease) => unknown>> = signal(new Map<string, (row: HelmRelease) => unknown>([
    ['name', (r: HelmRelease) => (r.name ?? '').toLowerCase()],
    ['namespace', (r: HelmRelease) => (r.namespace ?? '').toLowerCase()],
    ['status', (r: HelmRelease) => (r.status ?? '').toLowerCase()],
    ['version', (r: HelmRelease) => r.chart?.metadata?.version ?? ''],
    ['lastDeployed', (r: HelmRelease) => r.lastDeployed ?? new Date(0)],
  ]));

  view!: KubeViewPipeline<HelmRelease>;

  errors(): Signal<StratosError[]> {
    return this.helmData.errors();
  }

  isLoading(): Signal<boolean> {
    return this.helmData.isLoadingReleases();
  }

  initialize(): void {
    this.view = new KubeViewPipeline<HelmRelease>(
      this._releases,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );

    runInInjectionContext(this.injector, () => {
      effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        const kubeId = this.kubeIdFilter();
        const ns = this.namespaceFilter();
        this.filter.set((r: HelmRelease) => {
          if (kubeId && r.endpointId !== kubeId) return false;
          if (ns && r.namespace !== ns) return false;
          if (q && !(r.name ?? '').toLowerCase().includes(q)) return false;
          return true;
        });
      });
    });
  }

  async loadAll(): Promise<void> {
    if (this.helmData.releasesLastFetched() === null) {
      await this.helmData.loadReleases();
    }
  }

  async refresh(): Promise<void> {
    await this.helmData.loadReleases();
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.kubeIdFilter.set('');
    this.namespaceFilter.set('');
    this.sort.set({ field: 'name', direction: 'asc' });
    this.pageIndex.set(0);
  }

  registerSortExtractor(fieldKey: string, extractor: (row: HelmRelease) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }
}
