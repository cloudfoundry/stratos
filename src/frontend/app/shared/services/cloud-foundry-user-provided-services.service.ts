import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';

import { IUserProvidedService } from '../../core/cf-api-svc.types';
import { EntityServiceFactory } from '../../core/entity-service-factory.service';
import {
  CreateUserProvidedServiceInstance,
  GetAllUserProvidedServices,
  GetUserProvidedService,
} from '../../store/actions/user-provided-service.actions';
import { AppState } from '../../store/app-state';
import { entityFactory, usesProvidedServiceInstance } from '../../store/helpers/entity-factory';
import { RequestInfoState } from '../../store/reducers/api-request-reducer/types';
import { getPaginationObservables } from '../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { selectRequestInfo } from '../../store/selectors/api.selectors';
import { APIResource } from '../../store/types/api.types';
import { PaginationMonitorFactory } from '../monitors/pagination-monitor.factory';

// import { IUserProvidedService } from '../../../core/cf-api-svc.types';
// import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
// import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
// import { GetAllUserProvidedServices, GetUserProvidedService } from '../../../store/actions/user-provided-service.actions';
// import { AppState } from '../../../store/app-state';
// import { entityFactory, usesProvidedServiceInstance } from '../../../store/helpers/entity-factory';
// import { getPaginationObservables } from '../../../store/reducers/pagination-reducer/pagination-reducer.helper';
// import { APIResource } from '../../../store/types/api.types';

// TODO: RC Location

@Injectable()
export class CloudFoundryUserProvidedServicesService {


  constructor(
    // public activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory,
    // private cfUserService: CfUserService,
    private paginationMonitorFactory: PaginationMonitorFactory,
    // private cfEndpointService: CloudFoundryEndpointService,
  ) {

  }

  getUserProvidedServices(cfGuid: string, spaceGuid?: string): Observable<APIResource<IUserProvidedService>[]> {
    const action = new GetAllUserProvidedServices(cfGuid, [], false, spaceGuid);
    const pagObs = getPaginationObservables({
      store: this.store,
      action,
      paginationMonitor: this.paginationMonitorFactory.create(
        action.paginationKey,
        entityFactory(action.entityKey)
      )
    });
    return pagObs.entities$;
  }

  getUserProvidedService(cfGuid: string, upsGuid: string): Observable<APIResource<IUserProvidedService>> {
    const service = this.entityServiceFactory.create<APIResource<IUserProvidedService>>(
      usesProvidedServiceInstance,
      entityFactory(usesProvidedServiceInstance),
      upsGuid,
      new GetUserProvidedService(upsGuid, cfGuid),
      true
    );
    return service.waitForEntity$.pipe(
      map(e => e.entity)
    );
  }

  createUserProvidedService(
    cfGuid: string,
    spaceGuid: string,
    guid: string,
    name: string,
    route_service_url: string,
    syslog_drain_url?: string,
    tags: string[] = [],
    credentials?: { [name: string]: string }
  ): Observable<RequestInfoState> {
    const action = new CreateUserProvidedServiceInstance(cfGuid, guid, spaceGuid, name, route_service_url, syslog_drain_url, tags, credentials);
    const create$ = this.store.select(selectRequestInfo(usesProvidedServiceInstance, guid));
    this.store.dispatch(action);
    return create$.pipe(
      filter(a => !a.creating),
      switchMap(a => {
        const guid = a.response.result[0];
        this.store.dispatch(new GetUserProvidedService(guid, cfGuid));
        return this.store.select(selectRequestInfo(usesProvidedServiceInstance, guid));
      }),
      map(ri => ({
        ...ri,
        response: {
          result: [guid]
        }
      }))
    );
  }

  // updateUserProvidedService(): Observable<RequestInfoState> {
  // }

}
