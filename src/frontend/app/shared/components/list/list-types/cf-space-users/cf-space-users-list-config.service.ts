import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { CloudFoundrySpaceService } from '../../../../../features/cloud-foundry/services/cloud-foundry-space.service';
import { AppState } from '../../../../../store/app-state';
import { CfUserService } from '../../../../data-services/cf-user.service';
import { CfUserListConfigService } from '../cf-users/cf-user-list-config.service';
import { CfSpaceUsersDataSource } from './cf-space-users-data-source';



@Injectable()
export class CfSpaceUsersListConfigService extends CfUserListConfigService {

  constructor(store: Store<AppState>, cfSpaceService: CloudFoundrySpaceService, cfUserService: CfUserService) {
    super(store, cfUserService);
    this.dataSource = new CfSpaceUsersDataSource(store, cfSpaceService, this);
  }

}
