import { systemStoreNames, SystemInfo } from './system.types';
import { endpointStoreNames, EndpointModel } from './endpoint.types';
import { RequestInfoState } from '../reducers/api-request-reducer/types';
import { IRequestTypeState, IRequestEntityTypeState } from '../app-state';
import { APIResource } from './api.types';
import { AppEnvVarSchema, AppStatsSchema, AppSummarySchema, AppStatSchema } from './app-metadata.types';
export interface IRequestDataState extends IRequestTypeState {
  application: IRequestEntityTypeState<APIResource>;
  stack: IRequestEntityTypeState<APIResource>;
  space: IRequestEntityTypeState<APIResource>;
  organization: IRequestEntityTypeState<APIResource>;
  route: IRequestEntityTypeState<APIResource>;
  event: IRequestEntityTypeState<APIResource>;
  endpoint: IRequestEntityTypeState<EndpointModel>;
  system: IRequestEntityTypeState<SystemInfo>;
  githubBranches: IRequestEntityTypeState<APIResource>;
  githubCommits: IRequestEntityTypeState<APIResource>;
}

export interface IRequestState extends IRequestTypeState {
  application: IRequestEntityTypeState<RequestInfoState>;
  stack: IRequestEntityTypeState<RequestInfoState>;
  space: IRequestEntityTypeState<RequestInfoState>;
  organization: IRequestEntityTypeState<RequestInfoState>;
  route: IRequestEntityTypeState<RequestInfoState>;
  event: IRequestEntityTypeState<RequestInfoState>;
  endpoint: IRequestEntityTypeState<RequestInfoState>;
  system: IRequestEntityTypeState<RequestInfoState>;
  githubBranches: IRequestEntityTypeState<RequestInfoState>;
  githubCommits: IRequestEntityTypeState<APIResource>;
}

export const defaultCfEntitiesState = {
  application: {},
  stack: {},
  space: {},
  organization: {},
  route: {},
  event: {},
  endpoint: {},
  githubBranches: {},
  [AppEnvVarSchema.key]: {},
  [AppStatSchema.key]: {},
  [AppSummarySchema.key]: {},
};
