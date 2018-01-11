import { RequestTypes } from './../actions/request.actions';
import { ApiActionTypes } from '../actions/request.actions';
import { RequestSectionKeys, IRequestArray } from './api-request-reducer/types';
import { OtherEntityStateNames } from '../types/other-entity.types';
import { cnsisStoreNames } from '../types/cnsis.types';
import { systemEndpointsReducer } from './system-endpoints.reducer';
import { Action, ActionReducerMap, combineReducers } from '@ngrx/store';
import { requestDataReducerFactory } from './api-request-data-reducer/request-data-reducer.factory';
import { requestReducerFactory } from './api-request-reducer/request-reducer.factory';
import { AppMetadataProperties } from '../actions/app-metadata.actions';
/**
 * This module uses the request data reducer and request reducer factories to create
 * the reducers to be used when making http requests
 */

const requestActions = [
  RequestTypes.START,
  RequestTypes.SUCCESS,
  RequestTypes.FAILED
] as IRequestArray;


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

const entities = [
  'application',
  'stack',
  'space',
  'organization',
  'route',
  'event',
  cnsisStoreNames.type,
  'system',
  'routerReducer',
  'createApplication',
  'uaaSetup',
  AppMetadataProperties.ENV_VARS,
  AppMetadataProperties.INSTANCES,
  AppMetadataProperties.SUMMARY,
];
const _requestReducer = requestReducerFactory(entities, requestActions);

export function requestReducer(state, action) {
  return _requestReducer(state, action);
}

export function requestDataReducer(state, action) {
  const baseDataReducer = requestDataReducerFactory(entities, requestActions);

  const extraReducers = {
    [cnsisStoreNames.type]: [
      systemEndpointsReducer
    ]
  };

  return chainReducers(
    baseDataReducer,
    extraReducers
  )(state, action);
}
