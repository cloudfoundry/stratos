import { systemStoreNames, SystemInfo } from './system.types';
import { cnsisStoreNames, CNSISModel } from './cnsis.types';
import { RequestInfoState } from '../reducers/api-request-reducer/types';
import { IRequestTypeState, IRequestEntityTypeState } from '../app-state';
import { APIResource } from './api.types';
export interface IRequestDataState extends IRequestTypeState {
  application: IRequestEntityTypeState<APIResource>;
  stack: IRequestEntityTypeState<APIResource>;
  space: IRequestEntityTypeState<APIResource>;
  organization: IRequestEntityTypeState<APIResource>;
  route: IRequestEntityTypeState<APIResource>;
  event: IRequestEntityTypeState<APIResource>;
  endpoint: IRequestEntityTypeState<CNSISModel>;
  system: IRequestEntityTypeState<SystemInfo>;
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
}

export const defaultCfEntitiesState = {
  application: {},
  stack: {},
  space: {},
  organization: {},
  route: {},
  event: {},
  endpoint: {}
};
