import { AppState, IRequestEntityTypeState } from '../app-state';
import { Action } from '@ngrx/store';
import { APIResource } from '../types/api.types';
import { RouteEvents, UnmapRoute } from '../actions/route.actions';
import { APISuccessOrFailedAction } from '../types/request.types';
import { IRoute } from '../../core/cf-api.types';

export function routeReducer(state: IRequestEntityTypeState<APIResource<IRoute>>, action: Action) {
  switch (action.type) {
    case RouteEvents.UNMAP_ROUTE_SUCCESS:
      const successAction = action as APISuccessOrFailedAction;
      const removeUserPermissionAction = successAction.apiAction as UnmapRoute;
      const { appGuid, routeGuid } = removeUserPermissionAction;
      const route = state[routeGuid];
      return {
        ...state,
        [routeGuid]: {
          ...route,
          entity: removeAppFromRoute(route.entity, appGuid),
        }
      };
    default:
      return state;
  }
}

function removeAppFromRoute(entity: IRoute, appGuid: string) {
  return entity.apps ? {
    ...entity,
    apps: entity.apps.filter(app => app.metadata.guid !== appGuid)
  } : entity;
}

