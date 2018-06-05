import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { catchError, first, map, pairwise, skipWhile, switchMap, filter } from 'rxjs/operators';

import { GetAllOrgUsers, GetAllOrganizations } from '../actions/organization.actions';
import { GET_CF_USERS_BY_ORG, GetAllUsersByOrg } from '../actions/users.actions';
import { AppState } from '../app-state';
import { cfUserSchemaKey, endpointSchemaKey, organizationSchemaKey, entityFactory } from '../helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../helpers/entity-relations.types';
import { ApiRequestTypes } from '../reducers/api-request-reducer/request-helpers';
import { ActionState } from '../reducers/api-request-reducer/types';
import { selectPaginationState } from '../selectors/pagination.selectors';
import { NormalizedResponse, APIResource } from '../types/api.types';
import { PaginatedAction, PaginationEntityState } from '../types/pagination.types';
import { StartRequestAction, WrapperRequestActionFailed, WrapperRequestActionSuccess } from '../types/request.types';
import { EntityServiceFactory } from '../../core/entity-service-factory.service';
import { IOrganization } from '../../core/cf-api.types';
import { getPaginationObservables } from '../reducers/pagination-reducer/pagination-reducer.helper';
import { PaginationMonitorFactory } from '../../shared/monitors/pagination-monitor.factory';


@Injectable()
export class UsersEffects {

  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
    private paginationMonitorFactory: PaginationMonitorFactory,
  ) { }


  @Effect() fetchUsersByOrg$ = this.actions$.ofType<GetAllUsersByOrg>(GET_CF_USERS_BY_ORG).pipe(
    switchMap(action => {
      const mockRequestType: ApiRequestTypes = 'fetch';
      const mockPaginationAction: PaginatedAction = {
        entityKey: cfUserSchemaKey,
        type: action.type,
        paginationKey: action.paginationKey,
        actions: null,
      };
      // const actions: Action[] = [
      this.store.dispatch(new StartRequestAction(mockPaginationAction, mockRequestType));
      // ];

      const getAllOrgsPaginationKey = createEntityRelationPaginationKey(endpointSchemaKey, organizationSchemaKey);
      const allOrganisations$ = getPaginationObservables<APIResource<IOrganization>>({
        store: this.store,
        action: new GetAllOrganizations(getAllOrgsPaginationKey, action.cfGuid),
        paginationMonitor: this.paginationMonitorFactory.create(
          getAllOrgsPaginationKey,
          entityFactory(organizationSchemaKey)
        )
      }).entities$.pipe(
        filter(entities => !!entities),
        first(),
      );


      return allOrganisations$.pipe(
        switchMap(organisations => {
          const requests: {
            action: GetAllOrgUsers,
            monitor: Observable<boolean>
          }[] = [];

          organisations.forEach(organisation => {
            const getUsersAction = new GetAllOrgUsers(
              organisation.metadata.guid,
              createEntityRelationPaginationKey(organizationSchemaKey, organisation.metadata.guid),
              action.cfGuid,
              action.includeRelations,
              action.populateMissing
            );
            const monitor = this.createPaginationWatcher(this.store, getUsersAction.entityKey, getUsersAction.paginationKey);
            this.store.dispatch(getUsersAction);
            requests.push({
              action: getUsersAction,
              monitor
            });
          });
          return combineLatest(requests.map(action => action.monitor)).pipe(
            switchMap((results: boolean[]) => {
              if (results.some(result => !result)) {
                return observableOf(new WrapperRequestActionFailed('Failed to fetch users from one or more organisations', mockPaginationAction, mockRequestType));
              }

              const userGuidsPerOrg: Observable<string[]>[] = requests.map(request =>
                this.fetchPaginationState(this.store, request.action.entityKey, request.action.paginationKey).pipe(
                  first(),
                  map((paginationState: PaginationEntityState) => {
                    console.log(paginationState);
                    return paginationState.ids[1];
                  })
                )
              );

              return combineLatest(userGuidsPerOrg).pipe(
                map((userGuids: string[][]) => {
                  const a = userGuids.reduce((allUserGuids, subsetUserGuids) => {
                    subsetUserGuids.forEach(userGuid => allUserGuids[userGuid] = true);
                    return allUserGuids;
                  }, {});
                  return Object.keys(a);
                }),
                map(userGuids => {
                  const mappedData = {
                    entities: { [cfUserSchemaKey]: {} },
                    result: []
                  } as NormalizedResponse;
                  const userData = mappedData.entities[cfUserSchemaKey];
                  userGuids.forEach(userGuid => {
                    userData[userGuid] = {};
                  });
                  mappedData.result = [...userGuids];
                  return new WrapperRequestActionSuccess(mappedData, mockPaginationAction, mockRequestType);
                })
              );
            }),
            catchError(err => {
              const error = `Failed to fetch users from organisations: ${err}`;
              return observableOf(new WrapperRequestActionFailed(error, mockPaginationAction, mockRequestType));
            })
          );
        })
      );
    }),

  );

  private fetchPaginationState = (store: Store<AppState>, entityKey: string, paginationKey: string) =>
    store.select(selectPaginationState(entityKey, paginationKey))

  private createPaginationWatcher = (store: Store<AppState>, entityKey: string, paginationKey: string): Observable<boolean> =>
    this.fetchPaginationState(store, entityKey, paginationKey).pipe(
      map((paginationState: PaginationEntityState) => {
        const pageRequest: ActionState =
          paginationState && paginationState.pageRequests && paginationState.pageRequests[paginationState.currentPage];
        return pageRequest ? pageRequest.busy : true;
      }),
      pairwise(),
      map(([oldFetching, newFetching]) => {
        return oldFetching === true && newFetching === false;
      }),
      skipWhile(completed => !completed),
      first(),
    )

  // private createPaginationWatcher = (store: Store<AppState>, entityKey: string, paginationKey: string): Observable<boolean> =>
  //   store.select(selectPaginationState(entityKey, paginationKey)).pipe(
  //     map((paginationState: PaginationEntityState) => {
  //       const pageRequest: ActionState =
  //         paginationState && paginationState.pageRequests && paginationState.pageRequests[paginationState.currentPage];
  //       return pageRequest ? pageRequest.busy : true;
  //     }),
  //     pairwise(),
  //     map(([oldFetching, newFetching]) => {
  //       return oldFetching === true && newFetching === false;
  //     }),
  //     skipWhile(completed => !completed),
  //     first(),
  //   )
}
