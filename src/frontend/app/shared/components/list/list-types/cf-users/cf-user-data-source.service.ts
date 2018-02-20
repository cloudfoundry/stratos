import { CfUserListConfigService } from './cf-user-list-config.service';
import { ListConfig } from './../../list.component.types';
import { APIResource } from './../../../../../store/types/api.types';
import { UserSchema, CfUser } from './../../../../../store/types/user.types';
import { CfUserService } from './../../../../data-services/cf-user.service';
import { AppState } from './../../../../../store/app-state';
import { Store } from '@ngrx/store';
import { Injectable } from '@angular/core';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';

export class CfUserDataSourceService extends ListDataSource<APIResource<CfUser>> {
  constructor(store: Store<AppState>, cfUserService: CfUserService, cfUserListConfigService: CfUserListConfigService) {
    const { paginationKey } = cfUserService.allUsersAction;
    const action = cfUserService.allUsersAction;
    super({
      store,
      action,
      schema: UserSchema,
      getRowUniqueId: (entity: APIResource) => {
        return entity.metadata ? entity.metadata.guid : null;
      },
      paginationKey,
      isLocal: true,
      transformEntities: [],
      listConfig: cfUserListConfigService
    });
  }
}
