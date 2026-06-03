import type { IRequestEntityTypeState, IRequestTypeState } from '../app-state';
import type { RequestInfoState } from '../reducers/api-request-reducer/types';
import type { IMetrics } from './base-metric.types';
import type { EndpointModel } from './endpoint.types';
import type { SystemInfo } from './system.types';

export interface BaseEntityValues {
  // FIXME: Should come from catalog and start with stratos - STRAT-151
  stratosEndpoint: IRequestEntityTypeState<EndpointModel>;
  system: IRequestEntityTypeState<SystemInfo>;
  metrics: IRequestEntityTypeState<IMetrics>;
}

export type ExtendedRequestState<T extends string | number | symbol, Y> = Record<T, Y>;

export type ExtendedRequestDataState<E extends Record<keyof E, any>> = {
  [P in keyof E]: IRequestEntityTypeState<E[keyof E]>
};


// FIXME: These should also come from catalog? - STRAT-151
export interface IRequestState extends IRequestTypeState {
  endpoint: IRequestEntityTypeState<RequestInfoState>;
}

