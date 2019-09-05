import { EntityRequestAction, IFailedRequestAction } from '../../types/request.types';
import {
  getEntityRequestState,
  mergeUpdatingState,
  setEntityRequestState,
} from './request-helpers';

export function failRequest(state, action: IFailedRequestAction) {
  if (action.apiAction.guid) {
    const apiAction = action.apiAction as EntityRequestAction;
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
      };
      requestFailedState.message = action.message;
    } else {
      requestFailedState.fetching = false;
      requestFailedState.error = true;
      requestFailedState.creating = false;
      requestFailedState.message = action.message;
      requestFailedState.response = action.response;
    }
    return setEntityRequestState(state, requestFailedState, apiAction);
  }
  return state;
}
