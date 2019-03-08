import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';

import {
  CreateUserProvidedServiceInstance,
  GetAllUserProvidedServices,
  GetUserProvidedService,
  IUserProvidedServiceInstanceData,
} from '../../../../store/src/actions/user-provided-service.actions';
import { AppState } from '../../../../store/src/app-state';
import {
  entityFactory,
  serviceInstancesSchemaKey,
  userProvidedServiceInstanceSchemaKey,
} from '../../../../store/src/helpers/entity-factory';
import { RequestInfoState } from '../../../../store/src/reducers/api-request-reducer/types';
import { getPaginationObservables } from '../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { selectRequestInfo } from '../../../../store/src/selectors/api.selectors';
import { APIResource } from '../../../../store/src/types/api.types';
import { IUserProvidedService } from '../../core/cf-api-svc.types';
import { EntityServiceFactory } from '../../core/entity-service-factory.service';
import { PaginationMonitorFactory } from '../monitors/pagination-monitor.factory';


@Injectable()
export class CloudFoundryUserProvidedServicesService {


  constructor(
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory,
    private paginationMonitorFactory: PaginationMonitorFactory,
  ) {

  }

  public getUserProvidedServices(cfGuid: string, spaceGuid?: string): Observable<APIResource<IUserProvidedService>[]> {
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

  public getUserProvidedService(cfGuid: string, upsGuid: string): Observable<APIResource<IUserProvidedService>> {
    const service = this.entityServiceFactory.create<APIResource<IUserProvidedService>>(
      userProvidedServiceInstanceSchemaKey,
      entityFactory(userProvidedServiceInstanceSchemaKey),
      upsGuid,
      new GetUserProvidedService(upsGuid, cfGuid),
      true
    );
    return service.waitForEntity$.pipe(
      map(e => e.entity)
    );
  }

  public createUserProvidedService(
    cfGuid: string,
    guid: string,
    data: IUserProvidedServiceInstanceData
  ): Observable<RequestInfoState> {
    const action = new CreateUserProvidedServiceInstance(cfGuid, guid, data, serviceInstancesSchemaKey);
    const create$ = this.store.select(selectRequestInfo(userProvidedServiceInstanceSchemaKey, guid));
    this.store.dispatch(action);
    return create$.pipe(
      filter(a => !a.creating),
      switchMap(a => {
        const createdGuid = a.response.result[0];
        this.store.dispatch(new GetUserProvidedService(createdGuid, cfGuid));
        return this.store.select(selectRequestInfo(userProvidedServiceInstanceSchemaKey, createdGuid));
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
