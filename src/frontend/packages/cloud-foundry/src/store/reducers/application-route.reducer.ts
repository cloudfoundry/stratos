import type { IRequestEntityTypeState } from '../../../../store/src/app-state';
import type { APIResource } from '../../../../store/src/types/api.types';
import type { APISuccessOrFailedAction } from '../../../../store/src/types/request.types';
import { ASSIGN_ROUTE_SUCCESS, type AssignRouteToApplication } from '../../actions/application-service-routes.actions';
import { type BaseRouteAction, RouteEvents } from '../../actions/route.actions';
import type { IApp } from '../../cf-api.types';

export function updateApplicationRoutesReducer() {
  return (
    state: IRequestEntityTypeState<APIResource<IApp<string>>>,
    action: APISuccessOrFailedAction
  ): IRequestEntityTypeState<APIResource<IApp<string>>> => {
    switch (action.type) {
      case ASSIGN_ROUTE_SUCCESS: {
        const assignAction: AssignRouteToApplication = action.apiAction as AssignRouteToApplication;
        return addApplicationRoutes(state, assignAction.guid, assignAction.routeGuid);
      }
      case RouteEvents.DELETE_SUCCESS:
      case RouteEvents.UNMAP_ROUTE_SUCCESS: {
        const routeAction: BaseRouteAction = action.apiAction as BaseRouteAction;
        return removeApplicationRoute(state, routeAction.appGuid, routeAction.guid);
      }
    }
    return state;
  };
}

function applyNewRoutes(state: IRequestEntityTypeState<APIResource<IApp<string>>>, appGuid: string, _routeGuid: string, newRoutes: string[]): IRequestEntityTypeState<APIResource<IApp<string>>> {
  const oldEntities = Object.values(state);
  const entities: IRequestEntityTypeState<APIResource<IApp<string>>> = {};
  oldEntities.forEach((app: APIResource<IApp<string>>) => {
    if (app.metadata.guid === appGuid) {
      const newApp: APIResource<IApp<string>> = {
        ...app,
        entity: {
          ...app.entity,
          routes: newRoutes
        }
      };
      entities[app.metadata.guid] = newApp;
    } else {
      entities[app.metadata.guid] = app;
    }
  });
  return entities;
}

function addApplicationRoutes(state: IRequestEntityTypeState<APIResource<IApp<string>>>, appGuid: string, routeGuid: string): IRequestEntityTypeState<APIResource<IApp<string>>> {
  if (!appGuid || !state[appGuid]) {
    return state;
  }
  const oldRoutes = state[appGuid].entity.routes || [];
  return applyNewRoutes(state, appGuid, routeGuid, [...oldRoutes, routeGuid]);
}

function removeApplicationRoute(state: IRequestEntityTypeState<APIResource<IApp<string>>>, appGuid: string, routeGuid: string): IRequestEntityTypeState<APIResource<IApp<string>>> {
  if (!appGuid || !state[appGuid]) {
    return state;
  }
  const oldRoutes = state[appGuid].entity.routes || [];
  const newRoutes = oldRoutes.filter((route: string) => route !== routeGuid);
  return applyNewRoutes(state, appGuid, routeGuid, [...newRoutes]);
}
