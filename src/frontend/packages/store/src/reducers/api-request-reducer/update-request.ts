import { BaseRequestState } from '../../app-state';
import { EntityRequestAction, IUpdateRequestAction } from '../../types/request.types';
import { getEntityRequestState, mergeUpdatingState, setEntityRequestState } from './request-helpers';
import { BaseEntityRequestAction } from '../../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';

export function updateRequest(state: BaseRequestState, action: IUpdateRequestAction) {
  if (!action.apiAction.guid) {
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
