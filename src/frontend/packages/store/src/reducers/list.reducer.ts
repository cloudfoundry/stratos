import type { Action } from '@ngrx/store';
import type { Store } from '@ngrx/store';
import type { Observable } from 'rxjs';

import { type HydrateListsStateAction, ListStateActionTypes, type ListView, type SetListViewAction } from '../actions/list.actions';
import type { ListsOnlyAppState } from '../app-state';
import { mergeState } from '../helpers/reducer.helper';

export class ListsState {
  [key: string]: ListState;
}

export interface ListState {
  view: ListView;
}

const defaultListsState = {} as ListsState;

export function listReducer(state = defaultListsState, action: Action): ListsState {
  switch (action.type) {
    case ListStateActionTypes.SET: {
      const setListState = action as SetListViewAction;

      return {
        ...state,
        [setListState.key]: {
          view: setListState.view || 'table'
        }
      };
    }
    case ListStateActionTypes.SET_VIEW: {
      const setListView = action as SetListViewAction;
      const listView = setListView.view;
      return mergeListState(
        state,
        setListView.key,
        'view',
        listView || 'table'
      );
    }
    case ListStateActionTypes.HYDRATE: {
      const hydrate = action as HydrateListsStateAction;
      return {
        ...hydrate.listsState
      };
    }
    default:
      return state;
  }
}

function mergeListState(state: ListsState, listKey: string, key: keyof ListState, value: ListView): ListsState {
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
  return (state: ListsOnlyAppState) => state.lists[key];
}

function selectListStateProperty(key: string, property: keyof ListState) {
  return (state: ListsOnlyAppState) => {
    return state.lists[key]?.[property];
  };
}
