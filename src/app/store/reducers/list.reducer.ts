import {
  ListFilter,
  ListPagination,
  ListSort,
  ListStateActionTypes,
  ListView,
  SetListFilterAction,
  SetListPaginationAction,
  SetListSortAction,
  SetListStateAction,
  SetListViewAction,
} from '../actions/list.actions';
import { Store } from '@ngrx/store';
import { AppState } from '../app-state';
import { Observable } from 'rxjs/Observable';
import { mergeState, pick } from '../helpers/reducer.helper';


export class ListsState { [key: string]: ListState }

export interface ListState {
  view: ListView;
  pagination: ListPagination;
  sort: ListSort;
  filter: ListFilter;
}

const defaultListsState = {} as ListsState;

export function listReducer(state = defaultListsState, action): ListsState {
  switch (action.type) {
    case ListStateActionTypes.SET:
      const setListState = action as SetListViewAction;

      // Create an object from the action containing only the required parameters of ListState
      let newListState = action as ListsState;
      const currentListState = state[action.key] || {};
      newListState = pick(newListState, Object.keys(currentListState) as [string]);

      // Merge the new list state properties of the action into the new list state
      const newState = mergeState(state[action.key], setListState);
      newState.view = setListState.view ? setListState.view.toString() : newState.view;

      // Create the whole new state
      return {
        ...state,
        [action.key]: newState
      };
    case ListStateActionTypes.SET_VIEW:
      const listView = (action as SetListViewAction).view;
      return mergeListState(state, action.key, 'view', listView ? listView.toString() : '');
    case ListStateActionTypes.SET_PAGINATION:
      return mergeListState(state, action.key, 'pagination', (action as SetListPaginationAction).pagination);
    case ListStateActionTypes.SET_SORT:
      return mergeListState(state, action.key, 'sort', (action as SetListSortAction).sort);
    case ListStateActionTypes.SET_FILTER:
      return mergeListState(state, action.key, 'filter', (action as SetListFilterAction).filter);
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

export const getListStateObservable = (store: Store<AppState>, key: string): Observable<ListState> => store.select(selectListState(key));
export const getListStateObservables = (store: Store<AppState>, key: string): {
  view: Observable<ListView>,
  pagination: Observable<ListPagination>,
  sort: Observable<ListSort>,
  filter: Observable<ListFilter>,
} => {
  return {
    view: store.select<ListView>(selectListStateProperty(key, 'view')),
    pagination: store.select<ListPagination>(selectListStateProperty(key, 'pagination')),
    sort: store.select<ListSort>(selectListStateProperty(key, 'sort')),
    filter: store.select<ListFilter>(selectListStateProperty(key, 'filter')),
  };
};

function selectListState(key: string) {
  return state => state['lists'][key];
}

function selectListStateProperty(key: string, property: string) {
  return state => {
    return (state['lists'][key] || {})[property];
  };
}

