

import { ActionOrConfigListConfigProvider } from './action-or-entity-config-list-config-provider';

/**
 * Create a List provider (list config and data source) using a list entity config
 */
export class EntityConfigListConfigProvider<T, A = T> extends ActionOrConfigListConfigProvider<T, A> {
}
