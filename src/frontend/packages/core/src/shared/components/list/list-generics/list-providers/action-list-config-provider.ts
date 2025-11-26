

import { ActionOrConfigListConfigProvider } from './action-or-entity-config-list-config-provider';

/**
 * Create a List provider (list config and data source) using a paginated action
 */
export class ActionListConfigProvider<T, A = T> extends ActionOrConfigListConfigProvider<T, A> {
}
