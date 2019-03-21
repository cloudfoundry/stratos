import { KubernetesPod } from './../../store/kube.types';
import { KubernetesNode } from './../../../../../../../../../custom-src/frontend/app/custom/kubernetes/store/kube.types';
import { GetKubernetesApps } from './../../store/kubernetes.actions';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Component, OnInit } from '@angular/core';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { HttpClient } from '@angular/common/http';
import { PaginatedAction } from '../../../../../../store/src/types/pagination.types';
import { entityFactory } from '../../../../../../store/src/helpers/entity-factory';
import { getPaginationObservables } from '../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { map, startWith, tap } from 'rxjs/operators';
import { Observable, combineLatest } from 'rxjs';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../../store/src/app-state';
import { GetKubernetesPods, GetKubernetesNodes } from '../../store/kubernetes.actions';
import { getEndpointType } from '../../../../features/endpoints/endpoint-helpers';
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
export class KubernetesSummaryTabComponent implements OnInit {
  public podCount$: Observable<number>;
  public nodeCount$: Observable<number>;
  public appCount$: Observable<number>;
  public endpointDetails$: Observable<IEndpointDetails> = this.kubeEndpointService.endpoint$.pipe(
    map(endpoint => {
      const { imagePath, label } = getEndpointType(endpoint.entity.cnsi_type, endpoint.entity.sub_type);
      return {
        imagePath,
        label,
        name: endpoint.entity.name,

      }
    })
  );
  source: SafeResourceUrl;

  dashboardLink: string;
  public podCapacity$: Observable<{ capacity: number; used: number; }>;

  constructor(
    public kubeEndpointService: KubernetesEndpointService,
    public httpClient: HttpClient,
    public paginationMonitorFactory: PaginationMonitorFactory,
    private store: Store<AppState>
  ) { }

  private getPaginationObservable(action: PaginatedAction) {
    const paginationMonitor = this.paginationMonitorFactory.create(
      action.paginationKey,
      entityFactory(action.entityKey)
    );
    return getPaginationObservables({
      store: this.store,
      action,
      paginationMonitor
    }).entities$
  }

  private getCountObservable(entities$: Observable<any[]>) {
    return entities$.pipe(
      map(entities => entities.length),
      startWith(null)
    );
  }
  private getPodCapacity(nodes$: Observable<KubernetesNode[]>, pods$: Observable<KubernetesPod[]>) {
    return combineLatest(nodes$, pods$).pipe(
      map(([nodes, pods]) => {
        const capacity = nodes.reduce((cap, node) => {
          return cap + parseInt(node.status.capacity.pods, 10);
        }, 0);
        const used = pods.length;
        console.log(used)
        return {
          capacity,
          results: [{
            name: '',
            value: used
          }]
        }
      })
    )
  }
  ngOnInit() {
    const guid = this.kubeEndpointService.baseKube.guid;

    const podCountAction = new GetKubernetesPods(guid);
    const nodeCountAction = new GetKubernetesNodes(guid);
    const appCountAction = new GetKubernetesApps(guid);
    const applications$ = this.getPaginationObservable(appCountAction)
    const pods$ = this.getPaginationObservable(podCountAction);
    const nodes$ = this.getPaginationObservable(nodeCountAction).pipe(tap(console.log));

    this.podCount$ = this.getCountObservable(pods$);
    this.nodeCount$ = this.getCountObservable(nodes$);
    this.appCount$ = this.getCountObservable(applications$);

    this.podCapacity$ = this.getPodCapacity(nodes$, pods$);

    this.dashboardLink = `/kubernetes/${guid}/dashboard`;
  }

  public getDashboard() {
    const guid = this.kubeEndpointService.baseKube.guid;
    this.httpClient.get(`/pp/v1/kubedash/${guid}/status`).subscribe(a => {
      console.log('Kube dashboard status');
      console.log(a);
    });
  }

}
