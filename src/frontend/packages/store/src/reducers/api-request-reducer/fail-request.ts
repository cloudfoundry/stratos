import { isNullOrUndefined } from 'util';

import { BaseEntityRequestAction } from '../../entity-catalog/action-orchestrator/action-orchestrator';
import { IFailedRequestAction } from '../../types/request.types';
import { getEntityRequestState, mergeUpdatingState, setEntityRequestState } from './request-helpers';

export function failRequest(state, action: IFailedRequestAction) {
  if (isNullOrUndefined(action.apiAction.guid)) {
    return state;
  }
  const apiAction = action.apiAction as BaseEntityRequestAction;
  const requestFailedState = getEntityRequestState(state, apiAction);
  if (apiAction.updatingKey) {
    requestFailedState.updating = mergeUpdatingState(
      apiAction,
      requestFailedState.updating,
      {
        busy: false,
        error: true,
        message: action.message
      }
    );
  } else if (action.requestType === 'delete') {
    requestFailedState.deleting = {
      ...requestFailedState.deleting,
      busy: false,
      deleted: false,
      error: true,
      message: action.message
    };
  } else {
    requestFailedState.fetching = false;
    requestFailedState.error = true;
    requestFailedState.creating = false;
    requestFailedState.message = action.message;
    requestFailedState.response = action.response;
  }
  return setEntityRequestState(state, requestFailedState, apiAction);
}
