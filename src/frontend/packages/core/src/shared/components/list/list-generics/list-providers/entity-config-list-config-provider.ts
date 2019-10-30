import { Store } from '@ngrx/store';

import { ListEntityConfig } from '../helpers/action-or-config-helpers';
import { ActionOrConfigListConfigProvider } from './action-or-entity-config-list-config-provider';

export class EntityConfigListConfigProvider<T, A = T> extends ActionOrConfigListConfigProvider<T, A> {
  constructor(
    store: Store<any>,
    config: ListEntityConfig
  ) {
    super(
      store,
      config
    );
  }
}
