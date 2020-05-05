import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { filter, first, map, pairwise, tap } from 'rxjs/operators';

import { ClearPaginationOfType } from '../../../../store/src/actions/pagination.actions';
import { entityCatalog } from '../../../../store/src/entity-catalog/entity-catalog.service';
import { EntityCatalogEntityConfig, IEntityMetadata } from '../../../../store/src/entity-catalog/entity-catalog.types';
import { EntityServiceFactory } from '../../../../store/src/entity-service-factory.service';
import { PaginationMonitorFactory } from '../../../../store/src/monitors/pagination-monitor.factory';
import { RequestInfoState } from '../../../../store/src/reducers/api-request-reducer/types';
import { getPaginationObservables } from '../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../store/src/types/api.types';
import { PaginatedAction } from '../../../../store/src/types/pagination.types';
import {
  CreateUserProvidedServiceInstance,
  getUserProvidedServiceInstanceRelations,
  IUserProvidedServiceInstanceData,
  UpdateUserProvidedServiceInstance,
} from '../../actions/user-provided-service.actions';
import { IUserProvidedServiceInstance } from '../../cf-api-svc.types';
import { CFAppState } from '../../cf-app-state';
import {
  organizationEntityType,
  serviceInstancesEntityType,
  spaceEntityType,
  userProvidedServiceInstanceEntityType,
} from '../../cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../../cf-types';
import { UserProvidedServiceActionBuilder } from '../../entity-action-builders/user-provided-service.action-builders';
import { createEntityRelationPaginationKey } from '../../entity-relations/entity-relations.types';
import { fetchTotalResults } from '../../features/cloud-foundry/cf.helpers';
import { selectCfRequestInfo } from '../../store/selectors/api.selectors';
import { QParam, QParamJoiners } from '../q-param';


@Injectable()
export class CloudFoundryUserProvidedServicesService {

  private serviceInstancesEntityConfig: EntityCatalogEntityConfig = {
    endpointType: CF_ENDPOINT_TYPE,
    entityType: serviceInstancesEntityType
  };

  private userProvidedServiceInstancesEntityConfig: EntityCatalogEntityConfig = {
    endpointType: CF_ENDPOINT_TYPE,
    entityType: userProvidedServiceInstanceEntityType
  };

  private userProvidedServiceEntity = entityCatalog.getEntity<IEntityMetadata, any, UserProvidedServiceActionBuilder>(
    CF_ENDPOINT_TYPE,
    userProvidedServiceInstanceEntityType
  );

  constructor(
    private store: Store<CFAppState>,
    private entityServiceFactory: EntityServiceFactory,
    private paginationMonitorFactory: PaginationMonitorFactory,
  ) {

  }

  public getUserProvidedServices(cfGuid: string, spaceGuid?: string, relations = getUserProvidedServiceInstanceRelations)
    : Observable<APIResource<IUserProvidedServiceInstance>[]> {
    const actionBuilder = this.userProvidedServiceEntity.actionOrchestrator.getActionBuilder('getAllInSpace');
    const action = actionBuilder(cfGuid, spaceGuid, null, relations, true);
    const pagObs = getPaginationObservables({
      store: this.store,
      action,
      paginationMonitor: this.paginationMonitorFactory.create(
        action.paginationKey,
        action,
        action.flattenPagination
      )
    }, action.flattenPagination);
    return combineLatest([
      pagObs.entities$, // Ensure entities is subbed to the fetch kicks off
      pagObs.fetchingEntities$
    ]).pipe(
      filter(([, fetching]) => !fetching),
      map(([entities]) => entities)
    );
  }

  public fetchUserProvidedServiceInstancesCount(cfGuid: string, orgGuid?: string, spaceGuid?: string)
    : Observable<number> {
    const parentSchemaKey = spaceGuid ? spaceEntityType : orgGuid ? organizationEntityType : 'cf';
    const uniqueKey = spaceGuid || orgGuid || cfGuid;
    const actionBuilder = this.userProvidedServiceEntity.actionOrchestrator.getActionBuilder('getMultiple');
    const action = actionBuilder(
      createEntityRelationPaginationKey(parentSchemaKey, uniqueKey),
      cfGuid,
      { includeRelations: [], populateMissing: false }
    ) as PaginatedAction;
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
    const actionBuilder = this.userProvidedServiceEntity.actionOrchestrator.getActionBuilder('get');
    const getUserProvidedServiceAction = actionBuilder(upsGuid, cfGuid);
    const service = this.entityServiceFactory.create<APIResource<IUserProvidedServiceInstance>>(
      upsGuid,
      getUserProvidedServiceAction
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
    const action = new CreateUserProvidedServiceInstance(cfGuid, guid, data, this.userProvidedServiceInstancesEntityConfig);
    const create$ = this.store.select(selectCfRequestInfo(userProvidedServiceInstanceEntityType, guid));
    this.store.dispatch(action);
    return create$.pipe(
      pairwise(),
      filter(([oldV, newV]) => oldV.creating && !newV.creating),
      map(([, newV]) => newV),
      first(),
      tap(v => {
        if (!v.error) {
          // Problem - Lists with multiple actions aren't updated following the creation of an entity based on secondary action
          // Here the service instance list (1st action SI, 2nd action UPSI) isn't updated so manually do so
          this.store.dispatch(new ClearPaginationOfType(this.serviceInstancesEntityConfig));
        }
      })
    );
  }

  updateUserProvidedService(
    cfGuid: string,
    guid: string,
    data: Partial<IUserProvidedServiceInstanceData>,
  ): Observable<RequestInfoState> {
    this.userProvidedServiceEntity.actionDispatchManager.dispatchUpdate(
      guid,
      cfGuid,
      data,
      this.userProvidedServiceInstancesEntityConfig
    );
    return this.userProvidedServiceEntity.getEntityMonitor(
      this.store,
      guid
    ).entityRequest$.pipe(
      filter(v => !!v.updating[UpdateUserProvidedServiceInstance.updateServiceInstance]),
      pairwise(),
      filter(([oldV, newV]) =>
        oldV.updating[UpdateUserProvidedServiceInstance.updateServiceInstance].busy &&
        !newV.updating[UpdateUserProvidedServiceInstance.updateServiceInstance].busy),
      map(([, newV]) => newV)
    );
  }

}
