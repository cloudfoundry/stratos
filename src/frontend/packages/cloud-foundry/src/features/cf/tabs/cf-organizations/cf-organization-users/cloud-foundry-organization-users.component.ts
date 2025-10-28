import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import {
  CurrentUserPermissionsService,
} from '../../../../../../../core/src/core/permissions/current-user-permissions.service';
import { ListComponent } from '../../../../../../../core/src/shared/components/list/list.component';
import { ListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { NoContentMessageComponent } from '../../../../../../../core/src/shared/components/no-content-message/no-content-message.component';
import { PageSubNavComponent } from '../../../../../../../core/src/shared/components/page-sub-nav/page-sub-nav.component';
import { CFFeatureFlagTypes } from '../../../../../cf-api.types';
import { CFAppState } from '../../../../../cf-app-state';
import {
  CfOrgUsersListConfigService,
} from '../../../../../shared/components/list/list-types/cf-org-users/cf-org-users-list-config.service';
import { CfCurrentUserPermissions } from '../../../../../user-permissions/cf-user-permissions-checkers';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { createCfOrgSpaceSteppersUrl, someFeatureFlags, waitForCFPermissions } from '../../../cf.helpers';
import { CfAdminAddUserWarningComponent } from '../../cf-admin-add-user-warning/cf-admin-add-user-warning.component';
import { CloudFoundryInviteUserLinkComponent } from '../cf-invite-user-link/cloud-foundry-invite-user-link.component';

@Component({
  selector: 'app-cloud-foundry-organization-users',
  templateUrl: './cloud-foundry-organization-users.component.html',
  styleUrls: ['./cloud-foundry-organization-users.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: CfOrgUsersListConfigService
  }],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    PageSubNavComponent,
    ListComponent,
    NoContentMessageComponent,
    CfAdminAddUserWarningComponent,
    CloudFoundryInviteUserLinkComponent
  ]
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
        userPerms.can(CfCurrentUserPermissions.ORGANIZATION_CHANGE_ROLES, activeRouteCfOrgSpace.cfGuid, activeRouteCfOrgSpace.orgGuid)
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
