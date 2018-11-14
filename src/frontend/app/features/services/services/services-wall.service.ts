import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map, publishReplay, refCount } from 'rxjs/operators';

import { IService } from '../../../core/cf-api-svc.types';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { GetAllServices } from '../../../store/actions/service.actions';
import { GetAllServicesForSpace } from '../../../store/actions/space.actions';
import { AppState } from '../../../store/app-state';
import { entityFactory, serviceSchemaKey } from '../../../store/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../../store/helpers/entity-relations/entity-relations.types';
import { getPaginationObservables } from '../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../store/types/api.types';

@Injectable()
export class ServicesWallService {
  services$: Observable<APIResource<IService>[]>;

  constructor(
    private store: Store<AppState>,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    this.services$ = this.initServicesObservable();
  }

  initServicesObservable = () => {
    const paginationKey = createEntityRelationPaginationKey(serviceSchemaKey);
    return getPaginationObservables<APIResource<IService>>(
      {
        store: this.store,
        action: new GetAllServices(paginationKey),
        paginationMonitor: this.paginationMonitorFactory.create(
          paginationKey,
          entityFactory(serviceSchemaKey)
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
    return createEntityRelationPaginationKey(serviceSchemaKey, `${cfGuid}-${spaceGuid}`);
  }

  getServicesInSpace = (cfGuid: string, spaceGuid: string) => {
    const paginationKey = this.getSpaceServicePagKey(cfGuid, spaceGuid);
    return getPaginationObservables<APIResource<IService>>(
      {
        store: this.store,
        action: new GetAllServicesForSpace(paginationKey, cfGuid, spaceGuid),
        paginationMonitor: this.paginationMonitorFactory.create(
          paginationKey,
          entityFactory(serviceSchemaKey)
        )
      },
      true
    ).entities$;
  }
}
