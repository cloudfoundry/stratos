import { RequestAction } from '../../types/request.types';
import {
  getEntityRequestState,
  getRequestTypeFromMethod,
  mergeUpdatingState,
  setEntityRequestState,
} from './request-helpers';

export function failRequest(state, action) {
  if (action.apiAction.guid) {
    const apiAction = action.apiAction as RequestAction;
    const requestTypeFailed = getRequestTypeFromMethod(apiAction.options.method);

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
    } else if (requestTypeFailed === 'delete') {
      requestFailedState.deleting.busy = false;
      requestFailedState.deleting.deleted = false;
      requestFailedState.deleting.error = true;
      requestFailedState.message = action.message;
    } else {
      requestFailedState.fetching = false;
      requestFailedState.error = true;
      requestFailedState.creating = false;
      requestFailedState.message = action.message;
    }
    return setEntityRequestState(state, requestFailedState, apiAction);
  }
  return state;
}
