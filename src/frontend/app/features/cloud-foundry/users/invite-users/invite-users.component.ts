import { Component } from '@angular/core';

import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../cf.helpers';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { UserInviteService } from '../../user-invites/user-invite.service';
import { CfRolesService } from '../manage-users/cf-roles.service';

@Component({
  selector: 'app-invite-users',
  templateUrl: './invite-users.component.html',
  styleUrls: ['./invite-users.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    UserInviteService,
    CfUserService,
    CfRolesService,
    CloudFoundryEndpointService
  ]
})
export class InviteUsersComponent {

  defaultCancelUrl: string;

  constructor(
    // private store: Store<AppState>,// TODO: RC remove?
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    // private cfUserService: CfUserService, // TODO: RC remove?
    // private route: ActivatedRoute// TODO: RC remove?
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
