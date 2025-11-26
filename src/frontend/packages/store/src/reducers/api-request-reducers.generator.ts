import type { Action } from '@ngrx/store';

import type { IRequestEntityTypeState } from '../app-state';
import type { IRequestState } from '../types/entity.types';
import { requestReducerFactory } from './api-request-reducer/request-reducer.factory';
import type { RequestInfoState } from './api-request-reducer/types';
import { chainApiReducers, type ExtraApiReducers, requestActions } from './api-request-reducers.generator.helpers';


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
  return chainedReducers(state as unknown as Record<string, IRequestEntityTypeState<RequestInfoState>>, action) as IRequestState;
}
