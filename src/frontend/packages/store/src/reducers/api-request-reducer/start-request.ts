import { EntityRequestAction, IStartRequestAction } from '../../types/request.types';
import {
  getEntityRequestState,
  mergeUpdatingState,
  modifyRequestWithRequestType,
  setEntityRequestState,
} from './request-helpers';
import { BaseEntityRequestAction } from '../../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';

export function startRequest(state, action: IStartRequestAction) {
  if (!action.apiAction.guid) {
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
