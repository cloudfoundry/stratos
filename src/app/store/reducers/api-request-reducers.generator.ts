import { ApiActionTypes, NonApiActionTypes } from '../actions/request.actions';
import { IRequestAction, RequestSectionKeys } from './api-request-reducer/types';
import { CfEntityStateNames } from '../types/entity.types';
import { OtherEntityStateNames } from '../types/other-entity.types';
import { cnsisStoreNames } from '../types/cnsis.types';
import { systemEndpointsReducer } from './system-endpoints.reducer';
import { Action, ActionReducerMap, combineReducers } from '@ngrx/store';
import { requestDataReducerFactory } from './api-request-data-reducer/request-data-reducer.factory';
import { requestReducerFactory } from './api-request-reducer/request-reducer.factory';
/**
 * This module uses the request data reducer and request reducer factories to create
 * the reducers to be used when making http requests
 */
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

export function requestReducer(state, action): any {
  return combineReducers(requestReducers)(state, action);
}

export function requestDataReducer(state, action): any {
  return combineReducers(requestDataReducers)(state, action);
}
