import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  CurrentUserPermissionsService,
} from '../../../../../../../core/src/core/permissions/current-user-permissions.service';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import {
  CloudFoundryOrganizationService,
} from '../../../../../features/cloud-foundry/services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../features/cloud-foundry/services/cloud-foundry-space.service';
import { CfUser } from '../../../../../store/types/cf-user.types';
import { CfUserService } from '../../../../data-services/cf-user.service';
import { CfUserListConfigService } from '../cf-users/cf-user-list-config.service';

@Injectable()
export class CfSpaceUsersListConfigService extends CfUserListConfigService {
  constructor(
    store: Store<CFAppState>,
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
