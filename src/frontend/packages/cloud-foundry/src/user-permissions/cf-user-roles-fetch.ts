import { HttpClient } from '@angular/common/http';
import { Action, Store } from '@ngrx/store';
import { combineLatest, Observable, of } from 'rxjs';
import { catchError, first, map, pairwise, share, skipWhile, switchMap, tap } from 'rxjs/operators';

import { LoggerService } from '../../../core/src/core/logger.service';
import { AppState } from '../../../store/src/app-state';
import { entityCatalog } from '../../../store/src/entity-catalog/entity-catalog';
import { EntityUserRolesFetch } from '../../../store/src/entity-request-pipeline/entity-request-pipeline.types';
import {
  BaseHttpClientFetcher,
  flattenPagination,
  PaginationFlattener,
} from '../../../store/src/helpers/paginated-request-helpers';
import { ActionState } from '../../../store/src/reducers/api-request-reducer/types';
import { endpointsCfEntitiesConnectedSelector } from '../../../store/src/selectors/endpoint.selectors';
import { selectPaginationState } from '../../../store/src/selectors/pagination.selectors';
import { EndpointModel } from '../../../store/src/types/endpoint.types';
import { BasePaginatedAction, PaginationEntityState } from '../../../store/src/types/pagination.types';
import {
  GET_CURRENT_USER_CF_RELATIONS,
  GET_CURRENT_USER_CF_RELATIONS_FAILED,
  GET_CURRENT_USER_CF_RELATIONS_SUCCESS,
  GetCurrentUserRelationsComplete,
  GetUserCfRelations,
  GetUserRelations,
  UserRelationTypes,
} from '../actions/permissions.actions';
import { cfEntityCatalog } from '../cf-entity-catalog';
import { CFResponse } from '../store/types/cf-api.types';

// map(cfEndpoints =>
//   Object
//     .entries(cfEndpoints)
//     .filter(([id, endpoint]) => {
//       const validId = endpointIds.length === 0 || endpointIds.find(endpointId => endpointId === id);
//       const isAdmin = endpoint.user.admin;
//       return validId && !isAdmin
//     })
//     .map(([, endpoint]) => endpoint)
// ),

export const cfUserRolesFetch: EntityUserRolesFetch = (
  endpointIds: string[],
  store: Store<AppState>,
  logService: LoggerService,
  httpClient: HttpClient
) => {
  return store.select(endpointsCfEntitiesConnectedSelector).pipe(
    first(),
    map(cfEndpoints => endpointIds.length === 0 ?
      Object.values(cfEndpoints) :
      Object.values(cfEndpoints).filter(cfEndpoint => endpointIds.find(endpointId => endpointId === cfEndpoint.guid))),
    switchMap((cfEndpoints: EndpointModel[]) => {
      const isAllAdmins = cfEndpoints.every(endpoint => !!endpoint.user.admin);
      // If all endpoints are connected as admin, there's no permissions to fetch. So only update the permission state to initialised
      if (isAllAdmins) {
        cfEndpoints.map(endpoint => new GetUserCfRelations(endpoint.guid, GET_CURRENT_USER_CF_RELATIONS_SUCCESS))
      } else {
        // If some endpoints are not connected as admin, go out and fetch the current user's specific roles
        const flagsAndRoleRequests = dispatchRoleRequests(cfEndpoints, store, logService, httpClient);
        const allRequestsCompleted = handleCfRequests(flagsAndRoleRequests);
        return combineLatest(allRequestsCompleted).pipe(
          map(succeeds => succeeds.every(succeeded => !!succeeded)),
        );
      }
      return of(true);
    })
  )
}

interface CfsRequestState {
  [cfGuid: string]: Observable<boolean>[];
}

interface IEndpointConnectionInfo {
  guid: string;
  userGuid: string;
}

function dispatchRoleRequests(
  endpoints: EndpointModel[],
  store: Store<AppState>,
  logService: LoggerService,
  httpClient: HttpClient
): CfsRequestState {
  const requests: CfsRequestState = {};

  // Per endpoint fetch feature flags and user roles (unless admin, where we don't need to), then mark endpoint as initialised
  endpoints.forEach(endpoint => {
    if (endpoint.user.admin) {
      // We don't need permissions for admin users (they can do everything)
      requests[endpoint.guid] = [of(true)];
      store.dispatch(new GetUserCfRelations(endpoint.guid, GET_CURRENT_USER_CF_RELATIONS_SUCCESS));
    } else {
      // START fetching cf roles for current user
      store.dispatch(new GetUserCfRelations(endpoint.guid, GET_CURRENT_USER_CF_RELATIONS));

      // Dispatch feature flags fetch actions
      const ffAction = cfEntityCatalog.featureFlag.actions.getMultiple(endpoint.guid)
      requests[endpoint.guid] = [createPaginationCompleteWatcher(store, ffAction)];
      store.dispatch(ffAction);

      // Dispatch requests to fetch roles per role type for current user
      requests[endpoint.guid].push(...fetchCfUserRoles({ guid: endpoint.guid, userGuid: endpoint.user.guid }, store, httpClient));

      // FINISH fetching cf roles for current user
      combineLatest(requests[endpoint.guid]).pipe(
        first(),
        tap(succeeds => {
          store.dispatch(new GetUserCfRelations(
            endpoint.guid,
            succeeds.every(succeeded => !!succeeded) ? GET_CURRENT_USER_CF_RELATIONS_SUCCESS : GET_CURRENT_USER_CF_RELATIONS_FAILED)
          );
        }),
        catchError(err => {
          logService.warn('Failed to fetch current user permissions for a cf: ', err);
          store.dispatch(new GetUserCfRelations(endpoint.guid, GET_CURRENT_USER_CF_RELATIONS_FAILED));
          return of(err);
        })
      ).subscribe();
    }
  });
  return requests;
}

function handleCfRequests(requests: CfsRequestState): Observable<boolean>[] {
  const allCompleted: Observable<boolean>[] = [];
  Object.keys(requests).forEach(cfGuid => {
    const successes = requests[cfGuid];
    allCompleted.push(...successes);
  });
  return allCompleted;
}

function fetchCfUserRoles(endpoint: IEndpointConnectionInfo, store: Store<AppState>, httpClient: HttpClient): Observable<boolean>[] {
  return Object.values(UserRelationTypes).map((type: UserRelationTypes) => {
    const relAction = new GetUserRelations(endpoint.userGuid, type, endpoint.guid);
    return fetchCfUserRole(store, relAction, httpClient);
  });
}

class PermissionFlattener extends BaseHttpClientFetcher<CFResponse> implements PaginationFlattener<CFResponse, CFResponse> {

  constructor(httpClient: HttpClient, public url, public requestOptions: { [key: string]: any }) {
    super(httpClient, url, requestOptions, 'page');
  }
  public getTotalPages = (res: CFResponse) => res.total_pages;

  public mergePages = (res: CFResponse[]) => {
    const firstRes = res.shift();
    const final = res.reduce((finalRes, currentRes) => {
      finalRes.resources = [
        ...finalRes.resources,
      ];
      return finalRes;
    }, firstRes);
    return final;
  }
  public getTotalResults = (res: CFResponse): number => res.total_results;
  public clearResults = (res: CFResponse) => of(res);
}

export function fetchCfUserRole(store: Store<AppState>, action: GetUserRelations, httpClient: HttpClient): Observable<boolean> {
  const url = `pp/v1/proxy/v2/users/${action.guid}/${action.relationType}`;
  const params = {
    headers: {
      'x-cap-cnsi-list': action.endpointGuid,
      'x-cap-passthrough': 'true'
    },
    params: {
      'results-per-page': '100'
    }
  };
  const get$ = httpClient.get<CFResponse>(
    url,
    params
  );
  return flattenPagination(
    (flatAction: Action) => store.dispatch(flatAction),
    get$,
    new PermissionFlattener(httpClient, url, params)
  ).pipe(
    map(data => {
      store.dispatch(new GetCurrentUserRelationsComplete(action.relationType, action.endpointGuid, data.resources));
      return true;
    }),
    first(),
    catchError(err => of(false)),
    share()
  );
}

const fetchPaginationStateFromAction = (store: Store<AppState>, action: BasePaginatedAction) => {
  const entityKey = entityCatalog.getEntityKey(action);
  return store.select(selectPaginationState(entityKey, action.paginationKey));
};

/**
 * Using the given action wait until the associated pagination section changes from busy to not busy
 */
const createPaginationCompleteWatcher = (store: Store<AppState>, action: BasePaginatedAction): Observable<boolean> =>
  fetchPaginationStateFromAction(store, action).pipe(
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
  );