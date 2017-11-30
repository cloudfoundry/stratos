import { startRequest } from './start-request';
import { succeedRequest } from './succeed-request';
import { failRequest } from './fail-request';
import { IRequestAction } from './types';
import { generateDefaultState } from './request-helpers';

export function requestReducerFactory(entityList = [], actions: IRequestAction) {
  const [startAction, successAction, failedAction] = actions;
  const defaultState = generateDefaultState(entityList);
  return function apiRequestReducer(state = defaultState, action) {
    const actionType = action.apiAction && action.apiAction.type ? action.apiAction.type : action.type;
    switch (actionType) {
      case startAction:
        return startRequest(state, action);
      case successAction:
        return succeedRequest(state, action);
      case failedAction:
        return failRequest(state, action);
      default:
        return state;
    }
  };
}
