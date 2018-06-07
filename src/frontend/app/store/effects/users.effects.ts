import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { catchError, first, map, pairwise, skipWhile, switchMap, filter } from 'rxjs/operators';

import { GetAllOrgUsers, GetAllOrganizations } from '../actions/organization.actions';
import { GET_CF_USERS_BY_ORG, GetAllUsersAsNonAdmin } from '../actions/users.actions';
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
import { fetchPaginationStateFromAction, createPaginationCompleteWatcher } from '../helpers/store-helpers';


@Injectable()
export class UsersEffects {

  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
    private paginationMonitorFactory: PaginationMonitorFactory,
  ) { }

  /**
   * Fetch users from each organisation. This is used when the user connected to cf is non-admin and cannot access the global users/ list
   */
  @Effect() fetchUsersByOrg$ = this.actions$.ofType<GetAllUsersAsNonAdmin>(GET_CF_USERS_BY_ORG).pipe(
    switchMap(action => {
      const mockRequestType: ApiRequestTypes = 'fetch';
      const mockPaginationAction: PaginatedAction = {
        entityKey: cfUserSchemaKey,
        type: action.type,
        paginationKey: action.paginationKey,
        actions: null,
      };

      // START the 'list' fetch
      this.store.dispatch(new StartRequestAction(mockPaginationAction, mockRequestType));

      // Discover all the orgs. In most cases we will already have this
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
            succeeded$: Observable<boolean>
          }[] = [];

          // For each org...
          organisations.forEach(organisation => {
            // Fetch the users
            const getUsersAction = new GetAllOrgUsers(
              organisation.metadata.guid,
              createEntityRelationPaginationKey(organizationSchemaKey, organisation.metadata.guid),
              action.cfGuid,
              action.includeRelations,
              action.populateMissing
            );
            // Create a way to monitor fetch users success
            const monitor = createPaginationCompleteWatcher(this.store, getUsersAction);
            this.store.dispatch(getUsersAction);
            requests.push({
              action: getUsersAction,
              succeeded$: monitor
            });
          });

          // Wait for all requests to complete and then act on their result
          return combineLatest(requests.map(request => request.succeeded$)).pipe(
            switchMap((results: boolean[]) => {
              if (results.some(result => !result)) {
                // Some requests have failed, mark the list as errored
                return observableOf(new WrapperRequestActionFailed(
                  'Failed to fetch users from one or more organisations',
                  mockPaginationAction, mockRequestType));
              }

              // Fetch the list of user guids for each org from the store
              const userGuidsPerOrg: Observable<string[]>[] = requests.map(request =>
                fetchPaginationStateFromAction(this.store, request.action).pipe(
                  first(),
                  map((paginationState: PaginationEntityState) => {
                    return paginationState.ids[1];
                  })
                )
              );

              // Create the 'lists' page 1 which is a collection of unique user guids from above
              return combineLatest(userGuidsPerOrg).pipe(
                map((userGuids: string[][]) => {
                  // Create an object with keys of all users (eliminates dupes efficiently)
                  return Object.keys(userGuids.reduce((allUserGuids, subsetUserGuids) => {
                    subsetUserGuids.forEach(userGuid => allUserGuids[userGuid] = true);
                    return allUserGuids;
                  }, {}));
                }),
                map(userGuids => {
                  // Create a normalized response containing the list of guids. Note - we're not interested in the user entities as these
                  // have already be stored
                  const mappedData = {
                    entities: { [cfUserSchemaKey]: {} },
                    result: []
                  } as NormalizedResponse;
                  const userData = mappedData.entities[cfUserSchemaKey];
                  userGuids.forEach(userGuid => {
                    userData[userGuid] = {};
                  });
                  mappedData.result = [...userGuids];
                  // Dispatch the mock action with the info for the store
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

}
