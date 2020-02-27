import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { first, map, switchMap } from 'rxjs/operators';

import {
  CurrentUserPermissions,
  PermissionConfig,
  PermissionTypes,
} from '../../../../../../../core/src/core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../../../../core/src/core/current-user-permissions.service';
import { CFFeatureFlagTypes } from '../../../../../../../core/src/shared/components/cf-auth/cf-auth.types';
import { ListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { CFAppState } from '../../../../../cf-app-state';
import {
  CfOrgUsersListConfigService,
} from '../../../../../shared/components/list/list-types/cf-org-users/cf-org-users-list-config.service';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { createCfOrgSpaceSteppersUrl, waitForCFPermissions } from '../../../cf.helpers';

@Component({
  selector: 'app-cloud-foundry-organization-users',
  templateUrl: './cloud-foundry-organization-users.component.html',
  styleUrls: ['./cloud-foundry-organization-users.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: CfOrgUsersListConfigService
  }]
})
export class CloudFoundryOrganizationUsersComponent {

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
        userPerms.can(CurrentUserPermissions.ORGANIZATION_CHANGE_ROLES, activeRouteCfOrgSpace.cfGuid, activeRouteCfOrgSpace.orgGuid)
      ])),
      first(),
      map(([canSetRolesByUsername, canChangeOrgRole]) => {
        if (canSetRolesByUsername && canChangeOrgRole) {
          return {
            link: createCfOrgSpaceSteppersUrl(
              activeRouteCfOrgSpace.cfGuid,
              `/users/manage`,
              activeRouteCfOrgSpace.orgGuid
            ),
            params: { setByUsername: true }
          };
        }
      }),
    );
  }
}
