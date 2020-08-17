import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { CFAppState } from 'frontend/packages/cloud-foundry/src/cf-app-state';
import { CurrentUserPermissionsService } from 'frontend/packages/core/src/core/permissions/current-user-permissions.service';
import { combineLatest, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { ListConfig } from '../../../../../../../../../core/src/shared/components/list/list.component.types';
import { CFFeatureFlagTypes } from '../../../../../../../cf-api.types';
import {
  CfSpaceUsersListConfigService,
} from '../../../../../../../shared/components/list/list-types/cf-space-users/cf-space-users-list-config.service';
import { CfCurrentUserPermissions } from '../../../../../../../user-permissions/cf-user-permissions-checkers';
import { ActiveRouteCfOrgSpace } from '../../../../../cf-page.types';
import { createCfOrgSpaceSteppersUrl, someFeatureFlags, waitForCFPermissions } from '../../../../../cf.helpers';

@Component({
  selector: 'app-cloud-foundry-space-users',
  templateUrl: './cloud-foundry-space-users.component.html',
  styleUrls: ['./cloud-foundry-space-users.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: CfSpaceUsersListConfigService
  }]
})
export class CloudFoundrySpaceUsersComponent {
  public addRolesByUsernameLink$: Observable<{
    link: string,
    params: { [name: string]: any }
  }>;

  constructor(
    store: Store<CFAppState>,
    userPerms: CurrentUserPermissionsService,
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace
  ) {
    const requiredFeatureFlags = [
      CFFeatureFlagTypes.set_roles_by_username,
      CFFeatureFlagTypes.unset_roles_by_username
    ];
    this.addRolesByUsernameLink$ = waitForCFPermissions(store, activeRouteCfOrgSpace.cfGuid).pipe(
      switchMap(() => combineLatest([
        someFeatureFlags(requiredFeatureFlags, activeRouteCfOrgSpace.cfGuid, store, userPerms),
        userPerms.can(
          CfCurrentUserPermissions.SPACE_CHANGE_ROLES,
          activeRouteCfOrgSpace.cfGuid,
          activeRouteCfOrgSpace.orgGuid,
          activeRouteCfOrgSpace.spaceGuid
        )
      ])),
      map(([canSetRolesByUsername, canChangeOrgRole]) => {
        if (canSetRolesByUsername && canChangeOrgRole) {
          return {
            link: createCfOrgSpaceSteppersUrl(
              activeRouteCfOrgSpace.cfGuid,
              `/users/manage`,
              activeRouteCfOrgSpace.orgGuid,
              activeRouteCfOrgSpace.spaceGuid
            ),
            params: { setByUsername: true }
          };
        }
      }),
    );
  }

}
