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
      return newState(currentState, unmapRouteAction.appGuid, routeGuid);
    case RouteEvents.DELETE_SUCCESS:
      const deleteAction = action.apiAction as DeleteRoute;
      currentState = state[deleteAction.appGuid];
      routeGuid = deleteAction.guid;
      return newState(currentState, deleteAction.appGuid, routeGuid);
    default:
      return state;
  }

  function  newState(currentState: APIResource<IAppSummary>, appGuid: string, routeGuid: string) {
    return {
      ...state,
      [appGuid]: {
        ...currentState,
        entity: {
          ...currentState.entity,
          routes: currentState.entity.routes.filter(r => r.entity.guid != routeGuid)
        }
      }
    };
  }
}

function getRoute(action: APISuccessOrFailedAction): APIResource<IRoute>{
  if (action.response && action.response.entities && action.response.entities.route){
    return action.response.entities.route[0];
  }
  return null;
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

