import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { Store } from '@ngrx/store';
import { combineLatest, type Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import {
  CurrentUserPermissionsService,
  ListComponent,
  ListConfig,
  NoContentMessageComponent,
  PageSubNavComponent,
} from '@stratosui/core';
import { GeneralEntityAppState } from '@stratosui/store';

import { CFFeatureFlagTypes } from '../../../../../cf-api.types';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe,
    RouterModule,
    PageSubNavComponent,
    ListComponent,
    NoContentMessageComponent,
    CfAdminAddUserWarningComponent,
    CloudFoundryInviteUserLinkComponent,
  ],
  providers: [
    {
      provide: ListConfig,
      useClass: CfOrgUsersListConfigService,
    },
  ],
})
export class CloudFoundryOrganizationUsersComponent {

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
