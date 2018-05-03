import {
  appEnvVarsSchemaKey,
  applicationSchemaKey,
  appStatsSchemaKey,
  appSummarySchemaKey,
  buildpackSchemaKey,
  cfInfoSchemaKey,
  cfUserSchemaKey,
  featureFlagSchemaKey,
  githubBranchesSchemaKey,
  githubCommitSchemaKey,
  githubRepoSchemaKey,
  organizationSchemaKey,
  privateDomainsSchemaKey,
  quotaDefinitionSchemaKey,
  routeSchemaKey,
  securityGroupSchemaKey,
  serviceBindingSchemaKey,
  serviceInstancesSchemaKey,
  servicePlanSchemaKey,
  serviceSchemaKey,
  spaceQuotaSchemaKey,
  spaceSchemaKey,
  metricSchemaKey,
  userProfileSchemaKey,
} from '../helpers/entity-factory';
import { endpointStoreNames } from '../types/endpoint.types';
import { RequestTypes } from './../actions/request.actions';
import { requestDataReducerFactory } from './api-request-data-reducer/request-data-reducer.factory';
import { requestReducerFactory } from './api-request-reducer/request-reducer.factory';
import { IRequestArray } from './api-request-reducer/types';
import { appStatsReducer } from './app-stats-request.reducer';
import { updateApplicationRoutesReducer } from './application-route.reducer';
import { endpointDisconnectApplicationReducer } from './endpoint-disconnect-application.reducer';
import { updateOrganizationSpaceReducer } from './organization-space.reducer';
import { routeReducer } from './routes.reducer';
import { systemEndpointsReducer } from './system-endpoints.reducer';
import { userReducer, userSpaceOrgReducer } from './users.reducer';

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
  organizationSchemaKey,
  routeSchemaKey,
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
  quotaDefinitionSchemaKey,
  buildpackSchemaKey,
  securityGroupSchemaKey,
  servicePlanSchemaKey,
  serviceSchemaKey,
  serviceBindingSchemaKey,
  serviceInstancesSchemaKey,
  featureFlagSchemaKey,
  privateDomainsSchemaKey,
  spaceQuotaSchemaKey,
  metricSchemaKey,
  userProfileSchemaKey,
];



export function requestReducer(state, action) {
  const baseRequestReducer = requestReducerFactory(entities, requestActions);
  const extraReducers = {
    [appStatsSchemaKey]: [appStatsReducer]
  };
  return chainReducers(baseRequestReducer, extraReducers)(state, action);
}

export function requestDataReducer(state, action) {
  const baseDataReducer = requestDataReducerFactory(entities, requestActions);

  const extraReducers = {
    [cfUserSchemaKey]: [userReducer],
    [routeSchemaKey]: [routeReducer],
    [endpointStoreNames.type]: [systemEndpointsReducer],
    [applicationSchemaKey]: [
      updateApplicationRoutesReducer(),
      endpointDisconnectApplicationReducer('application')
    ],
    [spaceSchemaKey]: [
      endpointDisconnectApplicationReducer('space'),
      userSpaceOrgReducer(true)
    ],
    [organizationSchemaKey]: [
      updateOrganizationSpaceReducer(),
      endpointDisconnectApplicationReducer('organization'),
      userSpaceOrgReducer(false)
    ]
  };

  return chainReducers(baseDataReducer, extraReducers)(state, action);
}
