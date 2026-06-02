import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, Signal, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

import { SessionService } from '../../../../core/src/core/session.service';
import { HomePageCardLayout } from '../../../../core/src/features/home/home.types';
import { HomeCardShortcut } from '../../../../store/src/entity-catalog/entity-catalog.types';
import { EndpointModel } from '../../../../store/src/types/endpoint.types';
import { KubePodDataService } from '../../services/domain-data/kube-pod-data.service';
import { KubeNodeDataService } from '../../services/domain-data/kube-node-data.service';
import { KubeNamespaceDataService } from '../../services/domain-data/kube-namespace-data.service';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { TileGridComponent } from '../../../../core/src/shared/components/tile/tile-grid/tile-grid.component';
import { TileGroupComponent } from '../../../../core/src/shared/components/tile/tile-group/tile-group.component';
import { TileComponent } from '../../../../core/src/shared/components/tile/tile/tile.component';
import { CardNumberMetricComponent } from '../../../../core/src/shared/components/cards/card-number-metric/card-number-metric.component';
import { HomeShortcutsComponent } from '../../../../core/src/features/home/home/home-shortcuts/home-shortcuts.component';

@Component({
  selector: 'app-k8s-home-card',
  templateUrl: './kubernetes-home-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    TileGridComponent,
    TileGroupComponent,
    TileComponent,
    CardNumberMetricComponent,
    HomeShortcutsComponent
  ]
})
export class KubernetesHomeCardComponent implements OnInit {

  @Input() endpoint!: EndpointModel;

  pLayout: HomePageCardLayout;

  get layout(): HomePageCardLayout {
    return this.pLayout;
  }

  @Input() set layout(value: HomePageCardLayout) {
    if (value) {
      this.pLayout = value;
    }
  }

  public shortcuts!: HomeCardShortcut[];

  private session = inject(SessionService);
  private http = inject(HttpClient);
  private podData = inject(KubePodDataService);
  private nodeData = inject(KubeNodeDataService);
  private namespaceData = inject(KubeNamespaceDataService);

  // The endpoint guid, set when the container triggers load(). Counts stay
  // 0 until then so an unloaded card renders cleanly.
  private guidSig = signal<string>('');

  // Counts read straight off the cluster-scoped signal data services. Pods
  // auto-load on read; node/namespace are primed by refresh() in load().
  readonly podCount = computed(() => {
    const guid = this.guidSig();
    return guid ? (this.podData.podsInCluster(guid) as Signal<unknown[]>)().length : 0;
  });
  readonly nodeCount = computed(() => {
    const guid = this.guidSig();
    return guid ? (this.nodeData.nodesInCluster(guid) as Signal<unknown[]>)().length : 0;
  });
  readonly namespaceCount = computed(() => {
    const guid = this.guidSig();
    return guid ? (this.namespaceData.namespacesForEndpoint(guid) as Signal<unknown[]>)().length : 0;
  });

  // Preserves the original load() contract: emit once the counts are wired.
  private readonly loaded = computed(() => {
    this.podCount();
    this.nodeCount();
    this.namespaceCount();
    return true;
  });
  private readonly loaded$ = toObservable(this.loaded);

  ngOnInit() {
    const guid = this.endpoint.guid;
    this.shortcuts = [
      {
        title: 'View Nodes',
        link: ['/kubernetes', guid, 'nodes'],
        icon: 'node',
        iconFont: 'stratos-icons'
      },
      {
        title: 'View Namespaces',
        link: ['/kubernetes', guid, 'resource', 'namespace'],
        icon: 'namespace',
        iconFont: 'stratos-icons'
      }
    ];
  }

  // Card is instructed to load its view by the container, whn it is visible
  load(): Observable<boolean> {
    const guid = this.endpoint.guid;
    // Drives the count computeds; pods auto-load on read, node/namespace
    // need an explicit refresh to populate their cluster caches.
    this.guidSig.set(guid);
    void this.nodeData.refresh(guid);
    void this.namespaceData.refresh({ kubeGuid: guid });

    KubernetesEndpointService.hasKubeTerminalEnabled(this.session).pipe(take(1)).subscribe(hasKubeTerminal => {
      if (hasKubeTerminal) {
        this.shortcuts.push(
          {
            title: 'Open Terminal',
            link: ['/kubernetes', guid, 'terminal'],
            icon: 'terminal',
            iconFont: 'stratos-icons'
          }
        );
      }
    });

    KubernetesEndpointService.kubeDashboardConfigured(this.http, this.session, guid).pipe(take(1)).subscribe(hasKubeDashboard => {
      if (hasKubeDashboard) {
        this.shortcuts.push(
          {
            title: 'View Dashboard',
            link: ['/kubernetes', guid, 'dashboard'],
            icon: 'dashboard'
          }
        );
      }
    });

    return this.loaded$;
  }
}
