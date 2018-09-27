import { Injectable } from '@angular/core';
import { KubernetesEndpointService } from './kubernetes-endpoint.service';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { getIdFromRoute } from '../../../features/cloud-foundry/cf.helpers';
import { KubernetesNode } from '../store/kube.types';
import { kubernetesNodesSchemaKey, entityFactory } from '../../../store/helpers/entity-factory';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { GetKubernetesNode } from '../store/kubernetes.actions';
import { first, shareReplay, filter, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { EntityInfo } from '../../../store/types/api.types';

@Injectable()
export class KubernetesNodeService {
  public nodeName: string;
  public kubeGuid: string;
  public node$: Observable<EntityInfo<KubernetesNode>>;
  nodeEntity$: Observable<KubernetesNode>;

  constructor(
    public kubeEndpointService: KubernetesEndpointService,
    public activatedRoute: ActivatedRoute,
    public store: Store<AppState>,
    public paginationMonitorFactory: PaginationMonitorFactory,
    public entityServiceFactory: EntityServiceFactory

  ) {
    this.nodeName = getIdFromRoute(activatedRoute, 'nodeName');
    this.kubeGuid = kubeEndpointService.kubeGuid;


    const nodeEntityService = this.entityServiceFactory.create<KubernetesNode>(
      kubernetesNodesSchemaKey,
      entityFactory(kubernetesNodesSchemaKey),
      this.nodeName,
      new GetKubernetesNode(this.nodeName, this.kubeGuid),
      false
    );

    this.node$ = nodeEntityService.entityObs$.pipe(
      filter(p => !!p && !!p.entity),
      first(),
      shareReplay(1),
    );


    this.nodeEntity$ = this.node$.pipe(
      map(p => p.entity)
    );
  }
}
