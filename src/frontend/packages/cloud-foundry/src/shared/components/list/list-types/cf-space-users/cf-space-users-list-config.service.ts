import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store'
import type { GeneralEntityAppState } from '@stratosui/store';;

import type { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import type {
  CurrentUserPermissionsService,
} from '@stratosui/core';
import type { ActiveRouteCfOrgSpace } from '../../../../../features/cf/cf-page.types';
import type { CloudFoundryOrganizationService } from '../../../../../features/cf/services/cloud-foundry-organization.service';
import type { CloudFoundrySpaceService } from '../../../../../features/cf/services/cloud-foundry-space.service';
import type { CfUser } from '../../../../../store/types/cf-user.types';
import type { CfUserService } from '../../../../data-services/cf-user.service';
import { CfUserListConfigService } from '../cf-users/cf-user-list-config.service';

@Injectable({
  providedIn: 'root'
})
export class CfSpaceUsersListConfigService extends CfUserListConfigService {
  constructor(
    store: Store<GeneralEntityAppState>,
    cfSpaceService: CloudFoundrySpaceService,
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
      (user: CfUser): boolean => cfUserService.hasSpaceRoles(user, activeRouteCfOrgSpace.spaceGuid),
      cfOrgService.org$,
      cfSpaceService.space$,
    );
    this.text.maxedResults.filterLine = '';
  }
}
