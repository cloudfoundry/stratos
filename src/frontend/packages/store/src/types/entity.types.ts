import { IRequestEntityTypeState, IRequestTypeState } from '../app-state';
import { RequestInfoState } from '../reducers/api-request-reducer/types';
import { IMetrics } from './base-metric.types';
import { EndpointModel } from './endpoint.types';
import { SystemInfo } from './system.types';
import { IFavoriteMetadata, UserFavorite } from './user-favorites.types';
import { UserProfileInfo } from './user-profile.types';

export interface BaseEntityValues {
  // FIXME: Should come from catalog and start with stratos - STRAT-151
  stratosEndpoint: IRequestEntityTypeState<EndpointModel>;
  system: IRequestEntityTypeState<SystemInfo>;
  stratosUserProfile: UserProfileInfo;
  metrics: IRequestEntityTypeState<IMetrics>;
  stratosUserFavorites: IRequestEntityTypeState<UserFavorite<IFavoriteMetadata>>;
}

export type ExtendedRequestState<T extends string | number | symbol, Y> = Record<T, Y>;

export type ExtendedRequestDataState<E extends Record<keyof E, any>> = {
  [P in keyof E]: IRequestEntityTypeState<E[keyof E]>
};


// FIXME: These should also come from catalog? - STRAT-151
export interface IRequestState extends IRequestTypeState {
  endpoint: IRequestEntityTypeState<RequestInfoState>;
  userFavorites: IRequestEntityTypeState<RequestInfoState>;
}

