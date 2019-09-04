import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { debounceTime, filter, map } from 'rxjs/operators';

import { CF_ENDPOINT_TYPE } from '../../../../cloud-foundry/cf-types';
import {
  CreateUserProvidedServiceInstance,
  GetAllUserProvidedServices,
  GetUserProvidedService,
  getUserProvidedServiceInstanceRelations,
  IUserProvidedServiceInstanceData,
  UpdateUserProvidedServiceInstance,
} from '../../../../cloud-foundry/src/actions/user-provided-service.actions';
import { createEntityRelationPaginationKey } from '../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { RequestInfoState } from '../../../../store/src/reducers/api-request-reducer/types';
import { getPaginationObservables } from '../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../store/src/types/api.types';
import { IUserProvidedServiceInstance } from '../../core/cf-api-svc.types';
import { entityCatalogue } from '../../core/entity-catalogue/entity-catalogue.service';
import { EntityCatalogueEntityConfig } from '../../core/entity-catalogue/entity-catalogue.types';
import { PaginationMonitorFactory } from '../monitors/pagination-monitor.factory';
import { QParam, QParamJoiners } from '../../../../store/src/q-param';
import {
  serviceInstancesEntityType,
  spaceEntityType,
  organizationEntityType,
  userProvidedServiceInstanceEntityType,
  applicationEntityType
} from '../../../../cloud-foundry/src/cf-entity-factory';
import { CFAppState } from '../../../../cloud-foundry/src/cf-app-state';
import { selectCfRequestInfo } from '../../../../cloud-foundry/src/store/selectors/api.selectors';
import { fetchTotalResults } from '../../../../cloud-foundry/src/features/cloud-foundry/cf.helpers';
import { CFEntityServiceFactory } from '../../../../cloud-foundry/src/cf-entity-service-factory.service';
import { PaginatedAction } from '../../../../store/src/types/pagination.types';


@Injectable()
export class CloudFoundryUserProvidedServicesService {

  private serviceInstancesEntityConfig: EntityCatalogueEntityConfig = {
    endpointType: CF_ENDPOINT_TYPE,
    entityType: serviceInstancesEntityType
  };

  constructor(
    private store: Store<CFAppState>,
    private entityServiceFactory: CFEntityServiceFactory,
    private paginationMonitorFactory: PaginationMonitorFactory,
  ) {

  }

  public getUserProvidedServices(cfGuid: string, spaceGuid?: string, relations = getUserProvidedServiceInstanceRelations)
    : Observable<APIResource<IUserProvidedServiceInstance>[]> {
    const userProvidedServiceEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, userProvidedServiceInstanceEntityType);
    const actionBuilder = userProvidedServiceEntity.actionOrchestrator.getActionBuilder('getAllInSpace');
    const action = actionBuilder(null, cfGuid, relations, false, spaceGuid) as PaginatedAction;
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
    const userProvidedServiceEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, userProvidedServiceInstanceEntityType);
    const actionBuilder = userProvidedServiceEntity.actionOrchestrator.getActionBuilder('getMultiple');
    const action = actionBuilder(createEntityRelationPaginationKey(parentSchemaKey, uniqueKey), cfGuid, {includeRelatons: [], populateMissing: false}) as PaginatedAction;
    action.initialParams.q = [];
    if (orgGuid) {
      action.initialParams.q.push(new QParam('organization_guid', orgGuid, QParamJoiners.in).toString());
    }
    if (spaceGuid) {
      action.initialParams.q.push(new QParam('space_guid', spaceGuid, QParamJoiners.in).toString());
    }
    return fetchTotalResults(action, this.store, this.paginationMonitorFactory);
  }

  public getUserProvidedService(cfGuid: string, upsGuid: string): Observable<APIResource<IUserProvidedServiceInstance>> {
    const userProvidedServiceEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, userProvidedServiceInstanceEntityType);
    const actionBuilder = userProvidedServiceEntity.actionOrchestrator.getActionBuilder('get');
    const getUserProvidedServiceAction = actionBuilder(upsGuid, cfGuid);  
    const service = this.entityServiceFactory.create<APIResource<IUserProvidedServiceInstance>>(
      upsGuid,
      getUserProvidedServiceAction,
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
    const action = new CreateUserProvidedServiceInstance(cfGuid, guid, data, this.serviceInstancesEntityConfig);
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
    const userProvidedServiceEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, userProvidedServiceInstanceEntityType);
    const actionBuilder = userProvidedServiceEntity.actionOrchestrator.getActionBuilder('update');
    //TODO kate verify OK
    const updateAction = actionBuilder(cfGuid, guid, {existingUserProvidedServiceInstance: data, proxyPaginationEntityConfig: this.serviceInstancesEntityConfig});  
    //const updateAction = new UpdateUserProvidedServiceInstance(cfGuid, guid, data, this.serviceInstancesEntityConfig);
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
