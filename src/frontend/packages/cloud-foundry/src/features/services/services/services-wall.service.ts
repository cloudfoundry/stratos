import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map, publishReplay, refCount } from 'rxjs/operators';

import { GetAllServices } from '../../../../../cloud-foundry/src/actions/service.actions';
import { GetAllServicesForSpace } from '../../../../../cloud-foundry/src/actions/space.actions';
import { createEntityRelationPaginationKey } from '../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { getPaginationObservables } from '../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../../store/src/types/api.types';
import { serviceEntityType, cfEntityFactory } from '../../../../../cloud-foundry/src/cf-entity-factory';
import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { IService } from '../../../../../core/src/core/cf-api-svc.types';
import { PaginationMonitorFactory } from '../../../../../core/src/shared/monitors/pagination-monitor.factory';

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
    return getPaginationObservables<APIResource<IService>>(
      {
        store: this.store,
        action: new GetAllServices(paginationKey),
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
    return getPaginationObservables<APIResource<IService>>(
      {
        store: this.store,
        action: new GetAllServicesForSpace(paginationKey, cfGuid, spaceGuid),
        paginationMonitor: this.paginationMonitorFactory.create(
          paginationKey,
          cfEntityFactory(serviceEntityType)
        )
      },
      true
    ).entities$;
  }
}
