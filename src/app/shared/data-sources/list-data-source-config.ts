import { Store } from '@ngrx/store';
import { schema } from 'normalizr';
import { OperatorFunction } from 'rxjs/interfaces';

import { AppState } from '../../store/app-state';
import { PaginatedAction } from '../../store/types/pagination.types';
import { DataFunction, DataFunctionDefinition } from './list-data-source';
import { getRowUniqueId } from './list-data-source-types';

export interface IListDataSourceConfig<A, T> {
  store: Store<AppState>;
  action: PaginatedAction;
  schema: schema.Entity;
  getRowUniqueId: getRowUniqueId<T>;
  paginationKey: string;
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
