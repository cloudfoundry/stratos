import { IRequestArray } from '../api-request-reducer/types';
import { generateDefaultState } from '../api-request-reducer/request-helpers';
import { ISuccessRequestAction } from '../../types/request.types';
import { mergeState } from '../../helpers/reducer.helper';
import { Action } from '@ngrx/store';

export function requestDataReducerFactory(entityList = [], actions: IRequestArray) {
  const [startAction, successAction, failedAction] = actions;
  const defaultState = generateDefaultState(entityList);
  return function entitiesReducer(state = defaultState, action: Action) {
    switch (action.type) {
      case successAction:
        const success = action as ISuccessRequestAction;
        if (success.requestType === 'delete') {
          const newState = { ...state };
          delete newState[success.apiAction.entityKey][success.apiAction.guid];
          return newState;
        }
        return mergeState(state, success.response.entities);
      default:
        return state;
    }
  };
}
