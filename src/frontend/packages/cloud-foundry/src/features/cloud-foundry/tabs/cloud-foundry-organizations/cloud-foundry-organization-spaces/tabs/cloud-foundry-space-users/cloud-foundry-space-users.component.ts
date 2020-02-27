import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { CFAppState } from 'frontend/packages/cloud-foundry/src/cf-app-state';
import {
  CurrentUserPermissions,
  PermissionConfig,
  PermissionTypes,
} from 'frontend/packages/core/src/core/current-user-permissions.config';
import { CurrentUserPermissionsService } from 'frontend/packages/core/src/core/current-user-permissions.service';
import { CFFeatureFlagTypes } from 'frontend/packages/core/src/shared/components/cf-auth/cf-auth.types';
import { combineLatest, Observable } from 'rxjs';
import { first, map, switchMap } from 'rxjs/operators';

import { ListConfig } from '../../../../../../../../../core/src/shared/components/list/list.component.types';
import {
  CfSpaceUsersListConfigService,
} from '../../../../../../../shared/components/list/list-types/cf-space-users/cf-space-users-list-config.service';
import { ActiveRouteCfOrgSpace } from '../../../../../cf-page.types';
import { createCfOrgSpaceSteppersUrl, waitForCFPermissions } from '../../../../../cf.helpers';

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
    const ffPermConfig = new PermissionConfig(PermissionTypes.FEATURE_FLAG, CFFeatureFlagTypes.set_roles_by_username);
    this.addRolesByUsernameLink$ = waitForCFPermissions(store, activeRouteCfOrgSpace.cfGuid).pipe(
      switchMap(() => combineLatest([
        userPerms.can(ffPermConfig, activeRouteCfOrgSpace.cfGuid),
        userPerms.can(
          CurrentUserPermissions.SPACE_CHANGE_ROLES,
          activeRouteCfOrgSpace.cfGuid,
          activeRouteCfOrgSpace.orgGuid,
          activeRouteCfOrgSpace.spaceGuid
        )
      ])),
      first(),
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
