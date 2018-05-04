import { Action } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

import { IRequestEntityTypeState } from '../../../../store/app-state';
import { PaginationEntityState, PaginatedAction } from '../../../../store/types/pagination.types';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { DataSource } from '@angular/cdk/table';

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
  createAction: (
    dataSource: IListDataSource<T>,
    items: IRequestEntityTypeState<T>
  ) => Action;
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

export interface ITableListDataSource<T> extends DataSource<T> {
  rowsState?: Observable<RowsState>;
  getRowState?(row: T): Observable<RowsState>;
  trackBy(index: number, item: T);
}
export interface IListDataSource<T> extends ITableListDataSource<T> {
  pagination$: Observable<PaginationEntityState>;
  isLocal?: boolean;
  localDataFunctions?: ((
    entities: T[],
    paginationState: PaginationEntityState
  ) => T[])[];
  entityKey: string;
  paginationKey: string;

  page$: Observable<T[]>;

  addItem: T;
  isAdding$: BehaviorSubject<boolean>;
  isSelecting$: BehaviorSubject<boolean>;
  isLoadingPage$: Observable<boolean>;

  editRow: T; // Edit items - remove once ng-content can exist in md-table

  selectAllChecked: boolean; // Select items - remove once ng-content can exist in md-table
  selectedRows: Map<string, T>; // Select items - remove once ng-content can exist in md-table
  selectedRows$: ReplaySubject<Map<string, T>>; // Select items - remove once ng-content can exist in md-table
  getRowUniqueId: getRowUniqueId<T>;
  selectAllFilteredRows(); // Select items - remove once ng-content can exist in md-table
  selectedRowToggle(row: T); // Select items - remove once ng-content can exist in md-table
  selectClear();

  startEdit(row: T); // Edit items - remove once ng-content can exist in md-table
  saveEdit(); // Edit items - remove once ng-content can exist in md-table
  cancelEdit(); // Edit items - remove once ng-content can exist in md-table
  destroy();
  getFilterFromParams(pag: PaginationEntityState): string;
  setFilterParam(filter: string, pag: PaginationEntityState);
  refresh();
}

export type getRowUniqueId<T> = (T) => string;
export interface RowsState {
  [rowUID: string]: RowState;
}

export interface RowState {
  busy?: boolean;
  error?: boolean;
  message?: string;
  blocked?: boolean;
  [customState: string]: any;
}

export const getDefaultRowState = (): RowState => ({
  busy: false,
  error: false,
  blocked: false,
  message: null
});
