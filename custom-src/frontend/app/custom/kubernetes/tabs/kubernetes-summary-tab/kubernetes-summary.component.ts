import { HttpClient } from '@angular/common/http';
import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { combineLatest, interval, Observable, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { AppState } from '../../../../../../store/src/app-state';
import { entityFactory } from '../../../../../../store/src/helpers/entity-factory';
import { getPaginationObservables } from '../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { PaginatedAction } from '../../../../../../store/src/types/pagination.types';
import { safeUnsubscribe } from '../../../../core/utils.service';
import { getEndpointType } from '../../../../features/endpoints/endpoint-helpers';
import {
  IChartThresholds,
  ISimpleUsageChartData,
} from '../../../../shared/components/simple-usage-chart/simple-usage-chart.types';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { GetKubernetesNodes, GetKubernetesPods } from '../../store/kubernetes.actions';
import { KubernetesNode } from './../../../../../../../../../custom-src/frontend/app/custom/kubernetes/store/kube.types';
import { KubernetesPod } from './../../store/kube.types';
import { GetKubernetesApps } from './../../store/kubernetes.actions';

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
  public appCount$: Observable<number>;
  public highUsageColors = {
    domain: ['#00000026', '#00af00']
  };
  public normalUsageColors = {
    domain: ['#00af00', '#00af002e']
  };
  public endpointDetails$: Observable<IEndpointDetails> = this.kubeEndpointService.endpoint$.pipe(
    map(endpoint => {
      const { imagePath, label } = getEndpointType(endpoint.entity.cnsi_type, endpoint.entity.sub_type);
      return {
        imagePath,
        label,
        name: endpoint.entity.name,
      };
    })
  );
  source: SafeResourceUrl;

  dashboardLink: string;
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
    private ngZone: NgZone
  ) {
  }

  private getPaginationObservable(action: PaginatedAction) {
    const paginationMonitor = this.paginationMonitorFactory.create(
      action.paginationKey,
      entityFactory(action.entityKey)
    );

    this.ngZone.runOutsideAngular(() => {
      this.polls.push(
        interval(10000).subscribe(() => {
          this.ngZone.run(() => {
            this.store.dispatch(action);
          });
        })
      );
    });

    return getPaginationObservables({
      store: this.store,
      action,
      paginationMonitor
    }).entities$;
  }

  private getCountObservable(entities$: Observable<any[]>) {
    return entities$.pipe(
      map(entities => entities.length),
      startWith(null)
    );
  }
  private getPodCapacity(nodes$: Observable<KubernetesNode[]>, pods$: Observable<KubernetesPod[]>) {
    return combineLatest(nodes$, pods$).pipe(
      map(([nodes, pods]) => ({
        total: nodes.reduce((cap, node) => {
          return cap + parseInt(node.status.capacity.pods, 10);
        }, 0),
        used: pods.length
      }))
    );
  }

  private getNodeStatusCount(nodes$: Observable<KubernetesNode[]>, conditionType: string, countStatus = 'False') {
    return nodes$.pipe(
      map(nodes => {
        const result = {
          total: nodes.length,
          supported: true,
          // Depends on K8S version as to what is supported
          unavailable: nodes.reduce((cap, node) => {
            const conditionStatus = node.status.conditions.find(con => con.type === conditionType);
            return !conditionStatus ? ++cap : cap;
          }, 0),
          used: nodes.reduce((cap, node) => {
            const conditionStatus = node.status.conditions.find(con => con.type === conditionType);
            if (!conditionStatus || !conditionStatus.status || conditionStatus.status === countStatus) {
              return cap;
            }
            return ++cap;
          }, 0)
        };
        result.supported = result.total !== result.unavailable;
        return result;
      })
    );
  }

  private getNodeKubeVersions(nodes$: Observable<KubernetesNode[]>) {
    return nodes$.pipe(
      map(nodes => {
        const versions = {};
        nodes.forEach(node => {
          const v = node.status.nodeInfo.kubeletVersion;
          if (!versions[v]) {
            versions[v] = v;
          }
        });
        return Object.keys(versions).join(',');
      })
    );
  }


  ngOnInit() {
    const guid = this.kubeEndpointService.baseKube.guid;

    const podCountAction = new GetKubernetesPods(guid);
    const nodeCountAction = new GetKubernetesNodes(guid);
    const appCountAction = new GetKubernetesApps(guid);
    const applications$ = this.getPaginationObservable(appCountAction);
    const pods$ = this.getPaginationObservable(podCountAction);
    const nodes$ = this.getPaginationObservable(nodeCountAction);

    this.podCount$ = this.getCountObservable(pods$);
    this.nodeCount$ = this.getCountObservable(nodes$);
    this.appCount$ = this.getCountObservable(applications$);

    this.podCapacity$ = this.getPodCapacity(nodes$, pods$);
    this.diskPressure$ = this.getNodeStatusCount(nodes$, 'DiskPressure');
    this.memoryPressure$ = this.getNodeStatusCount(nodes$, 'MemoryPressure');
    this.outOfDisk$ = this.getNodeStatusCount(nodes$, 'OutOfDisk');
    this.networkUnavailable$ = this.getNodeStatusCount(nodes$, 'NetworkUnavailable', 'True');
    this.nodesReady$ = this.getNodeStatusCount(nodes$, 'Ready');

    this.dashboardLink = `/kubernetes/${guid}/dashboard`;

    this.kubeNodeVersions$ = this.getNodeKubeVersions(nodes$).pipe(startWith('-'));

    this.isLoading$ = combineLatest([
      this.endpointDetails$,
      this.podCount$,
      this.nodeCount$,
      this.appCount$,
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

  ngOnDestroy() {
    safeUnsubscribe(...(this.polls || []));
  }

}
