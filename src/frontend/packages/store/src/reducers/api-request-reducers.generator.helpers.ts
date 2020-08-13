import { Action, ActionReducer } from '@ngrx/store';
import { produce } from 'immer';
import { RequestTypes } from '../actions/request.actions';
import { IRequestArray } from './api-request-reducer/types';

export const requestActions = [
  RequestTypes.START,
  RequestTypes.SUCCESS,
  RequestTypes.FAILED,
  RequestTypes.UPDATE
] as IRequestArray;

export interface ExtraApiReducers<T = any> {
  [entityKey: string]: ActionReducer<T>[];
}

export function chainApiReducers<T = any>(
  baseReducer: ActionReducer<Record<string, T>>,
  extraReducers: ExtraApiReducers<T>
) {
  return (state: Record<string, T>, action: Action) => produce(
    state,
    draftState => Object.keys(extraReducers).reduce((baseState, entityKey) => {
      const reducers = extraReducers[entityKey];
      baseState[entityKey] = reducers.reduce((entityState, entityReducer) => {
        return entityReducer(entityState, action);
      }, baseState[entityKey]);
      return baseState;
    }, baseReducer(draftState as Record<string, T>, action))
  );
}

export function chainReducers<T = any>(
  extraReducers: ExtraApiReducers<T>
) {
  return (state: Record<string, T>, action: Action) => produce(
    state,
    draftState => Object.keys(extraReducers).reduce((baseState, entityKey) => {
      const reducers = extraReducers[entityKey];
      baseState[entityKey] = reducers.reduce((entityState, entityReducer) => {
        return entityReducer(entityState, action);
      }, baseState[entityKey]);
      return baseState;
    }, draftState as Record<string, T>)
  );
}
