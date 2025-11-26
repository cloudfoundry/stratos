import type { BaseRequestState } from '../../app-state';
import type { BaseEntityRequestAction } from '../../entity-catalog/action-orchestrator/action-orchestrator';
import type { IStartRequestAction } from '../../types/request.types';
import { isNullOrUndefined } from '../../utils';
import {
  getEntityRequestState,
  mergeUpdatingState,
  modifyRequestWithRequestType,
  setEntityRequestState,
} from './request-helpers';

export function startRequest(state: BaseRequestState, action: IStartRequestAction): BaseRequestState {
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
