import { Store } from '@ngrx/store';

import { PaginatedAction } from '../../../../../../../store/src/types/pagination.types';
import { ActionOrConfigListConfigProvider } from './action-or-entity-config-list-config-provider';

/**
 * Create a List provider (list config and data source) using a paginated action
 */
export class ActionListConfigProvider<T, A = T> extends ActionOrConfigListConfigProvider<T, A> {
  constructor(
    store: Store<any>,
    paginatedAction: PaginatedAction
  ) {
    super(
      store,
      paginatedAction
    );
  }
}
