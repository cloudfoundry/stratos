import { Injectable } from '@angular/core';

import { Store } from '@ngrx/store';

import { EntityService } from '../../../core/entity-service';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { GetAllEndpoints } from '../../../store/actions/endpoint.actions';
import { AppState } from '../../../store/app-state';
import { endpointSchemaKey, entityFactory } from '../../../store/helpers/entity-factory';
import { EntityInfo } from '../../../store/types/api.types';
import { EndpointModel, EndpointUser } from '../../../store/types/endpoint.types';
import { BaseKubeGuid } from '../kubernetes-page.types';

import { map, shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';


@Injectable()
export class KubernetesEndpointService {
  info$: Observable<EntityInfo<any>>;
  cfInfoEntityService: EntityService<any>;
  endpoint$: Observable<EntityInfo<EndpointModel>>;
  kubeEndpointEntityService: EntityService<EndpointModel>;
  connected$: Observable<boolean>;
  currentUser$: Observable<EndpointUser>;
  kubeGuid: string;

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
      new GetAllEndpoints()
    );

    // this.cfInfoEntityService = this.entityServiceFactory.create(
    //   CF_INFO_ENTITY_KEY,
    //   CFInfoSchema,
    //   this.cfGuid,
    //   new GetEndpointInfo(this.cfGuid)
    // );
    this.constructCoreObservables();
  }

  constructCoreObservables() {
    this.endpoint$ = this.kubeEndpointEntityService.waitForEntity$;

    this.connected$ = this.endpoint$.pipe(
      map(p => p.entity.connectionStatus === 'connected')
    );

    this.currentUser$ = this.endpoint$.pipe(map(e => e.entity.user), shareReplay(1));

  }
}
