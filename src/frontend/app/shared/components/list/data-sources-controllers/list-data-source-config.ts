import { Store } from '@ngrx/store';
import { schema } from 'normalizr';
import { OperatorFunction, Observable } from 'rxjs';

import { AppState } from '../../../../store/app-state';
import { PaginatedAction } from '../../../../store/types/pagination.types';
import { DataFunction, DataFunctionDefinition } from './list-data-source';
import { getRowUniqueId, RowsState, RowState } from './list-data-source-types';
import { IListConfig } from '../list.component.types';

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
  schema: schema.Entity;
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
  listConfig?: IListConfig<T>;

  /**
   * A function that will be called when the list is destroyed.
   */
  destroy?: () => void;

  refresh?: () => void;
  /**
   * A function which fetches an observable containing a specific row's state
   *
   */
  getRowState?(row: T): Observable<RowState>;
}
