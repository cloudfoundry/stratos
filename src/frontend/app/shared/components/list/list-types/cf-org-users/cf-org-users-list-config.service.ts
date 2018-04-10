import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import {
  CloudFoundryOrganizationService,
} from '../../../../../features/cloud-foundry/services/cloud-foundry-organization.service';
import { AppState } from '../../../../../store/app-state';
import { CfUserService } from '../../../../data-services/cf-user.service';
import { CfUserDataSourceService } from '../cf-users/cf-user-data-source.service';
import { CfUserListConfigService } from '../cf-users/cf-user-list-config.service';

@Injectable()
export class CfOrgUsersListConfigService extends CfUserListConfigService {

  constructor(store: Store<AppState>, cfOrgService: CloudFoundryOrganizationService, cfUserService: CfUserService) {
    super(store, cfUserService);
    this.dataSource = new CfUserDataSourceService(store, cfOrgService.allOrgUsersAction, this);
  }

}
