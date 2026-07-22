import { EffectRef, Injectable, Injector, Signal, WritableSignal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';

import { ListStateStore, SignalListSort } from '@stratosui/core';

import { KubeEndpointDataRegistry } from '../../../services/endpoint-data/kube-endpoint-data.registry';
import { KubeNamespace, StratosError } from '../../../services/endpoint-data/kube-types';
import { KubeNamespaceDataService } from '../../../services/domain-data/kube-namespace-data.service';
import { KubeSortSpec, KubeViewPipeline } from '../kube-view-pipeline';

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

  // Captured so a re-entry (this is a root singleton, but components call
  // initialize() on every mount) destroys the prior filter effect instead
  // of stacking one live effect per navigation on the root injector.
  private filterEffect?: EffectRef;

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

    this.filterEffect?.destroy();
    runInInjectionContext(this.injector, () => {
      this.filterEffect = effect(() => {
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
