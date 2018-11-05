import { AppState, IRequestEntityTypeState } from '../app-state';
import { Action } from '@ngrx/store';
import { APIResource } from '../types/api.types';
import { RouteEvents, UnmapRoute, DeleteRoute } from '../actions/route.actions';
import { APISuccessOrFailedAction } from '../types/request.types';
import { IRoute, IAppSummary } from '../../core/cf-api.types';
import { ASSIGN_ROUTE_SUCCESS, AssociateRouteWithAppApplication } from '../actions/application-service-routes.actions';

export function routeReducer(state: IRequestEntityTypeState<APIResource<IRoute>>, action: APISuccessOrFailedAction) {
  switch (action.type) {
    case ASSIGN_ROUTE_SUCCESS:
      const mapRouteAction = action.apiAction as AssociateRouteWithAppApplication;
      const addAppRoute = state[mapRouteAction.routeGuid];
      return {
        ...state,
        [mapRouteAction.routeGuid]: {
          ...addAppRoute,
          entity: addAppFromRoute(addAppRoute.entity, mapRouteAction.guid),
        }
      };
    case RouteEvents.UNMAP_ROUTE_SUCCESS:
      const unmapRouteAction = action.apiAction as UnmapRoute;
      const removeAppRoute = state[unmapRouteAction.routeGuid];
      return {
        ...state,
        [unmapRouteAction.routeGuid]: {
          ...removeAppRoute,
          entity: removeAppFromRoute(removeAppRoute.entity, unmapRouteAction.appGuid),
        }
      };
    default:
      return state;
  }
}
export function updateAppSummaryRoutesReducer(state: IRequestEntityTypeState<APIResource<IAppSummary>>, action: APISuccessOrFailedAction) {
  let currentState, routeGuid;
  switch (action.type) {
    case RouteEvents.UNMAP_ROUTE_SUCCESS:
      const unmapRouteAction = action.apiAction as UnmapRoute;
      currentState = state[unmapRouteAction.appGuid];
      routeGuid = unmapRouteAction.routeGuid;
      return newState(currentState, unmapRouteAction.appGuid, routeGuid, state);
    case RouteEvents.DELETE_SUCCESS:
      const deleteAction = action.apiAction as DeleteRoute;
      routeGuid = deleteAction.guid;
      if (deleteAction.appGuids) {
        // Mutate state for each App
        let mutatedState = state;
        deleteAction.appGuids.forEach(appGuid => {
          currentState = state[appGuid];
          mutatedState = newState(currentState, appGuid, routeGuid, mutatedState);
        });
        return mutatedState;
      } else if (deleteAction.appGuid) {
        currentState = state[deleteAction.appGuid];
        return newState(currentState, deleteAction.appGuid, routeGuid, state);
      }
      return state;
    default:
      return state;
  }

}
function newState(
  currentState: APIResource<IAppSummary>,
  appGuid: string,
  routeGuid: string,
  state: IRequestEntityTypeState<APIResource<IAppSummary>>
) {

  if (!currentState) {
    return state;
  }
  return {
    ...state,
    [appGuid]: {
      ...currentState,
      entity: {
        ...currentState.entity,
        routes: currentState.entity.routes.filter(r => r.entity.guid !== routeGuid)
      }
    }
  };
}

function addAppFromRoute(entity: IRoute, appGuid: string) {
  const oldApps = entity.apps ? entity.apps : [];
  return {
    ...entity,
    apps: [...oldApps, appGuid]
  };
}

function removeAppFromRoute(entity: any, appGuid: string) {
  return entity.apps ? {
    ...entity,
    apps: entity.apps.filter((app: string) => app !== appGuid)
  } : entity;
}

