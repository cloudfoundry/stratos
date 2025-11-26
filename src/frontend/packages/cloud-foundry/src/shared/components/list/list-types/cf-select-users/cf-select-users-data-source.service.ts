import { Store } from '@ngrx/store';
import { getRowMetadata, type GeneralEntityAppState } from '@stratosui/store';

import type { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { cfUserEntityType } from '../../../../../../../cloud-foundry/src/cf-entity-types';
import {
  ListDataSource,
} from '@stratosui/core';
import type {
  TableRowStateManager,
} from '@stratosui/core';
import type { IListConfig } from '@stratosui/core';
import type { APIResource } from '../../../../../../../store/src/types/api.types';
import type { PaginatedAction } from '../../../../../../../store/src/types/pagination.types';
import { cfEntityFactory } from '../../../../../cf-entity-factory';

export class CfSelectUsersDataSourceService extends ListDataSource<APIResource> {
  constructor(
    _cfGuid: string,
    store: Store<GeneralEntityAppState>,
    getAllUsersAction: PaginatedAction,
    listConfig: IListConfig<APIResource>,
    rowStateManager: TableRowStateManager,
    destroy: () => void
  ) {

    super({
      store,
      action: getAllUsersAction,
      schema: cfEntityFactory(cfUserEntityType),
      getRowUniqueId: getRowMetadata,
      paginationKey: getAllUsersAction.paginationKey,
      isLocal: true,
      transformEntities: [{ type: 'filter', field: 'entity.username' }],
      listConfig,
      rowsState: rowStateManager.observable,
      destroy
    });
  }
}
