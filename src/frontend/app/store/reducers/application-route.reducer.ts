import { ASSIGN_ROUTE_SUCCESS, AssociateRouteWithAppApplication } from '../actions/application-service-routes.actions';
import { BaseRouteAction, RouteEvents } from '../actions/route.actions';
import { APIResource } from '../types/api.types';
import { APISuccessOrFailedAction } from '../types/request.types';

export function updateApplicationRoutesReducer() {
  return function (state: APIResource, action: APISuccessOrFailedAction) {
    switch (action.type) {
      case ASSIGN_ROUTE_SUCCESS:
        const assignAction: AssociateRouteWithAppApplication = action.apiAction as AssociateRouteWithAppApplication;
        return deleteApplicationRoutes(state, assignAction.guid, assignAction.routeGuid);
      case RouteEvents.DELETE_SUCCESS:
      case RouteEvents.UNMAP_ROUTE_SUCCESS:
        const routeAction: BaseRouteAction = action.apiAction as BaseRouteAction;
        return deleteApplicationRoutes(state, routeAction.appGuid, routeAction.guid);
    }
    return state;
  };
}
function deleteApplicationRoutes(state: APIResource, appGuid: string, routeGuid: string) {
  if (!appGuid) {
    return state;
  }
  const oldEntities = Object.values(state);
  const entities = {};
  oldEntities.forEach(app => {
    if (app.metadata.guid === appGuid) {
      const newApp = {
        ...app,
        entity: {
          ...app.entity,
          routes: null
        }
      };
      entities[app.metadata.guid] = newApp;
    } else {
      entities[app.metadata.guid] = app;
    }
  });
  return entities;
}
