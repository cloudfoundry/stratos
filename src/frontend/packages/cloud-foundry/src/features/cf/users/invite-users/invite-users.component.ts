import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';

import { PageHeaderComponent } from '@stratosui/core';
import { StepComponent } from '@stratosui/core';
import { SteppersComponent } from '@stratosui/core';

import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../cf.helpers';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { UserInviteConfigureService, UserInviteService } from '../../user-invites/user-invite.service';
import { CfRolesService } from '../manage-users/cf-roles.service';
import { InviteUsersCreateComponent } from './invite-users-create/invite-users-create.component';

@Component({
  selector: 'app-invite-users',
  templateUrl: './invite-users.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    InviteUsersCreateComponent
  ],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    UserInviteService,
    UserInviteConfigureService,
    CfRolesService,
    CloudFoundryEndpointService
  ]
})
export class InviteUsersComponent {
  private activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);


  defaultCancelUrl: string;

  constructor() {
    const activeRouteCfOrgSpace = this.activeRouteCfOrgSpace;

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
