import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { debounceTime, filter, map } from 'rxjs/operators';

import {
  CreateUserProvidedServiceInstance,
  GetAllUserProvidedServices,
  GetUserProvidedService,
  IUserProvidedServiceInstanceData,
  UpdateUserProvidedServiceInstance,
} from '../../../../store/src/actions/user-provided-service.actions';
import { AppState } from '../../../../store/src/app-state';
import {
  entityFactory,
  serviceInstancesSchemaKey,
  serviceSchemaKey,
  userProvidedServiceInstanceSchemaKey,
  serviceBindingSchemaKey,
} from '../../../../store/src/helpers/entity-factory';
import { RequestInfoState } from '../../../../store/src/reducers/api-request-reducer/types';
import { getPaginationObservables } from '../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { selectRequestInfo } from '../../../../store/src/selectors/api.selectors';
import { APIResource } from '../../../../store/src/types/api.types';
import { IUserProvidedServiceInstance } from '../../core/cf-api-svc.types';
import { EntityServiceFactory } from '../../core/entity-service-factory.service';
import { EntityMonitor } from '../monitors/entity-monitor';
import { PaginationMonitorFactory } from '../monitors/pagination-monitor.factory';
import { CreateServiceBinding } from '../../../../store/src/actions/service-bindings.actions';


@Injectable()
export class CloudFoundryUserProvidedServicesService {


  constructor(
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory,
    private paginationMonitorFactory: PaginationMonitorFactory,
  ) {

  }

  public getUserProvidedServices(cfGuid: string, spaceGuid?: string): Observable<APIResource<IUserProvidedServiceInstance>[]> {
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

  public getUserProvidedService(cfGuid: string, upsGuid: string): Observable<APIResource<IUserProvidedServiceInstance>> {
    const service = this.entityServiceFactory.create<APIResource<IUserProvidedServiceInstance>>(
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
      debounceTime(250),
      filter(a => !a.creating),
    );
  }

  updateUserProvidedService(
    cfGuid: string,
    guid: string,
    data: Partial<IUserProvidedServiceInstanceData>,
  ): Observable<RequestInfoState> {
    const updateAction = new UpdateUserProvidedServiceInstance(
      cfGuid,
      guid,
      data,
      serviceSchemaKey
    );
    this.store.dispatch(updateAction);
    return new EntityMonitor(
      this.store,
      guid,
      userProvidedServiceInstanceSchemaKey,
      entityFactory(userProvidedServiceInstanceSchemaKey)
    ).entityRequest$.pipe(
      filter(
        er => er.updating[UpdateUserProvidedServiceInstance.updateServiceInstance] &&
          er.updating[UpdateUserProvidedServiceInstance.updateServiceInstance].busy
      )
    );
  }

}
