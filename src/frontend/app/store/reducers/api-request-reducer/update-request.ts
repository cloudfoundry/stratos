import { IStartRequestAction, IRequestAction, IUpdateRequestAction } from '../../types/request.types';
import {
  getEntityRequestState,
  mergeUpdatingState,
  modifyRequestWithRequestType,
  setEntityRequestState,
} from './request-helpers';

export function updateRequest(state, action: IUpdateRequestAction) {
  if (!action.apiAction.guid) {
    return state;
  }
  const apiAction = action.apiAction as IRequestAction;
  const requestState = getEntityRequestState(state, apiAction);

  requestState.updating = mergeUpdatingState(
    apiAction,
    requestState.updating,
    {
      busy: !!apiAction.updatingKey,
      error: !!action.error,
      message: '',
    }
  );
  return setEntityRequestState(state, requestState, action.apiAction);
}
