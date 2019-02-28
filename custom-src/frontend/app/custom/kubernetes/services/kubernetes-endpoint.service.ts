import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, first, map, shareReplay } from 'rxjs/operators';

import { EntityService } from '../../../core/entity-service';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { GetAllEndpoints } from '../../../../../store/src/actions/endpoint.actions';
import { AppState } from '../../../../../store/src/app-state';
import {
  endpointSchemaKey,
  entityFactory,
} from '../../../../../store/src/helpers/entity-factory';
import { getPaginationObservables } from '../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { EntityInfo } from '../../../../../store/src/types/api.types';
import { EndpointModel, EndpointUser } from '../../../../../store/src/types/endpoint.types';
import { BaseKubeGuid } from '../kubernetes-page.types';
import { KubernetesDeployment, KubernetesStatefulSet, KubeService, KubernetesPod } from '../store/kube.types';
import {
  GeKubernetesDeployments,
  GetKubernetesServices,
  GetKubernetesStatefulSets,
  KubePaginationAction,
  GetKubernetesPods,
} from '../store/kubernetes.actions';
import {
  kubernetesDeploymentsSchemaKey,
  kubernetesPodsSchemaKey,
  kubernetesStatefulSetsSchemaKey,
  kubernetesServicesSchemaKey
} from '../store/kubernetes.entities';

@Injectable()
export class KubernetesEndpointService {
  info$: Observable<EntityInfo<any>>;
  cfInfoEntityService: EntityService<any>;
  endpoint$: Observable<EntityInfo<EndpointModel>>;
  kubeEndpointEntityService: EntityService<EndpointModel>;
  connected$: Observable<boolean>;
  currentUser$: Observable<EndpointUser>;
  kubeGuid: string;
  deployments$: Observable<KubernetesDeployment[]>;
  statefulSets$: Observable<KubernetesStatefulSet[]>;
  services$: Observable<KubeService[]>;
  pods$: Observable<KubernetesPod[]>;

  constructor(
    public baseKube: BaseKubeGuid,
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    this.kubeGuid = baseKube.guid;
    this.kubeEndpointEntityService = this.entityServiceFactory.create(
      endpointSchemaKey,
      entityFactory(endpointSchemaKey),
      this.kubeGuid,
      new GetAllEndpoints(),
      false
    );

    this.constructCoreObservables();
  }

  constructCoreObservables() {
    this.endpoint$ = this.kubeEndpointEntityService.waitForEntity$;

    this.connected$ = this.endpoint$.pipe(
      map(p => p.entity.connectionStatus === 'connected')
    );

    this.currentUser$ = this.endpoint$.pipe(map(e => e.entity.user), shareReplay(1));

    this.deployments$ = this.getObservable<KubernetesDeployment>(
      new GeKubernetesDeployments(this.kubeGuid),
      kubernetesDeploymentsSchemaKey
    );

    this.pods$ = this.getObservable<KubernetesPod>(
      new GetKubernetesPods(this.kubeGuid),
      kubernetesPodsSchemaKey
    );

    this.statefulSets$ = this.getObservable<KubernetesStatefulSet>(
      new GetKubernetesStatefulSets(this.kubeGuid),
      kubernetesStatefulSetsSchemaKey
    );


    this.services$ = this.getObservable<KubeService>(
      new GetKubernetesServices(this.kubeGuid),
      kubernetesServicesSchemaKey
    );

  }

  private getObservable<T>(pagintionAction: KubePaginationAction, schemaKey: string): Observable<T[]> {
    return getPaginationObservables<T>({
      store: this.store,
      action: pagintionAction,
      paginationMonitor: this.paginationMonitorFactory.create(pagintionAction.paginationKey, entityFactory(schemaKey))
    }, true).entities$.pipe(filter(p => !!p), first());
  }
}
