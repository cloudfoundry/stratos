import { Action, combineReducers, ActionReducerMap } from '@ngrx/store';
import { startRequest } from './start-request';
import { succeedRequest } from './succeed-request';
import { failRequest } from './fail-request';
import { IRequestAction } from './types';
import { generateDefaultState } from './request-helpers';
import { ISuccessRequestAction } from '../../types/request.types';
import { mergeState } from '../../helpers/reducer.helper';
import { CfEntityStateNames } from '../../types/entity.types';
import { OtherEntityStateNames } from '../../types/other-entity.types';
import { ApiActionTypes, NonApiActionTypes } from '../../actions/request.actions';

function requestReducerFactory(entityList = [], actions: IRequestAction) {
  const [startAction, successAction, failedAction] = actions;
  const defaultState = generateDefaultState(entityList);
  return function apiRequestReducer(state = defaultState, action) {
    switch (action.type) {
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

function requestDataReducerFactory(entityList = [], actions: IRequestAction) {
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

const apiActions = [
  ApiActionTypes.API_REQUEST_START,
  ApiActionTypes.API_REQUEST_SUCCESS,
  ApiActionTypes.API_REQUEST_FAILED,
] as [string, string, string];

const nonApiActions = [
  NonApiActionTypes.START,
  NonApiActionTypes.SUCCESS,
  NonApiActionTypes.FAILED
] as [string, string, string];

const entitiesForReducer = [
  {
    name: 'cf',
    actions: apiActions,
    entityNames: CfEntityStateNames
  }, {
    name: 'other',
    actions: nonApiActions,
    entityNames: OtherEntityStateNames
  }
];

const requestReducers: ActionReducerMap<any> = {};
const requestDataReducers: ActionReducerMap<any> = {};
for (const entity of entitiesForReducer) {
  requestReducers[entity.name] = requestReducerFactory(entity.entityNames, entity.actions);
  requestDataReducers[entity.name] = requestDataReducerFactory(entity.entityNames, entity.actions);
}

export function requestReducer(state, action): any {
  return combineReducers<any>(requestReducers)(state, action);
}

export function requestDataReducer(state, action): any {
  return combineReducers<any>(requestDataReducers)(state, action);
}
