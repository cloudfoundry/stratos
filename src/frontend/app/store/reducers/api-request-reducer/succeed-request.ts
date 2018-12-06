import { IRequestAction, ISuccessRequestAction, WrapperRequestActionSuccess } from '../../types/request.types';
import {
  createRequestStateFromResponse,
  getEntityRequestState,
  mergeUpdatingState,
  setEntityRequestState,
  mergeObject,
} from './request-helpers';
import { mergeState } from '../../helpers/reducer.helper';
import { IRequestTypeState } from '../../app-state';

export function succeedRequest(state: IRequestTypeState, action: ISuccessRequestAction) {
  if (action.apiAction.guid) {
    const apiAction = action.apiAction as IRequestAction;
    const successAction = action as WrapperRequestActionSuccess;
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
    } else if (action.requestType === 'delete' && !action.apiAction.updatingKey) {
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
