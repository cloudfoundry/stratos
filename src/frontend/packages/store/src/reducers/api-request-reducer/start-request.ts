import { isNullOrUndefined } from 'util';

import { BaseEntityRequestAction } from '../../entity-catalog/action-orchestrator/action-orchestrator';
import { IStartRequestAction } from '../../types/request.types';
import {
  getEntityRequestState,
  mergeUpdatingState,
  modifyRequestWithRequestType,
  setEntityRequestState,
} from './request-helpers';

export function startRequest(state, action: IStartRequestAction) {
  if (isNullOrUndefined(action.apiAction.guid)) {
    return state;

  }
  const apiAction = action.apiAction as BaseEntityRequestAction;
  let requestState = getEntityRequestState(state, apiAction);

  if (apiAction.updatingKey) {
    requestState.updating = mergeUpdatingState(
      apiAction,
      requestState.updating,
      {
        busy: true,
        error: false,
        message: '',
      }
    );
  } else {
    requestState = modifyRequestWithRequestType(
      requestState,
      action.requestType
    );
  }
  return setEntityRequestState(state, requestState, apiAction);
}
