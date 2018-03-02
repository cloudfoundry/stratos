import {
  appEnvVarsSchemaKey,
  appStatsSchemaKey,
  appSummarySchemaKey,
  cfInfoSchemaKey,
  githubBranchesSchemaKey,
  githubCommitSchemaKey,
  githubRepoSchemaKey,
  organisationSchemaKey,
  quotaDefinitionSchemaKey,
} from '../helpers/entity-factory';
import { endpointStoreNames } from '../types/endpoint.types';
import { RequestTypes } from './../actions/request.actions';
import { requestDataReducerFactory } from './api-request-data-reducer/request-data-reducer.factory';
import { requestReducerFactory } from './api-request-reducer/request-reducer.factory';
import { IRequestArray } from './api-request-reducer/types';
import { endpointDisconnectApplicationReducer } from './endpoint-disconnect-application.reducer';
import { systemEndpointsReducer } from './system-endpoints.reducer';

/**
 * This module uses the request data reducer and request reducer factories to create
 * the reducers to be used when making http requests
 */

const requestActions = [
  RequestTypes.START,
  RequestTypes.SUCCESS,
  RequestTypes.FAILED,
  RequestTypes.UPDATE
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
          ...newState,
          ...{
            [key]: nextState
          }
        };
      }
    });
    return newState;
  };
}
// These should be const
const entities = [
  'application',
  'stack',
  'space',
  organisationSchemaKey,
  'route',
  'event',
  endpointStoreNames.type,
  'domain',
  'system',
  'routerReducer',
  'createApplication',
  'uaaSetup',
  'user',
  cfInfoSchemaKey,
  githubRepoSchemaKey,
  githubBranchesSchemaKey,
  githubCommitSchemaKey,
  appEnvVarsSchemaKey,
  appStatsSchemaKey,
  appSummarySchemaKey,
  quotaDefinitionSchemaKey
];
const _requestReducer = requestReducerFactory(entities, requestActions);

export function requestReducer(state, action) {
  return _requestReducer(state, action);
}

export function requestDataReducer(state, action) {
  const baseDataReducer = requestDataReducerFactory(entities, requestActions);

  const extraReducers = {
    [endpointStoreNames.type]: [systemEndpointsReducer],
    application: [endpointDisconnectApplicationReducer('application')],
    space: [endpointDisconnectApplicationReducer('space')],
    organization: [endpointDisconnectApplicationReducer('organization')]
  };

  return chainReducers(baseDataReducer, extraReducers)(state, action);
}
