import { RequestInfoState } from './reducers/api-request-reducer/types';
import { APIResource } from './types/api.types';
import { RouterReducerState } from '@ngrx/router-store';
import { RouterStateSnapshot } from '@angular/router';
import { CNSISState, CNSISModel } from './types/cnsis.types';
import { AuthState } from './reducers/auth.reducer';
import { DashboardState } from './reducers/dashboard-reducer';
import { PaginationState } from './types/pagination.types';
import { MetadataState } from './types/app-metadata.types';
import { CreateNewApplicationState } from './types/create-application.types';
import { CfEntityDataState, CfEntityRequestState } from './types/entity.types';
import { ActionHistoryState } from './reducers/action-history-reducer';
import { UAASetupState } from './types/uaa-setup.types';
import { ListsState } from './reducers/list.reducer';

export interface IRequestTypeState {
  [entityKey: string]: IRequestEntityTypeState<any>;
}
export interface IRequestEntityTypeState<T> {
  [guid: string]: T;
}

export interface IRequestDataState {
  cf: CfEntityDataState;
  other: {
    endpoints: IRequestEntityTypeState<CNSISModel>;
  };
}
export interface IRequestState {
  cf: CfEntityRequestState;
  other: {
    endpoints: IRequestEntityTypeState<RequestInfoState>
  };
}


export interface AppState {
  actionHistory: ActionHistoryState;
  auth: AuthState;
  uaaSetup: UAASetupState;
  cnsis: CNSISState;
  pagination: PaginationState;
  request: IRequestState;
  requestData: IRequestDataState;
  dashboard: DashboardState;
  appMetadata: MetadataState;
  createApplication: CreateNewApplicationState;
  lists: ListsState;
  routerReducer: RouterReducerState<any>;
}
