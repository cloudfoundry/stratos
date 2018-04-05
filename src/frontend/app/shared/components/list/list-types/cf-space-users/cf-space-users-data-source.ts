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
import { CfSpaceUsersListConfigService } from './cf-space-users-list-config.service';
import { CloudFoundryOrganizationService } from '../../../../../features/cloud-foundry/services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../features/cloud-foundry/services/cloud-foundry-space.service';


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

export class CfSpaceUsersDataSource extends ListDataSource<APIResource<CfUser>> {
  constructor(
    store: Store<AppState>,
    cfSpaceService: CloudFoundrySpaceService,
    cfSpaceUsersListConfigService: CfSpaceUsersListConfigService
  ) {
    const { paginationKey } = cfSpaceService.allSpaceUsersAction;
    const action = cfSpaceService.allSpaceUsersAction;
    const paginationMonitor = new PaginationMonitor<APIResource<CfUser>>(store, paginationKey, entityFactory(cfUserSchemaKey));

    const { sub, rowStateManager } = setupStateManager(paginationMonitor);

    super({
      store,
      action,
      schema: entityFactory(cfUserSchemaKey),
      getRowUniqueId: getRowMetadata,
      paginationKey,
      isLocal: true,
      listConfig: cfSpaceUsersListConfigService,
      rowsState: rowStateManager.observable,
      destroy: () => sub.unsubscribe()
    });
  }

}
