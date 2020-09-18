import { Store } from '@ngrx/store';
import { getRowMetadata } from '@stratosui/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { cfUserEntityType } from '../../../../../../../cloud-foundry/src/cf-entity-types';
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import {
  TableRowStateManager,
} from '../../../../../../../core/src/shared/components/list/list-table/table-row/table-row-state-manager';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginatedAction } from '../../../../../../../store/src/types/pagination.types';
import { cfEntityFactory } from '../../../../../cf-entity-factory';

export class CfSelectUsersDataSourceService extends ListDataSource<APIResource> {
  constructor(
    cfGuid: string,
    store: Store<CFAppState>,
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
