import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map, publishReplay, refCount } from 'rxjs/operators';

import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { cfEntityFactory, serviceEntityType } from '../../../../../cloud-foundry/src/cf-entity-factory';
import { IService } from '../../../../../core/src/core/cf-api-svc.types';
import { entityCatalogue } from '../../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { PaginationMonitorFactory } from '../../../../../core/src/shared/monitors/pagination-monitor.factory';
import { getPaginationObservables } from '../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../../store/src/types/api.types';
import { PaginatedAction } from '../../../../../store/src/types/pagination.types';
import { CF_ENDPOINT_TYPE } from '../../../../cf-types';
import { createEntityRelationPaginationKey } from '../../../entity-relations/entity-relations.types';

@Injectable()
export class ServicesWallService {
  services$: Observable<APIResource<IService>[]>;

  constructor(
    private store: Store<CFAppState>,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    this.services$ = this.initServicesObservable();
  }

  initServicesObservable = () => {
    const paginationKey = createEntityRelationPaginationKey(serviceEntityType);
    const serviceEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, serviceEntityType);
    const actionBuilder = serviceEntity.actionOrchestrator.getActionBuilder('getMultiple');
    // TODO kate verify OK
    const getServicesAction = actionBuilder(null, paginationKey);
    return getPaginationObservables<APIResource<IService>>(
      {
        store: this.store,
        action: getServicesAction,
        paginationMonitor: this.paginationMonitorFactory.create(
          paginationKey,
          cfEntityFactory(serviceEntityType)
        )
      },
      true
    ).entities$;
  }

  getServicesInCf = (cfGuid: string) => this.services$.pipe(
    filter(p => !!p && p.length > 0),
    map(services => services.filter(s => s.entity.cfGuid === cfGuid)),
    filter(p => !!p),
    publishReplay(1),
    refCount()
  )

  getSpaceServicePagKey(cfGuid: string, spaceGuid: string) {
    return createEntityRelationPaginationKey(serviceEntityType, `${cfGuid}-${spaceGuid}`);
  }

  getServicesInSpace = (cfGuid: string, spaceGuid: string) => {
    const paginationKey = this.getSpaceServicePagKey(cfGuid, spaceGuid);
    const serviceEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, serviceEntityType);
    const actionBuilder = serviceEntity.actionOrchestrator.getActionBuilder('getAllInSpace');
    const getAllServicesForSpaceAction = actionBuilder(paginationKey, cfGuid, spaceGuid) as PaginatedAction;
    return getPaginationObservables<APIResource<IService>>(
      {
        store: this.store,
        action: getAllServicesForSpaceAction,
        paginationMonitor: this.paginationMonitorFactory.create(
          paginationKey,
          cfEntityFactory(serviceEntityType)
        )
      },
      true
    ).entities$;
  }
}
