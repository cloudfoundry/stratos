import { DataSource } from '@angular/cdk/table';
import { Action } from '@ngrx/store';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';

import { ListFilter, ListSort } from '../../../../../../store/src/actions/list.actions';
import { MetricsAction } from '../../../../../../store/src/actions/metrics.actions';
import { IRequestEntityTypeState } from '../../../../../../store/src/app-state';
import { EntityCatalogEntityConfig } from '../../../../../../store/src/entity-catalog/entity-catalog.types';
import { EntitySchema } from '../../../../../../store/src/helpers/entity-schema';
import { PaginatedAction, PaginationEntityState, PaginationParam } from '../../../../../../store/src/types/pagination.types';

export interface IEntitySelectItem {
  page: number;
  label: string;
  entityKey: string;
}

/**
 * Drives the entity list entity select
 */
export class EntitySelectConfig {
  /**
   * Creates an instance of EntitySelectConfig.
   * @param selectPlaceholder Placeholder text to show.
   * @param selectEmptyText The text shown when no value is selected
   * @param entitySelectItems Dictates which pagination page
   * is storing which entity ids. Used in the pagination monitor.
   */
  constructor(
    public selectPlaceholder: string,
    public selectEmptyText: string,
    public entitySelectItems: IEntitySelectItem[]
  ) { }
}
export interface AppEvent {
  actee_name: string;
  actee_type: string;
  actor: string;
  actor_name: string;
  actor_type: string;
  actor_username: string;
  metadata: object;
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
  getRowState?(row: T, schemaKey?: string): Observable<RowState>;
  trackBy(index: number, item: T);
}

interface ICoreTableListDataSource<T> extends ICoreListDataSource<T> {
  isTableLoading$?: Observable<boolean>;

  selectAllChecked?: boolean; // Select items - remove once ng-content can exist in md-table
  selectAllIndeterminate?: boolean; // Select all checkbox as indeterminate
  selectedRows?: Map<string, T>; // Select items - remove once ng-content can exist in md-table
  selectedRows$?: ReplaySubject<Map<string, T>>; // Select items - remove once ng-content can exist in md-table
  selectAllFilteredRows?: () => void; // Select items - remove once ng-content can exist in md-table
  selectedRowToggle?: (row: T, multiMode?: boolean) => void; // Select items - remove once ng-content can exist in md-table
  selectClear?: () => void;

  editRow?: T; // Edit items - remove once ng-content can exist in md-table
  startEdit?: (row: T) => void; // Edit items - remove once ng-content can exist in md-table
  saveEdit?: () => void; // Edit items - remove once ng-content can exist in md-table
  cancelEdit?: () => void; // Edit items - remove once ng-content can exist in md-table
  getRowUniqueId?: getRowUniqueId<T>;
}

export interface ITableListDataSource<T> extends ICoreTableListDataSource<T> {
  isTableLoading$: Observable<boolean>;
}

export interface IListDataSource<T> extends ICoreListDataSource<T>, ICoreTableListDataSource<T>, EntityCatalogEntityConfig {
  pagination$: Observable<PaginationEntityState>;
  isLocal?: boolean;
  localDataFunctions?: ((
    entities: T[],
    paginationState: PaginationEntityState
  ) => T[])[];
  action: PaginatedAction | PaginatedAction[];
  entityKey: string;
  sourceScheme: EntitySchema;
  paginationKey: string;

  page$: Observable<T[]>;

  isMultiAction$?: Observable<boolean>;

  addItem: T;
  isAdding$: BehaviorSubject<boolean>;
  isSelecting$: BehaviorSubject<boolean>;
  isLoadingPage$: Observable<boolean>;

  maxedResults$: Observable<boolean>;
  maxedStateStartAt$: Observable<number>;
  filter$: Observable<ListFilter>;
  sort$: Observable<ListSort>;



  getRowUniqueId: getRowUniqueId<T>;
  entitySelectConfig?: EntitySelectConfig; // For multi action lists, this is used to configure the entity select.

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
  /**
   * Ensure that list maxed status is ignored. This will result in all results being shown when previously ignored
   */
  showAllAfterMax();
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
