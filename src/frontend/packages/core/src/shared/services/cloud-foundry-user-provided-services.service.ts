import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { filter, first, map, pairwise, tap } from 'rxjs/operators';

import {
  getUserProvidedServiceInstanceRelations,
  IUserProvidedServiceInstanceData,
} from '../../../../cloud-foundry/src/actions/user-provided-service.actions';
import { CFAppState } from '../../../../cloud-foundry/src/cf-app-state';
import { cfEntityCatalog } from '../../../../cloud-foundry/src/cf-entity-catalog';
import { organizationEntityType, spaceEntityType } from '../../../../cloud-foundry/src/cf-entity-types';
import { createEntityRelationPaginationKey } from '../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { fetchTotalResults } from '../../../../cloud-foundry/src/features/cloud-foundry/cf.helpers';
import { QParam, QParamJoiners } from '../../../../cloud-foundry/src/shared/q-param';
import { ClearPaginationOfType } from '../../../../store/src/actions/pagination.actions';
import { PaginationMonitorFactory } from '../../../../store/src/monitors/pagination-monitor.factory';
import { RequestInfoState } from '../../../../store/src/reducers/api-request-reducer/types';
import { APIResource } from '../../../../store/src/types/api.types';
import { IUserProvidedServiceInstance } from '../../core/cf-api-svc.types';

@Injectable()
export class CloudFoundryUserProvidedServicesService {

  constructor(
    private store: Store<CFAppState>,
    private paginationMonitorFactory: PaginationMonitorFactory,
  ) {

  }

  public getUserProvidedServices(cfGuid: string, spaceGuid?: string, relations = getUserProvidedServiceInstanceRelations)
    : Observable<APIResource<IUserProvidedServiceInstance>[]> {

    const pagObs = cfEntityCatalog.userProvidedService.store.getAllInSpace.getPaginationService(
      cfGuid, spaceGuid, null, relations, true
    );
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

    const action = cfEntityCatalog.userProvidedService.actions.getMultiple(
      createEntityRelationPaginationKey(parentSchemaKey, uniqueKey),
      cfGuid,
      { includeRelations: [], populateMissing: false }
    );
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
    return cfEntityCatalog.userProvidedService.store.getEntityService(upsGuid, cfGuid, {}).waitForEntity$.pipe(
      map(e => e.entity)
    );
  }

  public createUserProvidedService(
    cfGuid: string,
    guid: string,
    data: IUserProvidedServiceInstanceData
  ): Observable<RequestInfoState> {
    return cfEntityCatalog.userProvidedService.api.create<RequestInfoState>(
      cfGuid,
      guid,
      data,
      // this.userProvidedServiceInstancesEntityConfig
    ).pipe(
      pairwise(),
      filter(([oldV, newV]) => oldV.creating && !newV.creating),
      map(([, newV]) => newV),
      first(),
      tap(v => {
        if (!v.error) {
          // Problem - Lists with multiple actions aren't updated following the creation of an entity based on secondary action
          // Here the service instance list (1st action SI, 2nd action UPSI) isn't updated so manually do so
          this.store.dispatch(new ClearPaginationOfType(cfEntityCatalog.service));
        }
      })
    );
  }

  updateUserProvidedService(
    cfGuid: string,
    guid: string,
    data: Partial<IUserProvidedServiceInstanceData>,
  ): Observable<RequestInfoState> {
    // TODO: RC Q
    const updatingKey = cfEntityCatalog.userProvidedService.actions.update(guid, cfGuid, data).updatingKey;
    // const updatingKey = UpdateUserProvidedServiceInstance.updateServiceInstance;
    return cfEntityCatalog.userProvidedService.api.update<RequestInfoState>(
      guid,
      cfGuid,
      data,
      // this.userProvidedServiceInstancesEntityConfig
    ).pipe(
      filter(v => !!v.updating[updatingKey]),
      pairwise(),
      filter(([oldV, newV]) =>
        oldV.updating[updatingKey].busy &&
        !newV.updating[updatingKey].busy),
      map(([, newV]) => newV)
    );
  }

}



