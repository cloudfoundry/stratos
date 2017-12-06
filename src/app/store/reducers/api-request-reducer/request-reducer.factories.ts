import { systemEndpointsReducer } from '../system-endpoints.reducer';
import { GetSystemSuccess, GET_SYSTEM_INFO_SUCCESS } from './../../actions/system.actions';
import { cnsisStoreNames } from './../../types/cnsis.types';
import { Action, combineReducers, ActionReducerMap } from '@ngrx/store';
import { startRequest } from './start-request';
import { succeedRequest } from './succeed-request';
import { failRequest } from './fail-request';
import { IRequestAction, RequestSectionKeys } from './types';
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
] as IRequestAction;

const nonApiActions = [
  NonApiActionTypes.START,
  NonApiActionTypes.SUCCESS,
  NonApiActionTypes.FAILED
] as IRequestAction;


interface ReducerConfig {
  name: RequestSectionKeys;
  actions: IRequestAction;
  entityNames: string[];
  extraReducers?: {
    [entityName: string]: ((state: any, action: Action) => any)[]
  };
}

const entitiesForReducer: ReducerConfig[] = [
  {
    name: RequestSectionKeys.CF,
    actions: apiActions,
    entityNames: CfEntityStateNames
  }, {
    name: RequestSectionKeys.Other,
    actions: nonApiActions,
    entityNames: OtherEntityStateNames,
    extraReducers: {
      [cnsisStoreNames.type]: [
        systemEndpointsReducer
      ]
    }
  }
];

const requestReducers: ActionReducerMap<any> = {};
const requestDataReducers: ActionReducerMap<any> = {};

entitiesForReducer.forEach(entity => {
  requestReducers[entity.name] = requestReducerFactory(entity.entityNames, entity.actions);
  const baseDataReducer = requestDataReducerFactory(entity.entityNames, entity.actions);

  if (entity.extraReducers) {
    requestDataReducers[entity.name] = chainReducers(
      baseDataReducer,
      entity.extraReducers
    );
  } else {
    requestDataReducers[entity.name] = baseDataReducer;
  }
});

export function requestReducer(state, action): any {
  return combineReducers(requestReducers)(state, action);
}

export function requestDataReducer(state, action): any {
  return combineReducers(requestDataReducers)(state, action);
}

function chainReducers(baseReducer, extraReducers) {
  return function (state, action) {
    let newState = baseReducer(state, action);
    let nextState;
    Object.keys(extraReducers).forEach(key => {
      nextState = extraReducers[key].reduce((_state, reducer) => {
        return reducer(_state, action);
      }, newState[key]);
      if (nextState !== newState[key]) {
        newState = {
          ...newState, ...{
            [key]: nextState
          }
        };
      }
    });
    return newState;
  };
}
