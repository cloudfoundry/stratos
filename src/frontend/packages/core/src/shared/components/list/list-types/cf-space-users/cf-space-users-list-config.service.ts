import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { AppState } from '../../../../../../../store/src/app-state';
import { CfUser } from '../../../../../../../store/src/types/user.types';
import { CurrentUserPermissionsService } from '../../../../../core/current-user-permissions.service';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import {
  CloudFoundryOrganizationService,
} from '../../../../../features/cloud-foundry/services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../features/cloud-foundry/services/cloud-foundry-space.service';
import { CfUserService } from '../../../../data-services/cf-user.service';
import { CfUserListConfigService } from '../cf-users/cf-user-list-config.service';

@Injectable()
export class CfSpaceUsersListConfigService extends CfUserListConfigService {
  constructor(
    store: Store<AppState>,
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
  }
}
