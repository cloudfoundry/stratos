import { BaseRequestState } from '../../app-state';
import { BaseEntityRequestAction } from '../../entity-catalog/action-orchestrator/action-orchestrator';
import { IUpdateRequestAction } from '../../types/request.types';
import { isNullOrUndefined } from '../../utils';
import { getEntityRequestState, mergeUpdatingState, setEntityRequestState } from './request-helpers';

export function updateRequest(state: BaseRequestState, action: IUpdateRequestAction) {
  if (isNullOrUndefined(action.apiAction.guid)) {
    return state;
  }
  const apiAction = action.apiAction as BaseEntityRequestAction;
  const requestState = getEntityRequestState(state, apiAction);

  requestState.updating = mergeUpdatingState(
    apiAction,
    requestState.updating,
    {
      busy: action.busy,
      error: !!action.error,
      message: '',
    }
  );
  return setEntityRequestState(state, requestState, apiAction);
}
