import {
  Injectable,
  Injector,
  Signal,
  WritableSignal,
  computed,
  effect,
  inject,
  runInInjectionContext,
  signal,
} from '@angular/core';

import { ListStateStore, SignalListSort } from '@stratosui/core';

import { KubeEndpointDataRegistry } from '../../../services/endpoint-data/kube-endpoint-data.registry';
import { KubePod, StratosError } from '../../../services/endpoint-data/kube-types';
import { KubePodDataService } from '../../../services/domain-data/kube-pod-data.service';

interface KubeSortSpec<T> {
  field: string;
  direction: 'asc' | 'desc';
  _phantom?: T;
}

class KubePodViewPipeline {
  readonly filteredItems: Signal<KubePod[]>;
  readonly sortedItems: Signal<KubePod[]>;
  readonly pagedItems: Signal<KubePod[]>;
  readonly totalFilteredResults: Signal<number>;
  readonly totalPages: Signal<number>;

  constructor(
    items: Signal<KubePod[]>,
    filter: Signal<(row: KubePod) => boolean>,
    sort: Signal<KubeSortSpec<KubePod>>,
    pageSize: Signal<number>,
    pageIndex: Signal<number>,
    keyExtractors: Signal<Map<string, (row: KubePod) => unknown>>,
  ) {
    this.filteredItems = computed(() => items().filter(filter()));
    this.sortedItems = computed(() => {
      const spec = sort();
      const sign = spec.direction === 'asc' ? 1 : -1;
      const extractor = keyExtractors().get(spec.field);
      const getValue: (row: KubePod) => unknown = extractor
        ? extractor
        : (row: KubePod) => (row as unknown as Record<string, unknown>)[spec.field];
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

// Signal-native list config for the namespace-scoped pods page (sub-route
// of `:endpointId/namespaces/:namespaceName/pods`). Mirrors the legacy
// KubernetesNamespacePodsListConfigService — Namespace column hidden,
// Node column kept.

@Injectable({ providedIn: 'root' })
export class KubernetesNamespacePodsSignalConfigService {
  private readonly podData = inject(KubePodDataService);
  private readonly registry = inject(KubeEndpointDataRegistry);
  private readonly injector = inject(Injector);

  private kubeGuid = '';
  private namespace = '';

  private readonly state = inject(ListStateStore).bind('kube-ns-pods', {
    viewMode: 'table',
    pageSize: [25, 25],
    pageIndex: [0, 0],
    sort: [
      { field: 'name', direction: 'asc' },
      { field: 'name', direction: 'asc' },
    ],
  });

  readonly filter: WritableSignal<(p: KubePod) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SignalListSort> as WritableSignal<KubeSortSpec<KubePod>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode = this.state.viewMode;

  private _pods!: Signal<KubePod[]>;
  get pods(): Signal<KubePod[]> {
    return this._pods;
  }

  private readonly _sortExtractors: WritableSignal<Map<string, (row: KubePod) => unknown>> = signal(
    new Map<string, (row: KubePod) => unknown>([
      ['name', (p: KubePod) => (p.metadata?.name ?? '').toLowerCase()],
      ['node', (p: KubePod) => (p.spec?.nodeName ?? '').toLowerCase()],
      ['status', (p: KubePod) => p.expandedStatus?.status ?? ''],
      ['restarts', (p: KubePod) => p.expandedStatus?.restarts ?? 0],
      ['createdAt', (p: KubePod) => p.metadata?.creationTimestamp ?? ''],
    ]),
  );

  view!: KubePodViewPipeline;

  errors(): Signal<StratosError[]> {
    return this.podData.errors();
  }

  isLoading(): Signal<boolean> {
    const svc = this.kubeGuid ? this.registry.getService(this.kubeGuid) : null;
    return computed(() => svc?.isLoading() ?? false);
  }

  initialize(kubeGuid: string, namespace: string): void {
    this.kubeGuid = kubeGuid;
    this.namespace = namespace;
    this._pods = this.podData.podsInNamespace(kubeGuid, namespace);

    this.view = new KubePodViewPipeline(
      this._pods,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );

    runInInjectionContext(this.injector, () => {
      effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        this.filter.set((p: KubePod) => {
          if (!q) return true;
          return (p.metadata?.name ?? '').toLowerCase().includes(q);
        });
      });
    });
  }

  async refresh(): Promise<void> {
    if (!this.kubeGuid || !this.namespace) return;
    await this.podData.refresh({ kubeGuid: this.kubeGuid, namespace: this.namespace });
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.sort.set({ field: 'name', direction: 'asc' });
    this.pageIndex.set(0);
  }
}
