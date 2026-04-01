import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  CurrentUserPermissionsService,
} from '../../../../../../../core/src/core/permissions/current-user-permissions.service';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cf/cf-page.types';
import { CloudFoundryOrganizationService } from '../../../../../features/cf/services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../features/cf/services/cloud-foundry-space.service';
import { CfUser } from '../../../../../store/types/cf-user.types';
import { CfUserService } from '../../../../data-services/cf-user.service';
import { CfUserListConfigService } from '../cf-users/cf-user-list-config.service';

@Injectable({
  providedIn: 'root'
})
export class CfSpaceUsersListConfigService extends CfUserListConfigService {
  constructor() {
    const store = inject<Store<CFAppState>>(Store);
    const cfSpaceService = inject(CloudFoundrySpaceService);
    const cfOrgService = inject(CloudFoundryOrganizationService);
    const cfUserService = inject(CfUserService);
    const router = inject(Router);
    const activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
    const userPerms = inject(CurrentUserPermissionsService);

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
