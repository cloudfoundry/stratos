import { IStartRequestAction, IRequestAction } from '../../types/request.types';
import {
  getEntityRequestState,
  getRequestTypeFromMethod,
  mergeUpdatingState,
  modifyRequestWithRequestType,
  setEntityRequestState,
} from './request-helpers';

export function startRequest(state, action: IStartRequestAction) {
  if (!action.apiAction.guid) {
    return state;
  }
  const apiAction = action.apiAction as IRequestAction;
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
  return setEntityRequestState(state, requestState, action.apiAction);
}
