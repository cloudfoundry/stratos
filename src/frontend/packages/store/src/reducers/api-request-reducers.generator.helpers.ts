import { Action, ActionReducer } from '@ngrx/store';
import { produce } from 'immer';

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
