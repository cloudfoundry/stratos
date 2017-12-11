import { CFAction, IAPIAction, ISuccessRequestAction, WrapperCFActionSuccess } from '../../types/request.types';
import {
  createRequestStateFromResponse,
  getEntityRequestState,
  getRequestTypeFromMethod,
  mergeUpdatingState,
  setEntityRequestState,
} from './request-helpers';
import { mergeState } from '../../helpers/reducer.helper';
import { IRequestTypeState } from '../../app-state';

export function succeedRequest(state: IRequestTypeState, action: ISuccessRequestAction) {
  if (action.apiAction.guid) {
    const apiAction = action.apiAction as IAPIAction;
    const successAction = action as WrapperCFActionSuccess;

    const requestSuccessState = getEntityRequestState(state, apiAction);
    if (apiAction.updatingKey) {
      requestSuccessState.updating = mergeUpdatingState(
        apiAction,
        requestSuccessState.updating,
        {
          busy: false,
          error: false,
          message: '',
        }
      );
    } else if (action.requestType === 'delete') {
      requestSuccessState.deleting.busy = false;
      requestSuccessState.deleting.deleted = true;
    } else {
      requestSuccessState.fetching = false;
      requestSuccessState.error = false;
      requestSuccessState.creating = false;
      requestSuccessState.response = successAction.response;
    }

    const newState = mergeState(
      createRequestStateFromResponse(successAction.response, state),
      setEntityRequestState(state, requestSuccessState, action.apiAction)
    );

    return newState;
  } else if (action.response && action.response.entities) {
    const { entities } = action.response;
    return createRequestStateFromResponse(action.response, state);
  }
  return state;
}
