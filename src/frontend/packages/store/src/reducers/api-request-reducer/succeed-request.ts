import { IRequestTypeState } from '../../app-state';
import { mergeState } from '../../helpers/reducer.helper';
import { IRequestAction, ISuccessRequestAction, WrapperRequestActionSuccess } from '../../types/request.types';
import {
  createRequestStateFromResponse,
  getEntityRequestState,
  mergeObject,
  mergeUpdatingState,
  setEntityRequestState,
} from './request-helpers';
import { IRequestDataState } from '../../types/entity.types';

export function succeedRequest(state: IRequestDataState, action: ISuccessRequestAction) {
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
          message: successAction.updatingMessage || '',
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
      createRequestStateFromResponse(successAction.response, state, action.apiAction.endpointType),
      setEntityRequestState(state, requestSuccessState, action.apiAction)
    );

    return newState;
  } else if (action.response && action.response.entities) {
    return createRequestStateFromResponse(action.response, state, action.apiAction.endpointType);
  }
  return state;
}
