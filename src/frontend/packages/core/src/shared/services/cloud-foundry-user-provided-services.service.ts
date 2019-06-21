import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { debounceTime, filter, map } from 'rxjs/operators';

import {
  CreateUserProvidedServiceInstance,
  GetAllUserProvidedServices,
  GetUserProvidedService,
  getUserProvidedServiceInstanceRelations,
  IUserProvidedServiceInstanceData,
  UpdateUserProvidedServiceInstance,
} from '../../../../store/src/actions/user-provided-service.actions';
import { AppState } from '../../../../store/src/app-state';
import {
  entityFactory,
  organizationSchemaKey,
  serviceInstancesSchemaKey,
  serviceSchemaKey,
  spaceSchemaKey,
  userProvidedServiceInstanceSchemaKey,
} from '../../../../store/src/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../../../store/src/helpers/entity-relations/entity-relations.types';
import { RequestInfoState } from '../../../../store/src/reducers/api-request-reducer/types';
import { getPaginationObservables } from '../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { selectRequestInfo } from '../../../../store/src/selectors/api.selectors';
import { APIResource } from '../../../../store/src/types/api.types';
import { QParam } from '../../../../store/src/types/pagination.types';
import { IUserProvidedServiceInstance } from '../../core/cf-api-svc.types';
import { EntityServiceFactory } from '../../core/entity-service-factory.service';
import { fetchTotalResults } from '../../features/cloud-foundry/cf.helpers';
import { EntityMonitor } from '../monitors/entity-monitor';
import { PaginationMonitorFactory } from '../monitors/pagination-monitor.factory';


@Injectable()
export class CloudFoundryUserProvidedServicesService {


  constructor(
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory,
    private paginationMonitorFactory: PaginationMonitorFactory,
  ) {

  }

  public getUserProvidedServices(cfGuid: string, spaceGuid?: string, relations = getUserProvidedServiceInstanceRelations)
    : Observable<APIResource<IUserProvidedServiceInstance>[]> {
    const action = new GetAllUserProvidedServices(null, cfGuid, relations, false, spaceGuid);
    const pagObs = getPaginationObservables({
      store: this.store,
      action,
      paginationMonitor: this.paginationMonitorFactory.create(
        action.paginationKey,
        entityFactory(action.entityKey)
      )
    });
    return combineLatest([
      pagObs.entities$, // Ensure entities is subbed to the fetch kicks off
      pagObs.fetchingEntities$
    ]).pipe(
      filter(([entities, fetching]) => !fetching),
      map(([entities, fetching]) => entities)
    );
  }

  public fetchUserProvidedServiceInstancesCount(cfGuid: string, orgGuid?: string, spaceGuid?: string)
    : Observable<number> {
    const parentSchemaKey = spaceGuid ? spaceSchemaKey : orgGuid ? organizationSchemaKey : 'cf';
    const uniqueKey = spaceGuid || orgGuid || cfGuid;
    const action = new GetAllUserProvidedServices(createEntityRelationPaginationKey(parentSchemaKey, uniqueKey), cfGuid, [], false);
    action.initialParams.q = [];
    if (orgGuid) {
      action.initialParams.q.push(new QParam('organization_guid', orgGuid, ' IN '));
    }
    if (spaceGuid) {
      action.initialParams.q.push(new QParam('space_guid', spaceGuid, ' IN '));
    }
    return fetchTotalResults(action, this.store, this.paginationMonitorFactory);
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
