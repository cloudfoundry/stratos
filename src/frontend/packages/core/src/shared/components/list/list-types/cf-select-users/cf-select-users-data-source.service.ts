import { Store } from '@ngrx/store';

import { cfEntityFactory, cfUserEntityType } from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import { CFAppState } from '../../../../../../../store/src/app-state';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginatedAction } from '../../../../../../../store/src/types/pagination.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { TableRowStateManager } from '../../list-table/table-row/table-row-state-manager';
import { IListConfig } from '../../list.component.types';

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
