import { DataSource } from '@angular/cdk/table';
import { Action } from '@ngrx/store';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';

import { MetricsAction } from '../../../../store/actions/metrics.actions';
import { IRequestEntityTypeState } from '../../../../store/app-state';
import { PaginatedAction, PaginationEntityState, PaginationParam } from '../../../../store/types/pagination.types';
import { ListFilter, ListSort } from '../../../../store/actions/list.actions';

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

interface ICoreListDataSource<T> extends DataSource<T> {
  rowsState?: Observable<RowsState>;
  getRowState?(row: T): Observable<RowState>;
  trackBy(index: number, item: T);
}

export interface ITableListDataSource<T> extends ICoreListDataSource<T> {
  isTableLoading$: Observable<boolean>;
}

export interface IListDataSource<T> extends ICoreListDataSource<T> {
  pagination$: Observable<PaginationEntityState>;
  isLocal?: boolean;
  localDataFunctions?: ((
    entities: T[],
    paginationState: PaginationEntityState
  ) => T[])[];
  action: PaginatedAction;
  entityKey: string;
  paginationKey: string;

  page$: Observable<T[]>;

  addItem: T;
  isAdding$: BehaviorSubject<boolean>;
  isSelecting$: BehaviorSubject<boolean>;
  isLoadingPage$: Observable<boolean>;

  maxedResults$: Observable<boolean>;
  filter$: Observable<ListFilter>;
  sort$: Observable<ListSort>;

  editRow: T; // Edit items - remove once ng-content can exist in md-table

  selectAllChecked: boolean; // Select items - remove once ng-content can exist in md-table
  selectedRows: Map<string, T>; // Select items - remove once ng-content can exist in md-table
  selectedRows$: ReplaySubject<Map<string, T>>; // Select items - remove once ng-content can exist in md-table
  getRowUniqueId: getRowUniqueId<T>;
  selectAllFilteredRows(); // Select items - remove once ng-content can exist in md-table
  selectedRowToggle(row: T, multiMode?: boolean); // Select items - remove once ng-content can exist in md-table
  selectClear();

  startEdit(row: T); // Edit items - remove once ng-content can exist in md-table
  saveEdit(); // Edit items - remove once ng-content can exist in md-table
  cancelEdit(); // Edit items - remove once ng-content can exist in md-table
  destroy();
  /**
   * Set's data source specific text filter param
   */
  setFilterParam(filterParam: string, pag: PaginationEntityState);
  /**
   * Gets data source specific text filter param
   */
  getFilterFromParams(pag: PaginationEntityState): string;
  /**
   * Set's data source specific multi filter properties. Only applicable in maxedResult world
   */
  setMultiFilter(changes: ListPaginationMultiFilterChange[], params: PaginationParam);
  refresh();

  updateMetricsAction(newAction: MetricsAction);

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
  highlighted?: boolean;
  deleting?: boolean;
  warning?: boolean;
  disabled?: boolean;
  [customState: string]: any;
}

export const getDefaultRowState = (): RowState => ({
  busy: false,
  error: false,
  blocked: false,
  deleting: false,
  message: null
});

export interface ListPaginationMultiFilterChange {
  key: string;
  value: string;
}
