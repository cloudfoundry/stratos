import { CfUserListConfigService } from './cf-user-list-config.service';
import { ListConfig } from './../../list.component.types';
import { APIResource } from './../../../../../store/types/api.types';
import { UserSchema, CfUser } from './../../../../../store/types/user.types';
import { CfUserService } from './../../../../data-services/cf-user.service';
import { AppState } from './../../../../../store/app-state';
import { Store } from '@ngrx/store';
import { Injectable } from '@angular/core';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { TableRowStateManager } from '../../list-table/table-row/table-row-state-manager';
import { PaginationMonitor } from '../../../../monitors/pagination-monitor';
import { tap } from 'rxjs/operators';

export class CfUserDataSourceService extends ListDataSource<APIResource<CfUser>> {
  constructor(store: Store<AppState>, cfUserService: CfUserService, cfUserListConfigService: CfUserListConfigService) {
    const { paginationKey } = cfUserService.allUsersAction;
    const action = cfUserService.allUsersAction;
    const paginationMonitor = new PaginationMonitor<APIResource<CfUser>>(store, paginationKey, UserSchema);
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

    super({
      store,
      action,
      schema: UserSchema,
      getRowUniqueId: (entity: APIResource) => {
        return entity.metadata ? entity.metadata.guid : null;
      },
      paginationKey,
      isLocal: true,
      listConfig: cfUserListConfigService,
      rowsState: rowStateManager.observable,
      destroy: () => sub.unsubscribe()
    });
  }
}
