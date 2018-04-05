import { Store } from '@ngrx/store';
import { tap } from 'rxjs/operators';

import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { cfUserSchemaKey, entityFactory } from '../../../../../store/helpers/entity-factory';
import { PaginationMonitor } from '../../../../monitors/pagination-monitor';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { TableRowStateManager } from '../../list-table/table-row/table-row-state-manager';
import { AppState } from './../../../../../store/app-state';
import { APIResource } from './../../../../../store/types/api.types';
import { CfUser } from './../../../../../store/types/user.types';
import { CfUserService } from './../../../../data-services/cf-user.service';
import { CfUserListConfigService } from './cf-user-list-config.service';
import { PaginatedAction } from '../../../../../store/types/pagination.types';
import { ListConfig } from '../../list.component.types';


function setupStateManager(paginationMonitor: PaginationMonitor<APIResource<CfUser>>) {
  const rowStateManager = new TableRowStateManager();
  const sub = paginationMonitor.currentPage$.pipe(
    tap(users => {
      users.forEach(user => {
        rowStateManager.setRowState(user.metadata.guid, {
          blocked: !user.entity.username
        });
      });
    })
  ).subscribe();
  return {
    sub,
    rowStateManager
  };
}

export class CfUserDataSourceService extends ListDataSource<APIResource<CfUser>> {
  constructor(store: Store<AppState>, action: PaginatedAction, listConfigService: ListConfig<APIResource<CfUser>>) {
    const { paginationKey } = action;
    const paginationMonitor = new PaginationMonitor<APIResource<CfUser>>(store, paginationKey, entityFactory(cfUserSchemaKey));

    const { sub, rowStateManager } = setupStateManager(paginationMonitor);

    super({
      store,
      action,
      schema: entityFactory(cfUserSchemaKey),
      getRowUniqueId: getRowMetadata,
      paginationKey,
      isLocal: true,
      listConfig: listConfigService,
      rowsState: rowStateManager.observable,
      destroy: () => sub.unsubscribe()
    });
  }

}
