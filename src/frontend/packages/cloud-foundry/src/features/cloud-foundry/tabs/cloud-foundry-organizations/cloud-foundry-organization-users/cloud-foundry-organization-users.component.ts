import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { CurrentUserPermissions } from '../../../../../../../core/src/core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../../../../core/src/core/current-user-permissions.service';
import { ListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { CFFeatureFlagTypes } from '../../../../../cf-api.types';
import { CFAppState } from '../../../../../cf-app-state';
import {
  CfOrgUsersListConfigService,
} from '../../../../../shared/components/list/list-types/cf-org-users/cf-org-users-list-config.service';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { createCfOrgSpaceSteppersUrl, someFeatureFlags, waitForCFPermissions } from '../../../cf.helpers';

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
    const requiredFeatureFlags = [
      CFFeatureFlagTypes.set_roles_by_username,
      CFFeatureFlagTypes.unset_roles_by_username
    ];
    this.addRolesByUsernameLink$ = waitForCFPermissions(store, activeRouteCfOrgSpace.cfGuid).pipe(
      switchMap(() => combineLatest([
        someFeatureFlags(requiredFeatureFlags, activeRouteCfOrgSpace.cfGuid, store, userPerms),
        userPerms.can(CurrentUserPermissions.ORGANIZATION_CHANGE_ROLES, activeRouteCfOrgSpace.cfGuid, activeRouteCfOrgSpace.orgGuid)
      ])),
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
