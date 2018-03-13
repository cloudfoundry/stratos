import { IRequestEntityTypeState, IRequestTypeState } from '../app-state';
import { endpointStoreNames, EndpointModel } from './endpoint.types';
import { RequestInfoState } from '../reducers/api-request-reducer/types';
import { APIResource } from './api.types';
import {
  AppEnvVarSchema,
  AppStatSchema,
  AppSummarySchema
} from './app-metadata.types';
import { SystemInfo } from './system.types';
import { IRoute, IFeatureFlag, IApp } from '../../core/cf-api.types';

export interface IRequestDataInternal<T> extends IRequestTypeState {
  stack: IRequestEntityTypeState<T>;
  space: IRequestEntityTypeState<T>;
  organization: IRequestEntityTypeState<T>;
  route: IRequestEntityTypeState<T>;
  event: IRequestEntityTypeState<T>;
  githubBranches: IRequestEntityTypeState<T>;
  githubCommits: IRequestEntityTypeState<T>;
  domain: IRequestEntityTypeState<T>;
  user: IRequestEntityTypeState<T>;
  serviceInstance: IRequestEntityTypeState<T>;
  servicePlan: IRequestEntityTypeState<T>;
  service: IRequestEntityTypeState<T>;
  serviceBinding: IRequestEntityTypeState<T>;
  securityGroup: IRequestEntityTypeState<T>;
}

export interface IRequestDataState extends IRequestDataInternal<APIResource> {
  endpoint: IRequestEntityTypeState<EndpointModel>;
  system: IRequestEntityTypeState<SystemInfo>;
  featureFlag: IRequestEntityTypeState<IFeatureFlag>;
  application: IRequestEntityTypeState<APIResource<IApp>>;
}

export interface IRequestState extends IRequestDataInternal<RequestInfoState> {
  endpoint: IRequestEntityTypeState<RequestInfoState>;
  system: IRequestEntityTypeState<RequestInfoState>;
  featureFlag: IRequestEntityTypeState<RequestInfoState>;
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
  user: {},
  domain: {},
  securityGroup: {},
  buildpack: {},
  featureFlag: {},
  serviceInstance: {},
  servicePlan: {},
  service: {},
  serviceBinding: {},
  [AppEnvVarSchema.key]: {},
  [AppStatSchema.key]: {},
  [AppSummarySchema.key]: {}
};
