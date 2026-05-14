import { Injectable, Injector, Signal, WritableSignal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';

import { ListStateStore, SignalListSort } from '@stratosui/core';

import { KubeEndpointDataRegistry } from '../../../services/endpoint-data/kube-endpoint-data.registry';
import { KubeService, StratosError } from '../../../services/endpoint-data/kube-types';
import { KubeServiceDataService } from '../../../services/domain-data/kube-service-data.service';
import { KubeSortSpec, KubeViewPipeline } from '../kube-view-pipeline';

// Signal-native list config for the kubernetes-services page (cluster-
// scoped). Mirrors the namespaces signal-config — initialize(kubeGuid)
// pins the endpoint, view exposes filter/sort/page over the registry-
// backed services cache.

@Injectable({ providedIn: 'root' })
export class KubernetesServicesSignalConfigService {
  private readonly serviceData = inject(KubeServiceDataService);
  private readonly registry = inject(KubeEndpointDataRegistry);
  private readonly injector = inject(Injector);

  private kubeGuid = '';

  private readonly state = inject(ListStateStore).bind('kube-services', {
    viewMode: 'table',
    pageSize: [25, 25],
    pageIndex: [0, 0],
    sort: [
      { field: 'name', direction: 'asc' },
      { field: 'name', direction: 'asc' },
    ],
  });

  readonly filter: WritableSignal<(s: KubeService) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SignalListSort> as WritableSignal<KubeSortSpec<KubeService>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode = this.state.viewMode;

  private _services!: Signal<KubeService[]>;
  get services(): Signal<KubeService[]> {
    return this._services;
  }

  private readonly _sortExtractors: WritableSignal<Map<string, (row: KubeService) => unknown>> = signal(new Map([
    ['name', (s: KubeService) => (s.metadata?.name ?? '').toLowerCase()],
    ['clusterIp', (s: KubeService) => s.spec?.clusterIP ?? ''],
    ['portType', (s: KubeService) => s.spec?.type ?? ''],
    ['createdAt', (s: KubeService) => s.metadata?.creationTimestamp ?? ''],
  ]));

  view!: KubeViewPipeline<KubeService>;

  errors(): Signal<StratosError[]> {
    const svc = this.kubeGuid ? this.registry.getService(this.kubeGuid) : null;
    return computed(() => [...(svc?.errors() ?? []), ...this.serviceData.errors()()]);
  }

  isLoading(): Signal<boolean> {
    const svc = this.kubeGuid ? this.registry.getService(this.kubeGuid) : null;
    return computed(() => svc?.isLoading() ?? false);
  }

  initialize(kubeGuid: string): void {
    this.kubeGuid = kubeGuid;
    this._services = this.serviceData.servicesInCluster(kubeGuid);

    this.view = new KubeViewPipeline<KubeService>(
      this._services,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );

    runInInjectionContext(this.injector, () => {
      effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        this.filter.set((s: KubeService) => {
          if (!q) return true;
          return (s.metadata?.name ?? '').toLowerCase().includes(q);
        });
      });
    });
  }

  async loadAll(): Promise<void> {
    if (!this.kubeGuid) return;
    await this.serviceData.refresh({ kubeGuid: this.kubeGuid });
  }

  async refresh(): Promise<void> {
    if (!this.kubeGuid) return;
    await this.serviceData.refresh({ kubeGuid: this.kubeGuid });
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.sort.set({ field: 'name', direction: 'asc' });
    this.pageIndex.set(0);
  }
}
