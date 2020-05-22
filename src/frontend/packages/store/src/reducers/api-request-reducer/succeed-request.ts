import { isNullOrUndefined } from 'util';

import { BaseRequestState } from '../../app-state';
import { BaseEntityRequestAction } from '../../entity-catalog/action-orchestrator/action-orchestrator';
import { mergeState } from '../../helpers/reducer.helper';
import { ISuccessRequestAction, WrapperRequestActionSuccess } from '../../types/request.types';
import {
  createRequestStateFromResponse,
  getEntityRequestState,
  mergeObject,
  mergeUpdatingState,
  setEntityRequestState,
} from './request-helpers';
import { defaultDeletingActionState } from './types';


export function succeedRequest(state: BaseRequestState, action: ISuccessRequestAction) {
  if (!isNullOrUndefined(action.apiAction.guid)) {
    const apiAction = action.apiAction as BaseEntityRequestAction;
    const successAction = action as WrapperRequestActionSuccess;
    const requestSuccessState = getEntityRequestState(state, apiAction);
    if (apiAction.updatingKey) {
      requestSuccessState.updating = mergeUpdatingState(
        apiAction,
        requestSuccessState.updating,
        {
          busy: false,
          error: false,
          message: successAction.updatingMessage || '',
        }
      );
    } else if (action.requestType === 'delete' && !apiAction.updatingKey) {
      requestSuccessState.deleting = mergeObject(requestSuccessState.deleting, {
        busy: false,
        deleted: true
      });
    } else {
      requestSuccessState.fetching = false;
      requestSuccessState.error = false;
      requestSuccessState.creating = false;
      requestSuccessState.response = successAction.response;
    }

    if (action.requestType !== 'delete') {
      requestSuccessState.deleting = {
        ...defaultDeletingActionState
      };
    }

    const newState = mergeState(
      createRequestStateFromResponse(successAction.response, state),
      setEntityRequestState(state, requestSuccessState, action.apiAction as BaseEntityRequestAction)
    );

    return newState;
  } else if (action.response && action.response.entities) {
    return createRequestStateFromResponse(action.response, state);
  }
  return state;
}
