import { IRequestEntityTypeState } from '../../../../store/src/app-state';
import { APIResource } from '../../../../store/src/types/api.types';
import { APISuccessOrFailedAction } from '../../../../store/src/types/request.types';
import { ASSIGN_ROUTE_SUCCESS, AssignRouteToApplication } from '../../actions/application-service-routes.actions';
import { DeleteRoute, RouteEvents, UnmapRoute } from '../../actions/route.actions';
import { IAppSummary, IRoute } from '../../cf-api.types';

export function routeReducer(state: IRequestEntityTypeState<APIResource<IRoute>>, action: APISuccessOrFailedAction) {
  switch (action.type) {
    case ASSIGN_ROUTE_SUCCESS:
      const mapRouteAction = action.apiAction as AssignRouteToApplication;
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
export function updateAppSummaryRoutesReducer(state: IRequestEntityTypeState<IAppSummary>, action: APISuccessOrFailedAction) {
  let currentState;
  let routeGuid;
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
  currentState: IAppSummary,
  appGuid: string,
  routeGuid: string,
  state: IRequestEntityTypeState<IAppSummary>
) {

  if (!currentState) {
    return state;
  }
  return {
    ...state,
    [appGuid]: {
      ...currentState,
      routes: currentState.routes.filter(r => r.guid !== routeGuid)
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

