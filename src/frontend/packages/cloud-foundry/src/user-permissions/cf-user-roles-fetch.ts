import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { combineLatest, defer, from, Observable, of } from 'rxjs';
import { take, catchError, map, pairwise, share, skipWhile, switchMap, tap } from 'rxjs/operators';

import {
  AppState,
  entityCatalog,
  EndpointsDataService,
  EntityUserRolesEndpoint,
  EntityUserRolesFetch,
  ActionState,
  selectPaginationState,
  PaginationEntityState,
  BasePaginatedAction,
  APIResource } from '@stratosui/store';
import {
  CfUserRelationTypes,
  GET_CURRENT_CF_USER_RELATIONS,
  GET_CURRENT_CF_USER_RELATIONS_FAILED,
  GET_CURRENT_CF_USER_RELATIONS_SUCCESS,
  GetCfUserRelations,
  GetCurrentCfUserRelationsComplete } from '../actions/permissions.actions';
import { cfEntityCatalog } from '../cf-entity-catalog';
import { CF_ENDPOINT_TYPE } from '../cf-types';

/**
 * Wire shape returned by GET /pp/v1/cf/current-user-roles/:cnsiGuid
 * (handler: getNativeCurrentUserRoles). Each bucket key matches a
 * {@link CfUserRelationTypes} enum value; every canonical key is present
 * (empty buckets serialize as `[]`, never absent). Entry shape mirrors
 * the legacy V2 envelope so the existing role reducers (which read
 * `metadata.guid` for org buckets and additionally `entity.organization_guid`
 * for space buckets) need zero change.
 */
export interface CfCurrentUserRolesResponse {
  buckets: {
    [relationType: string]: APIResource<{ organization_guid?: string }>[];
  };
}

const createEndpointArray = (
  endpointsService: EndpointsDataService,
  endpoints: string[] | EntityUserRolesEndpoint[]
): Observable<EntityUserRolesEndpoint[]> => {
  // If there's no endpoints get all from store. Alternatively fetch specific endpoint id's from store
  if (!endpoints || !endpoints.length || typeof (endpoints[0]) === 'string') {
    const endpointIds = endpoints as string[];
    // Wave 2 (W36-B): connected CF endpoint enumeration now reads from
    // {@link EndpointsDataService} signals instead of
    // `connectedEndpointsOfTypesSelector`. Wrapped in `defer(from(whenReady))`
    // to preserve the legacy `take(1)` first-emission semantic — callers
    // still get a single-shot observable that resolves once the data
    // service has hydrated.
    return defer(() => from(endpointsService.whenReady())).pipe(
      map(() =>
        Array.from(endpointsService.endpoints().values())
          .filter(e => e.cnsi_type === CF_ENDPOINT_TYPE && e.connectionStatus === 'connected')
      ),
      map(cfEndpoints => endpointIds.length === 0 ?
        cfEndpoints :
        cfEndpoints.filter(cfEndpoint => endpointIds.find(endpointId => endpointId === cfEndpoint.guid))
      ),
      take(1),
    );
  }
  return of(endpoints as EntityUserRolesEndpoint[]);
};

export const cfUserRolesFetch: EntityUserRolesFetch = (
  endpoints: string[] | EntityUserRolesEndpoint[],
  store: Store<AppState>,
  httpClient: HttpClient,
  endpointsService: EndpointsDataService
) => {
  return createEndpointArray(endpointsService, endpoints).pipe(
    switchMap((cfEndpoints: EntityUserRolesEndpoint[]) => {
      const isAllAdmins = cfEndpoints.every(endpoint => !!endpoint.user.admin);
      // If all endpoints are connected as admin, there's no permissions to fetch. So only update the permission state to initialised
      if (isAllAdmins) {
        cfEndpoints.forEach(endpoint => store.dispatch(new GetCfUserRelations(endpoint.guid, GET_CURRENT_CF_USER_RELATIONS_SUCCESS)));
      } else {
        // If some endpoints are not connected as admin, go out and fetch the current user's specific roles
        const flagsAndRoleRequests = dispatchRoleRequests(cfEndpoints, store, httpClient);
        const allRequestsCompleted = handleCfRequests(flagsAndRoleRequests);
        return combineLatest(allRequestsCompleted).pipe(
          map(succeeds => succeeds.every(succeeded => !!succeeded)),
        );
      }
      return of(true);
    })
  );
};

interface CfsRequestState {
  [cfGuid: string]: Observable<boolean>[];
}

function dispatchRoleRequests(
  endpoints: EntityUserRolesEndpoint[],
  store: Store<AppState>,
  httpClient: HttpClient
): CfsRequestState {
  const requests: CfsRequestState = {};

  // Per endpoint fetch feature flags and user roles (unless admin, where we don't need to), then mark endpoint as initialised
  endpoints.forEach(endpoint => {
    if (endpoint.user.admin) {
      // We don't need permissions for admin users (they can do everything)
      requests[endpoint.guid] = [of(true)];
      store.dispatch(new GetCfUserRelations(endpoint.guid, GET_CURRENT_CF_USER_RELATIONS_SUCCESS));
    } else {
      // START fetching cf roles for current user
      store.dispatch(new GetCfUserRelations(endpoint.guid, GET_CURRENT_CF_USER_RELATIONS));

      // Dispatch feature flags fetch actions
      const ffAction = cfEntityCatalog.featureFlag.actions.getMultiple(endpoint.guid);
      requests[endpoint.guid] = [createPaginationCompleteWatcher(store, ffAction)];
      store.dispatch(ffAction);

      // Single drained call to the native handler replaces the legacy
      // 7-sequential-fetch fanout (one per CfUserRelationTypes value
      // hitting pp/v1/proxy/v2/users/{guid}/{relType}). The handler
      // emits the 7 buckets in one response; we dispatch one
      // GetCurrentCfUserRelationsComplete per bucket so the existing
      // reducer keeps driving each per-relation state slice unchanged.
      requests[endpoint.guid].push(fetchCfCurrentUserRoles(store, endpoint.guid, httpClient));

      // FINISH fetching cf roles for current user
      combineLatest(requests[endpoint.guid]).pipe(
        take(1),
        tap(succeeds => {
          store.dispatch(new GetCfUserRelations(
            endpoint.guid,
            succeeds.every(succeeded => !!succeeded) ? GET_CURRENT_CF_USER_RELATIONS_SUCCESS : GET_CURRENT_CF_USER_RELATIONS_FAILED)
          );
        }),
        catchError(err => {
          console.warn('Failed to fetch current user permissions for a cf: ', err);
          store.dispatch(new GetCfUserRelations(endpoint.guid, GET_CURRENT_CF_USER_RELATIONS_FAILED));
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

/**
 * Single-fetch replacement for the legacy 7-fanout permission fetch.
 *
 * Hits GET /pp/v1/cf/current-user-roles/{endpointGuid}. The native
 * handler (getNativeCurrentUserRoles) makes one /v3/roles?user_guids={me}
 * call and projects rows into the 7 buckets the frontend reducer
 * expects. On success we dispatch one GetCurrentCfUserRelationsComplete
 * per CfUserRelationTypes value off the response, exactly mirroring
 * the dispatch surface the per-relation flow produced — the reducer
 * sees the same actions in the same shape.
 *
 * Bucket entries arrive as legacy V2 envelopes
 * ({ metadata: { guid }, entity: { organization_guid? } }) so
 * downstream reducers (current-cf-user-roles-org/space) keep reading
 * `metadata.guid` / `entity.organization_guid` unchanged.
 *
 * Round-trip count drops 7→1 per CF endpoint per app load — at CAPI
 * RTTs of 50–200 ms this is the primary perceived-perf lever for
 * permission-gated action buttons.
 */
export function fetchCfCurrentUserRoles(
  store: Store<AppState>,
  endpointGuid: string,
  httpClient: HttpClient
): Observable<boolean> {
  return httpClient.get<CfCurrentUserRolesResponse>(`pp/v1/cf/current-user-roles/${endpointGuid}`).pipe(
    map(response => {
      const buckets = response?.buckets ?? {};
      Object.values(CfUserRelationTypes).forEach((relationType: CfUserRelationTypes) => {
        const data = buckets[relationType] ?? [];
        store.dispatch(new GetCurrentCfUserRelationsComplete(relationType, endpointGuid, data));
      });
      return true;
    }),
    take(1),
    catchError(err => {
      console.warn('Failed to fetch current user permissions for a cf: ', err);
      return of(false);
    }),
    share(),
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
    take(1),
  );
