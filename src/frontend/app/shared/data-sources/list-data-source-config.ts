import { Store } from '@ngrx/store';
import { schema } from 'normalizr';
import { OperatorFunction } from 'rxjs/interfaces';

import { AppState } from '../../store/app-state';
import { PaginatedAction } from '../../store/types/pagination.types';
import { Observable } from 'rxjs/Observable';
import { PaginationMonitor } from '../monitors/pagination-monitor';
import { getRowUniqueId, RowsState } from '../components/list/data-sources-controllers/list-data-source-types';
import { DataFunction, DataFunctionDefinition } from '../components/list/data-sources-controllers/list-data-source';

export interface IListDataSourceConfig<A, T> {
  store: Store<AppState>;
  action: PaginatedAction;
  schema: schema.Entity;
  getRowUniqueId: getRowUniqueId<T>;
  paginationKey: string;
  rowsState?: Observable<RowsState>;
  getEmptyType?: () => T;
  /**
   * A function that will map the type coming from the store (A)
   * to the type the list should use (T).
   */
  entityLettable?: OperatorFunction<A[], T[]>;
  isLocal?: boolean;
  /**
   * Functions to manipulate the entity array before it is displayed in the list.
   */
  entityFunctions?: (DataFunction<T> | DataFunctionDefinition)[];
}
