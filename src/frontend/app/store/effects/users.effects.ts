import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { catchError, filter, first, map, switchMap } from 'rxjs/operators';

import { IOrganization } from '../../core/cf-api.types';
import { EntityServiceFactory } from '../../core/entity-service-factory.service';
import { PaginationMonitorFactory } from '../../shared/monitors/pagination-monitor.factory';
import { GetAllOrganizations, GetAllOrgUsers } from '../actions/organization.actions';
import { GET_CF_USERS_AS_NON_ADMIN, GetAllUsersAsNonAdmin } from '../actions/users.actions';
import { AppState } from '../app-state';
import { cfUserSchemaKey, endpointSchemaKey, entityFactory, organizationSchemaKey } from '../helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../helpers/entity-relations/entity-relations.types';
import { createPaginationCompleteWatcher, fetchPaginationStateFromAction } from '../helpers/store-helpers';
import { ApiRequestTypes } from '../reducers/api-request-reducer/request-helpers';
import { getPaginationObservables } from '../reducers/pagination-reducer/pagination-reducer.helper';
import { endpointsEntityRequestDataSelector } from '../selectors/endpoint.selectors';
import { APIResource, NormalizedResponse } from '../types/api.types';
import { PaginatedAction, PaginationEntityState } from '../types/pagination.types';
import { StartRequestAction, WrapperRequestActionFailed, WrapperRequestActionSuccess } from '../types/request.types';


@Injectable()
export class UsersEffects {

  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private entityServiceFactory: EntityServiceFactory,
  ) { }

  /**
   * Fetch users from each organisation. This is used when the user connected to cf is non-admin and cannot access the global users/ list
   */
  @Effect() fetchUsersByOrg$ = this.actions$.ofType<GetAllUsersAsNonAdmin>(GET_CF_USERS_AS_NON_ADMIN).pipe(
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

      const allOrganisations$ = this.fetchAllOrgs(action.cfGuid);

      // Loop through orgs fetching users associated with each
      return allOrganisations$.pipe(
        switchMap(organisations =>
          organisations && organisations.length > 0 ?
            this.fetchRolesPerOrg(organisations, action, mockPaginationAction, mockRequestType) :
            this.handleNoOrgs(action, mockPaginationAction, mockRequestType))
      );

    }),

  );

  private fetchRolesPerOrg(
    organisations: APIResource<IOrganization>[],
    action: GetAllUsersAsNonAdmin,
    mockPaginationAction: PaginatedAction,
    mockRequestType: ApiRequestTypes): Observable<any> {
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
        false, // By definition this is a non-admin block
        action.includeRelations,
      );
      // We're not interested if each set of users associated with an org is valid. Leave that up to whoever dispatched the action
      // to validate.
      getUsersAction.skipValidation = true;
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
  }

  private handleNoOrgs(
    action: GetAllUsersAsNonAdmin,
    mockPaginationAction: PaginatedAction,
    mockRequestType: ApiRequestTypes): Observable<any> {
    // There's no orgs to fetch users from, instead create a mock user entity for the signed in user. This avoids some ugly 'no user' type
    // messages and '-' shown for user count and improves the general experience for those who may be visiting for the first time.
    return this.store.select(endpointsEntityRequestDataSelector(action.cfGuid)).pipe(
      first(),
      map(cfEndpoint => {
        const mappedData = {
          entities: { [cfUserSchemaKey]: {} },
          result: []
        } as NormalizedResponse;
        const userGuid = cfEndpoint.user.guid;
        mappedData.entities[cfUserSchemaKey] = {
          [userGuid]: {
            entity: {
              guid: userGuid,
              active: true,
              admin: false,
              audited_organizations: [],
              audited_organizations_url: '',
              managed_organizations: [],
              managed_organizations_url: '',
              billing_managed_organizations: [],
              billing_managed_organizations_url: '',
              organizations: [],
              organizations_url: '',
              cfGuid: cfEndpoint.guid,
              username: cfEndpoint.user.name,
              spaces: [],
              spaces_url: '',
              managed_spaces: [],
              managed_spaces_url: '',
              audited_spaces: [],
              audited_spaces_url: '',
              default_space_guid: '',
            },
            metadata: {
              guid: userGuid
            }
          }
        };
        mappedData.result = [userGuid];
        return new WrapperRequestActionSuccess(mappedData, mockPaginationAction, mockRequestType);
      })
    );
  }

  private fetchAllOrgs(cfGuid: string) {
    // Discover all the orgs. In most cases we will already have this
    const getAllOrgsPaginationKey = createEntityRelationPaginationKey(endpointSchemaKey, cfGuid);
    return getPaginationObservables<APIResource<IOrganization>>({
      store: this.store,
      action: new GetAllOrganizations(getAllOrgsPaginationKey, cfGuid),
      paginationMonitor: this.paginationMonitorFactory.create(
        getAllOrgsPaginationKey,
        entityFactory(organizationSchemaKey)
      )
    }).entities$.pipe(
      filter(entities => !!entities),
      first(),
    );
  }
}
