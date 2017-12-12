import { IRequestAction, ISuccessRequestAction, WrapperRequestActionSuccess } from '../../types/request.types';
import {
  createRequestStateFromResponse,
  getEntityRequestState,
  getRequestTypeFromMethod,
  mergeUpdatingState,
  setEntityRequestState,
} from './request-helpers';
import { mergeState } from '../../helpers/reducer.helper';

export function succeedRequest(state, action: ISuccessRequestAction) {
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
      createRequestStateFromResponse(successAction.response.entities, state),
      setEntityRequestState(state, requestSuccessState, action.apiAction)
    );

    return newState;
  } else if (action.response && action.response.entities) {
    const { entities } = action.response;
    return createRequestStateFromResponse(entities, state);
  }
  return state;
}
