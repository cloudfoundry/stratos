import { GetKubernetesApps } from './../../store/kubernetes.actions';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Component, OnInit } from '@angular/core';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { HttpClient } from '@angular/common/http';
import { PaginatedAction } from '../../../../../../store/src/types/pagination.types';
import { entityFactory } from '../../../../../../store/src/helpers/entity-factory';
import { getPaginationObservables } from '../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { map, startWith, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
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

  constructor(
    public kubeEndpointService: KubernetesEndpointService,
    public httpClient: HttpClient,
    public paginationMonitorFactory: PaginationMonitorFactory,
    private store: Store<AppState>
  ) { }

  private getCountObservable(action: PaginatedAction) {
    const paginationMonitor = this.paginationMonitorFactory.create(
      action.paginationKey,
      entityFactory(action.entityKey)
    );
    return getPaginationObservables({
      store: this.store,
      action,
      paginationMonitor
    }).totalEntities$.pipe(
      startWith(null)
    );
  }

  ngOnInit() {
    const guid = this.kubeEndpointService.baseKube.guid;

    const podCountAction = new GetKubernetesPods(guid);
    const nodeCountAction = new GetKubernetesNodes(guid);
    const appCountAction = new GetKubernetesApps(guid);
    this.podCount$ = this.getCountObservable(podCountAction);
    this.nodeCount$ = this.getCountObservable(nodeCountAction);
    this.appCount$ = this.getCountObservable(appCountAction);

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
