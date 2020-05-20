import { Action } from '@ngrx/store';

import { IRequestEntityTypeState } from '../app-state';
import { IRequestState } from '../types/entity.types';
import { requestReducerFactory } from './api-request-reducer/request-reducer.factory';
import { RequestInfoState } from './api-request-reducer/types';
import { chainApiReducers, ExtraApiReducers, requestActions } from './api-request-reducers.generator.helpers';


/**
 * This module uses the request data reducer and request reducer factories to create
 * the reducers to be used when making http requests
 */

const baseRequestReducer = requestReducerFactory(requestActions);
const extraReducers = {
  // ['entityKey']: [ reducer ]
} as ExtraApiReducers<IRequestEntityTypeState<RequestInfoState>>;
const chainedReducers = chainApiReducers<IRequestEntityTypeState<RequestInfoState>>(baseRequestReducer, extraReducers);

export function requestReducer(state: IRequestState, action: Action) {
  return chainedReducers(state, action);
}
