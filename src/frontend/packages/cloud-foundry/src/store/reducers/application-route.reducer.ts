import { IRequestEntityTypeState } from '../../../../store/src/app-state';
import { APIResource } from '../../../../store/src/types/api.types';
import { APISuccessOrFailedAction } from '../../../../store/src/types/request.types';
import { ASSIGN_ROUTE_SUCCESS, AssignRouteToApplication } from '../../actions/application-service-routes.actions';
import { BaseRouteAction, RouteEvents } from '../../actions/route.actions';
import { IApp } from '../../cf-api.types';

export function updateApplicationRoutesReducer() {
  return (
    state: IRequestEntityTypeState<APIResource<IApp<string>>>,
    action: APISuccessOrFailedAction
  ): IRequestEntityTypeState<APIResource<IApp>> => {
    switch (action.type) {
      case ASSIGN_ROUTE_SUCCESS:
        const assignAction: AssignRouteToApplication = action.apiAction as AssignRouteToApplication;
        return addApplicationRoutes(state, assignAction.guid, assignAction.routeGuid);
      case RouteEvents.DELETE_SUCCESS:
      case RouteEvents.UNMAP_ROUTE_SUCCESS:
        const routeAction: BaseRouteAction = action.apiAction as BaseRouteAction;
        return removeApplicationRoute(state, routeAction.appGuid, routeAction.guid);
    }
    return state;
  };
}

function applyNewRoutes(state: IRequestEntityTypeState<APIResource<IApp>>, appGuid: string, routeGuid: string, newRoutes: any[]) {
  const oldEntities = Object.values(state);
  const entities = {};
  oldEntities.forEach(app => {
    if (app.metadata.guid === appGuid) {
      const newApp = {
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

function addApplicationRoutes(state: IRequestEntityTypeState<APIResource<IApp>>, appGuid: string, routeGuid: string) {
  if (!appGuid || !state[appGuid]) {
    return state;
  }
  const oldRoutes = state[appGuid].entity.routes || [];
  return applyNewRoutes(state, appGuid, routeGuid, [...oldRoutes, routeGuid]);
}

function removeApplicationRoute(state: IRequestEntityTypeState<APIResource<IApp<string>>>, appGuid: string, routeGuid: string) {
  if (!appGuid || !state[appGuid]) {
    return state;
  }
  const oldRoutes = state[appGuid].entity.routes || [];
  const newRoutes = oldRoutes.filter(route => route !== routeGuid);
  return applyNewRoutes(state, appGuid, routeGuid, [...newRoutes]);
}
