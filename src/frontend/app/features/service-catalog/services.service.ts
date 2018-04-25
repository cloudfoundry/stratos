import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store/store';

import { EntityServiceFactory } from '../../core/entity-service-factory.service';
import { AppState } from '../../store/app-state';
import { entityFactory, serviceSchemaKey } from '../../store/helpers/entity-factory';
import { ActiveRouteCfOrgSpace } from '../cloud-foundry/cf-page.types';
import { PaginationMonitorFactory } from '../../shared/monitors/pagination-monitor.factory';
import { GetService } from '../../store/actions/service.actions';
import { EntityService } from '../../core/entity-service';
import { APIResource, EntityInfo } from '../../store/types/api.types';
import { IService, IServiceExtra, IServicePlan } from '../../core/cf-api-svc.types';
import { Observable } from 'rxjs/Observable';
import { ActivatedRoute } from '@angular/router';
import { getIdFromRoute } from '../cloud-foundry/cf.helpers';
import { filter, map, tap, publish, refCount, publishReplay } from 'rxjs/operators';

@Injectable()
export class ServicesService {
  servicePlans$: Observable<APIResource<IServicePlan>[]>;
  serviceExtraInfo$: Observable<IServiceExtra>;
  serviceGuid: string;
  cfGuid: string;
  service$: Observable<APIResource<IService>>;
  serviceEntityService: EntityService<APIResource<IService>>;


  constructor(
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory,
    public activatedRoute: ActivatedRoute,
    private paginationMonitorFactory: PaginationMonitorFactory

  ) {

    this.cfGuid = getIdFromRoute(activatedRoute, 'cfId');
    this.serviceGuid = getIdFromRoute(activatedRoute, 'serviceId');
    this.serviceEntityService = this.entityServiceFactory.create(
      serviceSchemaKey,
      entityFactory(serviceSchemaKey),
      this.serviceGuid,
      new GetService(this.serviceGuid, this.cfGuid),
      true
    );
    this.service$ = this.serviceEntityService.waitForEntity$.pipe(
      filter(o => !!o && !!o.entity),
      map(o => o.entity),
      publishReplay(1),
      refCount()
    );

    this.serviceExtraInfo$ = this.service$.pipe(
      map(o => JSON.parse(o.entity.extra))
    );

    this.servicePlans$ = this.service$.pipe(
      map(o => o.entity.service_plans)
    );

  }

}
