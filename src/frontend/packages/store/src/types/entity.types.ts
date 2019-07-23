import { IRequestEntityTypeState, IRequestTypeState } from '../app-state';
import { RequestInfoState } from '../reducers/api-request-reducer/types';
import { IMetrics } from '../../../cloud-foundry/src/store/types/base-metric.types';
import { EndpointModel } from './endpoint.types';
import { SystemInfo } from './system.types';
import { IFavoriteMetadata, UserFavorite } from './user-favorites.types';
import { UserProfileInfo } from './user-profile.types';

export interface BaseEntityValues {
  // FIXME: Should come from catalogue/start with stratos - STRAT-151
  endpoint: IRequestEntityTypeState<EndpointModel>;
  system: IRequestEntityTypeState<SystemInfo>;
  // featureFlag: IRequestEntityTypeState<IFeatureFlag>;
  // application: IRequestEntityTypeState<APIResource<IApp>>;
  // stack: IRequestEntityTypeState<APIResource<IStack>>;
  // space: IRequestEntityTypeState<APIResource<ISpace>>;
  // organization: IRequestEntityTypeState<APIResource<IOrganization>>;
  // route: IRequestEntityTypeState<APIResource<IRoute>>;
  // event: IRequestEntityTypeState<APIResource>;
  // gitBranches: IRequestEntityTypeState<APIResource<GitBranch>>;
  // gitCommits: IRequestEntityTypeState<APIResource<GitCommit>>;
  // domain: IRequestEntityTypeState<APIResource<IDomain>>;
  // user: IRequestEntityTypeState<APIResource<CfUser>>;
  // serviceInstance: IRequestEntityTypeState<APIResource<IServiceInstance>>;
  // servicePlan: IRequestEntityTypeState<APIResource<IServicePlan>>;
  // service: IRequestEntityTypeState<APIResource<IService>>;
  // serviceBinding: IRequestEntityTypeState<APIResource<IServiceBinding>>;
  // securityGroup: IRequestEntityTypeState<APIResource<ISecurityGroup>>;
  // servicePlanVisibility: IRequestEntityTypeState<APIResource<IServicePlanVisibility>>;
  // serviceBroker: IRequestEntityTypeState<APIResource<IServiceBroker>>;
  userProfile: UserProfileInfo;
  metrics: IRequestEntityTypeState<IMetrics>;
  userFavorites: IRequestEntityTypeState<UserFavorite<IFavoriteMetadata>>;
  // Extensibility
  // [name: string]: IRequestEntityTypeState<any>;
}

export type ExtendedRequestState<T extends string | number | symbol, Y> = Record<T, Y>;

export type ExtendedRequestDataState<E extends Record<keyof E, any>> = {
  [P in keyof E]: IRequestEntityTypeState<E[keyof E]>
};


// TODO: NJ RC Shouldn't this be the same as BaseEntityValues?
// FIXME: These should also come from catalogue? - STRAT-151
export interface IRequestState extends IRequestTypeState {
  endpoint: IRequestEntityTypeState<RequestInfoState>;
  userFavorites: IRequestEntityTypeState<RequestInfoState>;
}

