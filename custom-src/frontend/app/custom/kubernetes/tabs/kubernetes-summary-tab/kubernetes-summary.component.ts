import { HttpClient } from '@angular/common/http';
import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, interval, Observable, Subscription } from 'rxjs';
import { first, map, startWith } from 'rxjs/operators';

import { AppState } from '../../../../../../store/src/app-state';
import { entityCatalog } from '../../../../../../store/src/entity-catalog/entity-catalog';
import { PaginationMonitorFactory } from '../../../../../../store/src/monitors/pagination-monitor.factory';
import { getCurrentPageRequestInfo } from '../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.types';
import { PaginatedAction, PaginationEntityState } from '../../../../../../store/src/types/pagination.types';
import { safeUnsubscribe } from '../../../../core/utils.service';
import {
  IChartThresholds,
  ISimpleUsageChartData,
} from '../../../../shared/components/simple-usage-chart/simple-usage-chart.types';
import { kubeEntityCatalog } from '../../kubernetes-entity-catalog';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';

interface IValueLabels {
  usedLabel?: string;
  remainingLabel?: string;
  unknownLabel?: string;
  warningText?: string;
}
interface IEndpointDetails {
  imagePath: string;
  label: string;
  name: string;
}
@Component({
  selector: 'app-kubernetes-summary',
  templateUrl: './kubernetes-summary.component.html',
  styleUrls: ['./kubernetes-summary.component.scss']
})
export class KubernetesSummaryTabComponent implements OnInit, OnDestroy {
  public podCount$: Observable<number>;
  public nodeCount$: Observable<number>;
  public namespaceCount$: Observable<number>;

  public highUsageColors = {
    domain: ['#00000026', '#00af00']
  };
  public normalUsageColors = {
    domain: ['#00af00', '#00af002e']
  };
  public chartHeight = '150px';
  public endpointDetails$: Observable<IEndpointDetails> = this.kubeEndpointService.endpoint$.pipe(
    map(endpoint => {
      const endpointConfig = entityCatalog.getEndpoint(endpoint.entity.cnsi_type, endpoint.entity.sub_type);
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
  source: SafeResourceUrl;

  dashboardLink: string;
  kubeTerminalLink: string;

  public podCapacity$: Observable<ISimpleUsageChartData>;
  public diskPressure$: Observable<ISimpleUsageChartData>;
  public memoryPressure$: Observable<ISimpleUsageChartData>;
  public outOfDisk$: Observable<ISimpleUsageChartData>;
  public nodesReady$: Observable<ISimpleUsageChartData>;
  public networkUnavailable$: Observable<ISimpleUsageChartData>;
  public kubeNodeVersions$: Observable<string>;

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

  public isLoading$: Observable<boolean>;

  constructor(
    public kubeEndpointService: KubernetesEndpointService,
    public httpClient: HttpClient,
    public paginationMonitorFactory: PaginationMonitorFactory,
    private store: Store<AppState>,
    private ngZone: NgZone,
    private router: Router,
  ) {
  }

  // Go the Kubernetes Dashboard configuration page
  public configureDashboard() {
    const guid = this.kubeEndpointService.baseKube.guid;
    this.router.navigate([`/kubernetes/${guid}/dashboard-config`]);
  }
  ngOnInit() {
    const guid = this.kubeEndpointService.baseKube.guid;

    const podsObs = kubeEntityCatalog.pod.store.getPaginationService(guid);
    const pods$ = podsObs.entities$;
    this.poll(kubeEntityCatalog.pod.actions.getMultiple(guid), podsObs.pagination$)
    const nodesObs = kubeEntityCatalog.node.store.getPaginationService(guid);
    const nodes$ = nodesObs.entities$;
    this.poll(kubeEntityCatalog.node.actions.getMultiple(guid), nodesObs.pagination$)
    const namespacesObs = kubeEntityCatalog.namespace.store.getPaginationService(guid);
    const namespaces$ = namespacesObs.entities$;
    this.poll(kubeEntityCatalog.namespace.actions.getMultiple(guid), namespacesObs.pagination$)

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

    this.isLoading$ = combineLatest([
      this.endpointDetails$,
      this.podCount$,
      this.nodeCount$,
      this.podCapacity$,
      this.diskPressure$,
      this.memoryPressure$,
      this.outOfDisk$,
      this.nodesReady$,
      this.networkUnavailable$,
    ]).pipe(
      map(() => false),
      startWith(true),
    );
  }

  private poll(action: PaginatedAction, pagination$: Observable<PaginationEntityState>) {
    this.ngZone.runOutsideAngular(() =>
      this.polls.push(
        interval(10000).subscribe(() => {
          this.ngZone.run(() => this.updateList(action, pagination$));
        })
      )
    );
  }

  private updateList(action: PaginatedAction, pagination$: Observable<PaginationEntityState>) {
    pagination$.pipe(first()).subscribe(pag => {
      if (!getCurrentPageRequestInfo(pag, { busy: true, error: false, message: '' }).busy) {
        this.store.dispatch(action);
      }
    })
  }

  ngOnDestroy() {
    safeUnsubscribe(...(this.polls || []));
  }

}
