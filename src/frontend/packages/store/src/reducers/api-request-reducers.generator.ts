import { Action } from '@ngrx/store';
import { appStatsEntityType } from '../../../cloud-foundry/src/cf-entity-factory';
import { IRequestEntityTypeState } from '../app-state';
import { IRequestState } from '../types/entity.types';
import { requestReducerFactory } from './api-request-reducer/request-reducer.factory';
import { RequestInfoState } from './api-request-reducer/types';
import { chainApiReducers, ExtraApiReducers, requestActions } from './api-request-reducers.generator.helpers';
import { appStatsReducer } from './app-stats-request.reducer';

/**
 * This module uses the request data reducer and request reducer factories to create
 * the reducers to be used when making http requests
 */

const baseRequestReducer = requestReducerFactory(requestActions);
const extraReducers = {
  [appStatsEntityType]: [appStatsReducer]
} as ExtraApiReducers<IRequestEntityTypeState<RequestInfoState>>;
const chainedReducers = chainApiReducers<IRequestEntityTypeState<RequestInfoState>>(baseRequestReducer, extraReducers);

export function requestReducer(state: IRequestState, action: Action) {
  return chainedReducers(state, action);
}
