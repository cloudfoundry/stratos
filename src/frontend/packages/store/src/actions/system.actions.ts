import { Action } from '@ngrx/store';

import { STRATOS_ENDPOINT_TYPE } from '../../../core/src/base-entity-schemas';
import { stratosEntityFactory, systemInfoSchemaKey } from '../helpers/stratos-entity-factory';
import { EntityRequestAction } from '../types/request.types';
import { SystemInfo } from '../types/system.types';
import { GetAllEndpoints } from './endpoint.actions';

export const GET_SYSTEM_INFO = '[System] Get info';
export const GET_SYSTEM_INFO_SUCCESS = '[System] Get info success';
export const GET_SYSTEM_INFO_FAILED = '[System] Get info failed';

export class GetSystemInfo implements EntityRequestAction {
  guid = 'info';
  constructor(public login = false, public associatedAction?: GetAllEndpoints) {
    if (!this.associatedAction) {
      this.associatedAction = new GetAllEndpoints(login); // TODO: RC
    }
  }
  // TODO: RC WHERE SHOULD THIS BE STORED
  schemaKey = systemInfoSchemaKey;
  entity = [stratosEntityFactory(systemInfoSchemaKey)]
  entityType = systemInfoSchemaKey;
  endpointType = STRATOS_ENDPOINT_TYPE;
  type = GET_SYSTEM_INFO;
  actions = [
    GET_SYSTEM_INFO,
    GET_SYSTEM_INFO_SUCCESS,
    GET_SYSTEM_INFO_FAILED
  ]
}

export class GetSystemSuccess implements Action {
  constructor(public payload: SystemInfo, public login = false, public associatedAction: GetAllEndpoints) { }
  type = GET_SYSTEM_INFO_SUCCESS;
}

// export class GetSystemFailed implements Action {
//   type = GET_SYSTEM_INFO_FAILED;
// }

