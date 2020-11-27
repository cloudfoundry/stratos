import { Action } from '@ngrx/store';

import { STRATOS_ENDPOINT_TYPE, stratosEntityFactory, systemInfoEntityType } from '../helpers/stratos-entity-factory';
import { EntityRequestAction } from '../types/request.types';
import { SystemInfo } from '../types/system.types';
import { GetAllEndpoints, GetEndpoint } from './endpoint.actions';

export const GET_SYSTEM_INFO = '[System] Get info';
export const GET_SYSTEM_INFO_SUCCESS = '[System] Get info success';
export const GET_SYSTEM_INFO_FAILED = '[System] Get info failed';

export type GetSystemInfoAssociatedAction = GetEndpoint | GetAllEndpoints;

export class GetSystemInfo implements EntityRequestAction {
  static guid = 'info';
  guid = GetSystemInfo.guid;
  constructor(public login = false, public associatedAction?: GetSystemInfoAssociatedAction) {
    if (!this.associatedAction) {
      this.associatedAction = new GetAllEndpoints(login);
    }
  }
  schemaKey = systemInfoEntityType;
  entity = [stratosEntityFactory(systemInfoEntityType)];
  entityType = systemInfoEntityType;
  endpointType = STRATOS_ENDPOINT_TYPE;
  type = GET_SYSTEM_INFO;
  actions = [
    GET_SYSTEM_INFO,
    GET_SYSTEM_INFO_SUCCESS,
    GET_SYSTEM_INFO_FAILED
  ];
}

export class GetSystemSuccess implements Action {
  constructor(public payload: SystemInfo, public login = false, public associatedAction: GetSystemInfoAssociatedAction) { }
  type = GET_SYSTEM_INFO_SUCCESS;
}
