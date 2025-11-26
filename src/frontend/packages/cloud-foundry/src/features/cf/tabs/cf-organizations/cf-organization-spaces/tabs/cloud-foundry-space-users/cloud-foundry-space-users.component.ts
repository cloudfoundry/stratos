import { CommonModule, AsyncPipe } from '@angular/common';
import { Component , ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';

import { Store } from '@ngrx/store';
import { combineLatest, type Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import {
  CurrentUserPermissionsService,
  ListComponent,
  ListConfig,
  NoContentMessageComponent,
  PageSubNavComponent
} from '@stratosui/core';
import { CFFeatureFlagTypes } from '../../../../../../../cf-api.types';
import type { CFAppState } from '../../../../../../../cf-app-state';
import { GeneralEntityAppState } from '@stratosui/store';
import {
  CfSpaceUsersListConfigService,
} from '../../../../../../../shared/components/list/list-types/cf-space-users/cf-space-users-list-config.service';
import { CfCurrentUserPermissions } from '../../../../../../../user-permissions/cf-user-permissions-checkers';
import { CfAdminAddUserWarningComponent } from '../../../../cf-admin-add-user-warning/cf-admin-add-user-warning.component';
import { ActiveRouteCfOrgSpace } from '../../../../../cf-page.types';
import { createCfOrgSpaceSteppersUrl, someFeatureFlags, waitForCFPermissions } from '../../../../../cf.helpers';
import { CloudFoundryInviteUserLinkComponent } from '../../../../cf-organizations/cf-invite-user-link/cloud-foundry-invite-user-link.component';

@Component({
  selector: 'app-cloud-foundry-space-users',
  templateUrl: './cloud-foundry-space-users.component.html',
  styleUrls: ['./cloud-foundry-space-users.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: CfSpaceUsersListConfigService
  }],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    PageSubNavComponent,
    NoContentMessageComponent,
    ListComponent,
    CfAdminAddUserWarningComponent,
    CloudFoundryInviteUserLinkComponent
  ]
})
export class CloudFoundrySpaceUsersComponent {
  public addRolesByUsernameLink$: Observable<{
    link: string,
    params: Record<string, unknown>
  }>;

  constructor(
    store: Store<GeneralEntityAppState>,
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
