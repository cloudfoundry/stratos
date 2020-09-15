import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { ListStateActionTypes, ListView, SetListViewAction } from '../actions/list.actions';
import { mergeState } from '../helpers/reducer.helper';
import { ListsOnlyAppState } from '../app-state';

export class ListsState {
  [key: string]: ListState;
}

export interface ListState {
  view: ListView;
}

const defaultListsState = {} as ListsState;

export function listReducer(state = defaultListsState, action): ListsState {
  switch (action.type) {
    case ListStateActionTypes.SET:
      const setListState = action as SetListViewAction;

      return {
        ...state,
        [action.key]: {
          view: setListState.view ? setListState.view.toString() : ''
        }
      };
    case ListStateActionTypes.SET_VIEW:
      const listView = (action as SetListViewAction).view;
      return mergeListState(
        state,
        action.key,
        'view',
        listView ? listView.toString() : ''
      );
    default:
      return state;
  }
}

function mergeListState(state, listKey, key, value) {
  const newListState = {
    [key]: value
  };
  const newState = { ...state };
  newState[listKey] = mergeState(newState[listKey], newListState);
  return newState;
}

export const getListStateObservable = (
  store: Store<ListsOnlyAppState>,
  key: string
): Observable<ListState> => store.select(selectListState(key));

export const getListStateObservables = (
  store: Store<ListsOnlyAppState>,
  key: string
): {
  view: Observable<ListView>;
} => {
  return {
    view: store.select<ListView>(selectListStateProperty(key, 'view'))
  };
};

function selectListState(key: string) {
  return state => state.lists[key];
}

function selectListStateProperty(key: string, property: string) {
  return state => {
    return (state.lists[key] || {})[property];
  };
}
