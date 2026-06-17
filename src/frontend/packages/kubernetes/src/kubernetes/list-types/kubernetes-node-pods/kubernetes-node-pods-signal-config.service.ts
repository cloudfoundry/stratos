import {
  EffectRef,
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

// Signal-native list config for the node-scoped pods page (sub-route of
// `:endpointId/nodes/:nodeName/pods`). Mirrors the legacy
// KubernetesNodePodsListConfigService — Node column hidden, Namespace
// column kept.

@Injectable({ providedIn: 'root' })
export class KubernetesNodePodsSignalConfigService {
  private readonly podData = inject(KubePodDataService);
  private readonly registry = inject(KubeEndpointDataRegistry);
  private readonly injector = inject(Injector);

  private kubeGuid = '';
  private nodeName = '';

  private readonly state = inject(ListStateStore).bind('kube-node-pods', {
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
      ['namespace', (p: KubePod) => (p.metadata?.namespace ?? '').toLowerCase()],
      ['status', (p: KubePod) => p.expandedStatus?.status ?? ''],
      ['restarts', (p: KubePod) => p.expandedStatus?.restarts ?? 0],
      ['createdAt', (p: KubePod) => p.metadata?.creationTimestamp ?? ''],
    ]),
  );

  view!: KubePodViewPipeline;

  // Captured so a re-entry (root singleton, but initialize() runs per mount)
  // destroys the prior filter effect instead of stacking one per navigation.
  private filterEffect?: EffectRef;

  errors(): Signal<StratosError[]> {
    return this.podData.errors();
  }

  isLoading(): Signal<boolean> {
    const svc = this.kubeGuid ? this.registry.getService(this.kubeGuid) : null;
    return computed(() => svc?.isLoading() ?? false);
  }

  initialize(kubeGuid: string, nodeName: string): void {
    this.kubeGuid = kubeGuid;
    this.nodeName = nodeName;
    this._pods = this.podData.podsOnNode(kubeGuid, nodeName);

    this.view = new KubePodViewPipeline(
      this._pods,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );

    this.filterEffect?.destroy();
    runInInjectionContext(this.injector, () => {
      this.filterEffect = effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        this.filter.set((p: KubePod) => {
          if (!q) return true;
          return (p.metadata?.name ?? '').toLowerCase().includes(q);
        });
      });
    });
  }

  async refresh(): Promise<void> {
    if (!this.kubeGuid || !this.nodeName) return;
    await this.podData.refresh({ kubeGuid: this.kubeGuid, nodeName: this.nodeName });
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.sort.set({ field: 'name', direction: 'asc' });
    this.pageIndex.set(0);
  }
}
