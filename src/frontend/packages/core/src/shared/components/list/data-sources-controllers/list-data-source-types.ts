import { DataSource } from '@angular/cdk/table';
import { Signal } from '@angular/core';
import {
  Action,
  EntityCatalogEntityConfig,
  EntitySchema,
  IRequestEntityTypeState,
  ListFilter,
  ListSort,
  PaginatedAction,
  PaginationEntityState,
  PaginationParam,
} from '@stratosui/store';
import { Observable } from 'rxjs';

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
  createAction!: (
    dataSource: IListDataSource<T>,
    items: IRequestEntityTypeState<T>
  ) => Action;
  icon!: string;
  label!: string;
  description!: string;
  visible!: (row: T) => boolean;
  enabled!: (row: T) => boolean;
}

interface ICoreListDataSource<T> extends DataSource<T> {
  rowsState?: Observable<RowsState>;
  getRowState?(row: T, schemaKey?: string): Observable<RowState>;
  trackBy(index: number, item: T): string | number;
}

interface ICoreTableListDataSource<T> extends ICoreListDataSource<T> {
  isTableLoading$?: Observable<boolean>;

  selectAllChecked?: boolean; // Select items - remove once ng-content can exist in md-table
  selectAllIndeterminate?: boolean; // Select all checkbox as indeterminate
  selectedRows?: Signal<Map<string, T>>; // Select items - remove once ng-content can exist in md-table
  selectedRows$?: Observable<Map<string, T>>; // Select items - remove once ng-content can exist in md-table
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
  isAdding: Signal<boolean>;
  isAdding$: Observable<boolean>;
  isSelecting: Signal<boolean>;
  isSelecting$: Observable<boolean>;
  isLoadingPage$: Observable<boolean>;

  maxedResults$: Observable<boolean>;
  maxedStateStartAt$: Observable<number>;
  filter$: Observable<ListFilter>;
  sort$: Observable<ListSort>;

  getRowUniqueId: getRowUniqueId<T>;
  entitySelectConfig?: EntitySelectConfig; // For multi action lists, this is used to configure the entity select.

  destroy(): void;
  /**
   * Set's data source specific text filter param
   */
  setFilterParam(filterParam: string, pag: PaginationEntityState): void;
  /**
   * Gets data source specific text filter param
   */
  getFilterFromParams(pag: PaginationEntityState): string;
  /**
   * Set's data source specific multi filter properties. Only applicable in maxedResult world
   */
  setMultiFilter(changes: ListPaginationMultiFilterChange[], params: PaginationParam): void;
  refresh(): void;

  /**
   * Ensure that list maxed status is ignored. This will result in all results being shown when previously ignored
   */
  showAllAfterMax(): void;
}

export type getRowUniqueId<T> = (row: T) => string;
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
