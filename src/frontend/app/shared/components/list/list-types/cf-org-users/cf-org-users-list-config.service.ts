import { Injectable } from '@angular/core';
import { CfUserListConfigService } from '../cf-users/cf-user-list-config.service';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/app-state';
import { CfUserService } from '../../../../data-services/cf-user.service';
import { CfOrgUsersDataSource } from './cf-org-users-data-source';
import { CloudFoundryOrganizationService } from '../../../../../features/cloud-foundry/services/cloud-foundry-organization.service';

@Injectable()
export class CfOrgUsersListConfigService extends CfUserListConfigService {

  constructor(store: Store<AppState>, cfOrgService: CloudFoundryOrganizationService, cfUserService: CfUserService) {
    super(store, cfUserService);
    this.dataSource = new CfOrgUsersDataSource(store, cfOrgService, this);
  }

}
