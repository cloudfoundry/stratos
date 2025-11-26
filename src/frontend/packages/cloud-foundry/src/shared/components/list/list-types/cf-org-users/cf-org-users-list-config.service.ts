import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store'
import type { GeneralEntityAppState } from '@stratosui/store';;

import type { CFAppState } from '@stratosui/cloud-foundry';
import type { CurrentUserPermissionsService } from '@stratosui/core';
import type { ActiveRouteCfOrgSpace } from '../../../../../features/cf/cf-page.types';
import type { CloudFoundryOrganizationService } from '../../../../../features/cf/services/cloud-foundry-organization.service';
import type { CfUser } from '../../../../../store/types/cf-user.types';
import type { CfUserService } from '../../../../data-services/cf-user.service';
import { CfUserListConfigService } from '../cf-users/cf-user-list-config.service';

@Injectable({
  providedIn: 'root'
})
export class CfOrgUsersListConfigService extends CfUserListConfigService {

  constructor(
    store: Store<GeneralEntityAppState>,
    cfOrgService: CloudFoundryOrganizationService,
    cfUserService: CfUserService,
    router: Router,
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    userPerms: CurrentUserPermissionsService) {

    super(
      store,
      cfUserService,
      router,
      activeRouteCfOrgSpace,
      userPerms,
      (user: CfUser): boolean => cfUserService.hasRolesInOrg(user, activeRouteCfOrgSpace.orgGuid, false),
      cfOrgService.org$
    );
    this.text.maxedResults.filterLine = 'Please navigate to a Space Users list';
  }
}
