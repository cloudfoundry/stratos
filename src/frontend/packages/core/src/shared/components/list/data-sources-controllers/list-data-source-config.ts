import { Action, Store } from '@ngrx/store';
import { Observable, OperatorFunction } from 'rxjs';

import { AppState } from '../../../../../../store/src/app-state';
import { EntitySchema } from '../../../../../../store/src/helpers/entity-schema';
import { PaginatedAction } from '../../../../../../store/src/types/pagination.types';
import { IListConfig } from '../list.component.types';
import { DataFunction, DataFunctionDefinition } from './list-data-source';
import { getRowUniqueId, RowsState, RowState } from './list-data-source-types';


/**
 * Allows a list to manage separate actions and/or separate entity types.
 * Also used to configure the entity type dropdown.
 * @export
 */
export class MultiActionConfig {
  /**
   * Creates an instance of MultiActionConfig.
   * @param schemaConfigs configs to drive a multi action list
   * @param [selectPlaceholder='Select entity type'] The message that will be show in the select.
   * If this is null then the dropdown will be hidden
   * @param [deselectText=null] What string should be shown for the "deselect" select item.
   * A null value will show an empty item
   */
  constructor(
    public schemaConfigs: ActionSchemaConfig[],
    public selectPlaceholder: string = 'Select entity type',
    public deselectText: string = 'All'
  ) { }
}

/**
 * Gives information for an action and entity type used in multi action list. *
 * @export
 */
export class ActionSchemaConfig {
  constructor(
    public paginationAction: PaginatedAction,
  ) { }
}

export interface IListDataSourceConfig<A, T> {
  store: Store<AppState>;
  /**
   * An action that, when called, will populate the entries required to show the current state of the list. For example, this action will
   * be dispatched when the page number changes in a non-local list.
   */
  action: PaginatedAction;
  /**
   * The entity which will be fetched via the action
   */
  schema: EntitySchema | MultiActionConfig;
  /**
   * A function which will return a unique id for the given row/entity
   */
  getRowUniqueId: getRowUniqueId<A>;
  /**
   * The key used to uniquely identify this instance of the data in the pagination section of the store
   */
  paginationKey: string;
  /**
   * An observable containing each row's state
   */
  rowsState?: Observable<RowsState>;
  /**
   * When using the inline add this function provides an empty instance of the entity to start populating
   */
  getEmptyType?: () => T;
  /**
   * A function that will map the type coming from the store (A)
   * to the type the list should use (T).
   */
  transformEntity?: OperatorFunction<A[], T[]>;
  /**
   * Local lists expect ALL entries to be fetched by the data sources action. This allows custom sorting and filtering. Non-local lists
   * must sort and filter via their supporting api requests.
   */
  isLocal?: boolean;
  /**
   * Functions to manipulate the entity array before it is displayed in the list.
   */
  transformEntities?: (DataFunction<T> | DataFunctionDefinition)[];
  /**
   * Optional list configuration
   */
  listConfig: IListConfig<T>;

  /**
   * A function that will be called when the list is destroyed.
   */
  destroy?: () => void;

  /**
   * A function that will be called instead of the default refresh
   */
  refresh?: () => void;

  /**
   * A function that will be called instead of the default update metrics action
   *
   * This will only be called when metrics-range-selector component is enabled/used
   */
  handleTimeWindowChange?: (action: Action) => void;

  /**
   * A function which fetches an observable containing a specific row's state
   *
   */
  getRowState?(row: T): Observable<RowState>;
}
