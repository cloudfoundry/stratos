import { Component } from '@angular/core';

import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../cf.helpers';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { UserInviteConfigureService, UserInviteService } from '../../user-invites/user-invite.service';
import { CfRolesService } from '../manage-users/cf-roles.service';

@Component({
  selector: 'app-invite-users',
  templateUrl: './invite-users.component.html',
  styleUrls: ['./invite-users.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    UserInviteService,
    UserInviteConfigureService,
    CfUserService,
    CfRolesService,
    CloudFoundryEndpointService
  ]
})
export class InviteUsersComponent {

  defaultCancelUrl: string;

  constructor(
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace
  ) {
    this.defaultCancelUrl = this.createReturnUrl(activeRouteCfOrgSpace);
  }

  createReturnUrl(activeRouteCfOrgSpace: ActiveRouteCfOrgSpace): string {
    let route = `/cloud-foundry/${activeRouteCfOrgSpace.cfGuid}`;
    if (this.activeRouteCfOrgSpace.orgGuid) {
      route += `/organizations/${activeRouteCfOrgSpace.orgGuid}`;
      if (this.activeRouteCfOrgSpace.spaceGuid) {
        route += `/spaces/${activeRouteCfOrgSpace.spaceGuid}`;
      }
    }
    route += `/users`;
    return route;
  }

}
