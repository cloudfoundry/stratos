import { Action, Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

import { ListFilter, ListSort, ListView, ListPagination } from '../../store/actions/list.actions';
import { IRequestEntityTypeState, AppState } from '../../store/app-state';
import { ListState } from '../../store/reducers/list.reducer';
import { PaginationEntityState } from './../../store/types/pagination.types';

export interface AppEvent {
  actee_name: string;
  actee_type: string;
  actor: string;
  actor_name: string;
  actor_type: string;
  actor_username: string;
  metadata: Object;
  organization_guid: string;
  space_guid: string;
  timestamp: string;
  type: string;
}

export class ListActionConfig<T> {
  createAction: (dataSource: IListDataSource<T>, items: IRequestEntityTypeState<T>) => Action;
  icon: string;
  label: string;
  description: string;
  visible: (row: T) => boolean;
  enabled: (row: T) => boolean;
}
export class ListActions<T> {
  globalActions = new Array<ListActionConfig<T>>();
  multiActions = new Array<ListActionConfig<T>>();
  singleActions = new Array<ListActionConfig<T>>();
}
export interface IListDataSource<T> {
  listStateKey: string;
  view$: Observable<ListView>;
  state$: Observable<ListState>;
  pagination$: Observable<PaginationEntityState>;
  // sort$: Observable<ListSort>;
  // filter$: Observable<ListFilter>;
  isLocal?: boolean;
  localDataFunctions?: ((entities: T[], paginationState: PaginationEntityState) => T[])[];

  entityKey: string;
  paginationKey: string;

  page$: Observable<T[]>;

  addItem: T;
  isAdding$: BehaviorSubject<boolean>;
  isSelecting$: BehaviorSubject<boolean>;

  editRow: T; // Edit items - remove once ng-content can exist in md-table

  selectAllChecked: boolean; // Select items - remove once ng-content can exist in md-table
  selectedRows: Map<string, T>; // Select items - remove once ng-content can exist in md-table
  selectAllFilteredRows(); // Select items - remove once ng-content can exist in md-table
  selectedRowToggle(row: T); // Select items - remove once ng-content can exist in md-table
  selectClear();

  startEdit(row: T); // Edit items - remove once ng-content can exist in md-table
  saveEdit(); // Edit items - remove once ng-content can exist in md-table
  cancelEdit(); // Edit items - remove once ng-content can exist in md-table

  getFilterFromParams(pag: PaginationEntityState): string;
  setFilterParam(filter: ListFilter);

  connect(): Observable<T[]>;
  destroy();
}

export type getRowUniqueId = (T) => string;
