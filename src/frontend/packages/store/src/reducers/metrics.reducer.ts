// import { IAppSummary, IRoute } from '../../core/cf-api.types';
// import { ASSIGN_ROUTE_SUCCESS, AssociateRouteWithAppApplication } from '../actions/application-service-routes.actions';
// import { DeleteRoute, RouteEvents, UnmapRoute } from '../actions/route.actions';
// import { IRequestEntityTypeState } from '../app-state';
// import { APIResource } from '../types/api.types';
// import { APISuccessOrFailedAction } from '../types/request.types';

// export function routeReducer(state: IRequestEntityTypeState<APIResource<IRoute>>, action: APISuccessOrFailedAction) {
//   switch (action.type) {
//     case ASSIGN_ROUTE_SUCCESS:
//       const mapRouteAction = action.apiAction as AssociateRouteWithAppApplication;
//       const addAppRoute = state[mapRouteAction.routeGuid];
//       return {
//         ...state,
//         [mapRouteAction.routeGuid]: {
//           ...addAppRoute,
//           entity: addAppFromRoute(addAppRoute.entity, mapRouteAction.guid),
//         }
//       };
//     default:
//       return state;
//   }
// }
// function newState(
//   currentState: APIResource<IAppSummary>,
//   appGuid: string,
//   routeGuid: string,
//   state: IRequestEntityTypeState<APIResource<IAppSummary>>
// ) {

//   if (!currentState) {
//     return state;
//   }
//   return {
//     ...state,
//     [appGuid]: {
//       ...currentState,
//       entity: {
//         ...currentState.entity,
//         routes: currentState.entity.routes.filter(r => r.entity.guid !== routeGuid)
//       }
//     }
//   };
// }

// function addAppFromRoute(entity: IRoute, appGuid: string) {
//   const oldApps = entity.apps ? entity.apps : [];
//   return {
//     ...entity,
//     apps: [...oldApps, appGuid]
//   };
// }

// function removeAppFromRoute(entity: any, appGuid: string) {
//   return entity.apps ? {
//     ...entity,
//     apps: entity.apps.filter((app: string) => app !== appGuid)
//   } : entity;
// }

