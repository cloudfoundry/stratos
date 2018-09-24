import { Injectable } from '@angular/core';
import { KubernetesEndpointService } from './kubernetes-endpoint.service';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { getIdFromRoute } from '../../../features/cloud-foundry/cf.helpers';

@Injectable()
export class KubernetesNodeService {
  nodeGuid: string;

  constructor(
    public kubeEndpointService: KubernetesEndpointService,
    public activatedRoute: ActivatedRoute,
    public store: Store<AppState>,
    public paginationMonitorFactory: PaginationMonitorFactory

  ) {
    this.nodeGuid = getIdFromRoute(activatedRoute, 'nodeUid');
  }
}
