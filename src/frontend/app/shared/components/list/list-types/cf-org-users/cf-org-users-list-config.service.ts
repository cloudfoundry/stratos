import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import {
  CloudFoundryOrganizationService,
} from '../../../../../features/cloud-foundry/services/cloud-foundry-organization.service';
import { AppState } from '../../../../../store/app-state';
import { CfUserService } from '../../../../data-services/cf-user.service';
import { CfUserDataSourceService } from '../cf-users/cf-user-data-source.service';
import { CfUserListConfigService } from '../cf-users/cf-user-list-config.service';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';

@Injectable()
export class CfOrgUsersListConfigService extends CfUserListConfigService {

  constructor(
    store: Store<AppState>,
    cfOrgService: CloudFoundryOrganizationService,
    cfUserService: CfUserService,
    router: Router,
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace) {
    super(store, cfUserService, router, activeRouteCfOrgSpace);
    this.dataSource = new CfUserDataSourceService(store, cfOrgService.allOrgUsersAction, this);
  }

}
