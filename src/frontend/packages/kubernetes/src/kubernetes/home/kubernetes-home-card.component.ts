import { Component, Signal, computed, inject, signal, ChangeDetectionStrategy, input } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

import { HomePageCardLayout } from '../../../../core/src/features/home/home.types';
import { EndpointModel } from '../../../../store/src/types/endpoint.types';
import { KubePodDataService } from '../../services/domain-data/kube-pod-data.service';
import { KubeNodeDataService } from '../../services/domain-data/kube-node-data.service';
import { KubeNamespaceDataService } from '../../services/domain-data/kube-namespace-data.service';
import { KubeClusterLoadFailures } from '../../services/domain-data/kube-cluster-load-failures';
import { TileGridComponent } from '../../../../core/src/shared/components/tile/tile-grid/tile-grid.component';
import { TileGroupComponent } from '../../../../core/src/shared/components/tile/tile-group/tile-group.component';
import { TileComponent } from '../../../../core/src/shared/components/tile/tile/tile.component';
import { CardNumberMetricComponent } from '../../../../core/src/shared/components/cards/card-number-metric/card-number-metric.component';

@Component({
  selector: 'app-k8s-home-card',
  templateUrl: './kubernetes-home-card.component.html',
  styleUrls: ['./kubernetes-home-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    TileGridComponent,
    TileGroupComponent,
    TileComponent,
    CardNumberMetricComponent
  ]
})
export class KubernetesHomeCardComponent {

  // Always set by the home page host (HomePageEndpointCard contract).
  readonly endpoint = input.required<EndpointModel>();

  // The home page sets a layout on every card; this one does not use it.
  readonly layout = input<HomePageCardLayout>();

  private podData = inject(KubePodDataService);
  private nodeData = inject(KubeNodeDataService);
  private namespaceData = inject(KubeNamespaceDataService);
  private failures = inject(KubeClusterLoadFailures);

  // The endpoint guid, set when the container triggers load(). Counts stay
  // 0 until then so an unloaded card renders cleanly.
  private guidSig = signal<string>('');

  // Counts read straight off the cluster-scoped signal data services. Pods
  // auto-load on read; node/namespace are primed by refresh() in load().
  // A count whose last load failed is null (the tile shows "-"), not 0.
  readonly podCount = computed(() => {
    const guid = this.guidSig();
    if (guid && this.failures.pods(guid)) return null;
    return guid ? (this.podData.podsInCluster(guid) as Signal<unknown[]>)().length : 0;
  });
  readonly nodeCount = computed(() => {
    const guid = this.guidSig();
    if (guid && this.failures.nodes(guid)) return null;
    return guid ? (this.nodeData.nodesInCluster(guid) as Signal<unknown[]>)().length : 0;
  });
  readonly namespaceCount = computed(() => {
    const guid = this.guidSig();
    if (guid && this.failures.namespaces(guid)) return null;
    return guid ? (this.namespaceData.namespacesForEndpoint(guid) as Signal<unknown[]>)().length : 0;
  });
  // Why a count failed to load, shown under the tiles.
  readonly failureReason = computed(() => {
    const guid = this.guidSig();
    return guid ? this.failures.any(guid) : undefined;
  });

  // True once none of the three lists is still being fetched. The counts
  // are read first: the pod list starts loading on that read, so its
  // loading flag is already set when it is checked.
  private readonly loaded = computed(() => {
    this.podCount();
    this.nodeCount();
    this.namespaceCount();
    const guid = this.guidSig();
    return !!guid
      && !this.podData.scopeLoading({ kubeGuid: guid })
      && !this.nodeData.loading(guid)
      && !this.namespaceData.listLoading(guid)();
  });
  private readonly loaded$ = toObservable(this.loaded);

  // Card is instructed to load its view by the container, whn it is visible
  load(): Observable<boolean> {
    // strict: home cards only render for registered endpoints, which always have a guid
    const guid = this.endpoint().guid!;
    // Drives the count computeds; pods auto-load on read, node/namespace
    // need an explicit refresh to populate their cluster caches.
    this.guidSig.set(guid);
    void this.nodeData.refresh(guid);
    void this.namespaceData.refresh({ kubeGuid: guid });

    return this.loaded$;
  }
}
