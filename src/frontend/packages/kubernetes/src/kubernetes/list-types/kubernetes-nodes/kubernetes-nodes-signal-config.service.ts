import { EffectRef, Injectable, Injector, Signal, WritableSignal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';

import { ListStateStore, SignalListSort } from '@stratosui/core';

import { KubeEndpointDataRegistry } from '../../../services/endpoint-data/kube-endpoint-data.registry';
import { KubeNode, StratosError } from '../../../services/endpoint-data/kube-types';
import { KubeNodeDataService } from '../../../services/domain-data/kube-node-data.service';
import { KubeViewPipeline, KubeSortSpec } from '../kube-view-pipeline';

// Signal-native list config for the kubernetes-nodes page. Wires the
// view pipeline over KubeNodeDataService.nodesInCluster(kubeGuid) so the
// list reacts to refreshes without ngrx involvement.
//
// Filter keys mirror the legacy KubernetesNodesListConfigService: name,
// IP address, labels. The legacy filter was a single-text-with-keyed-
// dropdown; for wave-2 we collapse to a single name-only filter (parity
// with namespaces page) and document the deferral.

@Injectable({ providedIn: 'root' })
export class KubernetesNodesSignalConfigService {
  private readonly nodeData = inject(KubeNodeDataService);
  private readonly registry = inject(KubeEndpointDataRegistry);
  private readonly injector = inject(Injector);

  private kubeGuid = '';

  private readonly state = inject(ListStateStore).bind('kube-nodes', {
    viewMode: 'table',
    pageSize: [25, 25],
    pageIndex: [0, 0],
    sort: [
      { field: 'name', direction: 'asc' },
      { field: 'name', direction: 'asc' },
    ],
  });

  readonly filter: WritableSignal<(n: KubeNode) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SignalListSort> as WritableSignal<KubeSortSpec<KubeNode>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode = this.state.viewMode;

  private _nodes!: Signal<KubeNode[]>;
  get nodes(): Signal<KubeNode[]> {
    return this._nodes;
  }

  private readonly _sortExtractors: WritableSignal<Map<string, (row: KubeNode) => unknown>> = signal(new Map([
    ['name', (n: KubeNode) => (n.metadata?.name ?? '').toLowerCase()],
    ['ready', (n: KubeNode) => readyConditionStatus(n)],
    ['createdAt', (n: KubeNode) => n.metadata?.creationTimestamp ?? ''],
  ]));

  view!: KubeViewPipeline<KubeNode>;

  // Captured so a re-entry (root singleton, but initialize() runs per mount)
  // destroys the prior filter effect instead of stacking one per navigation.
  private filterEffect?: EffectRef;

  errors(): Signal<StratosError[]> {
    const svc = this.kubeGuid ? this.registry.getService(this.kubeGuid) : null;
    return computed(() => [...(svc?.errors() ?? []), ...this.nodeData.errors()()]);
  }

  isLoading(): Signal<boolean> {
    const svc = this.kubeGuid ? this.registry.getService(this.kubeGuid) : null;
    return computed(() => svc?.isLoading() ?? false);
  }

  initialize(kubeGuid: string): void {
    this.kubeGuid = kubeGuid;
    this._nodes = this.nodeData.nodesInCluster(kubeGuid);

    this.view = new KubeViewPipeline<KubeNode>(
      this._nodes,
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
        this.filter.set((n: KubeNode) => {
          if (!q) return true;
          return (n.metadata?.name ?? '').toLowerCase().includes(q);
        });
      });
    });
  }

  async loadAll(): Promise<void> {
    if (!this.kubeGuid) return;
    await this.nodeData.refresh(this.kubeGuid);
  }

  async refresh(): Promise<void> {
    if (!this.kubeGuid) return;
    await this.nodeData.refresh(this.kubeGuid);
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.sort.set({ field: 'name', direction: 'asc' });
    this.pageIndex.set(0);
  }
}

// Helper — extracts the Ready condition status string for sorting.
function readyConditionStatus(n: KubeNode): string {
  const cond = (n.status?.conditions ?? []).find(c => c.type === 'Ready');
  return cond?.status ?? '';
}
