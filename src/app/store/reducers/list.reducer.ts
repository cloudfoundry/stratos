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
import { mergeState } from '../helpers/reducer.helper';


export type ListsState = Map<string, ListState>;

export interface ListState {
  view: ListView;
  pagination: ListPagination;
  sort: ListSort;
  filter: ListFilter;
}

const defaultListsState = new Map<string, ListState>();

export function listReducer(state = defaultListsState, action): ListsState {
  switch (action.type) {
    case ListStateActionTypes.SET:
      const setListState = action as SetListStateAction;
      return {
        ...state,
        [action.key]: {
          view: setListState.view,
          pagination: {
            ...setListState.pagination,
          },
          sort: {
            ...setListState.sort,
          },
          filter: {
            ...setListState.filter,
          }
        }
      };
    case ListStateActionTypes.SET_VIEW:
      return mergeListState(state, action.key, 'view', (action as SetListViewAction).view);
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
  pagination: Observable<ListPagination>,
  sort: Observable<ListSort>,
  filter: Observable<ListFilter>,
} => {
  return {
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

