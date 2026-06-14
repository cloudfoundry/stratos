import { HttpClient } from '@angular/common/http';
import {Component, NgZone, OnDestroy, OnInit, computed, inject, ChangeDetectionStrategy, Injector, runInInjectionContext } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { SafeResourceUrl } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
import { interval, Observable, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { safeUnsubscribe } from '../../../../../core/src/core/utils.service';
import {
  IChartThresholds,
  ISimpleUsageChartData,
} from '../../../../../core/src/shared/components/simple-usage-chart/simple-usage-chart.types';
import { SimpleUsageChartComponent } from '../../../../../core/src/shared/components/simple-usage-chart/simple-usage-chart.component';
import { PageSubNavComponent } from '../../../../../core/src/shared/components/page-sub-nav/page-sub-nav.component';
import { LoadingPageComponent } from '../../../../../core/src/shared/components/loading-page/loading-page.component';
import { entityCatalog } from '@stratosui/store';
import { KubePodDataService } from '../../../services/domain-data/kube-pod-data.service';
import { KubeNodeDataService } from '../../../services/domain-data/kube-node-data.service';
import { KubeNamespaceDataService } from '../../../services/domain-data/kube-namespace-data.service';
import { KubernetesNode, KubernetesPod } from '../../store/kube.types';
import { CaaspNodesData, KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';

interface IEndpointDetails {
  // imagePath/label derive from the endpoint definition's optional
  // logoUrl/label fields, so both may legitimately be absent.
  imagePath?: string;
  label?: string;
  name: string;
}

@Component({
  selector: 'app-kubernetes-summary',
  templateUrl: './kubernetes-summary.component.html',
  styleUrls: ['./kubernetes-summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SimpleUsageChartComponent,
    PageSubNavComponent,
    LoadingPageComponent
  ]
})
export class KubernetesSummaryTabComponent implements OnInit, OnDestroy {
  // strict: the count/chart/loading streams below are all assigned in ngOnInit
  // before the template subscribes to them
  public podCount$!: Observable<number | null>;
  public nodeCount$!: Observable<number | null>;
  public namespaceCount$!: Observable<number | null>;

  public highUsageColors = {
    domain: ['#00000026', '#00af00']
  };
  public normalUsageColors = {
    domain: ['#00af00', '#00af002e']
  };
  public chartHeight = '150px';

  public kubeEndpointService = inject(KubernetesEndpointService);
  public httpClient = inject(HttpClient);
  private podData = inject(KubePodDataService);
  private nodeData = inject(KubeNodeDataService);
  private namespaceData = inject(KubeNamespaceDataService);
  private ngZone = inject(NgZone);
  private router = inject(Router);
  private injector = inject(Injector);

  public endpointDetails$: Observable<IEndpointDetails> = this.kubeEndpointService.endpoint$.pipe(
    map(endpoint => {
      // strict: this view only renders for a connected kubernetes endpoint,
      // so its model always carries a cnsi_type
      const endpointConfig = entityCatalog.getEndpoint(endpoint.entity.cnsi_type!, endpoint.entity.sub_type);
      const { logoUrl, label } = endpointConfig.definition;
      // const { imagePath, label } = entityCatalog.getEndpoint(endpoint.entity.cnsi_type, endpoint.entity.sub_type);

      // const { imagePath, label } = getEndpointType(endpoint.entity.cnsi_type, endpoint.entity.sub_type);
      return {
        imagePath: logoUrl,
        label,
        name: endpoint.entity.name,
      };
    })
  );
  source?: SafeResourceUrl;

  // strict: assigned in ngOnInit before the template reads them
  dashboardLink!: string;
  kubeTerminalLink!: string;

  public podCapacity$!: Observable<ISimpleUsageChartData>;
  public diskPressure$!: Observable<ISimpleUsageChartData>;
  public memoryPressure$!: Observable<ISimpleUsageChartData>;
  public outOfDisk$!: Observable<ISimpleUsageChartData>;
  public nodesReady$!: Observable<ISimpleUsageChartData>;
  public networkUnavailable$!: Observable<ISimpleUsageChartData>;
  public kubeNodeVersions$!: Observable<string>;
  public caaspData$!: Observable<CaaspNodesData | null>;

  public pressureChartThresholds: IChartThresholds = {
    danger: 90,
    warning: 0,
  };

  public nominalPressureChartThresholds: IChartThresholds = {
    warning: 100,
    inverted: true
  };

  public criticalPressureChartThresholds: IChartThresholds = {
    danger: 0
  };

  public criticalPressureChartThresholdsInverted: IChartThresholds = {
    danger: 100,
    inverted: true
  };

  private polls: Subscription[] = [];

  // strict: assigned in ngOnInit before the template subscribes
  public isLoading$!: Observable<boolean>;

  // Go the Kubernetes Dashboard configuration page
  public configureDashboard() {
    const guid = this.kubeEndpointService.baseKube.guid;
    this.router.navigate([`/kubernetes/${guid}/dashboard-config`]);
  }
  ngOnInit() {
    const guid = this.kubeEndpointService.baseKube.guid;

    // Cluster lists now come from the signal-native data services. Bridge
    // each signal to an Observable for the existing kubeEndpointService
    // count/capacity/status helpers. The pod/node helpers are typed against
    // the legacy KubernetesPod/KubernetesNode shapes; the runtime k8s JSON is
    // identical, so cast the native-shape bridges at this boundary.
    const pods$ = toObservable(this.podData.podsInCluster(guid), { injector: this.injector }) as unknown as Observable<KubernetesPod[]>;
    const nodes$ = toObservable(this.nodeData.nodesInCluster(guid), { injector: this.injector }) as unknown as Observable<KubernetesNode[]>;
    const namespaces$ = toObservable(this.namespaceData.namespacesForEndpoint(guid), { injector: this.injector });

    // Prime the caches now, then poll them on the same 10s cadence the old
    // pagination dispatch poll drove.
    this.refreshAll(guid);
    this.poll(guid);

    this.podCount$ = this.kubeEndpointService.getCountObservable(pods$);
    this.nodeCount$ = this.kubeEndpointService.getCountObservable(nodes$);
    this.namespaceCount$ = this.kubeEndpointService.getCountObservable(namespaces$);

    this.podCapacity$ = this.kubeEndpointService.getPodCapacity(nodes$, pods$);
    this.diskPressure$ = this.kubeEndpointService.getNodeStatusCount(nodes$, 'DiskPressure', {
      usedLabel: 'Nodes with disk pressure',
      remainingLabel: 'Nodes with no disk pressure',
      unknownLabel: 'Nodes with unknown disk pressure',
      warningText: 'Nodes with unknown disk pressure found'
    });
    this.memoryPressure$ = this.kubeEndpointService.getNodeStatusCount(nodes$, 'MemoryPressure', {
      usedLabel: 'Nodes with memory pressure',
      remainingLabel: 'Nodes with no memory pressure',
      unknownLabel: 'Nodes with unknown memory pressure',
      warningText: 'Nodes with unknown memory pressure found'
    });
    this.outOfDisk$ = this.kubeEndpointService.getNodeStatusCount(nodes$, 'OutOfDisk', {
      usedLabel: 'Nodes that are out of disk space',
      remainingLabel: 'Nodes that have disk space remaining',
      unknownLabel: 'Nodes with unknown remaining disk space',
      warningText: 'Nodes with unknown remaining disk space found'
    });
    this.networkUnavailable$ = this.kubeEndpointService.getNodeStatusCount(nodes$, 'NetworkUnavailable', {
      usedLabel: 'Nodes with available networks',
      remainingLabel: 'Nodes with unavailable networks',
      unknownLabel: 'Nodes with unknown networks availability',
      warningText: 'Nodes with unknown networks availability found'
    }, 'False');
    this.nodesReady$ = this.kubeEndpointService.getNodeStatusCount(nodes$, 'Ready', {
      usedLabel: 'Nodes are ready',
      remainingLabel: 'Nodes are not ready',
      unknownLabel: 'Nodes with unknown ready status',
      warningText: `Nodes with unknown ready status found`
    });
    this.dashboardLink = `/kubernetes/${guid}/dashboard`;
    this.kubeTerminalLink = `/kubernetes/${guid}/terminal`;

    this.kubeNodeVersions$ = this.kubeEndpointService.getNodeKubeVersions(nodes$).pipe(startWith('-'));

    this.caaspData$ = this.kubeEndpointService.getCaaspNodesData(nodes$);

    // Convert all observables to signals within injection context
    runInInjectionContext(this.injector, () => {
      const endpointDetailsSignal = toSignal(this.endpointDetails$, { initialValue: null as any });
      const podCountSignal = toSignal(this.podCount$, { initialValue: null as number | null });
      const nodeCountSignal = toSignal(this.nodeCount$, { initialValue: null as number | null });
      const podCapacitySignal = toSignal(this.podCapacity$, { initialValue: null as any });
      const diskPressureSignal = toSignal(this.diskPressure$, { initialValue: null as any });
      const memoryPressureSignal = toSignal(this.memoryPressure$, { initialValue: null as any });
      const outOfDiskSignal = toSignal(this.outOfDisk$, { initialValue: null as any });
      const nodesReadySignal = toSignal(this.nodesReady$, { initialValue: null as any });
      const networkUnavailableSignal = toSignal(this.networkUnavailable$, { initialValue: null as any });

      // Compute loading state - false when all are loaded
      const isLoadingComputed = computed(() => {
        // Check if all required data is loaded
        return !(
          endpointDetailsSignal() !== null &&
          podCountSignal() !== null &&
          nodeCountSignal() !== null &&
          podCapacitySignal() !== null &&
          diskPressureSignal() !== null &&
          memoryPressureSignal() !== null &&
          outOfDiskSignal() !== null &&
          nodesReadySignal() !== null &&
          networkUnavailableSignal() !== null
        );
      });

      this.isLoading$ = toObservable(isLoadingComputed);
    });
  }

  private poll(guid: string) {
    this.ngZone.runOutsideAngular(() =>
      this.polls.push(
        interval(10000).subscribe(() => {
          this.ngZone.run(() => this.refreshAll(guid));
        })
      )
    );
  }

  // Refresh the three cluster caches. Each data service dedups in-flight
  // fetches, so overlapping polls don't stack duplicate requests.
  private refreshAll(guid: string) {
    void this.podData.refresh({ kubeGuid: guid });
    void this.nodeData.refresh(guid);
    void this.namespaceData.refresh({ kubeGuid: guid });
  }

  ngOnDestroy() {
    safeUnsubscribe(...(this.polls || []));
  }

}
