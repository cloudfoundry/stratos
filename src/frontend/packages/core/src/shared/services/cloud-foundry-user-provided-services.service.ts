import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { debounceTime, filter, map } from 'rxjs/operators';

import { CF_ENDPOINT_TYPE } from '../../../../cloud-foundry/cf-types';
import {
  organizationEntityType,
  serviceEntityType,
  serviceInstancesEntityType,
  spaceEntityType,
  userProvidedServiceInstanceEntityType,
} from '../../../../cloud-foundry/src/cf-entity-factory';
import { selectCfRequestInfo } from '../../../../cloud-foundry/src/selectors/api.selectors';
import {
  CreateUserProvidedServiceInstance,
  GetAllUserProvidedServices,
  GetUserProvidedService,
  getUserProvidedServiceInstanceRelations,
  IUserProvidedServiceInstanceData,
  UpdateUserProvidedServiceInstance,
} from '../../../../cloud-foundry/src/actions/user-provided-service.actions';
import { CFAppState } from '../../../../store/src/app-state';
import { createEntityRelationPaginationKey } from '../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { RequestInfoState } from '../../../../store/src/reducers/api-request-reducer/types';
import { getPaginationObservables } from '../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../store/src/types/api.types';
import { QParam } from '../../../../store/src/types/pagination.types';
import { IUserProvidedServiceInstance } from '../../core/cf-api-svc.types';
import { entityCatalogue } from '../../core/entity-catalogue/entity-catalogue.service';
import { EntityServiceFactory } from '../../core/entity-service-factory.service';
import { fetchTotalResults } from '../../features/cloud-foundry/cf.helpers';
import { PaginationMonitorFactory } from '../monitors/pagination-monitor.factory';


@Injectable()
export class CloudFoundryUserProvidedServicesService {


  constructor(
    private store: Store<CFAppState>,
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
        action
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
    const parentSchemaKey = spaceGuid ? spaceEntityType : orgGuid ? organizationEntityType : 'cf';
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
    const action = new CreateUserProvidedServiceInstance(cfGuid, guid, data, serviceInstancesEntityType);
    const create$ = this.store.select(selectCfRequestInfo(userProvidedServiceInstanceEntityType, guid));
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
      serviceEntityType
    );
    const catalogueEntity = entityCatalogue.getEntity({
      entityType: userProvidedServiceInstanceEntityType,
      endpointType: CF_ENDPOINT_TYPE
    });
    this.store.dispatch(updateAction);
    return catalogueEntity.getEntityMonitor(
      this.store,
      guid
    ).entityRequest$.pipe(
      filter(
        er => er.updating[UpdateUserProvidedServiceInstance.updateServiceInstance] &&
          er.updating[UpdateUserProvidedServiceInstance.updateServiceInstance].busy
      )
    );
  }

}
