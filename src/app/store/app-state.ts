import { RouterReducerState } from '@ngrx/router-store';

import { ActionHistoryState } from './reducers/action-history-reducer';
import { AuthState } from './reducers/auth.reducer';
import { DashboardState } from './reducers/dashboard-reducer';
import { ListsState } from './reducers/list.reducer';
import { MetadataState } from './types/app-metadata.types';
import { CNSISState } from './types/cnsis.types';
import { CreateNewApplicationState } from './types/create-application.types';
import { IRequestDataState, IRequestState } from './types/entity.types';
import { PaginationState } from './types/pagination.types';
import { UAASetupState } from './types/uaa-setup.types';
import { DeployApplicationState } from './types/deploy-application.types';

export interface IRequestTypeState {
  [entityKey: string]: IRequestEntityTypeState<any>;
}
export interface IRequestEntityTypeState<T> {
  [guid: string]: T;
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
  deployApplication: DeployApplicationState;
  lists: ListsState;
}
