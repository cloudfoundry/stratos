import { RequestTypes } from './../actions/request.actions';
import { ApiActionTypes } from '../actions/request.actions';
import { RequestSectionKeys, IRequestArray } from './api-request-reducer/types';
import { OtherEntityStateNames } from '../types/other-entity.types';
import { endpointStoreNames } from '../types/endpoint.types';
import { systemEndpointsReducer } from './system-endpoints.reducer';
import { Action, ActionReducerMap, combineReducers } from '@ngrx/store';
import { requestDataReducerFactory } from './api-request-data-reducer/request-data-reducer.factory';
import { requestReducerFactory } from './api-request-reducer/request-reducer.factory';
import { endpointDisconnectApplicationReducer } from './endpoint-disconnect-application.reducer';
import {
  AppEnvVarSchema,
  AppStatsSchema,
  AppSummarySchema,
  AppStatSchema
} from '../types/app-metadata.types';
import {
  GITHUB_BRANCHES_ENTITY_KEY,
  GITHUB_COMMIT_ENTITY_KEY
} from '../types/deploy-application.types';
import { CF_INFO_ENTITY_KEY } from '../actions/cloud-foundry.actions';
import { GITHUB_REPO_ENTITY_KEY } from '../types/github.types';
import { UserSchema } from '../types/user.types';
import { userReducer } from './users.reducer';
import { ServiceInstancesSchema, ServicePlanSchema, ServiceSchema, ServiceBindingsSchema } from '../actions/action-types';
import { RouteSchema } from '../../shared/components/list/list-types/cf-space-routes/cf-space-routes-data-source';
import { routeReducer } from './routes.reducer';
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
  'organization',
  'route',
  'event',
  endpointStoreNames.type,
  'domain',
  'system',
  'routerReducer',
  'createApplication',
  'uaaSetup',
  UserSchema.key, ,
  ServiceInstancesSchema.key,
  ServicePlanSchema.key,
  ServiceSchema.key,
  ServiceBindingsSchema.key,
  CF_INFO_ENTITY_KEY,
  GITHUB_REPO_ENTITY_KEY,
  GITHUB_BRANCHES_ENTITY_KEY,
  GITHUB_COMMIT_ENTITY_KEY,
  AppEnvVarSchema.key,
  AppStatSchema.key,
  AppSummarySchema.key
];
const _requestReducer = requestReducerFactory(entities, requestActions);

export function requestReducer(state, action) {
  return _requestReducer(state, action);
}

export function requestDataReducer(state, action) {
  const baseDataReducer = requestDataReducerFactory(entities, requestActions);

  const extraReducers = {
    [UserSchema.key]: [userReducer],
    [endpointStoreNames.type]: [systemEndpointsReducer],
    application: [endpointDisconnectApplicationReducer('application')],
    space: [endpointDisconnectApplicationReducer('space')],
    organization: [endpointDisconnectApplicationReducer('organization')]
  };

  return chainReducers(baseDataReducer, extraReducers)(state, action);
}
