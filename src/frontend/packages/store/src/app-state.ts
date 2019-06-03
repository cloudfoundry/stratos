import { ActionHistoryState } from './reducers/action-history-reducer';
import { AuthState } from './reducers/auth.reducer';
import { DashboardState } from './reducers/dashboard-reducer';
import { ListsState } from './reducers/list.reducer';
import { CreateNewApplicationState } from './types/create-application.types';
import { CreateServiceInstanceState } from './types/create-service-instance.types';
import { ICurrentUserRolesState } from './types/current-user-roles.types';
import { DeployApplicationState } from './types/deploy-application.types';
import { EndpointState } from './types/endpoint.types';
import { ExtendedRequestState, CFRequestDataState, BaseRequestDataState } from './types/entity.types';
import { IUserFavoritesGroupsState } from './types/favorite-groups.types';
import { InternalEventsState } from './types/internal-events.types';
import { PaginationEntityTypeState } from './types/pagination.types';
import { IRecentlyVisitedState } from './types/recently-visited.types';
import { RoutingHistory } from './types/routing.type';
import { UAASetupState } from './types/uaa-setup.types';
import { UsersRolesState } from './types/users-roles.types';
import { RequestInfoState } from './reducers/api-request-reducer/types';

export interface IRequestTypeState {
  [entityKey: string]: any;
}
export interface IRequestEntityTypeState<T> {
  [guid: string]: T;
}



export abstract class AppState<
  T extends Record<string, any> = any
  > {
  actionHistory: ActionHistoryState;
  auth: AuthState;
  uaaSetup: UAASetupState;
  endpoints: EndpointState;
  pagination: ExtendedRequestState<keyof T, PaginationEntityTypeState>;
  request: ExtendedRequestState<keyof T, IRequestEntityTypeState<RequestInfoState>>;
  requestData: T;
  dashboard: DashboardState;
  createApplication: CreateNewApplicationState;
  deployApplication: DeployApplicationState;
  createServiceInstance: CreateServiceInstanceState;
  lists: ListsState;
  routing: RoutingHistory;
  manageUsersRoles: UsersRolesState;
  internalEvents: InternalEventsState;
  currentUserRoles: ICurrentUserRolesState;
  userFavoritesGroups: IUserFavoritesGroupsState;
  recentlyVisited: IRecentlyVisitedState;
}
export interface GeneralRequestDataState {
  [name: string]: IRequestEntityTypeState<any>;
}

export interface GeneralAppRequestDataState extends BaseRequestDataState, GeneralRequestDataState { }

// One stop shop for all of your app state needs

// Care about the catalogue entities? Use this one.
// This should only be used by internal stratos code
export abstract class GeneralEntityAppState extends AppState<GeneralRequestDataState> { }

// Only care about internal entities? Use this one.
// This should only be used by internal stratos code
export abstract class InternalAppState extends AppState<BaseRequestDataState> { }

// Care about internal entities and catalogue entities? Use this one.
// This should only be used by internal stratos code
export abstract class GeneralAppState extends AppState<GeneralAppRequestDataState> { }

// Care about CF entities? Use this one.
// This should be moved into the cf module
export abstract class CFAppState extends AppState<CFRequestDataState> { }

